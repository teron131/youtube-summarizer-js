const AUTH_STATE_PREFIX = "auth-state:";
const AUTH_STATE_TTL_SECONDS = 600;
const DEFAULT_GOOGLE_AUTHORIZATION_URL =
	"https://accounts.google.com/o/oauth2/v2/auth";
const DEFAULT_GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const DEFAULT_GOOGLE_SCOPE = "openid profile email";
const OAUTH_PROTECTED_RESOURCE_PATHS = new Set([
	"/.well-known/oauth-protected-resource",
	"/.well-known/oauth-protected-resource/",
]);

interface OAuthAuthRequest {
	clientId: string;
	codeChallenge?: string;
	codeChallengeMethod?: string;
	redirectUri: string;
	responseType: string;
	scope: string[];
	state: string;
}

interface OAuthProviderHelpers {
	completeAuthorization(options: {
		metadata: Record<string, unknown>;
		props: Record<string, unknown>;
		request: OAuthAuthRequest;
		scope: string[];
		userId: string;
	}): Promise<{ redirectTo: string }>;
	parseAuthRequest(request: Request): Promise<OAuthAuthRequest>;
}

interface WorkerOAuthEnv extends Record<string, unknown> {
	GOOGLE_CLIENT_ID?: string;
	GOOGLE_CLIENT_SECRET?: string;
	GOOGLE_REDIRECT_URI?: string;
	GOOGLE_SCOPE?: string;
	OAUTH_KV: {
		delete(key: string): Promise<void>;
		get(key: string): Promise<string | null>;
		put(
			key: string,
			value: string,
			options?: { expirationTtl?: number },
		): Promise<void>;
	};
	OAUTH_PROVIDER: OAuthProviderHelpers;
}

interface TokenResponse {
	access_token?: string;
	id_token?: string;
	refresh_token?: string;
	scope?: string;
	token_type?: string;
}

function ensureSecret(value: unknown, key: string): string {
	if (typeof value !== "string" || !value.trim()) {
		throw new Error(`Missing required secret: ${key}`);
	}
	return value.trim();
}

function asTrimmedString(value: unknown): string | null {
	if (typeof value !== "string") {
		return null;
	}
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function resolveGoogleScope(env: WorkerOAuthEnv): string {
	return asTrimmedString(env.GOOGLE_SCOPE) ?? DEFAULT_GOOGLE_SCOPE;
}

function base64UrlDecode(value: string): string {
	const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
	const padding = (4 - (normalized.length % 4)) % 4;
	return atob(normalized + "=".repeat(padding));
}

function decodeJwtPayload(token: string): Record<string, unknown> {
	const parts = token.split(".");
	if (parts.length !== 3) {
		return {};
	}
	try {
		const decoded = base64UrlDecode(parts[1]);
		return JSON.parse(decoded) as Record<string, unknown>;
	} catch {
		return {};
	}
}

function callbackUrl(request: Request, env: WorkerOAuthEnv): string {
	return (
		asTrimmedString(env.GOOGLE_REDIRECT_URI) ??
		`${new URL(request.url).origin}/callback`
	);
}

function oauthStateKey(state: string): string {
	return `${AUTH_STATE_PREFIX}${state}`;
}

function oauthProtectedResourceMetadata(
	request: Request,
): Record<string, unknown> {
	const origin = new URL(request.url).origin;
	return {
		resource: `${origin}/`,
		authorization_servers: [origin],
		bearer_methods_supported: ["header"],
	};
}

function oauthConfigHealth(
	request: Request,
	env: WorkerOAuthEnv,
): Record<string, unknown> {
	const clientId = asTrimmedString(env.GOOGLE_CLIENT_ID);
	const clientSecret = asTrimmedString(env.GOOGLE_CLIENT_SECRET);
	const hasRedirectUri = Boolean(asTrimmedString(env.GOOGLE_REDIRECT_URI));
	const missing = [
		!clientId && "GOOGLE_CLIENT_ID",
		!clientSecret && "GOOGLE_CLIENT_SECRET",
	].filter(Boolean) as string[];

	return {
		ready: missing.length === 0,
		provider: "google",
		callback_url: callbackUrl(request, env),
		authorization_url: DEFAULT_GOOGLE_AUTHORIZATION_URL,
		token_url: DEFAULT_GOOGLE_TOKEN_URL,
		scope: resolveGoogleScope(env),
		has_redirect_uri_override: hasRedirectUri,
		has_client_id: Boolean(clientId),
		has_client_secret: Boolean(clientSecret),
		missing,
	};
}

async function exchangeGoogleToken(
	request: Request,
	env: WorkerOAuthEnv,
	code: string,
): Promise<TokenResponse> {
	const clientId = ensureSecret(env.GOOGLE_CLIENT_ID, "GOOGLE_CLIENT_ID");
	const clientSecret = ensureSecret(
		env.GOOGLE_CLIENT_SECRET,
		"GOOGLE_CLIENT_SECRET",
	);

	const body = new URLSearchParams({
		client_id: clientId,
		client_secret: clientSecret,
		code,
		grant_type: "authorization_code",
		redirect_uri: callbackUrl(request, env),
	});

	const response = await fetch(DEFAULT_GOOGLE_TOKEN_URL, {
		method: "POST",
		headers: {
			"content-type": "application/x-www-form-urlencoded",
		},
		body: body.toString(),
	});

	if (!response.ok) {
		const detail = await response.text();
		throw new Error(
			`Google token exchange failed: ${detail || response.status}`,
		);
	}

	return (await response.json()) as TokenResponse;
}

function tokenField(
	payload: Record<string, unknown>,
	key: "email" | "name" | "sub",
): string | null {
	const value = payload[key];
	return typeof value === "string" ? value : null;
}

export const googleOAuthDefaultHandler = {
	async fetch(
		request: Request,
		envInput: unknown,
		_ctx: any,
	): Promise<Response> {
		const env = envInput as WorkerOAuthEnv;
		const url = new URL(request.url);
		const { pathname } = url;

		if (OAUTH_PROTECTED_RESOURCE_PATHS.has(pathname)) {
			return Response.json(oauthProtectedResourceMetadata(request));
		}

		switch (pathname) {
			case "/health":
				return Response.json({
					status: "ok",
					oauth: oauthConfigHealth(request, env),
				});
			case "/authorize": {
				const oauthRequest = await env.OAUTH_PROVIDER.parseAuthRequest(request);
				const state = crypto.randomUUID();
				await env.OAUTH_KV.put(
					oauthStateKey(state),
					JSON.stringify(oauthRequest),
					{ expirationTtl: AUTH_STATE_TTL_SECONDS },
				);

				const authUrl = new URL(DEFAULT_GOOGLE_AUTHORIZATION_URL);
				authUrl.searchParams.set(
					"client_id",
					ensureSecret(env.GOOGLE_CLIENT_ID, "GOOGLE_CLIENT_ID"),
				);
				authUrl.searchParams.set("redirect_uri", callbackUrl(request, env));
				authUrl.searchParams.set("response_type", "code");
				authUrl.searchParams.set("scope", resolveGoogleScope(env));
				authUrl.searchParams.set("state", state);
				return Response.redirect(authUrl.toString(), 302);
			}
			case "/callback": {
				const code = url.searchParams.get("code");
				const state = url.searchParams.get("state");
				if (!code || !state) {
					return new Response("Missing callback parameters", { status: 400 });
				}

				const stateKey = oauthStateKey(state);
				const serializedRequest = await env.OAUTH_KV.get(stateKey);
				await env.OAUTH_KV.delete(stateKey);
				if (!serializedRequest) {
					return new Response("Authorization session expired", { status: 400 });
				}

				const oauthRequest = JSON.parse(serializedRequest) as OAuthAuthRequest;
				const tokenResponse = await exchangeGoogleToken(request, env, code);
				const tokenPayload = decodeJwtPayload(tokenResponse.id_token ?? "");
				const email = tokenField(tokenPayload, "email");
				const subject = tokenField(tokenPayload, "sub");
				const scope =
					oauthRequest.scope.length > 0 ? oauthRequest.scope : ["openid"];
				const { redirectTo } = await env.OAUTH_PROVIDER.completeAuthorization({
					request: oauthRequest,
					userId: email ?? subject ?? "google-user",
					metadata: {
						provider: "google",
						scope,
					},
					scope,
					props: {
						access_token: tokenResponse.access_token ?? null,
						email,
						name: tokenField(tokenPayload, "name"),
						sub: subject,
					},
				});
				return Response.redirect(redirectTo, 302);
			}
			default:
				return new Response("Not found", { status: 404 });
		}
	},
};

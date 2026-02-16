const AUTH_STATE_PREFIX = "auth-state:";
const AUTH_STATE_TTL_SECONDS = 600;

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
  ACCESS_AUTHORIZATION_URL?: string;
  ACCESS_CLIENT_ID?: string;
  ACCESS_CLIENT_SECRET?: string;
  ACCESS_REDIRECT_URI?: string;
  ACCESS_TOKEN_URL?: string;
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

interface AccessTokenResponse {
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

function base64UrlDecode(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4;
  const padded = padding ? normalized + "=".repeat(4 - padding) : normalized;
  return atob(padded);
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
  if (typeof env.ACCESS_REDIRECT_URI === "string" && env.ACCESS_REDIRECT_URI) {
    return env.ACCESS_REDIRECT_URI;
  }
  const url = new URL(request.url);
  return `${url.origin}/callback`;
}

function oauthStateKey(state: string): string {
  return `${AUTH_STATE_PREFIX}${state}`;
}

async function exchangeAccessToken(
  request: Request,
  env: WorkerOAuthEnv,
  code: string,
): Promise<AccessTokenResponse> {
  const tokenUrl = ensureSecret(env.ACCESS_TOKEN_URL, "ACCESS_TOKEN_URL");
  const clientId = ensureSecret(env.ACCESS_CLIENT_ID, "ACCESS_CLIENT_ID");
  const clientSecret = ensureSecret(
    env.ACCESS_CLIENT_SECRET,
    "ACCESS_CLIENT_SECRET",
  );

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: callbackUrl(request, env),
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Access token exchange failed: ${detail || response.status}`);
  }

  return (await response.json()) as AccessTokenResponse;
}

export const accessDefaultHandler = {
  async fetch(
    request: Request,
    envInput: unknown,
    _ctx: any,
  ): Promise<Response> {
    const env = envInput as WorkerOAuthEnv;
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({
        status: "ok",
      });
    }

    if (url.pathname === "/authorize") {
      const oauthRequest = await env.OAUTH_PROVIDER.parseAuthRequest(request);
      const accessAuthUrl = ensureSecret(
        env.ACCESS_AUTHORIZATION_URL,
        "ACCESS_AUTHORIZATION_URL",
      );
      const state = crypto.randomUUID();
      await env.OAUTH_KV.put(oauthStateKey(state), JSON.stringify(oauthRequest), {
        expirationTtl: AUTH_STATE_TTL_SECONDS,
      });

      const authUrl = new URL(accessAuthUrl);
      authUrl.searchParams.set(
        "client_id",
        ensureSecret(env.ACCESS_CLIENT_ID, "ACCESS_CLIENT_ID"),
      );
      authUrl.searchParams.set("redirect_uri", callbackUrl(request, env));
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", "openid profile email");
      authUrl.searchParams.set("state", state);
      return Response.redirect(authUrl.toString(), 302);
    }

    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      if (!code || !state) {
        return new Response("Missing callback parameters", { status: 400 });
      }

      const key = oauthStateKey(state);
      const serializedRequest = await env.OAUTH_KV.get(key);
      await env.OAUTH_KV.delete(key);
      if (!serializedRequest) {
        return new Response("Authorization session expired", { status: 400 });
      }

      const oauthRequest = JSON.parse(serializedRequest) as OAuthAuthRequest;
      const tokenResponse = await exchangeAccessToken(request, env, code);
      const tokenPayload = tokenResponse.id_token
        ? decodeJwtPayload(tokenResponse.id_token)
        : {};

      const userId =
        (typeof tokenPayload.email === "string" && tokenPayload.email) ||
        (typeof tokenPayload.sub === "string" && tokenPayload.sub) ||
        "access-user";
      const scope =
        oauthRequest.scope.length > 0 ? oauthRequest.scope : ["openid"];

      const { redirectTo } = await env.OAUTH_PROVIDER.completeAuthorization({
        request: oauthRequest,
        userId,
        metadata: {
          provider: "cloudflare-access",
          scope,
        },
        scope,
        props: {
          access_token: tokenResponse.access_token ?? null,
          email: typeof tokenPayload.email === "string" ? tokenPayload.email : null,
          name: typeof tokenPayload.name === "string" ? tokenPayload.name : null,
          sub: typeof tokenPayload.sub === "string" ? tokenPayload.sub : null,
        },
      });
      return Response.redirect(redirectTo, 302);
    }

    return new Response("Not found", { status: 404 });
  },
};

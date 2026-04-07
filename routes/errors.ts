export class AppError extends Error {
	constructor(
		message: string,
		readonly statusCode: number = 500,
		readonly errorType: string = "processing_failed",
	) {
		super(message);
		this.name = "AppError";
	}
}

export function asAppError(error: unknown, context = "Processing"): AppError {
	if (error instanceof AppError) {
		return error;
	}

	const message = error instanceof Error ? error.message : String(error);
	const lower = message.toLowerCase();

	if (lower.includes("quota") || lower.includes("rate limit")) {
		return new AppError("API quota exceeded", 429, "quota_exceeded");
	}

	if (
		lower.includes("400") ||
		lower.includes("invalid") ||
		lower.includes("bad request") ||
		lower.includes("not found")
	) {
		return new AppError(
			`Invalid input: ${message.slice(0, 100)}`,
			400,
			"invalid_input",
		);
	}

	return new AppError(
		`${context} failed: ${message.slice(0, 100)}`,
		500,
		"processing_failed",
	);
}

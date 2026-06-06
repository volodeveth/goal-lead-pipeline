export class ValidationError extends Error {
  constructor(
    message: string,
    public issues: Array<{ path: (string | number)[]; message: string }>,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export class DuplicateRequestError extends Error {
  constructor(public existingId: string) {
    super(`Lead with this requestId already exists: ${existingId}`);
    this.name = "DuplicateRequestError";
  }
}

export class RateLimitError extends Error {
  constructor(public retryAfterSeconds: number) {
    super("Rate limit exceeded");
    this.name = "RateLimitError";
  }
}

export class AIEnrichmentError extends Error {
  constructor(
    message: string,
    public override cause?: unknown,
  ) {
    super(message);
    this.name = "AIEnrichmentError";
  }
}

export class TelegramError extends Error {
  constructor(
    message: string,
    public override cause?: unknown,
  ) {
    super(message);
    this.name = "TelegramError";
  }
}

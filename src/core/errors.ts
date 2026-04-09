export class PrismeAIError extends Error {
  readonly status: number | undefined;
  readonly headers: Headers | undefined;
  readonly body: unknown;

  constructor(
    message: string,
    { status, headers, body }: { status?: number; headers?: Headers; body?: unknown } = {},
  ) {
    super(message);
    this.name = 'PrismeAIError';
    this.status = status;
    this.headers = headers;
    this.body = body;
  }
}

export class AuthenticationError extends PrismeAIError {
  override readonly status = 401;
  constructor(message: string, opts?: { headers?: Headers; body?: unknown }) {
    super(message, { status: 401, ...opts });
    this.name = 'AuthenticationError';
  }
}

export class PermissionDeniedError extends PrismeAIError {
  override readonly status = 403;
  constructor(message: string, opts?: { headers?: Headers; body?: unknown }) {
    super(message, { status: 403, ...opts });
    this.name = 'PermissionDeniedError';
  }
}

export class NotFoundError extends PrismeAIError {
  override readonly status = 404;
  constructor(message: string, opts?: { headers?: Headers; body?: unknown }) {
    super(message, { status: 404, ...opts });
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends PrismeAIError {
  override readonly status = 409;
  constructor(message: string, opts?: { headers?: Headers; body?: unknown }) {
    super(message, { status: 409, ...opts });
    this.name = 'ConflictError';
  }
}

export class ValidationError extends PrismeAIError {
  override readonly status = 422;
  constructor(message: string, opts?: { headers?: Headers; body?: unknown }) {
    super(message, { status: 422, ...opts });
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends PrismeAIError {
  override readonly status = 429;
  readonly retryAfter: number | undefined;

  constructor(message: string, opts?: { headers?: Headers; body?: unknown }) {
    super(message, { status: 429, ...opts });
    this.name = 'RateLimitError';
    this.retryAfter = opts?.headers
      ? parseRetryAfter(opts.headers.get('retry-after'))
      : undefined;
  }
}

export class InternalServerError extends PrismeAIError {
  override readonly status = 500;
  constructor(message: string, opts?: { headers?: Headers; body?: unknown }) {
    super(message, { status: 500, ...opts });
    this.name = 'InternalServerError';
  }
}

export class ConnectionError extends PrismeAIError {
  constructor(message: string) {
    super(message);
    this.name = 'ConnectionError';
  }
}

export class TimeoutError extends PrismeAIError {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (!Number.isNaN(seconds)) return seconds * 1000;
  const date = Date.parse(value);
  if (!Number.isNaN(date)) return date - Date.now();
  return undefined;
}

export function errorFromStatus(
  status: number,
  message: string,
  headers: Headers,
  body: unknown,
): PrismeAIError {
  const opts = { headers, body };
  switch (status) {
    case 401:
      return new AuthenticationError(message, opts);
    case 403:
      return new PermissionDeniedError(message, opts);
    case 404:
      return new NotFoundError(message, opts);
    case 409:
      return new ConflictError(message, opts);
    case 422:
      return new ValidationError(message, opts);
    case 429:
      return new RateLimitError(message, opts);
    default:
      if (status >= 500) return new InternalServerError(message, opts);
      return new PrismeAIError(message, { status, ...opts });
  }
}

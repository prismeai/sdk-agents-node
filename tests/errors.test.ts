import { describe, it, expect } from 'vitest';
import {
  PrismeAIError,
  AuthenticationError,
  PermissionDeniedError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
  InternalServerError,
  errorFromStatus,
} from '../src/core/errors.js';

describe('errors', () => {
  it('creates PrismeAIError with message and status', () => {
    const err = new PrismeAIError('test error', { status: 400 });
    expect(err.message).toBe('test error');
    expect(err.status).toBe(400);
    expect(err.name).toBe('PrismeAIError');
  });

  it('maps status 401 to AuthenticationError', () => {
    const err = errorFromStatus(401, 'unauthorized', new Headers(), {});
    expect(err).toBeInstanceOf(AuthenticationError);
    expect(err.status).toBe(401);
  });

  it('maps status 403 to PermissionDeniedError', () => {
    const err = errorFromStatus(403, 'forbidden', new Headers(), {});
    expect(err).toBeInstanceOf(PermissionDeniedError);
  });

  it('maps status 404 to NotFoundError', () => {
    const err = errorFromStatus(404, 'not found', new Headers(), {});
    expect(err).toBeInstanceOf(NotFoundError);
  });

  it('maps status 409 to ConflictError', () => {
    const err = errorFromStatus(409, 'conflict', new Headers(), {});
    expect(err).toBeInstanceOf(ConflictError);
  });

  it('maps status 422 to ValidationError', () => {
    const err = errorFromStatus(422, 'invalid', new Headers(), {});
    expect(err).toBeInstanceOf(ValidationError);
  });

  it('maps status 429 to RateLimitError', () => {
    const headers = new Headers({ 'retry-after': '5' });
    const err = errorFromStatus(429, 'rate limited', headers, {});
    expect(err).toBeInstanceOf(RateLimitError);
    expect((err as RateLimitError).retryAfter).toBe(5000);
  });

  it('maps status 500 to InternalServerError', () => {
    const err = errorFromStatus(500, 'server error', new Headers(), {});
    expect(err).toBeInstanceOf(InternalServerError);
  });

  it('maps status 502 to InternalServerError', () => {
    const err = errorFromStatus(502, 'bad gateway', new Headers(), {});
    expect(err).toBeInstanceOf(InternalServerError);
  });

  it('maps unknown 4xx to PrismeAIError', () => {
    const err = errorFromStatus(418, 'teapot', new Headers(), {});
    expect(err).toBeInstanceOf(PrismeAIError);
    expect(err.status).toBe(418);
  });
});

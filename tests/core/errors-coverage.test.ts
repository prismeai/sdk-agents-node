/**
 * Additional error tests to cover edge cases in errors.ts.
 * Covers: RateLimitError without headers, parseRetryAfter date branch,
 * ConnectionError, TimeoutError constructors.
 */
import { describe, it, expect } from 'vitest';
import {
  RateLimitError,
  ConnectionError,
  TimeoutError,
  PrismeAIError,
  errorFromStatus,
} from '../../src/core/errors.js';

describe('errors – coverage gaps', () => {
  describe('RateLimitError', () => {
    it('has undefined retryAfter when no headers provided', () => {
      const err = new RateLimitError('rate limited');
      expect(err.retryAfter).toBeUndefined();
      expect(err.status).toBe(429);
      expect(err.name).toBe('RateLimitError');
    });

    it('has undefined retryAfter when retry-after header is absent', () => {
      const err = new RateLimitError('rate limited', { headers: new Headers() });
      expect(err.retryAfter).toBeUndefined();
    });

    it('parses retry-after as date string', () => {
      const futureDate = new Date(Date.now() + 10000).toUTCString();
      const err = new RateLimitError('rate limited', {
        headers: new Headers({ 'retry-after': futureDate }),
      });
      // Should be a positive number (milliseconds until the date)
      expect(err.retryAfter).toBeDefined();
      expect(typeof err.retryAfter).toBe('number');
      expect(err.retryAfter!).toBeGreaterThan(0);
    });

    it('returns undefined for unparseable retry-after value', () => {
      const err = new RateLimitError('rate limited', {
        headers: new Headers({ 'retry-after': 'not-a-date-or-number' }),
      });
      // NaN for both number parsing and date parsing -> undefined
      expect(err.retryAfter).toBeUndefined();
    });
  });

  describe('ConnectionError', () => {
    it('creates with message and correct name', () => {
      const err = new ConnectionError('network down');
      expect(err.message).toBe('network down');
      expect(err.name).toBe('ConnectionError');
      expect(err.status).toBeUndefined();
    });
  });

  describe('TimeoutError', () => {
    it('creates with message and correct name', () => {
      const err = new TimeoutError('timed out');
      expect(err.message).toBe('timed out');
      expect(err.name).toBe('TimeoutError');
      expect(err.status).toBeUndefined();
    });
  });

  describe('PrismeAIError', () => {
    it('stores headers and body', () => {
      const headers = new Headers({ 'x-test': 'value' });
      const body = { detail: 'info' };
      const err = new PrismeAIError('test', { status: 400, headers, body });
      expect(err.headers).toBe(headers);
      expect(err.body).toBe(body);
      expect(err.status).toBe(400);
    });

    it('works with no options', () => {
      const err = new PrismeAIError('simple');
      expect(err.message).toBe('simple');
      expect(err.status).toBeUndefined();
      expect(err.headers).toBeUndefined();
      expect(err.body).toBeUndefined();
    });
  });

  describe('errorFromStatus – edge cases', () => {
    it('maps 503 to InternalServerError (>= 500)', () => {
      const err = errorFromStatus(503, 'service unavailable', new Headers(), {});
      expect(err.name).toBe('InternalServerError');
    });

    it('maps unknown status like 418 to PrismeAIError', () => {
      const err = errorFromStatus(418, 'teapot', new Headers(), {});
      expect(err).toBeInstanceOf(PrismeAIError);
      expect(err.status).toBe(418);
    });
  });
});

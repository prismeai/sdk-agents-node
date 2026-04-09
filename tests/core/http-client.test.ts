import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpClient } from '../../src/core/http-client.js';
import {
  PrismeAIError,
  AuthenticationError,
  NotFoundError,
  RateLimitError,
  InternalServerError,
  ConnectionError,
  TimeoutError,
} from '../../src/core/errors.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function jsonResponse(body: unknown, status = 200, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: { 'content-type': 'application/json', ...headers },
  });
}

function textResponse(text: string, status = 200): Response {
  return new Response(text, {
    status,
    statusText: 'OK',
    headers: { 'content-type': 'text/plain' },
  });
}

function emptyResponse(status = 204): Response {
  return new Response(null, { status, statusText: 'No Content' });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('HttpClient', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---- Constructor ----
  describe('constructor', () => {
    it('strips trailing slashes from baseURL', () => {
      const client = new HttpClient({
        baseURL: 'https://api.example.com/v2/',
        headers: {},
      });
      expect(client.baseURL).toBe('https://api.example.com/v2');
    });

    it('strips multiple trailing slashes', () => {
      const client = new HttpClient({
        baseURL: 'https://api.example.com/v2///',
        headers: {},
      });
      expect(client.baseURL).toBe('https://api.example.com/v2');
    });
  });

  // ---- request: successful JSON response ----
  describe('request – success', () => {
    it('returns parsed JSON on success', async () => {
      const client = new HttpClient({
        baseURL: 'https://api.example.com',
        headers: { 'x-key': 'test' },
      });

      fetchSpy.mockResolvedValueOnce(jsonResponse({ id: 'abc' }));

      const result = await client.request<{ id: string }>({
        method: 'GET',
        path: '/items/abc',
      });

      expect(result).toEqual({ id: 'abc' });
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('https://api.example.com/items/abc');
      expect(init.method).toBe('GET');
      expect((init.headers as Record<string, string>)['x-key']).toBe('test');
    });

    it('returns plain text when body is not valid JSON', async () => {
      const client = new HttpClient({ baseURL: 'https://api.example.com', headers: {} });
      fetchSpy.mockResolvedValueOnce(textResponse('hello world'));

      const result = await client.request<string>({ method: 'GET', path: '/text' });
      expect(result).toBe('hello world');
    });

    it('returns undefined for empty response body', async () => {
      const client = new HttpClient({ baseURL: 'https://api.example.com', headers: {} });
      fetchSpy.mockResolvedValueOnce(emptyResponse());

      const result = await client.request<undefined>({ method: 'GET', path: '/empty' });
      expect(result).toBeUndefined();
    });

    it('returns raw Response when raw: true', async () => {
      const client = new HttpClient({ baseURL: 'https://api.example.com', headers: {} });
      const rawResp = jsonResponse({ ok: true });
      fetchSpy.mockResolvedValueOnce(rawResp);

      const result = await client.request<Response>({
        method: 'GET',
        path: '/raw',
        raw: true,
      });

      expect(result).toBe(rawResp);
    });
  });

  // ---- request: query params ----
  describe('request – query params', () => {
    it('appends query parameters to the URL', async () => {
      const client = new HttpClient({ baseURL: 'https://api.example.com', headers: {} });
      fetchSpy.mockResolvedValueOnce(jsonResponse([]));

      await client.request({ method: 'GET', path: '/items', query: { page: 2, limit: 10 } });

      const [url] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('page=2');
      expect(url).toContain('limit=10');
    });

    it('skips undefined and null query values', async () => {
      const client = new HttpClient({ baseURL: 'https://api.example.com', headers: {} });
      fetchSpy.mockResolvedValueOnce(jsonResponse([]));

      await client.request({ method: 'GET', path: '/items', query: { a: 'yes', b: undefined, c: null } });

      const [url] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('a=yes');
      expect(url).not.toContain('b=');
      expect(url).not.toContain('c=');
    });
  });

  // ---- request: body serialization ----
  describe('request – body serialization', () => {
    it('sets content-type to application/json and stringifies body', async () => {
      const client = new HttpClient({ baseURL: 'https://api.example.com', headers: {} });
      fetchSpy.mockResolvedValueOnce(jsonResponse({ ok: true }));

      await client.request({
        method: 'POST',
        path: '/create',
        body: { name: 'test' },
      });

      const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(init.body).toBe(JSON.stringify({ name: 'test' }));
      expect((init.headers as Record<string, string>)['content-type']).toBe('application/json');
    });

    it('sends FormData without content-type header (browser sets boundary)', async () => {
      const client = new HttpClient({ baseURL: 'https://api.example.com', headers: {} });
      fetchSpy.mockResolvedValueOnce(jsonResponse({ ok: true }));

      const formData = new FormData();
      formData.append('field', 'value');

      await client.request({
        method: 'POST',
        path: '/upload',
        body: formData,
      });

      const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(init.body).toBe(formData);
      // content-type should NOT be set for FormData (boundary is auto-set)
      expect((init.headers as Record<string, string>)['content-type']).toBeUndefined();
    });

    it('does not override explicit content-type header', async () => {
      const client = new HttpClient({ baseURL: 'https://api.example.com', headers: {} });
      fetchSpy.mockResolvedValueOnce(jsonResponse({ ok: true }));

      await client.request({
        method: 'POST',
        path: '/create',
        body: '<xml></xml>',
        headers: { 'content-type': 'application/xml' },
      });

      const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect((init.headers as Record<string, string>)['content-type']).toBe('application/xml');
    });
  });

  // ---- request: error mapping ----
  describe('request – error mapping', () => {
    it('throws AuthenticationError for 401', async () => {
      const client = new HttpClient({ baseURL: 'https://api.example.com', headers: {}, maxRetries: 0 });
      fetchSpy.mockResolvedValueOnce(jsonResponse({ message: 'unauthorized' }, 401));

      await expect(client.request({ method: 'GET', path: '/x' })).rejects.toThrow(AuthenticationError);
    });

    it('throws NotFoundError for 404', async () => {
      const client = new HttpClient({ baseURL: 'https://api.example.com', headers: {}, maxRetries: 0 });
      fetchSpy.mockResolvedValueOnce(jsonResponse({ message: 'not found' }, 404));

      await expect(client.request({ method: 'GET', path: '/x' })).rejects.toThrow(NotFoundError);
    });

    it('throws RateLimitError for 429', async () => {
      const client = new HttpClient({ baseURL: 'https://api.example.com', headers: {}, maxRetries: 0 });
      fetchSpy.mockResolvedValueOnce(jsonResponse({ message: 'rate limited' }, 429, { 'retry-after': '2' }));

      await expect(client.request({ method: 'GET', path: '/x' })).rejects.toThrow(RateLimitError);
    });

    it('throws InternalServerError for 500 (no retry when maxRetries=0)', async () => {
      const client = new HttpClient({ baseURL: 'https://api.example.com', headers: {}, maxRetries: 0 });
      fetchSpy.mockResolvedValueOnce(jsonResponse({ message: 'server error' }, 500));

      await expect(client.request({ method: 'GET', path: '/x' })).rejects.toThrow(InternalServerError);
    });

    it('extracts message from error.message in body', async () => {
      const client = new HttpClient({ baseURL: 'https://api.example.com', headers: {}, maxRetries: 0 });
      fetchSpy.mockResolvedValueOnce(jsonResponse({ message: 'specific error' }, 400));

      try {
        await client.request({ method: 'GET', path: '/x' });
      } catch (err) {
        expect((err as PrismeAIError).message).toBe('specific error');
      }
    });

    it('extracts message from error field in body', async () => {
      const client = new HttpClient({ baseURL: 'https://api.example.com', headers: {}, maxRetries: 0 });
      fetchSpy.mockResolvedValueOnce(jsonResponse({ error: 'some error' }, 400));

      try {
        await client.request({ method: 'GET', path: '/x' });
      } catch (err) {
        expect((err as PrismeAIError).message).toBe('some error');
      }
    });

    it('extracts message from error.error.message in body', async () => {
      const client = new HttpClient({ baseURL: 'https://api.example.com', headers: {}, maxRetries: 0 });
      fetchSpy.mockResolvedValueOnce(jsonResponse({ error: { message: 'inner error' } }, 400));

      try {
        await client.request({ method: 'GET', path: '/x' });
      } catch (err) {
        expect((err as PrismeAIError).message).toBe('inner error');
      }
    });

    it('falls back to statusText when body has no message', async () => {
      const client = new HttpClient({ baseURL: 'https://api.example.com', headers: {}, maxRetries: 0 });
      fetchSpy.mockResolvedValueOnce(new Response('not json at all', {
        status: 400,
        statusText: 'Bad Request',
      }));

      try {
        await client.request({ method: 'GET', path: '/x' });
      } catch (err) {
        expect((err as PrismeAIError).message).toBe('Bad Request');
      }
    });

    it('handles body parse failure gracefully', async () => {
      const client = new HttpClient({ baseURL: 'https://api.example.com', headers: {}, maxRetries: 0 });
      // Response whose text() throws
      const badResp = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers(),
        text: () => { throw new Error('read failure'); },
      } as unknown as Response;
      fetchSpy.mockResolvedValueOnce(badResp);

      await expect(client.request({ method: 'GET', path: '/x' })).rejects.toThrow(InternalServerError);
    });
  });

  // ---- request: retry logic ----
  describe('request – retries', () => {
    it('retries on 500 and succeeds on second attempt', async () => {
      const client = new HttpClient({ baseURL: 'https://api.example.com', headers: {}, maxRetries: 1 });

      fetchSpy
        .mockResolvedValueOnce(jsonResponse({ message: 'server error' }, 500))
        .mockResolvedValueOnce(jsonResponse({ ok: true }));

      const result = await client.request<{ ok: boolean }>({ method: 'GET', path: '/test' });
      expect(result).toEqual({ ok: true });
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it('retries on 429 and succeeds', async () => {
      const client = new HttpClient({ baseURL: 'https://api.example.com', headers: {}, maxRetries: 1 });

      fetchSpy
        .mockResolvedValueOnce(jsonResponse({ message: 'rate limited' }, 429, { 'retry-after': '0' }))
        .mockResolvedValueOnce(jsonResponse({ ok: true }));

      const result = await client.request<{ ok: boolean }>({ method: 'GET', path: '/test' });
      expect(result).toEqual({ ok: true });
    });

    it('retries on 502/503/504', async () => {
      const client = new HttpClient({ baseURL: 'https://api.example.com', headers: {}, maxRetries: 2 });

      fetchSpy
        .mockResolvedValueOnce(jsonResponse({ message: 'bad gateway' }, 502))
        .mockResolvedValueOnce(jsonResponse({ message: 'service unavailable' }, 503))
        .mockResolvedValueOnce(jsonResponse({ ok: true }));

      const result = await client.request<{ ok: boolean }>({ method: 'GET', path: '/test' });
      expect(result).toEqual({ ok: true });
      expect(fetchSpy).toHaveBeenCalledTimes(3);
    });

    it('retries on 408 (request timeout)', async () => {
      const client = new HttpClient({ baseURL: 'https://api.example.com', headers: {}, maxRetries: 1 });

      fetchSpy
        .mockResolvedValueOnce(jsonResponse({ message: 'timeout' }, 408))
        .mockResolvedValueOnce(jsonResponse({ ok: true }));

      const result = await client.request<{ ok: boolean }>({ method: 'GET', path: '/test' });
      expect(result).toEqual({ ok: true });
    });

    it('does NOT retry 401/403/404 (non-retryable)', async () => {
      const client = new HttpClient({ baseURL: 'https://api.example.com', headers: {}, maxRetries: 2 });

      fetchSpy.mockResolvedValueOnce(jsonResponse({ message: 'unauthorized' }, 401));

      await expect(client.request({ method: 'GET', path: '/test' })).rejects.toThrow(AuthenticationError);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('throws after exhausting all retries', async () => {
      const client = new HttpClient({ baseURL: 'https://api.example.com', headers: {}, maxRetries: 1 });

      fetchSpy
        .mockResolvedValueOnce(jsonResponse({ message: 'error' }, 500))
        .mockResolvedValueOnce(jsonResponse({ message: 'error' }, 500));

      await expect(client.request({ method: 'GET', path: '/test' })).rejects.toThrow(InternalServerError);
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it('retries on network errors (connection failures)', async () => {
      const client = new HttpClient({ baseURL: 'https://api.example.com', headers: {}, maxRetries: 1 });

      fetchSpy
        .mockRejectedValueOnce(new TypeError('fetch failed'))
        .mockResolvedValueOnce(jsonResponse({ ok: true }));

      const result = await client.request<{ ok: boolean }>({ method: 'GET', path: '/test' });
      expect(result).toEqual({ ok: true });
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it('throws ConnectionError after exhausting retries on network error', async () => {
      const client = new HttpClient({ baseURL: 'https://api.example.com', headers: {}, maxRetries: 1 });

      fetchSpy
        .mockRejectedValueOnce(new TypeError('fetch failed'))
        .mockRejectedValueOnce(new TypeError('fetch failed again'));

      await expect(client.request({ method: 'GET', path: '/test' })).rejects.toThrow(ConnectionError);
    });

    it('retries on non-Error thrown values', async () => {
      const client = new HttpClient({ baseURL: 'https://api.example.com', headers: {}, maxRetries: 1 });

      fetchSpy
        .mockRejectedValueOnce('string error')
        .mockResolvedValueOnce(jsonResponse({ ok: true }));

      const result = await client.request<{ ok: boolean }>({ method: 'GET', path: '/test' });
      expect(result).toEqual({ ok: true });
    });

    it('throws ConnectionError with fallback message for non-Error thrown values after retries', async () => {
      const client = new HttpClient({ baseURL: 'https://api.example.com', headers: {}, maxRetries: 0 });

      fetchSpy.mockRejectedValueOnce('string error');

      await expect(client.request({ method: 'GET', path: '/test' })).rejects.toThrow('Connection failed');
    });

    it('respects RateLimitError retryAfter for delay calculation', async () => {
      const client = new HttpClient({ baseURL: 'https://api.example.com', headers: {}, maxRetries: 1 });

      fetchSpy
        .mockResolvedValueOnce(jsonResponse({ message: 'rate limited' }, 429, { 'retry-after': '0' }))
        .mockResolvedValueOnce(jsonResponse({ ok: true }));

      const start = Date.now();
      await client.request({ method: 'GET', path: '/test' });
      // Should complete quickly with retry-after: 0
      expect(Date.now() - start).toBeLessThan(2000);
    });
  });

  // ---- request: timeout ----
  describe('request – timeout', () => {
    it('throws TimeoutError when request exceeds timeout', async () => {
      const client = new HttpClient({
        baseURL: 'https://api.example.com',
        headers: {},
        timeout: 50,
        maxRetries: 0,
      });

      fetchSpy.mockImplementationOnce((_url: string | URL | Request, init?: RequestInit) => {
        return new Promise((_resolve, reject) => {
          const signal = init?.signal;
          if (signal) {
            signal.addEventListener('abort', () => {
              reject(new DOMException('The operation was aborted.', 'AbortError'));
            });
          }
        });
      });

      await expect(
        client.request({ method: 'GET', path: '/slow', timeout: 50 }),
      ).rejects.toThrow(TimeoutError);
    });

    it('throws PrismeAIError "Request aborted" when user signal is aborted', async () => {
      const client = new HttpClient({
        baseURL: 'https://api.example.com',
        headers: {},
        maxRetries: 0,
      });

      const userController = new AbortController();
      userController.abort();

      fetchSpy.mockImplementationOnce(() => {
        throw new DOMException('The operation was aborted.', 'AbortError');
      });

      await expect(
        client.request({ method: 'GET', path: '/aborted', signal: userController.signal }),
      ).rejects.toThrow('Request aborted');
    });
  });

  // ---- request: re-throws PrismeAIError from catch block ----
  describe('request – PrismeAIError re-throw', () => {
    it('re-throws PrismeAIError instances directly from catch block', async () => {
      const client = new HttpClient({ baseURL: 'https://api.example.com', headers: {}, maxRetries: 0 });

      const customError = new PrismeAIError('custom error');
      fetchSpy.mockRejectedValueOnce(customError);

      await expect(client.request({ method: 'GET', path: '/x' })).rejects.toBe(customError);
    });
  });

  // ---- requestRaw ----
  describe('requestRaw', () => {
    it('returns raw Response', async () => {
      const client = new HttpClient({ baseURL: 'https://api.example.com', headers: {} });
      const raw = jsonResponse({ test: true });
      fetchSpy.mockResolvedValueOnce(raw);

      const result = await client.requestRaw({ method: 'GET', path: '/raw' });
      expect(result).toBe(raw);
    });
  });

  // ---- Convenience methods ----
  describe('convenience methods', () => {
    let client: HttpClient;

    beforeEach(() => {
      client = new HttpClient({ baseURL: 'https://api.example.com', headers: {} });
    });

    it('get() calls request with GET method', async () => {
      fetchSpy.mockResolvedValueOnce(jsonResponse({ items: [] }));

      await client.get('/items', { page: 1 });

      const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(init.method).toBe('GET');
      expect(url).toContain('page=1');
    });

    it('get() passes additional options', async () => {
      fetchSpy.mockResolvedValueOnce(jsonResponse({}));

      await client.get('/items', undefined, { headers: { 'x-custom': 'val' } });

      const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect((init.headers as Record<string, string>)['x-custom']).toBe('val');
    });

    it('post() calls request with POST method and body', async () => {
      fetchSpy.mockResolvedValueOnce(jsonResponse({ id: '1' }));

      await client.post('/items', { name: 'new' });

      const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(init.method).toBe('POST');
      expect(init.body).toBe(JSON.stringify({ name: 'new' }));
    });

    it('post() passes additional options', async () => {
      fetchSpy.mockResolvedValueOnce(jsonResponse({}));

      await client.post('/items', { name: 'new' }, { headers: { 'x-custom': 'val' } });

      const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect((init.headers as Record<string, string>)['x-custom']).toBe('val');
    });

    it('put() calls request with PUT method', async () => {
      fetchSpy.mockResolvedValueOnce(jsonResponse({ id: '1' }));

      await client.put('/items/1', { name: 'updated' });

      const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(init.method).toBe('PUT');
    });

    it('patch() calls request with PATCH method', async () => {
      fetchSpy.mockResolvedValueOnce(jsonResponse({ id: '1' }));

      await client.patch('/items/1', { name: 'patched' });

      const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(init.method).toBe('PATCH');
    });

    it('delete() calls request with DELETE method', async () => {
      fetchSpy.mockResolvedValueOnce(emptyResponse());

      await client.delete('/items/1', { force: true });

      const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(init.method).toBe('DELETE');
      expect(url).toContain('force=true');
    });
  });

  // ---- Default retry/timeout values ----
  describe('defaults', () => {
    it('uses default maxRetries of 2', async () => {
      const client = new HttpClient({ baseURL: 'https://api.example.com', headers: {} });

      fetchSpy
        .mockResolvedValueOnce(jsonResponse({}, 500))
        .mockResolvedValueOnce(jsonResponse({}, 500))
        .mockResolvedValueOnce(jsonResponse({ ok: true }));

      const result = await client.request<{ ok: boolean }>({ method: 'GET', path: '/test' });
      expect(result).toEqual({ ok: true });
      expect(fetchSpy).toHaveBeenCalledTimes(3);
    });
  });

  // ---- user abort signal is forwarded ----
  describe('request – user signal forwarding', () => {
    it('propagates user abort signal to fetch', async () => {
      const client = new HttpClient({
        baseURL: 'https://api.example.com',
        headers: {},
        maxRetries: 0,
      });

      const userController = new AbortController();

      fetchSpy.mockImplementationOnce((_url: string | URL | Request, init?: RequestInit) => {
        return new Promise((_resolve, reject) => {
          const signal = init?.signal;
          if (signal) {
            signal.addEventListener('abort', () => {
              reject(new DOMException('The operation was aborted.', 'AbortError'));
            });
          }
          // Abort after brief delay
          setTimeout(() => userController.abort(), 10);
        });
      });

      await expect(
        client.request({ method: 'GET', path: '/slow', signal: userController.signal }),
      ).rejects.toThrow('Request aborted');
    });
  });
});

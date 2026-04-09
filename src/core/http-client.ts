import {
  PrismeAIError,
  ConnectionError,
  TimeoutError,
  RateLimitError,
  errorFromStatus,
} from './errors.js';

export interface HttpClientOptions {
  baseURL: string;
  headers: Record<string, string>;
  timeout?: number;
  maxRetries?: number;
}

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  query?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
  signal?: AbortSignal;
  raw?: boolean;
}

const DEFAULT_TIMEOUT = 60_000;
const DEFAULT_MAX_RETRIES = 2;
const RETRY_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);
const INITIAL_RETRY_DELAY = 500;
const MAX_RETRY_DELAY = 8_000;

export class HttpClient {
  readonly baseURL: string;
  private readonly defaultHeaders: Record<string, string>;
  private readonly timeout: number;
  private readonly maxRetries: number;

  constructor(options: HttpClientOptions) {
    this.baseURL = options.baseURL.replace(/\/+$/, '');
    this.defaultHeaders = options.headers;
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT;
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  }

  async request<T>(options: RequestOptions): Promise<T> {
    const url = this.buildURL(options.path, options.query);
    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      ...options.headers,
    };

    if (options.body !== undefined && !headers['content-type']) {
      headers['content-type'] = 'application/json';
    }

    const fetchOptions: RequestInit = {
      method: options.method,
      headers,
      signal: options.signal,
    };

    if (options.body !== undefined) {
      if (options.body instanceof FormData) {
        delete headers['content-type'];
        fetchOptions.body = options.body;
      } else {
        fetchOptions.body = JSON.stringify(options.body);
      }
    }

    const timeout = options.timeout ?? this.timeout;
    let lastError: PrismeAIError | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) {
        const delay = this.getRetryDelay(attempt, lastError);
        await sleep(delay);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      if (options.signal) {
        options.signal.addEventListener('abort', () => controller.abort(), { once: true });
      }

      try {
        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          if (options.raw) return response as unknown as T;
          const text = await response.text();
          if (!text) return undefined as T;
          try {
            return JSON.parse(text) as T;
          } catch {
            return text as T;
          }
        }

        const body = await this.safeParseBody(response);
        const message = extractErrorMessage(body, response.statusText);
        const error = errorFromStatus(response.status, message, response.headers, body);

        if (RETRY_STATUS_CODES.has(response.status) && attempt < this.maxRetries) {
          lastError = error;
          continue;
        }

        throw error;
      } catch (err) {
        clearTimeout(timeoutId);

        if (err instanceof PrismeAIError) throw err;

        if (err instanceof DOMException && err.name === 'AbortError') {
          if (options.signal?.aborted) {
            throw new PrismeAIError('Request aborted');
          }
          throw new TimeoutError(`Request timed out after ${timeout}ms`);
        }

        if (attempt < this.maxRetries) {
          lastError = new ConnectionError(
            err instanceof Error ? err.message : 'Connection failed',
          );
          continue;
        }

        throw new ConnectionError(
          err instanceof Error ? err.message : 'Connection failed',
        );
      }
    }

    throw lastError ?? new PrismeAIError('Request failed after retries');
  }

  async requestRaw(options: RequestOptions): Promise<Response> {
    return this.request<Response>({ ...options, raw: true });
  }

  get<T>(path: string, query?: Record<string, unknown>, options?: Partial<RequestOptions>): Promise<T> {
    return this.request<T>({ method: 'GET', path, query, ...options });
  }

  post<T>(path: string, body?: unknown, options?: Partial<RequestOptions>): Promise<T> {
    return this.request<T>({ method: 'POST', path, body, ...options });
  }

  put<T>(path: string, body?: unknown, options?: Partial<RequestOptions>): Promise<T> {
    return this.request<T>({ method: 'PUT', path, body, ...options });
  }

  patch<T>(path: string, body?: unknown, options?: Partial<RequestOptions>): Promise<T> {
    return this.request<T>({ method: 'PATCH', path, body, ...options });
  }

  delete<T>(path: string, query?: Record<string, unknown>, options?: Partial<RequestOptions>): Promise<T> {
    return this.request<T>({ method: 'DELETE', path, query, ...options });
  }

  private buildURL(path: string, query?: Record<string, unknown>): string {
    // Strip leading slash to avoid overriding baseURL path (e.g. /v2)
    const cleanPath = path.replace(/^\/+/, '');
    const url = new URL(cleanPath, this.baseURL + '/');
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url.toString();
  }

  private getRetryDelay(attempt: number, lastError?: PrismeAIError): number {
    if (lastError instanceof RateLimitError && lastError.retryAfter) {
      return Math.min(lastError.retryAfter, MAX_RETRY_DELAY);
    }
    const base = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
    const jitter = base * 0.2 * Math.random();
    return Math.min(base + jitter, MAX_RETRY_DELAY);
  }

  private async safeParseBody(response: Response): Promise<unknown> {
    try {
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    } catch {
      return undefined;
    }
  }
}

function extractErrorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === 'object') {
    const obj = body as Record<string, unknown>;
    if (typeof obj.message === 'string') return obj.message;
    if (typeof obj.error === 'string') return obj.error;
    if (obj.error && typeof obj.error === 'object') {
      const inner = obj.error as Record<string, unknown>;
      if (typeof inner.message === 'string') return inner.message;
    }
  }
  return fallback;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

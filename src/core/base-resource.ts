import type { HttpClient, RequestOptions } from './http-client.js';
import { PageIterator, defaultExtractor, type PageResponse } from './pagination.js';
import type { PaginationParams } from './pagination.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryParams = Record<string, any>;

/**
 * Abstract base class for all API resource classes.
 * Provides common HTTP methods and pagination helpers.
 */
export abstract class BaseResource {
  protected readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  protected _get<T>(path: string, query?: QueryParams): Promise<T> {
    return this.httpClient.get<T>(path, query);
  }

  protected _post<T>(path: string, body?: unknown, options?: Partial<RequestOptions>): Promise<T> {
    return this.httpClient.post<T>(path, body, options);
  }

  protected _put<T>(path: string, body?: unknown): Promise<T> {
    return this.httpClient.put<T>(path, body);
  }

  protected _patch<T>(path: string, body?: unknown): Promise<T> {
    return this.httpClient.patch<T>(path, body);
  }

  protected _del<T>(path: string, query?: QueryParams): Promise<T> {
    return this.httpClient.delete<T>(path, query);
  }

  protected _paginate<T>(
    path: string,
    query?: QueryParams,
    pagination?: PaginationParams,
    extractor?: (body: unknown) => PageResponse<T>,
  ): PageIterator<T> {
    return new PageIterator<T>(
      this.httpClient,
      {
        method: 'GET',
        path,
        query: { ...query },
      },
      extractor ?? defaultExtractor<T>,
      pagination?.limit ?? 20,
      pagination?.page ?? 1,
    );
  }

  /**
   * Build a path with workspace slug prefix.
   */
  protected buildPath(workspaceSlug: string, ...segments: string[]): string {
    return `/workspaces/slug:${workspaceSlug}/webhooks/v1/${segments.join('/')}`;
  }
}

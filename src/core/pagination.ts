import type { HttpClient, RequestOptions } from './http-client.js';

export interface PageResponse<T> {
  data: T[];
  total?: number;
  page?: number;
  limit?: number;
  hasMore?: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Async-iterable page iterator.
 * Supports: for await...of (item-by-item), .getPage(), .toArray()
 */
export class PageIterator<T> implements AsyncIterable<T> {
  private httpClient: HttpClient;
  private options: RequestOptions;
  private pageSize: number;
  private currentPage: number;
  private extractData: (body: unknown) => PageResponse<T>;

  constructor(
    httpClient: HttpClient,
    options: RequestOptions,
    extractData: (body: unknown) => PageResponse<T>,
    pageSize = 20,
    startPage = 1,
  ) {
    this.httpClient = httpClient;
    this.options = options;
    this.extractData = extractData;
    this.pageSize = pageSize;
    this.currentPage = startPage;
  }

  /**
   * Fetch a specific page.
   */
  async getPage(page?: number): Promise<PageResponse<T>> {
    const targetPage = page ?? this.currentPage;
    const query = {
      ...this.options.query as Record<string, unknown>,
      page: targetPage,
      limit: this.pageSize,
    };

    const raw = await this.httpClient.request<unknown>({
      ...this.options,
      query,
    });

    return this.extractData(raw);
  }

  /**
   * Collect all items across all pages into a single array.
   */
  async toArray(): Promise<T[]> {
    const items: T[] = [];
    for await (const item of this) {
      items.push(item);
    }
    return items;
  }

  async *[Symbol.asyncIterator](): AsyncIterator<T> {
    let page = this.currentPage;

    while (true) {
      const result = await this.getPage(page);
      for (const item of result.data) {
        yield item;
      }

      // A server may cap `limit` below the page size: a short page only ends the listing when it reports no more.
      if (!result.data.length || result.hasMore === false || (result.hasMore !== true && result.data.length < this.pageSize)) {
        break;
      }

      page++;
    }
  }
}

/**
 * Default extractor for standard Prisme.ai list responses.
 * Handles both { results: [...], total, page, limit } and plain array responses.
 */
export function defaultExtractor<T>(body: unknown): PageResponse<T> {
  if (Array.isArray(body)) {
    return { data: body as T[], hasMore: false };
  }

  const obj = body as Record<string, unknown>;

  // Try common response shapes
  const data = (obj.results ?? obj.data ?? obj.items ?? obj.documents ?? []) as T[];
  const total = obj.total as number | undefined;
  const page = obj.page as number | undefined;
  const limit = obj.limit as number | undefined;

  let hasMore: boolean | undefined;
  if (total !== undefined && page !== undefined && limit !== undefined) {
    hasMore = page * limit < total;
  } else if ((obj.hasMore ?? obj.has_more) !== undefined) {
    hasMore = (obj.hasMore ?? obj.has_more) as boolean;
  }

  return { data, total, page, limit, hasMore };
}

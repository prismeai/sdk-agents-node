import { describe, it, expect, vi } from 'vitest';
import { PageIterator, defaultExtractor } from '../src/core/pagination.js';
import type { HttpClient } from '../src/core/http-client.js';

function createMockHttpClient(pages: Record<number, unknown>): HttpClient {
  return {
    request: vi.fn(async (options: { query?: Record<string, unknown> }) => {
      const page = (options.query?.page as number) || 1;
      return pages[page];
    }),
  } as unknown as HttpClient;
}

describe('defaultExtractor', () => {
  it('handles array response', () => {
    const result = defaultExtractor([1, 2, 3]);
    expect(result.data).toEqual([1, 2, 3]);
    expect(result.hasMore).toBe(false);
  });

  it('handles object with results field', () => {
    const result = defaultExtractor({ results: [1, 2], total: 10, page: 1, limit: 2 });
    expect(result.data).toEqual([1, 2]);
    expect(result.total).toBe(10);
    expect(result.hasMore).toBe(true);
  });

  it('handles object with data field', () => {
    const result = defaultExtractor({ data: [1, 2], hasMore: false });
    expect(result.data).toEqual([1, 2]);
    expect(result.hasMore).toBe(false);
  });

  it('handles empty object', () => {
    const result = defaultExtractor({});
    expect(result.data).toEqual([]);
  });
});

describe('PageIterator', () => {
  it('iterates through all pages', async () => {
    const client = createMockHttpClient({
      1: { results: [1, 2], total: 4, page: 1, limit: 2 },
      2: { results: [3, 4], total: 4, page: 2, limit: 2 },
    });

    const iterator = new PageIterator(
      client,
      { method: 'GET', path: '/test' },
      defaultExtractor,
      2,
    );

    const items: number[] = [];
    for await (const item of iterator) {
      items.push(item as number);
    }

    expect(items).toEqual([1, 2, 3, 4]);
  });

  it('supports toArray()', async () => {
    const client = createMockHttpClient({
      1: { results: ['a', 'b'], total: 2, page: 1, limit: 10 },
    });

    const iterator = new PageIterator(
      client,
      { method: 'GET', path: '/test' },
      defaultExtractor,
      10,
    );

    const items = await iterator.toArray();
    expect(items).toEqual(['a', 'b']);
  });

  it('supports getPage()', async () => {
    const client = createMockHttpClient({
      2: { results: [3, 4], total: 4, page: 2, limit: 2 },
    });

    const iterator = new PageIterator(
      client,
      { method: 'GET', path: '/test' },
      defaultExtractor,
      2,
    );

    const page = await iterator.getPage(2);
    expect(page.data).toEqual([3, 4]);
  });

  it('stops when page has fewer items than page size', async () => {
    const client = createMockHttpClient({
      1: { results: [1, 2], total: 3, page: 1, limit: 2 },
      2: { results: [3], total: 3, page: 2, limit: 2 },
    });

    const iterator = new PageIterator(
      client,
      { method: 'GET', path: '/test' },
      defaultExtractor,
      2,
    );

    const items = await iterator.toArray();
    expect(items).toEqual([1, 2, 3]);
  });
});

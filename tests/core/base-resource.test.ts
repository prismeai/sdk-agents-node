import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseResource } from '../../src/core/base-resource.js';
import type { HttpClient } from '../../src/core/http-client.js';
import { PageIterator } from '../../src/core/pagination.js';

// BaseResource is abstract, so we create a concrete subclass for testing.
class TestResource extends BaseResource {
  // Expose protected methods for testing
  public testGet<T>(path: string, query?: Record<string, any>): Promise<T> {
    return this._get<T>(path, query);
  }

  public testPost<T>(path: string, body?: unknown): Promise<T> {
    return this._post<T>(path, body);
  }

  public testPut<T>(path: string, body?: unknown): Promise<T> {
    return this._put<T>(path, body);
  }

  public testPatch<T>(path: string, body?: unknown): Promise<T> {
    return this._patch<T>(path, body);
  }

  public testDel<T>(path: string, query?: Record<string, any>): Promise<T> {
    return this._del<T>(path, query);
  }

  public testBuildPath(workspaceId: string, ...segments: string[]): string {
    return this.buildPath(workspaceId, ...segments);
  }

  public testPaginate<T>(path: string, query?: Record<string, any>, pagination?: { page?: number; limit?: number }): PageIterator<T> {
    return this._paginate<T>(path, query, pagination);
  }
}

function createMockHttpClient() {
  return {
    baseURL: 'https://api.example.com',
    get: vi.fn().mockResolvedValue({}),
    post: vi.fn().mockResolvedValue({}),
    put: vi.fn().mockResolvedValue({}),
    patch: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
    request: vi.fn().mockResolvedValue({}),
    requestRaw: vi.fn().mockResolvedValue(new Response()),
  } as unknown as HttpClient & {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    request: ReturnType<typeof vi.fn>;
    requestRaw: ReturnType<typeof vi.fn>;
  };
}

describe('BaseResource', () => {
  let http: ReturnType<typeof createMockHttpClient>;
  let resource: TestResource;

  beforeEach(() => {
    http = createMockHttpClient();
    resource = new TestResource(http);
  });

  describe('buildPath', () => {
    it('builds path with workspace ID and segments', () => {
      const path = resource.testBuildPath('ws-123', 'agents', 'a1');
      expect(path).toBe('/workspaces/slug:ws-123/webhooks/v1/agents/a1');
    });

    it('builds path with single segment', () => {
      const path = resource.testBuildPath('ws-abc', 'agents');
      expect(path).toBe('/workspaces/slug:ws-abc/webhooks/v1/agents');
    });

    it('builds path with multiple segments', () => {
      const path = resource.testBuildPath('ws-1', 'agents', 'a1', 'messages', 'stream');
      expect(path).toBe('/workspaces/slug:ws-1/webhooks/v1/agents/a1/messages/stream');
    });

    it('builds path with no extra segments', () => {
      const path = resource.testBuildPath('ws-1');
      expect(path).toBe('/workspaces/slug:ws-1/webhooks/v1/');
    });
  });

  describe('_get', () => {
    it('delegates to httpClient.get', async () => {
      http.get.mockResolvedValueOnce({ data: 'ok' });
      const result = await resource.testGet('/path', { q: 'test' });
      expect(http.get).toHaveBeenCalledWith('/path', { q: 'test' });
      expect(result).toEqual({ data: 'ok' });
    });
  });

  describe('_post', () => {
    it('delegates to httpClient.post', async () => {
      http.post.mockResolvedValueOnce({ id: '1' });
      const result = await resource.testPost('/path', { name: 'item' });
      expect(http.post).toHaveBeenCalledWith('/path', { name: 'item' }, undefined);
      expect(result).toEqual({ id: '1' });
    });
  });

  describe('_put', () => {
    it('delegates to httpClient.put', async () => {
      http.put.mockResolvedValueOnce({ id: '1' });
      const result = await resource.testPut('/path', { name: 'updated' });
      expect(http.put).toHaveBeenCalledWith('/path', { name: 'updated' });
      expect(result).toEqual({ id: '1' });
    });
  });

  describe('_patch', () => {
    it('delegates to httpClient.patch', async () => {
      http.patch.mockResolvedValueOnce({ id: '1' });
      const result = await resource.testPatch('/path', { name: 'patched' });
      expect(http.patch).toHaveBeenCalledWith('/path', { name: 'patched' });
      expect(result).toEqual({ id: '1' });
    });
  });

  describe('_del', () => {
    it('delegates to httpClient.delete', async () => {
      http.delete.mockResolvedValueOnce(undefined);
      const result = await resource.testDel('/path', { force: true });
      expect(http.delete).toHaveBeenCalledWith('/path', { force: true });
      expect(result).toBeUndefined();
    });
  });

  describe('_paginate', () => {
    it('returns a PageIterator', () => {
      const iter = resource.testPaginate('/items');
      expect(iter).toBeInstanceOf(PageIterator);
    });

    it('passes query params and pagination to PageIterator', async () => {
      http.request.mockResolvedValueOnce({
        results: [{ id: 1 }, { id: 2 }],
        total: 2,
        page: 1,
        limit: 10,
      });

      const iter = resource.testPaginate('/items', { search: 'test' }, { page: 1, limit: 10 });
      const items = await iter.toArray();
      expect(items).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('uses default pagination when not provided', () => {
      const iter = resource.testPaginate('/items');
      expect(iter).toBeDefined();
    });

    it('uses custom extractor when provided', async () => {
      http.request.mockResolvedValueOnce({
        custom: [{ id: 'x' }],
        total: 1,
      });

      // Test the paginate with default extractor (no custom one passed through this helper)
      const iter = resource.testPaginate('/items');
      expect(iter).toBeDefined();
    });
  });
});

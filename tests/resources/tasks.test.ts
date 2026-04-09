import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Tasks } from '../../src/resources/tasks/index.js';
import type { HttpClient } from '../../src/core/http-client.js';

// ---------------------------------------------------------------------------
// Mock HttpClient
// ---------------------------------------------------------------------------

function createMockHttpClient() {
  return {
    baseURL: 'https://api.sandbox.prisme.ai/v2',
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

const WS_ID = 'ws-456';
const PREFIX = `/workspaces/slug:${WS_ID}/webhooks/v1`;

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

describe('Tasks', () => {
  let http: ReturnType<typeof createMockHttpClient>;
  let tasks: Tasks;

  beforeEach(() => {
    http = createMockHttpClient();
    tasks = new Tasks(http, WS_ID);
  });

  describe('list', () => {
    it('returns a PageIterator for tasks', () => {
      const iter = tasks.list('a1');
      expect(iter).toBeDefined();
      expect(typeof iter.toArray).toBe('function');
      expect(typeof iter[Symbol.asyncIterator]).toBe('function');
    });

    it('passes params to paginator', () => {
      const iter = tasks.list('a1', { page: 2, limit: 5 } as any);
      expect(iter).toBeDefined();
    });
  });

  describe('get', () => {
    it('calls GET on specific task path', async () => {
      const task = { id: 'task-1', status: 'running', agentId: 'a1' };
      http.get.mockResolvedValueOnce(task);

      const result = await tasks.get('a1', 'task-1');

      expect(http.get).toHaveBeenCalledWith(`${PREFIX}/agents/a1/tasks/task-1`);
      expect(result).toEqual(task);
    });

    it('returns the resolved value', async () => {
      const task = { id: 'task-2', status: 'completed' };
      http.get.mockResolvedValueOnce(task);

      const result = await tasks.get('a1', 'task-2');

      expect(result.status).toBe('completed');
    });
  });

  describe('cancel', () => {
    it('calls POST on cancel path', async () => {
      const task = { id: 'task-1', status: 'cancelled' };
      http.post.mockResolvedValueOnce(task);

      const result = await tasks.cancel('a1', 'task-1');

      expect(http.post).toHaveBeenCalledWith(`${PREFIX}/agents/a1/tasks/task-1/cancel`, undefined, undefined);
      expect(result).toEqual(task);
    });

    it('returns the cancelled task', async () => {
      http.post.mockResolvedValueOnce({ id: 'task-3', status: 'cancelled' });

      const result = await tasks.cancel('a1', 'task-3');

      expect(result.status).toBe('cancelled');
    });
  });
});

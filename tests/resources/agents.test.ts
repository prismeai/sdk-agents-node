import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Agents } from '../../src/resources/agents/index.js';
import { Messages } from '../../src/resources/agents/messages.js';
import { Conversations } from '../../src/resources/agents/conversations.js';
import { Analytics } from '../../src/resources/agents/analytics.js';
import { Evaluations } from '../../src/resources/agents/evaluations.js';
import { Access } from '../../src/resources/agents/access.js';
import { Tools } from '../../src/resources/agents/tools.js';
import { A2A } from '../../src/resources/agents/a2a.js';
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

const WS_ID = 'ws-123';
const PREFIX = `/workspaces/slug:${WS_ID}/webhooks/v1`;

// ---------------------------------------------------------------------------
// Agents
// ---------------------------------------------------------------------------

describe('Agents', () => {
  let http: ReturnType<typeof createMockHttpClient>;
  let agents: Agents;

  beforeEach(() => {
    http = createMockHttpClient();
    agents = new Agents(http, WS_ID);
  });

  describe('list', () => {
    it('returns a PageIterator for agents', () => {
      const iter = agents.list();
      expect(iter).toBeDefined();
      expect(typeof iter.toArray).toBe('function');
    });

    it('passes params as query to paginator', () => {
      const iter = agents.list({ search: 'test' } as any);
      expect(iter).toBeDefined();
    });
  });

  describe('create', () => {
    it('calls POST on agents path', async () => {
      const params = { name: 'Test Agent' };
      http.post.mockResolvedValueOnce({ id: 'a1', name: 'Test Agent' });

      const result = await agents.create(params as any);

      expect(http.post).toHaveBeenCalledWith(`${PREFIX}/agents`, params, undefined);
      expect(result).toEqual({ id: 'a1', name: 'Test Agent' });
    });
  });

  describe('get', () => {
    it('calls GET on specific agent path', async () => {
      http.get.mockResolvedValueOnce({ id: 'a1', name: 'Agent' });

      const result = await agents.get('a1');

      expect(http.get).toHaveBeenCalledWith(`${PREFIX}/agents/a1`);
      expect(result).toEqual({ id: 'a1', name: 'Agent' });
    });
  });

  describe('update', () => {
    it('calls PATCH on specific agent path', async () => {
      const params = { name: 'Updated' };
      http.patch.mockResolvedValueOnce({ id: 'a1', name: 'Updated' });

      const result = await agents.update('a1', params as any);

      expect(http.patch).toHaveBeenCalledWith(`${PREFIX}/agents/a1`, params);
      expect(result).toEqual({ id: 'a1', name: 'Updated' });
    });
  });

  describe('delete', () => {
    it('calls DELETE on specific agent path', async () => {
      http.delete.mockResolvedValueOnce(undefined);

      await agents.delete('a1');

      expect(http.delete).toHaveBeenCalledWith(`${PREFIX}/agents/a1`, undefined);
    });
  });

  describe('publish', () => {
    it('calls POST on publish path', async () => {
      http.post.mockResolvedValueOnce({ id: 'a1', status: 'published' });

      const result = await agents.publish('a1');

      expect(http.post).toHaveBeenCalledWith(`${PREFIX}/agents/a1/publish`, undefined, undefined);
      expect(result).toEqual({ id: 'a1', status: 'published' });
    });
  });

  describe('discardDraft', () => {
    it('calls POST on discard-draft path', async () => {
      http.post.mockResolvedValueOnce({ id: 'a1', status: 'active' });

      const result = await agents.discardDraft('a1');

      expect(http.post).toHaveBeenCalledWith(`${PREFIX}/agents/a1/discard-draft`, undefined, undefined);
      expect(result).toEqual({ id: 'a1', status: 'active' });
    });
  });

  describe('discovery', () => {
    it('returns a PageIterator for discoverable agents', () => {
      const iter = agents.discovery();
      expect(iter).toBeDefined();
      expect(typeof iter.toArray).toBe('function');
    });

    it('passes search params', () => {
      const iter = agents.discovery({ search: 'test' });
      expect(iter).toBeDefined();
    });
  });

  describe('export', () => {
    it('calls GET on export path', async () => {
      http.get.mockResolvedValueOnce({ config: {} });

      const result = await agents.export('a1');

      expect(http.get).toHaveBeenCalledWith(`${PREFIX}/agents/a1/export`);
      expect(result).toEqual({ config: {} });
    });
  });

  describe('import', () => {
    it('calls POST on import path with agents_md wrapper', async () => {
      const yaml = 'name: Imported Agent\nmodel: gpt-4o';
      http.post.mockResolvedValueOnce({ id: 'a2', name: 'Imported Agent' });

      const result = await agents.import(yaml);

      expect(http.post).toHaveBeenCalledWith(`${PREFIX}/agents/import`, { agents_md: yaml }, undefined);
      expect(result).toEqual({ id: 'a2', name: 'Imported Agent' });
    });
  });

  describe('sub-resources are wired', () => {
    it('has messages sub-resource', () => {
      expect(agents.messages).toBeInstanceOf(Messages);
    });

    it('has conversations sub-resource', () => {
      expect(agents.conversations).toBeInstanceOf(Conversations);
    });

    it('has tools sub-resource', () => {
      expect(agents.tools).toBeInstanceOf(Tools);
    });

    it('has access sub-resource', () => {
      expect(agents.access).toBeInstanceOf(Access);
    });

    it('has analytics sub-resource', () => {
      expect(agents.analytics).toBeInstanceOf(Analytics);
    });

    it('has evaluations sub-resource', () => {
      expect(agents.evaluations).toBeInstanceOf(Evaluations);
    });

    it('has a2a sub-resource', () => {
      expect(agents.a2a).toBeInstanceOf(A2A);
    });
  });
});

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

describe('Messages', () => {
  let http: ReturnType<typeof createMockHttpClient>;
  let messages: Messages;

  beforeEach(() => {
    http = createMockHttpClient();
    messages = new Messages(http, WS_ID);
  });

  describe('send', () => {
    it('calls POST on messages/send path', async () => {
      const params = { message: { parts: [{ text: 'Hello' }] } };
      http.post.mockResolvedValueOnce({ output: 'Hi there' });

      const result = await messages.send('a1', params as any);

      expect(http.post).toHaveBeenCalledWith(`${PREFIX}/agents/a1/messages/send`, params, undefined);
      expect(result).toEqual({ output: 'Hi there' });
    });
  });

  describe('stream', () => {
    it('calls requestRaw with SSE headers and returns SSEStream', async () => {
      const mockResponse = new Response('data: {"type":"delta"}\n\n', {
        headers: { 'content-type': 'text/event-stream' },
      });
      http.requestRaw.mockResolvedValueOnce(mockResponse);

      const params = { message: { parts: [{ text: 'Hello' }] } };
      const stream = await messages.stream('a1', params as any);

      expect(http.requestRaw).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          path: `${PREFIX}/agents/a1/messages/stream`,
          body: params,
          headers: { accept: 'text/event-stream' },
        }),
      );
      expect(stream).toBeDefined();
      expect(typeof stream[Symbol.asyncIterator]).toBe('function');
    });
  });
});

// ---------------------------------------------------------------------------
// Conversations
// ---------------------------------------------------------------------------

describe('Conversations', () => {
  let http: ReturnType<typeof createMockHttpClient>;
  let conversations: Conversations;

  beforeEach(() => {
    http = createMockHttpClient();
    conversations = new Conversations(http, WS_ID);
  });

  describe('list', () => {
    it('returns a PageIterator', () => {
      const iter = conversations.list('a1');
      expect(iter).toBeDefined();
      expect(typeof iter.toArray).toBe('function');
    });
  });

  describe('create', () => {
    it('calls POST on conversations path', async () => {
      const params = { title: 'New convo' };
      http.post.mockResolvedValueOnce({ id: 'c1' });

      const result = await conversations.create('a1', params as any);

      expect(http.post).toHaveBeenCalledWith(`${PREFIX}/agents/a1/conversations`, params, undefined);
      expect(result).toEqual({ id: 'c1' });
    });

    it('normalizes contextId to id', async () => {
      http.post.mockResolvedValueOnce({ contextId: 'ctx-1' });

      const result = await conversations.create('a1');

      expect(result.id).toBe('ctx-1');
    });
  });

  describe('get', () => {
    it('calls GET on specific conversation path', async () => {
      http.get.mockResolvedValueOnce({ id: 'c1' });

      const result = await conversations.get('a1', 'c1');

      expect(http.get).toHaveBeenCalledWith(`${PREFIX}/agents/a1/conversations/c1`);
      expect(result).toEqual({ id: 'c1' });
    });
  });

  describe('update', () => {
    it('calls PATCH on specific conversation path', async () => {
      const params = { title: 'Updated' };
      http.patch.mockResolvedValueOnce({ id: 'c1', title: 'Updated' });

      const result = await conversations.update('a1', 'c1', params as any);

      expect(http.patch).toHaveBeenCalledWith(`${PREFIX}/agents/a1/conversations/c1`, params);
      expect(result).toEqual({ id: 'c1', title: 'Updated' });
    });
  });

  describe('delete', () => {
    it('calls DELETE on specific conversation path', async () => {
      http.delete.mockResolvedValueOnce(undefined);

      await conversations.delete('a1', 'c1');

      expect(http.delete).toHaveBeenCalledWith(`${PREFIX}/agents/a1/conversations/c1`, undefined);
    });
  });

  describe('share', () => {
    it('calls POST on share path', async () => {
      const params = { email: 'user@example.com' };
      http.post.mockResolvedValueOnce(undefined);

      await conversations.share('a1', 'c1', params as any);

      expect(http.post).toHaveBeenCalledWith(`${PREFIX}/agents/a1/conversations/c1/share`, params, undefined);
    });
  });
});

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

describe('Analytics', () => {
  let http: ReturnType<typeof createMockHttpClient>;
  let analytics: Analytics;

  beforeEach(() => {
    http = createMockHttpClient();
    analytics = new Analytics(http, WS_ID);
  });

  describe('get', () => {
    it('calls GET on analytics path with params', async () => {
      const params = { from: '2024-01-01', to: '2024-01-31' };
      http.get.mockResolvedValueOnce({ data: [] });

      const result = await analytics.get('a1', params as any);

      expect(http.get).toHaveBeenCalledWith(
        `${PREFIX}/agents/a1/analytics`,
        params,
      );
      expect(result).toEqual({ data: [] });
    });

    it('works without params', async () => {
      http.get.mockResolvedValueOnce({ data: [] });

      const result = await analytics.get('a1');

      expect(http.get).toHaveBeenCalledWith(
        `${PREFIX}/agents/a1/analytics`,
        undefined,
      );
      expect(result).toEqual({ data: [] });
    });
  });
});

// ---------------------------------------------------------------------------
// Evaluations
// ---------------------------------------------------------------------------

describe('Evaluations', () => {
  let http: ReturnType<typeof createMockHttpClient>;
  let evaluations: Evaluations;

  beforeEach(() => {
    http = createMockHttpClient();
    evaluations = new Evaluations(http, WS_ID);
  });

  describe('list', () => {
    it('returns a PageIterator', () => {
      const iter = evaluations.list('a1');
      expect(iter).toBeDefined();
      expect(typeof iter.toArray).toBe('function');
    });

    it('passes pagination params', () => {
      const iter = evaluations.list('a1', { page: 1, limit: 10 });
      expect(iter).toBeDefined();
    });
  });

  describe('create', () => {
    it('calls POST with evaluation params', async () => {
      const params = {
        name: 'Test Eval',
        dataset: [{ input: 'hello', expectedOutput: 'hi' }],
      };
      http.post.mockResolvedValueOnce({ id: 'e1', name: 'Test Eval' });

      const result = await evaluations.create('a1', params);

      expect(http.post).toHaveBeenCalledWith(`${PREFIX}/agents/a1/evaluations`, params, undefined);
      expect(result).toEqual({ id: 'e1', name: 'Test Eval' });
    });
  });
});

// ---------------------------------------------------------------------------
// Access
// ---------------------------------------------------------------------------

describe('Access', () => {
  let http: ReturnType<typeof createMockHttpClient>;
  let access: Access;

  beforeEach(() => {
    http = createMockHttpClient();
    access = new Access(http, WS_ID);
  });

  describe('list', () => {
    it('returns a PageIterator', () => {
      const iter = access.list('a1');
      expect(iter).toBeDefined();
    });

    it('passes params', () => {
      const iter = access.list('a1', { page: 1, limit: 10 } as any);
      expect(iter).toBeDefined();
    });
  });

  describe('grant', () => {
    it('calls POST to grant access', async () => {
      const params = { userId: 'u1', role: 'viewer' };
      http.post.mockResolvedValueOnce({ id: 'acc1' });

      const result = await access.grant('a1', params as any);

      expect(http.post).toHaveBeenCalledWith(`${PREFIX}/agents/a1/access`, params, undefined);
      expect(result).toEqual({ id: 'acc1' });
    });
  });

  describe('revoke', () => {
    it('calls DELETE on access entry with principalType and principalId', async () => {
      http.delete.mockResolvedValueOnce(undefined);

      await access.revoke('a1', 'user', 'u1');

      expect(http.delete).toHaveBeenCalledWith(`${PREFIX}/agents/a1/access/user/u1`, undefined);
    });
  });

  describe('requestAccess', () => {
    it('calls POST on access/request path', async () => {
      http.post.mockResolvedValueOnce({ id: 'req1', status: 'pending' });

      const result = await access.requestAccess('a1');

      expect(http.post).toHaveBeenCalledWith(`${PREFIX}/agents/a1/access/request`, undefined, undefined);
      expect(result).toEqual({ id: 'req1', status: 'pending' });
    });
  });

  describe('listRequests', () => {
    it('returns a PageIterator', () => {
      const iter = access.listRequests('a1');
      expect(iter).toBeDefined();
    });
  });

  describe('handleRequest', () => {
    it('calls POST with params as body', async () => {
      const params = { action: 'approve' };
      http.post.mockResolvedValueOnce({ id: 'req1', status: 'approved' });

      const result = await access.handleRequest('a1', 'req1', params as any);

      expect(http.post).toHaveBeenCalledWith(
        `${PREFIX}/agents/a1/access/requests/req1`,
        params,
        undefined,
      );
      expect(result).toEqual({ id: 'req1', status: 'approved' });
    });
  });
});

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

describe('Tools', () => {
  let http: ReturnType<typeof createMockHttpClient>;
  let tools: Tools;

  beforeEach(() => {
    http = createMockHttpClient();
    tools = new Tools(http, WS_ID);
  });

  describe('list', () => {
    it('returns a PageIterator', () => {
      const iter = tools.list('a1');
      expect(iter).toBeDefined();
    });

    it('passes params', () => {
      const iter = tools.list('a1', { page: 1, limit: 5 } as any);
      expect(iter).toBeDefined();
    });
  });

  describe('create', () => {
    it('calls POST on tools path', async () => {
      const params = { name: 'My Tool', type: 'function' };
      http.post.mockResolvedValueOnce({ id: 't1' });

      const result = await tools.create('a1', params as any);

      expect(http.post).toHaveBeenCalledWith(`${PREFIX}/agents/a1/tools`, params, undefined);
      expect(result).toEqual({ id: 't1' });
    });
  });

  describe('get', () => {
    it('calls GET on specific tool path', async () => {
      http.get.mockResolvedValueOnce({ id: 't1', name: 'Tool' });

      const result = await tools.get('a1', 't1');

      expect(http.get).toHaveBeenCalledWith(`${PREFIX}/agents/a1/tools/t1`);
      expect(result).toEqual({ id: 't1', name: 'Tool' });
    });
  });
});

// ---------------------------------------------------------------------------
// A2A
// ---------------------------------------------------------------------------

describe('A2A', () => {
  let http: ReturnType<typeof createMockHttpClient>;
  let a2a: A2A;

  beforeEach(() => {
    http = createMockHttpClient();
    a2a = new A2A(http, WS_ID);
  });

  describe('send', () => {
    it('calls POST with JSON-RPC 2.0 envelope', async () => {
      const params = { message: { text: 'Hello' } };
      http.post.mockResolvedValueOnce({ taskId: 't1' });

      const result = await a2a.send('a1', params as any);

      expect(http.post).toHaveBeenCalledWith(
        `${PREFIX}/agents/a1/a2a`,
        expect.objectContaining({
          jsonrpc: '2.0',
          method: 'tasks/send',
          params,
        }),
        undefined,
      );
      expect(result).toEqual({ taskId: 't1' });
    });
  });

  describe('sendSubscribe', () => {
    it('calls requestRaw with SSE headers and JSON-RPC 2.0 envelope', async () => {
      const mockResponse = new Response('data: {}\n\n', {
        headers: { 'content-type': 'text/event-stream' },
      });
      http.requestRaw.mockResolvedValueOnce(mockResponse);

      const params = { message: { text: 'Hello' } };
      const stream = await a2a.sendSubscribe('a1', params as any);

      expect(http.requestRaw).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          path: `${PREFIX}/agents/a1/a2a`,
          body: expect.objectContaining({
            jsonrpc: '2.0',
            method: 'tasks/sendSubscribe',
            params,
          }),
          headers: { accept: 'text/event-stream' },
        }),
      );
      expect(stream).toBeDefined();
      expect(typeof stream[Symbol.asyncIterator]).toBe('function');
    });
  });

  describe('getCard', () => {
    it('calls GET on .well-known/agent.json path', async () => {
      http.get.mockResolvedValueOnce({ name: 'Agent Card' });

      const result = await a2a.getCard('a1');

      expect(http.get).toHaveBeenCalledWith(`${PREFIX}/agents/a1/.well-known/agent.json`);
      expect(result).toEqual({ name: 'Agent Card' });
    });
  });

  describe('getExtendedCard', () => {
    it('calls GET on extendedAgentCard path', async () => {
      http.get.mockResolvedValueOnce({ name: 'Extended Card', tools: [] });

      const result = await a2a.getExtendedCard('a1');

      expect(http.get).toHaveBeenCalledWith(`${PREFIX}/agents/a1/extendedAgentCard`);
      expect(result).toEqual({ name: 'Extended Card', tools: [] });
    });
  });
});

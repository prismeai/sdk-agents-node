import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Artifacts } from '../../src/resources/artifacts/index.js';
import { Shares } from '../../src/resources/shares/index.js';
import { Ratings } from '../../src/resources/ratings/index.js';
import { Activity } from '../../src/resources/activity/index.js';
import { Profiles } from '../../src/resources/profiles/index.js';
import { Orgs } from '../../src/resources/orgs/index.js';
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

const WS_ID = 'ws-misc';
const PREFIX = `/workspaces/slug:${WS_ID}/webhooks/v1`;

// ---------------------------------------------------------------------------
// Artifacts
// ---------------------------------------------------------------------------

describe('Artifacts', () => {
  let http: ReturnType<typeof createMockHttpClient>;
  let artifacts: Artifacts;

  beforeEach(() => {
    http = createMockHttpClient();
    artifacts = new Artifacts(http, WS_ID);
  });

  describe('list', () => {
    it('returns a PageIterator', () => {
      const iter = artifacts.list();
      expect(iter).toBeDefined();
      expect(typeof iter.toArray).toBe('function');
    });

    it('passes params', () => {
      const iter = artifacts.list({ page: 1, limit: 5 } as any);
      expect(iter).toBeDefined();
    });
  });

  describe('get', () => {
    it('calls GET on specific artifact path', async () => {
      http.get.mockResolvedValueOnce({ id: 'art1', type: 'code' });

      const result = await artifacts.get('art1');

      expect(http.get).toHaveBeenCalledWith(`${PREFIX}/artifacts/art1`);
      expect(result).toEqual({ id: 'art1', type: 'code' });
    });
  });

  describe('update', () => {
    it('calls PATCH on specific artifact path', async () => {
      const params = { name: 'Updated' };
      http.patch.mockResolvedValueOnce({ id: 'art1', name: 'Updated' });

      const result = await artifacts.update('art1', params as any);

      expect(http.patch).toHaveBeenCalledWith(`${PREFIX}/artifacts/art1`, params);
      expect(result).toEqual({ id: 'art1', name: 'Updated' });
    });
  });

  describe('delete', () => {
    it('calls DELETE on specific artifact path', async () => {
      http.delete.mockResolvedValueOnce(undefined);

      await artifacts.delete('art1');

      expect(http.delete).toHaveBeenCalledWith(`${PREFIX}/artifacts/art1`, undefined);
    });
  });

  describe('share', () => {
    it('calls POST on share path', async () => {
      const params = { email: 'user@example.com' };
      http.post.mockResolvedValueOnce(undefined);

      await artifacts.share('art1', params as any);

      expect(http.post).toHaveBeenCalledWith(`${PREFIX}/artifacts/art1/share`, params, undefined);
    });
  });
});

// ---------------------------------------------------------------------------
// Shares
// ---------------------------------------------------------------------------

describe('Shares', () => {
  let http: ReturnType<typeof createMockHttpClient>;
  let shares: Shares;

  beforeEach(() => {
    http = createMockHttpClient();
    shares = new Shares(http, WS_ID);
  });

  describe('list', () => {
    it('returns a PageIterator', () => {
      const iter = shares.list();
      expect(iter).toBeDefined();
      expect(typeof iter.toArray).toBe('function');
    });

    it('passes params', () => {
      const iter = shares.list({ page: 2 } as any);
      expect(iter).toBeDefined();
    });
  });

  describe('get', () => {
    it('calls GET on specific share path', async () => {
      http.get.mockResolvedValueOnce({ id: 'sh1', type: 'conversation' });

      const result = await shares.get('sh1');

      expect(http.get).toHaveBeenCalledWith(`${PREFIX}/shares/sh1`);
      expect(result).toEqual({ id: 'sh1', type: 'conversation' });
    });
  });
});

// ---------------------------------------------------------------------------
// Ratings
// ---------------------------------------------------------------------------

describe('Ratings', () => {
  let http: ReturnType<typeof createMockHttpClient>;
  let ratings: Ratings;

  beforeEach(() => {
    http = createMockHttpClient();
    ratings = new Ratings(http, WS_ID);
  });

  describe('create', () => {
    it('calls POST on agent ratings path', async () => {
      const params = { rating: 5, feedback: 'Great!' };
      http.post.mockResolvedValueOnce({ id: 'r1', rating: 5 });

      const result = await ratings.create('a1', params);

      expect(http.post).toHaveBeenCalledWith(`${PREFIX}/agents/a1/ratings`, params, undefined);
      expect(result).toEqual({ id: 'r1', rating: 5 });
    });

    it('works with minimal params', async () => {
      const params = { rating: 3 };
      http.post.mockResolvedValueOnce({ id: 'r2', rating: 3 });

      const result = await ratings.create('a1', params);

      expect(http.post).toHaveBeenCalledWith(`${PREFIX}/agents/a1/ratings`, params, undefined);
      expect(result).toEqual({ id: 'r2', rating: 3 });
    });

    it('passes conversationId and messageId when provided', async () => {
      const params = { conversationId: 'c1', messageId: 'm1', rating: 4 };
      http.post.mockResolvedValueOnce({ id: 'r3', rating: 4 });

      const result = await ratings.create('a1', params);

      expect(http.post).toHaveBeenCalledWith(`${PREFIX}/agents/a1/ratings`, params, undefined);
      expect(result).toEqual({ id: 'r3', rating: 4 });
    });
  });
});

// ---------------------------------------------------------------------------
// Activity
// ---------------------------------------------------------------------------

describe('Activity', () => {
  let http: ReturnType<typeof createMockHttpClient>;
  let activity: Activity;

  beforeEach(() => {
    http = createMockHttpClient();
    activity = new Activity(http, WS_ID);
  });

  describe('list', () => {
    it('returns a PageIterator', () => {
      const iter = activity.list();
      expect(iter).toBeDefined();
      expect(typeof iter.toArray).toBe('function');
    });

    it('passes params (agentId, type)', () => {
      const iter = activity.list({ agentId: 'a1', type: 'message' });
      expect(iter).toBeDefined();
    });

    it('passes pagination params', () => {
      const iter = activity.list({ page: 2, limit: 20 });
      expect(iter).toBeDefined();
    });
  });
});

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------

describe('Profiles', () => {
  let http: ReturnType<typeof createMockHttpClient>;
  let profiles: Profiles;

  beforeEach(() => {
    http = createMockHttpClient();
    profiles = new Profiles(http, WS_ID);
  });

  describe('list', () => {
    it('returns a PageIterator', () => {
      const iter = profiles.list();
      expect(iter).toBeDefined();
      expect(typeof iter.toArray).toBe('function');
    });

    it('passes search param', () => {
      const iter = profiles.list({ search: 'john' });
      expect(iter).toBeDefined();
    });

    it('passes pagination params', () => {
      const iter = profiles.list({ page: 1, limit: 25 });
      expect(iter).toBeDefined();
    });
  });
});

// ---------------------------------------------------------------------------
// Orgs
// ---------------------------------------------------------------------------

describe('Orgs', () => {
  let http: ReturnType<typeof createMockHttpClient>;
  let orgs: Orgs;

  beforeEach(() => {
    http = createMockHttpClient();
    orgs = new Orgs(http, WS_ID);
  });

  describe('listAgents', () => {
    it('returns a PageIterator', () => {
      const iter = orgs.listAgents('my-org');
      expect(iter).toBeDefined();
      expect(typeof iter.toArray).toBe('function');
    });

    it('passes search param', () => {
      const iter = orgs.listAgents('my-org', { search: 'my-agent' });
      expect(iter).toBeDefined();
    });

    it('passes pagination params', () => {
      const iter = orgs.listAgents('my-org', { page: 1, limit: 10 });
      expect(iter).toBeDefined();
    });
  });
});

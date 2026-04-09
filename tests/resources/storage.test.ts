import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Files } from '../../src/resources/storage/files.js';
import { Skills } from '../../src/resources/storage/skills.js';
import { Stats } from '../../src/resources/storage/stats.js';
import { VectorStores } from '../../src/resources/storage/vector-stores/index.js';
import { VSFiles } from '../../src/resources/storage/vector-stores/files.js';
import { VSAccess } from '../../src/resources/storage/vector-stores/access.js';
import { Storage } from '../../src/resources/storage/index.js';
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

const WS_ID = 'ws-storage';
const PREFIX = `/workspaces/slug:${WS_ID}/webhooks/v1`;

// ---------------------------------------------------------------------------
// Storage (container)
// ---------------------------------------------------------------------------

describe('Storage', () => {
  it('creates all sub-resources', () => {
    const http = createMockHttpClient();
    const storage = new Storage(http, WS_ID);

    expect(storage.files).toBeInstanceOf(Files);
    expect(storage.vectorStores).toBeInstanceOf(VectorStores);
    expect(storage.skills).toBeInstanceOf(Skills);
    expect(storage.stats).toBeInstanceOf(Stats);
  });
});

// ---------------------------------------------------------------------------
// Files
// ---------------------------------------------------------------------------

describe('Files', () => {
  let http: ReturnType<typeof createMockHttpClient>;
  let files: Files;

  beforeEach(() => {
    http = createMockHttpClient();
    files = new Files(http, WS_ID);
  });

  describe('list', () => {
    it('returns a PageIterator', () => {
      const iter = files.list();
      expect(iter).toBeDefined();
      expect(typeof iter.toArray).toBe('function');
    });

    it('accepts optional params', () => {
      const iter = files.list({ page: 1, limit: 10 } as any);
      expect(iter).toBeDefined();
    });
  });

  describe('upload', () => {
    it('creates FormData from Buffer and posts', async () => {
      http.post.mockResolvedValueOnce({ id: 'f1', name: 'test.txt' });

      const buf = Buffer.from('hello');
      const result = await files.upload(buf, { filename: 'test.txt' });

      expect(http.post).toHaveBeenCalledTimes(1);
      const [path, body] = http.post.mock.calls[0];
      expect(path).toBe(`${PREFIX}/files`);
      expect(body).toBeInstanceOf(FormData);
      expect(result).toEqual({ id: 'f1', name: 'test.txt' });
    });

    it('appends name and metadata to FormData when provided', async () => {
      http.post.mockResolvedValueOnce({ id: 'f2' });

      const buf = Buffer.from('data');
      await files.upload(buf, {
        filename: 'data.json',
        name: 'my-data',
        metadata: { key: 'value' },
      } as any);

      expect(http.post).toHaveBeenCalledTimes(1);
      const [, body] = http.post.mock.calls[0];
      const fd = body as FormData;
      expect(fd.get('name')).toBe('my-data');
      expect(fd.get('metadata')).toBe(JSON.stringify({ key: 'value' }));
    });

    it('uses params.name as fallback filename', async () => {
      http.post.mockResolvedValueOnce({ id: 'f3' });

      const buf = Buffer.from('data');
      await files.upload(buf, { name: 'doc.pdf' } as any);

      expect(http.post).toHaveBeenCalledTimes(1);
    });

    it('works without params (uses defaults)', async () => {
      http.post.mockResolvedValueOnce({ id: 'f4' });

      const buf = Buffer.from('data');
      await files.upload(buf);

      expect(http.post).toHaveBeenCalledTimes(1);
    });
  });

  describe('get', () => {
    it('calls GET on specific file path', async () => {
      http.get.mockResolvedValueOnce({ id: 'f1', name: 'file.txt' });

      const result = await files.get('f1');

      expect(http.get).toHaveBeenCalledWith(`${PREFIX}/files/f1`);
      expect(result).toEqual({ id: 'f1', name: 'file.txt' });
    });
  });

  describe('delete', () => {
    it('calls DELETE on specific file path', async () => {
      http.delete.mockResolvedValueOnce(undefined);

      await files.delete('f1');

      expect(http.delete).toHaveBeenCalledWith(`${PREFIX}/files/f1`, undefined);
    });
  });

  describe('download', () => {
    it('calls requestRaw with GET on download path', async () => {
      const mockResp = new Response('file content');
      http.requestRaw.mockResolvedValueOnce(mockResp);

      const result = await files.download('f1');

      expect(http.requestRaw).toHaveBeenCalledWith({
        method: 'GET',
        path: `${PREFIX}/files/f1/content`,
      });
      expect(result).toBe(mockResp);
    });
  });
});

// ---------------------------------------------------------------------------
// Skills
// ---------------------------------------------------------------------------

describe('Skills', () => {
  let http: ReturnType<typeof createMockHttpClient>;
  let skills: Skills;

  beforeEach(() => {
    http = createMockHttpClient();
    skills = new Skills(http, WS_ID);
  });

  describe('list', () => {
    it('returns a PageIterator', () => {
      const iter = skills.list();
      expect(iter).toBeDefined();
    });
  });

  describe('create', () => {
    it('calls POST on skills path', async () => {
      const params = { name: 'MySkill', type: 'code' };
      http.post.mockResolvedValueOnce({ id: 's1' });

      const result = await skills.create(params as any);

      expect(http.post).toHaveBeenCalledWith(`${PREFIX}/skills`, params, undefined);
      expect(result).toEqual({ id: 's1' });
    });
  });

  describe('get', () => {
    it('calls GET on specific skill path', async () => {
      http.get.mockResolvedValueOnce({ id: 's1', name: 'MySkill' });

      const result = await skills.get('s1');

      expect(http.get).toHaveBeenCalledWith(`${PREFIX}/skills/s1`);
      expect(result).toEqual({ id: 's1', name: 'MySkill' });
    });
  });

  describe('update', () => {
    it('calls PATCH on specific skill path', async () => {
      const params = { name: 'Updated' };
      http.patch.mockResolvedValueOnce({ id: 's1', name: 'Updated' });

      const result = await skills.update('s1', params as any);

      expect(http.patch).toHaveBeenCalledWith(`${PREFIX}/skills/s1`, params);
      expect(result).toEqual({ id: 's1', name: 'Updated' });
    });
  });

  describe('delete', () => {
    it('calls DELETE on specific skill path', async () => {
      http.delete.mockResolvedValueOnce(undefined);

      await skills.delete('s1');

      expect(http.delete).toHaveBeenCalledWith(`${PREFIX}/skills/s1`, undefined);
    });
  });
});

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

describe('Stats', () => {
  let http: ReturnType<typeof createMockHttpClient>;
  let stats: Stats;

  beforeEach(() => {
    http = createMockHttpClient();
    stats = new Stats(http, WS_ID);
  });

  describe('get', () => {
    it('calls GET on stats path with params', async () => {
      const params = { period: 'month' };
      http.get.mockResolvedValueOnce({ totalFiles: 42 });

      const result = await stats.get(params as any);

      expect(http.get).toHaveBeenCalledWith(`${PREFIX}/stats`, params);
      expect(result).toEqual({ totalFiles: 42 });
    });

    it('works without params', async () => {
      http.get.mockResolvedValueOnce({ totalFiles: 0 });

      const result = await stats.get();

      expect(http.get).toHaveBeenCalledWith(`${PREFIX}/stats`, undefined);
      expect(result).toEqual({ totalFiles: 0 });
    });
  });
});

// ---------------------------------------------------------------------------
// VectorStores
// ---------------------------------------------------------------------------

describe('VectorStores', () => {
  let http: ReturnType<typeof createMockHttpClient>;
  let vectorStores: VectorStores;

  beforeEach(() => {
    http = createMockHttpClient();
    vectorStores = new VectorStores(http, WS_ID);
  });

  describe('sub-resources', () => {
    it('has files sub-resource', () => {
      expect(vectorStores.files).toBeInstanceOf(VSFiles);
    });

    it('has access sub-resource', () => {
      expect(vectorStores.access).toBeInstanceOf(VSAccess);
    });
  });

  describe('list', () => {
    it('returns a PageIterator', () => {
      const iter = vectorStores.list();
      expect(iter).toBeDefined();
    });
  });

  describe('create', () => {
    it('calls POST on vector-stores path', async () => {
      const params = { name: 'My VS' };
      http.post.mockResolvedValueOnce({ id: 'vs1' });

      const result = await vectorStores.create(params as any);

      expect(http.post).toHaveBeenCalledWith(`${PREFIX}/vector_stores`, params, undefined);
      expect(result).toEqual({ id: 'vs1' });
    });
  });

  describe('get', () => {
    it('calls GET on specific vector store path', async () => {
      http.get.mockResolvedValueOnce({ id: 'vs1' });

      const result = await vectorStores.get('vs1');

      expect(http.get).toHaveBeenCalledWith(`${PREFIX}/vector_stores/vs1`);
      expect(result).toEqual({ id: 'vs1' });
    });
  });

  describe('update', () => {
    it('calls PATCH on specific vector store path', async () => {
      const params = { name: 'Updated VS' };
      http.patch.mockResolvedValueOnce({ id: 'vs1', name: 'Updated VS' });

      const result = await vectorStores.update('vs1', params as any);

      expect(http.patch).toHaveBeenCalledWith(`${PREFIX}/vector_stores/vs1`, params);
      expect(result).toEqual({ id: 'vs1', name: 'Updated VS' });
    });
  });

  describe('delete', () => {
    it('calls DELETE on specific vector store path', async () => {
      http.delete.mockResolvedValueOnce(undefined);

      await vectorStores.delete('vs1');

      expect(http.delete).toHaveBeenCalledWith(`${PREFIX}/vector_stores/vs1`, undefined);
    });
  });

  describe('search', () => {
    it('calls POST on search path', async () => {
      const params = { query: 'hello', limit: 5 };
      http.post.mockResolvedValueOnce([{ id: 'r1', score: 0.95 }]);

      const result = await vectorStores.search('vs1', params as any);

      expect(http.post).toHaveBeenCalledWith(
        `${PREFIX}/vector_stores/vs1/search`,
        params,
        undefined,
      );
      expect(result).toEqual([{ id: 'r1', score: 0.95 }]);
    });
  });

  describe('reindex', () => {
    it('calls POST on reindex path', async () => {
      http.post.mockResolvedValueOnce(undefined);

      await vectorStores.reindex('vs1');

      expect(http.post).toHaveBeenCalledWith(`${PREFIX}/vector_stores/vs1/reindex`, undefined, undefined);
    });
  });

  describe('crawlStatus', () => {
    it('calls GET on crawl_status path', async () => {
      http.get.mockResolvedValueOnce({ status: 'running', progress: 50 });

      const result = await vectorStores.crawlStatus('vs1');

      expect(http.get).toHaveBeenCalledWith(`${PREFIX}/vector_stores/vs1/crawl_status`);
      expect(result).toEqual({ status: 'running', progress: 50 });
    });
  });

  describe('recrawl', () => {
    it('calls POST on recrawl path', async () => {
      http.post.mockResolvedValueOnce(undefined);

      await vectorStores.recrawl('vs1');

      expect(http.post).toHaveBeenCalledWith(`${PREFIX}/vector_stores/vs1/recrawl`, undefined, undefined);
    });
  });
});

// ---------------------------------------------------------------------------
// VSFiles
// ---------------------------------------------------------------------------

describe('VSFiles', () => {
  let http: ReturnType<typeof createMockHttpClient>;
  let vsFiles: VSFiles;

  beforeEach(() => {
    http = createMockHttpClient();
    vsFiles = new VSFiles(http, WS_ID);
  });

  describe('list', () => {
    it('returns a PageIterator', () => {
      const iter = vsFiles.list('vs1');
      expect(iter).toBeDefined();
    });

    it('passes params', () => {
      const iter = vsFiles.list('vs1', { page: 1, limit: 10 } as any);
      expect(iter).toBeDefined();
    });
  });

  describe('add', () => {
    it('calls POST to add file to vector store', async () => {
      const params = { fileId: 'f1' };
      http.post.mockResolvedValueOnce({ id: 'vsf1' });

      const result = await vsFiles.add('vs1', params as any);

      expect(http.post).toHaveBeenCalledWith(
        `${PREFIX}/vector_stores/vs1/files`,
        params,
        undefined,
      );
      expect(result).toEqual({ id: 'vsf1' });
    });
  });

  describe('update', () => {
    it('calls PATCH on specific vs file path', async () => {
      const params = { metadata: { key: 'val' } };
      http.patch.mockResolvedValueOnce({ id: 'vsf1' });

      const result = await vsFiles.update('vs1', 'vsf1', params as any);

      expect(http.patch).toHaveBeenCalledWith(
        `${PREFIX}/vector_stores/vs1/files/vsf1`,
        params,
      );
      expect(result).toEqual({ id: 'vsf1' });
    });
  });

  describe('delete', () => {
    it('calls DELETE on specific vs file path', async () => {
      http.delete.mockResolvedValueOnce(undefined);

      await vsFiles.delete('vs1', 'vsf1');

      expect(http.delete).toHaveBeenCalledWith(
        `${PREFIX}/vector_stores/vs1/files/vsf1`,
        undefined,
      );
    });
  });

  describe('chunks', () => {
    it('calls GET on chunks path', async () => {
      http.get.mockResolvedValueOnce([{ id: 'ch1', text: 'chunk' }]);

      const result = await vsFiles.chunks('vs1', 'vsf1');

      expect(http.get).toHaveBeenCalledWith(
        `${PREFIX}/vector_stores/vs1/files/vsf1/chunks`,
      );
      expect(result).toEqual([{ id: 'ch1', text: 'chunk' }]);
    });
  });

  describe('reindex', () => {
    it('calls POST on specific file reindex path', async () => {
      http.post.mockResolvedValueOnce(undefined);

      await vsFiles.reindex('vs1', 'vsf1');

      expect(http.post).toHaveBeenCalledWith(
        `${PREFIX}/vector_stores/vs1/files/vsf1/reindex`,
        undefined,
        undefined,
      );
    });
  });
});

// ---------------------------------------------------------------------------
// VSAccess
// ---------------------------------------------------------------------------

describe('VSAccess', () => {
  let http: ReturnType<typeof createMockHttpClient>;
  let vsAccess: VSAccess;

  beforeEach(() => {
    http = createMockHttpClient();
    vsAccess = new VSAccess(http, WS_ID);
  });

  describe('list', () => {
    it('returns a PageIterator', () => {
      const iter = vsAccess.list('vs1');
      expect(iter).toBeDefined();
    });
  });

  describe('grant', () => {
    it('calls POST on access path', async () => {
      const params = { userId: 'u1', role: 'reader' };
      http.post.mockResolvedValueOnce({ id: 'vsa1' });

      const result = await vsAccess.grant('vs1', params as any);

      expect(http.post).toHaveBeenCalledWith(
        `${PREFIX}/vector_stores/vs1/access`,
        params,
        undefined,
      );
      expect(result).toEqual({ id: 'vsa1' });
    });
  });

  describe('update', () => {
    it('calls PATCH on specific access entry', async () => {
      const params = { role: 'writer' };
      http.patch.mockResolvedValueOnce({ id: 'vsa1', role: 'writer' });

      const result = await vsAccess.update('vs1', 'vsa1', params as any);

      expect(http.patch).toHaveBeenCalledWith(
        `${PREFIX}/vector_stores/vs1/access/vsa1`,
        params,
      );
      expect(result).toEqual({ id: 'vsa1', role: 'writer' });
    });
  });

  describe('revoke', () => {
    it('calls DELETE on specific access entry with principal type and id', async () => {
      http.delete.mockResolvedValueOnce(undefined);

      await vsAccess.revoke('vs1', 'user', 'u1');

      expect(http.delete).toHaveBeenCalledWith(
        `${PREFIX}/vector_stores/vs1/access/user/u1`,
        undefined,
      );
    });
  });
});

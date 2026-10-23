import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Files } from '../../src/resources/storage/files.js';
import { Skills } from '../../src/resources/storage/skills.js';
import { Stats } from '../../src/resources/storage/stats.js';
import { KnowledgeBases } from '../../src/resources/storage/knowledge-bases/index.js';
import { KBDocuments } from '../../src/resources/storage/knowledge-bases/documents.js';
import { KBAccess } from '../../src/resources/storage/knowledge-bases/access.js';
import { KBWebSources } from '../../src/resources/storage/knowledge-bases/web-sources.js';
import { Storage } from '../../src/resources/storage/index.js';
import { PrismeAIError } from '../../src/core/errors.js';
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
const KB = `${PREFIX}/knowledge_bases`;
const FILES = `/workspaces/slug:${WS_ID}/files`;

// ---------------------------------------------------------------------------
// Storage (container)
// ---------------------------------------------------------------------------

describe('Storage', () => {
  it('creates all sub-resources', () => {
    const http = createMockHttpClient();
    const storage = new Storage(http, WS_ID);

    expect(storage.files).toBeInstanceOf(Files);
    expect(storage.knowledgeBases).toBeInstanceOf(KnowledgeBases);
    expect(storage.skills).toBeInstanceOf(Skills);
    expect(storage.stats).toBeInstanceOf(Stats);
  });
});

// ---------------------------------------------------------------------------
// Files (native files API)
// ---------------------------------------------------------------------------

describe('Files', () => {
  let http: ReturnType<typeof createMockHttpClient>;
  let files: Files;

  beforeEach(() => {
    http = createMockHttpClient();
    files = new Files(http, WS_ID);
  });

  describe('list', () => {
    it('pages through bare-array responses until a short page', async () => {
      const fullPage = Array.from({ length: 20 }, (_, i) => ({ id: `f${i}` }));
      http.request
        .mockResolvedValueOnce(fullPage)
        .mockResolvedValueOnce([{ id: 'f20' }]);

      const items = await files.list({ 'metadata.type': 'source' }).toArray();

      expect(items).toHaveLength(21);
      expect(http.request).toHaveBeenCalledTimes(2);
      expect(http.request.mock.calls[0][0]).toMatchObject({
        method: 'GET',
        path: FILES,
        query: { 'metadata.type': 'source', page: 1, limit: 20 },
      });
      expect(http.request.mock.calls[1][0].query.page).toBe(2);
    });
  });

  describe('upload', () => {
    it('posts a private multipart upload and returns the first file', async () => {
      http.post.mockResolvedValueOnce([{ id: 'f1', name: 'test.txt' }]);

      const result = await files.upload(Buffer.from('hello'), {
        filename: 'test.txt',
        metadata: { key: 'value' },
      });

      expect(http.post).toHaveBeenCalledTimes(1);
      const [path, body] = http.post.mock.calls[0];
      expect(path).toBe(FILES);
      const fd = body as FormData;
      expect(fd.get('file')).toBeInstanceOf(Blob);
      expect((fd.get('file') as File).type).toBe('text/plain');
      expect(fd.get('public')).toBe('false');
      expect(fd.get('metadata')).toBe(JSON.stringify({ key: 'value' }));
      expect(fd.has('shareToken')).toBe(false);
      expect(fd.has('expiresAfter')).toBe(false);
      expect(result).toEqual({ id: 'f1', name: 'test.txt' });
    });

    it('works without params', async () => {
      http.post.mockResolvedValueOnce([{ id: 'f2' }]);

      await files.upload(Buffer.from('data'));

      const fd = http.post.mock.calls[0][1] as FormData;
      expect(fd.has('metadata')).toBe(false);
    });

    it('throws when the upload returns no file', async () => {
      http.post.mockResolvedValueOnce([]);

      await expect(files.upload(Buffer.from('data'))).rejects.toBeInstanceOf(PrismeAIError);
    });
  });

  describe('get', () => {
    it('calls GET on the file path', async () => {
      http.get.mockResolvedValueOnce({ id: 'f1' });

      const result = await files.get('f1');

      expect(http.get).toHaveBeenCalledWith(`${FILES}/f1`, undefined);
      expect(result).toEqual({ id: 'f1' });
    });
  });

  describe('delete', () => {
    it('calls DELETE on the file path', async () => {
      await files.delete('f1');

      expect(http.delete).toHaveBeenCalledWith(`${FILES}/f1`, undefined);
    });
  });

  describe('download', () => {
    it('fetches the bytes route of the file storage path', async () => {
      http.get.mockResolvedValueOnce({ id: 'f1', path: `${WS_ID}/f1.my report#1.pdf`, url: 'https://elsewhere/x' });
      const mockResp = new Response('file content');
      http.requestRaw.mockResolvedValueOnce(mockResp);

      const result = await files.download('f1');

      expect(http.get).toHaveBeenCalledWith(`${FILES}/f1`, undefined);
      expect(http.requestRaw).toHaveBeenCalledWith({
        method: 'GET',
        path: `/files/${WS_ID}/f1.my%20report%231.pdf`,
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
// KnowledgeBases
// ---------------------------------------------------------------------------

describe('KnowledgeBases', () => {
  let http: ReturnType<typeof createMockHttpClient>;
  let kbs: KnowledgeBases;

  beforeEach(() => {
    http = createMockHttpClient();
    kbs = new KnowledgeBases(http, WS_ID);
  });

  it('has documents, access and webSources sub-resources', () => {
    expect(kbs.documents).toBeInstanceOf(KBDocuments);
    expect(kbs.access).toBeInstanceOf(KBAccess);
    expect(kbs.webSources).toBeInstanceOf(KBWebSources);
  });

  describe('list', () => {
    it('reads the list envelope and stops on the last page', async () => {
      http.request.mockResolvedValueOnce({
        object: 'list',
        data: [{ id: 'vs_1' }, { id: 'vs_2' }],
        total: 2,
        page: 1,
        limit: 20,
        has_more: false,
      });

      const items = await kbs.list({ search: 'docs' }).toArray();

      expect(items).toEqual([{ id: 'vs_1' }, { id: 'vs_2' }]);
      expect(http.request).toHaveBeenCalledTimes(1);
      expect(http.request.mock.calls[0][0]).toMatchObject({
        method: 'GET',
        path: KB,
        query: { search: 'docs', page: 1, limit: 20 },
      });
    });
  });

  it('create calls POST', async () => {
    const params = { name: 'My KB' };
    http.post.mockResolvedValueOnce({ id: 'vs_1' });

    const result = await kbs.create(params);

    expect(http.post).toHaveBeenCalledWith(KB, params, undefined);
    expect(result).toEqual({ id: 'vs_1' });
  });

  it('get calls GET with optional include', async () => {
    await kbs.get('vs_1', { include: 'processing' });

    expect(http.get).toHaveBeenCalledWith(`${KB}/vs_1`, { include: 'processing' });
  });

  it('update calls PATCH', async () => {
    const params = { name: 'Renamed', crawl_settings: { paused: true } };

    await kbs.update('vs_1', params);

    expect(http.patch).toHaveBeenCalledWith(`${KB}/vs_1`, params);
  });

  it('delete calls DELETE', async () => {
    await kbs.delete('vs_1');

    expect(http.delete).toHaveBeenCalledWith(`${KB}/vs_1`, undefined);
  });

  it('search calls POST on search path', async () => {
    const params = { query: 'hello', limit: 5 };
    http.post.mockResolvedValueOnce({ object: 'list', data: [{ document_id: 'vsf_1', score: 0.9 }] });

    const result = await kbs.search('vs_1', params);

    expect(http.post).toHaveBeenCalledWith(`${KB}/vs_1/search`, params, undefined);
    expect(result.data[0].score).toBe(0.9);
  });

  it('reindex calls POST on reindex path', async () => {
    await kbs.reindex('vs_1', { reset_chunking_overrides: true });

    expect(http.post).toHaveBeenCalledWith(
      `${KB}/vs_1/reindex`,
      { reset_chunking_overrides: true },
      undefined,
    );
  });
});

// ---------------------------------------------------------------------------
// KBDocuments
// ---------------------------------------------------------------------------

describe('KBDocuments', () => {
  let http: ReturnType<typeof createMockHttpClient>;
  let docs: KBDocuments;
  const DOCS = `${KB}/vs_1/documents`;

  beforeEach(() => {
    http = createMockHttpClient();
    docs = new KBDocuments(http, WS_ID);
  });

  it('list paginates the documents path with filters', async () => {
    http.request.mockResolvedValueOnce({ object: 'list', data: [], total: 0, page: 1, limit: 20, has_more: false });

    await docs.list('vs_1', { status: 'failed', 'tags.project': 'x' }).toArray();

    expect(http.request.mock.calls[0][0]).toMatchObject({
      path: DOCS,
      query: { status: 'failed', 'tags.project': 'x' },
    });
  });

  it('add attaches an uploaded file by native_file_id', async () => {
    const params = { native_file_id: 'f1', tags: { project: 'x' } };
    http.post.mockResolvedValueOnce({ id: 'vsf_1' });

    const result = await docs.add('vs_1', params);

    expect(http.post).toHaveBeenCalledWith(DOCS, params, undefined);
    expect(result).toEqual({ id: 'vsf_1' });
  });

  it('get calls GET on the document path', async () => {
    await docs.get('vs_1', 'vsf_1');

    expect(http.get).toHaveBeenCalledWith(`${DOCS}/vsf_1`, undefined);
  });

  it('update calls PATCH on the document path', async () => {
    await docs.update('vs_1', 'vsf_1', { tags: { a: 1 } });

    expect(http.patch).toHaveBeenCalledWith(`${DOCS}/vsf_1`, { tags: { a: 1 } });
  });

  it('delete calls DELETE on the document path', async () => {
    await docs.delete('vs_1', 'vsf_1');

    expect(http.delete).toHaveBeenCalledWith(`${DOCS}/vsf_1`, undefined);
  });

  it('chunks paginates the chunks path', async () => {
    http.request.mockResolvedValueOnce({
      object: 'list',
      data: [{ chunk_index: 0, text: 'chunk' }],
      total: 1,
      page: 1,
      limit: 20,
      has_more: false,
    });

    const chunks = await docs.chunks('vs_1', 'vsf_1').toArray();

    expect(http.request.mock.calls[0][0].path).toBe(`${DOCS}/vsf_1/chunks`);
    expect(chunks).toEqual([{ chunk_index: 0, text: 'chunk' }]);
  });

  it('reindex calls POST on the document reindex path', async () => {
    await docs.reindex('vs_1', 'vsf_1');

    expect(http.post).toHaveBeenCalledWith(`${DOCS}/vsf_1/reindex`, undefined, undefined);
  });
});

// ---------------------------------------------------------------------------
// KBAccess
// ---------------------------------------------------------------------------

describe('KBAccess', () => {
  let http: ReturnType<typeof createMockHttpClient>;
  let access: KBAccess;
  const ACCESS = `${KB}/vs_1/access`;

  beforeEach(() => {
    http = createMockHttpClient();
    access = new KBAccess(http, WS_ID);
  });

  it('list paginates the access path', async () => {
    http.request.mockResolvedValueOnce({ object: 'list', data: [], total: 0, page: 1, limit: 20, has_more: false });

    await access.list('vs_1').toArray();

    expect(http.request.mock.calls[0][0].path).toBe(ACCESS);
  });

  it('grant calls POST on the access path', async () => {
    const params = { principal_type: 'user' as const, principal_id: 'u1', role: 'reader' as const };

    await access.grant('vs_1', params);

    expect(http.post).toHaveBeenCalledWith(ACCESS, params, undefined);
  });

  it('update calls PATCH on the principal path', async () => {
    await access.update('vs_1', 'group', 'g1', { role: 'editor' });

    expect(http.patch).toHaveBeenCalledWith(`${ACCESS}/group/g1`, { role: 'editor' });
  });

  it('revoke calls DELETE on the principal path', async () => {
    await access.revoke('vs_1', 'user', 'u1');

    expect(http.delete).toHaveBeenCalledWith(`${ACCESS}/user/u1`, undefined);
  });
});

// ---------------------------------------------------------------------------
// KBWebSources
// ---------------------------------------------------------------------------

describe('KBWebSources', () => {
  let http: ReturnType<typeof createMockHttpClient>;
  let sources: KBWebSources;
  const SOURCES = `${KB}/vs_1/web_sources`;

  beforeEach(() => {
    http = createMockHttpClient();
    sources = new KBWebSources(http, WS_ID);
  });

  it('list paginates the web sources path', async () => {
    http.request.mockResolvedValueOnce({ object: 'list', data: [], total: 0, page: 1, limit: 20, has_more: false });

    await sources.list('vs_1').toArray();

    expect(http.request.mock.calls[0][0].path).toBe(SOURCES);
  });

  it('add calls POST on the web sources path', async () => {
    const params = { url: 'https://example.com/docs' };

    await sources.add('vs_1', params);

    expect(http.post).toHaveBeenCalledWith(SOURCES, params, undefined);
  });

  it('get calls GET on the seed path', async () => {
    await sources.get('vs_1', 'seed_1');

    expect(http.get).toHaveBeenCalledWith(`${SOURCES}/seed_1`, undefined);
  });

  it('delete calls DELETE on the seed path', async () => {
    await sources.delete('vs_1', 'seed_1');

    expect(http.delete).toHaveBeenCalledWith(`${SOURCES}/seed_1`, undefined);
  });
});

import { BaseResource } from '../../../core/base-resource.js';
import type { HttpClient } from '../../../core/http-client.js';
import type { PageIterator } from '../../../core/pagination.js';
import type {
  KnowledgeBase,
  KnowledgeBaseCreateParams,
  KnowledgeBaseUpdateParams,
  KnowledgeBaseListParams,
  KnowledgeBaseGetParams,
  KnowledgeBaseSearchParams,
  KnowledgeBaseSearchResponse,
  KnowledgeBaseReindexParams,
  KnowledgeBaseReindexResult,
  KnowledgeBaseDeletion,
} from '../../../types/storage/knowledge-bases.js';
import { KBDocuments } from './documents.js';
import { KBAccess } from './access.js';
import { KBWebSources } from './web-sources.js';

export class KnowledgeBases extends BaseResource {
  readonly documents: KBDocuments;
  readonly access: KBAccess;
  readonly webSources: KBWebSources;

  private readonly workspaceId: string;

  constructor(httpClient: HttpClient, workspaceId: string) {
    super(httpClient);
    this.workspaceId = workspaceId;
    this.documents = new KBDocuments(httpClient, workspaceId);
    this.access = new KBAccess(httpClient, workspaceId);
    this.webSources = new KBWebSources(httpClient, workspaceId);
  }

  private path(...segments: string[]): string {
    return this.buildPath(this.workspaceId, 'knowledge_bases', ...segments);
  }

  /** List knowledge bases visible to the caller. */
  list(params?: KnowledgeBaseListParams): PageIterator<KnowledgeBase> {
    return this._paginate<KnowledgeBase>(this.path(), params);
  }

  /** Create a knowledge base. */
  create(params: KnowledgeBaseCreateParams): Promise<KnowledgeBase> {
    return this._post<KnowledgeBase>(this.path(), params);
  }

  /** Get a knowledge base. Pass `{ include: 'processing' }` for live crawl/processing status. */
  get(knowledgeBaseId: string, params?: KnowledgeBaseGetParams): Promise<KnowledgeBase> {
    return this._get<KnowledgeBase>(this.path(knowledgeBaseId), params);
  }

  /** Update knowledge base metadata and crawl settings. */
  update(knowledgeBaseId: string, params: KnowledgeBaseUpdateParams): Promise<KnowledgeBase> {
    return this._patch<KnowledgeBase>(this.path(knowledgeBaseId), params);
  }

  /**
   * Delete a knowledge base in the background, with its documents. Each document's uploaded file is
   * deleted too when no other document uses it and the document's owner uploaded it.
   */
  delete(knowledgeBaseId: string): Promise<KnowledgeBaseDeletion> {
    return this._del<KnowledgeBaseDeletion>(this.path(knowledgeBaseId));
  }

  /** Semantic search over a knowledge base. */
  search(knowledgeBaseId: string, params: KnowledgeBaseSearchParams): Promise<KnowledgeBaseSearchResponse> {
    return this._post<KnowledgeBaseSearchResponse>(this.path(knowledgeBaseId, 'search'), params);
  }

  /** Queue re-processing of every document in a knowledge base. */
  reindex(knowledgeBaseId: string, params?: KnowledgeBaseReindexParams): Promise<KnowledgeBaseReindexResult> {
    return this._post<KnowledgeBaseReindexResult>(this.path(knowledgeBaseId, 'reindex'), params);
  }
}

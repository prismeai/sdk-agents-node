import { BaseResource } from '../../../core/base-resource.js';
import type { HttpClient } from '../../../core/http-client.js';
import type { PageIterator, PaginationParams } from '../../../core/pagination.js';
import type {
  KnowledgeBaseDocument,
  DocumentAddParams,
  DocumentUpdateParams,
  DocumentListParams,
  DocumentReindexParams,
  DocumentChunk,
  DocumentSourceUrl,
  DeleteResult,
} from '../../../types/storage/knowledge-bases.js';

export class KBDocuments extends BaseResource {
  private readonly workspaceId: string;

  constructor(httpClient: HttpClient, workspaceId: string) {
    super(httpClient);
    this.workspaceId = workspaceId;
  }

  private path(knowledgeBaseId: string, ...segments: string[]): string {
    return this.buildPath(this.workspaceId, 'knowledge_bases', knowledgeBaseId, 'documents', ...segments);
  }

  /** List documents in a knowledge base. */
  list(knowledgeBaseId: string, params?: DocumentListParams): PageIterator<KnowledgeBaseDocument> {
    return this._paginate<KnowledgeBaseDocument>(this.path(knowledgeBaseId), params);
  }

  /** Attach a source to a knowledge base (idempotent upsert) and queue its indexing. */
  add(knowledgeBaseId: string, params: DocumentAddParams): Promise<KnowledgeBaseDocument> {
    return this._post<KnowledgeBaseDocument>(this.path(knowledgeBaseId), params);
  }

  /** Get a document, including its indexing status. */
  get(knowledgeBaseId: string, documentId: string): Promise<KnowledgeBaseDocument> {
    return this._get<KnowledgeBaseDocument>(this.path(knowledgeBaseId, documentId));
  }

  /** Update document tags, metadata, expiry or filename. */
  update(knowledgeBaseId: string, documentId: string, params: DocumentUpdateParams): Promise<KnowledgeBaseDocument> {
    return this._patch<KnowledgeBaseDocument>(this.path(knowledgeBaseId, documentId), params);
  }

  /**
   * Remove a document from a knowledge base. Its uploaded file is deleted too when no other document
   * uses it and the document's owner uploaded it: `file_purged` says whether it was.
   */
  delete(knowledgeBaseId: string, documentId: string): Promise<DeleteResult> {
    return this._del<DeleteResult>(this.path(knowledgeBaseId, documentId));
  }

  /** List the chunks of a document. */
  chunks(knowledgeBaseId: string, documentId: string, params?: PaginationParams): PageIterator<DocumentChunk> {
    return this._paginate<DocumentChunk>(this.path(knowledgeBaseId, documentId, 'chunks'), params);
  }

  /** Resolve a link to the document's source; an uploaded file's link expires (`expires_at`), resolve again after. */
  sourceUrl(knowledgeBaseId: string, documentId: string): Promise<DocumentSourceUrl> {
    return this._get<DocumentSourceUrl>(this.path(knowledgeBaseId, documentId, 'source_url'));
  }

  /** Re-run indexing for a document, optionally with new chunking or parser settings. */
  reindex(knowledgeBaseId: string, documentId: string, params?: DocumentReindexParams): Promise<KnowledgeBaseDocument> {
    return this._post<KnowledgeBaseDocument>(this.path(knowledgeBaseId, documentId, 'reindex'), params);
  }
}

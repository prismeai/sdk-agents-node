import { BaseResource } from '../../../core/base-resource.js';
import type { HttpClient } from '../../../core/http-client.js';
import type { PageIterator } from '../../../core/pagination.js';
import type {
  VectorStore,
  VectorStoreCreateParams,
  VectorStoreUpdateParams,
  VectorStoreListParams,
  VectorStoreSearchParams,
  VectorStoreSearchResult,
} from '../../../types/storage/vector-stores.js';
import { VSFiles } from './files.js';
import { VSAccess } from './access.js';

export class VectorStores extends BaseResource {
  readonly files: VSFiles;
  readonly access: VSAccess;

  private readonly workspaceId: string;

  constructor(httpClient: HttpClient, workspaceId: string) {
    super(httpClient);
    this.workspaceId = workspaceId;
    this.files = new VSFiles(httpClient, workspaceId);
    this.access = new VSAccess(httpClient, workspaceId);
  }

  private path(...segments: string[]): string {
    return this.buildPath(this.workspaceId, ...segments);
  }

  /** List vector stores. */
  list(params?: VectorStoreListParams): PageIterator<VectorStore> {
    return this._paginate<VectorStore>(this.path('vector_stores'), params);
  }

  /** Create a new vector store. */
  create(params: VectorStoreCreateParams): Promise<VectorStore> {
    return this._post<VectorStore>(this.path('vector_stores'), params);
  }

  /** Get a vector store by ID. */
  get(vectorStoreId: string): Promise<VectorStore> {
    return this.httpClient.get<VectorStore>(this.path('vector_stores', vectorStoreId));
  }

  /** Update a vector store. */
  update(vectorStoreId: string, params: VectorStoreUpdateParams): Promise<VectorStore> {
    return this._patch<VectorStore>(this.path('vector_stores', vectorStoreId), params);
  }

  /** Delete a vector store. */
  delete(vectorStoreId: string): Promise<void> {
    return this._del<void>(this.path('vector_stores', vectorStoreId));
  }

  /** Search a vector store. */
  search(vectorStoreId: string, params: VectorStoreSearchParams): Promise<VectorStoreSearchResult[]> {
    return this._post<VectorStoreSearchResult[]>(
      this.path('vector_stores', vectorStoreId, 'search'),
      params,
    );
  }

  /** Reindex a vector store. */
  reindex(vectorStoreId: string): Promise<void> {
    return this._post<void>(this.path('vector_stores', vectorStoreId, 'reindex'));
  }

  /** Get crawl status for a vector store. */
  crawlStatus(vectorStoreId: string): Promise<Record<string, unknown>> {
    return this.httpClient.get<Record<string, unknown>>(
      this.path('vector_stores', vectorStoreId, 'crawl_status'),
    );
  }

  /** Trigger a recrawl for a vector store. */
  recrawl(vectorStoreId: string): Promise<void> {
    return this._post<void>(this.path('vector_stores', vectorStoreId, 'recrawl'));
  }
}

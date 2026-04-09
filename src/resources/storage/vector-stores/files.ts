import { BaseResource } from '../../../core/base-resource.js';
import type { HttpClient } from '../../../core/http-client.js';
import type { PageIterator } from '../../../core/pagination.js';
import type {
  VSFile,
  VSFileAddParams,
  VSFileListParams,
  VSFileChunk,
} from '../../../types/storage/vector-stores.js';

export class VSFiles extends BaseResource {
  private readonly workspaceId: string;

  constructor(httpClient: HttpClient, workspaceId: string) {
    super(httpClient);
    this.workspaceId = workspaceId;
  }

  private path(...segments: string[]): string {
    return this.buildPath(this.workspaceId, ...segments);
  }

  /** List files in a vector store. */
  list(vectorStoreId: string, params?: VSFileListParams): PageIterator<VSFile> {
    return this._paginate<VSFile>(
      this.path('vector_stores', vectorStoreId, 'files'),
      params,
    );
  }

  /** Add a file to a vector store. */
  add(vectorStoreId: string, params: VSFileAddParams): Promise<VSFile> {
    return this._post<VSFile>(
      this.path('vector_stores', vectorStoreId, 'files'),
      params,
    );
  }

  /** Update a file in a vector store. */
  update(vectorStoreId: string, fileId: string, params: Partial<VSFileAddParams>): Promise<VSFile> {
    return this._patch<VSFile>(
      this.path('vector_stores', vectorStoreId, 'files', fileId),
      params,
    );
  }

  /** Remove a file from a vector store. */
  delete(vectorStoreId: string, fileId: string): Promise<void> {
    return this._del<void>(
      this.path('vector_stores', vectorStoreId, 'files', fileId),
    );
  }

  /** Get chunks for a file in a vector store. */
  chunks(vectorStoreId: string, fileId: string): Promise<VSFileChunk[]> {
    return this.httpClient.get<VSFileChunk[]>(
      this.path('vector_stores', vectorStoreId, 'files', fileId, 'chunks'),
    );
  }

  /** Reindex a specific file in a vector store. */
  reindex(vectorStoreId: string, fileId: string): Promise<void> {
    return this._post<void>(
      this.path('vector_stores', vectorStoreId, 'files', fileId, 'reindex'),
    );
  }
}

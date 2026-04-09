import { BaseResource } from '../../../core/base-resource.js';
import type { HttpClient } from '../../../core/http-client.js';
import type { PageIterator } from '../../../core/pagination.js';
import type {
  VSAccessEntry,
  VSAccessGrantParams,
  VSAccessUpdateParams,
} from '../../../types/storage/vector-stores.js';

export class VSAccess extends BaseResource {
  private readonly workspaceId: string;

  constructor(httpClient: HttpClient, workspaceId: string) {
    super(httpClient);
    this.workspaceId = workspaceId;
  }

  private path(...segments: string[]): string {
    return this.buildPath(this.workspaceId, ...segments);
  }

  /** List access entries for a vector store. */
  list(vectorStoreId: string): PageIterator<VSAccessEntry> {
    return this._paginate<VSAccessEntry>(
      this.path('vector_stores', vectorStoreId, 'access'),
    );
  }

  /** Grant access to a vector store. */
  grant(vectorStoreId: string, params: VSAccessGrantParams): Promise<VSAccessEntry> {
    return this._post<VSAccessEntry>(
      this.path('vector_stores', vectorStoreId, 'access'),
      params,
    );
  }

  /** Update access for a vector store. */
  update(vectorStoreId: string, accessId: string, params: VSAccessUpdateParams): Promise<VSAccessEntry> {
    return this._patch<VSAccessEntry>(
      this.path('vector_stores', vectorStoreId, 'access', accessId),
      params,
    );
  }

  /** Revoke access to a vector store by principal type and ID. */
  revoke(vectorStoreId: string, principalType: string, principalId: string): Promise<void> {
    return this._del<void>(
      this.path('vector_stores', vectorStoreId, 'access', principalType, principalId),
    );
  }
}

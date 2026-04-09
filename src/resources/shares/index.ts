import { BaseResource } from '../../core/base-resource.js';
import type { HttpClient } from '../../core/http-client.js';
import type { PageIterator } from '../../core/pagination.js';
import type { Share, ShareListParams } from '../../types/shares.js';

export class Shares extends BaseResource {
  private readonly workspaceId: string;

  constructor(httpClient: HttpClient, workspaceId: string) {
    super(httpClient);
    this.workspaceId = workspaceId;
  }

  private path(...segments: string[]): string {
    return this.buildPath(this.workspaceId, ...segments);
  }

  list(params?: ShareListParams): PageIterator<Share> {
    return this._paginate<Share>(this.path('shares'), params);
  }

  get(shareId: string): Promise<Share> {
    return this.httpClient.get<Share>(this.path('shares', shareId));
  }
}

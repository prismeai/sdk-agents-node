import { BaseResource } from '../../core/base-resource.js';
import type { HttpClient } from '../../core/http-client.js';
import type { PageIterator } from '../../core/pagination.js';
import type { Timestamp } from '../../types/common.js';

export interface ActivityEntry {
  id: string;
  type: string;
  agentId?: string;
  userId?: string;
  description?: string;
  createdAt?: Timestamp;
  [key: string]: unknown;
}

export interface ActivityListParams {
  page?: number;
  limit?: number;
  agentId?: string;
  type?: string;
}

export class Activity extends BaseResource {
  private readonly workspaceId: string;

  constructor(httpClient: HttpClient, workspaceId: string) {
    super(httpClient);
    this.workspaceId = workspaceId;
  }

  private path(...segments: string[]): string {
    return this.buildPath(this.workspaceId, ...segments);
  }

  /** List recent activity. */
  list(params?: ActivityListParams): PageIterator<ActivityEntry> {
    return this._paginate<ActivityEntry>(this.path('activity'), params);
  }
}

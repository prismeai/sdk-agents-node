import { BaseResource } from '../../core/base-resource.js';
import type { HttpClient } from '../../core/http-client.js';
import type { StorageStats, StatsParams } from '../../types/storage/stats.js';

export class Stats extends BaseResource {
  private readonly workspaceId: string;

  constructor(httpClient: HttpClient, workspaceId: string) {
    super(httpClient);
    this.workspaceId = workspaceId;
  }

  private path(...segments: string[]): string {
    return this.buildPath(this.workspaceId, ...segments);
  }

  /** Get storage statistics. */
  get(params?: StatsParams): Promise<StorageStats> {
    return this.httpClient.get<StorageStats>(
      this.path('stats'),
      params as Record<string, unknown>,
    );
  }
}

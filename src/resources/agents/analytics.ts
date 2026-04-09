import { BaseResource } from '../../core/base-resource.js';
import type { HttpClient } from '../../core/http-client.js';
import type { AnalyticsParams, AnalyticsResponse } from '../../types/analytics.js';

export class Analytics extends BaseResource {
  private readonly workspaceId: string;

  constructor(httpClient: HttpClient, workspaceId: string) {
    super(httpClient);
    this.workspaceId = workspaceId;
  }

  private path(...segments: string[]): string {
    return this.buildPath(this.workspaceId, ...segments);
  }

  /** Get analytics for an agent. */
  get(agentId: string, params?: AnalyticsParams): Promise<AnalyticsResponse> {
    return this.httpClient.get<AnalyticsResponse>(this.path('agents', agentId, 'analytics'), params as Record<string, unknown>);
  }
}

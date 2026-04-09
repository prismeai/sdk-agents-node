import { BaseResource } from '../../core/base-resource.js';
import type { HttpClient } from '../../core/http-client.js';
import type { PageIterator } from '../../core/pagination.js';
import type { Agent } from '../../types/agents.js';

export interface OrgAgentListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export class Orgs extends BaseResource {
  private readonly workspaceId: string;

  constructor(httpClient: HttpClient, workspaceId: string) {
    super(httpClient);
    this.workspaceId = workspaceId;
  }

  private path(...segments: string[]): string {
    return this.buildPath(this.workspaceId, ...segments);
  }

  /** List agents available in the organization. */
  listAgents(orgSlug: string, params?: OrgAgentListParams): PageIterator<Agent> {
    return this._paginate<Agent>(this.path('orgs', orgSlug, 'agents'), params);
  }
}

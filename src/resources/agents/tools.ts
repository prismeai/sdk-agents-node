import { BaseResource } from '../../core/base-resource.js';
import type { HttpClient } from '../../core/http-client.js';
import type { PageIterator } from '../../core/pagination.js';
import type { Tool, ToolCreateParams, ToolListParams } from '../../types/tools.js';

export class Tools extends BaseResource {
  private readonly workspaceSlug: string;

  constructor(httpClient: HttpClient, workspaceSlug: string) {
    super(httpClient);
    this.workspaceSlug = workspaceSlug;
  }

  private path(...segments: string[]): string {
    return this.buildPath(this.workspaceSlug, ...segments);
  }

  /** List tools for an agent. */
  list(agentId: string, params?: ToolListParams): PageIterator<Tool> {
    return this._paginate<Tool>(this.path('agents', agentId, 'tools'), params);
  }

  /** Create a new tool for an agent. */
  create(agentId: string, params: ToolCreateParams): Promise<Tool> {
    return this._post<Tool>(this.path('agents', agentId, 'tools'), params);
  }

  /** Get a tool by ID. */
  get(agentId: string, toolId: string): Promise<Tool> {
    return this.httpClient.get<Tool>(this.path('agents', agentId, 'tools', toolId));
  }

  /** Delete a tool. */
  delete(agentId: string, toolId: string): Promise<void> {
    return this._del<void>(this.path('agents', agentId, 'tools', toolId));
  }
}

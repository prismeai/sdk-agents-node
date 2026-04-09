import { BaseResource } from '../../core/base-resource.js';
import type { HttpClient } from '../../core/http-client.js';
import type { PageIterator } from '../../core/pagination.js';
import type {
  AccessEntry,
  AccessGrantParams,
  AccessRequest,
  AccessRequestHandleParams,
  AccessListParams,
} from '../../types/access.js';

export class Access extends BaseResource {
  private readonly workspaceId: string;

  constructor(httpClient: HttpClient, workspaceId: string) {
    super(httpClient);
    this.workspaceId = workspaceId;
  }

  private path(...segments: string[]): string {
    return this.buildPath(this.workspaceId, ...segments);
  }

  /** List access entries for an agent. */
  list(agentId: string, params?: AccessListParams): PageIterator<AccessEntry> {
    return this._paginate<AccessEntry>(this.path('agents', agentId, 'access'), params);
  }

  /** Grant access to an agent. */
  grant(agentId: string, params: AccessGrantParams): Promise<AccessEntry> {
    return this._post<AccessEntry>(this.path('agents', agentId, 'access'), params);
  }

  /** Revoke access by principal type and ID. */
  revoke(agentId: string, principalType: string, principalId: string): Promise<void> {
    return this._del<void>(this.path('agents', agentId, 'access', principalType, principalId));
  }

  /** Request access to an agent. */
  requestAccess(agentId: string): Promise<AccessRequest> {
    return this._post<AccessRequest>(this.path('agents', agentId, 'access', 'request'));
  }

  /** List access requests for an agent. */
  listRequests(agentId: string, params?: AccessListParams): PageIterator<AccessRequest> {
    return this._paginate<AccessRequest>(this.path('agents', agentId, 'access', 'requests'), params);
  }

  /** Handle an access request (approve/reject). */
  handleRequest(agentId: string, requestId: string, params: AccessRequestHandleParams): Promise<AccessRequest> {
    return this._post<AccessRequest>(
      this.path('agents', agentId, 'access', 'requests', requestId),
      params,
    );
  }
}

import { BaseResource } from '../../core/base-resource.js';
import type { HttpClient } from '../../core/http-client.js';
import type { PageIterator } from '../../core/pagination.js';
import type {
  Agent,
  AgentCreateParams,
  AgentUpdateParams,
  AgentListParams,
} from '../../types/agents.js';
import { Messages } from './messages.js';
import { Conversations } from './conversations.js';
import { Tools } from './tools.js';
import { Access } from './access.js';
import { Analytics } from './analytics.js';
import { Evaluations } from './evaluations.js';
import { A2A } from './a2a.js';

export class Agents extends BaseResource {
  readonly messages: Messages;
  readonly conversations: Conversations;
  readonly tools: Tools;
  readonly access: Access;
  readonly analytics: Analytics;
  readonly evaluations: Evaluations;
  readonly a2a: A2A;

  private readonly workspaceId: string;

  constructor(httpClient: HttpClient, workspaceId: string) {
    super(httpClient);
    this.workspaceId = workspaceId;
    this.messages = new Messages(httpClient, workspaceId);
    this.conversations = new Conversations(httpClient, workspaceId);
    this.tools = new Tools(httpClient, workspaceId);
    this.access = new Access(httpClient, workspaceId);
    this.analytics = new Analytics(httpClient, workspaceId);
    this.evaluations = new Evaluations(httpClient, workspaceId);
    this.a2a = new A2A(httpClient, workspaceId);
  }

  private path(...segments: string[]): string {
    return this.buildPath(this.workspaceId, ...segments);
  }

  /** List all agents. */
  list(params?: AgentListParams): PageIterator<Agent> {
    return this._paginate<Agent>(this.path('agents'), params);
  }

  /** Create a new agent. */
  create(params: AgentCreateParams): Promise<Agent> {
    return this._post<Agent>(this.path('agents'), params);
  }

  /** Get an agent by ID. */
  get(agentId: string): Promise<Agent> {
    return this.httpClient.get<Agent>(this.path('agents', agentId));
  }

  /** Update an agent. */
  update(agentId: string, params: AgentUpdateParams): Promise<Agent> {
    return this._patch<Agent>(this.path('agents', agentId), params);
  }

  /** Delete an agent. */
  delete(agentId: string): Promise<void> {
    return this._del<void>(this.path('agents', agentId));
  }

  /** Publish an agent (promote draft to published). */
  publish(agentId: string): Promise<Agent> {
    return this._post<Agent>(this.path('agents', agentId, 'publish'));
  }

  /** Discard the current draft. */
  discardDraft(agentId: string): Promise<Agent> {
    return this._post<Agent>(this.path('agents', agentId, 'discard-draft'));
  }

  /** List agents in discovery (public/shared agents). */
  discovery(params?: { page?: number; limit?: number; search?: string }): PageIterator<Agent> {
    return this._paginate<Agent>(this.path('agents', 'discovery'), params);
  }

  /** Export an agent configuration. */
  export(agentId: string): Promise<Record<string, unknown>> {
    return this.httpClient.get<Record<string, unknown>>(this.path('agents', agentId, 'export'));
  }

  /** Import an agent from AGENTS.md format (YAML front matter + markdown instructions). */
  import(agentsMd: string): Promise<Agent> {
    return this._post<Agent>(this.path('agents', 'import'), { agents_md: agentsMd });
  }
}

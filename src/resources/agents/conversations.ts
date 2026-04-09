import { BaseResource } from '../../core/base-resource.js';
import type { HttpClient } from '../../core/http-client.js';
import type { PageIterator } from '../../core/pagination.js';
import type {
  Conversation,
  ConversationCreateParams,
  ConversationUpdateParams,
  ConversationListParams,
  ConversationShareParams,
} from '../../types/conversations.js';

export class Conversations extends BaseResource {
  private readonly workspaceSlug: string;

  constructor(httpClient: HttpClient, workspaceSlug: string) {
    super(httpClient);
    this.workspaceSlug = workspaceSlug;
  }

  private path(agentId: string, ...segments: string[]): string {
    return this.buildPath(this.workspaceSlug, 'agents', agentId, 'conversations', ...segments);
  }

  /** List conversations for an agent. */
  list(agentId: string, params?: ConversationListParams): PageIterator<Conversation> {
    return this._paginate<Conversation>(this.path(agentId), params);
  }

  /** Create a new conversation for an agent. */
  async create(agentId: string, params?: ConversationCreateParams): Promise<Conversation> {
    const result = await this._post<Conversation>(this.path(agentId), params);
    // API returns contextId — normalize to id
    if (!result.id && result.contextId) {
      result.id = result.contextId;
    }
    return result;
  }

  /** Get a conversation by ID. */
  get(agentId: string, conversationId: string): Promise<Conversation> {
    return this.httpClient.get<Conversation>(this.path(agentId, conversationId));
  }

  /** Update a conversation. */
  update(agentId: string, conversationId: string, params: ConversationUpdateParams): Promise<Conversation> {
    return this._patch<Conversation>(this.path(agentId, conversationId), params);
  }

  /** Delete a conversation. */
  delete(agentId: string, conversationId: string): Promise<void> {
    return this._del<void>(this.path(agentId, conversationId));
  }

  /** Share a conversation. */
  share(agentId: string, conversationId: string, params: ConversationShareParams): Promise<void> {
    return this._post<void>(this.path(agentId, conversationId, 'share'), params);
  }
}

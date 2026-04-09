import { BaseResource } from '../../core/base-resource.js';
import type { HttpClient } from '../../core/http-client.js';
import { SSEStream } from '../../core/streaming.js';
import type {
  A2ASendParams,
  A2AResponse,
  A2ACard,
  A2AExtendedCard,
  A2AStreamEvent,
} from '../../types/a2a.js';

let _reqId = 0;
function nextId(): string {
  return `req-${++_reqId}`;
}

export class A2A extends BaseResource {
  private readonly workspaceId: string;

  constructor(httpClient: HttpClient, workspaceId: string) {
    super(httpClient);
    this.workspaceId = workspaceId;
  }

  private path(...segments: string[]): string {
    return this.buildPath(this.workspaceId, ...segments);
  }

  /** Send a message via A2A protocol (JSON-RPC 2.0). */
  send(agentId: string, params: A2ASendParams): Promise<A2AResponse> {
    return this._post<A2AResponse>(this.path('agents', agentId, 'a2a'), {
      jsonrpc: '2.0',
      method: 'tasks/send',
      params,
      id: nextId(),
    });
  }

  /** Send a message and subscribe to SSE events (A2A protocol, JSON-RPC 2.0). */
  async sendSubscribe(agentId: string, params: A2ASendParams): Promise<SSEStream<A2AStreamEvent>> {
    const controller = new AbortController();
    const response = await this.httpClient.requestRaw({
      method: 'POST',
      path: this.path('agents', agentId, 'a2a'),
      body: {
        jsonrpc: '2.0',
        method: 'tasks/sendSubscribe',
        params,
        id: nextId(),
      },
      headers: {
        accept: 'text/event-stream',
      },
      signal: controller.signal,
    });

    return new SSEStream<A2AStreamEvent>(response, controller);
  }

  /** Get the A2A agent card (.well-known/agent.json). */
  getCard(agentId: string): Promise<A2ACard> {
    return this.httpClient.get<A2ACard>(this.path('agents', agentId, '.well-known', 'agent.json'));
  }

  /** Get the extended A2A agent card with tools and sub-agents. */
  getExtendedCard(agentId: string): Promise<A2AExtendedCard> {
    return this.httpClient.get<A2AExtendedCard>(this.path('agents', agentId, 'extendedAgentCard'));
  }
}

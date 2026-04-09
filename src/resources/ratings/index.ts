import { BaseResource } from '../../core/base-resource.js';
import type { HttpClient } from '../../core/http-client.js';

export interface RatingCreateParams {
  conversationId?: string;
  messageId?: string;
  rating: number;
  feedback?: string;
}

export interface Rating {
  id: string;
  rating: number;
  feedback?: string;
  [key: string]: unknown;
}

export class Ratings extends BaseResource {
  private readonly workspaceSlug: string;

  constructor(httpClient: HttpClient, workspaceSlug: string) {
    super(httpClient);
    this.workspaceSlug = workspaceSlug;
  }

  private path(agentId: string, ...segments: string[]): string {
    return this.buildPath(this.workspaceSlug, 'agents', agentId, 'ratings', ...segments);
  }

  /** Submit a rating for an agent response. */
  create(agentId: string, params: RatingCreateParams): Promise<Rating> {
    return this._post<Rating>(this.path(agentId), params);
  }
}

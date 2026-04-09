import { BaseResource } from '../../core/base-resource.js';
import type { HttpClient } from '../../core/http-client.js';
import type { PageIterator } from '../../core/pagination.js';
import type { Timestamp } from '../../types/common.js';

export interface Evaluation {
  id: string;
  agentId: string;
  name?: string;
  status?: string;
  results?: Record<string, unknown>;
  createdAt?: Timestamp;
  [key: string]: unknown;
}

export interface EvaluationCreateParams {
  name?: string;
  dataset?: Array<{ input: string; expectedOutput?: string }>;
  config?: Record<string, unknown>;
}

export interface EvaluationListParams {
  page?: number;
  limit?: number;
}

export class Evaluations extends BaseResource {
  private readonly workspaceId: string;

  constructor(httpClient: HttpClient, workspaceId: string) {
    super(httpClient);
    this.workspaceId = workspaceId;
  }

  private path(...segments: string[]): string {
    return this.buildPath(this.workspaceId, ...segments);
  }

  /** List evaluations for an agent. */
  list(agentId: string, params?: EvaluationListParams): PageIterator<Evaluation> {
    return this._paginate<Evaluation>(this.path('agents', agentId, 'evaluations'), params);
  }

  /** Create a new evaluation. */
  create(agentId: string, params: EvaluationCreateParams): Promise<Evaluation> {
    return this._post<Evaluation>(this.path('agents', agentId, 'evaluations'), params);
  }
}

import { BaseResource } from '../../core/base-resource.js';
import type { HttpClient } from '../../core/http-client.js';
import type { PageIterator } from '../../core/pagination.js';
import type { Task, TaskListParams } from '../../types/tasks.js';

export class Tasks extends BaseResource {
  private readonly workspaceSlug: string;

  constructor(httpClient: HttpClient, workspaceSlug: string) {
    super(httpClient);
    this.workspaceSlug = workspaceSlug;
  }

  private path(agentId: string, ...segments: string[]): string {
    return this.buildPath(this.workspaceSlug, 'agents', agentId, 'tasks', ...segments);
  }

  /** List tasks for an agent. */
  list(agentId: string, params?: TaskListParams): PageIterator<Task> {
    return this._paginate<Task>(this.path(agentId), params);
  }

  /** Get a task by ID. */
  get(agentId: string, taskId: string): Promise<Task> {
    return this.httpClient.get<Task>(this.path(agentId, taskId));
  }

  /** Cancel a running task. */
  cancel(agentId: string, taskId: string): Promise<Task> {
    return this._post<Task>(this.path(agentId, taskId, 'cancel'));
  }
}

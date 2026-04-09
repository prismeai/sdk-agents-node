import { BaseResource } from '../../core/base-resource.js';
import type { HttpClient } from '../../core/http-client.js';
import type { PageIterator } from '../../core/pagination.js';

export interface Profile {
  id: string;
  name?: string;
  email?: string;
  photo?: string;
  [key: string]: unknown;
}

export interface ProfileListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export class Profiles extends BaseResource {
  private readonly workspaceId: string;

  constructor(httpClient: HttpClient, workspaceId: string) {
    super(httpClient);
    this.workspaceId = workspaceId;
  }

  private path(...segments: string[]): string {
    return this.buildPath(this.workspaceId, ...segments);
  }

  /** List user profiles. */
  list(params?: ProfileListParams): PageIterator<Profile> {
    return this._paginate<Profile>(this.path('profiles'), params);
  }
}

import { BaseResource } from '../../core/base-resource.js';
import type { HttpClient } from '../../core/http-client.js';
import type { PageIterator } from '../../core/pagination.js';
import type {
  Skill,
  SkillCreateParams,
  SkillUpdateParams,
  SkillListParams,
} from '../../types/storage/skills.js';

export class Skills extends BaseResource {
  private readonly workspaceId: string;

  constructor(httpClient: HttpClient, workspaceId: string) {
    super(httpClient);
    this.workspaceId = workspaceId;
  }

  private path(...segments: string[]): string {
    return this.buildPath(this.workspaceId, ...segments);
  }

  list(params?: SkillListParams): PageIterator<Skill> {
    return this._paginate<Skill>(this.path('skills'), params);
  }

  create(params: SkillCreateParams): Promise<Skill> {
    return this._post<Skill>(this.path('skills'), params);
  }

  get(skillId: string): Promise<Skill> {
    return this.httpClient.get<Skill>(this.path('skills', skillId));
  }

  update(skillId: string, params: SkillUpdateParams): Promise<Skill> {
    return this._patch<Skill>(this.path('skills', skillId), params);
  }

  delete(skillId: string): Promise<void> {
    return this._del<void>(this.path('skills', skillId));
  }
}

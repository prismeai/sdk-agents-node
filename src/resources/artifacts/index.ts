import { BaseResource } from '../../core/base-resource.js';
import type { HttpClient } from '../../core/http-client.js';
import type { PageIterator } from '../../core/pagination.js';
import type {
  Artifact,
  ArtifactUpdateParams,
  ArtifactListParams,
  ArtifactShareParams,
} from '../../types/artifacts.js';

export class Artifacts extends BaseResource {
  private readonly workspaceId: string;

  constructor(httpClient: HttpClient, workspaceId: string) {
    super(httpClient);
    this.workspaceId = workspaceId;
  }

  private path(...segments: string[]): string {
    return this.buildPath(this.workspaceId, ...segments);
  }

  list(params?: ArtifactListParams): PageIterator<Artifact> {
    return this._paginate<Artifact>(this.path('artifacts'), params);
  }

  get(artifactId: string): Promise<Artifact> {
    return this.httpClient.get<Artifact>(this.path('artifacts', artifactId));
  }

  update(artifactId: string, params: ArtifactUpdateParams): Promise<Artifact> {
    return this._patch<Artifact>(this.path('artifacts', artifactId), params);
  }

  delete(artifactId: string): Promise<void> {
    return this._del<void>(this.path('artifacts', artifactId));
  }

  share(artifactId: string, params: ArtifactShareParams): Promise<void> {
    return this._post<void>(this.path('artifacts', artifactId, 'share'), params);
  }
}

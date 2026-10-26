import { BaseResource } from '../../../core/base-resource.js';
import type { HttpClient } from '../../../core/http-client.js';
import type { PageIterator, PaginationParams } from '../../../core/pagination.js';
import type {
  KnowledgeBaseAccessBinding,
  KnowledgeBaseAccessGrantParams,
  KnowledgeBaseAccessUpdateParams,
  PrincipalType,
  DeleteResult,
} from '../../../types/storage/knowledge-bases.js';

export class KBAccess extends BaseResource {
  private readonly workspaceId: string;

  constructor(httpClient: HttpClient, workspaceId: string) {
    super(httpClient);
    this.workspaceId = workspaceId;
  }

  private path(knowledgeBaseId: string, ...segments: string[]): string {
    return this.buildPath(this.workspaceId, 'knowledge_bases', knowledgeBaseId, 'access', ...segments);
  }

  /** List access bindings of a knowledge base. */
  list(knowledgeBaseId: string, params?: PaginationParams): PageIterator<KnowledgeBaseAccessBinding> {
    return this._paginate<KnowledgeBaseAccessBinding>(this.path(knowledgeBaseId), params);
  }

  /** Grant a role to a principal (re-granting updates the role). */
  grant(knowledgeBaseId: string, params: KnowledgeBaseAccessGrantParams): Promise<KnowledgeBaseAccessBinding> {
    return this._post<KnowledgeBaseAccessBinding>(this.path(knowledgeBaseId), params);
  }

  /** Change a principal's role. */
  update(
    knowledgeBaseId: string,
    principalType: PrincipalType,
    principalId: string,
    params: KnowledgeBaseAccessUpdateParams,
  ): Promise<KnowledgeBaseAccessBinding> {
    return this._patch<KnowledgeBaseAccessBinding>(
      this.path(knowledgeBaseId, principalType, principalId),
      params,
    );
  }

  /** Revoke a principal's access. */
  revoke(knowledgeBaseId: string, principalType: PrincipalType, principalId: string): Promise<DeleteResult> {
    return this._del<DeleteResult>(this.path(knowledgeBaseId, principalType, principalId));
  }
}

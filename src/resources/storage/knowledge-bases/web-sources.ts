import { BaseResource } from '../../../core/base-resource.js';
import type { HttpClient } from '../../../core/http-client.js';
import type { PageIterator } from '../../../core/pagination.js';
import type { WebSource, WebSourceAddParams } from '../../../types/storage/knowledge-bases.js';

export class KBWebSources extends BaseResource {
  private readonly workspaceId: string;

  constructor(httpClient: HttpClient, workspaceId: string) {
    super(httpClient);
    this.workspaceId = workspaceId;
  }

  private path(knowledgeBaseId: string, ...segments: string[]): string {
    return this.buildPath(this.workspaceId, 'knowledge_bases', knowledgeBaseId, 'web_sources', ...segments);
  }

  /** List the recurring crawl sources of a knowledge base. */
  list(knowledgeBaseId: string): PageIterator<WebSource> {
    return this._paginate<WebSource>(this.path(knowledgeBaseId));
  }

  /** Register a start URL to crawl (re-adding a registered URL returns the existing source). */
  add(knowledgeBaseId: string, params: WebSourceAddParams): Promise<WebSource> {
    return this._post<WebSource>(this.path(knowledgeBaseId), params);
  }

  /** Get a crawl source with its page metrics. */
  get(knowledgeBaseId: string, webSourceId: string): Promise<WebSource> {
    return this._get<WebSource>(this.path(knowledgeBaseId, webSourceId));
  }

  /** Delete a crawl source and the pages it discovered. */
  delete(knowledgeBaseId: string, webSourceId: string): Promise<void> {
    return this._del<void>(this.path(knowledgeBaseId, webSourceId));
  }
}

import type { HttpClient } from '../../core/http-client.js';
import { Files } from './files.js';
import { KnowledgeBases } from './knowledge-bases/index.js';
import { Skills } from './skills.js';
import { Stats } from './stats.js';

/**
 * Storage namespace — groups all storage-related resources.
 */
export class Storage {
  readonly files: Files;
  readonly knowledgeBases: KnowledgeBases;
  readonly skills: Skills;
  readonly stats: Stats;

  constructor(httpClient: HttpClient, workspaceId: string) {
    this.files = new Files(httpClient, workspaceId);
    this.knowledgeBases = new KnowledgeBases(httpClient, workspaceId);
    this.skills = new Skills(httpClient, workspaceId);
    this.stats = new Stats(httpClient, workspaceId);
  }
}

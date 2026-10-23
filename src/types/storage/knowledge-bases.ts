// Timestamps on this API are Unix seconds.

export type KnowledgeBaseRole = 'owner' | 'admin' | 'editor' | 'reader';
export type PrincipalType = 'user' | 'group' | 'org' | 'agent';
export type DocumentSourceType = 'uploaded_file' | 'remote_file' | 'web_page' | 'connector_document';
export type DocumentStatus = 'queued' | 'in_progress' | 'completed' | 'failed' | 'fetch_expired' | 'rejected';

export interface KnowledgeBase {
  id: string;
  object: 'knowledge_base';
  name: string;
  description?: string;
  provider: string;
  embedding: { model: string; dimensions: number };
  chunking_strategy?: Record<string, unknown>;
  parser?: string | null;
  status: 'creating' | 'active' | 'failed' | 'deleting';
  document_counts?: Record<string, number>;
  owner: { type: 'user' | 'agent' | 'org'; id: string };
  owner_org_slug: string;
  agent_id?: string | null;
  role?: KnowledgeBaseRole | null;
  permissions?: Array<'read' | 'write' | 'share' | 'delete'>;
  /** Populated when retrieved with `include: 'processing'`. */
  processing?: Record<string, unknown>;
  crawl_settings?: KnowledgeBaseCrawlSettings;
  web_source_count?: number;
  created_at: number;
  updated_at?: number;
  [key: string]: unknown;
}

export interface KnowledgeBaseCrawlSettings {
  webpages_limit?: number | null;
  /** Seconds between crawls; `null` = manual only. */
  periodicity?: number | null;
  paused?: boolean;
}

export interface KnowledgeBaseCreateParams {
  name: string;
  description?: string;
  provider?: string;
  embedding?: { model?: string; dimensions?: number };
  chunking_strategy?: Record<string, unknown>;
  parser?: string;
  file_parsing?: { image?: string; audio?: string; document?: string };
  agent_id?: string;
  expires_after?: Record<string, unknown>;
}

export interface KnowledgeBaseUpdateParams {
  name?: string;
  description?: string;
  chunking_strategy?: Record<string, unknown>;
  parser?: string;
  file_parsing?: { image?: string; audio?: string; document?: string };
  crawl_settings?: KnowledgeBaseCrawlSettings;
}

export interface KnowledgeBaseListParams {
  page?: number;
  limit?: number;
  name?: string;
  search?: string;
  agent_id?: string;
  /** Comma-separated: `owned`, `shared`, `all`, `agents`. */
  scope?: string;
  status?: KnowledgeBase['status'];
}

export interface KnowledgeBaseGetParams {
  include?: 'processing';
}

export interface KnowledgeBaseSearchParams {
  query: string;
  limit?: number;
  min_score?: number;
  filter?: Record<string, unknown>;
  scope?: 'knowledge' | 'conversation';
  conversation_id?: string;
}

export interface KnowledgeBaseSearchHit {
  document_id: string;
  filename?: string | null;
  source_type: DocumentSourceType;
  source_url: string | null;
  citation_url?: string | null;
  native_file_id?: string | null;
  score: number;
  content: Array<{ type: 'text'; text: string }>;
  attributes?: Record<string, unknown>;
  tags?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface KnowledgeBaseSearchResponse {
  object: 'list';
  data: KnowledgeBaseSearchHit[];
}

export interface KnowledgeBaseReindexParams {
  reset_chunking_overrides?: boolean;
}

export interface KnowledgeBaseReindexResult {
  object: 'knowledge_base.reindex';
  knowledge_base_id: string;
  status: 'dispatching' | 'complete';
  documents_queued: number;
}

// Documents
export interface KnowledgeBaseDocument {
  id: string;
  object: 'knowledge_base.document';
  knowledge_base_id: string;
  source_type: DocumentSourceType;
  source_key: string;
  source_url: string;
  native_file_id?: string | null;
  origin: 'user' | 'web_source';
  web_source_id?: string | null;
  status: DocumentStatus;
  filename?: string | null;
  mime_type?: string | null;
  bytes?: number | null;
  scope?: 'knowledge' | 'conversation';
  tags?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  chunks_count?: number | null;
  last_error?: { code?: string; message?: string; details?: Record<string, unknown> } | null;
  indexed_at?: number | null;
  created_at: number;
  updated_at?: number;
  [key: string]: unknown;
}

export interface DocumentAddParams {
  source_type?: DocumentSourceType;
  /** Id of a file uploaded with `client.storage.files.upload()`. */
  native_file_id?: string;
  native_file_workspace_id?: string;
  source_url?: string;
  fetch_url?: string;
  content?: string;
  filename?: string;
  mime_type?: string;
  bytes?: number;
  chunking_strategy?: Record<string, unknown>;
  agent_id?: string;
  scope?: 'knowledge' | 'conversation';
  conversation_id?: string;
  expires_at?: number;
  tags?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface DocumentUpdateParams {
  tags?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  expires_at?: number | null;
  filename?: string;
}

export interface DocumentListParams {
  page?: number;
  limit?: number;
  /** One status or a comma-separated list. */
  status?: string;
  source_type?: DocumentSourceType;
  origin?: 'user' | 'web_source';
  web_source_id?: string;
  scope?: 'knowledge' | 'conversation';
  conversation_id?: string;
  owner_user_id?: string;
  search?: string;
  updated_before?: number;
  /** Filter on a document tag, e.g. `{ 'tags.project': 'x' }`. */
  [tagFilter: `tags.${string}`]: string | undefined;
}

export interface DocumentReindexParams {
  chunking_strategy?: Record<string, unknown>;
  parser?: string;
  reason?: string;
}

export interface DocumentSourceUrl {
  object: 'document.source_url';
  document_id: string;
  source_type: DocumentSourceType;
  url: string;
  /** Unix seconds; set for a short-lived uploaded-file link, null otherwise. */
  expires_at: number | null;
}

export interface DocumentChunk {
  chunk_index: number;
  text: string;
  page?: number | null;
  start_char?: number | null;
  end_char?: number | null;
  metadata?: Record<string, unknown>;
}

// Access
export interface KnowledgeBaseAccessBinding {
  object: 'knowledge_base.access_binding';
  knowledge_base_id: string;
  principal_type: PrincipalType;
  principal_id: string;
  role: KnowledgeBaseRole;
  email?: string | null;
  created_at: number;
  updated_at?: number;
  [key: string]: unknown;
}

export interface KnowledgeBaseAccessGrantParams {
  principal_type: PrincipalType;
  principal_id: string;
  role: Exclude<KnowledgeBaseRole, 'owner'>;
}

export interface KnowledgeBaseAccessUpdateParams {
  role: Exclude<KnowledgeBaseRole, 'owner'>;
}

// Web sources
export interface WebSource {
  id: string;
  object: 'knowledge_base.web_source';
  knowledge_base_id: string;
  url: string;
  crawler_options?: Record<string, unknown> | null;
  metrics?: Record<string, unknown>;
  created_at: number;
  updated_at?: number;
  [key: string]: unknown;
}

export interface WebSourceAddParams {
  url: string;
  crawler_options?: Record<string, unknown>;
}

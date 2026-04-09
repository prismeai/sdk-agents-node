import type { Timestamp } from '../common.js';

export interface VectorStore {
  id: string;
  name: string;
  description?: string;
  status?: string;
  documentCount?: number;
  config?: VectorStoreConfig;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  [key: string]: unknown;
}

export interface VectorStoreConfig {
  embeddingModel?: string;
  chunkSize?: number;
  chunkOverlap?: number;
  [key: string]: unknown;
}

export interface VectorStoreCreateParams {
  name: string;
  description?: string;
  config?: VectorStoreConfig;
}

export interface VectorStoreUpdateParams {
  name?: string;
  description?: string;
  config?: VectorStoreConfig;
}

export interface VectorStoreListParams {
  page?: number;
  limit?: number;
}

export interface VectorStoreSearchParams {
  query: string;
  limit?: number;
  filters?: Record<string, unknown>;
  scoreThreshold?: number;
}

export interface VectorStoreSearchResult {
  id: string;
  content: string;
  score: number;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

// Vector Store Files
export interface VSFile {
  id: string;
  name: string;
  vectorStoreId: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  chunkCount?: number;
  createdAt?: Timestamp;
  [key: string]: unknown;
}

export interface VSFileAddParams {
  fileId?: string;
  url?: string;
  content?: string;
  name?: string;
  metadata?: Record<string, unknown>;
}

export interface VSFileListParams {
  page?: number;
  limit?: number;
}

export interface VSFileChunk {
  id: string;
  content: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

// Vector Store Access
export interface VSAccessEntry {
  id: string;
  userId?: string;
  email?: string;
  role: string;
  [key: string]: unknown;
}

export interface VSAccessGrantParams {
  email?: string;
  userId?: string;
  role: string;
}

export interface VSAccessUpdateParams {
  role: string;
}

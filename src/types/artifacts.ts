import type { Timestamp } from './common.js';

export interface Artifact {
  id: string;
  name?: string;
  type?: string;
  content?: unknown;
  conversationId?: string;
  taskId?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  [key: string]: unknown;
}

export interface ArtifactUpdateParams {
  name?: string;
  content?: unknown;
  [key: string]: unknown;
}

export interface ArtifactListParams {
  page?: number;
  limit?: number;
  conversationId?: string;
}

export interface ArtifactShareParams {
  public?: boolean;
  users?: string[];
}

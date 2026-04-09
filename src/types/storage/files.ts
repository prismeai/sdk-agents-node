import type { Timestamp } from '../common.js';

export interface FileObject {
  id: string;
  name: string;
  url?: string;
  mimeType?: string;
  size?: number;
  metadata?: Record<string, unknown>;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  [key: string]: unknown;
}

export interface FileUploadParams {
  name?: string;
  metadata?: Record<string, unknown>;
}

export interface FileListParams {
  page?: number;
  limit?: number;
  search?: string;
}

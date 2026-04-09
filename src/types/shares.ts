import type { Timestamp } from './common.js';

export interface Share {
  id: string;
  type?: string;
  resourceId?: string;
  userId?: string;
  public?: boolean;
  createdAt?: Timestamp;
  [key: string]: unknown;
}

export interface ShareListParams {
  page?: number;
  limit?: number;
  type?: string;
}

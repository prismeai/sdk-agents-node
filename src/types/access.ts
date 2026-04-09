import type { Timestamp } from './common.js';

export interface AccessEntry {
  id: string;
  userId?: string;
  email?: string;
  role: string;
  grantedAt?: Timestamp;
  grantedBy?: string;
  [key: string]: unknown;
}

export interface AccessGrantParams {
  email?: string;
  userId?: string;
  role: string;
}

export interface AccessRequest {
  id: string;
  userId: string;
  email?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: Timestamp;
  [key: string]: unknown;
}

export interface AccessRequestHandleParams {
  action: 'approve' | 'reject';
}

export interface AccessListParams {
  page?: number;
  limit?: number;
}

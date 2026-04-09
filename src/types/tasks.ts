import type { Timestamp } from './common.js';

export interface Task {
  id: string;
  agentId?: string;
  conversationId?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  output?: string;
  error?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  [key: string]: unknown;
}

export interface TaskListParams {
  page?: number;
  limit?: number;
  agentId?: string;
  status?: string;
}

import type { Timestamp } from './common.js';

export interface Conversation {
  /** Conversation ID (contextId from the API). */
  id: string;
  contextId?: string;
  agent_id?: string;
  title?: string;
  is_archived?: boolean;
  is_starred?: boolean;
  messages_count?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  [key: string]: unknown;
}

export interface ConversationCreateParams {
  agentId?: string;
  name?: string;
  metadata?: Record<string, unknown>;
}

export interface ConversationUpdateParams {
  name?: string;
  metadata?: Record<string, unknown>;
}

export interface ConversationListParams {
  page?: number;
  limit?: number;
  agentId?: string;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  parts?: Array<{ type: string; text?: string; url?: string }>;
  createdAt?: Timestamp;
  [key: string]: unknown;
}

export interface ConversationShareParams {
  public?: boolean;
  users?: string[];
  groups?: string[];
}

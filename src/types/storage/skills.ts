import type { Timestamp } from '../common.js';

export interface Skill {
  id: string;
  name: string;
  description?: string;
  type?: string;
  config?: Record<string, unknown>;
  schema?: Record<string, unknown>;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  [key: string]: unknown;
}

export interface SkillCreateParams {
  name: string;
  description?: string;
  type?: string;
  config?: Record<string, unknown>;
  schema?: Record<string, unknown>;
}

export interface SkillUpdateParams {
  name?: string;
  description?: string;
  config?: Record<string, unknown>;
  schema?: Record<string, unknown>;
}

export interface SkillListParams {
  page?: number;
  limit?: number;
}

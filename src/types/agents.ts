import type { Timestamp, LocalizedText } from './common.js';

export interface Agent {
  id: string;
  slug: string;
  name: LocalizedText;
  description?: LocalizedText;
  photo?: string;
  status?: 'draft' | 'published';
  labels?: string[];
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  subAgents?: SubAgentConfig[];
  guardrails?: GuardrailConfig[];
  toolPermissions?: ToolPermissions;
  tools?: AgentTool[];
  discovery?: AgentDiscovery;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  createdBy?: string;
  updatedBy?: string;
  [key: string]: unknown;
}

export interface AgentCreateParams {
  name: LocalizedText;
  description?: LocalizedText;
  photo?: string;
  labels?: string[];
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  subAgents?: SubAgentConfig[];
  guardrails?: GuardrailConfig[];
  toolPermissions?: ToolPermissions;
  tools?: AgentTool[];
  discovery?: AgentDiscovery;
  [key: string]: unknown;
}

export interface AgentUpdateParams {
  name?: LocalizedText;
  description?: LocalizedText;
  photo?: string;
  labels?: string[];
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  subAgents?: SubAgentConfig[];
  guardrails?: GuardrailConfig[];
  toolPermissions?: ToolPermissions;
  tools?: AgentTool[];
  discovery?: AgentDiscovery;
  [key: string]: unknown;
}

export interface AgentListParams {
  page?: number;
  limit?: number;
  labels?: string;
  search?: string;
}

export interface SubAgentConfig {
  agentId: string;
  name?: string;
  description?: string;
}

export type GuardrailType =
  | 'injection-detect'
  | 'toxicity-check'
  | 'pii-detect'
  | 'hallucination-check'
  | 'topic-guard'
  | 'action-approval';

export interface GuardrailConfig {
  id: string;
  type: 'input' | 'output' | 'action';
  guardrailType: GuardrailType;
  config?: Record<string, unknown>;
  enabled?: boolean;
}

export type ToolPolicy = 'auto' | 'always_ask' | 'ask_external' | 'ask_first' | 'deny';

export interface ToolPermissions {
  default: ToolPolicy;
  tools?: ToolRule[];
}

export interface ToolRule {
  tool: string;
  policy: ToolPolicy;
  conditions?: Record<string, unknown>;
  approvers?: Approver[];
}

export interface Approver {
  type: 'user' | 'group' | 'owner';
  id?: string;
}

export interface AgentTool {
  id?: string;
  name: string;
  description?: string;
  type?: string;
  config?: Record<string, unknown>;
}

export interface AgentDiscovery {
  enabled?: boolean;
  categories?: string[];
  featured?: boolean;
}

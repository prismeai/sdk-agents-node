export interface A2AMessagePart {
  text?: string;
  [key: string]: unknown;
}

export interface A2ASendParams {
  /** Message to send. */
  message: {
    parts: A2AMessagePart[];
    contextId?: string;
    [key: string]: unknown;
  };
  /** Existing task ID to continue. */
  taskId?: string;
  /** Additional context. */
  [key: string]: unknown;
}

export interface A2AResponse {
  jsonrpc: '2.0';
  id: string;
  result?: {
    id: string;
    contextId?: string;
    status?: { state: string; timestamp?: string; message?: unknown };
    [key: string]: unknown;
  };
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
  [key: string]: unknown;
}

export interface A2ACard {
  name: string;
  description?: string;
  url?: string;
  capabilities?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface A2AExtendedCard extends A2ACard {
  tools?: Array<{ name: string; description?: string }>;
  sub_agents?: Array<{ name: string; agentId: string }>;
  skills?: unknown[];
  [key: string]: unknown;
}

export type A2AStreamEvent = {
  type?: string;
  jsonrpc?: '2.0';
  [key: string]: unknown;
};

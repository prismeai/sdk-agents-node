export interface Tool {
  id?: string;
  name: string;
  description?: string;
  type?: string;
  schema?: Record<string, unknown>;
  config?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ToolCreateParams {
  name: string;
  description?: string;
  type?: string;
  schema?: Record<string, unknown>;
  config?: Record<string, unknown>;
}

export interface ToolListParams {
  page?: number;
  limit?: number;
}

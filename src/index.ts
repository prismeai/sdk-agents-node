// Main client
export { PrismeAI, type PrismeAIOptions } from './client.js';

// Errors
export {
  PrismeAIError,
  AuthenticationError,
  PermissionDeniedError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
  InternalServerError,
  ConnectionError,
  TimeoutError,
} from './core/errors.js';

// Core utilities
export { SSEStream } from './core/streaming.js';
export { PageIterator, type PageResponse, type PaginationParams } from './core/pagination.js';
export type { FileInput, FileUploadOptions } from './core/uploads.js';

// Agent Factory types
export type {
  Agent,
  AgentCreateParams,
  AgentUpdateParams,
  AgentListParams,
  SubAgentConfig,
  GuardrailConfig,
  GuardrailType,
  ToolPermissions,
  ToolRule,
  ToolPolicy,
  Approver,
  AgentTool,
  AgentDiscovery,
} from './types/agents.js';

export type {
  MessageSendParams,
  MessagePart,
  FileAttachment,
  MessageResponse,
  StreamEvent,
  StreamEventDelta,
  StreamEventTaskStatus,
  StreamEventCompleted,
  StreamEventFinalResponse,
} from './types/messages.js';

export type {
  Conversation,
  ConversationCreateParams,
  ConversationUpdateParams,
  ConversationListParams,
  ConversationShareParams,
} from './types/conversations.js';

export type { Task, TaskListParams } from './types/tasks.js';
export type { Tool, ToolCreateParams, ToolListParams } from './types/tools.js';

export type {
  AccessEntry,
  AccessGrantParams,
  AccessRequest,
  AccessRequestHandleParams,
  AccessListParams,
} from './types/access.js';

export type {
  AnalyticsParams,
  AnalyticsResponse,
  AnalyticsDataPoint,
} from './types/analytics.js';

export type {
  A2ASendParams,
  A2AResponse,
  A2ACard,
  A2AExtendedCard,
  A2AStreamEvent,
} from './types/a2a.js';

export type {
  Artifact,
  ArtifactUpdateParams,
  ArtifactListParams,
  ArtifactShareParams,
} from './types/artifacts.js';

export type { Share, ShareListParams } from './types/shares.js';

export type { Timestamp, LocalizedText } from './types/common.js';

// Storage types
export type {
  FileObject,
  FileUploadParams,
  FileListParams,
} from './types/storage/files.js';

export type {
  VectorStore,
  VectorStoreConfig,
  VectorStoreCreateParams,
  VectorStoreUpdateParams,
  VectorStoreListParams,
  VectorStoreSearchParams,
  VectorStoreSearchResult,
  VSFile,
  VSFileAddParams,
  VSFileListParams,
  VSFileChunk,
  VSAccessEntry,
  VSAccessGrantParams,
  VSAccessUpdateParams,
} from './types/storage/vector-stores.js';

export type {
  Skill,
  SkillCreateParams,
  SkillUpdateParams,
  SkillListParams,
} from './types/storage/skills.js';

export type { StorageStats, StatsParams } from './types/storage/stats.js';

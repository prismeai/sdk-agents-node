export interface MessageSendParams {
  message: {
    parts: MessagePart[];
    contextId?: string;
    [key: string]: unknown;
  };
  /** Convenience: attach files that will be converted to message parts. */
  files?: FileAttachment[];
  [key: string]: unknown;
}

export interface MessagePart {
  /** Text content of the part. */
  text?: string;
  /** URL reference to a file (e.g. file_xxx or external URL). */
  url?: string;
  /** Raw base64-encoded file data. */
  raw?: string;
  /** Structured data payload. */
  data?: Record<string, unknown>;
  /** MIME type (e.g. "text/plain", "image/png"). */
  mediaType?: string;
  /** Filename for file parts. */
  filename?: string;
  /** Metadata attached to the part. */
  metadata?: Record<string, unknown>;
}

/**
 * File attachment for messages. Provide one of: data, path, or url.
 */
export interface FileAttachment {
  /** Raw file content (Buffer, Uint8Array, or base64 string). */
  data?: Buffer | Uint8Array | string;
  /** Local file path to read. */
  path?: string;
  /** URL reference to an external file. */
  url?: string;
  /** MIME type. Auto-detected from filename if not provided. */
  mimeType?: string;
  /** Filename (used for MIME type detection). */
  filename?: string;
  /** Part type: 'file', 'image', or 'audio'. Auto-detected from MIME if not set. */
  type?: 'file' | 'image' | 'audio';
}

export interface MessageResponse {
  task?: {
    id: string;
    contextId?: string;
    status?: string;
    [key: string]: unknown;
  };
  output?: string;
  [key: string]: unknown;
}

/**
 * SSE stream event types emitted during message streaming.
 *
 * Events follow the pattern `{event: "type", data: {...}}` when the SSE
 * block has an `event:` line, or a plain JSON object for the final response.
 */
export type StreamEvent =
  | StreamEventTaskStatus
  | StreamEventDelta
  | StreamEventCompleted
  | StreamEventFinalResponse;

/** `event: task.status` — sent when the task starts working. */
export interface StreamEventTaskStatus {
  event: 'task.status';
  data: {
    taskId: string;
    contextId: string;
    status: { state: string; timestamp?: string };
    [key: string]: unknown;
  };
}

/** `event: task.output.delta` — text chunk from the agent. */
export interface StreamEventDelta {
  event: 'task.output.delta';
  data: {
    taskId: string;
    delta: {
      role: string;
      parts: Array<{ type?: string; text?: string; [key: string]: unknown }>;
    };
    [key: string]: unknown;
  };
}

/** `event: task.output.completed` — full response once generation finishes. */
export interface StreamEventCompleted {
  event: 'task.output.completed';
  data: {
    taskId: string;
    contextId: string;
    output: {
      messages: Array<{
        message_id: string;
        role: string;
        parts: Array<{ text?: string; [key: string]: unknown }>;
      }>;
      artifacts?: unknown[];
    };
    status: { state: string; timestamp?: string };
    usage?: Record<string, unknown>;
    [key: string]: unknown;
  };
}

/** Final non-SSE JSON response at the end of the stream. */
export interface StreamEventFinalResponse {
  task: {
    id: string;
    contextId: string;
    status: { state: string };
    artifacts?: unknown[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

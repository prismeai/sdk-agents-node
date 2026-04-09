import { readFile } from 'node:fs/promises';
import { BaseResource } from '../../core/base-resource.js';
import type { HttpClient } from '../../core/http-client.js';
import { SSEStream } from '../../core/streaming.js';
import { mimeFromFilename } from '../../core/uploads.js';
import type {
  MessageSendParams,
  MessageResponse,
  StreamEvent,
  FileAttachment,
  MessagePart,
} from '../../types/messages.js';

export class Messages extends BaseResource {
  private readonly workspaceSlug: string;

  constructor(httpClient: HttpClient, workspaceSlug: string) {
    super(httpClient);
    this.workspaceSlug = workspaceSlug;
  }

  private path(...segments: string[]): string {
    return this.buildPath(this.workspaceSlug, ...segments);
  }

  /** Send a message to an agent and get a complete response. */
  async send(agentId: string, params: MessageSendParams): Promise<MessageResponse> {
    const body = await this.prepareBody(params);
    return this._post<MessageResponse>(this.path('agents', agentId, 'messages', 'send'), body);
  }

  /** Send a message and receive the response as an SSE stream. */
  async stream(agentId: string, params: MessageSendParams): Promise<SSEStream<StreamEvent>> {
    const body = await this.prepareBody(params);
    const controller = new AbortController();
    const response = await this.httpClient.requestRaw({
      method: 'POST',
      path: this.path('agents', agentId, 'messages', 'stream'),
      body,
      headers: {
        accept: 'text/event-stream',
      },
      signal: controller.signal,
    });

    return new SSEStream<StreamEvent>(response, controller);
  }

  /**
   * Process file attachments into message parts and return the final body.
   * Strips the `files` field and merges converted parts into `message.parts`.
   */
  private async prepareBody(params: MessageSendParams): Promise<Record<string, unknown>> {
    if (!params.files || params.files.length === 0) {
      return params as Record<string, unknown>;
    }

    const fileParts = await Promise.all(params.files.map((f) => this.fileTopart(f)));
    const { files: _files, ...rest } = params;
    return {
      ...rest,
      message: {
        ...params.message,
        parts: [...params.message.parts, ...fileParts],
      },
    };
  }

  private async fileTopart(file: FileAttachment): Promise<MessagePart> {
    const mediaType = file.mimeType ?? (file.filename ? mimeFromFilename(file.filename) : undefined);

    // URL reference
    if (file.url) {
      return {
        url: file.url,
        ...(mediaType && { mediaType }),
        ...(file.filename && { filename: file.filename }),
      };
    }

    // File path — read and base64 encode
    if (file.path) {
      const buffer = await readFile(file.path);
      const resolvedMime = mediaType ?? mimeFromFilename(file.path);
      const filename = file.filename ?? file.path.split('/').pop();
      return {
        raw: buffer.toString('base64'),
        ...(resolvedMime && { mediaType: resolvedMime }),
        ...(filename && { filename }),
        metadata: { encoding: 'base64' },
      };
    }

    // Raw data
    if (file.data !== undefined) {
      let base64: string;
      if (typeof file.data === 'string') {
        base64 = file.data; // assume already base64
      } else if (file.data instanceof Buffer) {
        base64 = file.data.toString('base64');
      } else {
        base64 = Buffer.from(file.data).toString('base64');
      }
      return {
        raw: base64,
        ...(mediaType && { mediaType }),
        ...(file.filename && { filename: file.filename }),
        metadata: { encoding: 'base64' },
      };
    }

    throw new Error('FileAttachment must have one of: data, path, or url');
  }
}

/**
 * SSE (Server-Sent Events) stream parser.
 * Implements AsyncIterable<T> for `for await...of` usage.
 */
export class SSEStream<T> implements AsyncIterable<T> {
  private response: Response;
  private controller: AbortController;
  private _done = false;

  constructor(response: Response, controller: AbortController) {
    this.response = response;
    this.controller = controller;
  }

  get done(): boolean {
    return this._done;
  }

  abort(): void {
    this.controller.abort();
    this._done = true;
  }

  async *[Symbol.asyncIterator](): AsyncIterator<T> {
    const body = this.response.body;
    if (!body) {
      this._done = true;
      return;
    }

    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          // Process any remaining data in buffer
          if (buffer.trim()) {
            const event = parseSSEBlock(buffer);
            if (event !== null) {
              yield event as T;
            }
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const events = extractSSEEvents(buffer);
        buffer = events.remaining;

        for (const event of events.parsed) {
          if (event !== null) {
            yield event as T;
          }
        }
      }
    } catch (err) {
      if (this.controller.signal.aborted) return;
      throw err;
    } finally {
      this._done = true;
      reader.releaseLock();
    }
  }
}

interface SSEParseResult {
  parsed: Array<unknown | null>;
  remaining: string;
}

function extractSSEEvents(buffer: string): SSEParseResult {
  const parsed: Array<unknown | null> = [];
  const blocks = buffer.split(/\n\n/);
  const remaining = blocks.pop() ?? '';

  for (const block of blocks) {
    const event = parseSSEBlock(block);
    if (event !== null) {
      parsed.push(event);
    }
  }

  return { parsed, remaining };
}

function parseSSEBlock(block: string): unknown | null {
  let data = '';
  let eventType = '';

  for (const line of block.split('\n')) {
    if (line.startsWith('data:')) {
      const value = line.slice(5).trimStart();
      data += (data ? '\n' : '') + value;
    } else if (line.startsWith('event:')) {
      eventType = line.slice(6).trimStart();
    }
    // Ignore id:, retry:, and comments (:)
  }

  if (!data) return null;
  if (data === '[DONE]') return null;

  try {
    const parsed = JSON.parse(data);
    if (eventType) {
      return { event: eventType, data: parsed };
    }
    return parsed;
  } catch {
    if (eventType) {
      return { event: eventType, data };
    }
    return { data };
  }
}

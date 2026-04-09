import { describe, it, expect } from 'vitest';
import { SSEStream } from '../src/core/streaming.js';

function createMockResponse(chunks: string[]): Response {
  let index = 0;
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(encoder.encode(chunks[index]));
        index++;
      } else {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'content-type': 'text/event-stream' },
  });
}

describe('SSEStream', () => {
  it('parses basic SSE events', async () => {
    const response = createMockResponse([
      'data: {"type":"delta","text":"Hello"}\n\n',
      'data: {"type":"delta","text":" World"}\n\n',
    ]);

    const controller = new AbortController();
    const stream = new SSEStream(response, controller);
    const events: unknown[] = [];

    for await (const event of stream) {
      events.push(event);
    }

    expect(events).toHaveLength(2);
    expect(events[0]).toEqual({ type: 'delta', text: 'Hello' });
    expect(events[1]).toEqual({ type: 'delta', text: ' World' });
    expect(stream.done).toBe(true);
  });

  it('handles multiple events in a single chunk', async () => {
    const response = createMockResponse([
      'data: {"type":"delta","text":"A"}\n\ndata: {"type":"delta","text":"B"}\n\n',
    ]);

    const controller = new AbortController();
    const stream = new SSEStream(response, controller);
    const events: unknown[] = [];

    for await (const event of stream) {
      events.push(event);
    }

    expect(events).toHaveLength(2);
  });

  it('ignores [DONE] events', async () => {
    const response = createMockResponse([
      'data: {"type":"delta","text":"Hello"}\n\n',
      'data: [DONE]\n\n',
    ]);

    const controller = new AbortController();
    const stream = new SSEStream(response, controller);
    const events: unknown[] = [];

    for await (const event of stream) {
      events.push(event);
    }

    expect(events).toHaveLength(1);
  });

  it('handles event types', async () => {
    const response = createMockResponse([
      'event: message\ndata: {"text":"Hello"}\n\n',
    ]);

    const controller = new AbortController();
    const stream = new SSEStream(response, controller);
    const events: unknown[] = [];

    for await (const event of stream) {
      events.push(event);
    }

    expect(events).toHaveLength(1);
    expect((events[0] as Record<string, unknown>).event).toBe('message');
    expect((events[0] as Record<string, unknown>).data).toEqual({ text: 'Hello' });
  });

  it('can be aborted', async () => {
    const response = createMockResponse([
      'data: {"type":"delta","text":"Hello"}\n\n',
      'data: {"type":"delta","text":"World"}\n\n',
    ]);

    const controller = new AbortController();
    const stream = new SSEStream(response, controller);

    const events: unknown[] = [];
    for await (const event of stream) {
      events.push(event);
      stream.abort();
    }

    // At least first event received, then aborted
    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(stream.done).toBe(true);
  });
});

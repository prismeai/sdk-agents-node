/**
 * Additional SSEStream tests to cover edge cases in streaming.ts.
 * Covers: non-JSON data fallback, error propagation, empty body.
 */
import { describe, it, expect } from 'vitest';
import { SSEStream } from '../../src/core/streaming.js';

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

describe('SSEStream – coverage gaps', () => {
  it('handles non-JSON data as raw data object', async () => {
    const response = createMockResponse([
      'data: this is not JSON\n\n',
    ]);

    const controller = new AbortController();
    const stream = new SSEStream(response, controller);
    const events: unknown[] = [];

    for await (const event of stream) {
      events.push(event);
    }

    expect(events).toHaveLength(1);
    // Non-JSON data returns { data, event }
    expect((events[0] as Record<string, unknown>).data).toBe('this is not JSON');
  });

  it('handles non-JSON data with event type', async () => {
    const response = createMockResponse([
      'event: custom\ndata: plain text\n\n',
    ]);

    const controller = new AbortController();
    const stream = new SSEStream(response, controller);
    const events: unknown[] = [];

    for await (const event of stream) {
      events.push(event);
    }

    expect(events).toHaveLength(1);
    const ev = events[0] as Record<string, unknown>;
    expect(ev.data).toBe('plain text');
    expect(ev.event).toBe('custom');
  });

  it('handles empty body (null body)', async () => {
    // Create a response with no body
    const response = new Response(null, {
      headers: { 'content-type': 'text/event-stream' },
    });

    const controller = new AbortController();
    const stream = new SSEStream(response, controller);
    const events: unknown[] = [];

    for await (const event of stream) {
      events.push(event);
    }

    expect(events).toHaveLength(0);
    expect(stream.done).toBe(true);
  });

  it('handles remaining data in buffer at end of stream', async () => {
    // Data without trailing double newline - left in buffer when stream ends
    const encoder = new TextEncoder();
    let index = 0;
    const chunks = ['data: {"final":"yes"}\n\n'];

    const readableStream = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (index < chunks.length) {
          controller.enqueue(encoder.encode(chunks[index]));
          index++;
        } else {
          controller.close();
        }
      },
    });

    const response = new Response(readableStream, {
      headers: { 'content-type': 'text/event-stream' },
    });

    const controller = new AbortController();
    const stream = new SSEStream(response, controller);
    const events: unknown[] = [];

    for await (const event of stream) {
      events.push(event);
    }

    expect(events).toHaveLength(1);
    expect((events[0] as Record<string, unknown>).final).toBe('yes');
  });

  it('processes trailing buffer content on stream end', async () => {
    // Send data that ends with content still in the buffer (no final \n\n)
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"buffered":"true"}'));
        controller.close();
      },
    });

    const response = new Response(readableStream, {
      headers: { 'content-type': 'text/event-stream' },
    });

    const controller = new AbortController();
    const stream = new SSEStream(response, controller);
    const events: unknown[] = [];

    for await (const event of stream) {
      events.push(event);
    }

    // The remaining buffer should be parsed
    expect(events).toHaveLength(1);
    expect((events[0] as Record<string, unknown>).buffered).toBe('true');
  });

  it('ignores comment lines', async () => {
    const response = createMockResponse([
      ': this is a comment\ndata: {"valid":"yes"}\n\n',
    ]);

    const controller = new AbortController();
    const stream = new SSEStream(response, controller);
    const events: unknown[] = [];

    for await (const event of stream) {
      events.push(event);
    }

    expect(events).toHaveLength(1);
    expect((events[0] as Record<string, unknown>).valid).toBe('yes');
  });

  it('ignores id: and retry: lines', async () => {
    const response = createMockResponse([
      'id: 123\nretry: 5000\ndata: {"ok":"yes"}\n\n',
    ]);

    const controller = new AbortController();
    const stream = new SSEStream(response, controller);
    const events: unknown[] = [];

    for await (const event of stream) {
      events.push(event);
    }

    expect(events).toHaveLength(1);
    expect((events[0] as Record<string, unknown>).ok).toBe('yes');
  });

  it('handles empty data blocks (no data line)', async () => {
    const response = createMockResponse([
      'event: heartbeat\n\n',
    ]);

    const controller = new AbortController();
    const stream = new SSEStream(response, controller);
    const events: unknown[] = [];

    for await (const event of stream) {
      events.push(event);
    }

    // Block with no data line returns null, which is filtered out
    expect(events).toHaveLength(0);
  });

  it('handles multi-line data', async () => {
    const response = createMockResponse([
      'data: line1\ndata: line2\n\n',
    ]);

    const controller = new AbortController();
    const stream = new SSEStream(response, controller);
    const events: unknown[] = [];

    for await (const event of stream) {
      events.push(event);
    }

    expect(events).toHaveLength(1);
    // Multi-line non-JSON data
    const ev = events[0] as Record<string, unknown>;
    expect(ev.data).toBe('line1\nline2');
  });

  it('propagates errors when not aborted', async () => {
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"ok":"yes"}\n\n'));
        controller.error(new Error('Stream broke'));
      },
    });

    const response = new Response(readableStream, {
      headers: { 'content-type': 'text/event-stream' },
    });

    const controller = new AbortController();
    const stream = new SSEStream(response, controller);

    await expect(async () => {
      for await (const _event of stream) {
        // consume
      }
    }).rejects.toThrow('Stream broke');
  });

  it('suppresses error when controller is aborted', async () => {
    const encoder = new TextEncoder();
    let streamController: ReadableStreamDefaultController<Uint8Array>;
    const readableStream = new ReadableStream<Uint8Array>({
      start(ctrl) {
        streamController = ctrl;
        ctrl.enqueue(encoder.encode('data: {"ok":"yes"}\n\n'));
      },
      pull(ctrl) {
        // Error on the second pull, after abort has been called
        ctrl.error(new Error('Stream broke'));
      },
    });

    const response = new Response(readableStream, {
      headers: { 'content-type': 'text/event-stream' },
    });

    const controller = new AbortController();
    const stream = new SSEStream(response, controller);
    const events: unknown[] = [];

    // Abort after first event so error is suppressed
    for await (const event of stream) {
      events.push(event);
      stream.abort(); // This sets controller.signal.aborted and _done
    }

    // Should have gotten at least the first event
    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(stream.done).toBe(true);
  });
});

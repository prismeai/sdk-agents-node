# @prisme.ai/sdk-agents

Official Node.js SDK for the [Prisme.ai](https://prisme.ai) Agent Factory and Storage APIs.

## Installation

```bash
npm install @prisme.ai/sdk-agents
```

## Quick Start

```typescript
import { PrismeAI } from '@prisme.ai/sdk-agents';

const client = new PrismeAI({
  apiKey: process.env.PRISMEAI_API_KEY,
});
```

## Authentication

```typescript
// API Key (recommended for server-side)
const client = new PrismeAI({ apiKey: 'sk-...' });

// Bearer Token (for user-scoped access)
const client = new PrismeAI({ bearerToken: 'eyJ...' });

// Self-hosted instance
const client = new PrismeAI({
  apiKey: 'sk-...',
  baseURL: 'https://api.your-instance.com/v2',
});
```

Environment variables `PRISMEAI_API_KEY` and `PRISMEAI_BEARER_TOKEN` are also supported.

## Usage Examples

### Agents

```typescript
// List agents
for await (const agent of client.agents.list()) {
  console.log(agent.name);
}

// Create an agent
const agent = await client.agents.create({
  name: 'My Agent',
  description: 'A helpful assistant',
  model: 'gpt-4o',
  instructions: 'You are a helpful assistant.',
});

// Get, update, delete
const fetched = await client.agents.get(agent.id);
const updated = await client.agents.update(agent.id, { name: 'Renamed Agent' });
await client.agents.delete(agent.id);

// Publish / discard draft
await client.agents.publish(agent.id);
await client.agents.discardDraft(agent.id);

// Discover public agents
for await (const agent of client.agents.discovery()) {
  console.log(agent.name);
}
```

### Messages

```typescript
// Send a message (non-streaming)
const response = await client.agents.messages.send('agent-id', {
  message: {
    parts: [{ text: 'Hello, how are you?' }],
  },
});
console.log(response.output);

// Stream a message (SSE)
const stream = await client.agents.messages.stream('agent-id', {
  message: {
    parts: [{ text: 'Tell me a story' }],
  },
});
for await (const event of stream) {
  if (event.event === 'task.output.delta') {
    const text = event.data.delta.parts.map(p => p.text).join('');
    process.stdout.write(text);
  }
}

// Send with file attachments
const response = await client.agents.messages.send('agent-id', {
  message: {
    parts: [{ text: 'Describe this image' }],
  },
  files: [
    { url: 'https://example.com/image.png' },
    { path: './local-file.pdf' },
    { data: Buffer.from('...'), filename: 'doc.txt', mimeType: 'text/plain' },
  ],
});
```

### Tools

```typescript
// Create a tool for an agent
const tool = await client.agents.tools.create('agent-id', {
  type: 'function',
  name: 'get_weather',
  description: 'Get weather for a location',
  schema: {
    type: 'object',
    properties: { location: { type: 'string' } },
    required: ['location'],
  },
});

// List tools
for await (const t of client.agents.tools.list('agent-id')) {
  console.log(t.name);
}

// Delete a tool
await client.agents.tools.delete('agent-id', tool.id);
```

### Conversations

```typescript
// List conversations for an agent
for await (const conv of client.agents.conversations.list('agent-id')) {
  console.log(conv.id, conv.title);
}

// Create a conversation
const conv = await client.agents.conversations.create('agent-id');

// Send message in a conversation context
const response = await client.agents.messages.send('agent-id', {
  message: {
    parts: [{ text: 'Hello!' }],
    contextId: conv.id,
  },
});
```

### A2A (Agent-to-Agent)

```typescript
// Send a message via A2A protocol (JSON-RPC 2.0)
const result = await client.agents.a2a.send('target-agent-id', {
  message: { parts: [{ text: 'Perform this task' }] },
});

// Stream A2A response
const a2aStream = await client.agents.a2a.sendSubscribe('target-agent-id', {
  message: { parts: [{ text: 'Perform this task' }] },
});
for await (const event of a2aStream) {
  console.log(event);
}

// Get agent card
const card = await client.agents.a2a.getCard('agent-id');
```

### Tasks

```typescript
// List tasks for an agent
for await (const task of client.tasks.list('agent-id')) {
  console.log(task.id, task.status);
}

// Get / cancel a task
const task = await client.tasks.get('agent-id', 'task-id');
await client.tasks.cancel('agent-id', 'task-id');
```

### Files (Storage)

```typescript
// Upload a file
const file = await client.storage.files.upload(
  Buffer.from('Hello World'),
  { filename: 'hello.txt' },
);

// List files
for await (const f of client.storage.files.list()) {
  console.log(f.name, f.size);
}

// Download
const response = await client.storage.files.download(file.id);
```

### Vector Stores (Storage)

```typescript
// Create a vector store
const vs = await client.storage.vectorStores.create({
  name: 'My Knowledge Base',
});

// Search
const results = await client.storage.vectorStores.search(vs.id, {
  query: 'How do I reset my password?',
  limit: 5,
});

// Manage files in a vector store
await client.storage.vectorStores.files.add(vs.id, { fileId: 'file-id' });

for await (const file of client.storage.vectorStores.files.list(vs.id)) {
  console.log(file.name, file.status);
}
```

### Pagination

All list methods return async iterables that auto-paginate:

```typescript
// Auto-pagination with for-await
for await (const agent of client.agents.list()) {
  console.log(agent.name);
}

// Manual page control
const page = client.agents.list({ limit: 10 });
const firstPage = await page.getPage();
console.log(firstPage.data, firstPage.total);

// Collect all into array
const allAgents = await client.agents.list().toArray();
```

### Error Handling

```typescript
import {
  PrismeAIError,
  AuthenticationError,
  RateLimitError,
  NotFoundError,
  ValidationError,
} from '@prisme.ai/sdk-agents';

try {
  await client.agents.get('nonexistent');
} catch (error) {
  if (error instanceof NotFoundError) {
    console.log('Agent not found');
  } else if (error instanceof RateLimitError) {
    console.log(`Rate limited, retry after ${error.retryAfter}ms`);
  } else if (error instanceof AuthenticationError) {
    console.log('Invalid credentials');
  } else if (error instanceof PrismeAIError) {
    console.log(error.message, error.status);
  }
}
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | `PRISMEAI_API_KEY` env | API key for authentication |
| `bearerToken` | `string` | `PRISMEAI_BEARER_TOKEN` env | Bearer token for auth |
| `baseURL` | `string` | `https://api.prisme.ai/v2` | API base URL (for self-hosted) |
| `timeout` | `number` | `60000` | Request timeout in ms |
| `maxRetries` | `number` | `2` | Max retries on 429/5xx |

## Requirements

- Node.js 18+
- No runtime dependencies (uses native `fetch`)

## License

MIT

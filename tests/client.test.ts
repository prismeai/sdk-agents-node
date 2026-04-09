import { describe, it, expect } from 'vitest';
import { PrismeAI } from '../src/client.js';

describe('PrismeAI client', () => {
  it('creates a client with default base URL', () => {
    const client = new PrismeAI({
      apiKey: 'test-key',
    });

    expect(client).toBeDefined();
    expect(client.agents).toBeDefined();
    expect(client.tasks).toBeDefined();
    expect(client.artifacts).toBeDefined();
    expect(client.shares).toBeDefined();
    expect(client.ratings).toBeDefined();
    expect(client.activity).toBeDefined();
    expect(client.profiles).toBeDefined();
    expect(client.orgs).toBeDefined();
    expect(client.storage).toBeDefined();
    expect(client.storage.files).toBeDefined();
    expect(client.storage.vectorStores).toBeDefined();
    expect(client.storage.skills).toBeDefined();
    expect(client.storage.stats).toBeDefined();
  });

  it('creates a client with custom baseURL', () => {
    const client = new PrismeAI({
      apiKey: 'test-key',
      baseURL: 'https://api.my-instance.com/v2',
    });
    expect(client).toBeDefined();
  });

  it('creates a client with bearer token', () => {
    const client = new PrismeAI({
      bearerToken: 'my-jwt-token',
    });
    expect(client).toBeDefined();
  });

  it('agents has all sub-resources', () => {
    const client = new PrismeAI({
      apiKey: 'test-key',
    });

    expect(client.agents.messages).toBeDefined();
    expect(client.agents.conversations).toBeDefined();
    expect(client.agents.tools).toBeDefined();
    expect(client.agents.access).toBeDefined();
    expect(client.agents.analytics).toBeDefined();
    expect(client.agents.evaluations).toBeDefined();
    expect(client.agents.a2a).toBeDefined();
  });

  it('storage has all sub-resources', () => {
    const client = new PrismeAI({
      apiKey: 'test-key',
    });

    expect(client.storage.files).toBeDefined();
    expect(client.storage.vectorStores).toBeDefined();
    expect(client.storage.vectorStores.files).toBeDefined();
    expect(client.storage.vectorStores.access).toBeDefined();
    expect(client.storage.skills).toBeDefined();
    expect(client.storage.stats).toBeDefined();
  });
});

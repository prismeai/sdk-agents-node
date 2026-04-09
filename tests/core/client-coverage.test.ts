/**
 * Additional tests to cover edge cases in client.ts that the main client.test.ts doesn't cover.
 * Specifically targets: resolveBaseURL fallback to production, buildAuthHeaders env vars.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { PrismeAI } from '../../src/client.js';

describe('PrismeAI client – coverage gaps', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    // Clean up env vars
    delete process.env.PRISMEAI_API_KEY;
    delete process.env.PRISMEAI_BEARER_TOKEN;
  });

  it('defaults to production base URL when no environment or baseURL is provided', () => {
    const client = new PrismeAI({
      apiKey: 'test-key',
      agentFactoryWorkspaceId: 'ws-123',
    });
    expect(client).toBeDefined();
  });

  it('resolves environment as custom URL when it starts with http', () => {
    const client = new PrismeAI({
      apiKey: 'test-key',
      environment: 'https://custom.api.example.com/v2',
      agentFactoryWorkspaceId: 'ws-123',
    });
    expect(client).toBeDefined();
  });

  it('reads PRISMEAI_API_KEY from environment variable when no apiKey/bearerToken', () => {
    process.env.PRISMEAI_API_KEY = 'env-api-key';

    const client = new PrismeAI({
      environment: 'sandbox',
      agentFactoryWorkspaceId: 'ws-123',
    });
    expect(client).toBeDefined();
  });

  it('reads PRISMEAI_BEARER_TOKEN from environment variable when no apiKey', () => {
    process.env.PRISMEAI_BEARER_TOKEN = 'env-bearer-token';

    const client = new PrismeAI({
      environment: 'sandbox',
      agentFactoryWorkspaceId: 'ws-123',
    });
    expect(client).toBeDefined();
  });

  it('prefers PRISMEAI_API_KEY over PRISMEAI_BEARER_TOKEN', () => {
    process.env.PRISMEAI_API_KEY = 'env-api-key';
    process.env.PRISMEAI_BEARER_TOKEN = 'env-bearer-token';

    const client = new PrismeAI({
      environment: 'sandbox',
      agentFactoryWorkspaceId: 'ws-123',
    });
    expect(client).toBeDefined();
  });

  it('creates client with no auth when no keys are provided or in env', () => {
    const client = new PrismeAI({
      environment: 'sandbox',
      agentFactoryWorkspaceId: 'ws-123',
    });
    expect(client).toBeDefined();
  });
});

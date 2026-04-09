import { HttpClient } from './core/http-client.js';
import { Agents } from './resources/agents/index.js';
import { Tasks } from './resources/tasks/index.js';
import { Artifacts } from './resources/artifacts/index.js';
import { Shares } from './resources/shares/index.js';
import { Ratings } from './resources/ratings/index.js';
import { Activity } from './resources/activity/index.js';
import { Profiles } from './resources/profiles/index.js';
import { Orgs } from './resources/orgs/index.js';
import { Storage } from './resources/storage/index.js';

const ENVIRONMENTS: Record<string, string> = {
  sandbox: 'https://api.sandbox.prisme.ai/v2',
  production: 'https://api.prisme.ai/v2',
  prod: 'https://api.prisme.ai/v2',
};

const AGENT_FACTORY_SLUG = 'agent-factory';
const STORAGE_SLUG = 'storage';

export interface PrismeAIOptions {
  /** API key for authentication. Uses x-prismeai-api-key header. */
  apiKey?: string;
  /** Bearer token for authentication. Uses Authorization header. */
  bearerToken?: string;
  /** Environment name ('sandbox', 'production') or custom base URL. */
  environment?: string;
  /** Custom base URL. Overrides environment. */
  baseURL?: string;
  /** Request timeout in milliseconds. Default: 60000. */
  timeout?: number;
  /** Max retry attempts for failed requests. Default: 2. */
  maxRetries?: number;
}

/**
 * Main Prisme.ai SDK client.
 *
 * @example
 * ```typescript
 * const client = new PrismeAI({
 *   apiKey: 'sk-...',
 *   environment: 'sandbox',
 * });
 *
 * // List agents
 * for await (const agent of client.agents.list()) {
 *   console.log(agent.name);
 * }
 *
 * // Stream a message
 * const stream = await client.agents.messages.stream('agent-id', {
 *   text: 'Hello!',
 * });
 * for await (const event of stream) {
 *   if (event.type === 'delta') console.log(event.text);
 * }
 * ```
 */
export class PrismeAI {
  /** Agent Factory resources. */
  readonly agents: Agents;
  readonly tasks: Tasks;
  readonly artifacts: Artifacts;
  readonly shares: Shares;
  readonly ratings: Ratings;
  readonly activity: Activity;
  readonly profiles: Profiles;
  readonly orgs: Orgs;

  /** Storage resources (files, vector stores, skills, stats). */
  readonly storage: Storage;

  private readonly httpClient: HttpClient;

  constructor(options: PrismeAIOptions) {
    const baseURL = resolveBaseURL(options);
    const headers = buildAuthHeaders(options);

    this.httpClient = new HttpClient({
      baseURL,
      headers,
      timeout: options.timeout,
      maxRetries: options.maxRetries,
    });

    // Wire Agent Factory resources
    this.agents = new Agents(this.httpClient, AGENT_FACTORY_SLUG);
    this.tasks = new Tasks(this.httpClient, AGENT_FACTORY_SLUG);
    this.artifacts = new Artifacts(this.httpClient, AGENT_FACTORY_SLUG);
    this.shares = new Shares(this.httpClient, AGENT_FACTORY_SLUG);
    this.ratings = new Ratings(this.httpClient, AGENT_FACTORY_SLUG);
    this.activity = new Activity(this.httpClient, AGENT_FACTORY_SLUG);
    this.profiles = new Profiles(this.httpClient, AGENT_FACTORY_SLUG);
    this.orgs = new Orgs(this.httpClient, AGENT_FACTORY_SLUG);

    // Wire Storage resources
    this.storage = new Storage(this.httpClient, STORAGE_SLUG);
  }
}

function resolveBaseURL(options: PrismeAIOptions): string {
  if (options.baseURL) return options.baseURL;
  if (options.environment) {
    const env = ENVIRONMENTS[options.environment];
    if (env) return env;
    // Treat as custom URL if not a known environment name
    if (options.environment.startsWith('http')) return options.environment;
    throw new Error(
      `Unknown environment: "${options.environment}". Use "sandbox", "production", or provide a baseURL.`,
    );
  }
  return ENVIRONMENTS.production;
}

function buildAuthHeaders(options: PrismeAIOptions): Record<string, string> {
  const headers: Record<string, string> = {};

  if (options.apiKey) {
    headers['x-prismeai-api-key'] = options.apiKey;
  }
  if (options.bearerToken) {
    headers['authorization'] = `Bearer ${options.bearerToken}`;
  }

  if (!options.apiKey && !options.bearerToken) {
    // Check environment variables
    const envApiKey = process.env.PRISMEAI_API_KEY;
    const envBearerToken = process.env.PRISMEAI_BEARER_TOKEN;

    if (envApiKey) {
      headers['x-prismeai-api-key'] = envApiKey;
    } else if (envBearerToken) {
      headers['authorization'] = `Bearer ${envBearerToken}`;
    }
  }

  return headers;
}

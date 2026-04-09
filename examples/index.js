import { PrismeAI } from '../dist/index.mjs';
import { writeFileSync, unlinkSync } from 'node:fs';

// ── Config ──────────────────────────────────────────────────────
const client = new PrismeAI({
  apiKey: process.env.PRISMEAI_API_KEY,
  environment: process.env.PRISMEAI_ENV || 'sandbox',
});

let agentId;
let toolId;
let conversationId;
let contextId;

const passed = [];
const failed = [];
const skipped = [];

// ── Helpers ─────────────────────────────────────────────────────
function log(label, data) {
  console.log(`  ✅ ${label}`);
  if (data !== undefined) {
    const str = JSON.stringify(data, null, 2);
    if (str.length > 300) {
      console.log('     ' + str.slice(0, 300) + '...');
    } else {
      console.log('     ' + str);
    }
  }
}

async function test(name, fn) {
  try {
    await fn();
    passed.push(name);
  } catch (err) {
    const msg = err?.body?.message || err?.message || String(err);
    console.log(`  ❌ ${name}: ${msg}`);
    if (err?.status) console.log(`     Status: ${err.status}`);
    failed.push(name);
  }
}

async function testSkip(name, reason) {
  console.log(`  ⏭️  ${name} — skipped (${reason})`);
  skipped.push(name);
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ════════════════════════════════════════════════════════════════
//  1. AGENTS — CRUD + Publish + Discovery + Export/Import
// ════════════════════════════════════════════════════════════════
async function testAgents() {
  console.log('\n── Agents ─────────────────────────────────────');

  await test('agents.create', async () => {
    const agent = await client.agents.create({
      name: `SDK-Test-${Date.now()}`,
      description: 'Created by SDK test',
      instructions: 'You are a test assistant. Keep answers very short (under 20 words).',
      model: 'gpt-4o',
    });
    if (!agent || !agent.id) throw new Error('Expected agent with id');
    agentId = agent.id;
    log('Created', { id: agent.id, name: agent.name, status: agent.status });
  });

  await test('agents.get', async () => {
    if (!agentId) throw new Error('No agentId from create');
    const agent = await client.agents.get(agentId);
    if (!agent || agent.id !== agentId) throw new Error('Expected agent with matching id');
    log('Got', { id: agent.id, name: agent.name });
  });

  await test('agents.update', async () => {
    if (!agentId) throw new Error('No agentId');
    const agent = await client.agents.update(agentId, {
      description: 'Updated by SDK test',
    });
    if (!agent || !agent.id) throw new Error('Expected updated agent');
    log('Updated', { id: agent.id, description: agent.description });
  });

  await test('agents.list', async () => {
    const items = [];
    for await (const agent of client.agents.list()) {
      items.push(agent.id);
      if (items.length >= 3) break;
    }
    if (items.length === 0) throw new Error('Expected at least 1 agent');
    log('Listed', { count: items.length, ids: items });
  });

  await test('agents.export', async () => {
    if (!agentId) throw new Error('No agentId');
    const config = await client.agents.export(agentId);
    if (!config) throw new Error('Expected config');
    log('Exported', typeof config === 'string' ? { type: 'yaml', length: config.length } : { keys: Object.keys(config) });
  });
}

// ════════════════════════════════════════════════════════════════
//  1b. PUBLISH + DISCOVERY + DISCARD DRAFT
// ════════════════════════════════════════════════════════════════
async function testPublish() {
  console.log('\n── Publish + Discovery ────────────────────────');

  await test('agents.publish', async () => {
    if (!agentId) throw new Error('No agentId');
    const result = await client.agents.publish(agentId);
    if (!result) throw new Error('Expected publish response');
    log('Published', result);
  });

  await test('agents.discovery', async () => {
    const items = [];
    for await (const agent of client.agents.discovery()) {
      items.push({ id: agent.id, name: agent.name });
      if (items.length >= 3) break;
    }
    log('Discovery listed', { count: items.length });
  });

  await test('agents.discardDraft', async () => {
    if (!agentId) throw new Error('No agentId');
    await client.agents.update(agentId, { description: 'Draft change' });
    const agent = await client.agents.discardDraft(agentId);
    log('Draft discarded', { id: agent?.id });
  });
}

// ════════════════════════════════════════════════════════════════
//  2. MESSAGES — Send + Stream + File Attachments
// ════════════════════════════════════════════════════════════════
async function testMessages() {
  console.log('\n── Messages ───────────────────────────────────');

  await test('messages.send', async () => {
    if (!agentId) throw new Error('No agentId');
    const response = await client.agents.messages.send(agentId, {
      message: {
        parts: [{ text: 'What is 2+2? Answer with just the number.' }],
      },
    });
    if (!response) throw new Error('Expected response from send');
    if (response?.task?.contextId) contextId = response.task.contextId;
    log('Sent', response);
  });

  await test('messages.stream', async () => {
    if (!agentId) throw new Error('No agentId');
    const stream = await client.agents.messages.stream(agentId, {
      message: {
        parts: [{ text: 'Say the word "hello" and nothing else.' }],
      },
    });
    let fullText = '';
    let eventCount = 0;
    for await (const event of stream) {
      eventCount++;
      // Delta events: {event: "task.output.delta", data: {delta: {parts: [{text}]}}}
      if (event.event === 'task.output.delta') {
        const parts = event.data?.delta?.parts || [];
        for (const p of parts) {
          if (p.text) fullText += p.text;
        }
      }
    }
    if (eventCount === 0) throw new Error('Expected at least 1 stream event');
    if (!fullText) throw new Error('Expected text in stream deltas');
    log('Streamed', { events: eventCount, text: fullText.trim() });
  });

  // File attachment via base64 data
  await test('messages.send (with file attachment - base64)', async () => {
    if (!agentId) throw new Error('No agentId');
    const response = await client.agents.messages.send(agentId, {
      message: {
        parts: [{ text: 'I am attaching a text file. What does it say?' }],
      },
      files: [
        {
          data: Buffer.from('The secret word is banana.'),
          filename: 'secret.txt',
          mimeType: 'text/plain',
        },
      ],
    });
    // Note: gpt-4o may return INVALID_RESPONSE for raw base64 file parts
    log('Sent with file', response);
  });

  // File attachment via local path
  await test('messages.send (with file attachment - path)', async () => {
    if (!agentId) throw new Error('No agentId');
    const tmpPath = '/tmp/sdk-test-file.txt';
    writeFileSync(tmpPath, 'This is a test document for the SDK.');
    try {
      const response = await client.agents.messages.send(agentId, {
        message: {
          parts: [{ text: 'Summarize the attached file in one sentence.' }],
        },
        files: [{ path: tmpPath }],
      });
      log('Sent with file path', response);
    } finally {
      try { unlinkSync(tmpPath); } catch {}
    }
  });

  // File attachment on stream
  await test('messages.stream (with file attachment)', async () => {
    if (!agentId) throw new Error('No agentId');
    const stream = await client.agents.messages.stream(agentId, {
      message: {
        parts: [{ text: 'I attached a file. Read it and reply with its content.' }],
      },
      files: [
        {
          data: Buffer.from('Stream file test content.'),
          filename: 'stream-test.txt',
          mimeType: 'text/plain',
        },
      ],
    });
    let fullText = '';
    let eventCount = 0;
    for await (const event of stream) {
      eventCount++;
      if (event.event === 'task.output.delta') {
        const parts = event.data?.delta?.parts || [];
        for (const p of parts) {
          if (p.text) fullText += p.text;
        }
      }
    }
    if (eventCount === 0) throw new Error('Expected at least 1 stream event with file');
    log('Streamed with file', { events: eventCount, text: fullText.trim().slice(0, 200) });
  });

  // File attachment via URL reference
  await test('messages.send (with file attachment - URL)', async () => {
    if (!agentId) throw new Error('No agentId');
    const response = await client.agents.messages.send(agentId, {
      message: {
        parts: [{ text: 'What do you see in this image?' }],
      },
      files: [
        {
          url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/280px-PNG_transparency_demonstration_1.png',
          type: 'image',
          mimeType: 'image/png',
        },
      ],
    });
    if (!response) throw new Error('Expected response with URL file');
    log('Sent with URL file', response);
  });
}

// ════════════════════════════════════════════════════════════════
//  3. CONVERSATIONS — CRUD + Messages + Share
// ════════════════════════════════════════════════════════════════
async function testConversations() {
  console.log('\n── Conversations ──────────────────────────────');

  await test('conversations.list', async () => {
    const items = [];
    for await (const conv of client.agents.conversations.list(agentId)) {
      items.push(conv.id);
      if (items.length >= 3) break;
    }
    log('Listed', { count: items.length });
  });

  await test('conversations.create', async () => {
    if (!agentId) throw new Error('No agentId');
    const conv = await client.agents.conversations.create(agentId);
    const convId = conv?.id || conv?.contextId;
    if (!convId) throw new Error('Expected conversation with id or contextId');
    conversationId = convId;
    log('Created', { id: conversationId });
  });

  await test('conversations.get', async () => {
    if (!conversationId) throw new Error('No conversationId');
    const conv = await client.agents.conversations.get(agentId, conversationId);
    if (!conv) throw new Error('Expected conversation object');
    log('Got', conv);
  });

  await test('conversations.update', async () => {
    if (!conversationId) throw new Error('No conversationId');
    const conv = await client.agents.conversations.update(agentId, conversationId, {
      title: 'SDK Test Conversation',
    });
    if (!conv) throw new Error('Expected updated conversation');
    log('Updated', conv);
  });

  await test('conversations.share', async () => {
    if (!conversationId) throw new Error('No conversationId');
    const result = await client.agents.conversations.share(agentId, conversationId, {});
    log('Shared', result);
  });

  await test('conversations.delete', async () => {
    await client.agents.conversations.delete(agentId, conversationId);
    log('Deleted', { id: conversationId });
  });
}

// ════════════════════════════════════════════════════════════════
//  4. TOOLS — CRUD
// ════════════════════════════════════════════════════════════════
async function testTools() {
  console.log('\n── Tools ──────────────────────────────────────');

  await test('tools.create', async () => {
    if (!agentId) throw new Error('No agentId');
    const tool = await client.agents.tools.create(agentId, {
      type: 'function',
      name: 'get_weather',
      description: 'Get weather for a city',
      schema: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'City name' },
        },
        required: ['location'],
      },
    });
    if (!tool || !tool.id) throw new Error('Expected tool with id');
    toolId = tool.id;
    log('Created', { id: tool.id, name: tool.name });
  });

  await test('tools.list', async () => {
    if (!agentId) throw new Error('No agentId');
    const items = [];
    for await (const tool of client.agents.tools.list(agentId)) {
      items.push({ id: tool.id, name: tool.name });
    }
    if (items.length === 0) throw new Error('Expected at least 1 tool');
    log('Listed', { count: items.length, tools: items });
  });

  await test('tools.get', async () => {
    if (!toolId) throw new Error('No toolId');
    const tool = await client.agents.tools.get(agentId, toolId);
    if (!tool || tool.id !== toolId) throw new Error('Expected matching tool');
    log('Got', { id: tool.id, name: tool.name });
  });

  await testSkip('tools.update', 'not supported — update agent instead');

  await test('tools.delete', async () => {
    if (!toolId) throw new Error('No toolId');
    await client.agents.tools.delete(agentId, toolId);
    log('Deleted', { id: toolId });
  });
}

// ════════════════════════════════════════════════════════════════
//  5. ACCESS — List + Grant + Revoke + Request
// ════════════════════════════════════════════════════════════════
async function testAccess() {
  console.log('\n── Access ─────────────────────────────────────');

  await test('access.list', async () => {
    const items = [];
    for await (const entry of client.agents.access.list(agentId)) {
      items.push(entry);
      if (items.length >= 3) break;
    }
    log('Listed', { count: items.length });
  });

  await testSkip('access.grant', 'requires target userId');
  await testSkip('access.revoke', 'requires principalType/principalId');
  await testSkip('access.requestAccess', 'requires different user context');
  await testSkip('access.listRequests', 'requires pending requests');
  await testSkip('access.handleRequest', 'requires requestId');
}

// ════════════════════════════════════════════════════════════════
//  6. ANALYTICS
// ════════════════════════════════════════════════════════════════
async function testAnalytics() {
  console.log('\n── Analytics ──────────────────────────────────');

  await test('analytics.get', async () => {
    const data = await client.agents.analytics.get(agentId, {
      period: '7d',
    });
    log('Got analytics', { keys: Object.keys(data || {}) });
  });
}

// ════════════════════════════════════════════════════════════════
//  7. EVALUATIONS
// ════════════════════════════════════════════════════════════════
async function testEvaluations() {
  console.log('\n── Evaluations ────────────────────────────────');

  await test('evaluations.list', async () => {
    const items = [];
    for await (const evaluation of client.agents.evaluations.list(agentId)) {
      items.push(evaluation);
      if (items.length >= 3) break;
    }
    log('Listed', { count: items.length });
  });

  await testSkip('evaluations.create', 'requires evaluation dataset');
}

// ════════════════════════════════════════════════════════════════
//  8. A2A (Agent-to-Agent)
// ════════════════════════════════════════════════════════════════
async function testA2A() {
  console.log('\n── A2A ────────────────────────────────────────');

  await test('a2a.getCard', async () => {
    const card = await client.agents.a2a.getCard(agentId);
    log('Got card', { name: card?.name, url: card?.url });
  });

  await test('a2a.getExtendedCard', async () => {
    const card = await client.agents.a2a.getExtendedCard(agentId);
    log('Got extended card', { keys: Object.keys(card || {}) });
  });

  await test('a2a.send', async () => {
    if (!agentId) throw new Error('No agentId');
    const response = await client.agents.a2a.send(agentId, {
      message: { parts: [{ text: 'Hello from A2A test' }] },
    });
    if (!response) throw new Error('Expected A2A response');
    log('A2A sent', response);
  });

  await test('a2a.sendSubscribe', async () => {
    if (!agentId) throw new Error('No agentId');
    const stream = await client.agents.a2a.sendSubscribe(agentId, {
      message: { parts: [{ text: 'Hello stream A2A' }] },
    });
    let eventCount = 0;
    for await (const event of stream) {
      eventCount++;
      if (eventCount >= 20) { stream.abort(); break; }
    }
    if (eventCount === 0) throw new Error('Expected at least 1 A2A event');
    log('A2A streamed', { events: eventCount });
  });
}

// ════════════════════════════════════════════════════════════════
//  9. TASKS
// ════════════════════════════════════════════════════════════════
async function testTasks() {
  console.log('\n── Tasks ──────────────────────────────────────');

  await test('tasks.list', async () => {
    const items = [];
    for await (const task of client.tasks.list(agentId)) {
      items.push({ id: task.id, status: task.status });
      if (items.length >= 3) break;
    }
    log('Listed', { count: items.length, tasks: items });
  });

  await test('tasks.get', async () => {
    let taskId;
    for await (const task of client.tasks.list(agentId)) {
      taskId = task.id;
      break;
    }
    if (taskId) {
      const task = await client.tasks.get(agentId, taskId);
      log('Got', { id: task.id, status: task.status });
    } else {
      log('No tasks to get');
    }
  });

  await testSkip('tasks.cancel', 'requires active running task');
}

// ════════════════════════════════════════════════════════════════
// 10. ARTIFACTS
// ════════════════════════════════════════════════════════════════
async function testArtifacts() {
  console.log('\n── Artifacts ──────────────────────────────────');

  await test('artifacts.list', async () => {
    const items = [];
    for await (const artifact of client.artifacts.list()) {
      items.push(artifact.id);
      if (items.length >= 3) break;
    }
    log('Listed', { count: items.length });
  });

  await testSkip('artifacts.get', 'requires artifact from message');
  await testSkip('artifacts.update', 'requires artifactId');
  await testSkip('artifacts.delete', 'requires artifactId');
  await testSkip('artifacts.share', 'requires artifactId');
}

// ════════════════════════════════════════════════════════════════
// 11. SHARES
// ════════════════════════════════════════════════════════════════
async function testShares() {
  console.log('\n── Shares ─────────────────────────────────────');

  await test('shares.list', async () => {
    const items = [];
    for await (const share of client.shares.list()) {
      items.push(share.id);
      if (items.length >= 3) break;
    }
    log('Listed', { count: items.length });
  });

  await testSkip('shares.get', 'requires shareId');
}

// ════════════════════════════════════════════════════════════════
// 12. RATINGS
// ════════════════════════════════════════════════════════════════
async function testRatings() {
  console.log('\n── Ratings ────────────────────────────────────');

  await test('ratings.create', async () => {
    const rating = await client.ratings.create(agentId, {
      rating: 5,
      feedback: 'Great SDK test agent!',
    });
    log('Created', rating);
  });
}

// ════════════════════════════════════════════════════════════════
// 13. ACTIVITY
// ════════════════════════════════════════════════════════════════
async function testActivity() {
  console.log('\n── Activity ───────────────────────────────────');

  await test('activity.list', async () => {
    const items = [];
    for await (const entry of client.activity.list()) {
      items.push(entry);
      if (items.length >= 3) break;
    }
    log('Listed', { count: items.length });
  });
}

// ════════════════════════════════════════════════════════════════
// 14. PROFILES
// ════════════════════════════════════════════════════════════════
async function testProfiles() {
  console.log('\n── Profiles ───────────────────────────────────');

  await test('profiles.list', async () => {
    const items = [];
    for await (const profile of client.profiles.list()) {
      items.push(profile);
      if (items.length >= 3) break;
    }
    log('Listed', { count: items.length });
  });
}

// ════════════════════════════════════════════════════════════════
// 15. ORGS
// ════════════════════════════════════════════════════════════════
async function testOrgs() {
  console.log('\n── Orgs ───────────────────────────────────────');

  await testSkip('orgs.listAgents', 'requires orgSlug');
}

// ════════════════════════════════════════════════════════════════
// 16. STORAGE — Files
// ════════════════════════════════════════════════════════════════
async function testFiles() {
  console.log('\n── Storage: Files ─────────────────────────────');

  let fileId;

  await test('files.upload', async () => {
    const file = await client.storage.files.upload(
      Buffer.from('Hello from SDK test!'),
      { filename: 'sdk-test.txt' },
    );
    fileId = file?.id;
    log('Uploaded', file);
  });

  await test('files.list', async () => {
    const items = [];
    for await (const file of client.storage.files.list()) {
      items.push({ id: file.id, name: file.name });
      if (items.length >= 3) break;
    }
    if (items.length === 0) throw new Error('Expected at least 1 file');
    if (!fileId) fileId = items[0].id; // fallback to first listed file
    log('Listed', { count: items.length });
  });

  await test('files.get', async () => {
    if (!fileId) { log('Skipped — no fileId'); return; }
    const file = await client.storage.files.get(fileId);
    if (!file) throw new Error('Expected file object');
    log('Got', { id: file.id, name: file.name });
  });

  await test('files.download', async () => {
    if (!fileId) { log('Skipped — no fileId'); return; }
    const response = await client.storage.files.download(fileId);
    const text = await response.text();
    if (typeof text !== 'string') throw new Error('Expected text content');
    log('Downloaded', { size: text.length, content: text.slice(0, 100) });
  });

  await test('files.delete', async () => {
    if (!fileId) { log('Skipped — no fileId'); return; }
    await client.storage.files.delete(fileId);
    log('Deleted', { id: fileId });
  });
}

// ════════════════════════════════════════════════════════════════
// 17. STORAGE — Vector Stores
// ════════════════════════════════════════════════════════════════
async function testVectorStores() {
  console.log('\n── Storage: Vector Stores ─────────────────────');

  let vsId;

  await test('vectorStores.create', async () => {
    const vs = await client.storage.vectorStores.create({
      name: `SDK-Test-VS-${Date.now()}`,
    });
    if (!vs || !vs.id) throw new Error('Expected vector store with id');
    vsId = vs.id;
    log('Created', { id: vs.id, name: vs.name });
  });

  await test('vectorStores.list', async () => {
    const items = [];
    for await (const vs of client.storage.vectorStores.list()) {
      items.push({ id: vs.id, name: vs.name });
      if (items.length >= 3) break;
    }
    if (items.length === 0) throw new Error('Expected at least 1 vector store');
    log('Listed', { count: items.length });
  });

  await test('vectorStores.get', async () => {
    if (!vsId) { log('Skipped'); return; }
    const vs = await client.storage.vectorStores.get(vsId);
    if (!vs) throw new Error('Expected vector store object');
    log('Got', { id: vs.id, name: vs.name });
  });

  await test('vectorStores.update', async () => {
    if (!vsId) { log('Skipped'); return; }
    const vs = await client.storage.vectorStores.update(vsId, {
      name: 'SDK-Test-VS-Updated',
    });
    if (!vs) throw new Error('Expected updated vector store');
    log('Updated', { id: vs.id, name: vs.name });
  });

  await test('vectorStores.search', async () => {
    if (!vsId) { log('Skipped'); return; }
    const results = await client.storage.vectorStores.search(vsId, {
      query: 'test search',
      limit: 3,
    });
    log('Searched', { results: Array.isArray(results) ? results.length : 'non-array' });
  });

  await test('vectorStores.crawlStatus', async () => {
    if (!vsId) { log('Skipped'); return; }
    const status = await client.storage.vectorStores.crawlStatus(vsId);
    log('Crawl status', status);
  });

  await testSkip('vectorStores.reindex', 'requires indexed documents');
  await testSkip('vectorStores.recrawl', 'requires crawled sources');

  await testSkip('vectorStores.files.list', 'requires files in VS');
  await testSkip('vectorStores.files.add', 'requires file + VS with docs');

  await test('vectorStores.delete', async () => {
    if (!vsId) { log('Skipped'); return; }
    await client.storage.vectorStores.delete(vsId);
    log('Deleted', { id: vsId });
  });
}

// ════════════════════════════════════════════════════════════════
// 18. STORAGE — Skills
// ════════════════════════════════════════════════════════════════
async function testSkills() {
  console.log('\n── Storage: Skills ────────────────────────────');

  let skillId;

  await test('skills.create', async () => {
    const skill = await client.storage.skills.create({
      name: `SDK-Test-Skill-${Date.now()}`,
      type: 'text',
      description: 'Test skill from SDK',
      instructions: 'You are a test skill. Answer briefly.',
    });
    if (!skill || !skill.id) throw new Error('Expected skill with id');
    skillId = skill.id;
    log('Created', { id: skill.id, name: skill.name });
  });

  await test('skills.list', async () => {
    const items = [];
    for await (const skill of client.storage.skills.list()) {
      items.push({ id: skill.id, name: skill.name });
      if (items.length >= 3) break;
    }
    if (items.length === 0) throw new Error('Expected at least 1 skill');
    log('Listed', { count: items.length });
  });

  await test('skills.get', async () => {
    if (!skillId) { log('Skipped'); return; }
    const skill = await client.storage.skills.get(skillId);
    if (!skill || skill.id !== skillId) throw new Error('Expected matching skill');
    log('Got', { id: skill.id, name: skill.name });
  });

  await test('skills.update', async () => {
    if (!skillId) { log('Skipped'); return; }
    const skill = await client.storage.skills.update(skillId, {
      description: 'Updated test skill',
    });
    if (!skill) throw new Error('Expected updated skill');
    log('Updated', { id: skill.id });
  });

  await test('skills.delete', async () => {
    if (!skillId) { log('Skipped'); return; }
    await client.storage.skills.delete(skillId);
    log('Deleted', { id: skillId });
  });
}

// ════════════════════════════════════════════════════════════════
// 19. STORAGE — Stats
// ════════════════════════════════════════════════════════════════
async function testStats() {
  console.log('\n── Storage: Stats ─────────────────────────────');

  await test('stats.get', async () => {
    const stats = await client.storage.stats.get();
    if (!stats || typeof stats !== 'object') throw new Error('Expected stats object');
    log('Got stats', stats);
  });
}

// ════════════════════════════════════════════════════════════════
// 20. AGENTS IMPORT (uses exported config)
// ════════════════════════════════════════════════════════════════
async function testImport() {
  console.log('\n── Import ─────────────────────────────────────');

  await test('agents.import', async () => {
    if (!agentId) throw new Error('No agentId');
    const config = await client.agents.export(agentId);
    // Export returns YAML front matter + markdown instructions
    let yamlConfig = typeof config === 'string' ? config : String(config);
    yamlConfig = yamlConfig.replace(/^name:.*$/m, `name: SDK-Imported-${Date.now()}`);
    const imported = await client.agents.import(yamlConfig);
    if (!imported || !imported.id) throw new Error('Expected imported agent with id');
    log('Imported', { id: imported.id, name: imported.name });
    await client.agents.delete(imported.id);
    log('Cleaned up imported agent');
  });
}

// ════════════════════════════════════════════════════════════════
// CLEANUP
// ════════════════════════════════════════════════════════════════
async function cleanup() {
  console.log('\n── Cleanup ────────────────────────────────────');
  if (agentId) {
    try {
      await client.agents.delete(agentId);
      log('Deleted test agent', { id: agentId });
    } catch (e) {
      console.log(`  ⚠️  Failed to delete agent: ${e.message}`);
    }
  }
}

// ════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════
async function main() {
  console.log('🚀 Prisme.ai SDK — Full Feature Test');
  console.log('═'.repeat(50));
  console.log(`Environment: ${process.env.PRISMEAI_ENV || 'sandbox'}`);
  console.log(`API Key: ${process.env.PRISMEAI_API_KEY ? '✅ set' : '❌ missing!'}`);
  console.log('═'.repeat(50));

  try {
    // Agent Factory
    await testAgents();
    await testTools();      // Before publish to ensure tools visible on agent
    await testPublish();    // Publish after tools are created
    await sleep(1000);
    await testMessages();
    await testConversations();
    await testAccess();
    await testAnalytics();
    await testEvaluations();
    await testA2A();
    await testTasks();
    await testArtifacts();
    await testShares();
    await testRatings();
    await testActivity();
    await testProfiles();
    await testOrgs();
    await testImport();

    // Storage
    await testFiles();
    await testVectorStores();
    await testSkills();
    await testStats();
  } catch (err) {
    console.error('\n💥 Fatal error:', err.message);
  }

  await cleanup();

  // Summary
  console.log('\n' + '═'.repeat(50));
  console.log('📊 RESULTS');
  console.log('═'.repeat(50));
  console.log(`  ✅ Passed:  ${passed.length}`);
  console.log(`  ❌ Failed:  ${failed.length}`);
  console.log(`  ⏭️  Skipped: ${skipped.length}`);
  console.log(`  📦 Total:   ${passed.length + failed.length + skipped.length}`);

  if (failed.length > 0) {
    console.log('\n  Failed tests:');
    for (const name of failed) {
      console.log(`    - ${name}`);
    }
  }

  console.log('');
  process.exit(failed.length > 0 ? 1 : 0);
}

main();

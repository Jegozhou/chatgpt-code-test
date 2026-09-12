import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));

test('WorkBuddy connector metadata is a stdio MCP connector with bilingual examples', async () => {
  const meta = await readJson('../workbuddy/connector/connector-meta.json');
  assert.equal(meta.source, 'zlbx-bidding-workbench');
  assert.equal(meta.type, 'mcp');
  assert.ok(meta.examples_zh.length >= 2);
  assert.ok(meta.examples_en.length >= 2);

  const mcp = await readJson('../workbuddy/connector/mcp.json');
  const server = mcp.mcpServers['zlbx-bidding-workbench'];
  assert.equal(server.type, 'stdio');
  assert.equal(server.runtime.type, 'node');
  assert.equal(server.runtime.version, '20');
});

test('Buddy App example contains four lean work modes and eight scene capsules', async () => {
  const config = await readJson('../workbuddy/buddy-app-config.example.json');
  assert.equal(config.work_modes.length, 4);
  assert.equal(config.scene_capsules.length, 8);
  assert.deepEqual(config.work_modes.map((m) => m.id), ['opportunity', 'customer', 'competition', 'market']);
  for (const scene of config.scene_capsules) {
    assert.ok(scene.title_zh);
    assert.ok(scene.prompt_zh);
    assert.ok(scene.work_mode);
  }
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';

const root = new URL('../', import.meta.url);
const json = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));

test('static discovery resolves complete datasets and preserves release constraints', async () => {
  const manifest = await json('public/agent/index.json');
  const { mods } = await json('public/agent/mods.json');
  const downloads = await json('src/assets/mod-downloads.json');
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.mcp.hostedEndpoint, null);
  assert.ok(mods.length > 0);
  assert.equal(new Set(mods.map(mod => mod.id)).size, mods.length);
  for (const mod of mods) {
    if (mod.zipEligible) assert.ok(downloads.some(download => download.id === mod.id && download.sha256 === mod.cachedDownload.sha256));
    if (mod.section === 'tools') assert.equal(mod.zipEligible, false);
  }
  assert.equal(mods.find(mod => mod.id === 'lloyd').zipEligible, false);
  for (const dataset of manifest.datasets) {
    const rows = await json(`src${dataset.url}`);
    assert.ok(Array.isArray(rows) && rows.length > 0);
    assert.ok(manifest.routes.some(route => route.path === dataset.page));
  }
});

test('real stdio MCP session discovers, searches, paginates, validates and reads resources', async () => {
  const client = new Client({ name: 'dragoonmods-test', version: '1.0.0' });
  const transport = new StdioClientTransport({ command: process.execPath, args: [fileURLToPath(new URL('tools/mcp-server.mjs', root))], stderr: 'pipe' });
  try {
    await client.connect(transport);
    const tools = await client.listTools();
    assert.deepEqual(tools.tools.map(tool => tool.name).sort(), ['get_mod', 'list_pages', 'query_game_data', 'search_mods']);
    assert.ok(tools.tools.every(tool => tool.annotations.readOnlyHint));
    const found = await client.callTool({ name: 'search_mods', arguments: { query: 'irongoon' } });
    assert.equal(found.structuredContent.mods[0].id, 'irongoon');
    const lloyd = await client.callTool({ name: 'get_mod', arguments: { id: 'lloyd' } });
    assert.equal(lloyd.structuredContent.mod.zipEligible, false);
    const page = await client.callTool({ name: 'query_game_data', arguments: { dataset: 'items', limit: 2, offset: 1 } });
    assert.equal(page.structuredContent.rows.length, 2);
    assert.ok(page.structuredContent.total > 2);
    assert.equal(page.structuredContent.offset, 1);
    for (const arguments_ of [{ dataset: '../private' }, { dataset: 'items', limit: 101 }, { dataset: 'items', url: 'https://example.com' }]) {
      const invalid = await client.callTool({ name: 'query_game_data', arguments: arguments_ });
      assert.equal(invalid.isError, true);
    }
    const resources = await client.listResources();
    assert.equal(resources.resources.length, 3);
    const catalog = await client.readResource({ uri: 'dragoonmods://catalog' });
    assert.deepEqual(JSON.parse(catalog.contents[0].text), await json('public/agent/mods.json'));
  } finally {
    await client.close();
  }
});

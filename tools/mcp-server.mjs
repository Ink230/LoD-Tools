import { readFile } from 'node:fs/promises';
import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { z } from 'zod';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
const manifest = JSON.parse(await read('public/agent/index.json'));
const catalog = JSON.parse(await read('public/agent/mods.json'));
const datasets = manifest.datasets.map(dataset => dataset.id);
const query = z.string().max(200).default('');
const pagination = { offset: z.number().int().min(0).max(100000).default(0), limit: z.number().int().min(1).max(100).default(25) };
const annotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const result = data => ({ content: [{ type: 'text', text: JSON.stringify(data) }], structuredContent: data });
const matches = (value, search) => search.toLowerCase().trim().split(/\s+/).every(term => JSON.stringify(value).toLowerCase().includes(term));

serveStdio(() => {
  const server = new McpServer({ name: 'dragoonmods', version: '1.0.0' });
  server.registerTool('search_mods', {
    description: 'Search this checkout’s curated mod snapshot. Versions are build-time data, not fresh GitHub checks.',
    inputSchema: z.object({ query, version: z.enum(['RB3', 'Latest SC', 'Special build', 'Check compatibility']).optional(), ...pagination }).strict(), annotations,
  }, async ({ query, version, offset, limit }) => {
    const rows = catalog.mods.filter(mod => matches([mod.name, mod.authors.map(author => author.name), mod.description, mod.tags], query)
      && (!version || mod.releases.some(release => release.compatibility === version)
        || (version === 'Check compatibility' && mod.section !== 'tools' && !mod.releases.length)));
    return result({ freshness: catalog.freshness, total: rows.length, offset, mods: rows.slice(offset, offset + limit) });
  });
  server.registerTool('get_mod', {
    description: 'Get a catalog mod by stable ID, including compatibility, release URLs and build-time ZIP eligibility.',
    inputSchema: z.object({ id: z.enum(catalog.mods.map(mod => mod.id)) }).strict(), annotations,
  }, async ({ id }) => result({ freshness: catalog.freshness, mod: catalog.mods.find(mod => mod.id === id) }));
  server.registerTool('query_game_data', {
    description: 'Search complete public game tables, bypassing virtualized UI rows. Source snapshot; provenance linked in result.',
    inputSchema: z.object({ dataset: z.enum(datasets), query, ...pagination }).strict(), annotations,
  }, async ({ dataset, query, offset, limit }) => {
    const rows = JSON.parse(await read(`src/assets/game-data/${dataset}.json`)).filter(row => matches(row, query));
    return result({ dataset, provenance: 'https://dragoonmods.com/assets/game-data/provenance.json', total: rows.length, offset, rows: rows.slice(offset, offset + limit) });
  });
  server.registerTool('list_pages', {
    description: 'List public routes and static agent endpoints. Editors require files explicitly chosen by the user.',
    inputSchema: z.object({}).strict(), annotations,
  }, async () => result(manifest));
  for (const [name, path, mimeType] of [
    ['catalog', 'public/agent/mods.json', 'application/json'],
    ['guide', 'public/agent/guide.md', 'text/markdown'],
    ['provenance', 'src/assets/game-data/provenance.json', 'application/json'],
  ]) {
    server.registerResource(name, `dragoonmods://${name}`, { mimeType }, async uri => ({
      contents: [{ uri: uri.href, mimeType, text: await read(path) }],
    }));
  }
  return server;
}, { onerror: error => console.error(error.message) });

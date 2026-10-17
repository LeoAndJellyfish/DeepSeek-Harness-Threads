/**
 * Host half of the thread bundle.
 *
 * Two jobs:
 *
 * 1. Durable UI state. The Web app binds a new port on every start, and
 *    browser localStorage is origin-scoped, so the thread index, drafts and
 *    the skin preference would reset on every restart. They live in one Host
 *    JSON file behind `/dsh-threads/store` instead; the page shares the
 *    process token cookie with this route, and `connection.requestRejection`
 *    applies the same Host/Origin and browser-authentication checks as the
 *    rest of the Web surface.
 *
 * 2. Preset inheritance. A thread is a forked child Session. `sessions.fork`
 *    copies the parent's history and meta (cwd, parentSession, isSeeded) but
 *    not its Agent preset, so the child would otherwise compose the
 *    registry's default preset and answer with a different persona/tool set.
 *    `agentPresets.select()` cannot repair that after the fact — it refuses
 *    any Session that already has turns, and a fork inherits them. The
 *    supported seam is earlier: when a seeded child is published, record the
 *    parent's preset on the child itself, before its first Agent exists. The
 *    preset registry seeds its `agentPreset` Session projection from that
 *    event, and that projection — not the immutable header — is what Agent
 *    reconstruction reads.
 */

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';

const STORE_ROUTE = '/dsh-threads/store';
const STORE_LIMIT = 2 * 1024 * 1024;
const EMPTY_STORE = '{"version":1,"threads":{},"drafts":{},"skin":"native"}';

export const inject = ['sessions'];

export function apply(ctx) {
  installStore(ctx);
  installPresetInheritance(ctx);
}

/* -------------------------------------------------------------------------- */
/* Durable UI state                                                           */
/* -------------------------------------------------------------------------- */

function storePath() {
  const home = process.env.DSH_HOME || path.join(homedir(), '.dsh');
  return path.join(home, 'dsh-threads', 'store.json');
}

function installStore(ctx) {
  const server = typeof ctx.get === 'function' ? ctx.get('webServer') : undefined;
  const connection = typeof ctx.get === 'function' ? ctx.get('connection') : undefined;
  if (server === undefined || connection === undefined) return;
  if (typeof server.register !== 'function') return;
  ctx.effect(
    () =>
      server.register({
        kind: 'exact',
        path: STORE_ROUTE,
        handler: (req, res) => handleStore(ctx, connection, req, res),
      }),
    'threads: store route',
  );
}

async function handleStore(ctx, connection, req, res) {
  const rejection = connection.requestRejection(req);
  if (rejection !== undefined) {
    res.writeHead(rejection);
    res.end();
    return;
  }
  const file = storePath();
  try {
    if (req.method === 'GET' || req.method === 'HEAD') {
      let body = EMPTY_STORE;
      try {
        body = await readFile(file, 'utf8');
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
      res.writeHead(200, {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      });
      res.end(req.method === 'HEAD' ? undefined : body);
      return;
    }
    if (req.method === 'PUT' || req.method === 'POST') {
      let size = 0;
      const chunks = [];
      for await (const chunk of req) {
        size += chunk.length;
        if (size > STORE_LIMIT) {
          res.writeHead(413);
          res.end();
          return;
        }
        chunks.push(chunk);
      }
      const text = Buffer.concat(chunks).toString('utf8');
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (error) {
        res.writeHead(400);
        res.end();
        return;
      }
      if (parsed === null || typeof parsed !== 'object' || parsed.version !== 1) {
        res.writeHead(400);
        res.end();
        return;
      }
      await mkdir(path.dirname(file), { recursive: true });
      const temporary = file + '.tmp';
      await writeFile(temporary, text, 'utf8');
      await rename(temporary, file);
      res.writeHead(204);
      res.end();
      return;
    }
    res.writeHead(405, { allow: 'GET, PUT' });
    res.end();
  } catch (error) {
    ctx.logger?.warn?.(`[dsh-threads] store request failed: ${String(error)}`);
    res.writeHead(500);
    res.end();
  }
}

/* -------------------------------------------------------------------------- */
/* Agent preset inheritance                                                   */
/* -------------------------------------------------------------------------- */

function installPresetInheritance(ctx) {
  ctx.on('session/created', (session) => {
    const header = session.header;
    if (header === undefined || header.isSeeded !== true) return;
    if (header.parentSession === undefined) return;
    // Subagent children compose their own provider; only user forks inherit.
    if (header.origin === 'subagent') return;
    queueMicrotask(() => {
      inheritPreset(ctx, session, header.parentSession).catch((error) => {
        ctx.logger?.warn?.(`[dsh-threads] preset inheritance skipped: ${String(error)}`);
      });
    });
  });
}

/**
 * Copy the parent's committed preset onto one freshly published fork child.
 * @param ctx - owning plugin context.
 * @param child - the seeded child Session.
 * @param parentId - the Session the fork was taken from.
 */
async function inheritPreset(ctx, child, parentId) {
  const parent = ctx.sessions.get(parentId);
  if (parent === undefined) return;
  const projections = typeof ctx.get === 'function' ? ctx.get('sessionProjections') : undefined;
  const read = (session) => {
    const projected =
      projections && typeof projections.stateOf === 'function'
        ? projections.stateOf(session, 'agentPreset')
        : undefined;
    if (typeof projected === 'string' && projected !== '') return projected;
    const headerPreset = session.header && session.header.agentPreset;
    return typeof headerPreset === 'string' && headerPreset !== '' ? headerPreset : null;
  };
  const preset = read(parent);
  if (preset === null) return;
  if (read(child) === preset) return;
  const presets = typeof ctx.get === 'function' ? ctx.get('agentPresets') : undefined;
  if (presets && typeof presets.resolve === 'function') {
    // Reject presets the current profile no longer defines.
    await presets.resolve(preset);
  }
  child.append('agent-preset/selected', { agentPreset: preset });
}

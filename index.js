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
 * 2. Preset inheritance compatibility. Current Hosts inherit the parent's
 *    Agent preset while forking. Older Hosts may omit it; for those versions,
 *    record `agent-preset/selected` on a freshly published seeded child. A
 *    child that already inherited the preset needs no additional event.
 *    Agent reconstruction reads the `agentPreset` Session projection.
 */

import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';

const STORE_ROUTE = '/dsh-threads/store';
const STORE_LIMIT = 2 * 1024 * 1024;
const EMPTY_STORE = '{"version":1,"threads":{},"drafts":{},"skin":"native"}';
// Shared by route instances so service rebinding never creates a second writer.
const storeWrites = new Map();
const PATCH_FIELDS = new Set(['version', 'threads', 'drafts', 'skin', 'theme']);

class StoreTooLargeError extends Error {}

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
  ctx.inject(['webServer', 'connection'], (webCtx) => {
    webCtx.effect(
      () =>
        webCtx.webServer.register({
          kind: 'exact',
          path: STORE_ROUTE,
          handler: (req, res) => handleStore(webCtx, webCtx.connection, req, res),
        }),
      'threads: store route',
    );
  });
}

async function readStore(file) {
  try {
    return await readFile(file, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return EMPTY_STORE;
  }
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validPatch(patch) {
  if (Object.keys(patch).some((key) => !PATCH_FIELDS.has(key))) return false;
  if (Object.hasOwn(patch, 'skin') && !['native', 'slack'].includes(patch.skin)) return false;
  if (Object.hasOwn(patch, 'theme') && !['default', 'jazz'].includes(patch.theme)) return false;
  if (Object.hasOwn(patch, 'drafts')) {
    if (!isRecord(patch.drafts)) return false;
    if (Object.values(patch.drafts).some((draft) => draft !== null && typeof draft !== 'string')) return false;
  }
  if (Object.hasOwn(patch, 'threads')) {
    if (!isRecord(patch.threads)) return false;
    for (const [parentId, bucket] of Object.entries(patch.threads)) {
      if (parentId === 'v') continue;
      if (!parentId || !isRecord(bucket)) return false;
      for (const [seq, entry] of Object.entries(bucket)) {
        if (!/^(0|[1-9]\d*)$/.test(seq) || !Number.isSafeInteger(Number(seq))) return false;
        if (entry !== null && !isRecord(entry)) return false;
      }
    }
  }
  return true;
}

function copyRecord(value) {
  // Null prototypes keep JSON keys such as __proto__ as ordinary data keys.
  return Object.assign(Object.create(null), isRecord(value) ? value : {});
}

function mergePatch(current, patch) {
  if (!isRecord(current) || current.version !== 1) throw new Error('Invalid persisted store');
  const next = { ...current };
  if (Object.hasOwn(patch, 'threads')) {
    next.threads = copyRecord(current.threads);
    for (const [parentId, changes] of Object.entries(patch.threads)) {
      if (parentId === 'v') continue;
      const bucket = copyRecord(next.threads[parentId]);
      for (const [seq, entry] of Object.entries(changes)) {
        if (entry === null) delete bucket[seq];
        else bucket[seq] = entry;
      }
      if (Object.keys(bucket).length) next.threads[parentId] = bucket;
      else delete next.threads[parentId];
    }
  }
  if (Object.hasOwn(patch, 'drafts')) {
    next.drafts = copyRecord(current.drafts);
    for (const [key, value] of Object.entries(patch.drafts)) {
      if (value === null) delete next.drafts[key];
      else next.drafts[key] = value;
    }
  }
  if (Object.hasOwn(patch, 'skin')) next.skin = patch.skin;
  if (Object.hasOwn(patch, 'theme')) next.theme = patch.theme;
  return next;
}

function persistStore(file, text, patch) {
  const previous = storeWrites.get(file) ?? Promise.resolve();
  const writing = previous.catch(() => {}).then(async () => {
    // The read belongs inside the same queue as the atomic replacement.
    const body = patch ? JSON.stringify(mergePatch(JSON.parse(await readStore(file)), patch)) : text;
    if (Buffer.byteLength(body, 'utf8') > STORE_LIMIT) throw new StoreTooLargeError();
    await mkdir(path.dirname(file), { recursive: true });
    const temporary = `${file}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporary, body, { encoding: 'utf8', flag: 'wx' });
      await rename(temporary, file);
    } finally {
      try {
        await unlink(temporary);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
  });
  storeWrites.set(file, writing);
  const release = () => {
    if (storeWrites.get(file) === writing) storeWrites.delete(file);
  };
  writing.then(release, release);
  return writing;
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
      const body = await readStore(file);
      res.writeHead(200, {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      });
      res.end(req.method === 'HEAD' ? undefined : body);
      return;
    }
    if (req.method === 'PUT' || req.method === 'POST' || req.method === 'PATCH') {
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
      if (!isRecord(parsed) || parsed.version !== 1 || (req.method === 'PATCH' && !validPatch(parsed))) {
        res.writeHead(400);
        res.end();
        return;
      }
      await persistStore(file, text, req.method === 'PATCH' ? parsed : undefined);
      res.writeHead(204);
      res.end();
      return;
    }
    res.writeHead(405, { allow: 'GET, HEAD, PUT, POST, PATCH' });
    res.end();
  } catch (error) {
    if (error instanceof StoreTooLargeError) {
      res.writeHead(413);
      res.end();
      return;
    }
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

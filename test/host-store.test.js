import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import test from 'node:test';
import { apply } from '../index.js';

const STORE_LIMIT = 2 * 1024 * 1024;

async function withStore(run) {
  const root = await mkdtemp(path.join(tmpdir(), 'dsh-threads-host-test-'));
  const previous = process.env.DSH_HOME;
  process.env.DSH_HOME = root;
  try {
    await run({ root, file: path.join(root, 'dsh-threads', 'store.json') });
  } finally {
    if (previous === undefined) delete process.env.DSH_HOME;
    else process.env.DSH_HOME = previous;
    assert.ok(path.resolve(root).startsWith(path.resolve(tmpdir()) + path.sep));
    await rm(root, { recursive: true, force: true });
  }
}

function createHost({ ready = true, rejection } = {}) {
  const services = new Map();
  const injections = [];
  const effects = [];
  const warnings = [];
  let route;
  const server = {
    register(value) {
      route = value;
      return () => { if (route === value) route = undefined; };
    },
  };
  const connection = { requestRejection: () => rejection };
  const ctx = {
    sessions: { get() {} },
    get: (name) => services.get(name),
    on() {},
    effect(callback) {
      const dispose = callback();
      if (typeof dispose === 'function') effects.push(dispose);
      return dispose;
    },
    inject(names, callback) {
      const injection = { names, callback, active: false, effects: [] };
      injections.push(injection);
      refresh();
    },
    logger: { warn: (message) => warnings.push(message) },
  };
  function refresh() {
    for (const injection of injections) {
      const available = injection.names.every((name) => services.has(name));
      if (!available && injection.active) {
        injection.effects.splice(0).reverse().forEach((dispose) => dispose());
        injection.active = false;
      }
      if (available && !injection.active) {
        injection.active = true;
        const child = Object.create(ctx);
        for (const [name, service] of services) child[name] = service;
        child.effect = (callback) => {
          const dispose = callback();
          if (typeof dispose === 'function') injection.effects.push(dispose);
          return dispose;
        };
        injection.callback(child);
      }
    }
  }
  function setReady(value) {
    if (value) {
      services.set('webServer', server);
      services.set('connection', connection);
    } else {
      services.delete('webServer');
      services.delete('connection');
    }
    refresh();
  }
  setReady(ready);
  apply(ctx);
  return {
    get route() { return route; },
    warnings,
    setReady,
    async request(method, value) {
      assert.ok(route, 'store route must be registered');
      const body = Buffer.isBuffer(value) ? value : typeof value === 'string' ? Buffer.from(value) : Buffer.from(JSON.stringify(value ?? {}));
      const request = Readable.from([body]);
      request.method = method;
      const response = { status: undefined, headers: {}, body: undefined };
      await route.handler(request, {
        writeHead(status, headers = {}) { response.status = status; response.headers = headers; },
        end(body) { response.body = body; },
      });
      return response;
    },
  };
}

test('40 concurrent PUT requests across route instances all persist complete JSON', async () => {
  await withStore(async ({ file }) => {
    const hosts = [createHost(), createHost()];
    const payloads = Array.from({ length: 40 }, (_, index) => ({ version: 1, threads: {}, drafts: { value: String(index).repeat(10000) }, skin: 'native' }));
    const responses = await Promise.all(payloads.map((payload, index) => hosts[index % 2].request('PUT', payload)));
    assert.deepEqual(responses.map((response) => response.status), Array(40).fill(204));
    const persisted = await readFile(file, 'utf8');
    assert.ok(payloads.some((payload) => JSON.stringify(payload) === persisted));
    assert.equal(JSON.parse(persisted).version, 1);
    assert.deepEqual(await readdir(path.dirname(file)), ['store.json']);
  });
});

test('failed writes clean temporary files and later writes recover', async () => {
  await withStore(async ({ file }) => {
    const host = createHost();
    await mkdir(file, { recursive: true });
    assert.equal((await host.request('PUT', { version: 1 })).status, 500);
    assert.deepEqual(await readdir(path.dirname(file)), ['store.json']);
    await rm(file, { recursive: true });
    assert.equal((await host.request('PUT', { version: 1, drafts: { recovered: 'yes' } })).status, 204);
    assert.equal(JSON.parse(await readFile(file, 'utf8')).drafts.recovered, 'yes');
  });
});

test('store route follows delayed service availability and replacement', async () => {
  await withStore(async () => {
    const host = createHost({ ready: false });
    assert.equal(host.route, undefined);
    host.setReady(true);
    assert.equal((await host.request('GET')).status, 200);
    host.setReady(false);
    assert.equal(host.route, undefined);
    host.setReady(true);
    assert.equal((await host.request('GET')).status, 200);
  });
});

test('GET, HEAD, JSON validation, request limit and method metadata', async () => {
  await withStore(async ({ file }) => {
    const host = createHost();
    const initial = await host.request('GET');
    assert.equal(initial.status, 200);
    assert.deepEqual(JSON.parse(initial.body), { version: 1, threads: {}, drafts: {}, skin: 'native' });
    assert.equal(initial.headers['cache-control'], 'no-store');
    assert.equal((await host.request('HEAD')).body, undefined);
    for (const invalid of ['{', null, [], { version: 2 }]) {
      const body = invalid === null ? 'null' : invalid;
      assert.equal((await host.request('PUT', body)).status, 400);
    }
    assert.equal((await host.request('PUT', Buffer.alloc(STORE_LIMIT + 1, 32))).status, 413);
    const unsupported = await host.request('DELETE');
    assert.equal(unsupported.status, 405);
    for (const method of ['GET', 'HEAD', 'PUT', 'POST', 'PATCH']) assert.ok(unsupported.headers.allow.split(', ').includes(method));
    await assert.rejects(readFile(file), { code: 'ENOENT' });
    assert.equal((await host.request('POST', { version: 1, drafts: {} })).status, 204);
  });
});

test('host admission rejection leaves the store untouched', async () => {
  await withStore(async ({ root }) => {
    const host = createHost({ rejection: 403 });
    assert.equal((await host.request('PUT', { version: 1 })).status, 403);
    assert.deepEqual(await readdir(root), []);
  });
});

test('concurrent PATCH requests preserve distinct threads and drafts', async () => {
  await withStore(async ({ file }) => {
    const host = createHost();
    const patches = [
      { version: 1, threads: { v: 1, parent: { 10: { childId: 'a' } } }, drafts: { first: 'one' }, skin: 'slack' },
      { version: 1, threads: { parent: { 20: { childId: 'b' } } }, drafts: { second: 'two' }, theme: 'jazz' },
    ];
    const responses = await Promise.all(patches.map((patch) => host.request('PATCH', patch)));
    assert.deepEqual(responses.map((response) => response.status), [204, 204]);
    const result = JSON.parse(await readFile(file, 'utf8'));
    assert.deepEqual(result.threads.parent, { 10: { childId: 'a' }, 20: { childId: 'b' } });
    assert.deepEqual(result.drafts, { first: 'one', second: 'two' });
    assert.equal(result.skin, 'slack');
    assert.equal(result.theme, 'jazz');
  });
});

test('PATCH deletes only named keys and preserves omitted values', async () => {
  await withStore(async ({ file }) => {
    const host = createHost();
    await host.request('PUT', { version: 1, threads: { v: 1, parent: { 1: { childId: 'a' }, 2: { childId: 'b' } } }, drafts: { first: 'one', second: 'two' }, skin: 'slack', theme: 'jazz' });
    assert.equal((await host.request('PATCH', { version: 1, threads: { parent: { 1: null } }, drafts: { first: null } })).status, 204);
    const result = JSON.parse(await readFile(file, 'utf8'));
    assert.deepEqual(result.threads, { v: 1, parent: { 2: { childId: 'b' } } });
    assert.deepEqual(result.drafts, { second: 'two' });
    assert.equal(result.skin, 'slack');
    assert.equal(result.theme, 'jazz');
  });
});

test('invalid PATCH requests are rejected without replacing existing data', async () => {
  await withStore(async ({ file }) => {
    const host = createHost();
    const initial = JSON.stringify({ version: 1, threads: {}, drafts: { keep: 'yes' }, skin: 'native' });
    await host.request('PUT', initial);
    const invalid = [
      { version: 2 }, { version: 1, threads: [] }, { version: 1, threads: { parent: null } },
      { version: 1, threads: { parent: { bad: {} } } }, { version: 1, threads: { parent: { 1: 'bad' } } },
      { version: 1, drafts: [] }, { version: 1, drafts: { key: 42 } },
      { version: 1, skin: 'unknown' }, { version: 1, theme: null }, { version: 1, extra: true },
    ];
    for (const patch of invalid) assert.equal((await host.request('PATCH', patch)).status, 400, JSON.stringify(patch));
    assert.equal(await readFile(file, 'utf8'), initial);
  });
});

test('PATCH merge keeps the total persisted state within the size limit', async () => {
  await withStore(async ({ file }) => {
    const host = createHost();
    const initial = JSON.stringify({ version: 1, threads: {}, drafts: { first: 'x'.repeat(STORE_LIMIT - 200) }, skin: 'native' });
    assert.equal((await host.request('PUT', initial)).status, 204);
    assert.equal((await host.request('PATCH', { version: 1, drafts: { second: 'y'.repeat(300) } })).status, 413);
    assert.equal(await readFile(file, 'utf8'), initial);
  });
});

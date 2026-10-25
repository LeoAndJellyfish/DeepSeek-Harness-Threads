import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import { loadClient, walk } from './helpers/client-harness.js';

const source = await readFile(new URL('../client.js', import.meta.url), 'utf8');
const STORE = 'dsh.threads.v1';
const DRAFTS = 'dsh.threads.drafts.v1';

function deferred() {
  let resolve;
  const promise = new Promise((settle) => { resolve = settle; });
  return { promise, resolve };
}

function loadStore({ fetch = async () => ({ ok: true, json: async () => ({ version: 1 }) }), initial = {} } = {}) {
  const values = new Map(Object.entries(initial));
  const timers = new Map();
  const warnings = [];
  let nextTimer = 0;
  let notifications = 0;
  const localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  const React = {
    createElement: () => null,
    useSyncExternalStore: (subscribe, snapshot) => {
      subscribe(() => { notifications += 1; });
      return snapshot();
    },
  };
  const context = {
    console: { warn: (...args) => warnings.push(args.join(' ')) },
    fetch,
    window: {
      localStorage,
      setTimeout: (callback, delay) => {
        const id = ++nextTimer;
        timers.set(id, { callback, delay });
        return id;
      },
      clearTimeout: (id) => timers.delete(id),
      __ModuleLoader__: { load: ({ factory }) => factory((name) => name === 'react' ? React : {}) },
    },
  };
  const names = ['loadPersisted', 'saveDraft', 'loadDraft', 'setThread', 'threadAt', 'writeStore', 'persistNow', 'useDraft', 'syncStorageEvent'];
  const exposed = names.map((name) => `${name}: typeof ${name} === 'undefined' ? undefined : ${name}`).join(',');
  const modified = source.replace('    return {\n      inject:', `    globalThis.storeApi = {${exposed}};\n    return {\n      inject:`);
  vm.createContext(context);
  vm.runInContext(modified, context);
  return {
    api: context.storeApi, localStorage, timers, warnings,
    get notifications() { return notifications; },
    async runTimer() {
      const [id, timer] = timers.entries().next().value ?? [];
      assert.ok(timer, 'a retry or persistence timer is scheduled');
      timers.delete(id);
      await timer.callback();
      await new Promise(setImmediate);
    },
  };
}

test('Host initialization preserves local edits, new keys and draft deletion made while GET is pending', async () => {
  const response = deferred();
  const harness = loadStore({
    fetch: () => response.promise,
    initial: {
      [DRAFTS]: JSON.stringify({ deleted: 'local copy' }),
      [STORE]: JSON.stringify({ parent: { 41: { childId: 'delete-thread' } } }),
    },
  });
  const loading = harness.api.loadPersisted();
  harness.api.saveDraft('edited', 'new text');
  harness.api.saveDraft('deleted', '');
  harness.api.writeStore({});
  harness.api.setThread('parent', 42, { childId: 'new-child' });
  response.resolve({ ok: true, json: async () => ({ version: 1, threads: { parent: { 41: { childId: 'delete-thread' }, 42: { childId: 'old-child' }, 43: { childId: 'untouched' } } }, drafts: { edited: 'old text', deleted: 'host copy', remote: 'restored' } }) });
  await loading;
  assert.equal(harness.api.loadDraft('edited'), 'new text');
  assert.equal(harness.api.loadDraft('deleted'), '');
  assert.equal(harness.api.loadDraft('remote'), 'restored');
  assert.equal(harness.api.threadAt('parent', 42).childId, 'new-child');
  assert.equal(harness.api.threadAt('parent', 41), undefined);
  assert.equal(harness.api.threadAt('parent', 43).childId, 'untouched');
  assert.ok(harness.timers.size > 0, 'edits made before initialization are scheduled for persistence');
});

test('Host restoration refreshes localStorage and notifies an already mounted draft reader', async () => {
  const response = deferred();
  const harness = loadStore({ fetch: () => response.promise });
  assert.equal(harness.api.useDraft('parent:1'), '');
  const loading = harness.api.loadPersisted();
  response.resolve({ ok: true, json: async () => ({ version: 1, threads: { parent: { 1: { childId: 'restored' } } }, drafts: { 'parent:1': 'host draft' }, skin: 'slack', theme: 'jazz' }) });
  await loading;
  assert.equal(harness.api.useDraft('parent:1'), 'host draft');
  assert.ok(harness.notifications > 0);
  assert.equal(JSON.parse(harness.localStorage.getItem(DRAFTS))['parent:1'], 'host draft');
  assert.equal(JSON.parse(harness.localStorage.getItem(STORE)).parent[1].childId, 'restored');
  assert.equal(harness.localStorage.getItem('dsh.threads.skin'), 'slack');
  assert.equal(harness.localStorage.getItem('dsh.threads.theme'), 'jazz');
});

test('persistence serializes PATCH requests and preserves changes added during an active save', async () => {
  const writes = [];
  const first = deferred();
  const harness = loadStore({ fetch: async (url, options = {}) => {
    if (!options.method) return { ok: true, json: async () => ({ version: 1, threads: { known: { 1: { childId: 'known' } } }, drafts: {} }) };
    writes.push({ method: options.method, body: JSON.parse(options.body) });
    if (writes.length === 1) return first.promise;
    return { ok: true };
  } });
  await harness.api.loadPersisted();
  harness.api.saveDraft('a', 'first');
  const saving = harness.api.persistNow();
  harness.api.saveDraft('b', 'second');
  await harness.api.persistNow();
  assert.equal(writes.length, 1);
  first.resolve({ ok: true });
  await saving;
  await new Promise(setImmediate);
  if (writes.length === 1) await harness.runTimer();
  assert.equal(writes.length, 2);
  assert.equal(writes[0].method, 'PATCH');
  assert.deepEqual(writes[0].body.drafts, { a: 'first' });
  assert.deepEqual(writes[1].body.drafts, { b: 'second' });
  assert.equal(writes[1].body.threads, undefined, 'unchanged snapshots are not sent');
});

test('HTTP failure is reported and retried without losing a newer edit or a deletion', async () => {
  const writes = [];
  const failure = deferred();
  const harness = loadStore({ fetch: async (url, options = {}) => {
    if (!options.method) return { ok: true, json: async () => ({ version: 1, threads: { known: { 1: { childId: 'known' } } }, drafts: { remove: 'delete me' } }) };
    writes.push(JSON.parse(options.body));
    if (writes.length === 1) return failure.promise;
    return { ok: true };
  } });
  await harness.api.loadPersisted();
  harness.api.saveDraft('edited', 'first');
  harness.api.saveDraft('remove', '');
  const saving = harness.api.persistNow();
  harness.api.saveDraft('edited', 'latest');
  failure.resolve({ ok: false, status: 500 });
  await saving;
  assert.ok(harness.warnings.some((warning) => warning.includes('500')));
  await harness.runTimer();
  assert.equal(writes.length, 2);
  assert.deepEqual(writes[1].drafts, { edited: 'latest', remove: null });
});

test('storage synchronization ignores unrelated keys and merges only changed thread anchors', async () => {
  const harness = loadStore({ fetch: async () => ({ ok: true, json: async () => ({ version: 1, threads: { parent: { 1: { childId: 'host' }, 2: { childId: 'preserved' } } }, drafts: {} }) }) });
  await harness.api.loadPersisted();
  harness.localStorage.setItem(STORE, JSON.stringify({ parent: { 1: { childId: 'stale' } } }));
  harness.api.syncStorageEvent({ key: 'unrelated', newValue: 'changed' });
  assert.equal(harness.api.threadAt('parent', 1).childId, 'host');
  harness.api.syncStorageEvent({ key: STORE, oldValue: JSON.stringify({ parent: { 1: { childId: 'before' } } }), newValue: JSON.stringify({ parent: { 1: { childId: 'other-window' } } }) });
  assert.equal(harness.api.threadAt('parent', 1).childId, 'other-window');
  assert.equal(harness.api.threadAt('parent', 2).childId, 'preserved');
  assert.equal(harness.timers.size, 0, 'remote storage events do not write back to Host');
});

test('storage draft deletion updates subscribers without replacing unrelated drafts', () => {
  const harness = loadStore({ initial: { [DRAFTS]: JSON.stringify({ deleted: 'old', preserved: 'keep' }) } });
  harness.api.useDraft('deleted');
  harness.api.syncStorageEvent({ key: DRAFTS, oldValue: JSON.stringify({ deleted: 'old' }), newValue: '{}' });
  assert.equal(harness.api.loadDraft('deleted'), '');
  assert.equal(harness.api.loadDraft('preserved'), 'keep');
  assert.ok(harness.notifications > 0);
});

test('automatic retries stop after three attempts and a new edit restarts saving', async () => {
  let writes = 0;
  const harness = loadStore({ fetch: async (url, options = {}) => {
    if (!options.method) return { ok: true, json: async () => ({ version: 1, threads: { known: { 1: { childId: 'known' } } } }) };
    writes += 1;
    return { ok: false, status: 503 };
  } });
  await harness.api.loadPersisted();
  harness.api.saveDraft('draft', 'unsaved');
  await harness.api.persistNow();
  for (let i = 0; i < 3; i += 1) await harness.runTimer();
  assert.equal(writes, 4);
  assert.equal(harness.timers.size, 0);
  assert.equal(harness.api.loadDraft('draft'), 'unsaved');
  harness.api.saveDraft('draft', 'new edit');
  await harness.runTimer();
  assert.equal(writes, 5);
});

test('first Host migration sends local keys and preferences in a PATCH without the v metadata key', async () => {
  const writes = [];
  const harness = loadStore({
    initial: {
      [STORE]: JSON.stringify({ v: 1, parent: { 5: { childId: 'local-child' } } }),
      [DRAFTS]: JSON.stringify({ 'parent:5': 'local draft' }),
      'dsh.threads.skin': 'slack',
      'dsh.threads.theme': 'jazz',
    },
    fetch: async (url, options = {}) => {
      if (!options.method) return { ok: true, json: async () => ({ version: 1, threads: {}, drafts: {}, skin: 'native' }) };
      writes.push(JSON.parse(options.body));
      return { ok: true };
    },
  });
  await harness.api.loadPersisted();
  await harness.runTimer();
  assert.equal(writes[0].threads.parent[5].childId, 'local-child');
  assert.equal(writes[0].threads.v, undefined);
  assert.equal(writes[0].drafts['parent:5'], 'local draft');
  assert.equal(writes[0].skin, 'slack');
  assert.equal(writes[0].theme, 'jazz');
});

test('a dirty local draft wins over an overlapping storage event without a feedback save', async () => {
  const harness = loadStore({ fetch: async () => ({ ok: true, json: async () => ({ version: 1, threads: { known: { 1: { childId: 'known' } } } }) }) });
  await harness.api.loadPersisted();
  harness.api.saveDraft('draft', 'local pending edit');
  const timersBefore = harness.timers.size;
  harness.api.syncStorageEvent({ key: DRAFTS, oldValue: JSON.stringify({ draft: 'old' }), newValue: JSON.stringify({ draft: 'remote edit', other: 'remote key' }) });
  assert.equal(harness.api.loadDraft('draft'), 'local pending edit');
  assert.equal(harness.api.loadDraft('other'), 'remote key');
  assert.equal(harness.timers.size, timersBefore);
});

test('ThreadPanel displays a Host draft restored after its first render', async () => {
  const response = deferred();
  const snapshot = { running: false };
  const entries = { entries: [] };
  const binding = {
    session: { getSnapshot: () => snapshot, subscribe: () => () => {}, prompt: async () => ({ ok: true }) },
    eventSource: { getSnapshot: () => entries, subscribe: () => () => {} },
  };
  const env = loadClient({
    expose: ['ThreadPanel', 'loadPersisted'],
    fetch: () => response.promise,
    ctx: { sessions: { binding: () => binding, retain: () => ({ ready: Promise.resolve(binding), release: () => {} }) } },
  });
  const view = env.render(env.api.ThreadPanel, {
    sessionId: 'parent',
    useTabInfo: () => ({ tab: { navigation: { params: { parentId: 'parent', seq: 1 } } } }),
  });
  assert.equal(walk(view.tree, (node) => node.type === 'textarea')[0].props.value, '');
  const loading = env.api.loadPersisted();
  response.resolve({ ok: true, json: async () => ({ version: 1, threads: { parent: { 1: { childId: 'child' } } }, drafts: { 'parent:1': 'restored draft' } }) });
  await loading;
  await view.settle();
  assert.equal(walk(view.tree, (node) => node.type === 'textarea')[0].props.value, 'restored draft');
  view.unmount();
  env.dispose();
});

test('cache writes preserve another window keys before its storage event is delivered', async () => {
  const harness = loadStore({ fetch: async () => ({ ok: true, json: async () => ({ version: 1, threads: { parent: { 1: { childId: 'known' } } }, drafts: { known: 'host' } }) }) });
  await harness.api.loadPersisted();
  harness.localStorage.setItem(STORE, JSON.stringify({ parent: { 1: { childId: 'remote-edited' }, 2: { childId: 'remote-created' } } }));
  harness.localStorage.setItem(DRAFTS, JSON.stringify({ known: 'remote edit', remote: 'remote draft' }));
  harness.api.setThread('parent', 3, { childId: 'local-created' });
  harness.api.saveDraft('local', 'local draft');
  const threads = JSON.parse(harness.localStorage.getItem(STORE));
  const drafts = JSON.parse(harness.localStorage.getItem(DRAFTS));
  assert.equal(threads.parent[1].childId, 'remote-edited');
  assert.equal(threads.parent[2].childId, 'remote-created');
  assert.equal(threads.parent[3].childId, 'local-created');
  assert.deepEqual(drafts, { known: 'remote edit', remote: 'remote draft', local: 'local draft' });
});

test('Host initialization preserves another window cache changes while GET is pending', async () => {
  const response = deferred();
  const harness = loadStore({
    fetch: () => response.promise,
    initial: { [STORE]: JSON.stringify({ parent: { 1: { childId: 'before' } } }), [DRAFTS]: JSON.stringify({ draft: 'before' }) },
  });
  const loading = harness.api.loadPersisted();
  harness.localStorage.setItem(STORE, JSON.stringify({ parent: { 1: { childId: 'other-window' }, 2: { childId: 'new-child' } } }));
  harness.localStorage.setItem(DRAFTS, JSON.stringify({ draft: 'other window edit' }));
  response.resolve({ ok: true, json: async () => ({ version: 1, threads: { parent: { 1: { childId: 'old-host' } } }, drafts: { draft: 'old-host' } }) });
  await loading;
  assert.equal(harness.api.threadAt('parent', 1).childId, 'other-window');
  assert.equal(harness.api.threadAt('parent', 2).childId, 'new-child');
  assert.equal(harness.api.loadDraft('draft'), 'other window edit');
  assert.equal(harness.timers.size, 0, 'another window owns persistence of these edits');
});

for (const [locale, message, retryLabel] of [
  ['zh', '尚未保存到主机，正在保留本地更改', '重试保存'],
  ['en', 'Not saved to the host; keeping local changes.', 'Retry saving'],
]) {
  test(`mounted ThreadPanel shows a separate persistence failure and manual retry clears it (${locale})`, async () => {
    let fail = false;
    let prompts = 0;
    let patches = 0;
    const env = loadClient({
      locale,
      expose: ['ThreadPanel', 'loadPersisted', 'saveDraft', 'persistNow', 'usePersistError'],
      console: { warn: () => {} },
      fetch: async (url, options = {}) => {
        if (!options.method) return { ok: true, json: async () => ({ version: 1, threads: { other: { 1: { childId: 'other' } } }, drafts: {} }) };
        patches += 1;
        return fail ? { ok: false, status: 503 } : { ok: true };
      },
      ctx: { sessions: { binding: () => ({ session: { prompt: async () => { prompts += 1; return { ok: true }; } }, eventSource: { getSnapshot: () => ({ entries: [] }) } }) } },
    });
    await env.api.loadPersisted();
    const view = env.render(env.api.ThreadPanel, {
      sessionId: 'parent',
      useTabInfo: () => ({ tab: { navigation: { params: { parentId: 'parent', seq: 1 } } } }),
    });
    env.api.saveDraft('parent:1', 'local draft');
    fail = true;
    await env.api.persistNow();
    await view.settle();
    const alerts = walk(view.tree, (node) => node.props?.className === 'dt-error dt-store-error');
    assert.equal(alerts.length, 1);
    assert.equal(alerts[0].props.children[0].props.children[0], message);
    const retry = walk(alerts[0], (node) => node.type === 'button')[0];
    assert.equal(retry.props.children[0], retryLabel);
    fail = false;
    await retry.props.onClick();
    await view.settle();
    assert.equal(walk(view.tree, (node) => node.props?.className === 'dt-error dt-store-error').length, 0);
    assert.equal(walk(view.tree, (node) => node.type === 'textarea')[0].props.value, 'local draft');
    assert.equal(patches, 2);
    assert.equal(prompts, 0, 'retry saving never invokes the message retry path');
    view.unmount();
    env.dispose();
  });
}

test('manual persistence retry restores a failed initial GET and clears the mounted warning', async () => {
  let gets = 0;
  const env = loadClient({
    expose: ['ThreadPanel', 'loadPersisted', 'retryPersist'],
    console: { warn: () => {} },
    fetch: async () => {
      gets += 1;
      return gets === 1 ? { ok: false, status: 500 } : { ok: true, json: async () => ({ version: 1, threads: { other: { 1: { childId: 'other' } } }, drafts: { 'parent:1': 'restored' } }) };
    },
  });
  const view = env.render(env.api.ThreadPanel, { sessionId: 'parent', useTabInfo: () => ({ tab: { navigation: { params: { parentId: 'parent', seq: 1 } } } }) });
  await env.api.loadPersisted();
  await view.settle();
  assert.equal(walk(view.tree, (node) => node.props?.className === 'dt-error dt-store-error').length, 1);
  await env.api.retryPersist();
  await view.settle();
  assert.equal(gets, 2);
  assert.equal(walk(view.tree, (node) => node.props?.className === 'dt-error dt-store-error').length, 0);
  assert.equal(walk(view.tree, (node) => node.type === 'textarea')[0].props.value, 'restored');
  view.unmount();
  env.dispose();
});

test('special object keys remain own thread and draft keys through cache, merge and PATCH', async () => {
  const writes = [];
  const harness = loadStore({ fetch: async (url, options = {}) => {
    if (!options.method) return { ok: true, json: async () => JSON.parse('{"version":1,"threads":{"__proto__":{"1":{"childId":"host-special"}}},"drafts":{"__proto__":"host-special-draft"}}') };
    writes.push(JSON.parse(options.body));
    return { ok: true };
  } });
  await harness.api.loadPersisted();
  assert.equal(harness.api.threadAt('__proto__', 1).childId, 'host-special');
  assert.equal(harness.api.loadDraft('__proto__'), 'host-special-draft');
  harness.api.setThread('__proto__', 2, { childId: 'local-special' });
  harness.api.saveDraft('__proto__', 'local-special-draft');
  harness.api.saveDraft('constructor', 'constructor draft');
  await harness.api.persistNow();
  assert.equal(Object.hasOwn(writes[0].threads, '__proto__'), true);
  assert.equal(writes[0].threads.__proto__[2].childId, 'local-special');
  assert.equal(Object.hasOwn(writes[0].drafts, '__proto__'), true);
  assert.equal(writes[0].drafts.__proto__, 'local-special-draft');
  assert.equal(writes[0].drafts.constructor, 'constructor draft');
  const cached = JSON.parse(harness.localStorage.getItem(STORE));
  assert.equal(Object.hasOwn(cached, '__proto__'), true);
  assert.equal(cached.__proto__[1].childId, 'host-special');
  assert.equal(cached.__proto__[2].childId, 'local-special');
  harness.api.syncStorageEvent({ key: DRAFTS, oldValue: '{"__proto__":"local-special-draft"}', newValue: '{"__proto__":"remote-special"}' });
  assert.equal(harness.api.loadDraft('__proto__'), 'remote-special');
});

test('an unsupported Host version leaves current thread and draft state intact', async () => {
  const harness = loadStore({
    initial: { [STORE]: JSON.stringify({ parent: { 1: { childId: 'local' } } }), [DRAFTS]: JSON.stringify({ draft: 'local draft' }) },
    fetch: async () => ({ ok: true, json: async () => ({ version: 2, threads: { parent: { 1: { childId: 'wrong-version' } } }, drafts: { draft: 'wrong-version' } }) }),
  });
  await harness.api.loadPersisted();
  assert.equal(harness.api.threadAt('parent', 1).childId, 'local');
  assert.equal(harness.api.loadDraft('draft'), 'local draft');
  assert.ok(harness.warnings.some((warning) => warning.includes('Invalid store response')));
});

test('an empty browser cache accepts special thread and draft keys before Host initialization', () => {
  const harness = loadStore();
  harness.api.setThread('__proto__', 1, { childId: 'new-special' });
  harness.api.saveDraft('__proto__', 'new special draft');
  assert.equal(harness.api.threadAt('__proto__', 1).childId, 'new-special');
  assert.equal(harness.api.loadDraft('__proto__'), 'new special draft');
  assert.equal(Object.hasOwn(JSON.parse(harness.localStorage.getItem(STORE)), '__proto__'), true);
  assert.equal(Object.hasOwn(JSON.parse(harness.localStorage.getItem(DRAFTS)), '__proto__'), true);
});

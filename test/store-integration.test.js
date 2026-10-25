import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import test from 'node:test';
import { apply } from '../index.js';
import { loadClient, walk } from './helpers/client-harness.js';

/** Connect the complete client bundle to the actual Host route without a server. */
async function withHost(run) {
  const root = await mkdtemp(path.join(tmpdir(), 'dsh-threads-integration-'));
  const previous = process.env.DSH_HOME;
  const pages = [];
  const views = [];
  const disposers = [];
  const requests = [];
  const warnings = [];
  let route;
  process.env.DSH_HOME = root;
  try {
    const context = {
      sessions: { get() {} },
      get() {},
      on() {},
      logger: { warn: (...args) => warnings.push(args) },
      inject(names, callback) {
        assert.deepEqual(names.slice().sort(), ['connection', 'webServer']);
        callback({
          ...context,
          connection: { requestRejection: () => undefined },
          webServer: { register(value) {
            route = value;
            return () => { route = undefined; };
          } },
          effect(callback) {
            const dispose = callback();
            if (typeof dispose === 'function') disposers.push(dispose);
          },
        });
      },
    };
    apply(context);
    const fetch = async (url, options = {}) => {
      assert.equal(url, '/dsh-threads/store');
      assert.ok(route, 'the real Host plugin registers the store route');
      const method = options.method || 'GET';
      requests.push({ method, body: options.body && JSON.parse(options.body) });
      const request = Readable.from(options.body ? [Buffer.from(options.body)] : []);
      request.method = method;
      let status;
      let body;
      await route.handler(request, {
        writeHead(value) { status = value; },
        end(value) { body = value; },
      });
      return {
        ok: status >= 200 && status < 300,
        status,
        json: async () => JSON.parse(body),
        text: async () => body ?? '',
      };
    };
    async function createPage(options = {}) {
      const page = loadClient({
        ...options,
        fetch,
        console: { warn: (...args) => warnings.push(args) },
        expose: ['loadPersisted', 'persistNow', 'setThread', 'threadAt', 'writeStore', 'saveDraft', 'loadDraft', 'ThreadPanel', 'syncSharedReplies', 'SharedThreadResults'],
      });
      pages.push(page);
      await page.api.loadPersisted();
      return page;
    }
    async function readHost() {
      const response = await fetch('/dsh-threads/store');
      assert.equal(response.status, 200);
      return response.json();
    }
    await run({
      createPage, readHost, requests,
      file: path.join(root, 'dsh-threads', 'store.json'),
      trackView(view) { views.push(view); return view; },
    });
    assert.deepEqual(warnings, [], 'the integrated persistence path reports no failed requests');
  } finally {
    for (const view of views.reverse()) view.unmount();
    for (const page of pages.reverse()) page.dispose();
    for (const dispose of disposers.reverse()) dispose();
    if (previous === undefined) delete process.env.DSH_HOME;
    else process.env.DSH_HOME = previous;
    assert.ok(path.resolve(root).startsWith(path.resolve(tmpdir()) + path.sep));
    await rm(root, { recursive: true, force: true });
  }
}

test('independent pages merge real PATCH writes and delete only their named keys', async () => {
  await withHost(async ({ createPage, readHost, requests, file }) => {
    const first = await createPage();
    const second = await createPage();
    first.api.setThread('parent', 10, { childId: 'first-child', replies: 1 });
    first.api.saveDraft('parent:10', 'first draft');
    second.api.setThread('parent', 20, { childId: 'second-child', replies: 2 });
    second.api.saveDraft('parent:20', 'second draft');
    await Promise.all([first.api.persistNow(), second.api.persistNow()]);

    const state = await readHost();
    assert.equal(state.threads.parent[10].childId, 'first-child');
    assert.equal(state.threads.parent[20].childId, 'second-child');
    assert.deepEqual(state.drafts, { 'parent:10': 'first draft', 'parent:20': 'second draft' });
    assert.deepEqual(JSON.parse(await readFile(file, 'utf8')), state);
    assert.deepEqual(await readdir(path.dirname(file)), ['store.json']);
    const writes = requests.filter((request) => request.method !== 'GET');
    assert.equal(writes.length, 2);
    for (const write of writes) {
      assert.equal(write.method, 'PATCH');
      assert.equal(write.body.version, 1);
      assert.equal(write.body.threads.v, undefined);
    }

    // This page never loaded the other page's keys; its deletion must retain them.
    first.api.writeStore({});
    first.api.saveDraft('parent:10', '');
    await first.api.persistNow();
    const afterDelete = await readHost();
    assert.equal(afterDelete.threads.parent[10], undefined);
    assert.equal(afterDelete.threads.parent[20].childId, 'second-child');
    assert.deepEqual(afterDelete.drafts, { 'parent:20': 'second draft' });
    const deletion = requests.filter((request) => request.method === 'PATCH').at(-1).body;
    assert.equal(deletion.threads.parent[10], null);
    assert.equal(deletion.drafts['parent:10'], null);

    const reopened = await createPage();
    assert.equal(reopened.api.threadAt('parent', 10), undefined);
    assert.equal(reopened.api.threadAt('parent', 20).childId, 'second-child');
    assert.equal(reopened.api.loadDraft('parent:10'), '');
    assert.equal(reopened.api.loadDraft('parent:20'), 'second draft');
  });
});

function sessionBinding(entries, prompt) {
  const snapshot = {};
  let history = { entries };
  const listeners = new Set();
  return {
    eventSource: { getSnapshot: () => history, subscribe: (notify) => { listeners.add(notify); return () => listeners.delete(notify); } },
    session: { prompt, getSnapshot: () => snapshot, subscribe: () => () => {}, cancel: async () => {} },
    replace(nextEntries) { history = { entries: nextEntries }; for (const notify of listeners) notify(); },
  };
}

test('passive shared results persist and restore without starting the main Agent', async () => {
  await withHost(async ({ createPage, readHost, trackView }) => {
    let childCalls = 0;
    let parentCalls = 0;
    const event = (seq, type, time, data) => ({ type: 'event', event: { seq, type, time, data } });
    const history = [
      event(1, 'user/message', 1000, { content: [{ type: 'text', text: 'parent question' }] }),
      event(11, 'user/message', 2000, { content: [{ type: 'text', text: 'previous question' }] }),
      event(12, 'assistant/message', 3000, { message: { content: [{ type: 'text', text: 'previous answer' }] } }),
      event(13, 'turn/end', 4000, { reason: { kind: 'complete' } }),
    ];
    let requestId;
    const child = sessionBinding(history, async (content, mode, signal, id) => {
      childCalls += 1;
      requestId = id;
      child.replace([...history,
        event(14, 'turn/start', 5000, {}),
        event(15, 'user/message', 5001, { source: { kind: 'user', rpcId: id }, content }),
        event(16, 'assistant/message', 6000, { message: { content: [{ type: 'text', text: 'Completed the requested verification.' }] } }),
        event(17, 'turn/end', 7000, { reason: { kind: 'complete' } }),
      ]);
      return { ok: true };
    });
    const parent = sessionBinding(history, async () => {
      parentCalls += 1;
      throw new Error('passive sharing must never prompt the main Agent');
    });
    const options = { ctx: { sessions: {
      binding: () => parent,
      retain: () => ({ ready: Promise.resolve(child), release() {} }),
    } } };
    const props = {
      sessionId: 'parent',
      useTabInfo: () => ({ tab: { navigation: { params: { parentId: 'parent', seq: 10 } } } }),
    };
    const first = await createPage(options);
    first.api.setThread('parent', 10, { childId: 'child', replies: 1, updatedAt: 2000 });
    first.api.saveDraft('parent:10', 'current unsent question');
    const view = trackView(first.render(first.api.ThreadPanel, props));
    await view.settle();
    walk(view.tree, (node) => node.type === 'input' && node.props.type === 'checkbox')[0].props.onChange({ target: { checked: true } });
    view.flush();
    await walk(view.tree, (node) => node.props.className === 'dt-send-round')[0].props.onClick();
    await view.settle();
    assert.equal(childCalls, 1);
    assert.equal(parentCalls, 0);
    assert.ok(requestId, 'the accepted message has a stable request identity');
    first.api.syncSharedReplies('parent', 10, child.eventSource.getSnapshot().entries, false);
    await first.api.persistNow();
    const shared = await readHost();
    assert.equal(Object.keys(shared.threads.parent[10].sharedReplies).length, 1);
    assert.equal(shared.threads.parent[10].sharedReplies[requestId].status, 'complete');
    assert.match(shared.threads.parent[10].sharedReplies[requestId].answer, /Completed the requested verification/);
    assert.equal(shared.drafts['parent:10'], undefined);

    // The second page has independent localStorage and reads the durable result.
    const reopened = await createPage(options);
    assert.equal(reopened.api.threadAt('parent', 10).sharedReplies[requestId].status, 'complete');
    const restored = trackView(reopened.render(reopened.api.SharedThreadResults, { sessionId: 'parent', seq: 10 }));
    await restored.settle();
    const treeText = JSON.stringify(restored.tree);
    assert.match(treeText, /Completed the requested verification/);
    reopened.api.syncSharedReplies('parent', 10, child.eventSource.getSnapshot().entries, false);
    await reopened.api.persistNow();
    const completed = await readHost();
    assert.equal(childCalls, 1);
    assert.equal(parentCalls, 0);
    assert.equal(Object.keys(completed.threads.parent[10].sharedReplies).length, 1);
    assert.equal(completed.drafts['parent:10'], undefined);
  });
});

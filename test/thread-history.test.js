import assert from 'node:assert/strict';
import test from 'node:test';
import { loadClient, walk } from './helpers/client-harness.js';

const event = (seq, type, time, data = {}) => ({ type: 'event', event: { seq, type, time, data } });
const message = (seq, time, text) => event(seq, 'user/message', time, { content: [{ type: 'text', text }] });

function historyBinding(entries, hasMore = false) {
  let window = { entries, hasMore };
  let snapshot = { hasMore };
  const eventListeners = new Set();
  const sessionListeners = new Set();
  const binding = {
    eventSource: {
      getSnapshot: () => window,
      subscribe(listener) { eventListeners.add(listener); return () => eventListeners.delete(listener); },
    },
    session: {
      getSnapshot: () => snapshot,
      subscribe(listener) { sessionListeners.add(listener); return () => sessionListeners.delete(listener); },
      prompt: async () => ({ ok: true }),
    },
    replace(nextEntries, nextHasMore) {
      window = { entries: nextEntries, hasMore: nextHasMore };
      snapshot = { ...snapshot, hasMore: nextHasMore };
      for (const listener of eventListeners) listener();
      for (const listener of sessionListeners) listener();
    },
  };
  return binding;
}

function environment(t, children) {
  const parent = historyBinding([]);
  const env = loadClient({
    expose: ['ThreadPanel', 'ThreadRepliesLine', 'setThread', 'threadAt', 'loadThreadHistory', 'subscribeStore'],
    console: { warn() {} },
    ctx: { sessions: {
      binding: () => parent,
      retain: (id) => ({ ready: Promise.resolve(children[id]), release() {} }),
    } },
  });
  t.after(() => env.dispose());
  return env;
}

function openPanel(t, env, seq = 10) {
  const navigation = { seq };
  const props = {
    sessionId: 'parent',
    useTabInfo: () => ({ tab: { navigation: { params: { parentId: 'parent', seq: navigation.seq } } } }),
  };
  const view = env.render(env.api.ThreadPanel, props);
  t.after(() => view.unmount());
  return { view, select(next) { navigation.seq = next; view.update(props); } };
}

test('switching panels never applies the previous child history to the next thread', async (t) => {
  const first = historyBinding([message(31, 8000, 'first thread'), event(32, 'turn/end', 9000)]);
  const second = historyBinding([message(21, 1000, 'second thread'), event(22, 'turn/end', 2000)]);
  const env = environment(t, { first, second });
  env.api.setThread('parent', 10, { childId: 'first', replies: 1, updatedAt: 9000 });
  env.api.setThread('parent', 20, { childId: 'second', replies: 1, updatedAt: 2000 });
  const panel = openPanel(t, env);
  await panel.view.settle();
  panel.select(20);
  await panel.view.settle();
  assert.equal(env.api.threadAt('parent', 20).updatedAt, 2000);
  assert.equal(env.api.threadAt('parent', 20).replies, 1);
});

test('a panel loads older own-thread pages and renders the complete reply history', async (t) => {
  const child = historyBinding([message(30, 3000, 'latest')], true);
  let loads = 0;
  child.session.loadOlder = async () => {
    loads += 1;
    child.replace([message(11, 1000, 'first reply'), message(30, 3000, 'latest')], true);
  };
  const env = environment(t, { child });
  env.api.setThread('parent', 10, { childId: 'child', replies: 2, updatedAt: 3000 });
  const { view } = openPanel(t, env);
  await view.settle();
  assert.equal(loads, 1);
  assert.equal(env.api.threadAt('parent', 10).replies, 2);
  const rows = walk(view.tree, (node) => node.type?.name === 'MessageRow');
  assert.equal(rows.length, 2);
  assert.equal(rows[0].props.item.text, 'first reply');
});

test('an incomplete stalled history preserves its known total and stops paging', async (t) => {
  const child = historyBinding([message(500, 5000, 'tail only')], true);
  let loads = 0;
  child.session.loadOlder = async () => { loads += 1; };
  const env = environment(t, { child });
  env.api.setThread('parent', 10, { childId: 'child', replies: 50, updatedAt: 5000 });
  const { view } = openPanel(t, env);
  await view.settle();
  assert.equal(env.api.threadAt('parent', 10).replies, 50);
  assert.equal(loads, 1);
});

test('a complete history corrects an inflated total and excludes the inherited parent', async (t) => {
  const child = historyBinding([message(1, 500, 'parent'), message(11, 1000, 'own reply')]);
  const env = environment(t, { child });
  env.api.setThread('parent', 10, { childId: 'child', replies: 50, updatedAt: 1000 });
  const { view } = openPanel(t, env);
  await view.settle();
  assert.equal(env.api.threadAt('parent', 10).replies, 1);
});

test('background completion pages through the anchor and leaves seenAt unchanged', async (t) => {
  const child = historyBinding([message(30, 3000, 'latest')], true);
  let loads = 0;
  child.session.loadOlder = async () => {
    loads += 1;
    child.replace([message(11, 1000, 'first'), message(30, 3000, 'latest'), event(31, 'turn/end', 4000)], true);
  };
  const env = environment(t, { child });
  env.api.setThread('parent', 10, { childId: 'child', replies: 1, updatedAt: 1000, seenAt: 500 });
  let running = true;
  const props = { sessionId: 'parent', seq: 10, useSessionStatus: (select) => select(new Map([['child', { running }]])) };
  const view = env.render(env.api.ThreadRepliesLine, props);
  t.after(() => view.unmount());
  running = false;
  view.update(props);
  await view.settle();
  const entry = env.api.threadAt('parent', 10);
  assert.equal(loads, 1);
  assert.equal(entry.replies, 2);
  assert.equal(entry.updatedAt, 4000);
  assert.equal(entry.seenAt, 500);
});

test('background completion retains the known total if older history cannot load', async (t) => {
  const child = historyBinding([message(500, 5000, 'tail only')], true);
  const env = environment(t, { child });
  env.api.setThread('parent', 10, { childId: 'child', replies: 50, updatedAt: 1000, seenAt: 500 });
  let running = true;
  const props = { sessionId: 'parent', seq: 10, useSessionStatus: (select) => select(new Map([['child', { running }]])) };
  const view = env.render(env.api.ThreadRepliesLine, props);
  t.after(() => view.unmount());
  running = false;
  view.update(props);
  await view.settle();
  assert.equal(env.api.threadAt('parent', 10).replies, 50);
  assert.equal(env.api.threadAt('parent', 10).updatedAt, 5000);
  assert.equal(env.api.threadAt('parent', 10).seenAt, 500);
});

test('history paging stops at the anchor without loading inherited parent pages', async (t) => {
  const child = historyBinding([message(100, 10000, 'tail')], true);
  let loads = 0;
  child.session.loadOlder = async () => {
    loads += 1;
    const first = loads === 1 ? 50 : 11;
    child.replace([message(first, first * 100, 'older'), ...child.eventSource.getSnapshot().entries], true);
  };
  const env = environment(t, { child });
  assert.equal(await env.api.loadThreadHistory(child, 10), true);
  assert.equal(loads, 2);
  assert.equal(child.session.getSnapshot().hasMore, true, 'unneeded parent history stays unloaded');
});

test('cancelling a pending history load prevents any further page requests', async (t) => {
  const child = historyBinding([message(100, 10000, 'tail')], true);
  let loads = 0;
  let resolvePage;
  child.session.loadOlder = () => {
    loads += 1;
    return new Promise((resolve) => { resolvePage = resolve; });
  };
  const env = environment(t, { child });
  let cancelled = false;
  const pending = env.api.loadThreadHistory(child, 10, () => cancelled);
  assert.equal(loads, 1);
  cancelled = true;
  child.replace([message(50, 5000, 'older'), message(100, 10000, 'tail')], true);
  resolvePage();
  assert.equal(await pending, false);
  assert.equal(loads, 1);
});

test('paging completion never combines an old tail with the new hasMore flag', async (t) => {
  const child = historyBinding([message(30, 3000, 'tail')], true);
  child.session.loadOlder = async () => {
    child.replace([message(11, 1000, 'first'), message(30, 3000, 'tail')], false);
  };
  const env = environment(t, { child });
  env.api.setThread('parent', 10, { childId: 'child', replies: 2, updatedAt: 3000 });
  const observed = [];
  const unsubscribe = env.api.subscribeStore(() => observed.push(env.api.threadAt('parent', 10).replies));
  t.after(unsubscribe);
  const { view } = openPanel(t, env);
  await view.settle();
  assert.equal(env.api.threadAt('parent', 10).replies, 2);
  assert.ok(observed.every((count) => count === 2), 'a partial count must never be persisted between renders');
});

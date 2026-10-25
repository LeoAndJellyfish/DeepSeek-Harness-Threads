import assert from 'node:assert/strict';
import test from 'node:test';
import { loadClient, walk } from './helpers/client-harness.js';

const event = (seq, type, time, data = {}) => ({ type: 'event', event: { seq, type, time, data } });
const user = (seq, id, text = id) => event(seq, 'user/message', seq * 100, {
  source: { kind: 'user', rpcId: id }, content: [{ type: 'text', text }],
});
const answer = (seq, text) => event(seq, 'assistant/message', seq * 100, {
  message: { content: [{ type: 'reasoning', text: 'hidden reasoning' }, { type: 'text', text }] },
});
const share = (id) => ({ id, question: `Question ${id}`, createdAt: 100, updatedAt: 100, status: 'queued', answer: '', userSeq: null, assistantSeq: null });

function fixture(t, ids = ['request-1'], initialEntries = []) {
  let state = { entries: initialEntries, hasMore: false };
  let snapshot = { running: false, hasMore: false };
  const listeners = new Set();
  const counters = { parentPrompts: 0, retains: 0 };
  const child = {
    eventSource: { getSnapshot: () => state, subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); } },
    session: { getSnapshot: () => snapshot, subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); } },
  };
  const env = loadClient({
    expose: ['syncSharedReplies', 'SharedThreadResults', 'ThreadRepliesLine', 'setThread', 'threadAt', 'subscribeStore'],
    console: { warn() {} },
    modules: { '@deepseek-ai/dsh-client-ui-primitives': { MarkdownText: function MarkdownText() {} } },
    ctx: { sessions: {
      binding: () => ({ session: { prompt: async () => { counters.parentPrompts += 1; return { ok: true }; } } }),
      retain: () => { counters.retains += 1; return { ready: Promise.resolve(child), release() {} }; },
    } },
  });
  env.api.setThread('parent', 10, {
    childId: 'child', replies: 0, updatedAt: 100, seenAt: 50,
    sharedReplies: Object.fromEntries(ids.map((id) => [id, share(id)])),
  });
  t.after(() => env.dispose());
  return {
    env, child, counters,
    records: () => env.api.threadAt('parent', 10).sharedReplies,
    replace(entries, running = false) {
      state = { entries, hasMore: false };
      snapshot = { running, hasMore: false };
      for (const listener of listeners) listener();
    },
  };
}

test('registered results collect assistant text and tools without touching seenAt', (t) => {
  const f = fixture(t);
  f.env.api.syncSharedReplies('parent', 10, [
    event(11, 'turn/start', 1100, { turn: 1 }), user(12, 'request-1'),
    event(13, 'tool/call', 1300, { name: 'read_file' }), answer(14, '**Finished**'),
    event(15, 'turn/end', 1500, { reason: { kind: 'completed' } }),
  ], false);
  const result = f.records()['request-1'];
  assert.equal(result.status, 'complete');
  assert.equal(result.answer, '**Finished**');
  assert.equal(result.userSeq, 12);
  assert.equal(result.assistantSeq, 14);
  assert.deepEqual(Array.from(result.tools), ['read_file']);
  assert.equal(result.updatedAt, 1500);
  assert.equal(f.env.api.threadAt('parent', 10).seenAt, 50);
  assert.equal(f.counters.parentPrompts, 0);
});

test('unconsumed shared requests remain queued and repeated synchronization is silent', (t) => {
  const f = fixture(t, ['request-1', 'request-2']);
  let writes = 0;
  const unsubscribe = f.env.api.subscribeStore(() => { writes += 1; });
  t.after(unsubscribe);
  const entries = [user(11, 'request-1'), answer(12, 'first answer')];
  f.env.api.syncSharedReplies('parent', 10, entries, true);
  assert.equal(f.records()['request-2'].status, 'queued');
  const firstWrites = writes;
  f.env.api.syncSharedReplies('parent', 10, entries, true);
  assert.equal(writes, firstWrites);
  assert.equal(Object.keys(f.records()).length, 2);
});

test('consecutive users in one turn never receive the same assistant response', (t) => {
  const f = fixture(t, ['request-1', 'request-2']);
  f.env.api.syncSharedReplies('parent', 10, [
    event(11, 'turn/start', 1100), user(12, 'request-1'), user(13, 'request-2'),
    answer(14, 'answer for second input'), event(15, 'turn/end', 1500, { reason: { kind: 'completed' } }),
  ], false);
  assert.equal(f.records()['request-1'].answer, '');
  assert.equal(f.records()['request-1'].status, 'stopped');
  assert.equal(f.records()['request-1'].outcome, 'superseded');
  assert.equal(f.records()['request-2'].answer, 'answer for second input');
  assert.equal(f.records()['request-2'].status, 'complete');
});

test('an unshared follow-up and later turns cannot overwrite a registered result', (t) => {
  const f = fixture(t);
  f.env.api.syncSharedReplies('parent', 10, [
    user(11, 'request-1'), answer(12, 'registered answer'), user(13, 'private-followup'),
    answer(14, 'unshared answer'), event(15, 'turn/end', 1500, { reason: { kind: 'completed' } }),
    event(16, 'turn/start', 1600), answer(17, 'another turn'),
  ], true);
  assert.equal(f.records()['request-1'].answer, 'registered answer');
  assert.equal(f.records()['request-1'].status, 'complete');
  assert.equal(Object.keys(f.records()).length, 1);
});

test('live text updates one result and durable settlement removes duplicate stream text', (t) => {
  const f = fixture(t);
  const live = (seq, type, text) => ({ type: 'transient', event: {
    type: 'assistant/live-chunk', seq, time: 1300,
    data: { attemptId: 1, turn: 1, step: 1, chunk: { type, text } },
  } });
  const prefix = [user(11, 'request-1'), live(11.5, 'reasoning-delta', 'hidden'), live(11.6, 'text-delta', 'Hello '), live(11.7, 'text-delta', 'world')];
  f.env.api.syncSharedReplies('parent', 10, prefix, true);
  assert.equal(f.records()['request-1'].answer, 'Hello world');
  assert.equal(f.records()['request-1'].status, 'running');
  f.env.api.syncSharedReplies('parent', 10, [...prefix, answer(12, 'Hello world'), event(13, 'turn/end', 1400, { reason: { kind: 'completed' } })], false);
  assert.equal(f.records()['request-1'].answer, 'Hello world');
  assert.equal(f.records()['request-1'].status, 'complete');
  assert.equal(Object.keys(f.records()).length, 1);
});

for (const [reason, expected] of [['error', 'error'], ['aborted', 'stopped'], ['interrupted', 'stopped'], ['max-tokens', 'stopped']]) {
  test(`turn ${reason} is retained on the same result card`, (t) => {
    const f = fixture(t);
    f.env.api.syncSharedReplies('parent', 10, [
      user(11, 'request-1'), answer(12, 'partial answer'),
      event(13, 'turn/end', 1300, { reason: { kind: reason, message: 'failure detail' } }),
    ], false);
    assert.equal(f.records()['request-1'].status, expected);
    assert.equal(f.records()['request-1'].answer, 'partial answer');
    if (reason === 'error') assert.equal(f.records()['request-1'].error, 'failure detail');
  });
}

test('persisted text is bounded while unregistered messages stay private', (t) => {
  const f = fixture(t);
  f.env.api.syncSharedReplies('parent', 10, [user(11, 'request-1'), answer(12, 'x'.repeat(13000)), user(13, 'unregistered'), answer(14, 'secret')], false);
  assert.ok(f.records()['request-1'].answer.length <= 12000);
  assert.doesNotMatch(f.records()['request-1'].answer, /secret|hidden reasoning/);
});

test('main transcript renders and updates a single passive card without any parent prompt', async (t) => {
  const f = fixture(t);
  const view = f.env.render(f.env.api.SharedThreadResults, { sessionId: 'parent', seq: 10 });
  t.after(() => view.unmount());
  await view.settle();
  assert.equal(walk(view.tree, (node) => node.props['data-share-id'] === 'request-1').length, 1);
  f.replace([user(11, 'request-1'), answer(12, '**result**'), event(13, 'turn/end', 1300, { reason: { kind: 'completed' } })]);
  await view.settle();
  const cards = walk(view.tree, (node) => node.props['data-share-id'] === 'request-1');
  assert.equal(cards.length, 1);
  assert.equal(cards[0].props['data-status'], 'complete');
  const markdown = walk(view.tree, (node) => node.type?.name === 'MarkdownText');
  assert.equal(markdown[0].props.text, '**result**');
  assert.equal(f.counters.parentPrompts, 0);
  assert.equal(f.env.api.threadAt('parent', 10).seenAt, 50);
});

test('the turn tail mounts shared results and an unshared thread needs no result subscription', (t) => {
  const f = fixture(t);
  const tail = f.env.render(f.env.api.ThreadRepliesLine, { sessionId: 'parent', seq: 10 });
  t.after(() => tail.unmount());
  assert.equal(walk(tail.tree, (node) => node.type?.name === 'SharedThreadResults').length, 1);
  f.env.api.setThread('parent', 10, { childId: 'child', replies: 0 });
  const view = f.env.render(f.env.api.SharedThreadResults, { sessionId: 'parent', seq: 10 });
  t.after(() => view.unmount());
  assert.equal(view.tree, null);
  assert.equal(f.counters.retains, 0);
});

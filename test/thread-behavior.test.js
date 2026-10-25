import assert from 'node:assert/strict';
import test from 'node:test';
import { loadClient, walk } from './helpers/client-harness.js';

const event = (seq, type, time, data) => ({ type: 'event', event: { seq, type, time, data } });
const fetchStore = async () => ({ ok: true, status: 204, json: async () => ({ version: 1 }) });
const history = [
  event(1, 'user/message', 1000, { content: [{ type: 'text', text: 'parent question' }] }),
  event(11, 'user/message', 2000, { content: [{ type: 'text', text: 'previous accepted question' }] }),
  event(12, 'assistant/message', 3000, { message: { content: [{ type: 'text', text: 'previous answer' }] } }),
  event(13, 'turn/end', 4000, { reason: { kind: 'complete' } }),
];

function binding(entries, prompt, snapshot = {}) {
  const state = { entries };
  return {
    eventSource: { getSnapshot: () => state, subscribe: () => () => {} },
    session: { prompt, getSnapshot: () => snapshot, subscribe: () => () => {}, cancel: async () => {} },
  };
}

async function panel(t, { childPrompt, parentPrompt = async () => ({ ok: true }), entries = history, first = false, snapshot = {}, readAttachment } = {}) {
  const child = binding(entries, childPrompt || (async () => ({ ok: true })), snapshot);
  child.session.readAttachment = readAttachment;
  const parent = binding(history, parentPrompt);
  let forks = 0;
  const env = loadClient({
    expose: ['ThreadPanel', 'ThreadRepliesLine', 'setThread', 'threadAt', 'saveDraft', 'loadDraft', 'threadActivity', 'queueSharedReply'],
    console: { warn() {} },
    fetch: fetchStore,
    ctx: { sessions: {
      binding: () => parent,
      fork: async () => { forks += 1; return 'child'; },
      retain: () => ({ ready: Promise.resolve(child), release() {} }),
    } },
    globals: {
      FileReader: class { readAsDataURL() { this.result = 'data:image/png;base64,AQID'; this.onload(); } },
      Image: class { naturalWidth = 1; naturalHeight = 1; set src(value) { this.onload(); } },
    },
  });
  if (!first) env.api.setThread('parent', 10, { childId: 'child', replies: 1, updatedAt: 2000, seenAt: 1000 });
  env.api.saveDraft('parent:10', 'current unsent question');
  const props = {
    sessionId: 'parent',
    useTabInfo: () => ({ tab: { navigation: { params: { parentId: 'parent', seq: 10 } } } }),
  };
  const view = env.render(env.api.ThreadPanel, props);
  await view.settle();
  t.after(() => { view.unmount(); env.dispose(); });
  const find = (className) => walk(view.tree, (node) => (node.props.className || '').split(' ').includes(className))[0];
  return { env, view, child, parent, props, find, get forks() { return forks; } };
}

test('failed sends retry the failed draft instead of the previous transcript message', async (t) => {
  const calls = [];
  const fixture = await panel(t, { childPrompt: async (parts) => {
    calls.push(parts);
    return calls.length === 1 ? { ok: false, error: { message: 'rejected' } } : { ok: true };
  } });
  await fixture.find('dt-send-round').props.onClick();
  await fixture.view.settle();
  assert.equal(fixture.env.api.loadDraft('parent:10'), 'current unsent question');
  await fixture.find('dt-retry').props.onClick();
  await fixture.view.settle();
  assert.match(calls[1][0].text, /current unsent question$/);
  assert.equal(fixture.env.api.loadDraft('parent:10'), '');
});

test('failed image-only sends preserve image bytes on retry', async (t) => {
  const calls = [];
  const fixture = await panel(t, { childPrompt: async (parts) => {
    calls.push(parts);
    return calls.length === 1 ? { ok: false, error: { message: 'rejected' } } : { ok: true };
  } });
  fixture.find('dt-input').props.onChange({ target: { value: '' } });
  fixture.view.flush();
  fixture.find('dt-input').props.onPaste({
    clipboardData: { files: [{ type: 'image/png', size: 3, name: 'image.png' }] }, preventDefault() {},
  });
  await fixture.view.settle();
  await fixture.find('dt-send-round').props.onClick();
  await fixture.view.settle();
  await fixture.find('dt-retry').props.onClick();
  await fixture.view.settle();
  assert.equal(calls[1].length, 2);
  assert.equal(calls[1][1].data, 'AQID');
  assert.equal(calls[1][1].mediaType, 'image/png');
});

test('sharing a thread reply queues one result card while the parent Agent receives no prompt', async (t) => {
  let childCalls = 0;
  const parentCalls = [];
  const childRequests = [];
  const fixture = await panel(t, {
    childPrompt: async (...args) => { childCalls += 1; childRequests.push(args); return { ok: true }; },
    parentPrompt: async (parts) => {
      parentCalls.push(parts);
      return parentCalls.length === 1 ? { ok: false, error: { message: 'parent rejected' } } : { ok: true };
    },
  });
  walk(fixture.view.tree, (node) => node.type === 'input' && node.props.type === 'checkbox')[0].props.onChange({ target: { checked: true } });
  fixture.view.flush();
  await fixture.find('dt-send-round').props.onClick();
  await fixture.view.settle();
  assert.equal(childCalls, 1);
  assert.equal(parentCalls.length, 0);
  const requestId = childRequests[0][3];
  assert.match(requestId, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  const shared = fixture.env.api.threadAt('parent', 10).sharedReplies;
  assert.deepEqual(Object.keys(shared), [requestId]);
  assert.equal(shared[requestId].id, requestId);
  assert.equal(shared[requestId].question, 'current unsent question');
  assert.equal(shared[requestId].status, 'queued');
  assert.equal(shared[requestId].answer, '');
  assert.equal(shared[requestId].userSeq, null);
  assert.equal(shared[requestId].assistantSeq, null);
  assert.equal(fixture.env.api.loadDraft('parent:10'), '');
});

test('a rejected first message retries the existing fork instead of creating another', async (t) => {
  let calls = 0;
  const fixture = await panel(t, { first: true, entries: [], childPrompt: async () => {
    calls += 1;
    return calls === 1 ? { ok: false, error: { message: 'rejected' } } : { ok: true };
  } });
  await fixture.find('dt-send-round').props.onClick();
  await fixture.view.settle();
  assert.equal(fixture.forks, 1);
  assert.equal(fixture.env.api.threadAt('parent', 10).replies, 0, 'unaccepted message is not counted');
  await fixture.find('dt-retry').props.onClick();
  await fixture.view.settle();
  assert.equal(calls, 2);
  assert.equal(fixture.forks, 1);
});

test('background completion counts only thread messages and preserves unread state', async (t) => {
  const child = binding(history, async () => ({ ok: true }));
  const env = loadClient({
    expose: ['ThreadRepliesLine', 'setThread', 'threadAt'],
    console: { warn() {} },
    fetch: fetchStore,
    ctx: { sessions: { retain: () => ({ ready: Promise.resolve(child), release() {} }) } },
  });
  env.api.setThread('parent', 10, { childId: 'child', replies: 1, updatedAt: 2000, seenAt: 1000 });
  let running = true;
  const props = { sessionId: 'parent', seq: 10, useSessionStatus: (select) => select(new Map([['child', { running }]])) };
  const view = env.render(env.api.ThreadRepliesLine, props);
  t.after(() => { view.unmount(); env.dispose(); });
  running = false;
  view.update(props);
  await view.settle();
  const entry = env.api.threadAt('parent', 10);
  assert.equal(entry.replies, 1);
  assert.equal(entry.updatedAt, 4000);
  assert.equal(entry.seenAt, 1000);
  assert.ok(entry.updatedAt > entry.seenAt);
});

test('two failed retries reuse the same requestId across a panel remount and queue one shared card', async (t) => {
  const childCalls = [];
  let parentCalls = 0;
  const fixture = await panel(t, {
    childPrompt: async (...args) => { childCalls.push(args); return { ok: childCalls.length > 2, error: { message: 'child rejected' } }; },
    parentPrompt: async () => { parentCalls += 1; return { ok: true }; },
  });
  walk(fixture.view.tree, (node) => node.type === 'input' && node.props.type === 'checkbox')[0].props.onChange({ target: { checked: true } });
  fixture.view.flush();
  await fixture.find('dt-send-round').props.onClick();
  await fixture.view.settle();
  assert.equal(fixture.env.api.threadAt('parent', 10).sharedReplies, undefined, 'rejected child admission does not create a result card');
  await fixture.find('dt-retry').props.onClick();
  await fixture.view.settle();
  fixture.view.unmount();
  const remounted = fixture.env.render(fixture.env.api.ThreadPanel, fixture.props);
  t.after(() => remounted.unmount());
  await remounted.settle();
  const retry = walk(remounted.tree, (node) => node.props.className === 'dt-retry')[0];
  assert.ok(retry);
  await retry.props.onClick();
  await remounted.settle();
  assert.equal(childCalls.length, 3);
  assert.equal(parentCalls, 0);
  assert.ok(childCalls[0][3]);
  assert.deepEqual(childCalls.map((args) => args[3]), [childCalls[0][3], childCalls[0][3], childCalls[0][3]]);
  const shared = fixture.env.api.threadAt('parent', 10).sharedReplies;
  assert.deepEqual(Object.keys(shared), [childCalls[0][3]]);
});

test('legacy pendingMain records are cleared after reload without prompting either Agent', async (t) => {
  let childCalls = 0;
  let parentCalls = 0;
  const fixture = await panel(t, {
    childPrompt: async () => { childCalls += 1; return { ok: true }; },
    parentPrompt: async () => ({ ok: ++parentCalls > 1, error: { message: 'parent rejected' } }),
  });
  fixture.env.api.setThread('parent', 10, { childId: 'child', replies: 1, pendingMain: { text: 'old pending text', rawDraft: 'old pending text' } });
  const env = loadClient({
    expose: ['ThreadPanel', 'threadAt'], console: { warn() {} }, fetch: fetchStore,
    storage: {
      'dsh.threads.v1': fixture.env.localStorage.getItem('dsh.threads.v1'),
      'dsh.threads.drafts.v1': fixture.env.localStorage.getItem('dsh.threads.drafts.v1'),
    },
    ctx: { sessions: {
      binding: () => fixture.parent,
      retain: () => ({ ready: Promise.resolve(fixture.child), release() {} }),
    } },
  });
  const view = env.render(env.api.ThreadPanel, fixture.props);
  t.after(() => { view.unmount(); env.dispose(); });
  await view.settle();
  await env.runTimers();
  await view.settle();
  assert.equal(childCalls, 0);
  assert.equal(parentCalls, 0);
  assert.equal(env.api.threadAt('parent', 10).pendingMain, undefined);
  assert.equal(walk(view.tree, (node) => node.props.className === 'dt-retry').length, 0);
});

test('reopened send rejection retries the current draft rather than historical text', async (t) => {
  const calls = [];
  const fixture = await panel(t, {
    snapshot: { promptError: { op: 'send', error: { message: 'rejected' } } },
    childPrompt: async (parts) => { calls.push(parts); return { ok: true }; },
  });
  await fixture.find('dt-retry').props.onClick();
  await fixture.view.settle();
  assert.match(calls[0][0].text, /current unsent question$/);
});

test('historical image retry reads durable attachment bytes', async (t) => {
  const calls = [];
  const reads = [];
  const fixture = await panel(t, {
    entries: [event(11, 'user/message', 2000, { content: [{
      type: 'image', attachment: { attachmentId: 'image-id', mediaType: 'image/png', name: 'image.png' },
    }] })],
    snapshot: { promptError: { op: 'send', error: { message: 'rejected' } } },
    readAttachment: async (id) => { reads.push(id); return { ok: true, value: { data: Uint8Array.of(1, 2, 3) } }; },
    childPrompt: async (parts) => { calls.push(parts); return { ok: true }; },
  });
  fixture.find('dt-input').props.onChange({ target: { value: '' } });
  fixture.view.flush();
  await fixture.find('dt-retry').props.onClick();
  await fixture.view.settle();
  assert.deepEqual(reads, ['image-id']);
  assert.equal(calls[0][1].data, 'AQID');
  assert.equal(calls[0][1].mediaType, 'image/png');
});

test('duplicate click handlers cannot enqueue the same in-flight message twice', async (t) => {
  let finish;
  let calls = 0;
  const fixture = await panel(t, { childPrompt: async () => {
    calls += 1;
    return new Promise((resolve) => { finish = resolve; });
  } });
  const click = fixture.find('dt-send-round').props.onClick;
  const first = click();
  const second = click();
  for (let i = 0; i < 5; i++) await Promise.resolve();
  assert.equal(calls, 1);
  finish({ ok: true });
  await Promise.all([first, second]);
});

test('a remounted panel cannot duplicate a shared thread request that is still in flight', async (t) => {
  let finish;
  let childCalls = 0;
  let parentCalls = 0;
  const fixture = await panel(t, {
    childPrompt: async () => {
      childCalls += 1;
      return new Promise((resolve) => { finish = resolve; });
    },
    parentPrompt: async () => { parentCalls += 1; return { ok: true }; },
  });
  walk(fixture.view.tree, (node) => node.type === 'input' && node.props.type === 'checkbox')[0].props.onChange({ target: { checked: true } });
  fixture.view.flush();
  const pending = fixture.find('dt-send-round').props.onClick();
  for (let i = 0; i < 10; i++) await Promise.resolve();
  assert.equal(childCalls, 1);
  assert.equal(parentCalls, 0);
  fixture.view.unmount();
  const remounted = fixture.env.render(fixture.env.api.ThreadPanel, fixture.props);
  t.after(() => remounted.unmount());
  await remounted.settle();
  await walk(remounted.tree, (node) => node.props.className === 'dt-send-round')[0].props.onClick();
  assert.equal(childCalls, 1);
  assert.equal(parentCalls, 0);
  finish({ ok: true });
  await pending;
});

test('sharing defaults off and a normal send never creates a shared card or prompts the parent', async (t) => {
  let parentCalls = 0;
  const fixture = await panel(t, { parentPrompt: async () => { parentCalls += 1; return { ok: true }; } });
  const checkbox = walk(fixture.view.tree, (node) => node.type === 'input' && node.props.type === 'checkbox')[0];
  assert.equal(checkbox.props.checked, false);
  await fixture.find('dt-send-round').props.onClick();
  await fixture.view.settle();
  assert.equal(parentCalls, 0);
  assert.equal(fixture.env.api.threadAt('parent', 10).sharedReplies, undefined);
});

test('repeated share receipts for the same requestId preserve one existing result card', async (t) => {
  const fixture = await panel(t);
  const request = { requestId: '12972316-69c0-4d39-9978-02ada96fae3f', shareToMain: true, text: 'question', images: [] };
  fixture.env.api.queueSharedReply('parent', 10, request, 'image question');
  const first = fixture.env.api.threadAt('parent', 10).sharedReplies[request.requestId];
  fixture.env.api.queueSharedReply('parent', 10, request, 'image question');
  const shared = fixture.env.api.threadAt('parent', 10).sharedReplies;
  assert.equal(Object.keys(shared).length, 1);
  assert.equal(shared[request.requestId], first);
});

test('bringing a result to the main conversation only updates its preserved draft', async (t) => {
  let parentCalls = 0;
  let persisted = 0;
  let mainDraft = 'Existing main draft';
  const fixture = await panel(t, { parentPrompt: async () => { parentCalls += 1; return { ok: true }; } });
  fixture.view.update({
    ...fixture.props,
    useInput: (select) => select({ draft: mainDraft }),
    inputActions: { setDraft: (value) => { mainDraft = value; }, persistDraft: () => { persisted += 1; } },
  });
  const bringBack = walk(fixture.view.tree, (node) => node.type === 'button' && node.props.children?.includes('Bring to main chat'))[0];
  assert.ok(bringBack);
  bringBack.props.onClick();
  assert.match(mainDraft, /^Existing main draft\n\n/);
  assert.match(mainDraft, /previous answer/);
  assert.equal(persisted, 1);
  assert.equal(parentCalls, 0);
});

test('shared questions are limited to 1000 characters and preserve other result cards', async (t) => {
  const fixture = await panel(t);
  fixture.env.api.queueSharedReply('parent', 10, { requestId: 'first', shareToMain: true, text: 'first question' }, 'image question');
  fixture.env.api.queueSharedReply('parent', 10, { requestId: 'second', shareToMain: true, text: 'x'.repeat(1200) }, 'image question');
  const shared = fixture.env.api.threadAt('parent', 10).sharedReplies;
  assert.equal(shared.second.question.length, 1000);
  assert.equal(shared.first.question, 'first question');
});

test('a shared image-only question records a readable summary without prompting the parent', async (t) => {
  let parentCalls = 0;
  const fixture = await panel(t, { parentPrompt: async () => { parentCalls += 1; return { ok: true }; } });
  fixture.find('dt-input').props.onChange({ target: { value: '' } });
  walk(fixture.view.tree, (node) => node.type === 'input' && node.props.type === 'checkbox')[0].props.onChange({ target: { checked: true } });
  fixture.view.flush();
  fixture.find('dt-input').props.onPaste({ clipboardData: { files: [{ type: 'image/png', size: 3, name: 'image.png' }] }, preventDefault() {} });
  await fixture.view.settle();
  await fixture.find('dt-send-round').props.onClick();
  await fixture.view.settle();
  const shared = Object.values(fixture.env.api.threadAt('parent', 10).sharedReplies);
  assert.equal(shared.length, 1);
  assert.match(shared[0].question, /Image question/);
  assert.equal(parentCalls, 0);
});

test('historical retry reuses the original message RPC identity', async (t) => {
  const requestId = '13e49aa9-583a-4447-a77a-ce75fcd8f787';
  const calls = [];
  const fixture = await panel(t, {
    entries: [event(11, 'user/message', 2000, { source: { kind: 'user', rpcId: requestId }, content: [{ type: 'text', text: 'historical question' }] })],
    snapshot: { promptError: { op: 'send', error: { message: 'rejected' } } },
    childPrompt: async (...args) => { calls.push(args); return { ok: true }; },
  });
  fixture.find('dt-input').props.onChange({ target: { value: '' } });
  fixture.view.flush();
  await fixture.find('dt-retry').props.onClick();
  assert.equal(calls[0][3], requestId);
});

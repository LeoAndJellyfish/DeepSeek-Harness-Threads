import assert from 'node:assert/strict';
import test from 'node:test';
import { loadClient, walk } from './helpers/client-harness.js';

test('opening a thread uses a persistent resource address and registers its matcher', (t) => {
  const opened = [];
  const types = [];
  const env = loadClient({
    expose: ['openThreadPanel'], console: { warn() {} },
    ctx: {
      sidebarRight: { openResource: (...args) => opened.push(args) },
      sidebarRightTabs: { register: (definition) => { types.push(definition); return () => {}; } },
    },
  });
  t.after(() => env.dispose());
  env.api.openThreadPanel('parent id/%', 42);
  assert.equal(opened[0][0], 'dsh-resource://dsh-threads/parent%20id%2F%25/42');
  assert.equal(opened[0][1].kind, 'thread');
  const type = types.find((definition) => definition.kind === 'thread');
  assert.ok(type.patterns.includes('dsh-resource://dsh-threads/**'));
});

for (const field of ['navigation', 'contentId']) {
  test(`a restored thread recovers its anchor from ${field} without navigation params`, async (t) => {
    const env = loadClient({ expose: ['ThreadPanel', 'ThreadTitle', 'setThread'], console: { warn() {} } });
    t.after(() => env.dispose());
    env.api.setThread('parent', 42, { childId: 'child', replies: 1, quote: { assistant: 'Restored anchor' } });
    const address = 'dsh-resource://dsh-threads/parent/42';
    const tab = field === 'navigation' ? { navigation: { address, params: undefined } } : { contentId: address };
    const props = { sessionId: 'parent', useTabInfo: () => ({ tab }) };
    const view = env.render(env.api.ThreadPanel, props);
    const title = env.render(env.api.ThreadTitle, props);
    t.after(() => { view.unmount(); title.unmount(); });
    await view.settle();
    assert.match(JSON.stringify(view.tree), /Restored anchor/);
    assert.doesNotMatch(JSON.stringify(view.tree), /NaN/);
    assert.match(JSON.stringify(title.tree), /Restored anchor/);
    assert.equal(walk(view.tree, (node) => node.type === 'textarea')[0].props.disabled, false);
  });
}

test('a legacy tab with no recoverable anchor displays the thread list', (t) => {
  const env = loadClient({ expose: ['ThreadPanel', 'ThreadsList'], console: { warn() {} } });
  t.after(() => env.dispose());
  const view = env.render(env.api.ThreadPanel, {
    sessionId: 'parent', useTabInfo: () => ({ tab: { contentId: 'dsh-resource://page/thread', navigation: { params: undefined } } }),
  });
  t.after(() => view.unmount());
  assert.equal(view.tree.type, env.api.ThreadsList);
  assert.doesNotMatch(JSON.stringify(view.tree), /NaN/);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { loadClient, walk } from './helpers/client-harness.js';

const THEME = 'dsh.threads.theme';
const MIGRATED = 'dsh.threads.host-migration.v2';
const RAIL = 'data-dsh-threads-slack-sidebar';
const FRAME = 'data-dsh-threads-slack-frame';

function shell() {
  const styles = new Set();
  const observers = new Set();
  function element() {
    const attributes = new Map();
    return {
      dataset: {}, style: {},
      getAttribute: (name) => attributes.get(name) ?? null,
      setAttribute: (name, value) => attributes.set(name, String(value)),
      removeAttribute: (name) => attributes.delete(name),
      remove() { styles.delete(this); },
    };
  }
  let frame, rail, logo;
  function replace() {
    frame = element(); rail = element(); logo = element();
    logo.parentElement = rail;
    rail.closest = () => frame;
    return { frame, rail };
  }
  replace();
  const document = {
    documentElement: { dataset: {} }, body: element(),
    head: { appendChild: (style) => styles.add(style) },
    createElement: element,
    querySelector(selector) {
      if (selector.includes('_logoRow')) return logo;
      if (selector.includes(RAIL) && rail.getAttribute(RAIL) !== null) return rail;
      if (selector.includes(FRAME) && frame.getAttribute(FRAME) !== null) return frame;
      return null;
    },
  };
  class MutationObserver {
    constructor(callback) { this.callback = callback; }
    observe() { observers.add(this); }
    disconnect() { observers.delete(this); }
  }
  return {
    document, MutationObserver, styles, observers, replace,
    get rail() { return rail; }, get frame() { return frame; },
    mutate() { for (const observer of [...observers]) observer.callback([]); },
  };
}

function fixture(options = {}) {
  const dom = shell();
  const layers = new Map();
  let installs = 0, disposals = 0;
  const theme = { overrideTokens(id, tokens) {
    assert.equal(layers.size, 0, 'previous palette must be disposed before installing the next');
    layers.set(id, tokens); installs++;
    return () => { assert.equal(layers.delete(id), true); disposals++; };
  } };
  const harness = loadClient({
    expose: ['setThemeMode', 'setSkin', 'themeMode', 'skin', 'loadPersisted', 'persistNow', 'syncStorageEvent', 'SlackThemeSetting', 'SlackAppearanceSetting', 'SettingsRow'],
    storage: { [MIGRATED]: '1' },
    fetch: async () => ({ ok: true, json: async () => ({ version: 1 }) }),
    ...options,
    ctx: { get: (name) => name === 'theme' ? theme : undefined, ...options.ctx },
    globals: { document: dom.document, MutationObserver: dom.MutationObserver, ...options.globals },
  });
  return { ...harness, dom, layers, get installs() { return installs; }, get disposals() { return disposals; } };
}

test('palette and message layout remain independent across all six combinations', () => {
  const h = fixture();
  for (const skin of ['native', 'slack']) {
    h.api.setSkin(skin);
    for (const mode of ['default', 'slack', 'jazz']) {
      h.api.setThemeMode(mode);
      assert.equal(h.api.themeMode, mode);
      assert.equal(h.api.skin, skin);
      assert.equal(h.layers.size, mode === 'default' ? 0 : 1);
      assert.equal(h.dom.observers.size, mode === 'slack' ? 1 : 0);
    }
  }
  h.dispose();
  assert.equal(h.layers.size, 0);
  assert.equal(h.installs, h.disposals);
});

test('cached palette preferences apply on startup including existing Jazz preference', () => {
  for (const mode of ['default', 'jazz', 'slack']) {
    const h = fixture({ storage: { [MIGRATED]: '1', [THEME]: mode } });
    assert.equal(h.api.themeMode, mode);
    assert.equal(h.layers.size, mode === 'default' ? 0 : 1);
    h.dispose();
    assert.equal(h.layers.size, 0);
  }
});

test('classic Slack palette supplies light/dark tokens and releases every rail resource', () => {
  const h = fixture();
  const baseStyles = h.dom.styles.size;
  h.api.setThemeMode('slack');
  const tokens = [...h.layers.values()][0];
  assert.equal(tokens['--dsw-alias-bg-base'].light, '#FFFFFF');
  assert.equal(tokens['--dsw-alias-bg-base'].dark, '#1A1D21');
  assert.equal(tokens['--dsw-alias-brand-primary'].light, '#007A5A');
  assert.ok(h.dom.rail.getAttribute(RAIL));
  assert.ok(h.dom.frame.getAttribute(FRAME));
  assert.equal(h.dom.styles.size, baseStyles + 1);
  const css = [...h.dom.styles].find((style) => style.dataset.theme === 'slack').textContent;
  assert.match(css, /#304977/);
  assert.match(css, /body\[data-ds-dark-theme\]/);
  h.api.setThemeMode('jazz');
  assert.equal(h.dom.rail.getAttribute(RAIL), null);
  assert.equal(h.dom.frame.getAttribute(FRAME), null);
  assert.equal(h.dom.observers.size, 0);
  assert.equal(h.dom.styles.size, baseStyles);
  assert.equal([...h.layers.values()][0]['--dsw-alias-brand-primary'].light, '#4C64A6');
  h.api.setThemeMode('slack');
  h.dispose();
  assert.equal(h.layers.size, 0);
  assert.equal(h.dom.observers.size, 0);
  assert.equal(h.dom.styles.size, 0);
  assert.equal(h.dom.rail.getAttribute(RAIL), null);
  assert.equal(h.dom.frame.getAttribute(FRAME), null);
});

test('shell replacement restores old attributes and unload preserves attributes owned by others', () => {
  const h = fixture();
  h.dom.rail.setAttribute(RAIL, 'previous-value');
  const previous = { rail: h.dom.rail, frame: h.dom.frame };
  h.api.setThemeMode('slack');
  h.dom.replace();
  h.dom.mutate();
  assert.equal(previous.rail.getAttribute(RAIL), 'previous-value');
  assert.equal(previous.frame.getAttribute(FRAME), null);
  assert.ok(h.dom.rail.getAttribute(RAIL));
  h.dom.frame.setAttribute(FRAME, 'another-owner');
  h.api.setThemeMode('default');
  assert.equal(h.dom.rail.getAttribute(RAIL), null);
  assert.equal(h.dom.frame.getAttribute(FRAME), 'another-owner');
  h.dispose();
});

test('failed rail mounting rolls back token overrides and appended style', () => {
  const h = fixture({ globals: { MutationObserver: class { observe() { throw new Error('fixture failure'); } disconnect() {} } } });
  const count = h.dom.styles.size;
  h.api.setThemeMode('slack');
  assert.equal(h.layers.size, 0);
  assert.equal(h.dom.styles.size, count);
  assert.equal(h.dom.rail.getAttribute(RAIL), null);
  h.dispose();
});

test('settings exposes three palette choices and preserves the independent layout preference', () => {
  const h = fixture({ locale: 'zh' });
  const component = h.render(h.api.SlackThemeSetting);
  const row = h.render(h.api.SettingsRow, component.tree.props);
  const select = walk(row.tree, (node) => node.type === 'select')[0];
  assert.ok(select.props['aria-label']);
  assert.deepEqual(walk(select, (node) => node.type === 'option').map((node) => node.props.value), ['default', 'slack', 'jazz']);
  h.api.setSkin('native');
  select.props.onChange({ target: { value: 'slack' } });
  component.flush();
  assert.equal(component.tree.props.control.props.value, 'slack');
  assert.equal(h.api.skin, 'native');
  row.unmount(); component.unmount(); h.dispose();
});

test('Host palette restoration retains existing threads and drafts without a write', async () => {
  const writes = [];
  const data = { version: 1, threads: { parent: { 1: { childId: 'child' } } }, drafts: { 'parent:1': 'draft' }, skin: 'slack', theme: 'slack' };
  const h = fixture({
    storage: { [MIGRATED]: '1', [THEME]: 'jazz' },
    fetch: async (_url, options = {}) => {
      if (options.method) { writes.push(JSON.parse(options.body)); return { ok: true }; }
      return { ok: true, json: async () => data };
    },
  });
  await h.api.loadPersisted();
  assert.equal(h.api.themeMode, 'slack');
  assert.equal(h.api.skin, 'slack');
  assert.equal(JSON.parse(h.localStorage.getItem('dsh.threads.v1')).parent[1].childId, 'child');
  assert.equal(JSON.parse(h.localStorage.getItem('dsh.threads.drafts.v1'))['parent:1'], 'draft');
  await h.api.persistNow();
  assert.equal(writes.length, 0);
  h.api.setThemeMode('jazz');
  await h.api.persistNow();
  assert.deepEqual(writes, [{ version: 1, theme: 'jazz' }]);
  h.dispose();
});

test('cross-tab palette update changes the layer without a save feedback loop', async () => {
  const writes = [];
  const h = fixture({ storage: { [MIGRATED]: '1' }, fetch: async (_url, options = {}) => {
    if (options.method) writes.push(JSON.parse(options.body));
    return { ok: true, json: async () => ({ version: 1 }) };
  } });
  await h.api.loadPersisted();
  h.api.syncStorageEvent({ key: THEME, newValue: 'slack' });
  assert.equal(h.api.themeMode, 'slack');
  assert.equal(h.layers.size, 1);
  await h.api.persistNow();
  assert.equal(writes.length, 0);
  h.api.setThemeMode('jazz');
  h.api.syncStorageEvent({ key: THEME, newValue: 'default' });
  assert.equal(h.api.themeMode, 'jazz', 'an unsaved local choice wins over another tab');
  h.dispose();
});

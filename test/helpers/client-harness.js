import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../../client.js', import.meta.url), 'utf8');
const noop = () => {};
const sameDeps = (left, right) => left && right && left.length === right.length && left.every((item, i) => Object.is(item, right[i]));

/** Load the real browser bundle without contacting a DSH installation. */
export function loadClient(options = {}) {
  let current;
  const cleanups = [];
  const effects = [];
  const listeners = new Map();
  const timers = new Map();
  let timerId = 0;
  const values = new Map(Object.entries(options.storage || {}));
  const localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
  const React = {
    Fragment: Symbol('Fragment'),
    createElement(type, props, ...children) {
      return { type, props: { ...props, children } };
    },
    useState(initial) {
      const owner = current;
      const index = owner.index++;
      if (!(index in owner.hooks)) owner.hooks[index] = typeof initial === 'function' ? initial() : initial;
      return [owner.hooks[index], (next) => {
        const value = typeof next === 'function' ? next(owner.hooks[index]) : next;
        if (!Object.is(value, owner.hooks[index])) { owner.hooks[index] = value; owner.dirty = true; }
      }];
    },
    useRef(initial) {
      const owner = current;
      const index = owner.index++;
      return owner.hooks[index] ||= { current: initial };
    },
    useMemo(factory, deps) {
      const owner = current;
      const index = owner.index++;
      const cached = owner.hooks[index];
      if (!cached || !sameDeps(cached.deps, deps)) owner.hooks[index] = { deps, value: factory() };
      return owner.hooks[index].value;
    },
    useCallback(callback, deps) { return React.useMemo(() => callback, deps); },
    useEffect(callback, deps) {
      const owner = current;
      const index = owner.index++;
      const previous = owner.hooks[index];
      if (!previous || !sameDeps(previous.deps, deps)) {
        owner.pending.push(() => {
          previous?.cleanup?.();
          owner.hooks[index] = { deps, cleanup: callback() };
        });
      }
    },
    useSyncExternalStore(subscribe, snapshot) {
      const owner = current;
      React.useEffect(() => subscribe(() => { owner.dirty = true; }), [subscribe]);
      return snapshot();
    },
  };
  const window = {
    localStorage,
    setTimeout(callback, delay) { const id = ++timerId; timers.set(id, { callback, delay }); return id; },
    clearTimeout: (id) => timers.delete(id),
    addEventListener(name, callback) {
      if (!listeners.has(name)) listeners.set(name, new Set());
      listeners.get(name).add(callback);
    },
    removeEventListener: (name, callback) => listeners.get(name)?.delete(callback),
    dispatchEvent: (event) => { for (const callback of listeners.get(event.type) || []) callback(event); },
    ...options.window,
  };
  const dictionaries = {};
  const localeSnapshot = { active: options.locale || 'en' };
  const emptySnapshot = {};
  const emptyWindow = { entries: [] };
  const binding = {
    session: { prompt: async () => ({ ok: true }), cancel: async () => {}, getSnapshot: () => emptySnapshot, subscribe: () => noop },
    eventSource: { getSnapshot: () => emptyWindow, subscribe: () => noop },
    getSnapshot: () => emptySnapshot,
    subscribe: () => noop,
  };
  const ctx = {
    get: () => undefined,
    logger: { warn: noop },
    locale: {
      bind: (namespace) => (key, args = {}) => {
        let value = dictionaries[namespace]?.[localeSnapshot.active]?.[key] || key;
        for (const [name, argument] of Object.entries(args)) value = value.replaceAll(`{${name}}`, String(argument));
        return value;
      },
      register(namespace, dictionary) { dictionaries[namespace] = dictionary; return noop; },
      getSnapshot: () => localeSnapshot,
      subscribe: () => noop,
    },
    sessions: { binding: () => binding, retain: () => ({ ready: Promise.resolve(binding), release: noop }) },
    slots: { inject: (name, callback) => { callback(); return noop; }, register: () => noop },
    sidebarRightTabs: { register: () => noop },
    sidebarRight: { openTab: noop, openTabIn: noop },
    uiWorkspace: { openSession: noop },
    workspaces: { unarchiveSession: async () => {} },
    remote: {},
    effect(callback, name) {
      effects.push(name);
      const cleanup = callback();
      if (typeof cleanup === 'function') cleanups.push(cleanup);
      return cleanup;
    },
    ...options.ctx,
  };
  const sandbox = {
    console: options.console || console,
    window,
    document: {
      documentElement: { dataset: {} },
      head: { appendChild: noop },
      createElement: () => ({ dataset: {}, style: {}, remove: noop }),
    },
    navigator: { clipboard: { writeText: async () => {} } },
    requestAnimationFrame: (callback) => { callback(); return 0; },
    fetch: options.fetch || (async () => ({ ok: false, status: 404 })),
    setTimeout: window.setTimeout,
    clearTimeout: window.clearTimeout,
    URL,
    AbortController,
    btoa,
    __clientAudit: {},
    ...options.globals,
  };
  let plugin;
  window.__ModuleLoader__ = { load(module) {
    plugin = module.factory((name) => name === 'react' ? React : (options.modules?.[name] || {}));
  } };
  const expose = (options.expose || []).map((name) => {
    if (!/^[A-Za-z_$][\w$]*$/.test(name)) throw new Error(`Invalid exposed identifier: ${name}`);
    return `if (typeof ${name} !== 'undefined') Object.defineProperty(globalThis.__clientAudit, '${name}', { configurable: true, get: () => ${name} });`;
  }).join('\n');
  const modified = source
    .replace("    return {\n      inject:", `    ${expose}\n    return {\n      inject:`)
    .replace('        const t = ctx.locale.bind(NS);', `        const t = ctx.locale.bind(NS);\n${expose}`);
  vm.runInNewContext(modified, sandbox, { filename: 'client.js' });
  if (options.apply !== false) plugin.apply(ctx);

  function render(component, initialProps = {}) {
    const owner = { hooks: [], index: 0, dirty: true, pending: [], tree: undefined, props: initialProps };
    const controller = {
      get tree() { return owner.tree; },
      update(props) { owner.props = props; owner.dirty = true; return controller.flush(); },
      flush() {
        let iterations = 0;
        while (owner.dirty) {
          if (++iterations > 30) throw new Error('Component did not settle');
          owner.dirty = false;
          owner.index = 0;
          current = owner;
          try { owner.tree = component(owner.props); } finally { current = undefined; }
          for (const effect of owner.pending.splice(0)) effect();
        }
        return owner.tree;
      },
      async settle() { for (let i = 0; i < 10; i++) { await Promise.resolve(); controller.flush(); } return owner.tree; },
      unmount() { for (const hook of owner.hooks) hook?.cleanup?.(); },
    };
    controller.flush();
    return controller;
  }
  return {
    api: sandbox.__clientAudit, plugin, window, localStorage, React, ctx, render, timers, effects,
    async runTimers() {
      const pending = [...timers];
      for (const [id, timer] of pending) { if (timers.delete(id)) timer.callback(); }
      for (let i = 0; i < 10; i++) await Promise.resolve();
    },
    dispose() { for (const cleanup of cleanups.reverse()) cleanup(); timers.clear(); },
  };
}

export function walk(tree, predicate) {
  const matches = [];
  function visit(value) {
    if (Array.isArray(value)) { for (const item of value) visit(item); return; }
    if (value === null || typeof value !== 'object') return;
    if (predicate(value)) matches.push(value);
    visit(value.props?.children);
  }
  visit(tree);
  return matches;
}

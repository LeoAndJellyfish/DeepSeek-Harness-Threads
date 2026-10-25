import assert from 'node:assert/strict';
import test from 'node:test';
import { loadClient } from './helpers/client-harness.js';

// Execute the shipped renderers with a small React surface. Child components stay
// as elements so the tests can check their attachment and Markdown contracts.
function loadRenderers(t, options = {}) {
  const environment = loadClient({
    expose: ['SlackAssistantNode', 'SlackSteeringNode', 'SlackUserNode', 'MessageImages'],
    console: { warn() {} },
    modules: options.plainText ? {} : {
      '@deepseek-ai/dsh-client-ui-primitives': { MarkdownText: function MarkdownText() {} },
    },
  });
  const views = new Map();
  t.after(() => {
    for (const view of views.values()) view.unmount();
    environment.dispose();
  });
  return {
    render(name, props) {
      if (!views.has(name)) views.set(name, environment.render(environment.api[name], props));
      else views.get(name).update(props);
      return views.get(name).flush();
    },
  };
}

function elements(tree) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(elements);
  return [tree, ...elements(tree.props?.children)];
}

function textOf(tree) {
  if (tree === null || tree === undefined || typeof tree === 'boolean') return '';
  if (typeof tree !== 'object') return String(tree);
  if (Array.isArray(tree)) return tree.map(textOf).join('');
  if (tree.type?.name === 'MarkdownText') return tree.props.text;
  return textOf(tree.props?.children);
}

function assistantProps(blocks, groupPart) {
  return { sessionId: 'parent', node: { data: { blocks, status: 'complete' } }, groupPart };
}

test('reasoning-only assistant rows retain a collapsed Markdown disclosure', (t) => {
  const renderer = loadRenderers(t);
  const tree = renderer.render('SlackAssistantNode', assistantProps([
    { kind: 'reasoning', text: '**Reasoning** with $x$' },
  ], 'reasoning'));
  const detail = elements(tree).find((element) => element.type === 'details');
  assert.ok(detail, 'a reasoning-only row must remain visible');
  assert.ok(!detail.props.open, 'reasoning starts collapsed');
  assert.equal(elements(detail).filter((element) => element.type === 'summary').length, 1);
  assert.match(textOf(detail), /\*\*Reasoning\*\* with \$x\$/);
});

test('ungrouped assistant rows preserve reasoning alongside the final response', (t) => {
  const renderer = loadRenderers(t);
  const tree = renderer.render('SlackAssistantNode', assistantProps([
    { kind: 'reasoning', text: 'thinking content' },
    { kind: 'text', text: 'final response' },
  ]));
  assert.match(textOf(tree), /thinking content/);
  assert.match(textOf(tree), /final response/);
  assert.equal(elements(tree).filter((element) => element.type === 'details').length, 1);
});

test('split assistant rows keep reasoning and response in their own group', (t) => {
  const renderer = loadRenderers(t);
  const blocks = [
    { kind: 'reasoning', text: 'private thinking' },
    { kind: 'text', text: 'public answer' },
  ];
  const reasoning = renderer.render('SlackAssistantNode', assistantProps(blocks, 'reasoning'));
  const response = renderer.render('SlackAssistantNode', assistantProps(blocks, 'response'));
  assert.match(textOf(reasoning), /private thinking/);
  assert.doesNotMatch(textOf(reasoning), /public answer/);
  assert.match(textOf(response), /public answer/);
  assert.doesNotMatch(textOf(response), /private thinking/);
});

test('image-only steering has a keyboard button and reveals its original attachment', (t) => {
  const renderer = loadRenderers(t);
  const attachment = { attachmentId: 'image-1', mimeType: 'image/png' };
  const props = {
    sessionId: 'parent',
    node: { data: { content: [{ type: 'image', attachment }] } },
  };
  const collapsed = renderer.render('SlackSteeringNode', props);
  const button = elements(collapsed).find((element) => element.type === 'button');
  assert.ok(button, 'an attachment-only message must not disappear');
  assert.equal(button.props['aria-expanded'], 'false');
  button.props.onClick();
  const expanded = renderer.render('SlackSteeringNode', props);
  assert.equal(elements(expanded).find((element) => element.type === 'button').props['aria-expanded'], 'true');
  const images = elements(expanded).find((element) => element.type?.name === 'MessageImages');
  assert.ok(images);
  assert.equal(images.props.sessionId, 'parent');
  assert.equal(images.props.attachments[0], attachment);
});

test('steering expansion retains files and text in the same message', (t) => {
  const renderer = loadRenderers(t);
  const props = {
    sessionId: 'parent',
    node: { data: { content: [
      { type: 'text', text: 'Please inspect the report' },
      { type: 'file', attachment: { name: 'report.pdf', bytes: 2048 } },
    ] } },
  };
  const collapsed = renderer.render('SlackSteeringNode', props);
  assert.match(textOf(collapsed), /Please inspect the report/);
  elements(collapsed).find((element) => element.type === 'button').props.onClick();
  const expanded = renderer.render('SlackSteeringNode', props);
  assert.match(textOf(expanded), /report\.pdf/);
  assert.match(textOf(expanded), /PDF/);
  assert.match(textOf(expanded), /2\.0 KB/);
});

test('empty steering and tool-only assistant rows stay empty', (t) => {
  const renderer = loadRenderers(t);
  assert.equal(renderer.render('SlackSteeringNode', { node: { data: { content: [] } } }), null);
  assert.equal(renderer.render('SlackAssistantNode', assistantProps([{ kind: 'tool-call' }])), null);
});

test('file-only steering remains visible and can collapse after showing its file', (t) => {
  const renderer = loadRenderers(t);
  const props = {
    sessionId: 'parent',
    node: { data: { content: [
      { type: 'file', attachment: { name: 'data.csv', bytes: 10 } },
    ] } },
  };
  let tree = renderer.render('SlackSteeringNode', props);
  assert.match(textOf(tree), /1 attachments/);
  elements(tree).find((element) => element.type === 'button').props.onClick();
  tree = renderer.render('SlackSteeringNode', props);
  assert.match(textOf(tree), /data\.csv/);
  elements(tree).find((element) => element.type === 'button').props.onClick();
  tree = renderer.render('SlackSteeringNode', props);
  assert.doesNotMatch(textOf(tree), /data\.csv/);
});

test('reasoning uses streaming Markdown and survives the missing-module fallback', (t) => {
  const props = assistantProps([{ kind: 'reasoning', text: 'first line\nsecond line' }], 'reasoning');
  props.node.data.status = 'running';
  const tree = loadRenderers(t).render('SlackAssistantNode', props);
  const markdown = elements(tree).find((element) => element.type?.name === 'MarkdownText');
  assert.equal(markdown.props.streaming, true);
  const fallback = loadRenderers(t, { plainText: true }).render('SlackAssistantNode', props);
  assert.match(textOf(fallback), /first line\nsecond line/);
  assert.equal(elements(fallback).filter((element) => element.type === 'details').length, 1);
});

test('ordinary user file cards retain their filename and metadata', (t) => {
  const tree = loadRenderers(t).render('SlackUserNode', {
    sessionId: 'parent',
    node: { data: { content: [
      { type: 'file', attachment: { name: 'report.pdf', bytes: 2048 } },
    ] } },
  });
  assert.match(textOf(tree), /report\.pdf/);
  assert.match(textOf(tree), /PDF · 2\.0 KB/);
});

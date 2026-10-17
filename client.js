window.__ModuleLoader__.load({
  id: 'dsh-threads',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /* The web shell's static module table publishes the same Markdown
     * renderer the Chat view uses (CommonMark + KaTeX math + code blocks).
     * It is declared in dsh.client.external; a shell without it degrades to
     * plain text instead of failing the whole plugin. */
    let primitives = {};
    try {
      primitives = require('@deepseek-ai/dsh-client-ui-primitives') || {};
    } catch (error) {
      primitives = {};
    }
    /* MarkdownText is a React.memo object, not a function: test for the
     * export itself. */
    const MarkdownText = primitives.MarkdownText || null;

    const PLUGIN_ID = 'dsh-threads';
    const NS = 'threads';
    const TAB_KIND = 'thread';
    const STORAGE_KEY = 'dsh.threads.v1';
    const RETAIN_SOURCE = 'threadPanel';

    /* Every message sent into a thread carries this preamble so the forked
     * agent knows it is answering inside a side thread. The panel strips it
     * again, so the transcript stays clean for the user. */
    const THREAD_NOTE =
      '<dsh-thread>侧边线程：你的回复只显示在主对话的线程面板里，主对话看不到。直接回答这条追问，不要假设自己在主对话中，也不要建议用户切换面板；不要在回复里提到这条说明。</dsh-thread>';
    const THREAD_NOTE_PATTERN = /^<dsh-thread>[\s\S]*?<\/dsh-thread>\s*/i;

    const ZH = {
      'turn.reply': '回复',
      'turn.replies': '{count} 条回复',
      'turn.lastReply': '最后回复于 {when}',
      'time.now': '刚刚',
      'time.minutes': '{count} 分钟前',
      'time.hours': '{count} 小时前',
      'time.days': '{count} 天前',
      'turn.open': '打开这条线程',
      'turn.running': '线程正在回复',
      'turn.unread': '线程有新回复',
      'turn.start': '在这条回答下开始线程',
      'panel.title': '线程',
      'panel.quoteLabel': '线程起点',
      'panel.openChild': '打开子会话',
      'panel.anchor': '第 {turn} 轮对话',
      'panel.empty': '还没有回复。发第一条消息，开始这条线程。',
      'panel.loading': '正在加载线程…',
      'panel.placeholder': '回复这条线程…（Enter 发送，Shift+Enter 换行）',
      'panel.placeholderFirst': '写点什么，开始这条线程…（Enter 发送）',
      'panel.hint': 'Enter 发送 · Shift+Enter 换行',
      'panel.alsoSend': '同时发到主对话',
      'panel.alsoSendPrefix': '[来自线程] ',
      'panel.lastReply': '最后回复 {when}',
      'panel.zoom': '点击放大',
      'panel.retry': '重试',
      'panel.stopHint': '正在回复，还可以继续输入',
      'panel.send': '发送',
      'panel.sending': '发送中',
      'panel.stop': '停止',
      'panel.running': '正在回复',
      'panel.you': '你',
      'panel.youInitial': '你',
      'panel.toolOne': '工具 · {name}',
      'panel.tools': '{count} 个工具 · {names}',
      'panel.turnFailed': '这一轮失败了',
      'panel.sendFailed': '发送失败',
      'panel.cannotOpen': '无法打开这条线程',
      'panel.missing': '线程会话不存在或已被删除。',
      'panel.archived': '这条线程的会话已在左侧栏归档，暂时不能回复。',
      'panel.unarchive': '恢复会话',
      'panel.archivedPlaceholder': '会话已归档，无法发送',
      'panel.approvalTitle': '工具 {tool} 请求确认',
      'panel.approvalAllow': '允许一次',
      'panel.approvalReject': '拒绝',
      'panel.approvalAnswering': '处理中…',
      'panel.approvalGeneric': '这个工具请求执行需要确认的操作',
      'panel.bringBack': '带回主对话',
      'panel.bringBackDone': '已放入输入框',
      'panel.bringBackBlock': '> 来自线程的结论：\n\n{text}',
      'panel.removeImage': '移除图片',
      'panel.addImage': '添加图片',
      'panel.imageTooLarge': '图片超过 20 MB（宿主默认单图上限），已跳过',
      'panel.imageLimit': '最多 {count} 张图片',
      'list.title': '线程列表',
      'list.button': '线程',
      'list.count': '{count} 条线程',
      'list.heading': '本会话的线程（{count}）',
      'list.empty': '这个会话还没有线程。在任意一条回答下点「回复」开始。',
      'list.guide': '查看本会话的所有线程',
      'list.meta': '{count} 条回复',
      'row.thread': '线程',
      'skin.on': 'Slack',
      'skin.off': '原生',
      'skin.title': '切换 Slack 消息样式（只影响消息列表）',
      'settings.section.title': 'Slack 外观',
      'settings.section.description': '把对话和界面切换成 Slack 风格，只影响本插件渲染的部分。',
      'settings.appearance.title': 'Slack 外观',
      'settings.appearance.description': '把对话消息行换成 Slack 风格：头像、作者、时间、日期分隔与悬停操作条。',
      'settings.theme.title': 'Slack 主题',
      'settings.theme.description': '用爵士配色（#4C64A6 / #71A3D1 / #14ADFF / #1D3F5E）替换全局界面颜色，可随时关闭。',
      'skin.copied': '已复制',
      'skin.branch': '从这个回答分支',
      'skin.refs': '引用：{labels}',
      'skin.skills': '技能：{names}',
      'skin.steering': '插话',
      'skin.steeringExpand': '展开这条插话',
      'skin.steeringCollapse': '收起这条插话',
      'skin.today': '今天',
      'skin.yesterday': '昨天',
      'skin.avatarYou': '你',
      'md.copy': '复制',
      'md.copied': '已复制',
      'md.code': '代码',
      'md.wrap': '自动换行',
      'md.unwrap': '取消自动换行',
      'md.footnotes': '脚注',
    };

    const EN = {
      'turn.reply': 'Reply',
      'turn.replies': '{count} replies',
      'turn.lastReply': 'Last reply {when}',
      'time.now': 'just now',
      'time.minutes': '{count}m ago',
      'time.hours': '{count}h ago',
      'time.days': '{count}d ago',
      'turn.open': 'Open this thread',
      'turn.running': 'The thread is replying',
      'turn.unread': 'The thread has new replies',
      'turn.start': 'Start a thread on this answer',
      'panel.title': 'Thread',
      'panel.quoteLabel': 'Thread start',
      'panel.openChild': 'Open session',
      'panel.anchor': 'Turn {turn}',
      'panel.empty': 'No replies yet. Send the first message to start this thread.',
      'panel.loading': 'Loading thread…',
      'panel.placeholder': 'Reply in this thread… (Enter to send, Shift+Enter for a new line)',
      'panel.placeholderFirst': 'Write the first reply… (Enter to send)',
      'panel.hint': 'Enter to send · Shift+Enter for a new line',
      'panel.alsoSend': 'Also send to the main conversation',
      'panel.alsoSendPrefix': '[from thread] ',
      'panel.lastReply': 'Last reply {when}',
      'panel.zoom': 'Click to zoom',
      'panel.retry': 'Retry',
      'panel.stopHint': 'Replying — you can keep typing',
      'panel.send': 'Send',
      'panel.sending': 'Sending',
      'panel.stop': 'Stop',
      'panel.running': 'Replying',
      'panel.you': 'You',
      'panel.youInitial': 'U',
      'panel.toolOne': 'Tool · {name}',
      'panel.tools': '{count} tools · {names}',
      'panel.turnFailed': 'This turn failed',
      'panel.sendFailed': 'Could not send',
      'panel.cannotOpen': 'Cannot open this thread',
      'panel.missing': 'This thread session no longer exists.',
      'panel.archived': 'This thread session is archived in the sidebar, so replies are disabled.',
      'panel.unarchive': 'Unarchive session',
      'panel.archivedPlaceholder': 'Session archived — sending is disabled',
      'panel.approvalTitle': 'Tool {tool} asks for approval',
      'panel.approvalAllow': 'Allow once',
      'panel.approvalReject': 'Reject',
      'panel.approvalAnswering': 'Working…',
      'panel.approvalGeneric': 'This tool asks to run an operation that needs confirmation',
      'panel.bringBack': 'Bring to main chat',
      'panel.bringBackDone': 'Added to composer',
      'panel.bringBackBlock': '> Conclusion from a thread:\n\n{text}',
      'panel.removeImage': 'Remove image',
      'panel.addImage': 'Add image',
      'panel.imageTooLarge': 'Image is larger than the host default of 20 MB and was skipped',
      'panel.imageLimit': 'At most {count} images',
      'list.title': 'Threads',
      'list.button': 'Threads',
      'list.count': '{count} threads',
      'list.heading': 'Threads in this session ({count})',
      'list.empty': 'No threads yet. Hover an answer and press Reply to start one.',
      'list.guide': 'Browse every thread in this session',
      'list.meta': '{count} replies',
      'row.thread': 'Thread',
      'skin.on': 'Slack',
      'skin.off': 'Native',
      'skin.title': 'Toggle the Slack message style (message list only)',
      'settings.section.title': 'Slack appearance',
      'settings.section.description':
        'Switch the conversation and interface to the Slack style. Only surfaces this plugin renders are affected.',
      'settings.appearance.title': 'Slack appearance',
      'settings.appearance.description':
        'Render chat messages as Slack rows: avatars, author, time, date dividers and hover actions.',
      'settings.theme.title': 'Slack theme',
      'settings.theme.description':
        'Repaint the whole interface with the jazz palette (#4C64A6 / #71A3D1 / #14ADFF / #1D3F5E). Reversible.',
      'skin.copied': 'Copied',
      'skin.branch': 'Branch from this answer',
      'skin.refs': 'Refs: {labels}',
      'skin.skills': 'Skills: {names}',
      'skin.steering': 'Interjection',
      'skin.steeringExpand': 'Expand this interjection',
      'skin.steeringCollapse': 'Collapse this interjection',
      'skin.today': 'Today',
      'skin.yesterday': 'Yesterday',
      'skin.avatarYou': 'Y',
      'md.copy': 'Copy',
      'md.copied': 'Copied',
      'md.code': 'Code',
      'md.wrap': 'Wrap lines',
      'md.unwrap': 'Unwrap lines',
      'md.footnotes': 'Footnotes',
    };

    /* ------------------------------------------------------------------ *
     * Thread index: parent session + anchor seq -> child session.
     * Presentation metadata only; the child Session log stays the record
     * of the conversation itself.
     * ------------------------------------------------------------------ */

    function readStore() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : {};
      } catch (error) {
        return {};
      }
    }

    let store = readStore();
    let storeVersion = 0;
    const listCache = new Map();
    const storeListeners = new Set();

    /* ------------------------------------------------------------------ *
     * Message-skin preference. Native keeps the shipped Chat; slack swaps
     * the `user` and `assistant-step` node renderers for Slack rows.
     * ------------------------------------------------------------------ */

    const SKIN_KEY = 'dsh.threads.skin';
    let skin = readSkin();
    const skinListeners = new Set();

    function readSkin() {
      try {
        return window.localStorage.getItem(SKIN_KEY) === 'slack' ? 'slack' : 'native';
      } catch (error) {
        return 'native';
      }
    }

    function subscribeSkin(listener) {
      skinListeners.add(listener);
      return function unsubscribe() {
        skinListeners.delete(listener);
      };
    }

    function setSkin(next) {
      skin = next === 'slack' ? 'slack' : 'native';
      skinTouched = true;
      try {
        window.localStorage.setItem(SKIN_KEY, skin);
      } catch (error) {
        /* in-memory preference only */
      }
      for (const listener of Array.from(skinListeners)) {
        try {
          listener();
        } catch (error) {
          /* ignore */
        }
      }
      schedulePersist();
    }

    function useSkin() {
      return React.useSyncExternalStore(subscribeSkin, function snapshot() {
        return skin;
      });
    }

    /* ------------------------------------------------------------------ *
     * Global jazz theme preference. `jazz` stacks the palette over the
     * active theme through the Theme service; `default` stays untouched.
     * ------------------------------------------------------------------ */

    const THEME_KEY = 'dsh.threads.theme';
    let themeMode = readThemeMode();
    const themeModeListeners = new Set();

    function readThemeMode() {
      try {
        return window.localStorage.getItem(THEME_KEY) === 'jazz' ? 'jazz' : 'default';
      } catch (error) {
        return 'default';
      }
    }

    function subscribeThemeMode(listener) {
      themeModeListeners.add(listener);
      return function unsubscribe() {
        themeModeListeners.delete(listener);
      };
    }

    function setThemeMode(next) {
      themeMode = next === 'jazz' ? 'jazz' : 'default';
      themeTouched = true;
      try {
        window.localStorage.setItem(THEME_KEY, themeMode);
      } catch (error) {
        /* in-memory preference only */
      }
      for (const listener of Array.from(themeModeListeners)) {
        try {
          listener();
        } catch (error) {
          /* ignore */
        }
      }
      schedulePersist();
    }

    function useThemeMode() {
      return React.useSyncExternalStore(subscribeThemeMode, function snapshot() {
        return themeMode;
      });
    }

    /* ------------------------------------------------------------------ *
     * Host-backed persistence. The Web app binds a new port on every start
     * and localStorage is origin-scoped, so the durable copy lives in a Host
     * file behind /dsh-threads/store. localStorage stays as the in-run
     * fallback when the route is unavailable.
     * ------------------------------------------------------------------ */

    const STORE_ROUTE = '/dsh-threads/store';
    let persistEnabled = false;
    let persistTimer = null;
    let skinTouched = false;
    let themeTouched = false;

    function persistNow() {
      if (!persistEnabled) return;
      try {
        const body = JSON.stringify({ version: 1, threads: store, drafts, skin, theme: themeMode });
        fetch(STORE_ROUTE, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body,
        }).catch(() => {});
      } catch (error) {
        /* fetch is unavailable in this shell */
      }
    }

    function schedulePersist() {
      if (!persistEnabled) return;
      if (persistTimer !== null) window.clearTimeout(persistTimer);
      persistTimer = window.setTimeout(() => {
        persistTimer = null;
        persistNow();
      }, 250);
    }

    async function loadPersisted() {
      let data;
      try {
        const response = await fetch(STORE_ROUTE, { headers: { accept: 'application/json' } });
        if (!response.ok) return;
        data = await response.json();
      } catch (error) {
        return;
      }
      if (data === null || typeof data !== 'object') return;
      persistEnabled = true;
      let changed = false;
      if (data.threads && typeof data.threads === 'object' && Object.keys(data.threads).length > 0) {
        store = data.threads;
        storeVersion += 1;
        changed = true;
      }
      if (data.drafts && typeof data.drafts === 'object' && Object.keys(data.drafts).length > 0) {
        drafts = data.drafts;
        changed = true;
      }
      if (!skinTouched && (data.skin === 'slack' || data.skin === 'native') && data.skin !== skin) {
        skin = data.skin;
        changed = true;
      }
      if (
        !themeTouched &&
        (data.theme === 'jazz' || data.theme === 'default') &&
        data.theme !== themeMode
      ) {
        themeMode = data.theme;
        try {
          window.localStorage.setItem(THEME_KEY, themeMode);
        } catch (error) {
          /* in-memory preference only */
        }
        for (const listener of Array.from(themeModeListeners)) {
          try {
            listener();
          } catch (error) {
            /* ignore */
          }
        }
        changed = true;
      }
      if (changed) {
        for (const listener of Array.from(storeListeners)) {
          try {
            listener();
          } catch (error) {
            /* ignore */
          }
        }
        for (const listener of Array.from(skinListeners)) {
          try {
            listener();
          } catch (error) {
            /* ignore */
          }
        }
      }
      // First start after the migration: push whatever local data exists.
      if (!data.threads || Object.keys(data.threads).length === 0) schedulePersist();
    }

    function subscribeStore(listener) {
      storeListeners.add(listener);
      return function unsubscribe() {
        storeListeners.delete(listener);
      };
    }

    function threadAt(parentId, seq) {
      const bucket = store[parentId];
      return bucket ? bucket[String(seq)] : undefined;
    }

    function writeStore(next) {
      store = next;
      storeVersion += 1;
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (error) {
        /* storage full or disabled: the in-memory index still works */
      }
      for (const listener of Array.from(storeListeners)) {
        try {
          listener();
        } catch (error) {
          /* one listener's failure must not break the others */
        }
      }
      schedulePersist();
    }

    function setThread(parentId, seq, value) {
      const bucket = Object.assign({}, store[parentId] || {});
      bucket[String(seq)] = value;
      writeStore(Object.assign({}, store, { v: 1, [parentId]: bucket }));
    }

    function patchThread(parentId, seq, patch) {
      const current = threadAt(parentId, seq);
      if (!current) return;
      setThread(parentId, seq, Object.assign({}, current, patch));
    }

    function useThreadEntry(parentId, seq) {
      return React.useSyncExternalStore(
        subscribeStore,
        function snapshot() {
          return threadAt(parentId, seq);
        },
      );
    }

    /** Stable list per store revision, so a selector read never allocates a new array. */
    function threadListOf(parentId) {
      const cached = listCache.get(parentId);
      const key = String(storeVersion);
      if (cached && cached.key === key) return cached.value;
      const bucket = store[parentId] || {};
      const value = Object.keys(bucket)
        .map((seq) => Object.assign({ seq: Number(seq) }, bucket[seq]))
        .sort((left, right) => (right.updatedAt || 0) - (left.updatedAt || 0));
      listCache.set(parentId, { key, value });
      return value;
    }

    function useThreadList(parentId) {
      return React.useSyncExternalStore(subscribeStore, function snapshot() {
        return threadListOf(parentId);
      });
    }

    let childIdsCache = { key: '', value: new Set() };

    /** Every child Session referenced by the thread index, per store revision. */
    function threadChildIds() {
      const key = String(storeVersion);
      if (childIdsCache.key === key) return childIdsCache.value;
      const ids = new Set();
      for (const parentId of Object.keys(store)) {
        if (parentId === 'v') continue;
        const bucket = store[parentId];
        if (bucket === null || typeof bucket !== 'object') continue;
        for (const seq of Object.keys(bucket)) {
          const entry = bucket[seq];
          if (entry && typeof entry.childId === 'string') ids.add(entry.childId);
        }
      }
      childIdsCache = { key, value: ids };
      return ids;
    }

    function useIsThreadChild(sessionId) {
      return React.useSyncExternalStore(subscribeStore, function snapshot() {
        return threadChildIds().has(sessionId);
      });
    }

    /* ------------------------------------------------------------------ *
     * Per-thread drafts. The panel unmounts when it is hidden or the window
     * switches; the unsent text still has to be there when it comes back.
     * ------------------------------------------------------------------ */

    const DRAFTS_KEY = 'dsh.threads.drafts.v1';

    function readDrafts() {
      try {
        const raw = window.localStorage.getItem(DRAFTS_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : {};
      } catch (error) {
        return {};
      }
    }

    let drafts = readDrafts();

    function draftKeyOf(parentId, seq) {
      return parentId + ':' + String(seq);
    }

    function loadDraft(key) {
      return typeof drafts[key] === 'string' ? drafts[key] : '';
    }

    function saveDraft(key, value) {
      if (value) drafts[key] = value;
      else delete drafts[key];
      try {
        window.localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
      } catch (error) {
        /* keep the in-memory copy */
      }
      schedulePersist();
    }

    /* ------------------------------------------------------------------ *
     * Session-log readers
     * ------------------------------------------------------------------ */

    function errorText(error) {
      if (!error) return '';
      if (typeof error === 'string') return error;
      return error.message || String(error);
    }

    function readDataUrl(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(reader.error || new Error('image read failed'));
        reader.readAsDataURL(file);
      });
    }

    /* Host defaults from dsh-attachment-local: 20 MB per source image and 20
     * images per message, with normalized storage capped at 4 MB / 4 MP.
     * We keep the source cap, and shrink larger pictures in the browser so
     * the inlined base64 stays close to what the host would store. */
    const MAX_SOURCE_IMAGE_BYTES = 20 * 1024 * 1024;
    const MAX_IMAGES = 20;
    const IMAGE_LONG_EDGE = 2048;
    const IMAGE_PIXEL_BUDGET = 4000000;

    function loadImage(url) {
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('image decode failed'));
        image.src = url;
      });
    }

    async function prepareImage(file) {
      const dataUrl = await readDataUrl(file);
      const comma = dataUrl.indexOf(',');
      if (comma < 0) throw new Error('unsupported image');
      let mediaType = file.type || 'image/png';
      let data = dataUrl.slice(comma + 1);
      let preview = dataUrl;
      try {
        const image = await loadImage(dataUrl);
        const width = image.naturalWidth || image.width;
        const height = image.naturalHeight || image.height;
        const longEdge = Math.max(width, height);
        const pixels = width * height;
        const oversized =
          longEdge > IMAGE_LONG_EDGE || pixels > IMAGE_PIXEL_BUDGET || file.size > 4 * 1024 * 1024;
        if (oversized && width > 0 && height > 0) {
          const scale = Math.min(1, IMAGE_LONG_EDGE / longEdge, Math.sqrt(IMAGE_PIXEL_BUDGET / pixels));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(width * scale));
          canvas.height = Math.max(1, Math.round(height * scale));
          const context = canvas.getContext('2d');
          if (context !== null) {
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            let encoded = canvas.toDataURL('image/webp', 0.9);
            if (encoded.indexOf('data:image/webp') !== 0) encoded = canvas.toDataURL('image/jpeg', 0.9);
            const encodedComma = encoded.indexOf(',');
            const semicolon = encoded.indexOf(';');
            if (encodedComma > 0 && semicolon > 0) {
              mediaType = encoded.slice(5, semicolon);
              data = encoded.slice(encodedComma + 1);
              preview = encoded;
            }
          }
        }
      } catch (error) {
        /* keep the original bytes when the browser cannot decode it */
      }
      return {
        id: Date.now() + '-' + Math.random().toString(16).slice(2),
        mediaType,
        data,
        name: file.name || 'image',
        preview,
      };
    }

    /** Markdown → one plain line, for previews that must not render headings. */
    function plainText(value) {
      if (typeof value !== 'string') return '';
      let text = value;
      text = text.replace(/```[\s\S]*?```/g, ' ');
      text = text.replace(/`([^`]*)`/g, '$1');
      text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ');
      text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
      text = text.replace(/^\s{0,3}#{1,6}\s+/gm, '');
      text = text.replace(/^\s{0,3}>\s?/gm, '');
      text = text.replace(/^\s{0,3}(?:[-*+]|\d+[.)])\s+/gm, '');
      text = text.replace(/^\s*\|?[\s:|-]{3,}\|?[\s:|-]*$/gm, ' ');
      text = text.replace(/^\s*[-*_]{3,}\s*$/gm, ' ');
      text = text.replace(/\*\*|__|~~/g, '');
      return text.replace(/\s+/g, ' ').trim();
    }

    function truncateText(value, limit) {
      const text = typeof value === 'string' ? value : '';
      return text.length > limit ? text.slice(0, limit) + '…' : text;
    }

    function textOfContent(content) {
      if (!Array.isArray(content)) return '';
      const parts = [];
      for (const block of content) {
        if (block && block.type === 'text' && typeof block.text === 'string') parts.push(block.text);
      }
      return parts.join('').trim();
    }

    function imagesOfContent(content) {
      if (!Array.isArray(content)) return [];
      const images = [];
      for (const block of content) {
        if (block && block.type === 'image' && block.attachment) images.push(block.attachment);
      }
      return images;
    }

    function clockText(time, active) {
      if (!time) return '';
      try {
        return new Intl.DateTimeFormat(active === 'zh' ? 'zh-CN' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date(time));
      } catch (error) {
        return '';
      }
    }

    function windowOf(binding) {
      if (!binding) return null;
      try {
        return binding.eventSource.getSnapshot();
      } catch (error) {
        return null;
      }
    }

    function quoteFromBinding(binding, anchorSeq) {
      const windowState = windowOf(binding);
      if (!windowState || !Array.isArray(windowState.entries)) return null;
      let user = '';
      let assistant = '';
      for (const entry of windowState.entries) {
        if (!entry || entry.type !== 'event' || !entry.event) continue;
        const event = entry.event;
        if (typeof event.seq !== 'number' || event.seq > anchorSeq) continue;
        if (event.type === 'user/message') {
          const source = event.data && event.data.source;
          if (source && source.kind !== 'user') continue;
          const text = textOfContent(event.data && event.data.content);
          if (text) user = text;
        } else if (event.type === 'assistant/message') {
          const text = textOfContent(event.data && event.data.message && event.data.message.content);
          if (text) assistant = text;
        }
      }
      if (!user && !assistant) return null;
      return { user, assistant };
    }

    function seqForMessage(binding, messageId) {
      const windowState = windowOf(binding);
      if (!windowState || !Array.isArray(windowState.entries)) return undefined;
      for (const entry of windowState.entries) {
        if (!entry || entry.type !== 'event' || !entry.event) continue;
        const event = entry.event;
        if (event.type !== 'assistant/message') continue;
        const id = event.data && event.data.message && event.data.message.id;
        if (id === undefined) continue;
        if (String(id) === messageId) return event.seq;
      }
      return undefined;
    }

    function parseReplies(entries, anchorSeq) {
      const items = [];
      let pendingTools = [];
      const flushTools = () => {
        if (pendingTools.length === 0) return;
        const names = [];
        for (const name of pendingTools) {
          if (name && names.indexOf(name) === -1) names.push(name);
        }
        items.push({
          kind: 'tools',
          count: pendingTools.length,
          names: names.slice(0, 3),
          key: 'tools:' + items.length,
        });
        pendingTools = [];
      };
      for (const entry of entries || []) {
        if (!entry || entry.type !== 'event' || !entry.event) continue;
        const event = entry.event;
        if (typeof event.seq !== 'number' || event.seq <= anchorSeq) continue;
        if (event.surfaceOp !== undefined && event.surfaceOp !== 'append') continue;
        if (event.type === 'user/message') {
          const source = event.data && event.data.source;
          if (source && source.kind !== 'user') continue;
          const text = textOfContent(event.data && event.data.content)
            .replace(THREAD_NOTE_PATTERN, '')
            .trim();
          const images = imagesOfContent(event.data && event.data.content);
          if (!text && images.length === 0) continue;
          flushTools();
          items.push({
            kind: 'user',
            text,
            images,
            time: event.time,
            seq: event.seq,
            key: 'user:' + event.seq,
          });
        } else if (event.type === 'assistant/message') {
          const content = event.data && event.data.message && event.data.message.content;
          const text = textOfContent(content);
          const images = imagesOfContent(content);
          if (!text && images.length === 0) continue;
          flushTools();
          items.push({
            kind: 'assistant',
            text,
            images,
            time: event.time,
            seq: event.seq,
            key: 'assistant:' + event.seq,
          });
        } else if (event.type === 'tool/call') {
          pendingTools.push(event.data && event.data.name ? String(event.data.name) : 'tool');
        } else if (event.type === 'turn/end') {
          const reason = event.data && event.data.reason;
          if (reason && reason.kind === 'error') {
            flushTools();
            items.push({
              kind: 'error',
              text: reason.message || reason.code || '',
              time: event.time,
              seq: event.seq,
              key: 'error:' + event.seq,
            });
          }
        }
      }
      flushTools();
      return items;
    }

    /* ------------------------------------------------------------------ *
     * Hooks
     * ------------------------------------------------------------------ */

    function useRetainedBinding(client, childId) {
      const [state, setState] = React.useState({ binding: null, error: '' });
      React.useEffect(() => {
        setState({ binding: null, error: '' });
        if (!childId) return undefined;
        let alive = true;
        let reference;
        try {
          reference = client.sessions.retain(childId, { source: RETAIN_SOURCE });
        } catch (error) {
          setState({ binding: null, error: errorText(error) });
          return undefined;
        }
        reference.ready
          .then((binding) => {
            if (alive) setState({ binding, error: '' });
          })
          .catch((error) => {
            if (alive) setState({ binding: null, error: errorText(error) });
          });
        return function release() {
          alive = false;
          try {
            reference.release();
          } catch (error) {
            /* already released */
          }
        };
      }, [client, childId]);
      return state;
    }

    function useEventWindow(binding) {
      const subscribe = React.useCallback(
        (notify) => (binding ? binding.eventSource.subscribe(notify) : function noop() {}),
        [binding],
      );
      const getSnapshot = React.useCallback(
        () => (binding ? binding.eventSource.getSnapshot() : null),
        [binding],
      );
      return React.useSyncExternalStore(subscribe, getSnapshot);
    }

    function useSessionSnapshot(binding) {
      const subscribe = React.useCallback(
        (notify) => (binding ? binding.session.subscribe(notify) : function noop() {}),
        [binding],
      );
      const getSnapshot = React.useCallback(
        () => (binding ? binding.session.getSnapshot() : null),
        [binding],
      );
      return React.useSyncExternalStore(subscribe, getSnapshot);
    }

    function useLocaleSnapshot(client) {
      const subscribe = React.useCallback((notify) => client.locale.subscribe(notify), [client]);
      const getSnapshot = React.useCallback(() => client.locale.getSnapshot(), [client]);
      return React.useSyncExternalStore(subscribe, getSnapshot);
    }

    /* ------------------------------------------------------------------ *
     * Icons
     * ------------------------------------------------------------------ */

    function ThreadGlyph() {
      return h(
        'svg',
        { viewBox: '0 0 16 16', width: 14, height: 14, fill: 'none', 'aria-hidden': true },
        h('path', {
          d: 'M2.6 3.4h10.8v6.7H8.2l-2.8 2.4v-2.4H2.6z',
          stroke: 'currentColor',
          strokeWidth: 1.25,
          strokeLinejoin: 'round',
        }),
        h('path', {
          d: 'M5.4 6.4h5.2M5.4 8.3h3.2',
          stroke: 'currentColor',
          strokeWidth: 1.1,
          strokeLinecap: 'round',
        }),
      );
    }

    function UserGlyph() {
      return h(
        'svg',
        { viewBox: '0 0 16 16', width: 12, height: 12, fill: 'none', 'aria-hidden': true },
        h('circle', { cx: 8, cy: 5.2, r: 2.6, stroke: 'currentColor', strokeWidth: 1.3 }),
        h('path', {
          d: 'M3 13.2c.6-2.4 2.7-3.8 5-3.8s4.4 1.4 5 3.8',
          stroke: 'currentColor',
          strokeWidth: 1.3,
          strokeLinecap: 'round',
        }),
      );
    }

    function ToolGlyph() {
      return h(
        'svg',
        { viewBox: '0 0 16 16', width: 12, height: 12, fill: 'none', 'aria-hidden': true },
        h('path', {
          d: 'M9.8 2.6a3.4 3.4 0 0 0-3.2 4.5L2.9 10.8a1.5 1.5 0 0 0 2.1 2.1l3.7-3.7a3.4 3.4 0 0 0 4.5-3.2l-1.9 1.9-2-.4-.4-2z',
          stroke: 'currentColor',
          strokeWidth: 1.15,
          strokeLinejoin: 'round',
        }),
      );
    }

    /* ------------------------------------------------------------------ *
     * Styles
     * ------------------------------------------------------------------ */

    const CSS = [
      ':root{--sk-indigo:#4C64A6;--sk-sky:#71A3D1;--sk-azure:#14ADFF;--sk-azure-ink:#0B6E9E;--sk-navy:#1D3F5E}',
      'body[data-ds-dark-theme]{--sk-azure-ink:#14ADFF}',
      '[data-dsh-threads-skin="slack"] .sk-row:hover{background:color-mix(in srgb,var(--sk-sky) 14%,transparent)}',
      '[data-dsh-threads-skin="slack"] .sk-date-pill{border-color:color-mix(in srgb,var(--sk-sky) 60%,var(--dsw-alias-border-l1))}',
      '[data-dsh-threads-skin="slack"] .sk-avatar-assistant{background:var(--sk-indigo)}',
      '[data-dsh-threads-skin="slack"] .sk-action:hover{color:var(--sk-azure-ink)}',
      '[data-dsh-threads-skin="slack"] .dt-thread-card-avatar-d{background:var(--sk-indigo)}',
      '[data-dsh-threads-skin="slack"] .dt-thread-card-count{color:var(--sk-azure-ink)}',
      '[data-dsh-threads-skin="slack"] .dt-replies-btn:hover{color:var(--sk-azure-ink)}',
      '[data-dsh-threads-skin="slack"] button.dt-switch[aria-checked="true"]{background:color-mix(in srgb,var(--sk-indigo) 30%,var(--dsw-alias-bg-layer-1));border-color:color-mix(in srgb,var(--sk-indigo) 45%,var(--dsw-alias-border-l1))}',
      '.dt-panel .dt-link{color:var(--sk-azure-ink)}',
      '.dt-panel .dt-quote{border-left-color:var(--sk-azure)}',
      '.dt-panel .dt-send{background:var(--sk-azure)}',
      '.dt-panel .dt-thread-card-count{color:var(--sk-azure)}',
      '.dt-icon-action{width:24px;height:24px;display:inline-grid;place-items:center;border:0;border-radius:4px;background:transparent;color:inherit;cursor:pointer;padding:0;opacity:.75}',
      '.dt-icon-action:hover{background:var(--dsw-alias-bg-layer-2);opacity:1}',
      '.dt-thread-card{margin:2px 0 6px;max-width:520px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-1);overflow:hidden}',
      '.dt-thread-card:hover{border-color:var(--dsw-alias-border-l2)}',
      '.dt-thread-card-main{display:flex;align-items:center;gap:8px;width:100%;padding:6px 10px;border:0;background:transparent;color:inherit;font:inherit;font-size:12px;text-align:left;cursor:pointer}',
      '.dt-thread-card-avatars{display:inline-flex;align-items:center;flex:none}',
      '.dt-thread-card-avatar{display:grid;place-items:center;width:20px;height:20px;border-radius:50%;border:2px solid var(--dsw-alias-bg-layer-1);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-size:9px;font-weight:700}',
      '.dt-thread-card-avatar-d{margin-left:-6px;background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-base)}',
      '.dt-thread-card-count{flex:none;color:var(--dsw-alias-brand-primary);font-weight:600}',
      '.dt-thread-card-time{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-secondary);font-size:11px}',
      '.dt-thread-card-chevron{display:grid;place-items:center;margin-left:auto;color:var(--dsw-alias-label-secondary)}',
      '.dt-thread-card-dot{flex:none;width:7px;height:7px;border-radius:50%;background:var(--sk-azure,var(--dsw-alias-brand-primary))}',
      '.dt-thread-card-dot.is-running{animation:dt-pulse 1.3s ease-in-out infinite}',
      '@keyframes dt-pulse{0%,100%{opacity:.35}50%{opacity:1}}',
      '.dt-also{display:inline-flex;align-items:center;gap:5px;font-size:11px;color:var(--dsw-alias-label-secondary);cursor:pointer;white-space:nowrap}',
      '.dt-also input{width:13px;height:13px;margin:0;accent-color:var(--sk-azure,var(--dsw-alias-brand-primary))}',
      '.dt-replies-btn svg{display:block}',
      '.dt-panel{display:flex;flex-direction:column;flex:1;min-height:0;height:100%;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.6}',
      '.dt-quote{margin:10px 12px 0;padding:10px 12px 11px;border:1px solid var(--dsw-alias-border-l1);border-left:3px solid var(--dsw-alias-brand-primary);border-radius:8px;background:var(--dsw-alias-bg-layer-1)}',
      '.dt-quote-top{display:flex;align-items:center;justify-content:space-between;gap:8px}',
      '.dt-quote-time{font-size:11px;color:var(--dsw-alias-label-secondary);white-space:nowrap}',
      '.dt-people{display:inline-flex;align-items:center;margin-right:2px}',
      '.dt-people-avatar{display:grid;place-items:center;width:18px;height:18px;border-radius:50%;border:2px solid var(--dsw-alias-bg-layer-1);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-size:9px;font-weight:700}',
      '.dt-people-avatar + .dt-people-avatar{margin-left:-5px}',
      '.dt-people-d{background:var(--sk-indigo);color:#ffffff}',
      '.dt-error-bottom{display:flex;align-items:center;gap:8px;justify-content:space-between}',
      '.dt-error-text{min-width:0;overflow-wrap:anywhere}',
      '.dt-retry{flex:none;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:11px;padding:2px 8px;border-radius:4px;cursor:pointer}',
      '.dt-retry:hover{border-color:var(--dsw-alias-border-l2)}',
      '[data-dsh-threads-skin="slack"] .sk-text-md blockquote{border-left-color:var(--sk-sky)}',
      '[data-dsh-threads-skin="slack"] .sk-text-md pre{background:color-mix(in srgb,var(--sk-indigo) 7%,var(--dsw-alias-bg-layer-1))}',
      '[data-dsh-threads-skin="slack"] .sk-text-md a{color:var(--sk-azure-ink)}',
      '.dt-quote-label{font-size:11px;font-weight:600;letter-spacing:.2px;color:var(--dsw-alias-label-secondary)}',
      '.dt-quote-actions{display:inline-flex;align-items:center;gap:4px;flex:none}',
      '.dt-link{border:0;background:transparent;color:var(--dsw-alias-brand-primary);font:inherit;font-size:11px;padding:2px 4px;border-radius:5px;cursor:pointer}',
      '.dt-link:hover{background:var(--dsw-alias-bg-layer-2)}',
      '.dt-quote-user{margin:6px 0 0;font-size:12px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.dt-quote-user-mark{display:inline-block;margin-right:5px;font-size:10.5px;font-weight:600;color:var(--dsw-alias-brand-primary)}',
      '.dt-quote-text{margin:4px 0 0;font-size:12.5px;line-height:1.6;color:var(--dsw-alias-label-primary);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}',
      '.dt-quote-md{white-space:normal}',
      '.dt-list{flex:1;min-height:0;overflow:auto;padding:8px 14px 12px;scrollbar-width:thin}',
      '.dt-row{display:flex;gap:10px;padding:8px;margin:0 -8px;border-radius:6px;transition:background-color .1s ease}',
      '.dt-row:hover{background:color-mix(in srgb,var(--sk-sky) 10%,transparent)}',
      '.dt-row[data-group="1"]{padding-top:2px}',
      '.dt-avatar{flex:none;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font-size:10px;font-weight:700;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);margin-top:2px}',
      '.dt-avatar[data-ghost="1"]{background:transparent}',
      '.dt-avatar-ghost{background:transparent}',
      '.dt-lightbox{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:24px;background:rgba(0,0,0,.72);cursor:zoom-out}',
      '.dt-lightbox-img{max-width:100%;max-height:100%;border-radius:6px;cursor:default}',
      '.dt-images{display:flex;flex-wrap:wrap;gap:4px;margin-top:5px}',
      '.dt-image{display:block;padding:0;border:1px solid var(--dsw-alias-border-l1);border-radius:4px;overflow:hidden;max-width:200px;background:var(--dsw-alias-bg-layer-1);cursor:zoom-in}',
      '.dt-image img{display:block;max-width:200px;max-height:160px;object-fit:contain}',
      '.dt-avatar svg{display:block}',
      '.dt-row[data-role="assistant"] .dt-avatar{background:var(--sk-indigo);color:#ffffff}',
      '.dt-body{min-width:0;flex:1}',
      '.dt-meta{display:flex;align-items:baseline;gap:8px;margin-bottom:2px}',
      '.dt-author{font-size:12px;font-weight:600}',
      '.dt-time{font-size:11px;color:var(--dsw-alias-label-secondary)}',
      '.dt-text{white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px;line-height:1.65}',
      '.dt-text-md{white-space:normal}',
      '.dt-text-md p:first-child,.dt-quote-md p:first-child{margin-top:0}',
      '.dt-text-md p:last-child,.dt-quote-md p:last-child{margin-bottom:0}',
      '.dt-row-tools{padding:0 0 2px 34px}',
      '.dt-tools{display:inline-flex;align-items:center;gap:5px;max-width:100%;padding:1px 8px;border-radius:999px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);font-size:11px;overflow:hidden}',
      '.dt-tools span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.dt-row-error{padding:4px 0 4px 34px}',
      '.dt-error{margin:0;padding:7px 9px;border-radius:6px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-state-error-primary);font-size:12px;overflow-wrap:anywhere}',
      '.dt-error-bottom{margin:0 14px 8px}',
      '.dt-empty{margin:14px 2px;color:var(--dsw-alias-label-secondary);font-size:12px}',
      '.dt-typing{display:flex;align-items:center;gap:8px;padding:6px 0 0 34px;color:var(--dsw-alias-label-secondary);font-size:12px}',
      '.dt-dots{display:inline-flex;gap:3px}',
      '.dt-dots span{width:4px;height:4px;border-radius:50%;background:currentColor;animation:dt-blink 1.1s infinite ease-in-out}',
      '.dt-dots span:nth-child(2){animation-delay:.16s}',
      '.dt-dots span:nth-child(3){animation-delay:.32s}',
      '@keyframes dt-blink{0%,80%,100%{opacity:.2}40%{opacity:1}}',
      '@media (prefers-reduced-motion:reduce){.dt-dots span{animation:none;opacity:.6}}',
      '.dt-approval{margin:0 0 8px;padding:9px 10px;border:1px solid var(--dsw-alias-border-l2);border-left:3px solid var(--dsw-alias-state-warn-primary);border-radius:0 8px 8px 0;background:var(--dsw-alias-bg-layer-1)}',
      '.dt-approval-title{font-size:12px;font-weight:600;color:var(--dsw-alias-state-warn-primary)}',
      '.dt-approval-reason{margin-top:4px;font-size:12px;color:var(--dsw-alias-label-secondary);white-space:pre-wrap;overflow-wrap:anywhere;max-height:72px;overflow:auto}',
      '.dt-approval-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:8px}',
      '.dt-approval-actions button{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);border-radius:6px;font:inherit;font-size:12px;padding:4px 10px;cursor:pointer}',
      '.dt-approval-actions button:disabled{opacity:.5;cursor:default}',
      '.dt-approval-actions .dt-approval-allow{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-base);font-weight:600}',
      '.dt-archived{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 8px;padding:7px 9px;border-radius:6px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);font-size:12px}',
      '.dt-archived span{min-width:0}',
      '.dt-input:disabled{opacity:.6;cursor:not-allowed}',
      '.dt-attachments{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 8px}',
      '.dt-attachment{position:relative;width:56px;height:56px;border-radius:6px;overflow:hidden;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1)}',
      '.dt-attachment img{display:block;width:100%;height:100%;object-fit:cover}',
      '.dt-attachment button{position:absolute;top:2px;right:2px;width:16px;height:16px;border:0;border-radius:50%;background:rgba(0,0,0,.62);color:#fff;font-size:12px;line-height:1;display:grid;place-items:center;cursor:pointer;padding:0}',
      '.dt-header-action{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 9px;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;cursor:pointer}',
      '.dt-header-action:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}',
      '.dt-thread-list{display:flex;flex-direction:column;height:100%;min-height:0;box-sizing:border-box;padding:14px;gap:10px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:13px}',
      '.dt-thread-list-head{font-size:12px;font-weight:600;color:var(--dsw-alias-label-secondary);flex:none;letter-spacing:.2px;padding:0 2px}',
      '.dt-thread-list-rows{display:flex;flex-direction:column;gap:6px;overflow:auto;min-height:0}',
      '.dt-thread-row{display:flex;align-items:flex-start;gap:10px;width:100%;text-align:left;border:1px solid transparent;border-radius:8px;background:transparent;color:inherit;font:inherit;padding:9px 10px;cursor:pointer;transition:background .12s ease,border-color .12s ease}',
      '.dt-thread-row:hover{background:color-mix(in srgb,var(--sk-sky) 12%,transparent);border-color:color-mix(in srgb,var(--sk-sky) 45%,var(--dsw-alias-border-l1))}',
      '.dt-thread-row:active{background:color-mix(in srgb,var(--sk-sky) 20%,transparent)}',
      '.dt-thread-row-avatars{display:inline-flex;flex:none;margin-top:1px}',
      '.dt-thread-row-avatar{display:grid;place-items:center;width:20px;height:20px;border-radius:50%;border:2px solid var(--dsw-alias-bg-base);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-size:9px;font-weight:700}',
      '.dt-thread-row-avatar-d{margin-left:-6px;background:var(--sk-indigo);color:#ffffff}',
      '.dt-thread-row-body{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}',
      '.dt-thread-row-text{font-size:12.5px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}',
      '.dt-thread-row-meta{display:flex;align-items:baseline;gap:8px;font-size:11px;color:var(--dsw-alias-label-secondary)}',
      '.dt-thread-row-count{color:var(--sk-azure-ink);font-weight:600}',
      '.dt-thread-row-time{color:var(--dsw-alias-label-secondary)}',
      '.dt-thread-row-chevron{flex:none;display:grid;place-items:center;margin-top:2px;color:var(--dsw-alias-label-secondary);opacity:0;transition:opacity .12s ease}',
      '.dt-thread-row:hover .dt-thread-row-chevron{opacity:1}',
      '.dt-empty-wrap{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;height:100%;min-height:160px;padding:24px 16px;color:var(--dsw-alias-label-secondary)}',
      '.dt-empty-mark{display:grid;place-items:center;width:36px;height:36px;border-radius:10px;border:1px dashed var(--dsw-alias-border-l2);color:var(--sk-azure)}',
      '.dt-empty-text{margin:0;font-size:12px;line-height:1.6;text-align:center}',
      '.dt-tab-title{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:240px}',
      '.dt-row-mark{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;color:var(--dsw-alias-label-secondary)}',
      '.sk-date{display:flex;justify-content:center;margin:10px 0 2px}',
      '.sk-date-pill{display:inline-flex;align-items:center;padding:2px 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:999px;background:var(--dsw-alias-bg-layer-1);font-size:11.5px;line-height:1.6;color:var(--dsw-alias-label-secondary)}',
      '.sk-row{position:relative;display:flex;gap:10px;padding:8px 10px;margin:0 -10px;border-radius:6px;max-width:100%;transition:background-color .1s ease}',
      '.sk-row:hover{background:color-mix(in srgb, var(--dsw-alias-label-primary) 7%, var(--dsw-alias-bg-base))}',
      '.sk-row[data-group="1"]{padding-top:2px}',
      '.sk-avatar{flex:none;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;margin-top:2px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-size:10px;font-weight:700}',
      '.sk-avatar-ghost{background:transparent}',
      '.sk-avatar-assistant{background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-base)}',
      '.sk-body{min-width:0;flex:1}',
      '.sk-meta{display:flex;align-items:baseline;gap:8px;margin-bottom:2px}',
      '.sk-author{font-size:12px;font-weight:600}',
      '.sk-time{font-size:11px;color:var(--dsw-alias-label-secondary)}',
      '.sk-actions{position:absolute;top:5px;right:6px;display:inline-flex;align-items:center;gap:2px;padding:2px;border:1px solid var(--dsw-alias-border-l1);border-radius:6px;background:var(--dsw-alias-bg-base);box-shadow:0 2px 6px rgba(0,0,0,.12);opacity:0;transition:opacity .12s ease}',
      '.sk-row:hover .sk-actions,.sk-actions:focus-within{opacity:1}',
      '.sk-action{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border:0;border-radius:4px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;padding:0}',
      '.sk-action:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}',
      '.sk-text{font-size:13px;line-height:1.65;white-space:pre-wrap;overflow-wrap:anywhere}',
      '.sk-text-md{white-space:normal}',
      '.sk-files{display:flex;flex-wrap:wrap;gap:4px;margin-top:5px}',
      '.sk-file{display:inline-flex;align-items:center;gap:6px;max-width:100%;padding:3px 7px;border:1px solid var(--dsw-alias-border-l1);border-radius:4px;background:var(--dsw-alias-bg-layer-1);font-size:11px;line-height:1.5;color:var(--dsw-alias-label-primary)}',
      '.sk-file svg{flex:none;color:var(--dsw-alias-label-secondary)}',
      '.sk-file-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px}',
      '.sk-file-meta{flex:none;color:var(--dsw-alias-label-secondary);font-size:10.5px}',
      '.sk-refs{display:flex;flex-wrap:wrap;gap:3px 10px;margin-top:5px;font-size:11px;color:var(--dsw-alias-label-secondary)}',
      '.sk-steer-head{display:flex;align-items:center;gap:8px;width:100%;border:0;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer;padding:0}',
      '.sk-steer-badge{flex:none;padding:1px 6px;border-radius:4px;background:color-mix(in srgb,var(--sk-indigo) 18%,var(--dsw-alias-bg-layer-1));color:var(--dsw-alias-label-secondary);font-size:10.5px;line-height:1.5}',
      '.sk-steer-text{min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12.5px;color:var(--dsw-alias-label-secondary)}',
      '.sk-steer-text.is-open{white-space:pre-wrap;overflow:visible;color:var(--dsw-alias-label-primary)}',
      '.sk-steer-chevron{flex:none;display:grid;place-items:center;color:var(--dsw-alias-label-secondary);transform:rotate(-90deg);transition:transform .12s ease}',
      '.sk-steering[data-expanded="1"] .sk-steer-chevron{transform:rotate(0)}',
      '[data-dsh-threads-skin="slack"] [data-chat-flow-kind="tool-call"],[data-dsh-threads-skin="slack"] [data-chat-flow-kind="turn-process"]{margin-left:34px}',
      '.dt-header-action[data-active="1"]{color:var(--dsw-alias-brand-primary)}',
      'button.dt-switch{position:relative;box-sizing:border-box;display:inline-flex;width:78px;height:30px;padding:2px;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);font:inherit;font-size:11px;font-weight:600;letter-spacing:.8px;line-height:1;cursor:pointer;transition:background .18s ease,color .18s ease,border-color .18s ease}',
      'button.dt-switch:hover{border-color:var(--dsw-alias-border-l2)}',
      'button.dt-switch[aria-checked="true"]{background:color-mix(in srgb, var(--dsw-alias-brand-primary) 22%, var(--dsw-alias-bg-layer-1));border-color:color-mix(in srgb, var(--dsw-alias-brand-primary) 35%, var(--dsw-alias-border-l1));color:var(--dsw-alias-label-primary)}',
      'button.dt-switch .dt-switch-knob{position:absolute;top:2px;left:2px;z-index:1;box-sizing:border-box;display:grid;place-items:center;width:24px;height:24px;border:1px solid var(--dsw-alias-border-l1);border-radius:6px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);transition:transform .18s cubic-bezier(.4,0,.2,1),background .18s ease,border-color .18s ease,color .18s ease}',
      'button.dt-switch[aria-checked="true"] .dt-switch-knob{transform:translateX(48px);background:#ffffff;border-color:#ffffff;color:#1b1f24}',
      'button.dt-switch .dt-switch-label{position:absolute;top:0;bottom:0;left:0;right:0;display:flex;align-items:center;justify-content:center;text-transform:uppercase;white-space:nowrap;transition:opacity .12s ease}',
      'button.dt-switch .dt-switch-label[data-pos="off"]{padding-left:28px;opacity:1}',
      'button.dt-switch .dt-switch-label[data-pos="on"]{padding-right:28px;opacity:0}',
      'button.dt-switch[aria-checked="true"] .dt-switch-label[data-pos="off"]{opacity:0}',
      'button.dt-switch[aria-checked="true"] .dt-switch-label[data-pos="on"]{opacity:1}',
      '.dt-composer{border-top:1px solid var(--dsw-alias-border-l1);padding:8px 14px 12px;background:var(--dsw-alias-bg-base)}',
      '.dt-composer-box{box-sizing:border-box;display:flex;flex-direction:column;gap:6px;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);padding:8px 10px 6px;transition:border-color .12s ease}',
      '.dt-composer-box:focus-within{border-color:color-mix(in srgb,var(--sk-azure) 55%,var(--dsw-alias-border-l1))}',
      '.dt-input{display:block;width:100%;box-sizing:border-box;min-height:36px;max-height:120px;resize:none;border:0;border-radius:0;background:transparent;color:inherit;font:inherit;font-size:13px;line-height:1.55;padding:2px 2px 4px;outline:none}',
      '.dt-input:focus{outline:none}',
      '.dt-input::placeholder{color:var(--dsw-alias-label-secondary)}',
      '.dt-composer-row{display:flex;align-items:center;gap:8px}',
      '.dt-plus{flex:none;width:26px;height:26px;border-radius:50%;border:1px solid var(--dsw-alias-border-l1);background:transparent;color:var(--dsw-alias-label-secondary);font-size:16px;line-height:1;display:grid;place-items:center;cursor:pointer;padding:0}',
      '.dt-plus:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}',
      '.dt-plus:disabled{opacity:.45;cursor:default}',
      '.dt-file-input{display:none}',
      '.dt-composer-hint{flex:1;min-width:0;font-size:11px;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.dt-hint{font-size:11px;color:var(--dsw-alias-label-secondary)}',
      '.dt-send-round{flex:none;width:30px;height:30px;border-radius:50%;border:0;background:var(--sk-indigo);color:#ffffff;display:grid;place-items:center;cursor:pointer;padding:0;transition:filter .12s ease}',
      '.dt-send-round:hover:not(:disabled){filter:brightness(1.06)}',
      '.dt-send-round:disabled{opacity:.45;cursor:default}',
      '.dt-stop{flex:none;border:0;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:11px;cursor:pointer;text-decoration:underline;text-underline-offset:2px}',
      '.dt-settings-section{max-width:640px;padding:4px 2px 24px}',
      '.dt-settings-head{padding:0 0 12px;margin-bottom:2px;border-bottom:1px solid var(--dsw-alias-border-l1)}',
      '.dt-settings-row{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:16px 0;border-bottom:1px solid var(--dsw-alias-border-l1)}',
      '.dt-settings-row:last-child{border-bottom:0}',
      '.dt-settings-text{min-width:0;display:flex;flex-direction:column;gap:4px}',
      '.dt-settings-title{font-size:13.5px;font-weight:600;color:var(--dsw-alias-label-primary)}',
      '.dt-settings-desc{font-size:12px;line-height:1.55;color:var(--dsw-alias-label-secondary)}',
      '.dt-settings-section-title{margin:0 0 4px;font-size:17px;line-height:1.4;font-weight:600;color:var(--dsw-alias-label-primary)}',
      '.dt-settings-lead{margin:0;font-size:12.5px;line-height:1.6;color:var(--dsw-alias-label-secondary)}',
      '.dt-settings-text{min-width:0;display:flex;flex-direction:column;gap:3px}',
      '.dt-settings-title{font-size:14px;font-weight:500;color:var(--dsw-alias-label-primary)}',
      '.dt-settings-desc{font-size:12px;line-height:1.5;color:var(--dsw-alias-label-secondary)}',
      'button.dt-settings-switch{position:relative;box-sizing:border-box;flex:none;width:40px;height:22px;padding:2px;border:1px solid var(--dsw-alias-border-l1);border-radius:999px;background:var(--dsw-alias-bg-layer-2);cursor:pointer;transition:background .16s ease,border-color .16s ease}',
      'button.dt-settings-switch[aria-checked="true"]{background:var(--sk-indigo);border-color:var(--sk-indigo)}',
      'button.dt-settings-switch .dt-settings-knob{display:block;width:16px;height:16px;border-radius:50%;background:#ffffff;box-shadow:0 1px 2px rgba(0,0,0,.2);transform:translateX(0);transition:transform .16s cubic-bezier(.4,0,.2,1)}',
      'button.dt-settings-switch[aria-checked="true"] .dt-settings-knob{transform:translateX(18px)}',
    ].join('\n');

    /** Token layer that repaints the whole app with the jazz palette. */
    const JAZZ_TOKENS = {
      '--dsw-alias-bg-base': { light: '#FFFFFF', dark: '#0B1622' },
      '--dsw-alias-bg-layer-1': { light: '#F7F9FC', dark: '#12212F' },
      '--dsw-alias-bg-layer-2': { light: '#EDF1F6', dark: '#1A2E40' },
      '--dsw-alias-bg-overlay': { light: '#FFFFFF', dark: '#12212F' },
      '--dsw-alias-border-l1': { light: '#DDE4EC', dark: '#23384B' },
      '--dsw-alias-border-l2': { light: '#C3CFDC', dark: '#2F4A61' },
      '--dsw-alias-brand-primary': { light: '#4C64A6', dark: '#71A3D1' },
      '--dsw-alias-label-primary': { light: '#1D3F5E', dark: '#E9F2FA' },
      '--dsw-alias-label-secondary': { light: '#566A7D', dark: '#A9C1D6' },
      '--dsw-alias-state-error-primary': { light: '#B42318', dark: '#F97066' },
      '--dsw-alias-state-idle-primary': { light: '#64748B', dark: '#7C93AB' },
      '--dsw-alias-state-success-primary': { light: '#067647', dark: '#3DD68C' },
      '--dsw-alias-state-warn-primary': { light: '#B54708', dark: '#FDB022' },
      '--dsw-specific-sidebar-fill': { light: '#F0F4F9', dark: '#08121C' },
    };

    return {
      inject: ['slots', 'sessions', 'locale', 'sidebarRight', 'sidebarRightTabs', 'uiWorkspace', 'workspaces'],
      apply(ctx) {
        const t = ctx.locale.bind(NS);

        void loadPersisted();

        ctx.effect(() => ctx.locale.register(NS, { zh: ZH, en: EN }), 'threads: locale');
        ctx.effect(() => {
          const style = document.createElement('style');
          style.dataset.plugin = PLUGIN_ID;
          style.textContent = CSS;
          document.head.appendChild(style);
          return () => style.remove();
        }, 'threads: styles');
        ctx.effect(() => {
          const resync = () => {
            store = readStore();
            storeVersion += 1;
            drafts = readDrafts();
            for (const listener of Array.from(storeListeners)) {
              try {
                listener();
              } catch (error) {
                /* ignore */
              }
            }
          };
          window.addEventListener('storage', resync);
          return () => window.removeEventListener('storage', resync);
        }, 'threads: storage sync');

        function openThreadPanel(sessionId, seq) {
          const params = { parentId: sessionId, seq };
          try {
            ctx.sidebarRight.openTab(TAB_KIND, { params });
            return;
          } catch (error) {
            /* the on-screen path can refuse; fall through to the session path */
          }
          try {
            ctx.sidebarRight.openTabIn(sessionId, TAB_KIND, { params });
          } catch (error) {
            console.error('[dsh-threads] cannot open the thread tab', error);
          }
        }

        async function promptSession(binding, text, images) {
          const parts = [{ type: 'text', text: THREAD_NOTE + '\n\n' + text }];
          for (const image of images || []) {
            parts.push({ type: 'image', mediaType: image.mediaType, data: image.data, name: image.name });
          }
          const result = await binding.session.prompt(parts, 'queue');
          if (result && result.ok === false) {
            throw new Error((result.error && result.error.message) || t('panel.sendFailed'));
          }
        }

        /** Hover action inside the host's assistant action row. */
        function ThreadIconAction(props) {
          const sessionId = props.sessionId;
          const messageId = props.messageId === undefined ? '' : String(props.messageId);
          const useAccess = props.useAccess;
          const allowed = typeof useAccess === 'function' ? useAccess('session/fork') : true;
          if (!allowed || messageId === '') return null;
          const open = () => {
            let binding;
            try {
              binding = ctx.sessions.binding(sessionId);
            } catch (error) {
              binding = undefined;
            }
            const seq = seqForMessage(binding, messageId);
            if (seq === undefined) {
              console.warn('[dsh-threads] cannot resolve the message sequence', messageId);
              return;
            }
            openThreadPanel(sessionId, seq);
          };
          return h(
            'button',
            {
              type: 'button',
              className: 'dt-icon-action',
              title: t('turn.start'),
              'aria-label': t('turn.start'),
              onClick: open,
            },
            h(ThreadGlyph, null),
          );
        }

        /** Leading mark on a Session row whose Session is a thread child. */
        function ThreadRowMark(props) {
          const isThread = useIsThreadChild(props.sessionId);
          if (!isThread) return null;
          return h(
            'span',
            { className: 'dt-row-mark', title: t('row.thread'), 'aria-label': t('row.thread') },
            h(ThreadGlyph, null),
          );
        }

        /** Persistent "N replies" line under a turn that already has a thread. */
        function ThreadRepliesLine(props) {
          const sessionId = props.sessionId;
          const seq = props.seq;
          const entry = useThreadEntry(sessionId, seq);
          const childId = entry && typeof entry.childId === 'string' ? entry.childId : '';
          const status =
            typeof props.useSessionStatus === 'function' && childId
              ? props.useSessionStatus((snapshot) => snapshot.get(childId))
              : undefined;
          const running = Boolean(status && status.running);
          const wasRunning = React.useRef(running);
          React.useEffect(() => {
            const before = wasRunning.current;
            wasRunning.current = running;
            if (!before || running || !childId) return undefined;
            let cancelled = false;
            (async () => {
              let reference;
              try {
                reference = ctx.sessions.retain(childId, { source: RETAIN_SOURCE });
                const binding = await reference.ready;
                if (cancelled) return;
                const state = binding.eventSource.getSnapshot();
                const entries = state && Array.isArray(state.entries) ? state.entries : [];
                let count = 0;
                let last = 0;
                for (const item of entries) {
                  if (!item || item.type !== 'event' || !item.event) continue;
                  if (item.event.type !== 'user/message') continue;
                  count += 1;
                  if (typeof item.event.time === 'number' && item.event.time > last) {
                    last = item.event.time;
                  }
                }
                if (count > 0) {
                  patchThread(sessionId, seq, {
                    replies: count,
                    updatedAt: last || Date.now(),
                    seenAt: Date.now(),
                  });
                }
              } catch (error) {
                /* a missing window leaves the persisted count unchanged */
              } finally {
                if (reference) {
                  try {
                    reference.release();
                  } catch (error) {
                    /* already released */
                  }
                }
              }
            })();
            return () => {
              cancelled = true;
            };
          }, [childId, running, sessionId, seq]);
          if (!entry) return null;
          const replies = typeof entry.replies === 'number' ? entry.replies : 0;
          const when = relativeLabel(entry.updatedAt, t);
          const unread = !running && (entry.updatedAt || 0) > (entry.seenAt || 0);
          return h(
            'div',
            { className: 'dt-thread-card' },
            h(
              'button',
              {
                type: 'button',
                className: 'dt-thread-card-main',
                title: t('turn.open'),
                onClick: () => openThreadPanel(sessionId, seq),
              },
              h(
                'span',
                { className: 'dt-thread-card-avatars', 'aria-hidden': true },
                h('span', { className: 'dt-thread-card-avatar' }, h(UserGlyph, null)),
                h('span', { className: 'dt-thread-card-avatar dt-thread-card-avatar-d' }, 'D'),
              ),
              h(
                'span',
                { className: 'dt-thread-card-count' },
                t('turn.replies', { count: replies }),
              ),
              running || unread
                ? h('span', {
                    className: running ? 'dt-thread-card-dot is-running' : 'dt-thread-card-dot',
                    title: running ? t('turn.running') : t('turn.unread'),
                    'aria-label': running ? t('turn.running') : t('turn.unread'),
                  })
                : null,
              when
                ? h('span', { className: 'dt-thread-card-time' }, t('turn.lastReply', { when }))
                : null,
              h('span', { className: 'dt-thread-card-chevron', 'aria-hidden': true }, h(ChevronGlyph, null)),
            ),
          );
        }

        /** Header button: open the per-session thread list. */
        function ThreadsHeaderAction(props) {
          const sessionId = props.sessionId;
          const list = useThreadList(sessionId);
          const open = () => {
            const params = { parentId: sessionId };
            try {
              ctx.sidebarRight.openTab('threads', { params });
              return;
            } catch (error) {
              /* fall through to the session-scoped path */
            }
            try {
              ctx.sidebarRight.openTabIn(sessionId, 'threads', { params });
            } catch (error) {
              console.error('[dsh-threads] cannot open the thread list', error);
            }
          };
          return h(
            'button',
            { type: 'button', className: 'dt-header-action', title: t('list.title'), onClick: open },
            h(ThreadGlyph, null),
            h('span', null, list.length > 0 ? t('list.count', { count: list.length }) : t('list.button')),
          );
        }

        /** Right-sidebar page listing every thread of the rendered Session. */
        /** Centered empty/loading state shared by the thread surfaces. */
        function PanelEmpty(props) {
          return h(
            'div',
            { className: 'dt-empty-wrap' },
            h('span', { className: 'dt-empty-mark', 'aria-hidden': true }, h(ThreadGlyph, null)),
            h('p', { className: 'dt-empty-text' }, props.text),
          );
        }

        function ThreadsList(props) {
          const info = typeof props.useTabInfo === 'function' ? props.useTabInfo() : null;
          const params =
            info && info.tab && info.tab.navigation && info.tab.navigation.params
              ? info.tab.navigation.params
              : {};
          const parentId = typeof params.parentId === 'string' ? params.parentId : props.sessionId;
          const list = useThreadList(parentId);
          const localeSnapshot = useLocaleSnapshot(ctx);
          const active = localeSnapshot && localeSnapshot.active ? localeSnapshot.active : 'en';
          const open = (seq) => {
            try {
              ctx.sidebarRight.openTab('thread', { params: { parentId, seq } });
              return;
            } catch (error) {
              /* fall through to the session-scoped path */
            }
            try {
              ctx.sidebarRight.openTabIn(parentId, 'thread', { params: { parentId, seq } });
            } catch (error) {
              console.error('[dsh-threads] cannot open the thread tab', error);
            }
          };
          return h(
            'div',
            { className: 'dt-thread-list' },
            h('div', { className: 'dt-thread-list-head' }, t('list.heading', { count: list.length })),
            list.length === 0
              ? h(PanelEmpty, { text: t('list.empty') })
              : h(
                  'div',
                  { className: 'dt-thread-list-rows' },
                  list.map((thread) => {
                    const excerpt =
                      plainText(thread.quote && (thread.quote.assistant || thread.quote.user)) ||
                      t('panel.anchor', { turn: thread.seq });
                    return h(
                      'button',
                      {
                        type: 'button',
                        className: 'dt-thread-row',
                        key: String(thread.seq),
                        onClick: () => open(thread.seq),
                      },
                      h(
                        'span',
                        { className: 'dt-thread-row-avatars', 'aria-hidden': true },
                        h('span', { className: 'dt-thread-row-avatar' }, h(UserGlyph, null)),
                        h('span', { className: 'dt-thread-row-avatar dt-thread-row-avatar-d' }, 'D'),
                      ),
                      h(
                        'span',
                        { className: 'dt-thread-row-body' },
                        h('span', { className: 'dt-thread-row-text' }, excerpt),
                        h(
                          'span',
                          { className: 'dt-thread-row-meta' },
                          h(
                            'span',
                            { className: 'dt-thread-row-count' },
                            t('turn.replies', { count: thread.replies || 0 }),
                          ),
                          thread.updatedAt
                            ? h(
                                'span',
                                { className: 'dt-thread-row-time' },
                                clockText(thread.updatedAt, active),
                              )
                            : null,
                        ),
                      ),
                      h(
                        'span',
                        { className: 'dt-thread-row-chevron', 'aria-hidden': true },
                        h(ChevronGlyph, null),
                      ),
                    );
                  }),
                ),
          );
        }

        /** Live tab title: the anchored answer's first line. */
        function ThreadTitle(props) {
          const info = typeof props.useTabInfo === 'function' ? props.useTabInfo() : null;
          const params =
            info && info.tab && info.tab.navigation && info.tab.navigation.params
              ? info.tab.navigation.params
              : {};
          const entry = useThreadEntry(params.parentId, Number(params.seq));
          const excerpt = entry && entry.quote
            ? plainText(entry.quote.assistant || entry.quote.user || '')
            : '';
          return h(
            'span',
            { className: 'dt-tab-title' },
            excerpt ? t('panel.title') + ' · ' + excerpt.slice(0, 18) : t('panel.title'),
          );
        }

        function MessageImages(props) {
          const attachments = props.attachments || [];
          const [urls, setUrls] = React.useState([]);
          const [zoom, setZoom] = React.useState(null);
          React.useEffect(() => {
            if (!zoom) return undefined;
            const onKey = (event) => {
              if (event.key === 'Escape') setZoom(null);
            };
            window.addEventListener('keydown', onKey);
            return () => window.removeEventListener('keydown', onKey);
          }, [zoom]);
          const key = attachments
            .map((attachment) => String(attachment.attachmentId))
            .join(',');
          React.useEffect(() => {
            let alive = true;
            if (attachments.length === 0) {
              setUrls([]);
              return undefined;
            }
            const api = typeof ctx.get === 'function' ? ctx.get('uiConversation') : undefined;
            if (!api || typeof api.imageUrl !== 'function') return undefined;
            Promise.all(
              attachments.map((attachment) =>
                api.imageUrl(props.sessionId, attachment).catch(() => ''),
              ),
            ).then((resolved) => {
              if (alive) setUrls(resolved);
            });
            return () => {
              alive = false;
            };
          }, [props.sessionId, key]);
          if (urls.length === 0) return null;
          return h(
            React.Fragment,
            null,
            h(
              'div',
              { className: 'dt-images' },
              urls.map((url, index) =>
                url
                  ? h(
                      'button',
                      {
                        key: String(index),
                        type: 'button',
                        className: 'dt-image',
                        title: t('panel.zoom'),
                        onClick: () => setZoom(url),
                      },
                      h('img', { src: url, alt: '' }),
                    )
                  : null,
              ),
            ),
            zoom
              ? h(
                  'div',
                  {
                    className: 'dt-lightbox',
                    role: 'dialog',
                    'aria-modal': 'true',
                    onClick: () => setZoom(null),
                  },
                  h('img', {
                    className: 'dt-lightbox-img',
                    src: zoom,
                    alt: '',
                    onClick: (event) => event.stopPropagation(),
                  }),
                )
              : null,
          );
        }

        /** Locale-aware markdown chrome labels shared by the Slack rows. */
        function useMarkdownLabels() {
          const localeSnapshot = useLocaleSnapshot(ctx);
          const active = localeSnapshot && localeSnapshot.active ? localeSnapshot.active : 'en';
          const labels = React.useMemo(
            () => ({
              code: {
                copyLabel: t('md.copy'),
                copiedLabel: t('md.copied'),
                toolbarLabels: {
                  codeLabel: t('md.code'),
                  wrapLabel: t('md.wrap'),
                  unwrapLabel: t('md.unwrap'),
                },
              },
              footnotes: t('md.footnotes'),
            }),
            [active],
          );
          return { labels, active };
        }

        function CopyGlyph() {
          return h(
            'svg',
            { viewBox: '0 0 16 16', width: 12, height: 12, fill: 'none', 'aria-hidden': true },
            h('rect', {
              x: 5.5,
              y: 5.5,
              width: 8,
              height: 8,
              rx: 1.5,
              stroke: 'currentColor',
              strokeWidth: 1.2,
            }),
            h('path', {
              d: 'M10.5 5.5V3.6c0-.6-.5-1.1-1.1-1.1H3.6c-.6 0-1.1.5-1.1 1.1v5.8c0 .6.5 1.1 1.1 1.1h1.9',
              stroke: 'currentColor',
              strokeWidth: 1.2,
            }),
          );
        }

        function SlackCopyButton(props) {
          const [copied, setCopied] = React.useState(false);
          const text = typeof props.text === 'string' ? props.text : '';
          if (text === '') return null;
          const copy = () => {
            const clipboard = navigator.clipboard;
            if (!clipboard || typeof clipboard.writeText !== 'function') return;
            clipboard.writeText(text).then(
              () => {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1200);
              },
              () => {},
            );
          };
          return h(
            'button',
            {
              type: 'button',
              className: 'sk-action',
              title: copied ? t('md.copied') : t('md.copy'),
              'aria-label': copied ? t('md.copied') : t('md.copy'),
              onClick: copy,
            },
            copied ? '✓' : h(CopyGlyph, null),
          );
        }

        function BranchGlyph() {
          return h(
            'svg',
            { viewBox: '0 0 16 16', width: 13, height: 13, fill: 'none', 'aria-hidden': true },
            h('circle', { cx: 4.5, cy: 3.5, r: 1.7, stroke: 'currentColor', strokeWidth: 1.2 }),
            h('circle', { cx: 4.5, cy: 12.5, r: 1.7, stroke: 'currentColor', strokeWidth: 1.2 }),
            h('circle', { cx: 11.5, cy: 6, r: 1.7, stroke: 'currentColor', strokeWidth: 1.2 }),
            h('path', {
              d: 'M4.5 5.2v5.6M6.2 6h3.6',
              stroke: 'currentColor',
              strokeWidth: 1.2,
              strokeLinecap: 'round',
            }),
          );
        }

        /** Wall-clock time for a node: its own for user rows, the turn's for replies. */
        function nodeTime(node, data) {
          if (data && typeof data.time === 'number') return data.time;
          const location = node && node.location;
          const turn =
            location && (location.kind === 'turn' || location.kind === 'step')
              ? location.turn
              : undefined;
          const start = turn && turn.start;
          return start && typeof start.time === 'number' ? start.time : undefined;
        }

        /** Start of the turn this node belongs to, when loaded. */
        function turnStart(node) {
          const location = node && node.location;
          const turn =
            location && (location.kind === 'turn' || location.kind === 'step')
              ? location.turn
              : undefined;
          return turn && turn.start ? turn.start : undefined;
        }

        /** Time of the closest user message before one session sequence. */
        function previousUserTime(sessionId, beforeSeq) {
          if (typeof beforeSeq !== 'number') return undefined;
          let binding;
          try {
            binding = ctx.sessions.binding(sessionId);
          } catch (error) {
            binding = undefined;
          }
          if (binding === undefined) return undefined;
          let windowState;
          try {
            windowState = binding.eventSource.getSnapshot();
          } catch (error) {
            return undefined;
          }
          const entries =
            windowState && Array.isArray(windowState.entries) ? windowState.entries : [];
          let best;
          for (const entry of entries) {
            if (!entry || entry.type !== 'event' || !entry.event) continue;
            const event = entry.event;
            if (event.type !== 'user/message') continue;
            if (typeof event.seq !== 'number' || event.seq >= beforeSeq) continue;
            if (best === undefined || event.seq > best.seq) best = event;
          }
          return best === undefined ? undefined : best.time;
        }

        function dayKey(time) {
          const date = new Date(time);
          return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
        }

        function dayLabel(time, active) {
          const date = new Date(time);
          const now = new Date();
          const key = dayKey(time);
          if (key === dayKey(now.getTime())) return t('skin.today');
          const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          if (key === dayKey(yesterday.getTime())) return t('skin.yesterday');
          const options = { month: 'long', day: 'numeric', weekday: 'long' };
          if (date.getFullYear() !== now.getFullYear()) options.year = 'numeric';
          try {
            return new Intl.DateTimeFormat(active === 'zh' ? 'zh-CN' : 'en-US', options).format(
              date,
            );
          } catch (error) {
            return date.toDateString();
          }
        }

        function SwitchGlyph() {
          return h(
            'svg',
            { viewBox: '0 0 16 16', width: 14, height: 14, fill: 'none', 'aria-hidden': true },
            h('rect', {
              x: 2.2,
              y: 3.4,
              width: 11.6,
              height: 7.4,
              rx: 1,
              stroke: 'currentColor',
              strokeWidth: 1.5,
            }),
            h('path', {
              d: 'M5.6 13.2h4.8M8 10.8v2.4',
              stroke: 'currentColor',
              strokeWidth: 1.3,
              strokeLinecap: 'round',
            }),
            h('circle', { cx: 6.1, cy: 7.1, r: 0.85, fill: 'currentColor' }),
            h('circle', { cx: 9.3, cy: 7.1, r: 0.85, fill: 'currentColor' }),
          );
        }

        function FileGlyph() {
          return h(
            'svg',
            { viewBox: '0 0 16 16', width: 12, height: 12, fill: 'none', 'aria-hidden': true },
            h('path', {
              d: 'M4 1.8h5l3 3v9.2H4z',
              stroke: 'currentColor',
              strokeWidth: 1.2,
              strokeLinejoin: 'round',
            }),
            h('path', {
              d: 'M9 1.8v3h3',
              stroke: 'currentColor',
              strokeWidth: 1.2,
              strokeLinejoin: 'round',
            }),
          );
        }

        function formatBytes(bytes) {
          const value = Number(bytes);
          if (!Number.isFinite(value) || value <= 0) return '';
          if (value < 1024) return String(value) + ' B';
          if (value < 1024 * 1024) return (value / 1024).toFixed(1) + ' KB';
          return (value / (1024 * 1024)).toFixed(1) + ' MB';
        }

        function extensionOf(name) {
          const text = typeof name === 'string' ? name : '';
          const dot = text.lastIndexOf('.');
          return dot > 0 && dot < text.length - 1 ? text.slice(dot + 1).toUpperCase().slice(0, 8) : '';
        }

        function ChevronGlyph() {
          return h(
            'svg',
            { viewBox: '0 0 16 16', width: 12, height: 12, fill: 'none', 'aria-hidden': true },
            h('path', {
              d: 'M6 3.5l4.5 4.5L6 12.5',
              stroke: 'currentColor',
              strokeWidth: 1.5,
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
            }),
          );
        }

        function relativeLabel(time, translate) {
          if (typeof time !== 'number' || time <= 0) return '';
          const minutes = Math.floor((Date.now() - time) / 60000);
          if (minutes < 1) return translate('time.now');
          if (minutes < 60) return translate('time.minutes', { count: minutes });
          const hours = Math.floor(minutes / 60);
          if (hours < 24) return translate('time.hours', { count: hours });
          return translate('time.days', { count: Math.floor(hours / 24) });
        }

        function SendGlyph() {
          return h(
            'svg',
            { viewBox: '0 0 16 16', width: 15, height: 15, fill: 'none', 'aria-hidden': true },
            h('path', {
              d: 'M8 12.8V3.4M8 3.4L4.1 7.3M8 3.4l3.9 3.9',
              stroke: 'currentColor',
              strokeWidth: 1.7,
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
            }),
          );
        }

        function SlackAction(props) {
          return h(
            'button',
            {
              type: 'button',
              className: 'sk-action',
              title: props.title,
              'aria-label': props.title,
              onClick: props.onClick,
            },
            props.children,
          );
        }

        /** Slack-style renderer replacing the shipped `user` Chat node. */
        function SlackUserNode(props) {
          const node = props.node || {};
          const data = node.data || {};
          const content = Array.isArray(data.content) ? data.content : [];
          const text = content
            .filter((block) => block && block.type === 'text')
            .map((block) => block.text)
            .join('\n\n');
          const attachments = content
            .filter((block) => block && block.type === 'image' && block.attachment)
            .map((block) => block.attachment);
          const files = content
            .filter((block) => block && block.type === 'file' && block.attachment)
            .map((block) => block.attachment);
          const referenceLabels = Array.isArray(data.referenceLabels) ? data.referenceLabels : [];
          const skillNames = Array.isArray(data.skillNames) ? data.skillNames : [];
          const { active } = useMarkdownLabels();
          const time = nodeTime(node, data);
          const start = turnStart(node);
          const startSeq = start && typeof start.seq === 'number' ? start.seq : undefined;
          const previous =
            time !== undefined && startSeq !== undefined
              ? previousUserTime(props.sessionId, startSeq)
              : undefined;
          const showDate =
            time !== undefined &&
            (previous === undefined || dayKey(previous) !== dayKey(time));
          return h(
            React.Fragment,
            null,
            showDate
              ? h(
                  'div',
                  { className: 'sk-date' },
                  h('span', { className: 'sk-date-pill' }, dayLabel(time, active)),
                )
              : null,
            h(
            'div',
            { className: 'sk-row', 'data-role': 'user' },
            h('div', { className: 'sk-avatar', 'aria-hidden': true }, t('skin.avatarYou')),
            h(
              'div',
              { className: 'sk-body' },
              h(
                'div',
                { className: 'sk-meta' },
                h('span', { className: 'sk-author' }, t('panel.you')),
                time ? h('span', { className: 'sk-time' }, clockText(time, active)) : null,
              ),
              text ? h('div', { className: 'sk-text' }, text) : null,
              attachments.length > 0
                ? h(MessageImages, { sessionId: props.sessionId, attachments })
                : null,
              files.length > 0
                ? h(
                    'div',
                    { className: 'sk-files' },
                    files.map((file, index) =>
                      h(
                        'span',
                        { className: 'sk-file', key: String(index), title: file.name || '' },
                        h(FileGlyph, null),
                        h('span', { className: 'sk-file-name' }, file.name || 'file'),
                        h(
                          'span',
                          { className: 'sk-file-meta' },
                          [extensionOf(file.name), formatBytes(file.bytes)]
                            .filter(Boolean)
                            .join(' · '),
                        ),
                      ),
                    ),
                  )
                : null,
              referenceLabels.length > 0 || skillNames.length > 0
                ? h(
                    'div',
                    { className: 'sk-refs' },
                    referenceLabels.length > 0
                      ? h(
                          'span',
                          null,
                          t('skin.refs', { labels: referenceLabels.slice(0, 3).join(' · ') }),
                        )
                      : null,
                    skillNames.length > 0
                      ? h(
                          'span',
                          null,
                          t('skin.skills', { names: skillNames.slice(0, 3).join(' · ') }),
                        )
                      : null,
                  )
                : null,
            ),
            h('div', { className: 'sk-actions' }, h(SlackCopyButton, { text })),
            ),
          );
        }

        /** Slack-style renderer replacing the shipped `assistant-step` Chat node. */
        function SlackAssistantNode(props) {
          const node = props.node || {};
          const data = node.data || {};
          const blocks = Array.isArray(data.blocks) ? data.blocks : [];
          const text = blocks
            .filter((block) => block && block.kind === 'text')
            .map((block) => block.text)
            .join('\n\n');
          const attachments = blocks
            .filter((block) => block && block.kind === 'image' && block.attachment)
            .map((block) => block.attachment);
          const { labels, active } = useMarkdownLabels();
          const canFork =
            typeof props.useAccess === 'function' ? props.useAccess('session/fork') : false;
          if (props.groupPart === 'reasoning') return null;
          if (!text && attachments.length === 0) return null;
          const seq =
            data.finalNode && typeof data.finalNode.seq === 'number' ? data.finalNode.seq : undefined;
          const time = nodeTime(node, data);
          return h(
            'div',
            { className: 'sk-row', 'data-role': 'assistant' },
            h(
              'div',
              { className: 'sk-avatar sk-avatar-assistant', 'aria-hidden': true },
              'D',
            ),
            h(
              'div',
              { className: 'sk-body' },
              h(
                'div',
                { className: 'sk-meta' },
                h('span', { className: 'sk-author' }, 'DSH'),
                time ? h('span', { className: 'sk-time' }, clockText(time, active)) : null,
              ),
              text
                ? h(
                    'div',
                    { className: 'sk-text sk-text-md' },
                    MarkdownText
                      ? h(MarkdownText, {
                          text,
                          labels,
                          streaming: data.status === 'running',
                        })
                      : text,
                  )
                : null,
              attachments.length > 0
                ? h(MessageImages, { sessionId: props.sessionId, attachments })
                : null,
            ),
            h(
              'div',
              { className: 'sk-actions' },
              h(SlackCopyButton, { text }),
              seq !== undefined
                ? h(
                    SlackAction,
                    {
                      title: t('turn.start'),
                      onClick: () => openThreadPanel(props.sessionId, seq),
                    },
                    h(ThreadGlyph, null),
                  )
                : null,
              canFork && seq !== undefined
                ? h(
                    SlackAction,
                    {
                      title: t('skin.branch'),
                      onClick: () => props.forkAt(seq),
                    },
                    h(BranchGlyph, null),
                  )
                : null,
            ),
          );
        }

        /** Compact, collapsible renderer for a message inserted mid-turn. */
        function SlackSteeringNode(props) {
          const node = props.node || {};
          const data = node.data || {};
          const content = Array.isArray(data.content) ? data.content : [];
          const text = content
            .filter((block) => block && block.type === 'text')
            .map((block) => block.text)
            .join('\n\n');
          const { active } = useMarkdownLabels();
          const time = nodeTime(node, data);
          const [expanded, setExpanded] = React.useState(false);
          if (!text) return null;
          return h(
            'div',
            { className: 'sk-row sk-steering', 'data-role': 'steering', 'data-expanded': expanded ? '1' : '0' },
            h('div', { className: 'sk-avatar sk-avatar-ghost', 'aria-hidden': true }),
            h(
              'div',
              { className: 'sk-body' },
              h(
                'button',
                {
                  type: 'button',
                  className: 'sk-steer-head',
                  'aria-expanded': expanded ? 'true' : 'false',
                  title: expanded ? t('skin.steeringCollapse') : t('skin.steeringExpand'),
                  onClick: () => setExpanded((value) => !value),
                },
                h('span', { className: 'sk-steer-badge' }, t('skin.steering')),
                h(
                  'span',
                  { className: expanded ? 'sk-steer-text is-open' : 'sk-steer-text' },
                  text,
                ),
                time ? h('span', { className: 'sk-time' }, clockText(time, active)) : null,
                h(
                  'span',
                  { className: 'sk-steer-chevron', 'aria-hidden': true },
                  h(ChevronGlyph, null),
                ),
              ),
            ),
          );
        }

        /** Header switch between the shipped Chat and the Slack node renderers. */
        function SkinToggle() {
          const mode = useSkin();
          const on = mode === 'slack';
          return h(
            'button',
            {
              type: 'button',
              className: 'dt-switch',
              role: 'switch',
              'aria-checked': on ? 'true' : 'false',
              title: t('skin.title'),
              onClick: () => setSkin(on ? 'native' : 'slack'),
            },
            h(
              'span',
              { className: 'dt-switch-knob', 'aria-hidden': true },
              h(SwitchGlyph, null),
            ),
            h(
              'span',
              { className: 'dt-switch-label', 'data-pos': 'on', 'aria-hidden': true },
              t('skin.on'),
            ),
            h(
              'span',
              { className: 'dt-switch-label', 'data-pos': 'off', 'aria-hidden': true },
              t('skin.off'),
            ),
          );
        }

        /** Settings switch: same shape as the header switch, no inline label. */
        function SettingsSwitch(props) {
          return h(
            'button',
            {
              type: 'button',
              className: 'dt-settings-switch',
              role: 'switch',
              'aria-checked': props.on ? 'true' : 'false',
              onClick: () => props.onChange(!props.on),
            },
            h('span', { className: 'dt-settings-knob', 'aria-hidden': true }),
          );
        }

        function SettingsRow(props) {
          return h(
            'div',
            { className: 'dt-settings-row' },
            h(
              'div',
              { className: 'dt-settings-text' },
              h('div', { className: 'dt-settings-title' }, props.title),
              props.description
                ? h('div', { className: 'dt-settings-desc' }, props.description)
                : null,
            ),
            h(SettingsSwitch, { on: props.on, onChange: props.onChange }),
          );
        }

        function SlackAppearanceSetting() {
          const mode = useSkin();
          return h(SettingsRow, {
            title: t('settings.appearance.title'),
            description: t('settings.appearance.description'),
            on: mode === 'slack',
            onChange: (next) => setSkin(next ? 'slack' : 'native'),
          });
        }

        function SlackThemeSetting() {
          const mode = useThemeMode();
          return h(SettingsRow, {
            title: t('settings.theme.title'),
            description: t('settings.theme.description'),
            on: mode === 'jazz',
            onChange: (next) => setThemeMode(next ? 'jazz' : 'default'),
          });
        }

        /** The plugin's own Settings page: appearance + global theme. */
        function SlackSettingsSection() {
          return h(
            'div',
            { className: 'dt-settings-section' },
            h(
              'div',
              { className: 'dt-settings-head' },
              h('h3', { className: 'dt-settings-section-title' }, t('settings.section.title')),
              h('p', { className: 'dt-settings-lead' }, t('settings.section.description')),
            ),
            h(SlackAppearanceSetting, null),
            h(SlackThemeSetting, null),
          );
        }

        function MessageRow(props) {
          const item = props.item;
          const active = props.active;
          const labels = props.labels;
          if (item.kind === 'tools') {
            const label =
              item.count === 1
                ? t('panel.toolOne', { name: item.names[0] || 'tool' })
                : t('panel.tools', { count: item.count, names: item.names.join(', ') });
            return h(
              'div',
              { className: 'dt-row dt-row-tools' },
              h('div', { className: 'dt-tools' }, h(ToolGlyph, null), h('span', null, label)),
            );
          }
          if (item.kind === 'error') {
            return h(
              'div',
              { className: 'dt-row dt-row-error' },
              h('div', { className: 'dt-error' }, item.text || t('panel.turnFailed')),
            );
          }
          const assistant = item.kind === 'assistant';
          return h(
            'div',
            { className: 'dt-row', 'data-role': assistant ? 'assistant' : 'user' },
            h(
              'div',
              { className: 'dt-avatar', 'aria-hidden': true },
              assistant ? 'D' : h(UserGlyph, null),
            ),
            h(
              'div',
              { className: 'dt-body' },
              h(
                'div',
                { className: 'dt-meta' },
                h('span', { className: 'dt-author' }, assistant ? 'DSH' : t('panel.you')),
                h('span', { className: 'dt-time' }, clockText(item.time, active)),
              ),
              item.text
                ? assistant && MarkdownText
                  ? h('div', { className: 'dt-text dt-text-md' }, h(MarkdownText, { text: item.text, labels }))
                  : h('div', { className: 'dt-text' }, item.text)
                : null,
              item.images && item.images.length > 0
                ? h(MessageImages, { sessionId: props.sessionId, attachments: item.images })
                : null,
            ),
          );
        }

        function ThreadPanel(props) {
          const useTabInfo = props.useTabInfo;
          const sessionId = props.sessionId;
          const info = typeof useTabInfo === 'function' ? useTabInfo() : null;
          const params =
            info && info.tab && info.tab.navigation && info.tab.navigation.params
              ? info.tab.navigation.params
              : {};
          const parentId = typeof params.parentId === 'string' ? params.parentId : sessionId;
          const anchorSeq = typeof params.seq === 'number' ? params.seq : Number(params.seq);
          const validAnchor = Number.isFinite(anchorSeq);
          const entry = useThreadEntry(parentId, validAnchor ? anchorSeq : -1);
          const childId = entry && typeof entry.childId === 'string' ? entry.childId : '';
          const selectArchived = React.useCallback(
            (snapshot) => {
              if (!childId) return false;
              const ids = snapshot && snapshot.archivedSessionIds;
              return Array.isArray(ids) && ids.indexOf(childId) !== -1;
            },
            [childId],
          );
          const archived =
            typeof props.useWorkspaces === 'function' ? props.useWorkspaces(selectArchived) : false;
          const selectPending = React.useCallback(
            (status) => {
              if (!childId) return undefined;
              return status.get(childId)?.pendingInteraction;
            },
            [childId],
          );
          let pending;
          try {
            pending =
              typeof props.useSessionStatus === 'function' ? props.useSessionStatus(selectPending) : undefined;
          } catch (error) {
            pending = undefined;
          }
          const approval =
            pending &&
            pending.kind === 'approval' &&
            pending.answerable !== false &&
            typeof pending.answer === 'function'
              ? pending
              : null;
          const retained = useRetainedBinding(ctx, childId);
          const binding = retained.binding;
          const windowState = useEventWindow(binding);
          const snapshot = useSessionSnapshot(binding);
          const localeSnapshot = useLocaleSnapshot(ctx);
          const active = localeSnapshot && localeSnapshot.active ? localeSnapshot.active : 'en';
          const markdownLabels = React.useMemo(
            () => ({
              code: {
                copyLabel: t('md.copy'),
                copiedLabel: t('md.copied'),
                toolbarLabels: {
                  codeLabel: t('md.code'),
                  wrapLabel: t('md.wrap'),
                  unwrapLabel: t('md.unwrap'),
                },
              },
              footnotes: t('md.footnotes'),
            }),
            [active],
          );
          const parentDraft =
            typeof props.useInput === 'function' ? props.useInput((state) => state.draft || '') : '';
          const canBringBack = Boolean(
            props.inputActions && typeof props.inputActions.setDraft === 'function',
          );
          const parentBinding = React.useMemo(() => {
            try {
              return ctx.sessions.binding(parentId);
            } catch (error) {
              return undefined;
            }
          }, [parentId]);

          const quote = React.useMemo(() => {
            if (entry && entry.quote) return entry.quote;
            return validAnchor ? quoteFromBinding(parentBinding, anchorSeq) : null;
          }, [entry, parentBinding, validAnchor, anchorSeq]);
          const items = React.useMemo(
            () => parseReplies(windowState ? windowState.entries : [], validAnchor ? anchorSeq : -1),
            [windowState, validAnchor, anchorSeq],
          );
          const lastAssistant = React.useMemo(() => {
            for (let index = items.length - 1; index >= 0; index -= 1) {
              if (items[index].kind === 'assistant') return items[index].text;
            }
            return '';
          }, [items]);

          const draftKey = validAnchor ? draftKeyOf(parentId, anchorSeq) : '';
          const [draft, setDraft] = React.useState(() => (draftKey ? loadDraft(draftKey) : ''));
          const [images, setImages] = React.useState([]);
          const [broughtBack, setBroughtBack] = React.useState(false);
          const [alsoSend, setAlsoSend] = React.useState(false);
          const [sending, setSending] = React.useState(false);
          const [answering, setAnswering] = React.useState(false);
          const [failure, setFailure] = React.useState('');
          const listRef = React.useRef(null);
          const stickRef = React.useRef(true);
          const inputRef = React.useRef(null);
          const fileRef = React.useRef(null);

          React.useEffect(() => {
            const next = draftKey ? loadDraft(draftKey) : '';
            setDraft(next);
            requestAnimationFrame(() => {
              const element = inputRef.current;
              if (!element) return;
              element.style.height = 'auto';
              if (next) element.style.height = Math.min(element.scrollHeight, 120) + 'px';
            });
          }, [draftKey]);

          const updateDraft = (value) => {
            setDraft(value);
            if (draftKey) saveDraft(draftKey, value);
          };

          const running = Boolean(snapshot && snapshot.running);
          const promptError = snapshot && snapshot.promptError ? errorText(snapshot.promptError.error) : '';
          const problem = failure || retained.error || promptError;

          React.useEffect(() => {
            if (!entry || !childId) return;
            const count = items.reduce((total, item) => total + (item.kind === 'user' ? 1 : 0), 0);
            const lastTime = items.length > 0 ? items[items.length - 1].time : 0;
            const patch = {};
            if (count > 0 && count !== entry.replies) patch.replies = count;
            if (lastTime > (entry.updatedAt || 0)) {
              patch.updatedAt = lastTime;
              patch.seenAt = Date.now();
            }
            if (Object.keys(patch).length > 0) patchThread(parentId, anchorSeq, patch);
          }, [items, entry, childId, parentId, anchorSeq]);

          React.useEffect(() => {
            if (!childId) return;
            const current = threadAt(parentId, anchorSeq);
            if (current) patchThread(parentId, anchorSeq, { seenAt: Date.now() });
          }, [childId, parentId, anchorSeq]);

          React.useEffect(() => {
            const element = listRef.current;
            if (element && stickRef.current) element.scrollTop = element.scrollHeight;
          }, [items, running, childId]);

          const handleScroll = () => {
            const element = listRef.current;
            if (!element) return;
            stickRef.current = element.scrollHeight - element.scrollTop - element.clientHeight < 64;
          };

          const send = async () => {
            const text = draft.trim();
            if ((!text && images.length === 0) || sending || !validAnchor || archived) return;
            setSending(true);
            setFailure('');
            try {
              if (!childId) {
                const quoteSnapshot = quoteFromBinding(parentBinding, anchorSeq);
                const created = await ctx.sessions.fork({
                  sessionId: parentId,
                  atSeq: anchorSeq,
                  increaseTitle: true,
                });
                setThread(parentId, anchorSeq, {
                  childId: created,
                  replies: 1,
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                  ...(quoteSnapshot
                    ? {
                        quote: {
                          user: truncateText(quoteSnapshot.user, 600),
                          assistant: truncateText(quoteSnapshot.assistant, 1500),
                        },
                      }
                    : {}),
                });
                const reference = ctx.sessions.retain(created, { source: RETAIN_SOURCE });
                try {
                  const createdBinding = await reference.ready;
                  await promptSession(createdBinding, text, images);
                } finally {
                  try {
                    reference.release();
                  } catch (error) {
                    /* already released */
                  }
                }
              } else if (binding) {
                await promptSession(binding, text, images);
                const current = threadAt(parentId, anchorSeq);
                if (current) {
                  patchThread(parentId, anchorSeq, {
                    replies: (current.replies || 0) + 1,
                    updatedAt: Date.now(),
                  });
                }
              } else {
                throw new Error(t('panel.loading'));
              }
              if (alsoSend && text && parentBinding) {
                try {
                  await parentBinding.session.prompt(
                    [{ type: 'text', text: t('panel.alsoSendPrefix') + text }],
                    'queue',
                  );
                } catch (error) {
                  setFailure(errorText(error));
                }
              }
              setDraft('');
              if (draftKey) saveDraft(draftKey, '');
              setImages([]);
              requestAnimationFrame(() => {
                if (inputRef.current) inputRef.current.focus();
              });
            } catch (error) {
              setFailure(errorText(error));
            } finally {
              setSending(false);
            }
          };

          const stop = () => {
            if (!binding) return;
            binding.session.cancel().catch(() => {});
          };

          const retry = async () => {
            if (!binding || sending) return;
            let lastText = '';
            for (let index = items.length - 1; index >= 0; index -= 1) {
              const item = items[index];
              if (item.kind === 'user' && item.text) {
                lastText = item.text;
                break;
              }
            }
            if (!lastText) return;
            setSending(true);
            setFailure('');
            try {
              await promptSession(binding, lastText, []);
            } catch (error) {
              setFailure(errorText(error));
            } finally {
              setSending(false);
            }
          };

          const openChild = () => {
            if (childId) ctx.uiWorkspace.openSession(childId);
          };

          const restoreArchived = async () => {
            if (!childId) return;
            setFailure('');
            try {
              await ctx.workspaces.unarchiveSession(childId);
            } catch (error) {
              setFailure(errorText(error));
            }
          };

          const answerApproval = async (outcome) => {
            if (!approval || answering) return;
            setAnswering(true);
            setFailure('');
            try {
              await approval.answer(outcome);
            } catch (error) {
              setFailure(errorText(error));
            } finally {
              setAnswering(false);
            }
          };

          const bringBack = () => {
            if (!lastAssistant || !canBringBack) return;
            const block = t('panel.bringBackBlock', { text: lastAssistant });
            const existing = typeof parentDraft === 'string' ? parentDraft.trim() : '';
            try {
              props.inputActions.setDraft(existing ? existing + '\n\n' + block : block);
              if (typeof props.inputActions.persistDraft === 'function') props.inputActions.persistDraft();
              setBroughtBack(true);
              window.setTimeout(() => setBroughtBack(false), 2000);
            } catch (error) {
              setFailure(errorText(error));
            }
          };

          const addImages = async (fileList) => {
            const files = Array.from(fileList || []).filter(
              (file) => file && typeof file.type === 'string' && file.type.indexOf('image/') === 0,
            );
            if (files.length === 0) return;
            const added = [];
            let skipped = false;
            for (const file of files) {
              if (file.size > MAX_SOURCE_IMAGE_BYTES) {
                skipped = true;
                continue;
              }
              try {
                added.push(await prepareImage(file));
              } catch (error) {
                skipped = true;
              }
            }
            if (skipped) setFailure(t('panel.imageTooLarge'));
            const room = Math.max(0, MAX_IMAGES - images.length);
            if (added.length > room) setFailure(t('panel.imageLimit', { count: MAX_IMAGES }));
            const accepted = added.slice(0, room);
            if (accepted.length > 0) {
              setImages((current) => current.concat(accepted).slice(0, MAX_IMAGES));
            }
          };

          const onPaste = (event) => {
            const files = event.clipboardData ? event.clipboardData.files : null;
            if (!files || files.length === 0) return;
            const hasImage = Array.from(files).some(
              (file) => file.type && file.type.indexOf('image/') === 0,
            );
            if (!hasImage) return;
            event.preventDefault();
            addImages(files).catch((error) => setFailure(errorText(error)));
          };

          const onDrop = (event) => {
            const files = event.dataTransfer ? event.dataTransfer.files : null;
            if (!files || files.length === 0) return;
            event.preventDefault();
            addImages(files).catch((error) => setFailure(errorText(error)));
          };

          const onPickFiles = (event) => {
            const files = event.target.files;
            if (files && files.length > 0) {
              addImages(files).catch((error) => setFailure(errorText(error)));
            }
            event.target.value = '';
          };

          const onKeyDown = (event) => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              send();
            }
          };

          const onInput = (event) => {
            const element = event.currentTarget;
            element.style.height = 'auto';
            element.style.height = Math.min(element.scrollHeight, 120) + 'px';
          };

          const rows = [];
          for (const item of items) {
            rows.push(
              h(MessageRow, {
                key: item.key,
                item,
                active,
                labels: markdownLabels,
                sessionId: childId,
              }),
            );
          }

          return h(
            'div',
            { className: 'dt-panel' },
            h(
              'div',
              { className: 'dt-quote' },
              h(
                'div',
                { className: 'dt-quote-top' },
                h('span', { className: 'dt-quote-label' }, t('panel.quoteLabel')),
                h(
                  'span',
                  { className: 'dt-quote-actions' },
                  h(
                    'span',
                    { className: 'dt-people', 'aria-hidden': true },
                    items.some((item) => item.kind === 'assistant')
                      ? h('span', { className: 'dt-people-avatar dt-people-d' }, 'D')
                      : null,
                    items.some((item) => item.kind === 'user')
                      ? h('span', { className: 'dt-people-avatar' }, t('skin.avatarYou'))
                      : null,
                  ),
                  entry && entry.updatedAt
                    ? h(
                        'span',
                        { className: 'dt-quote-time' },
                        t('panel.lastReply', { when: relativeLabel(entry.updatedAt, t) }),
                      )
                    : null,
                  childId && !archived && lastAssistant && canBringBack
                    ? h(
                        'button',
                        { type: 'button', className: 'dt-link', onClick: bringBack },
                        broughtBack ? t('panel.bringBackDone') : t('panel.bringBack'),
                      )
                    : null,
                  childId && !archived
                    ? h('button', { type: 'button', className: 'dt-link', onClick: openChild }, t('panel.openChild'))
                    : null,
                ),
              ),
              quote && quote.user
                ? h(
                    'p',
                    { className: 'dt-quote-user' },
                    h('span', { className: 'dt-quote-user-mark' }, t('panel.you')),
                    plainText(quote.user),
                  )
                : null,
              h(
                'p',
                { className: 'dt-quote-text' },
                quote && quote.assistant
                  ? plainText(quote.assistant)
                  : t('panel.anchor', { turn: anchorSeq }),
              ),
            ),
            h(
              'div',
              { className: 'dt-list', ref: listRef, onScroll: handleScroll },
              !childId ? h(PanelEmpty, { text: t('panel.empty') }) : null,
              childId && !binding && !retained.error
                ? h(PanelEmpty, { text: t('panel.loading') })
                : null,
              childId && binding && items.length === 0 && !running
                ? h(PanelEmpty, { text: t('panel.empty') })
                : null,
              rows,
              running
                ? h(
                    'div',
                    { className: 'dt-typing' },
                    h('span', null, t('panel.running')),
                    h('span', { className: 'dt-dots' }, h('span', null), h('span', null), h('span', null)),
                  )
                : null,
            ),
            problem
              ? h(
                  'div',
                  { className: 'dt-error dt-error-bottom' },
                  h('span', { className: 'dt-error-text' }, problem),
                  binding && !archived
                    ? h(
                        'button',
                        { type: 'button', className: 'dt-retry', onClick: retry },
                        t('panel.retry'),
                      )
                    : null,
                )
              : null,
            h(
              'div',
              { className: 'dt-composer' },
              approval
                ? h(
                    'div',
                    { className: 'dt-approval', role: 'alert' },
                    h(
                      'div',
                      { className: 'dt-approval-title' },
                      t('panel.approvalTitle', { tool: approval.toolName || 'tool' }),
                    ),
                    h(
                      'div',
                      { className: 'dt-approval-reason' },
                      approval.displayReason || approval.reason || t('panel.approvalGeneric'),
                    ),
                    h(
                      'div',
                      { className: 'dt-approval-actions' },
                      h(
                        'button',
                        {
                          type: 'button',
                          disabled: answering,
                          onClick: () => answerApproval('rejected'),
                        },
                        t('panel.approvalReject'),
                      ),
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'dt-approval-allow',
                          disabled: answering,
                          onClick: () => answerApproval('allowed-once'),
                        },
                        answering ? t('panel.approvalAnswering') : t('panel.approvalAllow'),
                      ),
                    ),
                  )
                : null,
              archived
                ? h(
                    'div',
                    { className: 'dt-archived' },
                    h('span', null, t('panel.archived')),
                    h(
                      'button',
                      { type: 'button', className: 'dt-link', onClick: restoreArchived },
                      t('panel.unarchive'),
                    ),
                  )
                : null,
              h(
                'div',
                { className: 'dt-composer-box' },
                images.length > 0
                  ? h(
                      'div',
                      { className: 'dt-attachments' },
                      images.map((image) =>
                        h(
                          'div',
                          { className: 'dt-attachment', key: image.id },
                          h('img', { src: image.preview, alt: image.name || 'image' }),
                          h(
                            'button',
                            {
                              type: 'button',
                              'aria-label': t('panel.removeImage'),
                              onClick: () =>
                                setImages((current) =>
                                  current.filter((item) => item.id !== image.id),
                                ),
                            },
                            '×',
                          ),
                        ),
                      ),
                    )
                  : null,
                h('textarea', {
                  ref: inputRef,
                  className: 'dt-input',
                  rows: 1,
                  value: draft,
                  placeholder: archived
                    ? t('panel.archivedPlaceholder')
                    : childId
                      ? t('panel.placeholder')
                      : t('panel.placeholderFirst'),
                  disabled: sending || archived,
                  onChange: (event) => updateDraft(event.target.value),
                  onKeyDown,
                  onInput,
                  onPaste,
                  onDrop,
                  onDragOver: (event) => event.preventDefault(),
                }),
                h(
                  'div',
                  { className: 'dt-composer-row' },
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'dt-plus',
                      title: t('panel.addImage'),
                      'aria-label': t('panel.addImage'),
                      disabled: archived,
                      onClick: () => {
                        if (fileRef.current) fileRef.current.click();
                      },
                    },
                    '+',
                  ),
                  h('input', {
                    ref: fileRef,
                    type: 'file',
                    accept: 'image/*',
                    multiple: true,
                    className: 'dt-file-input',
                    onChange: onPickFiles,
                  }),
                  h(
                    'label',
                    { className: 'dt-also' },
                    h('input', {
                      type: 'checkbox',
                      checked: alsoSend,
                      disabled: archived,
                      onChange: (event) => setAlsoSend(event.target.checked),
                    }),
                    h('span', null, t('panel.alsoSend')),
                  ),
                  h(
                    'span',
                    { className: 'dt-composer-hint' },
                    running ? t('panel.stopHint') : t('panel.hint'),
                  ),
                  running
                    ? h('button', { type: 'button', className: 'dt-stop', onClick: stop }, t('panel.stop'))
                    : null,
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'dt-send-round',
                      title: t('panel.send'),
                      'aria-label': t('panel.send'),
                      disabled:
                        (!draft.trim() && images.length === 0) ||
                        sending ||
                        archived ||
                        (Boolean(childId) && !binding),
                      onClick: send,
                    },
                    h(SendGlyph, null),
                  ),
                ),
              ),
            ),
          );
        }

        ctx.effect(
          () =>
            ctx.sidebarRightTabs.register({
              id: PLUGIN_ID,
              kind: TAB_KIND,
              title: () => t('panel.title'),
            }),
          'threads: tab type',
        );

        ctx.effect(
          () =>
            ctx.sidebarRightTabs.register({
              id: PLUGIN_ID + '/list',
              kind: 'threads',
              title: () => t('list.title'),
              guide: [
                {
                  id: 'dsh-threads-guide',
                  order: 30,
                  title: () => t('list.title'),
                  description: () => t('list.guide'),
                  icon: ThreadGlyph,
                },
              ],
            }),
          'threads: list tab type',
        );

        ctx.slots.inject('conversation.chat.assistant-actions', () =>
          ctx.slots.register(
            {
              name: 'conversation.chat.assistant-actions',
              id: PLUGIN_ID,
              order: 30,
            },
            ThreadIconAction,
          ),
        );

        ctx.slots.inject('conversation.chat.turnTail', () =>
          ctx.slots.register(
            {
              name: 'conversation.chat.turnTail',
              id: PLUGIN_ID,
              order: 40,
            },
            ThreadRepliesLine,
          ),
        );

        ctx.slots.inject('sidebar.right.pane.tab', () =>
          ctx.slots.register(
            {
              name: 'sidebar.right.pane.tab',
              key: PLUGIN_ID,
            },
            ThreadPanel,
          ),
        );

        ctx.slots.inject('sidebar.right.pane.tab', () =>
          ctx.slots.register(
            {
              name: 'sidebar.right.pane.tab',
              key: PLUGIN_ID + '/list',
            },
            ThreadsList,
          ),
        );

        ctx.slots.inject('sidebar.right.pane.tab.title', () =>
          ctx.slots.register(
            {
              name: 'sidebar.right.pane.tab.title',
              key: PLUGIN_ID,
            },
            ThreadTitle,
          ),
        );

        ctx.slots.inject('conversation.session.header.actions', () =>
          ctx.slots.register(
            {
              name: 'conversation.session.header.actions',
              id: PLUGIN_ID + '/header',
              order: 20,
              inject: (sessionId) => ({ sessionId }),
            },
            ThreadsHeaderAction,
          ),
        );

        ctx.slots.inject('sidebar.session.row.leading', () =>
          ctx.slots.register(
            {
              name: 'sidebar.session.row.leading',
              id: PLUGIN_ID + '/row',
              order: 20,
            },
            ThreadRowMark,
          ),
        );

        ctx.slots.inject('conversation.session.header.actions', () =>
          ctx.slots.register(
            {
              name: 'conversation.session.header.actions',
              id: PLUGIN_ID + '/skin',
              order: 30,
            },
            SkinToggle,
          ),
        );

        /* Settings: a dedicated section, so both preferences stay out of General. */
        ctx.slots.inject('settings.section', () =>
          ctx.slots.register(
            {
              name: 'settings.section',
              id: PLUGIN_ID + '/settings',
              order: 25,
              label: 'Slack',
            },
            SlackSettingsSection,
          ),
        );

        /* Global theme: stack the jazz token layer while the preference is on. */
        ctx.effect(() => {
          let disposer = null;
          const sync = () => {
            if (disposer !== null) {
              try {
                disposer();
              } catch (error) {
                /* already removed */
              }
              disposer = null;
            }
            if (themeMode !== 'jazz') return;
            const theme = ctx.get('theme');
            if (theme === undefined || typeof theme.overrideTokens !== 'function') return;
            try {
              disposer = theme.overrideTokens('dsh-threads/jazz', JAZZ_TOKENS);
            } catch (error) {
              ctx.logger?.warn?.(`[dsh-threads] cannot stack the jazz theme: ${String(error)}`);
            }
          };
          sync();
          const unsubscribe = subscribeThemeMode(sync);
          return () => {
            unsubscribe();
            if (disposer !== null) {
              try {
                disposer();
              } catch (error) {
                /* already removed */
              }
              disposer = null;
            }
          };
        }, 'threads: jazz theme');

        /* Slack skin: replace only the two message rows, and only while the
         * preference says so. Every other Chat node keeps the shipped
         * renderer, and the toggle disposes these registrations. */
        ctx.effect(() => {
          let disposers = [];
          const sync = () => {
            for (const dispose of disposers) {
              try {
                dispose();
              } catch (error) {
                /* already disposed */
              }
            }
            disposers = [];
            document.documentElement.dataset.dshThreadsSkin = skin === 'slack' ? 'slack' : '';
            if (skin !== 'slack') return;
            try {
              disposers.push(
                ctx.slots.inject('conversation.chat.node', () =>
                  ctx.slots.register(
                    { name: 'conversation.chat.node', key: 'user', priority: -1 },
                    SlackUserNode,
                  ),
                ),
              );
              disposers.push(
                ctx.slots.inject('conversation.chat.node', () =>
                  ctx.slots.register(
                    { name: 'conversation.chat.node', key: 'assistant-step', priority: -1 },
                    SlackAssistantNode,
                  ),
                ),
              );
              disposers.push(
                ctx.slots.inject('conversation.chat.node', () =>
                  ctx.slots.register(
                    { name: 'conversation.chat.node', key: 'steering', priority: -1 },
                    SlackSteeringNode,
                  ),
                ),
              );
            } catch (error) {
              ctx.logger?.warn?.(`[dsh-threads] cannot install the Slack skin: ${String(error)}`);
            }
          };
          sync();
          const unsubscribe = subscribeSkin(sync);
          return () => {
            unsubscribe();
            delete document.documentElement.dataset.dshThreadsSkin;
            for (const dispose of disposers) {
              try {
                dispose();
              } catch (error) {
                /* already disposed */
              }
            }
          };
        }, 'threads: slack skin');
      },
    };
  },
});

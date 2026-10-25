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
    /** Keep in sync with package.json; the account Remote carries it as the client build. */
    const PLUGIN_VERSION = '0.14.0';
    /** Official DSH whale mark (50x50 favicon path), used only for the assistant avatar. */
    const WHALE_PATH = "M48.8354 10.0479C48.3232 9.79199 48.1025 10.2798 47.8032 10.5278C47.7007 10.6079 47.6143 10.7119 47.5273 10.8076C46.7793 11.624 45.9048 12.1597 44.7622 12.0957C43.0923 12 41.666 12.5356 40.4058 13.8398C40.1377 12.2319 39.2476 11.272 37.8926 10.6558C37.1836 10.3359 36.4668 10.0156 35.9702 9.31982C35.6235 8.82373 35.5293 8.27197 35.356 7.72754C35.2456 7.3999 35.1353 7.06396 34.7651 7.00781C34.3633 6.94385 34.2056 7.2876 34.0479 7.57568C33.418 8.75195 33.1733 10.0479 33.1973 11.3599C33.2524 14.312 34.4736 16.6641 36.8999 18.3359C37.1758 18.5278 37.2466 18.7197 37.1597 19C36.9946 19.5757 36.7974 20.1357 36.624 20.7119C36.5137 21.0801 36.3486 21.1597 35.9624 21C34.6309 20.4321 33.481 19.5918 32.4644 18.5757C30.7393 16.8721 29.1792 14.9917 27.2334 13.52C26.7764 13.1758 26.3193 12.856 25.8467 12.5518C23.8618 10.584 26.1069 8.96777 26.627 8.77588C27.1704 8.57568 26.8159 7.8877 25.0591 7.896C23.3022 7.90381 21.6953 8.50391 19.647 9.30371C19.3477 9.42383 19.0322 9.51172 18.7095 9.58398C16.8501 9.22363 14.9199 9.14355 12.9033 9.37598C9.10596 9.80762 6.07275 11.6396 3.84326 14.7681C1.16455 18.5278 0.53418 22.7998 1.30664 27.2559C2.11768 31.9521 4.46582 35.8398 8.07373 38.8799C11.8159 42.0322 16.1255 43.5762 21.041 43.2803C24.0269 43.104 27.3516 42.6963 31.1016 39.4561C32.0469 39.936 33.0396 40.1279 34.686 40.272C35.9546 40.3921 37.1758 40.208 38.1211 40.0078C39.6021 39.688 39.4995 38.2881 38.9639 38.0322C34.623 35.9678 35.5762 36.8081 34.71 36.1279C36.9155 33.4639 40.2402 30.6958 41.54 21.728C41.6426 21.0161 41.5557 20.5679 41.54 19.9917C41.5322 19.6396 41.6108 19.5039 42.0049 19.4639C43.0923 19.3359 44.1479 19.0317 45.1167 18.4878C47.9292 16.9199 49.064 14.3438 49.3315 11.2559C49.3711 10.7837 49.3237 10.2959 48.8354 10.0479ZM24.3262 37.8398C20.1196 34.4639 18.0791 33.3521 17.2358 33.3999C16.4482 33.4482 16.5898 34.3682 16.7632 34.9678C16.9443 35.5601 17.1812 35.9683 17.5117 36.4878C17.7402 36.832 17.8979 37.3442 17.2832 37.728C15.9282 38.584 13.5728 37.4399 13.4624 37.3838C10.7207 35.7358 8.42822 33.5601 6.81348 30.584C5.25342 27.7197 4.34766 24.6479 4.19775 21.3677C4.1582 20.5757 4.38672 20.2959 5.15869 20.1519C6.17529 19.96 7.22314 19.9199 8.23926 20.0718C12.5327 20.7119 16.1885 22.6719 19.2529 25.7759C21.002 27.5439 22.3252 29.6558 23.6885 31.7202C25.1377 33.9121 26.6978 36 28.6831 37.7119C29.3843 38.312 29.9434 38.7681 30.479 39.104C28.8643 39.2881 26.1699 39.3281 24.3262 37.8398ZM26.3433 24.6001C26.3433 24.248 26.6191 23.9678 26.9658 23.9678C27.0444 23.9678 27.1152 23.9839 27.1782 24.0078C27.2651 24.04 27.3438 24.0879 27.4067 24.1602C27.5171 24.272 27.5801 24.4321 27.5801 24.6001C27.5801 24.9521 27.3042 25.2319 26.9575 25.2319C26.6108 25.2319 26.3433 24.9521 26.3433 24.6001ZM32.6064 27.8799C32.2046 28.0479 31.8027 28.1919 31.4165 28.208C30.8179 28.2397 30.1641 27.9922 29.8096 27.688C29.2583 27.2158 28.8643 26.9521 28.6987 26.1279C28.6279 25.7759 28.6675 25.2319 28.7305 24.9199C28.8721 24.248 28.7144 23.8159 28.2495 23.4238C27.8716 23.104 27.3911 23.0161 26.8633 23.0161C26.666 23.0161 26.4849 22.9277 26.3511 22.856C26.1304 22.7441 25.9492 22.4639 26.1226 22.1201C26.1777 22.0078 26.4458 21.7358 26.5088 21.688C27.2256 21.272 28.0527 21.4077 28.8169 21.7197C29.5259 22.0161 30.0615 22.5601 30.834 23.3281C31.6216 24.2559 31.7632 24.5117 32.2124 25.208C32.5669 25.752 32.8901 26.312 33.1104 26.9521C33.2446 27.3521 33.0713 27.6802 32.6064 27.8799Z";
    const NS = 'threads';
    const TAB_KIND = 'thread';
    const STORAGE_KEY = 'dsh.threads.v1';
    const RETAIN_SOURCE = 'threadPanel';

    /* Every message sent into a thread carries this preamble so the forked
     * agent knows it is answering inside a side thread. The panel strips it
     * again, so the transcript stays clean for the user. */
    const THREAD_NOTE =
      '<dsh-thread>侧边线程：在当前线程内完成这条追问并直接回复用户。主会话中的结果展示由界面处理；不要向主会话再次发送请求，不要在回复中提到这条说明。</dsh-thread>';
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
      'panel.shareToMain': '在主会话展示线程结果',
      'panel.sharedImageQuestion': '图片追问（{count} 张）',
      'panel.lastReply': '最后回复 {when}',
      'panel.zoom': '点击放大',
      'panel.retry': '重试',
      'panel.storeUnsaved': '尚未保存到主机，正在保留本地更改',
      'panel.retrySave': '重试保存',
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
      'skin.reasoning': '思考过程',
      'skin.attachments': '{count} 个附件',
      'skin.today': '今天',
      'skin.yesterday': '昨天',
      'skin.avatarYou': '你',
      'skin.goalAuthor': '目标',
      'skin.goalRunning': '执行中…',
      'shared.title': '线程结果',
      'shared.queued': '排队中',
      'shared.running': '回复中',
      'shared.complete': '已完成',
      'shared.error': '失败',
      'shared.stopped': '已停止',
      'shared.open': '打开线程',
      'shared.tools': '工具：{names}',
      'shared.hint': '结果展示于此；继续讨论可在线程中带回输入框。',
      'shared.superseded': '此后收到新的输入，请打开线程查看后续回复。',
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
      'panel.shareToMain': 'Show thread result in the main conversation',
      'panel.sharedImageQuestion': 'Image question ({count} images)',
      'panel.lastReply': 'Last reply {when}',
      'panel.zoom': 'Click to zoom',
      'panel.retry': 'Retry',
      'panel.storeUnsaved': 'Not saved to the host; keeping local changes.',
      'panel.retrySave': 'Retry saving',
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
      'skin.reasoning': 'Reasoning',
      'skin.attachments': '{count} attachments',
      'skin.today': 'Today',
      'skin.yesterday': 'Yesterday',
      'skin.avatarYou': 'Y',
      'skin.goalAuthor': 'Goal',
      'skin.goalRunning': 'Running…',
      'shared.title': 'Thread result',
      'shared.queued': 'Queued',
      'shared.running': 'Replying',
      'shared.complete': 'Completed',
      'shared.error': 'Failed',
      'shared.stopped': 'Stopped',
      'shared.open': 'Open thread',
      'shared.tools': 'Tools: {names}',
      'shared.hint': 'Results appear here. Bring a result back to the composer from its thread to continue discussing it.',
      'shared.superseded': 'New input followed this message. Open the thread to view the subsequent reply.',
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
        if (!raw) return Object.create(null);
        const parsed = JSON.parse(raw);
        return copyRecord(recordObject(parsed));
      } catch (error) {
        return Object.create(null);
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
      pendingChanges.skin = skin;
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
     * Signed-in DeepSeek account picture. The account Remote is optional:
     * without it the avatars keep the local glyph. The URL stays in memory
     * only, so signing out cannot leave a stale face on the next render.
     * ------------------------------------------------------------------ */

    const EMPTY_ACCOUNT_AVATAR = { url: '', name: '', status: 'idle' };
    let accountAvatar = EMPTY_ACCOUNT_AVATAR;
    let accountAvatarGeneration = 0;
    const accountAvatarListeners = new Set();

    function subscribeAccountAvatar(listener) {
      accountAvatarListeners.add(listener);
      return function unsubscribe() {
        accountAvatarListeners.delete(listener);
      };
    }

    function publishAccountAvatar(next) {
      if (
        accountAvatar.url === next.url &&
        accountAvatar.name === next.name &&
        accountAvatar.status === next.status
      ) {
        return;
      }
      accountAvatar = next;
      for (const listener of Array.from(accountAvatarListeners)) {
        try {
          listener();
        } catch (error) {
          /* one listener's failure must not break the others */
        }
      }
    }

    function useAccountAvatar() {
      return React.useSyncExternalStore(subscribeAccountAvatar, function snapshot() {
        return accountAvatar;
      });
    }

    /** A rendered <img> failed after the preload succeeded (cache eviction). */
    function failAccountAvatar(url) {
      if (!url || accountAvatar.url !== url || accountAvatar.status !== 'ready') return;
      publishAccountAvatar({ url: url, name: accountAvatar.name, status: 'failed' });
    }

    /** Preload one URL so a row never shows a half-loaded circle. */
    function loadAccountAvatar(url) {
      return new Promise(function settle(resolve) {
        try {
          const image = new Image();
          image.referrerPolicy = 'no-referrer';
          image.onload = function onload() {
            resolve(true);
          };
          image.onerror = function onerror() {
            resolve(false);
          };
          image.src = url;
        } catch (error) {
          resolve(false);
        }
      });
    }

    /** Query the Platform profile; the account Remote returns display-safe fields. */
    async function readAccountAvatar(ctx, account) {
      const generation = ++accountAvatarGeneration;
      let result;
      try {
        const locale = ctx.locale.getSnapshot();
        result = await account.getProfile({
          version: PLUGIN_VERSION,
          locale: locale && locale.active ? locale.active : 'en',
          timezoneOffsetSeconds: -new Date().getTimezoneOffset() * 60,
        });
      } catch (error) {
        return;
      }
      if (generation !== accountAvatarGeneration) return;
      if (!result || !result.ok || !result.value || result.value.status !== 'ready') return;
      const profile = result.value.value || {};
      const url = typeof profile.avatarUrl === 'string' ? profile.avatarUrl : '';
      const name = typeof profile.name === 'string' ? profile.name : '';
      if (!url) {
        publishAccountAvatar({ url: '', name: name, status: 'ready' });
        return;
      }
      if (accountAvatar.url === url && accountAvatar.status === 'ready') {
        publishAccountAvatar({ url: url, name: name, status: 'ready' });
        return;
      }
      const loaded = await loadAccountAvatar(url);
      if (generation !== accountAvatarGeneration) return;
      publishAccountAvatar({ url: url, name: name, status: loaded ? 'ready' : 'failed' });
    }

    /** Follow account state so a sign-in, sign-out or new picture refreshes. */
    function watchAccountAvatar(ctx) {
      const readService = function readService(name) {
        return typeof ctx.get === 'function' ? ctx.get(name) : undefined;
      };
      const remote = readService('remote') || ctx.remote;
      const account = readService('remote.account') || (remote && remote.account);
      if (!remote || !account) return;
      if (
        typeof remote.$stream !== 'function' ||
        typeof account.watch !== 'function' ||
        typeof account.getProfile !== 'function'
      ) {
        return;
      }
      let stream;
      try {
        stream = remote.$stream({
          name: 'dsh-threads-account',
          open: function open(signal) {
            return account.watch(signal);
          },
          ended: function ended() {
            return new Error('dsh-threads account stream ended');
          },
        });
      } catch (error) {
        return;
      }
      ctx.effect(
        function accountStreamLifetime() {
          return function disposeAccountStream() {
            try {
              void stream.dispose();
            } catch (error) {
              /* already closed */
            }
          };
        },
        'threads: account avatar stream',
      );
      (async function followAccount() {
        try {
          for await (const frame of stream) {
            const view = frame && frame.value;
            if (view && view.status === 'credential-stored') {
              void readAccountAvatar(ctx, account);
            } else {
              accountAvatarGeneration += 1;
              publishAccountAvatar({ url: '', name: '', status: 'idle' });
            }
            if (frame && typeof frame.accept === 'function') frame.accept();
          }
        } catch (error) {
          /* the optional account Remote leaves the local glyph in place */
        }
      })();
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
      pendingChanges.theme = themeMode;
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
    let pendingChanges = emptyChanges();
    let savingChanges = null;
    let loadingStore = null;
    let persistRetries = 0;
    let persistError = '';
    const persistErrorListeners = new Set();

    function emptyChanges() {
      return { threads: Object.create(null), drafts: Object.create(null) };
    }

    function copyRecord(value) {
      return Object.assign(Object.create(null), value);
    }

    function setPersistError(value) {
      if (persistError === value) return;
      persistError = value;
      notifyListeners(persistErrorListeners);
    }

    function subscribePersistError(listener) {
      persistErrorListeners.add(listener);
      return () => persistErrorListeners.delete(listener);
    }

    function usePersistError() {
      return React.useSyncExternalStore(subscribePersistError, () => persistError);
    }

    function retryPersist() {
      persistRetries = 0;
      if (persistTimer !== null) window.clearTimeout(persistTimer);
      persistTimer = null;
      return persistEnabled ? persistNow() : loadPersisted();
    }

    function recordObject(value) {
      return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {};
    }

    function notifyListeners(listeners) {
      for (const listener of Array.from(listeners)) {
        try {
          listener();
        } catch (error) {
          /* one listener must not prevent other views from updating */
        }
      }
    }

    function cacheLocal(key, value) {
      try {
        window.localStorage.setItem(key, value);
      } catch (error) {
        /* Host persistence remains available if browser storage is full */
      }
    }

    function changedKeys(before, after) {
      const changes = Object.create(null);
      for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
        if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
          changes[key] = after[key] === undefined ? null : after[key];
        }
      }
      return changes;
    }

    function changedThreads(before, after) {
      const changes = Object.create(null);
      for (const parentId of new Set([...Object.keys(before), ...Object.keys(after)])) {
        if (parentId === 'v') continue;
        const bucket = changedKeys(recordObject(before[parentId]), recordObject(after[parentId]));
        if (Object.keys(bucket).length > 0) changes[parentId] = bucket;
      }
      return changes;
    }

    function mergeChanges(older, newer) {
      const threads = copyRecord(older.threads);
      for (const parentId of Object.keys(newer.threads || {})) {
        threads[parentId] = Object.assign(Object.create(null), threads[parentId], newer.threads[parentId]);
      }
      return { ...older, ...newer, threads, drafts: Object.assign(Object.create(null), older.drafts, newer.drafts) };
    }

    function applyKeyChanges(value, changes) {
      const next = copyRecord(value);
      for (const key of Object.keys(changes || {})) {
        if (changes[key] === null) delete next[key];
        else next[key] = changes[key];
      }
      return next;
    }

    function applyThreadChanges(value, changes) {
      const next = copyRecord(value);
      for (const parentId of Object.keys(changes || {})) {
        const bucket = applyKeyChanges(recordObject(next[parentId]), changes[parentId]);
        if (Object.keys(bucket).length > 0) next[parentId] = bucket;
        else delete next[parentId];
      }
      return next;
    }

    function hasPendingChanges() {
      return Object.keys(pendingChanges.threads).length > 0 ||
        Object.keys(pendingChanges.drafts).length > 0 ||
        pendingChanges.skin !== undefined || pendingChanges.theme !== undefined;
    }

    function setPersistTimer(delay, callback) {
      if (persistTimer !== null) window.clearTimeout(persistTimer);
      persistTimer = window.setTimeout(() => {
        persistTimer = null;
        return callback();
      }, delay);
    }

    function reportPersistFailure(error) {
      setPersistError(errorText(error));
      console.warn('[dsh-threads] state remains unsaved after a failed store request:', errorText(error));
      if (persistRetries < 3) {
        const delay = 1000 * 2 ** persistRetries;
        persistRetries += 1;
        setPersistTimer(delay, () => persistEnabled ? persistNow() : loadPersisted());
      }
    }

    async function persistNow() {
      if (!persistEnabled || savingChanges || !hasPendingChanges()) return;
      if (persistTimer !== null) window.clearTimeout(persistTimer);
      persistTimer = null;
      const changes = pendingChanges;
      pendingChanges = emptyChanges();
      savingChanges = changes;
      let saved = false;
      try {
        const patch = { version: 1 };
        if (Object.keys(changes.threads).length > 0) patch.threads = changes.threads;
        if (Object.keys(changes.drafts).length > 0) patch.drafts = changes.drafts;
        if (changes.skin !== undefined) patch.skin = changes.skin;
        if (changes.theme !== undefined) patch.theme = changes.theme;
        const response = await fetch(STORE_ROUTE, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(patch),
        });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        persistRetries = 0;
        setPersistError('');
        saved = true;
      } catch (error) {
        // Changes made during this request win over the older failed patch.
        pendingChanges = mergeChanges(changes, pendingChanges);
        reportPersistFailure(error);
      } finally {
        savingChanges = null;
        if (saved && hasPendingChanges()) setPersistTimer(250, persistNow);
      }
    }

    function schedulePersist() {
      persistRetries = 0;
      if (!persistEnabled && loadingStore) return;
      setPersistTimer(250, () => persistEnabled ? persistNow() : loadPersisted());
    }

    async function loadPersisted() {
      if (persistEnabled) return;
      if (loadingStore) return loadingStore;
      const initialThreads = readStore();
      const initialDrafts = readDrafts();
      loadingStore = (async () => {
        try {
          const response = await fetch(STORE_ROUTE, { headers: { accept: 'application/json' } });
          if (!response.ok) throw new Error('HTTP ' + response.status);
          const data = await response.json();
          if (data === null || typeof data !== 'object' || Array.isArray(data) || data.version !== 1) {
            throw new Error('Invalid store response');
          }
          const hostThreads = recordObject(data.threads);
          const hostDrafts = recordObject(data.drafts);
          const migrating = Object.keys(hostThreads).every((key) => key === 'v') &&
            Object.keys(hostDrafts).length === 0 &&
            (!data.skin || data.skin === 'native') && (!data.theme || data.theme === 'default');
          if (migrating) {
            pendingChanges = mergeChanges({
              threads: changedThreads({}, store), drafts: { ...drafts }, skin, theme: themeMode,
            }, pendingChanges);
          }
          // Pending keys include tombstones, so a late GET cannot revive a deleted draft.
          const cacheThreads = changedThreads(initialThreads, readStore());
          const cacheDrafts = changedKeys(initialDrafts, readDrafts());
          store = applyThreadChanges(applyThreadChanges(hostThreads, cacheThreads), pendingChanges.threads);
          drafts = applyKeyChanges(applyKeyChanges(hostDrafts, cacheDrafts), pendingChanges.drafts);
          if (!skinTouched && !migrating && (data.skin === 'slack' || data.skin === 'native')) skin = data.skin;
          if (!themeTouched && !migrating && (data.theme === 'jazz' || data.theme === 'default')) themeMode = data.theme;
          storeVersion += 1;
          cacheLocal(STORAGE_KEY, JSON.stringify(store));
          cacheLocal(DRAFTS_KEY, JSON.stringify(drafts));
          cacheLocal(SKIN_KEY, skin);
          cacheLocal(THEME_KEY, themeMode);
          persistEnabled = true;
          persistRetries = 0;
          setPersistError('');
          notifyListeners(storeListeners);
          notifyListeners(draftListeners);
          notifyListeners(skinListeners);
          notifyListeners(themeModeListeners);
          if (hasPendingChanges()) setPersistTimer(250, persistNow);
        } catch (error) {
          reportPersistFailure(error);
        }
      })();
      try {
        await loadingStore;
      } finally {
        loadingStore = null;
      }
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
      pendingChanges = mergeChanges(pendingChanges, { threads: changedThreads(store, next), drafts: {} });
      store = next;
      storeVersion += 1;
      try {
        const dirty = mergeChanges(savingChanges || emptyChanges(), pendingChanges);
        // Other windows can write before their storage event reaches this one.
        const cached = applyThreadChanges(readStore(), dirty.threads);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
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
      const bucket = copyRecord(recordObject(store[parentId]));
      bucket[String(seq)] = value;
      const next = copyRecord(store);
      next.v = 1;
      next[parentId] = bucket;
      writeStore(next);
    }

    function patchThread(parentId, seq, patch) {
      const current = threadAt(parentId, seq);
      if (!current) return;
      setThread(parentId, seq, { ...current, ...patch });
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
        if (!raw) return Object.create(null);
        const parsed = JSON.parse(raw);
        return copyRecord(recordObject(parsed));
      } catch (error) {
        return Object.create(null);
      }
    }

    let drafts = readDrafts();
    const draftListeners = new Set();

    function subscribeDrafts(listener) {
      draftListeners.add(listener);
      return () => draftListeners.delete(listener);
    }

    function useDraft(key) {
      return React.useSyncExternalStore(subscribeDrafts, () => key ? loadDraft(key) : '');
    }

    function draftKeyOf(parentId, seq) {
      return parentId + ':' + String(seq);
    }

    function loadDraft(key) {
      return typeof drafts[key] === 'string' ? drafts[key] : '';
    }

    function saveDraft(key, value) {
      if (loadDraft(key) === value) return;
      if (value) drafts[key] = value;
      else delete drafts[key];
      pendingChanges.drafts[key] = value || null;
      try {
        const dirty = mergeChanges(savingChanges || emptyChanges(), pendingChanges);
        window.localStorage.setItem(DRAFTS_KEY, JSON.stringify(applyKeyChanges(readDrafts(), dirty.drafts)));
      } catch (error) {
        /* keep the in-memory copy */
      }
      notifyListeners(draftListeners);
      schedulePersist();
    }

    function parseStorageValue(value) {
      try {
        return recordObject(JSON.parse(value || '{}'));
      } catch (error) {
        return {};
      }
    }

    function syncStorageEvent(event) {
      if (event.storageArea && event.storageArea !== window.localStorage) return;
      if (event.key === STORAGE_KEY) {
        const incoming = changedThreads(parseStorageValue(event.oldValue), parseStorageValue(event.newValue));
        const dirty = mergeChanges(savingChanges || emptyChanges(), pendingChanges);
        store = applyThreadChanges(applyThreadChanges(store, incoming), dirty.threads);
        storeVersion += 1;
        notifyListeners(storeListeners);
      } else if (event.key === DRAFTS_KEY) {
        const incoming = changedKeys(parseStorageValue(event.oldValue), parseStorageValue(event.newValue));
        const dirty = mergeChanges(savingChanges || emptyChanges(), pendingChanges);
        drafts = applyKeyChanges(applyKeyChanges(drafts, incoming), dirty.drafts);
        notifyListeners(draftListeners);
      } else if (event.key === SKIN_KEY) {
        if (pendingChanges.skin !== undefined || savingChanges?.skin !== undefined) return;
        skin = event.newValue === 'slack' ? 'slack' : 'native';
        notifyListeners(skinListeners);
      } else if (event.key === THEME_KEY) {
        if (pendingChanges.theme !== undefined || savingChanges?.theme !== undefined) return;
        themeMode = event.newValue === 'jazz' ? 'jazz' : 'default';
        notifyListeners(themeModeListeners);
      }
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
            requestId: typeof source?.rpcId === 'string' ? source.rpcId : undefined,
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

    // Retain failed text, image bytes and request identity while panels switch.
    const failedDeliveries = new Map();
    const activeDeliveries = new Set();

    function createThreadRequestId() {
      if (typeof window.crypto?.randomUUID === 'function') return window.crypto.randomUUID();
      const bytes = new Uint8Array(16);
      if (typeof window.crypto?.getRandomValues === 'function') window.crypto.getRandomValues(bytes);
      else for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
      bytes[6] = (bytes[6] & 15) | 64;
      bytes[8] = (bytes[8] & 63) | 128;
      const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
      return hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-' + hex.slice(12, 16) + '-' + hex.slice(16, 20) + '-' + hex.slice(20);
    }

    function queueSharedReply(parentId, anchorSeq, request, imageQuestion) {
      if (!request.shareToMain) return;
      const current = threadAt(parentId, anchorSeq);
      if (!current) return;
      const sharedReplies = copyRecord(recordObject(current.sharedReplies));
      if (Object.hasOwn(sharedReplies, request.requestId)) return;
      const now = Date.now();
      sharedReplies[request.requestId] = {
        id: request.requestId,
        question: String(request.text || imageQuestion || '').slice(0, 1000),
        createdAt: now,
        updatedAt: now,
        status: 'queued',
        answer: '',
        userSeq: null,
        assistantSeq: null,
      };
      patchThread(parentId, anchorSeq, { sharedReplies });
    }

    /** Count the child's own replies and use completion events for recency. */
    function threadActivity(entries, anchorSeq) {
      let replies = 0;
      let updatedAt = 0;
      for (const item of entries || []) {
        const event = item && item.type === 'event' ? item.event : null;
        if (!event || typeof event.seq !== 'number' || event.seq <= anchorSeq) continue;
        if (event.surfaceOp !== undefined && event.surfaceOp !== 'append') continue;
        if (event.type === 'user/message') {
          if (event.data?.source && event.data.source.kind !== 'user') continue;
          replies += 1;
        } else if (!['assistant/message', 'tool/call', 'turn/end'].includes(event.type)) {
          continue;
        }
        if (typeof event.time === 'number' && event.time > updatedAt) updatedAt = event.time;
      }
      return { replies, updatedAt };
    }

    /** Project explicitly shared requests onto passive cards in the parent UI. */
    function syncSharedReplies(parentId, anchorSeq, entries, running) {
      const entry = threadAt(parentId, anchorSeq);
      const registered = new Map(Object.entries(recordObject(entry?.sharedReplies))
        .filter(([, value]) => value && typeof value === 'object' && !Array.isArray(value)));
      if (registered.size === 0) return;
      const changes = new Map();
      let active = null;
      let inTurn = false;
      const hasAnswer = () => Boolean(active && (active.text.length || active.liveText));
      const touch = (event) => {
        if (active && typeof event?.time === 'number') active.updatedAt = Math.max(active.updatedAt, event.time);
      };
      const finish = (status, event, outcome = '') => {
        if (!active) return;
        touch(event);
        const previous = registered.get(active.id);
        const text = active.text.concat(active.liveText ? [active.liveText] : []).join('\n\n').slice(0, 12000);
        const next = {
          ...previous, status, answer: text, userSeq: active.userSeq,
          assistantSeq: active.assistantSeq, updatedAt: active.updatedAt,
          tools: active.tools, error: active.error, outcome,
        };
        if (JSON.stringify(previous) !== JSON.stringify(next)) changes.set(active.id, next);
        active = null;
      };
      const ordered = (entries || []).filter((item) =>
        item && (item.type === 'event' || item.type === 'transient') &&
        typeof item.event?.seq === 'number' && item.event.seq > anchorSeq &&
        (item.event.surfaceOp === undefined || item.event.surfaceOp === 'append'))
        .slice().sort((left, right) => left.event.seq - right.event.seq);
      for (const item of ordered) {
        const event = item.event;
        const data = event.data || {};
        if (event.type === 'turn/start') {
          finish('stopped', event);
          inTurn = true;
          continue;
        }
        if (event.type === 'user/message') {
          if (data.source && data.source.kind !== 'user') continue;
          const hadAnswer = hasAnswer();
          finish(hadAnswer ? 'complete' : 'stopped', event, hadAnswer ? '' : 'superseded');
          const id = data.source?.rpcId;
          const previous = typeof id === 'string' ? registered.get(id) : null;
          if (previous) active = {
            id, userSeq: event.seq, assistantSeq: null, text: [], liveText: '', liveAttempt: null,
            tools: [], error: '', updatedAt: Math.max(previous.updatedAt || previous.createdAt || 0, event.time || 0),
          };
          continue;
        }
        if (event.type === 'turn/end') {
          if (active) {
            const reason = data.reason || {};
            const status = reason.kind === 'error' ? 'error' :
              ['aborted', 'interrupted', 'blocked', 'cancelled', 'max-tokens'].includes(reason.kind) ? 'stopped' : 'complete';
            if (status === 'error') active.error = String(reason.message || reason.code || '').slice(0, 1000);
            finish(status, event);
          }
          inTurn = false;
          continue;
        }
        if (!active) continue;
        if (event.type === 'assistant/live-chunk') {
          const chunk = data.chunk || {};
          if (active.liveAttempt !== data.attemptId) {
            active.liveAttempt = data.attemptId;
            active.liveText = '';
          }
          if (chunk.type === 'text-delta' && typeof chunk.text === 'string') {
            active.liveText = (active.liveText + chunk.text).slice(0, 12000);
            touch(event);
          }
        } else if (event.type === 'assistant/message') {
          const text = textOfContent(data.message?.content);
          if (text) active.text.push(text);
          active.assistantSeq = event.seq;
          // Settlement can briefly coexist with its transient chunks.
          active.liveText = '';
          active.liveAttempt = null;
          touch(event);
        } else if (event.type === 'tool/call') {
          const name = typeof data.name === 'string' ? data.name.slice(0, 120) : '';
          if (name && !active.tools.includes(name) && active.tools.length < 20) active.tools.push(name);
          touch(event);
        }
      }
      if (active) finish(running || inTurn || active.liveText ? 'running' : hasAnswer() ? 'complete' : 'queued');
      if (changes.size === 0) return;
      const sharedReplies = copyRecord(recordObject(entry.sharedReplies));
      for (const [id, value] of changes) sharedReplies[id] = value;
      patchThread(parentId, anchorSeq, { sharedReplies });
    }

    function firstHistorySeq(windowState) {
      let first;
      for (const item of windowState?.entries || []) {
        const seq = item?.type === 'event' ? item.event?.seq : undefined;
        if (typeof seq === 'number' && (first === undefined || seq < first)) first = seq;
      }
      return first;
    }

    /** A tail window is exact only after it reaches the child's own suffix. */
    function threadHistoryComplete(binding, anchorSeq, windowState = windowOf(binding)) {
      if (!binding || !windowState || !Number.isFinite(anchorSeq)) return false;
      const first = firstHistorySeq(windowState);
      if (first !== undefined && first <= anchorSeq + 1) return true;
      if (typeof windowState.hasMore === 'boolean') return !windowState.hasMore;
      return windowState === windowOf(binding) && binding.session.getSnapshot?.()?.hasMore === false;
    }

    /** Page back through this thread, stopping before inherited parent history. */
    async function loadThreadHistory(binding, anchorSeq, cancelled = () => false) {
      if (!binding || !Number.isFinite(anchorSeq)) return false;
      while (!cancelled()) {
        const before = windowOf(binding);
        if (threadHistoryComplete(binding, anchorSeq, before)) return true;
        const hasMore = before?.hasMore ?? binding.session.getSnapshot?.()?.hasMore;
        if (hasMore !== true ||
            typeof binding.session.loadOlder !== 'function') return false;
        const first = firstHistorySeq(before);
        try {
          await binding.session.loadOlder();
        } catch (error) {
          return false;
        }
        if (cancelled()) return false;
        const after = windowOf(binding);
        if (threadHistoryComplete(binding, anchorSeq, after)) return true;
        const next = firstHistorySeq(after);
        // A refused/failed page must not spin or replace a trusted total.
        if (next === undefined || (first !== undefined && next >= first)) return false;
      }
      return false;
    }

    /* ------------------------------------------------------------------ *
     * Hooks
     * ------------------------------------------------------------------ */

    function useRetainedBinding(client, childId) {
      const [state, setState] = React.useState({ childId: '', binding: null, error: '' });
      React.useEffect(() => {
        setState({ childId, binding: null, error: '' });
        if (!childId) return undefined;
        let alive = true;
        let reference;
        try {
          reference = client.sessions.retain(childId, { source: RETAIN_SOURCE });
        } catch (error) {
          setState({ childId, binding: null, error: errorText(error) });
          return undefined;
        }
        reference.ready
          .then((binding) => {
            if (alive) setState({ childId, binding, error: '' });
          })
          .catch((error) => {
            if (alive) setState({ childId, binding: null, error: errorText(error) });
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
      // Effects run after render; never expose the previous child's binding in
      // the first render of a newly selected thread.
      return state.childId === childId ? state : { childId, binding: null, error: '' };
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

    function UserGlyph(props) {
      const size = props && props.size ? props.size : 12;
      return h(
        'svg',
        { viewBox: '0 0 16 16', width: size, height: size, fill: 'none', 'aria-hidden': true },
        h('circle', { cx: 8, cy: 5.2, r: 2.6, stroke: 'currentColor', strokeWidth: 1.3 }),
        h('path', {
          d: 'M3 13.2c.6-2.4 2.7-3.8 5-3.8s4.4 1.4 5 3.8',
          stroke: 'currentColor',
          strokeWidth: 1.3,
          strokeLinecap: 'round',
        }),
      );
    }

    /** The assistant's stable identity mark, legible down to a 24px row. */
    function WhaleGlyph(props) {
      const size = props && props.size ? props.size : 15;
      return h(
        'svg',
        { viewBox: '0 0 50 50', width: size, height: size, fill: 'none', 'aria-hidden': true },
        h('path', { d: WHALE_PATH, fill: 'currentColor' }),
      );
    }

    /** Goal identity mark for command results, kept apart from the assistant whale. */
    function GoalGlyph(props) {
      const size = props && props.size ? props.size : 14;
      return h(
        'svg',
        { viewBox: '0 0 16 16', width: size, height: size, fill: 'none', 'aria-hidden': true },
        h('circle', { cx: 8, cy: 8, r: 5.4, stroke: 'currentColor', strokeWidth: 1.3 }),
        h('circle', { cx: 8, cy: 8, r: 2.5, stroke: 'currentColor', strokeWidth: 1.3 }),
        h('circle', { cx: 8, cy: 8, r: 0.9, fill: 'currentColor' }),
      );
    }

    /** Circular user avatar: the signed-in account picture, else the local glyph. */
    function UserAvatar(props) {
      const state = useAccountAvatar();
      const size = props && props.size ? props.size : 24;
      const className = props && props.className ? props.className : 'sk-avatar';
      const loaded = state.status === 'ready' && state.url !== '';
      return h(
        'span',
        {
          className: className,
          'aria-hidden': true,
          title: state.name || undefined,
        },
        loaded
          ? h('img', {
              className: 'avatar-img',
              src: state.url,
              alt: '',
              draggable: false,
              referrerPolicy: 'no-referrer',
              onError: function avatarFailed() {
                failAccountAvatar(state.url);
              },
            })
          : h(UserGlyph, { size: Math.max(9, Math.round(size * 0.5)) }),
      );
    }

    /** Circular assistant avatar: the whale mark on the theme's brand disc. */
    function AssistantAvatar(props) {
      const size = props && props.size ? props.size : 24;
      const className = props && props.className ? props.className : 'sk-avatar sk-avatar-assistant';
      return h(
        'span',
        { className: className, 'aria-hidden': true },
        h(WhaleGlyph, { size: Math.max(11, Math.round(size * 0.62)) }),
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
      '[data-dsh-threads-skin="slack"] .sk-avatar-assistant{background:var(--sk-indigo);color:#ffffff}',
      '[data-dsh-threads-skin="slack"] .sk-action:hover{color:var(--sk-azure-ink)}',
      '[data-dsh-threads-skin="slack"] .dt-thread-card-avatar-d{background:var(--sk-indigo);color:#ffffff}',
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
      '.dt-shared-results{display:flex;flex-direction:column;gap:8px;padding:0 10px 10px}',
      '.dt-shared-result{min-width:0;padding:9px 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:6px;background:var(--dsw-alias-bg-base)}',
      '.dt-shared-head{display:flex;align-items:center;gap:8px;font-size:11px;color:var(--dsw-alias-label-secondary)}',
      '.dt-shared-title{font-weight:600;color:var(--dsw-alias-label-primary)}',
      '.dt-shared-status{margin-left:auto}',
      '.dt-shared-result[data-status="error"] .dt-shared-status,.dt-shared-error{color:var(--dsw-alias-state-error-primary)}',
      '.dt-shared-question{margin-top:5px;font-size:12px;line-height:1.6;white-space:pre-wrap;overflow-wrap:anywhere;color:var(--dsw-alias-label-secondary)}',
      '.dt-shared-answer{margin-top:7px;max-height:420px;overflow:auto;font-size:13px;line-height:1.65;overflow-wrap:anywhere;color:var(--dsw-alias-label-primary)}',
      '.dt-shared-tools,.dt-shared-hint,.dt-shared-error{margin-top:6px;font-size:11px;line-height:1.6;overflow-wrap:anywhere}',
      '.dt-shared-tools,.dt-shared-hint{color:var(--dsw-alias-label-secondary)}',
      '.dt-thread-card:hover{border-color:var(--dsw-alias-border-l2)}',
      '.dt-thread-card-main{display:flex;align-items:center;gap:8px;width:100%;padding:6px 10px;border:0;background:transparent;color:inherit;font:inherit;font-size:12px;text-align:left;cursor:pointer}',
      '.dt-thread-card-avatars{display:inline-flex;align-items:center;flex:none}',
      '.dt-thread-card-avatar{display:grid;place-items:center;overflow:hidden;width:20px;height:20px;border-radius:50%;border:2px solid var(--dsw-alias-bg-layer-1);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-size:9px;font-weight:700}',
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
      '.dt-people-avatar{display:grid;place-items:center;overflow:hidden;width:18px;height:18px;border-radius:50%;border:2px solid var(--dsw-alias-bg-layer-1);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-size:9px;font-weight:700}',
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
      '.dt-avatar{flex:none;width:24px;height:24px;border-radius:50%;overflow:hidden;display:grid;place-items:center;font-size:10px;font-weight:700;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);margin-top:2px}',
      '.dt-avatar[data-ghost="1"]{background:transparent}',
      '.dt-avatar-ghost{background:transparent}',
      '.dt-lightbox{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:24px;background:rgba(0,0,0,.72);cursor:zoom-out}',
      '.dt-lightbox-img{max-width:100%;max-height:100%;border-radius:6px;cursor:default}',
      '.dt-images{display:flex;flex-wrap:wrap;gap:4px;margin-top:5px}',
      '.dt-image{display:block;padding:0;border:1px solid var(--dsw-alias-border-l1);border-radius:4px;overflow:hidden;max-width:200px;background:var(--dsw-alias-bg-layer-1);cursor:zoom-in}',
      '.dt-image img{display:block;max-width:200px;max-height:160px;object-fit:contain}',
      '.dt-avatar svg{display:block}',
      '.sk-avatar svg,.dt-thread-card-avatar svg,.dt-thread-row-avatar svg,.dt-people-avatar svg{display:block}',
      '.avatar-img{display:block;width:100%;height:100%;object-fit:cover}',
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
      '.dt-thread-row-avatar{display:grid;place-items:center;overflow:hidden;width:20px;height:20px;border-radius:50%;border:2px solid var(--dsw-alias-bg-base);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-size:9px;font-weight:700}',
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
      '.sk-avatar{flex:none;width:24px;height:24px;border-radius:50%;overflow:hidden;display:grid;place-items:center;margin-top:2px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-size:10px;font-weight:700}',
      '.sk-avatar-ghost{background:transparent}',
      '.sk-avatar-assistant{background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-base)}',
      '.sk-avatar.sk-goal-avatar{background:color-mix(in srgb,var(--sk-azure) 16%,var(--dsw-alias-bg-layer-2));color:var(--sk-azure-ink)}',
      '.sk-command-token{display:inline-block;padding:0 4px;border-radius:4px;background:color-mix(in srgb,var(--sk-azure) 15%,transparent);color:var(--sk-azure-ink);font-family:var(--ds-font-family-code,ui-monospace,SFMono-Regular,Consolas,monospace);font-size:.92em}',
      '.sk-goal-card{margin-top:4px;border:1px solid var(--dsw-alias-border-l1);border-left:3px solid var(--sk-azure);border-radius:8px;background:var(--dsw-alias-bg-layer-1);padding:9px 12px;max-width:100%}',
      '.sk-goal-card[data-state="error"]{border-left-color:var(--dsw-alias-state-error-primary)}',
      '.sk-goal-title{font-size:12.5px;font-weight:600;color:var(--dsw-alias-label-primary);overflow-wrap:anywhere}',
      '.sk-goal-body{margin:3px 0 0;padding:0;white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;font-size:12.5px;line-height:1.6;color:var(--dsw-alias-label-secondary)}',
      '.sk-goal-card[data-state="error"] .sk-goal-title,.sk-goal-card[data-state="error"] .sk-goal-body{color:var(--dsw-alias-state-error-primary)}',
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
      '.sk-reasoning{margin:3px 0 6px;color:var(--dsw-alias-label-secondary)}',
      '.sk-reasoning-summary{cursor:pointer;font-size:12px;line-height:1.6}',
      '.sk-reasoning-body{margin-top:6px;padding-left:10px;border-left:2px solid var(--dsw-alias-border-l1)}',
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
      inject: ['slots', 'sessions', 'locale', 'remote', 'sidebarRight', 'sidebarRightTabs', 'uiWorkspace', 'workspaces'],
      apply(ctx) {
        const t = ctx.locale.bind(NS);

        void loadPersisted();
        watchAccountAvatar(ctx);

        ctx.effect(() => ctx.locale.register(NS, { zh: ZH, en: EN }), 'threads: locale');
        ctx.effect(() => {
          const style = document.createElement('style');
          style.dataset.plugin = PLUGIN_ID;
          style.textContent = CSS;
          document.head.appendChild(style);
          return () => style.remove();
        }, 'threads: styles');
        ctx.effect(() => {
          window.addEventListener('storage', syncStorageEvent);
          return () => window.removeEventListener('storage', syncStorageEvent);
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

        async function promptSession(binding, text, images, requestId) {
          const parts = [{ type: 'text', text: THREAD_NOTE + '\n\n' + text }];
          for (const image of images || []) {
            parts.push({ type: 'image', mediaType: image.mediaType, data: image.data, name: image.name });
          }
          const result = await binding.session.prompt(parts, 'queue', undefined, requestId);
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

        /** Observe shared child output without sending anything into the parent. */
        function SharedThreadResults(props) {
          const parentId = props.sessionId;
          const anchorSeq = typeof props.seq === 'number' ? props.seq : Number(props.anchorSeq ?? props.seq);
          const entry = useThreadEntry(parentId, anchorSeq);
          const sharedReplies = recordObject(entry?.sharedReplies);
          const hasShares = Object.keys(sharedReplies).length > 0;
          const childId = hasShares && typeof entry?.childId === 'string' ? entry.childId : '';
          const retained = useRetainedBinding(ctx, childId);
          const binding = retained.binding;
          const windowState = useEventWindow(binding);
          const snapshot = useSessionSnapshot(binding);
          const { labels } = useMarkdownLabels();
          React.useEffect(() => {
            if (!binding || !Number.isFinite(anchorSeq)) return undefined;
            let cancelled = false;
            void loadThreadHistory(binding, anchorSeq, () => cancelled);
            return () => { cancelled = true; };
          }, [binding, anchorSeq]);
          React.useEffect(() => {
            if (!binding || !hasShares) return;
            syncSharedReplies(parentId, anchorSeq, windowState?.entries, Boolean(snapshot?.running));
          }, [binding, hasShares, parentId, anchorSeq, windowState, snapshot?.running, entry?.sharedReplies]);
          if (!hasShares) return null;
          const results = Object.entries(sharedReplies)
            .filter(([, value]) => value && typeof value === 'object')
            .sort(([leftId, left], [rightId, right]) => (left.createdAt || 0) - (right.createdAt || 0) || leftId.localeCompare(rightId));
          return h(
            'div',
            { className: 'dt-shared-results' },
            results.map(([id, result]) => h(
              'article',
              { key: id, className: 'dt-shared-result', 'data-share-id': id, 'data-status': result.status || 'queued' },
              h(
                'div',
                { className: 'dt-shared-head' },
                h('span', { className: 'dt-shared-title' }, t('shared.title')),
                h('span', { className: 'dt-shared-status', role: 'status' }, t('shared.' + (result.status || 'queued'))),
                h('button', { type: 'button', className: 'dt-link', onClick: () => openThreadPanel(parentId, anchorSeq) }, t('shared.open')),
              ),
              result.question ? h('div', { className: 'dt-shared-question' }, result.question) : null,
              result.answer ? h(
                'div',
                { className: 'dt-shared-answer' },
                MarkdownText ? h(MarkdownText, { text: result.answer, labels, streaming: result.status === 'running' }) : result.answer,
              ) : null,
              Array.isArray(result.tools) && result.tools.length > 0
                ? h('div', { className: 'dt-shared-tools' }, t('shared.tools', { names: result.tools.join(' · ') }))
                : null,
              result.status === 'error' && result.error ? h('div', { className: 'dt-shared-error' }, result.error) : null,
              result.outcome === 'superseded' ? h('div', { className: 'dt-shared-hint' }, t('shared.superseded')) : null,
            )),
            h('div', { className: 'dt-shared-hint' }, t('shared.hint')),
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
                const complete = await loadThreadHistory(binding, seq, () => cancelled);
                if (cancelled) return;
                const state = binding.eventSource.getSnapshot();
                const entries = state && Array.isArray(state.entries) ? state.entries : [];
                const activity = threadActivity(entries, seq);
                const current = threadAt(sessionId, seq);
                if (!current || current.childId !== childId) return;
                const patch = {};
                if (complete && activity.replies !== current.replies) patch.replies = activity.replies;
                if (activity.updatedAt > (current.updatedAt || 0)) patch.updatedAt = activity.updatedAt;
                if (Object.keys(patch).length > 0) patchThread(sessionId, seq, patch);
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
                h(UserAvatar, { size: 20, className: 'dt-thread-card-avatar' }),
                h(AssistantAvatar, {
                  size: 20,
                  className: 'dt-thread-card-avatar dt-thread-card-avatar-d',
                }),
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
            h(SharedThreadResults, { sessionId, seq }),
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
                        h(UserAvatar, { size: 20, className: 'dt-thread-row-avatar' }),
                        h(AssistantAvatar, {
                          size: 20,
                          className: 'dt-thread-row-avatar dt-thread-row-avatar-d',
                        }),
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
            h(UserAvatar, { size: 24, className: 'sk-avatar' }),
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
              renderSlackFiles(files),
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

        /** Slack renderer for the goal-owned `command-input` node. */
        function SlackCommandInputNode(props) {
          const node = props.node || {};
          const data = node.data || {};
          const text = typeof data.text === 'string' ? data.text : '';
          const { active } = useMarkdownLabels();
          const time = nodeTime(node, data);
          if (!text) return null;
          const space = text.indexOf(' ');
          const token = space > 0 ? text.slice(0, space) : text;
          const rest = space > 0 ? text.slice(space) : '';
          return h(
            'div',
            { className: 'sk-row', 'data-role': 'user' },
            h(UserAvatar, { size: 24, className: 'sk-avatar' }),
            h(
              'div',
              { className: 'sk-body' },
              h(
                'div',
                { className: 'sk-meta' },
                h('span', { className: 'sk-author' }, t('panel.you')),
                time ? h('span', { className: 'sk-time' }, clockText(time, active)) : null,
              ),
              h(
                'div',
                { className: 'sk-text' },
                h('span', { className: 'sk-command-token' }, token),
                rest,
              ),
            ),
            h('div', { className: 'sk-actions' }, h(SlackCopyButton, { text })),
          );
        }

        /** Slack row for the `/goal` command result, reached through the commandview slot. */
        function SlackGoalCommandView(props) {
          const command = props.node || {};
          const outcome = command.outcome || null;
          const raw = outcome && typeof outcome.text === 'string' ? outcome.text.trim() : '';
          const lines = raw ? raw.split('\n') : [];
          const running = outcome === null;
          const failed = Boolean(outcome && outcome.kind === 'error');
          const fallbackTitle = command.name || 'goal';
          const title = running
            ? t('skin.goalRunning')
            : failed || lines.length <= 1
              ? fallbackTitle
              : lines[0];
          const body = running
            ? ''
            : failed || lines.length <= 1
              ? raw
              : lines.slice(1).join('\n').trim();
          const { active } = useMarkdownLabels();
          const time = typeof command.time === 'number' ? command.time : undefined;
          return h(
            'div',
            { className: 'sk-row', 'data-role': 'assistant' },
            h(
              'span',
              { className: 'sk-avatar sk-goal-avatar', 'aria-hidden': true },
              h(GoalGlyph, { size: 14 }),
            ),
            h(
              'div',
              { className: 'sk-body' },
              h(
                'div',
                { className: 'sk-meta' },
                h('span', { className: 'sk-author' }, t('skin.goalAuthor')),
                time ? h('span', { className: 'sk-time' }, clockText(time, active)) : null,
              ),
              h(
                'div',
                { className: 'sk-goal-card', 'data-state': failed ? 'error' : 'ok' },
                h('div', { className: 'sk-goal-title' }, title),
                body ? h('pre', { className: 'sk-goal-body' }, body) : null,
              ),
            ),
            h('div', { className: 'sk-actions' }, h(SlackCopyButton, { text: raw })),
          );
        }

        /** Slack-style renderer replacing the shipped `assistant-step` Chat node. */
        function SlackAssistantNode(props) {
          const node = props.node || {};
          const data = node.data || {};
          const blocks = Array.isArray(data.blocks) ? data.blocks : [];
          const reasoningOnly = props.groupPart === 'reasoning';
          const reasoning = props.groupPart === 'response' ? '' : blocks
            .filter((block) => block && block.kind === 'reasoning' && typeof block.text === 'string')
            .map((block) => block.text)
            .join('\n\n');
          const text = reasoningOnly ? '' : blocks
            .filter((block) => block && block.kind === 'text')
            .map((block) => block.text)
            .join('\n\n');
          const attachments = reasoningOnly ? [] : blocks
            .filter((block) => block && block.kind === 'image' && block.attachment)
            .map((block) => block.attachment);
          const { labels, active } = useMarkdownLabels();
          const canFork =
            typeof props.useAccess === 'function' ? props.useAccess('session/fork') : false;
          if (!text && !reasoning.trim() && attachments.length === 0) return null;
          const seq =
            !reasoningOnly && data.finalNode && typeof data.finalNode.seq === 'number'
              ? data.finalNode.seq
              : undefined;
          const time = nodeTime(node, data);
          return h(
            'div',
            { className: 'sk-row', 'data-role': 'assistant' },
            h(AssistantAvatar, {
              size: 24,
              className: 'sk-avatar sk-avatar-assistant',
            }),
            h(
              'div',
              { className: 'sk-body' },
              h(
                'div',
                { className: 'sk-meta' },
                h('span', { className: 'sk-author' }, 'DSH'),
                time ? h('span', { className: 'sk-time' }, clockText(time, active)) : null,
              ),
              reasoning.trim()
                ? h(
                    'details',
                    { className: 'sk-reasoning' },
                    h('summary', { className: 'sk-reasoning-summary' }, t('skin.reasoning')),
                    h(
                      'div',
                      { className: 'sk-text sk-text-md sk-reasoning-body' },
                      MarkdownText
                        ? h(MarkdownText, {
                            text: reasoning,
                            labels,
                            streaming: data.status === 'running',
                          })
                        : reasoning,
                    ),
                  )
                : null,
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
              h(SlackCopyButton, { text: text || reasoning }),
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

        /** Shared file cards for ordinary user messages and expanded steering. */
        function renderSlackFiles(files) {
          if (files.length === 0) return null;
          return h(
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
                  [extensionOf(file.name), formatBytes(file.bytes)].filter(Boolean).join(' · '),
                ),
              ),
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
          const attachments = content
            .filter((block) => block && block.type === 'image' && block.attachment)
            .map((block) => block.attachment);
          const files = content
            .filter((block) => block && block.type === 'file' && block.attachment)
            .map((block) => block.attachment);
          const attachmentCount = attachments.length + files.length;
          const { active } = useMarkdownLabels();
          const time = nodeTime(node, data);
          const [expanded, setExpanded] = React.useState(false);
          if (!text && attachmentCount === 0) return null;
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
                  text || t('skin.attachments', { count: attachmentCount }),
                ),
                time ? h('span', { className: 'sk-time' }, clockText(time, active)) : null,
                h(
                  'span',
                  { className: 'sk-steer-chevron', 'aria-hidden': true },
                  h(ChevronGlyph, null),
                ),
              ),
              expanded && attachments.length > 0
                ? h(MessageImages, { sessionId: props.sessionId, attachments })
                : null,
              expanded ? renderSlackFiles(files) : null,
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
            assistant
              ? h(AssistantAvatar, { size: 24, className: 'dt-avatar' })
              : h(UserAvatar, { size: 24, className: 'dt-avatar' }),
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
          const persistenceProblem = usePersistError();
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
          const draft = useDraft(draftKey);
          const setDraft = React.useCallback((value) => {
            if (draftKey) saveDraft(draftKey, value);
          }, [draftKey]);
          const [images, setImages] = React.useState([]);
          const [broughtBack, setBroughtBack] = React.useState(false);
          const [shareToMain, setShareToMain] = React.useState(false);
          const [sending, setSending] = React.useState(false);
          const [answering, setAnswering] = React.useState(false);
          const [failure, setFailure] = React.useState('');
          const [retryRequest, setRetryRequest] = React.useState(null);
          const attemptRef = React.useRef(null);
          const activeDraftKey = React.useRef(draftKey);
          activeDraftKey.current = draftKey;
          const listRef = React.useRef(null);
          const stickRef = React.useRef(true);
          const inputRef = React.useRef(null);
          const fileRef = React.useRef(null);

          React.useEffect(() => {
            setFailure('');
            const failed = failedDeliveries.get(draftKey);
            if (failed?.stage === 'parent') failedDeliveries.delete(draftKey);
            setRetryRequest(failed?.stage === 'parent' ? null : failed || null);
            setSending(false);
            setShareToMain(false);
            setImages([]);
            attemptRef.current = null;
          }, [draftKey]);

          React.useEffect(() => {
            requestAnimationFrame(() => {
              const element = inputRef.current;
              if (!element) return;
              element.style.height = 'auto';
              if (draft) element.style.height = Math.min(element.scrollHeight, 120) + 'px';
            });
          }, [draftKey, draft]);

          const updateDraft = (value) => {
            setDraft(value);
          };

          const running = Boolean(snapshot && snapshot.running);
          const promptError = snapshot && snapshot.promptError ? errorText(snapshot.promptError.error) : '';
          const failedRequest = retryRequest || failedDeliveries.get(draftKey);
          const pendingRequest = failedRequest?.stage === 'parent' ? null : failedRequest;
          const problem = failure || (pendingRequest ? pendingRequest.error || t('panel.sendFailed') : '') ||
            retained.error || promptError;

          React.useEffect(() => {
            const current = threadAt(parentId, anchorSeq);
            if (!current || !Object.hasOwn(current, 'pendingMain')) return;
            const { pendingMain: ignored, ...next } = current;
            setThread(parentId, anchorSeq, next);
          }, [parentId, anchorSeq, entry?.pendingMain]);

          React.useEffect(() => {
            if (typeof syncSharedReplies === 'function') {
              syncSharedReplies(parentId, anchorSeq, windowState?.entries, running);
            }
          }, [parentId, anchorSeq, windowState, running, entry?.sharedReplies]);

          React.useEffect(() => {
            if (!binding || !validAnchor) return undefined;
            let cancelled = false;
            void loadThreadHistory(binding, anchorSeq, () => cancelled);
            return () => { cancelled = true; };
          }, [binding, validAnchor, anchorSeq]);

          React.useEffect(() => {
            if (!entry || !childId || !binding || !windowState) return;
            const activity = threadActivity(windowState?.entries, anchorSeq);
            const count = activity.replies;
            const lastTime = activity.updatedAt;
            const patch = {};
            if (threadHistoryComplete(binding, anchorSeq, windowState) && count !== entry.replies) {
              patch.replies = count;
            }
            if (lastTime > (entry.updatedAt || 0)) {
              patch.updatedAt = lastTime;
            }
            if (lastTime > (entry.seenAt || 0)) patch.seenAt = Math.max(lastTime, Date.now());
            if (Object.keys(patch).length > 0) patchThread(parentId, anchorSeq, patch);
          }, [windowState, snapshot?.hasMore, entry, childId, parentId, anchorSeq, binding]);

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

          const deliver = async (request) => {
            if (attemptRef.current || activeDeliveries.has(request.key) || archived) return;
            if (request.stage === 'parent') {
              failedDeliveries.delete(request.key);
              setRetryRequest(null);
              return;
            }
            if (!request.requestId) request.requestId = createThreadRequestId();
            const attempt = {};
            attemptRef.current = attempt;
            activeDeliveries.add(request.key);
            setSending(true);
            setFailure('');
            try {
              if (request.stage === 'thread') {
                let target = threadAt(request.parentId, request.anchorSeq)?.childId;
                if (!target) {
                  const quoteSnapshot = quoteFromBinding(parentBinding, request.anchorSeq);
                  target = await ctx.sessions.fork({
                    sessionId: request.parentId,
                    atSeq: request.anchorSeq,
                    increaseTitle: true,
                  });
                  setThread(request.parentId, request.anchorSeq, {
                    childId: target,
                    replies: 0,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    ...(quoteSnapshot ? { quote: {
                      user: truncateText(quoteSnapshot.user, 600),
                      assistant: truncateText(quoteSnapshot.assistant, 1500),
                    } } : {}),
                  });
                }
                const reference = ctx.sessions.retain(target, { source: RETAIN_SOURCE });
                try {
                  const targetBinding = await reference.ready;
                  const prepared = [];
                  for (const image of request.images) {
                    if (typeof image.data === 'string') {
                      prepared.push(image);
                      continue;
                    }
                    // A retry after reopening the panel reads durable image bytes.
                    const result = await targetBinding.session.readAttachment(image.attachmentId);
                    if (!result?.ok) throw new Error(errorText(result?.error) || t('panel.sendFailed'));
                    const bytes = result.value.data;
                    let binary = '';
                    for (let offset = 0; offset < bytes.length; offset += 32768) {
                      binary += String.fromCharCode(...bytes.subarray(offset, offset + 32768));
                    }
                    prepared.push({ ...image, mediaType: image.mediaType, data: btoa(binary) });
                  }
                  request.images = prepared;
                  await promptSession(targetBinding, request.text, request.images, request.requestId);
                } finally {
                  try {
                    reference.release();
                  } catch (error) {
                    /* already released */
                  }
                }
                request.stage = 'done';
              }
              queueSharedReply(request.parentId, request.anchorSeq, request,
                t('panel.sharedImageQuestion', { count: request.images.length }));
              if (failedDeliveries.get(request.key) === request) failedDeliveries.delete(request.key);
              if (loadDraft(request.key) === request.rawDraft) saveDraft(request.key, '');
              if (activeDraftKey.current === request.key) {
                setRetryRequest(null);
                const sentIds = new Set(request.images.map((image) => image.id));
                setImages((current) => current.filter((image) => !sentIds.has(image.id)));
                requestAnimationFrame(() => inputRef.current?.focus());
              }
            } catch (error) {
              request.error = errorText(error);
              failedDeliveries.set(request.key, request);
              if (activeDraftKey.current === request.key) {
                setRetryRequest(request);
                setFailure(request.error);
              }
            } finally {
              activeDeliveries.delete(request.key);
              if (attemptRef.current === attempt) {
                attemptRef.current = null;
                setSending(false);
              }
            }
          };

          const send = async () => {
            const text = draft.trim();
            if ((!text && images.length === 0) || sending || !validAnchor || archived) return;
            // Retrying the unchanged draft keeps its original RPC identity.
            if (pendingRequest?.rawDraft === draft) {
              return deliver(pendingRequest);
            }
            setRetryRequest(null);
            return deliver({
              key: draftKey, parentId, anchorSeq, rawDraft: draft, text,
              images: images.slice(), shareToMain, stage: 'thread', requestId: createThreadRequestId(),
            });
          };

          const stop = () => {
            if (!binding) return;
            binding.session.cancel().catch(() => {});
          };

          const retry = async () => {
            if (sending) return;
            if (pendingRequest) return deliver(pendingRequest);
            if (!binding) return;
            if (draft.trim() || images.length) return send();
            let lastMessage;
            for (let index = items.length - 1; index >= 0; index -= 1) {
              const item = items[index];
              if (item.kind === 'user' && (item.text || item.images?.length)) {
                lastMessage = item;
                break;
              }
            }
            if (!lastMessage) return;
            return deliver({
              key: draftKey, parentId, anchorSeq, rawDraft: null,
              text: lastMessage.text, images: (lastMessage.images || []).slice(),
              shareToMain: Boolean(lastMessage.requestId && entry?.sharedReplies?.[lastMessage.requestId]),
              stage: 'thread', requestId: lastMessage.requestId || createThreadRequestId(),
            });
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
            persistenceProblem
              ? h(
                  'div',
                  { className: 'dt-error dt-store-error', role: 'alert' },
                  h('span', { className: 'dt-error-text', title: persistenceProblem }, t('panel.storeUnsaved')),
                  h('button', { type: 'button', className: 'dt-retry', onClick: retryPersist }, t('panel.retrySave')),
                )
              : null,
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
                    items.some((item) => item.kind === 'user')
                      ? h(UserAvatar, { size: 18, className: 'dt-people-avatar' })
                      : null,
                    items.some((item) => item.kind === 'assistant')
                      ? h(AssistantAvatar, {
                          size: 18,
                          className: 'dt-people-avatar dt-people-d',
                        })
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
                  !archived && (pendingRequest || (binding && snapshot?.promptError?.op === 'send'))
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
                      checked: shareToMain,
                      disabled: archived,
                      onChange: (event) => setShareToMain(event.target.checked),
                    }),
                    h('span', null, t('panel.shareToMain')),
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

        /* Slack skin: replace the user/assistant/steering rows, the goal
         * command input, and the goal command result. Every other Chat node
         * keeps the shipped renderer, and the toggle disposes these
         * registrations. */
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
              disposers.push(
                ctx.slots.inject('conversation.chat.node', () =>
                  ctx.slots.register(
                    { name: 'conversation.chat.node', key: 'command-input', priority: -1 },
                    SlackCommandInputNode,
                  ),
                ),
              );
              disposers.push(
                ctx.slots.inject('conversation.chat.commandview', () =>
                  ctx.slots.register(
                    { name: 'conversation.chat.commandview', key: 'goal', priority: -1 },
                    SlackGoalCommandView,
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

# Passive Thread Sharing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 线程独立执行，主会话展示被动结果卡片；发布并安装 0.14.0。

**Architecture:** 发送入口仅调用线程会话的 prompt。勾选结果展示时，线程索引按稳定请求 ID 保存共享记录；父会话的 turnTail 插槽展示同一记录的状态和结果。卡片不写入主 Agent 的消息队列；现有“带回主对话”继续写草稿，由用户明确发送。

**Tech Stack:** JavaScript ESM、DSH 会话与插槽 API、Node 内置测试、GitHub CLI。

---

### Task 1: 发送语义
- 删除 parent.prompt / pendingMain 自动补发逻辑。
- 稳定 requestId 贯穿发送、重试和共享记录。
- 默认关闭共享；勾选后登记 sharedReplies，失败重试不重复建卡。
- 更新行为测试，断言主会话 prompt 调用次数为零。

### Task 2: 被动卡片
- 从已登记请求对应的子会话事件归并状态、正文和工具摘要。
- queued / running / complete / error / stopped 持续更新同一卡片。
- 主会话 turnTail 展示结果与线程入口，保留 Markdown、加载和持久化恢复。
- 补充流式、工具、错误、队列、幂等和恢复测试。

### Task 3: 版本与发布
- 同步 package.json、客户端版本常量、README 与 CHANGELOG 为 0.14.0。
- 运行完整测试、语法和打包检查，核对旧修复均保留。
- 提交并推送当前任务修改，等待对应提交的 Windows/Linux CI 通过。
- 建立 v0.14.0 标签，发布 tgz、ZIP、SHA256SUMS，下载并校验全部资源。

### Task 4: 安装验收
- 检查当前 desktop/web profile 与已有安装来源。
- 使用宿主支持的安装/更新入口安装固定发布版本。
- 验证安装 manifest、Host 与客户端版本及激活状态；安全刷新界面，保留现有会话与线程数据。
- 记录发布地址、CI、资产校验和本机安装证据。

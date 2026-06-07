# Implementation Plan: 划词翻译体验修复与增强

**Branch**: `002-fix-selection-translate` | **Date**: 2026-06-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-fix-selection-translate/spec.md`

## Summary

在现有 WXT + React 浏览器扩展上修复划词翻译的状态问题，并增强长文本阅读、单词发音、语境释义和渐进式富文本展示。技术方案保留 Background 代理硅基流动 API、Content Script 只负责选区和弹框展示的分层架构；通过 requestId/selectionId 绑定最新选区，扩展 Port 消息契约携带当前句子上下文，新增受限富文本清洗与渲染层，避免模型生成内容污染宿主页。

## Technical Context

**Language/Version**: TypeScript 5.7, React 19

**Primary Dependencies**: WXT, React, Tailwind CSS 4, @floating-ui/dom, @webext-core/messaging, openai stream, zod, lucide-react

**Storage**: `chrome.storage.local`（现有 API Key、默认模型名）；本功能不新增持久化数据

**Testing**: Vitest（选区校验、当前句子提取、请求过期过滤、富文本清洗、LookupResult 解析）

**Target Platform**: Chrome / Edge, Manifest V3

**Project Type**: Browser extension (WXT monolith)

**Performance Goals**: 新选区图标 300ms 内出现；切换选区后旧请求不得更新 UI；首段可读内容在完整响应结束前展示；1000 字符以内长文本弹框可滚动阅读

**Constraints**: API Key 仅 Background 可访问；Content Script 只发送选中文本和当前句子；生成富文本必须清洗后渲染；样式限定在 Shadow UI/弹框内；不自动翻译整页；单次选区最多 1000 字符

**Popover Size Rules**: 弹框宽度默认 360px；最大高度为 `min(520px, viewportHeight - 32px)`；内容区最大高度为弹框高度减去 header、原文区和内边距后的剩余空间；原文展开区最大高度为 160px，超出后独立滚动

**Scale/Scope**: 修改现有 content/background/panel/stream/prompt/parser/selection 类型与测试，新增 1 个富文本清洗模块、1 个当前句子提取工具、1 个发音播放能力，约 10-14 个源文件受影响

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原则 | 状态 | 说明 |
|------|------|------|
| I. 不破坏页面体验 | PASS | 使用 Shadow UI 展示弹框；不覆盖原文；富文本清洗并限定样式范围；长文本弹框可滚动且可关闭 |
| II. 扩展分层架构 | PASS | Background 调 API 和处理密钥；Content Script 管选区、当前句子和 UI；Popup 仍只负责设置 |
| III. 隐私最小化 | PASS | 上下文释义只发送选中词和当前句子；超过 1000 字符不发请求；不采集段落或整页 |
| IV. MVP 优先 | PASS | 先修复 P1 状态与长文本体验，再交付发音、语境释义和渐进式富文本 |

**Post-design re-check**: PASS。设计产物保持分层架构、隐私最小化和主动触发原则，无需 Complexity Tracking。

## Project Structure

### Documentation (this feature)

```text
specs/002-fix-selection-translate/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── messaging.md
│   └── rich-result.schema.json
├── checklists/
│   ├── requirements.md
│   └── translation-ux.md
└── tasks.md             # /speckit-tasks 产出
```

### Source Code (repository root)

```text
entrypoints/
├── background.ts              # Port 流式查词、取消旧请求、错误返回
├── content.tsx                # Shadow UI 挂载
└── popup/
    ├── index.html
    ├── main.tsx
    ├── App.tsx
    └── style.css

components/
├── SelectionTranslator.tsx    # 选区、图标、弹框、请求生命周期协调
├── TriggerIcon.tsx
├── LookupPanel.tsx            # 长文本布局、原文展开收起、富文本/词典视图
├── DefinitionList.tsx
└── PanelStates.tsx

hooks/
├── useSelection.ts            # 选区监听、图标重现、当前句子提取入口
├── useFloatingPosition.ts
└── useLookupStream.ts         # requestId 过滤、Port start/cancel、流式状态

lib/
├── messaging.ts
├── selection.ts               # 1000 字符校验、无效选区、句子上下文工具
├── richText.ts                # 受限富文本清洗和允许标签/样式规则
├── audio.ts                   # 单词发音播放封装
├── storage.ts
└── siliconflow/
    ├── client.ts
    ├── stream.ts
    ├── prompt.ts              # 语境释义和受限富文本 prompt
    └── parser.ts

types/
├── lookup.ts                  # 上下文、富文本、发音状态等类型
└── settings.ts

tests/
└── unit/
    ├── selection.test.ts
    ├── parser.test.ts
    ├── richText.test.ts
    └── lookupStream.test.ts
```

**Structure Decision**: 沿用现有 WXT 单仓库结构。Content 侧新增 `lib/selection.ts` 当前句子提取和 `lib/richText.ts` 清洗工具；Background 侧扩展 Port start payload 和 prompt，不引入新的持久化层。

## Complexity Tracking

> 无违规项。

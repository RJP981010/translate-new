# Implementation Plan: 浏览器划词翻译

**Branch**: `001-selection-translate` | **Date**: 2025-06-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-selection-translate/spec.md`

## Summary

实现 Chrome/Edge 划词翻译插件：用户选中文字后，选区下方出现翻译图标；悬停图标展示 SENTENWORD 风格的 AI 查词弹框（音标、词性释义、例句）。技术栈采用 **WXT + React + Tailwind** 工程化脚手架，定位与边界处理使用 **Floating UI**，大模型查词经 **Background 代理硅基流动 OpenAI 兼容 API**。

## Technical Context

**Language/Version**: TypeScript 5.x (strict)

**Primary Dependencies**: WXT, React 19, Tailwind CSS 4, @floating-ui/dom, @webext-core/messaging, openai (stream), zod, lucide-react

**Storage**: `chrome.storage.local`（API Key、默认模型名）

**Testing**: Vitest（单元测试：zod schema、选区工具函数）

**Target Platform**: Chrome / Edge, Manifest V3

**Project Type**: Browser extension (WXT monolith)

**Performance Goals**: 图标出现 < 100ms；悬停后 1s 内展示 loading；首 token 到达即开始流式渲染；不缓存，每次实时 stream 请求

**Constraints**: API Key 仅存 Background；Content Script 使用 Shadow DOM；弹框必须 flip/shift 处理边界

**Scale/Scope**: 2 个 entrypoints UI（content + popup 设置），1 个 background，首版约 15–20 个源文件

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原则 | 状态 | 说明 |
|------|------|------|
| I. 不破坏页面体验 | ✅ PASS | Shadow DOM 注入，不修改原文；悬停触发非自动全站翻译 |
| II. 扩展分层架构 | ✅ PASS | Background 调 API；Content 展示 UI；Popup 管设置 |
| III. 隐私最小化 | ✅ PASS | 仅发送选中文本；API Key 存 storage，不经 Content Script |
| IV. MVP 优先 | ✅ PASS | P1 悬停查词 + P2 配置；收藏/专业词典/发音均排除 |

**Post-design re-check**: ✅ 无违规，无需 Complexity Tracking

## Project Structure

### Documentation (this feature)

```text
specs/001-selection-translate/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── messaging.md
│   └── lookup-response.schema.json
└── tasks.md             # /speckit-tasks 产出
```

### Source Code (repository root)

```text
entrypoints/
├── background.ts              # 硅基流动 API 代理、消息处理
├── content.ts                 # 选区监听、挂载 Shadow UI
└── popup/
    ├── index.html
    ├── main.tsx
    └── App.tsx                # API Key 设置页

components/
├── SelectionTranslator.tsx    # 根组件：协调图标+弹框
├── TriggerIcon.tsx            # 选区下方图标
├── LookupPanel.tsx            # 查词弹框（参考 SENTENWORD 布局）
├── DefinitionList.tsx         # 词性释义列表
└── PanelStates.tsx            # Loading / Error / Empty 态

hooks/
├── useSelection.ts            # mouseup 选区检测
├── useFloatingPosition.ts     # Floating UI 封装
└── useLookupStream.ts         # Port 流式查词，首 chunk 前 loading

lib/
├── messaging.ts               # @webext-core/messaging 协议
├── storage.ts                 # chrome.storage 读写
├── selection.ts               # 选区工具（trim、长度校验）
└── siliconflow/
    ├── client.ts              # openai SDK 实例化
    ├── stream.ts              # stream: true 逐 chunk 读取
    ├── prompt.ts              # System prompt 模板
    └── parser.ts              # 流结束后 zod 校验 JSON（词典模式）

types/
├── lookup.ts                  # 查词结果类型
└── settings.ts                # 用户设置类型

assets/
└── icon/                      # 扩展图标

tests/
└── unit/
    ├── parser.test.ts
    └── selection.test.ts

wxt.config.ts
package.json
tailwind.config.ts
tsconfig.json
```

**Structure Decision**: 采用 WXT 单仓库结构，`entrypoints/` 为扩展入口，`components/` 与 `lib/` 按职责拆分。翻译 API 逻辑集中在 `lib/siliconflow/`，与 UI 解耦，符合 constitution「接口与页面逻辑分开」。

## Complexity Tracking

> 无违规项

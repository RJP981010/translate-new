---
description: "Task list for 浏览器划词翻译插件"
---

# Tasks: 浏览器划词翻译

**Input**: Design documents from `/specs/001-selection-translate/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: 仅在 Polish 阶段包含 plan 约定的单元测试（parser、selection）

**Organization**: 按用户故事分组，US1 可独立演示 UI 流程（含 CONFIG_MISSING 态），US2 完成后可端到端查词

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行（不同文件、无未完成依赖）
- **[Story]**: US1 = 划词悬停查词，US2 = API 密钥配置

---

## Phase 1: Setup（项目初始化）

**Purpose**: WXT 工程脚手架与工具链

- [x] T001 Initialize WXT + React + TypeScript project via `pnpm dlx wxt@latest init` at repository root
- [x] T002 Install dependencies in `package.json`: `@floating-ui/dom`, `@webext-core/messaging`, `openai`, `zod`, `lucide-react`, `tailwindcss`, `@tailwindcss/vite`
- [x] T003 [P] Configure `wxt.config.ts` for MV3 Chrome target, React module, wide URL matches (`<all_urls>`)
- [x] T004 [P] Configure `tailwind.config.ts`, `tsconfig.json` strict mode, ESLint + Prettier
- [x] T005 [P] Add extension icons under `assets/icon/` (16/32/48/128)
- [x] T006 Add `dev`/`build`/`test` scripts in `package.json`

---

## Phase 2: Foundational（阻塞性基础设施）

**Purpose**: 类型、通信、存储、硅基流动 API 层——所有用户故事的前置依赖

**⚠️ CRITICAL**: US1/US2 均不得在此阶段完成前开始

- [x] T007 [P] Create lookup types in `types/lookup.ts` per `data-model.md` and `contracts/lookup-response.schema.json`
- [x] T008 [P] Create settings types in `types/settings.ts` (UserSettings, SaveSettingsRequest)
- [x] T009 Implement selection utilities in `lib/selection.ts` (trim, word count, 1–500 length, invalid char detection)
- [x] T010 Implement storage helpers in `lib/storage.ts` wrapping `chrome.storage.local`
- [x] T011 Implement typed messaging in `lib/messaging.ts` per `contracts/messaging.md` (lookupStream Port client, getSettings, saveSettings)
- [x] T012 [P] Implement LLM prompt templates in `lib/siliconflow/prompt.ts` (dictionary mode ≤5 words, translation mode >5 words, Chinese text variant)
- [x] T013 Implement zod schema + parser in `lib/siliconflow/parser.ts` validating LookupResult JSON
- [x] T014 Implement OpenAI-compatible client factory in `lib/siliconflow/client.ts` (`baseURL: https://api.siliconflow.cn/v1`)
- [x] T014a Implement streaming reader in `lib/siliconflow/stream.ts` using `stream: true` and async iterator over chunks
- [x] T015 Implement `entrypoints/background.ts` Port handler `lookupStream` (chunk/done/error push, cancel support) plus getSettings/saveSettings; no cache
- [x] T016 Create Content Script entry skeleton in `entrypoints/content.ts` with `createShadowRootUi`, `cssInjectionMode: 'ui'`
- [x] T017 [P] Add global Tailwind styles for Shadow UI in `assets/content.css` (or `components/content.css`)

**Checkpoint**: `pnpm dev` 可加载扩展；background 消息可手动测试

---

## Phase 3: User Story 1 - 划词悬停查词（P1）🎯 MVP

**Goal**: 选中文字 → 下方图标 → 悬停 → SENTENWORD 风格弹框（词典/翻译双模式）

**Independent Test**: 配置 API Key 后，在英文页选中 "welcome" 悬停图标，5 秒内看到音标、词性、例句；未配置时见 CONFIG_MISSING 引导

### Implementation for User Story 1

- [x] T018 [P] [US1] Implement `hooks/useSelection.ts` listening to `mouseup`, exposing text + DOMRect + visibility state
- [x] T019 [P] [US1] Implement `hooks/useFloatingPosition.ts` wrapping `@floating-ui/dom` (offset, flip, shift, size) for viewport boundaries
- [x] T020 [US1] Implement `hooks/useLookupStream.ts` via Port: `loading` until first chunk, then `streaming` buffer append, `success` on done (no cache)
- [x] T021 [P] [US1] Implement `components/TriggerIcon.tsx` positioned below selection via Floating UI
- [x] T022 [P] [US1] Implement `components/PanelStates.tsx` (loading before first chunk, streaming preview text, error with retry, empty, config-missing)
- [x] T023 [P] [US1] Implement `components/DefinitionList.tsx` rendering pos/meanings/examples per SENTENWORD layout
- [x] T024 [US1] Implement `components/LookupPanel.tsx` with header (brand, settings link, close); streaming phase shows live text, done switches to structured dictionary or final translation
- [x] T025 [US1] Implement `components/SelectionTranslator.tsx` orchestrating icon hover → panel show, icon hide on panel mount (FR-002a)
- [x] T026 [US1] Wire `SelectionTranslator` into `entrypoints/content.ts` Shadow Root React mount
- [x] T027 [US1] Implement mode auto-switch in `lib/selection.ts` or `SelectionTranslator.tsx` (≤5 words dictionary, >5 words translation)
- [x] T028 [US1] Implement panel close on X button and mouseleave; icon MUST NOT reappear until new selection (FR-002a)
- [x] T029 [US1] Handle edge cases in `SelectionTranslator.tsx`: >500 chars, pure digits/punctuation, rapid selection change cancels stale requestId
- [x] T030 [US1] Position panel with flip/shift when selection near viewport edges (FR-005); prefer above/side in input fields
- [x] T030a [US1] Wire stream cancel on panel close or new selection in `hooks/useLookupStream.ts` to abort Background stream

**Checkpoint**: US1 完整可演示；loading→streaming→success 流畅；词典/翻译/中文/错误/未配置态均可验证

---

## Phase 4: User Story 2 - API 密钥配置（P2）

**Goal**: Popup 设置页配置硅基流动 API Key 与模型，安全存储

**Independent Test**: 填入有效 Key 保存后划词成功；清空 Key 后弹框显示引导；设置页不回显完整密钥

### Implementation for User Story 2

- [x] T031 [P] [US2] Create `entrypoints/popup/index.html` and `entrypoints/popup/main.tsx` popup entry
- [x] T032 [US2] Implement `entrypoints/popup/App.tsx` with API Key input (password field), model input (default `Qwen/Qwen2.5-7B-Instruct`), save button
- [x] T033 [US2] Wire popup to `getSettings`/`saveSettings` via `lib/messaging.ts`; display masked key indicator (`hasApiKey`) not full key
- [x] T034 [US2] Add open-settings action in `components/PanelStates.tsx` using `chrome.runtime.openOptionsPage` or popup link
- [x] T035 [US2] Validate save flow: trim key, empty string clears key, show success/error toast in popup

**Checkpoint**: US2 完成；配合 US1 端到端查词流程畅通

---

## Phase 5: Polish & Cross-Cutting

**Purpose**: 测试、构建验证、文档对齐

- [x] T036 [P] Configure Vitest in `vitest.config.ts` for unit tests
- [x] T037 [P] Add `tests/unit/selection.test.ts` covering word count, length, invalid selection rules
- [x] T038 [P] Add `tests/unit/parser.test.ts` covering valid/invalid LLM JSON against zod schema
- [x] T039 Run `pnpm test` and fix failures
- [x] T040 Run `quickstart.md` manual validation scenarios (core, boundary, no-key, invalid selection, error retry)
- [x] T041 Run `pnpm build` and verify `.output/chrome-mv3` loads in Chrome

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 无依赖，立即开始
- **Foundational (Phase 2)**: 依赖 Setup → **阻塞** US1、US2
- **US1 (Phase 3)**: 依赖 Foundational；不依赖 US2（可用 CONFIG_MISSING 态独立演示）
- **US2 (Phase 4)**: 依赖 Foundational；与 US1 部分文件重叠（T034 依赖 US1 的 PanelStates）
- **Polish (Phase 5)**: 依赖 US1 + US2 完成

### User Story Dependencies

```text
Foundational → US1 (MVP 可停止验证)
Foundational → US2
US1 + US2 → 完整端到端体验
```

### Within Each User Story

- Hooks/types before components
- Components before orchestrator (SelectionTranslator)
- Background handlers before useLookup integration

### Parallel Opportunities

**Phase 1**: T003, T004, T005 可并行

**Phase 2**: T007+T008+T012 可并行；T016+T017 可在 T015 后并行

**Phase 3 (US1)**: T018+T019+T021+T022+T023 可并行启动；T024 依赖 T022+T023

**Phase 4 (US2)**: T031 可与 US1 晚期任务并行（不同 entrypoint）

**Phase 5**: T036+T037+T038 可并行

---

## Parallel Example: User Story 1

```bash
# 并行启动 US1 基础模块：
T018: hooks/useSelection.ts
T019: hooks/useFloatingPosition.ts
T021: components/TriggerIcon.tsx
T022: components/PanelStates.tsx
T023: components/DefinitionList.tsx

# 完成后串行：
T024: components/LookupPanel.tsx
T025: components/SelectionTranslator.tsx
T026: entrypoints/content.ts
```

---

## Implementation Strategy

### MVP First（仅 US1 + Foundational）

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational（关键阻塞）
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: 用已手动写入 storage 的 API Key 或 CONFIG_MISSING 态验证
5. 再完成 US2 实现完整配置流程

### Incremental Delivery

1. Setup + Foundational → 基础就绪
2. US1 → 划词 UI 完整可演示（MVP）
3. US2 → 用户可自行配置 Key
4. Polish → 测试与构建验收

### Task Summary

| Phase | 任务数 | 说明 |
|-------|--------|------|
| Setup | 6 | T001–T006 |
| Foundational | 12 | T007–T017, T014a |
| US1 | 14 | T018–T030, T030a |
| US2 | 5 | T031–T035 |
| Polish | 6 | T036–T041 |
| **Total** | **43** | |

---

## Notes

- 所有查词请求不缓存（FR-012），使用 Port 流式推送（FR-013）
- 首个 chunk 前必须显示 loading，收到 chunk 后立即开始流式渲染
- API Key 仅存在于 Background + storage，禁止出现在 Content Script 或页面 DOM
- 弹框出现后隐藏图标，关闭后不恢复，直至新选区
- iframe 内划词不在范围，无需实现 `all_frames`

# Tasks: 划词翻译体验修复与增强

**Input**: Design documents from `/specs/002-fix-selection-translate/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: 本功能的 plan/quickstart 明确要求 Vitest 覆盖选区校验、当前句子提取、请求过期过滤、富文本清洗和 LookupResult 解析，因此每个相关用户故事包含对应测试任务。

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 准备共享类型、契约与测试入口，避免各用户故事各自定义不兼容的数据结构。

- [X] T001 更新 `types/lookup.ts`，加入 `selectionId`、`sentence`、`safeHtml`、`contextMeaning`、`pronunciation`、`richHtml`、`SANITIZE_EMPTY` 等类型字段
- [X] T002 更新 `lib/messaging.ts` 或相关类型导出，确保 `lookupStream` Port 契约可引用扩展后的 `LookupStreamMessage`
- [X] T003 [P] 新建 `tests/unit/lookupStream.test.ts`，准备 requestId/selectionId 过期消息过滤的单元测试骨架
- [X] T004 [P] 新建 `tests/unit/richText.test.ts`，准备受限富文本清洗的单元测试骨架

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 完成所有用户故事共同依赖的选区校验、上下文、富文本安全和发音基础能力。

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T005 更新 `lib/selection.ts`，将最大选区长度从 500 调整为 1000，并导出可复用的最大长度常量
- [X] T006 [P] 扩展 `lib/selection.ts`，实现当前句子提取工具，返回选中词所在句子或空值
- [X] T007 [P] 新建 `lib/richText.ts`，按 `specs/002-fix-selection-translate/contracts/messaging.md` 的标签和 class allowlist 实现富文本清洗、危险属性移除和纯文本降级
- [X] T008 [P] 新建 `lib/audio.ts`，封装 Web Speech API 发音播放、停止播放和不可用检测
- [X] T009 更新 `tests/unit/selection.test.ts`，覆盖 1000 字符上限、超长提示、纯标点/空白、当前句子提取和提取失败降级
- [X] T010 更新 `tests/unit/richText.test.ts`，覆盖允许标签保留、脚本/事件属性/远程资源/未知类移除和空结果降级
- [X] T011 更新 `lib/siliconflow/parser.ts`，兼容解析 `contextMeaning`、`pronunciation`、`richHtml` 可选字段且保持旧结构可用
- [X] T012 更新 `tests/unit/parser.test.ts`，覆盖扩展后的 `LookupResult` 字段和旧 JSON 结构兼容解析

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel.

---

## Phase 3: User Story 1 - 每次新选区都展示最新结果 (Priority: P1) MVP

**Goal**: 连续选择不同单词或文本时，最终可见弹框结果始终对应最新选区，旧请求不能覆盖当前 UI。

**Independent Test**: 在同一页面依次选中 `apple` 和 `network`，第二次结果必须匹配 `network`，旧请求稍后返回也不能覆盖当前弹框。

### Tests for User Story 1

- [X] T013 [P] [US1] 在 `tests/unit/lookupStream.test.ts` 添加旧 requestId 消息被忽略的单元测试
- [X] T014 [P] [US1] 在 `tests/unit/lookupStream.test.ts` 添加旧 selectionId 消息被忽略的单元测试

### Implementation for User Story 1

- [X] T015 [US1] 更新 `hooks/useLookupStream.ts`，让 `start` 接收 `selectionId` 和可选 `sentence`，并在 state 中保存当前 selectionId
- [X] T016 [US1] 更新 `hooks/useLookupStream.ts`，对 chunk/done/error 同时校验 `requestId` 和 `selectionId` 后才更新 state
- [X] T017 [US1] 更新 `entrypoints/background.ts`，在 `LookupStreamStart`、chunk、done、error 消息中透传 `selectionId`
- [X] T018 [US1] 更新 `components/SelectionTranslator.tsx`，每次有效新选区生成/传递新的 `selectionId` 并在新请求前取消旧请求
- [X] T019 [US1] 更新 `hooks/useSelection.ts`，确保切换选区时清理旧选区状态并暴露当前 selectionId 或创建 selectionId 的输入数据

**Checkpoint**: US1 独立完成后，最新选区结果不会被旧请求覆盖。

---

## Phase 4: User Story 2 - 翻译图标可随每次选区稳定出现 (Priority: P1)

**Goal**: 每次有效新选区都能显示翻译图标；关闭弹框后不恢复旧图标，但再次选择文本会出现新图标。

**Independent Test**: 在同一页面重复选中不同文本 5 次，每次新选区都出现触发图标并能打开翻译弹框。

### Tests for User Story 2

- [X] T020 [P] [US2] 在 `tests/unit/selection.test.ts` 添加重复有效选区会产生可显示图标状态的单元测试
- [X] T021 [P] [US2] 在 `tests/unit/selection.test.ts` 添加取消选区和新选区会清理旧状态的单元测试

### Implementation for User Story 2

- [X] T022 [US2] 更新 `hooks/useSelection.ts`，将有效新选区作为图标出现的唯一入口，并在 mouseup/selectionchange 后重置图标状态
- [X] T023 [US2] 更新 `components/SelectionTranslator.tsx`，关闭弹框时只关闭当前弹框和请求，不恢复旧图标
- [X] T024 [US2] 更新 `components/SelectionTranslator.tsx`，快速切换选区时仅渲染最后一个有效选区的图标和提示
- [X] T025 [US2] 更新 `components/TriggerIcon.tsx`，确保图标 hover 触发逻辑不依赖一次性内部状态

**Checkpoint**: US2 独立完成后，图标能在每次有效新选区稳定出现。

---

## Phase 5: User Story 3 - 长文本翻译弹框可完整阅读 (Priority: P1)

**Goal**: 200-1000 字符文本的译文可完整阅读；原文默认收起，展开后仍有最大高度和滚动能力。

**Independent Test**: 选择 200-1000 字符文本并触发翻译，译文可滚动完整查看，原文可在 2 次点击内展开和收起。

### Tests for User Story 3

- [X] T026 [P] [US3] 在 `tests/unit/selection.test.ts` 添加 1000 字符以内有效、超过 1000 字符无效的边界测试

### Implementation for User Story 3

- [X] T027 [US3] 更新 `components/LookupPanel.tsx`，为原文区添加默认收起、展开、收起和长原文滚动状态
- [X] T028 [US3] 更新 `components/LookupPanel.tsx`，分离原文区域和译文/结果区域的最大高度与滚动容器
- [X] T029 [US3] 更新 `hooks/useFloatingPosition.ts`，按 `min(520px, viewportHeight - 32px)` 计算弹框最大高度，并为 `LookupPanel` 提供内容区和原文区滚动高度
- [X] T030 [US3] 更新 `components/SelectionTranslator.tsx`，把动态高度传入 `LookupPanel` 并保持弹框在视口内
- [X] T031 [US3] 更新 `entrypoints/background.ts`，将超长选区错误文案改为 1000 字符上限

**Checkpoint**: US3 独立完成后，长文本翻译不裁切，可滚动阅读，超长选区不发请求。

---

## Phase 6: User Story 4 - 单词结果支持发音播放 (Priority: P2)

**Goal**: 单词查询结果展示播放按钮，可播放时读出单词，不可用或失败时显示清晰状态且不影响释义。

**Independent Test**: 查询 `welcome` 后点击播放按钮能听到发音；禁用或不可用时显示不可用状态。

### Tests for User Story 4

- [X] T032 [P] [US4] 在 `tests/unit/parser.test.ts` 添加 `pronunciation` 字段解析和缺省兼容测试

### Implementation for User Story 4

- [X] T033 [US4] 更新 `lib/audio.ts`，实现 `speakWord`、`stopSpeaking` 和 `canSpeak` 发音能力
- [X] T034 [US4] 更新 `components/LookupPanel.tsx`，在词典标题区或释义区添加发音播放按钮和不可用提示
- [X] T035 [US4] 更新 `components/LookupPanel.tsx`，在弹框关闭或切换选区时停止当前发音
- [X] T036 [US4] 更新 `lib/siliconflow/parser.ts`，为英文词典结果补齐默认 `pronunciation.available` 状态

**Checkpoint**: US4 独立完成后，发音按钮可用且失败不阻塞释义阅读。

---

## Phase 7: User Story 5 - 展示单词在当前句子中的意思 (Priority: P2)

**Goal**: 查询句子中的单词时展示该词在当前句子中的具体含义，并与通用释义区分；无法取得句子时降级为通用释义。

**Independent Test**: 在 `She built a strong network in the industry.` 中选中 `network`，结果说明此处偏向“人脉关系”。

### Tests for User Story 5

- [X] T037 [P] [US5] 在 `tests/unit/selection.test.ts` 添加跨文本节点或标点边界下当前句子提取的测试
- [X] T038 [P] [US5] 在 `tests/unit/parser.test.ts` 添加 `contextMeaning` 字段解析和缺失字段降级测试

### Implementation for User Story 5

- [X] T039 [US5] 更新 `hooks/useSelection.ts`，在有效选区中附带当前句子文本，无法可靠取得时保持为空
- [X] T040 [US5] 更新 `components/SelectionTranslator.tsx`，调用 `lookup.start` 时只传选中文本和当前句子
- [X] T041 [US5] 更新 `lib/siliconflow/prompt.ts`，词典模式 prompt 要求返回当前句子含义并在无句子时返回通用释义
- [X] T042 [US5] 更新 `lib/siliconflow/stream.ts`，将 `sentence` 注入用户消息构建流程且不发送段落或页面 HTML
- [X] T043 [US5] 更新 `components/LookupPanel.tsx`，在词典结果中单独展示“在当前句子中的意思”区域；当 `contextMeaning` 缺失但用户查询单词时，展示“当前句子上下文不可用，已显示通用释义”的轻量提示

**Checkpoint**: US5 独立完成后，语境释义可用且符合隐私最小化边界。

---

## Phase 8: User Story 6 - 翻译结果边生成边展示 (Priority: P3)

**Goal**: 用户不用等待完整结构化 JSON，弹框能逐步展示清洗后的可读富文本，异常或不安全内容可安全降级。

**Independent Test**: 查询较长文本时先 loading，再逐步出现排版清晰的内容；包含危险 HTML 的模拟响应不会破坏页面。

### Tests for User Story 6

- [X] T044 [P] [US6] 在 `tests/unit/richText.test.ts` 添加模型 HTML 片段清洗和安全降级测试
- [X] T045 [P] [US6] 在 `tests/unit/lookupStream.test.ts` 添加 streaming 阶段生成 `safeHtml` 且危险内容不进入 state 的测试

### Implementation for User Story 6

- [X] T046 [US6] 更新 `lib/siliconflow/prompt.ts`，为渐进式富文本定义受限 HTML 输出规则和允许样式范围
- [X] T047 [US6] 更新 `lib/siliconflow/stream.ts`，为 chunk 标记 `format: 'html' | 'text'` 并保持流式输出
- [X] T048 [US6] 更新 `hooks/useLookupStream.ts`，对每次 buffer 更新调用 `lib/richText.ts` 生成 `safeHtml`
- [X] T049 [US6] 更新 `components/PanelStates.tsx`，支持展示清洗后的 `safeHtml`，清洗为空时展示纯文本降级
- [X] T050 [US6] 更新 `components/LookupPanel.tsx`，在 streaming/success 状态下优先展示安全富文本并保持样式限定在弹框内

**Checkpoint**: US6 独立完成后，结果能边生成边安全展示。

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: 完成跨故事一致性、文档验证和构建检查。

- [X] T051 [P] 更新 `specs/002-fix-selection-translate/quickstart.md`，记录实现后的实际验证注意事项或偏差
- [X] T052 [P] 更新 `specs/002-fix-selection-translate/checklists/translation-ux.md`，按最终规格状态勾选已满足的需求质量项
- [X] T053 运行 `pnpm test` 并修复 `tests/unit/selection.test.ts`、`tests/unit/parser.test.ts`、`tests/unit/richText.test.ts`、`tests/unit/lookupStream.test.ts` 中的失败
- [X] T054 运行 `pnpm build` 并修复 TypeScript/WXT 构建错误
- [ ] T055 按 `specs/002-fix-selection-translate/quickstart.md` 手动验证 9 个场景并记录结果到 `specs/002-fix-selection-translate/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Phase 9)**: Depends on selected user stories being complete

### User Story Dependencies

- **US1 (P1 最新结果)**: Starts after Foundation, no dependency on other stories
- **US2 (P1 图标重现)**: Starts after Foundation, can run alongside US1 but shares `SelectionTranslator` and `useSelection`
- **US3 (P1 长文本阅读)**: Starts after Foundation, can run after or alongside US1/US2 with coordination on `LookupPanel`
- **US4 (P2 发音播放)**: Starts after Foundation; benefits from US3 panel layout but can be implemented independently
- **US5 (P2 当前句子含义)**: Starts after Foundation; depends on shared selection context fields from Setup/Foundation
- **US6 (P3 渐进式富文本)**: Starts after Foundation; should integrate after US1 request filtering to avoid streaming stale content

### MVP Scope

MVP should include Phase 1, Phase 2, US1, US2, and US3. This fixes all P1 bug/UX issues before adding P2/P3 enhancements.

---

## Parallel Opportunities

- T003 and T004 can run in parallel after T001/T002 are understood because they create separate test files.
- T006, T007, and T008 can run in parallel because they create/update separate utility modules.
- T013 and T014 can run in parallel because they add separate request filtering cases.
- T020 and T021 can run in parallel because they add separate selection lifecycle tests.
- T037 and T038 can run in parallel because one targets selection extraction and one targets parser output.
- T044 and T045 can run in parallel because they cover rich text cleaning and stream state separately.
- After Phase 2, US1/US2/US3 can be implemented by separate agents with coordination on shared `components/SelectionTranslator.tsx` and `hooks/useSelection.ts`.

## Parallel Example: User Story 1

```bash
Task: "T013 [US1] Add stale requestId ignored test in tests/unit/lookupStream.test.ts"
Task: "T014 [US1] Add stale selectionId ignored test in tests/unit/lookupStream.test.ts"
```

## Parallel Example: User Story 3

```bash
Task: "T026 [US3] Add 1000-character boundary tests in tests/unit/selection.test.ts"
Task: "T029 [US3] Update dynamic maxHeight calculation in hooks/useFloatingPosition.ts"
```

## Parallel Example: User Story 5

```bash
Task: "T037 [US5] Add current sentence extraction tests in tests/unit/selection.test.ts"
Task: "T038 [US5] Add contextMeaning parser tests in tests/unit/parser.test.ts"
```

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Complete US1 to guarantee latest selection result correctness.
3. Complete US2 to restore stable trigger icon behavior.
4. Complete US3 to make long text readable and enforce 1000-character boundary.
5. Stop and validate quickstart scenarios 1-4 before adding enhancements.

### Incremental Delivery

1. Add US4 pronunciation playback and validate playback/unavailable states.
2. Add US5 contextual meaning and validate only selected word + current sentence are sent.
3. Add US6 progressive rich rendering and validate sanitization before display.
4. Run full quickstart and build/test checks.

### Risk Controls

- Keep API Key in Background only.
- Never render model HTML without `lib/richText.ts` sanitization.
- Keep requestId/selectionId filtering in Content as the final UI freshness guard.
- Do not add full-page translation, history, favorites, or new persistent data.

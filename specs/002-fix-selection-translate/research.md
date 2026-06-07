# Research: 002-fix-selection-translate

## 1. 最新选区与旧请求隔离

**Decision**: 使用 `requestId + selectionId` 双重绑定当前选区。每次有效新选区创建新的 selectionId；每次翻译请求创建新的 requestId。Content 只接受同时匹配当前 selectionId/requestId 的 Port 消息，切换选区或关闭弹框时发送 cancel 并断开旧 Port。

**Rationale**:
- 现有 `useLookupStream` 已用 requestId 忽略旧消息，但 UI 层还需要知道结果属于哪个选区，避免旧选区文本、图标和弹框状态复用。
- requestId 解决请求并发，selectionId 解决 UI 生命周期和用户快速切换选区。
- 不依赖缓存，符合每次触发实时请求的需求。

**Alternatives considered**:
- **只用 requestId**：能过滤旧 chunk，但无法完整表达“当前选区”与图标/弹框生命周期。
- **全局 abort controller**：适合 fetch，但当前跨 Content/Background Port 通信仍需要消息级 ID。

---

## 2. 翻译图标生命周期

**Decision**: 由 `useSelection` 管理图标状态：有效新选区出现图标；触发弹框后立即隐藏；关闭弹框后不恢复旧图标；取消选区或产生新选区时清理旧状态并允许新图标出现。

**Rationale**:
- 当前 bug 表现为图标只出现一次，说明选区状态和弹框状态耦合过紧或未在新选区时重置。
- 将“有效新选区”作为图标出现的唯一入口，能覆盖重复选词、关闭后再选、快速切换等场景。

**Alternatives considered**:
- **关闭弹框后恢复同一图标**：与既有规格“弹框关闭后不重新显示图标，直至下次新选区”冲突。
- **点击触发替代悬停触发**：改变产品交互，不属于本次修复。

---

## 3. 长文本弹框布局

**Decision**: 使用 Floating UI 继续处理定位和边界；弹框宽度保持稳定，最大高度按视口剩余空间计算并设置上限。译文区域滚动；原文默认收起，展开后也设置最大高度和独立滚动。

**Rationale**:
- 现有 `useFloatingPosition` 已支持 maxHeight，适合扩展为动态布局。
- 分离原文区域与译文区域，能避免原文过长挤占译文阅读空间。
- 不让弹框占满页面，符合“不破坏页面体验”原则。

**Alternatives considered**:
- **弹框完全随内容撑开**：长译文会遮挡页面且无法保证可关闭。
- **固定很小高度**：会让长文本阅读频繁滚动，体验差。

---

## 4. 1000 字符上限

**Decision**: 将选区最大长度从当前 500 字符调整为 1000 字符。超过上限时 Content 和 Background 均拒绝发起翻译，并提示用户缩小选区。

**Rationale**:
- 规格澄清已确定最多 1000 字符。
- Content 侧先拦截可减少无效请求；Background 侧二次校验避免绕过 Content。
- 1000 字符足以覆盖普通段落，同时控制等待时间、阅读负担和隐私暴露范围。

**Alternatives considered**:
- **不设上限**：隐私和性能风险高。
- **保留 500 字符**：与新规格不一致，不能覆盖用户提出的“一段文本”场景。

---

## 5. 当前句子上下文提取

**Decision**: Content 从选区所在 DOM Range 向外提取最近可理解句子片段，只发送选中词和当前句子。若无法可靠获得句子，则只发送选中词并在结果中降级展示通用释义。

**Rationale**:
- 语境释义需要当前句子，但 constitution 要求隐私最小化。
- 在 Content 侧提取句子可避免 Background 接触更多页面结构。
- 只发送当前句子，不发送段落或前后句，符合澄清结果。

**Alternatives considered**:
- **发送前后句或段落**：语义可能更完整，但超出隐私最小化边界。
- **完全不发送上下文**：无法实现“这个单词在当前句子中的意思”。

---

## 6. 受限富文本渐进渲染

**Decision**: 允许模型输出受限 HTML 片段，Content 端在渲染前清洗，只保留安全标签和明确允许的 Tailwind 类。禁止 `script`、事件属性、内联 style、远程资源和未知标签；清洗后结果为空时降级为纯文本。

**Rationale**:
- 用户希望减少完整 JSON 结构等待时间，实现边输出边渲染。
- 让模型输出受限富文本能更早形成可读排版，但必须在 Content 端清洗。
- Shadow UI 负责样式隔离，清洗负责内容安全，两者缺一不可。

**Alternatives considered**:
- **继续完整 JSON 后渲染**：稳定但慢，不满足体验目标。
- **允许完整 HTML**：安全风险过高，可能执行脚本或污染页面。
- **只输出纯文本**：安全但无法达到更好的排版体验。

---

## 7. 词典结果结构演进

**Decision**: 保留结构化 `LookupResult` 作为词典最终状态，同时增加 `contextMeaning`、`pronunciation` 和 `richHtml` 等可选字段。流式阶段显示清洗后的富文本或纯文本预览；完成后若结构化字段可用，则切换为词典卡片。

**Rationale**:
- 现有组件依赖 `LookupResult`，完全替换为 HTML 会扩大改动面。
- 最终结构化卡片便于发音按钮、语境释义、词性释义统一展示。
- 可选字段兼容旧解析逻辑，降低一次性迁移风险。

**Alternatives considered**:
- **完全废弃 JSON 结构**：会让发音、语境释义、测试和 UI 状态变得不稳定。
- **保持旧结构不变**：无法承载语境释义和发音状态。

---

## 8. 发音播放

**Decision**: 优先使用浏览器 Web Speech API 播放英文单词；若不可用或播放失败，在 UI 中展示不可用状态，不阻塞释义。发音资源不持久化、不发送到外部服务。

**Rationale**:
- 不新增外部发音 API，避免密钥、网络和版权问题。
- 满足“读单词播放按钮”的 MVP 需求。
- Web Speech 可用性因浏览器/系统语音包而异，所以需要明确失败态。

**Alternatives considered**:
- **第三方音频接口**：发音质量可控，但新增外部依赖和隐私/稳定性风险。
- **LLM 返回音频链接**：不可控且可能引入远程资源跟踪。

---

## 9. 测试策略

**Decision**: 使用 Vitest 聚焦纯逻辑和状态约束：选区长度与无效内容校验、当前句子提取、富文本清洗、LookupResult 扩展解析、过期请求过滤 reducer/hook 辅助逻辑。

**Rationale**:
- 浏览器扩展 UI 端到端测试成本较高，本阶段先覆盖最容易回归的纯逻辑。
- quickstart 提供人工浏览器验证路径，覆盖图标、弹框、发音和流式展示。

**Alternatives considered**:
- **只做人工测试**：对富文本清洗和选区状态回归风险不足。
- **立即引入 E2E 框架**：成本较高，当前仓库尚无对应基础设施。

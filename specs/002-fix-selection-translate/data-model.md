# Data Model: 002-fix-selection-translate

## 1. SelectionContext（选区上下文）

Content Script 内存态，不持久化。用于绑定图标、弹框和翻译请求。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `selectionId` | string | yes | 每次有效新选区生成的 UUID |
| `text` | string | yes | trim 后的选中文本，长度 1-1000 |
| `mode` | `dictionary` \| `translation` | yes | ≤5 个词为词典模式，>5 个词为翻译模式 |
| `sentence` | string | no | 选中词所在当前句子，仅语境释义使用 |
| `rect` | DOMRect-like | yes | 用于图标和弹框定位 |
| `validationError` | string | no | 空白、纯标点、超长等用户提示 |

**校验规则**:
- `text.length <= 1000`
- 纯空白、纯标点、纯符号不进入翻译请求
- `sentence` 只允许包含当前句子；无法可靠取得时为空

## 2. LookupRequest（翻译请求）

Content 通过 Port 发送给 Background。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | `"start"` | yes | 开始流式请求 |
| `requestId` | string | yes | 每次请求 UUID |
| `selectionId` | string | yes | 对应当前选区 |
| `text` | string | yes | 选中文本 |
| `mode` | `dictionary` \| `translation` | yes | 查词/翻译模式 |
| `sentence` | string | no | 当前句子，仅在可可靠取得时发送 |

**状态约束**:
- 新请求开始前必须取消旧请求
- Background 仍需重复校验 `text` 长度和有效性
- Background 不接收 DOM 信息，只接收必要文本

## 3. LookupStreamState（流式状态）

Content 内存态，用于驱动弹框。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `status` | LookupStatus | yes | 当前请求状态 |
| `selectionId` | string \| null | yes | 当前状态所属选区 |
| `requestId` | string \| null | yes | 当前状态所属请求 |
| `mode` | LookupMode | yes | 词典或翻译 |
| `buffer` | string | yes | 原始流式文本 |
| `safeHtml` | string | no | 清洗后的受限富文本 |
| `hasFirstChunk` | boolean | yes | 是否收到首个 chunk |
| `result` | LookupResult \| null | yes | 完成后的结构化结果 |
| `errorCode` | LookupErrorCode | no | 错误码 |
| `errorMessage` | string | no | 用户可读错误 |

### LookupStatus

- `idle`: 无请求
- `loading`: 等待首个 chunk
- `streaming`: 已收到 chunk，逐步展示
- `success`: 流结束且可展示最终内容
- `error`: API、解析或播放外的请求错误
- `empty`: 无有效选区
- `config_missing`: 未配置 API Key

## 4. LookupResult（查词/翻译结果）

结构化最终结果，兼容现有字段并增加语境和发音信息。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `word` | string | yes | 查询词或原文 |
| `phonetic` | string | no | 音标或拼音 |
| `primaryMeaning` | string | yes | 主要释义或译文 |
| `contextMeaning` | string | no | 单词在当前句子中的意思 |
| `definitions` | Definition[] | yes | 词性释义或翻译分组 |
| `pronunciation` | PronunciationInfo | no | 发音播放能力 |
| `richHtml` | string | no | 清洗后的受限富文本展示片段 |

### Definition

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `pos` | string | yes | 词性或分组标签 |
| `meanings` | string[] | yes | 释义列表 |
| `example` | Example | no | 例句 |

### Example

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `en` | string | yes | 例句原文 |
| `zh` | string | no | 中文解释 |

### PronunciationInfo

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `available` | boolean | yes | 是否可播放 |
| `label` | string | no | 按钮或失败提示文案 |
| `lang` | string | no | 朗读语言，如 `en-US` |

## 5. RichResultFragment（受限富文本片段）

只在弹框内展示，不作为可信 DOM。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `raw` | string | yes | 模型原始输出片段 |
| `safeHtml` | string | yes | 清洗后的 HTML |
| `plainTextFallback` | string | yes | 清洗失败或为空时的纯文本降级 |
| `sanitizationStatus` | `clean` \| `stripped` \| `fallback` | yes | 清洗结果状态 |

**允许内容**:
- 标签：`div`, `p`, `span`, `ul`, `ol`, `li`, `strong`, `em`, `br`
- 属性：`class`，且只能包含允许列表中的 Tailwind 原子类
- 禁止：`script`, `style`, `iframe`, 事件属性，远程资源属性，任意内联 style

## 6. PanelDisplayState（弹框展示状态）

Content UI 内存态。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `open` | boolean | yes | 弹框是否打开 |
| `originalExpanded` | boolean | yes | 原文是否展开 |
| `maxHeight` | number | yes | 弹框最大高度 |
| `contentMaxHeight` | number | yes | 内容滚动区域最大高度 |
| `originalMaxHeight` | number | yes | 原文展开后的最大高度 |
| `placement` | string | yes | Floating UI 计算结果 |

## 7. 状态流转

```text
新有效选区
  -> SelectionContext(selectionId) 创建，图标显示
  -> 悬停图标：弹框打开，图标隐藏，旧请求 cancel
  -> LookupRequest(requestId, selectionId, text, sentence?) 发送到 Background
  -> loading：等待首 chunk
  -> streaming：buffer 增长，safeHtml 持续清洗后展示
  -> success：最终 LookupResult 展示，保留长文本滚动与原文展开状态
  -> close/new selection：取消旧 requestId，清理旧弹框，不恢复旧图标
```

# Messaging Contract: Content ↔ Background

本功能沿用 `lookupStream` Port 作为流式翻译通道，并扩展消息体以支持选区隔离、当前句子上下文、受限富文本和取消旧请求。

## Port: `lookupStream`

**方向**: Content Script `chrome.runtime.connect` → Background 流式推送

### Content → Background

```typescript
interface LookupStreamStart {
  type: 'start';
  requestId: string;
  selectionId: string;
  text: string;
  mode: 'dictionary' | 'translation';
  sentence?: string;
}

interface LookupStreamCancel {
  type: 'cancel';
  requestId: string;
  selectionId?: string;
}
```

### Background → Content

```typescript
interface LookupStreamChunk {
  type: 'chunk';
  requestId: string;
  selectionId: string;
  delta: string;
  format: 'text' | 'html';
}

interface LookupStreamDone {
  type: 'done';
  requestId: string;
  selectionId: string;
  data?: LookupResult;
}

interface LookupStreamError {
  type: 'error';
  requestId: string;
  selectionId: string;
  code:
    | 'CONFIG_MISSING'
    | 'INVALID_SELECTION'
    | 'API_ERROR'
    | 'PARSE_ERROR'
    | 'SANITIZE_EMPTY';
  message: string;
}
```

## LookupResult

```typescript
interface LookupResult {
  word: string;
  phonetic?: string;
  primaryMeaning: string;
  contextMeaning?: string;
  definitions: Definition[];
  pronunciation?: PronunciationInfo;
  richHtml?: string;
}

interface Definition {
  pos: string;
  meanings: string[];
  example?: Example;
}

interface Example {
  en: string;
  zh?: string;
}

interface PronunciationInfo {
  available: boolean;
  label?: string;
  lang?: string;
}
```

## 状态与取消规则

- Content 每次新选区创建新的 `selectionId`，每次请求创建新的 `requestId`。
- Content 只处理同时匹配当前 `selectionId` 和当前 `requestId` 的消息。
- 用户关闭弹框、取消选区或切换新选区时，Content MUST 发送 `cancel` 并断开旧 Port。
- Background 收到 `cancel` 后 MUST 停止继续发送该 `requestId` 的 chunk/done/error。
- Background 仍 MUST 校验 `text` 长度不超过 1000 且不是空白/纯标点。

## 隐私约束

- `sentence` 只能包含选中词所在当前句子；无法可靠取得时省略。
- Content MUST NOT 发送段落、前后句或页面 HTML。
- Background MUST NOT 返回或暴露 API Key。

## 渐进式富文本约束

- `format: 'html'` 表示 `delta` 可能包含受限 HTML 片段，但 Content 仍必须清洗后才能展示。
- `format: 'text'` 表示纯文本片段，可直接作为文本节点或转义后展示。
- 即使 Background 尝试约束模型输出，Content 仍是最终安全边界。

### Allowed Rich Text Markup

Allowed tags: `div`, `p`, `span`, `ul`, `ol`, `li`, `strong`, `em`, `br`

Allowed attributes: `class` only.

Allowed class tokens:

- Layout: `space-y-1`, `space-y-2`, `space-y-3`
- Text: `text-xs`, `text-sm`, `text-base`, `font-medium`, `font-semibold`, `font-bold`, `leading-relaxed`
- Color: `text-gray-500`, `text-gray-600`, `text-gray-700`, `text-gray-900`, `text-blue-600`, `text-emerald-600`
- Spacing: `mt-1`, `mt-2`, `mb-1`, `mb-2`, `pl-4`
- List: `list-disc`, `list-decimal`

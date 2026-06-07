# Messaging Contract: Content ↔ Background

基于 `@webext-core/messaging` 定义类型安全协议。

## 流式查词：`lookupStream`（Port）

**方向**: Content Script `chrome.runtime.connect` → Background 流式推送

### 连接

```typescript
// Content 发起
const port = chrome.runtime.connect({ name: 'lookupStream' });
port.postMessage({ type: 'start', text, requestId } as LookupStreamStart);
```

### Port 消息类型

```typescript
// Content → Background
interface LookupStreamStart {
  type: 'start';
  text: string;
  requestId: string;
}

interface LookupStreamCancel {
  type: 'cancel';
  requestId: string;
}

// Background → Content
interface LookupStreamChunk {
  type: 'chunk';
  requestId: string;
  delta: string;      // 本帧新增文本
}

interface LookupStreamDone {
  type: 'done';
  requestId: string;
  data?: LookupResult; // 词典模式解析后的结构化结果；翻译模式可省略
}

interface LookupStreamError {
  type: 'error';
  requestId: string;
  code: 'CONFIG_MISSING' | 'INVALID_SELECTION' | 'API_ERROR' | 'PARSE_ERROR';
  message: string;
}
```

### 流式约束

- 首个 `chunk` 到达前，Content MUST 保持 `loading` 态
- 收到 `chunk` 后切换 `streaming`，`delta` 追加至 buffer 并渲染
- 收到 `done` 后：词典模式用 `data` 切换结构化 UI；翻译模式以 buffer 为最终译文
- 用户切换选区或关闭弹框时 Content 发送 `cancel`，Background 中止 stream

## 消息：`getSettings`

**方向**: Popup / Content → Background

### Response

```typescript
interface SettingsResponse {
  hasApiKey: boolean;
  model: string;
}
```

## 消息：`saveSettings`

**方向**: Popup → Background

### Request

```typescript
interface SaveSettingsRequest {
  siliconflowApiKey?: string; // 空字符串表示清除
  model?: string;
}
```

### Response

```typescript
interface SaveSettingsResponse {
  ok: boolean;
  message?: string;
}
```

## 安全约束

- `siliconflowApiKey` 仅 Background 读写 storage，响应中永不返回完整 Key
- Content Script 不得直接 `fetch` 硅基流动 API
- 所有外部请求仅允许 Background 发起

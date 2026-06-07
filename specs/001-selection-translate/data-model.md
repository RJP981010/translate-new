# Data Model: 001-selection-translate

## 1. LookupResult（查词结果）

从硅基流动 LLM 解析并校验后的结构化数据，驱动弹框渲染。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `word` | string | ✅ | 查询词（规范化后的选中文本） |
| `phonetic` | string | ❌ | IPA 音标，如 `/'welkəm/` |
| `primaryMeaning` | string | ✅ | 主要中文释义 |
| `definitions` | Definition[] | ✅ | 按词性分组的释义列表 |

### Definition

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `pos` | string | ✅ | 词性缩写：`n.` `v.` `adj.` `excl.` 等 |
| `meanings` | string[] | ✅ | 该词性下的中文释义 |
| `example` | Example | ❌ | 例句 |

### Example

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `en` | string | ✅ | 英文例句 |
| `zh` | string | ✅ | 中文翻译 |

### 流式状态 LookupStreamState

| 字段 | 类型 | 说明 |
|------|------|------|
| `status` | LookupStatus | 见下方枚举 |
| `buffer` | string | 已接收的流式文本累积 |
| `hasFirstChunk` | boolean | 是否已收到首个 chunk（false 时展示 loading） |
| `result` | LookupResult \| null | 流结束且解析成功后的结构化结果 |

### 状态枚举 LookupStatus

- `idle` — 无请求
- `loading` — 已发起请求，等待首个 chunk
- `streaming` — 已收到 chunk，内容逐步更新
- `success` — 流结束，结构化结果就绪
- `error` — 有 ErrorInfo
- `empty` — 选区无效

---

## 2. UserSettings（用户设置）

持久化于 `chrome.storage.local`。

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `siliconflowApiKey` | string | ❌ | `""` | 硅基流动 API Key |
| `model` | string | ✅ | `Qwen/Qwen2.5-7B-Instruct` | 查词所用模型 |

**校验规则**:
- `siliconflowApiKey` 保存时 trim，长度 > 0 才视为已配置
- `model` 非空字符串

---

## 3. LookupRequest（查词请求）

Content → Background 消息体。

| 字段 | 类型 | 说明 |
|------|------|------|
| `text` | string | 用户选中文本（已 trim） |
| `requestId` | string | UUID，用于取消过期响应 |

**校验规则**:
- `text` 长度 1–500
- 纯数字/纯标点拒绝，返回 `empty` 态

---

## 4. SelectionState（选区状态）

Content Script 内存态，不持久化。

| 字段 | 类型 | 说明 |
|------|------|------|
| `text` | string | 当前选中文本 |
| `rect` | DOMRect | 选区包围盒，供 Floating UI 定位 |
| `isVisible` | boolean | 图标是否显示 |

---

## 5. 状态流转

```text
[mouseup 有选区] → SelectionState.isVisible=true（显示图标）
                → 悬停图标 → 弹框出现+图标隐藏，LookupStatus=loading
                → Background 开启 stream（Port 推送 chunk，不缓存）
                    ├─ 首 chunk → LookupStatus=streaming，buffer 递增渲染
                    ├─ 流结束 → 词典模式 zod 解析 → LookupStatus=success
                    ├─ 无 Key → LookupStatus=error (CONFIG_MISSING)
                    └─ API/解析失败 → LookupStatus=error

[关闭弹框] → 弹框消失，图标不恢复
[新选区] → 取消旧 requestId，重置状态，可再次显示图标
```

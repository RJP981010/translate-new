# Research: 001-selection-translate

## 1. 浏览器扩展工程框架

**Decision**: 使用 [WXT](https://wxt.dev) 初始化项目

**Rationale**:
- 开箱即用的 MV3 支持、HMR、TypeScript、文件化 entrypoints
- 内置 `createShadowRootUi`，避免手写 Shadow DOM 注入与样式隔离
- 社区活跃，适合单人工程化开发

**Alternatives considered**:
- **手写 Manifest + Vite**：灵活但样板代码多，HMR 与多 entry 配置成本高
- **Plasmo**：类似 WXT，生态略小，文档以 React 为主但 WXT 更通用

---

## 2. 弹框与图标定位（边界处理）

**Decision**: 使用 `@floating-ui/dom` 的 `computePosition` + `offset` + `flip` + `shift` + `size`

**Rationale**:
- 行业标准定位库（原 Popper.js 继任者）
- `flip()` 处理靠底/靠顶翻转，`shift()` 处理左右溢出
- `size()` 可限制弹框最大高度并在视口内滚动
- 不手写坐标计算逻辑

**Alternatives considered**:
- **手写 getBoundingClientRect 计算**：边界情况多，维护成本高
- **@popperjs/core**：已迁移至 Floating UI，不再推荐新项目使用

**边界策略**:
```
placement: 'bottom' (图标相对选区)
middleware: [offset(8), flip(), shift({padding: 8}), size({apply: maxHeight})]

弹框相对图标:
placement: 'bottom-start'
middleware: [offset(6), flip({fallbackPlacements: ['top-start','top-end','bottom-end']}), shift({padding: 12})]
```

---

## 3. Content Script UI 技术栈

**Decision**: React 19 + Tailwind CSS 4 + Shadow Root UI（WXT `cssInjectionMode: 'ui'`）

**Rationale**:
- React 组件化适合弹框多状态（加载/成功/错误）
- Tailwind 在 Shadow DOM 内通过 WXT UI 模式注入，样式不污染宿主页
- 避免引入完整 Ant Design（体积大），用 Tailwind 复刻参考 UI 卡片风格

**Alternatives considered**:
- **Vanilla JS**：弹框状态与列表渲染手写成本高
- **Ant Design**：包体积大，Shadow DOM 主题定制麻烦

**辅助 UI 库**:
- `lucide-react`：设置、关闭、加载图标
- `@radix-ui/react-scroll-area`：弹框内容区滚动（可选，视实现而定）

---

## 4. 扩展内通信

**Decision**: `@webext-core/messaging` 定义类型安全消息协议

**Rationale**:
- Background 统一代理硅基流动 API，Content Script 不接触 API Key
- 类型化 `lookupWord(text)` 请求/响应，减少手写 `chrome.runtime.sendMessage` 样板

**Alternatives considered**:
- **原生 messaging**：可行但缺乏类型约束，易出错

---

## 5. 大模型接入（硅基流动）

**Decision**: Background 使用 `openai` npm 包，指向硅基流动 OpenAI 兼容端点

**Rationale**:
- 硅基流动 API 兼容 OpenAI Chat Completions（`https://api.siliconflow.cn/v1`）
- 用户自备 API Key，符合隐私原则
- 通过 System Prompt + `response_format: json_object`（若模型支持）或 JSON 解析获取结构化查词结果

**默认模型**: `Qwen/Qwen2.5-7B-Instruct`（速度快、成本低、中文好；用户可在设置中修改）

**Alternatives considered**:
- **直接 fetch 手写**：可行但 openai SDK 处理错误与类型更方便
- **传统翻译 API（DeepL/Google）**：无法生成词性/例句结构化释义，不符合参考 UI

---

## 6. 查词结果结构化

**Decision**: LLM 返回固定 JSON Schema，用 `zod` 校验后渲染

**Rationale**:
- 弹框 UI 需要稳定字段（phonetic、definitions、examples）
- zod 在 Background 校验，无效响应触发重试或错误态

**Alternatives considered**:
- **纯文本 Markdown 解析**：不稳定，易受模型输出格式影响

---

## 7. 悬停交互防闪烁

**Decision**: 图标与弹框之间使用「安全悬停区域」：统一父容器 + `mouseenter`/`mouseleave` 延迟 150ms + `pointer-events` 桥接

**Rationale**:
- 鼠标从图标移向弹框时，经过间隙不应关闭
- 不引入额外库，用 React state + timeout 即可

---

## 8. 流式输出（Stream）

**Decision**: 硅基流动 API `stream: true` + Background `chrome.runtime.Port` 推送 chunk 至 Content Script

**Rationale**:
- 用户要求首字符前 loading、之后流式展示，避免长时间空白等待
- OpenAI SDK 原生支持 `for await (const chunk of stream)`
- `sendMessage` 不适合传流，Port 长连接可逐 chunk `postMessage`
- 翻译模式直接追加文本；词典模式流式阶段显示预览文本，结束后 zod 解析 JSON 切换结构化视图

**UI 状态机**: `loading`（无 chunk）→ `streaming`（有 chunk，内容递增）→ `success`（流结束且解析成功）/ `error`

**Alternatives considered**:
- **非流式一次性返回**：首字等待时间长，不符合需求
- **Content 直接 fetch stream**：API Key 暴露在 Content，违反 constitution

---

## 9. 工程化工具链

**Decision**:

| 工具 | 用途 |
|------|------|
| pnpm | 包管理 |
| TypeScript strict | 类型安全 |
| ESLint + Prettier | 代码规范 |
| Vitest | 单元测试（zod schema、prompt 解析、选区工具） |
| 自定义 `useLookupStream` hook | Port 流式查词，管理 loading/streaming/success 状态（替代 react-query） |

**Rationale**: 满足用户「工程化、尽量用库」要求，测试聚焦可单测的纯逻辑。

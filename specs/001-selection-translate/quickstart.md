# Quickstart: 浏览器划词翻译插件

## 前置条件

- Node.js 20+
- pnpm 9+
- Chrome 或 Edge 浏览器
- 硅基流动账号与 API Key（[cloud.siliconflow.cn](https://cloud.siliconflow.cn)）

## 安装与开发

```bash
# 初始化项目（implement 阶段执行）
pnpm install
pnpm dev          # WXT 开发模式，输出 .output/chrome-mv3-dev
```

加载扩展：
1. 打开 `chrome://extensions`
2. 开启「开发者模式」
3. 「加载已解压的扩展程序」→ 选择 `.output/chrome-mv3-dev`

## 配置 API Key

1. 点击浏览器工具栏中的插件图标
2. 填入硅基流动 API Key
3. 可选：修改模型（默认 `Qwen/Qwen2.5-7B-Instruct`）
4. 保存

## 手动验证场景

### 场景 1：核心划词查词（P1）

1. 打开任意英文文章页（如 Wikipedia 英文条目）
2. 选中单词 `welcome`
3. **预期**：选区下方出现翻译图标
4. 鼠标悬停图标
5. **预期**：先见 loading，随后内容逐字/逐段出现；流结束后词典卡片含音标、词性、例句
6. 移开鼠标或点关闭
7. **预期**：弹框消失，页面原文未变

### 场景 2：视口边界（P1）

1. 滚动到页面最底部，选中靠近底边的文字
2. 悬停图标
3. **预期**：弹框向上翻转，内容完整可见
4. 在页面最右侧选词重复
5. **预期**：弹框向左偏移，不被裁切

### 场景 3：未配置 API Key（P2）

1. 清空设置中的 API Key
2. 选词并悬停图标
3. **预期**：弹框提示「请先配置 API Key」，含跳转设置入口

### 场景 4：无效选区

1. 选中纯数字 `12345` 或空白
2. **预期**：提示「无可查词内容」，不发起 API 请求

### 场景 5：流式输出

1. 选中较长句子，悬停图标
2. **预期**：弹框立即显示 loading（非空白）
3. **预期**：1–3 秒内首个文字出现，内容持续增量更新至完成

### 场景 6：错误恢复

1. 填入无效 API Key，选词悬停
2. **预期**：显示错误信息
3. 点击重试或修正 Key 后再次悬停
4. **预期**：正常展示查词结果

## 运行单元测试

```bash
pnpm test
```

覆盖：`lib/selection.ts` 选区校验、`lib/siliconflow/parser.ts` JSON 解析。

## 构建发布包

```bash
pnpm build
# 产物：.output/chrome-mv3/
```

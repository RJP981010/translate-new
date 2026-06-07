<!--
Sync Impact Report
==================
Version change: 1.0.0 → 1.1.0
Modified principles:
  - 6 条详细原则 → 4 条精简原则（合并性能/可插拔/流程要求）
Removed sections:
  - 技术约束与质量标准（详细表格）
  - 开发流程与质量门禁（详细门禁清单）
Added sections: None
Templates requiring updates: 无需修改（仍兼容）
Follow-up TODOs: None
-->

# Translator 浏览器翻译插件 Constitution

## Core Principles

### I. 不破坏页面体验

- 翻译不得不可逆地覆盖原文，须支持查看/切换
- 尽量不破坏原页面布局和交互
- 默认不自动翻译全站，由用户主动触发

### II. 扩展分层架构

- 目标平台：Chrome/Edge（Manifest V3）
- **Background**：调翻译 API、管密钥和请求
- **Content Script**：读页面文字、展示译文
- **Popup**：设置与操作入口
- API 密钥不得写在 Content Script 里

### III. 隐私最小化

- 只发送翻译所需的文本，不采集无关数据
- 权限按需申请，新增权限须在 spec 里说明
- 密钥存 `chrome.storage`，禁止硬编码

### IV. MVP 优先

- 先做最小可用功能（建议：选中文字 → 翻译 → 显示结果）
- 每个功能按用户故事独立交付、独立验证
- 没写进 spec 的不做

## 基本约束

- 语言：TypeScript
- 翻译接口与页面逻辑分开，方便以后换翻译源
- 按 Spec Kit 流程走：specify → plan → tasks → implement

## Governance

- 修订本文件时更新版本号和日期
- 有冲突时以本文件为准

**Version**: 1.1.0 | **Ratified**: 2025-06-07 | **Last Amended**: 2025-06-07

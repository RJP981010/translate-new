# 翻译体验需求质量清单: 划词翻译体验修复与增强

**目的**: 在进入实现规划前，检查本功能需求是否完整、清晰、一致且可衡量
**创建日期**: 2026-06-07
**功能规格**: [spec.md](../spec.md)

**说明**: 本清单由 `/speckit-checklist` 基于功能上下文和需求生成。清单检查的是“需求写得是否足够好”，不是检查代码或实现行为是否正确。

## 需求完整性

- [x] CHK001 是否同时定义了“已完成的旧请求”和“仍在进行中的旧请求”不会污染最新结果的需求？[完整性, Spec §User Story 1, Spec §FR-001, Spec §FR-002]
- [x] CHK002 是否完整记录了触发图标在首次选区、重复选区、取消选区和关闭弹框后的生命周期需求？[完整性, Spec §User Story 2, Spec §FR-003, Spec §FR-004]
- [x] CHK003 是否同时定义了译文和原文的长文本展示需求，包括收起态和展开态？[完整性, Spec §User Story 3, Spec §FR-005, Spec §FR-006, Spec §FR-007]
- [x] CHK004 是否定义了发音在可用、不可用、播放失败和播放被中断时的需求？[完整性, Spec §User Story 4, Spec §FR-008, Spec §Edge Cases]
- [x] CHK005 是否定义了普通句子上下文、多义词、缺失句子上下文下的语境释义需求？[完整性, Spec §User Story 5, Spec §FR-009, Spec §FR-010]
- [x] CHK006 是否定义了渐进式展示在加载中、部分内容、最终内容、异常内容和失败状态下的需求？[完整性, Spec §User Story 6, Spec §FR-011, Spec §FR-013]

## 需求清晰度

- [x] CHK007 “有效新选区”是否定义得足够清楚，能区分单词、短语、长文本、空文本、纯标点和超长文本？[清晰度, Spec §FR-001, Spec §FR-016, Spec §Edge Cases]
- [x] CHK008 “合理动态尺寸”和“最大高度”是否已经用可衡量的标准量化或限定？[歧义, Spec §FR-005, Spec §Edge Cases]
- [x] CHK009 “安全标签”和“允许的样式类”是否已定义，或是否明确要求在 plan 阶段给出验收标准？[清晰度, Spec §Clarifications, Spec §FR-013]
- [x] CHK010 “当前句子”是否定义得足够清楚，能覆盖文本跨 DOM 节点、标点边界和非英文标点的情况？[清晰度, Spec §Assumptions, Spec §Edge Cases]
- [x] CHK011 对无效选区的“轻量提示”是否足够清楚，能保证面向用户的文案和行为一致？[清晰度, Spec §Edge Cases]
- [x] CHK012 发音播放入口的显著性是否通过位置或可见性需求说明，而不是只依赖功能意图推断？[歧义, Spec §User Story 4, Spec §FR-008]

## 需求一致性

- [x] CHK013 1000 字符上限在边界场景、功能需求和成功标准中的表述是否一致？[一致性, Spec §Edge Cases, Spec §FR-016, Spec §SC-003, Spec §Assumptions]
- [x] CHK014 隐私最小化需求是否与语境释义需求、句子提取假设保持一致？[一致性, Spec §FR-009, Spec §FR-014, Spec §Assumptions]
- [x] CHK015 富文本渐进展示需求是否与“样式不得影响原网页”的要求保持一致？[一致性, Spec §User Story 6, Spec §FR-012, Spec §FR-013]
- [x] CHK016 触发图标行为是否与弹框关闭、选区切换相关需求保持一致？[一致性, Spec §User Story 2, Spec §FR-004, Spec §Edge Cases]

## 验收标准质量

- [x] CHK017 所有 P1 用户故事是否都有可衡量的成功标准，覆盖结果正确性、重复使用和长文本可读性？[验收标准, Spec §User Story 1, Spec §User Story 2, Spec §User Story 3, Spec §Success Criteria]
- [x] CHK018 “收到首个有效 chunk 后 100ms 内出现可阅读内容”是否能被客观测量并记录？[可衡量性, Spec §SC-007]
- [x] CHK019 发音成功目标是否针对预期语言范围和资源不可用场景具备可衡量性？[可衡量性, Spec §SC-005, Spec §Assumptions]
- [ ] CHK020 语境释义准确率目标是否定义了明确的测试集或评估依据？[可衡量性, Spec §SC-006]
- [x] CHK021 “不破坏页面布局”的标准是否能针对视口边界、页面脚本错误和弹框可关闭性进行衡量？[可衡量性, Spec §SC-008]

## 场景覆盖

- [x] CHK022 结果新鲜度、图标重新出现、长文本阅读、发音、语境释义和渐进展示的主流程是否都能独立覆盖？[覆盖度, Spec §User Scenarios & Testing]
- [x] CHK023 是否记录了同词重复查询、不同词重复查询和快速切换选区的替代流程？[覆盖度, Spec §User Story 1, Spec §User Story 2]
- [x] CHK024 是否记录了网络失败、服务超时、生成内容格式异常和播放失败的异常流程？[覆盖度, Spec §User Story 4, Spec §User Story 6, Spec §Edge Cases]
- [x] CHK025 是否定义了翻译失败后的重试需求，以及切换选区后恢复到干净状态的需求？[缺口, Spec §Edge Cases]
- [ ] CHK026 是否定义了弹框的键盘访问、焦点管理、屏幕阅读器标签和减少动画偏好等无障碍需求？[缺口]

## 边界场景覆盖

- [x] CHK027 是否定义了选区靠近视口四边时的展示边界，以及内容超过可用空间时的弹框尺寸要求？[边界场景覆盖, Spec §Edge Cases, Spec §FR-005]
- [x] CHK028 是否定义了原文展开后仍然过长时的展示需求？[边界场景覆盖, Spec §Edge Cases, Spec §FR-006, Spec §FR-007]
- [x] CHK029 是否定义了播放过程中弹框关闭或用户切换新选区时的发音行为？[边界场景覆盖, Spec §Edge Cases]
- [x] CHK030 是否定义了生成内容不完整、不安全，或部分可流式展示但语义尚未完整时的需求？[边界场景覆盖, Spec §User Story 6, Spec §FR-013]

## 安全与隐私需求

- [x] CHK031 是否分别为选中文本翻译和当前句子提取定义了数据最小化需求？[安全/隐私, Spec §FR-014, Spec §Assumptions]
- [x] CHK032 富文本清洗的安全需求是否足够具体，能覆盖脚本、事件处理器、远程跟踪和样式泄漏风险？[安全/隐私, Spec §FR-013]
- [x] CHK033 是否清楚要求生成内容不得访问选中文本和当前句子以外的页面数据？[安全/隐私, Spec §FR-013, Spec §FR-014]
- [x] CHK034 是否定义了清洗后必要展示内容被移除，或结果变得不可读时的失败处理需求？[缺口, Spec §FR-013]

## 依赖与假设

- [x] CHK035 是否记录了发音资源及其失败模式相关的外部依赖假设？[依赖, Spec §User Story 4, Spec §Assumptions]
- [x] CHK036 语言范围假设是否与发音和语境释义需求保持一致？[假设, Spec §FR-008, Spec §FR-009, Spec §Assumptions]
- [x] CHK037 浏览器页面限制是否与不在范围内的声明、以及“不破坏页面体验”原则保持一致？[依赖, Spec §明确不在本版本范围, Constitution §I]

## 备注

- 关注范围：综合 UX 交互、安全与隐私、渐进式渲染、长文本边界、发音播放和语境释义。
- 严格程度：标准。
- 使用者/时机：需求作者在 `/speckit-plan` 前自查。
- 2026-06-07 实现收尾复核：除 CHK020（缺少明确多义词测试集定义）和 CHK026（未定义键盘访问、焦点管理、屏幕阅读器标签、减少动画偏好等无障碍需求）外，其余需求质量项已由 spec、plan、contracts 或 quickstart 覆盖。

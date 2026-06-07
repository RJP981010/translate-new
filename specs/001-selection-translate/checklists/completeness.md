# Requirements Completeness Checklist: 浏览器划词翻译

**Purpose**: 检测 spec/plan 需求是否完整、清晰、可测量，覆盖主流程、异常流与非功能维度（事后补检，implement 已完成）
**Created**: 2026-06-07
**Feature**: [spec.md](../spec.md)

**Note**: 本清单由 `/speckit.checklist` 生成，检验的是**需求文档质量**，非代码实现。

## Requirement Completeness

- [ ] CHK001 是否定义了翻译触发图标的具体展示条件（最小选区长度、有效字符类型）？[Completeness, Spec §Edge Cases]
- [ ] CHK002 是否规定了图标与弹框的视觉规格或可引用设计基准（尺寸、间距、品牌标识）？[Gap, Spec §Assumptions]
- [ ] CHK003 是否完整定义词典模式结构化卡片的所有必填字段（音标、词性、释义、例句）及其缺失时的展示规则？[Completeness, Spec §FR-003a]
- [ ] CHK004 是否完整定义翻译模式弹框的最终布局（原文/译文分区、排版层级）？[Completeness, Spec §FR-003b]
- [ ] CHK005 是否定义中文选区在词典模式与翻译模式下的字段差异及必填项？[Completeness, Spec §FR-003a/FR-003b]
- [ ] CHK006 是否定义设置页除 API Key 外所有可配置项（如默认模型名）的范围、默认值与校验规则？[Gap, Spec §Key Entities]
- [ ] CHK007 是否明确列出插件所需浏览器权限及每项权限的用途说明？[Gap, Constitution §III]
- [ ] CHK008 是否定义弹框最大高度、内容溢出时的滚动行为？[Gap, Spec §SC-003]
- [ ] CHK009 是否定义悬停触发与 mouseleave 关闭的时序细节（延迟、防抖、是否允许移入弹框后保持打开）？[Gap, Spec §FR-002/FR-004]
- [ ] CHK010 是否定义快速切换选区时旧请求的取消与 UI 状态切换规则？[Completeness, Spec §Edge Cases]

## Requirement Clarity

- [ ] CHK011 「≤5 词」的计数规则是否无歧义（连字符、缩写、中文分词、标点是否计入）？[Clarity, Spec §FR-003]
- [ ] CHK012 「选区正下方」图标的定位基准是否明确（选区 DOMRect、行高偏移量）？[Clarity, Spec §FR-001]
- [ ] CHK013 「立即隐藏图标」是否在 spec 中与弹框 loading 态的出现时机一一对应、无歧义？[Clarity, Spec §FR-002a/FR-009]
- [ ] CHK014 「流式阶段先展示逐步出现的文本预览；流结束后解析为结构化卡片」的切换条件是否可客观判定？[Clarity, Spec §FR-013b]
- [ ] CHK015 「输入框内选中文字时弹框不遮挡光标编辑区域」的判定标准是否具体（何种输入元素、优先方位）？[Clarity, Spec §Edge Cases]
- [ ] CHK016 「静默不可用，不报错崩溃」在禁止注入页面上的用户可见反馈是否定义（完全无 UI vs 可选提示）？[Ambiguity, Spec §FR-011]
- [ ] CHK017 「可理解的错误信息」是否列举或分类了主要错误类型及对应文案要求？[Clarity, Spec §US2 Scenario 3]
- [ ] CHK018 「SENTENWORD 风格」是否通过可验收的描述或引用约束了 UI 范围（单 Tab、无收藏等）？[Clarity, Spec §Assumptions]

## Requirement Consistency

- [ ] CHK019 FR-011「所有可注入页面」与 Assumptions「iframe 内划词不在范围」是否一致且无冲突？[Consistency, Spec §FR-011/Assumptions]
- [ ] CHK020 FR-012「不缓存」与 Edge Cases「相同文字重复查词」描述是否一致？[Consistency, Spec §FR-012/Clarifications]
- [ ] CHK021 词典/翻译模式切换阈值（5 词）在 User Story、FR-003、Acceptance Scenarios 中是否一致？[Consistency, Spec §US1/FR-003]
- [ ] CHK022 Success Criteria 中的性能指标（SC-002/SC-006）是否与 FR-009/FR-013 的 loading/流式描述一致？[Consistency, Spec §SC-002/FR-009]
- [ ] CHK023 Constitution「密钥不得写在 Content Script」是否在 spec 的 FR-007/FR-008 中有对应且一致的表述？[Consistency, Constitution §II/Spec §FR-007]

## Acceptance Criteria Quality

- [ ] CHK024 SC-001「90% 测试用户 30 秒内完成」是否定义测试用户画像与测试环境？[Measurability, Spec §SC-001]
- [ ] CHK025 SC-002「悬停到 loading < 1 秒」是否排除 API 首 token 后仍可通过客观方式验收？[Measurability, Spec §SC-002]
- [ ] CHK026 SC-003「四边各选词测试 100% 可见」是否定义弹框「完整可见」的判定标准（padding、滚动条是否计入）？[Measurability, Spec §SC-003]
- [ ] CHK027 每个 FR（FR-001–FR-013b）是否均有对应的 Acceptance Scenario 或 Success Criteria 可追溯？[Traceability, Spec §Requirements]

## Scenario Coverage

- [ ] CHK028 是否定义了 API Key 已配置但网络完全离线时的需求行为？[Coverage, Gap, Exception Flow]
- [ ] CHK029 是否定义了流式响应中途断连/超时的恢复或重试需求？[Coverage, Spec §Edge Cases]
- [ ] CHK030 是否定义了词典模式 JSON 解析失败（模型返回非结构化文本）时的降级展示需求？[Coverage, Gap, Exception Flow]
- [ ] CHK031 是否定义了用户在弹框 loading 期间关闭弹框或移开鼠标时的请求取消需求？[Coverage, Spec §Edge Cases]
- [ ] CHK032 是否定义了用户未悬停图标、仅选中文字后点击页面其他区域时的图标消失规则？[Coverage, Gap, Alternate Flow]
- [ ] CHK033 是否定义了重复悬停同一选区（图标已隐藏、弹框已关闭）是否允许再次触发查词？[Coverage, Gap, Spec §FR-002a]

## Edge Case Coverage

- [ ] CHK034 >500 字符、纯数字/标点、空白选区的提示文案是否在 spec 中规定或允许实现阶段自定？[Edge Case, Spec §Edge Cases]
- [ ] CHK035 选区跨多个 block 元素（多段落、表格单元格）时的行为是否在需求中说明？[Edge Case, Gap]
- [ ] CHK036 页面缩放、移动端窄视口或高 DPI 下弹框定位需求是否说明（或明确排除）？[Edge Case, Gap]
- [ ] CHK037 选中文本含 HTML 特殊字符、emoji、混合中英文时的处理需求是否定义？[Edge Case, Gap]

## Non-Functional Requirements

- [ ] CHK038 是否定义网络请求超时阈值及重试次数/间隔？[NFR, Gap, Spec §Edge Cases]
- [ ] CHK039 是否定义无障碍需求（键盘操作、焦点管理、ARIA）或明确本版本排除？[NFR, Gap]
- [ ] CHK040 是否定义 Shadow DOM 样式隔离下与宿主页面 z-index 冲突的处理原则？[NFR, Gap, Plan §Constraints]
- [ ] CHK041 是否定义并发查词请求（快速划词）的节流或排队策略？[NFR, Gap]

## Dependencies & Assumptions

- [ ] CHK042 硅基流动 API 可用性、模型名称、stream 协议是否作为已验证假设文档化？[Assumption, Spec §Assumptions/FR-006]
- [ ] CHK043 「用户可在设置中修改默认模型」是否在 spec 功能需求中体现（目前主要在 plan/Key Entities）？[Dependency, Gap, Spec §Key Entities]
- [ ] CHK044 是否说明对 openai SDK / 硅基流动 API 版本变更的兼容性预期或排除？[Assumption, Gap]

## Ambiguities & Conflicts

- [ ] CHK045 plan.md 中的性能目标（图标 <100ms）未写入 spec——是否应升格为 Success Criteria 或明确为实现细节？[Ambiguity, Plan §Performance Goals]
- [ ] CHK046 「不修改原文」与弹框内展示原文是否存在用户误以为已替换页面的风险，需求是否要求视觉区分？[Ambiguity, Spec §FR-004/US1]

## Notes

- 勾选 `[x]` 表示经人工审阅后确认该需求维度**已在 spec 中充分定义**
- 留空 `[ ]` 表示存在缺口或需进一步澄清；可在行末追加发现说明
- 本清单与 `requirements.md`（specify 阶段通用质量门）互补，侧重领域完整性深度检查

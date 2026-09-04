---
name: job-content-publisher
description: 用户确认求职内容母稿后，自动完成小红书图文生产与飞书写回：锁定内容总表母稿，调用独立图片技能生成并校验图片包，通过 lark-cli 写入小红书子表并读回验证。用于“母稿没问题继续”“直接出小红书图片并放飞书”“处理这条内容记录”“生成图片并上传飞书”等任务；默认一次确认后不中途再次询问，公开发布到平台仍需用户另行授权。
---

# 母稿确认后自动生产与飞书写回

默认流程是：`母稿确认 → 锁定源稿 → 图片包 → 飞书子表 → 读回验证`。母稿确认后连续执行；只有内容冲突、附件覆盖、校验失败或工具阻塞时暂停。

**REQUIRED SUB-SKILL:** Use xiaohongshu-image-renderer for every pagination, rendering, regeneration, or visual-validation request.

## 硬规则

1. **源稿唯一**：内容总表母稿的标题和正文是唯一来源；平台正文、历史分页和图片都是派生结果。
2. **一次确认**：用户明确表示母稿“可以、没问题、定稿、就按这个”后，连续执行完整生产流程。
3. **完整写回**：飞书“图片分页文案”保存每张图实际出现的全部文字，不能写摘要或起止范围。
4. **发布分离**：上传飞书不等于公开发布；“是否发布”保持原值，公开发布或定时发布必须另获授权。

## 按需读取

- 生成或改写母稿：完整读取 [content-generation-rules.md](references/content-generation-rules.md)。
- 读取或写入飞书：完整读取 [feishu-writeback-rules.md](references/feishu-writeback-rules.md)。

纯上传任务不改写正文；纯图片任务不写飞书。

## 执行模式

### 母稿尚未确认

完成母稿并交给用户确认，然后停止。不要提前生成图片或写入平台附件。

### 母稿已经确认

1. 按飞书写回规范预检并定位或创建唯一的小红书子记录；读取关联母稿。
2. 锁定母稿标题、正文、`sourceType`、内容 ID、record ID 和标准化正文 SHA-256 `sourceHash`，写入只读 `source.json`。
3. 调用 `xiaohongshu-image-renderer`；不得在本技能中分页、写布局、渲染或改写源稿。
4. 仅当返回包的 `validation.json.ok=true`、`final-verification.json.ok=true`、`exactText=true`、`overflowCount=0`、`sourceHash` 与锁定值一致，且 `NN.png` 顺序与 manifest 一致时，继续。
5. 按 [feishu-writeback-rules.md](references/feishu-writeback-rules.md) 写入逐页完整文案和附件，顺序上传，并读回验证后更新真实存在的“已定稿”状态。

校验失败、哈希不一致、附件冲突、字段映射错误或重复记录时停止；不得盲目重试、覆盖无关附件或删除记录。

## 最终报告

返回飞书链接、内容 ID、平台内容 ID、record ID、图片数量、`exactText`、附件读回结果、内容状态，并明确“是否发布”保持未变。

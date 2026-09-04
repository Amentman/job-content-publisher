---
name: job-content-publisher
description: Use when 用户已经确认求职内容母稿，并要求生成小红书图片包、写回飞书平台子表，或说“母稿没问题继续”“直接出图”“生成图片并上传飞书”时。
---

# 母稿确认后自动生产与飞书写回

当前公开版本：v0.3.2。

默认流程是：`母稿确认 → 锁定源稿 → 图片包 → 飞书子表 → 读回验证`。母稿确认后连续执行；只有内容冲突、附件覆盖、校验失败或工具阻塞时暂停。

**REQUIRED SUB-SKILL:** Use xiaohongshu-image-renderer for every pagination, rendering, regeneration, or visual-validation request.

## 总体运行流程

这条流水线的 `输入 → 处理 → 输出` 是：

1. **输入**：已明确确认的标题与正文、用户选择的“仅本地图片”或“图片并写回飞书”模式，以及飞书模式下的唯一记录线索。
2. **处理**：检查锁定版本的图片 Skill，保存唯一母稿并计算 `sourceHash`，初始化内容包、分页、渲染，再独立核对原文、哈希、页码、尺寸和溢出。
3. **分支处理**：本地模式到图片验证即结束；飞书模式还要定位唯一记录、检查旧附件、顺序写入完整分页文案和图片，并写后读回。
4. **输出**：本地模式返回真实图片包路径、清单和验证值；飞书模式再返回 record ID、飞书链接、字段与附件读回结果。
5. **停止边界**：母稿未确认、哈希冲突、图片验证失败、飞书记录不唯一或附件覆盖未获授权时立即停止。出图不等于写飞书，写飞书也不等于公开发布。

## 首次运行

图片任务开始前运行 `node scripts/bootstrap-renderer.mjs --check`。返回 `missing`
时运行 `node scripts/bootstrap-renderer.mjs --install`；该命令会安装并校验锁定的图片 Skill v0.2.1、
安装其运行依赖并返回 `rendererPath`。随后完整读取
`<rendererPath>/SKILL.md`，使用那里提供的初始化、渲染和校验脚本。不得因为
当前会话尚未重新发现新 Skill 就绕过图片校验。

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

先根据用户动作选择一种模式：

#### 仅生成本地图片

用户给出已确认的标题和正文或 Markdown 文件，并要求“出图”“生成图片包”时，
不需要飞书地址。没有指定输出位置时使用当前工作目录下新建的
`xiaohongshu-output/<日期时间>/`：

1. 保留确认母稿原文；内联正文先原样保存为本地 Markdown。
2. 使用图片 Skill 的 `init-package.mjs` 创建锁定的 `source.json`。
3. 使用图片 Skill 渲染并校验；不得在本技能中另写分页、布局或截图逻辑。
4. 返回图片包路径、图片数量、`sourceHash`、`exactText` 和校验结果。

#### 生成并写回飞书

只有用户明确要求写回飞书，或提供了目标飞书记录时才执行：

1. 按飞书写回规范预检并定位或创建唯一的小红书子记录；读取关联母稿。
2. 锁定母稿标题、正文、`sourceType`、内容 ID、record ID 和标准化正文 SHA-256 `sourceHash`，写入工作流锁定的 `source.json`；后续步骤不得改写它。
3. 调用图片 Skill；不得在本技能中分页、写布局、渲染或改写源稿。
4. 仅当返回包的 `validation.json.ok=true`、`final-verification.json.ok=true`、`exactText=true`、`overflowCount=0`、`sourceHash` 与锁定值一致，且 `NN.png` 顺序与 manifest 一致时，继续。
5. 按 [feishu-writeback-rules.md](references/feishu-writeback-rules.md) 写入逐页完整文案和附件，顺序上传，并读回验证后更新真实存在的“已定稿”状态。

校验失败、哈希不一致、附件冲突、字段映射错误或重复记录时停止；不得盲目重试、覆盖无关附件或删除记录。

## 最终报告

本地图片模式返回包路径、图片清单、`sourceHash`、`exactText` 和校验结果。
飞书模式再返回飞书链接、内容 ID、平台内容 ID、record ID、附件读回结果、内容状态，并明确“是否发布”保持未变。

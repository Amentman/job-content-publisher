# 寂辉求职内容发布流水线

把一份已经确认的求职内容母稿，转成可核验的小红书图片包，并在用户配置后可选写回飞书。生成和写回不等于公开发布。

## 安装

```bash
npx skills add Amentman/job-content-publisher@job-content-publisher -g -y
```

安装后可以说：`使用 $job-content-publisher 把这份确认母稿生成图片包。`

第一次出图时，Skill 会自动安装并检查 `xiaohongshu-image-renderer` 及其
Playwright/Chromium 运行环境。需要手动预装时，在本 Skill 目录运行：

```bash
node scripts/bootstrap-renderer.mjs --install
```

## 边界

- 确认母稿是唯一正文来源；用哈希防止中途错稿。
- 只生成本地图片时不要求飞书地址。
- 只有需要飞书写回时才配置 `lark-cli` 和字段映射。
- 图片按页码顺序上传，写后必须重新读取数量、正文和附件。
- 打开发布页、立即发布或定时发布都需要针对该次动作的明确授权。

公开配置模板见 [飞书写回规则](skills/job-content-publisher/references/feishu-writeback-rules.md)。许可证：MIT。

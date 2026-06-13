---
name: Source Content Instructions
description: 指导 Copilot 在处理内容文件（位于 source/**，尤其是 source/_posts）时应遵守的约定与校验规则。
applyTo:
  - "source/**"
---

# 作用
当请求涉及 `source/` 下的文件时，此指令会被自动加载以提供上下文敏感的建议与约束。

# 主要规则
- 所有文章必须放在 `source/_posts`，并包含合法的 front-matter（YAML 格式）。
- front-matter 中 `date`、`title`、`tags`（可选）应存在且格式正确。
- 编辑文章时尽量不要改变生成后的 `public/` 内容；对静态资源请放入 `source/images/`。

# 常见任务提示（示例）
- "检查 `source/_posts` 下所有文件的 front-matter 是否缺失或缩进错误，并修复它们。"
- "基于 `scaffolds/post.md` 为标题 '我的新文章' 生成一个带 front-matter 的草稿文件。"

# 何时触发
- 在修改或检查 `source/**` 文件时自动生效。

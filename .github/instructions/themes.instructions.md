---
name: Theme Files Instructions
description: 指导 Copilot 在修改或检查主题相关文件（themes/**）时的约定与注意事项。
applyTo:
  - "themes/**"
---

# 作用
当请求涉及 `themes/` 下文件时，此指令会被自动加载以提供与主题开发和定制相关的建议。

# 主要规则
- `themes/` 目录用于自定义且由仓库托管的主题（非 `node_modules` 中的主题）。
- **禁止**直接修改 `node_modules/hexo-theme-butterfly` 下的文件；主题升级会覆盖修改。
- 在修改主题模板或样式前，请先在本地运行 `hexo server` 预览并验证改动。

# 常见任务提示（示例）
- "在 `themes/hexo-theme-solitude` 中查找并修复导致页面样式错乱的 CSS 或模板错误。"
- "添加一个简单的主题配置说明到主题目录的 README。"

# 何时触发
- 在修改或检查 `themes/**` 文件时自动生效。

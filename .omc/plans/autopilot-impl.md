# Intro Gate 实现计划

## 任务 1: _config.yml — 添加 root: /blog/
- 文件: `_config.yml`
- 改动: 添加 `root: /blog/`
- Agent: executor (Sonnet)

## 任务 2: 重构 cosmic-intro 为独立门禁页
- 文件: `source/cosmic-intro/index.html`
- 改动:
  - 删除 `#blog-floor` HTML 块（L242-256）
  - 删除 blog-floor 相关 CSS
  - 添加 #gate 区域 + EXPLORE 按钮 HTML
  - 添加 EXPLORE 按钮 CSS（渐现动画）
  - 添加 SKIP → 链接 CSS + HTML
  - 添加 Cookie 记忆逻辑 JS
  - 修改滚动逻辑：按钮 >85% 渐现，skip >60% 渐隐
  - 更新 nav-rail dots 数量（5 → 不含 blog-floor 的段数）
- Agent: executor (Opus) — 复杂 DOM/JS 修改

## 任务 3: 删除 inject-cosmic-intro.js
- 文件: `scripts/inject-cosmic-intro.js`
- 改动: 删除
- Agent: executor (Haiku)

## 任务 4: 博客顶部"再看一次开场"链接
- 通过 Butterfly 配置或 layout 注入
- Agent: executor (Sonnet)

## 任务 5: hexo build 验证
- Agent: executor (Sonnet)

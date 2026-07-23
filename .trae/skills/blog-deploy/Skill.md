---
name: "blog-deploy"
description: "博客推送部署流程助手。Invoke when user wants to deploy blog updates, push changes, or mentions deploying to EdgeOne."
---

# 博客推送部署流程

## ⚠️ 关键警告：禁止使用 `git add -A`！

**`public-deploy/` 是构建产物目录，已在 `.gitignore` 中排除，绝对不能提交到版本库。**

违反此规则会导致仓库被数百个构建文件污染（历史教训：cedceb2 曾花费巨大代价清理）。

## 触发条件
- 用户说"推送更新博客"、"部署博客"、"发布博客"、"推送到远程"等类似表述
- 用户要求检查博客更新流程

## 标准部署流程（两条独立管道）

### 管道 A：推送源代码到 Git 仓库
```bash
# 1. 只添加源文件，绝不包括构建产物
git add source/ _config.yml _config.butterfly.yml package.json scaffolds/ package-lock.json

# 2. 提交
git commit -m "描述你的更改"

# 3. 推送源代码
git push origin main
```

### 管道 B：构建并部署到 GitHub Pages
```bash
# 1. 构建+组装（使用项目自带脚本，不是 hexo deploy）
npm run build:deploy

# 2. 部署到 GitHub Pages（单独仓库）
cd public-deploy && git add -A && git commit -m "deploy" && git push origin main --force
```

## 禁止事项
- ❌ `git add -A` 或 `git add .` 在博客根目录执行（会污染源代码仓库）
- ❌ `hexo deploy`（本项目不通过 hexo deploy 部署，使用 npm run build:deploy + 手动推）
- ❌ 提交 `public/`、`public-deploy/`、`.deploy_git/` 目录下的任何文件到源代码仓库
- ❌ `git push origin main --force` 直接在博客根目录执行（这是源代码 repo，不要 force push）

## 注意事项
- 每次修改配置后必须执行 `hexo clean`，否则配置不生效
- 源代码仓库和 GitHub Pages 仓库是**两个独立的 repo**
  - 源代码：`git@github.com:Jack-infinity420/lvjf-blog.git`（本目录）
  - 部署目标：`git@github.com:Jack-infinity420/jack-infinity420.github.io.git`（public-deploy/ 内）
- 部署完成后需等待 EdgeOne CDN 缓存刷新（数分钟）

## 常见问题
| 问题 | 解决方案 |
|------|----------|
| EdgeOne 显示 404 | 检查分类是否有文章，确认 /blog/ 路径前缀 |
| 配置不生效 | 执行 `hexo clean` 清除缓存 |
| 推送冲突 | 源代码 repo 不要 force push，用正常 pull+push |
| 样式错乱 | 检查 `_config.butterfly.yml` 语法 |
| canonical/og:url 错误 | 运行 `node tools/fix-canonical.js` |

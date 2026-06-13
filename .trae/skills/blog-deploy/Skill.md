---
name: "blog-deploy"
description: "博客推送部署流程助手。Invoke when user wants to deploy blog updates, push changes, or mentions deploying to EdgeOne."
---

# 博客推送部署流程

## 触发条件
- 用户说"推送更新博客"、"部署博客"、"发布博客"、"推送到远程"等类似表述
- 用户要求检查博客更新流程

## 标准部署流程

### 1. 检查 Git 状态
```bash
git status
```
确认本地有未推送的提交。

### 2. 添加所有更改
```bash
git add -A
```

### 3. 提交更改
```bash
git commit -m "更新博客配置/文章"
```

### 4. 清理缓存并生成静态文件
```bash
hexo clean && hexo generate
```

### 5. 部署到 EdgeOne
```bash
hexo deploy
```

### 6. 强制推送到远程仓库（解决 EdgeOne 冲突/上传错误）
```bash
git push origin main --force
```

## 注意事项
- 每次修改配置后必须执行 `hexo clean`，否则配置不生效
- 如果遇到 EdgeOne 上传错误，使用 `--force` 强制推送
- 部署完成后提醒用户访问 `https://lvjf.space` 验证

## 常见问题
| 问题 | 解决方案 |
|------|----------|
| EdgeOne 显示 404 | 检查分类是否有文章，执行完整部署流程 |
| 配置不生效 | 执行 `hexo clean` 清除缓存 |
| 推送冲突 | 使用 `git push --force` 强制覆盖 |
| 样式错乱 | 检查 `_config.butterfly.yml` 语法 |

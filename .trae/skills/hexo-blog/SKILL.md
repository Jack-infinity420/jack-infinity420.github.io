---
name: "hexo-blog"
description: "Hexo + Butterfly 主题博客开发助手。Invoke when user works with Hexo blog, edits _config files, creates posts, or runs hexo commands."
---
### 博客域名 lvjf.space
-目前我已有cloudflare账号
# Hexo Blog Skill

## 项目核心信息
- 项目类型：Hexo 静态个人技术博客
- 使用主题：Hexo Butterfly（npm 安装方式）
- 主题绝对路径：`F:\blog\node_modules\hexo-theme-butterfly`（**禁止直接修改，主题升级会完全覆盖**）
- 工作目录：`F:\blog`

## 核心配置体系（优先级从高到低）
1. 根目录 `_config.yml`（Hexo 全局核心配置，**必须将 `theme` 字段设为 `butterfly`**）
2. 根目录 `_config.butterfly.yml`（Butterfly 主题自定义配置，**唯一可修改的主题配置入口**）
3. 主题目录 `node_modules/hexo-theme-butterfly/_config.yml`（主题默认配置，仅作参考，禁止编辑）

## 标准目录结构
```
F:\blog
├── _config.yml              # Hexo 全局核心配置（可修改）
├── _config.butterfly.yml    # Butterfly 主题自定义配置（唯一可修改入口）
├── node_modules/            # 禁止修改：npm 依赖包目录
│   └── hexo-theme-butterfly/  # 禁止修改：主题源文件
├── source/                  # 内容 / 资源目录（可修改）
│   ├── _posts/              # 博客文章（核心内容目录）
│   └── images/              # 静态资源目录
├── scaffolds/               # 文章 / 页面模板目录
│   ├── post.md              # 博客文章默认模板
│   ├── page.md              # 独立页面默认模板
│   └── draft.md             # 草稿文章默认模板
├── themes/                  # 主题目录（当前为空，使用 npm 主题）
├── public/                  # 自动生成：构建产物目录（禁止手动修改）
└── package.json             # npm 依赖 / 脚本配置
```

## 必须严格遵守的核心规则
1. **绝对禁止**修改 `node_modules/` 目录下任何文件（升级会完全覆盖）
2. 所有 Butterfly 主题的自定义配置，**仅允许修改根目录 `_config.butterfly.yml`**
3. 修改配置文件后，**必须执行 `hexo clean` 清除缓存**，再执行 `hexo g`/`hexo s`，否则配置不生效
4. YAML 配置文件强制规范：
   - 冒号 `:` 后必须加空格（例：`title: 博客标题`，禁止 `title:博客标题`）
   - 缩进统一用**空格**（推荐 2 空格，禁止使用 Tab 键）

## 常用命令（在博客根目录执行）
| 命令 | 别名 | 功能说明 |
|------|------|----------|
| `npm install` | - | 安装/更新项目所有依赖 |
| `hexo clean` | - | 清理缓存 + `public/` 目录（配置修改后必做） |
| `hexo generate` | `hexo g` | 生成静态文件到 `public/` |
| `hexo server` | `hexo s` | 启动本地预览服务器（默认：`http://localhost:4000`） |
| `hexo deploy` | `hexo d` | 部署站点到远程平台 |
| `hexo new post "标题"` | `hexo n` | 新建博客文章 |

## 文章 Front-matter 规范
```yaml
---
title: 文章标题
date: 2026-04-02 12:00:00
tags:
  - 标签1
  - 标签2
categories:
  - 分类1
---
```

## 工作流程
1. 修改配置/文章 → 2. 运行 `hexo clean` → 3. 运行 `hexo g` 或 `hexo s` → 4. 预览效果

## 故障排查 checklist
- 配置不生效？→ 是否执行了 `hexo clean`？
- YAML 语法错误？→ 检查冒号后是否有空格、是否使用了 Tab 缩进
- 页面样式错乱？→ 检查 `_config.butterfly.yml` 配置与依赖
- 本地启动报错？→ 检查端口占用/依赖缺失

## 权威参考资源
- Hexo 官方中文文档：https://hexo.io/zh-cn/docs/
- Butterfly 主题官方文档：https://butterfly.js.org/

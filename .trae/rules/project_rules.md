---
name: Copilot Workspace Instructions
description: Hexo + Butterfly 主题博客工作区规范，含项目结构、命令、配置规则与任务示例
---
---

# 目的
为 Copilot / AI 助手提供 Hexo + Butterfly 主题博客的**权威项目上下文**，确保 AI 在配置修改、内容创作、故障排查时，严格遵循官方规范，避免路径错误、配置冲突、违规修改等低级问题，提升交互效率与输出准确性。
# 强制命令执行环境

## 所有命令必须在 Bash 中执行

## 生效范围
- 全局生效（整个博客工作区 `F:\blog\`）
- 代码编辑、配置修改、命令执行、问题排查时，自动加载本规范作为核心上下文

# 项目核心信息
- 项目类型：Hexo 静态个人技术博客
- 使用主题：Hexo Butterfly（npm 安装方式）
- 主题绝对路径：`F:\blog\node_modules\hexo-theme-butterfly`（**禁止直接修改，主题升级会完全覆盖**）
- 核心配置体系（优先级从高到低，Hexo 官方规则）：
  1. 根目录 `_config.yml`（Hexo 全局核心配置，**必须将 `theme` 字段设为 `butterfly`**）
  2. 根目录 `_config.butterfly.yml`（Butterfly 主题自定义配置，**唯一可修改的主题配置入口**）
  3. 主题目录 `node_modules/hexo-theme-butterfly/_config.yml`（主题默认配置，仅作参考，禁止编辑）

# 标准目录结构（完全匹配你的实际目录，标注操作权限）
F:\blog
├── _config.yml # 🟢 Hexo 全局核心配置（可修改，必须设 theme: butterfly）
├── _config.butterfly.yml # 🔴 重点：Butterfly 主题自定义配置（唯一可修改入口）
├── _config.landscape.yml # 🟡 旧主题配置（已弃用，无需修改）
├── .gitignore # 🟢 Git 忽略规则文件（可修改）
├── node_modules/ # 🔴 禁止修改：npm 依赖包目录（含 Butterfly 及其他依赖）
│ ├── hexo-theme-butterfly/ # 🔴 禁止修改：Butterfly 主题源文件（仅参考）
│ └── hexo-theme-solitude/ # 🟡 旧主题残留（已弃用，无需修改）
├── source/ # 🟢 内容 / 资源目录（可修改）
│ ├── _posts/ # 🟢 博客文章（核心内容目录，Markdown 格式）
│ ├── images/ # 🟡 静态资源目录（建议手动创建，存放头像 / 配图等）
│ └── 其他自定义页面 / # 🟡 独立页面（如 about、links、tags，需用 hexo new page 生成）
├── scaffolds/ # 🟢 文章 / 页面模板目录（可修改，用于 hexo new 命令生成）
│ ├── post.md # 🟢 博客文章默认模板
│ ├── page.md # 🟢 独立页面默认模板
│ └── draft.md # 🟢 草稿文章默认模板
├── themes/ # 🟡 主题目录（git clone 安装主题时使用，当前为空）
│ └── .gitkeep # 🟡 Git 空目录占位文件
├── public/ # 🟡 自动生成：构建产物目录（禁止手动修改）
├── .deploy_git/ # 🟡 自动生成：Git 部署缓存目录（禁止手动修改）
├── db.json # 🟡 自动生成：Hexo 缓存文件（禁止修改）
├── package.json # 🟢 npm 依赖 / 脚本配置（可修改）
└── package-lock.json # 🟡 npm 依赖锁定文件（禁止手动修改）

# 必须严格遵守的核心规则
1. 🔴 **绝对禁止**修改 `node_modules/` 目录下任何文件（升级会完全覆盖，导致配置丢失）。
2. 🟢 所有 Butterfly 主题的自定义配置，**仅允许修改根目录 `_config.butterfly.yml`**。
3. 🟢 修改配置文件后，**必须执行 `hexo clean` 清除缓存**，再执行 `hexo g`/`hexo s`，否则配置不生效。
4. 🟢 YAML 配置文件强制规范（Hexo/Butterfly 配置核心要求）：
   - 冒号 `:` 后必须加空格（例：`title: 博客标题`，禁止 `title:博客标题`）。
   - 缩进统一用**空格**（推荐 2 空格，禁止使用 Tab 键）。
5. 🟢 博客文章统一存放在 `source/_posts`，必须包含标准 Front-matter。

# 常用命令（在博客根目录 `F:\blog\` 执行，Hexo 官方标准）
| 命令 | 别名 | 功能说明 | 适用场景 |
|------|------|----------|----------|
| `npm install` | - | 安装/更新项目所有依赖 | 首次克隆、新增插件、主题升级后 |
| `hexo clean` | - | 清理缓存 + `public/` 目录 | 配置修改后、页面显示异常（必做） |
| `hexo generate` | `hexo g` | 生成静态文件到 `public/` | 部署前、本地预览前 |
| `hexo server` | `hexo s` | 启动本地预览服务器（默认：`http://localhost:4000`） | 本地调试、实时查看修改效果 |
| `hexo deploy` | `hexo d` | 部署站点到远程平台（如 GitHub Pages） | 完成修改后，发布到线上 |
| `hexo new post "标题"` | `hexo n` | 新建博客文章 | 撰写新文章 |

# 推荐任务提示示例（可直接复制给 Copilot）
## 配置类
- 帮我完善 `_config.butterfly.yml`，配置导航菜单、头像、社交链接、页脚信息。
- 检查 `_config.butterfly.yml` 的 YAML 语法与缩进，修复所有错误。
- 帮我配置 Butterfly 主题的评论系统（Waline/Valine）、本地搜索功能。

## 内容类
- 基于 `scaffolds/post.md`，为《Hexo + Butterfly 博客搭建全指南》生成规范 front-matter 草稿。
- 检查 `source/_posts` 下所有文章的 Markdown 格式，统一 front-matter 规范。

## 故障排查类
- 页面样式错乱/空白，帮我排查 `_config.butterfly.yml` 配置与依赖问题，给出修复步骤。
- 配置修改后不生效，帮我按「hexo clean → 检查语法 → 重启服务」的流程排查。
- 本地启动报错（端口占用/依赖缺失），分析原因并给出修复命令。
- 部署后 404，帮我检查 `_config.yml` 的 `url`/`root` 配置与 GitHub 部署分支。

# 权威参考资源（AI 可直接查阅）
- Hexo 官方中文文档：https://hexo.io/zh-cn/docs/
- Butterfly 主题官方文档：https://butterfly.js.org/
- Butterfly 配置迁移指南：https://butterfly.js.org/posts/21cfbf15/
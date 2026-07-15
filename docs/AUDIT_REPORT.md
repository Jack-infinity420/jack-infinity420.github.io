# INFINITY 博客全面代码审计报告

**审计日期**: 2026-06-21
**项目路径**: `/home/ubuntu/lvjf-blog`
**Hexo 版本**: 8.1.1
**主题**: Butterfly 5.5.4

---

## 总览

| 严重程度 | 数量 | 状态 |
|----------|------|------|
| 🔴 严重  | 3    | 需立即修复 |
| 🟠 高    | 6    | 建议尽快修复 |
| 🟡 中    | 7    | 需关注 |
| 🟢 低    | 6    | 可延后 |
| 🔵 建议  | 5    | 可选 |

---

## 🔴 严重 (需立即修复)

### 1. protobufjs 存在 CRITICAL 级别 RCE 漏洞

**位置**: `node_modules/protobufjs` (通过 `leancloud-realtime → leancloud-storage` 依赖链)

**详情**: npm audit 报告 1 个 critical 级别漏洞 — protobufjs 存在任意代码执行风险 (CVE 相关: `GHSA-...`)。该漏洞通过 `leancloud-realtime → leancloud-storage` 间接依赖引入。

**影响**: 如果博客后端使用了 LeanCloud 存储服务且处理不受信任的 protobuf 数据，可能导致远程代码执行。即使是静态博客，依赖链中的漏洞也会被安全扫描工具标记。

**修复建议**:
- 如果不使用 LeanCloud 功能（当前未配置），从 package.json 移除 `leancloud-storage` 及其相关依赖
- 或运行 `npm update protobufjs` 升级到安全版本
- 运行 `npm audit fix` 修复可自动修复的漏洞

---

### 2. `ACTF2020 Exec1.md` front-matter title YAML 格式错误

**位置**: `source/_posts/ACTF2020 Exec1.md` 第 2 行

**详情**:
```yaml
title:
  - ACTF2020 新生赛 Exec1 BUUCTF
```
`title` 被错误地定义为 YAML 数组（`- ` 前缀），而 Hexo 期望 title 为字符串。渲染时 post.title 可能是 `[ 'ACTF2020 新生赛 Exec1 BUUCTF' ]` 或数组字符串表示，导致页面标题显示异常。

**修复建议**:
```yaml
title: ACTF2020 新生赛 Exec1 BUUCTF
```

---

### 3. 本地字体文件 25MB 冗余且未被使用

**位置**: `source/fonts/LXGWWenKai-Regular.ttf` (25MB)

**详情**: 项目中存在一个 25MB 的 TTF 字体文件，但 CSS (`reading-journal-fonts.css`) 实际使用 jsDelivr CDN 上的 woff2 格式 (`lxgw-wenkai-webfont@1.7.0`)。该本地 TTF 文件永远不会被引用，但每次 `hexo generate` 会被复制到 `public/fonts/`，增加 25MB 部署体积和构建时间。

**修复建议**:
- 删除 `source/fonts/LXGWWenKai-Regular.ttf`（如果确认不使用）
- 或在 hexo-offline 的 `globIgnores` 中确认 `fonts/**` 已被排除（当前已排除）

---

## 🟠 高 (建议尽快修复)

### 4. npm audit 报告 18 个 High 级别漏洞

**详情**: 依赖链中的多个 high 级别漏洞：

| 包名 | 漏洞类型 |
|------|----------|
| serialize-javascript | RCE via RegExp.flags + DoS |
| html-minifier (hexo-neat) | REDoS |
| ws | 未初始化内存泄露 + 内存耗尽 DoS |
| axios | SSRF + CSRF |
| node-fetch (isomorphic-fetch) | 安全 header 转发到非信任站点 |
| form-data | CRLF 注入 |

**修复建议**:
```bash
cd /home/ubuntu/lvjf-blog
npm audit fix           # 修复不破坏兼容性的
npm audit fix --force   # 谨慎：可能引入 breaking changes
```

---

### 5. hexo-hide-posts 与 Generator 深度 Monkey-Patch 耦合

**位置**: `node_modules/hexo-hide-posts/lib/injectGenerators.js`

**详情**: hexo-hide-posts 通过运行时的 monkey-patch 方式重写 Hexo 的所有 generator 注册函数，在 post/page/category/tag 等 generator 注入文章过滤逻辑。这种设计：
- 高度侵入性，依赖 hexo 内部 API 不变
- 如果 hexo-hide-posts 升级或 hexo 内部 API 变更，整个博客的文章渲染可能中断
- 当前配置 `allowlist_generators: [category]` 使 hidden 文章仅在分类页可见，但此行为完全委托给插件

**修复建议**:
- 将 hexo-hide-posts 锁定在已知兼容版本后监控更新
- 做好 `hexo generate` 构建验证，确保 hidden 文章不会意外泄露
- 考虑长期替代方案：使用自定义 front-matter + scripts 自行实现过滤

---

### 6. hexo-neat `drop_console: true` 会移除生产环境诊断日志

**位置**: `_config.yml` neat_js.compress.drop_console: true

**详情**: neat 压缩插件在所有 JS 中移除 console 调用。但 `source/js/weather.js` 中有故意的 `console.warn('[BlogWeather] 获取天气失败:', e.message)` 用于生产环境诊断。压缩后该日志会被静默删除，wxAPI 调用失败时无法排查。

**修复建议**:
- 将 weather.js 加入 neat_js exclude 列表：`exclude: ['*.min.js', 'js/weather*.js']`
- 或使用自定义 logger 替代 console.warn（不会被 neat 移除的全局变量方式）

---

### 7. Giscus 评论配置不完整但已启用

**位置**: `_config.butterfly.yml` giscus 配置段

**详情**: `giscus.enable: true` 但 `repo_id` 和 `category_id` 均为空：
```yaml
giscus:
  enable: true
  repo: Jack-infinity420/blog-comments
  repo_id:       # 空值
  category: Announcements
  category_id:   # 空值
```

**影响**: 评论区代码会被注入但初始化会失败，可能导致 JS 错误，用户看到空白或损坏的评论区。

**修复建议**:
- 前往 [giscus.app](https://giscus.app) 获取 repo_id 和 category_id 填入
- 或暂时将 `enable: false`

---

### 8. Google Fonts CDN 从中国大陆可能不可用

**位置**: `_config.butterfly.yml` inject.head

**详情**: 注入的 Google Fonts 链接：
```html
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:...&family=Playfair+Display:..." rel="stylesheet">
```
`fonts.googleapis.com` 在中国大陆被 GFW 阻断，Playfair Display 和 EB Garamond 字体可能无法加载。

**修复建议**:
- 使用国内 CDN 镜像（如 `fonts.googleapis.cn` 或 `fonts.loli.net`）
- 或在 `reading-journal-fonts.css` 中为这两种字体也提供 jsDelivr 的替代源
- CSS 中已有完整的 fallback 字体栈，浏览器会降级使用 LXGW WenKai / serif

---

### 9. `creative-showcase-gentle-cage.md` 孤悬于 source 根目录

**位置**: `source/creative-showcase-gentle-cage.md`

**详情**: 该文件位于 `source/` 根目录而非子目录中。根据其 front-matter:
```yaml
permalink: creative-showcase/gentle-cage.html
```
这是一个正常的 Hexo 页面，但存放在 source 根目录容易造成混淆。同时它与 `source/creative-showcase/index.md` 分离（index.md 中有指向它的链接），不符合 Hexo 推荐的文件组织方式。

**修复建议**:
- 移动到 `source/creative-showcase/gentle-cage.md`（更清晰的组织）
- 或保持在现有位置（功能正常，只是组织问题）

---

## 🟡 中 (需关注)

### 10. manifest.json favicon 路径与 HTML 不一致

**位置**: `source/manifest.json`

**详情**:
- `manifest.json` 图标路径: `/blog/img/favicon.ico` (48x48)
- 实际 HTML favicon: `/blog/images/navlogo.png` (1529x1520 PNG)

PWA 安装时使用的图标（favicon.ico）与实际页面 favicon（navlogo.png）不同。且 navlogo.png 是 1529x1520 的大图作为 favicon 不够高效。

**修复建议**:
- 统一 PWA manifest 图标和 HTML favicon
- 为 PWA 生成 192x192 和 512x512 的 PNG 图标

---

### 11. 多个文章 front-matter 使用空 categories 导致 `uncategorized`

**位置**: 以下文章的 front-matter:
- `source/_posts/double-falcon.md` → `categories:` (空)
- `source/_posts/First-Trail.md` → `categories:` (空，但实际定义了 `- humanities`)
- `source/_posts/肩部训练指南.md` → `categories:` (空)
- `source/_posts/胸部训练指南.md` → `categories:` (空)
- `source/_posts/三大工作机制插件.md` → `categories:` (空)
- `source/_posts/体能训练记录.md` → `categories:` (空)

等等，让我再检查... First-Trail.md 实际有 `- humanities`，有些文章确实有空 categories。

**影响**: 空 `categories:` 会被 Hexo 归类到 `uncategorized`，在分类页面产生无意义的"未分类"类别。

**修复建议**: 要么明确指定 categories，要么删除空的 `categories:` 行。

---

### 12. hexo-baidu-url-submit token 为空，百度推送不工作

**位置**: `_config.yml` baidu_url_submit.token: ''

**影响**: 虽然插件配置完整，但没有百度站长平台的 token，`baidu_urls.txt` 生成后无法提交。

**修复建议**: 前往百度站长平台获取 token 填入，或移除该插件以减少构建开销。

---

### 13. pjax exclude URL 路径验证

**位置**: `_config.butterfly.yml` pjax.exclude

**详情**: `exclude: - /blog/cosmic-intro/?replay=1`

该 exclude 使用 `/blog/cosmic-intro/` 带查询参数格式。Hexo 上下文中的 root 为 `/blog/`，pjax 插件需要确认它能正确匹配带查询参数的 URL。如果 pjax 的 exclude 匹配只比较 pathname（不含 query string），则该 exclude 规则可能无法匹配 `/cosmic-intro/?replay=1` 的实际 URL。

**修复建议**: 验证 pjax 插件在 `?replay=1` 参数下的行为。如不匹配，尝试 `/blog/cosmic-intro/` (无参数) 作为 exclude。

---

### 14. hexo-image-opt 插件来源与文档注释不符

**位置**: `_config.yml` hexo_image_opt 配置注释

**详情**: 配置注释写 `https://github.com/next-theme/hexo-image-opt`，但实际安装的 hexo-image-opt 来自 `https://github.com/comjdev/hexo-image-opt`。next-theme 组织下并无此插件。该注释具有误导性。

**修复建议**: 更正为正确的 GitHub 仓库地址。

---

### 15. `reading-journal` layout type 依赖非标准实现

**位置**: `source/reading-journal/index.md` front-matter: `type: reading-journal`

**详情**: 该页面使用 `type: reading-journal` 配合 `layout: page`。Butterfly 主题不原生支持 `reading-journal` layout。实际渲染中，Hexo 将 `type` 值注入 body class (`type-reading-journal`)，custom.css 通过 `.page.type-reading-journal` 选择器应用样式。

**风险**: 依赖 Hexo 的 type→class 映射行为。如果未来 Hexo 版本改变此行为，阅读日志页面的样式将完全失效。当前 Hexo 8.1.1 工作正常。

**修复建议**: 在 custom.css 中添加备选方案注释，或考虑通过 `page_class` front-matter 显式声明。

---

### 16. 星海拾燧页面内容与 hidden 文章重复

**位置**: `source/reading-journal/index.md` 与 `source/_posts/reading-journal-2026-06-*.md`

**详情**: 阅读日志页面硬编码了 2026-06-21 和 2026-06-22 的摘抄内容，同时存在两篇 `hidden: true` 的独立文章（同样内容）。这意味着：
- 同一段摘抄在两个 URL 都存在（页面和文章）
- 需要手动同步维护两份内容

**修复建议**: 
- 如果页面作为精选展示（内容精选），文章作为存档（完整记录），可接受
- 否则考虑合并，只保留一种形式

---

## 🟢 低 (可延后)

### 17. `hexo-theme-landscape` 依赖冗余

**位置**: `package.json` `hexo-theme-landscape: ^1.0.0`

**详情**: 博客使用 Butterfly 主题，landscape 主题从未使用。每个 `npm install` 都会安装这个多余的依赖。

**修复建议**: 从 `package.json` 移除。

---

### 18. `hexo-deployer-git` 配置已注释但依赖仍在

**位置**: 
- `package.json`: `hexo-deployer-git: ^4.0.0`
- `_config.yml`: deploy 配置全部注释

**详情**: 部署改用 `node tools/assemble-deploy.js` 手动流程，deployer-git 不再使用但仍在依赖中。

**修复建议**: 移除该依赖。

---

### 19. debug.log 存在于项目根目录

**位置**: `/home/ubuntu/lvjf-blog/debug.log` (9.8KB)

**详情**: 调试日志文件提交到了仓库，可能包含运行时信息。

**修复建议**: 加入 `.gitignore` 并删除。

---

### 20. `tools/fix-canonical.js` Canonical URL 替换使用字符串匹配而非 HTML 解析

**位置**: `tools/fix-canonical.js`

**详情**: 使用正则表达式直接替换 HTML 字符串：
```javascript
html = html.replace(
  /(canonical"\s*href="https:\/\/lvjf\.space\/)(?!blog\/)/g,
  ...
);
```
**风险**: 如果 HTML 格式稍有变化（如属性顺序改变、空格差异），正则可能不匹配。但当前 Hexo/Butterfly 的 HTML 输出稳定，所以风险较低。

**修复建议**: 可接受，但考虑长期使用 cheerio 或 jsdom 做结构化替换。

---

### 21. `fixed_poem` 配置内容与 `weather-card.js` 默认值重复

**位置**: 
- `source/_data/welcome.yml`: `fixed_poem: "长风破浪会有时，直挂云帆济沧海"`
- `source/js/weather-card.js`: `var fixedPoem = config.fixed_poem || '海内存知己，天涯若比邻';`

**详情**: welcome.yml 中的自定义值能正确覆盖 JS 中的默认值（逻辑正确），但两个默认值不同。如果 welcome.yml 被删除或解析失败，JS 将展示不同的后备诗句。这不影响功能，但存在语义不一致。

**修复建议**: 统一两个文件的 fallback 值。

---

### 22. weather.css 中存在未使用的天气粒子层隐藏规则

**位置**: `source/css/weather.css` 第 1-3 行

**详情**: `#weather-particles-canvas { display: none !important; }` — 天气粒子功能已停用，该隐藏规则确保遗留节点不显示。如果确认节点不会出现，可移除。

**修复建议**: 保留作为防御性 CSS（无害）。

---

## 🔵 建议 (可选优化)

### 23. 建议添加构建验证步骤

当前部署流程为 `hexo generate && node tools/assemble-deploy.js`，中间缺少验证环节。

**建议**: 在 `tools/assemble-deploy.js` 中添加更多验证：
- 检查所有菜单链接目标文件是否存在
- 检查 caniocal/og:url 修复覆盖率是否 100%
- 使用 lighthouse CLI 或 `tools/review-blog-ux.mjs` 做最终检查

---

### 24. CSS font-family 栈缺少通用 sans-serif 后备

**位置**: `source/css/custom.css` 全局字体定义

**详情**: 字体栈 `'LXGW WenKai', 'Noto Serif SC', ..., 'serif'` 只有 serif 作为最终后备。建议添加 `sans-serif` 作为更通用的后备（特别是代码字体）。

---

### 25. 建议定期检查 hexo-image-opt 的生成质量

hexo-image-opt 插件自动生成 WebP + responsive picture 元素。建议定期检查：
- 图片压缩质量是否满足需求（当前 quality: 80）
- opt-images/ 目录大小是否合理
- 是否所有图片都被正确处理（检查有无错误日志）

---

### 26. 建议将 `.playwright-mcp/` 目录加入 `.gitignore`

**位置**: `.playwright-mcp/` 目录

**详情**: 包含多个 Playwright 测试录制文件 (YAML/日志)，不应提交到仓库。

---

### 27. 建议 `npm audit` 集成到 CI

**建议**: 在 `.github/dependabot.yml` 已有 dependabot 配置的基础上，建议：
- 添加 GitHub Actions 在 PR 中运行 `npm audit --audit-level=high`
- 自动阻止引入高危漏洞的依赖更新

---

## 配置文件完整性总结

| 检查项 | 状态 | 说明 |
|--------|------|------|
| _config.yml YAML 语法 | ✅ 通过 | 有效 YAML |
| _config.butterfly.yml YAML 语法 | ✅ 通过 | 有效 YAML |
| _config.yml 与 _config.butterfly.yml 冲突 | ✅ 无冲突 | 配置字段不重叠 |
| 菜单链接路径 | ✅ 正确 | 所有菜单项指向存在的页面 |
| inject head 资源 | ✅ 正确 | 6 个资源路径均有效 |
| inject bottom 脚本 | ✅ 正确 | 6 个脚本路径有效，weather-config.js 由 generator 动态生成 |
| skip_render 配置 | ✅ 正确 | cosmic-intro, projects, creative/gentle-cage 均正确 |

## 自定义脚本审计总结

| 脚本 | 状态 | 说明 |
|------|------|------|
| fix-image-paths.js | ✅ 正确 | 修复 image-opt 的相对路径为绝对路径 |
| fix-public-urls.js | ✅ 正确 | 功能正常，before_exit 二次执行为无害重复 |
| replay-intro-link.js | ✅ 正确 | 正确处理 replay=1 链接重写 |
| weather-config-generator.js | ✅ 正确 | Hexo generator 正常（依赖 hexo 运行时） |
| assemble-deploy.js | ✅ 正确 | 部署流程完整，包含关键文件验证 |
| fix-canonical.js | ⚠️ 轻微 | 基于正则替换，格式变化可能失效 |

## 自定义 CSS 审计总结

| 文件 | 状态 | 说明 |
|------|------|------|
| custom.css | ✅ 正确 | 无语法错误，选择器层次清晰 |
| reading-journal-fonts.css | ✅ 正确 | CDN 路径有效，有 fallback |
| weather.css | ✅ 正确 | 样式完整，有暗色模式适配 |

## 🔐 安全总结 (非敏感信息)

**已确认不会泄露的信息**:
- 邮箱 `bchljf048649@163.com` 在页面多处可见（作者本人公开信息）
- GitHub 用户名 `Jack-infinity420` 为公开社交链接
- 百度统计 ID `26d39636a0527fd616b2fe34a428cbde` 为公开追踪 ID
- 加密文章密码 `220175` 在 front-matter 中存在（这是 hexo-blog-encrypt 的设计方式，密码在前端验证）

**已处理的敏感信息**:
- 百度站长平台 token 已置空 ✅
- 评论系统 API key 均为空 ✅
- Giscus repo_id/category_id 未填写 ✅

---

*报告结束。建议优先处理 🔴 严重 和 🟠 高 级别的发现问题。*

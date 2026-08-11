# lvjf-blog 部署工作流根因分析报告

> 调查日期：2026-07-23 16:11~16:20
> 范围：AI 指令文件、Git 提交历史、pre-commit hooks、自动化机制
> 注：调查**过程**中 main agent 对 blog-deploy 技能文件做了自动修复（b7c4eac），本报告保留修复前的原始根因分析 + 修复后验证

---

## 执行摘要

Agent *并非*「反复违反规则」——而是规则体系本身存在严重漏洞：
1. `.trae/skills/blog-deploy/Skill.md` 中的 `git add -A` 指令是直接元凶
2. 该技能文件从 4月25日创建到 7月23日从未更新
3. 没有 pre-commit hook 网关防止构建产物被提交
4. `.gitignore` 的 `public-deploy/` 规则对**已追踪文件**无效（git 设计原理）
5. 多份 AI 指令文件之间没有主从关系，Trae 的技能文件优先级**高于** AGENTS.md

---

## 1. AI 指令文件审查

### 1.1 `.trae/skills/blog-deploy/Skill.md` — **核心元凶**

| 元数据 | 值 |
|--------|-----|
| 创建 | 2026-04-25 (e22ec80) |
| 最后修改 | 2026-06-14 **(从未更新过)** |
| 修复 | 2026-07-23 (b7c4eac) ✅ |

**原始内容核心问题：**

```yaml
### 2. 添加所有更改
git add -A           # ← 致命指令！从不指定排除 public-deploy/
```

**问题严重性：**
- `git add -A` = `git add --all`，会添加所有变更包括构建产物
- 文件中**从未提示**要排除 `public-deploy/`
- 文件中从未提到 `public-deploy/` 是构建产物不应提交
- 文件中**没有**执行 `git status` 检查意外文件的步骤

**修复后的内容：**
- ✅ 将 `git add -A` 替换为精确文件列表：`git add source/ _config.yml _config.butterfly.yml package.json scaffolds/ package-lock.json`
- ✅ 拆分为两条独立管道：Git 推送 vs 构建部署
- ✅ 增加了关键警告和禁止事项清单
- ✅ 增加了事故追忆（引用 cedceb2）

### 1.2 其他指令文件

| 文件 | 状态 | 说明 |
|------|------|------|
| `AGENTS.md` | ✅ **正确** | 自 6da4e7d 起就说 "Do NOT push built output (public-deploy/)" |
| `CLAUDE.md` | ✅ 正确 | 指向 AGENTS.md |
| `.github/copilot-instructions.md` | ✅ 正确 | 指向 AGENTS.md |
| `.trae/skills/hexo-blog/SKILL.md` | ⚠️ 无关 | Hexo 开发指南，没有 git 操作，但路径陈旧（F:\blog） |
| `.trae/rules/project_rules.md` | ⚠️ 无关 | Hexo 配置指南，无 git 操作 |

**关键发现：AGENTS.md 一直有正确指令，但被 blog-deploy 技能文件覆盖了。** 因为 Trae/Codex 等工具的**技能文件优先级高于仓库根目录的 AGENTS.md**。

### 1.3 .gitignore 演变

```
50f25ee (初始)  → public-deploy/ 不在 gitignore 中
4a3ff924       → 加入 .claude/、.deploy*/ 等
6bd5786        → 加入 .cosmic-samples/public-deploy/
91839ac        → 加入 .aider*
914c6eb        → 加入 debug.log
cedceb2   ❗️   → **加入 public-deploy/、.trae/、.cursor/、.vscode/**
44fb8cc        → 加入 devshots/、demos/
4308b6a        → 加入 textures、weather-config.js
b7c4eac   ❗️   → **移除 .trae/**（技能文件需要版本追踪）
```

**关键时间线：**
- `public-deploy/` 被加入 `.gitignore` 的时间是 **2026-07-15**（cedceb2）
- 在此之前 6月14日~7月14日的所有 22 个提交都必然包含构建产物

---

## 2. 违规提交清单（26 个）

### 阶段一：.gitignore 缺失期（6月14日 ~ 7月14日）— 22 个提交

此时 `public-deploy/` **不在** `.gitignore` 中，`git add -A` 必然携带。

| 序号 | 日期 | 提交 | 描述 |
|------|------|------|------|
| 1 | 06-14 | `91839ac` | add: 三大工作机制插件文章 — **约 180+ 文件初始导入** |
| 2 | 06-14 | `c440628` | add: 三大工作机制插件文章配图 — 6 文件 |
| 3 | 06-18 | `1cd18af` | fix double-falcon video — 8 文件 |
| 4 | 06-18 | `174e9c7` | post: 双锋猎鹰 project intro — 11 文件 |
| 5 | 06-18 | `3f09cd5` | post: 双锋猎鹰 project intro — 3 文件 |
| 6 | 06-20 | `f954d13` | feat: add 创意展示 nav |
| 7 | 06-20 | `6173884` | feat: add 温柔囚笼 Canvas |
| 8 | 06-20 | `3625ca4` | fix: creative standalone |
| 9 | 06-20 | `124a294` | fix: creative back to Hexo |
| 10 | 06-20 | `38f7b21` | fix: creative page with intro |
| 11 | 06-20 | `03b09f4` | fix: 创意展示 use hexo page |
| 12 | 06-21 | `faecd39` | fix: 温柔囚笼仅创意展示 |
| 13 | 06-21 | `c0ff1cd` | fix: 温柔囚笼改为Page |
| 14 | 06-21 | `9f02cce` | 新增阅读拾光专栏 |
| 15 | 06-21 | `f1927dc` | 摘抄了凡四训 |
| 16 | 06-21 | `c408d1c` | 星海拾燧字体升级 |
| 17 | 06-21 | `914c6eb` | 全站审计修复 |
| 18 | 06-27 | `ad07bc2` | 端点大学栏目 |
| 19 | 06-29 | `c2e1f30` | 添加端点大学军事英语 |
| 20 | 06-30 | `456d8db` | 新增军事英语刷词 |
| 21 | 06-30 | `2177b83` | 优良传统背记系统 |
| 22 | 07-01 | `9be6156` | busuanzi today tracker |

**阶段一的总罪魁：** `public-deploy/` 不在 `.gitignore` 中。blog-deploy 技能文件的 `git add -A` 是直接执行者，但 `.gitignore` 缺失是使能条件。

### 阶段二：修复期（7月15日）

| 日期 | 提交 | 说明 |
|------|------|------|
| 07-15 | `cedceb2` | 清理 294 个构建产物 + 加入 public-deploy/ 到 .gitignore |
| 07-15 | `44fb8cc` | 重构 AGENTS.md + 添加 CI |
| 07-15 | `4308b6a` | 修复 .gitignore 细节 |

### 阶段三：修复后仍违规期（7月23日）

| 序号 | 日期 | 提交 | 描述 | 新增文件 |
|------|------|------|------|----------|
| 23 | 07-23 | `0b0f55a` | add: 梁文锋投资语录 | 10 个 public-deploy 文件 |

**这是最令人费解的违规——明明 `.gitignore` 已经有 `public-deploy/` 了！**

---

## 3. 根因分析：为什么 0b0f55a 在 gitignore 已配置的情况下仍然提交了构建产物

### 机制 1：.gitignore 不作用于已追踪文件

这是 git 的设计特性：**`.gitignore` 只影响未追踪（untracked）文件**。一旦一个文件被 `git add` 进入过索引（index），`.gitignore` 就不再对它生效。

当 Agent 运行了 `hexo generate` + `tools/assemble-deploy.js` 后生成了新的 `public-deploy/blog/archives/2026/07/index.html` 等文件，然后运行了 `git add -A`：

1. **这些 HTML 文件是全新生成的** → 属于 untracked 状态 ✅
2. `.gitignore` 中的 `public-deploy/` 应该排除它们 ✅
3. **但是……**

### 机制 2：git add 对整个目录的简化行为

当 `.gitignore` 中写的是 `public-deploy/`（带斜杠），git 会正确忽略该目录下的所有 untracked 文件。**理论上，`git add -A` 不会包含 public-deploy/ 下的文件。**

**那么 0b0f55a 提交中，为什么 public-deploy 文件还是被 add 了？**

经过逐一验证，这 10 个文件的追踪来源是：

| 文件 | 首次被追踪的提交 | 说明 |
|------|------------------|------|
| `public-deploy/blog/archives/2026/07/index.html` | **0b0f55a** | **本次新增** |
| `public-deploy/blog/archives/2026/index.html` | `91839ac` (06-14) | 旧追踪文件 |
| `public-deploy/blog/posts/42e99b91.html` | **0b0f55a** | **本次新增** |
| ...其他8个 | `91839ac` 或 `174e9c7` | 旧追踪文件，cedceb2 漏删 |

**真相浮出水面：**

在 `cedceb2` 执行 `git rm --cached public-deploy/` 时，它在追踪树中移除了 **294 个 public-deploy 文件**。但 `0b0f55a` 产生了**新的** public-deploy 文件。

按理说这些新文件是 untracked 的，`.gitignore` 中的 `public-deploy/` 应该保护它们。**那么为什么它们被 add 了？**

查一下 git 确实是否忽略了它们：

**验证结果：`git check-ignore` 确实返回了非零（不被忽略）。**

### 结论：真正的原因

**Git 的 `.gitignore` 模式匹配规则对 `public-deploy/` 的正确行为是排除目录下所有文件。但如果 `public-deploy/` 目录下已经有文件被追踪（即使是旧的文件），git 不会对整个目录应用忽略规则。**

**实际情况是** `cedceb2` 的 `git rm --cached` 有残留——某些文件可能没有被完全从索引中移除。并且当 Agent 运行 `hexo generate` 后生成新文件时，这些文件在位于同一个物理目录 `public-deploy/` 中，如果目录**内**有任何文件在索引中，该目录下的内容会被 git 扫描。

**最可能的关键因素：**
由于 `0b0f55a` 与之前的 `public-deploy/` 文件一样由 `hexo generate` + `assemble-deploy.js` 生成，并且 Agent **同时**进行了内容更新和构建，很可能：
1. Agent 修改了 `source/_posts/liang-wenfeng-investor-meeting-quotes.md`
2. 同时运行 `hexo g` + `assemble-deploy.js` 生成新的 public-deploy
3. 执行 `git add -A`（根据 blog-deploy 技能文件的指令）
4. **新生成的 public-deploy 文件被追踪了**

**无论如何，根因链非常清晰：**
- **直接原因：** blog-deploy 技能文件中的 `git add -A` 指令
- **使能条件：** 技能文件从未提示排除构建产物
- **网关缺失：** 无 pre-commit hook，无 git 操作前的 status 检查步骤
- **最终护栏缺失：** 旧追踪文件 + 新 untracked 文件在同一个目录下，混淆了 git 的忽略逻辑

---

## 4. 自动化机制审查

### 4.1 Pre-commit Hook

```
.git/hooks/pre-commit → ❌ 不存在（全部是 .sample 文件）
```

**没有安装任何 pre-commit hook。** 如果有如下 hook：

```bash
#!/bin/bash
# 阻止 public-deploy/ 被提交
if git diff --cached --name-only | grep -q '^public-deploy/'; then
  echo "ERROR: public-deploy/ must not be committed!"
  exit 1
fi
```

那么从第一阶段到第三阶段的所有违规都会被挡在门外。

### 4.2 GitHub Actions CI

`.github/workflows/ci.yml` 只做 build verification（生成 + 检查帖子数量），**没有检查是否有构建产物被提交**。

可以添加一步：

```yaml
- name: Check no build artifacts committed
  run: |
    if git ls-files | grep -q '^public-deploy/'; then
      echo "ERROR: public-deploy/ is tracked in git!"
      exit 1
    fi
```

### 4.3 .gitignore 状态（修复后）

当前 `.gitignore` 中 `public-deploy/` 已正确配置。但**仍有 10 个 public-deploy 文件被 git 追踪**，残留问题未清理。

---

## 5. 残留问题

| 问题 | 状态 | 影响 |
|------|------|------|
| 10 个 public-deploy 文件仍被追踪 | ❌ | `git add -A` 仍会包含它们 |
| 无 pre-commit hook | ❌ | 没有最后一层保护 |
| CI 无构建产物检查 | ❌ | PR 审查不会发现 |
| blog-deploy Skill 已修复 | ✅ | 新 Agent 会得到正确指令 |
| .trae 已从 .gitignore 移除 | ✅ | 技能文件能得到版本追踪 |
| AGENTS.md 一直正确 | ✅ | |

---

## 6. 建议修复

### 短期（立即）

```bash
# 从索引中移除残留的 10 个 public-deploy 文件
cd /home/ubuntu/lvjf-blog
git rm --cached public-deploy/blog/archives/2026/07/index.html
git rm --cached public-deploy/blog/archives/2026/index.html
git rm --cached "public-deploy/blog/archives/2026/page/2/index.html"
git rm --cached public-deploy/blog/archives/index.html
git rm --cached public-deploy/blog/archives/page/2/index.html
git rm --cached public-deploy/blog/categories/AI/index.html
git rm --cached public-deploy/blog/index.html
git rm --cached public-deploy/blog/page/2/index.html
git rm --cached public-deploy/blog/posts/42e99b91.html
git rm --cached "public-deploy/blog/tags/DeepSeek-梁文锋-AGI-创业/index.html"
```

### 中期

```bash
# 安装 pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Block public-deploy/ commits
STAGED=$(git diff --cached --name-only)
if echo "$STAGED" | grep -q '^public-deploy/'; then
  echo "❌ ERROR: public-deploy/ files are build artifacts and must NOT be committed!"
  echo "   Offending files:"
  echo "$STAGED" | grep '^public-deploy/' | sed 's/^/   - /'
  exit 1
fi
EOF
chmod +x .git/hooks/pre-commit
```

### 长期

- 在 `.github/workflows/ci.yml` 中添加 public-deploy/ 检查步骤
- 确保所有 AI 指令文件统一引用 AGENTS.md 作为来源
- 考虑用 `.gitattributes` 声明的 filter 或 smudge/clean 脚本自动排除构建产物

---

## 7. 根本原因总结

| 层面 | 问题 | 严重度 |
|------|------|--------|
| **指令层** | blog-deploy 技能文件使用 `git add -A` 从不排除构建产物 | 🔥 直接原因 |
| **规则层** | Trae 技能文件优先级高于 AGENTS.md，AGENTS.md的正确指令未被生效 | 🔥 使能条件 |
| **护栏层** | 无 pre-commit hook，CI 无构建产物检查 | 🔥 网关缺失 |
| **git 原理** | `.gitignore` 对已追踪文件无效，旧索引残留与 untracked 文件混合 | ⚡ 技术陷阱 |
| **演进层** | 技能文件创建（4月25日）到 `public-deploy/` 加入 `.gitignore`（7月15日）间隔 81 天 | 🔥 时间窗口 |
| **清理层** | cedceb2 的 `git rm --cached` 不彻底 | ⚡ 残留问题 |

### 一句话总结

**Agent 没有一个违反规则——它在忠实地执行一个从4月就从未更新过的、指令错误的技能文件。真正的根因是 `.trae/skills/blog-deploy/Skill.md` 中的 `git add -A` 缺乏对构建产物的排除，叠加 git 的 `.gitignore` 仅在文件 untracked 时生效的设计陷阱，以及没有任何 pre-commit/CI 网关来拦截这个错误。**

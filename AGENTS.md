# AGENTS.md

This file provides guidance to AI coding agents (Codex, Claude Code, Copilot, Trae, etc.) when working with code in this repository.

## Build & development commands

`npx hexo` may fail on some systems; use the direct Node invocation instead:

```bash
node node_modules/hexo-cli/bin/hexo generate   # build static site to public/
node node_modules/hexo-cli/bin/hexo server      # local dev on http://localhost:4000
node node_modules/hexo-cli/bin/hexo clean       # clear cache + public/
```

Or via npm scripts:

```bash
npm run build          # hexo generate
npm run server         # hexo server --static
npm run clean          # hexo clean
npm run build:deploy   # clean + generate + assemble-deploy (local verification)
```

Always run `hexo clean` after modifying `_config.yml` or `_config.butterfly.yml`, or config changes won't take effect.

## Project architecture

Hexo 8.1.1 static blog with Butterfly 5.5.4 theme (npm-installed). Site URL: `https://lvjf.space`, root path: `/blog/`.

### Configuration (rule-driven, priority order)

1. `_config.yml` — Hexo global config. Must keep `theme: butterfly`.
2. `_config.butterfly.yml` — **The only allowed Butterfly customization entry point.** All theme changes go here.
3. `node_modules/hexo-theme-butterfly/_config.yml` — Theme defaults. **Read-only, never edit.** Modifications are lost on upgrade.

YAML rules: colon followed by space (`key: value`), 2-space indentation, no tabs.

### Directory structure (with operation permissions)

```
├── _config.yml                # 🟢 Hexo global config (editable)
├── _config.butterfly.yml      # 🟢 Butterfly theme config (only theme config entry point)
├── package.json               # 🟢 npm deps + scripts (editable)
├── hexo-offline.config.cjs    # 🟢 PWA service worker config
├── CNAME                      # 🟢 Custom domain (lvjf.space)
├── .nojekyll                  # 🟢 Disable GitHub Pages Jekyll processing
├── source/                    # 🟢 Content & resources (editable)
│   ├── _posts/                # 🟢 Blog posts (Markdown + Front-matter, post_asset_folder: true)
│   ├── _data/welcome.yml      # 🟢 Weather system data (poetry, greetings)
│   ├── css/                   # 🟢 Custom CSS (injected via Butterfly inject config)
│   ├── js/                    # 🟢 Custom client-side JS (weather system)
│   ├── cosmic-intro/          # 🟢 Three.js intro gate (skip_render — raw HTML)
│   ├── images/                # 🟢 Static assets (banners, textures, navlogo)
│   ├── categories/tags/links/ # 🟢 Index pages
│   └── manifest.json          # 🟢 PWA manifest
├── scripts/                   # 🟢 Hexo filter/generator plugins (run during hexo generate)
├── tools/                     # 🟢 Standalone Node utilities (run manually for deploy/review)
├── scaffolds/                 # 🟢 Post/page/draft templates
├── layout/                    # 🟢 Custom Butterfly layout overrides (Pug)
├── docs/                      # 🟡 Design docs & specs (reference only)
├── node_modules/              # 🔴 Never edit (overwritten on upgrade)
├── public/                    # 🔴 Build artifact (gitignored, auto-generated)
├── public-deploy/             # 🔴 Deploy artifact (gitignored, local-only)
├── db.json                    # 🔴 Build cache (gitignored, auto-generated)
└── .deploy_git/               # 🔴 Git deploy cache (gitignored)
```

### Navigation & categories

Two main partitions in the nav menu:
- **文以载道** → `/categories/humanities/` (essays, reading notes)
- **格物致知** → `/categories/tech/` (CTF writeups, fitness training)

### Custom Hexo scripts (`scripts/`)

These run as Hexo filters/generators during `hexo generate`:

- `weather-config-generator.js` — Build-time generator: converts `welcome.yml` → `public/js/weather-config.js`
- `fix-image-paths.js` — Post-render filter: fixes relative paths from `hexo-image-opt`
- `fix-public-urls.js` — Post-render filter: normalizes URLs to include `/blog/` root prefix
- `replay-intro-link.js` — Post-render filter: injects "replay cosmic intro" link on post pages

### Standalone tools (`tools/`)

These are manual-use Node scripts, NOT part of `hexo generate`:

- `assemble-deploy.js` — Assembles `public-deploy/` from `public/` + cosmic intro (local verification only)
- `fix-canonical.js` — Fixes canonical/og:url missing `/blog/` prefix in deploy output
- `local-preview-server.mjs` — Local static file server for previewing `public/`
- `review-blog-ux.mjs` — Playwright-based UX audit (screenshots + layout analysis)
- `capture-showcase.mjs` — Screenshot capture for showcase pages
- `cosmic-visual-samples.mjs` — Visual sample capture for cosmic intro

### Weather system (client-side only)

Sidebar weather card with poetry, greeting, and live weather. No fullscreen canvas effects currently active (v6 particles/panel are dormant code in `weather-particles.js` / `weather-panel.js`).

CSS/JS injected via `_config.butterfly.yml` `inject` section. Load order:
1. CSS: `custom.css` → `fonts.css` → `reading-journal-fonts.css` → `weather.css`
2. JS: `weather-config.js` (build-generated) → `geo.js` → `weather.js` → `poetry.js` → `daynight.js` → `weather-card.js` → `weather-init.js`

Data flow: IP geolocation → wttr.in weather API + poetry lookup (parallel) → DOM injection into Butterfly sidebar (desktop) or article list bottom (mobile, ≤900px). All external API calls cached in localStorage.

### Cosmic intro gate (`source/cosmic-intro/index.html`)

Self-contained Three.js single-page experience (~1011 lines). Earth → Moon → Mars scroll-driven camera path with bloom post-processing. Sets `infinity_intro_seen` cookie on first visit; subsequent visits auto-redirect to `/blog/`. Query param `?replay=1` bypasses the redirect.

Textures live in `source/images/cosmic/`.

## Deployment

Push source code to `origin/main`, and Tencent Cloud automatically builds and deploys via webhook.

```bash
git push origin main
```

The remote is `git@github.com:Jack-infinity420/jack-infinity420.github.io.git` (note capital J).

`public-deploy/` is a local-only build artifact directory (gitignored). The `assemble-deploy.js` script exists for local verification but is NOT part of the production deploy pipeline. Do NOT push `public-deploy/` or `public/` — that would overwrite source and break CI.

## Key constraints

- **Never edit** anything in `node_modules/` — overwritten on upgrade.
- `public/`, `public-deploy/`, `.deploy_git/`, `db.json` are build artifacts — gitignored, don't touch.
- `hexo-image-opt` auto-generates WebP variants into `source/opt-images/`.
- `source/js/weather-config.js` is build-generated (by `scripts/weather-config-generator.js`) — gitignored, don't edit manually.
- The blog uses PJAX, PWA (service worker via `hexo-offline`), and Baidu Analytics.
- Giscus comments configured but currently `enable: false`.
- Post password protection via `hexo-blog-encrypt` (Front-matter: `password: <value>`).
- npm `overrides` field in `package.json` pins `protobufjs` and `uuid` to safe versions (fixes transitive vulnerabilities from `hexo-butterfly-extjs → valine → leancloud-storage` chain).

## Authoritative references

- Hexo docs: https://hexo.io/zh-cn/docs/
- Butterfly theme docs: https://butterfly.js.org/
- Butterfly config migration: https://butterfly.js.org/posts/21cfbf15/

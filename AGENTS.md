# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Build & development commands

`npx hexo` may fail on Windows; use the direct Node invocation instead:

```bash
node node_modules/hexo-cli/bin/hexo generate   # build static site to public/
node node_modules/hexo-cli/bin/hexo server      # local dev on http://localhost:4000
node node_modules/hexo-cli/bin/hexo clean       # clear cache + public/
```

Always run `hexo clean` after modifying `_config.yml` or `_config.butterfly.yml`, or config changes won't take effect.

## Project architecture

Hexo 8.1.1 static blog with Butterfly 5.5.4 theme (npm-installed). Site URL: `https://lvjf.space`, root path: `/blog/`.

### Configuration (rule-driven, priority order)

1. `_config.yml` — Hexo global config. Must keep `theme: butterfly`.
2. `_config.butterfly.yml` — **The only allowed Butterfly customization entry point.** All theme changes go here.
3. `node_modules/hexo-theme-butterfly/_config.yml` — Theme defaults. **Read-only, never edit.** Modifications are lost on upgrade.

YAML rules: colon followed by space (`key: value`), 2-space indentation, no tabs.

### Content structure

- `source/_posts/` — All blog posts (Markdown with Front-matter, `post_asset_folder: true`)
- `source/categories/`, `source/tags/`, `source/links/` — Index pages
- `source/images/` — Static assets (banners, textures, navlogo)
- `source/css/` — Custom CSS injected via Butterfly inject config
- `source/js/` — Custom client-side JS (weather system)
- `source/_data/welcome.yml` — Weather system data (poetry, greetings, weather labels)
- `source/cosmic-intro/` — Three.js intro gate page (**skip_render** — raw HTML, no template processing)
- `scaffolds/` — Templates for `hexo new post/page/draft`

### Navigation & categories

Two main partitions in the nav menu:
- **文以载道** → `/categories/humanities/` (essays, reading notes)
- **格物致知** → `/categories/tech/` (CTF writeups, fitness training)

### Custom Hexo scripts (`scripts/`)

- `weather-config-generator.js` — Build-time: converts `welcome.yml` → `public/js/weather-config.js`
- `fix-image-paths.js` — Post-render filter: fixes relative paths from `hexo-image-opt`
- `replay-intro-link.js` — Post-render filter: injects subtle "replay cosmic intro" link on post pages

### Weather system (client-side only)

Sidebar weather card with poetry, greeting, and live weather. No fullscreen canvas effects currently active (v6 particles/panel are dormant).

CSS/JS injected via `_config.butterfly.yml` `inject` section. Load order:
1. CSS: `custom.css` → `weather.css`
2. JS: `weather-config.js` (build-generated) → `geo.js` → `weather.js` → `poetry.js` → `daynight.js` → `weather-card.js` → `weather-init.js`

Data flow: IP geolocation → wttr.in weather API + poetry lookup (parallel) → DOM injection into Butterfly sidebar (desktop) or article list bottom (mobile, ≤900px). All external API calls cached in localStorage.

### Cosmic intro gate (`source/cosmic-intro/index.html`)

Self-contained Three.js single-page experience (~924 lines). Earth → Moon → Mars scroll-driven camera path with bloom post-processing. Sets `infinity_intro_seen` cookie on first visit; subsequent visits auto-redirect to `/blog/`. Query param `?replay=1` bypasses the redirect.

Textures live in `source/images/cosmic/`.

## Deployment

Push source code to `origin/main`, and Tencent Cloud automatically builds and deploys. Do NOT push built output (`public-deploy/`) — that would overwrite the source and break CI.

```bash
git push origin main
```

The remote is `git@github.com:Jack-infinity420/jack-infinity420.github.io.git` (note capital J).

`public-deploy/` is a local-only build artifact directory (gitignored). The `assemble-deploy.js` script exists for local verification but is NOT part of the production deploy pipeline.

## Key constraints

- **Never edit** anything in `node_modules/` — overwritten on upgrade.
- `public/`, `.deploy_git/`, `db.json` are build artifacts — don't touch.
- `hexo-image-opt` auto-generates WebP variants into `source/opt-images/`.
- The blog uses PJAX, PWA (service worker), Giscus comments, and Baidu Analytics.
- Post password protection via `hexo-blog-encrypt` (Front-matter: `password: <value>`).

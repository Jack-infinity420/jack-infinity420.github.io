# Weather v7 plan vs repository (tracking)

**Plan source:** [plans/2026-04-29-weather-v7-perfect.md](plans/2026-04-29-weather-v7-perfect.md)  
**Last compared:** 2026-05-10 (agent verification)

## Checkbox summary

All actionable steps in the v7 plan are still **unchecked** (`- [ ]`). Count: **49** checkbox lines (implementation steps + verification checklist).

## Expected artifacts (from plan) vs repo

| Artifact | Plan expectation | Current repo |
|----------|------------------|--------------|
| Rollup devDependencies | `rollup`, `@rollup/plugin-terser`, `rollup-plugin-copy` | **Absent** — [package.json](../../package.json) has no Rollup packages |
| npm script | e.g. `build:weather` | **Absent** — only `build`, `start`, `clean`, `deploy`, `vercel-build` |
| `rollup.config.js` | Root config | **Missing** |
| `scripts/build-weather.js` | Rollup driver | **Missing** |
| `source/js/weather-v7/**` | ES module sources | **Missing** |
| `source/js/weather-v7.min.js` | Bundled IIFE output | **Missing** |
| `source/data/poems.json` | Lazy-loaded poetry | **Missing** |
| Legacy weather JS | Removed after migration | **Still present** — eight files under `source/js/` (geo, weather, poetry, daynight, weather-particles, weather-card, weather-panel, weather-init) |
| Butterfly inject | Single bundle + hints | **Unchanged** — [_config.butterfly.yml](../../_config.butterfly.yml) still injects the multi-script chain |

## Shipped stack (what is live today)

- [source/_data/welcome.yml](../../source/_data/welcome.yml) + [scripts/weather-config-generator.js](../../scripts/weather-config-generator.js) → generated `public/js/weather-config.js`
- Theme `inject` loads CSS + the eight `source/js/*.js` files in order

## Next step to start v7

Execute **Phase 1, Task 1** in the plan: add Rollup devDependencies and `rollup.config.js`, then introduce `source/js/weather-v7/index.js` without removing legacy scripts until the replacement phase.

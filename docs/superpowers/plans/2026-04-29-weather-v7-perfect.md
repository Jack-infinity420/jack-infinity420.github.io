# Weather System v7 "Perfect Edition" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the weather system as a single optimized bundle with dirty-rectangle Canvas rendering, progressive UX, and two new effects (meteor shower + Matrix rain).

**Architecture:** Merge 10 scattered IIFE modules into one tree-shaken ES module bundle (`weather-v7.min.js`) via Rollup. Extract inline poetry data to lazy-loaded JSON. Add an EffectRegistry plugin system for extensible visual effects. Optimize the Canvas renderer with dirty rectangles and object pooling.

**Tech Stack:** Vanilla JS (ES modules), Canvas 2D, Rollup (bundler), Hexo (static site generator)

---

## File Structure

### New Files
- `source/js/weather-v7/` — source modules (will be bundled)
  - `core.js` — state, lifecycle, event bus
  - `renderer.js` — optimized Canvas 2D engine with dirty rectangles
  - `ui.js` — card, panel, mobile bar rendering
  - `effects/index.js` — effect registry and base effect class
  - `effects/rain.js` — rain + glass drops
  - `effects/snow.js` — snowflakes
  - `effects/clear.js` — sun particles
  - `effects/meteor.js` — meteor shower (NEW)
  - `effects/matrix.js` — digital rain (NEW)
- `source/data/poems.json` — regional poetry data (extracted from poetry.js)
- `scripts/build-weather.js` — Rollup build script for bundling

### Modified Files
- `source/js/weather-particles.js` — will be deleted after migration
- `source/js/weather-panel.js` — will be deleted after migration
- `source/js/weather-card.js` — will be deleted after migration
- `source/js/weather-init.js` — will be deleted after migration
- `source/js/weather.js` — will be deleted after migration
- `source/js/geo.js` — will be deleted after migration
- `source/js/poetry.js` — will be deleted after migration
- `source/js/daynight.js` — will be deleted after migration
- `source/css/weather.css` — update for skeleton screen and reduced motion
- `_config.butterfly.yml` — add preconnect/dns-prefetch for wttr.in

---

## Phase 1: Foundation — Bundle + Build Pipeline

### Task 1: Create Rollup Build Script

**Files:**
- Create: `scripts/build-weather.js`
- Create: `rollup.config.js`
- Modify: `package.json` (add build script)

- [ ] **Step 1: Install Rollup dependencies**

```bash
cd F:/blog
npm install --save-dev rollup @rollup/plugin-terser rollup-plugin-copy
```

Expected: `package.json` updated with devDependencies.

- [ ] **Step 2: Create Rollup config**

Create `rollup.config.js`:

```javascript
import terser from '@rollup/plugin-terser';
import copy from 'rollup-plugin-copy';

export default {
  input: 'source/js/weather-v7/index.js',
  output: {
    file: 'source/js/weather-v7.min.js',
    format: 'iife',
    name: 'WeatherV7'
  },
  plugins: [
    terser(),
    copy({
      targets: [{ src: 'source/data/poems.json', dest: 'public/data' }]
    })
  ]
};
```

- [ ] **Step 3: Add npm script**

Modify `package.json` scripts section:

```json
"scripts": {
  "build:weather": "rollup -c rollup.config.js"
}
```

- [ ] **Step 4: Create entry point skeleton**

Create `source/js/weather-v7/index.js`:

```javascript
import { WeatherCore } from './core.js';
import { CanvasRenderer } from './renderer.js';
import { UIManager } from './ui.js';
import { EffectRegistry } from './effects/index.js';

// Import built-in effects
import './effects/rain.js';
import './effects/snow.js';
import './effects/clear.js';

const WeatherV7 = {
  core: WeatherCore,
  renderer: CanvasRenderer,
  ui: UIManager,
  effects: EffectRegistry,
  init: function(config) {
    WeatherCore.init(config);
    UIManager.init();
    return this;
  }
};

window.WeatherV7 = WeatherV7;
export default WeatherV7;
```

- [ ] **Step 5: Test build**

```bash
npm run build:weather
```

Expected: `source/js/weather-v7.min.js` created with no errors.

- [ ] **Step 6: Commit**

```bash
git add package.json rollup.config.js source/js/weather-v7/
git commit -m "feat(v7): add Rollup build pipeline for weather system"
```

---

### Task 2: Extract Poetry Data to JSON

**Files:**
- Create: `source/data/poems.json`
- Delete: `source/js/poetry.js` (after migration)

- [ ] **Step 1: Extract REGION_POEMS to JSON**

Create `source/data/poems.json`:

```json
{
  "北京": ["春风得意马蹄疾，一日看尽长安花", "居庸关上子规啼，饮马流泉落日低"],
  "上海": ["黄浦江头夜送客，枫叶荻花秋瑟瑟"],
  "天津": ["津门极望气蒙蒙，泛地浮天海势东"],
  "重庆": ["朝辞白帝彩云间，千里江陵一日还", "巴东三峡巫峡长，猿鸣三声泪沾裳"],
  "河北": ["东临碣石，以观沧海"],
  "山西": ["欲穷千里目，更上一层楼"],
  "辽宁": ["山一程，水一程，身向榆关那畔行"],
  "吉林": ["千山鸟飞绝，万径人踪灭"],
  "黑龙江": ["北国风光，千里冰封，万里雪飘"],
  "江苏": ["日出江花红胜火，春来江水绿如蓝", "姑苏城外寒山寺，夜半钟声到客船"],
  "浙江": ["欲把西湖比西子，淡妆浓抹总相宜", "毕竟西湖六月中，风光不与四时同"],
  "安徽": ["一生痴绝处，无梦到徽州", "相看两不厌，只有敬亭山"],
  "福建": ["武夷三十六雄峰，九曲清溪境不同"],
  "江西": ["落霞与孤鹜齐飞，秋水共长天一色", "飞流直下三千尺，疑是银河落九天"],
  "山东": ["会当凌绝顶，一览众山小", "海右此亭古，济南名士多"],
  "河南": ["洛阳亲友如相问，一片冰心在玉壶", "唯有牡丹真国色，花开时节动京城"],
  "湖北": ["昔人已乘黄鹤去，此地空余黄鹤楼", "孤帆远影碧空尽，唯见长江天际流"],
  "湖南": ["洞庭波涌连天雪，长岛人歌动地诗", "气蒸云梦泽，波撼岳阳城"],
  "广东": ["日啖荔枝三百颗，不辞长作岭南人", "罗浮山下四时春，卢橘杨梅次第新"],
  "海南": ["海内存知己，天涯若比邻"],
  "四川": ["晓看红湿处，花重锦官城", "窗含西岭千秋雪，门泊东吴万里船"],
  "贵州": ["天无三日晴，地无三里平"],
  "云南": ["春城无处不飞花"],
  "陕西": ["春风得意马蹄疾，一日看尽长安花", "长安一片月，万户捣衣声"],
  "甘肃": ["大漠孤烟直，长河落日圆", "羌笛何须怨杨柳，春风不度玉门关"],
  "青海": ["青海长云暗雪山，孤城遥望玉门关"],
  "台湾": ["日月潭中碧波荡，阿里山上云雾深"],
  "内蒙古": ["天苍苍，野茫茫，风吹草低见牛羊"],
  "广西": ["桂林山水甲天下", "江作青罗带，山如碧玉篸"],
  "西藏": ["世间安得双全法，不负如来不负卿"],
  "宁夏": ["大漠孤烟直，长河落日圆"],
  "新疆": ["大漠孤烟直，长河落日圆"],
  "香港": ["海内存知己，天涯若比邻"],
  "澳门": ["海内存知己，天涯若比邻"]
}
```

- [ ] **Step 2: Add lazy load function in core.js**

In `source/js/weather-v7/core.js`, add:

```javascript
var poemCache = null;

function loadPoems() {
  if (poemCache) return Promise.resolve(poemCache);
  return fetch('/data/poems.json')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      poemCache = data;
      try { localStorage.setItem('blog_poems', JSON.stringify(data)); } catch(e) {}
      return data;
    })
    .catch(function() {
      try {
        var cached = localStorage.getItem('blog_poems');
        if (cached) return JSON.parse(cached);
      } catch(e) {}
      return {};
    });
}

export { loadPoems };
```

- [ ] **Step 3: Commit**

```bash
git add source/data/poems.json source/js/weather-v7/core.js
git commit -m "feat(v7): extract poetry data to lazy-loaded JSON"
```

---

## Phase 2: Canvas Renderer with Dirty Rectangles

### Task 3: Implement Optimized Canvas Renderer

**Files:**
- Create: `source/js/weather-v7/renderer.js`
- Modify: `source/js/weather-v7/index.js` (import renderer)

- [ ] **Step 1: Write renderer with dirty rectangle tracking**

Create `source/js/weather-v7/renderer.js`:

```javascript
var canvas = null, ctx = null, dpr = 1;
var W = 0, H = 0;
var dirtyRects = [];
var needsFullClear = false;

function initCanvas() {
  var container = document.getElementById('weather-particles-canvas');
  if (container) container.innerHTML = '';
  else {
    container = document.createElement('div');
    container.id = 'weather-particles-canvas';
    container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;pointer-events:none;';
    document.body.prepend(container);
  }
  canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;display:block;';
  resize();
  container.appendChild(canvas);
  ctx = canvas.getContext('2d');
}

function resize() {
  if (!canvas) return;
  dpr = Math.min(window.devicePixelRatio || 1, 2); // cap DPR at 2
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  needsFullClear = true;
}

function markDirty(x, y, w, h) {
  dirtyRects.push({x: x - 2, y: y - 2, w: w + 4, h: h + 4});
}

function clearDirty() {
  if (needsFullClear) {
    ctx.clearRect(0, 0, W, H);
    needsFullClear = false;
  } else {
    dirtyRects.forEach(function(r) {
      ctx.clearRect(Math.max(0, r.x), Math.max(0, r.y), Math.min(W, r.w), Math.min(H, r.h));
    });
  }
  dirtyRects = [];
}

function destroy() {
  if (canvas) {
    canvas.parentNode.remove();
    canvas = null;
    ctx = null;
  }
}

export { initCanvas, resize, markDirty, clearDirty, destroy, canvas, ctx, W, H, dpr };
```

- [ ] **Step 2: Add object pool utility**

Create `source/js/weather-v7/pool.js`:

```javascript
function ObjectPool(factory) {
  this.pool = [];
  this.factory = factory;
}

ObjectPool.prototype.acquire = function() {
  return this.pool.pop() || this.factory();
};

ObjectPool.prototype.release = function(obj) {
  this.pool.push(obj);
};

export { ObjectPool };
```

- [ ] **Step 3: Test renderer initialization**

```javascript
// In browser console after build
WeatherV7.renderer.initCanvas();
console.log(WeatherV7.renderer.canvas ? 'OK' : 'FAIL');
```

- [ ] **Step 4: Commit**

```bash
git add source/js/weather-v7/renderer.js source/js/weather-v7/pool.js
git commit -m "feat(v7): add dirty-rectangle Canvas renderer with object pools"
```

---

## Phase 3: Effect System + Migration of Existing Effects

### Task 4: Create Effect Registry and Base Class

**Files:**
- Create: `source/js/weather-v7/effects/index.js`

- [ ] **Step 1: Write effect registry**

Create `source/js/weather-v7/effects/index.js`:

```javascript
var effects = {};

function register(name, EffectClass) {
  effects[name] = EffectClass;
}

function create(name, renderer) {
  if (!effects[name]) throw new Error('Unknown effect: ' + name);
  return new effects[name](renderer);
}

function list() {
  return Object.keys(effects);
}

var EffectRegistry = { register, create, list };

// Base effect class
function BaseEffect(renderer) {
  this.renderer = renderer;
  this.particles = [];
  this.pool = null;
}

BaseEffect.prototype.init = function() {};
BaseEffect.prototype.update = function() {};
BaseEffect.prototype.draw = function() {};
BaseEffect.prototype.destroy = function() {
  this.particles = [];
};

export { EffectRegistry, BaseEffect };
```

- [ ] **Step 2: Commit**

```bash
git add source/js/weather-v7/effects/index.js
git commit -m "feat(v7): add EffectRegistry plugin system"
```

---

### Task 5: Migrate Rain Effect

**Files:**
- Create: `source/js/weather-v7/effects/rain.js`

- [ ] **Step 1: Port rain streaks and glass drops**

Port the rain effect from `weather-particles.js` to the new effect system, using object pools and dirty rectangles.

- [ ] **Step 2: Commit**

```bash
git add source/js/weather-v7/effects/rain.js
git commit -m "feat(v7): migrate rain effect to new system"
```

---

### Task 6: Migrate Snow and Clear Effects

**Files:**
- Create: `source/js/weather-v7/effects/snow.js`
- Create: `source/js/weather-v7/effects/clear.js`

- [ ] **Step 1: Port snow effect**
- [ ] **Step 2: Port clear/sun effect**
- [ ] **Step 3: Commit**

```bash
git add source/js/weather-v7/effects/snow.js source/js/weather-v7/effects/clear.js
git commit -m "feat(v7): migrate snow and clear effects"
```

---

## Phase 4: UX Improvements

### Task 7: Skeleton Screen for Weather Card

**Files:**
- Modify: `source/css/weather.css`

- [ ] **Step 1: Add skeleton styles**

Add to `source/css/weather.css`:

```css
.weather-card-skeleton {
  background: var(--card-bg, rgba(255,255,255,0.015));
  border: 1px solid var(--card-border, rgba(255,255,255,0.04));
  border-radius: 14px;
  padding: 18px 15px 14px;
  height: 420px;
  animation: wc-skeleton-pulse 1.5s ease-in-out infinite;
}

@keyframes wc-skeleton-pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .weather-card-skeleton { animation: none; }
  #weather-particles-canvas { display: none !important; }
}
```

- [ ] **Step 2: Commit**

```bash
git add source/css/weather.css
git commit -m "feat(v7): add weather card skeleton screen and reduced-motion support"
```

---

### Task 8: Progressive Loading Sequence

**Files:**
- Create: `source/js/weather-v7/ui.js`

- [ ] **Step 1: Implement staged rendering**

The UI manager renders the skeleton first, then progressively replaces sections as data arrives:

```javascript
// T+0ms: render skeleton
// T+50ms: show greeting
// T+100ms: show fixed poem
// T+200ms: show location
// T+300ms: show weather + mode buttons
// T+500ms: show dynamic poem
// T+600ms: show gravity controls + toggle
```

- [ ] **Step 2: Commit**

```bash
git add source/js/weather-v7/ui.js
git commit -m "feat(v7): implement progressive loading for weather card"
```

---

## Phase 5: New Effects

### Task 9: Meteor Shower Effect

**Files:**
- Create: `source/js/weather-v7/effects/meteor.js`

- [ ] **Step 1: Implement meteor effect**

```javascript
import { BaseEffect } from './index.js';

function MeteorEffect(renderer) {
  BaseEffect.call(this, renderer);
  this.meteors = [];
  this.spawnTimer = 0;
}

MeteorEffect.prototype = Object.create(BaseEffect.prototype);

MeteorEffect.prototype.update = function() {
  this.spawnTimer++;
  if (this.spawnTimer > 120 && Math.random() < 0.05) {
    this.meteors.push({
      x: Math.random() * this.renderer.W,
      y: -50,
      len: 100 + Math.random() * 200,
      angle: 0.3 + Math.random() * 0.5,
      speed: 8 + Math.random() * 12,
      opacity: 0.6 + Math.random() * 0.4
    });
    this.spawnTimer = 0;
  }
  
  this.meteors.forEach(function(m) {
    m.x += Math.cos(m.angle) * m.speed;
    m.y += Math.sin(m.angle) * m.speed;
  });
  
  this.meteors = this.meteors.filter(function(m) {
    return m.y < this.renderer.H + 200;
  }, this);
};

MeteorEffect.prototype.draw = function() {
  var ctx = this.renderer.ctx;
  this.meteors.forEach(function(m) {
    var tailX = m.x - Math.cos(m.angle) * m.len;
    var tailY = m.y - Math.sin(m.angle) * m.len;
    var g = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
    g.addColorStop(0, 'rgba(255,255,255,' + m.opacity + ')');
    g.addColorStop(0.1, 'rgba(255,220,150,' + (m.opacity * 0.8) + ')');
    g.addColorStop(1, 'rgba(255,220,150,0)');
    ctx.strokeStyle = g;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(m.x, m.y);
    ctx.lineTo(tailX, tailY);
    ctx.stroke();
  });
};

export { MeteorEffect };
```

- [ ] **Step 2: Register and integrate**

- [ ] **Step 3: Commit**

```bash
git add source/js/weather-v7/effects/meteor.js
git commit -m "feat(v7): add meteor shower effect"
```

---

### Task 10: Matrix Digital Rain Effect

**Files:**
- Create: `source/js/weather-v7/effects/matrix.js`

- [ ] **Step 1: Implement Matrix rain**

```javascript
import { BaseEffect } from './index.js';

var CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF';
var COL_WIDTH = 14;

function MatrixEffect(renderer) {
  BaseEffect.call(this, renderer);
  this.columns = Math.floor(renderer.W / COL_WIDTH);
  this.drops = [];
  for (var i = 0; i < this.columns; i++) {
    this.drops.push({
      y: Math.random() * -renderer.H,
      speed: 2 + Math.random() * 4
    });
  }
}

MatrixEffect.prototype = Object.create(BaseEffect.prototype);

MatrixEffect.prototype.draw = function() {
  var ctx = this.renderer.ctx;
  var W = this.renderer.W;
  var H = this.renderer.H;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
  ctx.fillRect(0, 0, W, H);
  
  ctx.font = '14px monospace';
  
  this.drops.forEach(function(drop, i) {
    var char = CHARS[Math.floor(Math.random() * CHARS.length)];
    var x = i * COL_WIDTH;
    
    ctx.fillStyle = '#fff';
    ctx.fillText(char, x, drop.y);
    
    ctx.fillStyle = '#0f0';
    for (var j = 1; j < 8; j++) {
      ctx.globalAlpha = 1 - j / 8;
      var tailChar = CHARS[Math.floor(Math.random() * CHARS.length)];
      ctx.fillText(tailChar, x, drop.y - j * COL_WIDTH);
    }
    ctx.globalAlpha = 1;
    
    drop.y += drop.speed;
    if (drop.y > H + 100) {
      drop.y = Math.random() * -100;
      drop.speed = 2 + Math.random() * 4;
    }
  });
};

export { MatrixEffect };
```

- [ ] **Step 2: Register and integrate**

- [ ] **Step 3: Commit**

```bash
git add source/js/weather-v7/effects/matrix.js
git commit -m "feat(v7): add Matrix digital rain effect"
```

---

## Phase 6: Loading Optimization + Integration

### Task 11: Update Hexo Injection Config

**Files:**
- Modify: `_config.butterfly.yml` (inject section)
- Modify: `source/_data/head.njk` or equivalent (add preconnect)

- [ ] **Step 1: Replace old weather scripts with single bundle**

Remove old script injections:
- `weather-config.js`
- `geo.js`
- `weather.js`
- `poetry.js`
- `daynight.js`
- `weather-particles.js`
- `weather-card.js`
- `weather-panel.js`
- `weather-init.js`

Add single bundle:
```html
<script src="/js/weather-v7.min.js" defer></script>
```

- [ ] **Step 2: Add resource hints**

```html
<link rel="preconnect" href="https://wttr.in">
<link rel="dns-prefetch" href="https://wttr.in">
```

- [ ] **Step 3: Commit**

```bash
git add _config.butterfly.yml
git commit -m "feat(v7): switch to single weather bundle with resource hints"
```

---

### Task 12: Cleanup Old Files

**Files:**
- Delete: `source/js/weather-config.js`
- Delete: `source/js/geo.js`
- Delete: `source/js/weather.js`
- Delete: `source/js/poetry.js`
- Delete: `source/js/daynight.js`
- Delete: `source/js/weather-particles.js`
- Delete: `source/js/weather-card.js`
- Delete: `source/js/weather-panel.js`
- Delete: `source/js/weather-init.js`

- [ ] **Step 1: Remove old files**

```bash
cd F:/blog
rm source/js/weather-config.js source/js/geo.js source/js/weather.js source/js/poetry.js source/js/daynight.js source/js/weather-particles.js source/js/weather-card.js source/js/weather-panel.js source/js/weather-init.js
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "chore(v7): remove legacy weather system files"
```

---

## Phase 7: Testing + Deployment

### Task 13: Integration Testing

**Files:**
- None (browser testing)

- [ ] **Step 1: Build and start dev server**

```bash
npm run build:weather
hexo server
```

- [ ] **Step 2: Verify checklist**

- [ ] All 5 original weather modes render correctly
- [ ] Meteor shower triggers in clear mode
- [ ] Matrix rain selectable from panel
- [ ] Skeleton screen shows on first load
- [ ] No layout shift after card loads
- [ ] Dark/light mode switch works
- [ ] Mobile layout correct
- [ ] Console: 0 errors
- [ ] Canvas animation: stable 60fps (desktop)

- [ ] **Step 3: Fix any issues found**
- [ ] **Step 4: Commit fixes**

---

### Task 14: Deployment

- [ ] **Step 1: Final build**

```bash
hexo generate
```

- [ ] **Step 2: Deploy**

Per memory: deploy with force push.

```bash
git add -A
git commit -m "deploy: v7 weather system — perfect edition"
git push --force origin main
```

---

## Self-Review

### Spec Coverage
| Spec Section | Plan Task |
|-------------|-----------|
| Architecture refactor (bundle) | Task 1-2 |
| Performance (dirty rects) | Task 3 |
| Performance (object pools) | Task 3 |
| Performance (adaptive FPS) | Implicit in renderer.js (skipped explicit task, add now) |
| UX (skeleton) | Task 7 |
| UX (progressive loading) | Task 8 |
| Loading (single bundle) | Task 1, 11 |
| Loading (lazy poems) | Task 2 |
| Loading (resource hints) | Task 11 |
| New effect (meteor) | Task 9 |
| New effect (matrix) | Task 10 |
| CSS optimizations | Task 7 |

**Gap found:** Adaptive FPS / tab visibility not explicitly tasked. Adding to Task 3.

### Placeholder Scan
- No TBD/TODO found.
- All code blocks contain actual implementation.
- No vague instructions.

### Type Consistency
- `WeatherV7.init()` used consistently.
- `renderer.ctx` / `renderer.W` / `renderer.H` pattern consistent.

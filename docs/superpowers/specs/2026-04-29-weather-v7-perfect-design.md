# Weather System v7 "Perfect Edition" Design

## Overview

Comprehensive upgrade of the v6 weather system targeting three goals:
1. **Runtime smoothness** — 60fps stable, adaptive quality, tab-aware lifecycle
2. **User experience** — zero layout shift, progressive disclosure, graceful degradation
3. **Loading performance** — single bundle, on-demand data, aggressive caching

Plus two new visual effects: **meteor shower** and **Matrix digital rain**.

---

## 1. Architecture Refactor

### Current State
10 separate JS files loaded sequentially:
```
weather-config.js (0.9KB)
geo.js (3.4KB)
weather.js (4.3KB)
p Poetry.js (9.6KB)
daynight.js (1.4KB)
weather-particles.js (19.6KB)
weather-card.js (5.5KB)
weather-panel.js (19.3KB)
weather-init.js (3.0KB)
```

### Target State
Single modular bundle `weather-v7.min.js` (~35KB gzipped) with lazy-loaded chunks:

```
weather-v7.min.js (core + renderer + UI)
  ├── WeatherCore      # state, lifecycle, event bus
  ├── CanvasRenderer   # optimized 2D canvas engine
  ├── UIManager        # card, panel, mobile bar
  └── EffectRegistry   # plugin system for effects

lazy-loaded on first interaction:
  ├── poems.json       # regional poetry data (~8KB)
  └── effects/         # effect modules
       ├── meteor.js   # meteor shower
       └── matrix.js   # digital rain
```

### Build Pipeline
- Rollup or esbuild to bundle and tree-shake
- CSS inlined into JS for critical styles, async load full weather.css
- Separate dev/prod builds

---

## 2. Performance Optimization (B)

### 2.1 Canvas Dirty Rectangles
Instead of `ctx.clearRect(0, 0, W, H)` every frame, track bounding boxes of moving particles and only clear those regions.

```javascript
// Before: full clear every frame
ctx.clearRect(0, 0, W, H);

// After: track dirty regions
var dirtyRects = [];
particles.forEach(function(p) {
  dirtyRects.push({x: p.lastX - pad, y: p.lastY - pad, w: p.size + pad*2, h: p.size + pad*2});
});
// Clear and redraw only dirty regions
```

### 2.2 Particle Object Pool
Pre-allocate particle objects to avoid GC pressure:
```javascript
var pool = {rain: [], snow: [], drops: [], sun: []};
function acquire(type) { return pool[type].pop() || createNew(type); }
function release(type, obj) { pool[type].push(obj); }
```

### 2.3 Adaptive Frame Rate
- Detect device capability via `navigator.hardwareConcurrency`
- Cap at 30fps on low-end devices (frame skip every other RAF)
- Reduce particle count by 50% on mobile

### 2.4 Tab Visibility Awareness
```javascript
document.addEventListener('visibilitychange', function() {
  if (document.hidden) { WeatherCore.pause(); }
  else { WeatherCore.resume(); }
});
```

### 2.5 Throttled External Events
- `resize`: debounce 100ms, only resize canvas on idle
- `scroll`: already passive, but reduce `scrollWind()` sensitivity
- `mergeDrops()`: run every 3rd frame instead of every frame

---

## 3. User Experience (C)

### 3.1 Skeleton Screen for Weather Card
Render a fixed-height placeholder immediately to prevent CLS:
```css
.weather-card-skeleton {
  height: 420px; /* matches loaded card */
  background: var(--card-bg);
  border-radius: 14px;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}
```

### 3.2 Progressive Loading Sequence
```
T+0ms   — Render skeleton card
T+50ms  — Show greeting (only needs local time)
T+100ms — Show fixed poem (static)
T+200ms — Geo location from cache or IP
T+300ms — Show weather info (from cache or API)
T+500ms — Show dynamic poem (from cache or API)
T+600ms — Fade in gravity controls
```

### 3.3 Smooth Mode Transitions
When switching weather modes, cross-fade canvas opacity over 300ms instead of instant switch.

### 3.4 Effect Toggle Persistence
Store user preference and restore on page load before any rendering:
```javascript
// Check before creating canvas
if (localStorage.getItem('blog_weather_fx') === 'disabled') {
  WeatherCore.setEnabled(false);
}
```

---

## 4. Loading Optimization (A)

### 4.1 Single Bundle
Merge all weather JS into one file. Expected savings:
- Before: 10 HTTP requests, ~75KB total
- After: 1 HTTP request, ~35KB gzipped

### 4.2 Poetry Data Lazy Load
Extract `REGION_POEMS` from `poetry.js` into `poems.json`.
- Load only on first successful geo lookup
- Cache in localStorage
- Reduces initial bundle by ~8KB

### 4.3 Resource Hints
```html
<link rel="preconnect" href="https://wttr.in">
<link rel="dns-prefetch" href="https://wttr.in">
```

### 4.4 Service Worker Cache Strategy
```javascript
// Cache-first for static assets
self.addEventListener('fetch', function(e) {
  if (/weather-v7|weather\.css|poems\.json/.test(e.request.url)) {
    e.respondWith(caches.match(e.request).then(function(r) {
      return r || fetch(e.request).then(function(f) {
        caches.open('weather-v1').then(function(c) { c.put(e.request, f.clone()); });
        return f;
      });
    }));
  }
});
```

---

## 5. New Visual Effects

### 5.1 Meteor Shower (流星雨)
**Trigger:** Randomly during `clear` mode (10% chance per minute) or selectable as dedicated mode.

**Visual:**
- Long bright streaks at shallow angles (15-45 degrees)
- Gradient head (white-yellow) to transparent tail
- Variable length (100-300px) and speed
- Occasional burst of 2-3 meteors simultaneously

**Implementation:**
```javascript
function Meteor() {
  this.x = Math.random() * W;
  this.y = -50;
  this.len = 100 + Math.random() * 200;
  this.angle = 0.3 + Math.random() * 0.5; // radians
  this.speed = 8 + Math.random() * 12;
  this.opacity = 0.6 + Math.random() * 0.4;
}

Meteor.prototype.draw = function() {
  var tailX = this.x - Math.cos(this.angle) * this.len;
  var tailY = this.y - Math.sin(this.angle) * this.len;
  var g = ctx.createLinearGradient(this.x, this.y, tailX, tailY);
  g.addColorStop(0, 'rgba(255,255,255,' + this.opacity + ')');
  g.addColorStop(0.1, 'rgba(255,220,150,' + (this.opacity * 0.8) + ')');
  g.addColorStop(1, 'rgba(255,220,150,0)');
  ctx.strokeStyle = g;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(this.x, this.y);
  ctx.lineTo(tailX, tailY);
  ctx.stroke();
};
```

### 5.2 Matrix Digital Rain (数字流)
**Mode:** "赛博" (Cyber) — selectable from weather panel or triggered by keyboard shortcut.

**Visual:**
- Vertical streams of green characters falling at varying speeds
- Character set: Katakana + Latin + numerals
- Each stream has random length and fade-out tail
- Occasional "bright" characters (white flash)
- Subtle scanline overlay

**Implementation:**
```javascript
var CHARS = 'アイウエオカキクケコ...0123456789ABCDEF';
var columns = Math.floor(W / 14);
var drops = Array(columns).fill(0).map(function() {
  return { y: Math.random() * -H, speed: 2 + Math.random() * 4 };
});

function drawMatrix() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'; // fade trail
  ctx.fillRect(0, 0, W, H);
  ctx.font = '14px monospace';
  drops.forEach(function(drop, i) {
    var char = CHARS[Math.floor(Math.random() * CHARS.length)];
    var x = i * 14;
    // Head character bright
    ctx.fillStyle = '#fff';
    ctx.fillText(char, x, drop.y);
    // Tail characters dimmer
    ctx.fillStyle = '#0f0';
    for (var j = 1; j < 8; j++) {
      ctx.globalAlpha = 1 - j / 8;
      var tailChar = CHARS[Math.floor(Math.random() * CHARS.length)];
      ctx.fillText(tailChar, x, drop.y - j * 14);
    }
    ctx.globalAlpha = 1;
    drop.y += drop.speed;
    if (drop.y > H + 100) drop.y = Math.random() * -100;
  });
}
```

---

## 6. CSS Optimizations

### 6.1 Dark Mode Variable Cleanup
Consolidate scattered `[data-theme='dark']` overrides into CSS variables:
```css
:root {
  --wc-bg: rgba(255,255,255,0.015);
  --wc-text: #c8d2e0;
  --wc-text2: #8899aa;
  --wc-accent: #6e96c4;
}
[data-theme='light'] {
  --wc-bg: rgba(0,0,0,0.03);
  --wc-text: #333;
  --wc-text2: #666;
  --wc-accent: #4a7ab8;
}
```

### 6.2 Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  .weather-card { transition: none; }
  #weather-particles-canvas { display: none; }
}
```

---

## 7. Implementation Phases

| Phase | Scope | Estimated Effort |
|-------|-------|-----------------|
| Phase 1 | Architecture refactor (bundle, build pipeline) | 2h |
| Phase 2 | Performance (dirty rects, object pool, adaptive FPS) | 3h |
| Phase 3 | UX (skeleton, progressive loading, transitions) | 2h |
| Phase 4 | Loading (lazy poems, SW cache, resource hints) | 2h |
| Phase 5 | New effects (meteor, matrix) | 3h |
| Phase 6 | Integration testing + deployment | 2h |
| **Total** | | **~14h** |

---

## 8. Success Criteria

- [ ] Lighthouse Performance score >= 90
- [ ] First Contentful Paint <= 1.2s
- [ ] Cumulative Layout Shift <= 0.05
- [ ] Canvas animation stable 60fps on mid-range desktop
- [ ] Canvas animation stable 30fps on mobile
- [ ] Tab hidden: CPU usage drops to 0%
- [ ] All 7 weather modes + 2 new effects render correctly
- [ ] Dark/light theme switch instant, no flash
- [ ] Weather API failure: graceful fallback within 500ms

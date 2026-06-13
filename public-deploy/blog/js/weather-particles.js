/**
 * v6 Canvas 天气特效引擎
 * 零外部依赖，纯 Canvas 2D 渲染
 */
(function () {
  'use strict';

  /* ==================== State ==================== */
  var containerId = 'weather-particles-canvas';
  var canvas = null, ctx = null;
  var W = 0, H = 0, dpr = 1, t = 0;
  var rainStreaks = [], glassDrops = [], snowflakes = [], sunParticles = [];
  var microTex = null;
  var animId = null;
  var enabled = true;
  var curMode = 'clear', curSub = 'clear';
  var gravity = 9.81;
  var scrollY = 0, targetScrollY = 0;

  /* ==================== Theme-aware colors ==================== */
  function rc(a) {
    var s = getComputedStyle(document.documentElement);
    return 'rgba(' + s.getPropertyValue('--rain-r').trim() + ',' +
           s.getPropertyValue('--rain-g').trim() + ',' +
           s.getPropertyValue('--rain-b').trim() + ',' + a + ')';
  }
  function dc(a) {
    var s = getComputedStyle(document.documentElement);
    return 'rgba(' + s.getPropertyValue('--drop-r').trim() + ',' +
           s.getPropertyValue('--drop-g').trim() + ',' +
           s.getPropertyValue('--drop-b').trim() + ',' + a + ')';
  }
  function sa() { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--snow-opacity').trim()) || 0.7; }
  function ua() { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sun-opacity').trim()) || 0.12; }
  function ga() { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--glass-alpha').trim()) || 0.04; }

  /* ==================== Utils ==================== */
  function rand(a, b) { return a + Math.random() * (b - a); }
  function dist(a, b) { var dx = a.x - b.x, dy = a.y - b.y; return Math.sqrt(dx * dx + dy * dy); }
  function gDir() { return gravity >= 0 ? 1 : -1; }

  function genDropShape() {
    var n = 20, v = [], ir = rand(0.05, 0.15);
    for (var i = 0; i < n; i++) {
      var a = (i / n) * Math.PI * 2, r = 1 + (Math.random() - 0.5) * ir * 2;
      v.push({ cos: Math.cos(a) * r, sin: Math.sin(a) * r });
    }
    return v;
  }

  /* Scroll wind — subtle angle shift when scrolling */
  function scrollWind() {
    scrollY += (targetScrollY - scrollY) * 0.06;
    var maxShift = 0.06;
    var shift = Math.max(-maxShift, Math.min(maxShift, scrollY * 0.00003));
    return shift;
  }

  /* ==================== GlassDrop ==================== */
  var DI = 0.025;

  function GlassDrop(x, y, placed) {
    var dir = gDir();
    if (placed) {
      this.x = x != null ? x : Math.random() * W;
      this.y = y != null ? y : Math.random() * H;
      this.r = rand(3, 7);
      this.maxR = this.r;
      this.growing = false;
    } else {
      this.x = x != null ? x : Math.random() * W;
      this.y = y != null ? y : (dir > 0 ? -(8 + Math.random() * 20) : H + 8 + Math.random() * 20);
      this.r = rand(0.6, 1.4);
      this.maxR = rand(3, 7.5);
      this.growing = true;
    }
    this.sliding = !this.growing;
    this.vy = this.sliding ? (0.04 + this.r * 0.1) * (gravity / 9.81) : 0;
    this.shape = genDropShape();
    this.trail = [];
    this.trailTimer = 0;
  }

  GlassDrop.prototype.update = function () {
    var absG = Math.abs(gravity), dir = gDir(), wind = scrollWind();
    if (this.growing) {
      this.r += rand(0.012, 0.035);
      if (this.r >= this.maxR) { this.r = this.maxR; this.growing = false; this.sliding = true; }
    }
    if (this.sliding) {
      var tv = (0.04 + this.r * 0.1) * (gravity / 9.81);
      if (absG < 0.08) {
        tv = 0;
        this.vy += (tv - this.vy) * DI;
        this.x += (Math.random() - 0.5) * 0.7;
        this.y += (Math.random() - 0.5) * 0.7;
      } else {
        this.vy += (tv - this.vy) * DI;
        this.y += this.vy;
      }
      this.x += this.vy * wind * 0.5;
      this.trailTimer++;
      if (this.trailTimer % 2 === 0 && this.trail.length < 80) {
        this.trail.push({ x: this.x, y: this.y, r: this.r, a: 0.55 });
      }
      for (var i = this.trail.length - 1; i >= 0; i--) {
        this.trail[i].a -= 0.005;
        if (this.trail[i].a <= 0) this.trail.splice(i, 1);
      }
      if ((dir > 0 && this.y - this.r > H + 80) || (dir < 0 && this.y + this.r < -80)) this.reset(dir);
    }
  };

  GlassDrop.prototype.reset = function (dir) {
    this.y = dir > 0 ? -10 - Math.random() * 40 : H + 10 + Math.random() * 40;
    this.x = Math.random() * W;
    this.r = rand(0.6, 1.4);
    this.maxR = rand(2.5, 6.5);
    this.growing = true;
    this.sliding = false;
    this.vy = 0;
    this.trail = [];
    this.trailTimer = 0;
    this.shape = genDropShape();
  };

  GlassDrop.prototype.paintDrop = function (cx, cy, r, alpha, lit) {
    if (r < 0.2) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    var s = this.shape;
    ctx.moveTo(cx + s[0].cos * r, cy + s[0].sin * r);
    for (var i = 1; i < s.length; i++) ctx.lineTo(cx + s[i].cos * r, cy + s[i].sin * r);
    ctx.closePath();
    var bg = ctx.createRadialGradient(cx - r * 0.12, cy - r * 0.22, r * 0.03, cx, cy, r);
    bg.addColorStop(0, dc(0.75));
    bg.addColorStop(0.45, dc(0.45));
    bg.addColorStop(0.8, dc(0.18));
    bg.addColorStop(1, dc(0.05));
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.strokeStyle = dc(0.4);
    ctx.lineWidth = 0.5;
    ctx.stroke();
    if (lit && r > 0.6) {
      var hx = cx - r * 0.24, hy = cy - r * 0.28;
      var hg = ctx.createRadialGradient(hx, hy, 0, hx, hy, r * 0.28);
      hg.addColorStop(0, 'rgba(255,255,255,0.9)');
      hg.addColorStop(0.08, 'rgba(255,255,255,0.65)');
      hg.addColorStop(0.35, 'rgba(255,255,255,0.1)');
      hg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = hg;
      ctx.beginPath();
      ctx.arc(hx, hy, r * 0.28, 0, Math.PI * 2);
      ctx.fill();
      var bx = cx + r * 0.2, by = cy + r * 0.36;
      var bg2 = ctx.createRadialGradient(bx, by, 0, bx, by, r * 0.1);
      bg2.addColorStop(0, 'rgba(255,255,255,0.45)');
      bg2.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = bg2;
      ctx.beginPath();
      ctx.arc(bx, by, r * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  GlassDrop.prototype.draw = function () {
    for (var i = 0; i < this.trail.length; i++) {
      var tr = this.trail[i], f = i / Math.max(this.trail.length, 1);
      this.paintDrop(tr.x, tr.y, this.r * (0.2 + 0.4 * f), tr.a * 0.25, false);
    }
    this.paintDrop(this.x, this.y, this.r, 0.92, true);
  };

  /* ==================== RainStreak ==================== */
  var RI = 0.04;

  function RainStreak(fresh, storm) {
    this.storm = storm;
    this.reset(fresh, gDir());
  }

  RainStreak.prototype.reset = function (fresh, dir) {
    this.x = Math.random() * W;
    if (dir === undefined) dir = gDir();
    this.y = fresh ? Math.random() * H : (dir > 0 ? -(30 + Math.random() * 80) : H + 30 + Math.random() * 80);
    this.len = this.storm ? 18 + Math.random() * 35 : 14 + Math.random() * 30;
    this.spd = this.storm ? 8 + Math.random() * 14 : 4 + Math.random() * 10;
    this.opa = this.storm ? 0.18 + Math.random() * 0.38 : 0.12 + Math.random() * 0.32;
    this.wd = this.storm ? 0.3 + Math.random() * 0.9 : 0.2 + Math.random() * 0.7;
    this.ang = 0.02 + Math.random() * 0.05;
    this.vy = this.spd * (gravity / 9.81);
  };

  RainStreak.prototype.update = function () {
    var absG = Math.abs(gravity), dir = gDir(), wind = scrollWind();
    if (absG < 0.08) {
      this.vy += (0 - this.vy) * RI;
      this.y += (Math.random() - 0.5) * 0.6;
      this.x += (Math.random() - 0.5) * 0.35;
    } else {
      var tv = this.spd * (gravity / 9.81);
      this.vy += (tv - this.vy) * RI;
      this.y += this.vy;
    }
    this.x += this.vy * (this.ang + wind) * 0.3;
    if ((dir > 0 && this.y > H + 40) || (dir < 0 && this.y < -40)) this.reset(false, dir);
  };

  RainStreak.prototype.draw = function () {
    var td = this.vy >= 0 ? 1 : -1;
    var tx = this.x - this.len * (this.ang + scrollWind()) * 0.3;
    var ty = this.y - this.len * td;
    var g = ctx.createLinearGradient(tx, ty, this.x, this.y);
    g.addColorStop(0, rc(0));
    g.addColorStop(0.35, rc(this.opa * 0.2));
    g.addColorStop(1, rc(this.opa));
    ctx.beginPath();
    ctx.strokeStyle = g;
    ctx.lineWidth = this.wd;
    ctx.lineCap = 'round';
    ctx.moveTo(tx, ty);
    ctx.lineTo(this.x, this.y);
    ctx.stroke();
  };

  /* ==================== Snowflake ==================== */
  var SI = 0.06;

  function Snowflake(fresh, heavy) {
    this.heavy = heavy;
    this.reset(fresh, gDir());
  }

  Snowflake.prototype.reset = function (fresh, dir) {
    this.x = Math.random() * W;
    if (dir === undefined) dir = gDir();
    this.y = fresh ? Math.random() * H : (dir > 0 ? -(20 + Math.random() * 30) : H + 20 + Math.random() * 30);
    this.sz = this.heavy ? 1.5 + Math.random() * 4 : 2 + Math.random() * 6;
    this.spdy = this.heavy ? 0.3 + Math.random() * 1.4 : 0.2 + Math.random() * 1;
    this.swayA = 0.4 + Math.random() * 1.6;
    this.swayF = 0.0003 + Math.random() * 0.001;
    this.swayP = Math.random() * Math.PI * 2;
    this.opa = (0.2 + Math.random() * 0.5) * (this.heavy ? 1.2 : 1);
    this.rot = Math.random() * Math.PI * 2;
    this.rotSpd = (Math.random() - 0.5) * 0.01;
    this.onGlass = Math.random() < 0.3;
    this.vy = this.spdy * (gravity / 9.81);
  };

  Snowflake.prototype.update = function () {
    var absG = Math.abs(gravity), dir = gDir();
    if (absG < 0.08) {
      this.vy += (0 - this.vy) * SI;
      this.y += (Math.random() - 0.5) * 0.5;
      this.x += (Math.random() - 0.5) * 0.5;
    } else {
      var tv = this.spdy * (gravity / 9.81);
      this.vy += (tv - this.vy) * SI;
      this.y += this.vy;
    }
    this.x += Math.sin(t * this.swayF + this.swayP) * this.swayA * 0.25 + scrollWind() * 0.15;
    this.rot += this.rotSpd;
    if ((dir > 0 && this.y > H + 20) || (dir < 0 && this.y < -20)) this.reset(false, dir);
  };

  Snowflake.prototype.draw = function () {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.globalAlpha = Math.min(1, this.opa * sa() * 1.4);
    var r = this.sz;
    if (this.onGlass) {
      ctx.fillStyle = 'rgba(225,240,255,0.75)';
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.48, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      var gr = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      gr.addColorStop(0, 'rgba(255,255,255,0.85)');
      gr.addColorStop(0.45, 'rgba(255,255,255,0.45)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  /* ==================== SunParticle ==================== */
  function SunParticle(fresh) {
    this.reset(fresh, gDir());
  }

  SunParticle.prototype.reset = function (fresh, dir) {
    this.x = Math.random() * W;
    if (dir === undefined) dir = gDir();
    this.y = fresh ? Math.random() * H : (dir > 0 ? H + 40 + Math.random() * 30 : -(40 + Math.random() * 30));
    this.sz = 3 + Math.random() * 7;
    this.spdy = -(0.08 + Math.random() * 0.25);
    this.spdx = (Math.random() - 0.5) * 0.15;
    this.ph = Math.random() * Math.PI * 2;
    this.phs = 0.003 + Math.random() * 0.007;
    this.al = 0.06 + Math.random() * 0.16;
  };

  SunParticle.prototype.update = function () {
    var absG = Math.abs(gravity);
    if (absG < 0.08) {
      this.y += this.spdy * 0.2;
      this.x += this.spdx;
    } else {
      this.y += this.spdy * Math.abs(gravity / 9.81);
      this.x += this.spdx + scrollWind() * 0.08;
    }
    this.ph += this.phs;
    if (this.y < -60 || this.y > H + 60) this.reset(false, gDir());
  };

  SunParticle.prototype.draw = function () {
    var a = this.al * (0.5 + 0.5 * Math.sin(this.ph)) * ua() * 2.5;
    var gr = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.sz * 5);
    gr.addColorStop(0, 'rgba(255,205,85,' + a + ')');
    gr.addColorStop(0.35, 'rgba(255,160,40,' + (a * 0.3) + ')');
    gr.addColorStop(1, 'rgba(255,150,20,0)');
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.sz * 5, 0, Math.PI * 2);
    ctx.fill();
  };

  /* ==================== Micro texture ==================== */
  function renderMicroTex() {
    if (microTex) return;
    var off = document.createElement('canvas');
    off.width = W * dpr;
    off.height = H * dpr;
    var ct = off.getContext('2d');
    ct.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (var i = 0; i < 600; i++) {
      var x = Math.random() * W, y = Math.random() * H;
      var r = 0.12 + Math.random() * 0.5, a = 0.05 + Math.random() * 0.14;
      ct.fillStyle = dc(a);
      ct.beginPath();
      ct.arc(x, y, r, 0, Math.PI * 2);
      ct.fill();
    }
    microTex = off;
  }

  function drawGlassBase() {
    ctx.fillStyle = dc(ga());
    ctx.fillRect(0, 0, W, H);
    [[0, 0], [W, 0], [0, H], [W, H]].forEach(function (c) {
      var gr = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], W * 0.18);
      gr.addColorStop(0, dc(0.03));
      gr.addColorStop(1, dc(0));
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.arc(c[0], c[1], W * 0.18, 0, Math.PI * 2);
      ctx.fill();
    });
    renderMicroTex();
    ctx.drawImage(microTex, 0, 0);
  }

  /* ==================== Merge ==================== */
  function mergeDrops() {
    for (var i = glassDrops.length - 1; i >= 0; i--) {
      var a = glassDrops[i];
      if (!a) continue;
      for (var j = Math.min(i - 1, glassDrops.length - 1); j >= 0; j--) {
        var b = glassDrops[j];
        if (!b) continue;
        if (dist(a, b) < (a.r + b.r) * 0.65) {
          var vA = Math.pow(a.r, 3), vB = Math.pow(b.r, 3);
          var nR = Math.pow(vA + vB, 1 / 3);
          a.x = a.x * (vA / (vA + vB)) + b.x * (vB / (vA + vB));
          a.y = a.y * (vA / (vA + vB)) + b.y * (vB / (vA + vB));
          a.maxR = Math.min(nR * 1.2, 8);
          a.r = Math.min(nR, a.maxR);
          a.growing = false;
          a.sliding = true;
          a.vy = (0.04 + a.r * 0.1) * (gravity / 9.81);
          a.shape = genDropShape();
          glassDrops.splice(j, 1);
          i = Math.min(i, glassDrops.length - 1);
        }
      }
    }
  }

  /* ==================== Canvas management ==================== */
  function createCanvas() {
    var container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = '';
    } else {
      container = document.createElement('div');
      container.id = containerId;
      container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;pointer-events:none;';
      document.body.prepend(container);
    }

    canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;display:block;';
    resizeCanvas();
    container.appendChild(canvas);
    ctx = canvas.getContext('2d');
  }

  function resizeCanvas() {
    if (!canvas) return;
    dpr = window.devicePixelRatio || 1;
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    microTex = null;
  }

  function destroy() {
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
    rainStreaks = [];
    glassDrops = [];
    snowflakes = [];
    sunParticles = [];
    microTex = null;
    var el = document.getElementById(containerId);
    if (el) el.remove();
    canvas = null;
    ctx = null;
  }

  /* ==================== Scene ==================== */
  function setScene(mode, sub) {
    curMode = mode;
    curSub = sub;
    rainStreaks = [];
    glassDrops = [];
    snowflakes = [];
    sunParticles = [];
    microTex = null;

    var mobileScale = window.innerWidth < 900 ? 0.5 : 1;

    if (mode === 'rain') {
      var s = sub === 'storm';
      var sc = Math.floor((s ? 160 : 100) * mobileScale);
      var dp = Math.floor((s ? 60 : 45) * mobileScale);
      var dn = Math.floor((s ? 35 : 20) * mobileScale);
      for (var i = 0; i < sc; i++) rainStreaks.push(new RainStreak(true, s));
      for (var i = 0; i < dp; i++) glassDrops.push(new GlassDrop(Math.random() * W, Math.random() * H, true));
      for (var i = 0; i < dn; i++) glassDrops.push(new GlassDrop());
    } else if (mode === 'snow') {
      var h = sub === 'heavy';
      var nc = Math.floor((h ? 120 : 75) * mobileScale);
      for (var i = 0; i < nc; i++) snowflakes.push(new Snowflake(true, h));
    } else if (mode === 'clear') {
      var nc = Math.floor(45 * mobileScale);
      for (var i = 0; i < nc; i++) sunParticles.push(new SunParticle(true));
    }
  }

  /* ==================== Animation loop ==================== */
  function animate() {
    t++;
    if (!enabled || !canvas || !ctx) { animId = requestAnimationFrame(animate); return; }
    ctx.clearRect(0, 0, W, H);

    if (curMode === 'rain') {
      drawGlassBase();
      for (var i = 0; i < rainStreaks.length; i++) { rainStreaks[i].update(); rainStreaks[i].draw(); }
      for (var i = 0; i < glassDrops.length; i++) glassDrops[i].update();
      mergeDrops();
      for (var i = 0; i < glassDrops.length; i++) glassDrops[i].draw();
    } else if (curMode === 'snow') {
      drawGlassBase();
      for (var i = 0; i < snowflakes.length; i++) { snowflakes[i].update(); snowflakes[i].draw(); }
    } else if (curMode === 'clear') {
      for (var i = 0; i < sunParticles.length; i++) { sunParticles[i].update(); sunParticles[i].draw(); }
    }

    animId = requestAnimationFrame(animate);
  }

  function setGravity(g) {
    gravity = g;
  }

  /* ==================== Public API ==================== */

  function init(mode, sub) {
    curMode = mode || 'clear';
    curSub = sub || 'clear';
    if (!enabled) return Promise.resolve();
    destroy();
    createCanvas();
    // Re-read W/H after canvas creation
    W = window.innerWidth;
    H = window.innerHeight;
    setScene(curMode, curSub);
    animate();
    return Promise.resolve();
  }

  function setWeather(mode, sub) {
    curMode = mode;
    curSub = sub;
    if (!enabled) {
      enabled = true;
      destroy();
      createCanvas();
      W = window.innerWidth;
      H = window.innerHeight;
      setScene(curMode, curSub);
      animate();
      return;
    }
    setScene(mode, sub);
  }

  function enable() {
    if (enabled) return;
    enabled = true;
    destroy();
    createCanvas();
    W = window.innerWidth;
    H = window.innerHeight;
    setScene(curMode, curSub);
    animate();
    try { localStorage.setItem('blog_weather_fx', 'enabled'); } catch (e) {}
  }

  function disable() {
    enabled = false;
    destroy();
    try { localStorage.setItem('blog_weather_fx', 'disabled'); } catch (e) {}
  }

  function getCurrent() {
    return { mode: curMode, sub: curSub };
  }

  /* ==================== Events ==================== */
  window.addEventListener('resize', function () {
    if (canvas) resizeCanvas();
  });

  window.addEventListener('scroll', function () {
    targetScrollY = window.scrollY;
  }, { passive: true });

  // Check persisted state
  try {
    if (localStorage.getItem('blog_weather_fx') === 'disabled') {
      enabled = false;
    }
  } catch (e) {}

  window.WeatherFX = {
    init: init,
    setWeather: setWeather,
    setGravity: setGravity,
    enable: enable,
    disable: disable,
    getCurrent: getCurrent
  };
})();

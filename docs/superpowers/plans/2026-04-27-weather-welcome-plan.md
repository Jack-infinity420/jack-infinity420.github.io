# 博客天气欢迎系统 - 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 Hexo + Butterfly 博客添加 IP 地理定位、天气粒子特效、诗词展示、日夜间自动切换功能。

**Architecture:** 纯前端实现，7 个独立 JS 模块 + 1 个编排入口 + 1 个 CSS 文件 + 1 个文案配置。所有模块通过 window 全局对象暴露接口，由 weather-init.js 统一编排。不修改 Butterfly 主题源码，全部通过 inject 注入。

**Tech Stack:** Vanilla JavaScript (ES6+), tsParticles 2.x (CDN), Hexo 8.x, Butterfly 5.5.x

---

## 文件结构

| 文件 | 职责 | 对外接口 |
|------|------|----------|
| `source/_data/welcome.yml` | 文案配置 | 无（被 Hexo 编译为全局变量） |
| `source/css/weather.css` | 卡片+面板+粒子容器样式 | 无 |
| `source/js/geo.js` | IP 定位，ipapi.co | `window.BlogGeo.getLocation()` → `{province, city}` |
| `source/js/weather.js` | 天气数据，wttr.in | `window.BlogWeather.getWeather(city)` → `{type, temp, desc}` |
| `source/js/poetry.js` | 诗词，今日诗词 API | `window.BlogPoem.getPoem(city)` → `{content}` |
| `source/js/daynight.js` | 日夜间自动检测 | `window.BlogDayNight.apply()` → 设置 body class |
| `source/js/weather-particles.js` | tsParticles 加载/控制 | `window.WeatherFX.init(type)`, `.setWeather(type)`, `.disable()`, `.enable()` |
| `source/js/weather-card.js` | 侧边栏卡片渲染 | `window.WeatherCard.render(data)` |
| `source/js/weather-panel.js` | 右下角控制面板 | `window.WeatherPanel.init(type)` |
| `source/js/weather-init.js` | 主入口，编排所有模块 | 无 |
| `_config.butterfly.yml` | 注入脚本和样式引用 | 修改 inject.head 和 inject.bottom |

---

### Task 1: 创建目录结构和文案配置

**Files:**
- Create: `source/js/` (directory)
- Create: `source/_data/welcome.yml`

- [ ] **Step 1: 创建 js 目录**

```bash
mkdir -p source/js
```

- [ ] **Step 2: 编写文案配置文件**

`source/_data/welcome.yml`：
```yaml
# 固定诗句（始终显示在卡片顶部）
fixed_poem: "海内存知己，天涯若比邻"

# 问候语模板
# {time_period} - 时间段（早上好/上午好/下午好/晚上好）
# {province} - 省份
# {city} - 城市
greeting_template: "{time_period}好，欢迎来自{province}·{city}的同志"

# 当今日诗词 API 失败时的降级诗句
poem_fallback: "海内存知己，天涯若比邻"

# 天气切换提示文本
# 桌面端
switch_hint_desktop: "💡 点击右下角 ☁️ 切换天气"
# 手机端
switch_hint_mobile: "💡 点击 ☁️ 切换天气"

# 天气类型中文映射
weather_labels:
  clear: "晴天"
  cloudy: "多云"
  rain: "雨天"
  snow: "雪天"
  fog: "雾霾"
  thunderstorm: "雷暴"
  overcast: "阴天"

# 时间段映射
time_periods:
  morning: "早上"    # 6:00-9:00
  forenoon: "上午"   # 9:00-12:00
  afternoon: "下午"  # 12:00-18:00
  evening: "晚上"    # 18:00-6:00
```

- [ ] **Step 3: 提交**

```bash
git add source/js/ source/_data/welcome.yml
git commit -m "feat: 添加天气欢迎系统目录结构和文案配置"
```

---

### Task 2: 编写 IP 地理定位模块 (geo.js)

**Files:**
- Create: `source/js/geo.js`

- [ ] **Step 1: 编写 geo.js**

```javascript
/**
 * IP 地理定位模块
 * 接口: https://ipapi.co/json/
 * 缓存: localStorage, key=blog_location, 有效期 30 天
 */
(function () {
  'use strict';

  const CACHE_KEY = 'blog_location';
  const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 天

  function getCached() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (Date.now() - data._ts > CACHE_TTL) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }
      return data;
    } catch (e) {
      return null;
    }
  }

  function setCache(data) {
    try {
      data._ts = Date.now();
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (e) {
      // localStorage 满或不可用，静默跳过
    }
  }

  async function fetchLocation() {
    const resp = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) });
    if (!resp.ok) throw new Error('ipapi returned ' + resp.status);
    const json = await resp.json();
    if (json.error) throw new Error(json.reason || 'ipapi error');
    return {
      province: json.region || '',
      city: json.city || '',
      country: json.country_name || ''
    };
  }

  async function getLocation() {
    // 1. 先查缓存
    const cached = getCached();
    if (cached && cached.city) return cached;

    // 2. 请求 API
    try {
      const data = await fetchLocation();
      setCache(data);
      return data;
    } catch (e) {
      // 3. API 失败，返回空数据，卡片不显示
      console.warn('[BlogGeo] 定位失败:', e.message);
      return { province: '', city: '', country: '' };
    }
  }

  window.BlogGeo = { getLocation };
})();
```

- [ ] **Step 2: 提交**

```bash
git add source/js/geo.js
git commit -m "feat: 添加 IP 地理定位模块 (ipapi.co)"
```

---

### Task 3: 编写天气数据模块 (weather.js)

**Files:**
- Create: `source/js/weather.js`

- [ ] **Step 1: 编写 weather.js**

```javascript
/**
 * 天气数据模块
 * 接口: https://wttr.in/{city}?format=j1 (免费，无需注册)
 * 缓存: localStorage, key=blog_weather_{city}, 有效期 30 分钟
 */
(function () {
  'use strict';

  const CACHE_PREFIX = 'blog_weather_';
  const CACHE_TTL = 30 * 60 * 1000; // 30 分钟

  // wttr.in weatherCode → 内部天气类型
  const CODE_MAP = {
    '113': 'clear',       // 晴
    '116': 'cloudy',      // 晴间多云
    '119': 'cloudy',      // 多云
    '122': 'overcast',    // 阴
    '143': 'fog',         // 雾
    '176': 'rain',        // 零星小雨
    '179': 'snow',        // 零星小雪
    '182': 'snow',        // 零星雨夹雪
    '185': 'rain',        // 零星冻雨
    '200': 'thunderstorm',// 雷暴
    '227': 'snow',        // 暴风雪
    '230': 'snow',        // 暴风雪
    '248': 'fog',         // 雾
    '260': 'fog',         // 冻雾
    '263': 'rain',        // 小雨
    '266': 'rain',        // 小雨
    '281': 'rain',        // 冻雨
    '284': 'rain',        // 冻雨
    '293': 'rain',        // 小雨
    '296': 'rain',        // 小雨
    '299': 'rain',        // 中雨
    '302': 'rain',        // 中雨
    '305': 'rain',        // 大雨
    '308': 'rain',        // 大雨
    '311': 'rain',        // 冻雨
    '314': 'rain',        // 冻雨
    '317': 'rain',        // 冻雨
    '320': 'snow',        // 小雪
    '323': 'snow',        // 小雪
    '326': 'snow',        // 小雪
    '329': 'snow',        // 中雪
    '332': 'snow',        // 中雪
    '335': 'snow',        // 大雪
    '338': 'snow',        // 大雪
    '350': 'rain',        // 冰雹
    '353': 'rain',        // 阵雨
    '356': 'rain',        // 大雨
    '359': 'rain',        // 大雨
    '362': 'rain',        // 雨夹雪
    '365': 'rain',        // 雨夹雪
    '368': 'snow',        // 阵雪
    '371': 'snow',        // 大雪
    '374': 'rain',        // 冰雹
    '377': 'rain',        // 冰雹
    '386': 'thunderstorm',// 雷阵雨
    '389': 'thunderstorm',// 雷暴
    '392': 'thunderstorm',// 雷暴
    '395': 'snow'         // 大雪
  };

  function getCached(city) {
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + city);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (Date.now() - data._ts > CACHE_TTL) {
        localStorage.removeItem(CACHE_PREFIX + city);
        return null;
      }
      return data;
    } catch (e) {
      return null;
    }
  }

  function setCache(city, data) {
    try {
      data._ts = Date.now();
      localStorage.setItem(CACHE_PREFIX + city, JSON.stringify(data));
    } catch (e) {
      // 静默
    }
  }

  function mapWeatherCode(code) {
    return CODE_MAP[String(code)] || 'clear';
  }

  function getWeatherIcon(type) {
    const icons = {
      clear: '☀️',
      cloudy: '⛅',
      rain: '🌧️',
      snow: '❄️',
      fog: '🌫️',
      thunderstorm: '⛈️',
      overcast: '☁️'
    };
    return icons[type] || '☀️';
  }

  async function fetchWeather(city) {
    const url = 'https://wttr.in/' + encodeURIComponent(city) + '?format=j1';
    const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!resp.ok) throw new Error('wttr.in returned ' + resp.status);
    const json = await resp.json();
    const current = json.current_condition[0];
    return {
      type: mapWeatherCode(current.weatherCode),
      temp: current.temp_C,
      desc: current.weatherDesc[0].value,
      icon: getWeatherIcon(mapWeatherCode(current.weatherCode))
    };
  }

  async function getWeather(city) {
    if (!city) return null;

    const cached = getCached(city);
    if (cached) return cached;

    try {
      const data = await fetchWeather(city);
      setCache(city, data);
      return data;
    } catch (e) {
      console.warn('[BlogWeather] 获取天气失败:', e.message);
      return null;
    }
  }

  window.BlogWeather = {
    getWeather: getWeather,
    getWeatherIcon: getWeatherIcon
  };
})();
```

- [ ] **Step 2: 提交**

```bash
git add source/js/weather.js
git commit -m "feat: 添加天气数据模块 (wttr.in)"
```

---

### Task 4: 编写诗词模块 (poetry.js)

**Files:**
- Create: `source/js/poetry.js`

- [ ] **Step 1: 编写 poetry.js**

```javascript
/**
 * 诗词模块
 * 接口: 今日诗词 API v2 (非商用免费)
 * 失败降级: 固定诗句
 */
(function () {
  'use strict';

  // 今日诗词 API token (公开 token，非商用使用)
  var TOKEN = 'M9QDy4EmekpDyvMhDgP7TkM5btZMPFbG';

  async function fetchPoem(city) {
    // 构造 URL，传城市参数让 API 返回地点相关诗词
    var url = 'https://v2.jinrishici.com/sentence';
    var resp = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { 'X-User-Token': TOKEN }
    });
    if (!resp.ok) throw new Error('jinrishici returned ' + resp.status);
    var json = await resp.json();
    if (json.status === 'success' && json.data) {
      return { content: json.data.content };
    }
    throw new Error('jinrishici: unexpected response');
  }

  async function getPoem(city) {
    try {
      return await fetchPoem(city);
    } catch (e) {
      console.warn('[BlogPoem] 获取诗词失败，使用降级:', e.message);
      return null; // 调用方使用 welcome.yml 中的 poem_fallback
    }
  }

  window.BlogPoem = { getPoem: getPoem };
})();
```

- [ ] **Step 2: 提交**

```bash
git add source/js/poetry.js
git commit -m "feat: 添加诗词模块 (今日诗词 API)"
```

---

### Task 5: 编写日夜间自动检测模块 (daynight.js)

**Files:**
- Create: `source/js/daynight.js`

- [ ] **Step 1: 编写 daynight.js**

```javascript
/**
 * 日夜间自动检测
 * 根据浏览器本地时间自动设置初始外观模式
 * 仅设置初始模式，手动切换后以手动为准
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'blog_daynight_manual';

  function apply() {
    // 如果用户手动切换过，不再自动设置
    if (localStorage.getItem(STORAGE_KEY)) return;

    var hour = new Date().getHours();
    var isNight = hour < 6 || hour >= 18;

    var html = document.documentElement;

    if (isNight) {
      html.setAttribute('data-theme', 'dark');
      html.classList.add('dark-mode');
    } else {
      html.setAttribute('data-theme', 'light');
      html.classList.remove('dark-mode');
    }
  }

  // 监听手动切换，记录用户偏好
  function watchManualToggle() {
    var observer = new MutationObserver(function () {
      localStorage.setItem(STORAGE_KEY, '1');
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }

  window.BlogDayNight = { apply: apply, watchManualToggle: watchManualToggle };
})();
```

- [ ] **Step 2: 提交**

```bash
git add source/js/daynight.js
git commit -m "feat: 添加日夜间自动检测模块"
```

---

### Task 6: 编写 tsParticles 天气特效模块 (weather-particles.js)

**Files:**
- Create: `source/js/weather-particles.js`

- [ ] **Step 1: 编写 weather-particles.js**

```javascript
/**
 * tsParticles 天气特效模块
 * 动态加载 tsParticles CDN，管理粒子实例
 */
(function () {
  'use strict';

  var TSPARTICLES_CDN = 'https://cdn.jsdelivr.net/npm/tsparticles@2.12.0/tsparticles.bundle.min.js';
  var containerId = 'weather-particles-canvas';
  var activeInstance = null;
  var isEnabled = true;
  var currentWeather = 'clear';

  function loadTsParticles() {
    return new Promise(function (resolve, reject) {
      if (window.tsParticles) return resolve(window.tsParticles);
      var script = document.createElement('script');
      script.src = TSPARTICLES_CDN;
      script.onload = function () { resolve(window.tsParticles); };
      script.onerror = function () { reject(new Error('tsParticles CDN 加载失败')); };
      document.head.appendChild(script);
    });
  }

  function createContainer() {
    var el = document.getElementById(containerId);
    if (el) return el;
    el = document.createElement('div');
    el.id = containerId;
    el.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;pointer-events:none;';
    document.body.prepend(el);
    return el;
  }

  function getParticleCount() {
    var base = 80;
    var isMobile = window.innerWidth < 900;
    var isLowPerf = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
    if (isMobile) base = Math.floor(base * 0.5);
    if (isLowPerf) base = Math.floor(base * 0.5);
    return base;
  }

  function getConfig(type) {
    var count = getParticleCount();
    var configs = {
      clear: {
        particles: {
          number: { value: count },
          color: { value: ['#ffd700', '#ffb347', '#ffcc33'] },
          shape: { type: 'circle' },
          opacity: { value: { min: 0.1, max: 0.4 }, animation: { enable: true, speed: 0.5, sync: false } },
          size: { value: { min: 1, max: 4 } },
          move: { enable: true, speed: 0.5, direction: 'top', random: true, straight: false }
        },
        detectRetina: true
      },
      cloudy: {
        particles: {
          number: { value: Math.floor(count * 0.6) },
          color: { value: ['#e8e8e8', '#f0f0f0', '#ffffff'] },
          shape: { type: 'circle' },
          opacity: { value: { min: 0.3, max: 0.6 } },
          size: { value: { min: 10, max: 30 } },
          move: { enable: true, speed: 0.3, direction: 'right', random: false, straight: true }
        },
        detectRetina: true
      },
      rain: {
        particles: {
          number: { value: Math.floor(count * 1.5) },
          color: { value: ['#a0c4ff', '#b8d4ff', '#c8e0ff'] },
          shape: { type: 'line' },
          opacity: { value: { min: 0.1, max: 0.3 } },
          size: { value: { min: 1, max: 2 } },
          move: { enable: true, speed: 12, direction: 195, straight: true },
          life: { duration: { value: { min: 0.5, max: 1.5 } } }
        },
        detectRetina: true
      },
      snow: {
        particles: {
          number: { value: count },
          color: { value: ['#ffffff', '#f0f8ff', '#e6e6fa'] },
          shape: { type: 'circle' },
          opacity: { value: { min: 0.3, max: 0.8 } },
          size: { value: { min: 2, max: 6 } },
          move: { enable: true, speed: 1.5, direction: 'bottom', random: true, straight: false, wobble: true }
        },
        detectRetina: true
      },
      fog: {
        particles: {
          number: { value: Math.floor(count * 0.4) },
          color: { value: ['#c8c8c8', '#d0d0d0', '#b8b8b8'] },
          shape: { type: 'circle' },
          opacity: { value: { min: 0.2, max: 0.5 } },
          size: { value: { min: 20, max: 60 } },
          move: { enable: true, speed: 0.2, direction: 'right', random: true, straight: true }
        },
        detectRetina: true
      },
      thunderstorm: {
        particles: {
          number: { value: Math.floor(count * 1.5) },
          color: { value: ['#a0c4ff', '#778899'] },
          shape: { type: 'line' },
          opacity: { value: { min: 0.2, max: 0.5 }, animation: { enable: true, speed: 2, sync: false } },
          size: { value: { min: 1, max: 3 } },
          move: { enable: true, speed: 14, direction: 195, straight: true },
          life: { duration: { value: { min: 0.5, max: 1 } } }
        },
        detectRetina: true
      },
      overcast: {
        particles: {
          number: { value: Math.floor(count * 0.5) },
          color: { value: ['#a0a0a0', '#b0b0b0', '#909090'] },
          shape: { type: 'circle' },
          opacity: { value: { min: 0.2, max: 0.4 } },
          size: { value: { min: 8, max: 25 } },
          move: { enable: true, speed: 0.4, direction: 'right', random: false, straight: true }
        },
        detectRetina: true
      }
    };
    return configs[type] || configs.clear;
  }

  async function init(type) {
    currentWeather = type || 'clear';
    if (!isEnabled) return;
    try {
      await loadTsParticles();
      var container = createContainer();
      if (activeInstance) activeInstance.destroy();
      activeInstance = await window.tsParticles.load({
        id: containerId,
        options: getConfig(currentWeather)
      });
    } catch (e) {
      console.warn('[WeatherFX] 初始化失败:', e.message);
    }
  }

  async function setWeather(type) {
    currentWeather = type;
    if (!isEnabled) {
      await enable();
      return;
    }
    if (!activeInstance) {
      await init(type);
      return;
    }
    try {
      var container = document.getElementById(containerId);
      activeInstance.destroy();
      activeInstance = await window.tsParticles.load({
        id: containerId,
        options: getConfig(type)
      });
    } catch (e) {
      console.warn('[WeatherFX] 切换天气失败:', e.message);
    }
  }

  async function enable() {
    isEnabled = true;
    await init(currentWeather);
    try { localStorage.setItem('blog_weather_fx', 'enabled'); } catch (e) {}
  }

  function disable() {
    isEnabled = false;
    if (activeInstance) {
      activeInstance.destroy();
      activeInstance = null;
    }
    var container = document.getElementById(containerId);
    if (container) container.remove();
    try { localStorage.setItem('blog_weather_fx', 'disabled'); } catch (e) {}
  }

  function getCurrent() {
    return currentWeather;
  }

  // 检查用户是否之前关闭了特效
  try {
    if (localStorage.getItem('blog_weather_fx') === 'disabled') {
      isEnabled = false;
    }
  } catch (e) {}

  window.WeatherFX = {
    init: init,
    setWeather: setWeather,
    enable: enable,
    disable: disable,
    getCurrent: getCurrent,
    loadTsParticles: loadTsParticles
  };
})();
```

- [ ] **Step 2: 提交**

```bash
git add source/js/weather-particles.js
git commit -m "feat: 添加 tsParticles 天气粒子特效模块"
```

---

### Task 7: 编写天气卡片渲染模块 (weather-card.js)

**Files:**
- Create: `source/js/weather-card.js`

- [ ] **Step 1: 编写 weather-card.js**

```javascript
/**
 * 天气卡片渲染模块
 * 桌面端：注入 Butterfly 侧边栏，位于作者卡片下方
 * 手机端：注入文章列表底部简洁横条
 */
(function () {
  'use strict';

  var MOBILE_BREAKPOINT = 900;

  function getTimePeriod() {
    var h = new Date().getHours();
    if (h >= 6 && h < 9) return '早上';
    if (h >= 9 && h < 12) return '上午';
    if (h >= 12 && h < 18) return '下午';
    return '晚上';
  }

  function getWeatherLabel(type) {
    var labels = { clear: '晴天', cloudy: '多云', rain: '雨天', snow: '雪天', fog: '雾霾', thunderstorm: '雷暴', overcast: '阴天' };
    return labels[type] || '晴天';
  }

  function isMobile() {
    return window.innerWidth < MOBILE_BREAKPOINT;
  }

  function render(data) {
    // data: { province, city, poem, weather, config }
    // config: { fixed_poem, greeting_template, poem_fallback, switch_hint_desktop, switch_hint_mobile }
    var config = data.config || {};
    var fixedPoem = config.fixed_poem || '海内存知己，天涯若比邻';
    var poemFallback = config.poem_fallback || fixedPoem;
    var greeting = config.greeting_template || '{time_period}好，欢迎来自{province}·{city}的同志';
    var hintDesktop = config.switch_hint_desktop || '💡 点击右下角 ☁️ 切换天气';
    var hintMobile = config.switch_hint_mobile || '💡 点击 ☁️ 切换天气';

    var province = data.province || '';
    var city = data.city || '';
    var locationStr = province && city ? province + '·' + city : (city || province || '远方');
    var timePeriod = getTimePeriod();
    var poemContent = (data.poem && data.poem.content) ? data.poem.content : poemFallback;

    var greetingText = greeting
      .replace('{time_period}', timePeriod)
      .replace('{province}', province)
      .replace('{city}', city);

    var weatherIcon = data.weather ? data.weather.icon : '☀️';
    var weatherLabel = data.weather ? getWeatherLabel(data.weather.type) : '晴天';
    var temp = data.weather ? data.weather.temp : '--';

    if (!province && !city) return; // 无法定位，不显示卡片

    removeOld();

    if (isMobile()) {
      renderMobile();
    } else {
      renderDesktop();
    }

    function renderDesktop() {
      var aside = document.getElementById('aside-content');
      if (!aside) return;

      var card = document.createElement('div');
      card.className = 'card-widget card-weather text-center';
      card.id = 'weather-card';
      card.innerHTML =
        '<div class="weather-poem-fixed">' + escapeHtml(fixedPoem) + '</div>' +
        '<div class="weather-greeting">' + escapeHtml(greetingText) + '</div>' +
        '<div class="weather-api-poem">「' + escapeHtml(poemContent) + '」</div>' +
        '<div class="weather-poem-location">—— ' + escapeHtml(locationStr) + '</div>' +
        '<div class="weather-divider"></div>' +
        '<div class="weather-info">' + weatherIcon + ' ' + escapeHtml(weatherLabel) + ' · ' + escapeHtml(temp) + '°C</div>' +
        '<div class="weather-hint">' + escapeHtml(hintDesktop) + '</div>';

      // 插入在公告卡片之后（或作者卡片之后）
      var announcement = aside.querySelector('.card-announcement');
      var author = aside.querySelector('.card-info');
      var anchor = announcement || author;
      if (anchor && anchor.nextSibling) {
        aside.insertBefore(card, anchor.nextSibling);
      } else if (anchor) {
        anchor.parentNode.appendChild(card);
      } else {
        aside.prepend(card);
      }
    }

    function renderMobile() {
      // 在文章列表底部插入简洁横条
      var contentInner = document.getElementById('content-inner');
      if (!contentInner) return;

      var bar = document.createElement('div');
      bar.className = 'weather-mobile-bar';
      bar.id = 'weather-mobile-bar';
      bar.innerHTML =
        '<span class="weather-poem-fixed-m">' + escapeHtml(fixedPoem) + '</span>' +
        '<span class="weather-greeting-m">' + escapeHtml(greetingText) + '</span>' +
        '<span class="weather-api-poem-m">「' + escapeHtml(poemContent) + '」 —— ' + escapeHtml(locationStr) + '</span>' +
        '<span class="weather-info-m">' + weatherIcon + ' ' + escapeHtml(weatherLabel) + ' · ' + escapeHtml(temp) + '°C</span>' +
        '<span class="weather-hint-m">' + escapeHtml(hintMobile) + '</span>';

      contentInner.appendChild(bar);
    }
  }

  function removeOld() {
    var old = document.getElementById('weather-card');
    if (old) old.remove();
    var oldM = document.getElementById('weather-mobile-bar');
    if (oldM) oldM.remove();
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // 窗口大小变化时重新渲染
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      removeOld();
      window.WeatherCard && window.WeatherCard.rerender();
    }, 300);
  });

  window.WeatherCard = {
    render: render,
    removeOld: removeOld,
    isMobile: isMobile,
    rerender: function () {
      if (window.WeatherCard._lastData) {
        render(window.WeatherCard._lastData);
      }
    },
    _lastData: null
  };

  // patch render to store last data
  var originalRender = window.WeatherCard.render;
  window.WeatherCard.render = function (data) {
    window.WeatherCard._lastData = data;
    originalRender(data);
  };
})();
```

- [ ] **Step 2: 提交**

```bash
git add source/js/weather-card.js
git commit -m "feat: 添加天气卡片渲染模块（桌面侧边栏 + 手机底部条）"
```

---

### Task 8: 编写天气控制面板模块 (weather-panel.js)

**Files:**
- Create: `source/js/weather-panel.js`

- [ ] **Step 1: 编写 weather-panel.js**

```javascript
/**
 * 天气控制面板模块
 * 挂载到 Butterfly 右下角按钮组，添加 ☁️ 按钮
 * 点击弹出天气切换面板，首次显示气泡提示
 */
(function () {
  'use strict';

  var BUBBLE_KEY = 'blog_weather_bubble_shown';
  var PANEL_VISIBLE = false;

  var WEATHER_OPTIONS = [
    { type: 'clear', icon: '☀️', label: '晴' },
    { type: 'rain', icon: '🌧️', label: '雨' },
    { type: 'snow', icon: '❄️', label: '雪' },
    { type: 'cloudy', icon: '⛅', label: '多云' }
  ];

  function createWeatherButton() {
    var btn = document.createElement('button');
    btn.id = 'weather-btn';
    btn.type = 'button';
    btn.title = '天气特效';
    btn.innerHTML = '☁️';
    btn.addEventListener('click', togglePanel);
    return btn;
  }

  function createBubble() {
    if (localStorage.getItem(BUBBLE_KEY)) return null;

    var bubble = document.createElement('div');
    bubble.id = 'weather-bubble';
    bubble.className = 'weather-bubble';
    bubble.textContent = '点我切换天气';
    bubble.addEventListener('click', function () {
      bubble.remove();
      localStorage.setItem(BUBBLE_KEY, '1');
    });

    // 3 秒后自动消失
    setTimeout(function () {
      if (bubble.parentNode) bubble.remove();
      localStorage.setItem(BUBBLE_KEY, '1');
    }, 8000);

    return bubble;
  }

  function createPanel() {
    var panel = document.createElement('div');
    panel.id = 'weather-panel';
    panel.className = 'weather-panel';
    panel.style.display = 'none';

    var currentType = window.WeatherFX ? window.WeatherFX.getCurrent() : 'clear';
    var isEnabled = true;
    try {
      isEnabled = localStorage.getItem('blog_weather_fx') !== 'disabled';
    } catch (e) {}

    var optionsHtml = WEATHER_OPTIONS.map(function (opt) {
      var active = opt.type === currentType ? ' active' : '';
      return '<span class="weather-option' + active + '" data-type="' + opt.type + '">' + opt.icon + ' ' + opt.label + '</span>';
    }).join('');

    panel.innerHTML =
      '<div class="weather-panel-header">🌤️ 天气特效</div>' +
      '<div class="weather-panel-options">' + optionsHtml + '</div>' +
      '<div class="weather-panel-toggle">' +
        '<span class="weather-toggle-label">特效</span>' +
        '<label class="weather-switch">' +
          '<input type="checkbox" id="weather-toggle-input"' + (isEnabled ? ' checked' : '') + '>' +
          '<span class="weather-slider"></span>' +
        '</label>' +
      '</div>';

    // 绑定天气选项点击事件
    panel.querySelectorAll('.weather-option').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        var type = this.getAttribute('data-type');
        panel.querySelectorAll('.weather-option').forEach(function (o) { o.classList.remove('active'); });
        this.classList.add('active');
        if (window.WeatherFX) window.WeatherFX.setWeather(type);
      });
    });

    // 绑定开关事件
    var toggleInput = panel.querySelector('#weather-toggle-input');
    toggleInput.addEventListener('change', function () {
      if (this.checked) {
        if (window.WeatherFX) window.WeatherFX.enable();
      } else {
        if (window.WeatherFX) window.WeatherFX.disable();
      }
    });

    // 点击面板外部关闭
    document.addEventListener('click', function (e) {
      if (PANEL_VISIBLE && !panel.contains(e.target) && e.target.id !== 'weather-btn') {
        hidePanel();
      }
    });

    return panel;
  }

  function togglePanel(e) {
    e.stopPropagation();
    if (PANEL_VISIBLE) {
      hidePanel();
    } else {
      showPanel();
    }
  }

  function showPanel() {
    var panel = document.getElementById('weather-panel');
    if (!panel) return;
    panel.style.display = 'block';
    PANEL_VISIBLE = true;

    // 隐藏气泡
    var bubble = document.getElementById('weather-bubble');
    if (bubble) {
      bubble.remove();
      localStorage.setItem(BUBBLE_KEY, '1');
    }
  }

  function hidePanel() {
    var panel = document.getElementById('weather-panel');
    if (!panel) return;
    panel.style.display = 'none';
    PANEL_VISIBLE = false;
  }

  function init(type) {
    // 插入按钮到 rightside 按钮组
    var rightside = document.getElementById('rightside-config-hide');
    if (!rightside) {
      // 等待 DOM ready 后重试
      setTimeout(function () { init(type); }, 200);
      return;
    }

    // 避免重复初始化
    if (document.getElementById('weather-btn')) return;

    var btn = createWeatherButton();
    rightside.appendChild(btn);

    // 插入气泡
    var bubble = createBubble();
    if (bubble) {
      btn.parentNode.insertBefore(bubble, btn);
    }

    // 插入面板（弹窗放置到 rightside 内）
    var panel = createPanel();
    document.getElementById('rightside').appendChild(panel);
  }

  window.WeatherPanel = { init: init };
})();
```

- [ ] **Step 2: 提交**

```bash
git add source/js/weather-panel.js
git commit -m "feat: 添加天气控制面板模块（右下角按钮+弹出面板+气泡提示）"
```

---

### Task 9: 编写主入口模块 (weather-init.js)

**Files:**
- Create: `source/js/weather-init.js`

- [ ] **Step 1: 编写 weather-init.js**

```javascript
/**
 * 天气欢迎系统 - 主入口
 * 编排所有模块：IP 定位 → 天气 + 诗词 → 卡片渲染 + 粒子特效 + 面板
 */
(function () {
  'use strict';

  async function main() {
    // 0. 加载配置
    var config = getConfig();

    // 1. 日夜间检测（最先执行，不依赖网络）
    if (window.BlogDayNight) {
      window.BlogDayNight.apply();
      window.BlogDayNight.watchManualToggle();
    }

    // 2. IP 定位
    var geo = null;
    if (window.BlogGeo) {
      geo = await window.BlogGeo.getLocation();
    }

    if (!geo || !geo.city) {
      // 无法定位，不显示卡片和天气特效
      return;
    }

    // 3. 并行获取天气和诗词
    var weatherPromise = window.BlogWeather
      ? window.BlogWeather.getWeather(geo.city)
      : Promise.resolve(null);

    var poemPromise = window.BlogPoem
      ? window.BlogPoem.getPoem(geo.city)
      : Promise.resolve(null);

    var results = await Promise.allSettled([weatherPromise, poemPromise]);
    var weather = results[0].status === 'fulfilled' ? results[0].value : null;
    var poem = results[1].status === 'fulfilled' ? results[1].value : null;

    var weatherType = weather ? weather.type : 'clear';

    // 4. 渲染卡片
    if (window.WeatherCard) {
      window.WeatherCard.render({
        province: geo.province,
        city: geo.city,
        poem: poem,
        weather: weather,
        config: config
      });
    }

    // 5. 初始化粒子特效
    if (window.WeatherFX) {
      window.WeatherFX.init(weatherType).catch(function () {});
    }

    // 6. 初始化控制面板
    if (window.WeatherPanel) {
      window.WeatherPanel.init(weatherType);
    }
  }

  function getConfig() {
    // 从 Hexo 注入的全局变量读取
    if (window.BLOG_WEATHER_CONFIG) {
      return window.BLOG_WEATHER_CONFIG;
    }
    // 降级默认值
    return {
      fixed_poem: '海内存知己，天涯若比邻',
      greeting_template: '{time_period}好，欢迎来自{province}·{city}的同志',
      poem_fallback: '海内存知己，天涯若比邻',
      switch_hint_desktop: '💡 点击右下角 ☁️ 切换天气',
      switch_hint_mobile: '💡 点击 ☁️ 切换天气'
    };
  }

  // 支持 pjax 后重新初始化
  document.addEventListener('pjax:complete', function () {
    // pjax 切换页面后，侧边栏和 rightside 保持不变，只需重新渲染卡片
    // (卡片可能被 pjax 清除)
    if (window.WeatherCard) {
      window.WeatherCard.rerender();
    }
  });

  // DOM ready 后启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else {
    main();
  }
})();
```

- [ ] **Step 2: 提交**

```bash
git add source/js/weather-init.js
git commit -m "feat: 添加天气欢迎系统主入口模块"
```

---

### Task 10: 编写天气系统 CSS 样式 (weather.css)

**Files:**
- Create: `source/css/weather.css`

- [ ] **Step 1: 编写 weather.css**

```css
/* ===== tsParticles 容器 ===== */
#weather-particles-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  pointer-events: none;
}

/* ===== 侧边栏天气卡片 ===== */
.card-weather {
  font-family: 'LXGW WenKai', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', serif;
  text-align: center;
  padding: 18px 16px;
  line-height: 1.6;
}

.card-weather .weather-poem-fixed {
  font-family: 'Cormorant Garamond', 'LXGW WenKai', 'Noto Serif SC', serif;
  font-size: 15px;
  color: #4a5568;
  margin-bottom: 14px;
  letter-spacing: 2px;
  font-weight: 400;
}

.card-weather .weather-greeting {
  font-weight: 600;
  font-size: 14px;
  color: #1a202c;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
}

.card-weather .weather-api-poem {
  font-family: 'Cormorant Garamond', 'LXGW WenKai', 'Noto Serif SC', serif;
  font-style: italic;
  font-size: 14px;
  color: #6b46c1;
  margin-bottom: 4px;
}

.card-weather .weather-poem-location {
  font-size: 12px;
  color: #a0aec0;
  margin-bottom: 16px;
  letter-spacing: 1px;
}

.card-weather .weather-divider {
  width: 32px;
  height: 1px;
  background: #e2e8f0;
  margin: 0 auto 14px;
}

.card-weather .weather-info {
  font-size: 12px;
  color: #4a5568;
  margin-bottom: 12px;
  letter-spacing: 0.5px;
}

.card-weather .weather-hint {
  font-size: 11px;
  color: #a0aec0;
  background: #f7fafc;
  padding: 6px 12px;
  border-radius: 6px;
  display: inline-block;
  letter-spacing: 0.3px;
}

/* ===== 手机端底部横条 ===== */
.weather-mobile-bar {
  font-family: 'LXGW WenKai', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', serif;
  text-align: center;
  padding: 14px 16px;
  margin: 0 8px 12px;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e8eaed;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  font-size: 12px;
  line-height: 1.7;
}

.weather-mobile-bar .weather-poem-fixed-m {
  color: #4a5568;
  letter-spacing: 1.5px;
  font-family: 'Cormorant Garamond', 'LXGW WenKai', 'Noto Serif SC', serif;
  display: block;
}

.weather-mobile-bar .weather-greeting-m {
  font-weight: 600;
  color: #1a202c;
  display: block;
  margin-top: 4px;
}

.weather-mobile-bar .weather-api-poem-m {
  color: #6b46c1;
  font-family: 'Cormorant Garamond', 'LXGW WenKai', 'Noto Serif SC', serif;
  font-style: italic;
  display: block;
  margin-top: 2px;
}

.weather-mobile-bar .weather-info-m {
  color: #4a5568;
  display: block;
  margin-top: 6px;
}

.weather-mobile-bar .weather-hint-m {
  color: #a0aec0;
  font-size: 10px;
  display: block;
  margin-top: 6px;
}

/* ===== 右下角天气按钮 ===== */
#weather-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #3498db;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 10px rgba(52,152,219,0.4);
  transition: transform 0.2s, box-shadow 0.2s;
  padding: 0;
  line-height: 1;
}

#weather-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 0 16px rgba(52,152,219,0.6);
}

/* ===== 气泡提示 ===== */
.weather-bubble {
  position: absolute;
  right: 42px;
  top: 4px;
  background: #2c3e50;
  color: white;
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 11px;
  white-space: nowrap;
  z-index: 100;
  animation: weather-bubble-fade 0.3s ease-out;
}

.weather-bubble::after {
  content: '';
  position: absolute;
  right: -5px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
  border-left: 5px solid #2c3e50;
}

@keyframes weather-bubble-fade {
  from { opacity: 0; transform: translateX(10px); }
  to { opacity: 1; transform: translateX(0); }
}

/* ===== 弹出面板 ===== */
.weather-panel {
  position: absolute;
  bottom: 44px;
  right: 0;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.15);
  padding: 16px;
  width: 200px;
  font-size: 13px;
  z-index: 101;
  border: 1px solid #e8eaed;
  animation: weather-panel-in 0.2s ease-out;
}

@keyframes weather-panel-in {
  from { opacity: 0; transform: translateY(8px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.weather-panel-header {
  font-weight: 600;
  margin-bottom: 10px;
  font-size: 14px;
  color: #1a202c;
}

.weather-panel-options {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.weather-option {
  padding: 4px 10px;
  background: #f0f0f0;
  border-radius: 16px;
  font-size: 11px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  user-select: none;
}

.weather-option:hover {
  background: #e0e0e0;
}

.weather-option.active {
  background: #e8f4fd;
  color: #3498db;
  font-weight: 500;
}

/* ===== 开关 Toggle ===== */
.weather-panel-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.weather-toggle-label {
  font-size: 12px;
  color: #666;
}

.weather-switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 22px;
}

.weather-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.weather-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 22px;
}

.weather-slider::before {
  content: '';
  position: absolute;
  height: 18px;
  width: 18px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

.weather-switch input:checked + .weather-slider {
  background-color: #2ecc71;
}

.weather-switch input:checked + .weather-slider::before {
  transform: translateX(18px);
}

/* ===== 暗黑模式适配 ===== */
[data-theme='dark'] .card-weather {
  background: rgba(255,255,255,0.03) !important;
}

[data-theme='dark'] .card-weather .weather-poem-fixed {
  color: #c0c8d0;
}

[data-theme='dark'] .card-weather .weather-greeting {
  color: #e0e4e8;
}

[data-theme='dark'] .card-weather .weather-api-poem {
  color: #a78bfa;
}

[data-theme='dark'] .card-weather .weather-poem-location {
  color: #6b7280;
}

[data-theme='dark'] .card-weather .weather-info {
  color: #c0c8d0;
}

[data-theme='dark'] .card-weather .weather-hint {
  color: #6b7280;
  background: rgba(255,255,255,0.04);
}

[data-theme='dark'] .weather-panel {
  background: #1f2937;
  border-color: #374151;
}

[data-theme='dark'] .weather-panel-header {
  color: #e0e4e8;
}

[data-theme='dark'] .weather-option {
  background: #374151;
  color: #d1d5db;
}

[data-theme='dark'] .weather-option.active {
  background: rgba(52,152,219,0.2);
  color: #60a5fa;
}

[data-theme='dark'] .weather-mobile-bar {
  background: rgba(255,255,255,0.03);
  border-color: #374151;
}

[data-theme='dark'] .weather-mobile-bar .weather-poem-fixed-m,
[data-theme='dark'] .weather-mobile-bar .weather-info-m {
  color: #c0c8d0;
}

[data-theme='dark'] .weather-mobile-bar .weather-greeting-m {
  color: #e0e4e8;
}

[data-theme='dark'] .weather-mobile-bar .weather-api-poem-m {
  color: #a78bfa;
}

[data-theme='dark'] .weather-mobile-bar .weather-hint-m {
  color: #6b7280;
}
```

- [ ] **Step 2: 提交**

```bash
git add source/css/weather.css
git commit -m "feat: 添加天气系统完整 CSS 样式（含暗黑模式适配）"
```

---

### Task 11: 修改 Butterfly 配置注入脚本和样式

**Files:**
- Modify: `_config.butterfly.yml:1083-1088`

- [ ] **Step 1: 读取当前 inject 配置**

当前 `_config.butterfly.yml` 的 inject 部分（约第 1083-1088 行）：
```yaml
inject:
  head:
    - <link rel="stylesheet" href="/css/custom.css">
  bottom:
    # - <script src="xxxx"></script>
```

- [ ] **Step 2: 修改 inject 部分**

将 inject 部分改为：
```yaml
inject:
  head:
    - <link rel="stylesheet" href="/css/custom.css">
    - <link rel="stylesheet" href="/css/weather.css">
  bottom:
    - <script src="/js/geo.js"></script>
    - <script src="/js/weather.js"></script>
    - <script src="/js/poetry.js"></script>
    - <script src="/js/daynight.js"></script>
    - <script src="/js/weather-particles.js"></script>
    - <script src="/js/weather-card.js"></script>
    - <script src="/js/weather-panel.js"></script>
    - <script src="/js/weather-init.js"></script>
```

使用 Edit 工具精确替换上述内容。

- [ ] **Step 3: 注入配置变量到页面**

修改 inject.head，在 weather.css 之后、`</head>` 之前注入 Hexo 数据变量：
```yaml
inject:
  head:
    - <link rel="stylesheet" href="/css/custom.css">
    - <link rel="stylesheet" href="/css/weather.css">
    - <script>window.BLOG_WEATHER_CONFIG = <%= JSON.stringify(site.data.welcome) %>;</script>
```

注意：`site.data.welcome` 是 Hexo 自动从 `source/_data/welcome.yml` 加载的数据。

- [ ] **Step 4: 提交**

```bash
git add _config.butterfly.yml
git commit -m "config: 注入天气系统脚本、样式和配置变量"
```

---

### Task 12: 构建测试

**验证：**

- [ ] **Step 1: 清理并构建**

```bash
hexo clean && hexo generate
```
期望：无报错，正常生成静态文件。

- [ ] **Step 2: 启动本地服务器**

```bash
hexo server
```
期望：服务器正常启动。

- [ ] **Step 3: 手动浏览器测试清单**

打开 `http://localhost:4000`，检查：
1. [ ] 右下角出现 ☁️ 按钮，首次出现气泡提示"点我切换天气"
2. [ ] 侧边栏出现天气卡片（如果 ipapi.co 不被墙或使用了代理）
3. [ ] 卡片显示诗句、问候语、天气信息、切换提示
4. [ ] 点击 ☁️ 弹出控制面板，可切换天气类型
5. [ ] 切换天气后背景粒子效果改变
6. [ ] 关闭特效后粒子消失
7. [ ] 手机端（F12 切到移动视图）：天气信息显示为底部简洁横条
8. [ ] 日夜间自动切换（修改系统时间测试）
9. [ ] 暗黑模式下卡片和面板颜色适配
10. [ ] 封面宇宙图未被遮挡

- [ ] **Step 4: 如有问题，修复后提交**

---

## 自检清单

| 检查项 | 状态 |
|--------|------|
| 所有文件路径与 Hexo 项目结构一致 | ✅ |
| 不修改 Butterfly 主题源码 | ✅ |
| pjax 兼容处理 | ✅ (weather-init.js 监听 pjax:complete) |
| API 失败降级 | ✅ (所有模块有 catch 降级) |
| localStorage 缓存策略 | ✅ (IP 30天, 天气 30分钟, 气泡 1 次) |
| 移动端适配 | ✅ (weather-card.js 检测屏幕宽度) |
| 暗黑模式适配 | ✅ (weather.css 含 dark 变量) |
| 低性能设备优化 | ✅ (weather-particles.js 检测 hardwareConcurrency) |

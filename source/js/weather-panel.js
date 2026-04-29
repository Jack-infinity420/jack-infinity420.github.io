/**
 * v6 天气控制面板模块
 * 无弹窗设计 — 所有控制内嵌在侧边栏天气卡片中
 * 包含天气卡片、手机横条、右侧 ☁️ 按钮、重力控制
 */
(function () {
  'use strict';

  /* ==================== Static data ==================== */

  var MODE_INFO = {
    'rain-drizzle': { icon: '🌧', label: '微雨', temp: '14°', poem: '好雨知时节，当春乃发生', poet: '杜甫' },
    'rain-storm':   { icon: '⛈', label: '骤雨', temp: '12°', poem: '黑云翻墨未遮山，白雨跳珠乱入船', poet: '苏轼' },
    'snow-light':   { icon: '❄', label: '疏雪', temp: '−3°', poem: '忽如一夜春风来，千树万树梨花开', poet: '岑参' },
    'snow-heavy':   { icon: '🌨', label: '暮雪', temp: '−6°', poem: '孤舟蓑笠翁，独钓寒江雪', poet: '柳宗元' },
    'clear-clear':  { icon: '☀', label: '晴光', temp: '22°', poem: '晴空一鹤排云上，便引诗情到碧霄', poet: '刘禹锡' }
  };

  var MODES = [
    { mode: 'rain', sub: 'drizzle', label: '微雨', icon: '🌧' },
    { mode: 'rain', sub: 'storm',  label: '骤雨', icon: '⛈' },
    { mode: 'snow', sub: 'light',  label: '疏雪', icon: '❄' },
    { mode: 'snow', sub: 'heavy',  label: '暮雪', icon: '🌨' },
    { mode: 'clear', sub: 'clear', label: '晴光', icon: '☀' }
  ];

  var PLANETS = [
    { name: '木星', sym: '♃', g: 24.79 },
    { name: '海王星', sym: '♆', g: 11.15 },
    { name: '土星', sym: '♄', g: 10.44 },
    { name: '地球', sym: '♁', g: 9.81 },
    { name: '金星', sym: '♀', g: 8.87 },
    { name: '火星', sym: '♂', g: 3.71 },
    { name: '月球', sym: '☽', g: 1.62 },
    { name: '冥王星', sym: '⯓', g: 0.62 }
  ];

  var SNAP_TH = 0.25;

  /* ==================== State ==================== */

  var CUR_MODE = 'rain';
  var CUR_SUB = 'drizzle';
  var GRAVITY = 9.81;

  /* ==================== Utilities ==================== */

  function getGreeting() {
    var h = new Date().getHours();
    var p = h < 6 ? '凌晨' : h < 9 ? '早上' : h < 12 ? '上午' : h < 14 ? '中午' : h < 17 ? '下午' : h < 19 ? '傍晚' : '晚上';

    // Try reading from BLOG_WEATHER_CONFIG for template
    var template = '';
    try {
      if (window.BLOG_WEATHER_CONFIG && window.BLOG_WEATHER_CONFIG.greeting_template) {
        template = window.BLOG_WEATHER_CONFIG.greeting_template;
      }
    } catch (e) {}

    // Try reading location from geo.js cache
    var province = '', city = '';
    try {
      var cached = JSON.parse(localStorage.getItem('blog_location'));
      if (cached) {
        province = cached.province || '';
        city = cached.city || '';
      }
    } catch (e) {}

    if (template) {
      return template
        .replace(/{time_period}/g, p)
        .replace(/{province}/g, province)
        .replace(/{city}/g, city);
    }

    var locStr = province && city ? province + '·' + city : (province || city || '远方');
    return p + '好，欢迎来自' + locStr + '的同志';
  }

  function getFixedPoem() {
    try {
      if (window.BLOG_WEATHER_CONFIG && window.BLOG_WEATHER_CONFIG.fixed_poem) {
        return window.BLOG_WEATHER_CONFIG.fixed_poem;
      }
    } catch (e) {}
    return '长风破浪会有时，直挂云帆济沧海';
  }

  function g2p(g) {
    return ((g + 24.79) / 49.58) * 100;
  }

  function snapG(v) {
    var a = Math.abs(v);
    if (a < 0.03) return 0;
    for (var i = 0; i < PLANETS.length; i++) {
      if (Math.abs(a - PLANETS[i].g) < SNAP_TH) return (v > 0 ? 1 : -1) * PLANETS[i].g;
    }
    return v;
  }

  function closestP(absG) {
    if (absG < 0.05) return { name: '零重力', sym: '○', g: 0 };
    var b = null, bd = Infinity;
    for (var i = 0; i < PLANETS.length; i++) {
      var d = Math.abs(absG - PLANETS[i].g);
      if (d < bd) { bd = d; b = PLANETS[i]; }
    }
    return bd < 0.55 ? b : null;
  }

  function gravHint(planetName, absG) {
    var m = CUR_MODE;
    if (absG < 0.05) return m === 'rain' ? '雨滴悬停漂浮' : m === 'snow' ? '雪花悬停漂浮' : '粒子悬停';
    var hints = {
      '木星': [m === 'rain' ? '暴雨如箭' : m === 'snow' ? '暴雪如幕' : '沉重无比'],
      '海王星': ['迅疾猛烈'],
      '土星': ['沉重有力'],
      '地球': [m === 'rain' ? '雨落如常' : m === 'snow' ? '雪落如常' : '如常'],
      '金星': ['相仿'],
      '火星': [m === 'rain' ? '雨丝轻缓' : m === 'snow' ? '雪花轻舞' : '轻缓'],
      '月球': [m === 'rain' ? '雨滴悠然' : m === 'snow' ? '雪花盘旋' : '漂浮'],
      '冥王星': ['近乎失重']
    };
    return (hints[planetName] || ['——'])[0];
  }

  function getModeKey() { return CUR_MODE + '-' + CUR_SUB; }
  function getModeInfo() { return MODE_INFO[getModeKey()] || MODE_INFO['clear-clear']; }

  /* ==================== DOM Creation ==================== */

  function createWeatherCard() {
    var card = document.createElement('div');
    card.id = 'weatherCard';
    card.className = 'weather-card';

    // Fixed poem
    var fixed = document.createElement('div');
    fixed.className = 'wc-fixed';
    fixed.textContent = getFixedPoem();

    // Greeting
    var greet = document.createElement('div');
    greet.className = 'wc-greeting';
    greet.id = 'wcGreeting';

    // Poem
    var poem = document.createElement('div');
    poem.className = 'wc-poem';
    poem.id = 'wcPoem';

    // Location (poet)
    var loc = document.createElement('div');
    loc.className = 'wc-location';
    loc.id = 'wcLocation';

    // Weather info
    var weather = document.createElement('div');
    weather.className = 'wc-weather';
    weather.id = 'wcWeather';

    // Mode pills
    var modesDiv = document.createElement('div');
    modesDiv.className = 'wc-modes';
    modesDiv.id = 'wcModes';
    MODES.forEach(function (m) {
      var span = document.createElement('span');
      span.className = 'wc-mode' + (m.mode === CUR_MODE && m.sub === CUR_SUB ? ' on' : '');
      span.setAttribute('data-mode', m.mode);
      span.setAttribute('data-sub', m.sub);
      span.textContent = m.icon + ' ' + m.label;
      span.addEventListener('click', onModeClick);
      modesDiv.appendChild(span);
    });

    // Gravity section
    var gravDiv = document.createElement('div');
    gravDiv.className = 'wc-gravity';
    gravDiv.id = 'wcGravity';
    gravDiv.innerHTML =
      '<div class="wc-grav-header">' +
        '<span class="wc-grav-planet" id="wcPlanet">♁ 地球</span>' +
        '<span class="wc-grav-hint" id="wcGravHint">9.81 · 雨落如常</span>' +
      '</div>' +
      '<div class="wc-grav-quick">' +
        '<button class="wc-grav-qbtn" data-g="0">○ 失重</button>' +
        '<button class="wc-grav-qbtn on" data-g="981">♁ 地球</button>' +
        '<button class="wc-grav-qbtn" data-g="-981">↑ 逆地</button>' +
      '</div>' +
      '<div class="wc-grav-slider-wrap">' +
        '<div class="wc-grav-track">' +
          '<div class="wc-grav-fill" id="wcGravFill"></div>' +
          '<div class="wc-grav-thumb" id="wcThumb"></div>' +
        '</div>' +
        '<input class="wc-grav-input" type="range" id="gSlider" min="-2479" max="2479" value="981" step="1">' +
      '</div>' +
      '<div class="wc-grav-bounds"><span>−24.79</span><span>0</span><span>+24.79</span></div>';

    // Toggle switch
    var toggleDiv = document.createElement('div');
    toggleDiv.className = 'wc-toggle';
    try {
      var stored = localStorage.getItem('blog_weather_fx');
      toggleDiv.innerHTML =
        '<span>天气特效</span>' +
        '<label class="wc-switch">' +
          '<input type="checkbox" id="fxToggle"' + (stored !== 'disabled' ? ' checked' : '') + '>' +
          '<span class="wc-slider"></span>' +
        '</label>';
    } catch (e) {
      toggleDiv.innerHTML =
        '<span>天气特效</span>' +
        '<label class="wc-switch">' +
          '<input type="checkbox" id="fxToggle" checked>' +
          '<span class="wc-slider"></span>' +
        '</label>';
    }

    card.appendChild(fixed);
    card.appendChild(greet);
    card.appendChild(poem);
    card.appendChild(loc);
    card.appendChild(weather);
    card.appendChild(modesDiv);
    card.appendChild(gravDiv);
    card.appendChild(toggleDiv);

    return card;
  }

  function createMobileBar() {
    var bar = document.createElement('div');
    bar.className = 'mobile-weather';
    bar.id = 'mobileWeather';

    var row = document.createElement('div');
    row.className = 'mw-row';

    var mwGreet = document.createElement('span');
    mwGreet.id = 'mwGreeting';

    var mwWeather = document.createElement('span');
    mwWeather.id = 'mwWeather';

    row.appendChild(mwGreet);
    row.appendChild(mwWeather);

    var modesDiv = document.createElement('div');
    modesDiv.className = 'mw-modes';
    modesDiv.id = 'mwModes';
    MODES.forEach(function (m) {
      var span = document.createElement('span');
      span.className = 'mw-mode' + (m.mode === CUR_MODE && m.sub === CUR_SUB ? ' on' : '');
      span.setAttribute('data-mode', m.mode);
      span.setAttribute('data-sub', m.sub);
      span.textContent = m.icon + ' ' + m.label;
      span.addEventListener('click', onModeClick);
      modesDiv.appendChild(span);
    });

    var grav = document.createElement('div');
    grav.className = 'mw-grav';
    grav.innerHTML =
      '<button class="mw-grav-qbtn" data-g="0">○</button>' +
      '<button class="mw-grav-qbtn on" data-g="981">♁</button>' +
      '<input class="mw-grav-slider" type="range" id="mwGSlider" min="-2479" max="2479" value="981" step="1">' +
      '<button class="mw-grav-qbtn" data-g="-981">↑</button>';

    bar.appendChild(row);
    bar.appendChild(modesDiv);
    bar.appendChild(grav);

    return bar;
  }

  function createWeatherButton() {
    var btn = document.createElement('button');
    btn.id = 'weather-btn';
    btn.type = 'button';
    btn.title = '天气特效';
    btn.innerHTML = '☁️';
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var card = document.getElementById('weatherCard');
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    return btn;
  }

  /* ==================== Event handlers ==================== */

  function onModeClick(e) {
    var el = e.currentTarget;
    var mode = el.getAttribute('data-mode');
    var sub = el.getAttribute('data-sub');
    setWeather(mode, sub);
  }

  function setWeather(mode, sub) {
    CUR_MODE = mode;
    CUR_SUB = sub;
    updateCard();
    updateGravUI(GRAVITY);
    syncPills();

    // Update gravity section for clear/sun mode
    var gravEl = document.getElementById('wcGravity');
    if (gravEl) {
      if (mode === 'clear') {
        gravEl.style.opacity = '0.35';
        gravEl.style.pointerEvents = 'none';
      } else {
        gravEl.style.opacity = '1';
        gravEl.style.pointerEvents = 'auto';
      }
    }

    // Call WeatherFX API
    if (window.WeatherFX && window.WeatherFX.setWeather) {
      window.WeatherFX.setWeather(mode, sub);
    }
  }

  function updateGravity(val) {
    var g = val / 100;
    var sn = snapG(g);
    if (sn !== g) {
      var gSlider = document.getElementById('gSlider');
      var mwSlider = document.getElementById('mwGSlider');
      if (gSlider) gSlider.value = Math.round(sn * 100);
      if (mwSlider) mwSlider.value = Math.round(sn * 100);
      g = sn;
    }
    GRAVITY = g;
    updateGravUI(g);

    // Sync with WeatherFX internal gravity if accessible
    if (window.WeatherFX && window.WeatherFX.setGravity) {
      window.WeatherFX.setGravity(g);
    }
  }

  /* ==================== UI Updates ==================== */

  function updateGravUI(g) {
    var absG = Math.abs(g);
    var pos = g2p(g);

    // Thumb position
    var thumb = document.getElementById('wcThumb');
    if (thumb) thumb.style.left = pos.toFixed(1) + '%';

    // Fill bar position
    var fill = document.getElementById('wcGravFill');
    if (fill) {
      var zp = g2p(0);
      if (g >= 0) {
        fill.style.left = zp.toFixed(1) + '%';
        fill.style.width = (pos - zp).toFixed(1) + '%';
      } else {
        fill.style.left = pos.toFixed(1) + '%';
        fill.style.width = (zp - pos).toFixed(1) + '%';
      }
    }

    // Planet text & hint
    var cl = closestP(absG);
    var hint = cl ? gravHint(cl.name, absG) : '';
    var pref = g < 0 && absG > 0.05 ? '−' : '';

    var pEl = document.getElementById('wcPlanet');
    var hEl = document.getElementById('wcGravHint');

    if (pEl) {
      if (g < 0 && absG > 0.05 && !cl) {
        pEl.innerHTML = '↑ 逆向重力';
        pEl.style.color = '#d09090';
      } else if (absG < 0.05) {
        pEl.innerHTML = '○ 零重力';
        pEl.style.color = '#aab';
      } else if (!cl) {
        pEl.textContent = '自由重力';
        pEl.style.color = '';
      } else {
        pEl.innerHTML = cl.sym + ' ' + cl.name;
        pEl.style.color = '';
      }
    }

    if (hEl) {
      if (g < 0 && absG > 0.05 && !cl) {
        hEl.textContent = '−' + absG.toFixed(2) + ' · 上行';
      } else if (absG < 0.05) {
        hEl.textContent = '0.00 · 漂浮';
      } else if (!cl) {
        hEl.textContent = absG.toFixed(2) + ' m/s²';
      } else {
        hEl.textContent = pref + cl.g.toFixed(2) + ' · ' + hint;
      }
    }

    // Quick button active states
    document.querySelectorAll('.wc-grav-qbtn, .mw-grav-qbtn').forEach(function (b) {
      b.classList.toggle('on', Math.abs(g - parseInt(b.getAttribute('data-g')) / 100) < 0.03);
    });

    // Sync mobile slider
    var mwSlider = document.getElementById('mwGSlider');
    if (mwSlider) mwSlider.value = Math.round(g * 100);
  }

  function syncPills() {
    document.querySelectorAll('.wc-mode, .mw-mode').forEach(function (el) {
      el.classList.toggle('on',
        el.getAttribute('data-mode') === CUR_MODE &&
        el.getAttribute('data-sub') === CUR_SUB
      );
    });
  }

  function updateCard() {
    var info = getModeInfo();

    var greetEl = document.getElementById('wcGreeting');
    var poemEl = document.getElementById('wcPoem');
    var locEl = document.getElementById('wcLocation');
    var weatherEl = document.getElementById('wcWeather');
    var mwGreetEl = document.getElementById('mwGreeting');
    var mwWeatherEl = document.getElementById('mwWeather');

    if (greetEl) greetEl.textContent = getGreeting();
    if (poemEl) poemEl.textContent = '「' + (info.poem || '') + '」';
    if (locEl) locEl.textContent = '—— ' + (info.poet || '');
    if (weatherEl) weatherEl.textContent = info.icon + ' ' + info.label + ' · ' + info.temp;
    if (mwGreetEl) mwGreetEl.textContent = getGreeting();
    if (mwWeatherEl) mwWeatherEl.textContent = info.icon + ' ' + info.label + ' · ' + info.temp;
  }

  /* ==================== Event binding ==================== */

  function bindEvents() {
    // Desktop gravity slider
    var gSlider = document.getElementById('gSlider');
    if (gSlider) {
      gSlider.addEventListener('input', function () {
        updateGravity(parseInt(this.value));
      });
      gSlider.addEventListener('change', function () {
        var g = parseInt(this.value) / 100;
        var sn = snapG(g);
        if (sn !== g) {
          this.value = Math.round(sn * 100);
          updateGravity(Math.round(sn * 100));
        }
      });
    }

    // Mobile gravity slider
    var mwSlider = document.getElementById('mwGSlider');
    if (mwSlider) {
      mwSlider.addEventListener('input', function () {
        var gSlider = document.getElementById('gSlider');
        if (gSlider) gSlider.value = this.value;
        updateGravity(parseInt(this.value));
      });
    }

    // Quick gravity buttons (both desktop and mobile)
    document.querySelectorAll('.wc-grav-qbtn, .mw-grav-qbtn').forEach(function (b) {
      b.addEventListener('click', function () {
        var t = parseInt(this.getAttribute('data-g'));
        var gSlider = document.getElementById('gSlider');
        var mwSlider = document.getElementById('mwGSlider');
        if (gSlider) gSlider.value = t;
        if (mwSlider) mwSlider.value = t;
        updateGravity(t);
      });
    });

    // Toggle switch
    var toggle = document.getElementById('fxToggle');
    if (toggle) {
      toggle.addEventListener('change', function () {
        var enabled = this.checked;
        try {
          localStorage.setItem('blog_weather_fx', enabled ? 'enabled' : 'disabled');
        } catch (e) {}
        if (window.WeatherFX) {
          if (enabled) {
            if (window.WeatherFX.enable) window.WeatherFX.enable();
          } else {
            if (window.WeatherFX.disable) window.WeatherFX.disable();
          }
        }
      });
    }
  }

  /* ==================== Init ==================== */

  function init() {
    // Avoid duplicate: if card already exists, just update it
    if (document.getElementById('weatherCard')) {
      // Refresh state
      if (window.WeatherFX && window.WeatherFX.getCurrent) {
        var cur = window.WeatherFX.getCurrent();
        if (cur) { CUR_MODE = cur.mode; CUR_SUB = cur.sub; }
      }
      updateCard();
      updateGravUI(GRAVITY);
      syncPills();
      return;
    }

    var aside = document.getElementById('aside-content');
    if (!aside) {
      setTimeout(init, 200);
      return;
    }

    // Remove old v4 weather card to avoid duplicates
    var oldCard = document.getElementById('weather-card');
    if (oldCard) oldCard.remove();

    var oldMobile = document.getElementById('weather-mobile-bar');
    if (oldMobile) oldMobile.remove();

    // Insert weather card into sidebar
    var card = createWeatherCard();
    aside.insertBefore(card, aside.firstChild);

    // Insert mobile bar after content area
    var mobileBar = createMobileBar();
    var contentWrap = document.querySelector('#content-inner, .layout, #content-wrap');
    if (contentWrap && contentWrap.parentNode) {
      contentWrap.parentNode.insertBefore(mobileBar, contentWrap.nextSibling);
    } else {
      document.body.appendChild(mobileBar);
    }

    // Create or update ☁️ button in rightside
    var existingBtn = document.getElementById('weather-btn');
    if (!existingBtn) {
      var rightsideHide = document.getElementById('rightside-config-hide');
      if (rightsideHide) {
        var btn = createWeatherButton();
        rightsideHide.appendChild(btn);
      }
    } else {
      // Update existing button behavior (remove old popup logic)
      existingBtn.onclick = function (e) {
        e.stopPropagation();
        var c = document.getElementById('weatherCard');
        if (c) c.scrollIntoView({ behavior: 'smooth', block: 'center' });
      };
    }

    // Read initial state from WeatherFX
    if (window.WeatherFX && window.WeatherFX.getCurrent) {
      var cur = window.WeatherFX.getCurrent();
      if (cur) { CUR_MODE = cur.mode; CUR_SUB = cur.sub; }
    }

    // Bind all event handlers
    bindEvents();

    // Initial UI render
    updateCard();
    updateGravUI(GRAVITY);
    syncPills();
  }

  /* ==================== Public API ==================== */

  window.WeatherPanel = { init: init };
})();

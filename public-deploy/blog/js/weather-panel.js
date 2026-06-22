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

    // 8 秒后自动消失
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
    // 延迟等待 DOM ready
    var rightside = document.getElementById('rightside-config-hide');
    if (!rightside) {
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

    // 插入面板到 rightside 内
    var panel = createPanel();
    document.getElementById('rightside').appendChild(panel);
  }

  window.WeatherPanel = { init: init };
})();

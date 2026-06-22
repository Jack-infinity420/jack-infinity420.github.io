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

    if (!province && !city) return;

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

  // patch render to store last data for rerender
  var originalRender = window.WeatherCard.render;
  window.WeatherCard.render = function (data) {
    window.WeatherCard._lastData = data;
    originalRender(data);
  };
})();

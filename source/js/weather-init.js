/**
 * 天气欢迎系统 - 主入口
 * IP 定位 → 天气 + 诗词 → 侧栏/移动端卡片（无全屏粒子、无模式切换面板）
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
      return;
    }

    // 3. 并行获取天气和诗词
    var weatherPromise = window.BlogWeather
      ? window.BlogWeather.getWeather(geo.city)
      : Promise.resolve(null);

    var poemPromise = window.BlogPoem
      ? window.BlogPoem.getPoem(geo.city, geo.province)
      : Promise.resolve(null);

    var results = await Promise.allSettled([weatherPromise, poemPromise]);
    var weather = results[0].status === 'fulfilled' ? results[0].value : null;
    var poem = results[1].status === 'fulfilled' ? results[1].value : null;

    // 4. 渲染卡片（无全屏 Canvas 粒子、无天气模式面板 — 仅静态卡片 UI）
    if (window.WeatherCard) {
      window.WeatherCard.render({
        province: geo.province,
        city: geo.city,
        poem: poem,
        weather: weather,
        config: config
      });
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
      switch_hint_desktop: '',
      switch_hint_mobile: ''
    };
  }

  // 支持 pjax 后重新初始化
  document.addEventListener('pjax:complete', function () {
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

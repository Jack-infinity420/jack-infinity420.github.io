/**
 * 天气欢迎系统 - 主入口
 * 编排：IP 定位 → 天气 + 诗词（并行）→ 卡片渲染
 * （v6 粒子特效/控制面板/日夜间模块已于 2026-08 移除，git 历史可查）
 */
(function () {
  'use strict';

  async function main() {
    // 0. 加载配置
    var config = getConfig();

    // 1. IP 定位
    var geo = null;
    if (window.BlogGeo) {
      geo = await window.BlogGeo.getLocation();
    }

    if (!geo || !geo.city) {
      return;
    }

    // 2. 并行获取天气和诗词
    var weatherPromise = window.BlogWeather
      ? window.BlogWeather.getWeather(geo.city)
      : Promise.resolve(null);

    var poemPromise = window.BlogPoem
      ? window.BlogPoem.getPoem(geo.city)
      : Promise.resolve(null);

    var results = await Promise.allSettled([weatherPromise, poemPromise]);
    var weather = results[0].status === 'fulfilled' ? results[0].value : null;
    var poem = results[1].status === 'fulfilled' ? results[1].value : null;

    // 3. 渲染卡片
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
    // 降级默认值（与 source/_data/welcome.yml 保持一致；
    // switch_hint 留空——粒子面板已移除，不得提示切换入口）
    return {
      fixed_poem: '长风破浪会有时，直挂云帆济沧海',
      greeting_template: '{time_period}好，欢迎来自{province}·{city}的朋友',
      poem_fallback: '长风破浪会有时，直挂云帆济沧海',
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

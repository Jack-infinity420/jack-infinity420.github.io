/**
 * 天气欢迎系统 - 主入口
 * IP 定位 → 天气 + 诗词 → 侧栏/移动端卡片（无全屏粒子、无模式切换面板）
 */
(function () {
  'use strict';

  async function main() {
    console.log('[WeatherInit] main() started');
    // 0. 加载配置
    var config = getConfig();
    console.log('[WeatherInit] config loaded');

    // 1. 日夜间检测（最先执行，不依赖网络）
    if (window.BlogDayNight) {
      window.BlogDayNight.apply();
      window.BlogDayNight.watchManualToggle();
    }

    // 2. IP 定位（带重试，等待 scripts 加载完成）
    var geo = null;
    console.log('[WeatherInit] BlogGeo exists:', !!window.BlogGeo);
    if (window.BlogGeo) {
      geo = await window.BlogGeo.getLocation();
      console.log('[WeatherInit] geo result:', JSON.stringify(geo));
    } else {
      // geo.js 尚未加载，等待最多 5s
      console.log('[WeatherInit] waiting for BlogGeo...');
      geo = await new Promise(function (resolve) {
        var waited = 0;
        var maxWait = 5000;
        var interval = setInterval(function () {
          waited += 200;
          if (window.BlogGeo) {
            clearInterval(interval);
            console.log('[WeatherInit] BlogGeo appeared after', waited, 'ms');
            window.BlogGeo.getLocation().then(function(g) {
              console.log('[WeatherInit] geo result:', JSON.stringify(g));
              resolve(g);
            });
          } else if (waited >= maxWait) {
            clearInterval(interval);
            console.log('[WeatherInit] BlogGeo NOT found after', maxWait, 'ms');
            resolve(null);
          }
        }, 200);
      });
    }

    // 即使没有定位到城市，也继续渲染默认欢迎卡片
    if (!geo) {
      geo = { province: '', city: '', country: '' };
    }
    console.log('[WeatherInit] final geo:', JSON.stringify(geo));

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
    console.log('[WeatherInit] weather:', !!weather, 'poem:', !!poem);

    // 4. 渲染卡片（无全屏 Canvas 粒子、无天气模式面板 — 仅静态卡片 UI）
    console.log('[WeatherInit] WeatherCard exists:', !!window.WeatherCard);
    if (window.WeatherCard) {
      console.log('[WeatherInit] calling WeatherCard.render...');
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
      greeting_template: '{time_period}好，欢迎来自{province}·{city}的朋友',
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

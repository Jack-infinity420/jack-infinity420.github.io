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

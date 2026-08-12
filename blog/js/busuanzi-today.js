/**
 * 不蒜子今日新增统计
 * 
 * 原理：
 * 1. 从不蒜子 JSON API 获取实时总数 (site_uv, site_pv)
 * 2. 在 localStorage 存每日基线
 * 3. 今日新增 = 当前实时总数 - 昨日最终总值
 * 4. 如果跨天了，自动用前一日的总值更新基线
 * 
 * API: https://busuanzi.ibruce.info/busuanzi?jsonpCallback=xxx
 * 返回: {"site_uv": 总数, "site_pv": 总数, "page_pv": 当前页, "version": "2.4"}
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'busuanzi_today_tracker';
  const API_URL = 'https://busuanzi.ibruce.info/busuanzi?jsonpCallback=BusuanziCallback';

  function getToday() {
    const d = new Date();
    // 使用 Asia/Shanghai 时区日期
    const shanghai = new Date(d.getTime() + 8 * 3600000);
    return shanghai.toISOString().slice(0, 10); // YYYY-MM-DD
  }

  /**
   * 从 JSONP API 获取不蒜子数据
   */
  function fetchBusuanziData() {
    return new Promise(function (resolve, reject) {
      var callbackName = 'BusuanziCallback_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      var script = document.createElement('script');
      var timeout = setTimeout(function () {
        cleanup();
        reject(new Error('Busuanzi API timeout'));
      }, 5000);

      function cleanup() {
        clearTimeout(timeout);
        if (script.parentNode) script.parentNode.removeChild(script);
        delete window[callbackName];
      }

      window[callbackName] = function (data) {
        cleanup();
        resolve(data);
      };

      script.src = API_URL.replace('BusuanziCallback', callbackName);
      script.onerror = function () {
        cleanup();
        reject(new Error('Busuanzi API load error'));
      };
      document.head.appendChild(script);
    });
  }

  /**
   * 读取 localStorage 中的跟踪数据
   */
  function getTracker() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }

  /**
   * 保存跟踪数据到 localStorage
   */
  function saveTracker(tracker) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tracker));
    } catch (e) {}
  }

  /**
   * 在主 webinfo 卡片中插入今日数据显示行
   */
  function injectTodayRows() {
    var webinfo = document.querySelector('.card-webinfo .webinfo');
    if (!webinfo) return;

    // 避免重复注入
    if (document.getElementById('busuanzi-today-uv-row')) return;

    // 游客数（今日新增访客）
    var uvRow = document.createElement('div');
    uvRow.className = 'webinfo-item';
    uvRow.id = 'busuanzi-today-uv-row';
    uvRow.innerHTML =
      '<div class="item-name">今日访客数 :</div>' +
      '<div class="item-count" id="busuanzi-today-uv">' +
      '<i class="fa-solid fa-spinner fa-spin"></i></div>';

    // 浏览量（今日新增浏览）
    var pvRow = document.createElement('div');
    pvRow.className = 'webinfo-item';
    pvRow.id = 'busuanzi-today-pv-row';
    pvRow.innerHTML =
      '<div class="item-name">今日浏览量 :</div>' +
      '<div class="item-count" id="busuanzi-today-pv">' +
      '<i class="fa-solid fa-spinner fa-spin"></i></div>';

    // 插入到 站点总访问量 那一行的后面
    // 找 #busuanzi_value_site_pv 的父级 .webinfo-item
    var sitePvRow = document.getElementById('busuanzi_value_site_pv');
    if (sitePvRow) {
      var pvParent = sitePvRow.closest('.webinfo-item');
      if (pvParent && pvParent.nextSibling) {
        webinfo.insertBefore(pvRow, pvParent.nextSibling);
        webinfo.insertBefore(uvRow, pvRow);
      } else if (pvParent) {
        pvParent.insertAdjacentElement('afterend', pvRow);
        pvRow.insertAdjacentElement('beforebegin', uvRow);
      }
    } else {
      // fallback: 加到末尾
      webinfo.appendChild(uvRow);
      webinfo.appendChild(pvRow);
    }
  }

  /**
   * 更新显示数值
   */
  function updateDisplay(todayUv, todayPv) {
    var uvEl = document.getElementById('busuanzi-today-uv');
    var pvEl = document.getElementById('busuanzi-today-pv');
    if (uvEl) uvEl.textContent = todayUv;
    if (pvEl) pvEl.textContent = todayPv;
  }

  function showError() {
    var uvEl = document.getElementById('busuanzi-today-uv');
    var pvEl = document.getElementById('busuanzi-today-pv');
    if (uvEl) uvEl.textContent = '--';
    if (pvEl) pvEl.textContent = '--';
  }

  /**
   * 主逻辑
   */
  async function main() {
    injectTodayRows();

    try {
      var data = await fetchBusuanziData();
    } catch (e) {
      console.warn('Busuanzi today tracker: API 请求失败', e.message);
      showError();
      return;
    }

    var currentUv = parseInt(data.site_uv, 10) || 0;
    var currentPv = parseInt(data.site_pv, 10) || 0;
    var today = getToday();

    var tracker = getTracker();

    if (!tracker || tracker.date !== today) {
      // 新的一天，或首次使用
      tracker = {
        date: today,
        // 昨天的最终值（如果之前有记录就用之前的 current，否则用今天起始值）
        yesterdayFinalUv: tracker ? tracker.currentUvAtLastUpdate || tracker.yesterdayFinalUv || currentUv : currentUv,
        yesterdayFinalPv: tracker ? tracker.currentPvAtLastUpdate || tracker.yesterdayFinalPv || currentPv : currentPv,
      };
    }

    // 今日新增 = 当前总数 - 昨日最终值
    var todayUv = Math.max(0, currentUv - tracker.yesterdayFinalUv);
    var todayPv = Math.max(0, currentPv - tracker.yesterdayFinalPv);

    // 更新当前值记录（用于下一次跨日判断）
    tracker.currentUvAtLastUpdate = currentUv;
    tracker.currentPvAtLastUpdate = currentPv;

    saveTracker(tracker);
    updateDisplay(todayUv, todayPv);
  }

  // 在 DOM ready 后执行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else {
    main();
  }

  // PJAX 支持：Butterfly 使用 pjax，切换页面后需要重新执行
  document.addEventListener('pjax:complete', main);
})();

/**
 * IP 地理定位模块 — 访客端定位
 *
 * 策略（社区最佳实践）：
 *   1. 搜狐 pv.sohu.com JSONP（零配置、无 CORS、社区最流行）
 *   2. Fallback: ip-api.com fetch（数据丰富，有 proxy 检测）
 *   3. 全部失败 → 静默隐藏卡片，不显示错误位置
 *
 * 缓存: localStorage, key=blog_location, 有效期 24h
 */
(function () {
  'use strict';

  var CACHE_KEY = 'blog_location_***';
  var CACHE_TTL = 24 * 60 * 60 * 1000; // 24 小时
  var REQUEST_TIMEOUT = 3000; // 单次请求 3s 超时

  // ========== 缓存 ==========

  function getCached() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (Date.now() - data._ts > CACHE_TTL) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }
      // 忽略无效缓存
      if (!data.city || data.city === '未知区域') {
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
    } catch (e) { /* 静默 */ }
  }

  // ========== 搜狐 JSONP（社区首选，无 CORS 无 Key） ==========

  function trySohu() {
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = 'https://pv.sohu.com/cityjson?ie=utf-8';
      script.async = true;

      var timer = setTimeout(function () {
        cleanup();
        reject(new Error('sohu timeout'));
      }, REQUEST_TIMEOUT);

      function cleanup() {
        delete window.returnCitySN;
        if (script.parentNode) script.parentNode.removeChild(script);
      }

      // 搜狐接口通过全局变量 returnCitySN 返回数据
      var checkInterval = setInterval(function () {
        if (typeof window.returnCitySN !== 'undefined') {
          clearTimeout(timer);
          clearInterval(checkInterval);
          cleanup();
          var data = window.returnCitySN;
          // "国内未识别地区" → 视为失败
          if (data.cname && data.cname !== '国内未识别地区') {
            var parts = data.cname.split(' ');
            resolve({
              province: parts[0] || '',
              city: parts[1] || parts[0] || '',
              country: '中国'
            });
          } else {
            reject(new Error('sohu unknown region'));
          }
        }
      }, 100);

      // 加载失败
      script.onerror = function () {
        clearTimeout(timer);
        clearInterval(checkInterval);
        cleanup();
        reject(new Error('sohu load error'));
      };

      document.head.appendChild(script);
    });
  }

  // ========== ip-api.com fetch（数据丰富，支持中文） ==========

  function tryIpApi() {
    return fetch('http://ip-api.com/json/?lang=zh-CN', {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT)
    }).then(function (resp) {
      if (!resp.ok) throw new Error('ip-api status ' + resp.status);
      return resp.json();
    }).then(function (json) {
      if (json.status !== 'success') throw new Error(json.message);
      return {
        province: json.regionName || '',
        city: json.city || '',
        country: json.country || ''
      };
    });
  }

  // ========== ipapi.co fetch（英文备用） ==========

  function tryIpapiCo() {
    return fetch('https://ipapi.co/json/', {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT)
    }).then(function (resp) {
      if (!resp.ok) throw new Error('ipapi status ' + resp.status);
      return resp.json();
    }).then(function (json) {
      if (json.error) throw new Error(json.reason);
      return {
        province: json.region || '',
        city: json.city || '',
        country: json.country_name || ''
      };
    });
  }

  // ========== 主入口：串行 fallback ==========

  function fetchLocation() {
    // 1. 搜狐 JSONP（国内走 <script> 注入，无 CORS）
    return trySohu().catch(function (err) {
      console.warn('[BlogGeo] 搜狐失败:', err.message);
      // 2. ip-api.com fetch
      return tryIpApi().catch(function (err2) {
        console.warn('[BlogGeo] ip-api 失败:', err2.message);
        // 3. ipapi.co fetch
        return tryIpapiCo().catch(function (err3) {
          console.warn('[BlogGeo] ipapi 失败:', err3.message);
          // 全部失败 → 返回 null，卡片隐藏
          return null;
        });
      });
    });
  }

  function getLocation() {
    // 先查缓存
    var cached = getCached();
    if (cached) {
      return Promise.resolve(cached);
    }

    return fetchLocation().then(function (data) {
      // null → 定位完全失败，返回空数据让卡片隐藏
      if (!data) return { province: '', city: '', country: '' };

      // 有有效城市 → 缓存并返回
      if (data.city && data.city !== '未知') {
        setCache(data);
      }
      return data;
    });
  }

  window.BlogGeo = { getLocation: getLocation };
})();

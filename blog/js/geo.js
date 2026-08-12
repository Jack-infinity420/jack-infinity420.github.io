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

  // 通过 pconline JSONP 获取中文城市名（对国内IP准确）
  function fetchLocationChinese() {
    return new Promise(function (resolve, reject) {
      var callbackName = 'blogGeoCb_' + Date.now();
      var script = document.createElement('script');
      script.src = 'https://whois.pconline.com.cn/ipJson.jsp?callback=' + callbackName;
      script.charset = 'gbk';
      script.async = true;

      var timer = setTimeout(function () {
        cleanup();
        reject(new Error('pconline timeout'));
      }, 5000);

      window[callbackName] = function (data) {
        clearTimeout(timer);
        cleanup();
        resolve({
          province: data.pro || '',
          city: data.city || '',
          country: '中国'
        });
      };

      function cleanup() {
        delete window[callbackName];
        if (script.parentNode) script.parentNode.removeChild(script);
      }

      script.onerror = function () {
        clearTimeout(timer);
        cleanup();
        reject(new Error('pconline failed'));
      };

      document.head.appendChild(script);
    });
  }

  async function fetchLocation() {
    // 1. 先尝试中文定位（对国内IP准确）
    try {
      return await fetchLocationChinese();
    } catch (e) {
      console.warn('[BlogGeo] 中文定位失败，fallback 到英文:', e.message);
    }

    // 2. fallback 到 ipapi.co（返回英文）
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

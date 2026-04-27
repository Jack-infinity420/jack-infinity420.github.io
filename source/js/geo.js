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

  async function fetchLocation() {
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

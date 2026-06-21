/**
 * IP 地理定位模块
 * 主接口: ip-api.com (免费, 无需 API key, 支持中文)
 * 备用接口: ipapi.co (英文)
 * 缓存: localStorage, key=blog_location, 有效期 7 天
 */
(function () {
  'use strict';

  const CACHE_KEY = 'blog_location';
  const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 天

  function getCached() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (Date.now() - data._ts > CACHE_TTL) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }
      // 忽略缓存中的未知/空城市
      if (!data.city || data.city === '未知') {
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

  // ip-api.com — 免费，支持 ?lang=zh-CN 返回中文城市名
  async function fetchFromIpApi() {
    const resp = await fetch('http://ip-api.com/json/?lang=zh-CN', {
      signal: AbortSignal.timeout(5000)
    });
    if (!resp.ok) throw new Error('ip-api returned ' + resp.status);
    const json = await resp.json();
    if (json.status !== 'success') throw new Error(json.message || 'ip-api error');
    return {
      province: json.regionName || '',
      city: json.city || '',
      country: json.country || ''
    };
  }

  // ipapi.co — 备用，返回英文
  async function fetchFromIpapiCo() {
    const resp = await fetch('https://ipapi.co/json/', {
      signal: AbortSignal.timeout(5000)
    });
    if (!resp.ok) throw new Error('ipapi returned ' + resp.status);
    const json = await resp.json();
    if (json.error) throw new Error(json.reason || 'ipapi error');
    return {
      province: json.region || '',
      city: json.city || '',
      country: json.country_name || ''
    };
  }

  async function fetchLocation() {
    // 1. 优先 ip-api.com（支持中文，准确性高）
    try {
      return await fetchFromIpApi();
    } catch (e) {
      console.warn('[BlogGeo] ip-api 失败, 尝试备用:', e.message);
    }

    // 2. 备用 ipapi.co
    try {
      return await fetchFromIpapiCo();
    } catch (e) {
      console.warn('[BlogGeo] ipapi 失败:', e.message);
    }

    // 3. 全部失败
    return { province: '', city: '', country: '' };
  }

  async function getLocation() {
    // 1. 先查缓存
    const cached = getCached();
    if (cached) return cached;

    // 2. 请求 API
    try {
      const data = await fetchLocation();
      // 防止 API 返回空字符串或 "未知"
      if (data.city && data.city !== '未知') {
        setCache(data);
      }
      return data;
    } catch (e) {
      console.warn('[BlogGeo] 定位失败:', e.message);
      return { province: '', city: '', country: '' };
    }
  }

  window.BlogGeo = { getLocation };
})();

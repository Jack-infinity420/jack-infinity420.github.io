/**
 * IP 地理定位模块
 * 接口: https://ipwhois.app/json/（免费 HTTPS，支持中文）
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
      if (!data.city || data.city === '未知' || data.city === '未知区域') {
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
    // 优先：ipwhois.app（免费 HTTPS + 中文，region/city 字段直接可用）
    const resp = await fetch('https://ipwhois.app/json/?lang=zh-CN', { signal: AbortSignal.timeout(5000) });
    if (!resp.ok) throw new Error('ipwhois returned ' + resp.status);
    const json = await resp.json();
    if (!json.success) throw new Error(json.message || 'ipwhois failed');

    // region 格式: "中国北京" "中国广东省深圳市"
    // 提取省和城市
    var region = (json.region || '').replace(/^中国/, '');
    var city = json.city || '';
    var country = json.country || '';

    // 匹配 "省级行政单位+可能的地级市"
    var provMatch = region.match(/^(.+?(?:省|自治区|市))?(.*?市|.*?地区|.*?自治州|.*?盟|.*?县)?$/);
    var province = '';
    if (provMatch) {
      province = provMatch[1] || region;
      if (!city && provMatch[2]) city = provMatch[2];
    } else {
      province = region;
    }
    // 直辖市：province === city 时只保留一个
    if (province === city) city = '';

    return {
      province: province,
      city: city || province,
      country: country
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
      console.warn('[BlogGeo] 定位失败:', e.message);
      return { province: '', city: '', country: '' };
    }
  }

  window.BlogGeo = { getLocation };
})();

/**
 * IP 地理定位模块 — 访客端定位
 *
 * 策略（社区最佳实践）：
 *   1. 网易 ip.ws.126.net JSONP（city/province 字段清晰，无 CORS）
 *   2. 搜狐 pv.sohu.com JSONP（作为备用）
 *   3. ipwhois.app fetch（免费 HTTPS，数据准确，支持中文）
 *   4. 全部失败 → 静默隐藏卡片
 *
 * 缓存: localStorage, key=blog_location, 有效期 24h
 */
(function () {
  'use strict';

  var CACHE_KEY = 'blog_location';
  var CACHE_TTL = 24 * 60 * 60 * 1000;
  var REQUEST_TIMEOUT = 3000;

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
      if (!data.city || data.city === '未知区域' || data.city === '未知') {
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
    } catch (e) {}
  }

  // ========== 网易 126 JSONP（优先，字段清晰） ==========
  // 返回: var localAddress={city:"深圳市", province:"广东省"}

  function tryNetEase() {
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = 'https://ip.ws.126.net/ipquery';
      script.async = true;

      var timer = setTimeout(function () {
        cleanup();
        reject(new Error('netease timeout'));
      }, REQUEST_TIMEOUT);

      function cleanup() {
        if (script.parentNode) script.parentNode.removeChild(script);
      }

      var checkInterval = setInterval(function () {
        if (typeof localAddress !== 'undefined') {
          clearTimeout(timer);
          clearInterval(checkInterval);
          cleanup();
          var la = localAddress;
          var city = la.city || '';
          var province = la.province || '';
          if (city || province) {
            resolve({ province: province, city: city, country: '中国' });
          } else {
            reject(new Error('netease empty'));
          }
        }
      }, 100);

      script.onerror = function () {
        clearTimeout(timer);
        clearInterval(checkInterval);
        cleanup();
        reject(new Error('netease load error'));
      };

      document.head.appendChild(script);
    });
  }

  // ========== 搜狐 JSONP（备用） ==========
  // 返回: var returnCitySN = {"cname":"广东省深圳市"};

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

      var checkInterval = setInterval(function () {
        if (typeof window.returnCitySN !== 'undefined') {
          clearTimeout(timer);
          clearInterval(checkInterval);
          cleanup();
          var d = window.returnCitySN;
          if (d.cname && d.cname !== '未知') {
            // cname 格式: "广东省深圳市" 或 "北京市"
            var match = d.cname.match(
              /^(.+?省|.+?自治区|.+?市)(.*?市|.*?地区|.*?自治州|.*?盟|.*?县)?$/
            );
            var province = '';
            var city = '';
            if (match) {
              province = match[1] || '';
              city = match[2] || match[1] || '';
              // 直辖市：province===city，只保留一个
              if (province === city) city = '';
            } else {
              province = d.cname;
            }
            resolve({ province: province, city: city, country: '中国' });
          } else {
            reject(new Error('sohu unknown region'));
          }
        }
      }, 100);

      script.onerror = function () {
        clearTimeout(timer);
        clearInterval(checkInterval);
        cleanup();
        reject(new Error('sohu load error'));
      };

      document.head.appendChild(script);
    });
  }

  // ========== ipwhois.app fetch（深度备用，免费 HTTPS） ==========

  function tryIpApi() {
    return fetch('https://ipwhois.app/json/?lang=zh-CN', {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT)
    }).then(function (resp) {
      if (!resp.ok) throw new Error('ipwhois status ' + resp.status);
      return resp.json();
    }).then(function (json) {
      if (!json.success) throw new Error(json.message);
      // ipwhois 返回: region="中国北京" city="北京"
      // 需要拆分 region 提取省
      var province = '';
      var city = json.city || '';
      var region = json.region || '';
      // region 格式: "中国北京" "广东省深圳市"
      // 去掉"中国"前缀后取省级部分
      if (region) {
        var clean = region.replace(/^中国/, '');
        // 省级行政区: 省/自治区/直辖市
        var provMatch = clean.match(/^(.+?(?:省|自治区|市))(.+?市|.+?地区|.+?自治州|.+?盟|.+?县)?$/);
        if (provMatch) {
          province = provMatch[1] || '';
          if (!city && provMatch[2]) city = provMatch[2];
        } else {
          province = clean;
        }
      }
      if (!city) city = province; // 直辖市 fallback
      return {
        province: province,
        city: city,
        country: json.country || ''
      };
    });
  }

  // ========== fetchLocation ==========

  function fetchLocation() {
    // 1. 网易 126
    return tryNetEase().catch(function (err) {
      console.warn('[BlogGeo] 网易失败:', err.message);
      // 2. 搜狐
      return trySohu().catch(function (err2) {
        console.warn('[BlogGeo] 搜狐失败:', err2.message);
        // 3. ipwhois.app
        return tryIpApi().catch(function (err3) {
          console.warn('[BlogGeo] ipwhois 失败:', err3.message);
          return null;
        });
      });
    });
  }

  function getLocation() {
    var cached = getCached();
    if (cached) return Promise.resolve(cached);

    return fetchLocation().then(function (data) {
      if (!data) return { province: '', city: '', country: '' };
      if (data.city) setCache(data);
      return data;
    });
  }

  window.BlogGeo = { getLocation: getLocation };
})();

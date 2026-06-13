/**
 * 天气数据模块
 * 接口: https://wttr.in/{city}?format=j1 (免费，无需注册)
 * 缓存: localStorage, key=blog_weather_{city}, 有效期 30 分钟
 */
(function () {
  'use strict';

  const CACHE_PREFIX = 'blog_weather_';
  const CACHE_TTL = 30 * 60 * 1000; // 30 分钟

  // wttr.in weatherCode → 内部天气类型
  const CODE_MAP = {
    '113': 'clear',       // 晴
    '116': 'cloudy',      // 晴间多云
    '119': 'cloudy',      // 多云
    '122': 'overcast',    // 阴
    '143': 'fog',         // 雾
    '176': 'rain',        // 零星小雨
    '179': 'snow',        // 零星小雪
    '182': 'snow',        // 零星雨夹雪
    '185': 'rain',        // 零星冻雨
    '200': 'thunderstorm',// 雷暴
    '227': 'snow',        // 暴风雪
    '230': 'snow',        // 暴风雪
    '248': 'fog',         // 雾
    '260': 'fog',         // 冻雾
    '263': 'rain',        // 小雨
    '266': 'rain',        // 小雨
    '281': 'rain',        // 冻雨
    '284': 'rain',        // 冻雨
    '293': 'rain',        // 小雨
    '296': 'rain',        // 小雨
    '299': 'rain',        // 中雨
    '302': 'rain',        // 中雨
    '305': 'rain',        // 大雨
    '308': 'rain',        // 大雨
    '311': 'rain',        // 冻雨
    '314': 'rain',        // 冻雨
    '317': 'rain',        // 冻雨
    '320': 'snow',        // 小雪
    '323': 'snow',        // 小雪
    '326': 'snow',        // 小雪
    '329': 'snow',        // 中雪
    '332': 'snow',        // 中雪
    '335': 'snow',        // 大雪
    '338': 'snow',        // 大雪
    '350': 'rain',        // 冰雹
    '353': 'rain',        // 阵雨
    '356': 'rain',        // 大雨
    '359': 'rain',        // 大雨
    '362': 'rain',        // 雨夹雪
    '365': 'rain',        // 雨夹雪
    '368': 'snow',        // 阵雪
    '371': 'snow',        // 大雪
    '374': 'rain',        // 冰雹
    '377': 'rain',        // 冰雹
    '386': 'thunderstorm',// 雷阵雨
    '389': 'thunderstorm',// 雷暴
    '392': 'thunderstorm',// 雷暴
    '395': 'snow'         // 大雪
  };

  function getCached(city) {
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + city);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (Date.now() - data._ts > CACHE_TTL) {
        localStorage.removeItem(CACHE_PREFIX + city);
        return null;
      }
      return data;
    } catch (e) {
      return null;
    }
  }

  function setCache(city, data) {
    try {
      data._ts = Date.now();
      localStorage.setItem(CACHE_PREFIX + city, JSON.stringify(data));
    } catch (e) {
      // 静默
    }
  }

  function mapWeatherCode(code) {
    return CODE_MAP[String(code)] || 'clear';
  }

  function getWeatherIcon(type) {
    const icons = {
      clear: '☀️',
      cloudy: '⛅',
      rain: '🌧️',
      snow: '❄️',
      fog: '🌫️',
      thunderstorm: '⛈️',
      overcast: '☁️'
    };
    return icons[type] || '☀️';
  }

  async function fetchWeather(city) {
    const url = 'https://wttr.in/' + encodeURIComponent(city) + '?format=j1';
    const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!resp.ok) throw new Error('wttr.in returned ' + resp.status);
    const json = await resp.json();
    const current = json.current_condition[0];
    return {
      type: mapWeatherCode(current.weatherCode),
      temp: current.temp_C,
      desc: current.weatherDesc[0].value,
      icon: getWeatherIcon(mapWeatherCode(current.weatherCode))
    };
  }

  async function getWeather(city) {
    if (!city) return null;

    const cached = getCached(city);
    if (cached) return cached;

    try {
      const data = await fetchWeather(city);
      setCache(city, data);
      return data;
    } catch (e) {
      console.warn('[BlogWeather] 获取天气失败:', e.message);
      return null;
    }
  }

  window.BlogWeather = {
    getWeather: getWeather,
    getWeatherIcon: getWeatherIcon
  };
})();

/**
 * tsParticles 天气特效模块
 * 动态加载 tsParticles CDN，管理粒子实例
 */
(function () {
  'use strict';

  var TSPARTICLES_CDN = 'https://cdn.jsdelivr.net/npm/tsparticles@2.12.0/tsparticles.bundle.min.js';
  var containerId = 'weather-particles-canvas';
  var activeInstance = null;
  var isEnabled = true;
  var currentWeather = 'clear';

  function loadTsParticles() {
    return new Promise(function (resolve, reject) {
      if (window.tsParticles) return resolve(window.tsParticles);
      var script = document.createElement('script');
      script.src = TSPARTICLES_CDN;
      script.onload = function () { resolve(window.tsParticles); };
      script.onerror = function () { reject(new Error('tsParticles CDN 加载失败')); };
      document.head.appendChild(script);
    });
  }

  function createContainer() {
    var el = document.getElementById(containerId);
    if (el) return el;
    el = document.createElement('div');
    el.id = containerId;
    el.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;pointer-events:none;';
    document.body.prepend(el);
    return el;
  }

  function getParticleCount() {
    var base = 80;
    var isMobile = window.innerWidth < 900;
    var isLowPerf = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
    if (isMobile) base = Math.floor(base * 0.5);
    if (isLowPerf) base = Math.floor(base * 0.5);
    return base;
  }

  function getConfig(type) {
    var count = getParticleCount();
    var configs = {
      clear: {
        particles: {
          number: { value: count },
          color: { value: ['#ffd700', '#ffb347', '#ffcc33'] },
          shape: { type: 'circle' },
          opacity: { value: { min: 0.1, max: 0.4 }, animation: { enable: true, speed: 0.5, sync: false } },
          size: { value: { min: 1, max: 4 } },
          move: { enable: true, speed: 0.5, direction: 'top', random: true, straight: false }
        },
        detectRetina: true
      },
      cloudy: {
        particles: {
          number: { value: Math.floor(count * 0.6) },
          color: { value: ['#e8e8e8', '#f0f0f0', '#ffffff'] },
          shape: { type: 'circle' },
          opacity: { value: { min: 0.3, max: 0.6 } },
          size: { value: { min: 10, max: 30 } },
          move: { enable: true, speed: 0.3, direction: 'right', random: false, straight: true }
        },
        detectRetina: true
      },
      rain: {
        particles: {
          number: { value: Math.floor(count * 1.5) },
          color: { value: ['#a0c4ff', '#b8d4ff', '#c8e0ff'] },
          shape: { type: 'line' },
          opacity: { value: { min: 0.1, max: 0.3 } },
          size: { value: { min: 1, max: 2 } },
          move: { enable: true, speed: 12, direction: 195, straight: true },
          life: { duration: { value: { min: 0.5, max: 1.5 } } }
        },
        detectRetina: true
      },
      snow: {
        particles: {
          number: { value: count },
          color: { value: ['#ffffff', '#f0f8ff', '#e6e6fa'] },
          shape: { type: 'circle' },
          opacity: { value: { min: 0.3, max: 0.8 } },
          size: { value: { min: 2, max: 6 } },
          move: { enable: true, speed: 1.5, direction: 'bottom', random: true, straight: false, wobble: true }
        },
        detectRetina: true
      },
      fog: {
        particles: {
          number: { value: Math.floor(count * 0.4) },
          color: { value: ['#c8c8c8', '#d0d0d0', '#b8b8b8'] },
          shape: { type: 'circle' },
          opacity: { value: { min: 0.2, max: 0.5 } },
          size: { value: { min: 20, max: 60 } },
          move: { enable: true, speed: 0.2, direction: 'right', random: true, straight: true }
        },
        detectRetina: true
      },
      thunderstorm: {
        particles: {
          number: { value: Math.floor(count * 1.5) },
          color: { value: ['#a0c4ff', '#778899'] },
          shape: { type: 'line' },
          opacity: { value: { min: 0.2, max: 0.5 }, animation: { enable: true, speed: 2, sync: false } },
          size: { value: { min: 1, max: 3 } },
          move: { enable: true, speed: 14, direction: 195, straight: true },
          life: { duration: { value: { min: 0.5, max: 1 } } }
        },
        detectRetina: true
      },
      overcast: {
        particles: {
          number: { value: Math.floor(count * 0.5) },
          color: { value: ['#a0a0a0', '#b0b0b0', '#909090'] },
          shape: { type: 'circle' },
          opacity: { value: { min: 0.2, max: 0.4 } },
          size: { value: { min: 8, max: 25 } },
          move: { enable: true, speed: 0.4, direction: 'right', random: false, straight: true }
        },
        detectRetina: true
      }
    };
    return configs[type] || configs.clear;
  }

  async function init(type) {
    currentWeather = type || 'clear';
    if (!isEnabled) return;
    try {
      await loadTsParticles();
      var container = createContainer();
      if (activeInstance) activeInstance.destroy();
      activeInstance = await window.tsParticles.load({
        id: containerId,
        options: getConfig(currentWeather)
      });
    } catch (e) {
      console.warn('[WeatherFX] 初始化失败:', e.message);
    }
  }

  async function setWeather(type) {
    currentWeather = type;
    if (!isEnabled) {
      await enable();
      return;
    }
    if (!activeInstance) {
      await init(type);
      return;
    }
    try {
      activeInstance.destroy();
      activeInstance = await window.tsParticles.load({
        id: containerId,
        options: getConfig(type)
      });
    } catch (e) {
      console.warn('[WeatherFX] 切换天气失败:', e.message);
    }
  }

  async function enable() {
    isEnabled = true;
    await init(currentWeather);
    try { localStorage.setItem('blog_weather_fx', 'enabled'); } catch (e) {}
  }

  function disable() {
    isEnabled = false;
    if (activeInstance) {
      activeInstance.destroy();
      activeInstance = null;
    }
    var container = document.getElementById(containerId);
    if (container) container.remove();
    try { localStorage.setItem('blog_weather_fx', 'disabled'); } catch (e) {}
  }

  function getCurrent() {
    return currentWeather;
  }

  // 检查用户是否之前关闭了特效
  try {
    if (localStorage.getItem('blog_weather_fx') === 'disabled') {
      isEnabled = false;
    }
  } catch (e) {}

  window.WeatherFX = {
    init: init,
    setWeather: setWeather,
    enable: enable,
    disable: disable,
    getCurrent: getCurrent,
    loadTsParticles: loadTsParticles
  };
})();

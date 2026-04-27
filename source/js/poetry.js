/**
 * 诗词模块
 * 接口: 今日诗词 API v2 (非商用免费)
 * 失败降级: 返回 null，由调用方使用 welcome.yml 中的 poem_fallback
 */
(function () {
  'use strict';

  // 今日诗词 API token (公开 token，非商用使用)
  var TOKEN = 'M9QDy4EmekpDyvMhDgP7TkM5btZMPFbG';

  async function fetchPoem(city) {
    var url = 'https://v2.jinrishici.com/sentence';
    var resp = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { 'X-User-Token': TOKEN }
    });
    if (!resp.ok) throw new Error('jinrishici returned ' + resp.status);
    var json = await resp.json();
    if (json.status === 'success' && json.data) {
      return { content: json.data.content };
    }
    throw new Error('jinrishici: unexpected response');
  }

  async function getPoem(city) {
    try {
      return await fetchPoem(city);
    } catch (e) {
      console.warn('[BlogPoem] 获取诗词失败，使用降级:', e.message);
      return null; // 调用方使用 welcome.yml 中的 poem_fallback
    }
  }

  window.BlogPoem = { getPoem: getPoem };
})();

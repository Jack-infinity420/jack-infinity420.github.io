"use strict";

function siteRoot() {
  const raw = hexo.config.root || "/";
  const trimmed = String(raw).replace(/^\/+|\/+$/g, "");
  return trimmed ? `/${trimmed}/` : "/";
}

/**
 * Fix hexo-image-opt plugin generating relative paths (opt-images/...)
 * instead of absolute paths (/opt-images/...).
 * On nested pages like /posts/xxx.html, relative paths resolve incorrectly.
 */
hexo.extend.filter.register("after_render:html", function (str) {
  if (!str || str.length === 0) return str;

  const root = siteRoot();

  // Fix ALL opt-images/ paths in HTML attributes to be absolute.
  // Matches any opt-images/ preceded by a quote, whitespace, comma, or paren
  // which covers: src="opt-images/...", srcset="opt-images/..., opt-images/..., ..."
  str = str.replace(/(["'\s,(])\/opt-images\//g, `$1${root}opt-images/`);
  str = str.replace(/(["'\s,(])opt-images\//g, `$1${root}opt-images/`);

  // Fix mangled onerror handler caused by image-opt regex parsing.
  // The plugin's attrRegex stops at the first embedded quote, truncating
  // the fallback URL. Restore the correct onerror with fallback image.
  str = str.replace(
    /onerror=["']this\.onerror=null[,;]this\.src=["']/g,
    `onerror="this.onerror=null;this.src='${root}img/friend_404.gif'"`
  );

  return str;
}, 999);

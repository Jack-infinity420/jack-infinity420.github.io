"use strict";

function siteRoot() {
  const raw = hexo.config.root || "/";
  const trimmed = String(raw).replace(/^\/+|\/+$/g, "");
  return trimmed ? `/${trimmed}/` : "/";
}

function introReplayHref() {
  return `${siteRoot()}cosmic-intro/?replay=1`;
}

/**
 * Keep replay links on the real intro page. The blog is mounted under /blog/,
 * while Hexo's local server cannot serve a root-level /?replay=1 URL.
 */
hexo.extend.filter.register("after_render:html", function (str) {
  if (!str || str.indexOf("replay=1") === -1) return str;

  return str.replace(
    /href="[^"]*\?replay=1"/g,
    `href="${introReplayHref()}"`
  );
}, 1000);

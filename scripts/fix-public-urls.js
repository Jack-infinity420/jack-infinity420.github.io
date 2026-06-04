"use strict";

const fs = require("fs");
const path = require("path");

function siteRoot() {
  const raw = hexo.config.root || "/";
  const trimmed = String(raw).replace(/^\/+|\/+$/g, "");
  return trimmed ? `/${trimmed}/` : "/";
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizePublicUrls(str) {
  if (!str || typeof str !== "string") return str;

  const base = String(hexo.config.url || "").replace(/\/+$/, "");
  const root = siteRoot().replace(/\/$/, "");
  if (!base || root === "" || root === "/") return str;

  const blogPrefixes = [
    "posts/",
    "archives/",
    "categories/",
    "tags/",
    "images/",
    "img/",
    "css/",
    "js/",
    "pluginsSrc/",
    "fonts/",
    "opt-images/",
    "manifest.json",
    "search.xml",
    "sitemap.xml",
    "atom.xml",
    "baidu_urls.txt"
  ];

  for (const prefix of blogPrefixes) {
    const from = `${base}/${prefix}`;
    const to = `${base}${root}/${prefix}`;
    str = str.replace(new RegExp(escapeRegExp(from), "g"), to);
  }

  str = str.replace(new RegExp(`${escapeRegExp(base)}/index\\.html`, "g"), `${base}${root}/`);
  str = str.replace(new RegExp(`${escapeRegExp(base)}${escapeRegExp(root)}/index\\.html`, "g"), `${base}${root}/`);

  return str;
}

hexo.extend.filter.register("after_render:html", normalizePublicUrls, 1001);
hexo.extend.filter.register("after_render:xml", normalizePublicUrls, 1001);
hexo.extend.filter.register("after_render:txt", normalizePublicUrls, 1001);

function normalizeGeneratedFiles() {
  const publicDir = hexo.public_dir;
  const textExts = new Set([".html", ".xml", ".txt", ".json"]);

  function walk(dir) {
    if (!fs.existsSync(dir)) return;

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (!textExts.has(path.extname(entry.name))) continue;

      const original = fs.readFileSync(fullPath, "utf8");
      const normalized = normalizePublicUrls(original);
      if (normalized !== original) {
        fs.writeFileSync(fullPath, normalized);
      }
    }
  }

  walk(publicDir);
}

hexo.extend.filter.register("after_generate", normalizeGeneratedFiles, 1001);
hexo.extend.filter.register("before_exit", normalizeGeneratedFiles, 5);

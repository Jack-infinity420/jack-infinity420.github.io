/**
 * Fix canonical/og:url missing /blog/ prefix in assembled deploy output.
 * Hexo generates pages with root-relative URLs, but assemble-deploy.js
 * puts everything under /blog/. This script rewrites those meta URLs.
 */
var fs = require('fs');
var path = require('path');

var BLOG_DIR = path.join(__dirname, '..', 'public-deploy', 'blog');

function walk(dir, cb) {
  var entries = fs.readdirSync(dir, { withFileTypes: true });
  for (var i = 0; i < entries.length; i++) {
    var ent = entries[i];
    var full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, cb);
    else if (ent.name.endsWith('.html')) cb(full);
  }
}

var fixed = 0;
var files = 0;

walk(BLOG_DIR, function(filePath) {
  var html = fs.readFileSync(filePath, 'utf8');
  var changed = false;

  // Fix canonical href: https://lvjf.space/<path> → https://lvjf.space/blog/<path>
  // But not if it already has /blog/ prefix
  html = html.replace(
    /(canonical"\s*href="https:\/\/lvjf\.space\/)(?!blog\/)/g,
    function(m, p1) { changed = true; return p1 + 'blog/'; }
  );

  // Fix og:url content
  html = html.replace(
    /(og:url"\s*content="https:\/\/lvjf\.space\/)(?!blog\/)/g,
    function(m, p1) { changed = true; return p1 + 'blog/'; }
  );

  // Fix urlNoIndex or similar patterns
  html = html.replace(
    /(href="\/)(?!blog\/)(?!images\/)(?!css\/)(?!js\/)(?!opt-images\/)(?!pluginsSrc\/)(?!projects\/)(?!fonts\/)(creative|categories|tags|posts|archives|page|search|atom|sitemap)/g,
    function(m, p1, p2) { changed = true; return p1 + 'blog/' + p2; }
  );

  // Fix og:image content missing /blog/ prefix in non-blog pages
  html = html.replace(
    /(og:image"\s*content="https:\/\/lvjf\.space\/)(?!blog\/)(images\/)/g,
    function(m, p1, p2) { changed = true; return p1 + 'blog/' + p2; }
  );

  if (changed) {
    fs.writeFileSync(filePath, html, 'utf8');
    fixed++;
  }
  files++;
});

console.log('✓ Canonical fix: ' + fixed + ' / ' + files + ' files');

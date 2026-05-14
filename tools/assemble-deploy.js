/**
 * 组装部署目录结构:
 *   /           ← cosmic-intro (星球门禁页 + 纹理)
 *   /blog/      ← Hexo 博客
 *
 * 用法: node scripts/assemble-deploy.js
 * 前置: 需先运行 hexo generate
 * 输出: public-deploy/ 目录，可直接部署到服务器根路径
 */
var fs = require('fs');
var path = require('path');

var ROOT = path.join(__dirname, '..');
var PUBLIC = path.join(ROOT, 'public');
var DEPLOY = path.join(ROOT, 'public-deploy');
var IMAGES_SRC = path.join(ROOT, 'source', 'images', 'cosmic');

// 前置检查
var introSrc = path.join(PUBLIC, 'cosmic-intro', 'index.html');
if (!fs.existsSync(introSrc)) {
  console.error('FATAL: Intro page not found at ' + introSrc);
  console.error('Run "hexo generate" first.');
  process.exit(1);
}
if (!fs.existsSync(PUBLIC)) {
  console.error('FATAL: public/ directory not found. Run "hexo generate" first.');
  process.exit(1);
}

// 1. 清空并创建部署目录
try {
  if (fs.existsSync(DEPLOY)) fs.rmSync(DEPLOY, { recursive: true, force: true });
  fs.mkdirSync(DEPLOY, { recursive: true });
} catch (e) {
  console.error('FATAL: Failed to prepare deploy directory:', e.message);
  process.exit(1);
}

// 2. 复制 intro 页到部署根 → /index.html
var introDst = path.join(DEPLOY, 'index.html');
try {
  fs.copyFileSync(introSrc, introDst);
  console.log('✓ Intro page: public/cosmic-intro/index.html → public-deploy/index.html');
} catch (e) {
  console.error('FATAL: Failed to copy intro page:', e.message);
  process.exit(1);
}

// 3. 复制 3D 纹理
var texDst = path.join(DEPLOY, 'images', 'cosmic');
try {
  fs.mkdirSync(texDst, { recursive: true });
  if (fs.existsSync(IMAGES_SRC)) {
    var files = fs.readdirSync(IMAGES_SRC);
    files.forEach(function (f) {
      fs.copyFileSync(path.join(IMAGES_SRC, f), path.join(texDst, f));
    });
    console.log('✓ Textures: ' + files.length + ' files → public-deploy/images/cosmic/');
  } else {
    console.warn('⚠ Texture source not found: ' + IMAGES_SRC);
  }
} catch (e) {
  console.error('FATAL: Failed to copy textures:', e.message);
  process.exit(1);
}

// 4. 复制 Hexo public/ 到 /blog/（排除 cosmic-intro 目录）
var blogDst = path.join(DEPLOY, 'blog');
try {
  fs.mkdirSync(blogDst, { recursive: true });
  copyDir(PUBLIC, blogDst, ['cosmic-intro']);
  console.log('✓ Blog: public/ → public-deploy/blog/');
} catch (e) {
  console.error('FATAL: Failed to copy blog:', e.message);
  process.exit(1);
}

// 5. 验证关键文件
var critical = ['index.html', 'images/cosmic/earth-hd.jpg', 'blog/index.html'];
var missing = [];
critical.forEach(function (f) {
  if (!fs.existsSync(path.join(DEPLOY, f))) missing.push(f);
});
if (missing.length) {
  console.error('FATAL: Missing critical files in deploy output: ' + missing.join(', '));
  process.exit(1);
}

console.log('\n✓ Deploy assembled: public-deploy/');
console.log('  Deploy public-deploy/ to server root with force push.');

function copyDir(src, dst, exclude) {
  exclude = exclude || [];
  var entries = fs.readdirSync(src, { withFileTypes: true });
  for (var i = 0; i < entries.length; i++) {
    var ent = entries[i];
    if (exclude.indexOf(ent.name) !== -1) continue;
    var s = path.join(src, ent.name);
    var d = path.join(dst, ent.name);
    if (ent.isDirectory()) {
      fs.mkdirSync(d, { recursive: true });
      copyDir(s, d, exclude);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

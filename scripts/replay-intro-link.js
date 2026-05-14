/**
 * 在博客内容页面顶部注入"再看一次开场"小链接，指向星球 intro 门禁页。
 * 携带 ?replay=1 参数跳过 cookie 自动跳转，确保回访用户也能看到 intro。
 * root: /blog/ 下，需用绝对路径 / 避免被 hexo url_for 加前缀。
 */
hexo.extend.filter.register('after_render:html', function (str, data) {
  if (!data.path || !data.path.endsWith('.html')) return str;

  var skipPaths = ['404.html', 'categories/', 'tags/', 'archives/'];
  for (var i = 0; i < skipPaths.length; i++) {
    if (data.path === skipPaths[i] || data.path.indexOf(skipPaths[i]) === 0) return str;
  }

  var linkHref = '/?replay=1';
  var styleBlock = '<style>.replay-intro-link{color:rgba(180,200,240,0.22)!important;transition:color 0.35s}.replay-intro-link:hover{color:rgba(200,220,255,0.55)!important}</style>\n';
  var link = '\n<!-- replay-intro-link -->\n' +
    '<a class="replay-intro-link" href="' + linkHref + '"' +
    ' style="position:fixed;top:12px;left:16px;z-index:9999;' +
    'font-size:10px;letter-spacing:0.08em;text-decoration:none;' +
    'font-family:system-ui,\'Noto Serif SC\',serif">← 再看一次开场</a>\n';

  str = str.replace('</head>', styleBlock + '</head>');
  return str.replace('<body>', '<body>' + link);
});

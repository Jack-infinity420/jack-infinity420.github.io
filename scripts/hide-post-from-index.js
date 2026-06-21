/**
 * 隐藏首页推文脚本 v2
 * front-matter 中 hide: true 的文章不在首页显示，但保留在其他所有页面
 */
hexo.extend.filter.register('before_generate', function () {
  const originGenerate = hexo.extend.generator.get('index');
  hexo.extend.generator.register('index', function (locals) {
    // 过滤掉 hide: true 的文章
    const filtered = Object.create(locals);
    filtered.posts = locals.posts.filter(p => !p.hide);
    filtered.pages = locals.pages;
    // 更新 __post_hash 等缓存
    filtered.all_posts = filtered.posts;
    return originGenerate.call(this, filtered);
  });
});

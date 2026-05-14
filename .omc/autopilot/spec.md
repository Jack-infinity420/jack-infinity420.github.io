# Intro Gate — 星球门禁页独立化

## 目标
将 cosmic-intro（Three.js 3D 星球开场）从 Hexo 注入式改为独立门禁页，与博客完全分离。

## 路由
- `lvjf.space/index.html` → 星球 intro 门禁页
- `lvjf.space/blog/` → Hexo 博客（root: /blog/）

## 功能需求

### Intro 门禁页
- 保留现有 4 段文案：INFINITY → 知 → 行 → 始于知·成于行
- 保留 Three.js 3D 星球引擎（Earth/Moon/Mars 相机路径）
- 保留星空背景、大气散射、Bloom/Film 后处理
- 保留 IntersectionObserver 逐段浮现动画
- 保留侧边导航点
- 删除 blog-floor 区块
- 底部 >85% 滚动处 EXPLORE 按钮渐现，指向 /blog/
- 右下角 SKIP → 链接，>60% 滚动后渐隐
- Cookie 记忆：首次展示 banner（>50% 滚动时出现），已看过则下次自动跳 /blog/

### Hexo 博客
- `root: /blog/` 一行配置
- 删除 scripts/inject-cosmic-intro.js
- 博客顶部可选"再看一次开场"小链接 → /

### 资源
- 纹理路径 /images/cosmic/ 保持不变
- Three.js 从 unpkg CDN 加载保持不变

## 不变
- 所有 _posts 内容
- Butterfly 主题配置
- 天气系统 v6
- 欢迎模块 v1

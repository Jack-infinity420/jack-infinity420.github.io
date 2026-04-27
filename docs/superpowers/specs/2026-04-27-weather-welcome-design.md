# 博客天气欢迎系统 - 设计文档

## 概述

为 Hexo + Butterfly 博客添加基于 IP 地理定位的个性化欢迎功能：
- 获取访客所在地，展示省份城市 + 诗词 + 天气
- 天气粒子背景特效（tsParticles），可通过右下角按钮切换/关闭
- 根据浏览器时间自动切换日间/夜间外观
- 不遮挡首页封面图区域

## 架构

```
访客访问 → geo.js(IP定位) + weather.js(wttr.in) + poetry.js(今日诗词) + daynight.js(时间检测)
                    │                    │                   │                   │
                    ▼                    ▼                   ▼                   ▼
              localStorage缓存      localStorage缓存      无缓存           设置 body class
              30天过期              30分钟过期
                    │                    │                   │                   │
                    └────────────────────┴───────────────────┴───────────────────┘
                                         │
                                         ▼
                              统一渲染：侧边栏卡片 + tsParticles + 日夜外观
```

所有 API 调用并行发起，全部 resolve 后统一渲染。

## 组件

### 1. IP 地理定位 (`geo.js`)
- 接口：`https://ipapi.co/json/`（免费，1000次/天，个人博客够用）
- 缓存：localStorage，key `blog_location`，有效期 30 天
- 失败降级：静默跳过，天气卡片不显示

### 2. 天气数据 (`weather.js`)
- 接口：`https://wttr.in/${city}?format=j1`（免费，无需注册）
- 缓存：localStorage，key `blog_weather`，有效期 30 分钟
- 天气类型映射到 tsParticles 预设：
  - 晴/多云 → 金色光晕粒子
  - 雨/毛毛雨 → 雨滴下落
  - 雪 → 雪花飘落
  - 雾/霾 → 灰白雾气
  - 雷暴 → 闪电闪烁+雨滴
  - 阴 → 淡云飘动
  - 其他/失败 → 晴天默认

### 3. 诗词 (`poetry.js`)
- 接口：今日诗词 API，传城市参数
- 失败降级：使用预设诗句"海内存知己，天涯若比邻"

### 4. tsParticles 天气特效 (`weather-particles.js`)
- 引入 tsParticles 库（CDN：jsdelivr，~40KB gzipped）
- Canvas 层固定在 body 背景，`z-index: -1`
- 全局实例，通过 `window.weatherParticles` 暴露方法：
  - `setWeather(type)` — 切换天气类型
  - `disable()` — 关闭特效
  - `enable()` — 开启特效
- 低性能设备检测：`navigator.hardwareConcurrency < 4` 时降低粒子数量

### 5. 侧边栏天气卡片 (`weather-card.js`)
- 注入 Butterfly 侧边栏，位于作者卡片下方
- **桌面端**：标准右侧侧边栏卡片
- **手机端**（屏幕 < 900px）：侧边栏默认隐藏，天气卡片改为文章列表底部的简洁横条，不影响主阅读区
- 显示内容（居中排列）：
  - 海内存知己，天涯若比邻（固定诗句，始终显示）
  - {时间段}好，欢迎来自{省份}·{城市}的同志
    - 6:00-9:00 早上好 / 9:00-12:00 上午好 / 12:00-18:00 下午好 / 18:00-6:00 晚上好
  - 「{API诗句}」
  - —— {省份}·{城市}（标注地点，让读者知晓诗句与此地相关）
  - {天气图标} {天气类型} {温度}°C
  - 底部提示：💡 点击 ☁️ 切换天气
- 文案配置化：`source/_data/welcome.yml`

### 6. 天气控制面板 (`weather-panel.js`)
- 挂载到 Butterfly 右下角按钮组（rightside）
- ☁️ 图标按钮，点击弹出小面板
- 面板内容：当前天气信息、天气类型切换按钮（晴/雨/雪/多云）、开关 toggle
- **首次气泡提示**：☁️ 按钮旁显示"点我切换天气"气泡，localStorage 记录已展示，只显示一次
- 切换动画：面板从按钮位置弹出

### 7. 日夜间自动检测 (`daynight.js`)
- 读取浏览器时间（`new Date().getHours()`）
- 6:00-18:00 → 日间模式（light）
- 18:00-次日6:00 → 夜间模式（dark）
- 仅设置初始模式，手动切换后以手动为准（修改现有 darkmode 行为，将 `autoChangeMode` 改为基于时间）

### 8. 文案配置 (`source/_data/welcome.yml`)
- `fixed_poem`: "海内存知己，天涯若比邻"
- `greeting_template`: "{time_period}好，欢迎来自{province}·{city}的同志"
- `poem_fallback`: "海内存知己，天涯若比邻"
- `switch_hint`: "点击右下角 ☁️ 切换天气特效"
- `weather_labels`: 天气类型的中文映射

## 数据流

```
页面加载
  → 并行请求：IP定位 / 天气 / 诗词
  → 全部 resolve：
      → 渲染侧边栏卡片
      → 初始化 tsParticles（默认天气类型）
      → 设置 body 日/夜 class
      → 挂载控制面板按钮
      → 首次访问显示气泡提示
  → 用户切换天气：
      → weatherParticles.setWeather(type)
      → localStorage 存储用户偏好
```

## 文件清单

| 文件 | 说明 |
|------|------|
| `source/js/geo.js` | IP 定位 |
| `source/js/weather.js` | 天气数据获取 |
| `source/js/poetry.js` | 诗词获取 |
| `source/js/weather-particles.js` | tsParticles 初始化与控制 |
| `source/js/weather-card.js` | 侧边栏卡片渲染 |
| `source/js/weather-panel.js` | 控制面板 UI 与逻辑 |
| `source/js/daynight.js` | 日夜间自动检测 |
| `source/js/weather-init.js` | 主入口，编排所有模块 |
| `source/_data/welcome.yml` | 文案配置 |
| `source/css/weather.css` | 天气卡片和控制面板样式 |
| `_config.butterfly.yml` | 注入脚本和样式 |

## 天气特效类型对应 tsParticles 预设

| 天气 | 粒子效果 | 颜色 | 行为 |
|------|---------|------|------|
| 晴天 ☀️ | 小光点 | 金色/暖黄 | 缓慢上升飘动，半透明闪烁 |
| 多云 ⛅ | 大团软粒子 | 白色/浅灰 | 横向慢速漂移 |
| 雨天 🌧️ | 细长雨滴 | 淡蓝/半透明白 | 从上往下斜着落下 |
| 雪天 ❄️ | 雪花 | 白色 | 随机摇摆飘落 |
| 雾霾 🌫️ | 大团模糊粒子 | 灰白色 | 横向缓慢移动，低透明度 |
| 雷暴 ⛈️ | 雨滴+闪烁 | 淡蓝+白色闪烁 | 雨滴下落+偶尔全屏微闪 |

## 性能考虑

- 所有外部脚本异步加载，不阻塞页面渲染
- tsParticles CDN 使用 jsdelivr，国内访问走镜像
- 低性能设备（`hardwareConcurrency < 4`）：粒子数减半
- 用户关闭特效后：销毁 Canvas 实例，不消耗 GPU
- 手机端：粒子数减少 50%；移动端侧边栏默认隐藏，无额外渲染开销

## 不做的

- 不需要后端服务，纯前端实现
- 不需要用户注册/登录
- 不遮挡首页封面图和打字机副标题
- 不修改 Butterfly 主题源码，通过 inject 注入

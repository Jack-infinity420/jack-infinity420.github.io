/**
 * 诗词模块
 * 策略：IP 定位 → 匹配地区诗词 → 今日诗词 API → 本地随机库
 * 缓存: localStorage, key=blog_poem_cache, 有效期 1 小时
 */
(function () {
  'use strict';

  var TOKEN = 'M9QDy4EmekpDyvMhDgP7TkM5btZMPFbG';
  var CACHE_KEY = 'blog_poem_cache';
  var CACHE_TTL = 60 * 60 * 1000; // 1 小时

  // ===================== 地区诗词映射 =====================
  // 按城市/省份匹配，优先精确城市，再模糊省份
  var REGION_POEMS = {
    // 直辖市
    '北京': ['春风得意马蹄疾，一日看尽长安花', '居庸关上子规啼，饮马流泉落日低'],
    '上海': ['黄浦江头夜送客，枫叶荻花秋瑟瑟'],
    '天津': ['津门极望气蒙蒙，泛地浮天海势东'],
    '重庆': ['朝辞白帝彩云间，千里江陵一日还', '巴东三峡巫峡长，猿鸣三声泪沾裳'],

    // 省份
    '河北': ['东临碣石，以观沧海'],
    '山西': ['欲穷千里目，更上一层楼'],
    '辽宁': ['山一程，水一程，身向榆关那畔行'],
    '吉林': ['千山鸟飞绝，万径人踪灭'],
    '黑龙江': ['北国风光，千里冰封，万里雪飘'],
    '江苏': ['日出江花红胜火，春来江水绿如蓝', '姑苏城外寒山寺，夜半钟声到客船'],
    '浙江': ['欲把西湖比西子，淡妆浓抹总相宜', '毕竟西湖六月中，风光不与四时同'],
    '安徽': ['一生痴绝处，无梦到徽州', '相看两不厌，只有敬亭山'],
    '福建': ['武夷三十六雄峰，九曲清溪境不同'],
    '江西': ['落霞与孤鹜齐飞，秋水共长天一色', '飞流直下三千尺，疑是银河落九天'],
    '山东': ['会当凌绝顶，一览众山小', '海右此亭古，济南名士多'],
    '河南': ['洛阳亲友如相问，一片冰心在玉壶', '唯有牡丹真国色，花开时节动京城'],
    '湖北': ['昔人已乘黄鹤去，此地空余黄鹤楼', '孤帆远影碧空尽，唯见长江天际流'],
    '湖南': ['洞庭波涌连天雪，长岛人歌动地诗', '气蒸云梦泽，波撼岳阳城'],
    '广东': ['日啖荔枝三百颗，不辞长作岭南人', '罗浮山下四时春，卢橘杨梅次第新'],
    '海南': ['海内存知己，天涯若比邻'],
    '四川': ['晓看红湿处，花重锦官城', '窗含西岭千秋雪，门泊东吴万里船'],
    '贵州': ['天无三日晴，地无三里平'],
    '云南': ['春城无处不飞花'],
    '陕西': ['春风得意马蹄疾，一日看尽长安花', '长安一片月，万户捣衣声'],
    '甘肃': ['大漠孤烟直，长河落日圆', '羌笛何须怨杨柳，春风不度玉门关'],
    '青海': ['青海长云暗雪山，孤城遥望玉门关'],
    '台湾': ['日月潭中碧波荡，阿里山上云雾深'],
    '内蒙古': ['天苍苍，野茫茫，风吹草低见牛羊'],
    '广西': ['桂林山水甲天下', '江作青罗带，山如碧玉篸'],
    '西藏': ['世间安得双全法，不负如来不负卿'],
    '宁夏': ['大漠孤烟直，长河落日圆'],
    '新疆': ['大漠孤烟直，长河落日圆'],

    // 主要城市（精确匹配优先）
    '西安': ['春风得意马蹄疾，一日看尽长安花', '长安一片月，万户捣衣声'],
    '杭州': ['欲把西湖比西子，淡妆浓抹总相宜', '毕竟西湖六月中，风光不与四时同'],
    '苏州': ['姑苏城外寒山寺，夜半钟声到客船', '君到姑苏见，人家尽枕河'],
    '南京': ['朱雀桥边野草花，乌衣巷口夕阳斜', '烟笼寒水月笼沙，夜泊秦淮近酒家'],
    '扬州': ['二十四桥明月夜，玉人何处教吹箫'],
    '武汉': ['昔人已乘黄鹤去，此地空余黄鹤楼', '晴川历历汉阳树，芳草萋萋鹦鹉洲'],
    '长沙': ['独立寒秋，湘江北去，橘子洲头'],
    '成都': ['晓看红湿处，花重锦官城', '窗含西岭千秋雪，门泊东吴万里船'],
    '广州': ['日啖荔枝三百颗，不辞长作岭南人'],
    '深圳': ['海内存知己，天涯若比邻'],
    '拉萨': ['世间安得双全法，不负如来不负卿'],
    '昆明': ['春城无处不飞花', '天气常如二三月，花枝不断四时春'],
    '桂林': ['桂林山水甲天下', '江作青罗带，山如碧玉篸'],
    '厦门': ['鼓浪洞天，日光岩上'],
    '青岛': ['绿树红瓦，碧海蓝天'],
    '大连': ['棒棰岛外水连天'],
    '哈尔滨': ['北国风光，千里冰封，万里雪飘'],
    '沈阳': ['沈阳故宫，紫气东来'],
    '长春': ['伪满皇宫，净月潭深'],
    '郑州': ['郑州商城，黄河之滨'],
    '济南': ['海右此亭古，济南名士多', '四面荷花三面柳，一城山色半城湖'],
    '太原': ['欲穷千里目，更上一层楼'],
    '石家庄': ['燕赵大地，慷慨悲歌'],
    '南昌': ['落霞与孤鹜齐飞，秋水共长天一色'],
    '合肥': ['包公故里，科教之城'],
    '福州': ['武夷三十六雄峰，九曲清溪境不同'],
    '贵阳': ['天无三日晴，地无三里平'],
    '兰州': ['大漠孤烟直，长河落日圆'],
    '银川': ['大漠孤烟直，长河落日圆'],
    '乌鲁木齐': ['大漠孤烟直，长河落日圆'],
    '呼和浩特': ['天苍苍，野茫茫，风吹草低见牛羊'],
    '南宁': ['桂林山水甲天下，阳朔山水甲桂林'],
    '海口': ['海内存知己，天涯若比邻']
  };

  // 本地通用诗词库（当地区匹配失败且 API 失败时使用）
  var LOCAL_POEMS = [
    '海内存知己，天涯若比邻',
    '长风破浪会有时，直挂云帆济沧海',
    '采菊东篱下，悠然见南山',
    '山重水复疑无路，柳暗花明又一村',
    '落霞与孤鹜齐飞，秋水共长天一色',
    '会当凌绝顶，一览众山小',
    '大漠孤烟直，长河落日圆',
    '人生自古谁无死，留取丹心照汗青',
    '两情若是久长时，又岂在朝朝暮暮',
    '曾经沧海难为水，除却巫山不是云',
    '春风得意马蹄疾，一日看尽长安花',
    '接天莲叶无穷碧，映日荷花别样红',
    '但愿人长久，千里共婵娟',
    '不识庐山真面目，只缘身在此山中',
    '问君能有几多愁，恰似一江春水向东流',
    '天生我材必有用，千金散尽还复来',
    '众里寻他千百度，蓦然回首，那人却在，灯火阑珊处',
    '身无彩凤双飞翼，心有灵犀一点通',
    '月上柳梢头，人约黄昏后',
    '欲穷千里目，更上一层楼'
  ];

  function getRandomLocalPoem() {
    var idx = Math.floor(Math.random() * LOCAL_POEMS.length);
    return { content: LOCAL_POEMS[idx] };
  }

  function getRegionPoem(province, city) {
    var list;
    // 1. 精确匹配城市
    if (city) {
      list = REGION_POEMS[city];
      if (list) return list[Math.floor(Math.random() * list.length)];
      // 模糊匹配：城市名包含关键词
      for (var key in REGION_POEMS) {
        if (city.indexOf(key) !== -1 || key.indexOf(city) !== -1) {
          list = REGION_POEMS[key];
          if (list) return list[Math.floor(Math.random() * list.length)];
        }
      }
    }
    // 2. 匹配省份
    if (province) {
      list = REGION_POEMS[province];
      if (list) return list[Math.floor(Math.random() * list.length)];
      for (var key in REGION_POEMS) {
        if (province.indexOf(key) !== -1 || key.indexOf(province) !== -1) {
          list = REGION_POEMS[key];
          if (list) return list[Math.floor(Math.random() * list.length)];
        }
      }
    }
    return null;
  }

  // ===================== 缓存 =====================

  function getCachedPoem() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (Date.now() - data._ts > CACHE_TTL) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }
      return { content: data.content };
    } catch (e) {
      return null;
    }
  }

  function setCachedPoem(content) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ content: content, _ts: Date.now() }));
    } catch (e) {}
  }

  // ===================== API =====================

  async function fetchPoem() {
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

  // ===================== 主入口 =====================

  async function getPoem(city, province) {
    // 1. 先查缓存（1小时内不变，避免每次刷新都换）
    var cached = getCachedPoem();
    if (cached) return cached;

    // 2. 优先匹配地区诗词（核心诉求：显示当地相关诗词）
    var regionPoem = getRegionPoem(province, city);
    if (regionPoem) {
      setCachedPoem(regionPoem);
      return { content: regionPoem };
    }

    // 3. 尝试今日诗词 API
    try {
      var poem = await fetchPoem();
      setCachedPoem(poem.content);
      return poem;
    } catch (e) {
      console.warn('[BlogPoem] API 获取失败:', e.message);
    }

    // 4. 最终 fallback：本地随机
    var local = getRandomLocalPoem();
    setCachedPoem(local.content);
    return local;
  }

  window.BlogPoem = { getPoem: getPoem };
})();

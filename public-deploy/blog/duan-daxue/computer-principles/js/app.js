/* ============================================
   计算机原理学习工具 - 主应用逻辑
   ============================================ */

/* ============================================
   LaTeX 公式转换工具
   把纯文本公式转换为 KaTeX 可渲染的 LaTeX
   ============================================ */

const MathConverter = {
  // 把纯文本中的数学表达式转换为 $...$ 包裹的 LaTeX
  convert: function(text) {
    if (!text) return text;
    let result = text;
    
    // 1. 处理已有的人工 LaTeX 标记（不动）
    // 2. 处理上下标模式：2^m, 2^(m/2), 2^n-1, x^2, 10^3 等
    //    需要在非LaTeX区域操作，先保护已有的 $...$
    const placeholders = [];
    result = result.replace(/\$\$[\s\S]+?\$\$|\$[^$]+?\$/g, (m) => {
      placeholders.push(m);
      return `@@MATH${placeholders.length - 1}@@`;
    });
    
    // 转换常见公式模式
    result = this.convertPowers(result);
    result = this.convertSubscripts(result);
    result = this.convertFractions(result);
    result = this.convertSymbols(result);
    result = this.convertMod(result);
    result = this.convertFormulas(result);
    
    // 还原已有的 LaTeX
    placeholders.forEach((m, i) => {
      result = result.replace(`@@MATH${i}@@`, m);
    });
    
    return result;
  },
  
  // 转换幂运算：2^m → $2^m$, 2^(m/2) → $2^{m/2}$
  convertPowers: function(text) {
    // 匹配 数字^表达式，表达式可以是单字符或括号内内容
    // 例如：2^m, 2^10, 2^(m/2), 2^n-1, 10^3
    text = text.replace(/(\d+)\^(\([^)]+\)|[a-zA-Z0-9]+)/g, (match, base, exp) => {
      const latexExp = exp.startsWith('(') ? `{${exp.slice(1, -1)}}` : exp;
      return `$${base}^{${latexExp}}$`;
    });
    // 变量^表达式：x^2, n^2, T_流水 → 保持
    text = text.replace(/([a-zA-Z])\^(\([^)]+\)|[a-zA-Z0-9]+)/g, (match, base, exp) => {
      const latexExp = exp.startsWith('(') ? `{${exp.slice(1, -1)}}` : exp;
      return `$${base}^{${latexExp}}$`;
    });
    return text;
  },
  
  // 转换下标：TPmax, TP_流水, T_非流水
  convertSubscripts: function(text) {
    // T_流水 → $T_{\text{流水}}$
    text = text.replace(/([A-Za-z]+)_([A-Za-z\u4e00-\u9fa5]+)/g, (match, base, sub) => {
      return `$${base}_{${sub.match(/^[\u4e00-\u9fa5]/) ? `\\text{${sub}}` : sub}}$`;
    });
    return text;
  },
  
  // 转换分数：n/m → $\frac{n}{m}$
  convertFractions: function(text) {
    // 简单分数 a/b（不含空格，a和b是简单表达式）
    // 避免误转日期和路径，只在数学上下文中转
    return text;
  },
  
  // 转换特殊符号
  convertSymbols: function(text) {
    const symbolMap = {
      'Δt': '$\\Delta t$',
      'ΔT': '$\\Delta T$',
      '≥': '$\\geq$',
      '≤': '$\\leq$',
      '≠': '$\\neq$',
      '×': '$\\times$',
      '÷': '$\\div$',
      '→': '$\\to$',
      '∑': '$\\sum$',
      '∞': '$\\infty$',
      'α': '$\\alpha$',
      'β': '$\\beta$',
      'λ': '$\\lambda$',
      'μ': '$\\mu$',
    };
    for (const [sym, latex] of Object.entries(symbolMap)) {
      text = text.split(sym).join(latex);
    }
    return text;
  },
  
  // 转换 mod 运算：x mod y → $x \bmod y$
  convertMod: function(text) {
    text = text.replace(/(\w+)\s+mod\s+(\w+)/g, '$$$1 \\bmod $2$$');
    return text;
  },
  
  // 转换已知公式模式
  convertFormulas: function(text) {
    // [x]补 = 2^n + x → $[x]_补 = 2^n + x$
    text = text.replace(/\[x\]补/g, '$[x]_{\\text{补}}$');
    text = text.replace(/\[x\]原/g, '$[x]_{\\text{原}}$');
    text = text.replace(/\[x\]反/g, '$[x]_{\\text{反}}$');
    text = text.replace(/\[x\]移/g, '$[x]_{\\text{移}}$');
    
    // T_流水 = (m+n-1)×Δt → 已被上面处理
    
    // S = n×m / (m+n-1) 等公式
    text = text.replace(/S\s*=\s*(\d+)×(\d+)\s*\/\s*\(([^)]+)\)/g, 
      '$S = \\frac{$1 \\times $2}{($3)}$');
    
    // TP = n / (...) 
    text = text.replace(/TP\s*=\s*(\w+)\s*\/\s*\(([^)]+)\)/g, 
      '$TP = \\frac{$1}{$2}$');
    
    // E = S/m
    text = text.replace(/E\s*=\s*S\/m/g, '$E = \\frac{S}{m}$');
    
    // 命中率 H, 缺失率
    text = text.replace(/命中率\s*[=:]\s*(\d+(?:\.\d+)?)/g, '命中率 = $1');
    
    return text;
  },
  
  // 渲染容器中的所有LaTeX公式
  render: function(element) {
    if (typeof renderMathInElement === 'function' && element) {
      try {
        renderMathInElement(element, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
          ],
          throwOnError: false,
          errorColor: '#ef4444',
        });
      } catch (e) {
        console.warn('KaTeX渲染失败:', e);
      }
    }
  },
};

// 全局数据
const App = {
  chapters: [],        // 所有章节数据
  allKP: [],           // 所有知识点（扁平化）
  allFlashcards: [],   // 所有闪卡
  allQuestions: [],    // 所有题目
  currentView: 'map',
  
  // 学习状态
  currentChapter: 1,
  currentKPIndex: 0,
  flashcardIndex: 0,
  flashcardFilter: 'all',
  flashcardFlipped: false,
  quizFilter: 'all',
  quizIndex: 0,
  quizSelected: null,
  quizAnswered: false,
  quizScore: 0,
  quizTotal: 0,
  
  // 进度数据（从localStorage加载）
  progress: {},
  flashcardStatus: {},
  wrongQuestions: [],
};

/* ============================================
   初始化
   ============================================ */

App.init = async function() {
  try {
    // 加载数据
    await this.loadData();
    
    // 加载进度
    this.loadProgress();
    
    // 渲染各视图
    this.renderMap();
    this.renderLearnSidebar();
    this.renderFlashcardFilters();
    this.renderQuizFilters();
    
    // 初始化默认视图
    this.switchView('map');
  } catch (e) {
    console.error('初始化失败:', e);
  }
};

App.loadData = async function() {
  const chapterFiles = [
    { file: 'data/chapter1.json', num: 1, title: '计算机系统结构组成', summary: '系统定义、存储程序原理、五大部件、性能指标', sections: [] },
    { file: 'data/chapter2.json', num: 2, title: '指令系统', summary: '指令系统概述、数据表示、寻址技术、指令格式、CISC与RISC', sections: [] },
    { file: 'data/chapter3.json', num: 3, title: '微处理器系统结构', summary: 'Y86指令集、逻辑设计与HCL、顺序实现SEQ、流水线技术', sections: [] },
    { file: 'data/chapter4.json', num: 4, title: '存储系统', summary: '存储器概述、半导体存储器、Cache、虚拟存储器、并行存储', sections: [] },
    { file: 'data/chapter5.json', num: 5, title: '输入输出系统', summary: 'I/O概述、I/O接口、四种I/O控制方式', sections: [] },
  ];
  
  for (const cf of chapterFiles) {
    try {
      const resp = await fetch(cf.file);
      const rawData = await resp.json();
      
      // 兼容两种JSON格式：{chapter, knowledgePoints} 或 纯数组
      let chapterInfo, knowledgePoints;
      if (Array.isArray(rawData)) {
        // 纯数组格式（第3、4章）
        chapterInfo = { number: cf.num, title: cf.title, summary: cf.summary, sections: [] };
        knowledgePoints = rawData;
      } else {
        // 标准格式（第1、2、5章）
        chapterInfo = rawData.chapter;
        knowledgePoints = rawData.knowledgePoints || [];
      }
      
      // 从知识点中提取小节信息
      const sectionSet = new Set();
      knowledgePoints.forEach(kp => {
        const secMatch = kp.section && kp.section.match(/^(\d+\.\d+)/);
        if (secMatch) {
          const secId = secMatch[1];
          if (!sectionSet.has(secId)) {
            sectionSet.add(secId);
            chapterInfo.sections.push({ id: secId, title: kp.section.replace(/^\d+\.\d+\s*/, '') });
          }
        }
      });
      
      this.chapters.push({ chapter: chapterInfo, knowledgePoints: knowledgePoints });
      
      // 扁平化知识点
      knowledgePoints.forEach(kp => {
        kp.chapterNum = chapterInfo.number;
        this.allKP.push(kp);
        
        // 收集闪卡
        if (kp.flashcard) {
          this.allFlashcards.push({
            ...kp.flashcard,
            kpId: kp.id,
            chapter: chapterInfo.number,
            section: kp.section,
          });
        }
        
        // 收集题目
        if (kp.examples) {
          kp.examples.forEach((ex, idx) => {
            this.allQuestions.push({
              ...ex,
              kpId: kp.id,
              chapter: chapterInfo.number,
              section: kp.section,
              qIndex: idx,
            });
          });
        }
      });
    } catch (e) {
      console.error(`加载 ${cf.file} 失败:`, e);
    }
  }
};

/* ============================================
   localStorage 进度管理
   ============================================ */

App.loadProgress = function() {
  try {
    this.progress = JSON.parse(localStorage.getItem('co_progress') || '{}');
    this.flashcardStatus = JSON.parse(localStorage.getItem('co_flashcard') || '{}');
    this.wrongQuestions = JSON.parse(localStorage.getItem('co_wrong') || '[]');
  } catch (e) {
    this.progress = {};
    this.flashcardStatus = {};
    this.wrongQuestions = [];
  }
};

App.saveProgress = function() {
  localStorage.setItem('co_progress', JSON.stringify(this.progress));
  localStorage.setItem('co_flashcard', JSON.stringify(this.flashcardStatus));
  localStorage.setItem('co_wrong', JSON.stringify(this.wrongQuestions));
};

App.getKPStatus = function(kpId) {
  return this.progress[kpId] || 'unlearned';
};

App.setKPStatus = function(kpId, status) {
  this.progress[kpId] = status;
  this.saveProgress();
};

/* ============================================
   视图切换
   ============================================ */

App.switchView = function(viewName) {
  this.currentView = viewName;
  
  // 隐藏所有视图
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  
  // 显示目标视图
  const target = document.getElementById('view-' + viewName);
  if (target) target.classList.add('active');
  
  // 更新导航
  document.querySelectorAll('.navbar-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.view === viewName);
  });
  
  // 渲染对应视图
  switch (viewName) {
    case 'map':
      this.renderMap();
      break;
    case 'learn':
      if (this.allKP.length > 0) {
        this.renderLearnContent();
      }
      break;
    case 'flashcard':
      this.renderFlashcard();
      break;
    case 'quiz':
      this.renderQuiz();
      break;
  }
  
  window.scrollTo(0, 0);
};

/* ============================================
   知识图谱视图
   ============================================ */

App.renderMap = function() {
  this.renderProgressOverview();
  this.renderChapterGrid();
};

App.renderProgressOverview = function() {
  const container = document.getElementById('progress-overview');
  const total = this.allKP.length;
  const learned = Object.values(this.progress).filter(s => s !== 'unlearned').length;
  const mastered = Object.values(this.progress).filter(s => s === 'mastered').length;
  const knownCards = Object.values(this.flashcardStatus).filter(s => s === 'known').length;
  const totalCards = this.allFlashcards.length;
  
  container.innerHTML = `
    <div class="progress-card">
      <div class="stat">${learned}/${total}</div>
      <div class="label">已学知识点</div>
      <div class="bar"><div class="bar-fill" style="width:${total ? learned/total*100 : 0}%"></div></div>
    </div>
    <div class="progress-card">
      <div class="stat">${mastered}/${total}</div>
      <div class="label">已掌握</div>
      <div class="bar"><div class="bar-fill" style="width:${total ? mastered/total*100 : 0}%; background:linear-gradient(90deg,#22c55e,#4ade80)"></div></div>
    </div>
    <div class="progress-card">
      <div class="stat">${knownCards}/${totalCards}</div>
      <div class="label">闪卡已会</div>
      <div class="bar"><div class="bar-fill" style="width:${totalCards ? knownCards/totalCards*100 : 0}%; background:linear-gradient(90deg,#f59e0b,#fbbf24)"></div></div>
    </div>
    <div class="progress-card">
      <div class="stat">${this.wrongQuestions.length}</div>
      <div class="label">错题待复习</div>
      <div class="bar"><div class="bar-fill" style="width:${this.wrongQuestions.length ? 100 : 0}%; background:linear-gradient(90deg,#ef4444,#f87171)"></div></div>
    </div>
  `;
};

App.renderChapterGrid = function() {
  const container = document.getElementById('chapter-grid');
  const difficultyMap = {
    1: { label: '入门', class: 'badge-easy' },
    2: { label: '基础', class: 'badge-easy' },
    3: { label: '中等', class: 'badge-medium' },
    4: { label: '较难', class: 'badge-medium' },
    5: { label: '困难', class: 'badge-hard' },
  };
  
  // 计算每章平均难度
  const chapterStats = {};
  this.chapters.forEach(ch => {
    const kps = ch.knowledgePoints;
    const avgDiff = kps.reduce((s, k) => s + (k.difficulty || 3), 0) / kps.length;
    const learned = kps.filter(k => this.progress[k.id] && this.progress[k.id] !== 'unlearned').length;
    const mastered = kps.filter(k => this.progress[k.id] === 'mastered').length;
    const highFreq = kps.filter(k => k.examFrequency === 'high').length;
    chapterStats[ch.chapter.number] = { avgDiff, learned, mastered, highFreq, total: kps.length };
  });
  
  container.innerHTML = this.chapters.map(ch => {
    const stat = chapterStats[ch.chapter.number];
    const diffLabel = stat.avgDiff >= 4 ? { label: '困难', class: 'badge-hard' } :
                      stat.avgDiff >= 3 ? { label: '中等', class: 'badge-medium' } :
                      { label: '基础', class: 'badge-easy' };
    const progressPct = stat.total ? stat.learned / stat.total * 100 : 0;
    
    return `
      <div class="chapter-card" onclick="App.openChapter(${ch.chapter.number})">
        <div class="chapter-num">第${ch.chapter.number}章</div>
        <div class="chapter-title">${ch.chapter.title}</div>
        <div class="chapter-desc">${ch.chapter.summary.substring(0, 80)}...</div>
        <div class="chapter-meta">
          <span>📚 ${stat.total} 个知识点</span>
          <span>🔥 ${stat.highFreq} 个高频</span>
          <span>✅ ${stat.learned} 已学</span>
        </div>
        <div class="bar" style="margin-top:12px"><div class="bar-fill" style="width:${progressPct}%"></div></div>
        <div class="difficulty-badge ${diffLabel.class}">难度：${diffLabel.label}</div>
      </div>
    `;
  }).join('');
};

App.openChapter = function(chapterNum) {
  this.currentChapter = chapterNum;
  this.currentKPIndex = 0;
  // 找到该章第一个知识点的索引
  const firstIdx = this.allKP.findIndex(kp => kp.chapterNum === chapterNum);
  if (firstIdx >= 0) this.currentKPIndex = firstIdx;
  this.switchView('learn');
};

/* ============================================
   知识点学习视图
   ============================================ */

App.renderLearnSidebar = function() {
  const container = document.getElementById('learn-sidebar');
  let html = '<h3>知识目录</h3>';
  
  this.chapters.forEach(ch => {
    html += `<div class="sidebar-section">`;
    html += `<div class="sidebar-section-title">第${ch.chapter.number}章 ${ch.chapter.title}</div>`;
    
    ch.knowledgePoints.forEach((kp, idx) => {
      const globalIdx = this.allKP.findIndex(k => k.id === kp.id);
      const status = this.getKPStatus(kp.id);
      const dotClass = status === 'mastered' ? 'status-mastered' :
                       status === 'learning' ? 'status-learning' :
                       'status-unlearned';
      html += `
        <button class="sidebar-item" onclick="App.goToKP(${globalIdx})">
          <span class="status-dot ${dotClass}"></span>
          <span>${kp.id} ${kp.title}</span>
        </button>
      `;
    });
    
    html += `</div>`;
  });
  
  container.innerHTML = html;
};

App.goToKP = function(index) {
  this.currentKPIndex = index;
  this.renderLearnContent();
  this.updateSidebarActive();
  document.getElementById('learn-content').scrollTop = 0;
};

App.updateSidebarActive = function() {
  const items = document.querySelectorAll('.sidebar-item');
  items.forEach((item, idx) => {
    item.classList.remove('active');
  });
  // 简单匹配：找到当前知识点对应的按钮
  const kp = this.allKP[this.currentKPIndex];
  if (kp) {
    items.forEach(item => {
      if (item.textContent.includes(kp.id)) {
        item.classList.add('active');
      }
    });
  }
};

App.renderLearnContent = function() {
  const container = document.getElementById('learn-content');
  const kp = this.allKP[this.currentKPIndex];
  
  if (!kp) {
    container.innerHTML = '<div class="empty-state"><div class="icon">📖</div><p>暂无知识点数据</p></div>';
    return;
  }
  
  const status = this.getKPStatus(kp.id);
  const freqMap = { high: { label: '高频考点', class: 'badge-hard' }, medium: { label: '中频', class: 'badge-medium' }, low: { label: '低频', class: 'badge-easy' } };
  const freq = freqMap[kp.examFrequency] || freqMap.medium;
  const diffLabels = ['', '入门', '基础', '中等', '较难', '困难'];
  
  // 判断是否有上一个/下一个
  const hasPrev = this.currentKPIndex > 0;
  const hasNext = this.currentKPIndex < this.allKP.length - 1;
  
  let html = `
    <div class="kp-header">
      <div class="kp-breadcrumb">第${kp.chapterNum}章 · ${kp.section}</div>
      <div class="kp-title">${kp.title}</div>
      <div class="kp-badges">
        <span class="kp-badge ${freq.class}">${freq.label}</span>
        <span class="kp-badge badge-medium">难度 ${diffLabels[kp.difficulty]}</span>
        <span class="kp-badge" style="background:var(--bg-tertiary);color:var(--text-muted)">${kp.id}</span>
      </div>
      <div class="status-buttons">
        <button class="status-btn btn-learning ${status === 'learning' ? 'active' : ''}" onclick="App.markStatus('learning')">学习中</button>
        <button class="status-btn btn-mastered ${status === 'mastered' ? 'active' : ''}" onclick="App.markStatus('mastered')">已掌握</button>
        <button class="status-btn" onclick="App.markStatus('unlearned')">重置</button>
      </div>
    </div>
  `;
  
  // 概念定义
  html += `
    <div class="kp-section">
      <div class="kp-section-title">📌 概念定义</div>
      <div class="kp-section-content"><p>${MathConverter.convert(kp.definition)}</p></div>
    </div>
  `;
  
  // 原理讲解
  if (kp.principle) {
    html += `
      <div class="kp-section">
        <div class="kp-section-title">💡 原理讲解</div>
        <div class="kp-section-content"><p>${MathConverter.convert(kp.principle)}</p></div>
      </div>
    `;
  }
  
  // 图示说明
  if (kp.diagram) {
    html += `
      <div class="kp-section">
        <div class="kp-section-title">🎨 图示说明</div>
        <div class="kp-section-content" style="padding:16px;background:var(--bg-secondary);border-radius:var(--radius-sm);border:1px solid var(--border)">
          <p style="color:var(--text-muted)">📐 ${MathConverter.convert(kp.diagram)}</p>
        </div>
      </div>
    `;
  }
  
  // 重点标注
  if (kp.keyPoints && kp.keyPoints.length > 0) {
    html += `
      <div class="kp-section">
        <div class="kp-section-title">⭐ 重点标注</div>
        <ul class="key-points-list">
          ${kp.keyPoints.map(p => `<li>${MathConverter.convert(p)}</li>`).join('')}
        </ul>
      </div>
    `;
  }
  
  // 易错点
  if (kp.commonMistakes && kp.commonMistakes.length > 0) {
    html += `
      <div class="kp-section">
        <div class="kp-section-title">⚠️ 易错点提醒</div>
        <ul class="mistakes-list">
          ${kp.commonMistakes.map(m => `<li>${MathConverter.convert(m)}</li>`).join('')}
        </ul>
      </div>
    `;
  }
  
  // 典型例题
  if (kp.examples && kp.examples.length > 0) {
    html += `
      <div class="kp-section">
        <div class="kp-section-title">📝 典型例题</div>
        ${kp.examples.map(ex => `
          <div class="example-card">
            <div class="question">${MathConverter.convert(ex.question)}</div>
            <div class="answer">答案：${MathConverter.convert(ex.answer)}</div>
            <div class="explanation">解析：${MathConverter.convert(ex.explanation)}</div>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  // 参考链接
  if (kp.references && kp.references.length > 0) {
    html += `
      <div class="kp-section">
        <div class="kp-section-title">🔗 参考链接</div>
        <ul class="references-list">
          ${kp.references.map(ref => {
            const typeClass = ref.type === 'courseware' ? 'ref-courseware' :
                              ref.type === 'book' ? 'ref-book' : 'ref-web';
            const typeLabel = ref.type === 'courseware' ? '课件' :
                              ref.type === 'book' ? '书籍' : '网络';
            return `<li><span class="ref-type ${typeClass}">${typeLabel}</span><span><strong>${ref.title}</strong> — ${ref.location}</span></li>`;
          }).join('')}
        </ul>
      </div>
    `;
  }
  
  // 闪卡预览
  if (kp.flashcard) {
    html += `
      <div class="kp-section">
        <div class="kp-section-title">🎴 快速复习</div>
        <div class="example-card" style="cursor:pointer" onclick="App.switchView('flashcard')">
          <div class="question" style="color:var(--accent)">📌 ${kp.flashcard.front}</div>
          <div class="explanation">点击查看答案 →</div>
        </div>
      </div>
    `;
  }
  
  // 导航按钮
  html += `
    <div class="kp-nav">
      <button class="kp-nav-btn" ${!hasPrev ? 'disabled' : ''} onclick="App.prevKP()">← 上一个</button>
      <span style="color:var(--text-muted);font-size:0.85rem;align-self:center">${this.currentKPIndex + 1} / ${this.allKP.length}</span>
      <button class="kp-nav-btn" ${!hasNext ? 'disabled' : ''} onclick="App.nextKP()">下一个 →</button>
    </div>
  `;
  
  container.innerHTML = html;
  MathConverter.render(container);
  this.updateSidebarActive();
};

App.markStatus = function(status) {
  const kp = this.allKP[this.currentKPIndex];
  if (kp) {
    this.setKPStatus(kp.id, status);
    this.renderLearnContent();
    this.renderLearnSidebar();
  }
};

App.prevKP = function() {
  if (this.currentKPIndex > 0) {
    this.currentKPIndex--;
    this.renderLearnContent();
    document.getElementById('learn-content').scrollTop = 0;
  }
};

App.nextKP = function() {
  if (this.currentKPIndex < this.allKP.length - 1) {
    this.currentKPIndex++;
    this.renderLearnContent();
    document.getElementById('learn-content').scrollTop = 0;
  }
};

/* ============================================
   闪卡视图
   ============================================ */

App.renderFlashcardFilters = function() {
  const container = document.getElementById('flashcard-filters');
  const filters = [
    { value: 'all', label: '全部' },
    { value: '1', label: '第1章' },
    { value: '2', label: '第2章' },
    { value: '3', label: '第3章' },
    { value: '4', label: '第4章' },
    { value: '5', label: '第5章' },
    { value: 'unknown', label: '未掌握' },
  ];
  
  container.innerHTML = filters.map(f => 
    `<button class="filter-chip ${f.value === 'all' ? 'active' : ''}" data-value="${f.value}" onclick="App.setFlashcardFilter('${f.value}')">${f.label}</button>`
  ).join('');
};

App.setFlashcardFilter = function(filter) {
  this.flashcardFilter = filter;
  this.flashcardIndex = 0;
  this.flashcardFlipped = false;
  
  document.querySelectorAll('#flashcard-filters .filter-chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.value === filter);
  });
  
  this.renderFlashcard();
};

App.getFilteredFlashcards = function() {
  if (this.flashcardFilter === 'all') return this.allFlashcards;
  if (this.flashcardFilter === 'unknown') {
    return this.allFlashcards.filter(c => this.flashcardStatus[c.kpId] !== 'known');
  }
  return this.allFlashcards.filter(c => c.chapter === parseInt(this.flashcardFilter));
};

App.renderFlashcard = function() {
  const area = document.getElementById('flashcard-area');
  const controls = document.getElementById('flashcard-controls');
  const progress = document.getElementById('flashcard-progress');
  
  const cards = this.getFilteredFlashcards();
  
  if (cards.length === 0) {
    area.innerHTML = '<div class="empty-state"><div class="icon">🎴</div><p>没有符合条件的闪卡</p></div>';
    controls.innerHTML = '';
    progress.innerHTML = '';
    return;
  }
  
  if (this.flashcardIndex >= cards.length) this.flashcardIndex = 0;
  
  const card = cards[this.flashcardIndex];
  const isKnown = this.flashcardStatus[card.kpId] === 'known';
  
  area.innerHTML = `
    <div class="flashcard ${this.flashcardFlipped ? 'flipped' : ''}" onclick="App.flipFlashcard()">
      <div class="flashcard-face flashcard-front">
        <div class="flashcard-label">问题 · 第${card.chapter}章</div>
        <div class="flashcard-content">${card.front}</div>
        <div class="flashcard-hint">点击翻面查看答案</div>
      </div>
      <div class="flashcard-face flashcard-back">
        <div class="flashcard-label">答案</div>
        <div class="flashcard-content">${card.back}</div>
        <div class="flashcard-hint">点击翻回</div>
      </div>
    </div>
  `;
  
  controls.innerHTML = `
    <button class="fc-btn fc-btn-unknown ${isKnown === false && this.flashcardStatus[card.kpId] ? 'active' : ''}" onclick="App.markFlashcard('unknown')">❌ 不会</button>
    <button class="fc-btn fc-btn-flip" onclick="App.flipFlashcard()">🔄 翻面</button>
    <button class="fc-btn fc-btn-known ${isKnown ? 'active' : ''}" onclick="App.markFlashcard('known')">✅ 会了</button>
  `;
  
  const knownCount = cards.filter(c => this.flashcardStatus[c.kpId] === 'known').length;
  progress.innerHTML = `${this.flashcardIndex + 1} / ${cards.length} · 已会 ${knownCount} / ${cards.length}`;
};

App.flipFlashcard = function() {
  this.flashcardFlipped = !this.flashcardFlipped;
  const card = document.querySelector('.flashcard');
  if (card) card.classList.toggle('flipped');
};

App.markFlashcard = function(status) {
  const cards = this.getFilteredFlashcards();
  const card = cards[this.flashcardIndex];
  if (card) {
    this.flashcardStatus[card.kpId] = status;
    this.saveProgress();
    // 自动翻回正面
    this.flashcardFlipped = false;
    // 延迟跳到下一张
    setTimeout(() => {
      if (this.flashcardIndex < cards.length - 1) {
        this.flashcardIndex++;
      } else {
        this.flashcardIndex = 0;
      }
      this.renderFlashcard();
    }, 300);
  }
};

/* ============================================
   刷题视图
   ============================================ */

App.renderQuizFilters = function() {
  const container = document.getElementById('quiz-filters');
  const filters = [
    { value: 'all', label: '全部题库' },
    { value: '1', label: '第1章' },
    { value: '2', label: '第2章' },
    { value: '3', label: '第3章' },
    { value: '4', label: '第4章' },
    { value: '5', label: '第5章' },
    { value: 'wrong', label: '错题本' },
  ];
  
  container.innerHTML = filters.map(f => 
    `<button class="filter-chip ${f.value === 'all' ? 'active' : ''}" data-value="${f.value}" onclick="App.setQuizFilter('${f.value}')">${f.label}</button>`
  ).join('');
};

App.setQuizFilter = function(filter) {
  this.quizFilter = filter;
  this.quizIndex = 0;
  this.quizSelected = null;
  this.quizAnswered = false;
  this.quizScore = 0;
  this.quizTotal = 0;
  
  document.querySelectorAll('#quiz-filters .filter-chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.value === filter);
  });
  
  this.renderQuiz();
};

App.getFilteredQuestions = function() {
  if (this.quizFilter === 'all') return this.allQuestions;
  if (this.quizFilter === 'wrong') {
    return this.wrongQuestions.map(wq => this.allQuestions.find(q => q.kpId === wq.kpId && q.qIndex === wq.qIndex)).filter(Boolean);
  }
  return this.allQuestions.filter(q => q.chapter === parseInt(this.quizFilter));
};

App.renderQuiz = function() {
  const container = document.getElementById('quiz-content');
  const questions = this.getFilteredQuestions();
  
  if (questions.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="icon">✏️</div><p>没有符合条件的题目</p></div>';
    return;
  }
  
  if (this.quizIndex >= questions.length) {
    // 显示结果
    container.innerHTML = `
      <div class="quiz-result">
        <div class="quiz-result-score">${this.quizScore} / ${this.quizTotal}</div>
        <div class="quiz-result-label">正确率：${this.quizTotal ? Math.round(this.quizScore / this.quizTotal * 100) : 0}%</div>
        <button class="quiz-btn" onclick="App.restartQuiz()">重新开始</button>
      </div>
    `;
    return;
  }
  
  const q = questions[this.quizIndex];
  
  // 解析选项
  let options = [];
  let questionText = q.question;
  
  // 尝试从题目中提取选项
  const optionMatch = q.question.match(/A[.．、]\s*(.+?)(?=\n|$)/);
  if (optionMatch) {
    // 题目中包含选项，分离出来
    const lines = q.question.split('\n');
    questionText = lines[0];
    const optPattern = /^([A-E])[.．、]\s*(.+)$/;
    lines.slice(1).forEach(line => {
      const m = line.trim().match(optPattern);
      if (m) options.push({ letter: m[1], text: m[2] });
    });
  }
  
  // 如果没有提取到选项，显示为问答题
  if (options.length === 0) {
    container.innerHTML = `
      <div class="quiz-card">
        <div class="quiz-question">${q.question}</div>
        <div class="quiz-options">
          <button class="quiz-option ${this.quizAnswered ? 'correct' : ''}" onclick="App.showAnswer()">
            <span class="quiz-option-letter">?</span>
            <span>查看答案</span>
          </button>
        </div>
        <div class="quiz-explanation ${this.quizAnswered ? 'show' : ''}">
          <h4>答案</h4>
          <p>${q.answer}</p>
          <h4 style="margin-top:12px">解析</h4>
          <p>${q.explanation}</p>
        </div>
        <div class="quiz-controls">
          <span style="color:var(--text-muted);font-size:0.85rem">${this.quizIndex + 1} / ${questions.length}</span>
          <button class="quiz-btn" ${!this.quizAnswered ? 'disabled' : ''} onclick="App.nextQuestion()">${this.quizIndex < questions.length - 1 ? '下一题 →' : '完成'}</button>
        </div>
      </div>
    `;
    return;
  }
  
  // 选择题
  container.innerHTML = `
    <div class="quiz-card">
      <div class="quiz-question">${questionText}</div>
      <div class="quiz-options">
        ${options.map(opt => {
          let cls = '';
          if (this.quizAnswered) {
            if (opt.letter === q.answer) cls = 'correct';
            else if (opt.letter === this.quizSelected) cls = 'wrong';
          } else if (opt.letter === this.quizSelected) {
            cls = 'selected';
          }
          return `
            <button class="quiz-option ${cls}" onclick="App.selectOption('${opt.letter}')" ${this.quizAnswered ? 'disabled' : ''}>
              <span class="quiz-option-letter">${opt.letter}</span>
              <span>${opt.text}</span>
            </button>
          `;
        }).join('')}
      </div>
      <div class="quiz-explanation ${this.quizAnswered ? 'show' : ''}">
        <h4>正确答案：${q.answer}</h4>
        <p>${q.explanation}</p>
      </div>
      <div class="quiz-controls">
        <span style="color:var(--text-muted);font-size:0.85rem">${this.quizIndex + 1} / ${questions.length} · 得分 ${this.quizScore}</span>
        <button class="quiz-btn" ${!this.quizAnswered ? 'disabled' : ''} onclick="App.nextQuestion()">${this.quizIndex < questions.length - 1 ? '下一题 →' : '查看结果'}</button>
      </div>
    </div>
  `;
};

App.selectOption = function(letter) {
  if (this.quizAnswered) return;
  this.quizSelected = letter;
  this.quizAnswered = true;
  this.quizTotal++;
  
  const q = this.getFilteredQuestions()[this.quizIndex];
  if (letter === q.answer) {
    this.quizScore++;
  } else {
    // 加入错题本
    if (!this.wrongQuestions.some(wq => wq.kpId === q.kpId && wq.qIndex === q.qIndex)) {
      this.wrongQuestions.push({ kpId: q.kpId, qIndex: q.qIndex });
      this.saveProgress();
    }
  }
  this.renderQuiz();
};

App.showAnswer = function() {
  this.quizAnswered = true;
  this.quizTotal++;
  this.quizScore++; // 问答题查看答案算对
  this.renderQuiz();
};

App.nextQuestion = function() {
  this.quizIndex++;
  this.quizSelected = null;
  this.quizAnswered = false;
  this.renderQuiz();
};

App.restartQuiz = function() {
  this.quizIndex = 0;
  this.quizSelected = null;
  this.quizAnswered = false;
  this.quizScore = 0;
  this.quizTotal = 0;
  this.renderQuiz();
};

/* ============================================
   启动
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
  App.init();
});

// 键盘快捷键
document.addEventListener('keydown', function(e) {
  if (App.currentView === 'learn') {
    if (e.key === 'ArrowLeft') App.prevKP();
    if (e.key === 'ArrowRight') App.nextKP();
  }
  if (App.currentView === 'flashcard') {
    if (e.key === ' ') { e.preventDefault(); App.flipFlashcard(); }
    if (e.key === 'ArrowLeft') App.markFlashcard('unknown');
    if (e.key === 'ArrowRight') App.markFlashcard('known');
  }
  if (App.currentView === 'quiz') {
    if (e.key === 'Enter' && App.quizAnswered) App.nextQuestion();
  }
});

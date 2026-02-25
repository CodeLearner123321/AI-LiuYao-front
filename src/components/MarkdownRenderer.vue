<script setup>
import { computed } from 'vue';
import { marked } from 'marked';

// 接收 props
const props = defineProps({
  // Markdown 文本内容
  content: {
    type: String,
    default: ''
  },
  // 行高
  lineHeight: {
    type: [Number, String],
    default: 1.5 // 舒适可读的行高
  },
  // 字体颜色
  color: {
    type: String,
    default: '#d3b05b' // 古铜金色，最终定稿
  },
  // 字体族
  fontFamily: {
    type: String,
    default: "'STKaiti', 'KaiTi', 'Noto Serif SC', 'SimSun', 'FangSong', serif"
  }
});

// 配置 marked 选项（使用默认渲染器）
marked.setOptions({
  breaks: false,
  gfm: true,
  headerIds: false,
  mangle: false
});

// 解析 Markdown 内容
const parsedHtml = computed(() => {
  if (!props.content) {
    return '';
  }
  
  try {
    // 预处理：移除多余空行
    const cleanedContent = props.content
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    // 使用 marked() 函数（而非 marked.parse），确保同步返回
    let html = marked(cleanedContent, { async: false });
    
    // 类型检查
    if (typeof html !== 'string') {
      console.error('MarkdownRenderer: marked() returned non-string type:', typeof html);
      return `<div class="error">解析错误: 返回类型异常</div>`;
    }
    
    // 【关键优化】移除标签之间的所有空白字符和换行，确保相邻兄弟选择器生效
    html = html.replace(/>\s+</g, '><');
    
    // 使用正则替换添加自定义类名（最稳定的方式）
    // 1. 段落：<p> → <div class="md-paragraph">
    html = html.replace(/<p>/g, '<div class="md-paragraph">');
    html = html.replace(/<\/p>/g, '</div>');
    
    // 2. 标题：<h1-6> → <h1-6 class="md-heading md-h{n}">
    html = html.replace(/<h1>/g, '<h1 class="md-heading md-h1">');
    html = html.replace(/<h2>/g, '<h2 class="md-heading md-h2">');
    html = html.replace(/<h3>/g, '<h3 class="md-heading md-h3">');
    html = html.replace(/<h4>/g, '<h4 class="md-heading md-h4">');
    html = html.replace(/<h5>/g, '<h5 class="md-heading md-h5">');
    html = html.replace(/<h6>/g, '<h6 class="md-heading md-h6">');
    
    // 3. 列表：<ul>/<ol>/<li>
    html = html.replace(/<ul>/g, '<ul class="md-list md-unordered">');
    html = html.replace(/<ol>/g, '<ol class="md-list md-ordered">');
    html = html.replace(/<li>/g, '<li class="md-list-item">');
    
    // 4. 强调元素：<strong>/<em>
    html = html.replace(/<strong>/g, '<strong class="md-strong">');
    html = html.replace(/<em>/g, '<em class="md-em">');
    
    // 5. 代码：<code>/<pre>
    html = html.replace(/<code>/g, '<code class="md-code-inline">');
    html = html.replace(/<pre>/g, '<pre class="md-code-block">');
    
    // 6. 引用块：<blockquote>
    html = html.replace(/<blockquote>/g, '<blockquote class="md-blockquote">');
    
    // 7. 分割线：<hr>
    html = html.replace(/<hr>/g, '<hr class="md-hr">');
    html = html.replace(/<hr\/>/g, '<hr class="md-hr" />');
    
    // 8. 链接：<a> 添加 class 和 target
    html = html.replace(/<a href=/g, '<a class="md-link" target="_blank" rel="noopener noreferrer" href=');
    
    return html;
  } catch (error) {
    console.error('MarkdownRenderer: Parsing error:', error);
    return `<div class="error">解析错误: ${error.message}</div>`;
  }
});

// 动态样式
const containerStyle = computed(() => ({
  '--line-height': props.lineHeight,
  '--text-color': props.color,
  '--font-family': props.fontFamily
}));
</script>

<template>
  <div 
    class="markdown-renderer" 
    :style="containerStyle"
    v-html="parsedHtml"
  ></div>
</template>

<style scoped>
/* ============================================================
   Markdown 渲染器 - 美观舒适布局 V5.0（最终定稿）
   ============================================================ */

.markdown-renderer {
  font-family: var(--font-family) !important;
  color: var(--text-color) !important;
  line-height: var(--line-height) !important;
  letter-spacing: 0.5px;
}

/* 错误提示 */
.markdown-renderer :deep(.error) {
  color: #ff4444 !important;
  padding: 10px;
  background: rgba(255, 68, 68, 0.1);
  border-radius: 4px;
  font-size: 0.95rem;
  margin: 10px 0 !important;
}

/* ============================================================
   全局块级元素重置 - 强制优先级
   ============================================================ */
.markdown-renderer :deep(.md-heading),
.markdown-renderer :deep(.md-paragraph),
.markdown-renderer :deep(.md-list),
.markdown-renderer :deep(.md-blockquote),
.markdown-renderer :deep(.md-code-block) {
  margin: 0 !important;
  padding: 0 !important;
}

/* ============================================================
   标题样式 - 舒适间距，下边距 6px
   ============================================================ */
.markdown-renderer :deep(.md-heading) {
  font-family: 'STKaiti', 'KaiTi', 'Noto Serif SC', serif !important;
  line-height: 1.35 !important;
}

/* H1 */
.markdown-renderer :deep(.md-h1) {
  font-size: 1.6rem !important;
  font-weight: 700 !important;
  color: #f4d77e !important;
  margin: 14px 0 6px !important; /* 下边距 6px */
  padding-bottom: 6px !important;
  border-bottom: 2px solid rgba(244, 215, 126, 0.28) !important;
  text-align: center;
  text-shadow: 0 2px 5px rgba(244, 215, 126, 0.22);
  letter-spacing: 2px;
}

/* H2 */
.markdown-renderer :deep(.md-h2) {
  font-size: 1.35rem !important;
  font-weight: 700 !important;
  color: #ecd05f !important;
  margin: 12px 0 6px !important; /* 下边距 6px */
  padding-left: 10px !important;
  border-left: 3px solid rgba(236, 208, 95, 0.42) !important;
  text-shadow: 0 1px 3px rgba(236, 208, 95, 0.22);
  letter-spacing: 1.3px;
}

/* H3 - 最常用 */
.markdown-renderer :deep(.md-h3) {
  font-size: 1.2rem !important;
  font-weight: 700 !important;
  color: #e2c44b !important;
  margin: 10px 0 6px !important; /* 下边距 6px */
  padding-bottom: 3px !important; /* 增加视觉饱满感 */
  text-shadow: 0 1px 2px rgba(226, 196, 75, 0.22);
  letter-spacing: 1px;
}

/* H4-H6 */
.markdown-renderer :deep(.md-h4),
.markdown-renderer :deep(.md-h5),
.markdown-renderer :deep(.md-h6) {
  font-size: 1.08rem !important;
  font-weight: 600 !important;
  color: #d3b05b !important;
  margin: 8px 0 6px !important; /* 下边距 6px */
  text-shadow: 0 1px 2px rgba(211, 176, 91, 0.18);
  letter-spacing: 0.8px;
}

/* ============================================================
   段落样式 - 舒适间距 6px
   ============================================================ */
.markdown-renderer :deep(.md-paragraph) {
  font-size: 1.05rem !important;
  color: var(--text-color) !important;
  margin: 6px 0 !important; /* 舒适间距 6px */
  text-align: justify;
  text-indent: 2em;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.18);
  line-height: var(--line-height) !important;
}

.markdown-renderer :deep(.md-paragraph:first-child) {
  margin-top: 0 !important;
}

.markdown-renderer :deep(.md-paragraph:last-child) {
  margin-bottom: 0 !important;
}

/* ============================================================
   文本强调 - 视觉焦点
   ============================================================ */
.markdown-renderer :deep(.md-strong) {
  font-weight: 700 !important;
  color: rgba(226,196, 75) !important;
  text-shadow: 0 1px 2px rgba(209, 206, 198, 0.38) !important;
  letter-spacing: 0.3px;
}

.markdown-renderer :deep(.md-em) {
  font-style: italic !important;
  font-weight: 500 !important;
  color: #d4af37 !important;
  text-shadow: 0 1px 2px rgba(212, 175, 55, 0.22);
}

/* ============================================================
   列表样式 - 舒适间距
   ============================================================ */
.markdown-renderer :deep(.md-list) {
  margin: 6px 0 !important; /* 舒适间距 6px */
  padding-left: 0 !important;
  list-style: none !important;
}

.markdown-renderer :deep(.md-list-item) {
  position: relative;
  padding-left: 1.7em !important;
  margin: 5px 0 !important; /* 舒适间距 5px */
  text-indent: 0 !important;
  color: var(--text-color) !important;
  line-height: var(--line-height) !important;
}

/* 无序列表符号 */
.markdown-renderer :deep(.md-unordered .md-list-item::before) {
  content: '◆';
  position: absolute;
  left: 0.25em;
  color: #d4af37 !important;
  font-size: 0.75em;
  text-shadow: 0 0 2px rgba(212, 175, 55, 0.28);
}

/* 有序列表 */
.markdown-renderer :deep(.md-ordered) {
  counter-reset: list-counter;
}

.markdown-renderer :deep(.md-ordered .md-list-item) {
  counter-increment: list-counter;
}

.markdown-renderer :deep(.md-ordered .md-list-item::before) {
  content: counter(list-counter) '.';
  position: absolute;
  left: 0;
  color: #d4af37 !important;
  font-weight: 600 !important;
  text-shadow: 0 0 2px rgba(212, 175, 55, 0.28);
}

/* ============================================================
   引用块 - 舒适间距
   ============================================================ */
.markdown-renderer :deep(.md-blockquote) {
  margin: 8px 0 !important; /* 舒适间距 8px */
  padding: 10px 14px !important;
  background: rgba(228, 196, 75, 0.04) !important;
  border-left: 3px solid rgba(212, 175, 55, 0.38) !important;
  color: #c9a961 !important;
  font-style: italic;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
}

.markdown-renderer :deep(.md-blockquote .md-paragraph) {
  margin: 4px 0 !important;
  text-indent: 0 !important;
}

/* ============================================================
   代码样式
   ============================================================ */
.markdown-renderer :deep(.md-code-inline) {
  background: rgba(228, 196, 75, 0.1) !important;
  color: #f4d77e !important;
  padding: 2px 6px !important;
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace !important;
  font-size: 0.88em;
  border: 1px solid rgba(228, 196, 75, 0.16);
}

.markdown-renderer :deep(.md-code-block) {
  background: rgba(0, 0, 0, 0.28) !important;
  border: 1px solid rgba(228, 196, 75, 0.18) !important;
  border-radius: 4px;
  padding: 12px !important;
  margin: 8px 0 !important; /* 舒适间距 8px */
  overflow-x: auto;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.18);
}

.markdown-renderer :deep(.md-code-block code) {
  color: #e2c44b !important;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace !important;
  font-size: 0.92rem;
  line-height: 1.45 !important;
}

/* ============================================================
   水平分割线
   ============================================================ */
.markdown-renderer :deep(.md-hr) {
  border: none !important;
  border-top: 1px solid rgba(212, 175, 55, 0.28) !important;
  margin: 16px 0 !important;
  box-shadow: 0 1px 0 rgba(255, 240, 204, 0.06);
}

/* ============================================================
   链接
   ============================================================ */
.markdown-renderer :deep(.md-link) {
  color: #f4d77e !important;
  text-decoration: underline;
  text-underline-offset: 2px;
  text-decoration-color: rgba(244, 215, 126, 0.45);
  transition: all 0.3s ease;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
}

.markdown-renderer :deep(.md-link:hover) {
  color: #fff0cc !important;
  text-decoration-color: rgba(255, 240, 204, 0.7);
  text-shadow: 
    0 0 6px rgba(255, 240, 204, 0.38),
    0 1px 3px rgba(0, 0, 0, 0.22) !important;
}

/* ============================================================
   相邻兄弟选择器 - 舒适间距（5-6px）
   ============================================================ */

/* 标题 + 列表：5px 间距 */
.markdown-renderer :deep(.md-h1 + .md-list) {
  margin-top: 5px !important;
}

.markdown-renderer :deep(.md-h2 + .md-list) {
  margin-top: 5px !important;
}

.markdown-renderer :deep(.md-h3 + .md-list) {
  margin-top: 5px !important;
}

.markdown-renderer :deep(.md-h4 + .md-list),
.markdown-renderer :deep(.md-h5 + .md-list),
.markdown-renderer :deep(.md-h6 + .md-list) {
  margin-top: 5px !important;
}

/* 标题 + 段落：5px 间距 */
.markdown-renderer :deep(.md-h1 + .md-paragraph) {
  margin-top: 5px !important;
}

.markdown-renderer :deep(.md-h2 + .md-paragraph) {
  margin-top: 5px !important;
}

.markdown-renderer :deep(.md-h3 + .md-paragraph) {
  margin-top: 5px !important;
}

.markdown-renderer :deep(.md-h4 + .md-paragraph),
.markdown-renderer :deep(.md-h5 + .md-paragraph),
.markdown-renderer :deep(.md-h6 + .md-paragraph) {
  margin-top: 5px !important;
}

/* 段落 + 列表：6px 间距 */
.markdown-renderer :deep(.md-paragraph + .md-list) {
  margin-top: 6px !important;
}

/* 列表 + 段落：6px 间距 */
.markdown-renderer :deep(.md-list + .md-paragraph) {
  margin-top: 6px !important;
}

/* 列表 + 列表：6px 间距 */
.markdown-renderer :deep(.md-list + .md-list) {
  margin-top: 6px !important;
}

/* 段落 + 段落：6px 间距 */
.markdown-renderer :deep(.md-paragraph + .md-paragraph) {
  margin-top: 6px !important;
}

/* 标题 + 引用块：5px 间距 */
.markdown-renderer :deep(.md-heading + .md-blockquote) {
  margin-top: 5px !important;
}

/* 段落 + 引用块：6px 间距 */
.markdown-renderer :deep(.md-paragraph + .md-blockquote) {
  margin-top: 6px !important;
}

/* 列表 + 引用块：6px 间距 */
.markdown-renderer :deep(.md-list + .md-blockquote) {
  margin-top: 6px !important;
}

/* 标题 + 代码块：5px 间距 */
.markdown-renderer :deep(.md-heading + .md-code-block) {
  margin-top: 5px !important;
}

/* 段落 + 代码块：6px 间距 */
.markdown-renderer :deep(.md-paragraph + .md-code-block) {
  margin-top: 6px !important;
}

/* 列表 + 代码块：6px 间距 */
.markdown-renderer :deep(.md-list + .md-code-block) {
  margin-top: 6px !important;
}

/* 引用块 + 任意元素：6px 间距 */
.markdown-renderer :deep(.md-blockquote + .md-heading),
.markdown-renderer :deep(.md-blockquote + .md-paragraph),
.markdown-renderer :deep(.md-blockquote + .md-list) {
  margin-top: 6px !important;
}

/* 代码块 + 任意元素：6px 间距 */
.markdown-renderer :deep(.md-code-block + .md-heading),
.markdown-renderer :deep(.md-code-block + .md-paragraph),
.markdown-renderer :deep(.md-code-block + .md-list) {
  margin-top: 6px !important;
}
</style>

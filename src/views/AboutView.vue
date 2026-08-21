<script setup>
import NavBar from '../components/NavBar.vue';
import { ref, onMounted } from 'vue';

// 页面切换效果
const showContent = ref(false);
// 检查是否是第一次访问（在当前会话中）
const isFirstVisit = ref(true);
// 跟踪各个部分的可见性，用于实现滚动显示动画
const sectionVisible = ref({
  intro: true,
  mission: true,
  features: true,
  compliance: true,
  certification: true,
  team: true,
  contact: true
});

// 检测元素是否进入视口
const observeSection = (sectionId) => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        sectionVisible.value[sectionId] = true;
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  
  setTimeout(() => {
    const section = document.getElementById(sectionId);
    if (section) {
      observer.observe(section);
    }
  }, 100);
};

// 将六爻介绍文字分行存储
const philosophyLines = [
  "六爻，这部流淌了三千年的东方算法，",
  "曾因晦涩的卦辞与参差的应用者，",
  "被尘封在「玄学」与「迷信」的争议里。",
  "而当大语言模型破译爻变的 384 种可能性，",
  "当神经网络将六十四卦重构为概率模型 ——",
  "我们终于发现：",
  "古老占卜术的本质，",
  "是祖先用卦象书写的决策树，",
  "是青铜时代的贝叶斯定理。",
  "AI 正在做的，",
  "不是为命运下断言，",
  "而是让每个人都能用数据的视角，",
  "重新理解这份古老的智慧。",
  "OpenLiuYao唯一官方交流群：711651770",
  "欢迎入群交流反馈"
];

// API Key设置相关数据
const llmServiceType = ref('');
const modelId = ref('');
const apiKey = ref('');

// 获取API Key设置信息
const loadApiKeyInfo = () => {
  llmServiceType.value = localStorage.getItem('llmServiceType') || '';
  modelId.value = localStorage.getItem('modelId') || '';
  apiKey.value = localStorage.getItem('apiKey') || '';
};

// 刷新API Key信息（用于手动刷新）
const refreshApiKeyInfo = () => {
  loadApiKeyInfo();
};

// 对API Key进行掩码处理
const maskApiKey = (key) => {
  if (!key) return '';
  // 如果key长度小于8，显示前两个和后两个字符
  if (key.length <= 8) {
    return key.slice(0, 2) + '*'.repeat(key.length - 4) + key.slice(-2);
  }
  // 否则显示前四个和后四个字符
  return key.slice(0, 4) + '*'.repeat(Math.min(key.length - 8, 20)) + key.slice(-4);
};

onMounted(() => {
  // 检查sessionStorage中是否有访问记录
  const hasVisited = sessionStorage.getItem('aboutPageVisited');
  
  if (hasVisited) {
    // 不是第一次访问，使用快速动画
    isFirstVisit.value = false;
  } else {
    // 第一次访问，标记为已访问
    sessionStorage.setItem('aboutPageVisited', 'true');
    isFirstVisit.value = true;
  }
  
  // 页面加载后显示内容，触发淡入效果
  setTimeout(() => {
    showContent.value = true;
  }, 100);
  
  // 初始化各部分的交叉观察器
  observeSection('intro-section');
  observeSection('mission-section');
  observeSection('features-section');
  observeSection('compliance-section');
  observeSection('certification-section');
  observeSection('team-section');
  observeSection('contact-section');
  
  // 组件挂载时加载API Key信息
  loadApiKeyInfo();
});
</script>

<template>
  <div class="about-view">
    <NavBar />
    
    <main :class="{ 'content-visible': showContent }">
      <div class="about-container">
        <!-- 页面标题部分 -->
        <div class="about-header">
          <h1 class="about-title">关于我们</h1>
        </div>

        <!-- 六爻诗意介绍 -->
        <div class="liuyao-philosophy">
          <!-- <div class="hexagram-decoration left">
            <div class="hexagram-line"></div>
            <div class="hexagram-line broken"></div>
            <div class="hexagram-line"></div>
            <div class="hexagram-line broken"></div>
            <div class="hexagram-line"></div>
            <div class="hexagram-line"></div>
          </div> -->
          
          <div class="poetry-container" :class="{ 'quick-show': !isFirstVisit }">
            <div class="line-wrapper" v-for="(line, index) in philosophyLines" :key="index">
              <div class="line" :class="{ 'first-visit': isFirstVisit }" :style="isFirstVisit ? { animationDelay: `${index * 0.8}s` } : {}">{{ line }}</div>
            </div>
          </div>
          
          <!-- <div class="hexagram-decoration right">
            <div class="hexagram-line"></div>
            <div class="hexagram-line"></div>
            <div class="hexagram-line broken"></div>
            <div class="hexagram-line"></div>
            <div class="hexagram-line broken"></div>
            <div class="hexagram-line"></div>
          </div> -->
        </div>
        
        <!-- 页脚 -->
        <footer class="about-footer">
          <div class="footer-content">
            <p>© 2025 OpenLiuYao - 传统文化智能研究平台</p>
            <p class="footer-note">本网站内容仅供文化学习和研究目的，不作为任何决策依据</p>
          </div>
        </footer>
      </div>
    </main>
  </div>
</template>

<style scoped>
.content-visible {
  opacity: 1;
  transform: translateY(0);
}

.about-view {
  background-color: var(--dark-bg);
  min-height: 100vh;
  min-height: 100svh;
  min-height: 100dvh;
  position: relative;
  overflow-x: hidden;
}

.about-view::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at center, rgba(230, 200, 76, 0.05) 0%, rgba(0, 0, 0, 0) 70%);
  opacity: 0.6;
  z-index: 0;
  pointer-events: none;
}

.about-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 60px 20px;
  position: relative;
  z-index: 1;
}

.about-header {
  text-align: center;
  margin-bottom: 60px;
  position: relative;
}

.about-title {
  font-size: 2.8rem;
  color: var(--primary-color);
  margin-bottom: 15px;
  font-weight: bold;
  letter-spacing: 2px;
  position: relative;
  display: inline-block;
  font-family: "Ma Shan Zheng", "STKaiti", "KaiTi", "楷体", serif;
}

/* 六爻哲学文字展示 */
.liuyao-philosophy {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 40px 0;
  position: relative;
  padding: 40px 0;
  border-radius: 8px;
  background: radial-gradient(circle at center, rgba(230, 200, 76, 0.05) 0%, rgba(0, 0, 0, 0) 70%);
}

.poetry-container {
  width: 75%;
  padding: 20px;
  position: relative;
  z-index: 2;
  max-width: 700px;
  text-align: center;
}

/* 为诗句添加背景纸质感 */
.poetry-container::before {
  content: '';
  position: absolute;
  top: -20px;
  left: -20px;
  right: -20px;
  bottom: -20px;
  background: radial-gradient(ellipse at center, rgba(255, 248, 220, 0.03) 0%, rgba(0, 0, 0, 0) 70%);
  border-radius: 10px;
  z-index: -1;
  opacity: 0.6;
}

.line-wrapper {
  overflow: hidden;
  margin-bottom: 12px;
}

.line {
  font-size: 1.3rem;
  line-height: 1.5;
  color: var(--text-light);
  font-weight: 300;
  letter-spacing: 2px;
  position: relative;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  font-family: "Ma Shan Zheng", "STKaiti", "KaiTi", "楷体", "FangSong", "仿宋", serif;
}

/* 第一次访问的慢动画 */
.line.first-visit {
  transform: translateY(50px);
  opacity: 0;
  animation: fadeUp 3s ease forwards;
}

/* 非第一次访问的快速淡入动画 */
.poetry-container.quick-show .line {
  opacity: 0;
  transform: translateY(10px);
  animation: quickFadeIn 0.6s ease forwards;
}

@keyframes fadeUp {
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes quickFadeIn {
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 特殊强调的行 */
.line-wrapper:nth-child(6) .line,
.line-wrapper:nth-child(9) .line,
.line-wrapper:nth-child(13) .line {
  color: var(--primary-color);
  font-weight: 400;
}

/* 卦象装饰 - 保留但已被注释掉，以防将来需要 */
.hexagram-decoration {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 12px;
  opacity: 0.4;
  height: 100%;
  padding: 0 20px;
  animation: pulse 4s infinite alternate ease-in-out;
}

.hexagram-decoration.left {
  margin-right: 20px;
}

.hexagram-decoration.right {
  margin-left: 20px;
}

.hexagram-line {
  width: 40px;
  height: 6px;
  background-color: var(--primary-color);
  border-radius: 3px;
}

.hexagram-line.broken {
  width: 40px;
  display: flex;
  justify-content: space-between;
  background-color: transparent;
}

.hexagram-line.broken::before,
.hexagram-line.broken::after {
  content: '';
  width: 15px;
  height: 6px;
  background-color: var(--primary-color);
  border-radius: 3px;
}

@keyframes pulse {
  0% {
    opacity: 0.3;
  }
  100% {
    opacity: 0.6;
  }
}

/* 页脚样式 */
.about-footer {
  margin-top: 80px;
  padding-top: 30px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

.footer-content {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
}

.footer-note {
  margin-top: 10px;
  font-style: italic;
}

/* 古风字体 */
@font-face {
  font-family: 'Ma Shan Zheng';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/mashanzheng/v10/NaPecZDIAOhVxoMyOr9n_E7ffcjEGIVzY5abuWI.woff2) format('woff2');
  unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .liuyao-philosophy {
    flex-direction: column;
    padding: 20px 10px;
  }
  
  .poetry-container {
    width: 90%;
  }
  
  .hexagram-decoration {
    padding: 20px 0;
    flex-direction: row;
    gap: 10px;
    height: auto;
    margin: 0 !important;
  }
  
  .hexagram-decoration.left {
    order: -1;
  }
  
  .hexagram-decoration.right {
    order: 1;
  }
  
  .hexagram-line {
    width: 6px;
    height: 30px;
  }
  
  .hexagram-line.broken {
    width: 6px;
    height: 30px;
    flex-direction: column;
  }
  
  .hexagram-line.broken::before,
  .hexagram-line.broken::after {
    width: 6px;
    height: 12px;
  }
  
  .line-wrapper {
    margin-bottom: 8px;
  }
  
  .line {
    font-size: 1.1rem;
    letter-spacing: 1px;
    line-height: 1.4;
  }
  
  .about-title {
    font-size: 2.3rem;
  }
}
</style> 
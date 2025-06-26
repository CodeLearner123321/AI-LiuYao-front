<script setup>
import NavBar from '../components/NavBar.vue';
import { ref, onMounted, watch, computed } from 'vue';

// 控制侧边栏的展开收起状态
const sidebarCollapsed = ref(false);
// 控制移动端侧边栏显示状态
const isMobileMenuActive = ref(false);
// 是否是移动端
const isMobile = ref(false);

// 切换侧边栏状态
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value;
};

// 切换移动端菜单状态
const toggleMobileMenu = () => {
  isMobileMenuActive.value = !isMobileMenuActive.value;
};

// 当前激活的菜单项
const activeMenuItem = ref('introduction');

// 设置当前活跃菜单
const setActiveMenuItem = (itemId) => {
  activeMenuItem.value = itemId;
  // 在移动端点击菜单项后自动隐藏侧边栏
  if (isMobile.value) {
    isMobileMenuActive.value = false;
  }
};

// 监听窗口大小变化
const checkScreenSize = () => {
  isMobile.value = window.innerWidth <= 992;
  if (!isMobile.value) {
    isMobileMenuActive.value = false;
  }
};

// 监听滚动和哈希变化
onMounted(() => {
  // 初始检查屏幕大小
  checkScreenSize();
  
  // 初始化时检查URL哈希
  if (window.location.hash) {
    const hash = window.location.hash.substring(1);
    setActiveMenuItem(hash);
  }

  // 监听哈希变化
  window.addEventListener('hashchange', () => {
    if (window.location.hash) {
      const hash = window.location.hash.substring(1);
      setActiveMenuItem(hash);
    }
  });

  // 监听滚动以更新活跃菜单
  const handleScroll = () => {
    const sections = document.querySelectorAll('.guide-section');
    let currentSection = 'introduction';
    
    sections.forEach(section => {
      const sectionTop = section.getBoundingClientRect().top;
      if (sectionTop < 100) {
        currentSection = section.id;
      }
    });
    
    setActiveMenuItem(currentSection);
  };

  window.addEventListener('scroll', handleScroll);
  
  // 监听窗口大小变化
  window.addEventListener('resize', checkScreenSize);

  // 组件卸载时移除事件监听
  return () => {
    window.removeEventListener('hashchange', () => {});
    window.removeEventListener('scroll', handleScroll);
    window.removeEventListener('resize', checkScreenSize);
  };
});
</script>

<template>
  <div class="guide-container">
    <NavBar />
    
    <!-- 移动端菜单按钮 -->
    <div class="mobile-menu-toggle" v-show="isMobile" @click="toggleMobileMenu">
      <div class="menu-icon" :class="{ 'active': isMobileMenuActive }">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
    
    <div class="page-content">
      <div class="guide-sidebar" :class="{ 
        'collapsed': sidebarCollapsed, 
        'active': isMobileMenuActive 
      }">
        <div class="sidebar-header">
          <h3>使用指南</h3>
        </div>
        <ul class="sidebar-menu">
          <li class="menu-item" :class="{ 'active': activeMenuItem === 'introduction' }">
            <a href="#introduction" @click="setActiveMenuItem('introduction')">产品介绍</a>
          </li>
          <li class="menu-item" :class="{ 'active': activeMenuItem === 'getting-started' }">
            <a href="#getting-started" @click="setActiveMenuItem('getting-started')">快速开始</a>
          </li>
          <li class="menu-item" :class="{ 'active': activeMenuItem === 'hexagram-guide' || activeMenuItem === 'time-casting' || activeMenuItem === 'manual-casting' || activeMenuItem === 'random-casting' }">
            <a href="#hexagram-guide" @click="setActiveMenuItem('hexagram-guide')">六爻起卦指南</a>
            <ul class="submenu" v-show="!sidebarCollapsed">
              <li :class="{ 'active': activeMenuItem === 'manual-casting' }">
                <a href="#manual-casting" @click="setActiveMenuItem('manual-casting')">手动起卦(推荐)</a>
              </li>
              <li :class="{ 'active': activeMenuItem === 'time-casting' }">
                <a href="#time-casting" @click="setActiveMenuItem('time-casting')">时间起卦</a>
              </li>
              <li :class="{ 'active': activeMenuItem === 'random-casting' }">
                <a href="#random-casting" @click="setActiveMenuItem('random-casting')">随机起卦</a>
              </li>
            </ul>
          </li>
          <li class="menu-item" :class="{ 'active': activeMenuItem === 'analysis' }">
            <a href="#analysis" @click="setActiveMenuItem('analysis')">解读分析</a>
          </li>
          <li class="menu-item" :class="{ 'active': activeMenuItem === 'history' }">
            <a href="#history" @click="setActiveMenuItem('history')">历史记录</a>
          </li>
          <li class="menu-item" :class="{ 'active': activeMenuItem === 'faq' }">
            <a href="#faq" @click="setActiveMenuItem('faq')">常见问题</a>
          </li>
        </ul>
        
        <!-- 侧边栏切换按钮 -->
        <div class="sidebar-toggle" @click="toggleSidebar">
          <div class="toggle-icon" :class="{ 'collapsed': sidebarCollapsed }">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
      
      <div class="guide-content" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
        <div class="guide-main">
          <div class="guide-section" id="introduction">
            <h1>爻算云鉴使用指南</h1>
            <p class="guide-intro">爻算云鉴是一款基于深度学习的人工智能平台，对中国古代决策符号系统进行结构化解析，为公众开放互动式探索功能，以直观数据呈现古代智慧精髓，恪守学术规范，杜绝封建迷信。</p>
            
            <h2>产品介绍</h2>
            <p>爻算云鉴将传统易学与现代人工智能技术相结合，通过对大量古籍文献的学习和分析，构建了一套智能化的六爻预测分析系统。本平台旨在以科学、客观的方式呈现中国传统文化的智慧，帮助用户在面对决策时获得新的思考角度。</p>
            
            <div class="feature-box">
              <div class="feature-item">
                <div class="feature-icon">⏱️</div>
                <div class="feature-text">
                  <h4>六爻智能分析</h4>
                  <p>基于传统易学理论，结合AI深度学习技术，提供准确的六爻分析解读</p>
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-icon">📊</div>
                <div class="feature-text">
                  <h4>多维度解析</h4>
                  <p>从多个角度分析卦象含义，提供全面的决策参考</p>
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-icon">📚</div>
                <div class="feature-text">
                  <h4>传统文化学习</h4>
                  <p>提供易经、命理、传统文化知识学习资料</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="guide-section" id="getting-started">
            <h2>快速开始</h2>
            <p>使用爻算云鉴非常简单，只需几个步骤即可获得专业的六爻分析：</p>
            
            <div class="steps-container">
              <div class="step-item">
                <div class="step-number">1</div>
                <div class="step-content">
                  <h4>注册/登录账号</h4>
                  <p>首次使用需要注册账号，已有账号可直接登录</p>
                </div>
              </div>
              <div class="step-item">
                <div class="step-number">2</div>
                <div class="step-content">
                  <h4>进入六爻分析页面</h4>
                  <p>点击首页"开始体验"或"六爻智能分析"进入功能页面</p>
                </div>
              </div>
              <div class="step-item">
                <div class="step-number">3</div>
                <div class="step-content">
                  <h4>选择起卦方式</h4>
                  <p>可选择时间起卦、手动起卦或随机起卦</p>
                </div>
              </div>
              <div class="step-item">
                <div class="step-number">4</div>
                <div class="step-content">
                  <h4>输入问题和背景</h4>
                  <p>明确您想要解答的问题，并提供相关背景信息</p>
                </div>
              </div>
              <div class="step-item">
                <div class="step-number">5</div>
                <div class="step-content">
                  <h4>获取分析结果</h4>
                  <p>系统将生成卦象并提供AI分析结果</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="guide-section" id="hexagram-guide">
            <h2>六爻起卦指南</h2>
            <p>爻算云鉴提供三种起卦方式，您可以根据个人偏好选择：</p>
            
                        <div class="subsection" id="manual-casting">
              <h3>手动起卦（推荐）</h3>
              <p>手动起卦允许您自行指定您需要的卦象,起卦前需平复心情，默念您的问题，
              随后可以双手拿三枚铜钱或硬币起卦，摇一摇，扔到桌上，以国徽或花为背，看国徽或者花的个数，零个记录为0，
              一个记录为1，以此类推，记录六次，最后得到一个六位数，如：112031，从下往上，依次排列，得到卦象：风泽中孚 变 火泽暌</p>
              <ol class="instruction-list">
                <li>在起卦页面，选择"手动起卦"选项</li>
                <li>输入六位数字，每位数字对应一个爻位：
                  <ul>
                    <li>0: 老阴，表示阴爻且有变</li>
                    <li>1: 少阳，表示阳爻无变</li>
                    <li>2: 少阴，表示阴爻无变</li>
                    <li>3: 老阳，表示阳爻且有变</li>
                  </ul>
                </li>
                <li>输入您的问题和背景信息</li>
                <li>点击"开始分析"按钮</li>
              </ol>
              <div class="note-box">
                <p><strong>提示：</strong>数字的位置对应爻位，从左到右分别是：初爻(第一爻)、二爻、三爻、四爻、五爻、上爻(第六爻)。</p>
              </div>
            </div>

            <div class="subsection" id="time-casting">
              <h3>时间起卦</h3>
              <p>时间起卦是最常用的方式，系统会根据您点击”生成卦象“的时间，以微秒为单位，自动生成卦象</p>
              <ol class="instruction-list">
                <li>在起卦页面，选择"时间起卦"选项</li>
                <li>选择或调整起卦时间（默认为当前时间）</li>
                <li>输入您的问题（不超过10个字）</li>
                <li>提供问题的背景信息，越详细越好</li>
                <li>点击"开始分析"按钮</li>
              </ol>
              <div class="note-box">
                <p><strong>提示：</strong>时间起卦认为卦象与提出问题的时间有密切关联，在使用者确切的想知道事情结果且无能力手动摇卦的情况下，
                可能会得到贴合的分析结果，善用者用之，一般不做推荐。</p>
              </div>
            </div>
            
            
            <div class="subsection" id="random-casting">
              <h3>随机起卦</h3>
              <p>随机起卦将起卦的结果完全随机，不与任何因素发生关联</p>
              <ol class="instruction-list">
                <li>在起卦页面，选择"随机起卦"选项</li>
                <li>输入您的问题和背景信息</li>
                <li>点击"开始分析"按钮</li>
              </ol>
              <div class="note-box">
                <p><strong>提示：</strong>随机起卦适合初学者学习爻动旺衰理论，快速生成卦象，快速学习。</p>
              </div>
            </div>
          </div>
          
          <div class="guide-section" id="analysis">
            <h2>解读分析</h2>
            <p>提交起卦请求后，系统将异步交由AI生成分析结果，通常需要30-60秒完成。分析结果包含以下内容：</p>
            
            <div class="analysis-components">
              <div class="analysis-item">
                <h4>卦象信息</h4>
                <p>展示本卦和变卦的基本信息，包括卦名、宫位、爻位等</p>
              </div>
              <div class="analysis-item">
                <h4>八字信息</h4>
                <p>显示起卦时间对应的八字信息</p>
              </div>
              <div class="analysis-item">
                <h4>神煞信息</h4>
                <p>列出与卦象相关的神煞信息</p>
              </div>
            </div>
            
            <div class="note-box">
              <p><strong>注意：</strong>分析结果仅供参考，不应作为唯一决策依据。爻算云鉴提倡理性思考，反对迷信。</p>
            </div>
          </div>
          
          <div class="guide-section" id="history">
            <h2>历史记录</h2>
            <p>系统会自动保存您的起卦记录，方便您随时查看：</p>
            <ul class="feature-list">
              <li>在个人中心可查看所有历史记录</li>
              <li>历史记录按时间倒序排列，最新的记录排在前面</li>
              <li>点击任意记录可查看详细分析结果</li>
              <li>历史记录永久保存，无需担心数据丢失</li>
            </ul>
          </div>
          
          <div class="guide-section" id="faq">
            <h2>常见问题</h2>
            
            <div class="faq-item">
              <h4>Q: 使用爻算云鉴需要付费吗？</h4>
              <p>A: 爻算云鉴开源且免费，需要用户自行提供大语言模型key</p>
            </div>
            
            <div class="faq-item">
              <h4>Q: 分析结果需要多长时间？</h4>
              <p>A: 通常情况下，分析结果会在30-60秒内生成。如果长时间（超过1分半）未完成，可能是系统繁忙，建议稍后重试。</p>
            </div>
            
            <div class="faq-item">
              <h4>Q: 如何提高分析准确性？</h4>
              <p>A: 提供详细、准确的问题背景信息，选择与问题相关的时间点进行起卦，这些都有助于获得更准确的分析结果。</p>
            </div>
            
            <div class="faq-item">
              <h4>Q: 爻算云鉴的分析结果有科学依据吗？</h4>
              <p>A: 爻算云鉴基于传统易学理论和现代AI技术，提供的是对传统文化的一种解读和呈现。我们鼓励用户理性看待分析结果，将其作为决策参考而非绝对依据。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.guide-container {
  min-height: 100vh;
  background-color: var(--dark-bg);
  color: var(--text-light);
  position: relative;
}

.page-content {
  display: flex;
  position: relative;
}

.guide-content {
  margin-left: 250px;
  padding: 30px 30px 30px 40px;
  transition: all 0.3s ease;
  width: 100%;
  max-width: 1200px;
}

.guide-content.sidebar-collapsed {
  margin-left: 60px;
}

/* 侧边栏样式 */
.guide-sidebar {
  width: 250px;
  position: fixed;
  left: 0;
  top: 70px; /* NavBar高度，根据实际调整 */
  height: calc(100vh - 70px);
  overflow-y: auto;
  padding: 20px;
  background-color: var(--dark-bg);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  z-index: 100;
}

.guide-sidebar.collapsed {
  width: 60px;
  padding: 20px 10px;
}

.guide-sidebar.active {
  left: 0;
}

.sidebar-header {
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-header h3 {
  color: var(--primary-color);
  font-size: 1.2rem;
  margin: 0;
  white-space: nowrap;
}

.sidebar-menu {
  list-style: none;
  padding: 0;
  margin: 0;
}

.menu-item {
  margin-bottom: 10px;
  position: relative;
}

.menu-item a {
  display: block;
  padding: 8px 10px;
  color: #ccc;
  text-decoration: none;
  border-radius: 4px;
  transition: all 0.3s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.menu-item a:hover {
  background-color: rgba(230, 200, 76, 0.1);
  color: var(--primary-color);
}

.menu-item.active > a {
  background-color: rgba(230, 200, 76, 0.15);
  color: var(--primary-color);
  font-weight: bold;
}

.submenu {
  list-style: none;
  padding-left: 20px;
  margin-top: 5px;
}

.submenu li {
  margin-bottom: 5px;
}

.submenu li.active a {
  color: var(--primary-color);
  font-weight: bold;
}

.submenu a {
  padding: 5px 10px;
  font-size: 0.9rem;
}

/* 侧边栏切换按钮 */
.sidebar-toggle {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  width: 36px;
  height: 36px;
  background-color: rgba(230, 200, 76, 0.1);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10;
  border: 1px solid rgba(230, 200, 76, 0.3);
}

.sidebar-toggle:hover {
  background-color: rgba(230, 200, 76, 0.2);
}

.toggle-icon {
  width: 18px;
  height: 14px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.toggle-icon span {
  display: block;
  width: 100%;
  height: 2px;
  background-color: var(--primary-color);
  border-radius: 1px;
  transition: all 0.3s ease;
}

.toggle-icon.collapsed span:nth-child(1) {
  transform: rotate(45deg) translate(4px, 4px);
}

.toggle-icon.collapsed span:nth-child(2) {
  opacity: 0;
}

.toggle-icon.collapsed span:nth-child(3) {
  transform: rotate(-45deg) translate(4px, -4px);
}

.collapsed .sidebar-header h3,
.collapsed .menu-item a span {
  display: none;
}

/* 主内容区样式 */
.guide-main {
  width: 100%;
}

.guide-section {
  margin-bottom: 60px;
  scroll-margin-top: 100px;
}

.guide-section h1 {
  color: var(--primary-color);
  font-size: 2.2rem;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(230, 200, 76, 0.3);
  padding-bottom: 15px;
}

.guide-section h2 {
  color: var(--primary-color);
  font-size: 1.8rem;
  margin: 30px 0 20px;
  position: relative;
}

.guide-section h2::before {
  content: '';
  position: absolute;
  left: -20px;
  top: 50%;
  transform: translateY(-50%);
  width: 10px;
  height: 10px;
  background-color: var(--primary-color);
  border-radius: 50%;
}

.guide-intro {
  font-size: 1.1rem;
  line-height: 1.6;
  color: #ddd;
  margin-bottom: 30px;
}

.subsection {
  margin: 30px 0;
  padding-left: 15px;
  border-left: 2px solid rgba(230, 200, 76, 0.3);
}

.subsection h3 {
  color: #e6c84c;
  font-size: 1.4rem;
  margin-bottom: 15px;
}

/* 功能特点盒子 */
.feature-box {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin: 30px 0;
}

.feature-item {
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: flex-start;
  gap: 15px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

.feature-icon {
  font-size: 24px;
  background-color: rgba(230, 200, 76, 0.1);
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.feature-text h4 {
  color: var(--primary-color);
  margin: 0 0 10px;
  font-size: 1.1rem;
}

.feature-text p {
  margin: 0;
  color: #ccc;
  font-size: 0.95rem;
  line-height: 1.5;
}

/* 步骤容器 */
.steps-container {
  margin: 30px 0;
}

.step-item {
  display: flex;
  margin-bottom: 20px;
  align-items: flex-start;
}

.step-number {
  width: 36px;
  height: 36px;
  background-color: rgba(230, 200, 76, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: var(--primary-color);
  margin-right: 15px;
  flex-shrink: 0;
}

.step-content h4 {
  color: #e6c84c;
  margin: 0 0 5px;
  font-size: 1.1rem;
}

.step-content p {
  margin: 0;
  color: #ccc;
  font-size: 0.95rem;
}

/* 说明列表 */
.instruction-list {
  padding-left: 20px;
  margin: 15px 0;
}

.instruction-list li {
  margin-bottom: 10px;
  color: #ddd;
}

.instruction-list ul {
  margin: 10px 0;
}

/* 提示框 */
.note-box {
  background-color: rgba(230, 200, 76, 0.05);
  border-left: 3px solid var(--primary-color);
  padding: 15px;
  margin: 20px 0;
  border-radius: 0 4px 4px 0;
}

.note-box p {
  margin: 0;
  color: #ddd;
  font-size: 0.95rem;
}

/* 分析组件 */
.analysis-components {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin: 20px 0;
}

.analysis-item {
  background-color: rgba(255, 255, 255, 0.05);
  padding: 15px;
  border-radius: 6px;
}

.analysis-item h4 {
  color: var(--primary-color);
  margin: 0 0 10px;
  font-size: 1rem;
}

.analysis-item p {
  margin: 0;
  color: #ccc;
  font-size: 0.9rem;
  line-height: 1.5;
}

/* 功能列表 */
.feature-list {
  padding-left: 20px;
  margin: 15px 0;
}

.feature-list li {
  margin-bottom: 10px;
  color: #ddd;
}

/* FAQ样式 */
.faq-item {
  margin-bottom: 25px;
}

.faq-item h4 {
  color: #e6c84c;
  margin: 0 0 10px;
  font-size: 1.1rem;
}

.faq-item p {
  margin: 0;
  color: #ddd;
  line-height: 1.6;
}

/* 响应式调整 */
@media (max-width: 992px) {
  .guide-content {
    margin-left: 0;
    padding: 20px;
  }

  .guide-sidebar {
    position: fixed;
    top: 0;
    left: -250px;
    height: 100vh;
    z-index: 1000;
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.3);
    padding-top: 70px;
    transition: left 0.3s ease;
    background-color: rgba(30, 30, 30, 0.95);
  }

  .guide-sidebar.collapsed {
    left: -60px;
  }

  .guide-sidebar.active {
    left: 0;
  }

  .sidebar-collapsed .guide-content {
    margin-left: 0;
  }
  
  .sidebar-toggle {
    bottom: 100px;
  }

  /* 移动端菜单开关按钮 */
  .mobile-menu-toggle {
    display: flex;
  }
}

@media (max-width: 768px) {
  .feature-box {
    grid-template-columns: 1fr;
  }
  
  .analysis-components {
    grid-template-columns: 1fr;
  }
  
  .guide-section h1 {
    font-size: 1.8rem;
  }
  
  .guide-section h2 {
    font-size: 1.5rem;
  }
  
  .subsection h3 {
    font-size: 1.3rem;
  }
}

/* 移动端菜单按钮样式 */
.mobile-menu-toggle {
  display: none; /* 默认隐藏，移动端通过媒体查询显示 */
  position: fixed;
  top: 80px;
  left: 10px;
  width: 40px;
  height: 40px;
  background-color: rgba(230, 200, 76, 0.2);
  z-index: 1001;
  border-radius: 4px;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(230, 200, 76, 0.3);
  transition: all 0.3s ease;
}

.mobile-menu-toggle:hover {
  background-color: rgba(230, 200, 76, 0.3);
}

.menu-icon {
  width: 20px;
  height: 16px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.menu-icon span {
  display: block;
  width: 100%;
  height: 2px;
  background-color: var(--primary-color);
  border-radius: 1px;
  transition: all 0.3s ease;
}

.menu-icon.active span:nth-child(1) {
  transform: rotate(45deg) translate(5px, 5px);
}

.menu-icon.active span:nth-child(2) {
  opacity: 0;
}

.menu-icon.active span:nth-child(3) {
  transform: rotate(-45deg) translate(5px, -5px);
}
</style> 
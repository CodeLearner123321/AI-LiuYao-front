<template>
  <div class="mobile-test-view">
    <div class="container">
      <h1 class="test-title">移动端布局测试</h1>
      
      <div class="test-section">
        <h2>NavBar 移动端布局测试</h2>
        <p>测试NavBar在移动端是否正确显示为垂直布局，而不是堆积：</p>
        
        <!-- 模拟NavBar布局 -->
        <div class="navbar-test">
          <div class="logo-test">
            <span class="logo-text">爻算云鉴</span>
          </div>
          
          <nav class="nav-links-test">
            <a href="#" class="nav-link-test">首页</a>
            <a href="#" class="nav-link-test">六爻学习</a>
            <a href="#" class="nav-link-test">资料下载</a>
            <a href="#" class="nav-link-test">资料上传</a>
            <a href="#" class="nav-link-test">关于我们</a>
          </nav>
          
          <div class="auth-buttons-test">
            <button class="auth-btn-test">登录</button>
            <button class="auth-btn-test">注册</button>
          </div>
        </div>
      </div>
      
      <div class="test-section">
        <h2>FeatureCards 移动端布局测试</h2>
        <p>测试FeatureCards在移动端是否正确显示为2列布局，而不是竖线排布：</p>
        
        <!-- 模拟FeatureCards布局 -->
        <div class="features-test">
          <div class="feature-card-test">
            <div class="feature-icon">📅</div>
            <h4>使用说明</h4>
            <p>详细了解爻算云鉴的功能和使用方法</p>
            <a href="#" class="feature-link">立即查看 →</a>
          </div>
          
          <div class="feature-card-test">
            <div class="feature-icon">⏱️</div>
            <h4>六爻智能分析</h4>
            <p>基于传统易学理论，结合AI深度学习技术</p>
            <a href="#" class="feature-link">立即尝试 →</a>
          </div>
          
          <div class="feature-card-test">
            <div class="feature-icon">📚</div>
            <h4>传统文化学习</h4>
            <p>提供易经、命理、传统文化知识学习资料</p>
            <a href="#" class="feature-link">了解更多 →</a>
          </div>
          
          <div class="feature-card-test">
            <div class="feature-icon">🔮</div>
            <h4>智能预测</h4>
            <p>基于AI的智能预测和分析功能</p>
            <a href="#" class="feature-link">开始预测 →</a>
          </div>
        </div>
      </div>
      
      <div class="test-section">
        <h2>响应式断点测试</h2>
        <p>当前屏幕宽度：<span class="screen-width">{{ screenWidth }}px</span></p>
        <p>当前断点：<span class="breakpoint">{{ currentBreakpoint }}</span></p>
        
        <div class="breakpoint-info">
          <div class="breakpoint-item">
            <strong>768px以下：</strong> 平板设备，NavBar垂直布局，FeatureCards 2列
          </div>
          <div class="breakpoint-item">
            <strong>480px以下：</strong> 手机设备，NavBar紧凑垂直布局，FeatureCards 2列
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const screenWidth = ref(0)
const currentBreakpoint = ref('')

const updateScreenInfo = () => {
  screenWidth.value = window.innerWidth
  
  if (screenWidth.value <= 480) {
    currentBreakpoint.value = '手机设备 (≤480px)'
  } else if (screenWidth.value <= 768) {
    currentBreakpoint.value = '平板设备 (≤768px)'
  } else {
    currentBreakpoint.value = '桌面设备 (>768px)'
  }
}

onMounted(() => {
  updateScreenInfo()
  window.addEventListener('resize', updateScreenInfo)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateScreenInfo)
})
</script>

<style scoped>
.mobile-test-view {
  min-height: 100vh;
  padding: 20px 0;
  background-color: var(--dark-bg);
  color: var(--light-text);
}

.test-title {
  text-align: center;
  color: var(--primary-color);
  margin-bottom: 40px;
  font-size: 2.5rem;
}

.test-section {
  margin-bottom: 40px;
  padding: 20px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.test-section h2 {
  color: var(--primary-color);
  margin-bottom: 15px;
  font-size: 1.5rem;
}

/* NavBar测试样式 */
.navbar-test {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 30px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-test .logo-text {
  font-size: 20px;
  font-weight: bold;
  color: var(--primary-color);
}

.nav-links-test {
  display: flex;
  gap: 20px;
}

.nav-link-test {
  color: #aaa;
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.nav-link-test:hover {
  color: var(--primary-color);
  background-color: rgba(255, 255, 255, 0.1);
}

.auth-buttons-test {
  display: flex;
  gap: 10px;
}

.auth-btn-test {
  padding: 8px 16px;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.auth-btn-test:first-child {
  background-color: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.auth-btn-test:last-child {
  background-color: var(--primary-color);
  color: var(--dark-bg);
}

/* FeatureCards测试样式 */
.features-test {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.feature-card-test {
  background-color: rgba(255, 255, 255, 0.05);
  padding: 20px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

.feature-icon {
  font-size: 2rem;
  margin-bottom: 15px;
}

.feature-card-test h4 {
  color: var(--primary-color);
  margin-bottom: 10px;
}

.feature-card-test p {
  margin-bottom: 15px;
  line-height: 1.6;
  font-size: 0.9rem;
}

.feature-link {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: bold;
}

/* 断点信息样式 */
.screen-width, .breakpoint {
  color: var(--primary-color);
  font-weight: bold;
}

.breakpoint-info {
  margin-top: 20px;
}

.breakpoint-item {
  padding: 10px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  margin-bottom: 10px;
  border-left: 3px solid var(--primary-color);
}

/* 移动端响应式样式 */
@media (max-width: 768px) {
  .navbar-test {
    flex-direction: column;
    gap: 15px;
    align-items: center;
    padding: 15px 20px;
  }
  
  .logo-test {
    order: 1;
  }
  
  .nav-links-test {
    order: 2;
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
    gap: 15px;
  }
  
  .auth-buttons-test {
    order: 3;
    width: 100%;
    justify-content: center;
  }
  
  .features-test {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
  
  .test-title {
    font-size: 2rem;
  }
  
  .test-section h2 {
    font-size: 1.3rem;
  }
}

@media (max-width: 480px) {
  .navbar-test {
    gap: 12px;
    padding: 12px 15px;
  }
  
  .nav-links-test {
    gap: 8px;
  }
  
  .nav-link-test {
    font-size: 0.85rem;
    padding: 6px 10px;
    min-height: 44px;
    min-width: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .auth-btn-test {
    padding: 6px 12px;
    min-height: 44px;
    min-width: 44px;
  }
  
  .features-test {
    gap: 15px;
  }
  
  .feature-card-test {
    padding: 15px;
  }
  
  .test-title {
    font-size: 1.8rem;
  }
  
  .test-section h2 {
    font-size: 1.2rem;
  }
  
  .test-section {
    padding: 15px;
  }
}
</style>

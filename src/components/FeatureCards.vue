<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

// 跳转到六爻页面
const goToHexagram = () => {
  router.push('/hexagram');
};

// 跳转到使用说明页面
const goToGuide = () => {
  router.push('/guide');
};
</script>

<template>
  <section class="features-section">
    <div class="container">
      <div class="features-grid">
                <!-- 使用说明卡片 -->
        <div class="feature-card" @click="goToGuide">
          <div class="feature-icon">
            <span class="icon">📅</span>
          </div>
          <h3 class="feature-title">使用说明</h3>
          <p class="feature-description">
            详细了解爻算云鉴的功能和使用方法，快速上手六爻分析系统
          </p>
          <a @click.prevent="goToGuide" class="feature-link">立即查看 →</a>
        </div>

        <!-- 六爻智能预测卡片 -->
        <div class="feature-card" @click="goToHexagram">
          <div class="feature-icon">
            <span class="icon">⏱️</span>
          </div>
          <h3 class="feature-title">六爻智能分析</h3>
          <p class="feature-description">
            基于传统易学理论，结合AI深度学习技术，提供准确的六爻分析解读，让古老智慧焕发新生。
          </p>
          <a @click.prevent="goToHexagram" class="feature-link">立即尝试 →</a>
        </div>
      
        
        <!-- 传统文化学习卡片 -->
        <div class="feature-card">
          <div class="feature-icon">
            <span class="icon">📚</span>
          </div>
          <h3 class="feature-title">传统文化学习</h3>
          <p class="feature-description">
            提供易经、命理、传统文化知识学习资料，让您轻松掌握中华传统智慧精髓。
          </p>
          <a href="#" class="feature-link">了解更多 →</a>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.features-section {
  padding: 80px 0;
  background-color: var(--dark-bg);
  width: 100%;
  display: flex;
  justify-content: center;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
  width: 100%;
}

.feature-card {
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 30px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

.feature-icon {
  width: 60px;
  height: 60px;
  background-color: rgba(230, 200, 76, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.icon {
  font-size: 24px;
}

.feature-title {
  font-size: 1.5rem;
  color: var(--primary-color);
  margin-bottom: 15px;
}

.feature-description {
  color: var(--text-light);
  opacity: 0.8;
  margin-bottom: 20px;
  line-height: 1.6;
}

.feature-link {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: bold;
  display: inline-block;
  transition: transform 0.3s ease;
}

.feature-link:hover {
  transform: translateX(5px);
}

@media (max-width: 992px) {
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .feature-card {
    max-width: 500px;
    margin: 0 auto;
  }
}
</style> 
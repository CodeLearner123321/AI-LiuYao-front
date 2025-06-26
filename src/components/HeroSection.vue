<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

// 跳转到六爻页面
const goToHexagram = () => {
  router.push('/hexagram');
};

// 英雄区域组件
</script>

<template>
  <section class="hero-section">
    <div class="container hero-container">
      <h1 class="hero-title">爻算云鉴</h1>
      <p class="hero-subtitle">基于深度学习的人工智能平台，对中国古代决策符号系统进行结构化解析，为公众开放互动式探索功能，以直观数据呈现古代智慧精髓，恪守学术规范，杜绝封建迷信。</p>
      <div class="hero-cta">
        <a @click="goToHexagram" class="btn hero-btn">开始体验</a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero-section {
  padding: 100px 0;
  text-align: center;
  background-color: var(--dark-bg);
  position: relative;
  overflow: hidden;
  width: 100%;
  display: flex;
  justify-content: center;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at center, rgba(230, 200, 76, 0.1) 0%, rgba(30, 30, 30, 0) 70%);
  z-index: 1;
}

.hero-container {
  position: relative;
  z-index: 2;
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  font-size: 3.5rem;
  color: var(--primary-color);
  margin-bottom: 20px;
  font-weight: bold;
}

.hero-subtitle {
  font-size: 1.2rem;
  color: var(--text-light);
  margin-bottom: 40px;
  line-height: 1.6;
  opacity: 0.9;
}

.hero-cta {
  margin-top: 30px;
}

.hero-btn {
  font-size: 1.1rem;
  padding: 12px 30px;
  cursor: pointer;
}

@media (max-width: 768px) {
  .hero-section {
    padding: 80px 0;
  }
  
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-subtitle {
    font-size: 1rem;
  }
}
</style> 
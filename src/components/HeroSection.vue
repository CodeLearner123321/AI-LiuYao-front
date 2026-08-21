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
      <h1 class="hero-title" aria-label="OpenLiuYao">
        <span class="brand-open">Open</span><span class="brand-core">LiuYao</span>
      </h1>
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
  color: transparent;
  background: linear-gradient(100deg, #fff7d7 0%, var(--primary-color) 44%, #c69a34 100%);
  -webkit-background-clip: text;
  background-clip: text;
  margin-bottom: 20px;
  font-weight: 800;
  line-height: 1.05;
  text-shadow: 0 0 28px rgba(230, 200, 76, 0.22);
}

.brand-open {
  font-weight: 650;
}

.brand-core {
  color: inherit;
}

.hero-title::after {
  content: '';
  display: block;
  width: 96px;
  height: 2px;
  margin: 18px auto 0;
  background: linear-gradient(90deg, transparent, rgba(230, 200, 76, 0.86), transparent);
}

.hero-subtitle {
  font-size: 1.2rem;
  color: var(--text-light);
  max-width: 760px;
  width: 100%;
  margin: 0 auto 40px;
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
    padding: 60px 20px;
    width: 100%;
    max-width: 100%;
  }
  
  .hero-container {
    padding: 0 15px;
    width: 100%;
    max-width: 100%;
  }
  
  .hero-title {
    font-size: 2.5rem;
    margin-bottom: 15px;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  
  .hero-subtitle {
    font-size: 1rem;
    margin-bottom: 30px;
    padding: 0 10px;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  
  .hero-btn {
    font-size: 1rem;
    padding: 10px 25px;
    min-height: 44px;
    min-width: 44px;
  }
}

@media (max-width: 480px) {
  .hero-section {
    padding: 50px 15px;
    width: 100%;
    max-width: 100%;
  }
  
  .hero-container {
    padding: 0 10px;
    width: 100%;
    max-width: 100%;
  }
  
  .hero-title {
    font-size: 2rem;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  
  .hero-subtitle {
    font-size: 0.9rem;
    padding: 0 5px;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  
  .hero-btn {
    font-size: 0.9rem;
    padding: 8px 20px;
    min-height: 44px;
    min-width: 44px;
  }
}
</style> 

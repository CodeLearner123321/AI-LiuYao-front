<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const showComingSoonModal = ref(false);

// 跳转到六爻页面
const goToHexagram = () => {
  router.push('/hexagram');
};

// 跳转到使用说明页面
const goToGuide = () => {
  router.push('/guide');
};

// 显示敬请期待弹窗
const showComingSoon = () => {
  showComingSoonModal.value = true;
};

// 关闭弹窗
const closeModal = () => {
  showComingSoonModal.value = false;
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
        <div class="feature-card" @click="showComingSoon">
          <div class="feature-icon">
            <span class="icon">📚</span>
          </div>
          <h3 class="feature-title">传统文化学习</h3>
          <p class="feature-description">
            提供易经、命理、传统文化知识学习资料，让您轻松掌握中华传统智慧精髓。
          </p>
          <a @click.prevent="showComingSoon" class="feature-link">了解更多 →</a>
        </div>
      </div>
    </div>
    
    <!-- 敬请期待弹窗 -->
    <transition name="modal-fade">
      <div v-if="showComingSoonModal" class="modal-overlay" @click.self="closeModal">
        <div class="coming-soon-modal" @click.stop>
          <!-- 顶部光效 -->
          <div class="modal-top-glow"></div>
          
          <!-- 图标区域 -->
          <div class="modal-icon-container">
            <div class="icon-pulse-ring"></div>
            <div class="modal-main-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
          
          <!-- 文字内容 -->
          <div class="modal-content">
            <h2 class="modal-title">敬请期待</h2>
            <p class="modal-description">该功能正在开发中，请期待后续更新。</p>
          </div>
          
          <!-- 按钮 -->
          <button class="modal-confirm-btn" @click="closeModal">
            <span class="btn-glow"></span>
            <span class="btn-text">我知道了</span>
          </button>
        </div>
      </div>
    </transition>
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
  .features-section {
    padding: 60px 20px;
    width: 100%;
    max-width: 100%;
  }
  
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    width: 100%;
    max-width: 100%;
  }
  
  .feature-card {
    max-width: 100%;
    margin: 0 auto;
    padding: 25px 20px;
    width: 100%;
    box-sizing: border-box;
  }
  
  .feature-title {
    font-size: 1.3rem;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  
  .feature-description {
    font-size: 0.9rem;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  
  .feature-link {
    min-height: 44px;
    min-width: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .features-section {
    padding: 50px 15px;
    width: 100%;
    max-width: 100%;
  }
  
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
    width: 100%;
    max-width: 100%;
  }
  
  .feature-card {
    padding: 20px 15px;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }
  
  .feature-title {
    font-size: 1.2rem;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  
  .feature-description {
    font-size: 0.85rem;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  
  .feature-icon {
    width: 50px;
    height: 50px;
  }
  
  .icon {
    font-size: 20px;
  }
  
  .feature-link {
    min-height: 44px;
    min-width: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
  }
}

/* ==================== 敬请期待弹窗样式 ==================== */

/* 遮罩层 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

/* 弹窗主体 */
.coming-soon-modal {
  width: 420px;
  max-width: 90vw;
  background: linear-gradient(145deg, #0a0a0a 0%, #151515 50%, #0a0a0a 100%);
  border-radius: 20px;
  padding: 48px 40px 40px;
  position: relative;
  overflow: hidden;
  box-shadow: 
    0 25px 50px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(255, 215, 0, 0.15),
    0 0 60px rgba(255, 215, 0, 0.08);
  animation: modalSlideUp 0.4s cubic-bezier(0.19, 1, 0.22, 1);
}

@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateY(40px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 顶部光效 */
.modal-top-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 150px;
  background: radial-gradient(ellipse at top, rgba(255, 215, 0, 0.15) 0%, transparent 70%);
  pointer-events: none;
}

/* 图标容器 */
.modal-icon-container {
  width: 80px;
  height: 80px;
  margin: 0 auto 32px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 脉动光环 */
.icon-pulse-ring {
  position: absolute;
  inset: -12px;
  border: 2px solid rgba(255, 215, 0, 0.3);
  border-radius: 50%;
  animation: pulseRing 2s ease-out infinite;
}

@keyframes pulseRing {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.5;
  }
  100% {
    transform: scale(1.3);
    opacity: 0;
  }
}

/* 主图标 */
.modal-main-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 215, 0, 0.08) 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255, 215, 0, 0.25);
  box-shadow: 
    0 8px 24px rgba(255, 215, 0, 0.2),
    inset 0 2px 8px rgba(255, 215, 0, 0.1);
  position: relative;
  z-index: 1;
}

.modal-main-icon svg {
  width: 40px;
  height: 40px;
  color: var(--primary-color);
  filter: drop-shadow(0 2px 8px rgba(255, 215, 0, 0.4));
}

/* 内容区域 */
.modal-content {
  text-align: center;
  margin-bottom: 32px;
}

.modal-title {
  margin: 0 0 16px;
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 1px;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
}

.modal-description {
  margin: 0;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.6;
  letter-spacing: 0.3px;
}

/* 确认按钮 */
.modal-confirm-btn {
  width: 100%;
  padding: 16px 32px;
  background: linear-gradient(135deg, #ffd700 0%, #ffb700 100%);
  border: none;
  border-radius: 12px;
  color: #000;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 
    0 4px 16px rgba(255, 215, 0, 0.3),
    0 2px 4px rgba(0, 0, 0, 0.2);
  letter-spacing: 0.5px;
}

.modal-confirm-btn:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 6px 24px rgba(255, 215, 0, 0.4),
    0 4px 8px rgba(0, 0, 0, 0.3);
}

.modal-confirm-btn:active {
  transform: translateY(0);
}

/* 按钮光效 */
.btn-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, transparent 50%, rgba(255, 255, 255, 0.1) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.modal-confirm-btn:hover .btn-glow {
  opacity: 1;
}

.btn-text {
  position: relative;
  z-index: 1;
}

/* 弹窗动画 */
.modal-fade-enter-active {
  transition: all 0.3s ease;
}

.modal-fade-leave-active {
  transition: all 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .coming-soon-modal {
  transform: translateY(40px) scale(0.95);
}

.modal-fade-leave-to .coming-soon-modal {
  transform: translateY(20px) scale(0.98);
}

/* 响应式优化 */
@media (max-width: 480px) {
  .coming-soon-modal {
    padding: 40px 32px 32px;
    border-radius: 16px;
  }
  
  .modal-icon-container {
    width: 70px;
    height: 70px;
    margin-bottom: 28px;
  }
  
  .modal-main-icon {
    width: 70px;
    height: 70px;
  }
  
  .modal-main-icon svg {
    width: 36px;
    height: 36px;
  }
  
  .modal-title {
    font-size: 24px;
  }
  
  .modal-description {
    font-size: 14px;
  }
  
  .modal-confirm-btn {
    padding: 14px 28px;
    font-size: 15px;
  }
}
</style> 
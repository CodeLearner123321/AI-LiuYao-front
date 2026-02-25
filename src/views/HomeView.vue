<script setup>
import NavBar from '../components/NavBar.vue'
import HeroSection from '../components/HeroSection.vue'
import FeatureCards from '../components/FeatureCards.vue'
</script>

<template>
  <div class="home-view">
    <NavBar />
    <HeroSection />
    <FeatureCards />
    
    <!-- 页脚备案信息 -->
    <footer class="site-footer">
      <div class="footer-content">
        <div class="beian-info">
          <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" class="beian-link">
            工信部备案号：鄂ICP备2025102604号-1
          </a>
          <span class="beian-separator">|</span>
          <a href="http://www.beian.gov.cn/portal/registerSystemInfo" target="_blank" rel="noopener noreferrer" class="beian-link">
            <img src="@/assets/images/beian-icon.svg" alt="公安备案图标" class="beian-icon">
            公安备案号：鄂公网安备42011202002455号
          </a>
        </div>
        <div class="copyright">
          © 2025 爻算云鉴 - 传统文化智能研究平台
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.home-view {
  width: 100%;
  min-height: 100vh;
  min-height: 100svh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.site-footer {
  margin-top: auto;
  padding: 20px 0;
  background-color: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  width: 100%;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  text-align: center;
}

.beian-info {
  margin-bottom: 10px;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
}

.beian-link {
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
  transition: color 0.3s ease;
  display: inline-flex;
  align-items: center;
}

.beian-link:hover {
  color: var(--primary-color);
}

.beian-separator {
  margin: 0 10px;
  color: rgba(255, 255, 255, 0.3);
}

.beian-icon {
  width: 14px;
  height: 14px;
  margin-right: 5px;
}

.copyright {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.4);
}

@media (max-width: 768px) {
  .home-view {
    min-height: 100vh;
    width: 100%;
    max-width: 100%;
  }
  
  .footer-content {
    padding: 0 15px;
    width: 100%;
    max-width: 100%;
  }
  
  .beian-info {
    font-size: 0.8rem;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .beian-separator {
    display: none;
  }
  
  .copyright {
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .home-view {
    width: 100%;
    max-width: 100%;
  }
  
  .footer-content {
    padding: 0 10px;
    width: 100%;
    max-width: 100%;
  }
  
  .beian-info {
    font-size: 0.75rem;
    gap: 6px;
  }
  
  .copyright {
    font-size: 0.75rem;
  }
  
  .beian-icon {
    width: 12px;
    height: 12px;
  }
}
</style> 
<script setup>
import { ref, reactive } from 'vue';

// 测试数据
const testUser = ref({
  username: '13812345678',
  name: '测试用户',
  avatar: null, // 用户头像
  balance: 0 // 用户余额
});

const isLoggedIn = ref(true);
const showFullPhone = ref(false);
const darkMode = ref(true);
const showUserMenu = ref(false); // 控制用户菜单的显示

// 按钮状态
const buttonStates = reactive({
  loading: false,
  disabled: false
});

// 表单数据
const formData = reactive({
  username: '',
  password: '',
  remember: false
});

// 切换登录状态
const toggleLoginStatus = () => {
  isLoggedIn.value = !isLoggedIn.value;
  if (isLoggedIn.value) {
    // 模拟获取用户余额
    fetchUserBalance();
  }
};

// 模拟从后端获取用户余额
const fetchUserBalance = () => {
  // 实际应用中这里会调用API
  setTimeout(() => {
    testUser.value.balance = Math.floor(Math.random() * 10000) / 100; // 生成随机余额
  }, 300);
};

// 模拟登出操作
const handleLogout = () => {
  // 实际应用中这里会调用API
  isLoggedIn.value = false;
  showUserMenu.value = false;
};

// 切换暗黑模式
const toggleDarkMode = () => {
  darkMode.value = !darkMode.value;
  document.documentElement.classList.toggle('dark-theme', darkMode.value);
};

// 模拟加载状态
const simulateLoading = () => {
  buttonStates.loading = true;
  setTimeout(() => {
    buttonStates.loading = false;
  }, 2000);
};

// 初始化时如果用户已登录，获取余额
if (isLoggedIn.value) {
  fetchUserBalance();
}
</script>

<template>
  <div class="component-test" :class="{ 'dark-theme': darkMode }">
    <header class="test-header">
      <h1>组件样式测试页面</h1>
      <div class="theme-toggle">
        <button @click="toggleDarkMode">
          {{ darkMode ? '切换到亮色模式' : '切换到暗色模式' }}
        </button>
      </div>
    </header>

    <div class="test-container">
      <!-- 导航栏测试 -->
      <section class="test-section">
        <h2>导航栏组件</h2>
        <div class="test-navbar">
          <div class="logo">
            <span class="logo-icon">⛩️</span>
            <span class="logo-text">爻算云鉴</span>
          </div>
          
          <nav class="nav-links">
            <a href="#" class="nav-link active">首页</a>
            <a href="#" class="nav-link">六爻学习</a>
            <!-- <a href="#" class="nav-link">传统文化</a> -->
            <a href="#" class="nav-link">关于我们</a>
          </nav>


          
          
          <div class="auth-buttons">
            <template v-if="!isLoggedIn">
              <div class="auth-actions">
                <router-link to="/login" class="auth-btn login-btn">
                  <i class="auth-icon">🔑</i>
                  <span>登录</span>
                </router-link>
                <router-link to="/register" class="auth-btn register-btn">
                  <i class="auth-icon">✨</i>
                  <span>注册</span>
                </router-link>
              </div>
            </template>
            <template v-else>
              <div class="avatar-menu-container" @mouseleave="showUserMenu = false">
                <div class="avatar-wrapper" @mouseenter="showUserMenu = true" @click="showUserMenu = !showUserMenu">
                  <div class="avatar-circle" :class="{ 'avatar-circle-active': showUserMenu }">
                    <template v-if="testUser.avatar">
                      <img :src="testUser.avatar" alt="用户头像" class="user-avatar" />
                    </template>
                    <template v-else>
                      <div class="avatar-placeholder">
                        {{ testUser.name.substring(0, 1).toUpperCase() }}
                      </div>
                    </template>
                    <div class="online-indicator"></div>
                  </div>
                </div>
                
                <div class="user-dropdown-menu" :class="{ 'show-menu': showUserMenu }">
                  <div class="menu-header">
                    <div class="user-info">
                      <h3 class="user-name">{{ testUser.name }}</h3>
                      <p class="user-id">ID: {{ testUser.username.substring(0, 3) }}****{{ testUser.username.substring(9) }}</p>
                    </div>
                  </div>
                  
                  <div class="menu-balance">
                    <div class="balance-label">
                      <i class="balance-icon">💰</i>
                      <span>我的余额</span>
                    </div>
                    <div class="balance-amount">
                      <span>{{ testUser.balance.toFixed(2) }}</span>
                      <span class="currency">元</span>
                    </div>
                  </div>
                  
                  <div class="menu-divider"></div>
                  
                  <div class="menu-items">
                    <div class="menu-item" @click="$router.push('/account/settings')">
                      <i class="menu-icon">⚙️</i>
                      <span class="menu-text">账号设置</span>
                      <i class="menu-arrow">→</i>
                    </div>
                    
                    <div class="menu-item" @click="$router.push('/account/history')">
                      <i class="menu-icon">📜</i>
                      <span class="menu-text">历史记录</span>
                      <i class="menu-arrow">→</i>
                    </div>
                  </div>
                  
                  <div class="menu-divider"></div>
                  
                  <div class="menu-footer">
                    <button class="logout-button" @click="handleLogout">
                      <i class="logout-icon">🚪</i>
                      <span>退出登录</span>
                    </button>
                  </div>
                </div>
              </div>
            </template>
          </div>
          
        </div>
        <div class="test-controls">
          <button @click="toggleLoginStatus">
            {{ isLoggedIn ? '切换到未登录状态' : '切换到已登录状态' }}
          </button>
        </div>
      </section>

      <!-- 按钮测试 -->
      <section class="test-section">
        <h2>按钮组件</h2>
        <div class="button-container">
          <button class="primary-btn">主要按钮</button>
          <button class="secondary-btn">次要按钮</button>
          <button class="outline-btn">边框按钮</button>
          <button class="text-btn">文本按钮</button>
          <button class="danger-btn">危险按钮</button>
          <button class="primary-btn" :class="{ 'loading': buttonStates.loading }" @click="simulateLoading">
            {{ buttonStates.loading ? '加载中...' : '点击加载' }}
          </button>
          <button class="primary-btn" disabled>禁用按钮</button>
        </div>
      </section>

      <!-- 表单测试 -->
      <section class="test-section">
        <h2>表单组件</h2>
        <div class="form-container">
          <div class="form-group">
            <label for="username">用户名</label>
            <div class="input-container">
              <span class="input-icon">👤</span>
              <input 
                type="text" 
                id="username"
                v-model="formData.username" 
                placeholder="请输入用户名或手机号"
              >
            </div>
          </div>
          
          <div class="form-group">
            <label for="password">密码</label>
            <div class="input-container">
              <span class="input-icon">🔒</span>
              <input 
                type="password" 
                id="password"
                v-model="formData.password" 
                placeholder="请输入密码"
              >
              <span class="toggle-password">👁️</span>
            </div>
          </div>
          
          <div class="form-options">
            <div class="remember-me">
              <input type="checkbox" id="remember" v-model="formData.remember">
              <label for="remember">记住我</label>
            </div>
            <a href="#" class="forgot-password">忘记密码?</a>
          </div>
          
          <button class="submit-btn">提交</button>
        </div>
      </section>

      <!-- 卡片测试 -->
      <section class="test-section">
        <h2>卡片组件</h2>
        <div class="cards-container">
          <div class="card">
            <div class="card-icon">🔮</div>
            <h3 class="card-title">六爻智能预测</h3>
            <p class="card-description">
              基于传统易学理论，结合AI深度学习技术，提供准确的六爻预测解读，让古老智慧焕发新生。
            </p>
            <a href="#" class="card-link">立即尝试 →</a>
          </div>
          
          <div class="card">
            <div class="card-icon">📊</div>
            <h3 class="card-title">八字命理分析</h3>
            <p class="card-description">
              根据您的出生年月日时，智能分析五行旺衰，事业财运，婚姻健康等方面的命理信息。
            </p>
            <a href="#" class="card-link">立即尝试 →</a>
          </div>
          
          <div class="card">
            <div class="card-icon">📚</div>
            <h3 class="card-title">传统文化学习</h3>
            <p class="card-description">
              提供易经、命理、传统文化知识学习资料，让您轻松掌握中华传统智慧精髓。
            </p>
            <a href="#" class="card-link">了解更多 →</a>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
:root {
  --primary-color: #ffd700;
  --primary-color-hover: #ffdf4d;
}

.component-test {
  min-height: 100vh;
  min-height: 100svh;
  min-height: 100dvh;
  background-color: #f5f5f5;
  color: #333;
  padding-bottom: 50px;
  --primary-color: #ffd700;
  --primary-color-hover: #ffdf4d;
}

.component-test.dark-theme {
  background-color: #1a1a1a;
  color: #eee;
  --primary-color: #ffd700;
  --primary-color-hover: #ffdf4d;
}

.test-header {
  padding: 20px;
  background-color: #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dark-theme .test-header {
  background-color: #222;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.test-header h1 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.dark-theme .test-header h1 {
  color: #eee;
}

.theme-toggle button {
  padding: 8px 16px;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.test-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.test-section {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 30px;
}

.dark-theme .test-section {
  background-color: #222;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.test-section h2 {
  margin-top: 0;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
  color: #333;
}

.dark-theme .test-section h2 {
  border-bottom: 1px solid #333;
  color: #eee;
}

.test-controls {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

.test-controls button {
  padding: 8px 16px;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* 导航栏样式 */
.test-navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: #222;
  border-radius: 4px;
}

.logo {
  display: flex;
  align-items: center;
}

.logo-icon {
  font-size: 24px;
  margin-right: 8px;
  color: #ffd700;
}

.logo-text {
  font-size: 20px;
  font-weight: bold;
  color: #ffd700;
}

.nav-links {
  display: flex;
  gap: 20px;
}

.nav-link {
  color: #aaa;
  text-decoration: none;
  transition: color 0.3s ease;
}

.nav-link.active, .nav-link:hover {
  color: #ffd700;
}

.auth-buttons {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 按钮样式 */
.button-container {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.primary-btn, .secondary-btn, .outline-btn, .text-btn, .danger-btn {
  padding: 10px 20px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.primary-btn {
  background-color: #ffd700;
  color: #222;
}

.secondary-btn {
  background-color: #4a90e2;
  color: white;
}

.outline-btn {
  background-color: transparent;
  border: 1px solid #ffd700;
  color: #ffd700;
}

.text-btn {
  background-color: transparent;
  color: #ffd700;
  padding: 10px 0;
}

.danger-btn {
  background-color: #ff5757;
  color: white;
}

.primary-btn:hover, .secondary-btn:hover, .danger-btn:hover {
  opacity: 0.9;
}

.outline-btn:hover {
  background-color: rgba(255, 215, 0, 0.1);
}

.text-btn:hover {
  text-decoration: underline;
}

.primary-btn:disabled, .secondary-btn:disabled, .outline-btn:disabled, .text-btn:disabled, .danger-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.primary-btn.loading {
  position: relative;
  color: transparent;
}

.primary-btn.loading::after {
  content: "";
  position: absolute;
  width: 16px;
  height: 16px;
  top: 50%;
  left: 50%;
  margin-top: -8px;
  margin-left: -8px;
  border-radius: 50%;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-top-color: #222;
  animation: spin 1s infinite linear;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 表单样式 */
.form-container {
  max-width: 400px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #333;
}

.dark-theme .form-group label {
  color: #eee;
}

.input-container {
  display: flex;
  align-items: center;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0 15px;
  position: relative;
}

.dark-theme .input-container {
  background-color: #333;
  border: 1px solid #444;
}

.input-icon {
  margin-right: 10px;
  font-size: 18px;
  color: #666;
}

.input-container input {
  width: 100%;
  padding: 12px 0;
  background-color: transparent;
  border: none;
  color: #333;
  font-size: 14px;
}

.dark-theme .input-container input {
  color: #fff;
}

.input-container input:focus {
  outline: none;
}

.input-container input::placeholder {
  color: #999;
}

.toggle-password {
  cursor: pointer;
  color: #666;
  font-size: 18px;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #666;
  font-size: 14px;
}

.dark-theme .remember-me {
  color: #aaa;
}

.forgot-password {
  color: #4a90e2;
  font-size: 14px;
  text-decoration: none;
}

.submit-btn {
  width: 100%;
  padding: 12px;
  background-color: #ffd700;
  color: #222;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  text-align: center;
  transition: all 0.3s ease;
}

.submit-btn:hover {
  opacity: 0.9;
}

/* 卡片样式 */
.cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  padding: 25px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.dark-theme .card {
  background-color: #2a2a2a;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.dark-theme .card:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
}

.card-icon {
  font-size: 36px;
  margin-bottom: 15px;
}

.card-title {
  font-size: 18px;
  margin-bottom: 10px;
  color: #333;
}

.dark-theme .card-title {
  color: #eee;
}

.card-description {
  color: #666;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 20px;
}

.dark-theme .card-description {
  color: #aaa;
}

.card-link {
  color: #ffd700;
  text-decoration: none;
  font-weight: bold;
  display: inline-block;
  transition: transform 0.3s ease;
}

.card-link:hover {
  transform: translateX(5px);
}

/* 覆盖冲突的登录/注册按钮样式 */
.auth-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.auth-actions .auth-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 24px;
  font-weight: 500;
  font-size: 14px;
  text-decoration: none;
  transition: all 0.3s ease;
}

.auth-actions .login-btn {
  background-color: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
}

.auth-actions .register-btn {
  background-color: #ffd700;
  border: none;
  color: #222;
  box-shadow: 0 2px 8px rgba(255, 193, 7, 0.3);
}

.auth-actions .login-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
  opacity: 1;
}

.auth-actions .register-btn:hover {
  background-color: #ffdf4d;
  opacity: 1;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 193, 7, 0.4);
}

.auth-icon {
  font-style: normal;
}

/* 已登录用户的头像菜单 */
.avatar-menu-container {
  position: relative;
  z-index: 100;
}

.avatar-wrapper {
  position: relative;
  cursor: pointer;
}

.avatar-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffd700, #ffaf3f);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  border: 2px solid transparent;
}

.avatar-circle-active {
  border-color: #fff;
  transform: scale(1.05);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.avatar-circle:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.user-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  font-weight: bold;
  font-size: 18px;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.online-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #4caf50;
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 0 4px rgba(76, 175, 80, 0.6);
}

/* 下拉菜单 */
.user-dropdown-menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 280px;
  background-color: #2a2a2a;
  border-radius: 10px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
  visibility: hidden;
  transition: all 0.3s cubic-bezier(0.17, 0.67, 0.83, 0.67);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 1000;
}

.user-dropdown-menu:before {
  content: "";
  position: absolute;
  top: -6px;
  right: 16px;
  width: 12px;
  height: 12px;
  background-color: #2a2a2a;
  transform: rotate(45deg);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
}

.show-menu {
  opacity: 1;
  transform: translateY(0) scale(1);
  visibility: visible;
}

.menu-header {
  padding: 20px 20px 10px;
}

.user-info {
  text-align: center;
}

.user-name {
  font-weight: 600;
  margin: 0 0 5px;
  font-size: 16px;
  color: #fff;
}

.user-id {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

.menu-balance {
  padding: 15px 20px;
  background-color: rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 10px 0;
}

.balance-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

.balance-icon {
  font-style: normal;
}

.balance-amount {
  font-weight: bold;
  color: #ffd700;
  font-size: 16px;
}

.currency {
  font-size: 12px;
  margin-left: 2px;
  opacity: 0.8;
}

.menu-divider {
  height: 1px;
  background-color: rgba(255, 255, 255, 0.1);
  margin: 5px 0;
}

.menu-items {
  padding: 10px 0;
}

.menu-item {
  padding: 12px 20px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.menu-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.menu-icon {
  font-style: normal;
  margin-right: 12px;
  font-size: 16px;
}

.menu-text {
  flex: 1;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.menu-arrow {
  font-style: normal;
  color: rgba(255, 255, 255, 0.3);
  font-size: 12px;
  transition: transform 0.2s ease;
}

.menu-item:hover .menu-arrow {
  transform: translateX(3px);
  color: rgba(255, 255, 255, 0.6);
}

.menu-footer {
  padding: 15px 20px;
}

.logout-button {
  width: 100%;
  padding: 10px;
  border: none;
  background-color: rgba(255, 59, 48, 0.1);
  color: #ff3b30;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.logout-button:hover {
  background-color: rgba(255, 59, 48, 0.2);
}

.logout-icon {
  font-style: normal;
}

@media (max-width: 768px) {
  .auth-btn span {
    display: none;
  }
  
  .auth-btn {
    padding: 8px;
  }
  
  .auth-icon {
    font-size: 16px;
  }
  
  .user-dropdown-menu {
    width: 250px;
    right: -10px;
  }
}
</style> 
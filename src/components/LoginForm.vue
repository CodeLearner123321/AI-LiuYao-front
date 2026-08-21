<script setup>
import { ref, computed, reactive } from 'vue';
import { login } from '../services/api';
import { useRouter } from 'vue-router';
import { userStateHMR } from '../services/hmrService';
import { loadPermissions } from '../composables/usePermissions';

const router = useRouter();
const username = ref('');
const password = ref('');
const rememberMe = ref(false);
const loading = ref(false);
const error = ref('');
const showPassword = ref(false);

// 表单验证
const validateForm = () => {
  if (!username.value) {
    error.value = '请输入用户名或手机号';
    return false;
  }
  if (!password.value) {
    error.value = '请输入密码';
    return false;
  }
  return true;
};

// 登录
const handleLogin = async () => {
  error.value = '';
  
  if (!validateForm()) {
    return;
  }
  
  loading.value = true;
  
  try {
    const userData = {
      username: username.value,
      password: password.value
    };
    
    const response = await login(userData);
    console.log('登录响应:', response);

    if (response.success && response.data && response.data.token) {
      console.log('登录成功，开始更新用户状态');
      // 使用热更新服务更新用户状态
      localStorage.setItem('token', response.data.token);
      
      // 添加手动清除声明接受状态（仅用于测试）
      const shouldForceShow = true; // 设置为true强制显示声明
      if (shouldForceShow) {
        console.log('为测试目的重置声明状态');
        localStorage.removeItem('disclaimerAccepted');
      }
      
      // 更新用户状态
      const userData = response.data || { username: response.data.username };
      console.log('更新用户状态为:', userData);
      userStateHMR.updateUserState(userData);
      console.log('用户状态已更新，准备跳转到首页');
      
      // 获取用户权限信息
      try {
        await loadPermissions();
        console.log('用户权限信息已加载');
      } catch (permissionError) {
        console.error('加载权限信息失败:', permissionError);
      }
      
      // 手动分发登录成功事件
      window.dispatchEvent(new Event('login-success'));
      
      // 延迟后手动调用声明检查器（作为备用）
      setTimeout(() => {
        console.log('延迟执行：调用全局声明检查器');
        if (typeof window.checkLoginAndShowDisclaimer === 'function') {
          window.checkLoginAndShowDisclaimer();
        }
      }, 1000);
      
      // 登录成功，直接跳转到首页
      router.push('/');
    } else {
      if (response.msg) {
        error.value = response.msg;
      } else {
        error.value = response.message || '登录失败，请重试';
      }
    }
  } catch (err) {
    console.log('登录错误err:', err);
    if (err.errors) {
      // 处理表单验证错误
      const errorMessages = [];
      for (const key in err.errors) {
        errorMessages.push(err.errors[key]);
      }
      error.value = errorMessages.join(', ');
    } else if (err.message) {
      error.value = err.message;
    } else if (err.error) {
      error.value = err.error;
    } else {
      error.value = '登录失败，请重试';
    }
  } finally {
    loading.value = false;
  }
};

// 切换密码显示状态
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};
</script>

<template>
  <div class="login-container">
    <div class="login-box">
      <div class="logo-container">
        <img src="/images/favicon.png" alt="logo" class="logo-icon">
        <span class="logo-text">OpenLiuYao</span>
      </div>
      
      <h2 class="login-title">欢迎回来</h2>
      <p class="login-subtitle">登录您的OpenLiuYao账号，探索传统文化的智慧</p>
      
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      
      <div class="login-form">
        <div class="form-group">
          <div class="input-container">
            <span class="input-icon">👤</span>
            <input 
              type="text" 
              v-model="username" 
              placeholder="请输入账号"
              @keyup.enter="handleLogin"
            >
          </div>
        </div>
        
        <div class="form-group">
          <div class="input-container">
            <span class="input-icon">🔒</span>
            <input 
              :type="showPassword ? 'text' : 'password'" 
              v-model="password" 
              placeholder="请输入密码"
              @keyup.enter="handleLogin"
            >
            <span 
              class="toggle-password" 
              @click="togglePasswordVisibility"
            >
              👁️
            </span>
          </div>
        </div>
        
        <div class="form-options">
          <div class="remember-me">
            <input type="checkbox" id="remember" v-model="rememberMe">
            <label for="remember">记住我</label>
          </div>
          <a href="javascript:void(0)" class="forgot-password" @click="router.push('/account/change-password')">忘记密码?</a>
        </div>
      </div>
      
      <button 
        class="login-btn" 
        @click="handleLogin" 
        :disabled="loading"
      >
        {{ loading ? '登录中...' : '登录' }}
      </button>
      
      <div class="register-link">
        还没有账号？ <a href="javascript:void(0)" @click="router.push('/register')">立即注册</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  min-height: 100svh;
  min-height: 100dvh;
  padding: 20px;
  background-color: var(--dark-bg);
}

.login-box {
  width: 100%;
  max-width: 400px;
  background-color: #2a2a2a;
  border-radius: 8px;
  padding: 40px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.logo-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
}

.logo-icon {
  width: 28px;
  height: 28px;
  margin-right: 10px;
  color: var(--primary-color);
}

.logo-text {
  font-size: 28px;
  font-weight: 800;
  line-height: 1;
  color: transparent;
  background: linear-gradient(100deg, #fff5c7 0%, var(--primary-color) 55%, #c69a34 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 18px rgba(230, 200, 76, 0.18);
}

.login-title {
  font-size: 24px;
  color: var(--primary-color);
  text-align: center;
  margin-bottom: 10px;
}

.login-subtitle {
  font-size: 14px;
  color: #aaa;
  text-align: center;
  margin-bottom: 30px;
}

.error-message {
  background-color: rgba(255, 87, 87, 0.1);
  color: #ff5757;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
  font-size: 14px;
  text-align: center;
}

.login-form {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.input-container {
  display: flex;
  align-items: center;
  background-color: #333;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 0 15px;
  position: relative;
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
  color: #fff;
  font-size: 14px;
}

.input-container input:focus {
  outline: none;
}

.input-container input::placeholder {
  color: #666;
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
  color: #aaa;
  font-size: 14px;
}

.forgot-password {
  color: var(--primary-color);
  font-size: 14px;
  text-decoration: none;
}

.login-btn {
  width: 100%;
  padding: 12px;
  background-color: var(--primary-color);
  color: var(--dark-bg);
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  text-align: center;
  transition: all 0.3s ease;
}

.login-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.register-link {
  text-align: center;
  margin-top: 20px;
  color: #aaa;
  font-size: 14px;
}

.register-link a {
  color: var(--primary-color);
  text-decoration: none;
}

@media (max-width: 480px) {
  .login-box {
    padding: 30px 20px;
  }
}
</style> 

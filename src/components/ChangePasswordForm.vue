<script setup>
import { ref, computed } from 'vue';
import { updatePassword, sendEmailCode, logout } from '../services/api';
import { useRouter } from 'vue-router';

const router = useRouter();
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const verificationCode = ref('');
const loading = ref(false);
const error = ref('');
const success = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const countDown = ref(0);
const showSuccessDialog = ref(false); // 控制成功弹框显示
const returnedUsername = ref(''); // 存储接口返回的用户名

const codeButtonText = computed(() => {
  if (countDown.value === -1) return '发送中...';
  return countDown.value > 0 ? `${countDown.value}秒后重新发送` : '发送验证码';
});

// 发送验证码
const sendVerificationCode = async () => {
  error.value = '';
  
  if (!email.value) {
    error.value = '请输入邮箱';
    return;
  }
  // 邮箱格式验证
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email.value)) {
    error.value = '请输入有效的邮箱';
    return;
  }
  
  // 如果正在倒计时，则不允许再次发送
  if (countDown.value > 0) {
    return;
  }
  
  try {
    // 显示发送中状态
    countDown.value = -1; // 使用-1表示发送中状态
    
    // 调用发送验证码API，明确指定requestType为UPDATE
    const response = await sendEmailCode(email.value, "UPDATE");
    
    if (response.code === 0 || response.code === 200) {
      // 开始倒计时
      countDown.value = 60; // 设置60秒倒计时
      const timer = setInterval(() => {
        countDown.value--;
        if (countDown.value <= 0) {
          clearInterval(timer);
          countDown.value = 0; // 确保倒计时结束后为0
        }
      }, 1000);
    } else {
      // 发送失败，重置倒计时
      countDown.value = 0;
      error.value = response.msg || '验证码发送失败';
    }
  } catch (err) {
    // 发送失败，重置倒计时
    countDown.value = 0;
    error.value = err.message || '验证码发送失败，请稍后再试';
  }
};

// 表单验证
const validateForm = () => {
  if (!email.value) {
    error.value = '请输入邮箱';
    return false;
  }
  // 邮箱格式验证
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email.value)) {
    error.value = '请输入有效的邮箱';
    return false;
  }
  if (!password.value) {
    error.value = '请输入新密码';
    return false;
  }
  if (password.value.length < 6 || password.value.length > 20) {
    error.value = '密码长度应为6-20个字符';
    return false;
  }
  if (password.value !== confirmPassword.value) {
    error.value = '两次输入的密码不一致';
    return false;
  }
  if (!verificationCode.value) {
    error.value = '请输入验证码';
    return false;
  }
  if (!/^\d{6}$/.test(verificationCode.value)) {
    error.value = '验证码必须是6位数字';
    return false;
  }
  return true;
};

// 清除登录状态并跳转到登录页
const clearLoginAndRedirect = () => {
  // 清除登录状态
  localStorage.removeItem('token');
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('user');
  localStorage.removeItem('tokenTimestamp');
  
  // 跳转到登录页
  router.push('/login');
};

// 关闭成功弹窗并跳转
const closeSuccessDialog = () => {
  showSuccessDialog.value = false;
  clearLoginAndRedirect();
};

// 修改密码
const handleUpdatePassword = async () => {
  error.value = '';
  success.value = '';
  
  if (!validateForm()) {
    return;
  }
  
  loading.value = true;
  
  try {
    const updateData = {
      email: email.value,
      newPassword: password.value,
      authCode: verificationCode.value
    };
    
    const response = await updatePassword(updateData);
    
    if (response.code === 0 || response.code === 200) {
      // 存储接口返回的用户名，用于在弹框中显示
      returnedUsername.value = response.data || '未知用户名';
      
      // 显示成功弹框，不再自动跳转
      showSuccessDialog.value = true;
      
      // 清空表单
      email.value = '';
      password.value = '';
      confirmPassword.value = '';
      verificationCode.value = '';
    } else {
      error.value = response.msg || '密码修改失败，请重试';
    }
  } catch (err) {
    console.error('修改密码错误', err);
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
      error.value = '修改密码失败，请重试';
    }
  } finally {
    loading.value = false;
  }
};

// 切换密码显示状态
const togglePasswordVisibility = (field) => {
  if (field === 'password') {
    showPassword.value = !showPassword.value;
  } else if (field === 'confirmPassword') {
    showConfirmPassword.value = !showConfirmPassword.value;
  }
};
</script>

<template>
  <div class="change-password-container">
    <div class="change-password-box">
      <div class="logo-container">
        <img src="/images/favicon.png" alt="logo" class="logo-icon">
        <span class="logo-text">爻算云鉴</span>
      </div>
      
      <h2 class="change-password-title">修改密码</h2>
      
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      
      <div v-if="success" class="success-message">
        {{ success }}
      </div>
      
      <div class="change-password-form">
        <div class="form-group">
          <div class="input-container">
            <span class="input-icon">📧</span>
            <input 
              type="text" 
              v-model="email" 
              placeholder="请输入邮箱"
              @keyup.enter="handleUpdatePassword"
            >
          </div>
        </div>
        
        <div class="form-group">
          <div class="input-container">
            <span class="input-icon">🔒</span>
            <input 
              :type="showPassword ? 'text' : 'password'" 
              v-model="password" 
              placeholder="请输入新密码"
              @keyup.enter="handleUpdatePassword"
            >
            <span 
              class="toggle-password" 
              @click="togglePasswordVisibility('password')"
            >
              👁️
            </span>
          </div>
        </div>
        
        <div class="form-group">
          <div class="input-container">
            <span class="input-icon">🔒</span>
            <input 
              :type="showConfirmPassword ? 'text' : 'password'" 
              v-model="confirmPassword" 
              placeholder="请再次输入新密码"
              @keyup.enter="handleUpdatePassword"
            >
            <span 
              class="toggle-password" 
              @click="togglePasswordVisibility('confirmPassword')"
            >
              👁️
            </span>
          </div>
        </div>
        
        <div class="form-group">
          <div class="input-container verification-container">
            <span class="input-icon">🔑</span>
            <input 
              type="text" 
              v-model="verificationCode" 
              placeholder="请输入邮箱验证码"
              @keyup.enter="handleUpdatePassword"
            >
            <button 
              class="send-code-btn" 
              :disabled="countDown !== 0"
              @click="sendVerificationCode"
              :class="{'sending': countDown === -1, 'counting': countDown > 0}"
            >
              {{ codeButtonText }}
            </button>
          </div>
        </div>
      </div>
      
      <button 
        class="change-password-btn" 
        @click="handleUpdatePassword"
        :disabled="loading"
      >
        {{ loading ? '提交中...' : '修改密码' }}
      </button>
      
      <div class="back-link">
        <a href="javascript:void(0)" @click="router.go(-1)">返回</a>
      </div>
    </div>
    
    <!-- 成功弹框 -->
    <div class="success-dialog-overlay" v-if="showSuccessDialog" @click.self="closeSuccessDialog">
      <div class="success-dialog" @click.stop>
        <div class="success-dialog-header">
          <span class="success-icon">✅</span>
          <h3 class="success-title">密码修改成功</h3>
        </div>
        <div class="success-dialog-content">
          <p>您的用户名为：<span class="username-text">{{ returnedUsername }}</span></p>
          <p class="success-tip">请使用新密码登录系统</p>
        </div>
        <div class="success-dialog-footer">
          <button class="confirm-btn" @click="closeSuccessDialog">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.change-password-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background-color: var(--dark-bg);
}

.change-password-box {
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
}

.logo-text {
  font-size: 28px;
  font-weight: bold;
  color: var(--primary-color);
}

.change-password-title {
  font-size: 24px;
  color: var(--primary-color);
  text-align: center;
  margin-bottom: 30px;
  font-weight: 600;
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

.success-message {
  background-color: rgba(87, 255, 87, 0.1);
  color: #57ff57;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
  font-size: 14px;
  text-align: center;
}

.change-password-form {
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

.verification-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.send-code-btn {
  flex-shrink: 0;
  padding: 0 15px;
  height: 36px;
  margin: 5px 0;
  min-width: 120px;
  background-color: var(--primary-color);
  color: var(--dark-bg);
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  position: relative;
  overflow: hidden;
}

.send-code-btn:hover:not(:disabled) {
  background-color: rgba(230, 200, 76, 0.8);
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.send-code-btn:disabled {
  background-color: #555;
  color: #888;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.send-code-btn.sending {
  background-color: #777;
  color: #fff;
  animation: pulse 1.5s infinite;
}

.send-code-btn.counting {
  background-color: #555;
  color: #ddd;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
}

.change-password-btn {
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

.change-password-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.change-password-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.back-link {
  text-align: center;
  margin-top: 20px;
  color: #aaa;
  font-size: 14px;
}

.back-link a {
  color: var(--primary-color);
  text-decoration: none;
}

/* 成功弹框样式 */
.success-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(3px);
}

.success-dialog {
  width: 320px;
  background: linear-gradient(145deg, #1a1a1a, #2a2a2a);
  border-radius: 10px;
  padding: 30px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3),
              0 0 0 1px rgba(255, 215, 0, 0.1);
  animation: fadeIn 0.3s ease-out;
  border-bottom: 2px solid var(--primary-color);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.success-dialog-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.success-icon {
  font-size: 36px;
  margin-bottom: 10px;
  display: block;
}

.success-title {
  font-size: 20px;
  color: var(--primary-color);
  margin: 0;
  text-align: center;
}

.success-dialog-content {
  text-align: center;
  margin-bottom: 25px;
}

.username-text {
  font-weight: bold;
  color: var(--primary-color);
  font-size: 16px;
  display: inline-block;
  margin-top: 5px;
}

.success-tip {
  margin-top: 15px;
  font-size: 14px;
  color: #aaa;
}

.success-dialog-footer {
  display: flex;
  justify-content: center;
}

.confirm-btn {
  padding: 10px 30px;
  background-color: var(--primary-color);
  color: #222;
  border: none;
  border-radius: 4px;
  font-size: 15px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.confirm-btn:hover {
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

@media (max-width: 480px) {
  .change-password-box {
    padding: 30px 20px;
  }
  
  .success-dialog {
    width: 85%;
    padding: 25px 20px;
  }
}
</style> 
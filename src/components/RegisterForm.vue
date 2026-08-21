<script setup>
import { ref, computed } from 'vue';
import { register, sendEmailCode } from '../services/api';
import { useRouter } from 'vue-router';

const router = useRouter();
const email = ref('');
const account = ref('');
const password = ref('');
const confirmPassword = ref('');
const verificationCode = ref('');
const agreeTerms = ref(false);
const loading = ref(false);
const error = ref('');
const success = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const countDown = ref(0);

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
    
    // 调用发送验证码API，明确指定requestType为SIGN_IN
    const response = await sendEmailCode(email.value, "SIGN_IN");
    
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
  if (!account.value) {
    error.value = '请输入账号';
    return false;
  }
  if (!/^[a-zA-Z0-9.]{4,20}$/.test(account.value)) {
    error.value = '账号长度为4-20字符，只能包含大小写英文、数字和点(.)';
    return false;
  }
  if (!password.value) {
    error.value = '请输入密码';
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
  if (!agreeTerms.value) {
    error.value = '请阅读并同意用户协议和隐私政策';
    return false;
  }
  return true;
};

// 注册
const handleRegister = async () => {
  error.value = '';
  success.value = '';
  
  if (!validateForm()) {
    return;
  }
  
  loading.value = true;
  
  try {
    const userData = {
      email: email.value,
      userName: account.value,
      passWord: password.value,
      authCode: verificationCode.value
    };
    
    const response = await register(userData);
    
    if (response.code === 0 || response.code === 200) {
      success.value = '注册成功！正在跳转到登录页面...';
      // 清空表单
      email.value = '';
      account.value = '';
      password.value = '';
      confirmPassword.value = '';
      verificationCode.value = '';
      agreeTerms.value = false;
      
      // 3秒后跳转到登录页
      setTimeout(() => {
        // 使用路由导航替代直接更改location
        router.push('/login');
      }, 3000);
    } else {
      error.value = response.msg || '注册失败，请重试';
    }
  } catch (err) {
    console.error('注册错误', err);
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
      error.value = '注册失败，请重试';
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
  <div class="register-container">
    <div class="register-box">
      <div class="logo-container">
        <img src="/images/favicon.png" alt="logo" class="logo-icon">
        <span class="logo-text">OpenLiuYao</span>
      </div>
      
      <h2 class="register-title">您所在地区仅支持邮箱注册</h2>
      
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      
      <div v-if="success" class="success-message">
        {{ success }}
      </div>
      
      <div class="register-form">
        <div class="form-group">
          <div class="input-container">
            <span class="input-icon">📧</span>
            <input 
              type="text" 
              v-model="email" 
              placeholder="请输入邮箱"
              @keyup.enter="handleRegister"
            >
          </div>
        </div>
        
        <div class="form-group">
          <div class="input-container">
            <span class="input-icon">👤</span>
            <input 
              type="text" 
              v-model="account" 
              placeholder="请输入账号(4-20字符，只能包含英文、数字和.)"
              @keyup.enter="handleRegister"
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
              @keyup.enter="handleRegister"
            >
            <span 
              class="toggle-password" 
              @click="togglePasswordVisibility('password')"
            >
            </span>
          </div>
        </div>
        
        <div class="form-group">
          <div class="input-container">
            <span class="input-icon">🔒</span>
            <input 
              :type="showConfirmPassword ? 'text' : 'password'" 
              v-model="confirmPassword" 
              placeholder="请再次输入密码"
              @keyup.enter="handleRegister"
            >
            <span 
              class="toggle-password" 
              @click="togglePasswordVisibility('confirmPassword')"
            >
              
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
              @keyup.enter="handleRegister"
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
        
        <div class="form-options">
          <div class="agree-terms">
            <input type="checkbox" id="agree" v-model="agreeTerms">
            <label for="agree">我已阅读并同意<a href="#" class="terms-link">用户协议</a> 与 <a href="#" class="terms-link">隐私政策</a></label>
          </div>
        </div>
      </div>
      
      <button 
        class="register-btn" 
        @click="handleRegister"
        :disabled="loading"
      >
        {{ loading ? '注册中...' : '注册' }}
      </button>
      
      <div class="login-link">
        已有账号？ <a href="javascript:void(0)" @click="router.push('/login')">返回登录</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  min-height: 100svh;
  min-height: 100dvh;
  padding: 20px;
  background-color: var(--dark-bg);
}

.register-box {
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
  font-weight: 800;
  line-height: 1;
  color: transparent;
  background: linear-gradient(100deg, #fff5c7 0%, var(--primary-color) 55%, #c69a34 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 18px rgba(230, 200, 76, 0.18);
}

.register-title {
  font-size: 16px;
  color: var(--text-light);
  text-align: center;
  margin-bottom: 30px;
  font-weight: normal;
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

.register-form {
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

/* 删除旧的验证码按钮样式 */
.verification-btn:disabled {
  background-color: #555;
  cursor: not-allowed;
  opacity: 0.7;
}

.form-options {
  margin-bottom: 20px;
}

.agree-terms {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  color: #aaa;
  font-size: 14px;
}

.agree-terms input {
  margin-top: 3px;
}

.terms-link {
  color: var(--primary-color);
  text-decoration: none;
}

.register-btn {
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

.register-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.register-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.login-link {
  text-align: center;
  margin-top: 20px;
  color: #aaa;
  font-size: 14px;
}

.login-link a {
  color: var(--primary-color);
  text-decoration: none;
}

@media (max-width: 480px) {
  .register-box {
    padding: 30px 20px;
  }
}

/* 新增：极窄屏（< 360px）验证码按钮自适应，防止挤压输入框 */
@media (max-width: 360px) {
  .verification-container {
    flex-wrap: wrap;
    gap: 8px;
  }

  .send-code-btn {
    min-width: auto;
    width: 100%;
  }
}
</style> 

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const isLoggedIn = ref(false);
const user = ref(null);

// 检查用户登录状态
const checkLoginStatus = () => {
  const loginStatus = localStorage.getItem('isLoggedIn') === 'true';
  isLoggedIn.value = loginStatus;
  
  if (loginStatus) {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      user.value = userData;
    } catch (e) {
      console.error('解析用户数据失败', e);
    }
  }
};

// 退出登录
const logout = () => {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('user');
  isLoggedIn.value = false;
  user.value = null;
  router.push('/');
};

// 监听存储变化
window.addEventListener('storage', (event) => {
  if (event.key === 'isLoggedIn') {
    checkLoginStatus();
  }
});

// 组件挂载时检查登录状态
onMounted(() => {
  checkLoginStatus();
});
</script>

<template>
  <div class="nav-auth-buttons">
    <template v-if="!isLoggedIn">
      <a href="/login" class="login-btn">登录</a>
      <a href="/register" class="register-btn">注册</a>
    </template>
    <template v-else>
      <div class="user-menu">
        <span class="username">{{ user?.username || '用户' }}</span>
        <button @click="logout" class="logout-btn">退出</button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.nav-auth-buttons {
  display: flex;
  align-items: center;
  gap: 10px;
}

.login-btn, .register-btn {
  padding: 8px 16px;
  border-radius: 4px;
  text-decoration: none;
  font-size: 14px;
  transition: all 0.3s ease;
}

.login-btn {
  background-color: transparent;
  border: 1px solid var(--primary-color);
  color: var(--primary-color);
}

.register-btn {
  background-color: var(--primary-color);
  border: 1px solid var(--primary-color);
  color: var(--dark-bg);
}

.login-btn:hover, .register-btn:hover {
  opacity: 0.9;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 10px;
}

.username {
  color: var(--primary-color);
  font-weight: bold;
}

.logout-btn {
  background-color: transparent;
  border: none;
  color: #aaa;
  cursor: pointer;
  padding: 5px 10px;
  font-size: 14px;
}

.logout-btn:hover {
  color: #ff5757;
}
</style> 
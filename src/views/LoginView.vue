<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import LoginForm from '../components/LoginForm.vue';

const router = useRouter();

// 检查用户是否已登录，如果已登录则跳转到首页
onMounted(() => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  if (isLoggedIn) {
    router.push('/');
  }
});
</script>

<template>
  <div class="login-view">
    <LoginForm />
  </div>
</template>

<style scoped>
.login-view {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--dark-bg);
}
</style> 
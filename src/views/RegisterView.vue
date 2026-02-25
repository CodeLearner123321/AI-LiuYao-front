<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import RegisterForm from '../components/RegisterForm.vue';

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
  <div class="register-view">
    <RegisterForm />
  </div>
</template>

<style scoped>
.register-view {
  min-height: 100vh;
  min-height: 100svh;
  min-height: 100dvh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--dark-bg);
}
</style> 
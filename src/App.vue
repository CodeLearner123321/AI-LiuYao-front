<script setup>
import GlobalStateManager from './components/GlobalStateManager.vue';
import DisclaimerModal from './components/DisclaimerModal.vue';
import { ref, onMounted, provide, watch, watchEffect, onUnmounted } from 'vue';
import { userStateHMR } from './services/hmrService';
import { useRouter } from 'vue-router';

const router = useRouter();

// 控制声明弹窗的显示状态，使用provide/inject在应用范围内共享
const showDisclaimer = ref(false);
provide('showDisclaimer', showDisclaimer);

// 处理用户接受声明的事件
const handleAcceptDisclaimer = () => {
  console.log('用户点击接受声明，关闭弹窗');
  showDisclaimer.value = false;
  // 用户接受声明后，将状态存储到localStorage
  try {
    localStorage.setItem('disclaimerAccepted', 'true');
    console.log('用户已接受声明，声明状态已保存到localStorage');
  } catch (error) {
    console.error('保存声明状态失败:', error);
  }
};

// 当前登录状态
const isLoggedIn = ref(false);

// 显示声明弹窗的函数
const showDisclaimerModal = () => {
  console.log('调用显示声明弹窗函数');
  // 检查用户是否已接受声明
  const disclaimerAccepted = localStorage.getItem('disclaimerAccepted');
  
  if (disclaimerAccepted !== 'true') {
    console.log('用户未接受声明，显示声明弹窗');
    // 使用setTimeout确保在DOM更新后显示
    setTimeout(() => {
      showDisclaimer.value = true;
      console.log('声明弹窗状态已设置为:', showDisclaimer.value);
    }, 300);
  } else {
    console.log('用户已接受声明，不显示声明弹窗');
  }
};

// 监听路由变化，用作备用方案
watch(() => router.currentRoute.value.path, (newPath, oldPath) => {
  console.log(`路由从 ${oldPath} 变更为 ${newPath}`);
  
  // 仅当用户登录后且从登录页离开时检查
  if (oldPath === '/login' && isLoggedIn.value) {
    console.log('检测到从登录页离开，检查是否需要显示声明');
    showDisclaimerModal();
  }
});

// 监听用户登录状态变化
userStateHMR.onUserStateChange((userData) => {
  console.log('用户状态变化事件触发，userData:', userData);
  const previousLoginState = isLoggedIn.value;
  isLoggedIn.value = !!userData;
  
  console.log(`登录状态从 ${previousLoginState} 变更为 ${isLoggedIn.value}`);
  
  // 只在用户从未登录变为已登录时触发声明检查
  if (!previousLoginState && isLoggedIn.value) {
    console.log('检测到用户刚刚登录，准备显示声明');
    showDisclaimerModal();
  }
});

// 直接监听登录时可能发生的其他事件
window.addEventListener('login-success', () => {
  console.log('检测到登录成功事件');
  showDisclaimerModal();
});

// 在全局范围创建登录检测器的备用方案
window.checkLoginAndShowDisclaimer = () => {
  console.log('手动调用登录检测器');
  if (localStorage.getItem('isLoggedIn') === 'true') {
    showDisclaimerModal();
    return true;
  }
  return false;
};

// 在组件挂载时检查登录状态并根据需要显示声明弹窗
onMounted(() => {
  console.log('App组件已挂载');
  // 确保在客户端环境中执行
  if (typeof window !== 'undefined') {
    // 检查用户是否已登录
    const storedIsLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    console.log('初始登录状态:', storedIsLoggedIn ? '已登录' : '未登录');
    isLoggedIn.value = storedIsLoggedIn;
    
    // 如果用户已登录，检查是否需要显示声明弹窗
    if (isLoggedIn.value) {
      console.log('用户已登录，检查是否需要显示声明');
      showDisclaimerModal();
    }
    
    // 为了调试目的，可以在控制台添加重置功能
    window.resetDisclaimer = () => {
      console.log('手动重置声明状态');
      localStorage.removeItem('disclaimerAccepted');
      if (isLoggedIn.value) {
        showDisclaimerModal();
        console.log('声明状态已重置，已触发显示声明弹窗');
      } else {
        console.log('声明状态已重置，登录后将显示弹窗');
      }
    };
    
    // 每10秒检查一次登录状态并尝试显示声明 (用于测试)
    const checkInterval = setInterval(() => {
      const currentlyLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      console.log('定期检查登录状态:', currentlyLoggedIn ? '已登录' : '未登录');
      
      if (currentlyLoggedIn && !isLoggedIn.value) {
        console.log('检测到登录状态变化（通过定期检查）');
        isLoggedIn.value = true;
        showDisclaimerModal();
      }
    }, 5000);
    
    // 在组件卸载时清除定时器
    onUnmounted(() => {
      clearInterval(checkInterval);
    });
  }
});
</script>

<template>
  <!-- 声明弹窗组件 -->
  <DisclaimerModal 
    :showModal="showDisclaimer" 
    @acceptDisclaimer="handleAcceptDisclaimer" 
  />
  
  <!-- 无论声明状态如何，都渲染应用内容，只是通过DisclaimerModal覆盖显示 -->
  <div :class="{ 'content-hidden': showDisclaimer }">
    <GlobalStateManager />
    <router-view v-slot="{ Component }">
      <!-- 使用keep-alive和key来确保组件在路由切换时保持状态 -->
      <keep-alive>
        <component :is="Component" :key="$route.fullPath" />
      </keep-alive>
    </router-view>
  </div>
</template>

<style>
:root {
  --primary-color: #e6c84c;
  --dark-bg: #1e1e1e;
  --text-light: #ffffff;
  --text-dark: #333333;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Arial', sans-serif;
}

/* 当声明弹窗显示时，隐藏内容但保持其渲染 */
.content-hidden {
  opacity: 0.3;
  pointer-events: none;
}

body {
  background-color: var(--dark-bg);
  color: var(--text-light);
  width: 100%;
  overflow-x: hidden;
}

.app-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  width: 100%;
}

.btn {
  display: inline-block;
  padding: 10px 20px;
  background-color: var(--primary-color);
  color: var(--text-dark);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  text-decoration: none;
  transition: all 0.3s ease;
}

.btn:hover {
  opacity: 0.9;
}

/* Element Plus样式覆盖 */
:deep(.el-select-dropdown),
:deep(.el-popper) {
  background-color: #222 !important;
  border-color: #444 !important;
}

:deep(.el-select-dropdown__item) {
  background-color: #222 !important;
  color: #ddd !important;
}

:deep(.el-select-dropdown__item.hover),
:deep(.el-select-dropdown__item:hover) {
  background-color: #333 !important;
}

:deep(.el-select-dropdown__item.selected) {
  color: var(--primary-color) !important;
  background-color: rgba(230, 200, 76, 0.1) !important;
}
</style>

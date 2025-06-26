<script setup>
import { onMounted, onUnmounted } from 'vue';
import { userStateHMR } from '../services/hmrService';

// 这个组件不渲染任何内容，只负责管理全局状态
// 可以在 App.vue 中引入这个组件

// 监听全局事件
onMounted(() => {
  // 这里可以添加全局事件监听
  console.log('GlobalStateManager mounted');
  
  // 如果需要，可以在这里初始化一些全局状态
});

// 清理事件监听
onUnmounted(() => {
  // 清理全局事件监听
  console.log('GlobalStateManager unmounted');
});
</script>

<template>
  <!-- 这个组件不渲染任何内容 -->
</template> 
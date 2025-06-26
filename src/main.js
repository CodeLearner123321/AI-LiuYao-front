import './assets/main.css'
import './assets/theme-override.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// 引入Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

// 检查环境和查询参数
const isDevMode = import.meta.env.MODE === 'development';
const urlParams = new URLSearchParams(window.location.search);
const resetDisclaimer = urlParams.get('reset_disclaimer') === 'true';

// 只在开发环境下重置声明状态（可选择开启）
// const RESET_IN_DEV = false; // 设置为true以在每次开发环境启动时重置声明

// 只有明确通过URL参数请求时重置声明状态
if (resetDisclaimer) {
  // 只清除永久接受状态，不再使用sessionStorage
  localStorage.removeItem('disclaimerAccepted');
  console.log('声明状态已重置，用户登录后将显示声明弹窗');
}

const app = createApp(App)
app.use(router)
app.use(ElementPlus, {
  locale: zhCn,
})
app.mount('#app')

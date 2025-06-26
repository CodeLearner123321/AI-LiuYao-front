import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  server: {
    hmr: {
      overlay: true, // 在页面上显示错误
    },
    watch: {
      usePolling: true, // 在某些系统上可能需要这个选项
    }, 
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  build: {
    // 禁用生产环境的源代码映射，提高安全性，防止源码泄露
    sourcemap: false,
    // 进一步混淆和优化代码
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,  // 移除console
        drop_debugger: true  // 移除debugger
      }
    }
  }
})

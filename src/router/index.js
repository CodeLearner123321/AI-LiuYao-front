import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import HexagramView from '../views/HexagramView.vue'
import ChangePasswordView from '../views/ChangePasswordView.vue'
import HistoryView from '../views/HistoryView.vue'
import AboutView from '../views/AboutView.vue'
import GuideView from '../views/GuideView.vue'
import DownloadsView from '../views/DownloadsView.vue'
import UploadView from '../views/UploadView.vue'
import { isAuthenticated } from '../services/api'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
  // router/index.js
{
  path: '/liuyao-detail',
  name: 'LiuyaoDetail',
  component: () => import('../views/LiuyaoDetailView.vue')
},
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView
    },
    {
      path: '/hexagram',
      name: 'hexagram',
      component: HexagramView
    },
    {
      path: '/guide',
      name: 'guide',
      component: GuideView
    },
    {
      path: '/downloads',
      name: 'downloads',
      component: DownloadsView
    },
    {
      path: '/upload',
      name: 'upload',
      component: UploadView,
      meta: {
        requiresAuth: true,
        requiresPermission: 'uploadView'
      }
    },
    {
      path: '/account/change-password',
      name: 'change-password',
      component: ChangePasswordView
    },
    {
      path: '/account/history',
      name: 'history',
      component: HistoryView,
      meta: {
        requiresAuth: true
      }
    },
    {
      path: '/about',
      name: 'about',
      component: AboutView
    }
  ]
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 注意：声明同意检查逻辑已移至App.vue，无需在路由守卫中处理
  // 声明接受逻辑在App.vue中通过条件渲染来控制，这样可以避免路由冲突
  
  // 检查该路由是否需要登录权限
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // 如果需要权限且用户未登录，则重定向到登录页面
    if (!isAuthenticated()) {
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      });
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router 

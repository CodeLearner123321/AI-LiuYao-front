<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { getUserBalance, useCardKey } from '../services/api';
import { loadPermissions, checkPermission, clearPermissions, getCurrentPermissions } from '../composables/usePermissions';

// 默认头像图片路径
const defaultAvatar = '/profile/touxiang.png'; // 图片应该放在public/profile目录下
const defaultAvatarLoaded = ref(true); // 跟踪默认头像是否成功加载

const router = useRouter();
const isLoggedIn = ref(false);
const user = ref(null);
const showUserMenu = ref(false); // 控制用户菜单的显示
const userBalance = ref(0); // 用户余额
const balanceLoading = ref(false); // 余额加载状态
const showAccountSettings = ref(false); // 控制账号设置弹窗的显示
const showRechargeModal = ref(false); // 控制充值弹窗的显示
const rechargeCode = ref(''); // 充值卡密
const isRefreshingBalance = ref(false); // 余额刷新状态
const isSubmittingRecharge = ref(false); // 充值提交状态

// API Key 设置相关状态
const showApiKeySettings = ref(false); // 控制API Key设置弹窗的显示
const apiKeyProvider = ref('火山方舟'); // Key的厂家
const apiKeyValue = ref(''); // 用户的API Key
const apiModel = ref('DeepSeek'); // 选择的模型

// 自定义下拉菜单状态
const showProviderDropdown = ref(false);
const showModelDropdown = ref(false);

// 可选的厂家和模型
const providerOptions = ['火山方舟', '阿里云百炼'];
const modelOptions = ['DeepSeek'];

// 厂家映射到接口参数
const providerToServiceType = {
  '火山方舟': 'volcengine',
  '阿里云百炼': 'dashscope'
};

// 模型映射到接口参数
const modelToModelId = {
  'DeepSeek': 'deepseek-r1'
};

// 选择厂家
const selectProvider = (provider) => {
  apiKeyProvider.value = provider;
  showProviderDropdown.value = false;
};

// 选择模型
const selectModel = (model) => {
  apiModel.value = model;
  showModelDropdown.value = false;
};

// 检查用户登录状态
const checkLoginStatus = () => {
  const loginStatus = localStorage.getItem('isLoggedIn') === 'true';
  isLoggedIn.value = loginStatus;
  
  if (loginStatus) {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      user.value = userData;
      // 获取用户余额
      fetchUserBalance();
      // 加载用户权限
      loadPermissions().then(() => {
        console.log('权限加载完成:', getCurrentPermissions());
        console.log('是否有uploadView权限:', checkPermission('uploadView'));
      });
    } catch (e) {
      console.error('解析用户数据失败', e);
    }
  } else {
    // 用户未登录时清除权限信息
    clearPermissions();
  }
};

// 加载API Key设置
const loadApiKeySettings = () => {
  try {
    const savedApiKeyProvider = localStorage.getItem('apiKeyProvider');
    const savedApiKeyValue = localStorage.getItem('apiKeyValue');
    const savedApiModel = localStorage.getItem('apiModel');
    
    if (savedApiKeyProvider) {
      apiKeyProvider.value = savedApiKeyProvider;
    }
    
    if (savedApiKeyValue) {
      apiKeyValue.value = savedApiKeyValue;
    }
    
    if (savedApiModel) {
      apiModel.value = savedApiModel;
    }
  } catch (error) {
    console.error('加载API Key设置失败', error);
  }
};

// 保存API Key设置
const saveApiKeySettings = () => {
  try {
    // 保存用户界面选择的值
    localStorage.setItem('apiKeyProvider', apiKeyProvider.value);
    localStorage.setItem('apiKeyValue', apiKeyValue.value);
    localStorage.setItem('apiModel', apiModel.value);
    
    // 同时保存接口需要的参数映射，便于直接使用
    localStorage.setItem('llmServiceType', providerToServiceType[apiKeyProvider.value]);
    localStorage.setItem('modelId', modelToModelId[apiModel.value]);
    localStorage.setItem('apiKey', apiKeyValue.value);
    
    alert('API Key设置已保存');
    closeApiKeySettings();
  } catch (error) {
    console.error('保存API Key设置失败', error);
    alert('保存失败，请重试');
  }
};

// 打开API Key设置弹窗
const openApiKeySettings = (event) => {
  if (event) {
    event.stopPropagation(); // 阻止事件冒泡
  }
  showUserMenu.value = false; // 关闭用户菜单
  
  // 重新从 localStorage 加载已保存的设置，覆盖任何未保存的修改
  loadApiKeySettings();
  
  showApiKeySettings.value = true; // 显示API Key设置弹窗
};

// 关闭API Key设置弹窗
const closeApiKeySettings = () => {
  showApiKeySettings.value = false;
  showProviderDropdown.value = false;
  showModelDropdown.value = false;
  
  // 关闭时重新加载已保存的设置，丢弃未保存的修改
  loadApiKeySettings();
};

// 关闭所有下拉菜单
const closeDropdowns = () => {
  showProviderDropdown.value = false;
  showModelDropdown.value = false;
};

// 获取用户余额
const fetchUserBalance = async () => {
  // 如果用户已登录，则调用API获取余额
  if (!isLoggedIn.value) return;
  
  try {
    balanceLoading.value = true;
    const response = await getUserBalance();
    
    if (response.code === 200) {
      // 注意：API返回的余额单位为"点"，1元 = 10点
      // 展示的也是点
      const points = parseFloat(response.data || '0');
      userBalance.value = points;
    } else {
      console.error('获取余额失败:', response.msg);
      userBalance.value = 0;
    }
  } catch (error) {
    console.error('获取余额发生错误:', error);
    userBalance.value = 0;
  } finally {
    balanceLoading.value = false;
  }
};

// 刷新余额
const refreshBalance = async (event) => {
  if (event) {
    event.stopPropagation();
  }
  
  if (isRefreshingBalance.value) return;
  
  try {
    isRefreshingBalance.value = true;
    await fetchUserBalance();
  } finally {
    isRefreshingBalance.value = false;
  }
};

// 打开充值弹窗
const openRechargeModal = (event) => {
  if (event) {
    event.stopPropagation();
  }
  showUserMenu.value = false;
  showRechargeModal.value = true;
  rechargeCode.value = '';
};

// 关闭充值弹窗
const closeRechargeModal = () => {
  showRechargeModal.value = false;
  rechargeCode.value = '';
};

// 提交充值卡密
const submitRecharge = async () => {
  if (!rechargeCode.value.trim()) {
    alert('请输入卡密');
    return;
  }
  
  if (isSubmittingRecharge.value) return;
  
  try {
    isSubmittingRecharge.value = true;
    const response = await useCardKey(rechargeCode.value.trim());
    
    if (response.code === 0) {
      // 充值成功
      const amount = response.data?.amount || 0;
      alert(`充值成功！已增加 ${amount.toFixed(2)} 点`);
      
      // 刷新余额
      await fetchUserBalance();
      
      // 关闭弹窗
      closeRechargeModal();
    } else {
      // 充值失败
      alert(response.msg || '充值失败，请检查卡密是否正确');
    }
  } catch (error) {
    console.error('充值出错:', error);
    alert('充值失败，请稍后重试');
  } finally {
    isSubmittingRecharge.value = false;
  }
};

// 退出登录
const logout = () => {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  isLoggedIn.value = false;
  user.value = null;
  showUserMenu.value = false;
  // 清除权限信息
  clearPermissions();
  router.push('/');
};

// 切换用户菜单显示状态
const toggleUserMenu = (event) => {
  event.stopPropagation(); // 阻止事件冒泡
  showUserMenu.value = !showUserMenu.value;
};

// 打开账号设置弹窗
const openAccountSettings = (event) => {
  event.stopPropagation(); // 阻止事件冒泡
  showUserMenu.value = false; // 关闭用户菜单
  showAccountSettings.value = true; // 显示账号设置弹窗
};

// 关闭账号设置弹窗
const closeAccountSettings = () => {
  showAccountSettings.value = false;
};

// 前往修改密码页面
const goToChangePassword = () => {
  closeAccountSettings();
  router.push('/account/change-password');
};

// 点击页面其他位置关闭菜单
const closeMenuOnClickOutside = (event) => {
  // 如果菜单未显示，则不处理
  if (!showUserMenu.value) return;
  
  // 获取菜单容器元素
  const menuContainer = document.querySelector('.avatar-menu-container');
  
  // 如果点击的是菜单容器内的元素，不关闭菜单
  if (menuContainer && menuContainer.contains(event.target)) {
    return;
  }
  
  // 检查是否点击在Element Plus组件内
  // 不关闭菜单的情况
  if (event.target.closest('.el-select-dropdown') || 
      event.target.closest('.el-popper') || 
      event.target.closest('.el-dialog') || 
      event.target.closest('.el-overlay') ||
      event.target.closest('.time-picker-container') ||
      event.target.closest('.picker-option') ||
      event.target.closest('.dialog-actions') ||
      event.target.classList.contains('el-overlay') ||
      event.target.classList.contains('time-display') ||
      event.target.classList.contains('time-value') ||
      event.target.classList.contains('time-icon')) {
    // 如果点击的是选择器组件、对话框、时间选择器等，不关闭菜单
    return;
  }
  
  // 其他情况，关闭菜单
  showUserMenu.value = false;
};

// 点击页面其他位置关闭账号设置弹窗
const closeAccountSettingsOnClickOutside = (event) => {
  if (!showAccountSettings.value) return;
  
  const settingsContainer = document.querySelector('.account-settings-dialog');
  if (settingsContainer && !settingsContainer.contains(event.target) && 
      !event.target.closest('.account-settings-dialog') && 
      !event.target.closest('.menu-item')) {
    closeAccountSettings();
  }
};

// 点击页面其他位置关闭API Key设置弹窗
const closeApiKeySettingsOnClickOutside = (event) => {
  if (showApiKeySettings.value) {
    const dialog = document.querySelector('.api-key-settings-dialog');
    if (dialog && !dialog.contains(event.target)) {
      closeApiKeySettings();
    }
  }
};

// 点击页面其他位置关闭自定义下拉菜单
const closeDropdownsOnClickOutside = (event) => {
  // 如果点击的不是下拉菜单容器内的元素，则关闭所有下拉菜单
  const providerDropdown = document.querySelector('.provider-dropdown-container');
  const modelDropdown = document.querySelector('.model-dropdown-container');
  
  if (providerDropdown && !providerDropdown.contains(event.target) &&
      modelDropdown && !modelDropdown.contains(event.target)) {
    closeDropdowns();
  }
};

// 监听存储变化
const handleStorageChange = (event) => {
  if (event.key === 'isLoggedIn' || event.key === null) {
    checkLoginStatus();
  }
};

// 处理默认头像加载错误
const handleDefaultAvatarError = () => {
  defaultAvatarLoaded.value = false;
};

// 定义计时器变量
let balanceRefreshInterval;

// 组件挂载时检查登录状态
onMounted(() => {
  checkLoginStatus();
  window.addEventListener('storage', handleStorageChange);
  
  // 添加自定义事件监听器，用于在同一窗口内通信
  window.addEventListener('login-status-changed', checkLoginStatus);
  
  // 添加点击其他区域关闭菜单的事件监听
  document.addEventListener('click', closeMenuOnClickOutside);
  
  // 添加点击其他区域关闭账号设置弹窗的事件监听
  document.addEventListener('click', closeAccountSettingsOnClickOutside);
  
  // 添加点击其他区域关闭API Key设置弹窗的事件监听
  document.addEventListener('click', closeApiKeySettingsOnClickOutside);
  
  // 添加点击其他区域关闭下拉菜单的事件监听
  document.addEventListener('click', closeDropdownsOnClickOutside);
  
  // 如果用户已登录，定期刷新余额信息（每5分钟刷新一次）
  if (isLoggedIn.value) {
    balanceRefreshInterval = setInterval(() => {
      fetchUserBalance();
    }, 5 * 60 * 1000 * 60 * 24); // 5分钟 (现在不要这么短的时间了)
  }
  
  // 加载API Key设置
  loadApiKeySettings();
});

// 组件卸载时移除事件监听和清除定时器
onUnmounted(() => {
  window.removeEventListener('storage', handleStorageChange);
  window.removeEventListener('login-status-changed', checkLoginStatus);
  document.removeEventListener('click', closeMenuOnClickOutside);
  document.removeEventListener('click', closeAccountSettingsOnClickOutside);
  document.removeEventListener('click', closeApiKeySettingsOnClickOutside);
  document.removeEventListener('click', closeDropdownsOnClickOutside);
  
  // 清除定时器
  if (balanceRefreshInterval) {
    clearInterval(balanceRefreshInterval);
  }
});
</script>

<template>
  <header class="navbar">
    <div class="logo">
      <a href="/">
        <img src="/images/favicon.png" alt="logo" class="logo-icon">
        <span class="logo-text">OpenLiuYao</span>
      </a>
    </div>

    
    <nav class="nav-links">
      <a href="/" class="nav-link">首页</a>
      <a href="/hexagram" class="nav-link">六爻学习</a>
      <a href="/downloads" class="nav-link">资料下载</a>
      <!-- 根据权限动态显示资料上传 -->
      <a v-if="checkPermission('uploadView')" href="/upload" class="nav-link">资料上传</a>
      <!-- <a href="/culture" class="nav-link">传统文化</a> -->
      <a href="/about" class="nav-link">关于我们</a>
    </nav>
    
    <div class="auth-buttons">
      <template v-if="!isLoggedIn">
        <div class="auth-actions">
          <a href="/login" class="auth-btn login-btn">
            <i class="auth-icon">🔑</i>
            <span>登录</span>
          </a>
          <a href="/register" class="auth-btn register-btn">
            <i class="auth-icon">✨</i>
            <span>注册</span>
          </a>
        </div>
      </template>
      <template v-else>
        <div class="avatar-menu-container">
          <div class="avatar-wrapper" @click="toggleUserMenu">
            <div class="avatar-circle" :class="{ 'avatar-circle-active': showUserMenu }">
              <template v-if="user && user.avatar">
                <img :src="user.avatar" alt="用户头像" class="user-avatar" @error="user.avatar = null" />
              </template>
              <template v-else>
                <template v-if="user">
                  <img v-if="defaultAvatarLoaded" :src="defaultAvatar" alt="默认头像" class="user-avatar" @error="handleDefaultAvatarError" />
                  <div v-else class="avatar-placeholder">
                    {{ user.username ? user.username.substring(0, 1).toUpperCase() : 'U' }}
                  </div>
                </template>
                <template v-else>
                  <div class="avatar-placeholder">U</div>
                </template>
              </template>
              <div class="online-indicator"></div>
            </div>
          </div>
          
          <div class="user-dropdown-menu" :class="{ 'show-menu': showUserMenu }">
            <div class="menu-header">
              <div class="user-info">
                <h3 class="user-name">{{ user ? user.username : '用户' }}</h3>
                <p class="user-id" v-if="user && /^\d{11}$/.test(user.username)">
                  ID: {{ user.username.substring(0, 3) }}****{{ user.username.substring(7) }}
                </p>
              </div>
            </div>
            
            <div class="menu-balance">
              <div class="balance-label">
                <i class="balance-icon">💰</i>
                <span>我的余额</span>
              </div>
              <div class="balance-amount-wrapper">
                <div class="balance-amount">
                  <template v-if="balanceLoading">
                    <span class="loading-dots">加载中</span>
                  </template>
                  <template v-else>
                    <span>{{ userBalance.toFixed(2) }}</span>
                    <span class="currency">点</span>
                  </template>
                </div>
                <button 
                  class="balance-action-btn refresh-btn" 
                  @click="refreshBalance"
                  :disabled="isRefreshingBalance"
                  title="刷新余额"
                >
                  <i class="action-btn-icon" :class="{ 'spinning': isRefreshingBalance }">🔄</i>
                </button>
              </div>
            </div>
            
            <div class="menu-divider"></div>
            
            <div class="menu-items">
              <div class="menu-item" @click="openRechargeModal">
                <i class="menu-icon">💳</i>
                <span class="menu-text">充值余额</span>
                <i class="menu-arrow">→</i>
              </div>
              
              <div class="menu-item" @click="openAccountSettings">
                <i class="menu-icon">⚙️</i>
                <span class="menu-text">账号设置</span>
                <i class="menu-arrow">→</i>
              </div>
              
              <div class="menu-item" @click="router.push('/account/history')">
                <i class="menu-icon">📜</i>
                <span class="menu-text">历史记录</span>
                <i class="menu-arrow">→</i>
              </div>
              
              <div class="menu-item" @click="openApiKeySettings">
                <i class="menu-icon">🔑</i>
                <span class="menu-text">设置Key</span>
                <i class="menu-arrow">→</i>
              </div>
            </div>
            
            <div class="menu-divider"></div>
            
            <div class="menu-footer">
              <button class="logout-button" @click="logout">
                <i class="logout-icon">🚪</i>
                <span>退出登录</span>
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- 账号设置弹窗 -->
    <div class="account-settings-overlay" v-if="showAccountSettings" @click.self="closeAccountSettings">
      <div class="account-settings-dialog" @click.stop>
        <div class="settings-header">
          <div class="settings-title-container">
            <i class="settings-icon">⚙️</i>
            <h3 class="settings-title">账号设置</h3>
          </div>
          <button class="close-btn" @click="closeAccountSettings">×</button>
        </div>
        
        <div class="settings-content">
          <!-- 用户头像区域 -->
          <div class="user-profile-section">
            <div class="user-avatar-large">
              <template v-if="user && user.avatar">
                <img :src="user.avatar" alt="用户头像" @error="user.avatar = null" />
              </template>
              <template v-else>
                <template v-if="user">
                  <img v-if="defaultAvatarLoaded" :src="defaultAvatar" alt="默认头像" @error="handleDefaultAvatarError" />
                  <div v-else class="large-avatar-placeholder">
                    {{ user.username ? user.username.substring(0, 1).toUpperCase() : 'U' }}
                  </div>
                </template>
              </template>
            </div>
          </div>
          
          <!-- 用户信息区域 -->
          <div class="user-info-section">
            <div class="info-row">
              <div class="info-label">用户名</div>
              <div class="info-value">
                <span class="info-text">{{ user ? user.username : '未知' }}</span>
              </div>
            </div>
            
            <div class="settings-divider"></div>
            
            <div class="info-row">
              <div class="info-label">邮箱</div>
              <div class="info-value">
                <span class="info-text">{{ user && user.email ? user.email : '未绑定' }}</span>
              </div>
            </div>
            
            <div class="settings-divider"></div>
            
            <div class="info-row">
              <div class="info-label">余额点数</div>
              <div class="info-value">
                <template v-if="balanceLoading">
                  <span class="loading-dots">加载中</span>
                </template>
                <template v-else>
                  <span class="balance-text">{{ userBalance.toFixed(2) }} <span class="small-text">点</span></span>
                </template>
              </div>
            </div>
          </div>
          
          <div class="settings-divider special-divider"></div>
          
          <!-- 操作按钮区域 -->
          <div class="settings-actions">
            <button class="change-password-btn" @click="goToChangePassword">
              <i class="action-icon">🔑</i>
              <span>修改密码</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 充值弹窗 -->
    <div class="account-settings-overlay recharge-overlay" v-if="showRechargeModal" @click.self="closeRechargeModal">
      <div class="recharge-dialog-premium" @click.stop>
        <!-- 顶部光效装饰 -->
        <div class="dialog-top-glow"></div>
        
        <!-- 头部区域 -->
        <div class="recharge-header-premium">
          <div class="header-icon-container">
            <div class="icon-glow-effect"></div>
            <i class="header-main-icon">💳</i>
          </div>
          <h2 class="recharge-main-title">账户充值</h2>
          <p class="recharge-subtitle">为您的账户添加余额点数</p>
          <button class="premium-close-btn" @click="closeRechargeModal">
            <span class="close-icon">×</span>
          </button>
        </div>
        
        <!-- 内容区域 -->
        <div class="recharge-content-premium">
          <!-- 购买提示卡片 -->
          <div class="purchase-info-card">
            <div class="info-icon-wrapper">
              <i class="info-icon">ℹ️</i>
            </div>
            <div class="info-text-content">
              <p class="info-primary">请前往淘宝店铺购买充值卡密</p>
              <a 
                href="https://e.tb.cn/h.SwJXL97cYtBqC0b?tk=yFEFfNlrNh7" 
                target="_blank" 
                rel="noopener noreferrer"
                class="shop-link-btn"
                @click.stop
              >
                <span class="btn-shine"></span>
                <span class="btn-text">OpenLiuYao官方店</span>
                <svg class="btn-arrow" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </a>
            </div>
          </div>
          
          <!-- 卡密输入区 -->
          <div class="card-input-section">
            <label class="premium-label">
              <span class="label-text">充值卡密</span>
              <span class="label-required">*</span>
            </label>
            <div class="premium-input-wrapper">
              <input 
                type="text" 
                v-model="rechargeCode" 
                class="premium-input" 
                placeholder="请输入您购买的卡密码"
                @keyup.enter="submitRecharge"
                :disabled="isSubmittingRecharge"
              />
              <div class="input-focus-border"></div>
            </div>
            <p class="input-hint">输入完成后点击确认充值按钮</p>
          </div>
          
          <!-- 按钮组 -->
          <div class="premium-actions">
            <button 
              class="premium-primary-btn" 
              @click="submitRecharge"
              :disabled="isSubmittingRecharge"
            >
              <div class="btn-glow-layer"></div>
              <div class="btn-content">
                <template v-if="isSubmittingRecharge">
                  <span class="btn-spinner"></span>
                  <span>提交中...</span>
                </template>
                <template v-else>
                  <svg class="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span>确认充值</span>
                </template>
              </div>
            </button>
            <button 
              class="premium-secondary-btn" 
              @click="closeRechargeModal"
              :disabled="isSubmittingRecharge"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- API Key设置弹窗 -->
    <div class="account-settings-overlay" v-if="showApiKeySettings" @click.self="closeApiKeySettings">
      <div class="account-settings-dialog api-key-settings-dialog" @click.stop>
        <div class="settings-header">
          <div class="settings-title-container">
            <i class="settings-icon">🔑</i>
            <h3 class="settings-title">设置API Key</h3>
          </div>
          <button class="close-btn" @click="closeApiKeySettings">×</button>
        </div>
        
        <div class="settings-content">
          <div class="api-description">
            <p>在此设置您的API密钥，系统将使用这些凭证来请求六爻分析结果。</p>
          </div>
          
          <div class="api-key-settings-section">
            <!-- 厂家选择自定义下拉菜单 -->
            <div class="form-group">
              <label class="form-label">Key的厂家</label>
              <div class="custom-dropdown provider-dropdown-container">
                <div 
                  class="dropdown-selected" 
                  @click.stop="showProviderDropdown = !showProviderDropdown; showModelDropdown = false;"
                >
                  <span>{{ apiKeyProvider }}</span>
                  <div class="dropdown-arrow" :class="{ 'arrow-up': showProviderDropdown }">▼</div>
                </div>
                <div class="dropdown-options" v-show="showProviderDropdown">
                  <div 
                    v-for="option in providerOptions" 
                    :key="option"
                    class="dropdown-option"
                    :class="{ 'option-selected': apiKeyProvider === option }"
                    @click.stop="selectProvider(option)"
                  >
                    {{ option }}
                  </div>
                </div>
              </div>
              <div class="form-helper">{{ apiKeyProvider === '火山方舟' ? 'API参数: volcengine' : 'API参数: dashscope' }}</div>
            </div>
            
            <div class="form-group">
              <label class="form-label">API Key</label>
              <input type="text" v-model="apiKeyValue" class="api-input" placeholder="请输入您的API Key" />
              <div class="form-helper">您的API凭证，将用于请求AI预测接口</div>
            </div>
            
            <!-- 模型选择自定义下拉菜单 -->
            <div class="form-group">
              <label class="form-label">模型</label>
              <div class="custom-dropdown model-dropdown-container">
                <div 
                  class="dropdown-selected" 
                  @click.stop="showModelDropdown = !showModelDropdown; showProviderDropdown = false;"
                >
                  <span>{{ apiModel }}</span>
                  <div class="dropdown-arrow" :class="{ 'arrow-up': showModelDropdown }">▼</div>
                </div>
                <div class="dropdown-options" v-show="showModelDropdown">
                  <div 
                    v-for="option in modelOptions" 
                    :key="option"
                    class="dropdown-option"
                    :class="{ 'option-selected': apiModel === option }"
                    @click.stop="selectModel(option)"
                  >
                    {{ option }}
                  </div>
                </div>
              </div>
              <div class="form-helper">API参数: deepseek-r1</div>
            </div>
          </div>
          
          <div class="settings-divider special-divider"></div>
          
          <!-- 保存按钮区域 -->
          <div class="settings-actions">
            <button class="save-key-btn" @click="saveApiKeySettings">
              <i class="action-icon">💾</i>
              <span>保存设置</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 30px;
  background-color: var(--dark-bg);
  border-bottom: 1px solid #333;
}

.logo {
  display: flex;
  align-items: center;
}

.logo a {
  display: flex;
  align-items: center;
  text-decoration: none;
}

.logo-icon {
  width: 24px;
  height: 24px;
  margin-right: 8px;
}

.logo-text {
  font-size: 20px;
  font-weight: 800;
  line-height: 1;
  color: transparent;
  background: linear-gradient(100deg, #fff5c7 0%, var(--primary-color) 55%, #c69a34 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 16px rgba(230, 200, 76, 0.16);
}

.nav-links {
  display: flex;
  gap: 20px;
}

.nav-link {
  color: #aaa;
  text-decoration: none;
  transition: color 0.3s ease;
}

.nav-link:hover {
  color: var(--primary-color);
}

.auth-buttons {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 覆盖冲突的登录/注册按钮样式 */
.auth-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.auth-actions .auth-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 24px;
  font-weight: 500;
  font-size: 14px;
  text-decoration: none;
  transition: all 0.3s ease;
}

.auth-actions .login-btn {
  background-color: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
}

.auth-actions .register-btn {
  background-color: var(--primary-color);
  border: none;
  color: var(--dark-bg);
  box-shadow: 0 2px 8px rgba(255, 193, 7, 0.3);
}

.auth-actions .login-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
  opacity: 1;
}

.auth-actions .register-btn:hover {
  background-color: var(--primary-color-hover, #ffdf4d);
  opacity: 1;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 193, 7, 0.4);
}

.auth-icon {
  font-style: normal;
}

/* 已登录用户的头像菜单 */
.avatar-menu-container {
  position: relative;
  z-index: 1000;
}

.avatar-wrapper {
  position: relative;
  cursor: pointer;
}

.avatar-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color, #ffd700), #ffaf3f);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  border: 2px solid transparent;
}

.avatar-circle-active {
  border-color: #fff;
  transform: scale(1.05);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.avatar-circle:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.user-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.avatar-placeholder {
  font-weight: bold;
  font-size: 18px;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.online-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #4caf50;
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 0 4px rgba(76, 175, 80, 0.6);
}

/* 下拉菜单 */
.user-dropdown-menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 280px;
  background-color: #2a2a2a;
  border-radius: 10px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
  visibility: hidden;
  transition: all 0.3s cubic-bezier(0.17, 0.67, 0.83, 0.67);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 1001;
}

.user-dropdown-menu:before {
  content: "";
  position: absolute;
  top: -6px;
  right: 16px;
  width: 12px;
  height: 12px;
  background-color: #2a2a2a;
  transform: rotate(45deg);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
}

.show-menu {
  opacity: 1;
  transform: translateY(0) scale(1);
  visibility: visible;
}

.menu-header {
  padding: 20px 20px 10px;
}

.user-info {
  text-align: center;
}

.user-name {
  font-weight: 600;
  margin: 0 0 5px;
  font-size: 16px;
  color: #fff;
}

.user-id {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

.menu-balance {
  padding: 15px 20px;
  background-color: rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 10px 0;
}

.balance-amount-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.balance-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

.balance-icon {
  font-style: normal;
}

.balance-amount {
  font-weight: bold;
  color: var(--primary-color, #ffd700);
  font-size: 16px;
}

.currency {
  font-size: 12px;
  margin-left: 2px;
  opacity: 0.8;
}

.menu-divider {
  height: 1px;
  background-color: rgba(255, 255, 255, 0.1);
  margin: 5px 0;
}

.menu-items {
  padding: 10px 0;
}

.menu-item {
  padding: 12px 20px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  z-index: 1002;
}

.menu-item:hover {
  background-color: rgba(255, 255, 255, 0.08);
}

.menu-item:active {
  background-color: rgba(255, 255, 255, 0.12);
  transform: translateY(1px);
}

.menu-icon {
  font-style: normal;
  margin-right: 12px;
  font-size: 16px;
  width: 16px;
  text-align: center;
}

.menu-text {
  flex: 1;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.menu-arrow {
  font-style: normal;
  color: rgba(255, 255, 255, 0.3);
  font-size: 12px;
  transition: transform 0.2s ease;
}

.menu-item:hover .menu-arrow {
  transform: translateX(3px);
  color: rgba(255, 255, 255, 0.6);
}

.menu-footer {
  padding: 15px 20px;
}

.logout-button {
  width: 100%;
  padding: 10px;
  border: none;
  background-color: rgba(255, 59, 48, 0.1);
  color: #ff3b30;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.logout-button:hover {
  background-color: rgba(255, 59, 48, 0.2);
}

.logout-icon {
  font-style: normal;
}

@media (max-width: 768px) {
  .navbar {
    padding: 15px 20px;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    flex-direction: column;
    gap: 15px;
    align-items: center;
  }
  
  .logo {
    font-size: 1.5rem;
    order: 1;
  }
  
  .nav-links {
    order: 2;
    gap: 15px;
    flex-wrap: wrap;
    justify-content: center;
    width: 100%;
    max-width: 100%;
  }
  
  .nav-links a {
    font-size: 0.9rem;
    padding: 8px 12px;
    min-height: 44px;
    min-width: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .auth-buttons {
    order: 3;
    width: 100%;
    justify-content: center;
  }
  
  .auth-actions .auth-btn span {
    display: none;
  }
  
  .auth-actions .auth-btn {
    padding: 8px;
    min-width: 44px;
    min-height: 44px;
  }
  
  .auth-icon {
    font-size: 16px;
  }
  
  .user-dropdown-menu {
    width: 250px;
    right: -10px;
    /* 新增：确保下拉菜单不超出视口宽度 */
    max-width: calc(100vw - 20px);
  }
}

@media (max-width: 480px) {
  .navbar {
    padding: 12px 15px;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    flex-direction: column;
    gap: 12px;
    align-items: center;
  }
  
  .logo {
    font-size: 1.3rem;
    order: 1;
  }
  
  .nav-links {
    order: 2;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: center;
    width: 100%;
    max-width: 100%;
  }
  
  .nav-links a {
    font-size: 0.85rem;
    padding: 6px 10px;
    min-height: 44px;
    min-width: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .auth-buttons {
    order: 3;
    width: 100%;
    justify-content: center;
  }
  
  .auth-actions .auth-btn {
    padding: 6px;
    min-width: 44px;
    min-height: 44px;
  }
  
  .auth-icon {
    font-size: 14px;
  }
}

.loading-dots {
  position: relative;
  color: #aaa;
  font-size: 14px;
}

.loading-dots::after {
  content: '';
  animation: dots 1.5s infinite;
}

@keyframes dots {
  0%, 20% { content: ''; }
  40% { content: '.'; }
  60% { content: '..'; }
  80%, 100% { content: '...'; }
}

/* 账号设置弹窗样式优化 */
.account-settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 5000;
  backdrop-filter: blur(6px);
}

.account-settings-dialog {
  width: 380px;
  background: linear-gradient(145deg, #0f0f0f, #1a1a1a);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), 
              0 0 0 1px rgba(255, 215, 0, 0.15),
              0 0 30px rgba(255, 215, 0, 0.07);
  border: none;
  animation: slide-up 0.4s cubic-bezier(0.19, 1, 0.22, 1);
  position: relative;
}

.account-settings-dialog::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: linear-gradient(to bottom, rgba(255, 215, 0, 0.05), transparent);
  pointer-events: none;
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(40px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  background-color: rgba(30, 30, 30, 0.7);
  border-bottom: 1px solid rgba(255, 215, 0, 0.12);
  position: relative;
}

.settings-title-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.settings-icon {
  font-size: 18px;
  color: var(--primary-color);
  filter: drop-shadow(0 0 4px rgba(255, 215, 0, 0.3));
}

.settings-title {
  color: var(--primary-color);
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.2);
}

.close-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 24px;
  cursor: pointer;
  line-height: 1;
  padding: 5px;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  color: var(--primary-color);
  background-color: rgba(255, 215, 0, 0.1);
  transform: rotate(90deg);
}

.settings-content {
  padding: 20px 24px 30px;
}

/* 用户头像区域 */
.user-profile-section {
  display: flex;
  justify-content: center;
  margin-bottom: 25px;
}

.user-avatar-large {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color), #ffb700);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3), 
              0 0 0 2px rgba(255, 215, 0, 0.2),
              0 0 15px rgba(255, 215, 0, 0.15);
  transition: all 0.3s ease;
}

.user-avatar-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.large-avatar-placeholder {
  font-weight: bold;
  font-size: 38px;
  color: #111;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* 信息区域 */
.user-info-section {
  background-color: rgba(20, 20, 20, 0.6);
  border-radius: 12px;
  padding: 8px 16px;
  margin-bottom: 24px;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 215, 0, 0.08);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
}

.info-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  font-weight: 500;
}

.info-value {
  display: flex;
  align-items: center;
}

.info-text {
  color: rgba(255, 255, 255, 0.95);
  font-size: 14px;
  font-weight: 500;
  text-align: right;
}

.balance-text {
  color: var(--primary-color);
  font-weight: 600;
  font-size: 15px;
  text-shadow: 0 0 5px rgba(255, 215, 0, 0.3);
}

.settings-divider {
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(255, 215, 0, 0.07), transparent);
  margin: 0;
}

.special-divider {
  height: 2px;
  background: linear-gradient(to right, transparent, rgba(255, 215, 0, 0.15), transparent);
  margin: 10px 0 20px;
}

.small-text {
  font-size: 12px;
  opacity: 0.8;
  margin-left: 2px;
}

/* 操作按钮区域 */
.settings-actions {
  display: flex;
  justify-content: center;
}

.change-password-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.12), rgba(255, 215, 0, 0.18));
  color: var(--primary-color);
  border: 1px solid rgba(255, 215, 0, 0.25);
  border-radius: 30px;
  padding: 12px 26px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 215, 0, 0.05);
  letter-spacing: 0.5px;
}

.change-password-btn:hover {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.25));
  color: #fff;
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3),
              0 0 15px rgba(255, 215, 0, 0.18);
  border-color: rgba(255, 215, 0, 0.4);
}

.change-password-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 215, 0, 0.22));
}

.action-icon {
  font-style: normal;
  font-size: 16px;
  filter: drop-shadow(0 0 2px rgba(255, 215, 0, 0.3));
}

@media (max-width: 480px) {
  .account-settings-dialog {
    width: 90%;
    max-width: 340px;
  }
  
  .settings-header {
    padding: 16px 20px;
  }
  
  .settings-content {
    padding: 16px 20px 24px;
  }
  
  .user-avatar-large {
    width: 80px;
    height: 80px;
  }
  
  .large-avatar-placeholder {
    font-size: 32px;
  }
}

/* API Key设置弹窗样式 */
.api-key-settings-dialog {
  width: 380px;
  max-width: 90vw;
}

.api-key-settings-section {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  margin-bottom: 8px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
}

.api-input {
  padding: 10px 12px;
  border-radius: 6px;
  background-color: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  transition: all 0.3s ease;
}

.api-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(226, 196, 75, 0.2);
}

.save-key-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background-color: var(--primary-color);
  color: #000;
  padding: 12px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  border: none;
  margin-top: 10px;
}

.save-key-btn:hover {
  background-color: #f3d155;
  transform: translateY(-2px);
}

.api-description {
  padding: 12px 16px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  margin-bottom: 15px;
  border-left: 3px solid var(--primary-color);
}

.form-helper {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 5px;
}

/* 自定义下拉菜单样式 */
.custom-dropdown {
  position: relative;
  width: 100%;
}

.dropdown-selected {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 12px 15px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 215, 0, 0.15);
  color: var(--text-light);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.dropdown-selected:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--primary-color);
}

.dropdown-arrow {
  color: var(--primary-color);
  font-size: 10px;
  transition: transform 0.3s ease;
}

.arrow-up {
  transform: rotate(180deg);
}

.dropdown-options {
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  width: 100%;
  background-color: #2a2a2a;
  border-radius: 8px;
  border: 1px solid rgba(255, 215, 0, 0.15);
  overflow: hidden;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  max-height: 200px;
  overflow-y: auto;
}

.dropdown-option {
  padding: 12px 15px;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: #2a2a2a;
}

.dropdown-option:hover {
  background-color: rgba(230, 200, 76, 0.2);
  color: var(--primary-color);
}

.option-selected {
  background-color: rgba(230, 200, 76, 0.15);
  color: var(--primary-color);
  font-weight: 500;
}

/* 余额刷新按钮样式 */
.balance-action-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  font-size: 13px;
  backdrop-filter: blur(5px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.balance-action-btn:hover:not(:disabled) {
  background: rgba(255, 215, 0, 0.15);
  color: var(--primary-color);
  transform: scale(1.1);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}

.balance-action-btn:active:not(:disabled) {
  transform: scale(1);
}

.balance-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn-icon {
  font-style: normal;
  transition: transform 0.3s ease;
}

.spinning {
  animation: spin-icon 1s linear infinite;
}

@keyframes spin-icon {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.refresh-btn:hover:not(:disabled) .action-btn-icon:not(.spinning) {
  transform: rotate(180deg);
}

/* ==================== 高级充值弹窗样式 ==================== */

/* 遮罩层动画 */
.recharge-overlay {
  animation: overlayFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes overlayFadeIn {
  from {
    opacity: 0;
    backdrop-filter: blur(0px);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(8px);
  }
}

/* 弹窗主容器 */
.recharge-dialog-premium {
  width: 480px;
  max-width: 90vw;
  background: linear-gradient(145deg, #0a0a0a 0%, #151515 50%, #0a0a0a 100%);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 
    0 25px 50px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(255, 215, 0, 0.1),
    0 0 60px rgba(255, 215, 0, 0.05);
  animation: dialogSlideIn 0.4s cubic-bezier(0.19, 1, 0.22, 1);
  position: relative;
}

@keyframes dialogSlideIn {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 顶部光效 */
.dialog-top-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 120px;
  background: radial-gradient(ellipse at top, rgba(255, 215, 0, 0.12) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

/* 头部区域 */
.recharge-header-premium {
  padding: 32px 32px 24px;
  text-align: center;
  position: relative;
  z-index: 1;
}

.header-icon-container {
  width: 72px;
  height: 72px;
  margin: 0 auto 20px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-glow-effect {
  position: absolute;
  inset: -8px;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.25) 0%, transparent 70%);
  border-radius: 50%;
  animation: pulseGlow 2s ease-in-out infinite;
}

@keyframes pulseGlow {
  0%, 100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

.header-main-icon {
  font-size: 40px;
  filter: drop-shadow(0 4px 12px rgba(255, 215, 0, 0.4));
  position: relative;
  z-index: 1;
}

.recharge-main-title {
  margin: 0 0 8px;
  font-size: 26px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.recharge-subtitle {
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 400;
  letter-spacing: 0.3px;
}

.premium-close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.premium-close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: rotate(90deg);
}

.close-icon {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 300;
  line-height: 1;
  transition: color 0.3s ease;
}

.premium-close-btn:hover .close-icon {
  color: rgba(255, 255, 255, 0.9);
}

/* 内容区域 */
.recharge-content-premium {
  padding: 0 32px 32px;
}

/* 购买提示卡片 */
.purchase-info-card {
  display: flex;
  gap: 14px;
  padding: 18px 20px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.06) 0%, rgba(255, 215, 0, 0.02) 100%);
  border-radius: 12px;
  margin-bottom: 28px;
  border: 1px solid rgba(255, 215, 0, 0.12);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.purchase-info-card:hover {
  border-color: rgba(255, 215, 0, 0.2);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.info-icon-wrapper {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 215, 0, 0.1);
  border-radius: 10px;
}

.info-icon {
  font-size: 20px;
  filter: drop-shadow(0 2px 4px rgba(255, 215, 0, 0.3));
}

.info-text-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  justify-content: center;
}

.info-primary {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.5;
}

.info-secondary {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.5;
}

.shop-highlight {
  color: var(--primary-color);
  font-weight: 600;
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
}

/* 店铺链接按钮 */
.shop-link-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  margin-top: 8px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.08) 0%, rgba(255, 215, 0, 0.04) 100%);
  border: 1px solid rgba(255, 215, 0, 0.25);
  border-radius: 20px;
  color: var(--primary-color);
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.15),
    0 0 0 0 rgba(255, 215, 0, 0);
  letter-spacing: 0.3px;
}

.shop-link-btn:hover {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 215, 0, 0.08) 100%);
  border-color: rgba(255, 215, 0, 0.5);
  transform: scale(1.04);
  box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.25),
    0 0 20px rgba(255, 215, 0, 0.3);
  color: #fff;
}

.shop-link-btn:active {
  transform: scale(1.01);
  box-shadow: 
    0 2px 6px rgba(0, 0, 0, 0.2),
    0 0 12px rgba(255, 215, 0, 0.2);
}

/* 按钮光泽效果 */
.btn-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.shop-link-btn:hover .btn-shine {
  left: 100%;
}

.btn-text {
  position: relative;
  z-index: 1;
}

.btn-arrow {
  width: 14px;
  height: 14px;
  transition: transform 0.3s ease;
  position: relative;
  z-index: 1;
}

.shop-link-btn:hover .btn-arrow {
  transform: translate(2px, -2px);
}

/* 卡密输入区 */
.card-input-section {
  margin-bottom: 28px;
}

.premium-label {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 10px;
}

.label-text {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 0.3px;
}

.label-required {
  color: #ff6b6b;
  font-size: 16px;
  font-weight: 600;
}

.premium-input-wrapper {
  position: relative;
  margin-bottom: 8px;
}

.premium-input {
  width: 100%;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  color: #fff;
  font-size: 14px;
  transition: all 0.3s ease;
  outline: none;
  box-sizing: border-box;
}

.premium-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.premium-input:focus {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 215, 0, 0.4);
  box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.08);
}

.premium-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-focus-border {
  position: absolute;
  inset: 0;
  border-radius: 10px;
  border: 2px solid transparent;
  pointer-events: none;
  transition: all 0.3s ease;
}

.premium-input:focus + .input-focus-border {
  border-color: rgba(255, 215, 0, 0.3);
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.15);
}

.input-hint {
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  padding-left: 4px;
}

/* 按钮组 */
.premium-actions {
  display: flex;
  gap: 12px;
}

/* 主要按钮（确认充值） */
.premium-primary-btn {
  flex: 2;
  position: relative;
  padding: 14px 24px;
  background: linear-gradient(135deg, #ffd700 0%, #ffb700 100%);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 
    0 4px 12px rgba(255, 215, 0, 0.3),
    0 2px 4px rgba(0, 0, 0, 0.2);
}

.premium-primary-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 
    0 6px 20px rgba(255, 215, 0, 0.4),
    0 4px 8px rgba(0, 0, 0, 0.3);
}

.premium-primary-btn:active:not(:disabled) {
  transform: translateY(0);
}

.premium-primary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-glow-layer {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, transparent 50%, rgba(255, 255, 255, 0.1) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.premium-primary-btn:hover:not(:disabled) .btn-glow-layer {
  opacity: 1;
}

.btn-content {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #000;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.btn-icon {
  width: 18px;
  height: 18px;
  stroke-width: 2.5;
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(0, 0, 0, 0.2);
  border-top-color: #000;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* 次要按钮（取消） */
.premium-secondary-btn {
  flex: 1;
  padding: 14px 24px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.premium-secondary-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.9);
  transform: translateY(-2px);
}

.premium-secondary-btn:active:not(:disabled) {
  transform: translateY(0);
}

.premium-secondary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 响应式优化 */
@media (max-width: 540px) {
  .recharge-dialog-premium {
    width: 95vw;
    border-radius: 16px;
  }
  
  .recharge-header-premium {
    padding: 24px 24px 20px;
  }
  
  .recharge-content-premium {
    padding: 0 24px 24px;
  }
  
  .recharge-main-title {
    font-size: 22px;
  }
  
  .premium-actions {
    flex-direction: column;
  }
  
  .premium-primary-btn,
  .premium-secondary-btn {
    flex: 1;
  }
}
</style> 

// 创建一个简单的事件总线，用于组件间通信
class EventBus {
  constructor() {
    this.events = {};
  }

  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
  }

  off(eventName, callback) {
    if (!this.events[eventName]) return;
    if (!callback) {
      delete this.events[eventName];
    } else {
      this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
    }
  }

  emit(eventName, data) {
    if (!this.events[eventName]) return;
    this.events[eventName].forEach(callback => {
      callback(data);
    });
  }
}

// 创建事件总线实例
const eventBus = new EventBus();

// 用户状态热更新服务
const userStateHMR = {
  // 更新用户状态
  updateUserState(userData) {
    console.log('hmrService: 更新用户状态:', userData);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('user', JSON.stringify(userData));
    
    // 通过事件总线通知所有监听组件
    console.log('hmrService: 触发user-state-changed事件');
    eventBus.emit('user-state-changed', userData);
    
    // 同时触发一个全局事件，确保能被捕获
    console.log('hmrService: 触发全局login-success事件');
    window.dispatchEvent(new Event('login-success'));
    
    // 记录登录时间戳
    localStorage.setItem('loginTimestamp', Date.now().toString());
  },
  
  // 清除用户状态
  clearUserState() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    
    // 触发自定义事件
    window.dispatchEvent(new Event('login-status-changed'));
    
    // 通过事件总线通知所有监听组件
    eventBus.emit('user-state-changed', null);
  },
  
  // 监听用户状态变化
  onUserStateChange(callback) {
    console.log('hmrService: 添加用户状态变化监听器');
    eventBus.on('user-state-changed', callback);
    
    // 立即检查当前状态
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
      try {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        console.log('hmrService: 发现已有登录状态，立即调用回调:', userData);
        // 延迟调用回调，确保App.vue已经完全挂载
        setTimeout(() => callback(userData), 100);
      } catch (e) {
        console.error('hmrService: 解析用户数据出错:', e);
      }
    }
    
    return () => eventBus.off('user-state-changed', callback);
  }
};

export { userStateHMR, eventBus }; 
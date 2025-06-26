import axios from 'axios';

// 创建axios实例
const api = axios.create({
  // baseURL: 'http://localhost:8080',
  baseURL: 'http://ysyj.cloud:8080',
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器，添加token和API Key参数
api.interceptors.request.use(
  config => {
    // 添加身份验证token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // 只有对六爻预测分析的请求添加自定义API Key参数
    if (config.url && config.url.includes('/api/liuyao/cast') && config.method === 'post') {
      // 从本地存储获取API Key设置
      const llmServiceType = localStorage.getItem('llmServiceType');
      const modelId = localStorage.getItem('modelId');
      const apiKey = localStorage.getItem('apiKey');
      
      // 如果设置了自定义API Key参数，添加到请求中
      if (llmServiceType && modelId && apiKey) {
        // 确保请求数据存在
        if (!config.data) {
          config.data = {};
        }
        
        // 如果config.data是字符串（已经被JSON.stringify处理），先解析为对象
        if (typeof config.data === 'string') {
          config.data = JSON.parse(config.data);
        }
        
        // 添加API参数
        config.data.llmServiceType = llmServiceType;
        config.data.modelId = modelId;
        config.data.apiKey = apiKey;
        
        console.log('使用自定义API Key参数:', { llmServiceType, modelId });
      }
    }
    
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器，处理token过期
api.interceptors.response.use(
  response => {
    console.log('response:', response);
    return response;
  },
  error => {
    console.log('响应拦截器错误error.data:', error.response.data);
    if (error.response && error.response.data && error.response.data.code === 302) {
      // token过期，清除本地存储并重定向到登录页
      localStorage.removeItem('token');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('user');
      // 使用完整URL路径确保重定向正确
      const baseUrl = window.location.origin;
      console.log('重定向到:', `${baseUrl}/login`);
      window.location.href = `${baseUrl}/login`;
    }
    return Promise.reject(error);
  }
);

// 用户注册
export const register = async (userData) => {
  try {
    const response = await api.post('/api/auth/register', userData);
    // 适配新的接口格式
    return {
      code: response.data.code,
      msg: response.data.message || response.data.msg,
      data: response.data.data
    };
  } catch (error) {
    if (error.response) {
      // 处理错误响应
      if (error.response.status === 400) {
        const errorData = error.response.data;
        
        // 返回与接口一致的格式
        return {
          code: 400,
          msg: errorData.message || '请求参数错误',
          data: errorData.data
        };
      } else if (error.response.status === 500) {
        // 服务器内部错误
        return {
          code: 500,
          msg: '服务器内部错误，请稍后再试',
          data: null
        };
      }
      throw error.response.data;
    }
    throw error;
  }
};

// 用户登录
export const login = async (userData) => {
  try {
    const response = await api.post('/api/auth/login', userData);
    
    // 保存token到本地存储
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    
    return {
      success: response.status === 200,
      ...response.data
    };
  } catch (error) {
    if (error.response) {
      // 处理错误响应
      if (error.response.status === 400) {
        // 请求参数错误
        return {
          success: false,
          message: error.response.data.message || '请求参数错误',
          errors: error.response.data.errors
        };
      } else if (error.response.status === 401) {
        // 用户名或密码错误
        return {
          success: false,
          message: '用户名或密码错误'
        };
      }
      throw error.response.data;
    }
    throw error;
  }
};

// 检查用户是否已登录
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

// 退出登录
export const logout = () => {
  console.log('执行退出登录操作');
  localStorage.removeItem('token');
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('user');
  // 使用完整URL路径确保重定向正确
  const baseUrl = window.location.origin;
  console.log('重定向到:', `${baseUrl}/login`);
  window.location.href = `${baseUrl}/login`;
};

// 发送短信验证码
export const sendSmsCode = async (phoneNumber, requestType = "SIGN_IN") => {
  try {
    const response = await api.post('/api/auth/register/sms/code', { phoneNumber, requestType });
    // 适配新的接口格式
    return {
      code: response.data.code,
      msg: response.data.msg,
      data: response.data.data
    };
  } catch (error) {
    if (error.response) {
      // 处理错误响应
      if (error.response.status === 400) {
        // 请求参数错误，如手机号格式不正确
        return {
          code: 400,
          msg: error.response.data.message || '手机号格式不正确',
          data: null
        };
      } else if (error.response.status === 500) {
        // 服务器内部错误
        return {
          code: 500,
          msg: '验证码发送失败，请稍后再试',
          data: null
        };
      }
      throw error.response.data;
    }
    throw error;
  }
};

// 获取用户余额
export const getUserBalance = async () => {
  try {
    const response = await api.get('/api/auth/get/balance');
    // 适配接口格式
    return {
      code: response.data.code,
      msg: response.data.msg,
      data: response.data.data // 返回的余额数据，字符串形式
    };
  } catch (error) {
    if (error.response) {
      // 处理错误响应
      if (error.response.status === 400) {
        return {
          code: 400,
          msg: '该用户不存在',
          data: null
        };
      } else if (error.response.status === 401) {
        return {
          code: 401,
          msg: '未登录或登录已过期',
          data: null
        };
      } else if (error.response.status === 500) {
        return {
          code: 500,
          msg: '服务器内部错误',
          data: null
        };
      }
      throw error.response.data;
    }
    throw error;
  }
};

// 修改密码
export const updatePassword = async (updateData) => {
  try {
    const response = await api.post('/api/auth/update/password', updateData);
    // 适配接口格式
    return {
      code: response.data.code,
      msg: response.data.message || response.data.msg,
      data: response.data.data
    };
  } catch (error) {
    if (error.response) {
      // 处理错误响应
      if (error.response.status === 400) {
        return {
          code: 400,
          msg: error.response.data.message || '请求参数错误',
          data: null
        };
      } else if (error.response.status === 401) {
        return {
          code: 401,
          msg: '未登录或登录已过期',
          data: null
        };
      } else if (error.response.status === 500) {
        return {
          code: 500,
          msg: '服务器内部错误',
          data: null
        };
      }
      throw error.response.data;
    }
    throw error;
  }
};

// 发送邮箱验证码
export const sendEmailCode = async (email, requestType = "SIGN_IN") => {
  try {
    const response = await api.post('/api/auth/email/code', { email, requestType });
    // 适配新的接口格式
    return {
      code: response.data.code,
      msg: response.data.message || response.data.msg,
      data: response.data.data
    };
  } catch (error) {
    if (error.response) {
      // 处理错误响应
      if (error.response.status === 400) {
        // 请求参数错误，如邮箱格式不正确
        return {
          code: 400,
          msg: error.response.data.message || '邮箱格式不正确',
          data: null
        };
      } else if (error.response.status === 500) {
        // 服务器内部错误
        return {
          code: 500,
          msg: '验证码发送失败，请稍后再试',
          data: null
        };
      }
      throw error.response.data;
    }
    throw error;
  }
};

export default api; 
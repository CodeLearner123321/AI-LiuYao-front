import { ref, reactive } from 'vue';
import { getUserPermissions, hasPermission, getUserRole } from '../services/api';

// 权限状态管理
const permissions = reactive({
  role: 0,
  viewPermissions: [],
  isLoaded: false
});

// 加载权限信息
export const loadPermissions = async () => {
  try {
    const response = await getUserPermissions();
    if (response.code === 200) {
      permissions.role = response.data.role;
      permissions.viewPermissions = response.data.viewPermissions || [];
      permissions.isLoaded = true;
      
      // 保存到本地存储
      localStorage.setItem('userPermissions', JSON.stringify({
        role: response.data.role,
        viewPermissions: response.data.viewPermissions || []
      }));
      
      return true;
    }
  } catch (error) {
    console.error('加载权限信息失败:', error);
    // 如果接口失败，尝试从本地存储加载
    const storedPermissions = localStorage.getItem('userPermissions');
    if (storedPermissions) {
      const parsed = JSON.parse(storedPermissions);
      permissions.role = parsed.role;
      permissions.viewPermissions = parsed.viewPermissions || [];
      permissions.isLoaded = true;
    }
  }
  return false;
};

// 检查是否有特定权限
export const checkPermission = (permission) => {
  console.log('检查权限:', permission);
  console.log('当前权限列表:', permissions.viewPermissions);
  console.log('权限是否包含:', permissions.viewPermissions.includes(permission));
  return permissions.viewPermissions.includes(permission);
};

// 检查用户角色
export const checkRole = (role) => {
  return permissions.role === role;
};

// 获取当前权限状态
export const getCurrentPermissions = () => {
  return {
    role: permissions.role,
    viewPermissions: permissions.viewPermissions,
    isLoaded: permissions.isLoaded
  };
};

// 清除权限信息（登出时使用）
export const clearPermissions = () => {
  permissions.role = 0;
  permissions.viewPermissions = [];
  permissions.isLoaded = false;
  localStorage.removeItem('userPermissions');
};

export { permissions }; 
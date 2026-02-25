<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';
import NavBar from '../components/NavBar.vue';
import { checkPermission, checkRole, loadPermissions, getCurrentPermissions } from '../composables/usePermissions';

const router = useRouter();

// 权限检查
const hasUploadPermission = ref(false);
const isRootUser = ref(false);

// 文件上传相关
const selectedFile = ref(null);
const selectedImage = ref(null);
const uploadProgress = ref(0);
const isUploading = ref(false);
const uploadStatus = ref('');

// 图片预览URL
const imagePreviewUrl = computed(() => {
  if (selectedImage.value) {
    try {
      return URL.createObjectURL(selectedImage.value);
    } catch (error) {
      console.error('创建图片预览URL失败:', error);
      return '';
    }
  }
  return '';
});

// 表单相关
const showUploadForm = ref(false);
const formData = ref({
  author: '',
  type: 'book', // 默认为书籍类型
  id: null, // 图片上传后的ID
  fileName: '',
  fileSize: 0
});

// 检查权限
const checkUserPermissions = async () => {
  // 先尝试加载权限信息
  try {
    await loadPermissions();
  } catch (error) {
    console.error('加载权限信息失败:', error);
  }
  
  // 然后检查权限
  hasUploadPermission.value = checkPermission('uploadView');
  isRootUser.value = checkRole(100); // Root用户角色为100
  
  console.log('权限检查结果:', {
    hasUploadPermission: hasUploadPermission.value,
    isRootUser: isRootUser.value,
    permissions: getCurrentPermissions()
  });
  
  // 如果没有权限，重定向到首页
  if (!hasUploadPermission.value) {
    alert('您没有权限访问此页面');
    router.push('/');
    return;
  }
};

// 显示上传表单
const showForm = () => {
  showUploadForm.value = true;
  // 保存之前的id
  const previousid = formData.value?.id;
  
  // 重置表单数据，但保留id
  formData.value = {
    author: '',
    type: 'book',
    id: previousid, // 保留之前的图片ID
    fileName: '',
    fileSize: 0
  };
  
  // 只重置文件选择，保留图片选择和ID
  selectedFile.value = null;
  // 如果没有图片ID，也重置图片选择
  if (!previousid) {
    selectedImage.value = null;
  }
};

// 关闭上传表单
const closeForm = () => {
  showUploadForm.value = false;
  // 不要在这里重置selectedImage和formData，以便在重新打开表单时保留之前的状态
  // Blob URL会通过计算属性自动管理
};

// 图片选择处理
const handleImageSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    // 如果之前有选择过图片，computed属性会自动处理Blob URL的创建和释放
    selectedImage.value = file;
    uploadStatus.value = `已选择图片: ${file.name}`;
    
    // 不再清除之前的图片ID，允许用户使用新图片更新之前的记录
    // 用户可以通过上传按钮重新上传图片，保留之前的ID
  }
};

// 文件选择处理
const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    selectedFile.value = file;
    formData.value.fileName = file.name;
    formData.value.fileSize = file.size;
    formData.value.fileFormat = file.name.split('.').pop().toUpperCase();
    uploadStatus.value = `已选择文件: ${file.name}`;
  }
};

// 上传图片
const uploadImage = async () => {
  if (!selectedImage.value) {
    alert('请先选择要上传的图片');
    return;
  }
  
  const imageFormData = new FormData();
  imageFormData.append('file', selectedImage.value);
  
  // 添加文件信息作为表单字段，而不是URL参数
  imageFormData.append('type', 'image');
  imageFormData.append('fileName', selectedImage.value.name);
  imageFormData.append('fileSize', selectedImage.value.size);
  imageFormData.append('fileFormat', selectedImage.value.name.split('.').pop().toUpperCase());
  
  // 如果已经有图片ID，也一并传递，表示更新操作
  if (formData.value.id) {
    imageFormData.append('id', formData.value.id);
  }
  
  try {
    isUploading.value = true;
    uploadProgress.value = 0;
    uploadStatus.value = '正在上传图片...';
    
    const response = await api.post('/api/file/upload', imageFormData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        uploadProgress.value = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
      }
    });
    
    if (response.data.code === 200) {
      const isUpdate = formData.value.id ? '更新' : '上传';
      uploadStatus.value = `图片${isUpdate}成功！`;
      formData.value.id = response.data.data; // 保存图片ID
      // 不要在这里将selectedImage设为null，这会导致UI渲染问题
      // 保留selectedImage以便用户可以看到已上传的图片
    } else {
      uploadStatus.value = `图片上传失败: ${response.data.msg}`;
    }
  } catch (error) {
    console.error('图片上传失败:', error);
    uploadStatus.value = '图片上传失败，请稍后重试';
  } finally {
    isUploading.value = false;
  }
};

// 上传文件
const uploadFile = async () => {
  if (!selectedFile.value) {
    alert('请先选择要上传的文件');
    return;
  }
  
  if (!formData.value.author.trim()) {
    alert('请输入作者姓名');
    return;
  }
  
  const uploadFormData = new FormData();
  uploadFormData.append('file', selectedFile.value);
  
  // 添加文件信息作为表单字段，而不是URL参数
  uploadFormData.append('type', formData.value.type);
  uploadFormData.append('fileName', formData.value.fileName);
  uploadFormData.append('fileSize', formData.value.fileSize);
  uploadFormData.append('fileFormat', formData.value.fileFormat);
  uploadFormData.append('author', formData.value.author);
  if (formData.value.id) {
    uploadFormData.append('id', formData.value.id);
  }
  
  try {
    isUploading.value = true;
    uploadProgress.value = 0;
    uploadStatus.value = '正在上传文件...';
    
    const response = await api.post('/api/file/upload', uploadFormData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        uploadProgress.value = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
      }
    });
    
    if (response.data.code === 200) {
      uploadStatus.value = '文件上传成功！';
      selectedFile.value = null;
      // 不清除图片ID，保留以便用户可以继续使用
      // 关闭表单但保留状态
      closeForm();
    } else {
      uploadStatus.value = `文件上传失败: ${response.data.msg}`;
    }
  } catch (error) {
    console.error('文件上传失败:', error);
    uploadStatus.value = '文件上传失败，请稍后重试';
  } finally {
    isUploading.value = false;
  }
};

// 组件挂载时检查权限
onMounted(() => {
  checkUserPermissions();
});

// 组件卸载时清理资源
onUnmounted(() => {
  // 确保释放所有Blob URL资源
  if (imagePreviewUrl.value) {
    try {
      URL.revokeObjectURL(imagePreviewUrl.value);
    } catch (error) {
      console.error('释放Blob URL资源失败:', error);
    }
  }
});
</script>

<template>
  <div class="upload-page">
    <NavBar />
    
    <div class="upload-container">
      <div class="page-header">
        <h1 class="page-title">资料上传</h1>
        <p class="page-description">Root用户专用 - 上传六爻学习资料</p>
      </div>

      <!-- 权限提示 -->
      <div v-if="!hasUploadPermission" class="permission-denied">
        <div class="denied-icon">🚫</div>
        <h3>权限不足</h3>
        <p>您没有权限访问此页面</p>
        <button @click="router.push('/')" class="back-button">
          返回首页
        </button>
      </div>

      <!-- 上传界面 -->
      <div v-else class="upload-section">
        <!-- 用户角色提示 -->
        <div class="role-info">
          <div class="role-badge" :class="{ 'root-user': isRootUser }">
            <i class="role-icon">{{ isRootUser ? '👑' : '👤' }}</i>
            <span>{{ isRootUser ? 'Root用户' : '普通用户' }}</span>
          </div>
        </div>

        <!-- 开始上传按钮 -->
        <div class="start-upload">
          <button @click="showForm" class="start-button">
            <i class="start-icon">📚</i>
            <span>开始上传资料</span>
          </button>
        </div>

        <!-- 上传说明 -->
        <div class="upload-instructions">
          <h3>上传说明</h3>
          <ul>
            <li>支持 PDF、DOC、DOCX、TXT 格式文件</li>
            <li>支持 JPG、PNG、GIF 格式图片</li>
            <li>文件大小限制：50MB</li>
            <li>图片大小限制：10MB</li>
            <li>请先上传图片，再上传对应的文件</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 上传表单弹窗 -->
    <div v-if="showUploadForm" class="modal-overlay" @click="closeForm">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>上传资料</h2>
          <button @click="closeForm" class="close-button">×</button>
        </div>

        <div class="modal-body">
          <!-- 作者输入 -->
          <div class="form-group">
            <label>作者姓名 *</label>
            <input 
              v-model="formData.author"
              type="text" 
              placeholder="请输入作者姓名"
              class="form-input"
            >
          </div>

          <!-- 图片上传 -->
          <div class="form-group">
            <label>封面图片</label>
            <div class="image-upload-zone" @click="$refs.imageInput.click()">
              <div v-if="!selectedImage" class="upload-placeholder">
                <i class="upload-icon">🖼️</i>
                <p>点击选择图片</p>
              </div>
              <div v-else class="image-preview">
                <template v-if="selectedImage && imagePreviewUrl">
                  <img :src="imagePreviewUrl" alt="预览图片">
                  <p>{{ selectedImage.name }}</p>
                </template>
                <template v-else>
                  <i class="upload-icon">🖼️</i>
                  <p>图片加载失败，请重新选择</p>
                </template>
              </div>
              <input 
                ref="imageInput"
                type="file" 
                @change="handleImageSelect"
                accept="image/*"
                style="display: none;"
              >
            </div>
            <button 
              v-if="selectedImage && !isUploading"
              @click="uploadImage" 
              class="upload-image-btn"
              :class="{ 'with-id': formData.id }"
            >
              {{ formData.id ? '重新上传图片' : '上传图片' }}
            </button>
            <button 
              v-if="selectedImage && isUploading"
              disabled
              class="upload-image-btn uploading"
            >
              上传中...
            </button>
            <div v-if="formData.id" class="image-uploaded">
              <span>✅ 图片已上传，可继续操作</span>
              <span class="image-id-info" title="图片ID，用于后续操作">ID: {{ formData.id }}</span>
            </div>
          </div>

          <!-- 文件上传 -->
          <div class="form-group">
            <label>学习资料文件 *</label>
            <div class="file-upload-zone" @click="$refs.fileInput.click()">
              <div v-if="!selectedFile" class="upload-placeholder">
                <i class="upload-icon">📁</i>
                <p>点击选择文件</p>
              </div>
              <div v-else class="file-preview">
                <i class="file-icon">📄</i>
                <div class="file-details">
                  <h4>{{ selectedFile.name }}</h4>
                  <p>{{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB</p>
                </div>
              </div>
              <input 
                ref="fileInput"
                type="file" 
                @change="handleFileSelect"
                accept=".pdf,.doc,.docx,.txt"
                style="display: none;"
              >
            </div>
          </div>

          <!-- 上传进度 -->
          <div v-if="isUploading" class="upload-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
            </div>
            <span class="progress-text">{{ uploadProgress }}%</span>
          </div>

          <!-- 上传状态 -->
          <div v-if="uploadStatus" class="upload-status">
            <p :class="{ 'success': uploadStatus.includes('成功'), 'error': uploadStatus.includes('失败') }">
              {{ uploadStatus }}
            </p>
          </div>

          <!-- 操作按钮 -->
          <div class="form-actions">
            <button @click="closeForm" class="cancel-button">取消</button>
            <button 
              @click="uploadFile" 
              :disabled="!selectedFile || !formData.author.trim() || isUploading"
              class="submit-button"
            >
              {{ isUploading ? '上传中...' : '上传文件' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.upload-page {
  min-height: 100vh;
  min-height: 100svh;
  min-height: 100dvh;
  background: var(--dark-bg, #0a0a0a);
  display: flex;
  flex-direction: column;
}

.upload-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 60px 20px 40px;
  flex: 1;
}

.page-header {
  text-align: center;
  margin-bottom: 50px;
}

.page-title {
  font-size: 2.8rem;
  color: var(--primary-color);
  margin-bottom: 15px;
  font-weight: 600;
}

.page-description {
  color: #aaa;
  font-size: 1.2rem;
}

.permission-denied {
  text-align: center;
  padding: 80px 40px;
  color: #ff4d4f;
}

.denied-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.permission-denied h3 {
  font-size: 1.8rem;
  color: #ff4d4f;
  margin-bottom: 15px;
}

.permission-denied p {
  color: #aaa;
  font-size: 1.1rem;
  margin-bottom: 30px;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 77, 79, 0.1);
  color: #ff4d4f;
  border: 1px solid rgba(255, 77, 79, 0.3);
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.back-button:hover {
  background: rgba(255, 77, 79, 0.2);
  transform: translateY(-2px);
}

.upload-section {
  background: linear-gradient(145deg, #1a1a1a, #2a2a2a);
  border-radius: 16px;
  padding: 40px;
  border: 1px solid rgba(255, 215, 0, 0.1);
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.3);
}

.role-info {
  text-align: center;
  margin-bottom: 30px;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
  color: #aaa;
  font-size: 0.9rem;
  font-weight: 500;
}

.role-badge.root-user {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1));
  color: var(--primary-color);
  border: 1px solid rgba(255, 215, 0, 0.3);
}

.role-icon {
  font-style: normal;
}

.start-upload {
  text-align: center;
  margin-bottom: 40px;
}

.start-button {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, var(--primary-color), #ffb700);
  color: #000;
  padding: 16px 32px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
}

.start-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(255, 215, 0, 0.5);
}

.start-icon {
  font-size: 1.5rem;
}

.upload-instructions {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 25px;
  border: 1px solid rgba(255, 215, 0, 0.2);
}

.upload-instructions h3 {
  color: var(--primary-color);
  margin-bottom: 15px;
  font-size: 1.3rem;
}

.upload-instructions ul {
  color: #aaa;
  line-height: 1.6;
  margin: 0;
  padding-left: 20px;
}

.upload-instructions li {
  margin-bottom: 8px;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: linear-gradient(145deg, #1a1a1a, #2a2a2a);
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid rgba(255, 215, 0, 0.2);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px 30px;
  border-bottom: 1px solid rgba(255, 215, 0, 0.2);
}

.modal-header h2 {
  color: var(--primary-color);
  margin: 0;
  font-size: 1.5rem;
}

.close-button {
  background: none;
  border: none;
  color: #aaa;
  font-size: 2rem;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.modal-body {
  padding: 30px;
}

.form-group {
  margin-bottom: 25px;
}

.form-group label {
  display: block;
  color: #fff;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 8px;
  color: #fff;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
  background: rgba(255, 255, 255, 0.15);
}

.form-input::placeholder {
  color: #666;
}

.image-upload-zone,
.file-upload-zone {
  border: 2px dashed rgba(255, 215, 0, 0.3);
  border-radius: 12px;
  padding: 30px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.02);
  margin-bottom: 15px;
}

.image-upload-zone:hover,
.file-upload-zone:hover {
  border-color: var(--primary-color);
  background: rgba(255, 215, 0, 0.05);
}

.upload-placeholder {
  color: #aaa;
}

.upload-placeholder .upload-icon {
  font-size: 2.5rem;
  margin-bottom: 10px;
  display: block;
}

.upload-placeholder p {
  margin: 0;
  font-size: 1rem;
}

.image-preview {
  color: #fff;
}

.image-preview img {
  max-width: 100%;
  max-height: 200px;
  border-radius: 8px;
  margin-bottom: 10px;
}

.image-preview p {
  margin: 0;
  color: #aaa;
  font-size: 0.9rem;
}

.file-preview {
  display: flex;
  align-items: center;
  gap: 15px;
  color: #fff;
}

.file-icon {
  font-size: 2rem;
  color: var(--primary-color);
}

.file-details h4 {
  margin: 0 0 5px;
  font-size: 1.1rem;
}

.file-details p {
  margin: 0;
  color: #aaa;
  font-size: 0.9rem;
}

.upload-image-btn {
  background: linear-gradient(135deg, #4caf50, #45a049);
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.upload-image-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.upload-image-btn:disabled,
.upload-image-btn.uploading {
  opacity: 0.6;
  cursor: not-allowed;
  background: #666;
}

.upload-image-btn.with-id {
  background: linear-gradient(135deg, #4caf50, #45a049);
  color: #fff;
}

.upload-image-btn.with-id:hover {
  background: linear-gradient(135deg, #45a049, #3d8b3d);
}

.image-uploaded {
  color: #4caf50;
  font-size: 0.9rem;
  text-align: center;
  padding: 10px;
  background: rgba(76, 175, 80, 0.1);
  border-radius: 6px;
  border: 1px solid rgba(76, 175, 80, 0.3);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.image-id-info {
  font-size: 0.85rem;
  color: #888;
  background-color: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  cursor: help;
}

.upload-progress {
  margin-bottom: 20px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), #ffb700);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  color: #aaa;
  font-size: 0.9rem;
}

.upload-status {
  margin-bottom: 20px;
}

.upload-status p {
  padding: 12px 16px;
  border-radius: 6px;
  font-weight: 500;
  text-align: center;
}

.upload-status .success {
  background: rgba(76, 175, 80, 0.1);
  color: #4caf50;
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.upload-status .error {
  background: rgba(255, 77, 79, 0.1);
  color: #ff4d4f;
  border: 1px solid rgba(255, 77, 79, 0.3);
}

.form-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 30px;
}

.cancel-button {
  background: rgba(255, 255, 255, 0.1);
  color: #aaa;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.cancel-button:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.submit-button {
  background: linear-gradient(135deg, var(--primary-color), #ffb700);
  color: #000;
  border: none;
  padding: 12px 30px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .upload-container {
    padding: 40px 15px 30px;
  }
  
  .page-title {
    font-size: 2.2rem;
  }
  
  .upload-section {
    padding: 25px;
  }
  
  .modal-content {
    margin: 10px;
    max-height: 95vh;
  }
  
  .modal-header,
  .modal-body {
    padding: 20px;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .submit-button,
  .cancel-button {
    width: 100%;
  }
}
</style>
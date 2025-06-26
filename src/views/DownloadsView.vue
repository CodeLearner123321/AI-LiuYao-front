<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';

// 资料列表数据
const downloads = ref([]);
const loading = ref(true);
const error = ref(null);

// 获取书籍列表
const fetchBooks = async () => {
  try {
    loading.value = true;
    const response = await api.get('/api/file/system/books');
    if (response.data.code === 200) {
      downloads.value = response.data.data.map(book => ({
        ...book,
        downloadUrl: `/api/file/download/${book.title}`
      }));
    } else {
      error.value = response.data.msg || '获取书籍列表失败';
    }
  } catch (err) {
    error.value = '获取书籍列表失败，请稍后重试';
    console.error('获取书籍列表失败:', err);
  } finally {
    loading.value = false;
  }
};

// 处理文件下载
const handleDownload = async (fileName) => {
  try {
    const response = await api.get(`/api/file/download/${fileName}`, {
      responseType: 'blob'
    });
    
    // 创建下载链接
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    
    // 清理
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error('下载文件失败:', err);
    alert('下载文件失败，请稍后重试');
  }
};

// 组件挂载时获取数据
onMounted(() => {
  fetchBooks();
});
</script>

<template>
  <div class="downloads-container">
    <div class="page-header">
      <h1 class="page-title">资料下载</h1>
      <p class="page-description">精选六爻学习资料，助您更好地理解六爻预测</p>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <p class="error-message">{{ error }}</p>
      <button class="retry-button" @click="fetchBooks">
        <i class="retry-icon">🔄</i>
        <span>重试</span>
      </button>
    </div>

    <!-- 数据展示 -->
    <div v-else class="downloads-grid">
      <div v-for="item in downloads" :key="item.id" class="download-card">
        <div class="card-header">
          <h3 class="card-title">{{ item.title }}</h3>
          <span class="format-badge">{{ item.format }}</span>
        </div>
        
        <p class="card-description">{{ item.description }}</p>
        
        <div class="card-footer">
          <span class="file-size">{{ item.size }}</span>
          <button 
            class="download-button" 
            @click="handleDownload(item.title)"
          >
            <i class="download-icon">⬇️</i>
            <span>下载</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.downloads-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-title {
  font-size: 2.5rem;
  color: var(--primary-color);
  margin-bottom: 10px;
  font-weight: 600;
}

.page-description {
  color: #888;
  font-size: 1.1rem;
}

.downloads-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-top: 30px;
}

.download-card {
  background: linear-gradient(145deg, #1a1a1a, #2a2a2a);
  border-radius: 12px;
  padding: 24px;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 215, 0, 0.1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.download-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 215, 0, 0.2);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.card-title {
  font-size: 1.2rem;
  color: #fff;
  margin: 0;
  font-weight: 500;
}

.format-badge {
  background: rgba(255, 215, 0, 0.1);
  color: var(--primary-color);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.card-description {
  color: #aaa;
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 20px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.file-size {
  color: #666;
  font-size: 0.9rem;
}

.download-button {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, var(--primary-color), #ffb700);
  color: #000;
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.download-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
}

.download-button:active {
  transform: translateY(0);
}

.download-icon {
  font-style: normal;
}

@media (max-width: 768px) {
  .downloads-container {
    padding: 20px;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .downloads-grid {
    grid-template-columns: 1fr;
  }
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #888;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 215, 0, 0.3);
  border-radius: 50%;
  border-top-color: var(--primary-color);
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-state {
  text-align: center;
  padding: 40px;
  color: #ff4d4f;
}

.error-message {
  margin-bottom: 16px;
  font-size: 1.1rem;
}

.retry-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 77, 79, 0.1);
  color: #ff4d4f;
  border: 1px solid rgba(255, 77, 79, 0.2);
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.retry-button:hover {
  background: rgba(255, 77, 79, 0.2);
  transform: translateY(-2px);
}

.retry-icon {
  font-style: normal;
}
</style> 
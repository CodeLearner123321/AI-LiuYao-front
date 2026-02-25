<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '../services/api';
import NavBar from '../components/NavBar.vue';

// 资料列表数据
const downloads = ref([]);
const loading = ref(true);
const error = ref(null);
const searchQuery = ref('');

// 分页相关数据
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const hasMore = ref(true);

// 计算过滤后的书籍列表
const filteredBooks = computed(() => {
  if (!searchQuery.value.trim()) {
    return downloads.value;
  }
  
  const query = searchQuery.value.toLowerCase();
  return downloads.value.filter(book => 
    book.title.toLowerCase().includes(query) ||
    book.description.toLowerCase().includes(query) ||
    (book.author && book.author.toLowerCase().includes(query))
  );
});

// 从文件名中提取作者信息
const extractAuthorFromTitle = (title) => {
  // 常见的作者提取模式
  const patterns = [
    /\((.*?)\)/, // 括号内的内容
    /（(.*?)）/, // 中文括号
    /-([^-]+)$/, // 最后一个连字符后的内容
    /作者[:：]\s*(.+)/, // 作者: 格式
  ];
  
  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return null;
};

// 生成书籍封面颜色
const getBookCoverColor = (title) => {
  const colors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
  ];
  
  // 根据标题生成固定的颜色索引
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// 获取书籍列表
const fetchBooks = async (page = 1, size = 10) => {
  try {
    loading.value = true;
    
    // 构建分页请求参数，确保参数为数字类型
    const pageRequest = {
      current: Number(page),
      size: Number(size)
    };
    
    // 使用POST请求并传递分页参数
    const response = await api.post('/api/file/system/books', pageRequest);
    
    if (response.data.code === 200) {
      // 获取分页结果
      const pageResult = response.data.data;
      
      // 更新总记录数和分页信息
      total.value = pageResult.total || 0;
      currentPage.value = page;
      pageSize.value = size;
      hasMore.value = pageResult.records.length > 0 && pageResult.current < pageResult.pages;
      
      // 处理书籍数据
      const newBooks = pageResult.records.map(book => {
        // 确保book对象有id字段
        if (!book.id) {
          console.warn('书籍数据缺少id字段:', book);
        }
        
        return {
          ...book,
          // 使用id而不是title构建下载URL
          downloadUrl: `/api/file/download/${book.id || 0}`,
          author: extractAuthorFromTitle(book.title),
          coverColor: getBookCoverColor(book.title),
          // 提取纯书名（去掉作者信息）
          cleanTitle: book.title.replace(/[（(].*?[）)]/g, '').replace(/-[^-]+$/, '').trim()
        };
      });
      
      // 如果是第一页，直接替换数据，否则追加数据
      if (page === 1) {
        downloads.value = newBooks;
      } else {
        downloads.value = [...downloads.value, ...newBooks];
      }
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

// 加载更多书籍
const loadMoreBooks = () => {
  if (hasMore.value && !loading.value) {
    fetchBooks(currentPage.value + 1, pageSize.value);
  }
};

// 处理文件下载
const handleDownload = async (fileId) => {
  try {
    console.log('开始下载文件，ID:', fileId);
    
    // 调用后端下载接口，获取下载URL
    const response = await api.get(`/api/file/download/${fileId}`);
    
    if (response.data) {
      // 后端返回的是下载URL
      const downloadUrl = response.data;
      console.log('获取到下载URL:', downloadUrl);
      
     // 创建一个隐藏的a标签
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = ''; // 设置download属性，浏览器会触发下载
      link.style.display = 'none';
      // 将a标签添加到DOM中
      document.body.appendChild(link);
      // 模拟点击
      link.click();
      // 移除a标签
      document.body.removeChild(link);
    } else {
      throw new Error('获取下载链接失败');
    }
  } catch (err) {
    console.error('下载文件失败:', err);
    alert('下载文件失败，请稍后重试');
  }
};

// 清空搜索
const clearSearch = () => {
  searchQuery.value = '';
  // 如果之前有搜索，清空后重新加载第一页数据
  if (downloads.value.length === 0) {
    fetchBooks(1, pageSize.value);
  }
};

// 组件挂载时获取数据
onMounted(() => {
  // 初始化时获取第一页数据
  fetchBooks(currentPage.value, pageSize.value);
});
</script>

<template>
  <div class="downloads-page">
    <NavBar />
    
    <div class="downloads-container">
      <div class="page-header">
        <h1 class="page-title">资料下载</h1>
        <p class="page-description">精选六爻学习资料，助您更好地理解六爻预测</p>
      </div>

      <!-- 搜索框 -->
      <div class="search-section">
        <div class="search-bar">
          <i class="search-icon">🔍</i>
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="搜索书籍名称、作者或描述..." 
            class="search-input"
          >
          <button v-if="searchQuery" @click="clearSearch" class="clear-button">
            <i class="clear-icon">✕</i>
          </button>
        </div>
        <div v-if="searchQuery" class="search-results">
          找到 {{ filteredBooks.length }} 本相关书籍
        </div>
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
      <div v-else>
        <div class="downloads-grid">
          <div v-for="item in filteredBooks" :key="item.id" class="download-card">
            <!-- 书籍封面 -->
            <div class="book-cover" :style="{ background: item.coverColor }">
              <div class="cover-content">
                <div class="book-icon">📚</div>
                <div class="format-badge">{{ item.format }}</div>
              </div>
            </div>
            
            <!-- 书籍信息 -->
            <div class="book-info">
              <div class="book-header">
                <h3 class="book-title">{{ item.cleanTitle }}</h3>
                <span class="file-size">{{ item.size }}</span>
              </div>
              
              <div v-if="item.author" class="book-author">
                <i class="author-icon">✍️</i>
                <span>{{ item.author }}</span>
              </div>
              
              <p class="book-description">{{ item.description }}</p>
              
              <div class="book-actions">
                <button 
                  class="download-button" 
                  @click="handleDownload(item.id)"
                  :disabled="!item.id"
                  :title="item.id ? '点击下载' : '无法下载，缺少文件ID'"
                >
                  <i class="download-icon">⬇️</i>
                  <span>下载</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 加载更多按钮 -->
        <div v-if="!searchQuery && hasMore" class="load-more-container">
          <button 
            class="load-more-button" 
            @click="loadMoreBooks"
            :disabled="loading"
          >
            <i class="load-more-icon" v-if="!loading">⏬</i>
            <div class="button-spinner" v-else></div>
            <span>{{ loading ? '加载中...' : '加载更多' }}</span>
          </button>
        </div>
        
        <!-- 分页信息 -->
        <div class="pagination-info" v-if="!searchQuery && total > 0">
          显示 {{ downloads.length }} / {{ total }} 条记录
        </div>
      </div>
      
      <!-- 无搜索结果 -->
      <div v-if="!loading && !error && searchQuery && filteredBooks.length === 0" class="no-results">
        <div class="no-results-icon">🔍</div>
        <h3>未找到相关书籍</h3>
        <p>请尝试其他关键词或清空搜索框查看所有书籍</p>
        <button @click="clearSearch" class="view-all-button">
          查看所有书籍
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.downloads-page {
  min-height: 100vh;
  min-height: 100svh;
  min-height: 100dvh;
  background: var(--dark-bg, #0a0a0a);
  display: flex;
  flex-direction: column;
}

.downloads-container {
  max-width: 1200px;
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
  text-shadow: 0 2px 10px rgba(255, 215, 0, 0.3);
}

.page-description {
  color: #aaa;
  font-size: 1.2rem;
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
}

.search-section {
  margin-bottom: 40px;
  text-align: center;
}

.search-bar {
  display: flex;
  align-items: center;
  background: #1a1a1a;
  border-radius: 10px;
  padding: 10px 15px;
  border: 1px solid rgba(255, 215, 0, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  max-width: 600px;
  margin: 0 auto 15px;
}

.search-bar .search-icon {
  font-size: 1.2rem;
  color: #888;
  margin-right: 10px;
}

.search-bar .search-input {
  flex: 1;
  background: none;
  border: none;
  color: #fff;
  font-size: 1rem;
  outline: none;
}

.search-bar .search-input::placeholder {
  color: #888;
}

.search-bar .clear-button {
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0 5px;
}

.search-bar .clear-button:hover {
  color: #ff4d4f;
}

.search-bar .clear-icon {
  font-style: normal;
}

.search-results {
  color: #777;
  font-size: 0.9rem;
  margin-bottom: 20px;
}

.downloads-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 30px;
  margin-top: 40px;
}

.download-card {
  background: linear-gradient(145deg, #1a1a1a, #2a2a2a);
  border-radius: 16px;
  padding: 28px;
  transition: all 0.4s ease;
  border: 1px solid rgba(255, 215, 0, 0.1);
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 20px;
}

.download-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--primary-color), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.download-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
  border-color: rgba(255, 215, 0, 0.3);
}

.download-card:hover::before {
  opacity: 1;
}

.book-cover {
  width: 120px;
  height: 160px;
  border-radius: 12px;
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.cover-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.6);
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}

.book-icon {
  font-size: 2rem;
  color: #fff;
  margin-right: 8px;
}

.format-badge {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 215, 0, 0.05));
  color: var(--primary-color);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  border: 1px solid rgba(255, 215, 0, 0.2);
  white-space: nowrap;
}

/* 加载更多按钮样式 */
.load-more-container {
  display: flex;
  justify-content: center;
  margin: 40px 0 20px;
}

.load-more-button {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, #1a1a1a, #2a2a2a);
  color: var(--primary-color);
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 10px;
  padding: 12px 25px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.load-more-button:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 215, 0, 0.4);
}

.load-more-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.load-more-icon {
  font-style: normal;
  margin-right: 10px;
  font-size: 1.2rem;
}

.button-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 215, 0, 0.3);
  border-top: 2px solid var(--primary-color);
  border-radius: 50%;
  margin-right: 10px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 分页信息样式 */
.pagination-info {
  text-align: center;
  color: #777;
  font-size: 0.9rem;
  margin: 20px 0 40px;
}

.book-info {
  flex: 1;
}

.book-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.book-title {
  font-size: 1.3rem;
  color: #fff;
  margin: 0;
  font-weight: 600;
  line-height: 1.4;
  flex: 1;
  margin-right: 15px;
}

.file-size {
  color: #777;
  font-size: 0.95rem;
  font-weight: 500;
}

.book-author {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  color: #bbb;
  font-size: 0.9rem;
}

.author-icon {
  font-size: 0.9rem;
  margin-right: 5px;
}

.book-description {
  color: #bbb;
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 20px;
  min-height: 48px;
}

.book-actions {
  display: flex;
  justify-content: flex-end;
}

.download-button {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, var(--primary-color), #ffb700);
  color: #000;
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.2);
}

.download-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
  background: linear-gradient(135deg, #ffb700, var(--primary-color));
}

.download-button:active {
  transform: translateY(0);
}

.download-icon {
  font-style: normal;
  font-size: 1.1rem;
}

.no-results {
  text-align: center;
  padding: 80px 40px;
  color: #888;
}

.no-results-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.no-results h3 {
  font-size: 1.8rem;
  color: #fff;
  margin-bottom: 15px;
}

.no-results p {
  color: #aaa;
  font-size: 1.1rem;
  margin-bottom: 30px;
}

.view-all-button {
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

.view-all-button:hover {
  background: rgba(255, 77, 79, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.2);
}

.view-all-button:active {
  transform: translateY(0);
}

@media (max-width: 768px) {
  .downloads-container {
    padding: 40px 15px 30px;
  }
  
  .page-title {
    font-size: 2.2rem;
  }
  
  .page-description {
    font-size: 1.1rem;
  }
  
  .downloads-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .download-card {
    padding: 22px;
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .book-cover {
    width: 100%;
    height: 140px;
  }

  .cover-content {
    flex-direction: column;
    align-items: flex-start;
    padding: 8px 12px;
  }

  .book-icon {
    font-size: 1.8rem;
    margin-right: 0;
    margin-bottom: 5px;
  }

  .book-title {
    font-size: 1.2rem;
  }

  .file-size {
    font-size: 0.85rem;
  }

  .book-author {
    font-size: 0.8rem;
  }

  .author-icon {
    font-size: 0.8rem;
  }

  .book-description {
    font-size: 0.9rem;
  }

  .book-actions {
    width: 100%;
    justify-content: center;
  }

  .download-button {
    width: 100%;
    justify-content: center;
  }

  .no-results h3 {
    font-size: 1.5rem;
  }

  .no-results p {
    font-size: 1rem;
  }
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  color: #888;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 215, 0, 0.2);
  border-radius: 50%;
  border-top-color: var(--primary-color);
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-state {
  text-align: center;
  padding: 80px 40px;
  color: #ff4d4f;
}

.error-message {
  margin-bottom: 20px;
  font-size: 1.2rem;
  color: #ff6b6b;
}

.retry-button {
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

.retry-button:hover {
  background: rgba(255, 77, 79, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.2);
}

.retry-icon {
  font-style: normal;
}
</style>
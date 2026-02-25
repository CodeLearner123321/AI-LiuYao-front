<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import NavBar from '@/components/NavBar.vue';
import MarkdownRenderer from '@/components/MarkdownRenderer.vue';
import api from '../services/api';
import { ElMessage, ElLoading } from 'element-plus';

// 状态变量
const historyList = ref([]); // 历史记录列表
const selectedHistory = ref(null); // 当前选中的历史记录
const loading = ref(false); // 加载状态
const accuracyRate = ref(0); // 准确率
const sidebarCollapsed = ref(false); // 侧边栏是否折叠
const analysisResult = ref(''); // AI分析结果
const keyOutcome = ref(''); // 结果判辞
const hexagramResult = ref(null); // 卦象结果
const chineseCalendar = ref(null); // 中国历日期
const questionDescription = ref(''); // 问题描述
const questionBackground = ref(''); // 问题背景
const selectedHexagramType = ref(''); // 选中的卦象类型

// 悬停和操作按钮相关
const hoveredHistoryId = ref(null); // 当前悬停的历史记录ID
const hoverTimer = ref(null); // 悬停计时器
const hideTimer = ref(null); // 隐藏计时器
const showActionButtons = ref(null); // 显示操作按钮的历史记录ID
const showDeleteConfirm = ref(false); // 是否显示删除确认弹窗
const deleteTargetId = ref(null); // 待删除的历史记录ID
const deleting = ref(false); // 删除中状态

// 反馈相关
const showFeedbackModal = ref(false); // 是否显示反馈弹窗
const feedbackTargetId = ref(null); // 待反馈的历史记录ID
const feedbackSubmitting = ref(false); // 反馈提交中状态

// 卦象类型列表
const hexagramTypes = [
  { value: 'TIME', label: '时间起卦' },
  { value: 'MANUAL', label: '手工起卦' },
  { value: 'RANDOM', label: '随机起卦' }
];

// 加载历史记录
const loadHistoryList = async () => {
  loading.value = true;
  try {
    const response = await api.get('/api/liuyao/history');
    
    if (response.data && response.data.code === 200) {
      // 处理新的返回结构
      const data = response.data.data;
      historyList.value = data.aiLiuyaoHistoryVOS || [];
      accuracyRate.value = data.accuracyRate || 0;
      
      // 如果有历史记录，默认选中第一条
      if (historyList.value.length > 0) {
        selectHistory(historyList.value[0]);
      }
    } else {
      ElMessage.error('获取历史记录失败：' + (response.data?.msg || '未知错误'));
    }
  } catch (error) {
    console.error('加载历史记录出错:', error);
    ElMessage.error('获取历史记录失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

// 处理历史记录悬停
const handleHistoryMouseEnter = (history) => {
  hoveredHistoryId.value = history.id;
  
  // 清除之前的隐藏计时器
  if (hideTimer.value) {
    clearTimeout(hideTimer.value);
    hideTimer.value = null;
  }
  
  // 立即显示操作按钮
  showActionButtons.value = history.id;
};

// 处理历史记录离开
const handleHistoryMouseLeave = () => {
  hoveredHistoryId.value = null;
  
  // 清除悬停计时器
  if (hoverTimer.value) {
    clearTimeout(hoverTimer.value);
    hoverTimer.value = null;
  }
  
  // 立即隐藏操作按钮
  showActionButtons.value = null;
};

// 打开删除确认弹窗
const openDeleteConfirm = (historyId, event) => {
  event.stopPropagation(); // 阻止选择历史记录
  deleteTargetId.value = historyId;
  showDeleteConfirm.value = true;
};

// 关闭删除确认弹窗
const closeDeleteConfirm = () => {
  showDeleteConfirm.value = false;
  deleteTargetId.value = null;
};

// 删除历史记录
const deleteHistory = async () => {
  if (!deleteTargetId.value) return;
  
  deleting.value = true;
  try {
    const response = await api.get(`/api/liuyao/history/delete/${deleteTargetId.value}`);
    
    if (response.data && response.data.code === 200) {
      ElMessage.success('删除成功');
      
      // 从列表中移除该记录
      const deletedIndex = historyList.value.findIndex(h => h.id === deleteTargetId.value);
      historyList.value.splice(deletedIndex, 1);
      
      // 如果删除的是当前选中的记录，清空选中状态
      if (selectedHistory.value?.id === deleteTargetId.value) {
        selectedHistory.value = null;
        hexagramResult.value = null;
        analysisResult.value = '';
        
        // 如果还有其他记录，选中第一条
        if (historyList.value.length > 0) {
          selectHistory(historyList.value[0]);
        }
      }
      
      closeDeleteConfirm();
    } else {
      ElMessage.error('删除失败：' + (response.data?.msg || '未知错误'));
    }
  } catch (error) {
    console.error('删除历史记录出错:', error);
    ElMessage.error('删除失败，请稍后重试');
  } finally {
    deleting.value = false;
  }
};

// 打开反馈弹窗
const openFeedback = (historyId, event) => {
  event.stopPropagation(); // 阻止选择历史记录
  feedbackTargetId.value = historyId;
  showFeedbackModal.value = true;
};

// 关闭反馈弹窗
const closeFeedbackModal = () => {
  showFeedbackModal.value = false;
  feedbackTargetId.value = null;
};

// 提交反馈
const submitFeedback = async (isAccurate) => {
  if (!feedbackTargetId.value) return;
  
  feedbackSubmitting.value = true;
  try {
    const response = await api.post('/api/liuyao/history/feedback', {
      id: feedbackTargetId.value,
      isAccurate: isAccurate
    });
    
    if (response.data && response.data.code === 200) {
      ElMessage.success(isAccurate === 1 ? '感谢您的肯定反馈！' : '感谢您的反馈，我们会持续改进！');
      
      // 更新列表中对应记录的 isAccurate 字段
      const targetHistory = historyList.value.find(h => h.id === feedbackTargetId.value);
      if (targetHistory) {
        targetHistory.isAccurate = isAccurate;
      }
      
      // 如果反馈的是当前选中的记录，也更新选中记录
      if (selectedHistory.value && selectedHistory.value.id === feedbackTargetId.value) {
        selectedHistory.value.isAccurate = isAccurate;
      }
      
      closeFeedbackModal();
    } else {
      // 关闭弹窗，让错误消息能够显示
      closeFeedbackModal();
      ElMessage.error('反馈失败：' + (response.data?.msg || '未知错误'));
    }
  } catch (error) {
    console.error('提交反馈出错:', error);
    // 关闭弹窗，让错误消息能够显示
    closeFeedbackModal();
    ElMessage.error('反馈失败，请稍后重试');
  } finally {
    feedbackSubmitting.value = false;
  }
};

// 选择历史记录
const selectHistory = async (history) => {
  try {
    // 首先设置基本信息（不显示loading，避免影响滚动条）
    selectedHistory.value = history;
    keyOutcome.value = history.keyOutcome || '';
    
    // 清空之前的卦象相关数据
    analysisResult.value = '';
    hexagramResult.value = null;
    chineseCalendar.value = null;
    questionDescription.value = history.question || '';
    questionBackground.value = '';
    selectedHexagramType.value = '';
    
    // 通过historyId获取详细信息
    const detailResponse = await api.get(`/api/liuyao/history/${history.id}`);
    
    if (detailResponse.data && detailResponse.data.code === 200) {
      // 获取详细数据
      const detailData = detailResponse.data.data;
      
      // 更新问题信息
      questionDescription.value = detailData.question || history.question || '';
      questionBackground.value = detailData.background || '';
      selectedHexagramType.value = detailData.castType || '';
      
      // 更新卦象结果
      hexagramResult.value = detailData;
      
      // 设置八字信息
      if (detailData.baZi) {
        chineseCalendar.value = {
          year: detailData.baZi.year,
          month: detailData.baZi.month,
          day: detailData.baZi.day,
          hour: detailData.baZi.hour,
          yearToNull: detailData.baZi.yearToNull,
          monthToNull: detailData.baZi.monthToNull,
          dayToNull: detailData.baZi.dayToNull,
          hourToNull: detailData.baZi.hourToNull,
          nayin: "" // 纳音信息暂时为空
        };
      }
      
      // 设置分析文本 - 如果有resultData则从中获取，否则直接使用text字段
      if (detailData.resultData) {
        analysisResult.value = detailData.resultData;
      }
      
    } else {
      ElMessage.error('获取历史记录详情失败：' + (detailResponse.data?.msg || '未知错误'));
    }
  } catch (error) {
    console.error('获取历史记录详情出错:', error);
    ElMessage.error('获取历史记录详情失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

// 根据历史记录数据生成卦象
const generateHexagram = async (history) => {
  // 如果已经有hexagramResult数据，则不需要再次生成
  if (hexagramResult.value) return;
  
  const loadingInstance = ElLoading.service({
    lock: true,
    text: '正在生成卦象...',
    background: 'rgba(0, 0, 0, 0.7)'
  });

  try {
    // 构建请求数据
    const requestData = {
      castType: history.castType, // TIME, MANUAL, RANDOM
      castTime: null // 先设为空，下面会根据情况设置正确格式
    };

    // 将castTime转换为'yyyy-MM-dd HH:mm:ss'格式
    if (history.castTime) {
      try {
        let dateObj;
        
        if (typeof history.castTime === 'string') {
          dateObj = new Date(history.castTime);
        } else if (history.castTime instanceof Date) {
          dateObj = history.castTime;
        }
        
        if (dateObj && !isNaN(dateObj.getTime())) {
          // 使用'yyyy-MM-dd HH:mm:ss'格式，不含T分隔符和毫秒
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const day = String(dateObj.getDate()).padStart(2, '0');
          const hours = String(dateObj.getHours()).padStart(2, '0');
          const minutes = String(dateObj.getMinutes()).padStart(2, '0');
          const seconds = String(dateObj.getSeconds()).padStart(2, '0');
          
          // 使用空格代替T，不带毫秒部分
          requestData.castTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
          
          console.log('转换后的castTime格式:', requestData.castTime);
        }
      } catch (err) {
        console.error('日期格式转换错误:', err);
        // 如果转换出错，使用原始格式
        requestData.castTime = history.castTime;
      }
    }

    // 根据起卦类型添加不同参数
    if (history.castType === 'TIME' && history.timestamp) {
      requestData.timestamp = history.timestamp;
    } else if ((history.castType === 'MANUAL' || history.castType === 'RANDOM') && history.number) {
      requestData.number = history.number;
    }

    // 调用生成卦象接口
    const response = await api.post('/api/liuyao/generate/liuyao', requestData);
    
    if (response.data && response.data.code === 200) {
      // 设置卦象结果
      hexagramResult.value = response.data.data;
      
      // 如果API返回了bazi数据，更新中国历日期
      if (hexagramResult.value.baZi) {
        chineseCalendar.value = {
          year: hexagramResult.value.baZi.year,
          month: hexagramResult.value.baZi.month,
          day: hexagramResult.value.baZi.day,
          hour: hexagramResult.value.baZi.hour,
          yearToNull: hexagramResult.value.baZi.yearToNull,
          monthToNull: hexagramResult.value.baZi.monthToNull,
          dayToNull: hexagramResult.value.baZi.dayToNull,
          hourToNull: hexagramResult.value.baZi.hourToNull,
          nayin: "" // 纳音信息暂时为空
        };
      }
      
      console.log('生成卦象成功:', hexagramResult.value);
    } else {
      ElMessage.error('生成卦象失败：' + (response.data?.msg || '未知错误'));
    }
  } catch (error) {
    console.error('生成卦象出错:', error);
    ElMessage.error('生成卦象失败，请稍后重试');
  } finally {
    loadingInstance.close();
  }
};

// 切换侧边栏折叠状态
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value;
};

// 格式化日期函数
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

// 格式化日期字符串 - 用于显示卦象结果日期
const formatDateString = (date, format) => {
  if (!date) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  // 根据格式返回日期字符串
  if (format === 'YYYY-MM-DD HH:mm') {
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

// Markdown 解析现在由 MarkdownRenderer 组件处理

// 格式化持续时间（秒转换为分钟秒）
const formatDuration = (seconds) => {
  if (!seconds && seconds !== 0) return '';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (minutes > 0) {
    return `${minutes}分${remainingSeconds}秒`;
  } else {
    return `${remainingSeconds}秒`;
  }
};

// 计算是否显示卦象结果区域
const showAnalysis = computed(() => {
  return selectedHistory.value !== null;
});

// 计算是否显示卦象结果
const showResult = computed(() => {
  return hexagramResult.value !== null;
});

// 页面加载时获取历史记录
onMounted(() => {
  loadHistoryList();
});

// 计算侧边栏样式
const sidebarClass = computed(() => {
  return {
    'history-sidebar': true,
    'collapsed': sidebarCollapsed.value
  };
});

// 判断是否为阳爻
const isYangYao = (yaos, index) => {
  if (!yaos || index < 0 || index >= yaos.length) return false;
  
  const yao = yaos[index];
  if (typeof yao === 'string') {
    // 如果是字符串形式表示的爻
    return yao === '9' || yao === '7' || yao === '1';
  } else if (yao && typeof yao === 'object') {
    // 如果是对象形式表示的爻
    return yao.value === 9 || yao.value === 7 || yao.value === 1 || yao.yang === true;
  }
  
  return false;
};

</script>

<template>
  <div class="history-view">
    <NavBar />
    <div class="history-container">
      <!-- 侧边栏 -->
      <div :class="sidebarClass">
        <div class="sidebar-header" :class="{ 'clickable': sidebarCollapsed }" @click="sidebarCollapsed && toggleSidebar()">
          <div class="header-content">
            <h2>历史记录</h2>
            <div v-if="!sidebarCollapsed && accuracyRate > 0" class="accuracy-rate">
              正确率: {{ (accuracyRate * 100).toFixed(1) }}%
            </div>
          </div>
          <button v-if="!sidebarCollapsed" class="toggle-btn" @click.stop="toggleSidebar">
            <svg class="toggle-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        
        <div class="sidebar-content" v-if="!sidebarCollapsed">
          <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <span>加载中...</span>
          </div>
          
          <div v-else-if="historyList.length === 0" class="empty-state">
            暂无历史记录
          </div>
          
          <div v-else class="history-list">
            <div 
              v-for="history in historyList" 
              :key="history.id"
              class="history-item"
              :class="{ 'active': selectedHistory && selectedHistory.id === history.id }"
              @click="selectHistory(history)"
              @mouseenter="handleHistoryMouseEnter(history)"
              @mouseleave="handleHistoryMouseLeave"
            >
              <!-- 操作按钮 -->
              <transition name="action-slide">
                <div v-if="showActionButtons === history.id" class="action-buttons">
                  <button 
                    class="action-btn delete-btn" 
                    @click="openDeleteConfirm(history.id, $event)"
                    title="删除记录"
                  >
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" 
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                  <button 
                    class="action-btn feedback-btn" 
                    @click="openFeedback(history.id, $event)"
                    title="反馈建议"
                  >
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" 
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                </div>
              </transition>
              
              <div class="history-question-row">
                <div class="history-question">{{ history.question }}</div>
                <div class="history-meta-info">
                  <span class="history-duration" v-if="history.durationSeconds !== null && history.durationSeconds !== undefined">
                    {{ formatDuration(history.durationSeconds) }}
                  </span>
                  <span class="history-amount" v-if="history.amount">
                    {{ history.amount }}点
                  </span>
                </div>
              </div>
              <div class="history-outcome">
                <span class="outcome-text">{{ history.keyOutcome }}</span>
                <svg v-if="history.isAccurate === 1" class="accuracy-icon accurate" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" 
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <svg v-else-if="history.isAccurate === 0" class="accuracy-icon inaccurate" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" 
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 内容区域 -->
      <div class="history-content" :class="{ 'expanded': sidebarCollapsed }">
        <div v-if="!selectedHistory" class="no-selection-state">
          <div class="no-selection-icon">📜</div>
          <h3>请选择一条历史记录查看详细内容</h3>
          <p>点击左侧列表中的记录可查看详细的占卜结果</p>
          
          <button v-if="sidebarCollapsed" class="show-sidebar-btn" @click="toggleSidebar">
            显示历史列表
          </button>
        </div>
        
        <div v-else class="history-detail">
          

    <!-- 卦象结果展示区域 -->
    <transition name="result-appear">
      <div v-if="showResult && hexagramResult" id="hexagram-result" class="hexagram-result">
        <h2 class="result-title">卦象结果</h2>
        
        <div v-if="hexagramResult.localDateTime || hexagramResult.customTime">
          <span>时间:
    <template v-if="hexagramResult.localDateTime">
      {{ formatDateString(new Date(hexagramResult.localDateTime), 'YYYY-MM-DD HH:mm') }} 
      {{ new Date(hexagramResult.localDateTime).toLocaleDateString('zh-CN', { weekday: 'long' }) }}
    </template>
    <template v-else-if="hexagramResult.customTime">
      {{ hexagramResult.customTime }}
    </template>
        </span>
        </div>

        <div v-if="questionDescription">
          <span>问题: {{ questionDescription }}</span>
        </div>

        <div v-if="questionBackground">
          <span>背景: {{ questionBackground }}</span>
        </div>

        <div v-if="selectedHexagramType">
          <span>起卦类型: {{ hexagramTypes.find(type => type.value === selectedHexagramType)?.label || selectedHexagramType }}</span>
        </div>
        
        <div v-if="chineseCalendar && (chineseCalendar.year || chineseCalendar.month || chineseCalendar.day || chineseCalendar.hour)">
          <span>干支: 
            <span v-if="chineseCalendar.year">{{ chineseCalendar.year }}</span>
            <span v-if="chineseCalendar.month" class="highlight-text">{{ chineseCalendar.month }}</span>
            <span v-if="chineseCalendar.day" class="highlight-text">{{ " " + chineseCalendar.day }}</span>
            <span v-if="chineseCalendar.dayToNull">(<span class="highlight-text">{{ chineseCalendar.dayToNull }}</span> 空)</span>
            <span v-if="chineseCalendar.hour" class="highlight-text">{{ chineseCalendar.hour }}</span>
          </span>
        </div>
        
        <div v-if="hexagramResult.shenSha && hexagramResult.shenSha.length > 0">
          <span>神煞: 
            <span v-for="(sha, index) in hexagramResult.shenSha" :key="index">
              {{ sha }}{{ index < hexagramResult.shenSha.length - 1 ? ' ' : '' }}
            </span>
          </span>
        </div>

        <div class="hexagram-display-result">
          <div class="hexagram-pair">
            <transition name="column-fade" :key="'original-' + hexagramResult.id">
              <div class="hexagram-column">
                <div class="hexagram-name">
                  {{ hexagramResult.originalBaGua?.name || '本卦' }}
                  <span v-if="hexagramResult.originalBaGua?.gongWei || 
                             hexagramResult.originalBaGua?.youHunGuiOrGuiHunGua || 
                             hexagramResult.originalBaGua?.liuHeLiuChong" 
                        class="hexagram-extra-info">
                    (
                    <template v-if="hexagramResult.originalBaGua?.gongWei">
                      {{ hexagramResult.originalBaGua.gongWei }}
                    </template>
                    <template v-if="hexagramResult.originalBaGua?.gongWei && 
                                   (hexagramResult.originalBaGua?.youHunGuiOrGuiHunGua || 
                                    hexagramResult.originalBaGua?.liuHeLiuChong)">
                      -
                    </template>
                    <template v-if="hexagramResult.originalBaGua?.youHunGuiOrGuiHunGua">
                      {{ hexagramResult.originalBaGua.youHunGuiOrGuiHunGua }}
                    </template>
                    <template v-if="(hexagramResult.originalBaGua?.gongWei || 
                                    hexagramResult.originalBaGua?.youHunGuiOrGuiHunGua) && 
                                    hexagramResult.originalBaGua?.liuHeLiuChong">
                      -
                    </template>
                    <template v-if="hexagramResult.originalBaGua?.liuHeLiuChong">
                      {{ hexagramResult.originalBaGua.liuHeLiuChong }}
                    </template>
                    )
                  </span>
                </div>
                
                <div class="hexagram-lines">
                  <table class="result-table" v-if="hexagramResult.originalBaGua?.yaos">
                    <tr v-for="(yao, index) in [...hexagramResult.originalBaGua.yaos].reverse()" 
                        :key="'orig-' + hexagramResult.id + '-' + yao.position" 
                        :style="{ animationDelay: index * 0.1 + 's' }" 
                        class="animate-row">
                      <td class="td-liushen">{{ yao.liuShen }}</td>
                      <td class="td-liuqin-ganzhi">
                        <span class="liuqin">{{ yao.liuQin }}</span><span class="ganzhi">{{ yao.tianGan }}</span><span :class="'dizhi dizhi-' + yao.diZhi">{{ yao.diZhi }}</span>
                      </td>
                      <td class="td-yao">
                        <!-- 阳爻 -->
                        <div v-if="yao.yang" class="result-yang-line"></div>
                        
                        <!-- 阴爻 -->
                        <div v-else class="result-yin-line">
                          <div class="result-yin-left"></div>
                          <div class="result-yin-right"></div>
                        </div>
                       
                        <div class="fu-cang-info">
                          <span class="fu-cang-text"> {{ yao.fuCang }}</span>
                        </div>

                        <!-- 世应标记和变爻标记直接放在爻内 -->
                        <div class="inline-marks">
                          <!-- 世应标记 -->
                          <span v-if="yao.shiOrYing && yao.isChange">
                            {{ yao.shiOrYing }} {{ yao.value === 1 ? 'O' : 'X' }}
                          </span>
                        </div>
                      </td>
                    </tr>
                  </table>
                </div>
              </div>
            </transition>
            
            <transition name="column-fade" :key="'changed-' + hexagramResult.id">
              <div v-if="hexagramResult.existChanged && hexagramResult.changedBaGua" class="hexagram-column">
                <div class="hexagram-name">
                  {{ hexagramResult.changedBaGua?.name || '变卦' }}
                  <span v-if="hexagramResult.changedBaGua?.gongWei || 
                             hexagramResult.changedBaGua?.youHunGuiOrGuiHunGua || 
                             hexagramResult.changedBaGua?.liuHeLiuChong" 
                        class="hexagram-extra-info">
                    (
                    <template v-if="hexagramResult.changedBaGua?.gongWei">
                      {{ hexagramResult.changedBaGua.gongWei }}
                    </template>
                    <template v-if="hexagramResult.changedBaGua?.gongWei && 
                                   (hexagramResult.changedBaGua?.youHunGuiOrGuiHunGua || 
                                    hexagramResult.changedBaGua?.liuHeLiuChong)">
                      -
                    </template>
                    <template v-if="hexagramResult.changedBaGua?.youHunGuiOrGuiHunGua">
                      {{ hexagramResult.changedBaGua.youHunGuiOrGuiHunGua }}
                    </template>
                    <template v-if="(hexagramResult.changedBaGua?.gongWei || 
                                    hexagramResult.changedBaGua?.youHunGuiOrGuiHunGua) && 
                                    hexagramResult.changedBaGua?.liuHeLiuChong">
                      -
                    </template>
                    <template v-if="hexagramResult.changedBaGua?.liuHeLiuChong">
                      {{ hexagramResult.changedBaGua.liuHeLiuChong }}
                    </template>
                    )
                  </span>
                </div>
                
                <div class="hexagram-lines">
                  <table class="result-table" v-if="hexagramResult.changedBaGua?.yaos">
                    <tr v-for="(yao, index) in [...hexagramResult.changedBaGua.yaos].reverse()" 
                        :key="'changed-' + hexagramResult.id + '-' + yao.position" 
                        :style="{ animationDelay: (index * 0.1) + 0.3 + 's' }" 
                        class="animate-row">
                      <td class="td-liushen">{{ yao.liuShen }}</td>
                      <td class="td-liuqin-ganzhi">
                        <span class="liuqin">{{ yao.liuQin }}</span><span class="ganzhi">{{ yao.tianGan }}</span><span :class="'dizhi dizhi-' + yao.diZhi">{{ yao.diZhi }}</span>
                      </td>
                      <td class="td-yao">
                        <!-- 阳爻 -->
                        <div v-if="yao.yang" class="result-yang-line"></div>
                        
                        <!-- 阴爻 -->
                        <div v-else class="result-yin-line">
                          <div class="result-yin-left"></div>
                          <div class="result-yin-right"></div>
                        </div>
                      </td>
                    </tr>
                  </table>
                </div>
              </div>
            </transition>
          </div>
        </div>


      </div>
    </transition>
          
          <!-- 卦象分析结果 -->
          <transition name="analysis-appear">
            <div v-if="showAnalysis" id="analysis-result" class="analysis-result">
              <div class="divination-header">
                <div class="divination-symbol left">☯</div>
                <div class="divination-title">卦象解读</div>
                <div class="divination-symbol right">☯</div>
              </div>
              
              <!-- 灵签卷轴样式 -->
              <div class="divination-result">
                <div class="silk-paper-container">
                  <div class="silk-paper-top"></div>
                  <div class="silk-paper">
                    <!-- 卦象名称与图案区 -->
                    <div class="gua-header" v-if="hexagramResult && hexagramResult.originalBaGua">
                      
                      <div class="gua-lines">
                        <div v-for="(yao, index) in 6" :key="index" class="gua-line">
                          <div class="gua-line-mark" :class="{ 
                            'gua-line-yang': isYangYao(hexagramResult.originalBaGua.yaos, 5-index),
                            'gua-line-yin': !isYangYao(hexagramResult.originalBaGua.yaos, 5-index)
                          }"></div>
                        </div>
                      </div>

                      <h3 class="gua-title">
                        {{ hexagramResult.originalBaGua.name }} 
                        <span v-if="hexagramResult.existChanged && hexagramResult.changedBaGua">→ {{ hexagramResult.changedBaGua.name }}</span>
                      </h3>

                      <div class="gua-lines" v-if="hexagramResult.existChanged && hexagramResult.changedBaGua">
                        <div v-for="(yao, index) in 6" :key="index" class="gua-line">
                          <div class="gua-line-mark" :class="{ 
                            'gua-line-yang': isYangYao(hexagramResult.changedBaGua.yaos, 5-index),
                            'gua-line-yin': !isYangYao(hexagramResult.changedBaGua.yaos, 5-index)
                          }"></div>
                        </div>
                      </div>

                    </div>
                    
                    <!-- 卦辞区域 -->
                    <div class="gua-oracle">
                      <div class="oracle-content">{{ keyOutcome || '六爻卦象已生成' }}</div>
                    </div>
                  
                    
                    <!-- 解析文本 -->
                    <MarkdownRenderer 
                      v-if="analysisResult"
                      :content="analysisResult"
                      class="analysis-text silk-content"
                    />
                    
                    <!-- 落款与印章 -->
                    <div class="signature-area">
                      <div class="signature-text">卜问于荧屏 · 得此神机之卦</div>
                      <div class="seal-ink">
                        <span>爻</span>
                        <span>算</span>
                        <span>云</span>
                        <span>鉴</span>
                      </div>
                    </div>
                  </div>
                  <div class="silk-paper-bottom"></div>
                </div>
                
                <!-- 装饰元素 -->
                <div class="scroll-decorations">
                  <div class="bamboo-scroll left"></div>
                  <div class="bamboo-scroll right"></div>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>
    
    <!-- 删除确认弹窗 -->
    <transition name="modal-fade">
      <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="closeDeleteConfirm">
        <div class="delete-confirm-modal">
          <div class="modal-header">
            <div class="modal-icon delete-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h3 class="modal-title">确认删除</h3>
          </div>
          
          <div class="modal-content">
            <p>您确定要删除这条历史记录吗？</p>
            <p class="modal-warning">此操作无法撤销</p>
          </div>
          
          <div class="modal-actions">
            <button 
              class="modal-btn cancel-btn" 
              @click="closeDeleteConfirm"
              :disabled="deleting"
            >
              取消
            </button>
            <button 
              class="modal-btn confirm-btn" 
              @click="deleteHistory"
              :disabled="deleting"
            >
              <span v-if="!deleting">确认删除</span>
              <span v-else class="deleting-text">
                <span class="spinner"></span>
                删除中...
              </span>
            </button>
          </div>
        </div>
      </div>
    </transition>
    
    <!-- 反馈弹窗 -->
    <transition name="modal-fade">
      <div v-if="showFeedbackModal" class="modal-overlay" @click.self="closeFeedbackModal">
        <div class="feedback-modal">
          <div class="modal-header">
            <div class="modal-icon feedback-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
                      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h3 class="modal-title">反馈结果准确性</h3>
          </div>
          
          <div class="modal-content">
            <p class="feedback-question">这次占卜结果是否准确？</p>
            <p class="feedback-hint">
              
            </p>
          </div>
          
          <div class="feedback-actions">
            <button 
              class="feedback-option accurate-option" 
              @click="submitFeedback(1)"
              :disabled="feedbackSubmitting"
            >
              <div class="option-icon accurate">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" 
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="option-content">
                <div class="option-title">准确</div>
                <div class="option-desc">结果符合预期</div>
              </div>
            </button>
            
            <button 
              class="feedback-option inaccurate-option" 
              @click="submitFeedback(0)"
              :disabled="feedbackSubmitting"
            >
              <div class="option-icon inaccurate">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" 
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="option-content">
                <div class="option-title">不准确</div>
                <div class="option-desc">结果有偏差</div>
              </div>
            </button>
          </div>
          
          <div class="feedback-footer">
            <button 
              class="modal-btn cancel-btn small" 
              @click="closeFeedbackModal"
              :disabled="feedbackSubmitting"
            >
              取消
            </button>
          </div>
          
          <!-- 提交中的遮罩 -->
          <transition name="fade">
            <div v-if="feedbackSubmitting" class="submitting-overlay">
              <div class="submitting-content">
                <span class="spinner large"></span>
                <span class="submitting-text">提交中...</span>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.history-view {
  min-height: 100vh;
  min-height: 100svh;
  min-height: 100dvh;
  background-color: var(--dark-bg);
  color: var(--text-light);
  display: flex;
  flex-direction: column;
}

.history-container {
  display: flex;
  height: calc(100vh - 60px);
  height: calc(100svh - 60px);
  height: calc(100dvh - 60px);
  position: relative;
  overflow: hidden; /* 防止整体滚动 */
}

/* 侧边栏样式 */
.history-sidebar {
  width: 340px;
  background: linear-gradient(180deg, #1a1a1a 0%, #141414 100%);
  border-right: 1px solid rgba(255, 215, 0, 0.15);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.3), 
              inset -1px 0 0 rgba(255, 215, 0, 0.05);
  z-index: 10;
  backdrop-filter: blur(10px);
}

.history-sidebar::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 1px;
  height: 100%;
  background: linear-gradient(to bottom, 
    transparent 0%, 
    rgba(255, 215, 0, 0.3) 20%, 
    rgba(255, 215, 0, 0.3) 80%, 
    transparent 100%);
  opacity: 0.6;
  pointer-events: none;
}

.history-sidebar.collapsed {
  width: 60px;
}

.sidebar-header {
  padding: 24px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid rgba(255, 215, 0, 0.1);
  background: linear-gradient(135deg, 
    rgba(26, 26, 26, 0.95) 0%, 
    rgba(30, 30, 30, 0.95) 100%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3),
              inset 0 -1px 0 rgba(255, 215, 0, 0.2);
  z-index: 2;
  position: relative;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.header-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sidebar-header.clickable {
  cursor: pointer;
  justify-content: center;
}

.sidebar-header.clickable:hover {
  background: linear-gradient(135deg, 
    rgba(35, 35, 35, 0.95) 0%, 
    rgba(40, 40, 40, 0.95) 100%);
  box-shadow: 0 4px 16px rgba(255, 215, 0, 0.15),
              inset 0 -1px 0 rgba(255, 215, 0, 0.3);
}

.sidebar-header.clickable::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, 
    rgba(255, 215, 0, 0.1) 0%, 
    transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.sidebar-header.clickable:hover::before {
  opacity: 1;
}

.sidebar-header::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(to right, 
    transparent 0%, 
    rgba(255, 215, 0, 0.4) 50%, 
    transparent 100%);
  opacity: 0.6;
  transition: opacity 0.3s ease;
}

.sidebar-header.clickable:hover::after {
  opacity: 1;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 1.3rem;
  color: var(--primary-color);
  font-weight: 600;
  text-shadow: 0 2px 8px rgba(255, 215, 0, 0.3),
               0 0 20px rgba(255, 215, 0, 0.1);
  letter-spacing: 1px;
  font-family: 'SimSun', 'STKaiti', 'KaiTi', serif;
  transition: all 0.3s ease;
  writing-mode: horizontal-tb;
}

.accuracy-rate {
  font-size: 0.85rem;
  color: rgba(255, 215, 0, 0.75);
  font-weight: 500;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 4px rgba(255, 215, 0, 0.2);
  font-family: 'Arial', sans-serif;
  transition: all 0.3s ease;
  animation: accuracyFadeIn 0.5s ease;
}

@keyframes accuracyFadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.history-sidebar.collapsed .sidebar-header h2 {
  writing-mode: vertical-rl;
  font-size: 1.1rem;
  letter-spacing: 3px;
}

.toggle-btn {
  background: transparent;
  border: none;
  color: rgba(255, 215, 0, 0.6);
  cursor: pointer;
  padding: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}

.toggle-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, 
    rgba(255, 215, 0, 0.1) 0%, 
    rgba(255, 215, 0, 0.05) 100%);
  border-radius: 8px;
  opacity: 0;
  transition: all 0.3s ease;
}

.toggle-btn:hover::before {
  opacity: 1;
}

.toggle-btn:hover {
  color: var(--primary-color);
  transform: translateX(-3px);
}

.toggle-btn:hover .toggle-icon {
  filter: drop-shadow(0 0 6px rgba(255, 215, 0, 0.6));
}

.toggle-btn:active {
  transform: translateX(-1px) scale(0.95);
}

.toggle-icon {
  width: 20px;
  height: 20px;
  transition: all 0.3s ease;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
  position: relative;
  z-index: 1;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
  /* 使左侧滚动条独立 */
  position: relative;
  height: calc(100% - 70px); /* 减去header高度 */
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 215, 0, 0.4) rgba(0, 0, 0, 0.2);
  background: linear-gradient(to bottom, 
    rgba(255, 215, 0, 0.02) 0%, 
    transparent 10%, 
    transparent 90%, 
    rgba(0, 0, 0, 0.3) 100%);
}

.sidebar-content::-webkit-scrollbar {
  width: 8px;
}

.sidebar-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  margin: 8px 0;
}

.sidebar-content::-webkit-scrollbar-thumb {
  background: linear-gradient(to bottom, 
    rgba(255, 215, 0, 0.4) 0%, 
    rgba(255, 215, 0, 0.6) 50%, 
    rgba(255, 215, 0, 0.4) 100%);
  border-radius: 4px;
  border: 1px solid rgba(255, 215, 0, 0.2);
  box-shadow: inset 0 0 6px rgba(255, 215, 0, 0.3);
  transition: all 0.3s ease;
}

.sidebar-content::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(to bottom, 
    rgba(255, 215, 0, 0.6) 0%, 
    rgba(255, 215, 0, 0.8) 50%, 
    rgba(255, 215, 0, 0.6) 100%);
  box-shadow: inset 0 0 8px rgba(255, 215, 0, 0.5),
              0 0 8px rgba(255, 215, 0, 0.3);
}

.history-list {
  display: flex;
  flex-direction: column;
  padding: 0 10px 20px;
  gap: 8px;
}

.history-item {
  padding: 20px 18px 20px 48px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: visible;
  background: linear-gradient(135deg, 
    rgba(20, 20, 20, 0.6) 0%, 
    rgba(26, 26, 26, 0.4) 100%);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(5px);
}

.history-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(to bottom, 
    transparent 0%, 
    rgba(255, 215, 0, 0.3) 50%, 
    transparent 100%);
  opacity: 0;
  transition: all 0.4s ease;
}

.history-item::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.1) 0%, transparent 70%);
  transform: translate(-50%, -50%);
  transition: all 0.6s ease;
  pointer-events: none;
}

.history-item:hover {
  background: linear-gradient(135deg, 
    rgba(30, 30, 30, 0.8) 0%, 
    rgba(35, 35, 35, 0.6) 100%);
  transform: translateX(4px);
  border-color: rgba(255, 215, 0, 0.2);
  box-shadow: -2px 4px 16px rgba(0, 0, 0, 0.3),
              inset 0 0 0 1px rgba(255, 215, 0, 0.1);
}

.history-item:hover::before {
  opacity: 1;
  width: 3px;
}

.history-item:hover::after {
  width: 120%;
  height: 120%;
}

.history-item.active {
  background: linear-gradient(135deg, 
    rgba(255, 215, 0, 0.12) 0%, 
    rgba(255, 215, 0, 0.06) 100%);
  border-color: rgba(255, 215, 0, 0.4);
  box-shadow: -3px 4px 20px rgba(255, 215, 0, 0.15),
              inset 0 0 20px rgba(255, 215, 0, 0.05),
              inset 0 1px 0 rgba(255, 215, 0, 0.2);
  transform: translateX(6px);
}

.history-item.active::before {
  opacity: 1;
  width: 4px;
  background: linear-gradient(to bottom, 
    rgba(255, 215, 0, 0.8) 0%, 
    rgba(255, 215, 0, 1) 50%, 
    rgba(255, 215, 0, 0.8) 100%);
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
}

.history-question-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
  position: relative;
  z-index: 1;
}

.history-question {
  font-weight: 600;
  font-size: 0.98rem;
  color: #e8e8e8;
  line-height: 1.5;
  flex: 1;
  min-width: 0;
  word-wrap: break-word;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.history-item:hover .history-question {
  color: #fff;
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.2);
}

.history-item.active .history-question {
  color: var(--primary-color);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4),
               0 0 10px rgba(255, 215, 0, 0.3);
}

/* 元数据信息容器 */
.history-meta-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

/* 时间显示 - 简洁无边框 */
.history-duration {
  font-size: 0.75rem;
  font-weight: 400;
  color: rgba(255, 215, 0, 0.7);
  white-space: nowrap;
  transition: all 0.3s ease;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.history-item:hover .history-duration {
  color: rgba(255, 215, 0, 0.9);
}

.history-item.active .history-duration {
  color: var(--primary-color);
  font-weight: 500;
}

/* 金额显示 */
.history-amount {
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(255, 215, 0, 0.8);
  white-space: nowrap;
  transition: all 0.3s ease;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.history-item:hover .history-amount {
  color: rgba(255, 215, 0, 1);
}

.history-item.active .history-amount {
  color: var(--primary-color);
  font-weight: 600;
  text-shadow: 0 0 6px rgba(255, 215, 0, 0.3);
}

/* 结果容器 */
.history-outcome {
  font-size: 0.88rem;
  color: #e8d469;
  font-style: italic;
  line-height: 1.7;
  padding: 10px 14px 10px 14px;
  border-left: 3px solid rgba(255, 215, 0, 0.4);
  position: relative;
  background: linear-gradient(to right, 
    rgba(255, 215, 0, 0.08) 0%, 
    rgba(0, 0, 0, 0.15) 100%);
  border-radius: 0 8px 8px 0;
  margin-left: 2px;
  transition: all 0.3s ease;
  box-shadow: inset 2px 0 8px rgba(0, 0, 0, 0.2);
  font-family: 'STKaiti', 'KaiTi', serif;
  letter-spacing: 0.5px;
  z-index: 1;
}

.outcome-text {
  display: block;
  padding-right: 24px;
}

.history-outcome::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 60%;
  background: linear-gradient(to bottom, 
    transparent 0%, 
    rgba(255, 215, 0, 0.8) 50%, 
    transparent 100%);
  filter: blur(2px);
}

.history-item:hover .history-outcome {
  color: #f5e189;
  border-left-color: rgba(255, 215, 0, 0.6);
  background: linear-gradient(to right, 
    rgba(255, 215, 0, 0.12) 0%, 
    rgba(0, 0, 0, 0.2) 100%);
  box-shadow: inset 2px 0 12px rgba(255, 215, 0, 0.1);
}

.history-item.active .history-outcome {
  color: var(--primary-color);
  border-left-color: var(--primary-color);
  background: linear-gradient(to right, 
    rgba(255, 215, 0, 0.18) 0%, 
    rgba(255, 215, 0, 0.05) 100%);
  box-shadow: inset 2px 0 16px rgba(255, 215, 0, 0.15),
              0 0 8px rgba(255, 215, 0, 0.1);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4),
               0 0 8px rgba(255, 215, 0, 0.2);
}

/* 准确性图标 - 定位在右下角 */
.accuracy-icon {
  position: absolute;
  bottom: 6px;
  right: 8px;
  width: 12px;
  height: 12px;
  transition: all 0.3s ease;
  opacity: 0.6;
  z-index: 2;
}

.accuracy-icon.accurate {
  color: #22c55e;
  filter: drop-shadow(0 1px 2px rgba(34, 197, 94, 0.3));
}

.accuracy-icon.inaccurate {
  color: #ef4444;
  filter: drop-shadow(0 1px 2px rgba(239, 68, 68, 0.3));
}

.history-item:hover .accuracy-icon {
  opacity: 0.9;
  transform: scale(1.15);
}

.history-item:hover .accuracy-icon.accurate {
  filter: drop-shadow(0 0 4px rgba(34, 197, 94, 0.6));
}

.history-item:hover .accuracy-icon.inaccurate {
  filter: drop-shadow(0 0 4px rgba(239, 68, 68, 0.6));
}

.history-item.active .accuracy-icon {
  opacity: 1;
}

.history-item.active .accuracy-icon.accurate {
  filter: drop-shadow(0 0 6px rgba(34, 197, 94, 0.8));
}

.history-item.active .accuracy-icon.inaccurate {
  filter: drop-shadow(0 0 6px rgba(239, 68, 68, 0.8));
}

.loading-state,
.empty-state {
  padding: 60px 20px;
  text-align: center;
  color: #999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 250px;
  background: radial-gradient(circle at center, 
    rgba(255, 215, 0, 0.03) 0%, 
    transparent 70%);
}

.loading-state span {
  color: var(--primary-color);
  font-size: 0.95rem;
  letter-spacing: 1px;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
}

.empty-state {
  color: #777;
  font-style: italic;
  font-size: 0.95rem;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(255, 215, 0, 0.15);
  border-radius: 50%;
  border-top-color: var(--primary-color);
  border-right-color: rgba(255, 215, 0, 0.6);
  display: inline-block;
  margin-bottom: 20px;
  animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.2),
              inset 0 0 20px rgba(255, 215, 0, 0.05);
  position: relative;
}

.loading-spinner::after {
  content: '';
  position: absolute;
  inset: 8px;
  border: 2px solid transparent;
  border-radius: 50%;
  border-top-color: rgba(255, 215, 0, 0.4);
  animation: spin 0.8s linear infinite reverse;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 内容区域样式 */
.history-content {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
  transition: all 0.3s ease;
  /* 使右侧滚动条独立 */
  height: 100%;
  position: relative;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) var(--dark-bg);
}

.history-content::-webkit-scrollbar {
  width: 8px;
}

.history-content::-webkit-scrollbar-track {
  background: var(--dark-bg);
}

.history-content::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
}

.history-content::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.history-content.expanded {
  flex: 1;
}

.no-selection-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 80vh;
  color: #666;
  text-align: center;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.no-selection-icon {
  font-size: 6rem;
  margin-bottom: 30px;
  opacity: 0.2;
  color: var(--primary-color);
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.2);
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-15px);
  }
  100% {
    transform: translateY(0px);
  }
}

.no-selection-state h3 {
  margin-bottom: 15px;
  color: #bbb;
  font-size: 1.4rem;
  font-weight: normal;
}

.no-selection-state p {
  max-width: 400px;
  color: #777;
  margin-bottom: 30px;
  line-height: 1.6;
}

.show-sidebar-btn {
  margin-top: 20px;
  padding: 12px 24px;
  background: linear-gradient(45deg, #ffd700, #ffdf4d);
  color: #222;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
}

.show-sidebar-btn:hover {
  opacity: 0.95;
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
}

.show-sidebar-btn:active {
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(255, 215, 0, 0.3);
}

.history-detail {
  animation: fadeInRight 0.5s ease;
}

@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 分析结果样式 */
.analysis-result {
  background-color: transparent;
  padding: 20px;
  margin-top: 40px;
  position: relative;
  max-width: 850px;
  margin-left: auto;
  margin-right: auto;
}

.divination-header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30px;
  position: relative;
}

.divination-header::before,
.divination-header::after {
  content: '';
  height: 1px;
  flex: 1;
  background: linear-gradient(to right, transparent, rgba(255, 215, 0, 0.3), transparent);
}

.divination-title {
  font-size: 1.6rem;
  color: var(--primary-color);
  margin: 0 20px;
  font-weight: bold;
  text-shadow: 0 2px 10px rgba(255, 215, 0, 0.3);
}

.divination-symbol {
  font-size: 1.8rem;
  color: var(--primary-color);
  opacity: 0.8;
  text-shadow: 0 0 15px rgba(255, 215, 0, 0.4);
}

/* 高亮文本 */
.highlight-text {
  color: #f5d76e;
  font-weight: bold;
}

/* 卦象结果区域样式 */
.hexagram-result {
  background-color: rgba(42, 42, 42, 0.7);
  border-radius: 8px;
  padding: 20px;
  margin-top: 40px;
  position: relative;
  animation: highlightResult 2s ease-out;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

/* 添加高亮动画 */
@keyframes highlightResult {
  0% {
    box-shadow: 0 0 0 rgba(230, 200, 76, 0);
  }
  50% {
    box-shadow: 0 0 20px rgba(230, 200, 76, 0.4);
  }
  100% {
    box-shadow: 0 0 0 rgba(230, 200, 76, 0);
  }
}

.result-container {
  background-color: rgba(46, 46, 46, 0.8);
  border-radius: 10px;
  padding: 20px;
  margin: 0 auto;
  max-width: 800px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}


/* 卦象区域样式 */
.hexagram-pair {
  display: flex;
  gap: 40px;
  justify-content: center;
  background-color: rgba(46, 46, 46, 0.8);
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.hexagram-column {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.hexagram-name {
  font-size: 18px;
  font-weight: bold;
  color: #e6c84c;
  margin-bottom: 15px;
  text-align: center;
}

.hexagram-extra-info {
  font-size: 14px;
  color: #aaa;
  font-weight: normal;
}

.hexagram-lines {
  width: 200px;
}

.result-table {
  width: 100%;
}

.result-table tr {
  height: 36px;
}

.td-liushen {
  width: 40px;
  font-size: 14px;
  text-align: center;
}

.td-liuqin-ganzhi {
  width: 80px;
  font-size: 13px;
  color: #e0e0e0;
  text-align: center;
}

.liuqin {
  margin-right: 3px;
}

.dizhi {
  color: #e0e0e0;
}

.td-yao {
  position: relative;
}

/* 伏藏信息样式 */
.fu-cang-info {
  position: absolute;
  bottom: -15px;
  transform: translateY(-50%); /* 上移自身高度 */
  left: 0;
  width: 100%;
  text-align: left;
  font-size: 0.8rem;
}

.fu-cang-text {
  color: #69696e;
  font-size: 0.8rem;
  padding: 1px 4px;
  border-radius: 3px;
  font-weight: bold;
}

.result-yang-line {
  height: 8px;
  background-color: #e6c84c;
  margin: 8px 0;
  width: 100%;
}

.result-yin-line {
  height: 8px;
  display: flex;
  justify-content: space-between;
  margin: 8px 0;
  width: 100%;
}

.result-yin-left, .result-yin-right {
  height: 100%;
  width: 45%;
  background-color: #e6c84c;
}

.inline-marks {
  position: absolute;
  right: -39px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 5px;
}


.animate-row {
  animation: fadeIn 0.5s ease forwards;
  opacity: 0;
  animation-delay: calc(var(--index, 0) * 0.1s);
}

/* 灵签卷轴样式 */
.divination-result {
  position: relative;
  margin: 50px auto;
  max-width: 750px;
  perspective: 1200px;
  scroll-behavior: smooth;
}

.silk-paper-container {
  position: relative;
  transform-style: preserve-3d;
  transition: all 1s ease;
}

.silk-paper-top, .silk-paper-bottom {
  height: 20px;
  background: radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 70%);
  width: 90%;
  margin: 0 auto;
  filter: blur(3px);
}

/* 绢布背景纹理 */
.silk-paper {
  background: linear-gradient(135deg, #1a1a1a 0%, #222222 50%, #1a1a1a 100%);
  border-radius: 12px;
  padding: 40px 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 50px rgba(0, 0, 0, 0.3);
  position: relative;
  color: #e0e0e0;
  overflow: hidden;
  transform-style: preserve-3d;
  animation: unfoldScroll 1.2s ease-out forwards;
}

@keyframes unfoldScroll {
  0% {
    opacity: 0;
    transform: translateY(50px) rotateX(5deg);
    max-height: 100px;
  }
  50% {
    opacity: 1;
    transform: translateY(0) rotateX(0);
  }
  100% {
    max-height: 2000px;
  }
}

/* 卦象区域 */
.gua-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 25px;
  position: relative;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(230, 200, 76, 0.3);
}

.gua-lines {
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 60px;
}

.gua-line {
  height: 15px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.gua-line-mark {
  width: 40px;
  height: 5px;
  background-color: var(--primary-color);
}

.gua-line-yang {
  width: 40px;
}

.gua-line-yin {
  width: 17px;
  margin-right: 24px;
  box-shadow: 23px 0 0 var(--primary-color);
}

/* 卦象标题样式 */
.gua-title {
  font-size: 2.2rem;
  color: var(--primary-color);
  text-align: center;
  font-weight: bold;
  position: relative;
  z-index: 1;
  text-shadow: 0 0 15px rgba(230, 200, 76, 0.4);
  font-family: 'SimSun', serif;
  letter-spacing: 4px;
  flex: 1;
  margin: 0 10px;
}

/* 卦辞区域 */
.gua-oracle {
  text-align: center;
  margin-bottom: 20px;
  padding: 10px 15px;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

/* 卦辞内容样式 - 书法古风韵味 */
.oracle-content {
  font-style: normal; /* 卦辞应为正体，去除 italic */
  color: #f4d77e; /* 更亮眼的金色，突出卦辞 */
  font-family: 'STKaiti', 'KaiTi', 'FZShuTi', 'HanyiSongyang', 'Noto Serif SC', 'SimSun', serif; /* 楷体/书法体优先 */
  text-shadow: 
    0 0 6px rgba(226, 196, 75, 0.45), /* 微弱金色发光 */
    0 1px 2px rgba(0, 0, 0, 0.4); /* 立体阴影 */
  text-align: center;
  display: block;
  font-weight: 700; /* 加粗，突出权威感 */
  font-size: 1.2rem; /* 增大字体，更醒目 */
  letter-spacing: 2px; /* 增加字间距，增强古典感 */
  line-height: 1.8; /* 增加行高，提升可读性 */
}

/* analysis-text 容器样式 - Markdown 内容样式已由 MarkdownRenderer 组件控制 */
.analysis-text {
  position: relative;
  z-index: 1;
  margin: 25px 0;
}

/* 段落标题样式 */
.paragraph-title {
  color: #e2c44b; /* 金黄色标题 */
  font-weight: bold;
  font-size: 1.2rem;
  margin-top: 20px;
  margin-bottom: 10px;
  border-bottom: 1px solid rgba(226, 196, 75, 0.5);
  padding-bottom: 5px;
  font-family: 'SimSun', serif;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
  text-indent: 0; /* 标题不缩进 */
}

/* 落款区域 */
.signature-area {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 40px;
  position: relative;
}

.signature-text {
  font-size: 0.9rem;
  color: #aaa;
  font-style: italic;
  margin-right: 20px;
  position: relative;
  top: 10px;
}

/* 朱砂印章 */
.seal-ink {
  position: relative;
  width: 80px;
  height: 80px;
  background-color: #c53030;
  color: white;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  border-radius: 5px;
  box-shadow: 0 2px 10px rgba(197, 48, 48, 0.4);
  transform: rotate(5deg);
  font-family: 'SimSun', serif;
  z-index: 1;
}

.seal-ink span {
  display: inline-block;
  width: 50%;
  text-align: center;
}

/* 竹简装饰 */
.scroll-decorations {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.bamboo-scroll {
  position: absolute;
  top: 0;
  width: 20px;
  height: 100%;
  background: linear-gradient(to bottom, #654321, #8B6914);
  border-radius: 10px;
  z-index: -1;
}

.bamboo-scroll.left {
  left: 5px;
}

.bamboo-scroll.right {
  right: 5px;
}

/* 竹简装饰细节 */
.bamboo-scroll::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(to bottom, transparent, transparent 20px, rgba(0,0,0,0.2) 20px, rgba(0,0,0,0.2) 25px);
  border-radius: 10px;
  z-index: 1;
}

/* 动画效果 */
.result-appear-enter-active {
  animation: slideUp 0.8s ease-out forwards !important;
}

.result-appear-leave-active {
  animation: slideUp 0.5s ease-in reverse !important;
}

@keyframes slideUp {
  0% {
    opacity: 0;
    transform: translateY(30px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 列渐变过渡 */
.column-fade-enter-active,
.column-fade-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.column-fade-enter-from,
.column-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.analysis-appear-enter-active,
.analysis-appear-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.analysis-appear-enter-from,
.analysis-appear-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .history-container {
    flex-direction: column;
  }
  
  .history-sidebar {
    width: 100%;
    max-height: 300px;
    border-right: none;
    border-bottom: 1px solid #333;
    height: auto;
  }
  
  .history-sidebar.collapsed {
    max-height: 60px;
    width: 100%;
  }
  
  .sidebar-content {
    height: calc(300px - 60px);
  }

  .history-content {
    height: calc(100vh - 300px - 60px);
    height: calc(100svh - 300px - 60px);
    height: calc(100dvh - 300px - 60px);
    padding: 20px;
  }
  
  .gua-title {
    font-size: 1.5rem;
  }
  
  .silk-paper {
    padding: 30px 20px;
  }
  
  .divination-title {
    font-size: 1.3rem;
  }
  
  .divination-symbol {
    font-size: 1.4rem;
  }
  
  .hexagram-pair {
    gap: 20px;
    padding: 15px;
  }
  
  .hexagram-lines {
    width: 150px;
  }
}

/* 卦象结果标题样式 */
.result-title {
  font-size: 2rem;
  color: var(--primary-color);
  margin-bottom: 25px;
  text-align: center;
  text-shadow: 0 0 15px rgba(230, 200, 76, 0.4);
  letter-spacing: 2px;
  position: relative;
}

/* 操作按钮容器 */
.action-buttons {
  position: absolute;
  left: -2px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 6px;
  z-index: 10;
}

/* 操作按钮基础样式 */
.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.action-btn svg {
  width: 18px;
  height: 18px;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}

.action-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 8px;
}

/* 删除按钮 - 融入金色主题 */
.delete-btn {
  background: linear-gradient(135deg, 
    rgba(255, 140, 0, 0.6) 0%, 
    rgba(200, 100, 0, 0.7) 100%);
  color: #fff;
  border: 1px solid rgba(255, 160, 0, 0.4);
}

.delete-btn::before {
  background: linear-gradient(135deg, 
    rgba(255, 160, 0, 0.8) 0%, 
    rgba(220, 120, 0, 0.9) 100%);
}

.delete-btn:hover {
  transform: translateX(-4px) scale(1.05);
  box-shadow: -2px 4px 16px rgba(255, 140, 0, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 160, 0, 0.7);
}

.delete-btn:hover::before {
  opacity: 1;
}

.delete-btn:hover svg {
  filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.8));
  transform: scale(1.1);
}

.delete-btn:active {
  transform: translateX(-2px) scale(0.98);
}

/* 反馈按钮 - 融入金色主题 */
.feedback-btn {
  background: linear-gradient(135deg, 
    rgba(200, 180, 50, 0.6) 0%, 
    rgba(160, 140, 30, 0.7) 100%);
  color: #fff;
  border: 1px solid rgba(220, 200, 80, 0.4);
}

.feedback-btn::before {
  background: linear-gradient(135deg, 
    rgba(230, 210, 80, 0.8) 0%, 
    rgba(200, 180, 50, 0.9) 100%);
}

.feedback-btn:hover {
  transform: translateX(-4px) scale(1.05);
  box-shadow: -2px 4px 16px rgba(220, 200, 80, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.2);
  border-color: rgba(230, 210, 80, 0.7);
}

.feedback-btn:hover::before {
  opacity: 1;
}

.feedback-btn:hover svg {
  filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.8));
  transform: scale(1.1);
}

.feedback-btn:active {
  transform: translateX(-2px) scale(0.98);
}

/* 操作按钮动画 */
.action-slide-enter-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-slide-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-slide-enter-from {
  opacity: 0;
  transform: translateY(-50%) translateX(-20px);
}

.action-slide-leave-to {
  opacity: 0;
  transform: translateY(-50%) translateX(-20px);
}

/* 删除确认弹窗遮罩 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(8px);
  padding: 20px;
}

/* 删除确认弹窗 */
.delete-confirm-modal {
  background: linear-gradient(145deg, #1a1a1a 0%, #242424 100%);
  border-radius: 16px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5),
              0 0 0 1px rgba(255, 215, 0, 0.15),
              0 0 40px rgba(255, 215, 0, 0.1);
  overflow: hidden;
  animation: modalSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid rgba(255, 215, 0, 0.4);
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  padding: 28px 24px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(to bottom, 
    rgba(220, 38, 38, 0.08) 0%, 
    transparent 100%);
}

.modal-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.modal-icon.delete-icon {
  background: linear-gradient(135deg, 
    rgba(220, 38, 38, 0.15) 0%, 
    rgba(185, 28, 28, 0.2) 100%);
  border: 2px solid rgba(220, 38, 38, 0.3);
  box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.1),
              inset 0 2px 0 rgba(255, 255, 255, 0.1);
}

.modal-icon svg {
  width: 32px;
  height: 32px;
  color: #ef4444;
  filter: drop-shadow(0 2px 8px rgba(220, 38, 38, 0.4));
}

.modal-title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 600;
  color: #fff;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.modal-content {
  padding: 24px;
  text-align: center;
}

.modal-content p {
  margin: 0 0 12px;
  font-size: 1rem;
  color: #ccc;
  line-height: 1.6;
}

.modal-warning {
  font-size: 0.9rem;
  color: #ef4444;
  font-style: italic;
  margin-bottom: 0 !important;
  text-shadow: 0 0 8px rgba(239, 68, 68, 0.3);
}

.modal-actions {
  padding: 20px 24px;
  display: flex;
  gap: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.2);
}

.modal-btn {
  flex: 1;
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  position: relative;
  overflow: hidden;
}

.modal-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cancel-btn {
  background: linear-gradient(135deg, 
    rgba(60, 60, 60, 0.8) 0%, 
    rgba(40, 40, 40, 0.9) 100%);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.cancel-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, 
    rgba(80, 80, 80, 0.9) 0%, 
    rgba(60, 60, 60, 0.9) 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.confirm-btn {
  background: linear-gradient(135deg, 
    rgba(220, 38, 38, 0.9) 0%, 
    rgba(185, 28, 28, 1) 100%);
  color: #fff;
  border: 1px solid rgba(220, 38, 38, 0.5);
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.confirm-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, 
    rgba(239, 68, 68, 1) 0%, 
    rgba(220, 38, 38, 1) 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(220, 38, 38, 0.5),
              inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.confirm-btn:active:not(:disabled) {
  transform: translateY(0);
}

.deleting-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 0.8s linear infinite;
}

/* 弹窗淡入淡出动画 */
.modal-fade-enter-active {
  transition: all 0.3s ease;
}

.modal-fade-leave-active {
  transition: all 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .delete-confirm-modal,
.modal-fade-leave-to .delete-confirm-modal {
  transform: translateY(-20px) scale(0.95);
}

/* 反馈弹窗样式 */
.feedback-modal {
  background: linear-gradient(145deg, #1a1a1a 0%, #242424 100%);
  border-radius: 16px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5),
              0 0 0 1px rgba(255, 215, 0, 0.15),
              0 0 40px rgba(255, 215, 0, 0.1);
  overflow: hidden;
  animation: modalSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid rgba(255, 215, 0, 0.4);
  position: relative;
}

.modal-icon.feedback-icon {
  background: linear-gradient(135deg, 
    rgba(34, 197, 94, 0.15) 0%, 
    rgba(22, 163, 74, 0.2) 100%);
  border: 2px solid rgba(34, 197, 94, 0.3);
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.1),
              inset 0 2px 0 rgba(255, 255, 255, 0.1);
}

.modal-icon.feedback-icon svg {
  color: #22c55e;
  filter: drop-shadow(0 2px 8px rgba(34, 197, 94, 0.4));
}

.feedback-question {
  font-size: 1.05rem;
  font-weight: 500;
  color: #fff;
  margin-bottom: 8px !important;
}

.feedback-hint {
  font-size: 0.9rem;
  color: #999;
  margin-bottom: 0 !important;
}

.feedback-actions {
  padding: 0 24px 24px;
  display: flex;
  gap: 16px;
}

.feedback-option {
  flex: 1;
  padding: 20px 16px;
  border-radius: 12px;
  border: 2px solid transparent;
  background: rgba(255, 255, 255, 0.03);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  position: relative;
  overflow: hidden;
}

.feedback-option::before {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 12px;
}

.feedback-option:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.accurate-option {
  border-color: rgba(34, 197, 94, 0.2);
}

.accurate-option::before {
  background: radial-gradient(circle at center, 
    rgba(34, 197, 94, 0.1) 0%, 
    transparent 70%);
}

.accurate-option:hover:not(:disabled) {
  border-color: rgba(34, 197, 94, 0.5);
  background: linear-gradient(135deg, 
    rgba(34, 197, 94, 0.08) 0%, 
    rgba(34, 197, 94, 0.03) 100%);
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(34, 197, 94, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.accurate-option:hover:not(:disabled)::before {
  opacity: 1;
}

.inaccurate-option {
  border-color: rgba(234, 179, 8, 0.2);
}

.inaccurate-option::before {
  background: radial-gradient(circle at center, 
    rgba(234, 179, 8, 0.1) 0%, 
    transparent 70%);
}

.inaccurate-option:hover:not(:disabled) {
  border-color: rgba(234, 179, 8, 0.5);
  background: linear-gradient(135deg, 
    rgba(234, 179, 8, 0.08) 0%, 
    rgba(234, 179, 8, 0.03) 100%);
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(234, 179, 8, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.inaccurate-option:hover:not(:disabled)::before {
  opacity: 1;
}

.option-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.option-icon.accurate {
  background: linear-gradient(135deg, 
    rgba(34, 197, 94, 0.2) 0%, 
    rgba(34, 197, 94, 0.1) 100%);
  border: 2px solid rgba(34, 197, 94, 0.3);
}

.accurate-option:hover:not(:disabled) .option-icon.accurate {
  background: linear-gradient(135deg, 
    rgba(34, 197, 94, 0.3) 0%, 
    rgba(34, 197, 94, 0.2) 100%);
  border-color: rgba(34, 197, 94, 0.5);
  transform: scale(1.1);
  box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);
}

.option-icon.inaccurate {
  background: linear-gradient(135deg, 
    rgba(234, 179, 8, 0.2) 0%, 
    rgba(234, 179, 8, 0.1) 100%);
  border: 2px solid rgba(234, 179, 8, 0.3);
}

.inaccurate-option:hover:not(:disabled) .option-icon.inaccurate {
  background: linear-gradient(135deg, 
    rgba(234, 179, 8, 0.3) 0%, 
    rgba(234, 179, 8, 0.2) 100%);
  border-color: rgba(234, 179, 8, 0.5);
  transform: scale(1.1);
  box-shadow: 0 0 20px rgba(234, 179, 8, 0.3);
}

.option-icon svg {
  width: 28px;
  height: 28px;
  transition: all 0.3s ease;
}

.option-icon.accurate svg {
  color: #22c55e;
}

.option-icon.inaccurate svg {
  color: #eab308;
}

.feedback-option:hover:not(:disabled) .option-icon svg {
  filter: drop-shadow(0 0 8px currentColor);
  transform: scale(1.1);
}

.option-content {
  text-align: center;
}

.option-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 4px;
  transition: all 0.3s ease;
}

.accurate-option:hover:not(:disabled) .option-title {
  color: #22c55e;
  text-shadow: 0 0 8px rgba(34, 197, 94, 0.3);
}

.inaccurate-option:hover:not(:disabled) .option-title {
  color: #eab308;
  text-shadow: 0 0 8px rgba(234, 179, 8, 0.3);
}

.option-desc {
  font-size: 0.85rem;
  color: #aaa;
  transition: all 0.3s ease;
}

.feedback-option:hover:not(:disabled) .option-desc {
  color: #ccc;
}

.feedback-footer {
  padding: 0 24px 24px;
  display: flex;
  justify-content: center;
}

.modal-btn.small {
  padding: 10px 32px;
  font-size: 0.9rem;
}

/* 提交中遮罩 */
.submitting-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.submitting-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.submitting-text {
  color: var(--primary-color);
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: 1px;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
}

.spinner.large {
  width: 40px;
  height: 40px;
  border-width: 3px;
}

/* 淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式优化 */
@media (max-width: 768px) {
  .action-buttons {
    left: 2px;
  }
  
  .action-btn {
    width: 32px;
    height: 32px;
  }
  
  .action-btn svg {
    width: 16px;
    height: 16px;
  }
  
  .delete-confirm-modal,
  .feedback-modal {
    max-width: 90vw;
  }
  
  .modal-header {
    padding: 24px 20px 16px;
  }
  
  .modal-icon {
    width: 56px;
    height: 56px;
  }
  
  .modal-icon svg {
    width: 28px;
    height: 28px;
  }
  
  .modal-title {
    font-size: 1.2rem;
  }
  
  .modal-content {
    padding: 20px;
  }
  
  .modal-actions {
    padding: 16px 20px;
  }
  
  .feedback-actions {
    flex-direction: column;
    padding: 0 20px 20px;
  }
  
  .feedback-option {
    width: 100%;
    flex-direction: row;
    padding: 16px;
    gap: 16px;
  }
  
  .option-icon {
    width: 48px;
    height: 48px;
  }
  
  .option-icon svg {
    width: 24px;
    height: 24px;
  }
  
  .option-content {
    text-align: left;
    flex: 1;
  }
  
  .feedback-footer {
    padding: 0 20px 20px;
  }
}
</style> 
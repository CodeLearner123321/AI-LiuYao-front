<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import api from '../services/api';
import { ElMessage, ElLoading } from 'element-plus';

// 状态变量
const historyList = ref([]); // 历史记录列表
const selectedHistory = ref(null); // 当前选中的历史记录
const loading = ref(false); // 加载状态
const sidebarCollapsed = ref(false); // 侧边栏是否折叠
const analysisResult = ref(''); // AI分析结果
const keyOutcome = ref(''); // 结果判辞
const hexagramResult = ref(null); // 卦象结果
const chineseCalendar = ref(null); // 中国历日期
const questionDescription = ref(''); // 问题描述
const questionBackground = ref(''); // 问题背景
const selectedHexagramType = ref(''); // 选中的卦象类型

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
      historyList.value = response.data.data || [];
      
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

// 选择历史记录
const selectHistory = async (history) => {
  try {
    loading.value = true;
    // 首先设置基本信息
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

// 格式化分析文本，处理换行和特殊标记
const formatAnalysisText = (text) => {
  if (!text) return '';
  
  // 不再替换换行符，保留原始的\n
  let formattedText = text;
  
  // 处理标题格式如：【标题】
  formattedText = formattedText.replace(/【([^】]+)】/g, '<div class="paragraph-title">$1</div>');
  
  // 处理关键词强调
  formattedText = formattedText.replace(/\*\*([^*]+)\*\*/g, '<span class="highlight-text">$1</span>');
  
  return formattedText;
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
    <div class="history-container">
      <!-- 侧边栏 -->
      <div :class="sidebarClass">
        <div class="sidebar-header">
          <h2>历史记录</h2>
          <button class="toggle-btn" @click="toggleSidebar">
            <i class="toggle-icon">{{ sidebarCollapsed ? '→' : '←' }}</i>
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
            >
              <div class="history-question">{{ history.question }}</div>
              <div class="history-outcome">{{ history.keyOutcome }}</div>
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
        
        <div>
          <span>时间: {{ hexagramResult.localDateTime ? formatDateString(new Date(hexagramResult.localDateTime), 'YYYY-MM-DD HH:mm') : '' }} 
          {{ new Date(hexagramResult.localDateTime).toLocaleDateString('zh-CN', { weekday: 'long' }) }}</span>
        </div>

        <div>
          <span>问题: {{ questionDescription }}</span>
        </div>

        <div>
          <span>背景: {{ questionBackground }}</span>
        </div>

        <div>
          <span>起卦类型: {{ hexagramTypes.find(type => type.value === selectedHexagramType)?.label || selectedHexagramType }}</span>
        </div>
        
        <div>
          <span>干支: {{ chineseCalendar?.year }}
            <span class="highlight-text">{{ chineseCalendar?.month }}</span>
            <span class="highlight-text">{{ " " + chineseCalendar?.day }}</span>
            (<span class="highlight-text">{{ chineseCalendar?.dayToNull }}</span> 空)
            <span class="highlight-text">{{ chineseCalendar?.hour }}</span>
          </span>
        </div>
        
        <div>
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
                    <div class="analysis-text silk-content" v-if="analysisResult" v-html="formatAnalysisText(analysisResult)"></div>
                    
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
  </div>
</template>

<style scoped>
.history-view {
  min-height: 100vh;
  background-color: var(--dark-bg);
  color: var(--text-light);
  display: flex;
  flex-direction: column;
}

.history-container {
  display: flex;
  height: 100vh;
  position: relative;
  overflow: hidden; /* 防止整体滚动 */
}

/* 侧边栏样式 */
.history-sidebar {
  width: 320px;
  background-color: #1a1a1a;
  border-right: 1px solid #333;
  transition: width 0.3s ease, transform 0.3s ease;
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.2);
  z-index: 10;
}

.history-sidebar.collapsed {
  width: 50px;
}

.sidebar-header {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #333;
  background-color: #181818;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 2;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 1.2rem;
  color: var(--primary-color);
  font-weight: bold;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.toggle-btn {
  background: none;
  border: none;
  color: #aaa;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 5px;
  transition: all 0.3s ease;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.05);
}

.toggle-btn:hover {
  color: var(--primary-color);
  background-color: rgba(255, 215, 0, 0.1);
  transform: scale(1.1);
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  /* 使左侧滚动条独立 */
  position: relative;
  height: calc(100vh - 70px); /* 减去header高度 */
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 215, 0, 0.3) #1a1a1a;
}

.sidebar-content::-webkit-scrollbar {
  width: 6px;
}

.sidebar-content::-webkit-scrollbar-track {
  background: #1a1a1a;
}

.sidebar-content::-webkit-scrollbar-thumb {
  background-color: rgba(255, 215, 0, 0.3);
  border-radius: 6px;
}

.sidebar-content::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 215, 0, 0.5);
}

.history-list {
  display: flex;
  flex-direction: column;
  padding-bottom: 20px;
}

.history-item {
  padding: 18px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  background-color: rgba(0, 0, 0, 0.1);
  margin: 0 5px 5px 5px;
  border-radius: 6px;
}

.history-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
  transform: translateY(-2px);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
}

.history-item.active {
  background-color: rgba(255, 215, 0, 0.08);
  border-left: 3px solid var(--primary-color);
}

.history-item.active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  height: 100%;
  background: linear-gradient(to bottom, var(--primary-color), transparent);
  opacity: 0.8;
}

.history-question {
  font-weight: bold;
  margin-bottom: 12px;
  font-size: 0.95rem;
  color: #ddd;
  line-height: 1.4;
}

.history-outcome {
  font-size: 0.9rem;
  color: #e6c84c;
  font-style: italic;
  line-height: 1.6;
  padding-left: 10px;
  border-left: 2px solid rgba(230, 200, 76, 0.5);
  position: relative;
  background-color: rgba(0, 0, 0, 0.2);
  padding: 8px 10px;
  border-radius: 0 4px 4px 0;
}

.loading-state,
.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: #888;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.empty-state {
  color: #666;
  font-style: italic;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(230, 200, 76, 0.2);
  border-radius: 50%;
  border-top-color: var(--primary-color);
  display: inline-block;
  margin-bottom: 15px;
  animation: spin 1s linear infinite;
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
  height: 100vh;
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

.oracle-content {
  font-style: italic;
  color: #e2c44b; /* 金黄色文本 */
  font-family: 'Noto Serif SC', 'SimSun', serif;
  text-shadow: 0 1px 1px rgba(0,0,0,0.1); /* 添加轻微文本阴影增强可读性 */
  display: block;
  font-size: 1.1rem;
}

/* 解析文本 */
.analysis-text {
  color: #e2c44b; /* 金黄色文本 */
  font-size: 1.1rem;
  line-height: 1.9;
  position: relative;
  z-index: 1;
  margin: 25px 0;
  font-family: 'Noto Serif SC', 'SimSun', serif;
  text-align: justify;
  letter-spacing: 1px;
  text-shadow: 0 1px 1px rgba(0,0,0,0.1); /* 轻微文本阴影 */
  text-indent: 2em; /* 首行缩进 */
  white-space: pre-line; /* 保留换行符 */
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
    height: calc(100vh - 300px);
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
</style> 
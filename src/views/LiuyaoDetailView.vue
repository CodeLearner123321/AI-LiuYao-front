<script setup>
import { ref, computed } from 'vue';
import NavBar from '@/components/NavBar.vue';

// 示例数据（实际使用时可通过 props 或 API 获取）
const hexagramData = ref({
  question: "今日天气如何？",
  background: "出门办事，需提前知晓天气情况",
  timeString: "乙巳年 戊子月 庚戌日 壬午时",
  castTime: "2025年1月10日 14:30",
  gua: {
    main: "泽雷随",
    mainGong: "震宫",
    mainType: "归魂卦",
    change: "水地比",
    changeGong: "坤宫",
    changeType: "归魂卦"
  },
  yaoList: [
    {
      index: 6,
      name: "上爻",
      liuShen: "腾蛇",
      liuQin: "妻财",
      diZhi: "未",
      tianGan: "己",
      wuXing: "土",
      isShi: false,
      isYing: true,
      isMove: false,
      isYang: false,
      fuShen: "父母子水",
      bian: null
    },
    {
      index: 5,
      name: "五爻",
      liuShen: "勾陈",
      liuQin: "官鬼",
      diZhi: "酉",
      tianGan: "辛",
      wuXing: "金",
      isShi: false,
      isYing: false,
      isMove: false,
      isYang: true,
      fuShen: null,
      bian: null
    },
    {
      index: 4,
      name: "四爻",
      liuShen: "朱雀",
      liuQin: "父母",
      diZhi: "亥",
      tianGan: "癸",
      wuXing: "水",
      isShi: true,
      isYing: false,
      isMove: true,
      isYang: true,
      fuShen: null,
      bian: "官鬼申金"
    },
    {
      index: 3,
      name: "三爻",
      liuShen: "青龙",
      liuQin: "妻财",
      diZhi: "辰",
      tianGan: "戊",
      wuXing: "土",
      isShi: false,
      isYing: false,
      isMove: false,
      isYang: false,
      fuShen: null,
      bian: null
    },
    {
      index: 2,
      name: "二爻",
      liuShen: "玄武",
      liuQin: "父母",
      diZhi: "亥",
      tianGan: "癸",
      wuXing: "水",
      isShi: false,
      isYing: false,
      isMove: true,
      isYang: true,
      fuShen: null,
      bian: "妻财丑土"
    },
    {
      index: 1,
      name: "初爻",
      liuShen: "白虎",
      liuQin: "妻财",
      diZhi: "丑",
      tianGan: "己",
      wuXing: "土",
      isShi: false,
      isYing: false,
      isMove: true,
      isYang: false,
      fuShen: null,
      bian: "兄弟卯木"
    }
  ],
  shenSha: {
    驿马: "申",
    将星: "午",
    华盖: "戌",
    咸池: "卯",
    贵人: "寅午",
    文昌: "亥",
    禄神: "申",
    天医: "亥"
  }
});

// 五行颜色映射
const wuxingColors = {
  金: '#FFD700',
  木: '#A3E635',
  水: '#2E5A88',
  火: '#FF6B6B',
  土: '#B58A5B'
};

// 获取五行颜色
const getWuxingColor = (wuxing) => {
  return wuxingColors[wuxing] || '#e2c44b';
};
</script>

<template>
  <div class="liuyao-detail-view">
    <NavBar />
    
    <div class="detail-container">
      <!-- 页面标题 -->
      <div class="page-header">
        <div class="header-decoration left"></div>
        <h1 class="page-title">六爻卦象详解</h1>
        <div class="header-decoration right"></div>
      </div>
      
      <!-- 主内容区 -->
      <div class="content-wrapper">
        
        <!-- 基础信息卡片 -->
        <div class="info-card">
          <div class="card-header">
            <div class="header-icon">📋</div>
            <h2 class="card-title">基础信息</h2>
          </div>
          <div class="card-body">
            <div class="info-row">
              <span class="info-label">占卦问题</span>
              <span class="info-value">{{ hexagramData.question }}</span>
            </div>
            <div class="info-row" v-if="hexagramData.background">
              <span class="info-label">背景描述</span>
              <span class="info-value">{{ hexagramData.background }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">卜卦时间</span>
              <span class="info-value">{{ hexagramData.castTime }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">干支时间</span>
              <span class="info-value ganzhi-text">{{ hexagramData.timeString }}</span>
            </div>
          </div>
        </div>
        
        <!-- 卦象信息卡片 -->
        <div class="gua-cards-container">
          <!-- 主卦 -->
          <div class="gua-card">
            <div class="gua-card-header">
              <div class="gua-badge main">本卦</div>
              <h3 class="gua-name">{{ hexagramData.gua.main }}</h3>
            </div>
            <div class="gua-meta">
              <span class="gua-gong">{{ hexagramData.gua.mainGong }}</span>
              <span class="gua-type">{{ hexagramData.gua.mainType }}</span>
            </div>
            <!-- 卦象图形 -->
            <div class="gua-symbol">
              <div v-for="yao in hexagramData.yaoList.slice().reverse()" :key="'main-' + yao.index" class="symbol-line" :class="{ 'yang': yao.isYang, 'yin': !yao.isYang }"></div>
            </div>
          </div>
          
          <!-- 变卦 -->
          <div class="gua-card" v-if="hexagramData.gua.change">
            <div class="gua-card-header">
              <div class="gua-badge change">变卦</div>
              <h3 class="gua-name">{{ hexagramData.gua.change }}</h3>
            </div>
            <div class="gua-meta">
              <span class="gua-gong">{{ hexagramData.gua.changeGong }}</span>
              <span class="gua-type">{{ hexagramData.gua.changeType }}</span>
            </div>
            <!-- 变卦图形 -->
            <div class="gua-symbol">
              <div v-for="yao in hexagramData.yaoList.slice().reverse()" :key="'change-' + yao.index" class="symbol-line" :class="{ 'yang': yao.isYang && !yao.isMove, 'yin': !yao.isYang && !yao.isMove, 'yang-change': !yao.isYang && yao.isMove, 'yin-change': yao.isYang && yao.isMove }"></div>
            </div>
          </div>
        </div>
        
        <!-- 六爻详细表格 -->
        <div class="yao-table-card">
          <div class="card-header">
            <div class="header-icon">☯</div>
            <h2 class="card-title">六爻详解</h2>
          </div>
          <div class="card-body">
            <div class="yao-table-container">
              <table class="yao-table">
                <thead>
                  <tr>
                    <th>爻位</th>
                    <th>六神</th>
                    <th>六亲</th>
                    <th>地支</th>
                    <th>五行</th>
                    <th>标识</th>
                    <th>动变</th>
                    <th>伏神</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="yao in hexagramData.yaoList.slice().reverse()" :key="yao.index" :class="{ 'active-row': yao.isMove, 'shi-row': yao.isShi, 'ying-row': yao.isYing }">
                    <td class="yao-name">{{ yao.name }}</td>
                    <td class="liushen">{{ yao.liuShen }}</td>
                    <td class="liuqin">{{ yao.liuQin }}</td>
                    <td class="dizhi" :style="{ color: getWuxingColor(yao.wuXing) }">{{ yao.tianGan }}{{ yao.diZhi }}</td>
                    <td class="wuxing" :style="{ color: getWuxingColor(yao.wuXing) }">{{ yao.wuXing }}</td>
                    <td class="marks">
                      <span v-if="yao.isShi" class="mark-badge shi">世</span>
                      <span v-if="yao.isYing" class="mark-badge ying">应</span>
                      <span v-if="yao.isMove" class="mark-badge move">动</span>
                    </td>
                    <td class="bian">
                      <span v-if="yao.bian" class="bian-text">{{ yao.bian }}</span>
                      <span v-else class="empty-text">-</span>
                    </td>
                    <td class="fushen">
                      <span v-if="yao.fuShen" class="fushen-text">{{ yao.fuShen }}</span>
                      <span v-else class="empty-text">-</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <!-- 神煞展示卡片 -->
        <div class="shensha-card">
          <div class="card-header">
            <div class="header-icon">✨</div>
            <h2 class="card-title">神煞吉凶</h2>
          </div>
          <div class="card-body">
            <div class="shensha-grid">
              <div v-for="(dizhi, name) in hexagramData.shenSha" :key="name" class="shensha-item">
                <div class="shensha-name">{{ name }}</div>
                <div class="shensha-value">{{ dizhi }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 生克关系提示区 -->
        <div class="relation-card">
          <div class="card-header">
            <div class="header-icon">⚡</div>
            <h2 class="card-title">生克关系</h2>
          </div>
          <div class="card-body">
            <div class="relation-tips">
              <div class="tip-item">
                <span class="tip-icon">🌟</span>
                <span class="tip-text">动爻：四爻、二爻、初爻</span>
              </div>
              <div class="tip-item">
                <span class="tip-icon">⚔️</span>
                <span class="tip-text">月建为水，助旺父母爻（亥水）</span>
              </div>
              <div class="tip-item">
                <span class="tip-icon">🛡️</span>
                <span class="tip-text">日辰为土，克制父母爻，但力弱</span>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ============================================================
   全局变量与基础样式
   ============================================================ */
:root {
  --primary-gold: #d4af37;
  --light-gold: #f4d77e;
  --dark-gold: #b8941f;
  --bg-dark: #0a0a0a;
  --bg-paper: #1a1815;
  --text-light: #f5f5dc;
  --text-dim: #c9b896;
  --border-gold: rgba(212, 175, 55, 0.3);
}

.liuyao-detail-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%);
  color: var(--text-light);
}

.detail-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;
}

/* ============================================================
   页面标题区
   ============================================================ */
.page-header {
  text-align: center;
  margin-bottom: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 30px;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--primary-gold);
  font-family: 'STKaiti', 'KaiTi', 'Noto Serif SC', serif;
  letter-spacing: 8px;
  text-shadow: 
    0 0 20px rgba(212, 175, 55, 0.4),
    0 2px 4px rgba(0, 0, 0, 0.6);
  position: relative;
  margin: 0;
}

.header-decoration {
  width: 100px;
  height: 2px;
  background: linear-gradient(to right, transparent, var(--primary-gold), transparent);
  box-shadow: 0 0 8px rgba(212, 175, 55, 0.5);
}

.header-decoration.left {
  background: linear-gradient(to left, var(--primary-gold), transparent);
}

.header-decoration.right {
  background: linear-gradient(to right, var(--primary-gold), transparent);
}

/* ============================================================
   内容包装器
   ============================================================ */
.content-wrapper {
  display: grid;
  gap: 30px;
}

/* ============================================================
   卡片基础样式
   ============================================================ */
.info-card,
.yao-table-card,
.shensha-card,
.relation-card {
  background: linear-gradient(145deg, rgba(26, 24, 21, 0.95) 0%, rgba(20, 18, 15, 0.95) 100%);
  border-radius: 16px;
  border: 1px solid var(--border-gold);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(212, 175, 55, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.card-header {
  padding: 20px 24px;
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(212, 175, 55, 0.02) 100%);
  border-bottom: 1px solid var(--border-gold);
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  font-size: 1.5rem;
  filter: drop-shadow(0 2px 4px rgba(212, 175, 55, 0.3));
}

.card-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--primary-gold);
  font-family: 'STKaiti', 'KaiTi', serif;
  margin: 0;
  letter-spacing: 2px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.card-body {
  padding: 24px;
}

/* ============================================================
   基础信息区
   ============================================================ */
.info-row {
  display: flex;
  padding: 12px 0;
  border-bottom: 1px solid rgba(212, 175, 55, 0.1);
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  width: 120px;
  font-weight: 600;
  color: var(--dark-gold);
  font-family: 'STKaiti', 'KaiTi', serif;
  flex-shrink: 0;
}

.info-value {
  flex: 1;
  color: var(--text-dim);
  line-height: 1.6;
}

.ganzhi-text {
  color: var(--light-gold);
  font-weight: 600;
  letter-spacing: 2px;
  text-shadow: 0 0 6px rgba(244, 215, 126, 0.3);
}

/* ============================================================
   卦象卡片区（主卦、变卦并排）
   ============================================================ */
.gua-cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.gua-card {
  background: linear-gradient(145deg, rgba(26, 24, 21, 0.95) 0%, rgba(20, 18, 15, 0.95) 100%);
  border-radius: 16px;
  border: 1px solid var(--border-gold);
  padding: 28px;
  text-align: center;
  box-shadow: 
    0 8px 24px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.gua-card-header {
  margin-bottom: 20px;
}

.gua-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 10px;
  letter-spacing: 1px;
}

.gua-badge.main {
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(212, 175, 55, 0.1));
  color: var(--light-gold);
  border: 1px solid rgba(212, 175, 55, 0.3);
}

.gua-badge.change {
  background: linear-gradient(135deg, rgba(244, 215, 126, 0.2), rgba(244, 215, 126, 0.1));
  color: var(--light-gold);
  border: 1px solid rgba(244, 215, 126, 0.3);
}

.gua-name {
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary-gold);
  font-family: 'STKaiti', 'KaiTi', serif;
  margin: 0;
  letter-spacing: 4px;
  text-shadow: 0 0 15px rgba(212, 175, 55, 0.4);
}

.gua-meta {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 12px;
  font-size: 0.9rem;
  color: var(--text-dim);
}

.gua-gong,
.gua-type {
  padding: 4px 10px;
  background: rgba(212, 175, 55, 0.05);
  border-radius: 6px;
  border: 1px solid rgba(212, 175, 55, 0.15);
}

/* 卦象图形 */
.gua-symbol {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.symbol-line {
  width: 120px;
  height: 8px;
  border-radius: 2px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.symbol-line.yang {
  background: linear-gradient(90deg, var(--primary-gold), var(--light-gold), var(--primary-gold));
}

.symbol-line.yin {
  width: 120px;
  height: 8px;
  position: relative;
  background: transparent;
}

.symbol-line.yin::before,
.symbol-line.yin::after {
  content: '';
  position: absolute;
  width: 50px;
  height: 8px;
  background: linear-gradient(90deg, var(--primary-gold), var(--light-gold), var(--primary-gold));
  border-radius: 2px;
}

.symbol-line.yin::before {
  left: 0;
}

.symbol-line.yin::after {
  right: 0;
}

/* 变爻样式 */
.symbol-line.yang-change {
  width: 120px;
  height: 8px;
  position: relative;
  background: transparent;
}

.symbol-line.yang-change::before,
.symbol-line.yang-change::after {
  content: '';
  position: absolute;
  width: 50px;
  height: 8px;
  background: linear-gradient(90deg, #FFD700, #FFF, #FFD700);
  border-radius: 2px;
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.6);
}

.symbol-line.yang-change::before {
  left: 0;
}

.symbol-line.yang-change::after {
  right: 0;
}

.symbol-line.yin-change {
  background: linear-gradient(90deg, #FFD700, #FFF, #FFD700);
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.6);
}

/* ============================================================
   六爻表格样式
   ============================================================ */
.yao-table-container {
  overflow-x: auto;
}

.yao-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.yao-table thead th {
  background: rgba(212, 175, 55, 0.1);
  color: var(--primary-gold);
  font-weight: 600;
  padding: 14px 12px;
  text-align: center;
  font-family: 'STKaiti', 'KaiTi', serif;
  font-size: 0.95rem;
  border-bottom: 2px solid var(--border-gold);
  letter-spacing: 1px;
}

.yao-table tbody tr {
  transition: all 0.3s ease;
  border-bottom: 1px solid rgba(212, 175, 55, 0.08);
}

.yao-table tbody tr:hover {
  background: rgba(212, 175, 55, 0.05);
}

.yao-table tbody tr.active-row {
  background: linear-gradient(90deg, 
    rgba(255, 215, 0, 0.12), 
    rgba(255, 215, 0, 0.08), 
    rgba(255, 215, 0, 0.12));
  box-shadow: inset 0 0 20px rgba(255, 215, 0, 0.1);
}

.yao-table tbody tr.shi-row {
  border-left: 3px solid rgba(52, 211, 153, 0.5);
}

.yao-table tbody tr.ying-row {
  border-left: 3px solid rgba(251, 146, 60, 0.5);
}

.yao-table tbody td {
  padding: 14px 12px;
  text-align: center;
  font-size: 0.95rem;
  color: var(--text-dim);
}

.yao-name {
  font-weight: 600;
  color: var(--primary-gold);
  font-family: 'STKaiti', 'KaiTi', serif;
}

.liushen {
  color: #8b7aa8;
  font-weight: 500;
}

.liuqin {
  color: var(--light-gold);
  font-weight: 600;
}

.dizhi,
.wuxing {
  font-weight: 700;
  text-shadow: 0 0 4px currentColor;
}

.marks {
  display: flex;
  gap: 6px;
  justify-content: center;
  flex-wrap: wrap;
}

.mark-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 1px;
}

.mark-badge.shi {
  background: rgba(52, 211, 153, 0.2);
  color: #34d399;
  border: 1px solid rgba(52, 211, 153, 0.3);
}

.mark-badge.ying {
  background: rgba(251, 146, 60, 0.2);
  color: #fb923c;
  border: 1px solid rgba(251, 146, 60, 0.3);
}

.mark-badge.move {
  background: rgba(255, 215, 0, 0.2);
  color: #FFD700;
  border: 1px solid rgba(255, 215, 0, 0.4);
  animation: movePulse 2s ease-in-out infinite;
}

@keyframes movePulse {
  0%, 100% {
    box-shadow: 0 0 4px rgba(255, 215, 0, 0.3);
  }
  50% {
    box-shadow: 0 0 12px rgba(255, 215, 0, 0.6);
  }
}

.bian-text {
  color: var(--light-gold);
  font-size: 0.85rem;
}

.fushen-text {
  color: #8b7aa8;
  font-size: 0.85rem;
  font-style: italic;
}

.empty-text {
  color: rgba(255, 255, 255, 0.2);
}

/* ============================================================
   神煞展示区
   ============================================================ */
.shensha-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
}

.shensha-item {
  background: rgba(212, 175, 55, 0.04);
  border: 1px solid rgba(212, 175, 55, 0.15);
  border-radius: 10px;
  padding: 14px;
  text-align: center;
  transition: all 0.3s ease;
}

.shensha-item:hover {
  background: rgba(212, 175, 55, 0.08);
  border-color: rgba(212, 175, 55, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(212, 175, 55, 0.2);
}

.shensha-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--primary-gold);
  margin-bottom: 6px;
  font-family: 'STKaiti', 'KaiTi', serif;
}

.shensha-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--light-gold);
  text-shadow: 0 0 6px rgba(244, 215, 126, 0.3);
}

/* ============================================================
   生克关系提示区
   ============================================================ */
.relation-tips {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(212, 175, 55, 0.03);
  border-left: 3px solid var(--primary-gold);
  border-radius: 6px;
}

.tip-icon {
  font-size: 1.2rem;
}

.tip-text {
  color: var(--text-dim);
  line-height: 1.6;
  font-size: 0.95rem;
}

/* ============================================================
   响应式布局
   ============================================================ */
@media (max-width: 768px) {
  .page-title {
    font-size: 1.8rem;
    letter-spacing: 4px;
  }
  
  .header-decoration {
    width: 50px;
  }
  
  .gua-cards-container {
    grid-template-columns: 1fr;
  }
  
  .yao-table {
    font-size: 0.85rem;
  }
  
  .yao-table thead th,
  .yao-table tbody td {
    padding: 10px 6px;
  }
  
  .shensha-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 12px;
  }
  
  .info-row {
    flex-direction: column;
    gap: 6px;
  }
  
  .info-label {
    width: 100%;
  }
}
</style>



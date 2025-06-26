<script setup>
import { ref, onMounted, watch, inject } from 'vue';

const props = defineProps({
  showModal: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['acceptDisclaimer']);

const isChecked = ref(false);
const isSubmitting = ref(false);

// 监听模态框显示状态变化
watch(() => props.showModal, (newValue) => {
  if (newValue) {
    console.log('声明弹窗已显示');
    // 重置勾选状态
    isChecked.value = false;
    isSubmitting.value = false;
  }
});

const acceptDisclaimer = () => {
  if (isChecked.value) {
    console.log('用户点击了确认按钮');
    isSubmitting.value = true;
    
    // 延迟一点以显示提交状态
    setTimeout(() => {
      // 仅触发事件通知父组件，由父组件处理保存状态
      emit('acceptDisclaimer');
      isSubmitting.value = false;
    }, 300);
  } else {
    console.log('用户未勾选同意复选框');
  }
};
</script>

<template>
  <div v-if="showModal" class="disclaimer-modal">
    <div class="disclaimer-content">
      <h2>AI六爻占卜模拟系统使用声明</h2>
      
      <div class="disclaimer-text">
        <ol>
          <li><strong>非商用声明</strong>
            <p>所有内容与功能仅供个人非商业用途。禁止将本系统用于任何营利活动，包括但不限于收费占卜。</p>
          </li>
          <li><strong>非占卜工具声明</strong>
            <p>系统生成的卦象解读仅为基于算法模型的概率推演，不构成真实占卜行为。严禁将其用于现实决策参考，使用者不得以任何形式宣称本系统具有实际预测功能。</p>
          </li>
          <li><strong>文化学习属性声明</strong> 
            <p>本系统定位为传统文化数字化学习工具，旨在帮助用户理解六爻的卦象逻辑。建议使用者结合《增删卜易》等经典文献进行对比研习。</p>
          </li>
          <li><strong>法律风险规避</strong>
            <p>使用者需自行承担因违反所在地法律法规（如涉及互联网占卜服务禁令）产生的责任。开发者明确反对任何形式的封建迷信传播行为。</p>
          </li>
          <li><strong>技术使用限制</strong>
            <p>禁止对系统进行逆向工程、数据抓取或接口滥用，不得将生成内容二次包装为占卜服务。</p>
          </li>
        </ol>
        <p class="note">本声明最终解释权归项目开发者所有，保留根据技术发展及政策要求调整条款的权利。</p>
      </div>
      
      <div class="disclaimer-footer">
        <label class="checkbox-container">
          <input type="checkbox" v-model="isChecked">
          <span class="checkmark"></span>
          我已阅读并同意以上声明
        </label>
        <button 
          :disabled="!isChecked || isSubmitting" 
          @click="acceptDisclaimer" 
          class="accept-btn"
          :class="{ 'btn-disabled': !isChecked, 'btn-submitting': isSubmitting }"
        >
          {{ isSubmitting ? '处理中...' : '确认并继续' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.disclaimer-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.disclaimer-content {
  background-color: var(--dark-bg);
  border: 1px solid var(--primary-color);
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 30px;
  color: var(--text-light);
  box-shadow: 0 0 20px rgba(230, 200, 76, 0.3);
}

.disclaimer-content h2 {
  color: var(--primary-color);
  text-align: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(230, 200, 76, 0.3);
}

.disclaimer-text {
  margin-bottom: 25px;
  line-height: 1.6;
}

.disclaimer-text ol {
  padding-left: 20px;
}

.disclaimer-text li {
  margin-bottom: 15px;
}

.disclaimer-text strong {
  color: var(--primary-color);
}

.disclaimer-text p {
  margin: 5px 0 0;
  color: #ddd;
}

.disclaimer-text .note {
  font-style: italic;
  margin-top: 20px;
  color: #aaa;
}

.disclaimer-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 20px;
}

.checkbox-container {
  position: relative;
  padding-left: 35px;
  margin-bottom: 20px;
  cursor: pointer;
  font-size: 1rem;
  user-select: none;
  display: flex;
  align-items: center;
}

.checkbox-container input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  position: absolute;
  left: 0;
  height: 20px;
  width: 20px;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid var(--primary-color);
  border-radius: 4px;
}

.checkbox-container:hover input ~ .checkmark {
  background-color: rgba(230, 200, 76, 0.1);
}

.checkbox-container input:checked ~ .checkmark {
  background-color: rgba(230, 200, 76, 0.3);
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
}

.checkbox-container input:checked ~ .checkmark:after {
  display: block;
}

.checkbox-container .checkmark:after {
  left: 7px;
  top: 3px;
  width: 5px;
  height: 10px;
  border: solid var(--primary-color);
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.accept-btn {
  background-color: var(--primary-color);
  color: var(--dark-bg);
  border: none;
  padding: 10px 25px;
  font-size: 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: bold;
}

.accept-btn:hover:not(.btn-disabled):not(.btn-submitting) {
  background-color: #d4b93e;
  transform: translateY(-2px);
}

.btn-disabled {
  background-color: #666;
  cursor: not-allowed;
  opacity: 0.7;
}

.btn-submitting {
  background-color: #a99630;
  cursor: wait;
  opacity: 0.9;
}

@media (max-width: 768px) {
  .disclaimer-content {
    padding: 20px;
    width: 95%;
  }
  
  .disclaimer-content h2 {
    font-size: 1.5rem;
  }
  
  .disclaimer-text {
    font-size: 0.9rem;
  }
}
</style> 
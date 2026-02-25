<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick, onUnmounted } from 'vue';
import NavBar from '@/components/NavBar.vue';
import MarkdownRenderer from '@/components/MarkdownRenderer.vue';
import { formatDate } from '@/utils/dateUtils';
import api, { logout } from '@/services/api';
import { useRouter } from 'vue-router';

// 占卜时间
const divineTime = ref(new Date());  // 默认使用当前时间
//取卦时间戳
const usedTimestamp = ref(null); // 存储使用的时间戳
const timePickerVisible = ref(false);
const isLoading = ref(false);

// 临时日期对象，用于时间选择器
const tempDate = reactive({
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  day: new Date().getDate(),
  hour: new Date().getHours(),
  minute: new Date().getMinutes()
});

// 生成年份选项（前后50年）
const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear - 50; i <= currentYear + 50; i++) {
    years.push({
      label: `${i}年`,
      value: i
    });
  }
  return years;
});

// 生成月份选项
const monthOptions = computed(() => {
  const months = [];
  for (let i = 1; i <= 12; i++) {
    months.push({
      label: `${i}月`,
      value: i
    });
  }
  return months;
});

// 生成日期选项（根据年月动态计算）
const dayOptions = computed(() => {
  const days = [];
  const daysInMonth = new Date(tempDate.year, tempDate.month, 0).getDate();
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      label: `${i}日`,
      value: i
    });
  }
  return days;
});

// 生成小时选项
const hourOptions = computed(() => {
  const hours = [];
  for (let i = 0; i <= 23; i++) {
    hours.push({
      label: `${i}时`,
      value: i
    });
  }
  return hours;
});

// 生成分钟选项
const minuteOptions = computed(() => {
  const minutes = [];
  for (let i = 0; i <= 59; i++) {
    minutes.push({
      label: `${i}分`,
      value: i
    });
  }
  return minutes;
});

// 格式化后的日期时间字符串
const formattedDateTime = computed(() => {
  if (!divineTime.value) return '';
  return formatDate(divineTime.value, 'YYYY 年 MM 月 DD 日 HH:mm');
});

// 中国传统历法（八字）
const chineseCalendar = ref(null);

// 定义ref对象
const yearColumnRef = ref(null);
const monthColumnRef = ref(null);
const dayColumnRef = ref(null);
const hourColumnRef = ref(null);
const minuteColumnRef = ref(null);

// 响应式检测是否为手机端
const isMobile = ref(false);

// 检测屏幕尺寸变化
const checkScreenSize = () => {
  isMobile.value = window.innerWidth <= 768;
};

// 监听窗口大小变化
onMounted(() => {
  checkScreenSize();
  window.addEventListener('resize', checkScreenSize);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize);
});

// 在响应式变量定义部分添加一个新的状态变量
const isDataChanged = ref(true); // 默认为true，表示第一次加载
const prevCalendarData = ref(null); // 用于存储上一次的日历数据

// 添加柱子变化检测的计算属性
const pillarChanges = reactive({
  year: true,  // 默认为true，表示第一次加载
  month: true, 
  day: true,
  hour: true
});

// 打开时间选择器
const openTimePicker = () => {
  // 如果已有选择的时间，则使用该时间初始化临时日期
  if (divineTime.value) {
    const date = new Date(divineTime.value);
    tempDate.year = date.getFullYear();
    tempDate.month = date.getMonth() + 1;
    tempDate.day = date.getDate();
    tempDate.hour = date.getHours();
    tempDate.minute = date.getMinutes();
  }
  timePickerVisible.value = true;
  
  // 在对话框打开后，确保选中项在中间位置
  nextTick(() => {
    scrollToCenter('yearColumnRef', yearOptions.value, tempDate.year);
    scrollToCenter('monthColumnRef', monthOptions.value, tempDate.month);
    scrollToCenter('dayColumnRef', dayOptions.value, tempDate.day);
    scrollToCenter('hourColumnRef', hourOptions.value, tempDate.hour);
    scrollToCenter('minuteColumnRef', minuteOptions.value, tempDate.minute);
    
    // 添加事件监听器，限制滚动
    setupScrollLimits();
  });
};

// 设置滚动限制
const setupScrollLimits = () => {
  const columns = ['yearColumnRef', 'monthColumnRef', 'dayColumnRef', 'hourColumnRef', 'minuteColumnRef'];
  const optionsMap = {
    'yearColumnRef': yearOptions.value,
    'monthColumnRef': monthOptions.value,
    'dayColumnRef': dayOptions.value,
    'hourColumnRef': hourOptions.value,
    'minuteColumnRef': minuteOptions.value
  };
  
  columns.forEach(colRef => {
    const refMap = {
      'yearColumnRef': yearColumnRef,
      'monthColumnRef': monthColumnRef,
      'dayColumnRef': dayColumnRef,
      'hourColumnRef': hourColumnRef,
      'minuteColumnRef': minuteColumnRef
    };
    
    const scrollbarRef = refMap[colRef];
    if (!scrollbarRef || !scrollbarRef.value) return;
    
    const scrollbar = scrollbarRef.value;
    if (!scrollbar || !scrollbar.wrapRef) return;
    
    const wrapEl = scrollbar.wrapRef;
    const optionsCount = optionsMap[colRef].length;
    const optionHeight = 36; // 每个选项的高度
    
    // 计算最大滚动距离
    const totalContentHeight = optionHeight * optionsCount;
    const maxScroll = Math.max(0, totalContentHeight - wrapEl.clientHeight + 84); // 84 = padding(42) * 2
    
    // 为每个滚动容器添加滚动事件监听
    wrapEl.addEventListener('scroll', () => {
      if (wrapEl.scrollTop < 0) {
        wrapEl.scrollTop = 0;
      } else if (wrapEl.scrollTop > maxScroll) {
        wrapEl.scrollTop = maxScroll;
      }
    });
  });
};

// 滚动到中心位置的方法
const scrollToCenter = (refName, options, selectedValue) => {
  // 使用对象映射获取ref
  const refMap = {
    'yearColumnRef': yearColumnRef,
    'monthColumnRef': monthColumnRef,
    'dayColumnRef': dayColumnRef,
    'hourColumnRef': hourColumnRef,
    'minuteColumnRef': minuteColumnRef
  };
  
  const scrollbarRef = refMap[refName];
  if (!scrollbarRef || !scrollbarRef.value) return;
  
  const scrollbar = scrollbarRef.value;
  if (!scrollbar) return;
  
  // 查找选项元素
  nextTick(() => {
    const wrapEl = scrollbar.wrapRef;
    if (!wrapEl) return;
    
    // 根据屏幕尺寸动态计算选项高度和padding
    const isMobileView = window.innerWidth <= 768;
    const isSmallMobile = window.innerWidth <= 480;
    
    let optionHeight, topPadding;
    if (isSmallMobile) {
      optionHeight = 28;
      topPadding = 31;
    } else if (isMobileView) {
      optionHeight = 32;
      topPadding = 34;
    } else {
      optionHeight = 36;
      topPadding = 42;
    }
    
    const wrapHeight = wrapEl.clientHeight;
    
    // 找到选中项的索引
    const selectedIndex = options.findIndex(option => option.value === selectedValue);
    if (selectedIndex === -1) return;
    
    // 计算理想滚动位置：选项在中间
    const idealScrollTop = (selectedIndex * optionHeight) - ((wrapHeight - optionHeight) / 2) + topPadding;
    
    // 设置滚动位置，确保选中项正好在中间位置
    wrapEl.scrollTop = Math.max(0, idealScrollTop);
    
    // 计算显示项的总高度
    const totalContentHeight = options.length * optionHeight;
    
    // 确保不能滚动太远，防止出现大片空白
    const maxScrollTop = Math.max(0, totalContentHeight - wrapHeight + (topPadding * 2));
    
    // 限制滚动范围
    if (wrapEl.scrollTop > maxScrollTop) {
      wrapEl.scrollTop = maxScrollTop;
    }
  });
};

// 确认时间选择
const confirmTimeSelection = () => {
  const selectedDate = new Date(
    tempDate.year,
    tempDate.month - 1,
    tempDate.day,
    tempDate.hour,
    tempDate.minute
  );
  
  // 获取旧时间和新时间的差异
  const oldHour = divineTime.value ? divineTime.value.getHours() : -1;
  const oldMinute = divineTime.value ? divineTime.value.getMinutes() : -1;
  const oldDay = divineTime.value ? divineTime.value.getDate() : -1;
  const oldMonth = divineTime.value ? divineTime.value.getMonth() : -1;
  const oldYear = divineTime.value ? divineTime.value.getFullYear() : -1;
  
  const newHour = selectedDate.getHours();
  const newMinute = selectedDate.getMinutes();
  const newDay = selectedDate.getDate();
  const newMonth = selectedDate.getMonth();
  const newYear = selectedDate.getFullYear();
  
  // 根据时间变化提前设置哪些柱子需要动画
  // 这里我们先假设所有的都变化
  pillarChanges.year = oldYear !== newYear;
  pillarChanges.month = oldMonth !== newMonth || oldYear !== newYear;
  pillarChanges.day = oldDay !== newDay || oldMonth !== newMonth || oldYear !== newYear;
  pillarChanges.hour = oldHour !== newHour || oldDay !== newDay || oldMonth !== newMonth || oldYear !== newYear;
  
  console.log('时间选择变化:', {
    年变化: pillarChanges.year,
    月变化: pillarChanges.month,
    日变化: pillarChanges.day,
    时变化: pillarChanges.hour
  });
  
  divineTime.value = selectedDate;
  timePickerVisible.value = false;
  // 清空之前的八字结果
  chineseCalendar.value = null;
  
  // 设置数据已修改标志
  isDataChanged.value = true;
  
  // 首次加载或整体变化大，所有柱子都设置为已变化
  if (!prevCalendarData.value) {
    pillarChanges.year = true;
    pillarChanges.month = true;
    pillarChanges.day = true;
    pillarChanges.hour = true;
  }
  
  // 直接调用后端API获取八字
  fetchBaziFromAPI();
};

// 添加重置动画的函数
const resetAnimations = () => {
  // 使用nextTick确保DOM已更新
  nextTick(() => {
    // 更直接地重置各个柱子的动画状态 - 先全部禁用动画
    const allPillars = document.querySelectorAll('.pillar-animation-wrapper');
    allPillars.forEach(pillar => {
      // 移除所有动画
      pillar.classList.remove('animate-pillar');
      pillar.style.animation = 'none';
    });
    
    // 强制浏览器重排
    document.body.offsetHeight;
    
    // 只为发生变化的柱子添加动画类
    allPillars.forEach(pillar => {
      const pillarType = pillar.getAttribute('data-pillar');
      if (pillarType) {
        if (pillarType.startsWith('year-') && pillarChanges.year ||
            pillarType.startsWith('month-') && pillarChanges.month ||
            pillarType.startsWith('day-') && pillarChanges.day ||
            pillarType.startsWith('hour-') && pillarChanges.hour) {
          pillar.classList.add('animate-pillar');
          pillar.style.animation = '';
        }
      }
    });
  });
};

// 调用后端API获取八字
const fetchBaziFromAPI = async () => {
  console.log('>>> fetchBaziFromAPI 开始执行');
  console.log('>>> divineTime.value:', divineTime.value);
  
  if (!divineTime.value) {
    // 如果没有选择时间，提示用户
    console.log('>>> 没有选择时间，退出');
    alert('请先选择占卜时间');
    return;
  }
  
  console.log('>>> 设置 isLoading = true');
  isLoading.value = true;
  
  try {
    // 格式化日期为ISO格式：YYYY-MM-DDTHH:mm:ss
    const isoDateTime = formatDate(divineTime.value, 'YYYY-MM-DDTHH:mm:ss');
    console.log('>>> 格式化后的时间:', isoDateTime);
    console.log('>>> 准备调用 API: /api/liuyao/calculate');
    
    // 创建一个超时 Promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('API 请求超时')), 10000); // 10秒超时
    });
    
    // 调用后端API，使用 Promise.race 实现超时控制
    const response = await Promise.race([
      api.get('/api/liuyao/calculate', {
        params: {
          dateTime: isoDateTime
        }
      }),
      timeoutPromise
    ]);
    
    console.log('>>> API 调用完成，收到响应:', response.data);
    
    // 处理API返回的数据
    if (response.data.data) {
      // 比较新旧数据，检查是否有变化
      const newData = {
        year: response.data.data.year,
        month: response.data.data.month,
        day: response.data.data.day,
        hour: response.data.data.hour,
        dayToNull: response.data.data.dayToNull,
        yearToNull: response.data.data.yearToNull,
        monthToNull: response.data.data.monthToNull,
        hourToNull: response.data.data.hourToNull,
        lunarDate: response.data.data.lunarDate,
        solarDate: response.data.data.solarDate,
        wuxing: response.data.data.wuxing,
        nayin: response.data.data.nayin,
        shishen: response.data.data.shishen,
        luck: response.data.data.luck
      };
      
      // 检查整体数据是否有变化
      isDataChanged.value = !prevCalendarData.value || 
                          JSON.stringify(prevCalendarData.value) !== JSON.stringify(newData);
      
      // 检查每个柱子的数据是否有变化
      if (!prevCalendarData.value) {
        // 首次加载，所有柱子都设置为变化
        pillarChanges.year = true;
        pillarChanges.month = true;
        pillarChanges.day = true;
        pillarChanges.hour = true;
      } else {
        // 比较每个柱子的数据
        pillarChanges.year = prevCalendarData.value.year !== newData.year;
        pillarChanges.month = prevCalendarData.value.month !== newData.month;
        pillarChanges.day = prevCalendarData.value.day !== newData.day;
        pillarChanges.hour = prevCalendarData.value.hour !== newData.hour;
        
        // 打印变化状态，帮助调试
        console.log('柱子变化状态:', {
          year: pillarChanges.year,
          month: pillarChanges.month,
          day: pillarChanges.day,
          hour: pillarChanges.hour
        });
        
        console.log('变化前数据:', {
          year: prevCalendarData.value.year,
          month: prevCalendarData.value.month,
          day: prevCalendarData.value.day,
          hour: prevCalendarData.value.hour
        });
        
        console.log('变化后数据:', {
          year: newData.year,
          month: newData.month,
          day: newData.day,
          hour: newData.hour
        });
      }
      
      // 更新当前数据
      chineseCalendar.value = newData;
      
      // 更新上一次的数据（必须在resetAnimations后执行）
      // 先重置动画，然后再保存最新数据作为下一次的比较基准
      resetAnimations();
      
      // 数据处理完毕后，更新上一次的数据作为下一次比较的基准
      prevCalendarData.value = JSON.parse(JSON.stringify(newData));
    }
  } catch (error) {
    console.error('获取八字信息失败', error);
    if (error.response && error.response.data && error.response.data.message) {
      alert(`获取八字信息失败: ${error.response.data.message}`);
    } else if(error.response && error.response.status === 401){
      // 使用logout函数进行登出处理
      logout();
    } else {
      alert('获取八字信息失败，请稍后重试');
    }
  } finally {
    isLoading.value = false;
    console.log('fetchBaziFromAPI 完成，isLoading 已重置为:', isLoading.value);
  }
};

// 定义起卦类型选项
const hexagramTypes = [
  { label: '手动指定爻象', value: 'appoint', icon: '🔣' },
  { label: '系统随机起卦', value: 'random', icon: '🎲' },
  { label: '系统时间起卦', value: 'timeRandom', icon: '⏱️' },
  { label: '图像识别起卦', value: 'imageRecognition', icon: '🖼️' }
];

// 干支选项
const ganzhiOptions = [
  { label: '少阴 — —(2背1字)', value: 'shaoyin' },
  { label: '少阳 ———  (1背2字)', value: 'shaoyang' },
  { label: '老阴 — —× (0背3字)', value: 'laoyin' },
  { label: '老阳 ———○ (3背0字)', value: 'laoyang' }
];

// 表单数据
const selectedHexagramType = ref('appoint');
const questionDescription = ref('');
const questionBackground = ref('');
const additionalInfo = ref('');
const activeTab = ref('text');

// 六个爻的数据
const yaoValues = reactive({
  yao1: 'shaoyang',
  yao2: 'shaoyang',
  yao3: 'shaoyang',
  yao4: 'shaoyang',
  yao5: 'shaoyang',
  yao6: 'shaoyang'
});

// 摇卦相关变量
const isShaking = ref(false);
const currentShakingYao = ref(0); // 0表示未开始，1-6表示当前正在摇的爻
const yaoTransitionSpeed = 300; // 爻变化动画速度 (毫秒)
const yaoValues_backup = reactive({
  yao1: 'shaoyang',
  yao2: 'shaoyang',
  yao3: 'shaoyang',
  yao4: 'shaoyang',
  yao5: 'shaoyang',
  yao6: 'shaoyang'
});
const buttonDisabled = ref(false); // 按钮是否禁用（摇卦完成后）

// 检查是否显示卦象组件
const showHexagramComponent = computed(() => {
  return selectedHexagramType.value === 'appoint' || selectedHexagramType.value === 'random';
});

// 检查是否显示图像识别组件
const showImageRecognitionComponent = computed(() => {
  return selectedHexagramType.value === 'imageRecognition';
});

// 获取按钮文本
const getButtonText = computed(() => {
  if (isShaking.value) return '摇卦中...';
  if (selectedHexagramType.value === 'random' && !buttonDisabled.value) return '开始摇卦';
  if (selectedHexagramType.value === 'imageRecognition') return '识别图像';
  return '生成卦象';
});

// 随机生成爻值
const getRandomYaoValue = () => {
  const values = ['shaoyin', 'shaoyang', 'laoyin', 'laoyang'];
  const randomIndex = Math.floor(Math.random() * values.length);
  return values[randomIndex];
};

// 提交表单按钮点击事件处理
const submitForm = async () => {
  // 图像识别起卦需要检查是否上传了文件
  if (selectedHexagramType.value === 'imageRecognition' && !uploadedFile.value) {
    alert('请先上传图片文件');
    return;
  }
  
  // 非图像识别起卦需要检查是否输入了问题描述
  if (selectedHexagramType.value !== 'imageRecognition' && !questionDescription.value) {
    alert('请详细描述问题');
    return;
  }
  
  // 如果正在摇卦中，不执行任何操作
  if (isShaking.value) {
    return;
  }
  
  if (selectedHexagramType.value === 'random' && !buttonDisabled.value) {
    // 系统随机起卦类型，开始摇卦过程
    isShaking.value = true;
    currentShakingYao.value = 1;
    await shakeNextYao(1);
  } else if (selectedHexagramType.value === 'imageRecognition') {
    // 图像识别起卦
    await generateHexagramFromImage();
  } else {
    // 其他类型，直接生成卦象
    await generateHexagramLocal();
  }
};

// 摇一个特定的爻
const shakeNextYao = async (yaoIndex) => {
  if (yaoIndex < 1 || yaoIndex > 6) return;
  
  const yaoKey = `yao${yaoIndex}`;
  
  // 爻变化动画：快速切换几次爻的状态
  for (let j = 0; j < 5; j++) {
    yaoValues[yaoKey] = getRandomYaoValue();
    await new Promise(resolve => setTimeout(resolve, yaoTransitionSpeed - j * 30));
  }
  
  // 最终的爻值
  yaoValues[yaoKey] = getRandomYaoValue();
  
  // 如果是最后一个爻
  if (yaoIndex === 6) {
    finishShaking();
    return;
  }
  
  // 等待一段时间后摇下一个爻
  await new Promise(resolve => setTimeout(resolve, 400));
  
  // 自动继续下一个爻
  if (isShaking.value) {
    currentShakingYao.value = yaoIndex + 1;
    await shakeNextYao(yaoIndex + 1);
  }
};

// 完成摇卦过程
const finishShaking = () => {
  currentShakingYao.value = 0;
  isShaking.value = false;
  
  generateHexagramLocal();
};

const generateHexagramLocal = async () => {
  
  isLoading.value = true;
  
  try {
    // 构建请求参数
    const requestData = {
      castTime: formatDate(divineTime.value, 'YYYY-MM-DD HH:mm:ss')
    };
    
    // 根据不同的卦象类型设置不同的请求参数
    if (selectedHexagramType.value === 'timeRandom') {
      // 系统时间起卦 - 使用的是当前时间戳
      usedTimestamp.value = divineTime.value.getTime();
      requestData.castType = 'TIME';
      requestData.timestamp = new Date().getTime(); // 使用的是当前时间戳
    } else if (selectedHexagramType.value === 'random') {
      // 系统随机起卦
      requestData.castType = 'RANDOM';
      requestData.number = convertYaoValuesToNumber();
    } else if (selectedHexagramType.value === 'appoint') {
      // 手动指定爻象
      requestData.castType = 'MANUAL';
      requestData.number = convertYaoValuesToNumber();
    }
    
    console.log('发送请求:', requestData);
    
    // 如果已有结果，先隐藏当前结果以触发动画
    if (showResult.value) {
      showResult.value = false;
      await new Promise(resolve => setTimeout(resolve, 300)); // 等待动画结束
    }
    
    // 发送请求到后端
    const response = await api.post('/api/liuyao/generate/liuyao', requestData);
    
    // 存储卦象结果并显示
    if (response.data.code === 200 && response.data.data) {
      hexagramResult.value = response.data.data;
      console.log("hexagramResult.value:",hexagramResult.value);
      showResult.value = true;
      
      // 滚动到结果区域并重新应用行动画
      nextTick(() => {
        const resultElement = document.getElementById('hexagram-result');
        if (resultElement) {
          resultElement.scrollIntoView({ behavior: 'smooth' });
          
          // 重新应用行动画
          const rows = document.querySelectorAll('.animate-row');
          rows.forEach(row => {
            row.style.animation = 'none';
            row.offsetHeight; // 触发重排
            row.style.animation = '';
          });
        }
      });
    } else {
      throw new Error(response.data.msg || '生成卦象失败');
    }
  } catch (error) {
    console.error('生成卦象失败', error);
    if (error.response) {
      if (error.response.status === 401) {
      // 使用logout函数进行登出处理
      logout();
      } else if (error.response.data) {
        alert(`生成卦象失败: ${error.response.data.msg || '服务器错误'}`);
    } else {
      alert('生成卦象失败，请稍后重试');
      }
    } else {
      alert(error.message || '生成卦象失败，请稍后重试');
    }
  } finally {
    isLoading.value = false;
  }
};

// 将界面上的爻值转换为后端需要的数字格式
const convertYaoValuesToNumber = () => {
  // 爻值对应的数字：老阴(0)、少阳(1)、少阴(2)、老阳(3)
  const valueMap = {
    'laoyin': '0',
    'shaoyang': '1',
    'shaoyin': '2',
    'laoyang': '3'
  };
  
  // 从初爻到上爻（从下到上）的顺序构建六位数字
  return (
    valueMap[yaoValues.yao1] +
    valueMap[yaoValues.yao2] +
    valueMap[yaoValues.yao3] +
    valueMap[yaoValues.yao4] +
    valueMap[yaoValues.yao5] +
    valueMap[yaoValues.yao6]
  );
};

// 图像识别起卦方法
const generateHexagramFromImage = async () => {
  if (!uploadedFile.value) {
    alert('请先上传图片文件');
    return;
  }
  
  isImageProcessing.value = true;
  
  try {
    // 创建FormData对象
    const formData = new FormData();
    formData.append('file', uploadedFile.value);
    
    // 调用图像识别接口
    const response = await api.post('/api/liuyao/recognize', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    // 处理API返回的数据
    if (response.data.code === 200 && response.data.data) {
      // 处理新的数据结构：data.hexagram 和 data.price
      const responseData = response.data.data;
      
      // 如果返回的是新结构（包含 hexagram 和 price）
      if (responseData.hexagram) {
        hexagramResult.value = responseData.hexagram;
        recognizedPrice.value = responseData.price;
        console.log("图像识别卦象结果:", hexagramResult.value);
        console.log("图像识别价格:", recognizedPrice.value);
        
        // 从图像识别结果中获取问题描述和背景信息
        if (responseData.hexagram.questionDescription) {
          questionDescription.value = responseData.hexagram.questionDescription;
        }
        if (responseData.hexagram.questionBackground) {
          questionBackground.value = responseData.hexagram.questionBackground;
        }
        // 存储图像识别返回的number数据，用于后续的cast请求
        if (responseData.hexagram.number) {
          imageRecognitionNumber.value = responseData.hexagram.number;
          console.log("图像识别返回的number:", imageRecognitionNumber.value);
        }
      } else {
        // 兼容旧的数据结构（直接返回 hexagram 数据）
        hexagramResult.value = responseData;
        console.log("图像识别卦象结果:", hexagramResult.value);
        
        // 从图像识别结果中获取问题描述和背景信息
        if (responseData.questionDescription) {
          questionDescription.value = responseData.questionDescription;
        }
        if (responseData.questionBackground) {
          questionBackground.value = responseData.questionBackground;
        }
        // 存储图像识别返回的number数据，用于后续的cast请求
        if (responseData.number) {
          imageRecognitionNumber.value = responseData.number;
          console.log("图像识别返回的number:", imageRecognitionNumber.value);
        }
      }
      
      showResult.value = true;
      
      // 滚动到结果区域并重新应用行动画
      nextTick(() => {
        const resultElement = document.getElementById('hexagram-result');
        if (resultElement) {
          resultElement.scrollIntoView({ behavior: 'smooth' });
          
          // 重新应用行动画
          const rows = document.querySelectorAll('.animate-row');
          rows.forEach(row => {
            row.style.animation = 'none';
            row.offsetHeight; // 触发重排
            row.style.animation = '';
          });
        }
      });
    } else {
      throw new Error(response.data.msg || '图像识别失败');
    }
  } catch (error) {
    console.error('图像识别失败', error);
    if (error.response) {
      if (error.response.status === 401) {
        // 使用logout函数进行登出处理
        logout();
      } else if (error.response.data) {
        alert(`图像识别失败: ${response.data.msg || '服务器错误'}`);
      } else {
        alert('图像识别失败，请稍后重试');
      }
    } else {
      alert(error.message || '图像识别失败，请稍后重试');
    }
  } finally {
    isImageProcessing.value = false;
  }
};

// 文件上传相关方法
const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    processSelectedFile(file);
  }
};

const handleDrop = (event) => {
  event.preventDefault();
  isDragOver.value = false;
  
  const files = event.dataTransfer.files;
  if (files.length > 0) {
    processSelectedFile(files[0]);
  }
};

const handleDragOver = (event) => {
  event.preventDefault();
  isDragOver.value = true;
};

const handleDragLeave = (event) => {
  event.preventDefault();
  isDragOver.value = false;
};

const processSelectedFile = (file) => {
  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    alert('请选择图片文件');
    return;
  }
  
  // 检查文件大小（限制为10MB）
  if (file.size > 10 * 1024 * 1024) {
    alert('图片文件大小不能超过10MB');
    return;
  }
  
  uploadedFile.value = file;
  
  // 创建图片预览
  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreview.value = e.target.result;
  };
  reader.readAsDataURL(file);
};

const removeFile = () => {
  uploadedFile.value = null;
  imagePreview.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

// 文件输入引用
const fileInput = ref(null);

// 打开对应爻的下拉选择器
const toggleYaoSelect = (index) => {
  const selectRefs = {
    1: 'yao1Select',
    2: 'yao2Select',
    3: 'yao3Select',
    4: 'yao4Select',
    5: 'yao5Select',
    6: 'yao6Select'
  };
  
  if (selectRefs[index] && $refs[selectRefs[index]]) {
    $refs[selectRefs[index]].focus();
  }
};

// 在组件挂载时自动获取八字信息
onMounted(() => {
  // 调试输出：检查挂载前的状态
  console.log('=== 页面挂载前状态检查 ===');
  console.log('isLoading:', isLoading.value);
  console.log('isShaking:', isShaking.value);
  console.log('isImageProcessing:', isImageProcessing.value);
  console.log('buttonDisabled:', buttonDisabled.value);
  
  // 重置加载状态，确保按钮可用
  isLoading.value = false;
  isShaking.value = false;
  isImageProcessing.value = false;
  buttonDisabled.value = false;
  
  console.log('=== 状态重置后 ===');
  console.log('isLoading:', isLoading.value);
  console.log('isShaking:', isShaking.value);
  console.log('isImageProcessing:', isImageProcessing.value);
  console.log('buttonDisabled:', buttonDisabled.value);
  console.log('getButtonText:', getButtonText.value);
  
  // 设置首次加载标志
  pillarChanges.year = true;
  pillarChanges.month = true;
  pillarChanges.day = true;
  pillarChanges.hour = true;
  
  // 【关键修复】使用 setTimeout 异步调用，不阻塞页面初始化
  // 这样即使 API 调用失败或超时，也不会影响按钮的可用性
  setTimeout(() => {
    fetchBaziFromAPI().catch(err => {
      console.error('初始化获取八字信息失败:', err);
      // 确保即使出错也重置 isLoading
      isLoading.value = false;
    });
  }, 100);
  
  // 添加动画结束后的处理
  document.addEventListener('animationend', (event) => {
    // 如果是我们的柱子动画
    if (event.animationName === 'pillarAppear') {
      // 获取结束动画的元素
      const target = event.target;
      if (target.classList.contains('animate-pillar')) {
        // 动画结束后，移除动画类，保持元素可见
        target.classList.remove('animate-pillar');
      }
    }
  });
});

// 在组件卸载时清理所有计时器
onUnmounted(() => {
  console.log('组件卸载，清理所有计时器...');
  
  // 清理轮询定时器
  if (pollingTimeout) {
    clearTimeout(pollingTimeout);
    pollingTimeout = null;
  }
  
  // 清理加载计时器（如果存在）
  if (window.loadingTimers) {
    try {
      if (window.loadingTimers.mainTimer) clearInterval(window.loadingTimers.mainTimer);
      if (window.loadingTimers.insightTimer) clearInterval(window.loadingTimers.insightTimer);
    } catch (e) {
      console.error('清理加载计时器时出错:', e);
    }
  }
});

// 处理年份点击
const handleYearClick = (value) => {
  tempDate.year = value;
  scrollToCenter('yearColumnRef', yearOptions.value, value);
};

// 处理月份点击
const handleMonthClick = (value) => {
  tempDate.month = value;
  scrollToCenter('monthColumnRef', monthOptions.value, value);
};

// 处理日期点击
const handleDayClick = (value) => {
  tempDate.day = value;
  scrollToCenter('dayColumnRef', dayOptions.value, value);
};

// 处理小时点击
const handleHourClick = (value) => {
  tempDate.hour = value;
  scrollToCenter('hourColumnRef', hourOptions.value, value);
};

// 处理分钟点击
const handleMinuteClick = (value) => {
  tempDate.minute = value;
  scrollToCenter('minuteColumnRef', minuteOptions.value, value);
};

// 在script部分的setup函数顶部添加
const hexagramResult = ref(null);
const showResult = ref(false);
const analysisResult = ref(''); // 存储AI分析结果
const keyOutcome = ref(''); // 存储判辞数据
const showAnalysis = ref(false); // 控制分析结果的显示
const isLoadingPrediction = ref(false); // 控制预测加载状态
const predictionPrice = ref(null); // 存储预测支付金额
const predictionPaymentType = ref(null); // 存储预测支付类型

// 图像识别相关变量
const uploadedFile = ref(null);
const isDragOver = ref(false);
const imagePreview = ref(null);
const isImageProcessing = ref(false);
const imageRecognitionNumber = ref(null); // 存储图像识别返回的number数据
const recognizedPrice = ref(null); // 存储图像识别的价格
const loadingProgress = ref(0); // 加载进度（0-100）
const loadingPhase = ref(0); // 加载阶段（0-5）
const loadingMessages = [
  '正在解析基础理论模型...',
  '正在进行数据推演计算...',
  '正在分析符号关联信息...',
  '正在整合多维信息资源...',
  '正在生成预测结果矩阵...',
  '即将呈现专业化结论'
];
const interactiveYao = reactive({
  position: Math.floor(Math.random() * 6) + 1, // 随机选择一个爻位
  yang: Math.random() > 0.5, // 随机阴阳
  active: false,
  energy: 0 // 能量值，用户交互时增加
});

// 动态卦象解释数据
const hexagramInsights = ref([
  { icon: '☰', name: '乾为天', description: '大道如青天，刚健中正' },
  { icon: '☱', name: '兑为泽', description: '喜悦和顺，柔和中正' },
  { icon: '☲', name: '离为火', description: '光明丽泽，文明素丽' },
  { icon: '☳', name: '震为雷', description: '雷动万物，鼓舞发展' },
  { icon: '☴', name: '巽为风', description: '风行天下，顺势而为' },
  { icon: '☵', name: '坎为水', description: '水往低处，柔弱有为' },
  { icon: '☶', name: '艮为山', description: '高山巍巍，稳固安静' },
  { icon: '☷', name: '坤为地', description: '厚德载物，包容万象' }
]);

// 当前显示的卦象解释
const currentInsightIndex = ref(0);

// 定时切换卦象解释
const startInsightRotation = () => {
  const interval = setInterval(() => {
    currentInsightIndex.value = (currentInsightIndex.value + 1) % hexagramInsights.value.length;
  }, 5000);
  return interval;
};

// 模拟加载进度
const simulateLoading = () => {
  // 创建一个加载计时器，模拟40秒的加载时间
  const totalTime = 40000; // 40秒
  const interval = 200; // 每200毫秒更新一次
  const steps = totalTime / interval;
  const progressIncrement = 100 / steps;
  
  let currentStep = 0;
  
  // 启动卦象解释轮播
  const insightInterval = startInsightRotation();
  
  const timer = setInterval(() => {
    currentStep++;
    loadingProgress.value = Math.min(Math.floor(currentStep * progressIncrement), 99);
    
    // 更新加载阶段
    loadingPhase.value = Math.min(Math.floor(loadingProgress.value / 20), 5);
    
    // 随机改变互动爻的位置，但概率降低到2%，减少爻位频繁变化
    if (Math.random() < 0.02) {
      interactiveYao.position = Math.floor(Math.random() * 6) + 1;
      interactiveYao.yang = Math.random() > 0.5;
    }
    
    // 如果达到100%或收到响应，则清除计时器
    if (currentStep >= steps) {
      clearInterval(timer);
      clearInterval(insightInterval);
    }
  }, interval);
  
  // 返回计时器ID以便在API响应后清除
  return { mainTimer: timer, insightTimer: insightInterval };
};

// 处理用户与互动爻的交互
const interactWithYao = () => {
  // 如果能量已经满了，不再增加
  if (interactiveYao.energy >= 100) return;
  
  interactiveYao.active = true;
  
  // 记录当前能量值，确保只增加不减少
  const currentEnergy = interactiveYao.energy;
  // 优化能量增长，每次点击固定增加8点，保证增长稳定
  const newEnergy = currentEnergy + 1;
  
  // 使用Math.max确保能量不会减少，只会增加
  interactiveYao.energy = Math.min(Math.max(newEnergy, currentEnergy), 102);
  
  // 创建能量涟漪效果
  createEnergyRipple();
  
  // 一段时间后重置active状态
  setTimeout(() => {
    interactiveYao.active = false;
  }, 300);
};

// 创建能量涟漪效果
const createEnergyRipple = () => {
  const rippleContainer = document.querySelector('.loading-hexagram-container');
  if (!rippleContainer) return;
  
  const ripple = document.createElement('div');
  ripple.className = 'energy-ripple';
  
  // 根据互动爻的位置计算涟漪的位置
  const position = interactiveYao.position;
  const containerHeight = rippleContainer.offsetHeight;
  const yaoHeight = containerHeight / 6;
  const yaoY = containerHeight - position * yaoHeight + yaoHeight / 2;
  
  ripple.style.top = `${yaoY}px`;
  ripple.style.left = '50%';
  
  rippleContainer.appendChild(ripple);
  
  // 动画完成后移除涟漪元素
  setTimeout(() => {
    rippleContainer.removeChild(ripple);
  }, 1500);
};

// 开启预测方法
// 说明：该方法使用新版API接口，先获取taskId，然后轮询任务状态，直到得到最终结果
const startPrediction = async () => {
  console.log('开启预测按钮被点击');
  try {
    // 清除可能存在的上一次轮询任务
    if (pollingTimeout) {
      clearTimeout(pollingTimeout);
      pollingTimeout = null;
    }
    
    // 非图像识别起卦需要检查是否输入了问题描述
    if (selectedHexagramType.value !== 'imageRecognition' && !questionDescription.value) {
      alert('请详细描述您的问题');
      return;
    }
    
    // 图像识别起卦需要检查是否已经完成图像识别并获取到问题描述
    if (selectedHexagramType.value === 'imageRecognition' && !questionDescription.value) {
      alert('请先完成图像识别，获取问题描述后再进行预测');
      return;
    }
    
    // 显示加载界面
    isLoadingPrediction.value = true;
    loadingProgress.value = 0;
    loadingPhase.value = 0;
    interactiveYao.energy = 0;
    currentInsightIndex.value = 0;
    
    // 启动模拟加载进度
    const timers = simulateLoading();
    
    // 构建请求参数
    const requestData = {
      castType: selectedHexagramType.value === 'timeRandom' ? 'TIME' : 
                selectedHexagramType.value === 'random' ? 'RANDOM' : 
                selectedHexagramType.value === 'imageRecognition' ? 'IMAGE' : 'MANUAL',
      castTime: formatDate(divineTime.value, 'YYYY-MM-DD HH:mm:ss'),
      question: questionDescription.value,
      background: questionBackground.value || '无',
      customTime: (hexagramResult.value.baZi?.year ?  hexagramResult.value.baZi.year + "年" : "" ) 
      + (hexagramResult.value.baZi?.month ? hexagramResult.value.baZi.month + "月" : "" ) 
      + (hexagramResult.value.baZi?.day ? hexagramResult.value.baZi.day + "日" : "" ) 
      + (hexagramResult.value.baZi?.hour ? hexagramResult.value.baZi.hour + "时" : "" )
    };
    
    // 从 localStorage 读取用户设置的 API Key 信息
    const savedLlmServiceType = localStorage.getItem('llmServiceType');
    const savedModelId = localStorage.getItem('modelId');
    const savedApiKey = localStorage.getItem('apiKey');
    
    // 如果用户设置了 API Key 相关信息，则添加到请求中
    if (savedLlmServiceType) {
      requestData.llmServiceType = savedLlmServiceType; // 直接使用，不转换大小写（后端枚举值是小写）
    }
    if (savedModelId) {
      requestData.modelId = savedModelId;
    }
    if (savedApiKey) {
      requestData.apiKey = savedApiKey;
    }
    
    console.log('API Key配置:', {
      llmServiceType: requestData.llmServiceType,
      modelId: requestData.modelId,
      hasApiKey: !!requestData.apiKey
    });
    
    // 确保必要参数存在
    if (!requestData.question && requestData.castType !== 'IMAGE') {
      alert('请详细描述您的问题');
      return;
    }
    
    // 对于图像识别起卦，如果还没有问题描述，提示用户等待图像识别完成
    if (requestData.castType === 'IMAGE' && !requestData.question) {
      alert('请先完成图像识别，获取问题描述后再进行预测');
      return;
    }
    
    // 根据不同的卦象类型设置不同的请求参数
    if (requestData.castType === 'TIME') {
      // 使用与生成卦象时相同的时间戳
      requestData.timestamp = usedTimestamp.value || divineTime.value.getTime();
    } else if (selectedHexagramType.value === 'imageRecognition') {
      // 图像识别起卦，使用图像识别返回的number参数
      if (imageRecognitionNumber.value) {
        requestData.number = imageRecognitionNumber.value;
        console.log("使用图像识别的number:", imageRecognitionNumber.value);
      } else {
        console.warn("图像识别起卦但未找到number数据");
      }
    } else {
      requestData.number = convertYaoValuesToNumber();
    }
    
    console.log('发送预测请求:', requestData);
    
    // 发送请求到后端，获取任务ID
    console.log('正在发送预测请求到:', '/api/liuyao/cast');
    console.log('请求数据:', requestData);
    
    let response;
    try {
      response = await api.post('/api/liuyao/cast', requestData);
      console.log('API响应:', response);
    } catch (apiError) {
      console.error('API调用失败:', apiError);
      throw apiError; // 重新抛出错误，让外层catch处理
    }
    
    // 检查响应状态
    if (!response.data || response.data.code !== 200) {
      throw new Error(response.data?.msg || '创建预测任务失败');
    }
    
    if (!response.data.data || !response.data.data.taskId) {
      throw new Error('服务器返回数据格式错误，缺少任务ID');
    }
    
    const taskId = response.data.data.taskId;
    console.log('获取到任务ID:', taskId);
      
      // 开始轮询任务状态
      let pollingCount = 0;
      const maxPollingAttempts = 36; // 最多轮询3分钟 (36 * 5秒)
      
      const pollTaskStatus = async () => {
        try {
          pollingCount++;
          // 调用任务状态查询接口
          const taskResponse = await api.get(`/api/liuyao/task/${taskId}`, {
            params: {
              taskType: 'LIUYAO'
            }
          });
          
          // 检查任务是否完成
          if (taskResponse.data.code === 200 && taskResponse.data.data) {
            const taskData = taskResponse.data.data;
            
            // 随着轮询进行，逐步增加能量值
            // 如果用户没有交互，每次轮询增加5%能量，最高到85%
            if (interactiveYao.energy < 85) {
              interactiveYao.energy += 5;
            }
            
            // 如果任务完成或失败，停止轮询
            if (taskData.completed) {
                          // 更新加载进度，给用户提供视觉反馈
            loadingProgress.value = 100;
              // 清除轮询定时器
              clearTimeout(pollingTimeout);
              
              // 清除加载计时器
              clearInterval(timers.mainTimer);
              clearInterval(timers.insightTimer);
              
              // 等待1秒
              await new Promise(resolve => setTimeout(resolve, 500));
              // 关闭加载界面
              isLoadingPrediction.value = false;

              console.log('taskData:', taskData);
              console.log('taskData.data:', taskData.data);
              if (taskData.status === 'COMPLETED' && taskData.data) {
                // 解析JSON字符串获取分析结果
                try {
                  const resultData = taskData.data.text;
                  console.log('解析的任务结果:', resultData);
                  
                  // 存储判辞数据
                  keyOutcome.value = taskData.data.keyOutcome || '';
                  
                  // 存储支付信息 - 检查多个可能的位置
                  if (taskData.price !== undefined) {
                    predictionPrice.value = taskData.price;
                    predictionPaymentType.value = taskData.paymentType;
                  } else if (taskData.data.price !== undefined) {
                    predictionPrice.value = taskData.data.price;
                    predictionPaymentType.value = taskData.data.paymentType;
                  }
                  
                  // 确保能量值达到100%
                  interactiveYao.energy = 100;
                  
                  // 延迟1.5秒显示结果，让用户能清楚看到能量满格的状态
                  setTimeout(() => {
                    // 更新分析结果并显示
                    analysisResult.value =  resultData;
                    showAnalysis.value = true;
                    
                    // 滚动到分析结果区域，添加平滑滚动效果
                    nextTick(() => {
                      const analysisElement = document.getElementById('analysis-result');
                      if (analysisElement) {
                        // 先滚动到分析结果区域
                        analysisElement.scrollIntoView({ behavior: 'smooth' });
                        
                        // 然后添加卷轴展开动画类
                        setTimeout(() => {
                          const silkPaper = document.querySelector('.silk-paper');
                          if (silkPaper) {
                            silkPaper.classList.add('scroll-reveal');
                          }
                        }, 500);
                      }
                    });
                  }, 1000); // 延迟1秒，让用户能够看到能量达到100%
                } catch (parseError) {
                  console.error('解析任务结果失败:', parseError);
                  alert('解析预测结果失败，请稍后重试');
                }
              } else if (taskData.status === 'FAILED') {
                // 任务失败，显示能量耗尽的视觉提示
                interactiveYao.energy = 0;
                
                // 短暂延迟后再显示失败消息，让用户看到能量变化
                setTimeout(() => {
                  // 任务失败
                  console.error('预测任务失败:', taskData.error);
                  alert(`预测失败: ${taskData.error || '未知错误'}`);
                }, 800);
              }
            } else {
              // 任务仍在进行中，继续轮询
              // 更新加载提示信息，让用户知道正在进行中
              if (pollingCount % 2 === 0) {
                loadingPhase.value = (loadingPhase.value + 1) % loadingMessages.length;
              }
              
              // 如果轮询次数超过一定次数，提示用户任务可能延迟
              if (pollingCount === 12) { // 轮询一分钟后
                console.log('预测任务需要更多时间处理...');
                // 可以在UI上添加提示信息
              }
              
              // 如果未超过最大轮询次数，继续轮询
              if (pollingCount < maxPollingAttempts) {
                pollingTimeout = setTimeout(pollTaskStatus, 5000); // 5秒后再次查询
              } else {
                            // 超过最大轮询次数，提示用户
            try {
              if (timers && timers.mainTimer) clearInterval(timers.mainTimer);
              if (timers && timers.insightTimer) clearInterval(timers.insightTimer);
            } catch (e) {
              console.error('清理计时器时出错:', e);
            }
            isLoadingPrediction.value = false;
            alert('预测任务处理时间过长，请稍后在"历史记录"中查看结果');
              }
            }
          } else {
            throw new Error('任务状态查询失败');
          }
        } catch (pollError) {
          console.error('轮询任务状态失败:', pollError);
          
          // 检查是否是致命错误（如401认证失败）
          if (pollError.response && pollError.response.status === 401) {
            // 认证失败，停止轮询并登出
            try {
              if (timers && timers.mainTimer) clearInterval(timers.mainTimer);
              if (timers && timers.insightTimer) clearInterval(timers.insightTimer);
            } catch (e) {
              console.error('清理计时器时出错:', e);
            }
            isLoadingPrediction.value = false;
            logout();
            return;
          }
          
          // 如果网络错误等原因导致轮询失败，但未超过最大次数，继续尝试
          if (pollingCount < maxPollingAttempts) {
            pollingTimeout = setTimeout(pollTaskStatus, 5000);
          } else {
            // 超过最大轮询次数，停止轮询
            try {
              if (timers && timers.mainTimer) clearInterval(timers.mainTimer);
              if (timers && timers.insightTimer) clearInterval(timers.insightTimer);
            } catch (e) {
              console.error('清理计时器时出错:', e);
            }
            isLoadingPrediction.value = false;
            
            // 根据错误类型显示不同的提示
            if (pollError.response && pollError.response.status === 405) {
              alert('接口方法不允许，请检查请求方式或联系管理员');
            } else {
              alert('网络连接不稳定，无法获取预测结果，请稍后重试');
            }
          }
        }
      };
      
      // 立即开始第一次轮询
      pollTaskStatus();
    
  } catch (error) {
    console.error('预测失败，开始清理资源...', error);
    
    // 清除加载计时器 - 添加安全检查
    try {
      if (timers && timers.mainTimer) {
        clearInterval(timers.mainTimer);
        console.log('已清除主计时器');
      }
      if (timers && timers.insightTimer) {
        clearInterval(timers.insightTimer);
        console.log('已清除洞察计时器');
      }
    } catch (timerError) {
      console.error('清理计时器时出错:', timerError);
    }
    
    // 关闭加载界面
    isLoadingPrediction.value = false;
    console.log('已关闭加载界面');
    
    // 显示错误信息
    if (error.response) {
      if (error.response.status === 401) {
        // 使用logout函数进行登出处理
        logout();
      } else if (error.response.status === 405) {
        alert('接口方法不允许，请检查请求方式或联系管理员');
      } else if (error.response.data && error.response.data.msg) {
        alert(`预测失败: ${error.response.data.msg}`);
      } else if (error.response.status) {
        alert(`预测失败: HTTP ${error.response.status} - ${error.response.statusText || '服务器错误'}`);
      } else {
        alert('预测失败，请稍后重试');
      }
    } else if (error.message) {
      alert(`预测失败: ${error.message}`);
    } else {
      alert('网络连接错误，请检查网络后重试');
    }
  }
};

// Markdown 解析现在由 MarkdownRenderer 组件处理

// 起卦类型选择方法
const selectHexagramType = (typeValue) => {
  selectedHexagramType.value = typeValue;
  
  // 如果切换到非图像识别类型，清空图像识别的number数据
  if (typeValue !== 'imageRecognition') {
    imageRecognitionNumber.value = null;
  }
};

// 声明一个全局变量用于存储轮询定时器
let pollingTimeout = null;

// 时间格式化函数
const formatDateString = (date, format) => {
  // 实现时间格式化的逻辑
  // 这里使用JavaScript内置的Date对象方法来格式化日期
  return date.toLocaleString();
};
</script>

<template>
  <div class="hexagram-view">
    <NavBar />
    
    <div class="hexagram-container">
      <div class="hexagram-header">
        <h1 class="hexagram-title">六  爻</h1>
        <p class="hexagram-description">六爻是中国传统的占卜方法，通过阴阳变化，预测事物发展规律</p>
      </div>
      
      <div class="hexagram-form-container">
        <div class="form-group">
          <label class="form-label">详细描述问题：</label>
          <el-input
            v-model="questionDescription"
            type="textarea"
            :rows="1"
            :maxlength="25"
            show-word-limit
            placeholder="请详细描述六爻分析的具体问题..."
            class="form-input textarea-input"
          />
        </div>
        
        <div class="form-group">
          <label class="form-label">问题背景：</label>
          <el-input
            v-model="questionBackground"
            type="textarea"
            :rows="3"
            :maxlength="100"
            show-word-limit
            placeholder="请描述与问题相关的背景信息..."
            class="form-input textarea-input"
          />
        </div>
        
        <div class="form-group">
          <label class="form-label">请选择时间</label>
          
          <!-- 时间显示和选择按钮 -->
          <div class="time-display" @click="openTimePicker">
            <div class="time-value">{{ formattedDateTime || '点击选 择时间' }}</div>
            <div class="time-icon">⏱️</div>
          </div>
          
          <!-- 显示公历日期和八字 -->
          <div class="calendar-display" v-if="divineTime && chineseCalendar" style="margin-top: 5px; padding: 5px; background-color: transparent; box-shadow: none;">
            <div class="bazi-table animated-bazi">
              <div class="bazi-header">
                <div class="header-cell">年柱</div>
                <div class="header-cell">月柱</div>
                <div class="header-cell">日柱</div>
                <div class="header-cell">时柱</div>
              </div>
              <div class="bazi-row">
                <div class="bazi-cell pillar-container">
                  <div class="pillar-animation-wrapper"
                       data-pillar="year-gan">
                  <div class="gan-text">{{ chineseCalendar.year.charAt(0) }}</div>
                </div>
                </div>
                <div class="bazi-cell pillar-container">
                  <div class="pillar-animation-wrapper"
                       style="animation-delay: 0.1s"
                       data-pillar="month-gan">
                  <div class="gan-text-special">{{ chineseCalendar.month.charAt(0) }}</div>
                </div>
                </div>
                <div class="bazi-cell pillar-container">
                  <div class="pillar-animation-wrapper"
                       style="animation-delay: 0.2s"
                       data-pillar="day-gan">
                  <div class="gan-text-special">{{ chineseCalendar.day.charAt(0) }}</div>
                </div>
                </div>
                <div class="bazi-cell pillar-container">
                  <div class="pillar-animation-wrapper"
                       style="animation-delay: 0.3s"
                       data-pillar="hour-gan">
                  <div class="gan-text">{{ chineseCalendar.hour.charAt(0) }}</div>
                  </div>
                </div>
              </div>
              <div class="bazi-row">
                <div class="bazi-cell pillar-container">
                  <div class="pillar-animation-wrapper"
                       style="animation-delay: 0.15s"
                       data-pillar="year-zhi">
                  <div class="zhi-text">{{ chineseCalendar.year.charAt(1) }}</div>
                </div>
                </div>
                <div class="bazi-cell pillar-container">
                  <div class="pillar-animation-wrapper"
                       style="animation-delay: 0.25s"
                       data-pillar="month-zhi">
                  <div class="zhi-text-special">{{ chineseCalendar.month.charAt(1) }}</div>
                </div>
                </div>
                <div class="bazi-cell pillar-container">
                  <div class="pillar-animation-wrapper"
                       style="animation-delay: 0.35s"
                       data-pillar="day-zhi">
                  <div class="zhi-text-special">{{ chineseCalendar.day.charAt(1) }}</div>
                </div>
                </div>
                <div class="bazi-cell pillar-container">
                  <div class="pillar-animation-wrapper"
                       style="animation-delay: 0.45s"
                       data-pillar="hour-zhi">
                  <div class="zhi-text">{{ chineseCalendar.hour.charAt(1) }}</div>
                </div>
              </div>
                </div>
            </div>
          </div>
          
          <!-- 自定义时间选择器弹窗 -->
          <el-dialog
            v-model="timePickerVisible"
            title="选择占卜时间"
            :width="isMobile ? '95%' : '50%'"
            class="time-picker-dialog"
            :close-on-click-modal="false"
            center
            align-center
            :show-close="false"
          >
            <template #header="{ close }">
              <div class="custom-dialog-header">
                <span class="dialog-title">选择起卦时间</span>
                <button class="custom-close-btn" @click="close">×</button>
              </div>
            </template>
            
            <div class="time-picker-container">
              <div class="time-picker-header">
                <div class="header-item">年份</div>
                <div class="header-item">月份</div>
                <div class="header-item">日期</div>
                <div class="header-item">小时</div>
                <div class="header-item">分钟</div>
              </div>
              
              <div class="time-picker-columns">
                <!-- 年份选择 -->
                <div class="picker-column">
                  <div class="picker-selection-highlight"></div>
                  <el-scrollbar height="120px" ref="yearColumnRef" class="limited-scroll">
                    <div class="picker-options">
                      <div
                        v-for="year in yearOptions"
                        :key="year.value"
                        class="picker-option"
                        :class="{ 'selected': tempDate.year === year.value }"
                        @click="() => handleYearClick(year.value)"
                      >
                        {{ year.label }}
                      </div>
                    </div>
                  </el-scrollbar>
                </div>
                
                <!-- 月份选择 -->
                <div class="picker-column">
                  <div class="picker-selection-highlight"></div>
                  <el-scrollbar height="120px" ref="monthColumnRef" class="limited-scroll">
                    <div class="picker-options">
                      <div
                        v-for="month in monthOptions"
                        :key="month.value"
                        class="picker-option"
                        :class="{ 'selected': tempDate.month === month.value }"
                        @click="() => handleMonthClick(month.value)"
                      >
                        {{ month.label }}
                      </div>
                    </div>
                  </el-scrollbar>
                </div>
                
                <!-- 日期选择 -->
                <div class="picker-column">
                  <div class="picker-selection-highlight"></div>
                  <el-scrollbar height="120px" ref="dayColumnRef" class="limited-scroll">
                    <div class="picker-options">
                      <div
                        v-for="day in dayOptions"
                        :key="day.value"
                        class="picker-option"
                        :class="{ 'selected': tempDate.day === day.value }"
                        @click="() => handleDayClick(day.value)"
                      >
                        {{ day.label }}
                      </div>
                    </div>
                  </el-scrollbar>
                </div>
                
                <!-- 小时选择 -->
                <div class="picker-column">
                  <div class="picker-selection-highlight"></div>
                  <el-scrollbar height="120px" ref="hourColumnRef" class="limited-scroll">
                    <div class="picker-options">
                      <div
                        v-for="hour in hourOptions"
                        :key="hour.value"
                        class="picker-option"
                        :class="{ 'selected': tempDate.hour === hour.value }"
                        @click="() => handleHourClick(hour.value)"
                      >
                        {{ hour.label }}
                      </div>
                    </div>
                  </el-scrollbar>
                </div>
                
                <!-- 分钟选择 -->
                <div class="picker-column">
                  <div class="picker-selection-highlight"></div>
                  <el-scrollbar height="120px" ref="minuteColumnRef" class="limited-scroll">
                    <div class="picker-options">
                      <div
                        v-for="minute in minuteOptions"
                        :key="minute.value"
                        class="picker-option"
                        :class="{ 'selected': tempDate.minute === minute.value }"
                        @click="() => handleMinuteClick(minute.value)"
                      >
                        {{ minute.label }}
                      </div>
                    </div>
                  </el-scrollbar>
                </div>
              </div>
              
              <!-- 按钮区域 -->
              <div class="dialog-actions">
                <button class="action-btn cancel-btn" @click="timePickerVisible = false">取消</button>
                <button class="action-btn confirm-btn" @click="confirmTimeSelection">确认</button>
              </div>
            </div>
          </el-dialog>
        </div>
              <!-- 新的起卦类型选择器 -->
      <div class="hexagram-type-selector">
        <div class="type-options-container">
          <div 
            v-for="(type, index) in hexagramTypes" 
            :key="type.value"
            class="type-option" 
            :class="{ active: selectedHexagramType === type.value }"
            @click="selectHexagramType(type.value)"
            :style="{ animationDelay: `${index * 0.1}s` }"
          >
            <div class="type-icon">{{ type.icon }}</div>
            <div class="type-label">{{ type.label }}</div>
          </div>
        </div>
        </div>
        
        <!-- 卦象展示组件，只在选择了特定起卦类型时显示 -->
        <div class="form-group" v-if="showHexagramComponent">
          <label class="form-label">六爻选择</label>
          <div class="hexagram-selection">
            <div class="hexagram-display">
              <!-- 六爻，从上到下显示，六爻在上，初爻在下 -->
              <div class="yao-container">
                <!-- 上爻 -->
                <div class="yao-item" :class="{ 'active-shaking': currentShakingYao === 6 }">
                  <span class="yao-label">上爻</span>
                  <div class="yao-display-wrapper">
                    <div class="yao-display" :class="{ 'shaking': currentShakingYao === 6 }">
                      <transition name="yang-yao" mode="out-in">
                        <div v-if="yaoValues.yao6 === 'shaoyang' || yaoValues.yao6 === 'laoyang'" class="yang-yao" :key="'yang-' + yaoValues.yao6"></div>
                        <div v-else-if="yaoValues.yao6 === 'shaoyin' || yaoValues.yao6 === 'laoyin'" class="yin-yao" :key="'yin-' + yaoValues.yao6">
                          <transition name="yin-left">
                            <div class="yin-left"></div>
                          </transition>
                          <transition name="yin-right">
                            <div class="yin-right"></div>
                          </transition>
                        </div>
                      </transition>
                    </div>
                    <el-select 
                      v-model="yaoValues.yao6" 
                      ref="yao6Select" 
                      class="yao-select"
                      popper-class="yao-select-dropdown"
                      :disabled="isShaking"
                    >
                      <el-option
                        v-for="option in ganzhiOptions"
                        :key="option.value"
                        :label="option.label"
                        :value="option.value"
                      />
                    </el-select>
                  </div>
                  <transition name="fade">
                    <div v-if="yaoValues.yao6 === 'laoyang'" class="change-circle">O</div>
                    <div v-else-if="yaoValues.yao6 === 'laoyin'" class="change-x">X</div>
                  </transition>
                </div>
                
                <!-- 五爻 -->
                <div class="yao-item" :class="{ 'active-shaking': currentShakingYao === 5 }">
                  <span class="yao-label">五爻</span>
                  <div class="yao-display-wrapper">
                    <div class="yao-display" :class="{ 'shaking': currentShakingYao === 5 }">
                      <transition name="yang-yao" mode="out-in">
                        <div v-if="yaoValues.yao5 === 'shaoyang' || yaoValues.yao5 === 'laoyang'" class="yang-yao" :key="'yang-' + yaoValues.yao5"></div>
                        <div v-else-if="yaoValues.yao5 === 'shaoyin' || yaoValues.yao5 === 'laoyin'" class="yin-yao" :key="'yin-' + yaoValues.yao5">
                          <transition name="yin-left">
                            <div class="yin-left"></div>
                          </transition>
                          <transition name="yin-right">
                            <div class="yin-right"></div>
                          </transition>
                        </div>
                      </transition>
                    </div>
                    <el-select 
                      v-model="yaoValues.yao5" 
                      ref="yao5Select" 
                      class="yao-select"
                      popper-class="yao-select-dropdown"
                      :disabled="isShaking"
                    >
                      <el-option
                        v-for="option in ganzhiOptions"
                        :key="option.value"
                        :label="option.label"
                        :value="option.value"
                      />
                    </el-select>
                  </div>
                  <transition name="fade">
                    <div v-if="yaoValues.yao5 === 'laoyang'" class="change-circle">O</div>
                    <div v-else-if="yaoValues.yao5 === 'laoyin'" class="change-x">X</div>
                  </transition>
                </div>
                
                <!-- 四爻 -->
                <div class="yao-item" :class="{ 'active-shaking': currentShakingYao === 4 }">
                  <span class="yao-label">四爻</span>
                  <div class="yao-display-wrapper">
                    <div class="yao-display" :class="{ 'shaking': currentShakingYao === 4 }">
                      <transition name="yang-yao" mode="out-in">
                        <div v-if="yaoValues.yao4 === 'shaoyang' || yaoValues.yao4 === 'laoyang'" class="yang-yao" :key="'yang-' + yaoValues.yao4"></div>
                        <div v-else-if="yaoValues.yao4 === 'shaoyin' || yaoValues.yao4 === 'laoyin'" class="yin-yao" :key="'yin-' + yaoValues.yao4">
                          <transition name="yin-left">
                            <div class="yin-left"></div>
                          </transition>
                          <transition name="yin-right">
                            <div class="yin-right"></div>
                          </transition>
                        </div>
                      </transition>
                    </div>
                    <el-select 
                      v-model="yaoValues.yao4" 
                      ref="yao4Select" 
                      class="yao-select"
                      popper-class="yao-select-dropdown"
                      :disabled="isShaking"
                    >
                      <el-option
                        v-for="option in ganzhiOptions"
                        :key="option.value"
                        :label="option.label"
                        :value="option.value"
                      />
                    </el-select>
                  </div>
                  <transition name="fade">
                    <div v-if="yaoValues.yao4 === 'laoyang'" class="change-circle">O</div>
                    <div v-else-if="yaoValues.yao4 === 'laoyin'" class="change-x">X</div>
                  </transition>
                </div>
                
                <!-- 三爻 -->
                <div class="yao-item" :class="{ 'active-shaking': currentShakingYao === 3 }">
                  <span class="yao-label">三爻</span>
                  <div class="yao-display-wrapper">
                    <div class="yao-display" :class="{ 'shaking': currentShakingYao === 3 }">
                      <transition name="yang-yao" mode="out-in">
                        <div v-if="yaoValues.yao3 === 'shaoyang' || yaoValues.yao3 === 'laoyang'" class="yang-yao" :key="'yang-' + yaoValues.yao3"></div>
                        <div v-else-if="yaoValues.yao3 === 'shaoyin' || yaoValues.yao3 === 'laoyin'" class="yin-yao" :key="'yin-' + yaoValues.yao3">
                          <transition name="yin-left">
                            <div class="yin-left"></div>
                          </transition>
                          <transition name="yin-right">
                            <div class="yin-right"></div>
                          </transition>
                        </div>
                      </transition>
                    </div>
                    <el-select 
                      v-model="yaoValues.yao3" 
                      ref="yao3Select" 
                      class="yao-select"
                      popper-class="yao-select-dropdown"
                      :disabled="isShaking"
                    >
                      <el-option
                        v-for="option in ganzhiOptions"
                        :key="option.value"
                        :label="option.label"
                        :value="option.value"
                      />
                    </el-select>
                  </div>
                  <transition name="fade">
                    <div v-if="yaoValues.yao3 === 'laoyang'" class="change-circle">O</div>
                    <div v-else-if="yaoValues.yao3 === 'laoyin'" class="change-x">X</div>
                  </transition>
                </div>
                
                <!-- 二爻 -->
                <div class="yao-item" :class="{ 'active-shaking': currentShakingYao === 2 }">
                  <span class="yao-label">二爻</span>
                  <div class="yao-display-wrapper">
                    <div class="yao-display" :class="{ 'shaking': currentShakingYao === 2 }">
                      <transition name="yang-yao" mode="out-in">
                        <div v-if="yaoValues.yao2 === 'shaoyang' || yaoValues.yao2 === 'laoyang'" class="yang-yao" :key="'yang-' + yaoValues.yao2"></div>
                        <div v-else-if="yaoValues.yao2 === 'shaoyin' || yaoValues.yao2 === 'laoyin'" class="yin-yao" :key="'yin-' + yaoValues.yao2">
                          <transition name="yin-left">
                            <div class="yin-left"></div>
                          </transition>
                          <transition name="yin-right">
                            <div class="yin-right"></div>
                          </transition>
                        </div>
                      </transition>
                    </div>
                    <el-select 
                      v-model="yaoValues.yao2" 
                      ref="yao2Select" 
                      class="yao-select"
                      popper-class="yao-select-dropdown"
                      :disabled="isShaking"
                    >
                      <el-option
                        v-for="option in ganzhiOptions"
                        :key="option.value"
                        :label="option.label"
                        :value="option.value"
                      />
                    </el-select>
                  </div>
                  <transition name="fade">
                    <div v-if="yaoValues.yao2 === 'laoyang'" class="change-circle">O</div>
                    <div v-else-if="yaoValues.yao2 === 'laoyin'" class="change-x">X</div>
                  </transition>
                </div>
                
                <!-- 初爻 -->
                <div class="yao-item" :class="{ 'active-shaking': currentShakingYao === 1 }">
                  <span class="yao-label">初爻</span>
                  <div class="yao-display-wrapper">
                    <div class="yao-display" :class="{ 'shaking': currentShakingYao === 1 }">
                      <transition name="yang-yao" mode="out-in">
                        <div v-if="yaoValues.yao1 === 'shaoyang' || yaoValues.yao1 === 'laoyang'" class="yang-yao" :key="'yang-' + yaoValues.yao1"></div>
                        <div v-else-if="yaoValues.yao1 === 'shaoyin' || yaoValues.yao1 === 'laoyin'" class="yin-yao" :key="'yin-' + yaoValues.yao1">
                          <transition name="yin-left">
                            <div class="yin-left"></div>
                          </transition>
                          <transition name="yin-right">
                            <div class="yin-right"></div>
                          </transition>
                        </div>
                      </transition>
                    </div>
                    <el-select 
                      v-model="yaoValues.yao1" 
                      ref="yao1Select" 
                      class="yao-select"
                      popper-class="yao-select-dropdown"
                      :disabled="isShaking"
                    >
                      <el-option
                        v-for="option in ganzhiOptions"
                        :key="option.value"
                        :label="option.label"
                        :value="option.value"
                      />
                    </el-select>
                  </div>
                  <transition name="fade">
                    <div v-if="yaoValues.yao1 === 'laoyang'" class="change-circle">O</div>
                    <div v-else-if="yaoValues.yao1 === 'laoyin'" class="change-x">X</div>
                  </transition>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 图像识别组件，只在选择了图像识别起卦类型时显示 -->
        <div class="form-group" v-if="showImageRecognitionComponent">
          <label class="form-label">上传图片</label>
          <div class="image-upload-container">
            <!-- 文件上传区域 -->
            <div 
              class="upload-area"
              :class="{ 'drag-over': isDragOver, 'has-file': uploadedFile }"
              @drop="handleDrop"
              @dragover="handleDragOver"
              @dragleave="handleDragLeave"
              @click="fileInput?.click()"
            >
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                @change="handleFileSelect"
                style="display: none;"
              />
              
              <!-- 上传提示 -->
              <div v-if="!uploadedFile" class="upload-prompt">
                <div class="upload-icon">📁</div>
                <div class="upload-text">
                  <p>点击选择图片或拖拽图片到此处</p>
                  <p class="upload-hint">支持 JPG、PNG、GIF 格式，文件大小不超过 10MB</p>
                </div>
              </div>
              
              <!-- 图片预览 -->
              <div v-if="uploadedFile && imagePreview" class="image-preview-container">
                <img :src="imagePreview" alt="预览图片" class="image-preview" />
                <div class="image-info">
                  <p class="file-name">{{ uploadedFile.name }}</p>
                  <p class="file-size">{{ (uploadedFile.size / 1024 / 1024).toFixed(2) }} MB</p>
                </div>
                <button class="remove-file-btn" @click.stop="removeFile">×</button>
              </div>
            </div>
            
            <!-- 上传说明 -->
            <div class="upload-description">
              <p>请上传包含六爻卦象的图片，系统将自动识别并生成卦象结果</p>
            </div>
          </div>
        </div>
        
        <div class="form-actions">
          <el-button 
            type="primary" 
            class="submit-button" 
            @click="submitForm" 
            :loading="isLoading || isImageProcessing" 
            :class="{ 'shaking-button': isShaking }"
          >
            {{ getButtonText }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- 卦象结果展示区域 -->
    <transition name="result-appear">
      <div v-if="showResult && hexagramResult" id="hexagram-result" class="hexagram-result">
        <div class="result-title-wrapper">
          <h2 class="result-title">卦象结果</h2>
          <span v-if="recognizedPrice" class="recognized-price-badge">识别消费：{{ recognizedPrice }}点</span>
        </div>
        
        <div class="result-time" v-if="hexagramResult.localDateTime || hexagramResult.customTime">
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

        <div class="ganzhi-info" v-if="hexagramResult.questionDescription">
          <span>问题: {{ hexagramResult.questionDescription }}</span>
        </div>

        <div class="ganzhi-info" v-if="hexagramResult.questionBackground">
          <span>背景: {{ hexagramResult.questionBackground }}</span>
        </div>

        <div class="ganzhi-info" v-if="selectedHexagramType">
          <span>起卦类型: {{ hexagramTypes.find(type => type.value === selectedHexagramType)?.label || selectedHexagramType }}</span>
        </div>
        
        <div class="ganzhi-info" v-if="hexagramResult.baZi && (hexagramResult.baZi.year || hexagramResult.baZi.month || hexagramResult.baZi.day || hexagramResult.baZi.hour)">
          <span>干支: 
            <span v-if="hexagramResult.baZi.year" class="highlight-text">{{ hexagramResult.baZi.year }}年</span>
            <span v-if="hexagramResult.baZi.month" class="highlight-text" style="margin-left: 8px;">{{ hexagramResult.baZi.month }}月</span>
            <span v-if="hexagramResult.baZi.day" class="highlight-text" style="margin-left: 8px;">{{ hexagramResult.baZi.day }}日</span>
            <span v-if="hexagramResult.baZi.hour" class="highlight-text" style="margin-left: 8px;">{{ hexagramResult.baZi.hour }}时</span>
            <span v-if="hexagramResult.baZi.dayToNull" style="margin-left: 8px;">(<span class="highlight-text">{{ hexagramResult.baZi.dayToNull }}</span> {{ chineseCalendar?.nayin }}旬)</span>
          </span>
        </div>
        
        <div class="shensha-info" v-if="hexagramResult.shenSha && hexagramResult.shenSha.length > 0">
          <span>神煞: 
            <span v-for="(sha, index) in hexagramResult.shenSha" :key="index" class="shensha-item">
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
                          <span v-if="yao.shiOrYing" class="result-shi-ying">
                            {{ yao.shiOrYing }}
                          </span>
                          <!-- 变爻标记 -->
                          <span v-if="yao.isChange" class="result-yao-mark">
                            {{ yao.value === 1 ? 'O' : 'X' }}
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
          <div class="prediction-button-container">
            <button class="prediction-button" @click="startPrediction">开启预测</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 预测加载界面 -->
    <transition name="fade">
      <div v-if="isLoadingPrediction" class="prediction-loading-overlay">
        <div class="prediction-loading-container">
          <div class="loading-header">
            <h3 class="loading-title">{{ loadingMessages[loadingPhase] }}</h3>
            <div class="loading-progress-container">
              <div class="loading-progress-bar" :style="{ width: loadingProgress + '%' }"></div>
            </div>
            <div class="loading-percentage">{{ loadingProgress }}%</div>
          </div>
          
          <div class="loading-hexagram-container">
            <!-- 加载中的动态六爻 -->
            <div class="loading-hexagram">
              <div 
                v-for="position in 6" 
                :key="'loading-yao-' + position"
                class="loading-yao-item"
                :class="{ 
                  'loading-active': interactiveYao.position === position && interactiveYao.active,
                  'loading-highlight': interactiveYao.position === position && interactiveYao.energy > 0
                }"
                @click="interactWithYao"
              >
                <div class="loading-yao-label">{{ ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'][position-1] }}</div>
                
                <!-- 阳爻 -->
                <div 
                  v-if="(position === interactiveYao.position) ? interactiveYao.yang : (position % 2 === 0)" 
                  class="loading-yang-yao"
                  :style="{ 
                    boxShadow: (position === interactiveYao.position && interactiveYao.energy > 0) ? 
                      `0 0 ${interactiveYao.energy / 5}px ${interactiveYao.energy / 10 + 2}px var(--primary-color)` : '' 
                  }"
                ></div>
                
                <!-- 阴爻 -->
                <div 
                  v-else 
                  class="loading-yin-yao"
                  :style="{ 
                    boxShadow: (position === interactiveYao.position && interactiveYao.energy > 0) ? 
                      `0 0 ${interactiveYao.energy / 5}px ${interactiveYao.energy / 10 + 2}px var(--primary-color)` : '' 
                  }"
                >
                  <div class="loading-yin-left"></div>
                  <div class="loading-yin-right"></div>
                </div>
                
                <!-- 能量指示器 -->
                <div 
                  v-if="position === interactiveYao.position && interactiveYao.energy > 0" 
                  class="yao-energy-indicator">
                  <div class="yao-energy-level" :style="{ width: interactiveYao.energy + '%' }"></div>
                </div>
                
              </div>
            </div>
            
            <!-- 加载过程中的提示和解释 -->
            <div class="loading-insights">
              <div class="loading-insight-item" :style="{ opacity: loadingPhase >= 0 ? 1 : 0.3 }">
                <div class="insight-icon">🔮</div>
                <div class="insight-text">卦象演化中,点击爻线可注入能量 ʕ⸝⸝⸝˙Ⱉ˙ʔ</div>
              </div>
              
              <div class="loading-insight-item" :style="{ opacity: loadingPhase >= 1 ? 1 : 0.3 }">
                <div class="insight-icon">⚡</div>
                <div class="insight-text">正在推演因果关系,命理规律生成中 ฅ^•ﻌ•^ฅ</div>
              </div>
              
              <div class="loading-insight-item" :style="{ opacity: loadingPhase >= 2 ? 1 : 0.3 }">
                <div class="insight-icon">✨</div>
                <div class="insight-text">最终结果由AI生成,仅提供学习参考</div>
              </div>
              
              <!-- 卦象解释区域 -->
              <div class="hexagram-explanation">
                <div class="explanation-title">卦象解释</div>
                <div class="explanation-container" :class="'explanation-bg-' + (currentInsightIndex + 1)">
                  <div class="explanation-overlay"></div>
                  <div class="explanation-content" :key="currentInsightIndex">
                    <div class="explanation-icon">{{ hexagramInsights[currentInsightIndex].icon }}</div>
                    <div class="explanation-details">
                      <div class="explanation-name">{{ hexagramInsights[currentInsightIndex].name }}</div>
                      <div class="explanation-desc">{{ hexagramInsights[currentInsightIndex].description }}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 意象图展示 -->
              <div class="imagery-preview">
                <div class="imagery-title">卦象意境图</div>
                <div class="imagery-container" :class="'imagery-' + (currentInsightIndex + 1)">
                  <div class="imagery-overlay"></div>
                </div>
              </div>
            </div>
            
            <!-- 悬浮的五行元素 -->
            <div class="floating-elements">
              <div class="element-symbol element-metal">金</div>
              <div class="element-symbol element-wood">木</div>
              <div class="element-symbol element-water">水</div>
              <div class="element-symbol element-fire">火</div>
              <div class="element-symbol element-earth">土</div>
            </div>
            
            <!-- 动态的周易符号 -->
            <div class="trigram-symbols">
              <div class="trigram trigram-1">☰</div>
              <div class="trigram trigram-2">☱</div>
              <div class="trigram trigram-3">☲</div>
              <div class="trigram trigram-4">☳</div>
              <div class="trigram trigram-5">☴</div>
              <div class="trigram trigram-6">☵</div>
              <div class="trigram trigram-7">☶</div>
              <div class="trigram trigram-8">☷</div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 分析结果展示区域（灵签卷轴风格） -->
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
              <div class="gua-header">

                <div class="gua-lines">
                  <div v-for="(yao, index) in 6" :key="index" class="gua-line">
                    <div class="gua-line-mark" :class="{ 
                      'gua-line-yang': hexagramResult?.originalBaGua?.yaos?.[5-index].value === 1,
                      'gua-line-yin': hexagramResult?.originalBaGua?.yaos?.[5-index].value === 0 
                    }"></div>
                  </div>
                </div>

                <h3 class="gua-title">{{ hexagramResult?.originalBaGua?.name }}{{ hexagramResult.changedBaGua?.name ? ' · ' + hexagramResult.changedBaGua.name : '' }}</h3>

                <div class="gua-lines">
                  <div v-for="(yao, index) in 6" :key="index" class="gua-line">
                    <div class="gua-line-mark" :class="{ 
                      'gua-line-yang': hexagramResult?.changedBaGua?.yaos?.[5-index].value === 1 ,
                      'gua-line-yin': hexagramResult?.changedBaGua?.yaos?.[5-index].value === 0
                    }"></div>
                  </div>
                </div>
              </div>
              
              <!-- 卦辞区域 -->
              <div class="gua-oracle">
                <div class="oracle-content">{{ keyOutcome || hexagramResult?.originalBaGua?.guaCi }}</div>
              </div>
              
              <!-- 解析文本 -->
              <MarkdownRenderer 
                :content="analysisResult"
                class="analysis-text silk-content"
              />
              
              <!-- 支付信息 -->
              <div v-show="predictionPaymentType !== null && predictionPaymentType !== undefined" 
                   class="payment-info">
                <span v-if="predictionPaymentType === 0">
                  免费额度消耗：{{ predictionPrice || 0 }}次
                </span>
                <span v-else-if="predictionPaymentType === 1">
                  本次分析消耗：{{ predictionPrice || 0 }}元
                </span>
                <span v-else-if="predictionPaymentType === 2">
                  自定义API消耗：{{ predictionPrice || 0 }}元
                </span>
                <span v-else>
                  消费信息：{{ predictionPrice || 0 }}元（类型：{{ predictionPaymentType }}）
                </span>
              </div>
              
              <!-- 落款与印章 -->
              <div class="signature-area">
                <div class="signature-text">最终结果由AI生成,仅供学习和参考，请勿商用！</div>
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
</template>

<style scoped>
.hexagram-view {
  min-height: 100vh;
  min-height: 100svh;
  min-height: 100dvh;
  background-color: var(--dark-bg);
  color: var(--text-light);
}

.hexagram-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}

.hexagram-header {
  text-align: center;
  margin-bottom: 40px;
}

.hexagram-title {
  font-size: 2.5rem;
  color: var(--primary-color);
  margin-bottom: 10px;
}

.hexagram-description {
  font-size: 1rem;
  color: #aaa;
  max-width: 600px;
  margin: 0 auto;
}

.hexagram-form-container {
  background-color: #2a2a2a;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  color: var(--primary-color);
  font-size: 1rem;
}

/* 时间显示样式 */
.time-display {
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 15px;
  cursor: pointer;
  transition: border-color 0.3s ease, background-color 0.3s ease;
  position: relative;
}

.time-display:hover {
  border-color: var(--primary-color);
  background-color: #3a3a3a;
}

.time-value {
  color: #fff;
  font-weight: bold;
  text-align: center;
  font-size: 18px;
  letter-spacing: 1px;
}

.time-icon {
  font-size: 18px;
  color: var(--primary-color);
  position: absolute;
  right: 15px;
}

/* 时间选择器样式 */
.time-picker-container {
  position: relative;
  padding: 0;
  max-width: 100%;
  margin: 0 auto;
  background-color: #222;
  border-radius: 8px;
  overflow: hidden;
}

.time-picker-header {
  display: flex;
  justify-content: space-between;
  background-color: #333;
  padding: 8px 0;
  border-bottom: 1px solid #444;
}

.header-item {
  flex: 1;
  text-align: center;
  font-size: 15px;
  color: var(--primary-color);
  font-weight: bold;
}

.time-picker-columns {
  display: flex;
  justify-content: space-between;
  padding: 0;
  background-color: #222;
  position: relative;
  gap: 0;
}

.picker-column {
  flex: 1;
  text-align: center;
  padding: 0;
  border-right: 1px solid #333;
  position: relative;
}

.picker-column:last-child {
  border-right: none;
}

.picker-options {
  padding: 0; /* 移除内边距 */
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 120px; /* 确保最小高度 */
}

.picker-option {
  height: 36px;
  line-height: 36px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #aaa;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.picker-option:hover {
  color: #fff;
}

.picker-option.selected {
  color: var(--primary-color);
  font-size: 18px;
  font-weight: bold;
}

/* 修改滚动条样式和行为 */
:deep(.limited-scroll .el-scrollbar__wrap) {
  overflow-y: auto;
  max-height: 120px;
  scrollbar-width: thin;
  scrollbar-color: #444 #333;
}

/* 调整滚动视图的属性 */
:deep(.limited-scroll .el-scrollbar__view) {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  min-height: 120px;
  padding: 42px 0; /* 添加内边距来保持选项居中 */
}

/* 确保滚动不会出现大量空白 */
:deep(.limited-scroll) {
  --el-scrollbar-opacity: 0.3;
  --el-scrollbar-hover-opacity: 0.5;
  --el-scrollbar-width: 6px;
  --el-scrollbar-height: 6px;
  --el-scrollbar-thumb-background: #555;
}

/* 滚动条滑块样式 */
:deep(.limited-scroll .el-scrollbar__bar.is-vertical) {
  opacity: var(--el-scrollbar-opacity);
  transition: opacity 0.3s ease;
}

:deep(.limited-scroll .el-scrollbar__bar.is-vertical:hover) {
  opacity: var(--el-scrollbar-hover-opacity);
}

:deep(.limited-scroll .el-scrollbar__thumb) {
  background-color: var(--el-scrollbar-thumb-background);
  border-radius: 3px;
}

/* 禁止选项超出视图区域 */
:deep(.limited-scroll .el-scrollbar__wrap) {
  overflow-x: hidden;
  margin-bottom: 0 !important; /* 修复滚动条问题 */
}

/* 选择器高亮效果 */
.picker-option.selected {
  color: var(--primary-color);
  font-size: 18px;
  font-weight: bold;
}

/* 确保所有选项列都对齐 */
.picker-column {
  display: flex;
  flex-direction: column;
}

/* 时间选择器蒙层，创建选中项居中的视觉效果 */
.picker-column::before,
.picker-column::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 42px;
  pointer-events: none;
  z-index: 2;
}

.picker-column::before {
  top: 0;
  background: linear-gradient(to bottom, rgba(34, 34, 34, 0.9) 0%, rgba(34, 34, 34, 0.5) 100%);
}

.picker-column::after {
  bottom: 0;
  background: linear-gradient(to top, rgba(34, 34, 34, 0.9) 0%, rgba(34, 34, 34, 0.5) 100%);
}

/* 中央选中区域高亮 */
.picker-selection-highlight {
  position: absolute;
  left: 0;
  right: 0;
  top: 42px;
  height: 36px;
  background-color: rgba(230, 200, 76, 0.05);
  pointer-events: none;
  z-index: 1;
}

/* 确保滚动条视图正确对齐 */
:deep(.el-scrollbar__view) {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}

/* 调整滚动条样式 */
:deep(.el-scrollbar__bar) {
  opacity: 0.2 !important;
}

:deep(.el-scrollbar__bar:hover) {
  opacity: 0.5 !important;
}

/* 确保所有选项在同一水平线上 */
:deep(.el-scrollbar__wrap) {
  overflow-x: hidden;
}

/* 调整滚动区域的高度，使选中项居中 */
:deep(.el-scrollbar) {
  overflow: hidden;
}

/* 确保选中项在中间位置 */
.el-scrollbar {
  position: relative;
}

/* 手机端响应式优化 - 只在小屏幕时生效 */
@media (max-width: 768px) {
  .time-picker-container {
    padding: 10px !important;
  }
  
  .time-picker-header {
    padding: 12px 0 !important;
  }
  
  .header-item {
    font-size: 14px !important;
    padding: 0 5px !important;
  }
  
  .time-picker-columns {
    gap: 5px !important;
  }
  
  .picker-column {
    min-width: 0 !important;
    flex: 1 !important;
  }
  
  .picker-option {
    height: 32px !important;
    line-height: 32px !important;
    font-size: 14px !important;
  }
  
  .picker-options {
    min-height: 100px !important;
  }
  
  /* 手机端选择器高亮位置调整 */
  .picker-selection-highlight {
    top: 34px !important;
    height: 32px !important;
  }
  
  .picker-column::before,
  .picker-column::after {
    height: 34px !important;
  }
  
  /* 手机端滚动区域调整 */
  :deep(.limited-scroll .el-scrollbar__view) {
    padding: 34px 0 !important;
    min-height: 100px !important;
  }
  
  :deep(.limited-scroll .el-scrollbar__wrap) {
    max-height: 100px !important;
  }
  
  .dialog-actions {
    padding: 15px 0 !important;
    gap: 15px !important;
  }
  
  .action-btn {
    padding: 10px 25px !important;
    font-size: 14px !important;
  }
}

@media (max-width: 480px) {
  .time-picker-container {
    padding: 5px !important;
  }
  
  .header-item {
    font-size: 13px !important;
    padding: 0 2px !important;
  }
  
  .picker-option {
    height: 28px !important;
    line-height: 28px !important;
    font-size: 13px !important;
  }
  
  .picker-options {
    min-height: 90px !important;
  }
  
  /* 小手机端选择器高亮位置调整 */
  .picker-selection-highlight {
    top: 31px !important;
    height: 28px !important;
  }
  
  .picker-column::before,
  .picker-column::after {
    height: 31px !important;
  }
  
  /* 小手机端滚动区域调整 */
  :deep(.limited-scroll .el-scrollbar__view) {
    padding: 31px 0 !important;
    min-height: 90px !important;
  }
  
  :deep(.limited-scroll .el-scrollbar__wrap) {
    max-height: 90px !important;
  }
}

.current-bazi {
  margin: 8px 0;
  text-align: center;
  background-color: #333;
  padding: 8px 0;
}

.bazi-preview {
  display: inline-block;
  padding: 6px 10px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.bazi-preview p {
  margin-bottom: 6px;
  color: #aaa;
  font-size: 13px;
}

.bazi-tags {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.bazi-tag {
  display: inline-block;
  padding: 4px 8px;
  background-color: rgba(230, 200, 76, 0.2);
  color: var(--primary-color);
  border-radius: 4px;
  font-weight: bold;
  font-size: 13px;
}

.dialog-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 12px 0;
  background-color: #333;
  border-top: 1px solid #444;
}

.action-btn {
  padding: 8px 30px;
  border-radius: 4px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.cancel-btn {
  background-color: #444;
  color: #ddd;
}

.cancel-btn:hover {
  background-color: #555;
}

.confirm-btn {
  background-color: var(--primary-color);
  color: #222;
}

.confirm-btn:hover {
  opacity: 0.9;
}

.calendar-display {
  margin-top: 15px;
  padding: 10px;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.gregorian-date, .chinese-calendar {
  margin-bottom: 10px;
}

.date-label {
  color: #aaa;
  margin-right: 10px;
}

.date-value {
  color: #fff;
  font-weight: bold;
}

.ganzhi-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
}

.ganzhi-tag {
  font-size: 14px;
}

.form-input {
  width: 100%;
  transition: border-color 0.3s ease;
}

.form-actions {
  margin-top: 30px;
  text-align: center;
}

.submit-button {
  padding: 12px 40px;
  font-size: 16px;
  font-weight: bold;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(230, 200, 76, 0.3);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.shaking-button {
  background-color: #e6c84c !important;
  animation: buttonPulse 1s infinite alternate;
}

@keyframes buttonPulse {
  0% {
    opacity: 0.9;
    transform: scale(1);
  }
  100% {
    opacity: 1;
    transform: scale(1.05);
    box-shadow: 0 0 15px rgba(230, 200, 76, 0.5);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideIn {
  from {
    transform: translateX(-10px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(5px);
}

.yang-yao-enter-active,
.yang-yao-leave-active,
.yin-yao-enter-active,
.yin-yao-leave-active {
  transition: all 0.3s ease-in-out;
}

.yang-yao-enter-from,
.yang-yao-leave-to {
  transform: scaleX(0.5);
  opacity: 0;
}

.yin-yao-enter-from,
.yin-yao-leave-to {
  opacity: 0;
}

.yin-left-enter-active,
.yin-left-leave-active {
  transition: all 0.3s ease-in-out;
}

.yin-left-enter-from,
.yin-left-leave-to {
  transform: translateX(-20px);
  opacity: 0;
}

.yin-right-enter-active,
.yin-right-leave-active {
  transition: all 0.3s ease-in-out;
}

.yin-right-enter-from,
.yin-right-leave-to {
  transform: translateX(20px);
  opacity: 0;
}

/* 隐藏select组件 */
.yao-select {
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 10;
}

.hexagram-selection {
  background-color: #222;
  border-radius: 4px;
  padding: 20px;
}

/* 自定义下拉框样式 */
:deep(.el-popper) {
  --el-dropdown-menuItem-hover-fill: #333 !important;
  --el-dropdown-menuItem-hover-color: #ddd !important;
  background-color: #222 !important;
  border-color: #444 !important;
}

:deep(.el-select__popper),
:deep(.el-select-dropdown),
:deep(.el-select-dropdown *) {
  background-color: #222 !important;
}

:deep(.el-scrollbar),
:deep(.el-scrollbar__view),
:deep(.el-select-dropdown__wrap) {
  background-color: #222 !important;
}

/* 设置下拉框样式 */
.yao-display-wrapper:hover .yao-display {
  background-color: rgba(51, 51, 51, 0.9);
  box-shadow: 0 0 10px rgba(230, 200, 76, 0.2);
}

:root {
  --dark-bg: #1e1e1e;
  --primary-color: #e6c84c;
  --text-light: #ffffff;
}

/* 爻象显示 */
.yao-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  padding: 10px 0;
}

.yao-item {
  display: flex;
  align-items: center;
  position: relative;
  padding: 8px 0;
  transition: all 0.3s ease;
}

.yao-item.active-shaking {
  background-color: rgba(230, 200, 76, 0.15);
  border-radius: 8px;
  box-shadow: 0 0 15px rgba(230, 200, 76, 0.2);
  padding: 12px;
  transform: scale(1.02);
}

.yao-label {
  width: 35%;
  text-align: right;
  font-weight: bold;
  color: var(--primary-color);
  margin-right: 15px;
  transition: all 0.3s ease;
}

.active-shaking .yao-label {
  color: var(--primary-color);
  font-size: 1.05em;
  text-shadow: 0 0 8px rgba(230, 200, 76, 0.5);
}

.yao-display-wrapper {
  position: relative;
  width: 180px;
  height: 30px;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.yao-display {
  width: 100%;
  height: 100%;
  position: relative;
  background-color: rgba(51, 51, 51, 0.7);
  border-radius: 4px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.yao-display.shaking {
  background-color: rgba(230, 200, 76, 0.15);
  box-shadow: 0 0 15px rgba(230, 200, 76, 0.3);
}

.yang-yao {
  width: 100%;
  height: 8px;
  background-color: var(--primary-color);
  border-radius: 4px;
  transition: all 0.2s ease;
}

.shaking .yang-yao {
  animation: pulse 0.5s infinite alternate;
}

.yin-yao {
  width: 100%;
  height: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s ease;
}

.shaking .yin-yao {
  animation: pulse 0.5s infinite alternate;
}

.yin-left, .yin-right {
  width: 45%;
  height: 8px;
  background-color: var(--primary-color);
  border-radius: 4px;
  transition: all 0.2s ease;
}

.shaking .yin-left {
  animation: pulseLeft 0.5s infinite alternate;
}

.shaking .yin-right {
  animation: pulseRight 0.5s infinite alternate;
}

.change-circle, .change-x {
  margin-left: 15px;
  font-size: 18px;
  color: var(--primary-color);
  font-weight: bold;
  transition: all 0.3s ease;
}

.active-shaking .change-circle,
.active-shaking .change-x {
  text-shadow: 0 0 8px rgba(230, 200, 76, 0.5);
  animation: pulse 0.5s infinite alternate;
}

/* 新增摇卦动画效果 */
@keyframes pulse {
  0% {
    opacity: 0.8;
    transform: scale(1);
  }
  100% {
    opacity: 1;
    transform: scale(1.1);
    filter: brightness(1.2);
  }
}

@keyframes pulseLeft {
  0% {
    opacity: 0.8;
    transform: translateX(-2px) scale(1);
  }
  100% {
    opacity: 1;
    transform: translateX(0) scale(1.1);
    filter: brightness(1.2);
  }
}

@keyframes pulseRight {
  0% {
    opacity: 0.8;
    transform: translateX(2px) scale(1);
  }
  100% {
    opacity: 1;
    transform: translateX(0) scale(1.1);
    filter: brightness(1.2);
  }
}

/* 增强爻变化动画 */
.yang-yao-enter-active,
.yang-yao-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.yang-yao-enter-from,
.yang-yao-leave-to {
  transform: scaleX(0.5);
  opacity: 0;
}

.yin-yao-enter-active,
.yin-yao-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.yin-yao-enter-from,
.yin-yao-leave-to {
  opacity: 0;
}

.yin-left-enter-active,
.yin-left-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.yin-left-enter-from,
.yin-left-leave-to {
  transform: translateX(-20px);
  opacity: 0;
}

.yin-right-enter-active,
.yin-right-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.yin-right-enter-from,
.yin-right-leave-to {
  transform: translateX(20px);
  opacity: 0;
}

/* 自定义对话框样式 */
.custom-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: #333;
  border-bottom: 1px solid #444;
}

.dialog-title {
  font-size: 20px;
  font-weight: bold;
  color: var(--primary-color);
}

.custom-close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #aaa;
  cursor: pointer;
  transition: color 0.3s ease;
}

.custom-close-btn:hover {
  color: var(--primary-color);
}

:deep(.el-dialog) {
  background-color: #222 !important;
  border-radius: 8px !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5) !important;
  border: 1px solid #444 !important;
  margin: 0 auto !important; /* 确保对话框居中 */
  position: absolute !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  max-height: 80vh !important; /* 最大高度 */
  display: flex !important;
  flex-direction: column !important;
}

/* 手机端对话框优化 - 只在小屏幕时生效 */
@media (max-width: 768px) {
  :deep(.el-dialog) {
    width: 95% !important;
    max-height: 90vh !important;
    margin: 10px auto !important;
  }
  
  :deep(.el-dialog__body) {
    max-height: calc(90vh - 120px) !important;
  }
}

@media (max-width: 480px) {
  :deep(.el-dialog) {
    width: 98% !important;
    max-height: 95vh !important;
    margin: 5px auto !important;
  }
}

:deep(.el-dialog__header) {
  padding: 0 !important;
  margin: 0 !important;
}

:deep(.el-dialog__body) {
  padding: 0 !important;
  color: #ddd !important;
  overflow: auto !important; /* 允许内容滚动 */
  max-height: calc(80vh - 120px) !important; /* 调整最大高度，减去头部和底部的高度 */
}

:deep(.el-dialog__headerbtn) {
  display: none !important;
}

:deep(.time-picker-dialog .el-scrollbar__wrap) {
  margin-bottom: 0 !important; /* 修复滚动条问题 */
}

:deep(.el-scrollbar__view) {
  padding-top: 42px !important; 
  padding-bottom: 42px !important;
}

.yao-label-text {
  margin-left: 15px;
  font-size: 14px;
  color: #aaa;
}

/* 八字表格样式 */
.bazi-table {
  width: 50%;
  margin: 10px auto;
  border: none;
  border-radius: 4px;
  overflow: hidden;
  background-color: transparent;
  position: relative;
}

/* 八字表格动画容器 */
.animated-bazi {
  perspective: 1000px;
  transform-style: preserve-3d;
}

.bazi-header {
  display: flex;
  background-color: transparent;
  animation: fadeInDown 0.5s ease-out forwards;
}

.header-cell {
  flex: 1;
  text-align: center;
  font-weight: bold;
  border: none;
  color: var(--text-light);
  padding: 4px 0;
}

.header-cell:last-child {
  border: none;
}

.bazi-row {
  display: flex;
  border: none;
  margin-top: 0;
}

.bazi-cell {
  flex: 1;
  padding: 4px 0;
  text-align: center;
  border: none;
  overflow: hidden;
}

/* 柱子动画容器 */
.pillar-container {
  perspective: 800px;
  height: 30px;
  position: relative;
}

.pillar-animation-wrapper {
  position: relative;
  animation: pillarAppear 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.gan-text, .zhi-text {
  font-size: 16px;
  font-weight: bold;
  color: #fff;
  display: inline-block;
  position: relative;
  text-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
}

.gan-text-special, .zhi-text-special {
  font-size: 16px;
  font-weight: bold;
  color: var(--primary-color);
  display: inline-block;
  position: relative;
  text-shadow: 0 0 10px rgba(230, 200, 76, 0.5), 0 0 20px rgba(230, 200, 76, 0.3);
}

/* 新增动画关键帧 */
@keyframes pillarAppear {
  0% {
    transform: translateY(50px) scale(0.5) rotateX(20deg);
    opacity: 0;
  }
  70% {
    transform: translateY(-5px) scale(1.05) rotateX(-5deg);
    opacity: 1;
  }
  100% {
    transform: translateY(0) scale(1) rotateX(0);
    opacity: 1;
  }
}

@keyframes glowPulse {
  0% {
    text-shadow: 0 0 5px rgba(255, 255, 255, 0.3);
  }
  100% {
    text-shadow: 0 0 15px rgba(255, 255, 255, 0.7);
  }
}

@keyframes specialGlowPulse {
  0% {
    text-shadow: 0 0 5px rgba(230, 200, 76, 0.3);
  }
  100% {
    text-shadow: 0 0 15px rgba(230, 200, 76, 0.7), 0 0 30px rgba(230, 200, 76, 0.4);
  }
}

@keyframes fadeInDown {
  0% {
    transform: translateY(-20px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 在八字加载时添加整体容器动画 */
.calendar-display {
  animation: calendarAppear 0.5s ease-out forwards;
}

@keyframes calendarAppear {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.result-table {
  width: auto;
  border-collapse: collapse;
  border: none;
  margin: 0 auto;
  table-layout: fixed; /* 固定表格布局 */
}

.result-table tr {
  height: 36px;
}

.td-liushen, .td-liuqin-ganzhi, .td-yao {
  padding: 8px 4px;
  vertical-align: middle;
  border: none;
}

.td-liushen {
  /* color: #3a9ffb; */
  color: #ddd;
  width: 40px;
  text-align: left;
}

.td-liuqin-ganzhi {
  width: 75px;
  text-align: left;
}

.liuqin {
  color: #ddd;
  margin-right: 2px; /* 非常小的间距，让两者保持轻微区分 */
}

.ganzhi {
  color: #ddd;
  margin-right: 1px; /* 天干与地支之间的间距 */
}

.td-yao {
  width: 100px;
  position: relative;
}

.td-shiying {
  width: 30px;
}

/* 阴阳爻线样式 */
.result-yang-line {
  width: 80px;
  height: 4px;
  background-color: #e6c84c;
  margin: 4px 0;
}

.result-yin-line {
  width: 80px;
  height: 4px;
  position: relative;
  margin: 4px 0;
}

.result-yin-left, .result-yin-right {
  width: 35px;
  height: 4px;
  background-color: #e6c84c;
  position: absolute;
  top: 0;
}

.result-yin-left {
  left: 0;
}

.result-yin-right {
  right: 0;
}

/* 伏藏信息样式 */
.fu-cang-info {
  position: absolute;
  bottom: -15px;
  transform: translateY(-70%); /* 上移自身高度 */
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

/* 世应和变爻标记 */
.shiying-mark-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
}

.result-shi-ying {
  color: #3a9ffb;
  font-weight: bold;
  font-size: 14px;
  white-space: nowrap;
  position: relative; /* 改为相对定位，不再使用绝对定位 */
  margin-right: 6px; /* 只有当有世应标记时，与变爻标记之间保持间距 */
}

.result-yao-mark {
  color: var(--primary-color);
  font-weight: bold;
  font-size: 14px;
  position: relative; /* 改为相对定位，不再使用绝对定位 */
  /* 移除left属性，让它自然排列 */
}

/* 爻行动画 */
.animate-row {
  animation: fadeInUp 0.5s ease-out both;
  animation-play-state: running;
}

@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 卦列动画 */
.column-fade-enter-active {
  animation: fadeInRight 0.6s ease-out forwards !important;
}

.column-fade-leave-active {
  animation: fadeInRight 0.3s ease-in reverse !important;
}

@keyframes fadeInRight {
  0% {
    opacity: 0;
    transform: translateX(-20px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 卦象显示容器 */
.hexagram-display-result {
  margin-top: 20px;
}

.hexagram-pair {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-bottom: 20px;
}

.hexagram-column {
  min-width: 240px;
}

.hexagram-name {
  text-align: center;
  font-size: 18px;
  color: var(--primary-color);
  margin-bottom: 15px;
  font-weight: bold;
}

.hexagram-extra-info {
  font-size: 0.9rem;
  color: #aaa;
  margin-left: 5px;
}

/* 结果区域样式 */
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

/* 卦象结果标题样式 */
.result-title-wrapper {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 25px;
  position: relative;
}

.result-title {
  font-size: 2rem;
  color: var(--primary-color); /* 系统默认黄色 */
  margin: 0 auto;
  text-align: center;
  text-shadow: 0 0 15px rgba(230, 200, 76, 0.4);
  letter-spacing: 2px;
  position: relative;
}

/* 识别消费文字 - 动态流光渐变效果 */
.recognized-price-badge {
  font-size: 0.85rem;
  font-weight: 400;
  padding: 2px 6px;
  white-space: nowrap;
  position: absolute;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, 
    #FFD700 0%, 
    #1a1a1a 25%, 
    #FFFFFF 50%, 
    #1a1a1a 75%, 
    #FFD700 100%
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: inline-block;
  animation: gradientFlow 3s linear infinite;
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

/* 结果区域动画 */
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

.highlight-text {
  color: #e6c84c;
}

.prediction-button-container {
  margin-top: 20px;
  text-align: center;
}

.prediction-button {
  background-color: #f0c14b;
  border: 1px solid #a88734;
  border-radius: 4px;
  color: #111;
  cursor: pointer;
  font-size: 16px;
  padding: 10px 20px;
  transition: all 0.3s;
}

.prediction-button:hover {
  background-color: #ddb347;
}

/* 分析结果样式 */
.analysis-result {
  background-color: transparent;
  padding: 20px;
  margin-top: 20px;
  position: relative;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.divination-divider {
  border: none;
  height: 2px;
  background-image: linear-gradient(to right, transparent, rgba(230, 200, 76, 0.5), transparent);
  margin: 30px auto;
  width: 80%;
}

/* 灵签卷轴整体容器 */
.divination-result {
  position: relative;
  margin: 30px auto;
  max-width: 700px;
  transition: all 0.8s ease;
  overflow: hidden;
  perspective: 1000px;
  scroll-behavior: smooth;
}

/* 绢布背景纹理 */
.silk-paper {
  background: linear-gradient(45deg, #29201a 25%, #362a23 75%); /* 深色背景 */
  border-radius: 8px;
  padding: 40px 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  position: relative;
  color: #e2c44b; /* 金黄色文本 */
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5); /* 添加文本阴影增强对比度 */
  overflow: hidden;
  transform-style: preserve-3d;
  opacity: 0;
  transform: translateY(50px);
  transition: opacity 1s ease, transform 1s ease;
}

/* 卷轴展开动画类 */
.silk-paper.scroll-reveal {
  opacity: 1;
  transform: translateY(0);
}

/* 卷轴打开动画 */
@keyframes unfoldScroll {
  0% {
    opacity: 0;
    transform: translateY(50px) scale(0.9);
    max-height: 100px;
  }
  50% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    max-height: 2000px;
  }
}

/* 绢布纹理效果 */
.silk-paper::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(45deg, rgba(0,0,0,0.02) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(0,0,0,0.02) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(0,0,0,0.02) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(0,0,0,0.02) 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  z-index: 0;
  opacity: 0.6;
  mix-blend-mode: overlay;
}

/* 卦象标题样式 */
.gua-title {
  font-size: 2rem;
  color: #e2c44b; /* 金黄色标题 */
  margin-bottom: 25px;
  text-align: center;
  font-weight: bold;
  position: relative;
  z-index: 1;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5); /* 增强阴影效果 */
  font-family: 'Noto Serif SC', 'SimSun', serif;
  letter-spacing: 3px;
}

/* 段落标题样式 */
.paragraph-title {
  color: #e2c44b; /* 金黄色标题 */
  font-weight: bold;
  font-size: 1.2rem;
  margin-top: 20px;
  margin-bottom: 10px;
  border-bottom: 1px solid rgba(226, 196, 75, 0.5); /* 增加边框对比度 */
  padding-bottom: 5px;
  font-family: 'Noto Serif SC', 'SimSun', serif;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4); /* 添加文本阴影 */
}

/* 诗句样式 */
.poem {
  font-style: italic;
  text-align: center;
  margin: 20px 0;
  line-height: 1.8;
  color: #e2c44b; /* 金黄色文本 */
  padding: 10px;
  background-color: rgba(0, 0, 0, 0.05);
  border-left: 3px solid #e2c44b;
  font-family: 'Noto Serif SC', 'SimSun', serif;
}

/* 灵签内容 */
.silk-content {
  color: #e2c44b; /* 金黄色文本 */
  font-size: 1.1rem;
  line-height: 1.8;
  position: relative;
  z-index: 1;
  margin: 20px 0;
  font-family: 'Noto Serif SC', 'SimSun', serif;
  text-align: justify;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4); /* 添加文本阴影增强可读性 */
}

/* 增加阴影效果，模拟卷轴质感 */
.silk-paper::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to right, 
    rgba(0,0,0,0.05) 0%, 
    rgba(0,0,0,0) 5%, 
    rgba(0,0,0,0) 95%, 
    rgba(0,0,0,0.05) 100%
  );
  pointer-events: none;
  z-index: 2;
}

/* 竹简滚动效果 */
.bamboo-scroll::after {
  content: '';
  position: absolute;
  top: 0;
  left: 10%;
  right: 10%;
  height: 30px;
  background: radial-gradient(ellipse at center, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 70%);
  border-radius: 50%;
  transform: translateY(15px);
  filter: blur(5px);
  z-index: -1;
}

/* 朱砂印章效果 */
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
  border-radius: 5px;
  margin-left: auto;
  margin-top: 30px;
  box-shadow: 0 2px 10px rgba(197, 48, 48, 0.4);
  transform: rotate(5deg);
  font-family: 'HanyiSongyang', 'SimSun', serif;
  z-index: 1;
}

/* 印章内部纹理 */
.seal-ink::before {
  content: '';
  position: absolute;
  top: 5px;
  left: 5px;
  right: 5px;
  bottom: 5px;
  border: 1px solid rgba(255,255,255,0.3);
  z-index: -1;
}

/* 竹简卷轴装饰 */
.bamboo-scroll {
  height: 30px;
  background: linear-gradient(90deg, #8B5A2B, #A67C52, #8B5A2B);
  border-radius: 15px;
  margin: -10px auto 0;
  position: relative;
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
  z-index: 2;
  width: 90%;
}

/* 竹简纹理 */
.bamboo-scroll::before {
  content: '';
  position: absolute;
  top: 5px;
  left: 0;
  right: 0;
  height: 20px;
  background: repeating-linear-gradient(90deg, 
    transparent, 
    transparent 15px, 
    rgba(0,0,0,0.1) 15px, 
    rgba(0,0,0,0.1) 30px
  );
  border-radius: 10px;
}

/* 加载字体 */
@font-face {
  font-family: 'HanyiSongyang';
  src: url('https://cdn.jsdelivr.net/gh/googlefonts/noto-cjk@main/Sans/OTF/Chinese-Simplified/NotoSansCJKsc-Regular.otf') format('opentype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

/* 强调词汇样式优化 */
.highlight-word {
  font-weight: bold;
  position: relative;
  display: inline-block;
  padding: 0 4px;
  border-radius: 3px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6); /* 加深文本阴影 */
}

.highlight-word.good {
  color: #f0f066; /* 浅黄色 */
  background-color: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid #f0f066;
}

.highlight-word.neutral {
  color: #ffffff; /* 白色 */
  background-color: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid #ffffff;
}

.highlight-word.bad {
  color: #ff6666; /* 浅红色 */
  background-color: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid #ff6666;
}

.analysis-title {
  font-size: 1.8rem;
  color: #e2c44b; /* 金黄色标题 */
  margin-bottom: 20px;
  text-align: center;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
}

.analysis-content {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 20px;
  line-height: 1.8;
  border: 1px solid rgba(139, 69, 19, 0.2);
}

/* Markdown 解析文本容器 - 古朴典雅风格 */
/* analysis-text 容器样式 - Markdown 内容样式已由 MarkdownRenderer 组件控制 */
.analysis-text {
  position: relative;
  z-index: 1;
  margin: 25px 0;
}

/* 分析结果动画 */
.analysis-appear-enter-active {
  animation: fadeInUp 0.8s ease-out forwards;
}

.analysis-appear-leave-active {
  animation: fadeInUp 0.5s ease-in reverse;
}

@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(30px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.hexagram-extra-info {
  font-size: 0.9rem;
  color: #aaa;
  margin-left: 5px;
}

.fu-cang-info {
  font-size: 0.8rem;
  color: #aaa;
  margin-top: 5px;
}

.fu-cang-text {
  font-weight: bold;
}

/* 新的起卦类型选择器样式 */
.hexagram-type-selector {
  margin-top: 20px;
  text-align: center;
}

.type-options-container {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.type-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.type-option.active {
  transform: scale(1.1);
}

.type-icon {
  font-size: 2rem;
  color: var(--primary-color);
  margin-bottom: 10px;
}

.type-label {
  font-size: 1rem;
  color: var(--text-light);
}

/* 起卦类型选择器样式 */
.hexagram-type-selector {
  margin: 30px 0;
  display: flex;
  justify-content: center;
}

.type-options-container {
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
}

.type-option {
  width: 160px;
  height: 120px;
  background-color: rgba(34, 34, 34, 0.7);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  transform: translateX(-100px);
  opacity: 0;
  animation: slideIn 0.6s forwards ease-out;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  border: 1px solid #333;
}

@keyframes slideIn {
  0% {
    transform: translateX(-100px);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}

.type-option:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.3);
  background-color: rgba(40, 40, 40, 0.8);
  border-color: #444;
}

.type-option.active {
  background-color: rgba(230, 200, 76, 0.2);
  border: 1px solid var(--primary-color);
  box-shadow: 0 0 15px rgba(230, 200, 76, 0.3);
}

.type-icon {
  font-size: 36px;
  margin-bottom: 10px;
}

.type-label {
  color: #ddd;
  font-size: 16px;
  text-align: center;
}

.type-option.active .type-label {
  color: var(--primary-color);
  font-weight: bold;
}

.pillar-animation-wrapper {
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 修改输入框样式 - 确保背景色正确 */
:deep(.el-textarea__inner) {
  background-color: rgba(34, 34, 34, 0.8) !important;
  border: none !important; /* 移除边框 */
  outline: none !important; /* 移除轮廓 */
  color: #ddd !important;
  transition: all 0.3s ease;
  box-shadow: 0 0 0 1px #333 inset !important; /* 内侧阴影代替边框 */
}

:deep(.el-textarea__inner:focus) {
  border: none !important;
  background-color: rgba(34, 34, 34, 0.95) !important;
  box-shadow: 0 0 0 1px rgba(230, 200, 76, 0.3) inset !important;
}

/* ... 其他输入框相关样式 ... */

/* 柱子动画容器 - 修复动画后内容消失问题 */
.pillar-container {
  perspective: 800px;
  height: 30px;
  position: relative;
}

.pillar-animation-wrapper {
  position: relative;
  animation: pillarAppear 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 修改动画效果，确保结束状态正常 */
@keyframes pillarAppear {
  0% {
    transform: translateY(50px) scale(0.5) rotateX(20deg);
    opacity: 0;
  }
  70% {
    transform: translateY(-5px) scale(1.05) rotateX(-5deg);
    opacity: 1;
  }
  100% {
    transform: translateY(0) scale(1) rotateX(0);
    opacity: 1;
  }
}

.gan-text, .zhi-text {
  font-size: 16px;
  font-weight: bold;
  color: #fff;
  display: inline-block;
  position: relative;
  text-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
}

.gan-text-special, .zhi-text-special {
  font-size: 16px;
  font-weight: bold;
  color: var(--primary-color);
  display: inline-block;
  position: relative;
  text-shadow: 0 0 10px rgba(230, 200, 76, 0.5), 0 0 20px rgba(230, 200, 76, 0.3);
}

/* 确保输入框背景色 */
.textarea-input {
  color: #ddd;
  transition: all 0.3s ease;
  background-color: rgba(34, 34, 34, 0.8);
}

/* 新增单独的脉动效果类 - 可以在渲染后添加 */
.gan-text::after, .zhi-text::after, .gan-text-special::after, .zhi-text-special::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -1;
  opacity: 0.6;
  animation: textPulse 3s infinite alternate;
}

.gan-text-special::after, .zhi-text-special::after {
  animation: specialTextPulse 3s infinite alternate;
}

@keyframes textPulse {
  0% {
    opacity: 0.2;
  }
  100% {
    opacity: 0.6;
  }
}

@keyframes specialTextPulse {
  0% {
    opacity: 0.3;
  }
  100% {
    opacity: 0.8;
  }
}

/* 修改动画样式 */
.pillar-animation-wrapper {
  position: relative;
}

.animate-pillar {
  animation: pillarAppear 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 确保只有animate-pillar类的元素才显示动画 */
.pillar-animation-wrapper:not(.animate-pillar) {
  animation: none !important;
  transform: none !important;
  opacity: 1 !important;
}

/* 内联的标记容器（直接放在爻内） */
.inline-marks {
  position: absolute;
  left: 95px; /* 调整位置，使其紧贴卦爻右侧 */
  top: 0;
  height: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
}

/* 世应标记 */
.result-shi-ying {
  color: #3a9ffb;
  font-weight: bold;
  font-size: 14px;
  white-space: nowrap;
  margin-right: 6px; /* 只有当有世应标记时，与变爻标记之间保持间距 */
}

/* 变爻标记 */
.result-yao-mark {
  color: var(--primary-color);
  font-weight: bold;
  font-size: 14px;
}

/* 调整表格样式，为标记留出足够空间 */
.result-table {
  width: auto;
  border-collapse: collapse;
  border: none;
  margin: 0 auto;
  table-layout: fixed; /* 固定表格布局 */
}

.result-table tr {
  height: 36px;
}

.td-liushen, .td-liuqin, .td-ganzhi, .td-yao {
  padding: 8px 4px;
  vertical-align: middle;
  border: none;
}

/* 地支颜色样式 */
.dizhi {
  font-weight: bold;
  display: inline-block;
  transition: all 0.3s ease; /* 添加过渡效果 */
}

.dizhi:hover {
  transform: scale(1.2); /* 鼠标悬停时放大效果 */
  text-shadow: 0 0 10px currentColor; /* 悬停时添加光晕效果 */
}

/* 子：玄青，深海钴蓝 */
.dizhi-子 {
  color: #2E5A88;
  text-shadow: 0 0 3px rgba(46, 90, 136, 0.5);
}

/* 丑：陶土棕，琥珀同色系 */
.dizhi-丑 {
  color: #B58A5B;
  text-shadow: 0 0 3px rgba(181, 138, 91, 0.5);
}

/* 寅：松柏绿，霓虹青柠 */
.dizhi-寅 {
  color: #A3E635;
  text-shadow: 0 0 3px rgba(163, 230, 53, 0.5);
}

/* 卯：竹月白，珍珠母贝 */
.dizhi-卯 {
  color: #A3E635;
  text-shadow: 0 0 3px rgba(163, 230, 53, 0.5);
}

/* 辰：龙鳞金，主色琥珀黄 */
.dizhi-辰 {
  color: #B58A5B;
  text-shadow: 0 0 3px rgba(181, 138, 91, 0.5);
}

/* 巳：熔岩红，暗焰橙红 */
.dizhi-巳 {
  color: #FF6B6B;
  text-shadow: 0 0 5px #F0C14B;
  animation: noonPulse 2s infinite alternate;
}

/* 午：赤阳，灼光渐变 */
.dizhi-午 {
  color: #FF6B6B;
  text-shadow: 0 0 5px #F0C14B;
  animation: noonPulse 2s infinite alternate;
}

@keyframes noonPulse {
  0% {
    text-shadow: 0 0 3px #FF6B6B;
  }
  100% {
    text-shadow: 0 0 8px #F0C14B;
  }
}

/* 未：麦穗黄，沙丘米黄 */
.dizhi-未 {
  color: #B58A5B;
  text-shadow: 0 0 3px rgba(181, 138, 91, 0.5);
}

/* 申：寒铁灰，钛合金银 */
.dizhi-申 {
  color: #FFD700;
  text-shadow: 0 0 5px rgba(240, 244, 248, 0.7);
}

/* 酉：月白银，镜面反光白 */
.dizhi-酉 {
  color: #FFD700;
  text-shadow: 0 0 5px rgba(240, 244, 248, 0.7);
}

/* 戌：烽燧赭，锈迹纹理色 */
.dizhi-戌 {
  color: #B58A5B;
  text-shadow: 0 0 3px rgba(181, 138, 91, 0.5);
}

/* 亥：墨渊黑，星空渐变 */
.dizhi-亥 {
  color: #2E5A88;
  text-shadow: 0 0 3px rgba(46, 90, 136, 0.5);
}

@keyframes midnightPulse {
  0% {
    text-shadow: 0 0 3px #0A0A0A;
  }
  100% {
    text-shadow: 0 0 8px #2E5A88;
  }
}

/* 预测加载界面样式 */
.prediction-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.prediction-loading-container {
  width: 90%;
  max-width: 800px;
  height: 80vh;
  max-height: 800px;
  background-color: #1a1a1a;
  border-radius: 10px;
  box-shadow: 0 0 30px rgba(230, 200, 76, 0.3);
  padding: 20px;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.loading-header {
  text-align: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(230, 200, 76, 0.3);
}

.loading-title {
  font-size: 1.8rem;
  color: var(--primary-color);
  margin-bottom: 15px;
  text-shadow: 0 0 10px rgba(230, 200, 76, 0.5);
  letter-spacing: 1px;
}

.loading-progress-container {
  height: 8px;
  background-color: #2a2a2a;
  border-radius: 4px;
  overflow: hidden;
  margin: 0 auto;
  width: 80%;
  max-width: 500px;
  position: relative;
}

.loading-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #e6c84c, #f0c14b);
  border-radius: 4px;
  transition: width 0.3s ease;
  box-shadow: 0 0 10px rgba(230, 200, 76, 0.5);
}

.loading-percentage {
  margin-top: 8px;
  font-size: 1rem;
  color: #aaa;
}

.loading-hexagram-container {
  display: flex;
  flex: 1;
  padding: 20px 0;
  overflow: hidden;
  position: relative;
}

.loading-hexagram {
  width: 40%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
}

.loading-yao-item {
  width: 100%;
  display: flex;
  align-items: center;
  margin: 15px 0;
  padding: 10px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
}

.loading-yao-label {
  width: 50px;
  font-size: 1rem;
  color: #aaa;
  text-align: right;
  margin-right: 15px;
}

.loading-yang-yao {
  width: 100px;
  height: 8px;
  background-color: #e6c84c;
  transition: all 0.3s ease;
}

.loading-yin-yao {
  width: 100px;
  height: 8px;
  position: relative;
  transition: all 0.3s ease;
}

.loading-yin-left, .loading-yin-right {
  width: 45px;
  height: 8px;
  background-color: #e6c84c;
  position: absolute;
  top: 0;
  transition: all 0.3s ease;
}

.loading-yin-left {
  left: 0;
}

.loading-yin-right {
  right: 0;
}

.loading-yao-item.loading-active .loading-yang-yao,
.loading-yao-item.loading-active .loading-yin-left,
.loading-yao-item.loading-active .loading-yin-right {
  background-color: #fff;
  box-shadow: 0 0 15px 5px rgba(255, 255, 255, 0.8);
  transform: scale(1.1);
}

.loading-yao-item.loading-highlight .loading-yang-yao,
.loading-yao-item.loading-highlight .loading-yin-left,
.loading-yao-item.loading-highlight .loading-yin-right {
  background-color: #f0c14b;
}

.yao-energy-indicator {
  position: absolute;
  right: 20px;
  width: 80px;
  height: 8px;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.5), inset 0 0 3px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(230, 200, 76, 0.4);
}

.yao-energy-level {
  height: 100%;
  background: linear-gradient(90deg, #e6c84c, #ffd700);
  border-radius: 4px;
  transition: width 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94); /* 添加缓动函数使过渡更自然 */
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.6);
}

.loading-insights {
  width: 60%;
  padding: 20px;
  padding-left: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.loading-insight-item {
  display: flex;
  align-items: center;
  margin: 10px 0;
  transition: opacity 0.5s ease;
}

.insight-icon {
  font-size: 1.8rem;
  margin-right: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
}

.insight-text {
  color: #ddd;
  font-size: 1.1rem;
}

/* 能量涟漪效果 */
.energy-ripple {
  position: absolute;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(240, 193, 75, 0.8) 0%, rgba(240, 193, 75, 0) 70%);
  transform: translate(-50%, -50%);
  animation: rippleEffect 1.5s ease-out forwards;
  pointer-events: none;
  z-index: 5;
}

@keyframes rippleEffect {
  0% {
    width: 20px;
    height: 20px;
    opacity: 1;
  }
  100% {
    width: 300px;
    height: 300px;
    opacity: 0;
  }
}

/* 淡入淡出动画 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* 呼吸效果 */
@keyframes breathe {
  0%, 100% {
    box-shadow: 0 0 5px 2px rgba(230, 200, 76, 0.3);
  }
  50% {
    box-shadow: 0 0 15px 5px rgba(230, 200, 76, 0.5);
  }
}

.loading-hexagram::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at center, rgba(240, 193, 75, 0.1) 0%, rgba(240, 193, 75, 0) 70%);
  z-index: -1;
  animation: breathe 3s infinite ease-in-out;
}

/* 五行元素符号 */
.floating-elements {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.element-symbol {
  position: absolute;
  font-size: 1.8rem;
  font-weight: bold;
  opacity: 0.4;
  pointer-events: none;
  animation: float 15s infinite ease-in-out;
}

.element-metal {
  top: 15%;
  left: 15%;
  color: #e0e0e0;
  animation-delay: 0s;
}

.element-wood {
  top: 25%;
  right: 20%;
  color: #4CAF50;
  animation-delay: -2s;
}

.element-water {
  bottom: 30%;
  left: 20%;
  color: #2196F3;
  animation-delay: -4s;
}

.element-fire {
  top: 40%;
  left: 70%;
  color: #FF5722;
  animation-delay: -6s;
}

.element-earth {
  bottom: 20%;
  right: 25%;
  color: #795548;
  animation-delay: -8s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) translateX(0) rotate(0deg);
  }
  25% {
    transform: translateY(-15px) translateX(10px) rotate(5deg);
  }
  50% {
    transform: translateY(0) translateX(20px) rotate(0deg);
  }
  75% {
    transform: translateY(15px) translateX(5px) rotate(-5deg);
  }
}

/* 八卦符号 */
.trigram-symbols {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.trigram {
  position: absolute;
  font-size: 2.5rem;
  color: rgba(230, 200, 76, 0.5); /* 加深符号颜色，从0.2改为0.5 */
  pointer-events: none;
  animation: trigram-pulse 4s infinite alternate ease-in-out;
}

.trigram-1 {
  top: 10%;
  left: 10%;
  animation-delay: 0s;
  color: rgba(240, 193, 75, 0.6); /* 乾卦专用颜色，金色调 */
}

.trigram-2 {
  top: 20%;
  right: 15%;
  animation-delay: -0.5s;
  color: rgba(125, 78, 140, 0.6); /* 兑卦专用颜色，紫色调 */
}

.trigram-3 {
  bottom: 30%;
  left: 15%;
  animation-delay: -1s;
  color: rgba(219, 90, 66, 0.6); /* 离卦专用颜色，红色调 */
}

.trigram-4 {
  top: 50%;
  right: 25%;
  animation-delay: -1.5s;
  color: rgba(163, 230, 53, 0.6); /* 震卦专用颜色，青色调 */
}

.trigram-5 {
  bottom: 40%;
  right: 20%;
  animation-delay: -2s;
  color: rgba(136, 201, 161, 0.6); /* 巽卦专用颜色，绿色调 */
}

.trigram-6 {
  top: 30%;
  left: 25%;
  animation-delay: -2.5s;
  color: rgba(46, 90, 136, 0.6); /* 坎卦专用颜色，蓝色调 */
}

.trigram-7 {
  bottom: 15%;
  left: 30%;
  animation-delay: -3s;
  color: rgba(109, 46, 70, 0.6); /* 艮卦专用颜色，赭色调 */
}

.trigram-8 {
  bottom: 25%;
  right: 30%;
  animation-delay: -3.5s;
  color: rgba(181, 138, 91, 0.6); /* 坤卦专用颜色，棕色调 */
}

@keyframes trigram-pulse {
  0% {
    opacity: 0.3;  /* 提高最低不透明度 */
    transform: scale(0.9);
    text-shadow: 0 0 5px currentColor;  /* 添加光晕效果 */
  }
  100% {
    opacity: 0.8;  /* 提高最高不透明度 */
    transform: scale(1.1);
    text-shadow: 0 0 15px currentColor;  /* 添加更强的光晕效果 */
  }
}

/* 爻线内部能量脉动效果 */
.loading-yang-yao::after,
.loading-yin-left::after,
.loading-yin-right::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 100%;
  background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.5), rgba(255,255,255,0));
  animation: energy-pulse 3s infinite ease-out;
}

@keyframes energy-pulse {
  0% {
    width: 0;
    left: 0;
    opacity: 0.8;
  }
  100% {
    width: 100%;
    left: 100%;
    opacity: 0;
  }
}

/* 强化加载项的过渡动画 */
.loading-insight-item {
  transform: translateX(20px);
  opacity: 0;
  animation: slide-in 0.5s forwards ease-out;
}

.loading-insight-item:nth-child(1) { animation-delay: 0.1s; }
.loading-insight-item:nth-child(2) { animation-delay: 0.2s; }
.loading-insight-item:nth-child(3) { animation-delay: 0.3s; }
.loading-insight-item:nth-child(4) { animation-delay: 0.4s; }
.loading-insight-item:nth-child(5) { animation-delay: 0.5s; }

@keyframes slide-in {
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 交互反馈动画 */
.loading-yao-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
  transform: translateX(5px);
}

.loading-yao-item:active {
  transform: translateX(10px);
}

.loading-yao-item.loading-active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 70%);
  animation: click-feedback 0.5s forwards ease-out;
}

@keyframes click-feedback {
  0% {
    transform: scale(0);
    opacity: 0.5;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

/* 增强载入进度条效果 */
.loading-progress-bar {
  position: relative;
  overflow: hidden;
}

.loading-progress-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(255, 255, 255, 0.4), 
    transparent
  );
  animation: progress-shine 1.5s infinite linear;
}

@keyframes progress-shine {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* 意象图展示 */
.imagery-preview {
  margin-top: 25px;
  position: relative;
}

.imagery-title {
  font-size: 1.1rem;
  color: var(--primary-color);
  margin-bottom: 10px;
  text-align: center;
  font-weight: bold;
}

.imagery-container {
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.3);
  background-position: center;
  background-size: cover;
  transition: all 1s ease;
}

.imagery-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, 
    rgba(0, 0, 0, 0.2), 
    rgba(0, 0, 0, 0.4)
  );
}

/* 各卦意象背景 - 使用优化的颜色方案 */
.imagery-1 {
  background: conic-gradient(at 50% 50%, #E6E8E6, #F0C14B, #E6E8E6);
  position: relative;
  overflow: hidden;
}

.imagery-1::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at center, rgba(240, 193, 75, 0.4) 0%, rgba(240, 193, 75, 0) 70%);
  animation: rotate-halo 10s infinite linear;
}

@keyframes rotate-halo {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.imagery-2 {
  background-color: #B58A5B;
  position: relative;
  overflow: hidden;
}

.imagery-2::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(to right, transparent, rgba(74, 74, 74, 0.3), transparent),
    linear-gradient(to bottom, transparent, rgba(74, 74, 74, 0.3), transparent);
  background-size: 100% 100%, 100% 100%;
  animation: earth-texture 15s infinite alternate ease-in-out;
}

@keyframes earth-texture {
  0% {
    background-position: 0% 0%, 0% 0%;
  }
  100% {
    background-position: 100% 100%, 100% 100%;
  }
}

.imagery-3 {
  background: linear-gradient(135deg, #2E5A88, #A3E635);
  position: relative;
  overflow: hidden;
}

.imagery-3::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(163, 230, 53, 0.4) 50%, 
    transparent 100%
  );
  animation: thunder-flash 3s infinite;
}

@keyframes thunder-flash {
  0%, 100% { opacity: 0; transform: scaleX(0.8); }
  10%, 90% { opacity: 0; }
  50% { opacity: 1; transform: scaleX(1); }
}

.imagery-4 {
  background-color: #88C9A1;
  position: relative;
  overflow: hidden;
}

.imagery-4::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, #E3DAC9, transparent);
  opacity: 0.4;
  animation: wind-flow 8s infinite linear;
}

@keyframes wind-flow {
  0% { transform: translateX(-100%) skewX(-15deg); }
  100% { transform: translateX(100%) skewX(15deg); }
}

.imagery-5 {
  background-color: #2E5A88;
  position: relative;
  overflow: hidden;
}

.imagery-5::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    0deg,
    rgba(176, 190, 197, 0.4) 0%,
    transparent 20%,
    rgba(176, 190, 197, 0.3) 40%,
    transparent 60%,
    rgba(176, 190, 197, 0.2) 80%,
    transparent 100%
  );
  background-size: 200% 200%;
  animation: water-wave 6s infinite ease-in-out;
}

@keyframes water-wave {
  0% { background-position: 0% 0%; }
  50% { background-position: 100% 100%; }
  100% { background-position: 0% 0%; }
}

.imagery-6 {
  background: linear-gradient(135deg, #DB5A42, #FFD700);
  position: relative;
  overflow: hidden;
}

.imagery-6::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(
    circle at center,
    rgba(255, 215, 0, 0.5) 0%,
    rgba(219, 90, 66, 0.2) 60%,
    transparent 100%
  );
  transform-origin: center;
  animation: fire-pulse 3s infinite alternate;
}

@keyframes fire-pulse {
  0% { transform: scale(0.8); opacity: 0.7; }
  100% { transform: scale(1.1); opacity: 0.9; }
}

.imagery-7 {
  background: linear-gradient(to bottom, #6D2E46, #D7A773);
  position: relative;
  overflow: hidden;
}

.imagery-7::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 15px,
      rgba(215, 167, 115, 0.2) 15px,
      rgba(215, 167, 115, 0.2) 20px
    );
  animation: mountain-formation 20s infinite alternate ease-in-out;
}

@keyframes mountain-formation {
  0% { background-position: 0 0; }
  100% { background-position: 0 20px; }
}

.imagery-8 {
  background: linear-gradient(135deg, #7D4E8C, #E6E8E6);
  position: relative;
  overflow: hidden;
}

.imagery-8::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    45deg,
    transparent 0%,
    rgba(230, 232, 230, 0.5) 50%,
    transparent 100%
  );
  animation: lake-reflection 8s infinite alternate;
}

@keyframes lake-reflection {
  0% { 
    transform: translateX(-30%) translateY(10%) rotate(-5deg); 
    opacity: 0.3;
  }
  100% { 
    transform: translateX(30%) translateY(-10%) rotate(5deg); 
    opacity: 0.7;
  }
}

/* 每个意象图添加独特的卦象符号 */
.imagery-1::before {
  content: '☰';
  position: absolute;
  font-size: 5rem;
  color: rgba(240, 193, 75, 0.3);
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  animation: symbol-glow 4s infinite alternate;
}

.imagery-2::before {
  content: '☷';
  position: absolute;
  font-size: 5rem;
  color: rgba(74, 74, 74, 0.3);
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  animation: symbol-glow 4s infinite alternate;
}

.imagery-3::before {
  content: '☳';
  position: absolute;
  font-size: 5rem;
  color: rgba(163, 230, 53, 0.3);
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  animation: symbol-flash 4s infinite;
}

.imagery-4::before {
  content: '☴';
  position: absolute;
  font-size: 5rem;
  color: rgba(227, 218, 201, 0.3);
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  animation: symbol-blow 8s infinite linear;
}

.imagery-5::before {
  content: '☵';
  position: absolute;
  font-size: 5rem;
  color: rgba(176, 190, 197, 0.3);
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  animation: symbol-flow 6s infinite ease-in-out;
}

.imagery-6::before {
  content: '☲';
  position: absolute;
  font-size: 5rem;
  color: rgba(255, 215, 0, 0.3);
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  animation: symbol-burn 3s infinite alternate;
}

.imagery-7::before {
  content: '☶';
  position: absolute;
  font-size: 5rem;
  color: rgba(215, 167, 115, 0.3);
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  animation: symbol-glow 4s infinite alternate;
}

.imagery-8::before {
  content: '☱';
  position: absolute;
  font-size: 5rem;
  color: rgba(230, 232, 230, 0.3);
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  animation: symbol-reflect 8s infinite alternate;
}

@keyframes symbol-glow {
  0% { opacity: 0.2; text-shadow: 0 0 5px currentColor; }
  100% { opacity: 0.7; text-shadow: 0 0 20px currentColor; }
}

@keyframes symbol-flash {
  0%, 100% { opacity: 0.2; transform: translateY(-50%) scale(1); }
  50% { opacity: 0.8; transform: translateY(-50%) scale(1.1); }
}

@keyframes symbol-blow {
  0% { transform: translateY(-50%) translateX(-10px); }
  50% { transform: translateY(-50%) translateX(10px); }
  100% { transform: translateY(-50%) translateX(-10px); }
}

@keyframes symbol-flow {
  0% { transform: translateY(-60%) scale(0.9); }
  50% { transform: translateY(-40%) scale(1.1); }
  100% { transform: translateY(-60%) scale(0.9); }
}

@keyframes symbol-burn {
  0% { 
    opacity: 0.3; 
    transform: translateY(-50%) scale(0.9);
    text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
  }
  100% { 
    opacity: 0.8; 
    transform: translateY(-50%) scale(1.1);
    text-shadow: 0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(219, 90, 66, 0.4);
  }
}

@keyframes symbol-reflect {
  0% { 
    opacity: 0.2; 
    transform: translateY(-50%) skewX(-15deg);
    text-shadow: -5px 5px 10px currentColor;
  }
  100% { 
    opacity: 0.6; 
    transform: translateY(-50%) skewX(15deg);
    text-shadow: 5px -5px 10px currentColor;
  }
}

.imagery-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, 
    rgba(0, 0, 0, 0.1), 
    rgba(0, 0, 0, 0.2)
  );
  pointer-events: none;
}

/* 卦象解释区域 */
.hexagram-explanation {
  margin-top: 25px;
  position: relative;
}

.explanation-title {
  font-size: 1.1rem;
  color: var(--primary-color);
  margin-bottom: 10px;
  text-align: center;
  font-weight: bold;
}

.explanation-container {
  height: 90px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.3);
  background-position: center;
  background-size: cover;
  transition: all 1s ease;
}

.explanation-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, 
    rgba(0, 0, 0, 0.1), 
    rgba(0, 0, 0, 0.3)
  );
  z-index: 1;
}

.explanation-content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  padding: 15px;
  height: 100%;
  animation: explanation-fade 0.5s ease-in-out;
  backdrop-filter: blur(1px);
  background: rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  margin: 3px;
}

.explanation-icon {
  font-size: 2.5rem;
  color: rgba(255, 255, 255, 0.95);
  margin-right: 15px;
  text-shadow: 0 0 10px var(--primary-color), 0 0 20px var(--primary-color);
  animation: explanation-pulse 2s infinite alternate ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.2);
  width: 50px;
  height: 50px;
  border-radius: 50%;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
}

.explanation-details {
  flex: 1;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  padding: 5px 10px;
}

.explanation-name {
  font-size: 1.1rem;
  color: #fff;
  margin-bottom: 5px;
  font-weight: bold;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.explanation-desc {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.85);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

/* 各卦背景样式 - 与意境图保持一致 */
.explanation-bg-1 {
  background: conic-gradient(at 50% 50%, #E6E8E6, #F0C14B, #E6E8E6);
  position: relative;
  overflow: hidden;
}

.explanation-bg-1::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at center, rgba(240, 193, 75, 0.4) 0%, rgba(240, 193, 75, 0) 70%);
  animation: rotate-halo 10s infinite linear;
  z-index: 1;
}

.explanation-bg-2 {
  background-color: #B58A5B;
  position: relative;
  overflow: hidden;
}

.explanation-bg-2::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(to right, transparent, rgba(74, 74, 74, 0.3), transparent),
    linear-gradient(to bottom, transparent, rgba(74, 74, 74, 0.3), transparent);
  background-size: 100% 100%, 100% 100%;
  animation: earth-texture 15s infinite alternate ease-in-out;
  z-index: 1;
}

.explanation-bg-3 {
  background: linear-gradient(45deg, #DB5A42, #FFD700);
  position: relative;
  overflow: hidden;
}

.explanation-bg-3::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(ellipse at center, rgba(255, 215, 0, 0.5) 0%, rgba(219, 90, 66, 0) 70%);
  animation: fire-pulse 3s infinite alternate ease-in-out;
  z-index: 1;
}

@keyframes fire-pulse {
  0% {
    opacity: 0.3;
    transform: scale(0.95);
  }
  100% {
    opacity: 0.7;
    transform: scale(1.05);
  }
}

.explanation-bg-4 {
  background: linear-gradient(to right, #2E5A88, #A3E635);
  position: relative;
  overflow: hidden;
}

.explanation-bg-4::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(163, 230, 53, 0.6) 10%, 
    transparent 20%, 
    transparent 100%
  );
  background-size: 200% 100%;
  animation: lightning-flash 5s infinite;
  z-index: 1;
}

@keyframes lightning-flash {
  0%, 100% {
    background-position: 200% 0;
  }
  5% {
    background-position: -100% 0;
  }
  6% {
    background-position: -80% 0;
  }
  7% {
    background-position: 300% 0;
  }
}

.explanation-bg-5 {
  background: linear-gradient(to right, #88C9A1, #E3DAC9);
  position: relative;
  overflow: hidden;
}

.explanation-bg-5::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 15px,
    rgba(255, 255, 255, 0.1) 15px,
    rgba(255, 255, 255, 0.1) 20px
  );
  animation: wind-flow 10s infinite linear;
  z-index: 1;
}

@keyframes wind-flow {
  0% {
    transform: translateX(-20px) translateY(0);
  }
  100% {
    transform: translateX(20px) translateY(-10px);
  }
}

.explanation-bg-6 {
  background: linear-gradient(135deg, #2E5A88, #B0BEC5);
  position: relative;
  overflow: hidden;
}

.explanation-bg-6::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: repeating-radial-gradient(
    circle at 50% 50%,
    rgba(176, 190, 197, 0),
    rgba(176, 190, 197, 0.2) 10px,
    rgba(176, 190, 197, 0) 20px
  );
  animation: water-ripple 6s infinite linear;
  z-index: 1;
}

@keyframes water-ripple {
  0% {
    background-size: 100% 100%;
    opacity: 0.3;
  }
  50% {
    background-size: 150% 150%;
    opacity: 0.5;
  }
  100% {
    background-size: 100% 100%;
    opacity: 0.3;
  }
}

.explanation-bg-7 {
  background: linear-gradient(to right, #6D2E46, #D7A773);
  position: relative;
  overflow: hidden;
}

.explanation-bg-7::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 10px,
    rgba(109, 46, 70, 0.2) 10px,
    rgba(109, 46, 70, 0.2) 12px
  );
  z-index: 1;
}

.explanation-bg-8 {
  background: linear-gradient(45deg, #7D4E8C, #E6E8E6);
  position: relative;
  overflow: hidden;
}

.explanation-bg-8::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    to bottom,
    rgba(125, 78, 140, 0) 0%,
    rgba(230, 232, 230, 0.3) 50%,
    rgba(125, 78, 140, 0) 100%
  );
  background-size: 100% 200%;
  animation: reflection-move 8s infinite ease;
  z-index: 1;
}

@keyframes reflection-move {
  0% {
    background-position: 0% 0%;
  }
  100% {
    background-position: 0% 100%;
  }
}

@keyframes explanation-fade {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes explanation-pulse {
  0% {
    transform: scale(1);
    text-shadow: 0 0 10px var(--primary-color);
    opacity: 0.9;
  }
  100% {
    transform: scale(1.1);
    text-shadow: 0 0 20px var(--primary-color), 0 0 30px var(--primary-color);
    opacity: 1;
  }
}

/* 灵签卷轴整体容器重构 */
.divination-header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  position: relative;
}

.divination-title {
  font-size: 2rem;
  color: var(--primary-color);
  text-align: center;
  margin: 0 20px;
  font-weight: bold;
  letter-spacing: 5px;
  text-shadow: 0 0 10px rgba(230, 200, 76, 0.3);
  font-family: 'HanyiSongyang', 'SimSun', serif;
}

.divination-symbol {
  font-size: 1.8rem;
  color: var(--primary-color);
  opacity: 0.8;
  animation: symbolPulse 3s infinite alternate ease-in-out;
}

.divination-symbol.left {
  transform: rotate(-30deg);
}

.divination-symbol.right {
  transform: rotate(30deg);
}

@keyframes symbolPulse {
  0% {
    opacity: 0.6;
    transform: scale(0.9) rotate(-30deg);
  }
  100% {
    opacity: 1;
    transform: scale(1.1) rotate(-30deg);
  }
}

.divination-result {
  position: relative;
  margin: 40px auto;
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

/* 绢布背景纹理强化 */
.silk-paper {
  background: linear-gradient(135deg, #1a1a1a 0%, #222222 50%, #1a1a1a 100%);
  border-radius: 12px;
  padding: 40px 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 
              inset 0 0 50px rgba(0, 0, 0, 0.3);
  position: relative;
  color: #e0e0e0;
  overflow: hidden;
  transform-style: preserve-3d;
  opacity: 0;
  transform: translateY(50px) rotateX(5deg);
  transition: opacity 1s ease, transform 1s ease;
  background-attachment: fixed;
}

.silk-paper.scroll-reveal {
  opacity: 1;
  transform: translateY(0) rotateX(0);
}

/* 绢布纹理效果增强 */
.silk-paper::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='rgba(255,255,255,0.03)' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E"),
    linear-gradient(45deg, rgba(255,255,255,0.02) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(255,255,255,0.02) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.02) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.02) 75%);
  background-size: 150px 150px, 20px 20px, 20px 20px, 20px 20px, 20px 20px;
  background-position: 0 0, 0 0, 0 10px, 10px -10px, -10px 0px;
  z-index: 0;
  opacity: 0.6;
  mix-blend-mode: overlay;
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

/* 卦象标题样式优化 */
.gua-title {
  font-size: 2.2rem;
  color: var(--primary-color);
  text-align: center;
  font-weight: bold;
  position: relative;
  z-index: 1;
  text-shadow: 0 0 15px rgba(230, 200, 76, 0.4);
  font-family: 'HanyiSongyang', 'SimSun', serif;
  letter-spacing: 4px;
  flex: 1;
  margin: 0 10px;
}

/* 卦辞区域 */
.gua-oracle {
  background: rgba(0, 0, 0, 0.2);
  border-left: 3px solid var(--primary-color);
  padding: 15px;
  margin: 25px 0;
  border-radius: 3px;
  text-align: center;
  margin-bottom: 20px;
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

/* 分析文本增强 */
.silk-content {
  color: #e2c44b; /* 金黄色文本 */
  font-size: 1.1rem;
  line-height: 1.9;
  position: relative;
  z-index: 1;
  margin: 25px 0;
  font-family: 'Noto Serif SC', 'SimSun', serif;
  white-space: pre-line; /* 保留换行符 */
  text-align: justify;
  letter-spacing: 1px;
  text-shadow: 0 1px 1px rgba(0,0,0,0.1); /* 轻微文本阴影 */
}

/* 支付信息样式 */
.payment-info {
  text-align: center;
  margin: 30px 0 20px;
  font-size: 0.95rem;
  letter-spacing: 0.5px;
}

/* 支付信息文字渐变效果 - 动态流光 */
.payment-info span {
  background: linear-gradient(90deg, 
    #FFD700 0%, 
    #1a1a1a 25%, 
    #FFFFFF 50%, 
    #1a1a1a 75%, 
    #FFD700 100%
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: inline-block;
  animation: gradientFlow 3s linear infinite;
}

/* 流光动画 */
@keyframes gradientFlow {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 200% 50%;
  }
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
  margin-right: 20px;
  font-style: italic;
  color: rgba(224, 224, 224, 0.7);
  align-self: flex-end;
  font-size: 0.9rem;
}

/* 印章效果优化 */
.seal-ink {
  width: 70px;
  height: 70px;
  background-color: rgba(197, 48, 48, 0.9);
  border-radius: 5px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  color: white;
  font-family: 'HanyiSongyang', 'SimSun', serif;
  position: relative;
  transform: rotate(15deg);
  box-shadow: 0 5px 15px rgba(197, 48, 48, 0.4);
  z-index: 1;
}

.seal-ink::before {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  right: 3px;
  bottom: 3px;
  border: 1px solid rgba(255,255,255,0.5);
  z-index: -1;
}

.seal-ink span {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  font-weight: bold;
}

/* 竹简卷轴装饰 */
.scroll-decorations {
  display: flex;
  justify-content: space-between;
  margin-top: -15px;
  position: relative;
  z-index: 2;
}

.bamboo-scroll {
  height: 40px;
  width: 40px;
  background: radial-gradient(circle, #8B5A2B 0%, #654321 100%);
  border-radius: 50%;
  position: relative;
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
}

.bamboo-scroll::before {
  content: '';
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  bottom: 10px;
  border-radius: 50%;
  background: radial-gradient(circle, #A67C52 0%, #8B5A2B 100%);
  box-shadow: inset 0 2px 3px rgba(0,0,0,0.2);
}

.bamboo-scroll.left {
  transform: translateX(20px);
}

.bamboo-scroll.right {
  transform: translateX(-20px);
}

/* 段落标题样式增强 */
.paragraph-title {
  color: var(--primary-color);
  font-weight: bold;
  font-size: 1.3rem;
  margin-top: 30px;
  margin-bottom: 15px;
  border-bottom: 1px solid rgba(230, 200, 76, 0.3);
  padding-bottom: 8px;
  font-family: 'HanyiSongyang', 'SimSun', serif;
  text-shadow: 0 0 5px rgba(230, 200, 76, 0.3);
}

/* 诗句样式增强 */
.poem {
  font-style: italic;
  text-align: center;
  margin: 25px 0;
  line-height: 1.8;
  color: #e0e0e0;
  padding: 15px;
  background-color: rgba(230, 200, 76, 0.05);
  border-left: 3px solid var(--primary-color);
  font-family: 'HanyiSongyang', 'SimSun', serif;
  position: relative;
  border-radius: 3px;
}

.poem::before {
  content: '"';
  position: absolute;
  top: -10px;
  left: 10px;
  font-size: 3rem;
  color: rgba(230, 200, 76, 0.2);
  font-family: serif;
}

.poem::after {
  content: '"';
  position: absolute;
  bottom: -30px;
  right: 10px;
  font-size: 3rem;
  color: rgba(230, 200, 76, 0.2);
  font-family: serif;
}

/* 强调词汇样式优化 */
.highlight-word {
  font-weight: bold;
  position: relative;
  display: inline-block;
  padding: 0 3px;
  border-radius: 2px;
}

.highlight-word.good {
  color: #e67e22;
  text-shadow: 0 0 5px rgba(230, 126, 34, 0.3);
  background-color: rgba(230, 126, 34, 0.1);
}

.highlight-word.neutral {
  color: var(--primary-color);
  text-shadow: 0 0 5px rgba(230, 200, 76, 0.3);
  background-color: rgba(230, 200, 76, 0.1);
}

.highlight-word.bad {
  color: #95a5a6;
  text-shadow: 0 0 5px rgba(149, 165, 166, 0.3);
  background-color: rgba(149, 165, 166, 0.1);
}

/* 分析文本样式 */
.analysis-text {
  font-size: 16px;
  line-height: 1.8;
  color: #e2c44b; /* 金黄色文本 */
  margin: 15px 0;
  text-align: justify;
  padding: 0 20px;
  white-space: pre-line; /* 保留换行符 */
}

/* Markdown样式 */
.analysis-text h1, 
.analysis-text h2, 
.analysis-text h3, 
.analysis-text h4 {
  color: #660;
  margin: 20px 0 10px;
  font-weight: normal;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.6);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding-bottom: 5px;
}

.analysis-text h1 {
  font-size: 28px;
  text-align: center;
}

.analysis-text h2 {
  font-size: 22px;
  color: #882;
}

.analysis-text h3 {
  font-size: 18px;
  color: #663;
}

.analysis-text p {
  margin-bottom: 15px;
  text-indent: 2em;
}

.analysis-text ul, 
.analysis-text ol {
  margin: 15px 0;
  padding-left: 2em;
}

.analysis-text li {
  margin-bottom: 8px;
}

.analysis-text blockquote {
  margin: 15px 0;
  padding: 10px 15px;
  border-left: 3px solid #aa9;
  background-color: rgba(238, 238, 221, 0.4);
  color: #554;
  font-style: italic;
}

.analysis-text code {
  background-color: rgba(238, 238, 221, 0.6);
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
}

.analysis-text pre {
  background-color: rgba(238, 238, 221, 0.4);
  padding: 10px;
  border-radius: 5px;
  overflow-x: auto;
  margin: 15px 0;
}

.analysis-text pre code {
  background-color: transparent;
  padding: 0;
}

.analysis-text a {
  color: #884;
  text-decoration: none;
  border-bottom: 1px dashed #aa9;
}

.analysis-text a:hover {
  color: #a95;
  border-bottom: 1px solid #ba8;
}

.analysis-text table {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
  background-color: rgba(255, 255, 250, 0.5);
}

.analysis-text th, 
.analysis-text td {
  padding: 8px 10px;
  border: 1px solid #ddc;
  text-align: left;
}

.analysis-text th {
  background-color: rgba(221, 221, 187, 0.6);
  font-weight: bold;
  color: #554;
}

.analysis-text tr:nth-child(even) {
  background-color: rgba(249, 249, 237, 0.5);
}

/* 修饰性元素 */
.highlight-word {
  display: inline-block;
  font-weight: bold;
  padding: 0 3px;
  border-radius: 3px;
}

.highlight-word.good {
  color: #c40;
  background-color: rgba(255, 215, 0, 0.15);
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.6);
}

.highlight-word.neutral {
  color: #474;
  background-color: rgba(120, 160, 120, 0.1);
}

.highlight-word.bad {
  color: #833;
  background-color: rgba(180, 60, 60, 0.08);
}

/* 卷轴内容样式 */
.silk-content {
  line-height: 1.8;
  position: relative;
  white-space: pre-line; /* 保留换行符 */
}
</style> 

<style>
/* 原有的样式代码保持不变 */

/* 确保Markdown内容在卷轴中正确显示 */
.analysis-text.silk-content :deep(p) {
  text-indent: 2em;
  margin-bottom: 1em;
  color: #e2c44b;
}

.analysis-text.silk-content :deep(h1),
.analysis-text.silk-content :deep(h2),
.analysis-text.silk-content :deep(h3),
.analysis-text.silk-content :deep(h4) {
  color: #660;
  margin: 1.2em 0 0.8em;
  font-weight: normal;
  letter-spacing: 0.05em;
}

.analysis-text.silk-content :deep(ul),
.analysis-text.silk-content :deep(ol) {
  margin: 1em 0 1em 1em;
  padding-left: 1.5em;
}

.analysis-text.silk-content :deep(blockquote) {
  margin: 1em 0;
  padding: 0.5em 1em;
  border-left: 3px solid #aa9;
  background: rgba(238, 238, 221, 0.3);
  font-style: italic;
}

.analysis-text.silk-content :deep(code) {
  background: rgba(238, 238, 221, 0.5);
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.analysis-text.silk-content :deep(pre) {
  margin: 1em 0;
  padding: 1em;
  background: rgba(238, 238, 221, 0.3);
  border-radius: 4px;
  overflow-x: auto;
}

.analysis-text.silk-content :deep(pre code) {
  background: transparent;
  padding: 0;
  font-size: 0.95em;
}

.analysis-text.silk-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1.5em 0;
}

.analysis-text.silk-content :deep(th),
.analysis-text.silk-content :deep(td) {
  border: 1px solid #ddc;
  padding: 0.5em 0.8em;
  text-align: left;
}

.analysis-text.silk-content :deep(th) {
  background: rgba(221, 221, 187, 0.4);
  font-weight: bold;
}

.analysis-text.silk-content :deep(tr:nth-child(even)) {
  background: rgba(245, 245, 235, 0.4);
}

.analysis-text.silk-content :deep(a) {
  color: #886;
  text-decoration: none;
  border-bottom: 1px dotted #aa9;
  transition: all 0.3s;
}

.analysis-text.silk-content :deep(a:hover) {
  color: #a95;
  border-bottom-style: solid;
}

/* 确保强调的关键词样式优先级更高 */
.highlight-word.good,
.highlight-word.neutral,
.highlight-word.bad {
  display: inline-block !important;
  font-weight: bold !important;
  padding: 0 3px !important;
  border-radius: 3px !important;
}

.highlight-word.good {
  color: #c40 !important;
  background-color: rgba(255, 215, 0, 0.15) !important;
}

.highlight-word.neutral {
  color: #474 !important;
  background-color: rgba(120, 160, 120, 0.1) !important;
}

.highlight-word.bad {
  color: #833 !important;
  background-color: rgba(180, 60, 60, 0.08) !important;
}

/* 图像上传相关样式 */
.image-upload-container {
  background-color: #222;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #333;
}

.upload-area {
  border: 2px dashed #444;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-area:hover {
  border-color: var(--primary-color);
  background-color: rgba(230, 200, 76, 0.05);
}

.upload-area.drag-over {
  border-color: var(--primary-color);
  background-color: rgba(230, 200, 76, 0.1);
  transform: scale(1.02);
}

.upload-area.has-file {
  border-color: #666;
  background-color: rgba(51, 51, 51, 0.3);
}

.upload-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.upload-icon {
  font-size: 3rem;
  color: #666;
  transition: color 0.3s ease;
}

.upload-area:hover .upload-icon {
  color: var(--primary-color);
}

.upload-text p {
  margin: 5px 0;
  color: #aaa;
  font-size: 1rem;
}

.upload-hint {
  font-size: 0.9rem !important;
  color: #777 !important;
}

.image-preview-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.image-preview {
  max-width: 100%;
  max-height: 150px;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  object-fit: contain;
}

.image-info {
  text-align: center;
}

.file-name {
  color: #fff;
  font-weight: bold;
  margin: 5px 0;
  font-size: 0.9rem;
}

.file-size {
  color: #aaa;
  font-size: 0.8rem;
  margin: 0;
}

.remove-file-btn {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #e74c3c;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(231, 76, 60, 0.3);
}

.remove-file-btn:hover {
  background-color: #c0392b;
  transform: scale(1.1);
}

.upload-description {
  margin-top: 15px;
  padding: 15px;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  border-left: 3px solid var(--primary-color);
}

.upload-description p {
  margin: 0;
  color: #aaa;
  font-size: 0.9rem;
  line-height: 1.5;
  text-align: center;
}
</style> 

<style>
.loading-yao-item.loading-highlight .loading-yang-yao,
.loading-yao-item.loading-highlight .loading-yin-left,
.loading-yao-item.loading-highlight .loading-yin-right {
  background-color: #f0c14b;
  animation: glowing 1.5s infinite alternate;
}

@keyframes glowing {
  0% {
    box-shadow: 0 0 5px 2px rgba(240, 193, 75, 0.5);
  }
  100% {
    box-shadow: 0 0 10px 4px rgba(240, 193, 75, 0.8);
  }
}
</style> 
<template>
  <div class="main-container-top">
    <!-- 顶部导航栏 -->
    <div class="top-nav">
      <div class="back-button">
        项目评估：
      </div>
      <div class="project-info" v-if="state.pdfSrc">
        <span class="file-name">名字：{{ state.pdfSrc }}</span>
        <el-tag size="small" effect="plain" class="file-tag">PDF</el-tag>
        <div class="divider"></div>

      </div>

      <div class="nav-tabs">
        <div class="model-info">
          <el-icon class="model-icon">
            <Connection />
          </el-icon>
          <span>当前 AI 模型: </span>
          <el-tag type="success" size="small" effect="dark" class="ai-model-tag">
            <i class="ai-icon"></i>
            {{ selectedModelName }}
          </el-tag>
        </div>
      </div>

    </div>
    <!-- 左边容器 -->
    <div class="main-container" style="margin: 0;">
      <div :class="['left-container', { 'left-container-hidden': isLeftContainerHidden }]">
        <!-- 原有的上传按钮和 PDF 容器 -->
        <div v-if="!state.pdfPages">
          <!-- 添加 el-upload 拖拽上传组件 -->
          <el-upload v-if="!isLeftContainerHidden" class="upload-demo" action="#" :auto-upload="false" :on-change="handleFileChange" :limit="1"
            :on-exceed="handleExceed" :on-remove="handleRemove" drag>
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
          </el-upload>
        </div>
        <div v-else class="pdf-top">
          <div id="pdf-container" class="pdf-container-wrapper" v-loading="pdfRendering"
          element-loading-text="PDF渲染中..." element-loading-spinner="el-icon-loading"
          element-loading-background="rgba(255, 255, 255, 0.9)">
          <div v-for="page in state.pdfPages" :key="page" class="pdf-page-container">
            <canvas :id="`pdfCanvas${page}`" style="border-bottom:1px solid #d4d2d2" />
            <div :id="`textLayer${page}`" class="text-layer"></div>
          </div>
        </div>
        </div>
      
        <div class="collapse-button" @click="toggleLeftContainer">
          <el-icon>
            <ArrowLeft v-if="!isLeftContainerHidden" />
            <ArrowRight v-else />
          </el-icon>
        </div>
      </div>
   
      <!-- 右边容器 -->
      <div class="right-container" :class="{ 'right-container-expanded': isLeftContainerHidden }">
        <!-- 右边上半部分 -->
        <div class="right-top"
          style="display: flex; justify-content: space-between; flex-direction: column;">
          <!-- 使用 flex 布局让按钮自适应 -->
          <div class="button-container">
            <!-- 添加 Element Plus 上传按钮 -->
            <el-upload action="#" :show-file-list="false" :auto-upload="false" :on-change="handleFileChange" :limit="1"
              :on-exceed="handleExceed" :on-remove="handleRemove" type="success" class="custom-upload">
              <el-button type="primary" class="custom-upload-button">
                上传PDF
              </el-button>
            </el-upload>
            <!-- 可以添加更多按钮 -->
            <!-- 添加配置 AI 模型的按钮 -->
            <el-button type="primary" @click="dialogVisible = true">配置 AI 模型</el-button>
            <!-- 修改按钮，添加 :loading 属性 -->
            <el-button type="primary" @click="submitPrompt" :loading="loading">开始生成</el-button>
            <el-progress v-if="loading" :percentage="progress" style="width: 100%; margin-top: 10px;" />
          </div>
        </div>
        <!-- 右边下半部分 -->
        <div class="right-bottom">
          <!-- 这里可以添加右边下半部分的自定义内容 -->
          <PdfEditTable ref="pdfEditTableRef" :pdfDealTableData="state.tableData" :submitLoading="loading"
            :highlight-row-ids="selectedRowIds" :paramType="paramType">
          </PdfEditTable>
        </div>
      </div>
    </div>
    <!-- 添加对话框 -->
    <el-dialog v-model="dialogVisible" title="配置 AI 模型" width="1200">
      <el-form>
        <!-- 选择模型 -->
        <el-form-item label="选择模型：">
          <el-select v-model="selectedModel" placeholder="请选择模型">
            <el-option v-for="(config, key) in apiConfigs" :key="config.key" :label="config.name"
              :value="config.value"></el-option>
          </el-select>
        </el-form-item>
        <!-- 二选一的单选框 -->
        <el-form-item label="参数设置：">
          <el-radio-group v-model="paramType">
            <el-radio v-for="option in paramOptions" :key="option.value" :value="option.value">{{ option.label
              }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <!-- 自定义参数文本框 -->
        <el-form-item v-if="paramType === 'custom'" label="自定义参数">
          <el-input type="textarea" v-model="customParams" placeholder="请输入自定义参数" :rows="20"></el-input>
          <!-- 新增恢复默认参数按钮 -->
          <div style="margin-top: 10px; text-align: right;">
            <el-button type="primary" @click="resetCustomParams">恢复默认参数</el-button>
          </div>
        </el-form-item>
        <!-- 新增高级配置 -->
        <el-form-item>
          <el-collapse>
            <el-collapse-item title="高级配置">
              <el-form-item label="Token切片">
                <div class="demo-progress">
                  <el-progress :percentage="tokenPercentage" :color="tokenColors" :format="format" />
                  <div style="margin-top: 10px;">
                    <el-button-group>
                      <el-button :icon="Minus" @click="decreaseToken" />
                      <el-button :icon="Plus" @click="increaseToken" />
                    </el-button-group>
                  </div>
                  <div class="token-description" style="margin-top: 10px; color: #606266; font-size: 14px;">
                    Token数量影响输出结果的精细程度：数量越小结果相对精细化，时间会慢；数量越大可以处理更长的文本处理时间快，但可能会降低精细度。
                  </div>
                </div>
              </el-form-item>
            </el-collapse-item>
          </el-collapse>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveConfig">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { onMounted, reactive, nextTick, ref } from "vue";
import * as PDF from "pdfjs-dist/legacy/build/pdf.mjs";
import aiAxios, { apiConfigs, ifpugFunctionPointEvaluationPrompt, customizeEvaluationPrompt, ifpugOtherEvaluationPrompt,commonJsonOutputFormat ,paramOptionsConfig} from './pdfEditTable/config';
import PdfEditTable from './pdfEditTable/index.vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { data2, data3 } from './pdfEditTable/mock';
// import { TextLayerBuilder } from 'pdfjs-dist/legacy/web/pdf_viewer.mjs';
import { debounce } from 'lodash';
import { Plus, Minus, ArrowLeft,ArrowRight } from '@element-plus/icons-vue'
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker?url';



const pdfEditTableRef = ref(null);


PDF.GlobalWorkerOptions.workerSrc = workerUrl

const state = reactive({
  pdfPath: '',
  pdfPages: '',
  pdfWidth: '',
  pdfSrc: '',
  pdfScale: 1.0,
  pdfValue: '',
  pdfAllText: '', // 用于存储所有页面的文本内容的字符串
  tableData: [], // 用于存储表格数据的数组
  selectedRow: null, // 用于存储选中的行数据
  selectedCell: null, // 用于存储选中的单元格数据 
});
// 定义token配置选项和对应的颜色
const tokenConfig = {
  2048: { color: '#f56c6c', percentage: 25 },
  4096: { color: '#e6a23c', percentage: 50 },
  8192: { color: '#5cb87a', percentage: 75 },
  16384: { color: '#6f7ad3', percentage: 100 }
};
// 添加PDF渲染状态变量
const pdfRendering = ref(false);

const tokenOptions = Object.keys(tokenConfig).map(Number);
const tokenColors = Object.values(tokenConfig).map(({ color, percentage }) => ({ color, percentage }));

// 修改token配置相关状态
const tokenPercentage = ref(100);
let currentTokenIndex = 3; // 默认16384
const loading = ref(false);
const progress = ref(0); // 新增进度条变量
let pdfDoc = null;
const redCharPositions = ref([]);
const selectedRowIds = ref([]);
// 控制左侧面板折叠状态
const isLeftContainerHidden = ref(false);

// 切换左侧面板折叠状态
const toggleLeftContainer = () => {
  isLeftContainerHidden.value = !isLeftContainerHidden.value;
};
// 增加token配置
const increaseToken = () => {
  if (currentTokenIndex < tokenOptions.length - 1) {
    currentTokenIndex++;
    tokenPercentage.value = tokenConfig[tokenOptions[currentTokenIndex]].percentage;
  }
};

// 减少token配置
const decreaseToken = () => {
  if (currentTokenIndex > 0) {
    currentTokenIndex--;
    tokenPercentage.value = tokenConfig[tokenOptions[currentTokenIndex]].percentage;
  }
};

// 获取当前选择的token值
const getCurrentToken = () => tokenOptions[currentTokenIndex];

const format = (percentage) => `${getCurrentToken()} Token`;
// Handle file upload change event
const handleFileChange = (file) => {
  let actualFile;
  if (file && file.raw instanceof File) {
    actualFile = file.raw;
  } else if (file instanceof File) {
    actualFile = file;
  } else {
    return;
  }
  handleRemove();
  console.log('File has changed:', actualFile);
  state.pdfSrc = actualFile.name;
  const fileReader = new FileReader();
  fileReader.onload = (e) => {

    state.pdfPath = e.target.result;
    loadFile(state.pdfPath);
  };
  fileReader.readAsDataURL(actualFile);
};

// 处理超出限制事件
const handleExceed = (files, fileList) => {
  console.log('每次只能上传一个文件，新文件将覆盖现有文件。');
  // 使用 splice 方法清空 fileList
  if (fileList.length > 0) {
    fileList.splice(0, fileList.length);
  }
  // 检查是否有新文件
  if (files.length > 0) {
    handleFileChange(files[0]);
  }
};

// 处理文件移除事件
const handleRemove = () => {
  // 清空 PDF 相关状态
  state.pdfPath = '';
  state.pdfPages = '';
  state.pdfWidth = '';
  state.pdfSrc = '';
  state.pdfValue = '';
  state.pdfAllText = ''
  pdfDoc = null;
};

onMounted(() => {
  // 调试代码
  window.vm = this
  console.log('表格实例：', pdfEditTableRef.value?.tableRef)
});

function loadFile(url) {
  PDF.getDocument({
    url,
    // cMapUrl: new URL('pdfjs-dist/cmaps/', import.meta.url).href,
    // cMapPacked: true
  }).promise.then((p) => {
    pdfDoc = p;
    const { numPages } = p;
    state.pdfPages = numPages;
    nextTick(() => {
      // 开始渲染前设置加载状态为true
      pdfRendering.value = true;
      renderPage(1);
    });
  }).catch((error) => {
    console.error('加载 PDF 文件出错:', error);
    // 出错时也要关闭加载状态
    pdfRendering.value = false;
  });
}

async function renderPage(num) {
  const page = await pdfDoc.getPage(num);
  const canvas = document.getElementById(`pdfCanvas${num}`);
  if (!canvas) {
    console.error(`Canvas element with ID pdfCanvas${num} not found.`);
    return;
  }
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const bsr = ctx.webkitBackingStorePixelRatio
    || ctx.mozBackingStorePixelRatio
    || ctx.msBackingStorePixelRatio
    || ctx.oBackingStorePixelRatio
    || ctx.backingStorePixelRatio
    || 1;
  const ratio = dpr / bsr;
  const viewport = page.getViewport({ scale: state.pdfScale });

  canvas.width = viewport.width * ratio;
  canvas.height = viewport.height * ratio;
  canvas.style.width = '100%';
  canvas.style.height = 'auto';
  state.pdfWidth = `${viewport.width}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 修改图片渲染部分
  const ops = await page.getOperatorList();
  for (let i = 0; i < ops.fnArray.length; i++) {
    if (ops.fnArray[i] === PDF.OPS.paintImageXObject) {
      const imageName = ops.argsArray[i][0];
      try {
        // 使用正确的资源获取方式
        const xobject = await new Promise((resolve, reject) => {
          page.objs.get(imageName, (obj) => {
            obj ? resolve(obj) : reject(new Error('Image not found'));
          });
        });

        if (xobject?.bitmap) {
          const scale = state.pdfScale / 4; // 调整为5倍缩小
          const drawWidth = xobject.width * scale;
          const drawHeight = xobject.height * scale;

          // 直接使用原始尺寸和位置计算（移除旋转处理）
          const x = (viewport.width - drawWidth) / 2;
          const y = (viewport.height - drawHeight) / 2;

          ctx.drawImage(
            xobject.bitmap,
            x,
            y,
            drawWidth,
            drawHeight
          );
        }
      } catch (error) {
        console.error(`渲染图片 ${imageName} 失败:`, error);
      }
    }
  }
  // 保留原有文本高亮逻辑
  const textContent = await page.getTextContent();
  const textItems = textContent.items;
  const fullText = textItems.map(item => item.str).join('');
  state.pdfAllText += fullText
  redCharPositions.value = [];
  state.pdfValue = '';

  const highlightRanges = [];
  for (const item of state.tableData) {
    const searchText = item.description;
    let startIndex = 0;
    while ((startIndex = fullText.indexOf(searchText, startIndex)) !== -1) {
      const endIndex = startIndex + searchText.length;
      highlightRanges.push({ start: startIndex, end: endIndex });
      startIndex = endIndex;
    }
  }


  // 新增高亮区域数据
  const highlightAreas = ref([]);

  // 修改文本渲染部分
  for (const item of textItems) {
    const { str, transform } = item;
    const fontSize = transform[3];
    const x = transform[4];
    const y = transform[5];
    const newY = viewport.height - y;

    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      const currentIndex = state.pdfValue.length;
      state.pdfValue += char;

      // 修改高亮文本匹配逻辑
      let highlightText = '';
      for (const range of highlightRanges) {
        if (currentIndex >= range.start && currentIndex < range.end) {
          // 获取完整的高亮文本
          highlightText = state.tableData.find(
            d => d.description === fullText.substring(range.start, range.end)
          )?.description || '';
          break;
        }
      }

      if (highlightText) {
        const charWidth = ctx.measureText(char).width;
        highlightAreas.value.push({
          x: x + ctx.measureText(str.slice(0, i)).width,
          y: newY - fontSize,
          width: charWidth,
          height: fontSize,
          text: highlightText // 始终使用完整的高亮文本
        });
      }

      ctx.fillStyle = highlightText ? 'red' : 'black';
      ctx.font = `${fontSize}px sans-serif`;
      ctx.fillText(char, x + ctx.measureText(str.slice(0, i)).width, newY);
    }
  }

  // 修改鼠标移动处理函数（仅控制光标）
  const handleMouseMove = debounce((event) => {
    const canvas = event.target;
    const rect = canvas.getBoundingClientRect();
    const viewportX = (event.clientX - rect.left) * (canvas.width / canvas.offsetWidth);
    const viewportY = (event.clientY - rect.top) * (canvas.height / canvas.offsetHeight);

    const ratio = state.pdfScale * window.devicePixelRatio;
    const x = viewportX / ratio;
    const y = viewportY / ratio;

    const found = highlightAreas.value.find(area =>
      x >= area.x - 2 && x <= area.x + area.width + 2 &&
      y >= area.y - 2 && y <= area.y + area.height + 2
    );

    if (found) {
      canvas.parentElement.style.cursor = 'pointer';
    } else {
      canvas.parentElement.style.cursor = 'default';
    }
  }, 100);

  // 新增点击事件处理函数
  const handleCanvasClick = (event) => {
    const canvas = event.target;
    const rect = canvas.getBoundingClientRect();
    const viewportX = (event.clientX - rect.left) * (canvas.width / canvas.offsetWidth);
    const viewportY = (event.clientY - rect.top) * (canvas.height / canvas.offsetHeight);

    const ratio = state.pdfScale * window.devicePixelRatio;
    const x = viewportX / ratio;
    const y = viewportY / ratio;

    const found = highlightAreas.value.find(area =>
      x >= area.x - 2 && x <= area.x + area.width + 2 &&
      y >= area.y - 2 && y <= area.y + area.height + 2
    );

    if (found) {
      // 查找所有匹配的表格行
      const matchedRows = state.tableData.filter(
        item => item.description === found.text
      );
      if (matchedRows.length) {
        selectedRowIds.value = matchedRows.map(r => String(r.id));
      }
    }
  };

  // 在canvas元素上绑定事件（修改这部分）
  if (canvas) {
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleCanvasClick); // 新增点击事件监听
  }



  if (state.pdfPages > num) {
    // 确保下一页的图片也能正确渲染
    await renderPage(num + 1);
  } else {
    // 所有页面渲染完成后，关闭加载状态
    pdfRendering.value = false;
  }
}



// 新增对话框相关响应式数据和方法
const dialogVisible = ref(false);
const selectedModel = ref('doubao-1-5-pro-32k-250115');
const selectedModelName = ref(apiConfigs['doubao-1-5-pro-32k-250115'].name);

const paramType = ref('default1');
const paramOptions = ref(paramOptionsConfig);
const customParams = ref('');

customParams.value = localStorage.getItem('aiCustomParams') || customizeEvaluationPrompt;

const saveConfig = () => {
  // 根据选择的模型值反推模型名称
  const selectedModelConfig = Object.values(apiConfigs).find(config => config.value === selectedModel.value);
  const modelName = selectedModelConfig ? selectedModelConfig.name : '未知模型';
  selectedModelName.value = modelName;
  console.log('保存配置:', {
    selectedModel: selectedModel.value,
    paramType: paramType.value,
    customParams: customParams.value
  });
  localStorage.setItem('aiCustomParams', customParams.value);
  dialogVisible.value = false;
};

// 新增恢复默认参数方法
const resetCustomParams = () => {
  customParams.value = customizeEvaluationPrompt;
  localStorage.setItem('aiCustomParams', customParams.value);
  ElMessage.success('已恢复默认参数');
};

const submitPrompt = async () => {
  // 新增PDF文件校验
  if (!state.pdfSrc) {
    ElMessage.warning('请先上传PDF文件');
    return;
  }

  loading.value = true;
  progress.value = 0; // 开始时重置进度
  const t = getCurrentToken()
  try {
    // 模拟进度条递增（如有后端进度接口可替换为轮询）
    const timer = setInterval(() => {
      if (progress.value < 95) {
        progress.value += Math.floor(Math.random() * 5) + 1;
      } else if (progress.value < 99) {
        // 当进度接近99时，增长更缓慢
        progress.value += Math.random() < 0.3 ? 1 : 0;
      }
      // 确保进度值不超过99
      if (progress.value > 99) {
        progress.value = 99;
      }
    }, 20000);
    console.log(state.pdfAllText);
    if (paramType.value == 'default1') {
      const text = await aiAxios(selectedModel.value, state.pdfAllText + ',' + ifpugFunctionPointEvaluationPrompt, t);
      state.tableData = text;
    }else if (paramType.value == 'default2') {
      const text = await aiAxios(selectedModel.value, state.pdfAllText + ',' + ifpugOtherEvaluationPrompt, t);
      state.tableData = text;
    }else {
      const text = await aiAxios(selectedModel.value, state.pdfAllText + '，' + customParams.value + commonJsonOutputFormat);
      state.tableData = text;
    }

    if (pdfDoc) {
      await renderPage(1);
    }
    progress.value = 100; // 生成完成
    clearInterval(timer);
  } catch (error) {
    console.error('生成过程出错:', error);
    progress.value = 0;
  } finally {
    loading.value = false;
  }
};




</script>

<style scoped>
.main-container-top {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 84px);
  background-color: #f5f7fa;
  padding: 20px;
  
}


/* 顶部导航栏样式 */
.top-nav {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
}

.back-button {
  display: flex;
  align-items: center;
  margin-right: 20px;
  font-size: 14px;
  cursor: pointer;
}

.project-info {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #606266;
}

.tab-item.active {
  color: #409eff;
  font-weight: bold;
}


.main-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.left-container {
  height: 100%;
  background-color: #fff;
  border-right: 1px solid #e4e7ed;
  width: 500px;
  background: #eaeaea;
  flex-shrink: 0;
  background-color: #fff;
  position: relative;
  /* 确保这个属性存在 */
  will-change: width;
  transition: width 0.3s ease;
}

.right-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;

}

.right-top {
  padding: 10px;
  flex-shrink: 0;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  background-color: #fff;
}

.right-bottom {
  flex: 1;
  overflow: hidden;
  height: 100%;
  /* 修改：从auto改为hidden，防止右下方区域出现滚动条 */
}

/* 新增按钮容器样式 */
.button-container {
  display: flex;
  flex-wrap: wrap;
  /* 允许按钮换行 */
  gap: 10px;
  /* 设置按钮之间的间距 */
  align-items: center;
  /* 垂直居中对齐 */
}




#pdf-container {
  width: 100%;
  background: #fff;
}

.upload-demo {
  width: 100%;
  height: 600px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.upload-demo .el-upload-dragger {
  border: none;
}

/* 自定义 el-upload 样式 */
.custom-upload {
  display: flex;
  align-items: flex-start;
  flex-direction: column;
}

/* 自定义 el-button 样式 */
.custom-upload-button {
  line-height: normal;
  /* 重置行高 */
}

.info-container {
  display: flex;
  flex-direction: column;
  /* 垂直布局 */
  align-items: flex-start;
  /* 靠左对齐 */
  width: 100%;
  margin-bottom: 10px;
  padding: 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.info-item {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
  /* 禁止换行 */
  overflow: hidden;
  /* 隐藏溢出内容 */
  text-overflow: ellipsis;
  /* 溢出内容用省略号表示 */
  width: 100%;
  /* 占满父容器宽度 */
}

.table-container {
  overflow-y: scroll;
}

.demo-progress .el-progress--line {
  width: 350px;
  margin-top: 15px;
}

.demo-progress {
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.el-collapse-item {
  margin-bottom: 10px;
}

.el-collapse {
  border: none;
}

/* 修改折叠面板头部边框样式 */
:deep(.el-collapse-item__header) {
  border-bottom: none;
}

/* 如果上面的方式不起作用，可以尝试使用更高的优先级 */
:deep(.el-collapse-item) .el-collapse-item__header {
  border-bottom: none !important;
}

/* 同时确保内容区域的边框样式也被正确设置 */
:deep(.el-collapse-item__wrap) {
  border-bottom: none;
}

.pdf-container-wrapper {
  position: relative;
  width: 100%;
  min-height: 200px;
  /* 确保容器有足够的高度显示加载动画 */
  background: #fff;
}

/* 添加PDF加载蒙版样式 */
.pdf-loading-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.7);
}

/* 添加分界线样式 */
.divider {
  height: 24px;
  width: 1px;
  background-color: #dcdfe6;
  margin: 0 15px;
}

/* AI模型标签样式 */
.ai-model-tag {
  background: linear-gradient(90deg, #13c2c2 0%, #1890ff 100%);
  border: none;
  padding: 4px 8px;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(24, 144, 255, 0.3);
  display: inline-flex;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.ai-model-tag::before {
  content: "";
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.3));
  transform: rotate(45deg);
  animation: shine 3s infinite;
}

.ai-icon {
  display: inline-block;
  width: 12px;
  height: 12px;
  margin-right: 4px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  position: relative;
}

.ai-icon::before,
.ai-icon::after {
  content: "";
  position: absolute;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
}

.ai-icon::before {
  width: 6px;
  height: 6px;
  top: -3px;
  left: 3px;
}

.ai-icon::after {
  width: 4px;
  height: 4px;
  bottom: -2px;
  right: 0;
}

@keyframes shine {
  0% {
    transform: translateX(-100%) rotate(45deg);
  }

  100% {
    transform: translateX(100%) rotate(45deg);
  }
}

/* 折叠按钮样式 */
.collapse-button {
  position: absolute;
  right: -15px;
  top: 50%;
  transform: translateY(-50%);
  width: 30px;
  height: 30px;
  background-color: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 9; /* 确保按钮在最上层 */
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}


/* 确保按钮在折叠状态下仍然可见 */
.left-container-hidden .collapse-button {
  right: -30px;
  /* 当左侧面板折叠时，将按钮移到更右侧 */
}

/* 添加悬停效果增强可见性 */
.collapse-button:hover {
  background-color: #409EFF;
  color: white;
  box-shadow: 0 2px 12px 0 rgba(64, 158, 255, 0.5);
}

.left-container-hidden {
  width: 0;
  padding: 0;
  margin: 0;
  border: none;
}

/* 修改右侧容器样式，添加过渡效果 */
.right-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  /* transition: margin-left 0.3s ease; */
}

.right-container-expanded {
  margin-left: 0;
}
.pdf-top {
  overflow-y: scroll;
  height: 100%;
}
</style>

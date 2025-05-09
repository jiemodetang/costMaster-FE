<template>
  <div class="main-container-top">
    <!-- 左边容器 -->
    <div :class="state.pdfPages ? 'left-container' : 'left-container-drag'">
      <!-- 原有的上传按钮和 PDF 容器 -->
      <div v-if="!state.pdfPages">
        <!-- 添加 el-upload 拖拽上传组件 -->
        <el-upload class="upload-demo" action="#" :auto-upload="false" :on-change="handleFileChange" :limit="1"
          :on-exceed="handleExceed" :on-remove="handleRemove" drag>
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        </el-upload>
      </div>
      <div v-else id="pdf-container">
        <div v-for="page in state.pdfPages" :key="page" class="pdf-page-container">
          <canvas :id="`pdfCanvas${page}`" style="border-bottom:1px solid #d4d2d2" />
          <div :id="`textLayer${page}`" class="text-layer"></div>
        </div>
      </div>
    </div>
    <!-- 右边容器 -->
    <div class="right-container">
      <!-- 右边上半部分 -->
      <div class="right-top"
        style="display: flex; align-items: center; justify-content: space-between; flex-direction: column;">
        <!-- 新增显示上传文件名字和当前配置 AI 模型名字的元素 -->
        <div class="info-container">
          <span class="info-item" title="{{ state.pdfSrc }}">文件名字: {{ state.pdfSrc }}</span>
          <span class="info-item" title="{{ selectedModel.value }}">当前配置 AI 模型: {{ selectedModel }}</span>
        </div>
        <!-- 使用 flex 布局让按钮自适应 -->
        <div class="button-container">
          <!-- 添加 Element Plus 上传按钮 -->
          <el-upload action="#" :show-file-list="false" :auto-upload="false" :on-change="handleFileChange" :limit="1"
            :on-exceed="handleExceed" :on-remove="handleRemove" type="success" class="custom-upload">
            <el-button type="primary" class="custom-upload-button">
              点击上传
            </el-button>
          </el-upload>
          <!-- 可以添加更多按钮 -->
          <!-- 添加配置 AI 模型的按钮 -->
          <el-button type="primary" @click="dialogVisible = true">配置 AI 模型</el-button>
          <!-- 修改按钮，添加 :loading 属性 -->
          <el-button type="primary" @click="submitPrompt" :loading="loading">开始生成</el-button>
        </div>
      </div>
      <!-- 右边下半部分 -->
      <div class="right-bottom">
        <!-- 这里可以添加右边下半部分的自定义内容 -->
        <PdfEditTable 
          ref="pdfEditTableRef"
          :pdfDealTableData="state.tableData" 
          :submitLoading="loading" 
          :highlight-row-ids="selectedRowIds">
        </PdfEditTable>
      </div>
    </div>
    <!-- 添加对话框 -->
    <el-dialog v-model="dialogVisible" title="配置 AI 模型">
      <el-form>
        <!-- 选择模型 -->
        <el-form-item label="选择模型">
          <el-select v-model="selectedModel" placeholder="请选择模型">
            <el-option v-for="(config, key) in apiConfigs" :key="config.key" :label="config.name"
              :value="config.value"></el-option>
          </el-select>
        </el-form-item>
        <!-- 二选一的单选框 -->
        <el-form-item label="参数设置">
          <el-radio-group v-model="paramType">
            <el-radio label="default">AI 默认参数</el-radio>
            <el-radio label="custom">自定义参数</el-radio>
          </el-radio-group>
        </el-form-item>
        <!-- 自定义参数文本框 -->
        <el-form-item v-if="paramType === 'custom'" label="自定义参数">
          <el-input type="textarea" v-model="customParams" placeholder="请输入自定义参数" :rows="35"></el-input>
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
import aiAxios, { apiConfigs, ifpugFunctionPointEvaluationPrompt,customizeEvaluationPrompt } from './pdfEditTable/config';
import PdfEditTable from './pdfEditTable';
import { ElMessage, ElMessageBox } from 'element-plus';
import { data2 } from './pdfEditTable/mock';
// import { TextLayerBuilder } from 'pdfjs-dist/legacy/web/pdf_viewer.mjs';
import { debounce } from 'lodash';
const pdfEditTableRef = ref(null);
const data3 = [
  {
    id: 1,
    "subsystem": "智慧养殖大数据管理平台",
    "level1": "基础信息管理",
    "countItem": "养殖场信息管理",
    "description": "对养殖场内鸡场进行动态维护，包括名称、地址、联系人、联系电话等信息的增删改查。",
    "ufp": 5,
    "pdfTransformText": "地大数据运行中心项目"
  },
  {
    id: 2,
    "subsystem": "智慧养殖大数据管理平台",
    "level1": "基础信息管理",
    "countItem": "供应商信息管理",
    "description": "对鸡场所对应的供应商进行动态维护，包括商家信息、对应供应类型、联系人、联系电话、供应商所在地址等信息的增删改查。",
    "ufp": 5,
    "pdfTransformText": "项目建设地点"
  },
]
PDF.GlobalWorkerOptions.workerSrc = 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs';

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

let pdfDoc = null;
const redCharPositions = ref([]);
const loading = ref(false);

const selectedRowIds = ref([]);

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
    cMapUrl: 'node_modules/pdfjs-dist/cmaps/',
    cMapPacked: true
  }).promise.then((p) => {
    pdfDoc = p;
    const { numPages } = p;
    state.pdfPages = numPages;
    nextTick(() => {
      renderPage(1);
    });
  }).catch((error) => {
    console.error('加载 PDF 文件出错:', error);
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
    const searchText = item.pdfTransformText;
    let startIndex = 0;
    while ((startIndex = fullText.indexOf(searchText, startIndex)) !== -1) {
      const endIndex = startIndex + searchText.length;
      highlightRanges.push({ start: startIndex, end: endIndex });
      startIndex = endIndex;
    }
  }

  // 渲染文本

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
            d => d.pdfTransformText === fullText.substring(range.start, range.end)
          )?.pdfTransformText || '';
          break;
        }
      }
      console.log(highlightText,1);
      
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
      item => item.pdfTransformText === found.text
    );
    if (matchedRows.length) {
      selectedRowIds.value = matchedRows.map(r => String(r.id));
      // 滚动到第一个匹配行
      
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
  }
}



// 新增对话框相关响应式数据和方法
const dialogVisible = ref(false);
const selectedModel = ref('GLM-4-plus');
const paramType = ref('default');
const customParams = ref('');
customParams.value = localStorage.getItem('aiCustomParams') || ''; 

const saveConfig = () => {
  console.log('保存配置:', {
    selectedModel: selectedModel.value,
    paramType: paramType.value,
    customParams: customParams.value
  });
  localStorage.setItem('aiCustomParams', customParams.value);
  dialogVisible.value = false;
};

const submitPrompt = async () => {
  // 新增PDF文件校验
  if (!state.pdfSrc) {
    ElMessage.warning('请先上传PDF文件');
    return;
  }

  // 开始加载，设置 loading 为 true
  loading.value = true;
  try {
    if(paramType.value == 'default'){
      const text = await aiAxios(selectedModel.value, state.pdfAllText + '，' + ifpugFunctionPointEvaluationPrompt);
      state.tableData = text;
    }else{
      // console.log(customParams.value + customizeEvaluationPrompt);
      
      const text = await aiAxios(selectedModel.value, state.pdfAllText + '，' + customParams.value + customizeEvaluationPrompt);
      state.tableData = text;
    }

    if (pdfDoc) {
      await renderPage(1); // 使用await等待渲染完成
      console.log('重新渲染完成', state.tableData);
    }
  } catch (error) {
    console.error('生成过程出错:', error);
  } finally {
    // 加载结束，设置 loading 为 false
    loading.value = false;
  }
};




</script>

<style scoped>
.main-container-top {
  display: flex;
  height: 100vh;
}

.left-container {
  height: 100vh;
  overflow-y: auto;
  padding: 10px;
  width: 500px;
  margin: 20px;
  background: #eaeaea;
  flex-shrink: 0;
  /* 确保 left-container 不会被压缩 */
}

.left-container-drag {
  height: 100vh;
  overflow-y: auto;
  padding: 10px;
  width: 500px;
  margin: 20px;
  flex-shrink: 0;
  /* 确保 left-container-drag 不会被压缩 */
}

.right-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-x: auto;
  /* 支持横向滚动 */
  min-width: 0;
  /* 确保内容溢出时可以滚动 */
}

.right-top {
  height: 120px;
  padding: 10px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.right-bottom {
  flex: 1;
  border: 1px solid #ccc;
  padding: 10px;
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

.right-bottom {
  flex: 1;
  border: 1px solid #ccc;
  padding: 10px;
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
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  margin-top: 10px;
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
</style>

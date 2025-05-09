<template>
    <el-tabs v-model="activeName" class="demo-tabs" @tab-click="handleClick">
      <el-tab-pane label="造价pdf处理" name="first">
        <div class="button-group">
          <!-- 新增上传按钮 -->
          <el-button type="primary" @click="handleFileUpload">上传 PDF</el-button>
          <!-- 新增配置选择按钮 -->
          <el-button type="primary" @click="dialogVisible = true">选择配置</el-button>
          <!-- 添加 loading 属性 -->
          <el-button type="primary" @click="submitPrompt" :loading="submitLoading">
            开始生成
          </el-button>
        </div>
  
        <div class="container">
          <!-- 左侧PDF上传和预览区域 -->
          <div class="left-panel">
            <!-- 条件渲染拖拽上传区域 -->
            <div v-if="!pdfStr.length">
              <el-upload class="upload-demo" drag action="" :auto-upload="false" :on-change="handleFileChange"
                :show-file-list="false" accept=".pdf">
                <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
                <div class="el-upload__text">
                  拖拽PDF文件到此处或<em>点击上传</em>
                </div>
                <template #tip>
                  <div class="el-upload__tip">
                    请上传PDF文件，系统将自动提取文本内容
                  </div>
                </template>
              </el-upload>
            </div>
  
            <div v-if="pdfText.length > 0" class="pdf-preview">
              <div v-for="(page, index) in pdfText" :key="index" class="pdf-page">
                <!-- <h3>第 {{ index + 1 }} 页</h3> -->
                <div v-for="(item, i) in page.items" :key="i" class="text-item" :style="item.style"
                  @mouseover="highlightText($event, item)" @mouseout="resetHighlight">
                  {{ item.str }}
                </div>
              </div>
            </div>
          </div>
  
          <!-- 右侧表格区域 -->
          <div class="right-panel">
            <PdfEditTable :pdfDealTableData="pdfDealTableData" :submitLoading="submitLoading"></PdfEditTable>
          </div>
        </div>
  
        <!-- 新增配置选择弹窗 -->
        <el-dialog v-model="dialogVisible" title="选择配置" width="30%">
          <el-form>
            <el-form-item label="AI 模型:">
              <el-select v-model="selectedConfig" placeholder="请选择配置">
                <el-option label="doubao" value="doubao"></el-option>
                <el-option label="deepSeekR1" value="deepSeekR1"></el-option>
              </el-select>
            </el-form-item>
          </el-form>
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="dialogVisible = false">取消</el-button>
              <el-button type="primary" @click="confirmConfig">确定</el-button>
            </span>
          </template>
        </el-dialog>
      </el-tab-pane>
      <el-tab-pane label="next" name="s">
        test2
      </el-tab-pane>
    </el-tabs>
    <!-- 全屏加载遮罩 -->
    <div v-if="loading" class="fullscreen-loading">
      <div class="loading-content">
        <el-progress type="circle" :percentage="progress" />
        <p>正在解析PDF文件...</p>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  import { UploadFilled } from '@element-plus/icons-vue';
  import * as pdfjsLib from 'pdfjs-dist';
  import PdfEditTable from './pdfEditTable';
  import aiAxios from './pdfEditTable/config';
  import { ElMessage ,ElLoading} from 'element-plus';
  
  // 配置pdfjs worker路径
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.worker.min.js';
  
  // PDF文本数据
  const pdfText = ref([]);
  const loading = ref(false);
  const progress = ref(0);
  const activeName = ref('first');
  //pdf 文本内容
  const pdfStr = ref('');
  const pdfDealTableData = ref([]);
  
  // 新增弹窗相关数据
  const dialogVisible = ref(false);
  const selectedConfig = ref('doubao');
  
  const ai = `我需要上述内容整理为编号	子系统	一级模块	二级模块	功能项描述	功能点计数项名称	类别	UFP	重用程度	修改类型	US	备注这些列
  {
      id: 1 + index,
      subsystem: "",
      level1: "",
      level2: "",
      description: '',
      countItem: '',
      category: '',
      ufp: 5,
      reuseLevel: '',
      modifyType: '',
      us: '',
      remark: '',
    }，我要求返回的数据我只要为json格式，如下格式整理给我`;
  
  // test 
  // 新增 submitLoading 响应式变量
  const submitLoading = ref(false);
  
  const submitPrompt = async () => {
    try {
      // 开始加载，显示加载状态
      submitLoading.value = true;
      const text = await aiAxios(selectedConfig.value, pdfStr.value + '，' + ai);
  
      // 调用辅助函数提取 JSON 数据
      const jsonData = extractJsonFromText(text);
      if (jsonData) {
        console.log('解析后的 JSON 数据:', jsonData);
        pdfDealTableData.value = jsonData;
      } else {
        console.error('未找到有效的 JSON 数据');
        ElMessage.error('未找到有效的 JSON 数据');
      }
    } catch (error) {
      console.error('请求 AI 接口出错:', error);
      ElMessage.error('请求 AI 接口时出错');
    } finally {
      // 加载结束，隐藏加载状态
      submitLoading.value = false;
    }
  };
  
  // 提取 JSON 数据的辅助函数
  const extractJsonFromText = (text) => {
    // 尝试匹配 ```json ... ``` 格式
    const jsonMatch = text.match(/```json([\s\S]*?)```/);
    if (jsonMatch && jsonMatch[1]) {
      const jsonStr = jsonMatch[1].trim();
      try {
        return JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('JSON 解析错误:', parseError);
        ElMessage.error('解析 AI 返回的 JSON 数据时出错');
      }
    }
  
    // 若未匹配到，使用增强逻辑提取 JSON
    // const jsonStart = text.indexOf('{');
    // const jsonEnd = text.lastIndexOf('}');
    // if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    //   const jsonStr = text.slice(jsonStart, jsonEnd + 1);
    //   try {
    //     return JSON.parse(jsonStr);
    //   } catch (parseError) {
    //     console.error('JSON 解析错误:', parseError);
    //     ElMessage.error('解析 AI 返回的 JSON 数据时出错');
    //   }
    // }
  
    // 尝试匹配数组格式的 JSON
    const arrayStart = text.indexOf('[');
    const arrayEnd = text.lastIndexOf(']');
    if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
      const jsonStr = text.slice(arrayStart, arrayEnd + 1);
      try {
        return JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('JSON 解析错误:', parseError);
        ElMessage.error('解析 AI 返回的 JSON 数据时出错');
      }
    }
  
    return null;
  };
  
  // 处理文件上传
  const handleFileChange = async (file) => {
    if (file.raw.type !== 'application/pdf') {
      ElMessage.error('请上传PDF文件');
      return;
    }
  
    try {
      loading.value = true;
      progress.value = 0;
  
      const arrayBuffer = await file.raw.arrayBuffer();
      await extractPdfText(arrayBuffer);
    } catch (error) {
      console.error('PDF处理错误:', error);
      ElMessage.error('处理PDF文件时出错');
    } finally {
      loading.value = false;
    }
  };
  
  // 新增手动触发文件上传方法
  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        handleFileChange({ raw: file });
      }
    });
    input.click();
  };
  
  const handleClick = (tab, event) => {
    console.log(tab, event);
  };
  
  // 提取PDF文本内容
  const extractPdfText = async (arrayBuffer) => {
    pdfText.value = [];
  
    // 加载PDF文档
    const pdf = await pdfjsLib.getDocument({
      data: arrayBuffer,
      // 启用PDF文本内容提取
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/cmaps/',
      // cMapPacked: true,
    }).promise;
  
    let str = '';
  
    // 逐页提取文本
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent({
        normalizeWhitespace: true,
        disableCombineTextItems: false
      });
  
      // 更新进度
      progress.value = Math.round((i / pdf.numPages) * 100);
  
      // 处理文本项
      const items = textContent.items.map(item => {
        // 计算字体大小
        const fontSize = Math.round(item.transform[0]);
  
        const scaledViewport = page.getViewport({ scale: 1.0 });
        const top = scaledViewport.height - item.transform[5];
        str += item.str;
        return {
          str: item.str,
          style: {
            fontSize: `${fontSize}px`,
            left: `${item.transform[4]}px`,
            top: `${top}px`,
            fontFamily: item.fontName,
            width: item.width,
          }
        };
      });
      console.log(pdfText);
        
      pdfText.value.push({
        pageNum: i,
        items: items
      });
    }
    pdfStr.value = str;
  };
  
  // 文本高亮效果
  const highlightText = (event, item) => {
    event.target.style.backgroundColor = '#ffeb3b';
    event.target.style.color = '#000';
    event.target.style.cursor = 'pointer';
  };
  
  // 重置高亮
  const resetHighlight = (event) => {
    event.target.style.backgroundColor = '';
    event.target.style.color = '';
  };
  
  // 新增确认配置方法
  const confirmConfig = () => {
    dialogVisible.value = false;
    ElMessage.success(`已选择配置: ${selectedConfig.value}`);
  };
  </script>
  
  <style scoped>
  .container {
    display: flex;
    height: 100vh;
    width: 100%;
  }
  
  .right-panel {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    height: 100%;
    box-sizing: border-box;
  }
  
  .left-panel {
    border-right: 1px solid #ebeef5;
    padding: 20px;
    overflow-y: auto;
    height: 100%;
    box-sizing: border-box;
    width: 800px;
  }
  
  .upload-demo {
    margin-bottom: 20px;
  }
  
  .pdf-preview {
    margin-top: 20px;
    position: relative;
    background: #f9f9f9;
  }
  
  .pdf-page {
    margin-bottom: 30px;
    padding: 15px;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    background-color: #fff;
    position: relative;
    min-height: 842px;
    width: 80%;
    margin: 0 auto;
    margin-bottom: 20px;
  }
  
  .text-item {
    position: absolute;
    white-space: pre;
    line-height: 1.2;
    margin: 2px 0;
    transition: all 0.2s;
  }
  
  .table-header {
    margin-bottom: 15px;
    display: flex;
    gap: 10px;
  }
  
  .demo-tabs>.el-tabs__content {
    padding: 32px;
    color: #6b778c;
    font-size: 32px;
    font-weight: 600;
  }
  
  .demo-tabs {
    padding: 20px;
  }
  
  .button-group {
    margin-bottom: 20px;
    display: flex;
    gap: 10px;
  }
  
  /* 全局加载样式 */
  .global-loading-container {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  }
  
  /* 遮罩层样式 */
  .loading-mask {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.3);
  }
  
  /* 加载内容样式 */
  .global-loading-container > *:not(.loading-mask) {
    position: relative;
    background-color: rgba(255, 255, 255, 0.9);
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    z-index: 1;
  }
  
  /* 全屏加载遮罩样式 */
  .fullscreen-loading {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
  }
  
  /* 加载内容样式 */
  .loading-content {
    background-color: transparent;
    padding: 20px;
    border-radius: 8px;
    /* box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); */
    text-align: center;
    color: #fff;
  }
  
  /* 将 el-progress__text 文字设置为白色 */
  :deep(.el-progress__text) {
    color: #fff;
  }
  </style>
  
  
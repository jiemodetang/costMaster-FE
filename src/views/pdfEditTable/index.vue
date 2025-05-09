<template>
  <div class="table-container">
    <!-- 导出按钮 -->
    <div class="export-btn">
      <el-button type="primary" @click="exportTable">导出数据</el-button>
    </div>
    <!-- 搜索框 -->
    <div class="search-box">
      <el-input v-model="searchText" placeholder="输入一级或二级模块名称搜索" clearable @input="findMatches" style="width: 400px; margin-bottom: 20px;">
        <template #prefix>
          <el-icon>
            <Search />
          </el-icon>
        </template>
      </el-input>
      <!-- 移除匹配计数显示 -->
    </div>

    <!-- 使用 el-skeleton 组件，模拟表格样式 -->
    <el-skeleton :loading="submitLoading" animated>
      <template #template>
        <div class="skeleton-table">
          <!-- 模拟表头 -->
          <div class="skeleton-table-header">
            <el-skeleton-item variant="text" width="80px" />
            <el-skeleton-item variant="text" width="120px" />
            <el-skeleton-item variant="text" width="150px" />
            <el-skeleton-item variant="text" width="150px" />
            <el-skeleton-item variant="text" width="200px" />
            <el-skeleton-item variant="text" width="180px" />
            <el-skeleton-item variant="text" width="100px" />
            <el-skeleton-item variant="text" width="80px" />
            <el-skeleton-item variant="text" width="120px" />
            <el-skeleton-item variant="text" width="120px" />
            <el-skeleton-item variant="text" width="100px" />
            <el-skeleton-item variant="text" width="150px" />
            <el-skeleton-item variant="text" width="150px" />
          </div>
          <!-- 模拟表格行 -->
          <div v-for="i in 5" :key="i" class="skeleton-table-row">
            <el-skeleton-item variant="text" width="80px" />
            <el-skeleton-item variant="text" width="120px" />
            <el-skeleton-item variant="text" width="150px" />
            <el-skeleton-item variant="text" width="150px" />
            <el-skeleton-item variant="text" width="200px" />
            <el-skeleton-item variant="text" width="180px" />
            <el-skeleton-item variant="text" width="100px" />
            <el-skeleton-item variant="text" width="80px" />
            <el-skeleton-item variant="text" width="120px" />
            <el-skeleton-item variant="text" width="120px" />
            <el-skeleton-item variant="text" width="100px" />
            <el-skeleton-item variant="text" width="150px" />
            <el-skeleton-item variant="text" width="150px" />
          </div>
        </div>
      </template>
      <el-table ref="tableRef" :data="tableData" border style="width: 100%" height="100%" row-key="id"
        :row-class-name="handleHighlightRow" :span-method="mergeCells" :loading="false">
        <el-table-column prop="id" label="编号" width="80" align="center" />

      <el-table-column prop="subsystem" label="子系统" width="250">
        <template #default="scope">
          <!-- 添加 title 属性 -->
          <el-input v-if="scope.row.editing" v-model="scope.row.subsystem" size="small" title="scope.row.subsystem" />
          <span v-else :title="scope.row.subsystem">{{ scope.row.subsystem }}</span>
        </template>
      </el-table-column>

      <el-table-column prop="level1" label="一级模块" width="150">
        <template #default="scope">
          <div class="highlight-cell" :class="{ 'highlight': isCurrentMatch(scope.$index, 'level1') }">
            <!-- 添加 title 属性 -->
            <el-input v-if="scope.row.editing" v-model="scope.row.level1" size="small" :title="scope.row.level1" />
            <span v-else :title="scope.row.level1" v-html="highlightMatch(scope.row.level1, scope.$index, 'level1')"></span>
          </div>
        </template>
      </el-table-column>
   
      <el-table-column prop="level2" label="二级模块" width="150">
        <template #default="scope">
          <div class="highlight-cell" :class="{ 'highlight': isCurrentMatch(scope.$index, 'level2') }">
            <el-input v-if="scope.row.editing" v-model="scope.row.level2" size="small" />
            <span v-else v-html="highlightMatch(scope.row.level2, scope.$index, 'level2')"></span>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="description" label="功能项描述" min-width="250">
        <template #default="scope">
          <el-input v-if="scope.row.editing" v-model="scope.row.description" type="textarea"
            :autosize="{ minRows: 1, maxRows: 3 }" size="small" :title="scope.row.description" />
          <span v-else :title="scope.row.description">{{ scope.row.description }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="countItem" label="功能点计数项名称" width="180">
        <template #default="scope">
          <!-- 添加 title 属性 -->
          <el-input v-if="scope.row.editing" v-model="scope.row.countItem" size="small" :title="scope.row.countItem" />
          <span v-else :title="scope.row.countItem">{{ scope.row.countItem }}</span>
        </template>
      </el-table-column>

      <el-table-column prop="category" label="类别" width="100" align="center">
        <template #default="scope">
          <!-- 添加 title 属性 -->
          <el-select v-if="scope.row.editing" v-model="scope.row.category" size="small" :title="scope.row.category">
            <el-option 
              v-for="option in categoryOptions" 
              :key="option.value" 
              :label="option.label" 
              :value="option.value" 
            />
          </el-select>
          <el-tag v-else :type="getCategoryTagType(scope.row.category)" :title="scope.row.category">
            {{ scope.row.category }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="ufp" label="UFP" width="80" align="center">
        <template #default="scope">
          <!-- 添加 title 属性 -->
          <el-input-number v-if="scope.row.editing" v-model="scope.row.ufp" :min="0" :step="0.5" size="small"
            controls-position="right" :title="scope.row.ufp.toString()" />
          <span v-else :title="scope.row.ufp.toString()">{{ scope.row.ufp }}</span>
        </template>
      </el-table-column>

      <el-table-column prop="reuseLevel" label="重用程度" width="120" align="center">
        <template #default="scope">
          <!-- 添加 title 属性 -->
          <el-select v-if="scope.row.editing" v-model="scope.row.reuseLevel" size="small" :title="scope.row.reuseLevel">
            <el-option label="高" value="高" />
            <el-option label="中" value="中" />
            <el-option label="低" value="低" />
          </el-select>
          <el-tag v-else :type="getReuseLevelTagType(scope.row.reuseLevel)" :title="scope.row.reuseLevel">
            {{ scope.row.reuseLevel }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="modifyType" label="修改类型" width="120" align="center">
        <template #default="scope">
          <!-- 添加 title 属性 -->
          <el-select v-if="scope.row.editing" v-model="scope.row.modifyType" size="small" :title="scope.row.modifyType">
            <el-option label="新增" value="新增" />
            <el-option label="修改" value="修改" />
            <el-option label="删除" value="删除" />
          </el-select>
          <el-tag v-else :type="getModifyTypeTagType(scope.row.modifyType)" :title="scope.row.modifyType">
            {{ scope.row.modifyType }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="us" label="US" width="100" align="center">
        <template #default="scope">
          <!-- 添加 title 属性 -->
          <el-input v-if="scope.row.editing" v-model="scope.row.us" size="small" :title="scope.row.us" />
          <span v-else :title="scope.row.us">{{ scope.row.us }}</span>
        </template>
      </el-table-column>

      <el-table-column prop="remark" label="备注" min-width="150">
        <template #default="scope">
          <!-- 添加 title 属性 -->
          <el-input v-if="scope.row.editing" v-model="scope.row.remark" type="textarea"
            :autosize="{ minRows: 1, maxRows: 3 }" size="small" :title="scope.row.remark" />
          <span v-else :title="scope.row.remark">{{ scope.row.remark }}</span>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="150" align="center" fixed="right">
        <template #default="scope">
          <el-button size="small" :type="scope.row.editing ? 'success' : 'primary'" @click="toggleEdit(scope.row)">
            {{ scope.row.editing ? '保存' : '编辑' }}
          </el-button>
          <el-button size="small" type="danger" @click="deleteRow(scope.$index)" v-if="!scope.row.editing">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    </el-skeleton>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Search } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import * as XLSX from 'xlsx';
import { data1 } from './mock';
import { nextTick } from 'vue';

// 定义 props 来接收父组件传递的数据
const props = defineProps({
  pdfDealTableData: {
    type: Array,
    default: () => []
  },
  // 新增 submitLoading prop
  submitLoading: {
    type: Boolean,
    default: false
  },
  highlightRowIds: {
    type: Array,
    default: () => []
  },
  
});

// 表格引用
const tableRef = ref(null);
// 搜索文本
const searchText = ref('');
// 匹配的行索引数组
const matchedRows = ref([]);
// 当前匹配的索引
const currentMatchIndex = ref(-1);
// 当前匹配的字段
const currentMatchField = ref('');
// 用于合并单元格的数组
const spanArr = ref([]);
// 使用计算属性定义 tableData
const tableData = computed(() => {
  return props.pdfDealTableData.map(item => ({
    ...item,
    ufp: item.ufp || 35 ,
    reuseLevel:'高',
    modifyType:'新增'
  }));
});

const categoryOptions = [
  { label: 'EI', value: 'EI' },
  { label: 'EO', value: 'EO' },
  { label: 'EQ', value: 'EQ' },
  { label: 'ILF', value: 'ILF' },
  { label: 'EIF', value: 'EIF' }
];
// 计算合并单元格的数组
const calculateSpanArr = () => {
  let pos = 0;
  spanArr.value = [];
  tableData.value.forEach((row, index) => {
    if (index === 0) {
      spanArr.value.push(1);
      pos = 0;
    } else {
      // 判断当前行的一级模块是否和上一行相同
      if (row.level1 === tableData.value[index - 1].level1) {
        spanArr.value[pos] += 1;
        spanArr.value.push(0);
      } else {
        spanArr.value.push(1);
        pos = index;
      }
    }
  });
};

// 监听 tableData 变化，重新计算合并数组
watch(tableData, () => {
  calculateSpanArr();
}, { deep: true });

// 合并单元格方法
const mergeCells = ({ row, column, rowIndex, columnIndex }) => {
  if (columnIndex === 2) { // 一级模块所在列的索引为 2
    const rowSpan = spanArr.value[rowIndex];
    return {
      rowspan: rowSpan,
      colspan: 1
    };
  }
  return {
    rowspan: 1,
    colspan: 1
  };
};
 

// 查找匹配项
const findMatches = () => {
  
};
 

 
 

// 判断是否是当前匹配项
const isCurrentMatch = (rowIndex, field) => {
  if (currentMatchIndex.value === -1) return false;
  const match = matchedRows.value[currentMatchIndex.value];
  return match.index === rowIndex && match.field === field;
};

// 高亮匹配文本方法
const highlightMatch = (text, rowIndex, field) => {
  if (currentMatchIndex.value === -1) return text;

  const match = matchedRows.value[currentMatchIndex.value];
  if (match.index !== rowIndex || match.field !== field) return text;

  const { matchText, matchIndex } = match;
  const searchLength = searchText.value.length;

  const before = text.substring(0, matchIndex);
  const matched = text.substring(matchIndex, matchIndex + searchLength);
  const after = text.substring(matchIndex + searchLength);

  return `${before}<span class="highlight-text">${matched}</span>${after}`;
};

watch(() => props.highlightRowIds, (newVal) => {
  if (newVal.length > 0) {
    // 等待 DOM 更新完成
    nextTick(() => {
      // 安全处理：确保 newVal[0] 存在且是有效数字
      const rowId = Number(newVal[0]);
      if (!isNaN(rowId) && rowId > 0) {
        tableRef.value.scrollTo({
          top: (rowId - 1) * 80,
          behavior: 'smooth'
        });
      }
    });
  }
}, { immediate: true });
// 表格行类名
// 修改高亮判断逻辑
const handleHighlightRow = ({ row }) => {
 
  return props.highlightRowIds.includes(String(row.id)) ? 'highlight-row' : '';
};

// 切换编辑状态
const toggleEdit = (row) => {
  row.editing = !row.editing;
  if (!row.editing) {
    ElMessage.success('保存成功');
  }
};

// 删除行
const deleteRow = (index) => {
  tableData.value.splice(index, 1);
  ElMessage.success('删除成功');
  // 重新计算匹配项
  findMatches();
  // 重新计算合并单元格数组
  calculateSpanArr();
};

// 获取类别标签类型
const getCategoryTagType = (category) => {
  switch (category) {
    case '基础功能': return '';
    case '核心功能': return 'success';
    case '扩展功能': return 'warning';
    default: return 'info';
  }
};

// 获取重用程度标签类型
const getReuseLevelTagType = (level) => {
  switch (level) {
    case '高': return 'success';
    case '中': return 'warning';
    case '低': return 'danger';
    default: return 'info';
  }
};

// 获取修改类型标签类型
const getModifyTypeTagType = (type) => {
  switch (type) {
    case '新增': return 'success';
    case '修改': return 'warning';
    case '删除': return 'danger';
    default: return 'info';
  }
};

// 导出表格函数
const exportTable = () => {
  if (tableData.value.length === 0) {
    ElMessage.warning('没有数据可导出');
    return;
  }

  // 定义表头
  const header = [
    '编号', '子系统', '一级模块','功能点计数项名称'  ,'功能项描述',
    '类别', 'UFP', '重用程度', '修改类型', 'US', '备注'
  ];

  // 提取表格数据
  const data = tableData.value.map(row => [
    row.id, row.subsystem, row.level1, row.countItem, row.description,
     row.category, row.ufp, row.reuseLevel, row.modifyType, row.us, row.remark
  ]);

  // 创建工作表
  const ws = XLSX.utils.aoa_to_sheet([header, ...data]);

  // 设置表头第一行为灰色
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cell = XLSX.utils.encode_cell({ r: 0, c: C });
    ws[cell].s = {
      fill: { fgColor: { rgb: "D3D3D3" } },
      font: { bold: true }
    };
  }

  // 创建工作簿
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

  // 导出文件
  XLSX.writeFile(wb, 'exported_table.xlsx');
  ElMessage.success('表格导出成功');
};
 

</script>

<style scoped>
.table-container {
  padding: 20px;
  height: 100vh;
  box-sizing: border-box;
  position: relative;
}

/* 导出按钮样式 */
.export-btn {
  position: absolute;
  top: 20px;
  right: 20px;
}

.search-box {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.match-count {
  color: #666;
  font-size: 14px;
}

 

/* 高亮单元格样式 */
.highlight-cell.highlight {
  background-color: #fffacd;
}

/* 高亮文本样式 */
.highlight-text {
  background-color: #ffeb3b;
  color: #000;
  font-weight: bold;
  padding: 0 2px;
  border-radius: 2px;
}

/* 表格单元格内容超出显示省略号 */
:deep(.el-table .cell) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 文本域输入框 */
:deep(.el-textarea .el-textarea__inner) {
  min-height: 32px !important;
  line-height: 1.5;
}

/* 骨架屏表格样式 */
.skeleton-table {
  width: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.skeleton-table-header {
  display: flex;
  padding: 12px 0;
  background-color: #f5f7fa;
  border-bottom: 1px solid #dcdfe6;
}

.skeleton-table-row {
  display: flex;
  padding: 12px 0;
  border-bottom: 1px solid #dcdfe6;
}

.skeleton-table-header .el-skeleton-item,
.skeleton-table-row .el-skeleton-item {
  margin: 0 16px;
}

.skeleton-table-row:last-child {
  border-bottom: none;
}

/* 编辑状态下输入框允许换行 */
.description-input :deep(.el-textarea__inner) {
  white-space: normal;
  word-wrap: break-word;
}

/* 非编辑状态下文本允许换行 */
.description-text {
  white-space: normal;
  word-wrap: break-word;
  display: inline-block; /* 确保样式生效 */
}
:deep(.highlight-row) {
  background-color: #f0f9eb !important;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { background-color: #f0f9eb; }
  50% { background-color: #e1f3d8; }
  100% { background-color: #f0f9eb; }
}
</style>
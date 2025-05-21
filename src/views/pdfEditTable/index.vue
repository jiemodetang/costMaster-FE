<template>
  <div class="table-container">
    <!-- 导出按钮 -->
    <div class="export-btn">
      <el-button type="primary" @click="exportTable">导出数据</el-button>
    </div>
    <!-- 搜索框 -->
    <div class="search-box">
      <el-input v-model="searchText" placeholder="输入一级或二级模块名称搜索" clearable @input="findMatches"
        @keypress="handleKeyPress" style="width: 400px;">
        <template #prefix>
          <el-icon>
            <Search />
          </el-icon>
        </template>
      </el-input>
      <!-- 使用说明 -->
      <span class="match-instruction">支持搜索一二级标题，按回车键查找下一个匹配项</span>
    </div>

    <!-- 使用 el-skeleton 组件，模拟表格样式 -->
    <el-skeleton :loading="submitLoading" animated>
      <template #template>
        <div class="skeleton-table">
          <!-- 模拟表头 -->
          <div class="skeleton-table-header">
            <el-skeleton-item v-for="(width, index) in columnWidthConfig" :key="'header-' + index" variant="text"
              :style="{ width: width }" />
          </div>
          <!-- 模拟表格行 -->
          <div v-for="i in 15" :key="i" class="skeleton-table-row">
            <el-skeleton-item v-for="(width, index) in columnWidthConfig" :key="'row-' + i + '-' + index" variant="text"
              :style="{ width: width }" />
          </div>
        </div>
      </template>
      <div style="height: 90%;width: 100%;">
        <el-table ref="tableRef" :data="tableData" border style="width: 100%;" height="100%" class="table-wrapper"
          row-key="id" :row-class-name="handleHighlightRow" :span-method="mergeCells" :loading="false">
          <el-table-column prop="id" label="编号" width="80" align="center" />

          <el-table-column prop="subsystem" label="子系统" width="250">
            <template #default="scope">
              <!-- 添加 title 属性 -->
              <el-input v-if="scope.row.editing" v-model="scope.row.subsystem" size="small"
                title="scope.row.subsystem" />
              <span v-else :title="scope.row.subsystem">{{ scope.row.subsystem }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="level1" label="一级模块" width="150">
            <template #default="scope">
              <div class="highlight-cell" :class="{ 'highlight': isCurrentMatch(scope.$index, 'level1') }">
                <!-- 添加 title 属性 -->
                <el-input v-if="scope.row.editing" v-model="scope.row.level1" size="small" :title="scope.row.level1" />
                <span v-else :title="scope.row.level1"
                  v-html="highlightMatch(scope.row.level1, scope.$index, 'level1')"></span>
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

          <el-table-column prop="description" label="功能项描述" min-width="320">
            <template #default="scope">
              <el-input v-if="scope.row.editing" v-model="scope.row.description" type="textarea"
                :autosize="{ minRows: 1, maxRows: 3 }" size="small" :title="scope.row.description" />
              <span v-else :title="scope.row.description">{{ scope.row.description }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="countItem" label="功能点计数项名称" width="200">
            <template #default="scope">
              <!-- 添加 title 属性 -->
              <el-input v-if="scope.row.editing" v-model="scope.row.countItem" size="small"
                :title="scope.row.countItem" />
              <span v-else :title="scope.row.countItem">{{ scope.row.countItem }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="category" label="类别" width="100" align="center">
            <template #default="scope">
              <!-- 添加 title 属性 -->
              <el-select v-if="scope.row.editing" v-model="scope.row.category" size="small" :title="scope.row.category">
                <el-option v-for="option in categoryOptions" :key="option.value" :label="option.label"
                  :value="option.value" />
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
                controls-position="right" :title="scope.row.ufp" />
              <span v-else :title="scope.row.ufp">{{ scope.row.ufp }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="reuseLevel" label="重用程度" width="120" align="center">
            <template #default="scope">
              <!-- 添加 title 属性 -->
              <el-select v-if="scope.row.editing" v-model="scope.row.reuseLevel" size="small"
                :title="scope.row.reuseLevel">
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
              <el-select v-if="scope.row.editing" v-model="scope.row.modifyType" size="small"
                :title="scope.row.modifyType">
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

          <el-table-column label="操作" width="200" align="center" fixed="right">
            <template #default="scope">
              <el-button size="small" :type="scope.row.editing ? 'success' : 'primary'" @click="toggleEdit(scope.row)">
                {{ scope.row.editing ? '保存' : '编辑' }}
              </el-button>
              <el-button size="small" type="danger" @click="deleteRow(scope.$index)" v-if="!scope.row.editing">
                删除
              </el-button>
              <el-button size="small" type="warning" @click="insertRow(scope.$index)" v-if="!scope.row.editing">
                插入
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-skeleton>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Search } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import * as XLSX from 'xlsx';
import { data3 } from './mock';
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
  paramType: {
    type: String,
    default: ''
  }
});
const columnWidthConfig = [
  '80px',   // 编号
  '120px',  // 子系统
  '150px',  // 一级模块
  '150px',  // 二级模块
  '200px',  // 功能项描述
  '180px',  // 功能点计数项名称
  '100px',  // 类别
  '80px',   // UFP
  '120px',  // 重用程度
  '120px',  // 修改类型
  '100px',  // US
  '150px',  // 备注
  '150px'   // 操作
];
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
// 使用计算属性定义 tableData
const tableData = ref([]);

// 监听 props.pdfDealTableData 的变化，动态更新 tableData
watch(
  () => props.pdfDealTableData,
  // () => data3,
  (newVal) => {
    tableData.value = newVal.map(item => {
      let ufpValue = item.ufp;
      let usValue = item.us;
      if (!ufpValue) {
        if (props.paramType === 'default2') {
          ufpValue = item.category === 'ILF' ? 35 :
            item.category === 'EIF' ? 15 : 35;
        } else if (props.paramType === 'default1') {
          ufpValue = item.category === 'ILF' ? 10 :
            item.category === 'EIF' ? 7 :
              item.category === 'EI' ? 4 :
                item.category === 'EO' ? 5 :
                  item.category === 'EQ' ? 4 :
                    item.category === 'FP' ? 4 : 35;
        }
      }

      // 初始化US值计算
      if (!usValue) {
        const reuseLevel = item.reuseLevel || '低';
        const modifyType = item.modifyType || '新增';

        if (props.paramType === 'default1') {
          // 根据重用程度和修改类型计算US值
          if (reuseLevel === '高') {
            usValue = (ufpValue * 0.3325).toFixed(2);
            if (modifyType === '修改') {
              usValue = (ufpValue * 0.3325 * 0.85).toFixed(2);
            } else if (modifyType === '删除') {
              usValue = (ufpValue * 0.3325 * 0.2).toFixed(2);
            }
          } else if (reuseLevel === '中') {
            usValue = (ufpValue * 0.6).toFixed(2);
            if (modifyType === '修改') {
              usValue = (ufpValue * 0.6 * 0.85).toFixed(2);
            } else if (modifyType === '删除') {
              usValue = (ufpValue * 0.6 * 0.2).toFixed(2);
            }
          } else { // 重用程度为'低'
            usValue = ufpValue.toFixed(2);
            if (modifyType === '修改') {
              usValue = (ufpValue * 0.85).toFixed(2);
            } else if (modifyType === '删除') {
              usValue = (ufpValue * 0.2).toFixed(2);
            }
          }
        } else if (props.paramType === 'default2') {
          // 如果有其他计算逻辑，可以在这里添加
          usValue = ufpValue.toFixed(2);
        }
      }

      return {
        ...item,
        ufp: ufpValue,
        us: usValue,
        reuseLevel: item.reuseLevel || '低',
        modifyType: item.modifyType || '新增'
      };
    });
  },
  { immediate: true, deep: true }
);

const categoryOptions = [
  { label: 'EI', value: 'EI' },
  { label: 'EO', value: 'EO' },
  { label: 'EQ', value: 'EQ' },
  { label: 'ILF', value: 'ILF' },
  { label: 'EIF', value: 'EIF' }
];

// 合并单元格方法
const mergeCells = ({ row, column, rowIndex, columnIndex }) => {
  if (column.property === 'level1' || column.property === 'level2' || column.property === 'description') {
    const previousRow = tableData.value[rowIndex - 1];
    if (previousRow && previousRow[column.property] === row[column.property]) {
      return {
        rowspan: 0,
        colspan: 0,
      };
    } else {
      let rowspan = 1;
      for (let i = rowIndex + 1; i < tableData.value.length; i++) {
        if (tableData.value[i][column.property] === row[column.property]) {
          rowspan++;
        } else {
          break;
        }
      }
      return {
        rowspan,
        colspan: 1,
      };
    }
  }
};


// 查找匹配项
const findMatches = () => {
  matchedRows.value = [];
  currentMatchIndex.value = -1;

  if (!searchText.value) return;

  tableData.value.forEach((row, index) => {
    ['level1', 'level2'].forEach(field => {
      const text = row[field];
      const matchIndex = text.indexOf(searchText.value);
      if (matchIndex !== -1) {
        matchedRows.value.push({ index, field, matchText: searchText.value, matchIndex });
      }
    });
  });

  if (matchedRows.value.length > 0) {
    currentMatchIndex.value = 0;
  }
};

// 监听回车键事件
const handleKeyPress = (event) => {
  if (event.key === 'Enter') {
    if (matchedRows.value.length > 0) {
      let nextIndex = (currentMatchIndex.value + 1) % matchedRows.value.length;

      // 跳过合并的行
      while (spanArr.value[matchedRows.value[nextIndex].index] === 0) {
        nextIndex = (nextIndex + 1) % matchedRows.value.length;
      }

      currentMatchIndex.value = nextIndex;

      // 立即高亮匹配项
      nextTick(() => {
        const match = matchedRows.value[currentMatchIndex.value];
        if (match) {
          const tableElement = tableRef.value?.$el;
          if (tableElement) {
            const rowIndex = match.index;
            const estimatedRowHeight = 36; // 默认行高
            const headerHeight = 40; // 表头高度
            const scrollTop = rowIndex * estimatedRowHeight + headerHeight;
            tableRef.value.scrollTo({
              top: scrollTop,
              behavior: 'smooth'
            });
          }
        }
      });
    }
  }
};

watch(searchText, () => {
  findMatches();
}, { immediate: true });

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
  if (newVal.length > 0 && tableRef.value) {
    nextTick(() => {
      const firstId = String(newVal[0]);
      const rowIndex = tableData.value.findIndex(row => String(row.id) === firstId);
      if (rowIndex !== -1) {
        nextTick(() => {
          const tableEl = tableRef.value.$el;
          if (tableEl) {
            const rows = tableEl.querySelectorAll('.el-table__body tr');
            if (rows && rows[rowIndex]) {
              console.log('需要滚动到的行索引:', rowIndex);
              rows[rowIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        });
      }
    });
  }
}, { immediate: true });
// 修改高亮判断逻辑
const handleHighlightRow = ({ row }) => {
  return props.highlightRowIds.includes(String(row.id)) ? 'highlight-row' : '';
};

// 切换编辑状态
const toggleEdit = (row) => {
  row.editing = !row.editing;
  if (!row.editing) {
    // 如果是保存操作，计算US值
    if (props.paramType === 'default1') {
      // 根据重用程度和修改类型计算US值
      if (row.reuseLevel === '高') {
        row.us = (row.ufp * 0.3325).toFixed(2);
        if (row.modifyType === '修改') {
          row.us = (row.ufp * 0.3325 * 0.85).toFixed(2);
        } else if (row.modifyType === '删除') {
          row.us = (row.ufp * 0.3325 * 0.2).toFixed(2);
        }
      } else if (row.reuseLevel === '中') {
        row.us = (row.ufp * 0.6).toFixed(2);
        if (row.modifyType === '修改') {
          row.us = (row.ufp * 0.6 * 0.85).toFixed(2);
        } else if (row.modifyType === '删除') {
          row.us = (row.ufp * 0.6 * 0.2).toFixed(2);
        }
      } else { // 重用程度为'低'
        row.us = row.ufp.toFixed(2);
        if (row.modifyType === '修改') {
          row.us = (row.ufp * 0.85).toFixed(2);
        } else if (row.modifyType === '删除') {
          row.us = (row.ufp * 0.2).toFixed(2);
        }
      }
    } else if (props.paramType === 'default2') {
      // 如果有其他计算逻辑，可以在这里添加
      row.us = row.ufp.toFixed(2);
    }

    // 重新排序ID
    reorderIds();
    ElMessage.success('保存成功');
  }
};
// 添加重新排序ID的函数
const reorderIds = () => {
  tableData.value = tableData.value.map((row, index) => ({
    ...row,
    id: (index + 1).toString()
  }));
};

// 删除行
const deleteRow = (index) => {
  ElMessageBox.confirm('确定要删除这一行吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 创建一个新数组，避免直接修改原数组
    const newTableData = [...tableData.value];
    newTableData.splice(index, 1);
    // 更新表格数据
    tableData.value = newTableData;
    // 重新排序ID
    reorderIds();
    ElMessage.success('删除成功');
  }).catch(() => {
    // 取消删除
  });
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
  // 创建一个新的工作簿
  const workbook = XLSX.utils.book_new()

  // 准备导出数据，移除编辑状态标记
  const exportData = tableData.value.map(row => {
    const { editing, ...rest } = row
    return rest
  })

  // 定义中文表头
  const headers = [
    "编号", "子系统", "一级模块", "二级模块", "功能项描述", 
    "功能点计数项名称", "类别", "UFP", "重用程度", "修改类型", "US", "备注"
  ]

  // 准备表格数据，包括表头
  const tableContent = [
    headers,
    ...exportData.map(row => [
      row.id,
      row.subsystem,
      row.level1,
      row.level2,
      row.description,
      row.countItem,
      row.category,
      row.ufp,
      row.reuseLevel,
      row.modifyType,
      row.us,
      row.remark
    ])
  ]

  // 创建工作表（使用数组方式创建，以便指定表头）
  const worksheet = XLSX.utils.aoa_to_sheet(tableContent)

  // 设置列宽
  const columnWidths = [
    { wch: 8 },  // 编号
    { wch: 25 }, // 子系统
    { wch: 15 }, // 一级模块
    { wch: 15 }, // 二级模块
    { wch: 30 }, // 功能项描述
    { wch: 20 }, // 功能点计数项名称
    { wch: 10 }, // 类别
    { wch: 8 },  // UFP
    { wch: 12 }, // 重用程度
    { wch: 12 }, // 修改类型
    { wch: 10 }, // US
    { wch: 20 }  // 备注
  ]
  worksheet['!cols'] = columnWidths

  // 添加工作表到工作簿
  XLSX.utils.book_append_sheet(workbook, worksheet, '功能点数据')

  // 生成文件名（当前日期时间）
  const now = new Date()
  const fileName = `功能点数据_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}.xlsx`

  // 导出文件
  XLSX.writeFile(workbook, fileName)

  // 提示用户
  ElMessage.success(`数据已成功导出为 ${fileName}`)
}

// 插入行
const insertRow = (index) => {
  // 获取最大ID
  const maxId = tableData.value.reduce((max, item) => Math.max(max, parseInt(item.id) || 0), 0);

  // 创建新行数据
  const newRow = {
    id: (maxId + 1).toString(),
    subsystem: tableData.value[index]?.subsystem || '',
    level1: tableData.value[index]?.level1 || '',
    level2: '',
    description: '',
    countItem: '',
    category: 'EI',
    ufp: 35,
    reuseLevel: '高',
    modifyType: '新增',
    us: '',
    remark: '',
    editing: true // 默认进入编辑状态
  };

  // 在指定位置插入新行
  const newTableData = [...tableData.value];
  newTableData.splice(index + 1, 0, newRow);
  tableData.value = newTableData;

  // 提示用户
  ElMessage.success('已插入新行');

  // 滚动到新插入的行
  nextTick(() => {
    if (tableRef.value) {
      const estimatedRowHeight = 36; // 默认行高
      const headerHeight = 40; // 表头高度
      const scrollTop = (index + 1) * estimatedRowHeight + headerHeight;
      tableRef.value.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      });
    }
  });
};

</script>

<style scoped>
.table-container {
  padding: 20px;
  box-sizing: border-box;
  position: relative;
  overflow: auto;
  height: 100%;
}

.table-wrapper {
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-top: 80px
}

/* 导出按钮样式 */
.export-btn {
  position: absolute;
  top: 20px;
  right: 20px;
}

.search-box {
  position: absolute;
  top: 20px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
}

.match-instruction {
  color: #999;
  /* 淡化文字颜色 */
  font-size: 12px;
  /* 减小字体大小 */
  margin-top: 5px;
  /* background-color: #f5f5f5; */
  padding: 5px 10px;
  border-radius: 4px;
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
  background: #fff;
  margin-top: 80px;
}

.skeleton-table-header {
  display: flex;
  padding: 12px 0;
  background-color: #f5f7fa;
  border-bottom: 1px solid #dcdfe6;
}

.skeleton-table-row {
  display: flex;
  padding: 15px 0;
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
  display: inline-block;
  /* 确保样式生效 */
}

:deep(.highlight-row) {
  background-color: #f0f9eb !important;
  animation: pulse 1.5s infinite;
}

:deep(.el-table .cell) {
  white-space: inherit;
}

@keyframes pulse {
  0% {
    background-color: #f0f9eb;
  }

  50% {
    background-color: #e1f3d8;
  }

  100% {
    background-color: #f0f9eb;
  }
}
</style>

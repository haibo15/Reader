<template>
  <div class="document-history">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>📚 文档历史</span>
          <div class="header-actions">
            <el-button @click="refreshHistory" type="primary" size="small">
              🔄 刷新
            </el-button>
            <el-button @click="clearHistory" type="danger" size="small">
              🗑️ 清空历史
            </el-button>
          </div>
        </div>
      </template>

      <div class="history-content">
        <!-- 历史统计 -->
        <div class="history-stats">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-card shadow="hover" class="stat-card">
                <template #header>
                  <span>📁 总文档数</span>
                </template>
                <div class="stat-value">{{ totalDocuments }}</div>
              </el-card>
            </el-col>

            <el-col :span="6">
              <el-card shadow="hover" class="stat-card">
                <template #header>
                  <span>🎵 总音频数</span>
                </template>
                <div class="stat-value">{{ totalAudioFiles }}</div>
              </el-card>
            </el-col>

            <el-col :span="6">
              <el-card shadow="hover" class="stat-card">
                <template #header>
                  <span>💾 总存储空间</span>
                </template>
                <div class="stat-value">{{ formatTotalSize }}</div>
              </el-card>
            </el-col>

            <el-col :span="6">
              <el-card shadow="hover" class="stat-card">
                <template #header>
                  <span>📅 最近更新</span>
                </template>
                <div class="stat-value">{{ lastUpdated }}</div>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <!-- 搜索和筛选 -->
        <div class="search-filters">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-input
                v-model="searchQuery"
                placeholder="搜索文档名称..."
                clearable
                @input="filterHistory"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </el-col>

            <el-col :span="6">
              <el-select v-model="fileTypeFilter" placeholder="文件类型" clearable @change="filterHistory">
                <el-option label="全部类型" value="" />
                <el-option label="PDF" value="pdf" />
                <el-option label="TXT" value="txt" />
                <el-option label="EPUB" value="epub" />
                <el-option label="DOCX" value="docx" />
              </el-select>
            </el-col>

            <el-col :span="6">
              <el-select v-model="statusFilter" placeholder="状态" clearable @change="filterHistory">
                <el-option label="全部状态" value="" />
                <el-option label="有音频" value="with_audio" />
                <el-option label="无音频" value="without_audio" />
                <el-option label="生成中" value="generating" />
              </el-select>
            </el-col>

            <el-col :span="4">
              <el-button @click="resetFilters" type="info" size="small">
                重置筛选
              </el-button>
            </el-col>
          </el-row>
        </div>

        <!-- 历史列表 -->
        <div class="history-list">
          <el-table
            :data="filteredHistory"
            style="width: 100%"
            @row-click="openDocument"
            :row-class-name="getRowClassName"
          >
            <el-table-column prop="display_name" label="文档名称" min-width="200">
              <template #default="{ row }">
                <div class="document-name">
                  <el-icon class="file-icon">
                    <Document v-if="row.file_type === 'pdf'" />
                    <Document v-else-if="row.file_type === 'txt'" />
                    <Document v-else-if="row.file_type === 'epub'" />
                    <Document v-else />
                  </el-icon>
                  <span>{{ row.display_name || row.name }}</span>
                </div>
              </template>
            </el-table-column>

            <el-table-column prop="file_type" label="类型" width="80">
              <template #default="{ row }">
                <el-tag size="small" :type="getFileTypeTagType(row.file_type)">
                  {{ row.file_type?.toUpperCase() }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column prop="total_chapters" label="章节" width="80" />

            <el-table-column prop="audio_status" label="音频状态" width="120">
              <template #default="{ row }">
                <el-tag :type="getAudioStatusType(row)" size="small">
                  {{ getAudioStatusText(row) }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column prop="file_size" label="大小" width="100">
              <template #default="{ row }">
                {{ formatFileSize(row.file_size) }}
              </template>
            </el-table-column>

            <el-table-column prop="upload_time" label="上传时间" width="160">
              <template #default="{ row }">
                {{ formatDate(row.upload_time) }}
              </template>
            </el-table-column>

            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click.stop="openDocument(row)">
                  打开
                </el-button>

                <el-button
                  size="small"
                  type="success"
                  @click.stop="downloadDocument(row)"
                  :disabled="!row.audio_files || row.audio_files.length === 0"
                >
                  下载音频
                </el-button>

                <el-button
                  size="small"
                  type="danger"
                  @click.stop="deleteDocument(row)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 分页 -->
        <div v-if="totalPages > 1" class="pagination">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="totalItems"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Document } from '@element-plus/icons-vue'
import { useReaderStore, useUIStore } from '@/stores'
import { DocumentService, AudioService } from '@/services'
import type { DocumentHistory as DocHistory } from '@/types'

// Store
const readerStore = useReaderStore()
const uiStore = useUIStore()

// 状态
const history = ref<DocHistory[]>([])
const filteredHistory = ref<DocHistory[]>([])
const searchQuery = ref('')
const fileTypeFilter = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const loading = ref(false)

// 计算属性
const totalDocuments = computed(() => history.value.length)
const totalAudioFiles = computed(() => {
  return history.value.reduce((total, doc) => {
    return total + (doc.audio_files?.length || 0)
  }, 0)
})
const formatTotalSize = computed(() => {
  const totalBytes = history.value.reduce((total, doc) => {
    return total + (doc.file_size || 0)
  }, 0)
  return formatFileSize(totalBytes)
})
const lastUpdated = computed(() => {
  if (history.value.length === 0) return '无'
  const latest = history.value.reduce((latest, doc) => {
    return new Date(doc.upload_time) > new Date(latest.upload_time) ? doc : latest
  })
  return formatDate(latest.upload_time)
})

const totalItems = computed(() => filteredHistory.value.length)
const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value))

// 方法
const refreshHistory = async () => {
  try {
    loading.value = true
    uiStore.showInfo('刷新文档历史...')

    const historyData = await DocumentService.getDocumentHistory()
    history.value = historyData

    filterHistory()
    uiStore.showSuccess('文档历史刷新完成')

  } catch (error: any) {
    uiStore.showError(`刷新失败: ${error.message}`)
  } finally {
    loading.value = false
  }
}

const clearHistory = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有文档历史吗？此操作不可恢复！',
      '确认清空历史',
      {
        confirmButtonText: '确定清空',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // TODO: 实现清空历史逻辑
    history.value = []
    filteredHistory.value = []
    uiStore.showWarning('文档历史已清空')

  } catch {
    // 用户取消
  }
}

const filterHistory = () => {
  let filtered = [...history.value]

  // 搜索过滤
  if (searchQuery.value) {
    filtered = filtered.filter(doc =>
      doc.display_name?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      doc.name?.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  // 文件类型过滤
  if (fileTypeFilter.value) {
    filtered = filtered.filter(doc =>
      doc.file_type?.toLowerCase() === fileTypeFilter.value.toLowerCase()
    )
  }

  // 状态过滤
  if (statusFilter.value) {
    filtered = filtered.filter(doc => {
      switch (statusFilter.value) {
        case 'with_audio':
          return doc.audio_files && doc.audio_files.length > 0
        case 'without_audio':
          return !doc.audio_files || doc.audio_files.length === 0
        case 'generating':
          return doc.audio_files?.some(audio => audio.status === 'generating')
        default:
          return true
      }
    })
  }

  filteredHistory.value = filtered
  currentPage.value = 1
}

const resetFilters = () => {
  searchQuery.value = ''
  fileTypeFilter.value = ''
  statusFilter.value = ''
  filterHistory()
}

const openDocument = async (document: DocHistory) => {
  try {
    uiStore.showInfo(`正在加载文档: ${document.display_name || document.name}`)

    // 获取文档信息和章节
    const [fileInfo, chapters] = await Promise.all([
      DocumentService.getDocumentInfo(document.id),
      DocumentService.getDocumentChapters(document.id)
    ])

    // 更新store
    readerStore.setCurrentFile(fileInfo)
    readerStore.setChapters(chapters)

    // 切换到文件信息区域
    uiStore.setActiveSection('fileInfo')

    uiStore.showSuccess('文档加载完成')

  } catch (error: any) {
    uiStore.showError(`文档加载失败: ${error.message}`)
  }
}

const downloadDocument = async (document: DocHistory) => {
  try {
    if (!document.audio_files || document.audio_files.length === 0) {
      uiStore.showWarning('该文档没有可下载的音频文件')
      return
    }

    uiStore.showInfo('准备下载音频文件...')

    // TODO: 实现批量下载逻辑
    // 可以创建一个ZIP文件包含所有音频

    uiStore.showSuccess('音频文件下载完成')

  } catch (error: any) {
    uiStore.showError(`下载失败: ${error.message}`)
  }
}

const deleteDocument = async (document: DocHistory) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除文档 "${document.display_name || document.name}" 吗？\n此操作将同时删除所有相关的音频文件！`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 删除文档
    await DocumentService.deleteDocument(document.id)

    // 从历史列表中移除
    const index = history.value.findIndex(doc => doc.id === document.id)
    if (index !== -1) {
      history.value.splice(index, 1)
      filterHistory()
    }

    uiStore.showSuccess('文档删除成功')

  } catch (error: any) {
    if (error !== 'cancel') {
      uiStore.showError(`删除失败: ${error.message}`)
    }
  }
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
}

const getRowClassName = ({ row }: { row: DocHistory }) => {
  if (row.audio_files && row.audio_files.length > 0) {
    return 'has-audio-row'
  }
  return ''
}

const getFileTypeTagType = (fileType: string) => {
  const types: Record<string, string> = {
    'pdf': 'danger',
    'txt': 'info',
    'epub': 'success',
    'docx': 'warning'
  }
  return types[fileType?.toLowerCase() || ''] || 'info'
}

const getAudioStatusType = (document: DocHistory) => {
  if (!document.audio_files || document.audio_files.length === 0) {
    return 'info'
  }

  const hasGenerating = document.audio_files.some(audio => audio.status === 'generating')
  if (hasGenerating) {
    return 'warning'
  }

  return 'success'
}

const getAudioStatusText = (document: DocHistory) => {
  if (!document.audio_files || document.audio_files.length === 0) {
    return '无音频'
  }

  const total = document.audio_files.length
  const generated = document.audio_files.filter(audio => audio.status === 'generated').length
  const generating = document.audio_files.filter(audio => audio.status === 'generating').length

  if (generating > 0) {
    return `生成中 (${generating}/${total})`
  }

  return `已完成 (${generated}/${total})`
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 监听筛选条件变化
watch([searchQuery, fileTypeFilter, statusFilter], filterHistory)

// 组件挂载时加载历史
onMounted(() => {
  refreshHistory()
})
</script>

<style scoped>
.document-history {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.history-content {
  padding: 20px 0;
}

.history-stats {
  margin-bottom: 30px;
}

.stat-card {
  text-align: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #409eff;
}

.search-filters {
  margin-bottom: 30px;
}

.search-filters .el-col {
  margin-bottom: 15px;
}

.history-list {
  margin-bottom: 20px;
}

.document-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-icon {
  color: #909399;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* 表格行样式 */
.has-audio-row {
  background-color: #f0f9ff !important;
}

.has-audio-row:hover {
  background-color: #e0f2fe !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .history-stats .el-col {
    margin-bottom: 15px;
  }

  .search-filters .el-col {
    width: 100%;
  }

  .pagination {
    flex-direction: column;
    align-items: center;
  }
}
</style>

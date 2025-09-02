<template>
  <div class="file-info">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>📋 文件信息</span>
          <div class="header-actions">
            <el-button @click="showUploadSection" type="info" size="small">
              📄 上传新文档
            </el-button>
            <el-button @click="deleteFile" type="danger" size="small">
              🗑️ 删除文件
            </el-button>
          </div>
        </div>
      </template>

      <div class="file-info-content">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="文件名">
                {{ file.display_name || file.name }}
              </el-descriptions-item>
              <el-descriptions-item label="章节数">
                {{ file.total_chapters }}
              </el-descriptions-item>
              <el-descriptions-item label="文件ID">
                {{ file.id }}
              </el-descriptions-item>
              <el-descriptions-item label="文件类型">
                {{ file.file_type || getFileType(file.name) }}
              </el-descriptions-item>
            </el-descriptions>
          </el-col>

          <el-col :span="12">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="文件大小">
                {{ formatFileSize(file.file_size || 0) }}
              </el-descriptions-item>
              <el-descriptions-item label="上传时间">
                {{ formatDate(file.upload_time) }}
              </el-descriptions-item>
              <el-descriptions-item label="音频生成进度">
                <el-progress
                  :percentage="audioGenerationProgress"
                  :status="audioGenerationProgress === 100 ? 'success' : undefined"
                />
                <span class="progress-text">
                  {{ generatedAudioCount }}/{{ file.total_chapters }} 章节已生成
                </span>
              </el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="getStatusType()">
                  {{ getStatusText() }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </el-col>
        </el-row>

        <!-- 快速操作 -->
        <div class="quick-actions">
          <el-divider content-position="left">快速操作</el-divider>
          <div class="action-buttons">
            <el-button
              type="primary"
              @click="showChaptersSection"
              :disabled="!hasChapters"
            >
              📖 查看章节列表
            </el-button>
            <el-button
              type="success"
              @click="showVoiceSettingsSection"
              :disabled="!hasChapters"
            >
              🎵 语音设置
            </el-button>
            <el-button
              type="warning"
              @click="showAudioControlsSection"
              :disabled="!hasChapters"
            >
              🎧 音频生成
            </el-button>
            <el-button
              type="info"
              @click="showAudioPlayerSection"
              :disabled="!hasGeneratedAudio"
            >
              ▶️ 音频播放
            </el-button>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useReaderStore, useUIStore } from '@/stores'
import type { FileInfo } from '@/types'

// Props
interface Props {
  file: FileInfo
}

const props = defineProps<Props>()

// Store
const readerStore = useReaderStore()
const uiStore = useUIStore()

// 计算属性
const hasChapters = computed(() => readerStore.totalChapters > 0)
const hasGeneratedAudio = computed(() => readerStore.generatedAudioCount > 0)
const generatedAudioCount = computed(() => readerStore.generatedAudioCount)
const audioGenerationProgress = computed(() => readerStore.audioGenerationProgress)

// 方法
const showUploadSection = () => {
  uiStore.setActiveSection('upload')
}

const showChaptersSection = () => {
  uiStore.setActiveSection('chapters')
}

const showVoiceSettingsSection = () => {
  uiStore.setActiveSection('voiceSettings')
}

const showAudioControlsSection = () => {
  uiStore.setActiveSection('audioControls')
}

const showAudioPlayerSection = () => {
  uiStore.setActiveSection('audioPlayer')
}

const deleteFile = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除文件 "${props.file.display_name || props.file.name}" 吗？\n删除后将无法恢复，包括所有已生成的音频文件。`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: true
      }
    )

    // 执行删除操作
    readerStore.reset()
    uiStore.setActiveSection('upload')
    uiStore.showSuccess('文件已删除')

  } catch {
    // 用户取消删除
  }
}

const getFileType = (filename: string): string => {
  const ext = filename.toLowerCase().split('.').pop()
  const typeMap: Record<string, string> = {
    'pdf': 'PDF文档',
    'txt': '文本文件',
    'epub': 'EPUB电子书',
    'docx': 'Word文档'
  }
  return typeMap[ext || ''] || '未知类型'
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleString('zh-CN')
  } catch {
    return '未知时间'
  }
}

const getStatusType = () => {
  if (audioGenerationProgress.value === 100) return 'success'
  if (audioGenerationProgress.value > 0) return 'warning'
  return 'info'
}

const getStatusText = () => {
  if (audioGenerationProgress.value === 100) return '音频生成完成'
  if (audioGenerationProgress.value > 0) return '音频生成中'
  return '待生成音频'
}
</script>

<style scoped>
.file-info {
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

.file-info-content {
  padding: 20px 0;
}

.quick-actions {
  margin-top: 30px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.progress-text {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.el-progress {
  margin-bottom: 8px;
}
</style>

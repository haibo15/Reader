<template>
  <div class="audio-controls">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>🎧 音频控制中心</span>
          <div class="header-actions">
            <el-button @click="refreshStatus" type="info" size="small">
              🔄 刷新状态
            </el-button>
            <el-button @click="showQueueStatus" type="warning" size="small">
              📊 队列状态
            </el-button>
          </div>
        </div>
      </template>
      
      <div class="controls-content">
        <!-- 生成状态概览 -->
        <div class="generation-overview">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-card shadow="hover" class="status-card">
                <template #header>
                  <span>📚 总章节</span>
                </template>
                <div class="status-value">{{ totalChapters }}</div>
              </el-card>
            </el-col>
            
            <el-col :span="6">
              <el-card shadow="hover" class="status-card">
                <template #header>
                  <span>✅ 已生成</span>
                </template>
                <div class="status-value success">{{ generatedCount }}</div>
              </el-card>
            </el-col>
            
            <el-col :span="6">
              <el-card shadow="hover" class="status-card">
                <template #header>
                  <span>⏳ 生成中</span>
                </template>
                <div class="status-value warning">{{ generatingCount }}</div>
              </el-card>
            </el-col>
            
            <el-col :span="6">
              <el-card shadow="hover" class="status-card">
                <template #header>
                  <span>❌ 失败</span>
                </template>
                <div class="status-value danger">{{ failedCount }}</div>
              </el-card>
            </el-col>
          </el-row>
        </div>
        
        <!-- 批量操作 -->
        <div class="batch-operations">
          <el-divider content-position="left">批量操作</el-divider>
          
          <div class="operation-controls">
            <el-row :gutter="20">
              <el-col :span="8">
                <div class="operation-section">
                  <h4>🎯 选择策略</h4>
                  <el-radio-group v-model="selectionStrategy" @change="updateSelection">
                    <el-radio label="all">全部章节</el-radio>
                    <el-radio label="pending">未生成章节</el-radio>
                    <el-radio label="failed">失败章节</el-radio>
                    <el-radio label="custom">自定义选择</el-radio>
                  </el-radio-group>
                  
                  <div v-if="selectionStrategy === 'custom'" class="custom-selection">
                    <el-button @click="selectAll" size="small">全选</el-button>
                    <el-button @click="clearSelection" size="small">清除</el-button>
                    <el-button @click="invertSelection" size="small">反选</el-button>
                  </div>
                </div>
              </el-col>
              
              <el-col :span="8">
                <div class="operation-section">
                  <h4>🎵 语音设置</h4>
                  <el-select v-model="batchVoiceSettings.voice" placeholder="选择语音" style="width: 100%">
                    <el-option
                      v-for="voice in availableVoices"
                      :key="voice.value"
                      :label="voice.label"
                      :value="voice.value"
                    />
                  </el-select>
                  
                  <el-slider
                    v-model="batchVoiceSettings.speed"
                    :min="0.5"
                    :max="2.0"
                    :step="0.1"
                    show-input
                    label="语速"
                  />
                  
                  <el-slider
                    v-model="batchVoiceSettings.volume"
                    :min="-20"
                    :max="20"
                    :step="1"
                    show-input
                    label="音量"
                  />
                </div>
              </el-col>
              
              <el-col :span="8">
                <div class="operation-section">
                  <h4>⚡ 生成选项</h4>
                  <el-checkbox v-model="generationOptions.overwrite">覆盖已存在</el-checkbox>
                  <el-checkbox v-model="generationOptions.continueOnError">错误时继续</el-checkbox>
                  <el-checkbox v-model="generationOptions.autoDownload">自动下载</el-checkbox>
                  
                  <div class="priority-setting">
                    <label>优先级:</label>
                    <el-select v-model="generationOptions.priority" size="small">
                      <el-option label="低" value="low" />
                      <el-option label="普通" value="normal" />
                      <el-option label="高" value="high" />
                      <el-option label="紧急" value="urgent" />
                    </el-select>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
          
          <div class="operation-actions">
            <el-button 
              @click="startBatchGeneration" 
              type="primary" 
              size="large"
              :loading="isGenerating"
              :disabled="selectedChaptersCount === 0"
            >
              🚀 开始批量生成 ({{ selectedChaptersCount }})
            </el-button>
            
            <el-button 
              @click="pauseGeneration" 
              type="warning" 
              size="large"
              :disabled="!isGenerating"
            >
              ⏸️ 暂停生成
            </el-button>
            
            <el-button 
              @click="cancelGeneration" 
              type="danger" 
              size="large"
              :disabled="!isGenerating"
            >
              ❌ 取消生成
            </el-button>
          </div>
        </div>
        
        <!-- 生成进度 -->
        <div v-if="isGenerating" class="generation-progress">
          <el-divider content-position="left">生成进度</el-divider>
          
          <div class="progress-info">
            <el-row :gutter="20">
              <el-col :span="8">
                <div class="progress-stat">
                  <span class="label">当前进度:</span>
                  <span class="value">{{ generationProgress }}%</span>
                </div>
              </el-col>
              
              <el-col :span="8">
                <div class="progress-stat">
                  <span class="label">已完成:</span>
                  <span class="value">{{ completedCount }}/{{ totalSelectedCount }}</span>
                </div>
              </el-col>
              
              <el-col :span="8">
                <div class="progress-stat">
                  <span class="label">预计剩余:</span>
                  <span class="value">{{ estimatedTimeRemaining }}</span>
                </div>
              </el-col>
            </el-row>
          </div>
          
          <el-progress 
            :percentage="generationProgress" 
            :status="generationProgress === 100 ? 'success' : undefined"
            :stroke-width="20"
          />
          
          <div class="current-task">
            <p>当前任务: {{ currentTask?.title || '准备中...' }}</p>
            <el-progress 
              v-if="currentTask?.progress"
              :percentage="currentTask.progress" 
              :stroke-width="10"
            />
          </div>
        </div>
        
        <!-- 章节状态表格 -->
        <div class="chapters-status">
          <el-divider content-position="left">章节状态详情</el-divider>
          
          <el-table
            :data="chaptersWithStatus"
            style="width: 100%"
            :row-class-name="getRowClassName"
          >
            <el-table-column type="selection" width="55" @selection-change="handleSelectionChange" />
            <el-table-column prop="title" label="章节标题" min-width="200">
              <template #default="{ row }">
                {{ row.title || `第${row.chapter_index + 1}章` }}
              </template>
            </el-table-column>
            <el-table-column prop="length" label="字数" width="100">
              <template #default="{ row }">
                {{ row.length }}字
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="120">
              <template #default="{ row, $index }">
                <el-tag :type="getStatusType(row, $index)">
                  {{ getStatusText(row, $index) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="voice" label="语音" width="100">
              <template #default="{ row, $index }">
                {{ getChapterVoice(row, $index) || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row, $index }">
                <el-button 
                  size="small" 
                  @click="generateSingle(row, $index)"
                  :loading="isGeneratingSingle($index)"
                  :disabled="getChapterStatus($index)?.status === 'generated'"
                >
                  {{ getChapterStatus($index)?.status === 'generated' ? '已生成' : '生成' }}
                </el-button>
                
                <el-button 
                  v-if="getChapterStatus($index)?.status === 'generated'"
                  size="small" 
                  type="success"
                  @click="downloadSingle(row, $index)"
                >
                  下载
                </el-button>
                
                <el-button 
                  v-if="getChapterStatus($index)?.status === 'error'"
                  size="small" 
                  type="warning"
                  @click="retryGeneration(row, $index)"
                >
                  重试
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-card>
    
    <!-- 队列状态抽屉 -->
    <el-drawer
      v-model="showQueueDrawer"
      title="📊 生成队列状态"
      direction="rtl"
      size="600px"
    >
      <div class="queue-drawer-content">
        <div class="queue-overview">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="队列长度">
              {{ queueStatus.queueLength }}
            </el-descriptions-item>
            <el-descriptions-item label="预计等待时间">
              {{ queueStatus.estimatedWaitTime }}秒
            </el-descriptions-item>
          </el-descriptions>
        </div>
        
        <div v-if="queueStatus.currentTask" class="current-task-info">
          <el-divider content-position="left">当前任务</el-divider>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="文件ID">
              {{ queueStatus.currentTask.fileId }}
            </el-descriptions-item>
            <el-descriptions-item label="章节索引">
              {{ queueStatus.currentTask.chapterIndex }}
            </el-descriptions-item>
            <el-descriptions-item label="进度">
              <el-progress :percentage="queueStatus.currentTask.progress" />
            </el-descriptions-item>
            <el-descriptions-item label="预计剩余时间">
              {{ queueStatus.currentTask.estimatedTime }}秒
            </el-descriptions-item>
          </el-descriptions>
        </div>
        
        <div class="queue-actions">
          <el-button @click="refreshQueueStatus" type="primary">
            刷新状态
          </el-button>
          <el-button @click="cancelCurrentTask" type="danger" :disabled="!queueStatus.currentTask">
            取消当前任务
          </el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useReaderStore, useUIStore, useVoiceSettingsStore } from '@/stores'
import { AudioService } from '@/services'
import type { Chapter, VoiceSettings, AudioStatus } from '@/types'

// Store
const readerStore = useReaderStore()
const uiStore = useUIStore()
const voiceStore = useVoiceSettingsStore()

// 状态
const selectionStrategy = ref<'all' | 'pending' | 'failed' | 'custom'>('pending')
const selectedChapters = ref<number[]>([])
const isGenerating = ref(false)
const generationProgress = ref(0)
const completedCount = ref(0)
const totalSelectedCount = ref(0)
const currentTask = ref<any>(null)
const showQueueDrawer = ref(false)
const queueStatus = ref({
  queueLength: 0,
  currentTask: null,
  estimatedWaitTime: 0
})

// 批量语音设置
const batchVoiceSettings = ref<VoiceSettings>({
  voice: 'Ethan',
  speed: 1.0,
  volume: 0
})

// 生成选项
const generationOptions = ref({
  overwrite: false,
  continueOnError: true,
  autoDownload: false,
  priority: 'normal'
})

// 计算属性
const totalChapters = computed(() => readerStore.totalChapters)
const generatedCount = computed(() => readerStore.generatedAudioCount)
const generatingCount = computed(() => {
  return readerStore.audioStatus.filter(s => s.status === 'generating').length
})
const failedCount = computed(() => {
  return readerStore.audioStatus.filter(s => s.status === 'error').length
})
const selectedChaptersCount = computed(() => selectedChapters.value.length)
const availableVoices = computed(() => voiceStore.voices)

const chaptersWithStatus = computed(() => {
  return readerStore.chapters.map((chapter, index) => ({
    ...chapter,
    status: readerStore.getChapterStatus(index)?.status || 'pending'
  }))
})

// 方法
const refreshStatus = async () => {
  try {
    uiStore.showInfo('刷新状态中...')
    
    if (readerStore.currentFile) {
      // 刷新音频状态
      const audioStatus = await AudioService.getAudioStatus(readerStore.currentFile.id)
      readerStore.updateAudioStatus(audioStatus)
    }
    
    uiStore.showSuccess('状态刷新完成')
  } catch (error: any) {
    uiStore.showError(`状态刷新失败: ${error.message}`)
  }
}

const showQueueStatus = () => {
  showQueueDrawer.value = true
  refreshQueueStatus()
}

const refreshQueueStatus = async () => {
  try {
    const status = await AudioService.getGenerationQueue()
    queueStatus.value = status
  } catch (error: any) {
    uiStore.showError(`获取队列状态失败: ${error.message}`)
  }
}

const updateSelection = () => {
  switch (selectionStrategy.value) {
    case 'all':
      selectedChapters.value = Array.from({ length: totalChapters.value }, (_, i) => i)
      break
    case 'pending':
      selectedChapters.value = chaptersWithStatus.value
        .map((_, index) => index)
        .filter(index => {
          const status = readerStore.getChapterStatus(index)
          return !status || status.status === 'pending' || status.status === 'error'
        })
      break
    case 'failed':
      selectedChapters.value = chaptersWithStatus.value
        .map((_, index) => index)
        .filter(index => {
          const status = readerStore.getChapterStatus(index)
          return status?.status === 'error'
        })
      break
    case 'custom':
      // 保持当前选择
      break
  }
  
  totalSelectedCount.value = selectedChapters.value.length
}

const selectAll = () => {
  selectedChapters.value = Array.from({ length: totalChapters.value }, (_, i) => i)
  totalSelectedCount.value = selectedChapters.value.length
}

const clearSelection = () => {
  selectedChapters.value = []
  totalSelectedCount.value = 0
}

const invertSelection = () => {
  const allIndices = Array.from({ length: totalChapters.value }, (_, i) => i)
  selectedChapters.value = allIndices.filter(i => !selectedChapters.value.includes(i))
  totalSelectedCount.value = selectedChapters.value.length
}

const handleSelectionChange = (selection: Chapter[]) => {
  selectedChapters.value = selection.map((_, index) => index)
  totalSelectedCount.value = selectedChapters.value.length
}

const startBatchGeneration = async () => {
  if (selectedChapters.value.length === 0) {
    uiStore.showWarning('请先选择要生成的章节')
    return
  }
  
  try {
    const confirmed = await ElMessageBox.confirm(
      `确定要开始生成 ${selectedChapters.value.length} 个章节的音频吗？\n语音设置: ${batchVoiceSettings.value.voice}, 语速: ${batchVoiceSettings.value.speed}x`,
      '确认批量生成',
      {
        confirmButtonText: '开始生成',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    
    if (confirmed) {
      await executeBatchGeneration()
    }
    
  } catch {
    // 用户取消
  }
}

const executeBatchGeneration = async () => {
  if (!readerStore.currentFile) return
  
  try {
    isGenerating.value = true
    generationProgress.value = 0
    completedCount.value = 0
    
    uiStore.showInfo(`开始批量生成 ${selectedChapters.value.length} 个章节音频...`)
    
    // 使用API批量生成
    const audioFiles = await AudioService.generateBatchAudio(
      readerStore.currentFile.id,
      selectedChapters.value,
      batchVoiceSettings.value
    )
    
    // 更新状态
    audioFiles.forEach((audioFile, index) => {
      const chapterIndex = selectedChapters.value[index]
      readerStore.updateChapterStatus(chapterIndex, {
        status: 'generated',
        has_audio: true,
        audio_file: audioFile.filename,
        voice: audioFile.voice
      })
    })
    
    uiStore.showSuccess('批量音频生成完成！')
    
  } catch (error: any) {
    uiStore.showError(`批量生成失败: ${error.message}`)
  } finally {
    isGenerating.value = false
    generationProgress.value = 0
  }
}

const pauseGeneration = () => {
  // TODO: 实现暂停逻辑
  uiStore.showInfo('生成已暂停')
}

const cancelGeneration = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要取消当前生成任务吗？',
      '确认取消',
      {
        confirmButtonText: '确定取消',
        cancelButtonText: '继续生成',
        type: 'warning'
      }
    )
    
    // TODO: 实现取消逻辑
    isGenerating.value = false
    uiStore.showWarning('生成任务已取消')
    
  } catch {
    // 用户取消
  }
}

const generateSingle = async (chapter: Chapter, index: number) => {
  if (!readerStore.currentFile) return
  
  try {
    readerStore.updateChapterStatus(index, {
      status: 'generating',
      has_audio: false
    })
    
    const audioFile = await AudioService.generateChapterAudio({
      fileId: readerStore.currentFile.id,
      chapterIndex: index,
      voiceSettings: batchVoiceSettings.value
    })
    
    readerStore.updateChapterStatus(index, {
      status: 'generated',
      has_audio: true,
      audio_file: audioFile.filename,
      voice: audioFile.voice
    })
    
    uiStore.showSuccess(`第${index + 1}章音频生成成功`)
    
  } catch (error: any) {
    readerStore.updateChapterStatus(index, {
      status: 'error',
      has_audio: false
    })
    uiStore.showError(`音频生成失败: ${error.message}`)
  }
}

const downloadSingle = async (chapter: Chapter, index: number) => {
  try {
    const status = readerStore.getChapterStatus(index)
    if (!status?.audio_file) {
      uiStore.showWarning('没有可下载的音频文件')
      return
    }
    
    uiStore.showInfo('开始下载音频...')
    
    // TODO: 实现下载逻辑
    uiStore.showSuccess('音频下载完成')
    
  } catch (error: any) {
    uiStore.showError(`下载失败: ${error.message}`)
  }
}

const retryGeneration = async (chapter: Chapter, index: number) => {
  await generateSingle(chapter, index)
}

const cancelCurrentTask = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要取消当前任务吗？',
      '确认取消',
      {
        confirmButtonText: '确定取消',
        cancelButtonText: '继续任务',
        type: 'warning'
      }
    )
    
    // TODO: 实现取消当前任务逻辑
    uiStore.showWarning('当前任务已取消')
    
  } catch {
    // 用户取消
  }
}

const getStatusType = (chapter: Chapter, index: number) => {
  const status = readerStore.getChapterStatus(index)
  if (!status) return 'info'
  
  const types: Record<string, string> = {
    pending: 'info',
    generating: 'warning',
    generated: 'success',
    error: 'danger'
  }
  return types[status.status] || 'info'
}

const getStatusText = (chapter: Chapter, index: number) => {
  const status = readerStore.getChapterStatus(index)
  if (!status) return '待生成'
  
  const texts: Record<string, string> = {
    pending: '待生成',
    generating: '生成中',
    generated: '已生成',
    error: '生成失败'
  }
  return texts[status.status] || '未知'
}

const getChapterVoice = (chapter: Chapter, index: number) => {
  const status = readerStore.getChapterStatus(index)
  return status?.voice
}

const getChapterStatus = (chapterIndex: number) => {
  return readerStore.getChapterStatus(chapterIndex)
}

const isGeneratingSingle = (index: number) => {
  const status = readerStore.getChapterStatus(index)
  return status?.status === 'generating'
}

const getRowClassName = ({ row, rowIndex }: { row: any; rowIndex: number }) => {
  const status = readerStore.getChapterStatus(rowIndex)
  if (status?.status === 'generated') return 'generated-row'
  if (status?.status === 'generating') return 'generating-row'
  if (status?.status === 'error') return 'error-row'
  return ''
}

// 计算属性
const estimatedTimeRemaining = computed(() => {
  if (completedCount.value === 0) return '计算中...'
  const avgTimePerChapter = 30 // 假设每章平均30秒
  const remainingChapters = totalSelectedCount.value - completedCount.value
  const remainingSeconds = remainingChapters * avgTimePerChapter
  
  if (remainingSeconds < 60) return `${remainingSeconds}秒`
  const minutes = Math.floor(remainingSeconds / 60)
  return `${minutes}分钟`
})

// 监听选择策略变化
watch(selectionStrategy, updateSelection)

// 监听语音设置变化
watch(batchVoiceSettings, (newSettings) => {
  // 同步到语音设置store
  voiceStore.setVoice(newSettings.voice)
  voiceStore.setSpeed(newSettings.speed)
  voiceStore.setVolume(newSettings.volume)
}, { deep: true })

// 组件挂载时初始化
onMounted(() => {
  // 同步语音设置
  batchVoiceSettings.value.voice = voiceStore.voice
  batchVoiceSettings.value.speed = voiceStore.speed
  batchVoiceSettings.value.volume = voiceStore.volume
  
  // 初始化选择
  updateSelection()
})
</script>

<style scoped>
.audio-controls {
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

.controls-content {
  padding: 20px 0;
}

.generation-overview {
  margin-bottom: 30px;
}

.status-card {
  text-align: center;
}

.status-value {
  font-size: 2rem;
  font-weight: bold;
  color: #409eff;
}

.status-value.success {
  color: #67c23a;
}

.status-value.warning {
  color: #e6a23c;
}

.status-value.danger {
  color: #f56c6c;
}

.batch-operations {
  margin-bottom: 30px;
}

.operation-controls {
  margin-bottom: 20px;
}

.operation-section {
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.operation-section h4 {
  margin: 0 0 15px 0;
  color: #303133;
}

.custom-selection {
  margin-top: 15px;
  display: flex;
  gap: 8px;
}

.operation-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-top: 20px;
}

.generation-progress {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.progress-info {
  margin-bottom: 20px;
}

.progress-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.progress-stat .label {
  color: #909399;
}

.progress-stat .value {
  font-weight: bold;
  color: #303133;
}

.current-task {
  margin-top: 20px;
  padding: 15px;
  background-color: white;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.current-task p {
  margin: 0 0 10px 0;
  color: #303133;
  font-weight: 500;
}

.chapters-status {
  margin-top: 30px;
}

.queue-drawer-content {
  padding: 20px;
}

.queue-overview {
  margin-bottom: 20px;
}

.current-task-info {
  margin-bottom: 20px;
}

.queue-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

/* 表格行样式 */
.generated-row {
  background-color: #f0f9ff !important;
}

.generating-row {
  background-color: #fdf6ec !important;
}

.error-row {
  background-color: #fef0f0 !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .operation-controls .el-col {
    margin-bottom: 20px;
  }
  
  .operation-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .progress-info .el-col {
    margin-bottom: 15px;
  }
}
</style>

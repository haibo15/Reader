<template>
  <div class="chapters-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>📖 章节列表</span>
          <div class="header-actions">
            <el-button
              type="primary"
              @click="generateAllAudio"
              :loading="isGenerating"
              :disabled="!hasFile"
            >
              生成全部音频
            </el-button>
            <el-button
              @click="generateSelectedAudio"
              :loading="isGenerating"
              :disabled="selectedChaptersCount === 0"
            >
              生成选中章节 ({{ selectedChaptersCount }})
            </el-button>
            <el-button
              @click="selectAllChapters"
              :disabled="totalChapters === 0"
            >
              全选
            </el-button>
            <el-button
              @click="clearSelection"
              :disabled="selectedChaptersCount === 0"
            >
              清除选择
            </el-button>
          </div>
        </div>
      </template>

      <div class="chapters-content">
        <!-- 章节统计 -->
        <div class="chapters-stats">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-statistic title="总章节数" :value="totalChapters" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="已生成音频" :value="generatedAudioCount" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="选中章节" :value="selectedChaptersCount" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="生成进度" :value="audioGenerationProgress" suffix="%" />
            </el-col>
          </el-row>
        </div>

        <!-- 章节表格 -->
        <el-table
          :data="chapters"
          @selection-change="handleSelectionChange"
          style="width: 100%"
          v-loading="isGenerating"
          element-loading-text="正在生成音频..."
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="title" label="章节标题" min-width="200" />
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
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row, $index }">
              <el-button
                size="small"
                @click="generateAudio($index)"
                :loading="row.generating"
                :disabled="getChapterStatus($index)?.status === 'generated'"
              >
                {{ getChapterStatus($index)?.status === 'generated' ? '已生成' : '生成音频' }}
              </el-button>
              <el-button
                v-if="getChapterStatus($index)?.status === 'generated'"
                size="small"
                type="success"
                @click="playAudio(row, $index)"
              >
                播放
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 批量操作提示 -->
        <div v-if="selectedChaptersCount > 0" class="batch-actions-tip">
          <el-alert
            :title="`已选择 ${selectedChaptersCount} 个章节`"
            type="info"
            :closable="false"
            show-icon
          >
            <template #default>
              <p>点击"生成选中章节"按钮开始批量生成音频</p>
            </template>
          </el-alert>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useReaderStore, useUIStore } from '@/stores'
import { AudioService } from '@/services'
import type { Chapter, VoiceSettings } from '@/types'

// Props
interface Props {
  chapters: Chapter[]
}

const props = defineProps<Props>()

// Store
const readerStore = useReaderStore()
const uiStore = useUIStore()

// 计算属性
const hasFile = computed(() => readerStore.hasFile)
const totalChapters = computed(() => readerStore.totalChapters)
const selectedChapters = computed(() => readerStore.selectedChapters)
const selectedChaptersCount = computed(() => readerStore.selectedChaptersCount)
const isGenerating = computed(() => readerStore.isGenerating)
const generatedAudioCount = computed(() => readerStore.generatedAudioCount)
const audioGenerationProgress = computed(() => readerStore.audioGenerationProgress)

// 方法
const handleSelectionChange = (selection: Chapter[]) => {
  const indices = selection.map((_, index) => index)
  readerStore.setSelectedChapters(indices)
}

const selectAllChapters = () => {
  readerStore.selectAllChapters()
  uiStore.showInfo(`已选择所有 ${totalChapters.value} 个章节`)
}

const clearSelection = () => {
  readerStore.clearSelection()
  uiStore.showInfo('已清除所有选择')
}

const generateAudio = async (chapterIndex: number) => {
  if (!readerStore.currentFile) return

  try {
    readerStore.setGenerating(true)

    // 更新章节状态为生成中
    readerStore.updateChapterStatus(chapterIndex, {
      status: 'generating',
      has_audio: false
    })

    // 获取当前语音设置
    const voiceSettings: VoiceSettings = {
      voice: 'Ethan', // 这里应该从voiceStore获取
      speed: 1.0,
      volume: 0
    }

    // 使用真实API生成音频
    const audioFile = await AudioService.generateChapterAudio({
      fileId: readerStore.currentFile.id,
      chapterIndex,
      voiceSettings
    })

    // 更新章节状态为已生成
    readerStore.updateChapterStatus(chapterIndex, {
      status: 'generated',
      has_audio: true,
      audio_file: audioFile.filename,
      voice: audioFile.voice
    })

    uiStore.showSuccess(`第${chapterIndex + 1}章音频生成成功`)

  } catch (error: any) {
    readerStore.updateChapterStatus(chapterIndex, {
      status: 'error',
      has_audio: false
    })
    uiStore.showError(`音频生成失败: ${error.message}`)
  } finally {
    readerStore.setGenerating(false)
  }
}

const generateAllAudio = async () => {
  if (!readerStore.currentFile) return

  try {
    readerStore.setGenerating(true)
    uiStore.showInfo('开始生成所有章节音频...')

    // 获取当前语音设置
    const voiceSettings: VoiceSettings = {
      voice: 'Ethan', // 这里应该从voiceStore获取
      speed: 1.0,
      volume: 0
    }

    // 使用真实API批量生成音频
    const audioFiles = await AudioService.generateBatchAudio(
      readerStore.currentFile.id,
      Array.from({ length: props.chapters.length }, (_, i) => i),
      voiceSettings
    )

    // 更新所有章节状态
    audioFiles.forEach((audioFile, index) => {
      readerStore.updateChapterStatus(index, {
        status: 'generated',
        has_audio: true,
        audio_file: audioFile.filename,
        voice: audioFile.voice
      })
    })

    uiStore.showSuccess('所有章节音频生成完成！')

  } catch (error: any) {
    uiStore.showError(`批量生成失败: ${error.message}`)
  } finally {
    readerStore.setGenerating(false)
    readerStore.updateProgress(0)
  }
}

const generateSelectedAudio = async () => {
  if (selectedChaptersCount.value === 0) {
    uiStore.showWarning('请先选择要生成的章节')
    return
  }

  if (!readerStore.currentFile) return

  try {
    readerStore.setGenerating(true)
    uiStore.showInfo(`开始生成选中的 ${selectedChaptersCount.value} 个章节音频...`)

    // 获取当前语音设置
    const voiceSettings: VoiceSettings = {
      voice: 'Ethan', // 这里应该从voiceStore获取
      speed: 1.0,
      volume: 0
    }

    // 使用真实API批量生成音频
    const audioFiles = await AudioService.generateBatchAudio(
      readerStore.currentFile.id,
      selectedChapters.value,
      voiceSettings
    )

    // 更新选中章节状态
    selectedChapters.value.forEach((index, arrayIndex) => {
      const audioFile = audioFiles[arrayIndex]
      if (audioFile) {
        readerStore.updateChapterStatus(index, {
          status: 'generated',
          has_audio: true,
          audio_file: audioFile.filename,
          voice: audioFile.voice
        })
      }
    })

    uiStore.showSuccess('选中章节音频生成完成！')

  } catch (error: any) {
    uiStore.showError(`批量生成失败: ${error.message}`)
  } finally {
    readerStore.setGenerating(false)
    readerStore.updateProgress(0)
  }
}

const playAudio = (chapter: Chapter, index: number) => {
  uiStore.showInfo(`播放第${index + 1}章音频`)
  // TODO: 实现音频播放逻辑
}

const getChapterStatus = (chapterIndex: number) => {
  return readerStore.getChapterStatus(chapterIndex)
}

const getStatusType = (chapter: Chapter, index: number) => {
  const status = getChapterStatus(index)
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
  const status = getChapterStatus(index)
  if (!status) return '待生成'

  const texts: Record<string, string> = {
    pending: '待生成',
    generating: '生成中',
    generated: '已生成',
    error: '生成失败'
  }
  return texts[status.status] || '未知'
}
</script>

<style scoped>
.chapters-list {
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

.chapters-content {
  padding: 20px 0;
}

.chapters-stats {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.batch-actions-tip {
  margin-top: 20px;
}

.el-table {
  margin-top: 20px;
}

.el-statistic {
  text-align: center;
}
</style>

<template>
  <div class="reader-app">
    <el-container>
      <!-- 头部 -->
      <el-header class="app-header">
        <div class="header-content">
          <div class="logo">
            <h1>📚 智能阅读器</h1>
            <p>AI驱动的文档转语音工具</p>
          </div>
          <div class="header-actions">
            <el-button @click="showHistory" type="info" size="small">
              📚 文档历史
            </el-button>
            <el-button @click="showSettings" type="primary" size="small">
              ⚙️ 设置
            </el-button>
          </div>
        </div>
      </el-header>

      <!-- 主要内容 -->
      <el-main class="app-main">
        <!-- 上传区域 -->
        <div v-if="uiStore.isUploadSection" class="section">
          <FileUpload @upload-success="onUploadSuccess" @show-history="showHistory" />
        </div>

        <!-- 文件信息区域 -->
        <div v-if="uiStore.isFileInfoSection && readerStore.hasFile" class="section">
          <FileInfo :file="readerStore.currentFile!" />
        </div>

        <!-- 章节列表区域 -->
        <div v-if="uiStore.isChaptersSection && readerStore.hasFile" class="section">
          <ChaptersList :chapters="readerStore.chapters" />
        </div>

        <!-- 语音设置区域 -->
        <div v-if="uiStore.isVoiceSettingsSection && readerStore.hasFile" class="section">
          <VoiceSettings />
        </div>

        <!-- 音频控制区域 -->
        <div v-if="uiStore.isAudioControlsSection && readerStore.hasFile" class="section">
          <AudioControls />
        </div>

        <!-- 音频播放器区域 -->
        <div v-if="uiStore.isAudioPlayerSection && readerStore.hasFile" class="section">
          <AudioPlayer />
        </div>

        <!-- 无文件状态 -->
        <div v-if="!readerStore.hasFile && !uiStore.isUploadSection" class="no-file-state">
          <el-card>
            <el-empty description="请先上传文档开始使用">
              <el-button type="primary" @click="uiStore.setActiveSection('upload')">
                上传文档
              </el-button>
            </el-empty>
          </el-card>
        </div>
      </el-main>
    </el-container>

    <!-- 历史文档抽屉 -->
    <el-drawer
      v-model="uiStore.showHistoryDrawer"
      title="📚 文档历史"
      direction="rtl"
      size="80%"
    >
      <DocumentHistory />
    </el-drawer>

    <!-- 设置抽屉 -->
    <el-drawer
      v-model="uiStore.showSettingsDrawer"
      title="⚙️ 应用设置"
      direction="rtl"
      size="500px"
    >
      <div class="settings-content">
        <el-empty description="设置功能开发中...">
          <el-button type="primary" @click="uiStore.toggleSettingsDrawer">
            关闭设置
          </el-button>
        </el-empty>
      </div>
    </el-drawer>

    <!-- 通知区域 -->
    <div class="notifications-area">
      <div
        v-for="notification in uiStore.notifications"
        :key="notification.id"
        class="notification"
        :class="`notification-${notification.type}`"
      >
        <span class="notification-message">{{ notification.message }}</span>
        <el-button
          size="small"
          type="text"
          @click="uiStore.removeNotification(notification.id)"
        >
          ×
        </el-button>
      </div>
    </div>

    <!-- 加载遮罩 -->
    <el-loading
      v-model:fullscreen="uiStore.isLoading"
      :text="uiStore.loadingText"
      background="rgba(0, 0, 0, 0.8)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useReaderStore, useUIStore } from '@/stores'
import FileUpload from '@/components/FileUpload.vue'
import FileInfo from '@/components/FileInfo.vue'
import ChaptersList from '@/components/ChaptersList.vue'
import VoiceSettings from '@/components/VoiceSettings.vue'
import AudioControls from '@/components/AudioControls.vue'
import AudioPlayer from '@/components/AudioPlayer.vue'
import DocumentHistory from '@/components/DocumentHistory.vue'

// Store
const readerStore = useReaderStore()
const uiStore = useUIStore()

// 计算属性
const hasFile = computed(() => readerStore.hasFile)
const hasChapters = computed(() => readerStore.totalChapters > 0)
const hasGeneratedAudio = computed(() => readerStore.generatedAudioCount > 0)

// 方法
const onUploadSuccess = (fileInfo: any) => {
  uiStore.showSuccess(`文件 "${fileInfo.display_name}" 上传成功！`)
}

const showHistory = () => {
  uiStore.toggleHistoryDrawer()
}

const showSettings = () => {
  uiStore.toggleSettingsDrawer()
}

const showSuccess = (message: string) => {
  uiStore.showSuccess(message)
}

const showError = (message: string) => {
  uiStore.showError(message)
}

const showInfo = (message: string) => {
  uiStore.showInfo(message)
}

const showWarning = (message: string) => {
  uiStore.showWarning(message)
}

// 组件挂载时初始化
onMounted(() => {
  // 设置默认活动区域为上传
  if (!uiStore.activeSection) {
    uiStore.setActiveSection('upload')
  }
})
</script>

<style scoped>
.reader-app {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 20px;
}

.logo h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 300;
}

.logo p {
  margin: 5px 0 0 0;
  font-size: 1rem;
  opacity: 0.9;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.app-main {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.section {
  margin-bottom: 20px;
}

.no-file-state {
  text-align: center;
  padding: 60px 20px;
}

.audio-controls-placeholder,
.audio-player-placeholder {
  text-align: center;
  padding: 40px 20px;
}

.placeholder-content {
  padding: 40px 0;
}

.history-content,
.settings-content {
  padding: 20px;
}

.notifications-area {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  max-width: 300px;
}

.notification {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 10px;
  border-radius: 4px;
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.notification-success {
  background-color: #67c23a;
}

.notification-warning {
  background-color: #e6a23c;
}

.notification-error {
  background-color: #f56c6c;
}

.notification-info {
  background-color: #909399;
}

.notification-message {
  flex: 1;
  margin-right: 10px;
}

.notification button {
  color: white;
  font-size: 16px;
  padding: 0;
  min-height: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 15px;
    padding: 15px 20px;
  }

  .logo h1 {
    font-size: 1.5rem;
  }

  .app-main {
    padding: 15px;
  }

  .header-actions {
    gap: 8px;
  }
}
</style>

<template>
  <div class="store-test">
    <el-container>
      <el-header>
        <div class="header-content">
          <h1>🧪 Store 测试页面</h1>
          <p>测试Pinia状态管理是否正常工作</p>
        </div>
      </el-header>

      <el-main>
        <!-- Reader Store 测试 -->
        <el-card class="test-card">
          <template #header>
            <div class="card-header">
              <span>📚 Reader Store 测试</span>
            </div>
          </template>

          <div class="store-test-content">
            <el-row :gutter="20">
              <el-col :span="12">
                <h4>当前状态：</h4>
                <el-descriptions :column="1" border>
                  <el-descriptions-item label="是否有文件">
                    {{ readerStore.hasFile ? '是' : '否' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="章节数量">
                    {{ readerStore.totalChapters }}
                  </el-descriptions-item>
                  <el-descriptions-item label="选中章节">
                    {{ readerStore.selectedChaptersCount }}
                  </el-descriptions-item>
                  <el-descriptions-item label="是否生成中">
                    {{ readerStore.isGenerating ? '是' : '否' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="生成进度">
                    {{ readerStore.generationProgress }}%
                  </el-descriptions-item>
                </el-descriptions>
              </el-col>

              <el-col :span="12">
                <h4>操作测试：</h4>
                <div class="test-buttons">
                  <el-button @click="testSetFile" type="primary">
                    设置测试文件
                  </el-button>
                  <el-button @click="testSetChapters" type="success">
                    设置测试章节
                  </el-button>
                  <el-button @click="testToggleSelection" type="warning">
                    切换选择
                  </el-button>
                  <el-button @click="testGenerating" type="info">
                    测试生成状态
                  </el-button>
                  <el-button @click="testReset" type="danger">
                    重置状态
                  </el-button>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>

        <!-- Voice Settings Store 测试 -->
        <el-card class="test-card">
          <template #header>
            <div class="card-header">
              <span>🎵 Voice Settings Store 测试</span>
            </div>
          </template>

          <div class="store-test-content">
            <el-row :gutter="20">
              <el-col :span="12">
                <h4>当前设置：</h4>
                <el-descriptions :column="1" border>
                  <el-descriptions-item label="当前语音">
                    {{ voiceStore.currentVoice?.label }}
                  </el-descriptions-item>
                  <el-descriptions-item label="语速">
                    {{ voiceStore.speed }}x
                  </el-descriptions-item>
                  <el-descriptions-item label="音量">
                    {{ voiceStore.volume }}
                  </el-descriptions-item>
                </el-descriptions>
              </el-col>

              <el-col :span="12">
                <h4>设置测试：</h4>
                <div class="test-controls">
                  <el-select v-model="voiceStore.voice" placeholder="选择语音">
                    <el-option
                      v-for="voice in voiceStore.voices"
                      :key="voice.value"
                      :label="voice.label"
                      :value="voice.value"
                    />
                  </el-select>

                  <el-slider
                    v-model="voiceStore.speed"
                    :min="0.5"
                    :max="2.0"
                    :step="0.1"
                    show-input
                    label="语速"
                  />

                  <el-slider
                    v-model="voiceStore.volume"
                    :min="-20"
                    :max="20"
                    :step="1"
                    show-input
                    label="音量"
                  />

                  <el-button @click="voiceStore.resetToDefaults" type="warning">
                    重置默认值
                  </el-button>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>

        <!-- UI Store 测试 -->
        <el-card class="test-card">
          <template #header>
            <div class="card-header">
              <span>🎨 UI Store 测试</span>
            </div>
          </template>

          <div class="store-test-content">
            <el-row :gutter="20">
              <el-col :span="12">
                <h4>当前状态：</h4>
                <el-descriptions :column="1" border>
                  <el-descriptions-item label="活动区域">
                    {{ uiStore.activeSection }}
                  </el-descriptions-item>
                  <el-descriptions-item label="历史抽屉">
                    {{ uiStore.showHistoryDrawer ? '显示' : '隐藏' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="设置抽屉">
                    {{ uiStore.showSettingsDrawer ? '显示' : '隐藏' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="加载状态">
                    {{ uiStore.isLoading ? '是' : '否' }}
                  </el-descriptions-item>
                </el-descriptions>
              </el-col>

              <el-col :span="12">
                <h4>操作测试：</h4>
                <div class="test-buttons">
                  <el-button @click="uiStore.toggleHistoryDrawer" type="primary">
                    切换历史抽屉
                  </el-button>
                  <el-button @click="uiStore.toggleSettingsDrawer" type="success">
                    切换设置抽屉
                  </el-button>
                  <el-button @click="testLoading" type="warning">
                    测试加载状态
                  </el-button>
                  <el-button @click="testNotifications" type="info">
                    测试通知
                  </el-button>
                  <el-button @click="uiStore.reset" type="danger">
                    重置UI状态
                  </el-button>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>

        <!-- 通知显示区域 -->
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
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useReaderStore, useVoiceSettingsStore, useUIStore } from '@/stores'

// 使用Store
const readerStore = useReaderStore()
const voiceStore = useVoiceSettingsStore()
const uiStore = useUIStore()

// 测试方法
const testSetFile = () => {
  readerStore.setCurrentFile({
    id: 'test-file-001',
    name: '测试文档.pdf',
    total_chapters: 5,
    file_size: 1024 * 1024,
    upload_time: new Date().toISOString()
  })
  uiStore.showSuccess('测试文件设置成功！')
}

const testSetChapters = () => {
  const testChapters = [
    { title: '第一章 引言', content: '这是第一章的内容...', length: 500 },
    { title: '第二章 正文', content: '这是第二章的内容...', length: 800 },
    { title: '第三章 总结', content: '这是第三章的内容...', length: 300 }
  ]
  readerStore.setChapters(testChapters)
  uiStore.showSuccess('测试章节设置成功！')
}

const testToggleSelection = () => {
  if (readerStore.totalChapters > 0) {
    readerStore.toggleChapterSelection(0)
    uiStore.showInfo(`切换第1章选择状态，当前选中: ${readerStore.selectedChaptersCount} 章`)
  }
}

const testGenerating = () => {
  readerStore.setGenerating(true)
  readerStore.updateProgress(50)
  setTimeout(() => {
    readerStore.setGenerating(false)
    readerStore.updateProgress(0)
    uiStore.showSuccess('生成状态测试完成！')
  }, 2000)
}

const testReset = () => {
  readerStore.reset()
  uiStore.showWarning('Reader Store已重置！')
}

const testLoading = () => {
  uiStore.showLoading('测试加载状态...')
  setTimeout(() => {
    uiStore.hideLoading()
    uiStore.showSuccess('加载状态测试完成！')
  }, 2000)
}

const testNotifications = () => {
  uiStore.showSuccess('成功通知测试')
  uiStore.showWarning('警告通知测试')
  uiStore.showError('错误通知测试')
  uiStore.showInfo('信息通知测试')
}

// 组件挂载时加载语音设置
onMounted(() => {
  voiceStore.loadFromStorage()
})
</script>

<style scoped>
.store-test {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.header-content {
  text-align: center;
  color: white;
  padding: 20px 0;
}

.header-content h1 {
  margin: 0;
  font-size: 2.5rem;
  font-weight: 300;
}

.header-content p {
  margin: 10px 0 0 0;
  font-size: 1.1rem;
  opacity: 0.9;
}

.el-main {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.store-test-content {
  padding: 20px 0;
}

.test-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.test-controls {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.test-controls .el-select {
  width: 100%;
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
</style>

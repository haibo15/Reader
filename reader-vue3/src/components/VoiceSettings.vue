<template>
  <div class="voice-settings">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>🎵 语音设置</span>
          <div class="header-actions">
            <el-button @click="resetToDefaults" type="warning" size="small">
              重置默认值
            </el-button>
            <el-button @click="saveSettings" type="primary" size="small">
              保存设置
            </el-button>
          </div>
        </div>
      </template>

      <div class="voice-settings-content">
        <el-row :gutter="30">
          <!-- 语音选择 -->
          <el-col :span="12">
            <div class="setting-section">
              <h3>🎤 语音角色</h3>
              <p class="section-desc">选择您喜欢的语音角色</p>

              <div class="voice-grid">
                <div
                  v-for="voice in voices"
                  :key="voice.value"
                  class="voice-option"
                  :class="{ active: voice.value === currentVoice }"
                  @click="selectVoice(voice.value)"
                >
                  <div class="voice-icon">
                    {{ voice.value === 'Ethan' ? '👨' : '👩' }}
                  </div>
                  <div class="voice-info">
                    <div class="voice-name">{{ voice.label }}</div>
                    <div class="voice-preview">
                      <el-button
                        size="small"
                        @click.stop="playPreview(voice.preview)"
                        type="text"
                      >
                        🔊 试听
                      </el-button>
                    </div>
                  </div>
                  <div class="voice-check" v-if="voice.value === currentVoice">
                    ✅
                  </div>
                </div>
              </div>
            </div>
          </el-col>

          <!-- 语音参数 -->
          <el-col :span="12">
            <div class="setting-section">
              <h3>⚙️ 语音参数</h3>
              <p class="section-desc">调整语音的播放参数</p>

              <div class="parameter-controls">
                <div class="control-item">
                  <label>语速调节</label>
                  <div class="control-content">
                    <el-slider
                      v-model="speed"
                      :min="0.5"
                      :max="2.0"
                      :step="0.1"
                      :show-input="true"
                      :show-input-controls="false"
                      input-size="small"
                      @change="onSpeedChange"
                    />
                    <div class="control-labels">
                      <span>慢</span>
                      <span>正常</span>
                      <span>快</span>
                    </div>
                  </div>
                </div>

                <div class="control-item">
                  <label>音量调节</label>
                  <div class="control-content">
                    <el-slider
                      v-model="volume"
                      :min="-20"
                      :max="20"
                      :step="1"
                      :show-input="true"
                      :show-input-controls="false"
                      input-size="small"
                      @change="onVolumeChange"
                    />
                    <div class="control-labels">
                      <span>静音</span>
                      <span>正常</span>
                      <span>最大</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>

        <!-- 当前设置预览 -->
        <div class="current-settings">
          <el-divider content-position="left">当前设置预览</el-divider>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-card shadow="hover" class="preview-card">
                <template #header>
                  <span>🎤 语音角色</span>
                </template>
                <div class="preview-content">
                  <div class="preview-value">{{ currentVoiceLabel }}</div>
                  <div class="preview-desc">当前使用的语音</div>
                </div>
              </el-card>
            </el-col>

            <el-col :span="8">
              <el-card shadow="hover" class="preview-card">
                <template #header>
                  <span>⚡ 语速</span>
                </template>
                <div class="preview-content">
                  <div class="preview-value">{{ speed }}x</div>
                  <div class="preview-desc">
                    {{ speed < 1 ? '较慢' : speed > 1 ? '较快' : '正常' }}语速
                  </div>
                </div>
              </el-card>
            </el-col>

            <el-col :span="8">
              <el-card shadow="hover" class="preview-card">
                <template #header>
                  <span>🔊 音量</span>
                </template>
                <div class="preview-content">
                  <div class="preview-value">{{ volume }}dB</div>
                  <div class="preview-desc">
                    {{ volume < 0 ? '较低' : volume > 0 ? '较高' : '正常' }}音量
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <!-- 应用设置 -->
        <div class="apply-settings">
          <el-divider content-position="left">应用设置</el-divider>
          <div class="apply-actions">
            <el-button
              type="primary"
              size="large"
              @click="applyToGeneration"
              :disabled="!hasChapters"
            >
              🎧 应用设置到音频生成
            </el-button>
            <el-button
              type="success"
              size="large"
              @click="showAudioControls"
            >
              🎵 前往音频生成
            </el-button>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useReaderStore, useVoiceSettingsStore, useUIStore } from '@/stores'

// Store
const readerStore = useReaderStore()
const voiceStore = useVoiceSettingsStore()
const uiStore = useUIStore()

// 计算属性
const hasChapters = computed(() => readerStore.totalChapters > 0)
const voices = computed(() => voiceStore.voices)
const currentVoice = computed(() => voiceStore.voice)
const currentVoiceLabel = computed(() => voiceStore.currentVoice?.label || '未知')
const speed = computed({
  get: () => voiceStore.speed,
  set: (value) => voiceStore.setSpeed(value)
})
const volume = computed({
  get: () => voiceStore.volume,
  set: (value) => voiceStore.setVolume(value)
})

// 方法
const selectVoice = (voice: string) => {
  voiceStore.setVoice(voice)
  uiStore.showInfo(`已选择语音: ${voice}`)
}

const onSpeedChange = (value: number) => {
  voiceStore.setSpeed(value)
  uiStore.showInfo(`语速已调整为: ${value}x`)
}

const onVolumeChange = (value: number) => {
  voiceStore.setVolume(value)
  uiStore.showInfo(`音量已调整为: ${value}dB`)
}

const resetToDefaults = () => {
  voiceStore.resetToDefaults()
  uiStore.showSuccess('已重置为默认设置')
}

const saveSettings = () => {
  voiceStore.saveToStorage()
  uiStore.showSuccess('设置已保存到本地存储')
}

const playPreview = (previewFile: string) => {
  uiStore.showInfo(`播放语音预览: ${previewFile}`)
  // TODO: 实现语音预览播放
}

const applyToGeneration = () => {
  uiStore.showSuccess('语音设置已应用，可以开始生成音频了')
}

const showAudioControls = () => {
  uiStore.setActiveSection('audioControls')
}

// 监听设置变化，自动保存
watch([currentVoice, speed, volume], () => {
  voiceStore.saveToStorage()
}, { deep: true })
</script>

<style scoped>
.voice-settings {
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

.voice-settings-content {
  padding: 20px 0;
}

.setting-section {
  margin-bottom: 30px;
}

.setting-section h3 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 18px;
}

.section-desc {
  margin: 0 0 20px 0;
  color: #909399;
  font-size: 14px;
}

.voice-grid {
  display: grid;
  gap: 12px;
}

.voice-option {
  display: flex;
  align-items: center;
  padding: 16px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.voice-option:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.voice-option.active {
  border-color: #67c23a;
  background-color: #f0f9ff;
}

.voice-icon {
  font-size: 24px;
  margin-right: 16px;
}

.voice-info {
  flex: 1;
}

.voice-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.voice-preview {
  font-size: 12px;
}

.voice-check {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 16px;
  color: #67c23a;
}

.parameter-controls {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.control-item {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.control-item label {
  font-weight: 500;
  color: #303133;
}

.control-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

.current-settings {
  margin-top: 40px;
}

.preview-card {
  text-align: center;
}

.preview-content {
  padding: 20px 0;
}

.preview-value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 8px;
}

.preview-desc {
  font-size: 14px;
  color: #909399;
}

.apply-settings {
  margin-top: 40px;
}

.apply-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-top: 20px;
}

.el-slider {
  margin: 0;
}
</style>

<template>
  <div class="api-test">
    <el-container>
      <el-header>
        <div class="header-content">
          <h1>🔌 API 服务测试页面</h1>
          <p>测试所有API服务是否正常工作</p>
        </div>
      </el-header>

      <el-main>
        <!-- 服务状态检查 -->
        <el-card class="test-card">
          <template #header>
            <div class="card-header">
              <span>📊 服务状态检查</span>
            </div>
          </template>

          <div class="service-status">
            <el-row :gutter="20">
              <el-col :span="8">
                <el-card shadow="hover" class="status-card">
                  <template #header>
                    <span>🌐 API连接</span>
                  </template>
                  <div class="status-content">
                    <el-tag :type="apiStatus.connected ? 'success' : 'danger'" size="large">
                      {{ apiStatus.connected ? '连接正常' : '连接失败' }}
                    </el-tag>
                    <p class="status-desc">
                      {{ apiStatus.connected ? 'API服务可以正常访问' : '无法连接到API服务' }}
                    </p>
                  </div>
                </el-card>
              </el-col>

              <el-col :span="8">
                <el-card shadow="hover" class="status-card">
                  <template #header>
                    <span>📁 文档服务</span>
                  </template>
                  <div class="status-content">
                    <el-tag :type="apiStatus.documentService ? 'success' : 'warning'" size="large">
                      {{ apiStatus.documentService ? '可用' : '测试中' }}
                    </el-tag>
                    <p class="status-desc">
                      {{ apiStatus.documentService ? '文档管理服务正常' : '正在测试文档服务' }}
                    </p>
                  </div>
                </el-card>
              </el-col>

              <el-col :span="8">
                <el-card shadow="hover" class="status-card">
                  <template #header>
                    <span>🎵 音频服务</span>
                  </template>
                  <div class="status-content">
                    <el-tag :type="apiStatus.audioService ? 'success' : 'warning'" size="large">
                      {{ apiStatus.audioService ? '可用' : '测试中' }}
                    </el-tag>
                    <p class="status-desc">
                      {{ apiStatus.audioService ? '音频生成服务正常' : '正在测试音频服务' }}
                    </p>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>

          <div class="status-actions">
            <el-button @click="checkAllServices" type="primary" :loading="checking">
              重新检查所有服务
            </el-button>
            <el-button @click="testDocumentService" type="success" :disabled="!apiStatus.connected">
              测试文档服务
            </el-button>
            <el-button @click="testAudioService" type="warning" :disabled="!apiStatus.connected">
              测试音频服务
            </el-button>
          </div>
        </el-card>

        <!-- 文档服务测试 -->
        <el-card class="test-card">
          <template #header>
            <div class="card-header">
              <span>📁 文档服务测试</span>
            </div>
          </template>

          <div class="service-test-content">
            <el-row :gutter="20">
              <el-col :span="12">
                <h4>支持格式查询：</h4>
                <el-button @click="testSupportedFormats" type="primary">
                  获取支持格式
                </el-button>

                <div v-if="supportedFormats" class="test-result">
                  <el-descriptions :column="1" border>
                    <el-descriptions-item label="支持格式">
                      {{ supportedFormats.formats.join(', ') }}
                    </el-descriptions-item>
                    <el-descriptions-item label="最大文件大小">
                      {{ formatFileSize(supportedFormats.maxSize) }}
                    </el-descriptions-item>
                    <el-descriptions-item label="描述">
                      {{ supportedFormats.description }}
                    </el-descriptions-item>
                  </el-descriptions>
                </div>
              </el-col>

              <el-col :span="12">
                <h4>文档验证测试：</h4>
                <el-upload
                  ref="testUploadRef"
                  :auto-upload="false"
                  :show-file-list="false"
                  :on-change="handleTestFileChange"
                  accept=".pdf,.txt,.epub,.docx"
                >
                  <el-button type="success">选择测试文件</el-button>
                </el-upload>

                <div v-if="testFile" class="test-file-info">
                  <p>已选择: {{ testFile.name }}</p>
                  <el-button @click="testFileValidation" type="warning" size="small">
                    验证文件格式
                  </el-button>
                </div>

                <div v-if="validationResult" class="test-result">
                  <el-alert
                    :title="validationResult.isValid ? '验证通过' : '验证失败'"
                    :type="validationResult.isValid ? 'success' : 'error'"
                    :description="validationResult.message"
                    show-icon
                  />
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>

        <!-- 音频服务测试 -->
        <el-card class="test-card">
          <template #header>
            <div class="card-header">
              <span>🎵 音频服务测试</span>
            </div>
          </template>

          <div class="service-test-content">
            <el-row :gutter="20">
              <el-col :span="12">
                <h4>语音列表查询：</h4>
                <el-button @click="testAvailableVoices" type="primary">
                  获取可用语音
                </el-button>

                <div v-if="availableVoices" class="test-result">
                  <el-table :data="availableVoices.voices" style="width: 100%">
                    <el-table-column prop="name" label="语音名称" />
                    <el-table-column prop="language" label="语言" />
                    <el-table-column prop="gender" label="性别" />
                  </el-table>
                </div>
              </el-col>

              <el-col :span="12">
                <h4>语音设置测试：</h4>
                <div class="voice-test-controls">
                  <el-select v-model="testVoiceSettings.voice" placeholder="选择语音">
                    <el-option
                      v-for="voice in availableVoices?.voices || []"
                      :key="voice.id"
                      :label="voice.name"
                      :value="voice.id"
                    />
                  </el-select>

                  <el-slider
                    v-model="testVoiceSettings.speed"
                    :min="0.5"
                    :max="2.0"
                    :step="0.1"
                    show-input
                    label="语速"
                  />

                  <el-button @click="testVoiceSettings" type="warning" :disabled="!testVoiceSettings.voice">
                    测试语音设置
                  </el-button>
                </div>

                <div v-if="voiceTestResult" class="test-result">
                  <el-descriptions :column="1" border>
                    <el-descriptions-item label="测试音频">
                      <el-button type="text" @click="playTestAudio">
                        🎵 播放测试音频
                      </el-button>
                    </el-descriptions-item>
                    <el-descriptions-item label="时长">
                      {{ voiceTestResult.duration }}秒
                    </el-descriptions-item>
                    <el-descriptions-item label="质量">
                      <el-tag :type="getQualityType(voiceTestResult.quality)">
                        {{ getQualityText(voiceTestResult.quality) }}
                      </el-tag>
                    </el-descriptions-item>
                  </el-descriptions>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>

        <!-- 测试结果日志 -->
        <el-card class="test-card">
          <template #header>
            <div class="card-header">
              <span>📝 测试日志</span>
              <el-button @click="clearLogs" type="text" size="small">
                清空日志
              </el-button>
            </div>
          </template>

          <div class="test-logs">
            <div
              v-for="log in testLogs"
              :key="log.id"
              class="log-item"
              :class="`log-${log.type}`"
            >
              <span class="log-time">{{ log.time }}</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
          </div>
        </el-card>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { DocumentService, AudioService, checkServicesHealth } from '@/services'
import type { VoiceSettings } from '@/types'

// 状态
const checking = ref(false)
const apiStatus = ref({
  connected: false,
  documentService: false,
  audioService: false
})

const supportedFormats = ref<any>(null)
const testFile = ref<File | null>(null)
const validationResult = ref<any>(null)
const availableVoices = ref<any>(null)
const voiceTestResult = ref<any>(null)
const testLogs = ref<Array<{
  id: string
  time: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
}>>([])

const testVoiceSettings = ref<VoiceSettings>({
  voice: '',
  speed: 1.0,
  volume: 0
})

// 方法
const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
  testLogs.value.unshift({
    id: Date.now().toString(),
    time: new Date().toLocaleTimeString(),
    message,
    type
  })
}

const clearLogs = () => {
  testLogs.value = []
}

const checkAllServices = async () => {
  checking.value = true
  addLog('开始检查所有服务状态...', 'info')

  try {
    // 检查API连接
    const isHealthy = await checkServicesHealth()
    apiStatus.value.connected = isHealthy

    if (isHealthy) {
      addLog('✅ API服务连接正常', 'success')
    } else {
      addLog('❌ API服务连接失败', 'error')
    }

    // 测试文档服务
    await testDocumentService()

    // 测试音频服务
    await testAudioService()

  } catch (error: any) {
    addLog(`❌ 服务检查失败: ${error.message}`, 'error')
  } finally {
    checking.value = false
  }
}

const testDocumentService = async () => {
  if (!apiStatus.value.connected) return

  try {
    addLog('测试文档服务...', 'info')

    // 测试获取支持格式
    const formats = await DocumentService.getSupportedFormats()
    supportedFormats.value = formats
    apiStatus.value.documentService = true

    addLog('✅ 文档服务测试通过', 'success')

  } catch (error: any) {
    addLog(`❌ 文档服务测试失败: ${error.message}`, 'error')
    apiStatus.value.documentService = false
  }
}

const testAudioService = async () => {
  if (!apiStatus.value.connected) return

  try {
    addLog('测试音频服务...', 'info')

    // 测试获取可用语音
    const voices = await AudioService.getAvailableVoices()
    availableVoices.value = voices
    apiStatus.value.audioService = true

    addLog('✅ 音频服务测试通过', 'success')

  } catch (error: any) {
    addLog(`❌ 音频服务测试失败: ${error.message}`, 'error')
    apiStatus.value.audioService = false
  }
}

const testSupportedFormats = async () => {
  try {
    addLog('获取支持格式...', 'info')
    const formats = await DocumentService.getSupportedFormats()
    supportedFormats.value = formats
    addLog('✅ 支持格式获取成功', 'success')
  } catch (error: any) {
    addLog(`❌ 获取支持格式失败: ${error.message}`, 'error')
  }
}

const handleTestFileChange = (file: any) => {
  testFile.value = file.raw
  validationResult.value = null
  addLog(`选择测试文件: ${file.raw.name}`, 'info')
}

const testFileValidation = async () => {
  if (!testFile.value) return

  try {
    addLog('验证文件格式...', 'info')
    const result = await DocumentService.validateDocument(testFile.value)
    validationResult.value = result

    if (result.isValid) {
      addLog('✅ 文件格式验证通过', 'success')
    } else {
      addLog(`❌ 文件格式验证失败: ${result.message}`, 'error')
    }
  } catch (error: any) {
    addLog(`❌ 文件验证失败: ${error.message}`, 'error')
  }
}

const testAvailableVoices = async () => {
  try {
    addLog('获取可用语音...', 'info')
    const voices = await AudioService.getAvailableVoices()
    availableVoices.value = voices
    addLog('✅ 可用语音获取成功', 'success')
  } catch (error: any) {
    addLog(`❌ 获取可用语音失败: ${error.message}`, 'error')
  }
}

const testVoiceSettings = async () => {
  if (!testVoiceSettings.value.voice) {
    ElMessage.warning('请先选择语音')
    return
  }

  try {
    addLog('测试语音设置...', 'info')
    const result = await AudioService.testVoiceSettings(testVoiceSettings.value)
    voiceTestResult.value = result
    addLog('✅ 语音设置测试成功', 'success')
  } catch (error: any) {
    addLog(`❌ 语音设置测试失败: ${error.message}`, 'error')
  }
}

const playTestAudio = () => {
  if (voiceTestResult.value?.testAudioUrl) {
    addLog('播放测试音频...', 'info')
    // TODO: 实现音频播放
    ElMessage.info('音频播放功能开发中...')
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getQualityType = (quality: string) => {
  const types: Record<string, string> = {
    good: 'success',
    acceptable: 'warning',
    poor: 'danger'
  }
  return types[quality] || 'info'
}

const getQualityText = (quality: string) => {
  const texts: Record<string, string> = {
    good: '优秀',
    acceptable: '可接受',
    poor: '较差'
  }
  return texts[quality] || '未知'
}

// 组件挂载时检查服务状态
onMounted(() => {
  checkAllServices()
})
</script>

<style scoped>
.api-test {
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

.service-status {
  margin-bottom: 20px;
}

.status-card {
  text-align: center;
}

.status-content {
  padding: 20px 0;
}

.status-desc {
  margin: 15px 0 0 0;
  color: #909399;
  font-size: 14px;
}

.status-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
}

.service-test-content {
  padding: 20px 0;
}

.service-test-content h4 {
  margin: 0 0 15px 0;
  color: #303133;
}

.test-result {
  margin-top: 20px;
}

.test-file-info {
  margin: 15px 0;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.voice-test-controls {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.voice-test-controls .el-select {
  width: 100%;
}

.test-logs {
  max-height: 300px;
  overflow-y: auto;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.log-item {
  display: flex;
  gap: 15px;
  padding: 8px 0;
  border-bottom: 1px solid #e4e7ed;
}

.log-item:last-child {
  border-bottom: none;
}

.log-time {
  color: #909399;
  font-size: 12px;
  min-width: 80px;
}

.log-message {
  flex: 1;
}

.log-info {
  color: #409eff;
}

.log-success {
  color: #67c23a;
}

.log-warning {
  color: #e6a23c;
}

.log-error {
  color: #f56c6c;
}
</style>

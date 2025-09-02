# Vue 3 迁移重构指南

## 概述

本文档提供从当前HTML+JS架构迁移到Vue 3的完整操作步骤。当项目需要添加大量新功能时，Vue 3的组件化、响应式数据管理和状态管理能力将显著提升开发效率和代码质量。

## 迁移前准备

### 1. 环境准备
```bash
# 安装Node.js (推荐18.x或更高版本)
# 安装Vue CLI或使用Vite
npm install -g @vue/cli
# 或者使用Vite (推荐)
npm create vue@latest reader-vue3
```

### 2. 项目结构规划
```
reader-vue3/
├── public/                 # 静态资源
├── src/
│   ├── components/         # Vue组件
│   ├── views/             # 页面组件
│   ├── stores/            # Pinia状态管理
│   ├── services/          # API服务
│   ├── utils/             # 工具函数
│   ├── assets/            # 样式和资源
│   ├── router/            # 路由配置
│   ├── App.vue            # 根组件
│   └── main.js            # 入口文件
├── package.json
└── vite.config.js
```

## 迁移步骤

### 阶段一：项目初始化和基础架构（1-2天）

#### 1.1 创建Vue 3项目
```bash
# 使用Vite创建项目
npm create vue@latest reader-vue3
cd reader-vue3

# 选择以下配置：
# ✓ Add TypeScript? Yes
# ✓ Add JSX Support? No  
# ✓ Add Vue Router? Yes
# ✓ Add Pinia? Yes
# ✓ Add Vitest? No
# ✓ Add End-to-End Testing? No
# ✓ Add ESLint? Yes
# ✓ Add Prettier? Yes

# 安装依赖
npm install
```

#### 1.2 安装额外依赖
```bash
# 音频处理相关
npm install howler
npm install @vueuse/core

# UI组件库 (推荐Element Plus)
npm install element-plus
npm install @element-plus/icons-vue

# 文件上传处理
npm install file-saver
npm install jszip

# 开发工具
npm install -D unplugin-auto-import
npm install -D unplugin-vue-components
```

#### 1.3 配置Vite
```javascript
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
      imports: ['vue', 'vue-router', 'pinia']
    }),
    Components({
      resolvers: [ElementPlusResolver()]
    })
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
```

### 阶段二：状态管理迁移（2-3天）

#### 2.1 创建Pinia Store
```typescript
// src/stores/reader.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useReaderStore = defineStore('reader', () => {
  // 状态
  const currentFile = ref<FileInfo | null>(null)
  const chapters = ref<Chapter[]>([])
  const audioFiles = ref<AudioFile[]>([])
  const selectedChapters = ref<number[]>([])
  const isGenerating = ref(false)
  const generationProgress = ref(0)
  
  // 计算属性
  const hasFile = computed(() => currentFile.value !== null)
  const totalChapters = computed(() => chapters.value.length)
  const selectedChaptersCount = computed(() => selectedChapters.value.length)
  
  // 操作
  const setCurrentFile = (file: FileInfo) => {
    currentFile.value = file
  }
  
  const setChapters = (newChapters: Chapter[]) => {
    chapters.value = newChapters
  }
  
  const toggleChapterSelection = (chapterIndex: number) => {
    const index = selectedChapters.value.indexOf(chapterIndex)
    if (index > -1) {
      selectedChapters.value.splice(index, 1)
    } else {
      selectedChapters.value.push(chapterIndex)
    }
  }
  
  const clearSelection = () => {
    selectedChapters.value = []
  }
  
  const setGenerating = (generating: boolean) => {
    isGenerating.value = generating
  }
  
  const updateProgress = (progress: number) => {
    generationProgress.value = progress
  }
  
  const reset = () => {
    currentFile.value = null
    chapters.value = []
    audioFiles.value = []
    selectedChapters.value = []
    isGenerating.value = false
    generationProgress.value = 0
  }
  
  return {
    // 状态
    currentFile,
    chapters,
    audioFiles,
    selectedChapters,
    isGenerating,
    generationProgress,
    
    // 计算属性
    hasFile,
    totalChapters,
    selectedChaptersCount,
    
    // 操作
    setCurrentFile,
    setChapters,
    toggleChapterSelection,
    clearSelection,
    setGenerating,
    updateProgress,
    reset
  }
})
```

#### 2.2 创建语音设置Store
```typescript
// src/stores/voiceSettings.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useVoiceSettingsStore = defineStore('voiceSettings', () => {
  const voice = ref('Ethan')
  const speed = ref(1.0)
  const volume = ref(0)
  
  const voices = [
    { value: 'Ethan', label: 'Ethan（男声）' },
    { value: 'Chelsie', label: 'Chelsie（女声）' },
    { value: 'Cherry', label: 'Cherry（女声）' },
    { value: 'Serena', label: 'Serena（女声）' },
    { value: 'Dylan', label: 'Dylan（北京话-男声）' },
    { value: 'Jada', label: 'Jada（吴语-女声）' },
    { value: 'Sunny', label: 'Sunny（四川话-女声）' }
  ]
  
  const setVoice = (newVoice: string) => {
    voice.value = newVoice
  }
  
  const setSpeed = (newSpeed: number) => {
    speed.value = newSpeed
  }
  
  const setVolume = (newVolume: number) => {
    volume.value = newVolume
  }
  
  const getSettings = () => ({
    voice: voice.value,
    speed: speed.value,
    volume: volume.value
  })
  
  return {
    voice,
    speed,
    volume,
    voices,
    setVoice,
    setSpeed,
    setVolume,
    getSettings
  }
})
```

### 阶段三：组件迁移（3-4天）

#### 3.1 文件上传组件
```vue
<!-- src/components/FileUpload.vue -->
<template>
  <div class="file-upload">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>📄 文件上传</span>
        </div>
      </template>
      
      <el-upload
        ref="uploadRef"
        class="upload-area"
        drag
        :auto-upload="false"
        :show-file-list="false"
        :on-change="handleFileChange"
        :before-upload="beforeUpload"
        accept=".pdf,.txt,.epub,.docx"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          拖拽文件到此处或 <em>点击选择文件</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持格式: PDF, TXT, EPUB, DOCX，文件大小不超过50MB
          </div>
        </template>
      </el-upload>
      
      <div class="upload-actions">
        <el-button 
          type="primary" 
          @click="handleUpload"
          :loading="uploading"
          :disabled="!selectedFile"
        >
          开始上传
        </el-button>
        <el-button @click="showHistory">
          📚 查看历史文档
        </el-button>
      </div>
      
      <!-- 上传进度 -->
      <el-progress 
        v-if="uploading" 
        :percentage="uploadProgress" 
        :status="uploadStatus"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { useReaderStore } from '@/stores/reader'
import { uploadFile } from '@/services/api'

// Props & Emits
interface Props {
  onUploadSuccess?: (fileInfo: any) => void
}

const props = withDefaults(defineProps<Props>(), {
  onUploadSuccess: undefined
})

// 状态
const readerStore = useReaderStore()
const uploadRef = ref()
const selectedFile = ref<File | null>(null)
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadStatus = ref<'success' | 'exception' | ''>('')

// 计算属性
const canUpload = computed(() => selectedFile.value && !uploading.value)

// 方法
const handleFileChange = (file: any) => {
  selectedFile.value = file.raw
}

const beforeUpload = (file: File) => {
  const isValidType = ['.pdf', '.txt', '.epub', '.docx'].some(
    ext => file.name.toLowerCase().endsWith(ext)
  )
  
  if (!isValidType) {
    ElMessage.error('不支持的文件格式')
    return false
  }
  
  if (file.size > 50 * 1024 * 1024) {
    ElMessage.error('文件大小不能超过50MB')
    return false
  }
  
  return true
}

const handleUpload = async () => {
  if (!selectedFile.value) return
  
  try {
    uploading.value = true
    uploadProgress.value = 0
    uploadStatus.value = ''
    
    const result = await uploadFile(selectedFile.value, (progress) => {
      uploadProgress.value = progress
    })
    
    uploadStatus.value = 'success'
    ElMessage.success('文件上传成功！')
    
    // 更新store
    readerStore.setCurrentFile(result)
    readerStore.setChapters(result.chapters)
    
    // 触发成功回调
    if (props.onUploadSuccess) {
      props.onUploadSuccess(result)
    }
    
  } catch (error: any) {
    uploadStatus.value = 'exception'
    ElMessage.error(`上传失败: ${error.message}`)
  } finally {
    uploading.value = false
  }
}

const showHistory = () => {
  // 触发显示历史记录事件
  emit('show-history')
}

const emit = defineEmits<{
  'show-history': []
}>()
</script>

<style scoped>
.file-upload {
  max-width: 600px;
  margin: 0 auto;
}

.upload-area {
  margin-bottom: 20px;
}

.upload-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
}

.el-upload__tip {
  color: #909399;
  font-size: 12px;
  margin-top: 8px;
}
</style>
```

#### 3.2 章节列表组件
```vue
<!-- src/components/ChaptersList.vue -->
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
          </div>
        </div>
      </template>
      
      <el-table
        :data="chapters"
        @selection-change="handleSelectionChange"
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="title" label="章节标题" min-width="200" />
        <el-table-column prop="length" label="字数" width="100" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row, $index }">
            <el-button 
              size="small" 
              @click="generateAudio($index)"
              :loading="row.generating"
              :disabled="row.status === 'generated'"
            >
              {{ row.status === 'generated' ? '已生成' : '生成音频' }}
            </el-button>
            <el-button 
              v-if="row.status === 'generated'"
              size="small" 
              type="success"
              @click="playAudio(row, $index)"
            >
              播放
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useReaderStore } from '@/stores/reader'
import { generateAudio as generateAudioAPI } from '@/services/api'

// Props
interface Props {
  chapters: Chapter[]
}

const props = defineProps<Props>()

// Store
const readerStore = useReaderStore()

// 计算属性
const hasFile = computed(() => readerStore.hasFile)
const selectedChapters = computed(() => readerStore.selectedChapters)
const selectedChaptersCount = computed(() => readerStore.selectedChaptersCount)
const isGenerating = computed(() => readerStore.isGenerating)

// 方法
const handleSelectionChange = (selection: Chapter[]) => {
  const indices = selection.map((_, index) => index)
  readerStore.setSelectedChapters(indices)
}

const generateAudio = async (chapterIndex: number) => {
  try {
    readerStore.setGenerating(true)
    
    await generateAudioAPI({
      fileId: readerStore.currentFile!.id,
      chapterIndex,
      voiceSettings: useVoiceSettingsStore().getSettings()
    })
    
    ElMessage.success(`第${chapterIndex + 1}章音频生成成功`)
    
  } catch (error: any) {
    ElMessage.error(`音频生成失败: ${error.message}`)
  } finally {
    readerStore.setGenerating(false)
  }
}

const generateAllAudio = async () => {
  try {
    readerStore.setGenerating(true)
    
    for (let i = 0; i < props.chapters.length; i++) {
      await generateAudio(i)
      readerStore.updateProgress((i + 1) / props.chapters.length * 100)
    }
    
    ElMessage.success('所有章节音频生成完成！')
    
  } catch (error: any) {
    ElMessage.error(`批量生成失败: ${error.message}`)
  } finally {
    readerStore.setGenerating(false)
    readerStore.updateProgress(0)
  }
}

const generateSelectedAudio = async () => {
  if (selectedChaptersCount.value === 0) {
    ElMessage.warning('请先选择要生成的章节')
    return
  }
  
  try {
    readerStore.setGenerating(true)
    
    for (const index of selectedChapters.value) {
      await generateAudio(index)
      readerStore.updateProgress(
        (selectedChapters.value.indexOf(index) + 1) / selectedChaptersCount.value * 100
      )
    }
    
    ElMessage.success('选中章节音频生成完成！')
    
  } catch (error: any) {
    ElMessage.error(`批量生成失败: ${error.message}`)
  } finally {
    readerStore.setGenerating(false)
    readerStore.updateProgress(0)
  }
}

const playAudio = (chapter: Chapter, index: number) => {
  // 实现音频播放逻辑
  console.log('播放音频:', chapter, index)
}

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    pending: 'info',
    generating: 'warning',
    generated: 'success',
    error: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: '待生成',
    generating: '生成中',
    generated: '已生成',
    error: '生成失败'
  }
  return texts[status] || '未知'
}
</script>

<style scoped>
.chapters-list {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 12px;
}
</style>
```

### 阶段四：API服务层（1-2天）

#### 4.1 创建API服务
```typescript
// src/services/api.ts
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 60000
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证token等
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response) {
      throw new Error(error.response.data.error || '请求失败')
    } else if (error.request) {
      throw new Error('网络连接失败')
    } else {
      throw new Error(error.message)
    }
  }
)

// 文件上传
export const uploadFile = async (
  file: File, 
  onProgress?: (progress: number) => void
) => {
  const formData = new FormData()
  formData.append('file', file)
  
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        )
        onProgress(progress)
      }
    }
  })
}

// 音频生成
export const generateAudio = async (params: {
  fileId: string
  chapterIndex: number
  voiceSettings: any
}) => {
  return api.post('/generate-audio-progress', params)
}

// 获取音频状态
export const getAudioStatus = async (fileId: string) => {
  return api.get(`/check-audio-status/${fileId}`)
}

// 下载音频
export const downloadAudio = async (fileId: string, filename: string) => {
  const response = await api.get(`/download/${fileId}/${filename}`, {
    responseType: 'blob'
  })
  
  const url = window.URL.createObjectURL(response)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  window.URL.revokeObjectURL(url)
}

// 合并音频
export const mergeAudio = async (fileId: string, selectedChapters?: number[]) => {
  if (selectedChapters) {
    return api.post(`/merge-audio/${fileId}`, { selected_chapters: selectedChapters })
  } else {
    return api.get(`/merge-audio/${fileId}`)
  }
}

// 获取文档历史
export const getDocumentHistory = async () => {
  return api.get('/documents')
}

// 加载文档
export const loadDocument = async (fileId: string) => {
  return api.get(`/load-document/${fileId}`)
}

// 删除文档
export const deleteDocument = async (fileId: string) => {
  return api.delete(`/delete-document/${fileId}`)
}
```

### 阶段五：路由和页面组件（1-2天）

#### 5.1 路由配置
```typescript
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/history',
      name: 'history',
      component: () => import('@/views/HistoryView.vue')
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue')
    }
  ]
})

export default router
```

#### 5.2 主页面组件
```vue
<!-- src/views/HomeView.vue -->
<template>
  <div class="home">
    <el-container>
      <el-header>
        <div class="header-content">
          <h1>📚 智能文本阅读器</h1>
          <p>基于阿里巴巴Qwen大模型的文本转语音系统</p>
        </div>
      </el-header>
      
      <el-main>
        <!-- 文件上传区域 -->
        <FileUpload 
          v-if="!readerStore.hasFile"
          @show-history="showHistory"
          @upload-success="handleUploadSuccess"
        />
        
        <!-- 文件信息显示 -->
        <FileInfo 
          v-if="readerStore.hasFile"
          :file="readerStore.currentFile"
        />
        
        <!-- 章节列表 -->
        <ChaptersList 
          v-if="readerStore.hasFile"
          :chapters="readerStore.chapters"
        />
        
        <!-- 语音设置 -->
        <VoiceSettings 
          v-if="readerStore.hasFile"
        />
        
        <!-- 音频播放器 -->
        <AudioPlayer 
          v-if="readerStore.hasFile"
        />
      </el-main>
    </el-container>
    
    <!-- 历史记录抽屉 -->
    <el-drawer
      v-model="showHistoryDrawer"
      title="📚 文档历史"
      direction="rtl"
      size="500px"
    >
      <DocumentHistory />
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useReaderStore } from '@/stores/reader'
import FileUpload from '@/components/FileUpload.vue'
import FileInfo from '@/components/FileInfo.vue'
import ChaptersList from '@/components/ChaptersList.vue'
import VoiceSettings from '@/components/VoiceSettings.vue'
import AudioPlayer from '@/components/AudioPlayer.vue'
import DocumentHistory from '@/components/DocumentHistory.vue'

// 状态
const router = useRouter()
const readerStore = useReaderStore()
const showHistoryDrawer = ref(false)

// 方法
const handleUploadSuccess = (fileInfo: any) => {
  console.log('文件上传成功:', fileInfo)
}

const showHistory = () => {
  showHistoryDrawer.value = true
}
</script>

<style scoped>
.home {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.header-content {
  text-align: center;
  color: white;
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
</style>
```

## 迁移时间规划

### 总预计时间：8-12天

| 阶段 | 任务 | 预计时间 | 优先级 |
|------|------|----------|--------|
| 阶段一 | 项目初始化和基础架构 | 1-2天 | 高 |
| 阶段二 | 状态管理迁移 | 2-3天 | 高 |
| 阶段三 | 组件迁移 | 3-4天 | 高 |
| 阶段四 | API服务层 | 1-2天 | 中 |
| 阶段五 | 路由和页面组件 | 1-2天 | 中 |

## 迁移优势

### 1. 开发效率提升
- **组件化开发**：可复用的组件系统
- **响应式数据**：自动UI更新，减少手动DOM操作
- **TypeScript支持**：类型安全，减少运行时错误

### 2. 代码质量提升
- **状态管理**：Pinia提供清晰的状态管理
- **路由管理**：Vue Router提供SPA路由
- **工具链**：Vite提供快速的开发体验

### 3. 维护性提升
- **模块化**：清晰的代码组织结构
- **可测试性**：组件可以独立测试
- **可扩展性**：易于添加新功能

## 注意事项

### 1. 渐进式迁移
- 不要一次性重写所有代码
- 可以先迁移核心功能，再逐步添加新功能
- 保持与后端API的兼容性

### 2. 性能考虑
- 使用Vue 3的Composition API提升性能
- 合理使用计算属性和监听器
- 避免不必要的组件重渲染

### 3. 用户体验
- 保持原有的操作流程
- 添加加载状态和错误处理
- 优化移动端体验

## 总结

迁移到Vue 3是一个值得投入的重构项目。虽然前期需要投入时间进行架构重构，但长期来看将显著提升开发效率和代码质量。建议按照本文档的步骤逐步进行，确保每个阶段都经过充分测试后再进入下一阶段。

通过Vue 3的现代化开发体验，你将能够更快速地添加新功能，维护现有代码，并为用户提供更好的产品体验。

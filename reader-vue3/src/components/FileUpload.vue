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
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
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

      <!-- 文件信息预览 -->
      <div v-if="selectedFile" class="file-preview">
        <el-divider content-position="left">文件信息</el-divider>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="文件名">
            {{ selectedFile.name }}
          </el-descriptions-item>
          <el-descriptions-item label="文件大小">
            {{ formatFileSize(selectedFile.size) }}
          </el-descriptions-item>
          <el-descriptions-item label="文件类型">
            {{ getFileType(selectedFile.name) }}
          </el-descriptions-item>
          <el-descriptions-item label="最后修改">
            {{ formatDate(selectedFile.lastModified) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { useReaderStore, useUIStore } from '@/stores'
import { DocumentService } from '@/services'
import type { FileInfo } from '@/types'

// Props & Emits
interface Props {
  onUploadSuccess?: (fileInfo: FileInfo) => void
}

const props = withDefaults(defineProps<Props>(), {
  onUploadSuccess: undefined
})

const emit = defineEmits<{
  'show-history': []
  'upload-success': [fileInfo: FileInfo]
}>()

// Store
const readerStore = useReaderStore()
const uiStore = useUIStore()

// 状态
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
  uploadProgress.value = 0
  uploadStatus.value = ''
}

const beforeUpload = async (file: File) => {
  try {
    // 使用API验证文档格式
    const validation = await DocumentService.validateDocument(file)

    if (!validation.isValid) {
      ElMessage.error(validation.message || '文档格式验证失败')
      return false
    }

    return true
  } catch (error) {
    // 如果API验证失败，使用本地验证作为备选
    const isValidType = ['.pdf', '.txt', '.epub', '.docx'].some(
      ext => file.name.toLowerCase().endsWith(ext)
    )

    if (!isValidType) {
      ElMessage.error('不支持的文件格式，请选择PDF、TXT、EPUB或DOCX文件')
      return false
    }

    if (file.size > 50 * 1024 * 1024) {
      ElMessage.error('文件大小不能超过50MB')
      return false
    }

    return true
  }
}

const handleUpload = async () => {
  if (!selectedFile.value) return

  try {
    uploading.value = true
    uploadProgress.value = 0
    uploadStatus.value = ''

    // 使用真实API上传文档
    const result = await DocumentService.uploadDocument(
      selectedFile.value,
      (progress) => {
        uploadProgress.value = progress
      }
    )

    uploadStatus.value = 'success'

    // 更新store
    readerStore.setCurrentFile(result.fileInfo)
    readerStore.setChapters(result.chapters)

    // 显示成功消息
    uiStore.showSuccess('文件上传成功！')

    // 触发成功回调
    if (props.onUploadSuccess) {
      props.onUploadSuccess(result.fileInfo)
    }

    emit('upload-success', result.fileInfo)

    // 切换到文件信息区域
    uiStore.setActiveSection('fileInfo')

  } catch (error: any) {
    uploadStatus.value = 'exception'
    uiStore.showError(`上传失败: ${error.message}`)
  } finally {
    uploading.value = false
  }
}

const showHistory = () => {
  emit('show-history')
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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

const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('zh-CN')
}
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

.file-preview {
  margin-top: 20px;
}

.el-divider {
  margin: 20px 0;
}

.el-descriptions {
  margin-top: 15px;
}
</style>

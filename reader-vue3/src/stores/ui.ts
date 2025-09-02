import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUIStore = defineStore('ui', () => {
  // 状态
  const activeSection = ref<'upload' | 'fileInfo' | 'chapters' | 'voiceSettings' | 'audioControls' | 'audioPlayer'>('upload')
  const showHistoryDrawer = ref(false)
  const showSettingsDrawer = ref(false)
  const isLoading = ref(false)
  const loadingText = ref('')
  const showProgress = ref(false)
  const progressText = ref('')

  // 通知状态
  const notifications = ref<Array<{
    id: string
    type: 'success' | 'warning' | 'error' | 'info'
    message: string
    duration?: number
  }>>([])

  // 计算属性
  const isUploadSection = computed(() => activeSection.value === 'upload')
  const isFileInfoSection = computed(() => activeSection.value === 'fileInfo')
  const isChaptersSection = computed(() => activeSection.value === 'chapters')
  const isVoiceSettingsSection = computed(() => activeSection.value === 'voiceSettings')
  const isAudioControlsSection = computed(() => activeSection.value === 'audioControls')
  const isAudioPlayerSection = computed(() => activeSection.value === 'audioPlayer')

  // 方法
  const setActiveSection = (section: typeof activeSection.value) => {
    activeSection.value = section
  }

  const showLoading = (text = '加载中...') => {
    isLoading.value = true
    loadingText.value = text
  }

  const hideLoading = () => {
    isLoading.value = false
    loadingText.value = ''
  }

  const showProgressBar = (text = '处理中...') => {
    showProgress.value = true
    progressText.value = text
  }

  const hideProgressBar = () => {
    showProgress.value = false
    progressText.value = ''
  }

  const toggleHistoryDrawer = () => {
    showHistoryDrawer.value = !showHistoryDrawer.value
  }

  const toggleSettingsDrawer = () => {
    showSettingsDrawer.value = !showSettingsDrawer.value
  }

  const addNotification = (type: 'success' | 'warning' | 'error' | 'info', message: string, duration = 5000) => {
    const id = Date.now().toString()
    const notification = {
      id,
      type,
      message,
      duration
    }

    notifications.value.push(notification)

    // 自动移除通知
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }

    return id
  }

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  const clearNotifications = () => {
    notifications.value = []
  }

  const showSuccess = (message: string, duration?: number) => {
    return addNotification('success', message, duration)
  }

  const showWarning = (message: string, duration?: number) => {
    return addNotification('warning', message, duration)
  }

  const showError = (message: string, duration?: number) => {
    return addNotification('error', message, duration)
  }

  const showInfo = (message: string, duration?: number) => {
    return addNotification('info', message, duration)
  }

  const reset = () => {
    activeSection.value = 'upload'
    showHistoryDrawer.value = false
    showSettingsDrawer.value = false
    isLoading.value = false
    loadingText.value = ''
    showProgress.value = false
    progressText.value = ''
    clearNotifications()
  }

  return {
    // 状态
    activeSection,
    showHistoryDrawer,
    showSettingsDrawer,
    isLoading,
    loadingText,
    showProgress,
    progressText,
    notifications,

    // 计算属性
    isUploadSection,
    isFileInfoSection,
    isChaptersSection,
    isVoiceSettingsSection,
    isAudioControlsSection,
    isAudioPlayerSection,

    // 方法
    setActiveSection,
    showLoading,
    hideLoading,
    showProgressBar,
    hideProgressBar,
    toggleHistoryDrawer,
    toggleSettingsDrawer,
    addNotification,
    removeNotification,
    clearNotifications,
    showSuccess,
    showWarning,
    showError,
    showInfo,
    reset
  }
})

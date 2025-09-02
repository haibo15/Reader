import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { VoiceSettings } from '@/types'

export const useVoiceSettingsStore = defineStore('voiceSettings', () => {
  // 状态
  const voice = ref('Ethan')
  const speed = ref(1.0)
  const volume = ref(0)
  
  // 可用的语音选项
  const voices = [
    { value: 'Ethan', label: 'Ethan（男声）', preview: 'ethan_preview.wav' },
    { value: 'Chelsie', label: 'Chelsie（女声）', preview: 'chelsie_preview.wav' },
    { value: 'Cherry', label: 'Cherry（女声）', preview: 'cherry_preview.wav' },
    { value: 'Serena', label: 'Serena（女声）', preview: 'serena_preview.wav' },
    { value: 'Dylan', label: 'Dylan（北京话-男声）', preview: 'dylan_preview.wav' },
    { value: 'Jada', label: 'Jada（吴语-女声）', preview: 'jada_preview.wav' },
    { value: 'Sunny', label: 'Sunny（四川话-女声）', preview: 'sunny_preview.wav' }
  ]
  
  // 计算属性
  const currentVoice = computed(() => {
    return voices.find(v => v.value === voice.value)
  })
  
  const currentPreviewFile = computed(() => {
    return currentVoice.value?.preview
  })
  
  // 方法
  const setVoice = (newVoice: string) => {
    if (voices.some(v => v.value === newVoice)) {
      voice.value = newVoice
    }
  }
  
  const setSpeed = (newSpeed: number) => {
    // 限制速度范围在0.5到2.0之间
    speed.value = Math.max(0.5, Math.min(2.0, newSpeed))
  }
  
  const setVolume = (newVolume: number) => {
    // 限制音量范围在-20到20之间
    volume.value = Math.max(-20, Math.min(20, newVolume))
  }
  
  const getSettings = (): VoiceSettings => ({
    voice: voice.value,
    speed: speed.value,
    volume: volume.value
  })
  
  const resetToDefaults = () => {
    voice.value = 'Ethan'
    speed.value = 1.0
    volume.value = 0
  }
  
  // 从本地存储加载设置
  const loadFromStorage = () => {
    try {
      const stored = localStorage.getItem('voiceSettings')
      if (stored) {
        const settings = JSON.parse(stored)
        if (settings.voice) setVoice(settings.voice)
        if (settings.speed) setSpeed(settings.speed)
        if (settings.volume) setVolume(settings.volume)
      }
    } catch (error) {
      console.warn('Failed to load voice settings from storage:', error)
    }
  }
  
  // 保存设置到本地存储
  const saveToStorage = () => {
    try {
      localStorage.setItem('voiceSettings', JSON.stringify(getSettings()))
    } catch (error) {
      console.warn('Failed to save voice settings to storage:', error)
    }
  }
  
  // 监听设置变化并自动保存
  const watchAndSave = () => {
    // 这里可以使用Vue的watch功能，但为了简单起见，我们在外部调用saveToStorage
  }
  
  return {
    // 状态
    voice,
    speed,
    volume,
    voices,
    
    // 计算属性
    currentVoice,
    currentPreviewFile,
    
    // 方法
    setVoice,
    setSpeed,
    setVolume,
    getSettings,
    resetToDefaults,
    loadFromStorage,
    saveToStorage,
    watchAndSave
  }
})

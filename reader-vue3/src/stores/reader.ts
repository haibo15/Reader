import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FileInfo, Chapter, AudioFile, AudioStatus } from '@/types'

export const useReaderStore = defineStore('reader', () => {
  // 状态
  const currentFile = ref<FileInfo | null>(null)
  const chapters = ref<Chapter[]>([])
  const audioFiles = ref<AudioFile[]>([])
  const selectedChapters = ref<number[]>([])
  const isGenerating = ref(false)
  const generationProgress = ref(0)
  const audioStatus = ref<AudioStatus[]>([])
  
  // 计算属性
  const hasFile = computed(() => currentFile.value !== null)
  const totalChapters = computed(() => chapters.value.length)
  const selectedChaptersCount = computed(() => selectedChapters.value.length)
  const hasSelectedChapters = computed(() => selectedChapters.value.length > 0)
  
  // 获取章节状态
  const getChapterStatus = (chapterIndex: number) => {
    return audioStatus.value.find(status => status.chapter_index === chapterIndex)
  }
  
  // 获取已生成的音频数量
  const generatedAudioCount = computed(() => {
    return audioStatus.value.filter(status => status.has_audio).length
  })
  
  // 获取音频生成进度百分比
  const audioGenerationProgress = computed(() => {
    if (totalChapters.value === 0) return 0
    return Math.round((generatedAudioCount.value / totalChapters.value) * 100)
  })
  
  // 操作
  const setCurrentFile = (file: FileInfo) => {
    currentFile.value = file
  }
  
  const setChapters = (newChapters: Chapter[]) => {
    chapters.value = newChapters.map((chapter, index) => ({
      ...chapter,
      chapter_index: index,
      status: 'pending'
    }))
    
    // 初始化音频状态
    audioStatus.value = newChapters.map((_, index) => ({
      chapter_index: index,
      has_audio: false,
      status: 'pending'
    }))
  }
  
  const setAudioFiles = (files: AudioFile[]) => {
    audioFiles.value = files
    
    // 更新音频状态
    files.forEach(file => {
      const status = audioStatus.value.find(s => s.chapter_index === file.chapter_index)
      if (status) {
        status.has_audio = true
        status.audio_file = file.filename
        status.voice = file.voice
        status.status = 'generated'
      }
    })
  }
  
  const toggleChapterSelection = (chapterIndex: number) => {
    const index = selectedChapters.value.indexOf(chapterIndex)
    if (index > -1) {
      selectedChapters.value.splice(index, 1)
    } else {
      selectedChapters.value.push(chapterIndex)
    }
  }
  
  const selectAllChapters = () => {
    selectedChapters.value = chapters.value.map((_, index) => index)
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
  
  const updateChapterStatus = (chapterIndex: number, status: Partial<AudioStatus>) => {
    const existingStatus = audioStatus.value.find(s => s.chapter_index === chapterIndex)
    if (existingStatus) {
      Object.assign(existingStatus, status)
    } else {
      audioStatus.value.push({
        chapter_index: chapterIndex,
        has_audio: false,
        status: 'pending',
        ...status
      })
    }
  }
  
  const updateAudioStatus = (statusData: AudioStatus[]) => {
    audioStatus.value = statusData
  }
  
  const reset = () => {
    currentFile.value = null
    chapters.value = []
    audioFiles.value = []
    selectedChapters.value = []
    isGenerating.value = false
    generationProgress.value = 0
    audioStatus.value = []
  }
  
  return {
    // 状态
    currentFile,
    chapters,
    audioFiles,
    selectedChapters,
    isGenerating,
    generationProgress,
    audioStatus,
    
    // 计算属性
    hasFile,
    totalChapters,
    selectedChaptersCount,
    hasSelectedChapters,
    generatedAudioCount,
    audioGenerationProgress,
    
    // 方法
    getChapterStatus,
    setCurrentFile,
    setChapters,
    setAudioFiles,
    toggleChapterSelection,
    selectAllChapters,
    clearSelection,
    setGenerating,
    updateProgress,
    updateChapterStatus,
    updateAudioStatus,
    reset
  }
})

// 文件信息类型
export interface FileInfo {
  id: string
  name: string
  display_name?: string
  total_chapters: number
  file_size?: number
  upload_time?: string
  file_type?: string
}

// 章节类型
export interface Chapter {
  title: string
  content: string
  length: number
  status?: 'pending' | 'generating' | 'generated' | 'error'
  generating?: boolean
  audio_file?: string
  chapter_index?: number
}

// 音频文件类型
export interface AudioFile {
  filename: string
  chapter_index: number
  voice: string
  file_size: number
  duration?: number
  created_time: string
  version?: string
}

// 语音设置类型
export interface VoiceSettings {
  voice: string
  speed: number
  volume: number
}

// 音频状态类型
export interface AudioStatus {
  chapter_index: number
  has_audio: boolean
  audio_file?: string
  voice?: string
  status: 'pending' | 'generating' | 'generated' | 'error'
}

// 音频生成参数类型
export interface AudioGenerationParams {
  fileId: string
  chapterIndex: number
  voiceSettings: VoiceSettings
}

// 上传进度回调类型
export type ProgressCallback = (progress: number) => void

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// 文档历史记录类型
export interface DocumentHistory {
  file_id: string
  display_name: string
  total_chapters: number
  upload_time: string
  has_audio: boolean
  audio_count?: number
}

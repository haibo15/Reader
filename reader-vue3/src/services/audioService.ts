import { apiRequest } from './api'
import type { AudioGenerationParams, VoiceSettings, AudioFile, AudioStatus } from '@/types'

// 音频生成API服务
export class AudioService {
  // 生成单个章节音频
  static async generateChapterAudio(
    params: AudioGenerationParams,
    onProgress?: (progress: number) => void
  ): Promise<AudioFile> {
    try {
      const result = await apiRequest.post<AudioFile>('/audio/generate', params, {
        onUploadProgress: onProgress ? (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            onProgress(progress)
          }
        } : undefined
      })

      return result
    } catch (error) {
      throw new Error(`音频生成失败: ${error}`)
    }
  }

  // 批量生成音频
  static async generateBatchAudio(
    fileId: string,
    chapterIndices: number[],
    voiceSettings: VoiceSettings,
    onProgress?: (progress: number) => Promise<void>
  ): Promise<AudioFile[]> {
    try {
      const result = await apiRequest.post<AudioFile[]>('/audio/generate-batch', {
        fileId,
        chapterIndices,
        voiceSettings
      })

      return result
    } catch (error) {
      throw new Error(`批量音频生成失败: ${error}`)
    }
  }

  // 获取音频生成状态
  static async getAudioStatus(fileId: string): Promise<AudioStatus[]> {
    try {
      return await apiRequest.get<AudioStatus[]>(`/audio/status/${fileId}`)
    } catch (error) {
      throw new Error(`获取音频状态失败: ${error}`)
    }
  }

  // 获取单个章节音频状态
  static async getChapterAudioStatus(
    fileId: string,
    chapterIndex: number
  ): Promise<AudioStatus> {
    try {
      return await apiRequest.get<AudioStatus>(`/audio/status/${fileId}/${chapterIndex}`)
    } catch (error) {
      throw new Error(`获取章节音频状态失败: ${error}`)
    }
  }

  // 下载音频文件
  static async downloadAudio(audioFileId: string): Promise<Blob> {
    try {
      const response = await apiRequest.get(`/audio/download/${audioFileId}`, {
        responseType: 'blob'
      })

      return response as unknown as Blob
    } catch (error) {
      throw new Error(`音频下载失败: ${error}`)
    }
  }

  // 获取音频文件信息
  static async getAudioFileInfo(audioFileId: string): Promise<AudioFile> {
    try {
      return await apiRequest.get<AudioFile>(`/audio/file/${audioFileId}`)
    } catch (error) {
      throw new Error(`获取音频文件信息失败: ${error}`)
    }
  }

  // 删除音频文件
  static async deleteAudio(audioFileId: string): Promise<void> {
    try {
      await apiRequest.delete(`/audio/file/${audioFileId}`)
    } catch (error) {
      throw new Error(`删除音频文件失败: ${error}`)
    }
  }

  // 重新生成音频
  static async regenerateAudio(
    audioFileId: string,
    voiceSettings: VoiceSettings
  ): Promise<AudioFile> {
    try {
      return await apiRequest.post<AudioFile>(`/audio/regenerate/${audioFileId}`, {
        voiceSettings
      })
    } catch (error) {
      throw new Error(`重新生成音频失败: ${error}`)
    }
  }

  // 获取音频生成队列状态
  static async getGenerationQueue(): Promise<{
    queueLength: number
    currentTask?: {
      fileId: string
      chapterIndex: number
      progress: number
      estimatedTime: number
    }
    estimatedWaitTime: number
  }> {
    try {
      return await apiRequest.get('/audio/queue')
    } catch (error) {
      throw new Error(`获取生成队列状态失败: ${error}`)
    }
  }

  // 取消音频生成任务
  static async cancelGeneration(taskId: string): Promise<void> {
    try {
      await apiRequest.post(`/audio/cancel/${taskId}`)
    } catch (error) {
      throw new Error(`取消生成任务失败: ${error}`)
    }
  }

  // 获取音频统计信息
  static async getAudioStats(fileId: string): Promise<{
    totalGenerated: number
    totalSize: number
    averageDuration: number
    generationTime: number
  }> {
    try {
      return await apiRequest.get(`/audio/stats/${fileId}`)
    } catch (error) {
      throw new Error(`获取音频统计失败: ${error}`)
    }
  }

  // 测试语音设置
  static async testVoiceSettings(voiceSettings: VoiceSettings): Promise<{
    testAudioUrl: string
    duration: number
    quality: 'good' | 'acceptable' | 'poor'
  }> {
    try {
      return await apiRequest.post('/audio/test-voice', voiceSettings)
    } catch (error) {
      throw new Error(`语音测试失败: ${error}`)
    }
  }

  // 获取可用的语音列表
  static async getAvailableVoices(): Promise<{
    voices: Array<{
      id: string
      name: string
      language: string
      gender: 'male' | 'female'
      previewUrl: string
      description: string
    }>
  }> {
    try {
      return await apiRequest.get('/audio/voices')
    } catch (error) {
      throw new Error(`获取可用语音列表失败: ${error}`)
    }
  }
}

export default AudioService

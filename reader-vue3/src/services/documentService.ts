import { apiRequest } from './api'
import type { FileInfo, Chapter, DocumentHistory } from '@/types'

// 文档管理API服务
export class DocumentService {
  // 上传文档
  static async uploadDocument(
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<{ fileInfo: FileInfo; chapters: Chapter[] }> {
    try {
      const result = await apiRequest.upload<{
        fileInfo: FileInfo
        chapters: Chapter[]
      }>('/documents/upload', file, onProgress)
      
      return result
    } catch (error) {
      throw new Error(`文档上传失败: ${error}`)
    }
  }
  
  // 获取文档信息
  static async getDocumentInfo(fileId: string): Promise<FileInfo> {
    try {
      return await apiRequest.get<FileInfo>(`/documents/${fileId}`)
    } catch (error) {
      throw new Error(`获取文档信息失败: ${error}`)
    }
  }
  
  // 获取文档章节
  static async getDocumentChapters(fileId: string): Promise<Chapter[]> {
    try {
      return await apiRequest.get<Chapter[]>(`/documents/${fileId}/chapters`)
    } catch (error) {
      throw new Error(`获取文档章节失败: ${error}`)
    }
  }
  
  // 删除文档
  static async deleteDocument(fileId: string): Promise<void> {
    try {
      await apiRequest.delete(`/documents/${fileId}`)
    } catch (error) {
      throw new Error(`删除文档失败: ${error}`)
    }
  }
  
  // 获取文档历史列表
  static async getDocumentHistory(): Promise<DocumentHistory[]> {
    try {
      return await apiRequest.get<DocumentHistory[]>('/documents/history')
    } catch (error) {
      throw new Error(`获取文档历史失败: ${error}`)
    }
  }
  
  // 重命名文档
  static async renameDocument(fileId: string, newName: string): Promise<FileInfo> {
    try {
      return await apiRequest.put<FileInfo>(`/documents/${fileId}/rename`, {
        display_name: newName
      })
    } catch (error) {
      throw new Error(`重命名文档失败: ${error}`)
    }
  }
  
  // 获取文档统计信息
  static async getDocumentStats(fileId: string): Promise<{
    totalChapters: number
    generatedAudioCount: number
    totalAudioSize: number
    lastGeneratedTime?: string
  }> {
    try {
      return await apiRequest.get(`/documents/${fileId}/stats`)
    } catch (error) {
      throw new Error(`获取文档统计失败: ${error}`)
    }
  }
  
  // 验证文档格式
  static async validateDocument(file: File): Promise<{
    isValid: boolean
    message?: string
    supportedFormats: string[]
    maxSize: number
  }> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      return await apiRequest.post('/documents/validate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    } catch (error) {
      throw new Error(`文档验证失败: ${error}`)
    }
  }
  
  // 获取支持的文档格式
  static async getSupportedFormats(): Promise<{
    formats: string[]
    maxSize: number
    description: string
  }> {
    try {
      return await apiRequest.get('/documents/supported-formats')
    } catch (error) {
      throw new Error(`获取支持格式失败: ${error}`)
    }
  }
}

export default DocumentService

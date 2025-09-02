// 导出所有API服务
export { default as DocumentService } from './documentService'
export { default as AudioService } from './audioService'
export { apiRequest, apiClient } from './api'

// 服务初始化
export const initializeServices = () => {
  console.log('API Services initialized')

  // 这里可以添加服务的初始化逻辑
  // 比如检查API连接状态、加载配置等
}

// 服务健康检查
export const checkServicesHealth = async () => {
  try {
    // 检查API连接状态
    const response = await fetch('/api/health')
    if (response.ok) {
      console.log('API Services are healthy')
      return true
    } else {
      console.warn('API Services health check failed')
      return false
    }
  } catch (error) {
    console.error('API Services health check error:', error)
    return false
  }
}

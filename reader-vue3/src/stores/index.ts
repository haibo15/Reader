// 导出所有Store
export { useReaderStore } from './reader'
export { useVoiceSettingsStore } from './voiceSettings'
export { useUIStore } from './ui'

// 统一初始化所有Store
export const initializeStores = () => {
  // 这里可以添加Store的初始化逻辑
  // 比如从本地存储加载数据等
  console.log('Stores initialized')
}

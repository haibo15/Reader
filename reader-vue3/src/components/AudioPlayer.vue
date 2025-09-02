<template>
  <div class="audio-player">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>🎧 音频播放器</span>
          <div class="header-actions">
            <el-button @click="showPlaylist" type="info" size="small">
              📋 播放列表
            </el-button>
            <el-button @click="downloadCurrent" type="success" size="small" :disabled="!currentAudio">
              💾 下载
            </el-button>
          </div>
        </div>
      </template>
      
      <div class="player-content">
        <!-- 当前播放信息 -->
        <div v-if="currentAudio" class="current-audio-info">
          <div class="audio-cover">
            <el-icon size="48"><Headset /></el-icon>
          </div>
          <div class="audio-details">
            <h3>{{ currentAudio.title || `第${currentAudio.chapter_index + 1}章` }}</h3>
            <p class="audio-meta">
              <span>语音: {{ currentAudio.voice }}</span>
              <span>时长: {{ formatDuration(currentAudio.duration || 0) }}</span>
              <span>大小: {{ formatFileSize(currentAudio.file_size) }}</span>
            </p>
          </div>
        </div>
        
        <!-- 播放控制 -->
        <div class="playback-controls">
          <div class="control-buttons">
            <el-button @click="previousTrack" :disabled="!hasPrevious" circle>
              <el-icon><Back /></el-icon>
            </el-button>
            
            <el-button @click="togglePlayPause" type="primary" size="large" circle>
              <el-icon v-if="isPlaying"><Pause /></el-icon>
              <el-icon v-else><VideoPlay /></el-icon>
            </el-button>
            
            <el-button @click="nextTrack" :disabled="!hasNext" circle>
              <el-icon><Right /></el-icon>
            </el-button>
          </div>
          
          <div class="playback-info">
            <span class="current-time">{{ formatTime(currentTime) }}</span>
            <span class="total-time">{{ formatTime(duration) }}</span>
          </div>
        </div>
        
        <!-- 进度条 -->
        <div class="progress-section">
          <el-slider
            v-model="progress"
            :min="0"
            :max="100"
            :step="0.1"
            @change="seekTo"
            @input="updateProgress"
            :disabled="!currentAudio"
          />
        </div>
        
        <!-- 播放设置 -->
        <div class="playback-settings">
          <div class="setting-item">
            <label>音量</label>
            <el-slider
              v-model="volume"
              :min="0"
              :max="100"
              :step="1"
              @change="setVolume"
              show-input
              input-size="small"
            />
          </div>
          
          <div class="setting-item">
            <label>播放速度</label>
            <el-select v-model="playbackRate" @change="setPlaybackRate" size="small">
              <el-option label="0.5x" :value="0.5" />
              <el-option label="0.75x" :value="0.75" />
              <el-option label="1x" :value="1" />
              <el-option label="1.25x" :value="1.25" />
              <el-option label="1.5x" :value="1.5" />
              <el-option label="2x" :value="2" />
            </el-select>
          </div>
          
          <div class="setting-item">
            <label>循环模式</label>
            <el-select v-model="loopMode" @change="setLoopMode" size="small">
              <el-option label="单曲循环" value="single" />
              <el-option label="列表循环" value="list" />
              <el-option label="随机播放" value="random" />
              <el-option label="不循环" value="none" />
            </el-select>
          </div>
        </div>
        
        <!-- 播放列表 -->
        <div v-if="showPlaylistPanel" class="playlist-panel">
          <el-divider content-position="left">播放列表</el-divider>
          <div class="playlist-content">
            <el-table
              :data="playlist"
              @row-click="playTrack"
              style="width: 100%"
              :row-class-name="getRowClassName"
            >
              <el-table-column prop="title" label="标题" min-width="200">
                <template #default="{ row }">
                  <div class="track-title">
                    <el-icon v-if="row.chapter_index === currentTrackIndex" color="#409eff">
                      <Headset />
                    </el-icon>
                    <span>{{ row.title || `第${row.chapter_index + 1}章` }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="voice" label="语音" width="100" />
              <el-table-column prop="duration" label="时长" width="100">
                <template #default="{ row }">
                  {{ formatDuration(row.duration || 0) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="120">
                <template #default="{ row }">
                  <el-button size="small" @click.stop="playTrack(row)">
                    播放
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>
    </el-card>
    
    <!-- 播放列表抽屉 -->
    <el-drawer
      v-model="showPlaylistDrawer"
      title="📋 播放列表"
      direction="rtl"
      size="500px"
    >
      <div class="playlist-drawer-content">
        <div class="playlist-actions">
          <el-button @click="shufflePlaylist" type="info" size="small">
            🔀 随机播放
          </el-button>
          <el-button @click="clearPlaylist" type="danger" size="small">
            🗑️ 清空列表
          </el-button>
        </div>
        
        <div class="playlist-tracks">
          <div
            v-for="(track, index) in playlist"
            :key="track.id || index"
            class="playlist-track"
            :class="{ active: index === currentTrackIndex }"
            @click="playTrack(track)"
          >
            <div class="track-info">
              <div class="track-title">
                {{ track.title || `第${track.chapter_index + 1}章` }}
              </div>
              <div class="track-meta">
                <span>{{ track.voice }}</span>
                <span>{{ formatDuration(track.duration || 0) }}</span>
              </div>
            </div>
            <div class="track-actions">
              <el-button size="small" @click.stop="removeFromPlaylist(index)">
                移除
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Headset, Back, Right, VideoPlay, Pause } from '@element-plus/icons-vue'
import { useReaderStore, useUIStore } from '@/stores'
import { AudioService } from '@/services'
import type { AudioFile, Chapter } from '@/types'

// Props
interface Props {
  audioFiles?: AudioFile[]
}

const props = withDefaults(defineProps<Props>(), {
  audioFiles: () => []
})

// Store
const readerStore = useReaderStore()
const uiStore = useUIStore()

// 状态
const currentAudio = ref<AudioFile | null>(null)
const currentTrackIndex = ref(0)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const progress = ref(0)
const volume = ref(50)
const playbackRate = ref(1)
const loopMode = ref<'single' | 'list' | 'random' | 'none'>('list')
const showPlaylistPanel = ref(false)
const showPlaylistDrawer = ref(false)

// 计算属性
const hasPrevious = computed(() => currentTrackIndex.value > 0)
const hasNext = computed(() => currentTrackIndex.value < playlist.value.length - 1)
const playlist = computed(() => {
  if (props.audioFiles.length > 0) {
    return props.audioFiles
  }
  // 如果没有提供音频文件，从store获取
  return readerStore.audioFiles
})

// 方法
const showPlaylist = () => {
  showPlaylistDrawer.value = true
}

const togglePlayPause = () => {
  if (!currentAudio.value) return
  
  if (isPlaying.value) {
    pauseAudio()
  } else {
    playAudio()
  }
}

const playAudio = () => {
  if (!currentAudio.value) return
  
  // TODO: 实现实际的音频播放逻辑
  isPlaying.value = true
  uiStore.showInfo('开始播放音频')
  
  // 模拟播放进度
  startProgressSimulation()
}

const pauseAudio = () => {
  isPlaying.value = false
  uiStore.showInfo('暂停播放')
  
  // 停止进度模拟
  stopProgressSimulation()
}

const previousTrack = () => {
  if (!hasPrevious.value) return
  
  currentTrackIndex.value--
  loadTrack(currentTrackIndex.value)
}

const nextTrack = () => {
  if (!hasNext.value) return
  
  currentTrackIndex.value++
  loadTrack(currentTrackIndex.value)
}

const playTrack = (track: AudioFile | Chapter) => {
  const index = playlist.value.findIndex(t => 
    'id' in t ? t.id === (track as AudioFile).id : t.chapter_index === (track as Chapter).chapter_index
  )
  
  if (index !== -1) {
    currentTrackIndex.value = index
    loadTrack(index)
  }
}

const loadTrack = (index: number) => {
  const track = playlist.value[index]
  if (!track) return
  
  // 更新当前音频
  if ('id' in track) {
    currentAudio.value = track as AudioFile
  } else {
    // 如果是Chapter，需要转换为AudioFile格式
    currentAudio.value = {
      id: `chapter_${track.chapter_index}`,
      filename: `chapter_${track.chapter_index}.wav`,
      chapter_index: track.chapter_index,
      voice: 'Ethan', // 默认语音
      file_size: 0,
      created_time: new Date().toISOString(),
      duration: 0
    }
  }
  
  // 重置播放状态
  currentTime.value = 0
  progress.value = 0
  isPlaying.value = false
  
  // 加载音频
  loadAudioFile()
}

const loadAudioFile = async () => {
  if (!currentAudio.value) return
  
  try {
    // TODO: 实现实际的音频加载逻辑
    uiStore.showInfo(`加载音频: ${currentAudio.value.filename}`)
    
    // 模拟加载完成
    setTimeout(() => {
      duration.value = currentAudio.value?.duration || 120 // 默认2分钟
      uiStore.showSuccess('音频加载完成')
    }, 1000)
    
  } catch (error: any) {
    uiStore.showError(`音频加载失败: ${error.message}`)
  }
}

const seekTo = (value: number) => {
  if (!currentAudio.value) return
  
  const newTime = (value / 100) * duration.value
  currentTime.value = newTime
  
  // TODO: 实现实际的音频跳转逻辑
  uiStore.showInfo(`跳转到: ${formatTime(newTime)}`)
}

const updateProgress = (value: number) => {
  progress.value = value
}

const setVolume = (value: number) => {
  volume.value = value
  // TODO: 实现实际的音量设置逻辑
}

const setPlaybackRate = (rate: number) => {
  playbackRate.value = rate
  // TODO: 实现实际的播放速度设置逻辑
}

const setLoopMode = (mode: typeof loopMode.value) => {
  loopMode.value = mode
  uiStore.showInfo(`循环模式: ${getLoopModeText(mode)}`)
}

const shufflePlaylist = () => {
  // 随机打乱播放列表
  const shuffled = [...playlist.value].sort(() => Math.random() - 0.5)
  // TODO: 更新播放列表顺序
  uiStore.showInfo('播放列表已随机打乱')
}

const clearPlaylist = () => {
  // TODO: 清空播放列表
  uiStore.showWarning('播放列表已清空')
}

const removeFromPlaylist = (index: number) => {
  // TODO: 从播放列表中移除指定曲目
  uiStore.showInfo('已从播放列表移除')
}

const downloadCurrent = async () => {
  if (!currentAudio.value) return
  
  try {
    uiStore.showInfo('开始下载音频...')
    
    // 使用API下载音频
    const blob = await AudioService.downloadAudio(currentAudio.value.id)
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = currentAudio.value.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    uiStore.showSuccess('音频下载完成')
    
  } catch (error: any) {
    uiStore.showError(`下载失败: ${error.message}`)
  }
}

const getRowClassName = ({ row, rowIndex }: { row: any; rowIndex: number }) => {
  return rowIndex === currentTrackIndex.value ? 'active-track' : ''
}

const getLoopModeText = (mode: typeof loopMode.value) => {
  const texts = {
    single: '单曲循环',
    list: '列表循环',
    random: '随机播放',
    none: '不循环'
  }
  return texts[mode]
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}秒`
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}分${secs}秒`
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 进度模拟
let progressInterval: NodeJS.Timeout | null = null

const startProgressSimulation = () => {
  if (progressInterval) return
  
  progressInterval = setInterval(() => {
    if (currentTime.value < duration.value) {
      currentTime.value += 1
      progress.value = (currentTime.value / duration.value) * 100
    } else {
      // 播放完成，处理下一首
      handleTrackEnd()
    }
  }, 1000)
}

const stopProgressSimulation = () => {
  if (progressInterval) {
    clearInterval(progressInterval)
    progressInterval = null
  }
}

const handleTrackEnd = () => {
  stopProgressSimulation()
  isPlaying.value = false
  
  switch (loopMode.value) {
    case 'single':
      // 重新播放当前曲目
      currentTime.value = 0
      progress.value = 0
      playAudio()
      break
    case 'list':
      // 播放下一首
      if (hasNext.value) {
        nextTrack()
      }
      break
    case 'random':
      // 随机播放
      const randomIndex = Math.floor(Math.random() * playlist.value.length)
      currentTrackIndex.value = randomIndex
      loadTrack(randomIndex)
      break
    case 'none':
      // 停止播放
      break
  }
}

// 监听播放列表变化
watch(playlist, (newPlaylist) => {
  if (newPlaylist.length > 0 && !currentAudio.value) {
    // 自动加载第一首
    loadTrack(0)
  }
}, { immediate: true })

// 组件挂载和卸载
onMounted(() => {
  // 初始化播放器
  if (playlist.value.length > 0) {
    loadTrack(0)
  }
})

onUnmounted(() => {
  stopProgressSimulation()
})
</script>

<style scoped>
.audio-player {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.player-content {
  padding: 20px 0;
}

.current-audio-info {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.audio-cover {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
}

.audio-details h3 {
  margin: 0 0 10px 0;
  color: #303133;
}

.audio-meta {
  margin: 0;
  color: #909399;
  display: flex;
  gap: 20px;
}

.playback-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
}

.control-buttons {
  display: flex;
  align-items: center;
  gap: 20px;
}

.playback-info {
  display: flex;
  gap: 20px;
  color: #909399;
  font-size: 14px;
}

.progress-section {
  margin-bottom: 30px;
}

.playback-settings {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-item label {
  font-weight: 500;
  color: #303133;
}

.playlist-panel {
  margin-top: 30px;
}

.playlist-content {
  max-height: 300px;
  overflow-y: auto;
}

.track-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.playlist-drawer-content {
  padding: 20px;
}

.playlist-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.playlist-tracks {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.playlist-track {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.playlist-track:hover {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.playlist-track.active {
  border-color: #67c23a;
  background-color: #f0f9ff;
}

.track-info {
  flex: 1;
}

.track-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.track-meta {
  font-size: 12px;
  color: #909399;
  display: flex;
  gap: 15px;
}

.track-actions {
  display: flex;
  gap: 8px;
}

/* 表格样式 */
.active-track {
  background-color: #f0f9ff !important;
}

.active-track td {
  color: #409eff !important;
}
</style>

// 全局变量
let currentFileId = null;
let currentChapters = [];
let audioFiles = [];
let currentPlaylistIndex = 0;

// API基础URL
const API_BASE_URL = 'http://localhost:5000/api';

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    updateVoiceSettings();
});

// 初始化事件监听器
function initializeEventListeners() {
    // 文件上传相关
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    
    fileInput.addEventListener('change', handleFileSelect);
    
    // 拖拽上传
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    uploadArea.addEventListener('click', () => fileInput.click());
    
    // 语音设置相关
    document.getElementById('speedRange').addEventListener('input', updateSpeedValue);
    document.getElementById('volumeRange').addEventListener('input', updateVolumeValue);
    document.getElementById('voiceSelect').addEventListener('change', updateVoiceSettings);
    
    // 音频播放器相关
    const audioElement = document.getElementById('audioElement');
    audioElement.addEventListener('ended', nextTrack);
    audioElement.addEventListener('error', handleAudioError);
}

// 文件选择处理
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        uploadFile(file);
    }
}

// 拖拽处理
function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('dragover');
}

function handleDragLeave(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
}

function handleDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        uploadFile(files[0]);
    }
}

// 文件上传
async function uploadFile(file) {
    try {
        showStatus('正在上传文件...', 'info');
        showUploadProgress();
        
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`上传失败: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.error) {
            throw new Error(result.error);
        }
        
        // 保存文件信息
        currentFileId = result.file_id;
        currentChapters = result.chapters;
        
        // 显示文件信息
        displayFileInfo(result);
        displayChapters(result.chapters);
        
        // 显示后续选项
        document.getElementById('voiceSettings').style.display = 'block';
        document.getElementById('audioControls').style.display = 'block';
        
        hideUploadProgress();
        showStatus('文件上传成功！', 'success');
        
    } catch (error) {
        hideUploadProgress();
        showStatus(`上传失败: ${error.message}`, 'error');
        console.error('Upload error:', error);
    }
}

// 显示文件信息
function displayFileInfo(result) {
    document.getElementById('fileName').textContent = result.filename;
    document.getElementById('chapterCount').textContent = result.total_chapters;
    document.getElementById('fileId').textContent = result.file_id;
    document.getElementById('fileInfo').style.display = 'block';
}

// 显示章节列表
function displayChapters(chapters) {
    const container = document.getElementById('chaptersContainer');
    container.innerHTML = '';
    
    chapters.forEach((chapter, index) => {
        const chapterItem = document.createElement('div');
        chapterItem.className = 'chapter-item';
        chapterItem.innerHTML = `
            <input type="checkbox" class="chapter-checkbox" id="chapter_${index}" checked>
            <span class="chapter-title">${chapter.title}</span>
            <span class="chapter-status status-pending">待生成</span>
        `;
        container.appendChild(chapterItem);
    });
    
    document.getElementById('chaptersSection').style.display = 'block';
}

// 生成全部音频
async function generateAllAudio() {
    await generateAudio(-1);
}

// 生成选中章节音频
async function generateSelectedAudio() {
    const selectedChapters = [];
    const checkboxes = document.querySelectorAll('.chapter-checkbox:checked');
    
    checkboxes.forEach(checkbox => {
        const index = parseInt(checkbox.id.split('_')[1]);
        selectedChapters.push(index);
    });
    
    if (selectedChapters.length === 0) {
        showStatus('请选择要生成的章节', 'warning');
        return;
    }
    
    for (const chapterIndex of selectedChapters) {
        await generateAudio(chapterIndex);
    }
}

// 生成音频
async function generateAudio(chapterIndex) {
    try {
        const voiceSettings = getVoiceSettings();
        
        showStatus('正在生成音频，请稍候...', 'info');
        
        const response = await fetch(`${API_BASE_URL}/generate-audio`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                file_id: currentFileId,
                chapter_index: chapterIndex,
                voice_settings: voiceSettings
            })
        });
        
        if (!response.ok) {
            throw new Error(`生成失败: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.error) {
            throw new Error(result.error);
        }
        
        // 更新音频文件列表
        audioFiles = result.audio_files;
        
        // 更新章节状态
        updateChapterStatus(result.audio_files);
        
        // 显示播放器
        displayAudioPlayer();
        
        showStatus('音频生成成功！', 'success');
        
    } catch (error) {
        showStatus(`音频生成失败: ${error.message}`, 'error');
        console.error('Audio generation error:', error);
    }
}

// 更新章节状态
function updateChapterStatus(audioFiles) {
    audioFiles.forEach(audioFile => {
        const statusElement = document.querySelector(`#chapter_${audioFile.chapter_index}`).parentNode.querySelector('.chapter-status');
        statusElement.textContent = '已完成';
        statusElement.className = 'chapter-status status-completed';
    });
}

// 显示音频播放器
function displayAudioPlayer() {
    const player = document.getElementById('audioPlayer');
    const playlist = document.getElementById('playlist');
    
    // 清空播放列表
    playlist.innerHTML = '';
    
    // 添加音频文件到播放列表
    audioFiles.forEach((audioFile, index) => {
        const playlistItem = document.createElement('div');
        playlistItem.className = 'playlist-item';
        playlistItem.onclick = () => playAudio(index);
        playlistItem.innerHTML = `
            <span class="playlist-title">${audioFile.chapter_title}</span>
            <button class="playlist-download" onclick="downloadAudio('${audioFile.audio_file}', event)">
                下载
            </button>
        `;
        playlist.appendChild(playlistItem);
    });
    
    player.style.display = 'block';
    
    // 自动播放第一个音频
    if (audioFiles.length > 0) {
        playAudio(0);
    }
}

// 播放音频
function playAudio(index) {
    if (index < 0 || index >= audioFiles.length) return;
    
    currentPlaylistIndex = index;
    const audioFile = audioFiles[index];
    const audioElement = document.getElementById('audioElement');
    
    // 更新播放列表高亮
    updatePlaylistHighlight(index);
    
    // 设置音频源
    audioElement.src = `${API_BASE_URL}/download/${audioFile.audio_file}`;
    audioElement.play().catch(error => {
        console.error('播放失败:', error);
        showStatus('音频播放失败', 'error');
    });
}

// 更新播放列表高亮
function updatePlaylistHighlight(index) {
    const items = document.querySelectorAll('.playlist-item');
    items.forEach((item, i) => {
        item.classList.toggle('playing', i === index);
    });
}

// 上一首
function previousTrack() {
    if (currentPlaylistIndex > 0) {
        playAudio(currentPlaylistIndex - 1);
    }
}

// 下一首
function nextTrack() {
    if (currentPlaylistIndex < audioFiles.length - 1) {
        playAudio(currentPlaylistIndex + 1);
    }
}

// 下载当前音频
function downloadCurrent() {
    if (currentPlaylistIndex >= 0 && currentPlaylistIndex < audioFiles.length) {
        const audioFile = audioFiles[currentPlaylistIndex];
        downloadAudio(audioFile.audio_file);
    }
}

// 下载音频
function downloadAudio(filename, event) {
    if (event) {
        event.stopPropagation();
    }
    
    const link = document.createElement('a');
    link.href = `${API_BASE_URL}/download/${filename}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 获取语音设置
function getVoiceSettings() {
    return {
        voice: document.getElementById('voiceSelect').value,
        speed: parseFloat(document.getElementById('speedRange').value),
        volume: parseInt(document.getElementById('volumeRange').value)
    };
}

// 更新语音设置显示
function updateVoiceSettings() {
    updateSpeedValue();
    updateVolumeValue();
}

// 更新语速显示
function updateSpeedValue() {
    const speed = document.getElementById('speedRange').value;
    document.getElementById('speedValue').textContent = `${speed}x`;
}

// 更新音量显示
function updateVolumeValue() {
    const volume = document.getElementById('volumeRange').value;
    document.getElementById('volumeValue').textContent = volume;
}

// 显示上传进度
function showUploadProgress() {
    const progress = document.getElementById('uploadProgress');
    progress.style.display = 'block';
    
    // 模拟进度
    const fill = progress.querySelector('.progress-fill');
    let width = 0;
    const interval = setInterval(() => {
        if (width >= 90) {
            clearInterval(interval);
        } else {
            width += 10;
            fill.style.width = width + '%';
        }
    }, 100);
}

// 隐藏上传进度
function hideUploadProgress() {
    const progress = document.getElementById('uploadProgress');
    progress.style.display = 'none';
    progress.querySelector('.progress-fill').style.width = '0%';
}

// 显示状态消息
function showStatus(message, type = 'info') {
    const statusElement = document.getElementById('statusMessage');
    statusElement.textContent = message;
    statusElement.className = `status-message ${type}`;
    
    // 自动隐藏
    setTimeout(() => {
        statusElement.textContent = '';
        statusElement.className = 'status-message';
    }, 5000);
}

// 处理音频错误
function handleAudioError() {
    showStatus('音频播放出错', 'error');
}

// 工具函数：格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 音频播放器模块
class AudioPlayer {
    // 显示音频播放器
    static displayAudioPlayer() {
        const player = document.getElementById('audioPlayer');
        const playlist = document.getElementById('playlist');
        
        // 清空播放列表
        playlist.innerHTML = '';
        
        // 添加音频文件到播放列表
        audioFiles.forEach((audioFile, index) => {
            const playlistItem = document.createElement('div');
            playlistItem.className = 'playlist-item';
            playlistItem.onclick = () => AudioPlayer.playAudio(index);
            playlistItem.innerHTML = `
                <span class="playlist-title">${audioFile.chapter_title}</span>
                <button class="playlist-download" onclick="AudioPlayer.downloadAudio('${audioFile.audio_file}', event)">
                    下载
                </button>
            `;
            playlist.appendChild(playlistItem);
        });
        
        player.style.display = 'block';
        
        // 自动播放第一个音频
        if (audioFiles.length > 0) {
            AudioPlayer.playAudio(0);
        }
    }

    // 播放音频
    static playAudio(index) {
        if (index < 0 || index >= audioFiles.length) return;
        
        currentPlaylistIndex = index;
        const audioFile = audioFiles[index];
        const audioElement = document.getElementById('audioElement');
        
        // 更新播放列表高亮
        AudioPlayer.updatePlaylistHighlight(index);
        
        // 设置音频源
        audioElement.src = `${CONFIG.API_BASE_URL}/download/${audioFile.audio_file}`;
        audioElement.play().catch(error => {
            console.error('播放失败:', error);
            Utils.showStatus('音频播放失败', 'error');
        });
    }

    // 更新播放列表高亮
    static updatePlaylistHighlight(index) {
        const items = document.querySelectorAll('.playlist-item');
        items.forEach((item, i) => {
            item.classList.toggle('playing', i === index);
        });
    }

    // 上一首
    static previousTrack() {
        if (currentPlaylistIndex > 0) {
            AudioPlayer.playAudio(currentPlaylistIndex - 1);
        }
    }

    // 下一首
    static nextTrack() {
        if (currentPlaylistIndex < audioFiles.length - 1) {
            AudioPlayer.playAudio(currentPlaylistIndex + 1);
        }
    }

    // 下载当前音频
    static downloadCurrent() {
        if (currentPlaylistIndex >= 0 && currentPlaylistIndex < audioFiles.length) {
            const audioFile = audioFiles[currentPlaylistIndex];
            AudioPlayer.downloadAudio(audioFile.audio_file);
        }
    }

    // 下载音频
    static downloadAudio(filename, event) {
        if (event) {
            event.stopPropagation();
        }
        
        const link = document.createElement('a');
        link.href = `${CONFIG.API_BASE_URL}/download/${filename}`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // 处理音频错误
    static handleAudioError() {
        Utils.showStatus('音频播放出错', 'error');
    }
}

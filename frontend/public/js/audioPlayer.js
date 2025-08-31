// 音频播放器模块
class AudioPlayer {
    // 播放音频
    static async playAudio(fileId, filename) {
        try {
            const audioUrl = `${CONFIG.API_BASE_URL}/download/${fileId}/${filename}`;
            
            // 创建音频播放器
            const audio = new Audio(audioUrl);
            
            // 显示播放器
            const audioPlayer = document.getElementById('audioPlayer');
            const audioSource = audioPlayer.querySelector('source');
            const audioElement = audioPlayer.querySelector('audio');
            
            audioSource.src = audioUrl;
            audioElement.load();
            audioPlayer.style.display = 'block';
            
            // 自动播放
            audioElement.play();
            
        } catch (error) {
            console.error('播放音频失败:', error);
            Utils.showStatus('播放音频失败', 'error');
        }
    }
}

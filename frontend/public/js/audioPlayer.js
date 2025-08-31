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

    // 显示完整音频播放器
    static showCompleteAudioPlayer() {
        try {
            const audioPlayer = document.getElementById('audioPlayer');
            const audioSource = audioPlayer.querySelector('#audioSource');
            const audioElement = audioPlayer.querySelector('#audioElement');
            
            if (!audioSource || !audioElement) {
                throw new Error('找不到音频播放器元素');
            }
            
            // 设置完整音频的URL
            const completeAudioUrl = `${CONFIG.API_BASE_URL}/download-complete/${currentFileId}`;
            audioSource.src = completeAudioUrl;
            audioElement.load();
            
            // 显示播放器
            audioPlayer.style.display = 'block';
            
            // 生成章节音频列表
            AudioPlayer.generateChaptersAudioList();
            
            Utils.showStatus('完整音频播放器已准备就绪', 'success');
            
        } catch (error) {
            console.error('显示完整音频播放器失败:', error);
            Utils.showStatus('显示播放器失败', 'error');
        }
    }

    // 生成章节音频列表
    static generateChaptersAudioList() {
        try {
            if (!currentChapters) {
                return;
            }

            const chaptersAudioList = document.getElementById('chaptersAudioList');
            if (!chaptersAudioList) {
                return;
            }

            // 创建章节音频列表HTML
            const chaptersHTML = currentChapters.map((chapter, index) => {
                const truncatedTitle = chapter.title.length > 20 
                    ? chapter.title.substring(0, 20) + '...' 
                    : chapter.title;
                
                return `
                    <div class="chapter-audio-item" data-chapter-index="${index}">
                        <div class="chapter-info">
                            <span class="chapter-number">${index + 1}</span>
                            <span class="chapter-title" title="${chapter.title}">${truncatedTitle}</span>
                        </div>
                        <div class="chapter-actions">
                            <button class="btn btn-small btn-secondary" onclick="AudioPlayer.playChapterAudio(${index})">
                                <i class="fas fa-play"></i> 播放
                            </button>
                            <button class="btn btn-small btn-primary" onclick="AudioPlayer.downloadChapterAudio(${index})">
                                <i class="fas fa-download"></i> 下载
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            chaptersAudioList.innerHTML = chaptersHTML;
            
        } catch (error) {
            console.error('生成章节音频列表失败:', error);
        }
    }

    // 播放章节音频
    static async playChapterAudio(chapterIndex) {
        try {
            const fileName = AudioDownloader.getChapterAudioFileName(chapterIndex);
            const audioUrl = `${CONFIG.API_BASE_URL}/download/${currentFileId}/${fileName}`;
            
            // 创建临时音频元素播放章节音频
            const tempAudio = new Audio(audioUrl);
            await tempAudio.play();
            
            Utils.showStatus(`正在播放第 ${chapterIndex + 1} 章`, 'info');
            
        } catch (error) {
            console.error('播放章节音频失败:', error);
            Utils.showStatus('播放章节音频失败', 'error');
        }
    }

    // 下载章节音频
    static async downloadChapterAudio(chapterIndex) {
        try {
            const fileName = AudioDownloader.getChapterAudioFileName(chapterIndex);
            await AudioDownloader.downloadChapterAudio(currentFileId, fileName);
        } catch (error) {
            console.error('下载章节音频失败:', error);
            Utils.showStatus('下载章节音频失败', 'error');
        }
    }
}

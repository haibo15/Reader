// 音频播放器模块
class AudioPlayer {
    // 存储当前播放的音频元素
    static currentPlayingAudio = null;
    static currentPlayingChapter = null;

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
                        <div class="chapter-audio-controls">
                            <div class="chapter-progress-container">
                                <div class="chapter-progress-bar">
                                    <div class="chapter-progress-fill" data-chapter="${index}"></div>
                                </div>
                                <div class="chapter-time-display">
                                    <span class="chapter-current-time" data-chapter="${index}">0:00</span>
                                    <span>/</span>
                                    <span class="chapter-total-time" data-chapter="${index}">0:00</span>
                                </div>
                            </div>
                        </div>
                        <div class="chapter-actions">
                            <button class="btn btn-small btn-secondary chapter-play-btn" data-chapter="${index}" onclick="AudioPlayer.playChapterAudio(${index})">
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
            // 停止当前播放的音频
            AudioPlayer.stopCurrentAudio();
            
            const fileName = AudioDownloader.getChapterAudioFileName(chapterIndex);
            const audioUrl = `${CONFIG.API_BASE_URL}/download/${currentFileId}/${fileName}`;
            
            // 创建音频元素
            const audio = new Audio(audioUrl);
            
            // 设置音频事件监听器
            audio.addEventListener('loadedmetadata', () => {
                AudioPlayer.updateChapterTimeDisplay(chapterIndex, 0, audio.duration);
            });
            
            audio.addEventListener('timeupdate', () => {
                AudioPlayer.updateChapterProgress(chapterIndex, audio.currentTime, audio.duration);
                AudioPlayer.updateChapterTimeDisplay(chapterIndex, audio.currentTime, audio.duration);
            });
            
            audio.addEventListener('ended', () => {
                AudioPlayer.onChapterAudioEnded(chapterIndex);
            });
            
            audio.addEventListener('error', (error) => {
                console.error('章节音频播放错误:', error);
                AudioPlayer.onChapterAudioEnded(chapterIndex);
            });
            
            // 更新播放按钮状态
            AudioPlayer.updateChapterPlayButton(chapterIndex, true);
            
            // 开始播放
            await audio.play();
            
            // 保存当前播放的音频
            AudioPlayer.currentPlayingAudio = audio;
            AudioPlayer.currentPlayingChapter = chapterIndex;
            
            Utils.showStatus(`正在播放第 ${chapterIndex + 1} 章`, 'info');
            
        } catch (error) {
            console.error('播放章节音频失败:', error);
            Utils.showStatus('播放章节音频失败', 'error');
            AudioPlayer.onChapterAudioEnded(chapterIndex);
        }
    }

    // 停止当前播放的音频
    static stopCurrentAudio() {
        if (AudioPlayer.currentPlayingAudio) {
            AudioPlayer.currentPlayingAudio.pause();
            AudioPlayer.currentPlayingAudio.currentTime = 0;
            AudioPlayer.currentPlayingAudio = null;
        }
        
        if (AudioPlayer.currentPlayingChapter !== null) {
            AudioPlayer.updateChapterPlayButton(AudioPlayer.currentPlayingChapter, false);
            AudioPlayer.currentPlayingChapter = null;
        }
    }

    // 更新章节播放按钮状态
    static updateChapterPlayButton(chapterIndex, isPlaying) {
        const playBtn = document.querySelector(`.chapter-play-btn[data-chapter="${chapterIndex}"]`);
        if (playBtn) {
            if (isPlaying) {
                playBtn.innerHTML = '<i class="fas fa-pause"></i> 停止';
                playBtn.onclick = () => AudioPlayer.stopChapterAudio(chapterIndex);
            } else {
                playBtn.innerHTML = '<i class="fas fa-play"></i> 播放';
                playBtn.onclick = () => AudioPlayer.playChapterAudio(chapterIndex);
            }
        }
    }

    // 停止章节音频
    static stopChapterAudio(chapterIndex) {
        if (AudioPlayer.currentPlayingChapter === chapterIndex) {
            AudioPlayer.stopCurrentAudio();
            Utils.showStatus(`已停止播放第 ${chapterIndex + 1} 章`, 'info');
        }
    }

    // 更新章节进度条
    static updateChapterProgress(chapterIndex, currentTime, duration) {
        const progressFill = document.querySelector(`.chapter-progress-fill[data-chapter="${chapterIndex}"]`);
        if (progressFill && duration > 0) {
            const progress = (currentTime / duration) * 100;
            progressFill.style.width = `${progress}%`;
        }
    }

    // 更新章节时间显示
    static updateChapterTimeDisplay(chapterIndex, currentTime, duration) {
        const currentTimeSpan = document.querySelector(`.chapter-current-time[data-chapter="${chapterIndex}"]`);
        const totalTimeSpan = document.querySelector(`.chapter-total-time[data-chapter="${chapterIndex}"]`);
        
        if (currentTimeSpan) {
            currentTimeSpan.textContent = AudioPlayer.formatTime(currentTime);
        }
        if (totalTimeSpan) {
            totalTimeSpan.textContent = AudioPlayer.formatTime(duration);
        }
    }

    // 格式化时间显示
    static formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // 章节音频播放结束处理
    static onChapterAudioEnded(chapterIndex) {
        AudioPlayer.updateChapterPlayButton(chapterIndex, false);
        AudioPlayer.updateChapterProgress(chapterIndex, 0, 0);
        AudioPlayer.updateChapterTimeDisplay(chapterIndex, 0, 0);
        
        if (AudioPlayer.currentPlayingChapter === chapterIndex) {
            AudioPlayer.currentPlayingAudio = null;
            AudioPlayer.currentPlayingChapter = null;
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

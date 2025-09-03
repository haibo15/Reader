/**
 * 章节音频列表模块
 * 负责章节音频的显示、播放和下载功能
 */
class ChaptersAudioModule {
    static MODULE_ID = 'chaptersAudioModule';
    
    /**
     * 初始化模块
     */
    static init() {
        this.render();
        this.bindEvents();
    }
    
    /**
     * 渲染模块HTML
     */
    static render() {
        const moduleContainer = document.getElementById(this.MODULE_ID);
        if (!moduleContainer) return;
        
        moduleContainer.innerHTML = `
            <div class="module-header">
                <h3>📖 章节音频列表</h3>
                <button class="back-button" onclick="App.showAudioFilesList()">
                    ← 返回音频列表
                </button>
            </div>
            <div class="module-content">
                <div class="chapters-audio-list" id="chaptersAudioList">
                    <!-- 章节音频列表将在这里动态生成 -->
                </div>
            </div>
        `;
    }
    
    /**
     * 绑定事件
     */
    static bindEvents() {
        // 模块特定的事件绑定
    }
    
    /**
     * 渲染章节音频列表
     */
    static render() {
        if (!currentChapters) return;
        
        const container = document.getElementById('chaptersAudioList');
        if (!container) return;
        
        const chaptersHTML = currentChapters.map((chapter, index) => {
            const hasAudio = this.checkChapterAudioStatus(index);
            const audioStatus = hasAudio ? '已生成' : '未生成';
            const statusClass = hasAudio ? 'status-completed' : 'status-pending';
            const statusIcon = hasAudio ? '🎵' : '📄';
            
            return `
                <div class="chapter-audio-item" data-chapter="${index}">
                    <div class="chapter-audio-header">
                        <div class="chapter-audio-title">
                            <span class="chapter-number">第 ${index + 1} 章</span>
                            <span class="chapter-title">${chapter.title}</span>
                        </div>
                        <div class="chapter-audio-status ${statusClass}">
                            ${statusIcon} ${audioStatus}
                        </div>
                    </div>
                    <div class="chapter-audio-content">
                        <div class="chapter-audio-info">
                            <span class="info-label">文本长度:</span>
                            <span class="info-value">${chapter.content.length} 字符</span>
                        </div>
                        <div class="chapter-audio-actions">
                            ${hasAudio ? `
                                <button class="btn btn-small btn-primary" onclick="ChaptersAudioModule.playChapterAudio(${index})">
                                    ▶️ 播放
                                </button>
                                <button class="btn btn-small btn-success" onclick="ChaptersAudioModule.downloadChapterAudio(${index})">
                                    📥 下载
                                </button>
                                <button class="btn btn-small btn-danger" onclick="ChaptersAudioModule.deleteChapterAudio(${index})">
                                    🗑️ 删除
                                </button>
                            ` : `
                                <button class="btn btn-small btn-secondary" onclick="ChaptersAudioModule.generateChapterAudio(${index})">
                                    🎵 生成
                                </button>
                            `}
                        </div>
                    </div>
                    ${hasAudio ? `
                        <div class="chapter-audio-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: 0%"></div>
                            </div>
                            <div class="progress-time">
                                <span class="current-time">0:00</span> / <span class="total-time">0:00</span>
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
        
        container.innerHTML = chaptersHTML;
    }
    
    /**
     * 检查章节音频状态
     */
    static checkChapterAudioStatus(chapterIndex) {
        // 这里应该调用实际的音频状态检查
        // 暂时返回false，实际使用时需要实现
        return false;
    }
    
    /**
     * 播放章节音频
     */
    static playChapterAudio(chapterIndex) {
        try {
            if (typeof AudioPlayer !== 'undefined' && AudioPlayer.playChapterAudio) {
                AudioPlayer.playChapterAudio(chapterIndex);
            } else {
                Utils.showStatus('音频播放功能不可用', 'error');
            }
        } catch (error) {
            Utils.showStatus(`播放失败: ${error.message}`, 'error');
        }
    }
    
    /**
     * 下载章节音频
     */
    static async downloadChapterAudio(chapterIndex) {
        try {
            if (typeof AudioPlayer !== 'undefined' && AudioPlayer.downloadChapterAudio) {
                AudioPlayer.downloadChapterAudio(chapterIndex);
            } else if (typeof AudioDownloader !== 'undefined' && AudioDownloader.downloadChapterAudio) {
                const fileName = AudioDownloader.getChapterAudioFileName(chapterIndex);
                await AudioDownloader.downloadChapterAudio(currentFileId, fileName);
            } else {
                Utils.showStatus('下载功能不可用', 'error');
            }
        } catch (error) {
            Utils.showStatus(`下载失败: ${error.message}`, 'error');
        }
    }
    
    /**
     * 删除章节音频
     */
    static async deleteChapterAudio(chapterIndex) {
        try {
            if (typeof AudioPlayer !== 'undefined' && AudioPlayer.deleteChapterAudio) {
                AudioPlayer.deleteChapterAudio(chapterIndex);
            } else {
                await this.handleDeleteChapterAudio(chapterIndex);
            }
        } catch (error) {
            Utils.showStatus(`删除失败: ${error.message}`, 'error');
        }
    }
    
    /**
     * 处理删除章节音频
     */
    static async handleDeleteChapterAudio(chapterIndex) {
        const fileName = this.getChapterAudioFileName(chapterIndex);
        if (!fileName) {
            Utils.showStatus('无法获取音频文件名', 'error');
            return;
        }
        
        // 确认删除
        if (!confirm(`确定要删除第 ${chapterIndex + 1} 章的音频文件 "${fileName}" 吗？`)) {
            return;
        }
        
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/delete-audio/${currentFileId}/${fileName}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                Utils.showStatus(`第 ${chapterIndex + 1} 章音频删除成功`, 'success');
                // 刷新音频状态
                if (typeof AudioStatusManager !== 'undefined') {
                    AudioStatusManager.checkAudioStatus();
                }
                // 重新渲染列表
                this.render();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || '删除失败');
            }
        } catch (error) {
            Utils.showStatus(`删除失败: ${error.message}`, 'error');
        }
    }
    
    /**
     * 生成章节音频
     */
    static async generateChapterAudio(chapterIndex) {
        try {
            if (typeof AudioGenerator !== 'undefined' && AudioGenerator.generateChapterAudio) {
                AudioGenerator.generateChapterAudio(chapterIndex);
            } else {
                Utils.showStatus('音频生成功能不可用', 'error');
            }
        } catch (error) {
            Utils.showStatus(`生成失败: ${error.message}`, 'error');
        }
    }
    
    /**
     * 获取章节音频文件名
     */
    static getChapterAudioFileName(chapterIndex) {
        // 优先从版本管理器获取当前选中的版本
        if (typeof AudioVersionManager !== 'undefined') {
            const selectedFilename = AudioVersionManager.getSelectedAudioFilename(chapterIndex);
            if (selectedFilename) {
                return selectedFilename;
            }
        }
        
        // 尝试从音频状态中获取实际的文件名
        if (window.currentAudioStatus && window.currentAudioStatus.audio_status) {
            const status = window.currentAudioStatus.audio_status.find(s => s.chapter_index === chapterIndex);
            if (status && status.has_audio) {
                return status.audio_file;
            }
        }
        
        // 如果无法获取实际文件名，使用默认格式
        return `chapter_${chapterIndex + 1}.wav`;
    }
    
    /**
     * 更新章节进度
     */
    static updateChapterProgress(chapterIndex, currentTime, duration) {
        const chapterItem = document.querySelector(`[data-chapter="${chapterIndex}"]`);
        if (!chapterItem) return;
        
        const progressFill = chapterItem.querySelector('.progress-fill');
        const currentTimeSpan = chapterItem.querySelector('.current-time');
        const totalTimeSpan = chapterItem.querySelector('.total-time');
        
        if (progressFill) {
            const progress = (currentTime / duration) * 100;
            progressFill.style.width = `${progress}%`;
        }
        
        if (currentTimeSpan) {
            currentTimeSpan.textContent = this.formatTime(currentTime);
        }
        
        if (totalTimeSpan) {
            totalTimeSpan.textContent = this.formatTime(duration);
        }
    }
    
    /**
     * 重置章节进度
     */
    static resetChapterProgress(chapterIndex) {
        const chapterItem = document.querySelector(`[data-chapter="${chapterIndex}"]`);
        if (!chapterItem) return;
        
        const progressFill = chapterItem.querySelector('.progress-fill');
        const currentTimeSpan = chapterItem.querySelector('.current-time');
        
        if (progressFill) {
            progressFill.style.width = '0%';
        }
        
        if (currentTimeSpan) {
            currentTimeSpan.textContent = '0:00';
        }
    }
    
    /**
     * 格式化时间
     */
    static formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    /**
     * 显示模块
     */
    static show() {
        const module = document.getElementById(this.MODULE_ID);
        if (module) {
            module.style.display = 'block';
        }
    }
    
    /**
     * 隐藏模块
     */
    static hide() {
        const module = document.getElementById(this.MODULE_ID);
        if (module) {
            module.style.display = 'none';
        }
    }
    
    /**
     * 刷新模块
     */
    static refresh() {
        this.render();
        this.bindEvents();
    }
}

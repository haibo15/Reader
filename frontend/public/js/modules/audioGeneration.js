/**
 * 音频生成模块
 * 负责音频生成控制、进度显示和操作按钮
 */
class AudioGenerationModule {
    static MODULE_ID = 'audioGenerationModule';
    
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
                <h3>🎧 音频生成</h3>
                <button class="back-button" onclick="App.showAudioFilesList()">
                    ← 返回音频列表
                </button>
            </div>
            <div class="module-content">
                <div class="control-buttons">
                    <button class="btn btn-primary" onclick="AudioGenerationModule.generateAllAudio()">
                        生成全部音频
                    </button>
                    <button class="btn btn-secondary" onclick="AudioGenerationModule.generateSelectedAudio()">
                        生成选中章节
                    </button>
                </div>
                
                <!-- 音频操作按钮容器 -->
                <div class="audio-actions" style="margin-top: 15px;">
                    <!-- 合并和下载按钮将在这里动态添加 -->
                </div>
                
                <!-- 音频生成进度条 -->
                <div class="progress-container" id="audioProgress" style="display: none;">
                    <div class="progress-bar">
                        <div class="progress-fill"></div>
                    </div>
                    <div class="progress-text">正在生成音频...</div>
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
     * 生成全部音频
     */
    static async generateAllAudio() {
        try {
            if (typeof generateAllAudio === 'function') {
                generateAllAudio();
            } else {
                Utils.showStatus('音频生成功能不可用', 'error');
            }
        } catch (error) {
            Utils.showStatus(`生成全部音频失败: ${error.message}`, 'error');
        }
    }
    
    /**
     * 生成选中章节音频
     */
    static async generateSelectedAudio() {
        try {
            if (typeof generateSelectedAudio === 'function') {
                generateSelectedAudio();
            } else {
                Utils.showStatus('音频生成功能不可用', 'error');
            }
        } catch (error) {
            Utils.showStatus(`生成选中章节音频失败: ${error.message}`, 'error');
        }
    }
    
    /**
     * 添加合并按钮
     */
    static addMergeButton() {
        const audioActions = document.querySelector(`#${this.MODULE_ID} .audio-actions`);
        if (!audioActions) return;
        
        // 检查是否已经有合并按钮
        let mergeBtn = audioActions.querySelector('.merge-selected-btn');
        if (mergeBtn) return;
        
        // 创建合并按钮
        mergeBtn = document.createElement('button');
        mergeBtn.className = 'btn btn-primary merge-selected-btn';
        mergeBtn.textContent = '🔄 合并选中音频';
        mergeBtn.onclick = () => {
            if (typeof AudioMerger !== 'undefined' && AudioMerger.mergeSelectedAudio) {
                AudioMerger.mergeSelectedAudio();
            } else {
                Utils.showStatus('合并功能不可用', 'error');
            }
        };
        
        audioActions.appendChild(mergeBtn);
    }
    
    /**
     * 添加下载按钮
     */
    static addDownloadButton() {
        const audioActions = document.querySelector(`#${this.MODULE_ID} .audio-actions`);
        if (!audioActions) return;
        
        // 检查是否已经有下载按钮
        let downloadBtn = audioActions.querySelector('.download-all-btn');
        if (downloadBtn) return;
        
        // 创建下载按钮
        downloadBtn = document.createElement('button');
        downloadBtn.className = 'btn btn-success download-all-btn';
        downloadBtn.textContent = '📥 下载全部音频';
        downloadBtn.onclick = () => {
            if (typeof AudioDownloader !== 'undefined' && AudioDownloader.downloadAllChapterAudio) {
                AudioDownloader.downloadAllChapterAudio();
            } else {
                Utils.showStatus('下载功能不可用', 'error');
            }
        };
        
        audioActions.appendChild(downloadBtn);
    }
    
    /**
     * 显示进度条
     */
    static showProgress() {
        const progressContainer = document.querySelector(`#${this.MODULE_ID} #audioProgress`);
        if (progressContainer) {
            progressContainer.style.display = 'block';
        }
    }
    
    /**
     * 隐藏进度条
     */
    static hideProgress() {
        const progressContainer = document.querySelector(`#${this.MODULE_ID} #audioProgress`);
        if (progressContainer) {
            progressContainer.style.display = 'none';
        }
    }
    
    /**
     * 更新进度
     */
    static updateProgress(progress) {
        const progressFill = document.querySelector(`#${this.MODULE_ID} .progress-fill`);
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }
        
        const progressText = document.querySelector(`#${this.MODULE_ID} .progress-text`);
        if (progressText) {
            progressText.textContent = `正在生成音频... ${progress}%`;
        }
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

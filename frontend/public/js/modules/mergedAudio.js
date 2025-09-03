/**
 * 合并音频播放模块
 * 负责合并音频的播放、版本选择和下载删除功能
 */
class MergedAudioModule {
    static MODULE_ID = 'mergedAudioModule';
    
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
                <h3>🎵 合并音频播放</h3>
                <button class="back-button" onclick="App.showAudioFilesList()">
                    ← 返回音频列表
                </button>
            </div>
            <div class="module-content">
                <!-- 第一行：合并音频播放器和版本选择 -->
                <div class="complete-audio-section">
                    <div class="merged-audio-header">
                        <div class="merged-version-selector" id="mergedVersionSelector" style="display: none;">
                            <label>版本选择：</label>
                            <select id="mergedVersionSelect" onchange="MergedAudioModule.onMergedVersionChange()">
                                <option value="">请先合并音频</option>
                            </select>
                        </div>
                    </div>
                    <div class="player-container">
                        <audio id="audioElement" controls disabled>
                            <source id="audioSource" src="" type="audio/wav">
                            您的浏览器不支持音频播放
                        </audio>
                    </div>
                    <div class="complete-audio-actions">
                        <button class="btn btn-primary" id="downloadMergedBtn" onclick="MergedAudioModule.downloadMergedAudio()" disabled>
                            <i class="fas fa-download"></i> 下载合并音频
                        </button>
                        <button class="btn btn-danger" id="deleteMergedBtn" onclick="MergedAudioModule.deleteMergedAudio()" disabled>
                            <i class="fas fa-trash"></i> 删除合并音频
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * 绑定事件
     */
    static bindEvents() {
        // 音频播放器相关事件
        const audioElement = document.getElementById('audioElement');
        if (audioElement) {
            audioElement.addEventListener('error', (error) => {
                Utils.showStatus('音频播放出错', 'error');
            });
        }
    }
    
    /**
     * 版本选择变化处理
     */
    static onMergedVersionChange() {
        try {
            if (typeof AudioPlayer !== 'undefined' && AudioPlayer.onMergedVersionChange) {
                AudioPlayer.onMergedVersionChange();
            } else {
                // 如果没有AudioPlayer，直接处理版本变化
                this.handleVersionChange();
            }
        } catch (error) {
            Utils.showStatus(`版本切换失败: ${error.message}`, 'error');
        }
    }
    
    /**
     * 处理版本变化
     */
    static handleVersionChange() {
        const selector = document.getElementById('mergedVersionSelect');
        if (!selector || !selector.value) return;
        
        // 更新音频源
        const audioElement = document.getElementById('audioElement');
        const audioSource = document.getElementById('audioSource');
        if (audioElement && audioSource) {
            audioSource.src = selector.value;
            audioElement.load();
            audioElement.disabled = false;
        }
        
        // 启用下载和删除按钮
        this.setButtonsEnabled(true);
    }
    
    /**
     * 下载合并音频
     */
    static async downloadMergedAudio() {
        try {
            if (typeof AudioPlayer !== 'undefined' && AudioPlayer.downloadMergedAudio) {
                AudioPlayer.downloadMergedAudio();
            } else {
                // 如果没有AudioPlayer，直接处理下载
                await this.handleDownload();
            }
        } catch (error) {
            Utils.showStatus(`下载失败: ${error.message}`, 'error');
        }
    }
    
    /**
     * 处理下载
     */
    static async handleDownload() {
        const selector = document.getElementById('mergedVersionSelect');
        if (!selector?.value) {
            Utils.showStatus('请先选择要下载的合并音频版本', 'warning');
            return;
        }
        
        try {
            if (typeof AudioDownloader !== 'undefined' && AudioDownloader.downloadChapterAudio) {
                await AudioDownloader.downloadChapterAudio(currentFileId, selector.value);
            } else {
                Utils.showStatus('下载功能不可用', 'error');
            }
        } catch (error) {
            Utils.showStatus(`下载失败: ${error.message}`, 'error');
        }
    }
    
    /**
     * 删除合并音频
     */
    static async deleteMergedAudio() {
        try {
            if (typeof AudioPlayer !== 'undefined' && AudioPlayer.deleteMergedAudio) {
                AudioPlayer.deleteMergedAudio();
            } else {
                // 如果没有AudioPlayer，直接处理删除
                await this.handleDelete();
            }
        } catch (error) {
            Utils.showStatus(`删除失败: ${error.message}`, 'error');
        }
    }
    
    /**
     * 处理删除
     */
    static async handleDelete() {
        const selector = document.getElementById('mergedVersionSelect');
        if (!selector?.value) {
            Utils.showStatus('请先选择要删除的合并音频版本', 'warning');
            return;
        }
        
        const filename = selector.value;
        
        // 确认删除
        if (!confirm(`确定要删除合并音频文件 "${filename}" 吗？`)) {
            return;
        }
        
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/delete-audio/${currentFileId}/${filename}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                Utils.showStatus('合并音频删除成功', 'success');
                // 刷新合并音频版本列表
                this.loadMergedAudioVersions();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || '删除失败');
            }
        } catch (error) {
            Utils.showStatus(`删除失败: ${error.message}`, 'error');
        }
    }
    
    /**
     * 加载合并音频版本
     */
    static async loadMergedAudioVersions() {
        try {
            if (!currentFileId) return;
            
            const response = await fetch(`${CONFIG.API_BASE_URL}/merged-audio-versions/${currentFileId}`);
            if (!response.ok) {
                this.setPlayerDisabled(true);
                return;
            }
            
            const data = await response.json();
            const versions = data.merged_versions || [];
            
            if (versions.length > 0) {
                this.populateVersionSelector(versions);
                this.setPlayerDisabled(false);
            } else {
                this.setPlayerDisabled(true);
            }
        } catch (error) {
            console.error('加载合并音频版本失败:', error);
            this.setPlayerDisabled(true);
        }
    }
    
    /**
     * 填充版本选择器
     */
    static populateVersionSelector(versions) {
        const selector = document.getElementById('mergedVersionSelect');
        const versionSelector = document.getElementById('mergedVersionSelector');
        
        if (!selector || !versionSelector) return;
        
        // 清空现有选项
        selector.innerHTML = '<option value="">请选择版本</option>';
        
        // 添加版本选项
        versions.forEach(version => {
            const option = document.createElement('option');
            option.value = version.filename;
            option.textContent = version.display_name || version.filename;
            selector.appendChild(option);
        });
        
        // 显示版本选择器
        versionSelector.style.display = 'block';
    }
    
    /**
     * 设置播放器启用/禁用状态
     */
    static setPlayerDisabled(disabled) {
        const audioElement = document.getElementById('audioElement');
        const downloadBtn = document.getElementById('downloadMergedBtn');
        const deleteBtn = document.getElementById('deleteMergedBtn');
        
        if (audioElement) audioElement.disabled = disabled;
        if (downloadBtn) downloadBtn.disabled = disabled;
        if (deleteBtn) deleteBtn.disabled = disabled;
    }
    
    /**
     * 设置按钮启用/禁用状态
     */
    static setButtonsEnabled(enabled) {
        const downloadBtn = document.getElementById('downloadMergedBtn');
        const deleteBtn = document.getElementById('deleteMergedBtn');
        
        if (downloadBtn) downloadBtn.disabled = !enabled;
        if (deleteBtn) deleteBtn.disabled = !enabled;
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

/**
 * 音频文件管理器
 * 负责显示和管理已生成的音频文件列表
 */
class AudioFilesManager {
    
    /**
     * 初始化音频文件管理器
     */
    static init() {
        this.loadAudioFiles();
    }
    
    /**
     * 加载音频文件列表
     */
    static async loadAudioFiles() {
        // 显示加载状态
        this.displayLoadingState();
        
        try {
            console.log('正在加载音频文件列表...');
            const response = await fetch(`${CONFIG.API_BASE_URL}/audio-files`);
            console.log('API响应状态:', response.status);
            console.log('API响应头:', response.headers);
            
            if (response.ok) {
                const audioFiles = await response.json();
                console.log('获取到的音频文件:', audioFiles);
                this.displayAudioFiles(audioFiles);
            } else {
                console.error('加载音频文件失败:', response.status, response.statusText);
                const errorText = await response.text();
                console.error('错误详情:', errorText);
                this.displayEmptyState();
            }
        } catch (error) {
            console.error('加载音频文件出错:', error);
            this.displayEmptyState();
        }
    }
    
    /**
     * 显示音频文件列表
     */
    static displayAudioFiles(audioFiles) {
        // 显示表格式列表
        this.displayAudioFilesTable(audioFiles);
        
        // 同时更新原有的卡片式列表（作为备用）
        this.displayAudioFilesCards(audioFiles);
    }
    
    /**
     * 显示表格式音频文件列表
     */
    static displayAudioFilesTable(audioFiles) {
        const tableBody = document.getElementById('audioFilesTableBody');
        
        if (!audioFiles || audioFiles.length === 0) {
            this.displayEmptyState();
            return;
        }
        
        const tableRows = audioFiles.map((audioFile, index) => {
            const statusClass = audioFile.status === 'completed' ? 'completed' : 'processing';
            const statusText = audioFile.status === 'completed' ? '已完成' : '处理中';
            const statusIcon = audioFile.status === 'completed' ? '🎵' : '⏳';
            
            return `
                <tr onclick="AudioFilesManager.showAudioDetails('${audioFile.file_id}')" style="cursor: pointer;">
                    <td>${index + 1}</td>
                    <td>
                        <div class="audio-file-name" title="${audioFile.original_name}">
                            ${audioFile.original_name}
                        </div>
                    </td>
                    <td>
                        <div class="audio-file-status ${statusClass}">
                            ${statusIcon} ${statusText}
                        </div>
                    </td>
                    <td class="audio-file-number">${audioFile.chapter_count}</td>
                    <td class="audio-file-number">${audioFile.audio_count}</td>
                    <td class="audio-file-size">${this.formatFileSize(audioFile.total_size)}</td>
                    <td class="audio-file-time">${this.formatDate(audioFile.created_at)}</td>
                    <td class="audio-file-actions">
                        <button class="btn btn-primary btn-small" onclick="event.stopPropagation(); AudioFilesManager.showAudioDetails('${audioFile.file_id}')">
                            打开
                        </button>
                        <button class="btn btn-danger btn-small" onclick="event.stopPropagation(); AudioFilesManager.deleteAudioFile('${audioFile.file_id}', '${audioFile.original_name}')">
                            删除
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        
        tableBody.innerHTML = tableRows;
    }
    
    /**
     * 显示卡片式音频文件列表（备用）
     */
    static displayAudioFilesCards(audioFiles) {
        const audioFilesList = document.getElementById('audioFilesList');
        
        if (!audioFiles || audioFiles.length === 0) {
            return;
        }
        
        const audioFilesHTML = audioFiles.map(audioFile => {
            const statusClass = audioFile.status === 'completed' ? 'completed' : 'processing';
            const statusText = audioFile.status === 'completed' ? '已完成' : '处理中';
            const statusIcon = audioFile.status === 'completed' ? '🎵' : '⏳';
            
            return `
                <div class="audio-file-card" onclick="AudioFilesManager.showAudioDetails('${audioFile.file_id}')">
                    <div class="audio-file-header">
                        <div class="audio-file-icon">🎵</div>
                        <div class="audio-file-title">${audioFile.original_name}</div>
                        <div class="audio-file-status ${statusClass}">
                            ${statusIcon} ${statusText}
                        </div>
                    </div>
                    <div class="audio-file-info">
                        <div class="audio-info-item">
                            <span class="audio-info-label">文件大小:</span>
                            <span class="audio-info-value">${this.formatFileSize(audioFile.total_size)}</span>
                        </div>
                        <div class="audio-info-item">
                            <span class="audio-info-label">章节数:</span>
                            <span class="audio-info-value">${audioFile.chapter_count}</span>
                        </div>
                        <div class="audio-info-item">
                            <span class="audio-info-label">音频文件:</span>
                            <span class="audio-info-value">${audioFile.audio_count} 个</span>
                        </div>
                        <div class="audio-info-item">
                            <span class="audio-info-label">生成时间:</span>
                            <span class="audio-info-value">${this.formatDate(audioFile.created_at)}</span>
                        </div>
                    </div>
                    <div class="audio-file-actions">
                        <button class="btn btn-primary btn-small" onclick="event.stopPropagation(); AudioFilesManager.showAudioDetails('${audioFile.file_id}')">
                            打开
                        </button>
                        <button class="btn btn-danger btn-small" onclick="event.stopPropagation(); AudioFilesManager.deleteAudioFile('${audioFile.file_id}', '${audioFile.original_name}')">
                            删除
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        audioFilesList.innerHTML = audioFilesHTML;
    }
    
    /**
     * 显示空状态
     */
    static displayEmptyState() {
        // 显示表格空状态
        const tableBody = document.getElementById('audioFilesTableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7">
                        <div class="audio-files-empty">
                            <div class="audio-files-empty-icon">🎵</div>
                            <h4>暂无音频文件</h4>
                            <p>上传文档并生成音频后，将在这里显示</p>
                            <button class="btn btn-primary" onclick="App.switchSection('upload')">
                                📄 上传文档
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
        
        // 显示卡片空状态（备用）
        const audioFilesList = document.getElementById('audioFilesList');
        if (audioFilesList) {
            audioFilesList.innerHTML = `
                <div class="empty-audio-files">
                    <div style="font-size: 3rem; margin-bottom: 15px;">🎵</div>
                    <p>暂无音频文件</p>
                    <p>上传文档并生成音频后，将在这里显示</p>
                    <button class="btn btn-primary" onclick="App.switchSection('upload')">
                        📄 上传文档
                    </button>
                    </button>
                </div>
            `;
        }
    }
    
    /**
     * 显示音频详情
     */
    static async showAudioDetails(fileId) {
        try {
            console.log('开始显示音频详情，文件ID:', fileId);
            
            // 设置当前文件ID
            if (window.currentFileId !== undefined) {
                window.currentFileId = fileId;
                console.log('已设置currentFileId:', window.currentFileId);
            }
            
            // 加载文档信息
            console.log('正在加载文档信息...');
            const response = await fetch(`${CONFIG.API_BASE_URL}/load-document/${fileId}`);
            console.log('文档加载响应状态:', response.status);
            
            if (response.ok) {
                const docData = await response.json();
                console.log('获取到的文档数据:', docData);
                
                // 切换到音频管理页面并显示详情
                console.log('正在切换到音频管理页面...');
                App.switchSection('audio');
                
                // 显示文件信息
                console.log('正在显示文件信息...');
                if (window.FileDisplay && window.FileDisplay.displayFileInfo) {
                    console.log('调用FileDisplay.displayFileInfo...');
                    window.FileDisplay.displayFileInfo(docData);
                } else {
                    console.error('FileDisplay.displayFileInfo 不可用');
                }
                
                // 显示章节列表
                console.log('正在显示章节列表...');
                if (window.FileDisplay && window.FileDisplay.displayChapters) {
                    console.log('调用FileDisplay.displayChapters...');
                    window.FileDisplay.displayChapters(docData.chapters);
                } else {
                    console.error('FileDisplay.displayChapters 不可用');
                }
                
                // 显示语音设置
                console.log('正在显示语音设置...');
                if (document.getElementById('voiceSettings')) {
                    document.getElementById('voiceSettings').style.display = 'block';
                    console.log('语音设置已显示');
                } else {
                    console.error('找不到voiceSettings元素');
                }
                
                // 显示音频控制
                console.log('正在显示音频控制...');
                if (document.getElementById('audioControls')) {
                    document.getElementById('audioControls').style.display = 'block';
                    console.log('音频控制已显示');
                } else {
                    console.error('找不到audioControls元素');
                }
                
                console.log('音频详情显示完成');
                
            } else {
                console.error('加载文档详情失败:', response.status, response.statusText);
                const errorText = await response.text();
                console.error('错误详情:', errorText);
            }
        } catch (error) {
            console.error('加载文档详情出错:', error);
        }
    }
    
    /**
     * 返回音频文件列表
     */
    static showAudioFilesList() {
        // 隐藏所有详情页面元素
        const elementsToHide = [
            'fileInfo',
            'chaptersSection', 
            'voiceSettings',
            'audioControls',
            'audioPlayer'
        ];
        
        elementsToHide.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.style.display = 'none';
            }
        });
        
        // 显示音频文件列表
        const audioFilesSection = document.getElementById('audioFilesSection');
        if (audioFilesSection) {
            audioFilesSection.style.display = 'block';
        }
        
        // 显示表格容器
        const tableContainer = document.getElementById('audioFilesTable');
        if (tableContainer) {
            tableContainer.style.display = 'table';
        }
        
        // 刷新音频文件列表
        this.refresh();
    }
    
    /**
     * 显示加载状态
     */
    static displayLoadingState() {
        const tableBody = document.getElementById('audioFilesTableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7">
                        <div class="audio-files-loading">
                            <div class="audio-files-loading-spinner"></div>
                            <p>正在加载音频文件列表...</p>
                        </div>
                    </td>
                </tr>
            `;
        }
    }
    
    /**
     * 删除音频文件
     */
    static async deleteAudioFile(fileId, fileName) {
        if (!confirm(`确定要删除音频文件 "${fileName}" 吗？此操作不可恢复。`)) {
            return;
        }
        
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/delete-file`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    file_id: fileId
                })
            });
            
            if (response.ok) {
                // 重新加载音频文件列表
                this.loadAudioFiles();
                
                // 显示成功消息
                if (window.showStatusMessage) {
                    window.showStatusMessage(`音频文件 "${fileName}" 已删除`, 'success');
                }
            } else {
                console.error('删除音频文件失败:', response.statusText);
                if (window.showStatusMessage) {
                    window.showStatusMessage('删除音频文件失败', 'error');
                }
            }
        } catch (error) {
            console.error('删除音频文件出错:', error);
            if (window.showStatusMessage) {
                window.showStatusMessage('删除音频文件失败', 'error');
            }
        }
    }
    
    /**
     * 格式化文件大小
     */
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    /**
     * 格式化日期
     */
    static formatDate(timestamp) {
        const date = new Date(timestamp * 1000);
        return date.toLocaleString('zh-CN');
    }
    
    /**
     * 刷新音频文件列表
     */
    static refresh() {
        this.loadAudioFiles();
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    AudioFilesManager.init();
});

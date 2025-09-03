// 音频下载器模块
class AudioDownloader {
    // 下载单个章节音频
    static async downloadChapterAudio(fileId, filename) {
        try {
            const downloadUrl = `${CONFIG.API_BASE_URL}/download/${fileId}/${filename}`;
            
            // 创建临时链接并触发下载
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            Utils.showStatus('章节音频下载已开始', 'success');

        } catch (error) {
            console.error('下载章节音频失败:', error);
            Utils.showStatus(`下载失败: ${error.message}`, 'error');
        }
    }

    // 下载完整音频
    static async downloadCompleteAudio() {
        try {
            if (!currentFileId) {
                Utils.showStatus('请先上传文件', 'error');
                return;
            }

            Utils.showStatus('正在准备下载完整音频...', 'info');

            // 创建下载链接
            const downloadUrl = `${CONFIG.API_BASE_URL}/download-complete/${currentFileId}`;
            
            // 创建临时链接并触发下载
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `complete_audio_${currentFileId}.wav`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            Utils.showStatus('完整音频下载已开始', 'success');

        } catch (error) {
            console.error('下载完整音频失败:', error);
            Utils.showStatus(`下载失败: ${error.message}`, 'error');
        }
    }

    // 不再添加整体下载按钮（在合并音频播放器中已有下载功能）
    static addCompleteDownloadButton() {
        // 功能已移除，合并音频下载在播放器中处理
    }
    
    // 添加合并按钮到音频控制区域
    static addMergeButton() {
        const audioGenerationModule = document.getElementById('audioGenerationModule');
        if (!audioGenerationModule) return;

        // 检查是否已经有合并按钮
        let mergeBtn = audioGenerationModule.querySelector('.merge-selected-btn');
        if (mergeBtn) return;

        // 创建合并按钮
        mergeBtn = document.createElement('button');
        mergeBtn.className = 'btn btn-primary merge-selected-btn';
        mergeBtn.textContent = '🔄 合并选中音频';
        mergeBtn.onclick = () => AudioMerger.mergeSelectedAudio();

        // 添加到音频操作区域
        const actionsDiv = audioGenerationModule.querySelector('.audio-actions');
        if (actionsDiv) {
            actionsDiv.appendChild(mergeBtn);
        } else {
            // 如果没有找到audio-actions区域，直接添加到模块末尾
            audioGenerationModule.appendChild(mergeBtn);
        }
    }

    // 添加下载按钮到音频控制区域
    static addDownloadButton() {
        const audioGenerationModule = document.getElementById('audioGenerationModule');
        if (!audioGenerationModule) return;

        const controlButtons = audioGenerationModule.querySelector('.control-buttons');
        const audioActions = audioGenerationModule.querySelector('.audio-actions');

        // 创建按钮行容器
        let buttonsRow = audioGenerationModule.querySelector('.buttons-row');
    }
    
    // 确保所有按钮在同一行
    static ensureButtonsInSameRow() {
        const audioGenerationModule = document.getElementById('audioGenerationModule');
        if (!audioGenerationModule) return;
        
        const controlButtons = audioGenerationModule.querySelector('.control-buttons');
        const audioActions = audioGenerationModule.querySelector('.audio-actions');
        
        if (controlButtons && audioActions) {
            // 创建一个包装容器
            let buttonsRow = audioGenerationModule.querySelector('.buttons-row');
            if (!buttonsRow) {
                buttonsRow = document.createElement('div');
                buttonsRow.className = 'buttons-row';
                
                // 将现有的按钮容器移动到同一行
                const parent = controlButtons.parentNode;
                parent.insertBefore(buttonsRow, controlButtons);
                buttonsRow.appendChild(controlButtons);
                buttonsRow.appendChild(audioActions);
            }
        }
    }

    // 不再添加章节音频下载按钮（在章节列表中已有下载功能）
    static addChapterDownloadButtons() {
        // 功能已移除，章节下载在章节音频列表中处理
    }

    // 下载所有章节音频
    static async downloadAllChapterAudio() {
        try {
            if (!currentFileId || !currentChapters) {
                Utils.showStatus('请先上传文件', 'error');
                return;
            }

            Utils.showStatus('正在准备下载各章节音频...', 'info');

            // 获取音频状态
            const response = await fetch(`${CONFIG.API_BASE_URL}/check-audio-status/${currentFileId}`);
            if (!response.ok) {
                throw new Error('获取音频状态失败');
            }

            const statusData = await response.json();
            const { audio_status } = statusData;

            // 下载所有已生成的章节音频
            let downloadCount = 0;
            for (const status of audio_status) {
                if (status.has_audio) {
                    try {
                        const downloadUrl = `${CONFIG.API_BASE_URL}/download/${currentFileId}/${status.audio_file}`;
                        
                        // 创建临时链接并触发下载
                        const link = document.createElement('a');
                        link.href = downloadUrl;
                        link.download = status.audio_file;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        
                        downloadCount++;
                        
                        // 添加延迟避免浏览器阻止多个下载
                        await new Promise(resolve => setTimeout(resolve, 500));
                        
                    } catch (error) {
                        console.error(`下载章节 ${status.chapter_index + 1} 音频失败:`, error);
                    }
                }
            }

            if (downloadCount > 0) {
                Utils.showStatus(`已开始下载 ${downloadCount} 个章节音频`, 'success');
            } else {
                Utils.showStatus('没有可下载的章节音频', 'warning');
            }

        } catch (error) {
            console.error('下载章节音频失败:', error);
            Utils.showStatus(`下载失败: ${error.message}`, 'error');
        }
    }

    // 根据章节索引获取音频文件名
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
}

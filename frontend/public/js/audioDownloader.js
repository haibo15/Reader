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

    // 添加整体下载按钮
    static addCompleteDownloadButton() {
        const audioControls = document.getElementById('audioControls');
        if (audioControls) {
            // 检查是否已存在下载按钮
            let downloadBtn = audioControls.querySelector('.complete-download-btn');
            
            if (!downloadBtn) {
                downloadBtn = document.createElement('button');
                downloadBtn.className = 'btn btn-primary complete-download-btn';
                downloadBtn.innerHTML = '<i class="fas fa-download"></i> 下载完整音频';
                downloadBtn.onclick = () => AudioDownloader.downloadCompleteAudio();
                
                // 插入到音频控制区域
                const actionsDiv = audioControls.querySelector('.audio-actions');
                if (actionsDiv) {
                    actionsDiv.appendChild(downloadBtn);
                } else {
                    audioControls.appendChild(downloadBtn);
                }
            }
            
            // 添加合并选中章节按钮
            this.addMergeSelectedButton();
        }
    }
    
    // 添加合并选中章节按钮
    static addMergeSelectedButton() {
        const audioControls = document.getElementById('audioControls');
        if (audioControls) {
            // 检查是否已存在合并按钮
            let mergeBtn = audioControls.querySelector('.merge-selected-btn');
            
            if (!mergeBtn) {
                mergeBtn = document.createElement('button');
                mergeBtn.className = 'btn btn-secondary merge-selected-btn';
                mergeBtn.innerHTML = '<i class="fas fa-compress-arrows-alt"></i> 合并选中章节';
                mergeBtn.onclick = () => {
                    const selectedChapters = FileDisplay.getSelectedChapters();
                    if (selectedChapters.length === 0) {
                        Utils.showStatus('请选择要合并的章节', 'warning');
                        return;
                    }
                    AudioMerger.mergeAudioFiles(selectedChapters);
                };
                
                // 确保按钮容器在同一行
                this.ensureButtonsInSameRow();
                
                // 插入到音频控制区域
                const actionsDiv = audioControls.querySelector('.audio-actions');
                if (actionsDiv) {
                    actionsDiv.appendChild(mergeBtn);
                } else {
                    audioControls.appendChild(mergeBtn);
                }
            }
        }
    }
    
    // 确保所有按钮在同一行
    static ensureButtonsInSameRow() {
        const audioControls = document.getElementById('audioControls');
        if (!audioControls) return;
        
        const controlButtons = audioControls.querySelector('.control-buttons');
        const audioActions = audioControls.querySelector('.audio-actions');
        
        if (controlButtons && audioActions) {
            // 创建一个包装容器
            let buttonsRow = audioControls.querySelector('.buttons-row');
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

    // 添加章节音频下载按钮
    static addChapterDownloadButtons() {
        const audioControls = document.getElementById('audioControls');
        if (audioControls) {
            // 检查是否已存在章节下载按钮
            let chapterDownloadBtn = audioControls.querySelector('.chapter-download-btn');
            
            if (!chapterDownloadBtn) {
                chapterDownloadBtn = document.createElement('button');
                chapterDownloadBtn.className = 'btn btn-secondary chapter-download-btn';
                chapterDownloadBtn.innerHTML = '<i class="fas fa-download"></i> 下载各章节音频';
                chapterDownloadBtn.onclick = () => AudioDownloader.downloadAllChapterAudio();
                
                // 确保按钮容器在同一行
                this.ensureButtonsInSameRow();
                
                // 插入到音频控制区域
                const actionsDiv = audioControls.querySelector('.audio-actions');
                if (actionsDiv) {
                    actionsDiv.appendChild(chapterDownloadBtn);
                } else {
                    audioControls.appendChild(chapterDownloadBtn);
                }
            }
        }
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

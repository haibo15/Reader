// 音频生成模块
class AudioGenerator {
    // 生成全部音频
    static async generateAllAudio() {
        await AudioGenerator.generateAudio(-1);
    }

    // 生成选中章节音频
    static async generateSelectedAudio() {
        const selectedChapters = FileDisplay.getSelectedChapters();
        
        if (selectedChapters.length === 0) {
            Utils.showStatus('请选择要生成的章节', 'warning');
            return;
        }
        
        for (const chapterIndex of selectedChapters) {
            await AudioGenerator.generateAudio(chapterIndex);
        }
    }

    // 生成音频
    static async generateAudio(chapterIndex) {
        try {
            if (!currentFileId) {
                Utils.showStatus('请先上传文件', 'error');
                return;
            }

            // 显示进度条
            const progressContainer = document.getElementById('audioProgress');
            const progressFill = progressContainer.querySelector('.progress-fill');
            const progressText = progressContainer.querySelector('.progress-text');
            
            progressContainer.style.display = 'block';
            progressFill.style.width = '0%';
            progressText.textContent = '正在生成音频...';

            // 获取语音设置
            const voiceSettings = VoiceSettings.getVoiceSettings();

            // 发送请求到后端
            const response = await fetch(`${CONFIG.API_BASE_URL}/generate-audio-progress`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    file_id: currentFileId,
                    chapter_index: chapterIndex,
                    voice_settings: voiceSettings
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '音频生成失败');
            }

            const result = await response.json();
            
            // 开始轮询进度
            if (result.task_id) {
                await AudioGenerator.pollProgress(result.task_id, progressFill, progressText);
            }

            // 更新章节状态
            if (result.audio_files && result.audio_files.length > 0) {
                AudioGenerator.updateChapterStatus(result.audio_files);
            }

            Utils.showStatus('音频生成成功', 'success');

            // 隐藏进度条
            setTimeout(() => {
                progressContainer.style.display = 'none';
            }, 2000);

        } catch (error) {
            console.error('音频生成失败:', error);
            Utils.showStatus(`音频生成失败: ${error.message}`, 'error');
            
            // 隐藏进度条
            document.getElementById('audioProgress').style.display = 'none';
        }
    }

    // 轮询进度
    static async pollProgress(taskId, progressFill, progressText) {
        const maxAttempts = 300; // 最多轮询5分钟
        let attempts = 0;
        
        console.log('🔍 开始轮询进度，任务ID:', taskId);
        
        while (attempts < maxAttempts) {
            try {
                console.log(`🔍 第 ${attempts + 1} 次轮询进度...`);
                
                const response = await fetch(`${CONFIG.API_BASE_URL}/progress/${taskId}`);
                console.log('🔍 进度响应状态:', response.status);
                
                if (response.ok) {
                    const progressData = await response.json();
                    console.log('🔍 进度数据:', progressData);
                    
                    // 更新进度条
                    const newWidth = `${progressData.progress}%`;
                    console.log('🔍 更新进度条宽度:', newWidth);
                    progressFill.style.width = newWidth;
                    progressText.textContent = progressData.message;
                    
                    // 检查是否完成
                    if (progressData.status === 'completed') {
                        console.log('🔍 音频生成完成！');
                        progressFill.style.width = '100%';
                        progressText.textContent = '音频生成完成！';
                        return;
                    } else if (progressData.status === 'error') {
                        console.error('🔍 音频生成出错:', progressData.message);
                        throw new Error(progressData.message);
                    }
                } else {
                    console.error('🔍 进度请求失败:', response.status, response.statusText);
                }
                
                // 等待1秒后继续轮询
                await new Promise(resolve => setTimeout(resolve, 1000));
                attempts++;
                
            } catch (error) {
                console.error('🔍 进度轮询失败:', error);
                throw error;
            }
        }
        
        console.error('🔍 音频生成超时');
        throw new Error('音频生成超时');
    }

    // 检查音频状态
    static async checkAudioStatus() {
        try {
            if (!currentFileId) {
                return;
            }

            const response = await fetch(`${CONFIG.API_BASE_URL}/check-audio-status/${currentFileId}`);
            if (response.ok) {
                const statusData = await response.json();
                AudioGenerator.updateAudioStatusDisplay(statusData);
            }
        } catch (error) {
            console.error('检查音频状态失败:', error);
        }
    }

    // 合并音频文件
    static async mergeAudioFiles() {
        try {
            if (!currentFileId) {
                Utils.showStatus('请先上传文件', 'error');
                return;
            }

            Utils.showStatus('正在合并音频文件...', 'info');

            const response = await fetch(`${CONFIG.API_BASE_URL}/merge-audio/${currentFileId}`, {
                method: 'GET'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '音频合并失败');
            }

            const result = await response.json();
            
            if (result.success) {
                Utils.showStatus(`音频合并成功！共合并 ${result.total_chapters} 个章节`, 'success');
                
                // 添加整体下载按钮
                AudioGenerator.addCompleteDownloadButton();
            }

        } catch (error) {
            console.error('音频合并失败:', error);
            Utils.showStatus(`音频合并失败: ${error.message}`, 'error');
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
                downloadBtn.onclick = () => AudioGenerator.downloadCompleteAudio();
                
                // 插入到音频控制区域
                const actionsDiv = audioControls.querySelector('.audio-actions');
                if (actionsDiv) {
                    actionsDiv.appendChild(downloadBtn);
                } else {
                    audioControls.appendChild(downloadBtn);
                }
            }
        }
    }

    // 更新音频状态显示
    static updateAudioStatusDisplay(statusData) {
        const { audio_status, total_chapters, generated_count } = statusData;
        
        // 更新章节表格中的音频状态
        audio_status.forEach(status => {
            const chapterRow = document.querySelector(`#chapter_${status.chapter_index}`)?.closest('.chapter-row');
            if (chapterRow) {
                const audioStatusCell = chapterRow.querySelector('td:nth-child(6)');
                if (audioStatusCell) {
                    if (status.has_audio) {
                        audioStatusCell.innerHTML = `
                            <span class="status-badge status-completed">已生成</span>
                            <button class="btn btn-small btn-secondary" onclick="AudioGenerator.playAudio('${currentFileId}', '${status.audio_file}')">
                                <i class="fas fa-play"></i> 播放
                            </button>
                            <button class="btn btn-small btn-primary" onclick="AudioGenerator.downloadChapterAudio('${currentFileId}', '${status.audio_file}')">
                                <i class="fas fa-download"></i> 下载
                            </button>
                        `;
                    } else {
                        audioStatusCell.innerHTML = '<span class="status-badge status-pending">未生成</span>';
                    }
                }
            }
        });

        // 更新音频生成控制区域的状态信息
        const audioControls = document.getElementById('audioControls');
        if (audioControls) {
            const statusInfo = audioControls.querySelector('.audio-status-info');
            if (!statusInfo) {
                const statusDiv = document.createElement('div');
                statusDiv.className = 'audio-status-info';
                statusDiv.innerHTML = `
                    <div class="status-summary">
                        <span data-label="总章节">${total_chapters}</span>
                        <span data-label="已生成">${generated_count}</span>
                        <span data-label="进度">${Math.round((generated_count / total_chapters) * 100)}%</span>
                    </div>
                `;
                audioControls.appendChild(statusDiv);
            } else {
                statusInfo.innerHTML = `
                    <div class="status-summary">
                        <span data-label="总章节">${total_chapters}</span>
                        <span data-label="已生成">${generated_count}</span>
                        <span data-label="进度">${Math.round((generated_count / total_chapters) * 100)}%</span>
                    </div>
                `;
            }

            // 如果所有章节都已生成，添加合并和下载按钮
            if (generated_count > 0 && generated_count === total_chapters) {
                AudioGenerator.addCompleteDownloadButton();
                
                // 添加合并按钮
                let mergeBtn = audioControls.querySelector('.merge-audio-btn');
                if (!mergeBtn) {
                    mergeBtn = document.createElement('button');
                    mergeBtn.className = 'btn btn-success merge-audio-btn';
                    mergeBtn.innerHTML = '<i class="fas fa-music"></i> 合并音频';
                    mergeBtn.onclick = () => AudioGenerator.mergeAudioFiles();
                    
                    const actionsDiv = audioControls.querySelector('.audio-actions');
                    if (actionsDiv) {
                        actionsDiv.appendChild(mergeBtn);
                    } else {
                        audioControls.appendChild(mergeBtn);
                    }
                }
            }
        }
    }

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

    // 更新章节状态
    static updateChapterStatus(audioFiles) {
        audioFiles.forEach(audioFile => {
            const chapterRow = document.querySelector(`#chapter_${audioFile.chapter_index}`)?.closest('.chapter-row');
            if (chapterRow) {
                const audioStatusCell = chapterRow.querySelector('td:nth-child(6)');
                if (audioStatusCell) {
                    audioStatusCell.innerHTML = `
                        <span class="status-badge status-completed">已生成</span>
                        <button class="btn btn-small btn-secondary" onclick="AudioGenerator.playAudio('${currentFileId}', '${audioFile.audio_file}')">
                            <i class="fas fa-play"></i> 播放
                        </button>
                    `;
                }
            }
        });
    }

    // 更新单个章节的音频生成状态
    static updateSingleChapterStatus(chapterIndex, hasAudio, audioFile = null) {
        const chapterRow = document.querySelector(`#chapter_${chapterIndex}`)?.closest('.chapter-row');
        if (chapterRow) {
            const audioStatusCell = chapterRow.querySelector('td:nth-child(6)');
            if (audioStatusCell) {
                if (hasAudio && audioFile) {
                    audioStatusCell.innerHTML = `
                        <span class="status-badge status-completed">已生成</span>
                        <button class="btn btn-small btn-secondary" onclick="AudioGenerator.playAudio('${currentFileId}', '${audioFile}')">
                            <i class="fas fa-play"></i> 播放
                        </button>
                    `;
                } else {
                    audioStatusCell.innerHTML = '<span class="status-badge status-pending">未生成</span>';
                }
            }
        }
    }

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
}

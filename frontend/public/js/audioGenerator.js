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
        
        while (attempts < maxAttempts) {
            try {
                const response = await fetch(`${CONFIG.API_BASE_URL}/progress/${taskId}`);
                if (response.ok) {
                    const progressData = await response.json();
                    
                    // 更新进度条
                    progressFill.style.width = `${progressData.progress}%`;
                    progressText.textContent = progressData.message;
                    
                    // 检查是否完成
                    if (progressData.status === 'completed') {
                        progressFill.style.width = '100%';
                        progressText.textContent = '音频生成完成！';
                        return;
                    } else if (progressData.status === 'error') {
                        throw new Error(progressData.message);
                    }
                }
                
                // 等待1秒后继续轮询
                await new Promise(resolve => setTimeout(resolve, 1000));
                attempts++;
                
            } catch (error) {
                console.error('进度轮询失败:', error);
                throw error;
            }
        }
        
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
                        <span class="total-chapters">${total_chapters}</span>
                        <span class="generated-count">${generated_count}</span>
                        <span class="progress">${Math.round((generated_count / total_chapters) * 100)}%</span>
                    </div>
                `;
                audioControls.appendChild(statusDiv);
            } else {
                statusInfo.innerHTML = `
                    <div class="status-summary">
                        <span class="total-chapters">${total_chapters}</span>
                        <span class="generated-count">${generated_count}</span>
                        <span class="progress">${Math.round((generated_count / total_chapters) * 100)}%</span>
                    </div>
                `;
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
}

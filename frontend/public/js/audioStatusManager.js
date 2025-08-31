// 音频状态管理模块
class AudioStatusManager {
    // 检查音频状态
    static async checkAudioStatus() {
        try {
            if (!currentFileId) {
                return;
            }

            const response = await fetch(`${CONFIG.API_BASE_URL}/check-audio-status/${currentFileId}`);
            if (response.ok) {
                const statusData = await response.json();
                AudioStatusManager.updateAudioStatusDisplay(statusData);
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
                            <button class="btn btn-small btn-secondary" onclick="AudioPlayer.playAudio('${currentFileId}', '${status.audio_file}')">
                                <i class="fas fa-play"></i> 播放
                            </button>
                            <button class="btn btn-small btn-primary" onclick="AudioDownloader.downloadChapterAudio('${currentFileId}', '${status.audio_file}')">
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
                AudioDownloader.addCompleteDownloadButton();
                
                // 添加合并按钮
                let mergeBtn = audioControls.querySelector('.merge-audio-btn');
                if (!mergeBtn) {
                    mergeBtn = document.createElement('button');
                    mergeBtn.className = 'btn btn-success merge-audio-btn';
                    mergeBtn.innerHTML = '<i class="fas fa-music"></i> 合并音频';
                    mergeBtn.onclick = () => AudioMerger.mergeAudioFiles();
                    
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

    // 更新章节状态
    static updateChapterStatus(audioFiles) {
        audioFiles.forEach(audioFile => {
            const chapterRow = document.querySelector(`#chapter_${audioFile.chapter_index}`)?.closest('.chapter-row');
            if (chapterRow) {
                const audioStatusCell = chapterRow.querySelector('td:nth-child(6)');
                if (audioStatusCell) {
                    audioStatusCell.innerHTML = `
                        <span class="status-badge status-completed">已生成</span>
                        <button class="btn btn-small btn-secondary" onclick="AudioPlayer.playAudio('${currentFileId}', '${audioFile.audio_file}')">
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
                        <button class="btn btn-small btn-secondary" onclick="AudioPlayer.playAudio('${currentFileId}', '${audioFile}')">
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

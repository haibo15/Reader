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
        
        // 保存音频状态到全局变量，供其他模块使用
        window.currentAudioStatus = statusData;
        
        // 更新章节表格中的音频状态
        audio_status.forEach(status => {
            const chapterRow = document.querySelector(`#chapter_${status.chapter_index}`)?.closest('.chapter-row');
            if (chapterRow) {
                const audioStatusCell = chapterRow.querySelector('td:nth-child(6)');
                if (audioStatusCell) {
                    if (status.has_audio) {
                        audioStatusCell.innerHTML = '<span class="status-badge status-completed">已生成</span>';
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

            // 无论是否已合并，始终提供“合并选中章节”按钮和“下载各章节音频”按钮
            try {
                if (typeof AudioDownloader !== 'undefined') {
                    AudioDownloader.addMergeSelectedButton();
                    AudioDownloader.addChapterDownloadButtons();
                }
            } catch (_) {}

            // 只要有任意章节已生成，就展示章节音频列表（无需等待合并）
            if (generated_count > 0) {
                const audioPlayer = document.getElementById('audioPlayer');
                if (audioPlayer) {
                    audioPlayer.style.display = 'block';
                }
                try {
                    if (typeof AudioPlayer !== 'undefined') {
                        AudioPlayer.generateChaptersAudioList();
                        // 检查是否有合并音频版本
                        AudioPlayer.loadMergedAudioVersions();
                    }
                } catch (_) {}
            }

            // 如果所有章节都已生成，不再自动合并，仅提示可手动合并
            if (generated_count > 0 && generated_count === total_chapters) {
                Utils.showStatus('所有章节已生成，可使用“合并选中章节”手动合并', 'info');
            }
        }

        // 加载音频版本选择器
        AudioVersionManager.loadAudioVersions();
    }

    // 更新章节状态
    static updateChapterStatus(audioFiles) {
        audioFiles.forEach(audioFile => {
            const chapterRow = document.querySelector(`#chapter_${audioFile.chapter_index}`)?.closest('.chapter-row');
            if (chapterRow) {
                const audioStatusCell = chapterRow.querySelector('td:nth-child(6)');
                if (audioStatusCell) {
                    audioStatusCell.innerHTML = '<span class="status-badge status-completed">已生成</span>';
                }
            }
        });
        
        // 章节生成后，确保按钮与列表可见
        try {
            if (typeof AudioDownloader !== 'undefined') {
                AudioDownloader.addMergeSelectedButton();
                AudioDownloader.addChapterDownloadButtons();
            }
            if (typeof AudioPlayer !== 'undefined') {
                const audioPlayer = document.getElementById('audioPlayer');
                if (audioPlayer) audioPlayer.style.display = 'block';
                // 稍等DOM更新后再渲染列表
                setTimeout(() => AudioPlayer.generateChaptersAudioList(), 0);
            }
        } catch (_) {}
        
        // 重新加载音频版本选择器
        setTimeout(() => {
            AudioVersionManager.loadAudioVersions();
        }, 500);
    }

    // 更新单个章节的音频生成状态
    static updateSingleChapterStatus(chapterIndex, hasAudio, audioFile = null) {
        const chapterRow = document.querySelector(`#chapter_${chapterIndex}`)?.closest('.chapter-row');
        if (chapterRow) {
            const audioStatusCell = chapterRow.querySelector('td:nth-child(6)');
            if (audioStatusCell) {
                if (hasAudio && audioFile) {
                    audioStatusCell.innerHTML = '<span class="status-badge status-completed">已生成</span>';
                } else {
                    audioStatusCell.innerHTML = '<span class="status-badge status-pending">未生成</span>';
                }
            }
        }
    }
}

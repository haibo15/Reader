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
            const response = await fetch(`${CONFIG.API_BASE_URL}/generate-audio`, {
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
            
            // 更新进度条
            progressFill.style.width = '100%';
            progressText.textContent = '音频生成完成！';

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

    // 更新章节状态
    static updateChapterStatus(audioFiles) {
        audioFiles.forEach(audioFile => {
            const chapterRow = document.querySelector(`#chapter_${audioFile.chapter_index}`).closest('.chapter-row');
            if (chapterRow) {
                const audioStatusCell = chapterRow.querySelector('td:nth-child(6)');
                if (audioStatusCell) {
                    audioStatusCell.innerHTML = '<span class="status-badge status-completed">已生成</span>';
                }
            }
        });
    }

    // 更新单个章节的音频生成状态
    static updateSingleChapterStatus(chapterIndex, status) {
        const chapterRow = document.querySelector(`#chapter_${chapterIndex}`).closest('.chapter-row');
        if (!chapterRow) return;

        const audioStatusCell = chapterRow.querySelector('td:nth-child(6)');
        if (!audioStatusCell) return;

        let statusHTML = '';
        switch(status) {
            case 'generating':
                statusHTML = '<span class="status-badge status-generating">生成中</span>';
                break;
            case 'completed':
                statusHTML = '<span class="status-badge status-completed">已生成</span>';
                break;
            case 'failed':
                statusHTML = '<span class="status-badge status-failed">失败</span>';
                break;
            default:
                statusHTML = '<span class="status-badge status-pending">待生成</span>';
        }
        
        audioStatusCell.innerHTML = statusHTML;
    }
}

// 音频生成核心模块
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
            AudioProgressUI.showProgress();

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
                await AudioProgressTracker.pollProgress(result.task_id);
            }

            // 更新章节状态
            if (result.audio_files && result.audio_files.length > 0) {
                AudioStatusManager.updateChapterStatus(result.audio_files);
            }

            Utils.showStatus('音频生成成功', 'success');

            // 隐藏进度条
            AudioProgressUI.hideProgress();

        } catch (error) {
            console.error('音频生成失败:', error);
            Utils.showStatus(`音频生成失败: ${error.message}`, 'error');
            
            // 隐藏进度条
            AudioProgressUI.hideProgress();
        }
    }
}

// 音频生成模块
class AudioGenerator {
    // 生成全部音频
    static async generateAllAudio() {
        await AudioGenerator.generateAudio(-1);
    }

    // 生成选中章节音频
    static async generateSelectedAudio() {
        const selectedChapters = [];
        const checkboxes = document.querySelectorAll('.chapter-checkbox:checked');
        
        checkboxes.forEach(checkbox => {
            const index = parseInt(checkbox.id.split('_')[1]);
            selectedChapters.push(index);
        });
        
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
            const voiceSettings = VoiceSettings.getVoiceSettings();
            
            // 显示进度信息
            if (chapterIndex === -1) {
                Utils.showStatus('正在生成全部章节音频，请稍候...', 'info');
                Utils.showProgressBar();
                
                // 更新所有章节状态为正在生成
                currentChapters.forEach((_, index) => {
                    FileDisplay.updateSingleChapterStatus(index, 'generating');
                });
            } else {
                Utils.showStatus(`正在生成第 ${chapterIndex + 1} 章节音频...`, 'info');
                FileDisplay.updateSingleChapterStatus(chapterIndex, 'generating');
            }
            
            const response = await fetch(`${CONFIG.API_BASE_URL}/generate-audio`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    file_id: currentFileId,
                    chapter_index: chapterIndex,
                    voice_settings: voiceSettings
                })
            });
            
            if (!response.ok) {
                throw new Error(`生成失败: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            // 更新音频文件列表
            audioFiles = result.audio_files;
            
            // 更新章节状态
            FileDisplay.updateChapterStatus(result.audio_files);
            
            // 显示播放器
            AudioPlayer.displayAudioPlayer();
            
            Utils.hideProgressBar();
            Utils.showStatus(`音频生成成功！共生成 ${result.audio_files.length} 个音频文件`, 'success');
            
        } catch (error) {
            Utils.showStatus(`音频生成失败: ${error.message}`, 'error');
            console.error('Audio generation error:', error);
        }
    }
}

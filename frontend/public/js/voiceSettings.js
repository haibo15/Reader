// 语音设置模块
class VoiceSettings {
    // 获取语音设置
    static getVoiceSettings() {
        return {
            voice: document.getElementById('voiceSelect').value,
            speed: parseFloat(document.getElementById('speedRange').value),
            volume: parseInt(document.getElementById('volumeRange').value)
        };
    }

    // 更新语音设置显示
    static updateVoiceSettings() {
        VoiceSettings.updateSpeedValue();
        VoiceSettings.updateVolumeValue();
    }

    // 更新语速显示
    static updateSpeedValue() {
        const speed = document.getElementById('speedRange').value;
        document.getElementById('speedValue').textContent = `${speed}x`;
    }

    // 更新音量显示
    static updateVolumeValue() {
        const volume = document.getElementById('volumeRange').value;
        document.getElementById('volumeValue').textContent = volume;
    }

    // 测试当前选中的语音
    static async testCurrentVoice() {
        try {
            const voiceSettings = VoiceSettings.getVoiceSettings();
            const testButton = document.querySelector('.btn-test');
            const originalText = testButton.textContent;
            
            // 显示加载状态
            testButton.textContent = '🔄 生成中...';
            testButton.disabled = true;
            
            Utils.showStatus('正在生成测试音频...', 'info');
            
            const response = await fetch(`${CONFIG.API_BASE_URL}/test-voice`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    voice: voiceSettings.voice,
                    voice_settings: voiceSettings
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`测试失败: ${response.status} - ${errorText}`);
            }
            
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            // 播放测试音频
            const audioUrl = `${CONFIG.API_BASE_URL}/download/${result.audio_file}`;
            VoiceSettings.playTestAudio(audioUrl);
            
            Utils.showStatus('测试音频生成成功！', 'success');
            
        } catch (error) {
            Utils.showStatus(`测试失败: ${error.message}`, 'error');
        } finally {
            // 恢复按钮状态
            const testButton = document.querySelector('.btn-test');
            testButton.textContent = originalText;
            testButton.disabled = false;
        }
    }

    // 播放测试音频
    static playTestAudio(audioUrl) {
        // 停止当前播放的音频
        const audioElement = document.getElementById('audioElement');
        if (audioElement) {
            audioElement.pause();
            audioElement.currentTime = 0;
        }
        
        // 创建新的音频元素用于测试
        const testAudio = new Audio(audioUrl);
        testAudio.volume = 0.8; // 设置适中的音量
        
        // 播放测试音频
        testAudio.play().catch(error => {
            Utils.showStatus(`播放失败: ${error.message}`, 'error');
        });
        
        // 播放完成后清理
        testAudio.onended = () => {
            testAudio.remove();
        };
    }
}

// 语音设置模块
class VoiceSettings {
    // 获取语音设置
    static getVoiceSettings() {
        const selectedVoice = document.querySelector('input[name="voiceSelect"]:checked');
        return {
            voice: selectedVoice ? selectedVoice.value : 'Ethan',
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

    // 测试指定语音
    static async testVoice(voiceName) {
        try {
            const testButton = event.target;
            const originalText = testButton.textContent;
            
            // 显示加载状态
            testButton.textContent = '🔊 播放中...';
            testButton.disabled = true;
            
            Utils.showStatus(`正在播放 ${voiceName} 的预览音频...`, 'info');
            
            // 使用本地预览音频文件
            const audioUrl = `./audio/previews/${voiceName.toLowerCase()}_preview.wav`;
            
            // 播放预览音频
            VoiceSettings.playTestAudio(audioUrl, testButton, originalText);
            
            Utils.showStatus(`${voiceName} 预览音频播放成功！`, 'success');
            
        } catch (error) {
            Utils.showStatus(`播放失败: ${error.message}`, 'error');
            // 恢复按钮状态
            const testButton = event.target;
            testButton.textContent = '🔊 试听';
            testButton.disabled = false;
        }
    }

    // 测试当前选中的语音（保持向后兼容）
    static async testCurrentVoice() {
        const voiceSettings = VoiceSettings.getVoiceSettings();
        await VoiceSettings.testVoice(voiceSettings.voice);
    }

    // 播放测试音频
    static playTestAudio(audioUrl, testButton, originalText) {
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
            console.error('音频播放失败:', error);
            Utils.showStatus(`播放失败: 无法加载预览音频文件`, 'error');
            // 恢复按钮状态
            if (testButton) {
                testButton.textContent = originalText;
                testButton.disabled = false;
            }
        });
        
        // 播放完成后清理
        testAudio.onended = () => {
            testAudio.remove();
            // 恢复按钮状态
            if (testButton) {
                testButton.textContent = originalText;
                testButton.disabled = false;
            }
        };
        
        // 添加错误处理
        testAudio.onerror = () => {
            Utils.showStatus(`播放失败: 预览音频文件不存在`, 'error');
            // 恢复按钮状态
            if (testButton) {
                testButton.textContent = originalText;
                testButton.disabled = false;
            }
        };
    }
}

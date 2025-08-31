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
}

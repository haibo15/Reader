/**
 * 语音设置模块
 * 负责语音角色选择、语速音量调节和试听功能
 */
class VoiceSettingsModule {
    static MODULE_ID = 'voiceSettingsModule';
    
    /**
     * 初始化模块
     */
    static init() {
        this.render();
        this.bindEvents();
        this.updateVoiceSettings();
    }
    
    /**
     * 渲染模块HTML
     */
    static render() {
        const moduleContainer = document.getElementById(this.MODULE_ID);
        if (!moduleContainer) return;
        
        moduleContainer.innerHTML = `
            <div class="module-header">
                <h3>🎵 语音设置</h3>
                <button class="back-button" onclick="App.showAudioFilesList()">
                    ← 返回音频列表
                </button>
            </div>
            <div class="module-content">
                <div class="settings-grid">
                    <div class="setting-item voice-selection">
                        <label>选择语音角色:</label>
                        <div class="voice-options">
                            <div class="voice-option">
                                <input type="radio" id="voice-ethan" name="voiceSelect" value="Ethan" checked>
                                <label for="voice-ethan">Ethan（男声）</label>
                                <button class="btn btn-small btn-test" onclick="VoiceSettingsModule.testVoice('Ethan')">
                                    🔊 试听
                                </button>
                            </div>
                            <div class="voice-option">
                                <input type="radio" id="voice-chelsie" name="voiceSelect" value="Chelsie">
                                <label for="voice-chelsie">Chelsie（女声）</label>
                                <button class="btn btn-small btn-test" onclick="VoiceSettingsModule.testVoice('Chelsie')">
                                    🔊 试听
                                </button>
                            </div>
                            <div class="voice-option">
                                <input type="radio" id="voice-cherry" name="voiceSelect" value="Cherry">
                                <label for="voice-cherry">Cherry（女声）</label>
                                <button class="btn btn-small btn-test" onclick="VoiceSettingsModule.testVoice('Cherry')">
                                    🔊 试听
                                </button>
                            </div>
                            <div class="voice-option">
                                <input type="radio" id="voice-serena" name="voiceSelect" value="Serena">
                                <label for="voice-serena">Serena（女声）</label>
                                <button class="btn btn-small btn-test" onclick="VoiceSettingsModule.testVoice('Serena')">
                                    🔊 试听
                                </button>
                            </div>
                            <div class="voice-option">
                                <input type="radio" id="voice-dylan" name="voiceSelect" value="Dylan">
                                <label for="voice-dylan">Dylan（北京话-男声）</label>
                                <button class="btn btn-small btn-test" onclick="VoiceSettingsModule.testVoice('Dylan')">
                                    🔊 试听
                                </button>
                            </div>
                            <div class="voice-option">
                                <input type="radio" id="voice-jada" name="voiceSelect" value="Jada">
                                <label for="voice-jada">Jada（吴语-女声）</label>
                                <button class="btn btn-small btn-test" onclick="VoiceSettingsModule.testVoice('Jada')">
                                    🔊 试听
                                </button>
                            </div>
                            <div class="voice-option">
                                <input type="radio" id="voice-sunny" name="voiceSelect" value="Sunny">
                                <label for="voice-sunny">Sunny（四川话-女声）</label>
                                <button class="btn btn-small btn-test" onclick="VoiceSettingsModule.testVoice('Sunny')">
                                    🔊 试听
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="setting-item">
                        <label for="speedRange">语速:</label>
                        <div class="range-container">
                            <input type="range" id="speedRange" min="0.5" max="2.0" step="0.1" value="1.0">
                            <span id="speedValue">1.0x</span>
                        </div>
                    </div>
                    <div class="setting-item">
                        <label for="volumeRange">音量:</label>
                        <div class="range-container">
                            <input type="range" id="volumeRange" min="-20" max="20" step="1" value="0">
                            <span id="volumeValue">0</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * 绑定事件
     */
    static bindEvents() {
        // 语速调节
        const speedRange = document.getElementById('speedRange');
        if (speedRange) {
            speedRange.addEventListener('input', this.updateSpeedValue.bind(this));
        }
        
        // 音量调节
        const volumeRange = document.getElementById('volumeRange');
        if (volumeRange) {
            volumeRange.addEventListener('input', this.updateVolumeValue.bind(this));
        }
    }
    
    /**
     * 更新语速显示
     */
    static updateSpeedValue() {
        const speedRange = document.getElementById('speedRange');
        const speedValue = document.getElementById('speedValue');
        if (speedRange && speedValue) {
            speedValue.textContent = speedRange.value + 'x';
        }
    }
    
    /**
     * 更新音量显示
     */
    static updateVolumeValue() {
        const volumeRange = document.getElementById('volumeRange');
        const volumeValue = document.getElementById('volumeValue');
        if (volumeRange && volumeValue) {
            volumeValue.textContent = volumeRange.value;
        }
    }
    
    /**
     * 获取语音设置
     */
    static getVoiceSettings() {
        const selectedVoice = document.querySelector('input[name="voiceSelect"]:checked');
        const speedRange = document.getElementById('speedRange');
        const volumeRange = document.getElementById('volumeRange');
        
        return {
            voice: selectedVoice ? selectedVoice.value : 'Ethan',
            speed: speedRange ? parseFloat(speedRange.value) : 1.0,
            volume: volumeRange ? parseInt(volumeRange.value) : 0
        };
    }
    
    /**
     * 更新语音设置
     */
    static updateVoiceSettings() {
        // 从本地存储或配置中恢复设置
        const savedSettings = this.getSavedSettings();
        if (savedSettings) {
            // 恢复语音选择
            const voiceRadio = document.querySelector(`input[name="voiceSelect"][value="${savedSettings.voice}"]`);
            if (voiceRadio) {
                voiceRadio.checked = true;
            }
            
            // 恢复语速
            const speedRange = document.getElementById('speedRange');
            if (speedRange) {
                speedRange.value = savedSettings.speed;
                this.updateSpeedValue();
            }
            
            // 恢复音量
            const volumeRange = document.getElementById('volumeRange');
            if (volumeRange) {
                volumeRange.value = savedSettings.volume;
                this.updateVolumeValue();
            }
        }
    }
    
    /**
     * 保存设置到本地存储
     */
    static saveSettings() {
        const settings = this.getVoiceSettings();
        localStorage.setItem('voiceSettings', JSON.stringify(settings));
    }
    
    /**
     * 从本地存储获取设置
     */
    static getSavedSettings() {
        const saved = localStorage.getItem('voiceSettings');
        return saved ? JSON.parse(saved) : null;
    }
    
    /**
     * 测试语音
     */
    static testVoice(voiceName) {
        try {
            // 这里可以调用现有的试听功能
            if (typeof testVoice === 'function') {
                testVoice(voiceName);
            } else {
                Utils.showStatus(`试听 ${voiceName} 语音`, 'info');
            }
        } catch (error) {
            Utils.showStatus(`试听失败: ${error.message}`, 'error');
        }
    }
    
    /**
     * 显示模块
     */
    static show() {
        const module = document.getElementById(this.MODULE_ID);
        if (module) {
            module.style.display = 'block';
        }
    }
    
    /**
     * 隐藏模块
     */
    static hide() {
        const module = document.getElementById(this.MODULE_ID);
        if (module) {
            module.style.display = 'none';
        }
    }
    
    /**
     * 刷新模块
     */
    static refresh() {
        this.render();
        this.bindEvents();
        this.updateVoiceSettings();
    }
}

// 主脚本文件 - 初始化和事件绑定
document.addEventListener('DOMContentLoaded', function() {
    App.initialize();
});

// 应用主类
class App {
    // 初始化应用
    static initialize() {
        console.log('初始化应用...');
        App.initializeEventListeners();
        VoiceSettings.updateVoiceSettings();
        console.log('应用初始化完成');
    }

// 初始化事件监听器
    static initializeEventListeners() {
        console.log('初始化事件监听器...');
        
    // 文件上传相关
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    
        if (fileInput) {
            console.log('绑定文件输入事件监听器');
            fileInput.addEventListener('change', FileUpload.handleFileSelect);
        } else {
            console.error('找不到文件输入元素');
        }
        
        if (uploadArea) {
            console.log('绑定拖拽事件监听器');
    // 拖拽上传
            uploadArea.addEventListener('dragover', FileUpload.handleDragOver);
            uploadArea.addEventListener('dragleave', FileUpload.handleDragLeave);
            uploadArea.addEventListener('drop', FileUpload.handleDrop);
            uploadArea.addEventListener('click', () => {
                if (fileInput) {
                    fileInput.click();
                }
            });
        } else {
            console.error('找不到上传区域元素');
        }
    
    // 语音设置相关
        const speedRange = document.getElementById('speedRange');
        const volumeRange = document.getElementById('volumeRange');
        const voiceSelect = document.getElementById('voiceSelect');
        
        if (speedRange) speedRange.addEventListener('input', VoiceSettings.updateSpeedValue);
        if (volumeRange) volumeRange.addEventListener('input', VoiceSettings.updateVolumeValue);
        if (voiceSelect) voiceSelect.addEventListener('change', VoiceSettings.updateVoiceSettings);
    
    // 音频播放器相关
    const audioElement = document.getElementById('audioElement');
        if (audioElement) {
            audioElement.addEventListener('ended', AudioPlayer.nextTrack);
            audioElement.addEventListener('error', AudioPlayer.handleAudioError);
        }
        
        console.log('事件监听器初始化完成');
    }
}

// 全局函数 - 供HTML中的onclick调用
function generateAllAudio() {
    AudioGenerator.generateAllAudio();
}

function generateSelectedAudio() {
    AudioGenerator.generateSelectedAudio();
}

function previousTrack() {
    AudioPlayer.previousTrack();
}

function nextTrack() {
    AudioPlayer.nextTrack();
}

function downloadCurrent() {
    AudioPlayer.downloadCurrent();
}

function deleteCurrentFile() {
    FileUpload.deleteCurrentFile();
}

function testCurrentVoice() {
    VoiceSettings.testCurrentVoice();
}

function showDocumentHistory() {
    DocumentHistory.showDocumentHistory();
}

function showUploadSection() {
    DocumentHistory.showUploadSection();
}

function refreshDocumentHistory() {
    DocumentHistory.refreshDocumentHistory();
}

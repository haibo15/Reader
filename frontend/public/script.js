// 主脚本文件 - 初始化和事件绑定
document.addEventListener('DOMContentLoaded', function() {
    App.initialize();
});

// 应用主类
class App {
    // 初始化应用
    static initialize() {
        App.initializeEventListeners();
        VoiceSettings.updateVoiceSettings();
    }

// 初始化事件监听器
    static initializeEventListeners() {
        // 文件上传相关
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');
        
        if (fileInput) {
            fileInput.addEventListener('change', FileUpload.handleFileSelect);
        }
        
        if (uploadArea) {
            // 拖拽上传
            uploadArea.addEventListener('dragover', FileUpload.handleDragOver);
            uploadArea.addEventListener('dragleave', FileUpload.handleDragLeave);
            uploadArea.addEventListener('drop', FileUpload.handleDrop);
            uploadArea.addEventListener('click', () => {
                if (fileInput) {
                    fileInput.click();
                }
            });
        }
    
    // 语音设置相关
        const speedRange = document.getElementById('speedRange');
        const volumeRange = document.getElementById('volumeRange');
        
        if (speedRange) speedRange.addEventListener('input', VoiceSettings.updateSpeedValue);
        if (volumeRange) volumeRange.addEventListener('input', VoiceSettings.updateVolumeValue);
    
    // 音频播放器相关
    const audioElement = document.getElementById('audioElement');
        if (audioElement) {
            audioElement.addEventListener('error', (error) => {
                Utils.showStatus('音频播放出错', 'error');
            });
        }
    }
}

// 全局函数 - 供HTML中的onclick调用
function generateAllAudio() {
    AudioGenerator.generateAllAudio();
}

function generateSelectedAudio() {
    AudioGenerator.generateSelectedAudio();
}

function checkAudioStatus() {
    AudioStatusManager.checkAudioStatus();
}

function downloadCompleteAudio() {
    AudioDownloader.downloadCompleteAudio();
}

function deleteCurrentFile() {
    FileUpload.deleteCurrentFile();
}

function testCurrentVoice() {
    VoiceSettings.testCurrentVoice();
}

function testVoice(voiceName) {
    VoiceSettings.testVoice(voiceName);
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

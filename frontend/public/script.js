// 主脚本文件 - 初始化和事件绑定
document.addEventListener('DOMContentLoaded', function() {
    App.initialize();
});

// 应用主类
class App {
    // 初始化应用
    static initialize() {
        App.initializeEventListeners();
        App.initializeNavigation();
        VoiceSettings.updateVoiceSettings();
    }

    // 初始化事件监听器
    static initializeEventListeners() {
        // 文件上传相关
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');
        
        if (fileInput && !fileInput.hasAttribute('data-event-bound')) {
            fileInput.addEventListener('change', FileUpload.handleFileSelect);
            fileInput.setAttribute('data-event-bound', 'true');
        }
        
        if (uploadArea && !uploadArea.hasAttribute('data-event-bound')) {
            // 拖拽上传
            uploadArea.addEventListener('dragover', FileUpload.handleDragOver);
            uploadArea.addEventListener('dragleave', FileUpload.handleDragLeave);
            uploadArea.addEventListener('drop', FileUpload.handleDrop);
            uploadArea.addEventListener('click', () => {
                // 使用安全的文件选择触发方法
                FileUpload.triggerFileSelect();
            });
            uploadArea.setAttribute('data-event-bound', 'true');
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

    // 初始化导航功能
    static initializeNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const targetSection = item.getAttribute('data-section');
                App.switchSection(targetSection);
            });
        });

        // 处理URL哈希变化
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.slice(1) || 'upload';
            App.switchSection(hash);
        });

        // 初始化默认显示
        const hash = window.location.hash.slice(1) || 'upload';
        App.switchSection(hash);
    }

    // 切换板块
    static switchSection(sectionName) {
        // 隐藏所有板块
        const allSections = document.querySelectorAll('.content-section');
        allSections.forEach(section => {
            section.classList.remove('active');
        });

        // 移除所有导航项的激活状态
        const allNavItems = document.querySelectorAll('.nav-item');
        allNavItems.forEach(item => {
            item.classList.remove('active');
        });

        // 显示目标板块
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // 激活对应的导航项
        const targetNavItem = document.querySelector(`[data-section="${sectionName}"]`);
        if (targetNavItem) {
            targetNavItem.classList.add('active');
        }

        // 更新URL哈希
        window.location.hash = sectionName;

        // 根据板块执行相应的初始化
        switch(sectionName) {
            case 'upload':
                // 文档上传板块不需要特殊处理
                break;
            case 'history':
                // 显示文档历史
                DocumentHistory.showDocumentHistory();
                break;
            case 'audio':
                // 音频管理板块，显示音频文件列表
                if (window.AudioFilesManager) {
                    AudioFilesManager.refresh();
                }
                // 如果有当前文件则显示相关信息
                if (currentFileId) {
                    App.showAudioManagement();
                }
                break;
        }
    }

    // 显示音频管理界面
    static showAudioManagement() {
        // 隐藏音频文件列表
        const audioFilesSection = document.getElementById('audioFilesSection');
        if (audioFilesSection) {
            audioFilesSection.style.display = 'none';
        }

        // 显示所有模块（使用新的模块管理器）
        ModuleManager.showAudioManagementMode();
    }

    // 显示文档查看模式（只显示文件信息和章节列表）
    static showDocumentViewOnly() {
        // 隐藏音频文件列表
        const audioFilesSection = document.getElementById('audioFilesSection');
        if (audioFilesSection) {
            audioFilesSection.style.display = 'none';
        }

        // 使用模块管理器显示查看模式
        ModuleManager.showDocumentViewMode();
    }

    // 显示音频生成模式（只显示语音设置和音频生成）
    static showAudioGenerationOnly() {
        // 隐藏音频文件列表
        const audioFilesSection = document.getElementById('audioFilesSection');
        if (audioFilesSection) {
            audioFilesSection.style.display = 'none';
        }

        // 使用模块管理器显示生成模式
        ModuleManager.showAudioGenerationMode();
    }

    // 显示音频文件列表
    static showAudioFilesList() {
        // 显示音频文件列表
        const audioFilesSection = document.getElementById('audioFilesSection');
        if (audioFilesSection) {
            audioFilesSection.style.display = 'block';
        }

        // 隐藏所有模块（使用新的模块管理器）
        ModuleManager.hideAllModules();
    }

    // 显示指定模块
    static showModule(moduleId) {
        ModuleManager.showModule(moduleId);
    }

    // 隐藏指定模块
    static hideModule(moduleId) {
        ModuleManager.hideModule(moduleId);
    }

    // 隐藏所有模块
    static hideAllModules() {
        ModuleManager.hideAllModules();
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
    App.switchSection('upload');
}

function refreshDocumentHistory() {
    DocumentHistory.refreshDocumentHistory();
}

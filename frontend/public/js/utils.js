// 工具函数
class Utils {
    // 格式化文件大小
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 显示状态消息
    static showStatus(message, type = 'info') {
        const statusElement = document.getElementById('statusMessage');
        statusElement.textContent = message;
        statusElement.className = `status-message ${type}`;
        
        // 自动隐藏
        setTimeout(() => {
            statusElement.textContent = '';
            statusElement.className = 'status-message';
        }, CONFIG.STATUS_MESSAGE_TIMEOUT);
    }

    // 显示详细状态消息（支持多行文本）
    static showDetailedStatus(message, type = 'info', timeout = 5000) {
        const statusElement = document.getElementById('statusMessage');
        
        // 处理多行文本
        const formattedMessage = message.replace(/\n/g, '<br>');
        statusElement.innerHTML = formattedMessage;
        statusElement.className = `status-message ${type} detailed`;
        
        // 自动隐藏
        setTimeout(() => {
            statusElement.innerHTML = '';
            statusElement.className = 'status-message';
        }, timeout);
    }

    // 显示上传进度
    static showUploadProgress() {
        const progress = document.getElementById('uploadProgress');
        progress.style.display = 'block';
        
        // 模拟进度
        const fill = progress.querySelector('.progress-fill');
        let width = 0;
        const interval = setInterval(() => {
            if (width >= 90) {
                clearInterval(interval);
            } else {
                width += 10;
                fill.style.width = width + '%';
            }
        }, 100);
    }

    // 隐藏上传进度
    static hideUploadProgress() {
        const progress = document.getElementById('uploadProgress');
        progress.style.display = 'none';
        progress.querySelector('.progress-fill').style.width = '0%';
    }

    // 显示进度条
    static showProgressBar() {
        const progress = document.getElementById('audioProgress');
        progress.style.display = 'block';
        
        // 模拟进度
        const fill = progress.querySelector('.progress-fill');
        let width = 0;
        const interval = setInterval(() => {
            if (width >= 90) {
                clearInterval(interval);
            } else {
                width += 5;
                fill.style.width = width + '%';
            }
        }, 200);
    }

    // 隐藏进度条
    static hideProgressBar() {
        const progress = document.getElementById('audioProgress');
        progress.style.display = 'none';
        progress.querySelector('.progress-fill').style.width = '0%';
    }

    // 重置文件输入框
    static resetFileInput() {
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.value = '';
        }
    }
}

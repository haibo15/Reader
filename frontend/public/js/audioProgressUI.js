// 音频进度UI模块
class AudioProgressUI {
    // 显示进度条
    static showProgress() {
        const progressContainer = document.getElementById('audioProgress');
        const progressFill = progressContainer.querySelector('.progress-fill');
        const progressText = progressContainer.querySelector('.progress-text');
        
        progressContainer.style.display = 'block';
        progressFill.style.width = '0%';
        progressText.textContent = '正在生成音频...';
    }

    // 隐藏进度条
    static hideProgress() {
        setTimeout(() => {
            const progressContainer = document.getElementById('audioProgress');
            progressContainer.style.display = 'none';
        }, 2000);
    }

    // 更新进度
    static updateProgress(progress, message) {
        const progressContainer = document.getElementById('audioProgress');
        const progressFill = progressContainer.querySelector('.progress-fill');
        const progressText = progressContainer.querySelector('.progress-text');
        
        const newWidth = `${progress}%`;
        console.log('🔍 更新进度条宽度:', newWidth);
        progressFill.style.width = newWidth;
        progressText.textContent = message;
    }
}

// 音频下载器模块
class AudioDownloader {
    // 下载单个章节音频
    static async downloadChapterAudio(fileId, filename) {
        try {
            const downloadUrl = `${CONFIG.API_BASE_URL}/download/${fileId}/${filename}`;
            
            // 创建临时链接并触发下载
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            Utils.showStatus('章节音频下载已开始', 'success');

        } catch (error) {
            console.error('下载章节音频失败:', error);
            Utils.showStatus(`下载失败: ${error.message}`, 'error');
        }
    }

    // 下载完整音频
    static async downloadCompleteAudio() {
        try {
            if (!currentFileId) {
                Utils.showStatus('请先上传文件', 'error');
                return;
            }

            Utils.showStatus('正在准备下载完整音频...', 'info');

            // 创建下载链接
            const downloadUrl = `${CONFIG.API_BASE_URL}/download-complete/${currentFileId}`;
            
            // 创建临时链接并触发下载
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `complete_audio_${currentFileId}.wav`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            Utils.showStatus('完整音频下载已开始', 'success');

        } catch (error) {
            console.error('下载完整音频失败:', error);
            Utils.showStatus(`下载失败: ${error.message}`, 'error');
        }
    }

    // 添加整体下载按钮
    static addCompleteDownloadButton() {
        const audioControls = document.getElementById('audioControls');
        if (audioControls) {
            // 检查是否已存在下载按钮
            let downloadBtn = audioControls.querySelector('.complete-download-btn');
            
            if (!downloadBtn) {
                downloadBtn = document.createElement('button');
                downloadBtn.className = 'btn btn-primary complete-download-btn';
                downloadBtn.innerHTML = '<i class="fas fa-download"></i> 下载完整音频';
                downloadBtn.onclick = () => AudioDownloader.downloadCompleteAudio();
                
                // 插入到音频控制区域
                const actionsDiv = audioControls.querySelector('.audio-actions');
                if (actionsDiv) {
                    actionsDiv.appendChild(downloadBtn);
                } else {
                    audioControls.appendChild(downloadBtn);
                }
            }
        }
    }
}

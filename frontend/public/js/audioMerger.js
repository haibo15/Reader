// 音频合并器模块
class AudioMerger {
    // 合并音频文件
    static async mergeAudioFiles() {
        try {
            if (!currentFileId) {
                Utils.showStatus('请先上传文件', 'error');
                return;
            }

            Utils.showStatus('正在合并音频文件...', 'info');

            const response = await fetch(`${CONFIG.API_BASE_URL}/merge-audio/${currentFileId}`, {
                method: 'GET'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '音频合并失败');
            }

            const result = await response.json();
            
            if (result.success) {
                Utils.showStatus(`音频合并成功！共合并 ${result.total_chapters} 个章节`, 'success');
                
                // 添加整体下载按钮
                AudioDownloader.addCompleteDownloadButton();
            }

        } catch (error) {
            console.error('音频合并失败:', error);
            Utils.showStatus(`音频合并失败: ${error.message}`, 'error');
        }
    }
}

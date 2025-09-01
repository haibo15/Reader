// 音频合并器模块
class AudioMerger {
    // 合并音频文件（支持选中章节）
    static async mergeAudioFiles(selectedChapters = null) {
        try {
            if (!currentFileId) {
                Utils.showStatus('请先上传文件', 'error');
                return;
            }

            // 优先：从章节音频列表复选框读取
            if (selectedChapters === null && typeof AudioPlayer !== 'undefined') {
                const fromAudioList = AudioPlayer.getSelectedAudioChapters();
                if (fromAudioList && fromAudioList.length > 0) {
                    selectedChapters = fromAudioList;
                }
            }
            // 其次：从章节表格复选框读取
            if (selectedChapters === null) {
                selectedChapters = FileDisplay.getSelectedChapters();
            }

            let statusMessage = '正在合并音频文件...';
            if (selectedChapters && selectedChapters.length > 0) {
                statusMessage = `正在合并选中的 ${selectedChapters.length} 个章节音频...`;
            }
            Utils.showStatus(statusMessage, 'info');

            // 根据是否有选中章节决定请求方式
            let response;
            if (selectedChapters && selectedChapters.length > 0) {
                // POST请求，传递选中章节
                response = await fetch(`${CONFIG.API_BASE_URL}/merge-audio/${currentFileId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        selected_chapters: selectedChapters
                    })
                });
            } else {
                // GET请求，合并所有章节
                response = await fetch(`${CONFIG.API_BASE_URL}/merge-audio/${currentFileId}`, {
                    method: 'GET'
                });
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '音频合并失败');
            }

            const result = await response.json();
            
            if (result.success) {
                Utils.showStatus(`音频合并成功！共合并 ${result.total_chapters} 个章节`, 'success');
                
                // 添加整体下载按钮
                AudioDownloader.addCompleteDownloadButton();
                
                // 显示完整音频播放器，供用户播放手动合并结果
                if (typeof AudioPlayer !== 'undefined') {
                    AudioPlayer.showCompleteAudioPlayer();
                }
            }

        } catch (error) {
            console.error('音频合并失败:', error);
            Utils.showStatus(`音频合并失败: ${error.message}`, 'error');
        }
    }

    // 自动合并音频并显示播放器（支持选中章节）
    static async autoMergeAndShowPlayer(selectedChapters = null) {
        try {
            if (!currentFileId) {
                return;
            }

            // 如果没有传入选中章节，则获取当前选中的章节
            if (selectedChapters === null) {
                selectedChapters = FileDisplay.getSelectedChapters();
            }

            let statusMessage = '正在自动合并音频文件...';
            if (selectedChapters && selectedChapters.length > 0) {
                statusMessage = `正在自动合并选中的 ${selectedChapters.length} 个章节音频...`;
            }
            Utils.showStatus(statusMessage, 'info');

            // 根据是否有选中章节决定请求方式
            let response;
            if (selectedChapters && selectedChapters.length > 0) {
                // POST请求，传递选中章节
                response = await fetch(`${CONFIG.API_BASE_URL}/merge-audio/${currentFileId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        selected_chapters: selectedChapters
                    })
                });
            } else {
                // GET请求，合并所有章节
                response = await fetch(`${CONFIG.API_BASE_URL}/merge-audio/${currentFileId}`, {
                    method: 'GET'
                });
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '音频合并失败');
            }

            const result = await response.json();
            
            if (result.success) {
                Utils.showStatus(`音频合并成功！共合并 ${result.total_chapters} 个章节`, 'success');
                
                // 显示完整音频播放器
                AudioPlayer.showCompleteAudioPlayer();
            }

        } catch (error) {
            console.error('自动合并音频失败:', error);
            Utils.showStatus(`自动合并失败: ${error.message}`, 'error');
        }
    }
}

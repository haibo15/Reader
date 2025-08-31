// 文档历史记录模块
class DocumentHistory {
    // 显示文档历史记录
    static async showDocumentHistory() {
        try {
            Utils.showStatus('正在加载文档历史...', 'info');
            
            const response = await fetch(`${CONFIG.API_BASE_URL}/document-history`);
            
            if (!response.ok) {
                throw new Error(`获取文档历史失败: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            DocumentHistory.displayHistory(result.documents);
            DocumentHistory.showHistorySection();
            
            Utils.showStatus('文档历史加载成功', 'success');
            
        } catch (error) {
            Utils.showStatus(`加载文档历史失败: ${error.message}`, 'error');
        }
    }

    // 显示历史记录区域
    static showHistorySection() {
        document.getElementById('uploadSection').style.display = 'none';
        document.getElementById('documentHistory').style.display = 'block';
    }

    // 显示上传区域
    static showUploadSection() {
        document.getElementById('documentHistory').style.display = 'none';
        document.getElementById('uploadSection').style.display = 'block';
    }

    // 显示历史记录列表
    static displayHistory(documents) {
        const historyList = document.getElementById('historyList');
        
        if (documents.length === 0) {
            historyList.innerHTML = `
                <div class="empty-history">
                    <p>暂无上传的文档</p>
                    <button class="btn btn-primary" onclick="showUploadSection()">
                        上传第一个文档
                    </button>
                </div>
            `;
            return;
        }
        
        const historyHTML = documents.map(doc => {
            const uploadTime = new Date(doc.upload_time * 1000);
            const timeString = uploadTime.toLocaleString('zh-CN');
            const fileSize = Utils.formatFileSize(doc.file_size);
            
            return `
                <div class="history-item" onclick="DocumentHistory.loadDocument('${doc.file_id}')">
                    <div class="history-item-header">
                        <div>
                            <div class="history-item-title">${doc.original_name}</div>
                            <div class="history-item-time">${timeString}</div>
                        </div>
                        <div class="history-item-status">
                            ${doc.has_audio ? '🎵' : '📄'}
                        </div>
                    </div>
                    <div class="history-item-info">
                        <div class="history-info-row">
                            <span class="history-info-label">文件大小:</span>
                            <span class="history-info-value">${fileSize}</span>
                        </div>
                        <div class="history-info-row">
                            <span class="history-info-label">章节数:</span>
                            <span class="history-info-value">${doc.chapter_count}</span>
                        </div>
                        <div class="history-info-row">
                            <span class="history-info-label">音频文件:</span>
                            <span class="history-info-value">${doc.audio_count} 个</span>
                        </div>
                    </div>
                    <div class="history-item-actions">
                        <button class="btn btn-primary btn-small" onclick="event.stopPropagation(); DocumentHistory.loadDocument('${doc.file_id}')">
                            📖 打开
                        </button>
                        <button class="btn btn-danger btn-small" onclick="event.stopPropagation(); DocumentHistory.deleteDocument('${doc.file_id}', '${doc.original_name}')">
                            🗑️ 删除
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        historyList.innerHTML = historyHTML;
    }

    // 加载指定文档
    static async loadDocument(fileId) {
        try {
            Utils.showStatus('正在加载文档...', 'info');
            
            const response = await fetch(`${CONFIG.API_BASE_URL}/load-document/${fileId}`);
            
            if (!response.ok) {
                throw new Error(`加载文档失败: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            // 设置当前文档信息
            currentFileId = result.file_id;
            currentChapters = result.chapters;
            
            // 显示文档信息
            FileDisplay.displayFileInfo({
                file_id: result.file_id,
                filename: result.display_name,
                chapters: result.chapters,
                total_chapters: result.total_chapters
            });
            
            FileDisplay.displayChapters(result.chapters);
            
            // 如果有音频文件，添加到播放列表
            if (result.audio_files && result.audio_files.length > 0) {
                audioFiles = result.audio_files;
                AudioPlayer.updatePlaylist();
                document.getElementById('audioPlayer').style.display = 'block';
            }
            
            // 显示后续选项
            document.getElementById('voiceSettings').style.display = 'block';
            document.getElementById('audioControls').style.display = 'block';
            
            // 切换到上传区域（显示文档信息）
            DocumentHistory.showUploadSection();
            
            Utils.showStatus('文档加载成功！', 'success');
            
        } catch (error) {
            Utils.showStatus(`加载文档失败: ${error.message}`, 'error');
        }
    }

    // 删除文档
    static async deleteDocument(fileId, fileName) {
        // 第一次确认
        const firstConfirm = confirm(`确定要删除文档"${fileName}"吗？\n\n⚠️ 此操作将删除：\n• 上传的文档文件\n• 所有相关的音频文件\n• 章节数据\n\n此操作不可撤销！`);
        
        if (!firstConfirm) {
            return;
        }
        
        // 第二次确认
        const secondConfirm = confirm(`⚠️ 最终确认\n\n您即将删除文档"${fileName}"\n\n请再次确认是否继续？\n\n点击"确定"将永久删除所有相关文件。`);
        
        if (!secondConfirm) {
            Utils.showStatus('已取消删除操作', 'info');
            return;
        }
        
        try {
            Utils.showStatus('正在删除文档...', 'info');
            
            const response = await fetch(`${CONFIG.API_BASE_URL}/delete-file`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    file_id: fileId
                })
            });
            
            if (!response.ok) {
                throw new Error(`删除失败: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            // 如果删除的是当前文档，清除当前状态
            if (currentFileId === fileId) {
                currentFileId = null;
                currentChapters = [];
                audioFiles = [];
                currentPlaylistIndex = 0;
                
                // 隐藏相关区域
                document.getElementById('fileInfo').style.display = 'none';
                document.getElementById('chaptersSection').style.display = 'none';
                document.getElementById('voiceSettings').style.display = 'none';
                document.getElementById('audioControls').style.display = 'none';
                document.getElementById('audioPlayer').style.display = 'none';
                
                // 清空播放列表
                document.getElementById('playlist').innerHTML = '';
            }
            
            // 刷新文档历史
            DocumentHistory.showDocumentHistory();
            
            // 显示详细的成功信息
            const deletedFiles = result.deleted_files || [];
            const fileCount = deletedFiles.length;
            
            let successMessage = `✅ 文档"${fileName}"删除成功！`;
            if (fileCount > 0) {
                successMessage += `\n\n已删除 ${fileCount} 个文件：`;
                deletedFiles.forEach(file => {
                    successMessage += `\n• ${file}`;
                });
            }
            
            // 使用更友好的提示方式
            Utils.showDetailedStatus(successMessage, 'success', 5000);
            
        } catch (error) {
            console.error('删除文档失败:', error);
            Utils.showStatus(`删除文档失败: ${error.message}`, 'error');
        }
    }

    // 刷新文档历史
    static refreshDocumentHistory() {
        DocumentHistory.showDocumentHistory();
    }
}

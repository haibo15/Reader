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
        // 这个方法在新设计中不再需要，因为使用板块切换
        // 保留空方法以避免调用错误
    }

    // 显示上传区域
    static showUploadSection() {
        // 这个方法在新设计中不再需要，因为使用板块切换
        // 保留空方法以避免调用错误
    }

    // 显示历史记录列表
    static displayHistory(documents) {
        const historyList = document.getElementById('historyList');
        
        if (documents.length === 0) {
            historyList.innerHTML = `
                <div class="empty-history">
                    <div style="font-size: 3rem; margin-bottom: 15px;">📚</div>
                    <p>暂无上传的文档</p>
                    <p>开始上传您的第一个文档，体验智能阅读功能</p>
                    <button class="btn btn-primary" onclick="App.switchSection('upload')">
                        📄 上传第一个文档
                    </button>
                </div>
            `;
            return;
        }
        
        const tableHTML = `
            <table class="history-table">
                <thead>
                    <tr>
                        <th>文档名称</th>
                        <th>上传时间</th>
                        <th>文件大小</th>
                        <th>章节数</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${documents.map((doc, index) => {
                        const uploadTime = new Date(doc.upload_time * 1000);
                        const timeString = uploadTime.toLocaleString('zh-CN');
                        const fileSize = Utils.formatFileSize(doc.file_size);
                        
                        return `
                            <tr>
                                <td>${doc.original_name}</td>
                                <td>${timeString}</td>
                                <td>${fileSize}</td>
                                <td>${doc.chapter_count}</td>
                                <td>
                                    <button class="btn btn-primary btn-tiny" onclick="DocumentHistory.viewDocument('${doc.file_id}')">
                                        查看
                                    </button>
                                    <button class="btn btn-success btn-tiny" onclick="DocumentHistory.generateAudio('${doc.file_id}')">
                                        生成
                                    </button>
                                    <button class="btn btn-danger btn-tiny" onclick="DocumentHistory.deleteDocument('${doc.file_id}', '${doc.original_name}')">
                                        删除
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
        
        historyList.innerHTML = tableHTML;
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
                // 注意：AudioPlayer.updatePlaylist() 可能不存在，需要检查
                if (typeof AudioPlayer !== 'undefined' && AudioPlayer.updatePlaylist) {
                    AudioPlayer.updatePlaylist();
                }
            }
            
            // 显示后续选项 - 这些会在切换到音频管理板块时自动显示
            // 不需要手动设置display属性
            
            // 自动切换到音频管理板块
            setTimeout(() => {
                App.switchSection('audio');
                Utils.showStatus('文档加载成功！已切换到音频管理板块', 'success');
            }, 500);
            
        } catch (error) {
            Utils.showStatus(`加载文档失败: ${error.message}`, 'error');
        }
    }

    // 查看文档（只显示文件信息和章节列表）
    static async viewDocument(fileId) {
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
            
            // 切换到音频管理板块，但只显示文件信息和章节列表
            setTimeout(() => {
                App.switchSection('audio');
                App.showDocumentViewOnly();
                Utils.showStatus('文档加载成功！已切换到查看模式', 'success');
            }, 500);
            
        } catch (error) {
            Utils.showStatus(`加载文档失败: ${error.message}`, 'error');
        }
    }

    // 生成音频（只显示语音设置和音频生成）
    static async generateAudio(fileId) {
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
            
            // 切换到音频管理板块，但只显示语音设置和音频生成
            setTimeout(() => {
                App.switchSection('audio');
                App.showAudioGenerationOnly();
                Utils.showStatus('文档加载成功！已切换到生成模式', 'success');
            }, 500);
            
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
                
                // 注意：在新设计中，这些元素会在板块切换时自动管理
                // 不需要手动设置display属性
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

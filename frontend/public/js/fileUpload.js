// 文件上传模块
class FileUpload {
    // 添加一个标志变量来防止重复触发
    static isProcessing = false;
    // 添加防抖时间戳
    static lastTriggerTime = 0;
    // 防抖间隔（毫秒）
    static DEBOUNCE_DELAY = 300;
    // 全局防重复标志
    static globalTriggerLock = false;

    // 文件选择处理
    static handleFileSelect(event) {
        // 如果正在处理中，忽略新的选择
        if (FileUpload.isProcessing) {
            return;
        }

        const file = event.target.files[0];
        if (file) {
            // 设置处理标志
            FileUpload.isProcessing = true;
            // 设置全局锁
            FileUpload.globalTriggerLock = true;
            
            // 立即创建文件对象的副本，避免引用问题
            const fileBlob = new Blob([file], { type: file.type });
            const fileCopy = new File([fileBlob], file.name, { type: file.type });
            // 立即上传
            FileUpload.uploadFile(fileCopy);
        } else {
            // 用户取消了文件选择，重置处理标志
            FileUpload.isProcessing = false;
            // 延迟重置全局锁，防止快速重复触发
            setTimeout(() => {
                FileUpload.globalTriggerLock = false;
            }, 100);
            return;
        }
    }

    // 安全地触发文件选择
    static triggerFileSelect() {
        const now = Date.now();
        
        // 全局锁检查
        if (FileUpload.globalTriggerLock) {
            return;
        }
        
        // 防抖检查
        if (now - FileUpload.lastTriggerTime < FileUpload.DEBOUNCE_DELAY) {
            return;
        }
        
        // 如果正在处理中，不允许新的选择
        if (FileUpload.isProcessing) {
            return;
        }
        
        // 检查文件输入框是否已经存在文件
        const fileInput = document.getElementById('fileInput');
        if (fileInput && fileInput.files.length > 0) {
            return;
        }
        
        FileUpload.lastTriggerTime = now;
        
        if (fileInput) {
            fileInput.click();
        }
    }

    // 拖拽处理
    static handleDragOver(event) {
        event.preventDefault();
        event.currentTarget.classList.add('dragover');
    }

    static handleDragLeave(event) {
        event.preventDefault();
        event.currentTarget.classList.remove('dragover');
    }

    static handleDrop(event) {
        event.preventDefault();
        event.currentTarget.classList.remove('dragover');
        
        // 如果正在处理中，忽略新的拖拽
        if (FileUpload.isProcessing) {
            return;
        }
        
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            // 设置处理标志
            FileUpload.isProcessing = true;
            
            const file = files[0];
            // 创建文件对象的副本，保持一致性
            const fileBlob = new Blob([file], { type: file.type });
            const fileCopy = new File([fileBlob], file.name, { type: file.type });
            // 立即上传
            FileUpload.uploadFile(fileCopy);
        }
    }

    // 文件上传
    static async uploadFile(file) {
        try {
            // 验证文件
            if (!file) {
                Utils.showStatus('请选择文件', 'warning');
                return;
            }
            
            // 验证文件大小
            if (file.size > CONFIG.MAX_FILE_SIZE) {
                Utils.showStatus('文件大小不能超过50MB', 'error');
                return;
            }
            
            // 验证文件类型
            const fileName = file.name.toLowerCase();
            const isValidType = CONFIG.ALLOWED_FILE_TYPES.some(type => fileName.endsWith(type));
            if (!isValidType) {
                Utils.showStatus('不支持的文件格式，请选择PDF、TXT、EPUB或DOCX文件', 'error');
                return;
            }
            
            Utils.showStatus('正在上传文件...', 'info');
            Utils.showUploadProgress();
            
            const formData = new FormData();
            formData.append('file', file);
            
            // 添加超时设置
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.UPLOAD_TIMEOUT);
            
            const response = await fetch(`${CONFIG.API_BASE_URL}/upload`, {
                method: 'POST',
                body: formData,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`上传失败: ${response.status} - ${errorText}`);
            }
            
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            // 保存文件信息
            currentFileId = result.file_id;
            currentChapters = result.chapters;
            
            // 显示文件信息
            FileDisplay.displayFileInfo(result);
            FileDisplay.displayChapters(result.chapters);
            
            // 显示文本转换状态
            if (result.text_extraction_success) {
                Utils.showStatus(result.message, 'success');
            } else {
                Utils.showStatus('文件上传成功，但文本转换可能有问题', 'warning');
            }
            
            // 显示后续选项 - 这些会在切换到音频管理板块时自动显示
            // 不需要手动设置display属性
            
            Utils.hideUploadProgress();
            
            // 上传成功后自动切换到音频管理板块
            setTimeout(() => {
                App.switchSection('audio');
                Utils.showStatus('文件上传成功！已切换到音频管理板块', 'success');
            }, 1000);
            
            // 上传成功后再重置文件输入框，但不触发change事件
            setTimeout(() => {
                const fileInput = document.getElementById('fileInput');
                if (fileInput) {
                    fileInput.value = '';
                }
                
                // 重置处理标志
                FileUpload.isProcessing = false;
                // 延迟重置全局锁
                setTimeout(() => {
                    FileUpload.globalTriggerLock = false;
                }, 100);
            }, 500);
            
        } catch (error) {
            Utils.hideUploadProgress();
            
            // 上传失败时也延迟重置文件输入框，但不触发change事件
            setTimeout(() => {
                const fileInput = document.getElementById('fileInput');
                if (fileInput) {
                    fileInput.value = '';
                }
                
                // 重置处理标志
                FileUpload.isProcessing = false;
                // 延迟重置全局锁
                setTimeout(() => {
                    FileUpload.globalTriggerLock = false;
                }, 100);
            }, 500);
            
            if (error.name === 'AbortError') {
                Utils.showStatus('上传超时，请重试', 'error');
            } else if (error.message.includes('Failed to fetch')) {
                Utils.showStatus('网络连接失败，请检查后端服务是否运行', 'error');
            } else {
                Utils.showStatus(`上传失败: ${error.message}`, 'error');
            }
        }
    }

    // 删除当前文件
    static async deleteCurrentFile() {
        if (!currentFileId) {
            Utils.showStatus('没有可删除的文件', 'warning');
            return;
        }
        
        // 获取当前文件名
        const fileNameElement = document.getElementById('fileName');
        const fileName = fileNameElement ? fileNameElement.textContent : '当前文件';
        
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
            Utils.showStatus('正在删除文件...', 'info');
            
            const response = await fetch(`${CONFIG.API_BASE_URL}/delete-file`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    file_id: currentFileId
                })
            });
            
            if (!response.ok) {
                throw new Error(`删除失败: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            // 清除当前文件信息
            currentFileId = null;
            currentChapters = [];
            audioFiles = [];
            currentPlaylistIndex = 0;
            
            // 注意：在新设计中，这些元素会在板块切换时自动管理
            // 不需要手动设置display属性
            
            // 清空播放列表 - 检查元素是否存在
            const playlistElement = document.getElementById('playlist');
            if (playlistElement) {
                playlistElement.innerHTML = '';
            }
            
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
            console.error('删除文件失败:', error);
            Utils.showStatus(`删除文件失败: ${error.message}`, 'error');
        }
    }
}

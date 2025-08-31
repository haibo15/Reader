// 文件上传模块
class FileUpload {
    // 文件选择处理
    static handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            console.log('选择的文件:', file.name, '大小:', file.size, '类型:', file.type);
            FileUpload.uploadFile(file);
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
        
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            FileUpload.uploadFile(files[0]);
        }
    }

    // 文件上传
    static async uploadFile(file) {
        try {
            console.log('开始上传文件:', file.name, '大小:', file.size, '类型:', file.type);
            
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
            
            console.log('FormData创建完成，文件大小:', file.size);
            console.log('FormData中的文件:', formData.get('file'));
            console.log('FormData中的文件大小:', formData.get('file').size);
            
            // 添加超时设置
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.UPLOAD_TIMEOUT);
            
            console.log('开始发送请求到:', `${CONFIG.API_BASE_URL}/upload`);
            
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
            
            // 显示后续选项
            document.getElementById('voiceSettings').style.display = 'block';
            document.getElementById('audioControls').style.display = 'block';
            
            // 上传成功后重置文件输入框
            Utils.resetFileInput();
            
            Utils.hideUploadProgress();
            Utils.showStatus('文件上传成功！', 'success');
            
        } catch (error) {
            Utils.hideUploadProgress();
            
            // 上传失败时也重置文件输入框
            Utils.resetFileInput();
            
            if (error.name === 'AbortError') {
                Utils.showStatus('上传超时，请重试', 'error');
            } else if (error.message.includes('Failed to fetch')) {
                Utils.showStatus('网络连接失败，请检查后端服务是否运行', 'error');
            } else {
                Utils.showStatus(`上传失败: ${error.message}`, 'error');
            }
            
            console.error('Upload error:', error);
        }
    }

    // 删除当前文件
    static async deleteCurrentFile() {
        if (!currentFileId) {
            Utils.showStatus('没有可删除的文件', 'warning');
            return;
        }
        
        // 确认删除
        if (!confirm('确定要删除这个文件吗？这将同时删除上传的文件和所有相关的音频文件。')) {
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
            
            // 隐藏相关区域
            document.getElementById('fileInfo').style.display = 'none';
            document.getElementById('chaptersSection').style.display = 'none';
            document.getElementById('voiceSettings').style.display = 'none';
            document.getElementById('audioControls').style.display = 'none';
            document.getElementById('audioPlayer').style.display = 'none';
            
            // 清空播放列表
            document.getElementById('playlist').innerHTML = '';
            
            Utils.showStatus('文件删除成功', 'success');
            
        } catch (error) {
            Utils.showStatus(`删除失败: ${error.message}`, 'error');
            console.error('Delete error:', error);
        }
    }
}

/**
 * 文件信息模块
 * 负责显示文档的基本信息
 */
class FileInfoModule {
    static MODULE_ID = 'fileInfoModule';
    
    /**
     * 初始化模块
     */
    static init() {
        this.render();
        this.bindEvents();
    }
    
    /**
     * 渲染模块HTML
     */
    static render() {
        const moduleContainer = document.getElementById(this.MODULE_ID);
        if (!moduleContainer) return;
        
        moduleContainer.innerHTML = `
            <div class="module-header">
                <h3>📋 文件信息</h3>
                <button class="back-button" onclick="App.showAudioFilesList()">
                    ← 返回音频列表
                </button>
            </div>
            <div class="module-content">
                <div class="info-card">
                    <div class="info-item">
                        <span class="label">文件名:</span>
                        <span id="fileName"></span>
                    </div>
                    <div class="info-item">
                        <span class="label">章节数:</span>
                        <span id="chapterCount"></span>
                    </div>
                    <div class="info-item">
                        <span class="label">文件ID:</span>
                        <span id="fileId"></span>
                    </div>
                    <div class="info-actions">
                        <button class="btn btn-danger" onclick="FileInfoModule.deleteCurrentFile()">
                            🗑️ 删除文件
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * 绑定事件
     */
    static bindEvents() {
        // 模块特定的事件绑定
    }
    
    /**
     * 显示文件信息
     */
    static displayFileInfo(result) {
        const fileNameElement = document.getElementById('fileName');
        const chapterCountElement = document.getElementById('chapterCount');
        const fileIdElement = document.getElementById('fileId');
        
        if (fileNameElement) fileNameElement.textContent = result.filename;
        if (chapterCountElement) chapterCountElement.textContent = result.total_chapters;
        if (fileIdElement) fileIdElement.textContent = result.file_id;
    }
    
    /**
     * 删除当前文件
     */
    static deleteCurrentFile() {
        if (typeof deleteCurrentFile === 'function') {
            deleteCurrentFile();
        } else {
            Utils.showStatus('删除功能不可用', 'error');
        }
    }
    
    /**
     * 显示模块
     */
    static show() {
        const module = document.getElementById(this.MODULE_ID);
        if (module) {
            module.style.display = 'block';
        }
    }
    
    /**
     * 隐藏模块
     */
    static hide() {
        const module = document.getElementById(this.MODULE_ID);
        if (module) {
            module.style.display = 'none';
        }
    }
    
    /**
     * 刷新模块
     */
    static refresh() {
        // 重新渲染模块内容
        this.render();
    }
}

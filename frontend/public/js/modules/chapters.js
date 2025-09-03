/**
 * 章节列表模块
 * 负责显示文档的章节列表和章节操作
 */
class ChaptersModule {
    static MODULE_ID = 'chaptersModule';
    
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
                <h3>📖 章节列表</h3>
                <button class="back-button" onclick="App.showAudioFilesList()">
                    ← 返回音频列表
                </button>
            </div>
            <div class="module-content">
                <div class="chapters-container" id="chaptersContainer">
                    <!-- 章节列表将在这里动态生成 -->
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
     * 显示章节列表
     */
    static displayChapters(chapters) {
        const container = document.getElementById('chaptersContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        // 创建表格结构
        const tableHTML = `
            <table class="chapters-table">
                <thead>
                    <tr>
                        <th width="50">
                            <input type="checkbox" id="selectAllChapters" checked onchange="ChaptersModule.toggleAllChapters(this)">
                        </th>
                        <th width="60">序号</th>
                        <th>章节标题</th>
                        <th width="120">文本长度</th>
                        <th width="100">文本状态</th>
                        <th width="100">音频状态</th>
                        <th width="100">操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${chapters.map((chapter, index) => {
                        // 限制章节标题长度为10个字符
                        const truncatedTitle = chapter.title.length > 10 
                            ? chapter.title.substring(0, 10) + '...' 
                            : chapter.title;
                        
                        return `
                            <tr class="chapter-row">
                                <td>
                                    <input type="checkbox" class="chapter-checkbox" id="chapter_${index}" checked>
                                </td>
                                <td class="chapter-index">${index + 1}</td>
                                <td class="chapter-title" title="${chapter.title}">${truncatedTitle}</td>
                                <td class="chapter-length">${chapter.content.length} 字符</td>
                                <td>
                                    <span class="status-badge status-text-extracted">已提取</span>
                                </td>
                                <td>
                                    <span class="status-badge status-pending">待生成</span>
                                </td>
                                <td>
                                    <button class="btn btn-small btn-primary" onclick="ChaptersModule.viewChapterContent(${index})">
                                        查看
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
        
        container.innerHTML = tableHTML;
        
        // 显示章节后，检查音频状态
        setTimeout(() => {
            if (typeof AudioStatusManager !== 'undefined' && AudioStatusManager.checkAudioStatus) {
                AudioStatusManager.checkAudioStatus();
            }
        }, 500);
    }
    
    /**
     * 切换全选/取消全选
     */
    static toggleAllChapters(selectAllCheckbox) {
        const chapterCheckboxes = document.querySelectorAll('.chapter-checkbox');
        chapterCheckboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
        });
    }
    
    /**
     * 查看章节内容
     */
    static viewChapterContent(chapterIndex) {
        if (!currentChapters || chapterIndex >= currentChapters.length) {
            Utils.showStatus('章节数据不存在', 'error');
            return;
        }

        const chapter = currentChapters[chapterIndex];
        
        // 显示章节内容的弹窗或详情
        const content = `
            <div class="chapter-content-modal">
                <h4>第 ${chapterIndex + 1} 章：${chapter.title}</h4>
                <div class="chapter-content-text">
                    ${chapter.content}
                </div>
            </div>
        `;
        
        // 这里可以使用现有的弹窗系统或创建新的弹窗
        Utils.showStatus(`查看第 ${chapterIndex + 1} 章内容`, 'info');
    }
    
    /**
     * 获取选中的章节
     */
    static getSelectedChapters() {
        const selectedCheckboxes = document.querySelectorAll('.chapter-checkbox:checked');
        return Array.from(selectedCheckboxes).map((checkbox, index) => index);
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

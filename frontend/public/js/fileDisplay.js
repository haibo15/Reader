// 文件显示模块
class FileDisplay {
    // 显示文件信息
    static displayFileInfo(result) {
        document.getElementById('fileName').textContent = result.filename;
        document.getElementById('chapterCount').textContent = result.total_chapters;
        document.getElementById('fileId').textContent = result.file_id;
        document.getElementById('fileInfo').style.display = 'block';
    }

    // 显示章节列表 - 改为表格式显示
    static displayChapters(chapters) {
        const container = document.getElementById('chaptersContainer');
        container.innerHTML = '';
        
        // 创建表格结构
        const tableHTML = `
            <table class="chapters-table">
                <thead>
                    <tr>
                        <th width="50">
                            <input type="checkbox" id="selectAllChapters" checked onchange="FileDisplay.toggleAllChapters(this)">
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
                                    <button class="btn btn-small btn-primary" onclick="FileDisplay.viewChapterContent(${index})">
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
        document.getElementById('chaptersSection').style.display = 'block';
    }

    // 切换全选/取消全选
    static toggleAllChapters(selectAllCheckbox) {
        const chapterCheckboxes = document.querySelectorAll('.chapter-checkbox');
        chapterCheckboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
        });
    }

    // 查看章节内容
    static viewChapterContent(chapterIndex) {
        if (!currentChapters || chapterIndex >= currentChapters.length) {
            Utils.showStatus('章节数据不存在', 'error');
            return;
        }

        const chapter = currentChapters[chapterIndex];
        
        // 创建模态对话框
        const modalHTML = `
            <div class="modal-overlay" onclick="this.remove()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>章节内容 - ${chapter.title}</h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="chapter-content">
                            <div class="content-stats">
                                <span class="stat-item">章节序号: ${chapterIndex + 1}</span>
                                <span class="stat-item">文本长度: ${chapter.content.length} 字符</span>
                                <span class="stat-item">字数: ${chapter.content.replace(/\s/g, '').length} 字</span>
                            </div>
                            <div class="content-text">${chapter.content}</div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">关闭</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // 获取选中的章节索引
    static getSelectedChapters() {
        const checkboxes = document.querySelectorAll('.chapter-checkbox:checked');
        return Array.from(checkboxes).map(checkbox => {
            const id = checkbox.id;
            return parseInt(id.split('_')[1]);
        });
    }
}

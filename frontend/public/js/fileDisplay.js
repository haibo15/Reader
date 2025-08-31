// 文件显示模块
class FileDisplay {
    // 显示文件信息
    static displayFileInfo(result) {
        document.getElementById('fileName').textContent = result.filename;
        document.getElementById('chapterCount').textContent = result.total_chapters;
        document.getElementById('fileId').textContent = result.file_id;
        document.getElementById('fileInfo').style.display = 'block';
    }

    // 显示章节列表
    static displayChapters(chapters) {
        const container = document.getElementById('chaptersContainer');
        container.innerHTML = '';
        
        chapters.forEach((chapter, index) => {
            const chapterItem = document.createElement('div');
            chapterItem.className = 'chapter-item';
            chapterItem.innerHTML = `
                <input type="checkbox" class="chapter-checkbox" id="chapter_${index}" checked>
                <span class="chapter-title">${chapter.title}</span>
                <span class="chapter-status status-pending">待生成</span>
            `;
            container.appendChild(chapterItem);
        });
        
        document.getElementById('chaptersSection').style.display = 'block';
    }

    // 更新章节状态
    static updateChapterStatus(audioFiles) {
        audioFiles.forEach(audioFile => {
            const statusElement = document.querySelector(`#chapter_${audioFile.chapter_index}`).parentNode.querySelector('.chapter-status');
            statusElement.textContent = '已完成';
            statusElement.className = 'chapter-status status-completed';
        });
    }
}

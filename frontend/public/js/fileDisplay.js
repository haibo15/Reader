// 文件显示模块
class FileDisplay {
    // 显示文件信息
    static displayFileInfo(result) {
        document.getElementById('fileName').textContent = result.filename;
        document.getElementById('chapterCount').textContent = result.total_chapters;
        document.getElementById('fileId').textContent = result.file_id;
        
        // 添加文本转换状态信息
        const fileInfoCard = document.querySelector('.info-card');
        const existingStatus = fileInfoCard.querySelector('.text-extraction-status');
        if (existingStatus) {
            existingStatus.remove();
        }
        
        const statusItem = document.createElement('div');
        statusItem.className = 'info-item text-extraction-status';
        statusItem.innerHTML = `
            <span class="label">文本转换状态:</span>
            <span class="status-success">✅ 成功提取 ${result.total_text_length} 字符</span>
        `;
        
        // 插入到章节数信息之后
        const chapterCountItem = fileInfoCard.querySelector('.info-item:nth-child(2)');
        chapterCountItem.parentNode.insertBefore(statusItem, chapterCountItem.nextSibling);
        
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
                <div class="chapter-header">
                    <input type="checkbox" class="chapter-checkbox" id="chapter_${index}" checked>
                    <span class="chapter-title">${chapter.title}</span>
                    <span class="chapter-status status-text-extracted">✅ 文本已提取</span>
                </div>
                <div class="chapter-details">
                    <div class="chapter-info">
                        <span class="info-label">文本长度:</span>
                        <span class="info-value">${chapter.content.length} 字符</span>
                    </div>
                    <div class="chapter-info">
                        <span class="info-label">音频状态:</span>
                        <span class="audio-status status-pending">待生成</span>
                    </div>
                </div>
            `;
            container.appendChild(chapterItem);
        });
        
        document.getElementById('chaptersSection').style.display = 'block';
    }

    // 更新章节状态
    static updateChapterStatus(audioFiles) {
        audioFiles.forEach(audioFile => {
            const chapterItem = document.querySelector(`#chapter_${audioFile.chapter_index}`).closest('.chapter-item');
            const audioStatusElement = chapterItem.querySelector('.audio-status');
            audioStatusElement.textContent = '✅ 音频已生成';
            audioStatusElement.className = 'audio-status status-completed';
        });
    }

    // 更新单个章节的音频生成状态
    static updateSingleChapterStatus(chapterIndex, status) {
        const chapterItem = document.querySelector(`#chapter_${chapterIndex}`).closest('.chapter-item');
        const audioStatusElement = chapterItem.querySelector('.audio-status');
        
        switch(status) {
            case 'generating':
                audioStatusElement.textContent = '🔄 正在生成...';
                audioStatusElement.className = 'audio-status status-generating';
                break;
            case 'completed':
                audioStatusElement.textContent = '✅ 音频已生成';
                audioStatusElement.className = 'audio-status status-completed';
                break;
            case 'failed':
                audioStatusElement.textContent = '❌ 生成失败';
                audioStatusElement.className = 'audio-status status-failed';
                break;
            default:
                audioStatusElement.textContent = '待生成';
                audioStatusElement.className = 'audio-status status-pending';
        }
    }
}

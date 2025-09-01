// 章节音频列表渲染器
class ChapterAudioListRenderer {
    // 渲染章节音频列表
    static render() {
        try {
            if (!currentChapters) return;

            const container = document.querySelector(AudioPlayer.SELECTORS.CHAPTERS_AUDIO_LIST);
            if (!container) return;

            const playableChapters = ChapterAudioListRenderer._getPlayableChapters();
            const html = ChapterAudioListRenderer._generateHTML(playableChapters);
            
            container.innerHTML = html || '<div class="empty-tip">暂无已生成的章节音频</div>';
            
            // 延迟加载音频版本选择器
            ChapterAudioListRenderer._loadAudioVersions();
            
        } catch (error) {
            console.error('生成章节音频列表失败:', error);
        }
    }

    // 获取可播放的章节
    static _getPlayableChapters() {
        const status = window.currentAudioStatus?.audio_status || [];
        const playableIndices = new Set(status.filter(s => s.has_audio).map(s => s.chapter_index));

        return currentChapters
            .map((chapter, index) => ({ chapter, index }))
            .filter(({ index }) => playableIndices.has(index));
    }

    // 生成HTML内容
    static _generateHTML(playableChapters) {
        return playableChapters.map(({ chapter, index }) => {
            const truncatedTitle = ChapterAudioListRenderer._truncateTitle(chapter.title, 20);
            return ChapterAudioListRenderer._generateChapterItemHTML(chapter, index, truncatedTitle);
        }).join('');
    }

    // 生成单个章节项的HTML
    static _generateChapterItemHTML(chapter, index, truncatedTitle) {
        return `
            <div class="chapter-audio-item" data-chapter-index="${index}">
                <div class="chapter-info">
                    <span class="chapter-number">${index + 1}</span>
                    <span class="chapter-title" title="${chapter.title}">${truncatedTitle}</span>
                </div>
                <div class="chapter-audio-controls">
                    ${ChapterAudioListRenderer._generateProgressHTML(index)}
                </div>
                <div class="chapter-actions">
                    ${ChapterAudioListRenderer._generateActionsHTML(index)}
                </div>
            </div>
        `;
    }

    // 生成进度条HTML
    static _generateProgressHTML(index) {
        return `
            <div class="chapter-progress-container">
                <div class="chapter-progress-bar">
                    <div class="chapter-progress-fill" data-chapter="${index}"></div>
                </div>
                <div class="chapter-time-display">
                    <span class="chapter-current-time" data-chapter="${index}">0:00</span>
                    <span>/</span>
                    <span class="chapter-total-time" data-chapter="${index}">0:00</span>
                </div>
            </div>
        `;
    }

    // 生成操作按钮HTML
    static _generateActionsHTML(index) {
        return `
            <label class="checkbox-inline" title="参与合并">
                <input type="checkbox" class="audio-chapter-checkbox" data-chapter="${index}" checked /> 选择
            </label>
            <div class="chapter-version-inline" id="chapterVersions_${index}"></div>
            <button class="btn btn-small btn-secondary chapter-play-btn" data-chapter="${index}" onclick="AudioPlayer.playChapterAudio(${index})">
                <i class="fas fa-play"></i> 播放
            </button>
            <button class="btn btn-small btn-primary" onclick="AudioPlayer.downloadChapterAudio(${index})">
                <i class="fas fa-download"></i> 下载
            </button>
        `;
    }

    // 截断标题
    static _truncateTitle(title, maxLength) {
        return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
    }

    // 加载音频版本选择器
    static _loadAudioVersions() {
        setTimeout(() => {
            if (typeof AudioVersionManager !== 'undefined') {
                AudioVersionManager.loadAudioVersions();
            }
        }, 100);
    }
}

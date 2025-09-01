// 章节进度管理器
class ChapterProgressManager {
    // 更新章节进度条
    static updateProgress(chapterIndex, currentTime, duration) {
        const progressFill = document.querySelector(`.chapter-progress-fill[data-chapter="${chapterIndex}"]`);
        if (progressFill && duration > 0) {
            const progress = (currentTime / duration) * 100;
            progressFill.style.width = `${progress}%`;
        }
    }

    // 更新时间显示
    static updateTimeDisplay(chapterIndex, currentTime, duration) {
        const currentTimeSpan = document.querySelector(`.chapter-current-time[data-chapter="${chapterIndex}"]`);
        const totalTimeSpan = document.querySelector(`.chapter-total-time[data-chapter="${chapterIndex}"]`);
        
        if (currentTimeSpan) {
            currentTimeSpan.textContent = AudioPlayer.formatTime(currentTime);
        }
        if (totalTimeSpan) {
            totalTimeSpan.textContent = AudioPlayer.formatTime(duration);
        }
    }

    // 重置进度显示
    static resetProgress(chapterIndex) {
        ChapterProgressManager.updateProgress(chapterIndex, 0, 0);
        ChapterProgressManager.updateTimeDisplay(chapterIndex, 0, 0);
    }
}

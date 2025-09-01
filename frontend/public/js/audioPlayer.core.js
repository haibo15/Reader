// 核心音频播放器类
class AudioPlayer {
    static currentPlayingAudio = null;
    static currentPlayingChapter = null;
    static audioCache = new Map();

    static SELECTORS = {
        AUDIO_PLAYER: '#audioPlayer',
        AUDIO_SOURCE: '#audioSource',
        AUDIO_ELEMENT: '#audioElement',
        DOWNLOAD_MERGED_BTN: '#downloadMergedBtn',
        MERGED_VERSION_SELECT: '#mergedVersionSelect',
        MERGED_VERSION_SELECTOR: '#mergedVersionSelector',
        CHAPTERS_AUDIO_LIST: '#chaptersAudioList'
    };

    static CSS_CLASSES = {
        CHAPTER_PLAY_BTN: 'chapter-play-btn',
        CHAPTER_PROGRESS_FILL: 'chapter-progress-fill',
        CHAPTER_CURRENT_TIME: 'chapter-current-time',
        CHAPTER_TOTAL_TIME: 'chapter-total-time',
        AUDIO_CHAPTER_CHECKBOX: 'audio-chapter-checkbox'
    };

    // 播放音频文件
    static async playAudio(fileId, filename) {
        try {
            const audioUrl = AudioPlayer._buildAudioUrl(fileId, filename);
            const playerElements = AudioPlayer._getPlayerElements();
            if (!playerElements.audioPlayer) throw new Error('找不到音频播放器容器');
            playerElements.audioSource.src = audioUrl;
            playerElements.audioElement.load();
            playerElements.audioPlayer.style.display = 'block';
            await playerElements.audioElement.play();
            Utils.showStatus('音频播放开始', 'success');
        } catch (error) {
            AudioPlayer._handleError('播放音频失败', error);
        }
    }

    // 播放章节音频
    static async playChapterAudio(chapterIndex) {
        try {
            AudioPlayer.stopCurrentAudio();
            const fileName = AudioDownloader.getChapterAudioFileName(chapterIndex);
            const audioUrl = AudioPlayer._buildAudioUrl(currentFileId, fileName);
            const audio = AudioPlayer._getOrCreateAudio(audioUrl);
            AudioPlayer._setupAudioEventListeners(audio, chapterIndex);
            AudioPlayer._updateChapterPlayButton(chapterIndex, true);
            await audio.play();
            AudioPlayer.currentPlayingAudio = audio;
            AudioPlayer.currentPlayingChapter = chapterIndex;
            Utils.showStatus(`正在播放第 ${chapterIndex + 1} 章`, 'info');
        } catch (error) {
            AudioPlayer._handleError(`播放第 ${chapterIndex + 1} 章失败`, error);
            AudioPlayer._onChapterAudioEnded(chapterIndex);
        }
    }

    // 停止当前播放
    static stopCurrentAudio() {
        if (AudioPlayer.currentPlayingAudio) {
            AudioPlayer.currentPlayingAudio.pause();
            AudioPlayer.currentPlayingAudio.currentTime = 0;
            AudioPlayer.currentPlayingAudio = null;
        }
        if (AudioPlayer.currentPlayingChapter !== null) {
            AudioPlayer._updateChapterPlayButton(AudioPlayer.currentPlayingChapter, false);
            AudioPlayer.currentPlayingChapter = null;
        }
    }

    // 停止指定章节
    static stopChapterAudio(chapterIndex) {
        if (AudioPlayer.currentPlayingChapter === chapterIndex) {
            AudioPlayer.stopCurrentAudio();
            Utils.showStatus(`已停止播放第 ${chapterIndex + 1} 章`, 'info');
        }
    }

    // 展示完整播放器
    static showCompleteAudioPlayer() {
        try {
            const playerElements = AudioPlayer._getPlayerElements();
            if (!playerElements.audioSource || !playerElements.audioElement) throw new Error('找不到音频播放器元素');
            playerElements.audioPlayer.style.display = 'block';
            AudioPlayer.loadMergedAudioVersions();
            ChapterAudioListRenderer.render();
            Utils.showStatus('合并音频播放器已准备就绪', 'success');
        } catch (error) {
            AudioPlayer._handleError('显示播放器失败', error);
        }
    }

    // 加载合并版本
    static async loadMergedAudioVersions() {
        try {
            if (!currentFileId) return;
            const response = await fetch(`${CONFIG.API_BASE_URL}/merged-audio-versions/${currentFileId}`);
            if (!response.ok) { MergedAudioManager.setPlayerDisabled(true); return; }
            const data = await response.json();
            const versions = data.merged_versions || [];
            if (versions.length > 0) {
                MergedAudioManager.populateVersionSelector(versions);
                MergedAudioManager.setPlayerDisabled(false);
            } else {
                MergedAudioManager.setPlayerDisabled(true);
            }
        } catch (error) {
            AudioPlayer._handleError('加载合并音频版本失败', error);
            MergedAudioManager.setPlayerDisabled(true);
        }
    }

    static onMergedVersionChange() {
        MergedAudioManager.onVersionChange();
    }

    static async downloadMergedAudio() {
        try {
            const selector = document.querySelector(AudioPlayer.SELECTORS.MERGED_VERSION_SELECT);
            if (!selector?.value) { Utils.showStatus('请先选择要下载的合并音频版本', 'warning'); return; }
            await AudioDownloader.downloadChapterAudio(currentFileId, selector.value);
        } catch (error) {
            AudioPlayer._handleError('下载合并音频失败', error);
        }
    }

    static generateChaptersAudioList() { ChapterAudioListRenderer.render(); }

    static getSelectedAudioChapters() {
        const checkboxes = document.querySelectorAll(`.${AudioPlayer.CSS_CLASSES.AUDIO_CHAPTER_CHECKBOX}:checked`);
        return Array.from(checkboxes).map(checkbox => parseInt(checkbox.getAttribute('data-chapter')));
    }

    static async downloadChapterAudio(chapterIndex) {
        try {
            const fileName = AudioDownloader.getChapterAudioFileName(chapterIndex);
            await AudioDownloader.downloadChapterAudio(currentFileId, fileName);
        } catch (error) {
            AudioPlayer._handleError('下载章节音频失败', error);
        }
    }

    // 辅助方法
    static _buildAudioUrl(fileId, filename) { return `${CONFIG.API_BASE_URL}/download/${fileId}/${filename}`; }

    static _getPlayerElements() {
        return {
            audioPlayer: document.querySelector(AudioPlayer.SELECTORS.AUDIO_PLAYER),
            audioSource: document.querySelector(AudioPlayer.SELECTORS.AUDIO_SOURCE),
            audioElement: document.querySelector(AudioPlayer.SELECTORS.AUDIO_ELEMENT),
            downloadBtn: document.querySelector(AudioPlayer.SELECTORS.DOWNLOAD_MERGED_BTN)
        };
    }

    static _getOrCreateAudio(audioUrl) {
        if (AudioPlayer.audioCache.has(audioUrl)) return AudioPlayer.audioCache.get(audioUrl);
        const audio = new Audio(audioUrl);
        AudioPlayer.audioCache.set(audioUrl, audio);
        return audio;
    }

    static _setupAudioEventListeners(audio, chapterIndex) {
        audio.onloadedmetadata = null;
        audio.ontimeupdate = null;
        audio.onended = null;
        audio.onerror = null;
        audio.addEventListener('loadedmetadata', () => {
            ChapterProgressManager.updateTimeDisplay(chapterIndex, 0, audio.duration);
        });
        audio.addEventListener('timeupdate', () => {
            ChapterProgressManager.updateProgress(chapterIndex, audio.currentTime, audio.duration);
            ChapterProgressManager.updateTimeDisplay(chapterIndex, audio.currentTime, audio.duration);
        });
        audio.addEventListener('ended', () => { AudioPlayer._onChapterAudioEnded(chapterIndex); });
        audio.addEventListener('error', (error) => { console.error('章节音频播放错误:', error); AudioPlayer._onChapterAudioEnded(chapterIndex); });
    }

    static _updateChapterPlayButton(chapterIndex, isPlaying) {
        const playBtn = document.querySelector(`.chapter-play-btn[data-chapter="${chapterIndex}"]`);
        if (!playBtn) return;
        if (isPlaying) {
            playBtn.innerHTML = '<i class="fas fa-pause"></i> 停止';
            playBtn.onclick = () => AudioPlayer.stopChapterAudio(chapterIndex);
        } else {
            playBtn.innerHTML = '<i class="fas fa-play"></i> 播放';
            playBtn.onclick = () => AudioPlayer.playChapterAudio(chapterIndex);
        }
    }

    static _onChapterAudioEnded(chapterIndex) {
        AudioPlayer._updateChapterPlayButton(chapterIndex, false);
        ChapterProgressManager.resetProgress(chapterIndex);
        if (AudioPlayer.currentPlayingChapter === chapterIndex) {
            AudioPlayer.currentPlayingAudio = null;
            AudioPlayer.currentPlayingChapter = null;
        }
    }

    static _handleError(message, error) {
        console.error(message + ':', error);
        Utils.showStatus(message, 'error');
    }

    static formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}

// 向后兼容的方法别名
AudioPlayer.updateChapterProgress = ChapterProgressManager.updateProgress;
AudioPlayer.updateChapterTimeDisplay = ChapterProgressManager.updateTimeDisplay;
AudioPlayer.onChapterAudioEnded = AudioPlayer._onChapterAudioEnded;
AudioPlayer.updateChapterPlayButton = AudioPlayer._updateChapterPlayButton;
AudioPlayer.populateMergedVersionSelector = MergedAudioManager.populateVersionSelector;
AudioPlayer.setMergedPlayerDisabled = MergedAudioManager.setPlayerDisabled;

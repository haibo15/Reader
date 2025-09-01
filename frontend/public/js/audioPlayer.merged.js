// 合并音频管理器
class MergedAudioManager {
    // 填充版本选择器
    static populateVersionSelector(versions) {
        const selector = document.querySelector(AudioPlayer.SELECTORS.MERGED_VERSION_SELECT);
        const versionContainer = document.querySelector(AudioPlayer.SELECTORS.MERGED_VERSION_SELECTOR);
        
        if (!selector || !versionContainer) return;
        
        // 按时间戳倒序排列
        const sortedVersions = versions.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
        
        const options = sortedVersions.map(version => {
            const displayText = `${version.chapter_range} - ${version.display_time}`;
            return `<option value="${version.filename}">${displayText}</option>`;
        }).join('');
        
        selector.innerHTML = `<option value=\"\">选择版本...</option>${options}`;
        versionContainer.style.display = 'block';
    }

    // 设置播放器启用/禁用状态
    static setPlayerDisabled(disabled) {
        const elements = {
            audioElement: document.querySelector(AudioPlayer.SELECTORS.AUDIO_ELEMENT),
            downloadBtn: document.querySelector(AudioPlayer.SELECTORS.DOWNLOAD_MERGED_BTN),
            versionContainer: document.querySelector(AudioPlayer.SELECTORS.MERGED_VERSION_SELECTOR)
        };
        
        if (elements.audioElement) elements.audioElement.disabled = disabled;
        if (elements.downloadBtn) elements.downloadBtn.disabled = disabled;
        if (elements.versionContainer) {
            elements.versionContainer.style.display = disabled ? 'none' : 'block';
        }
        
        if (disabled && elements.audioElement) {
            elements.audioElement.src = '';
            elements.audioElement.load();
        }
    }

    // 版本选择变化处理
    static onVersionChange() {
        const selector = document.querySelector(AudioPlayer.SELECTORS.MERGED_VERSION_SELECT);
        const audioElement = document.querySelector(AudioPlayer.SELECTORS.AUDIO_ELEMENT);
        const audioSource = document.querySelector(AudioPlayer.SELECTORS.AUDIO_SOURCE);
        
        if (!selector || !audioElement || !audioSource) return;
        
        const selectedFilename = selector.value;
        if (selectedFilename) {
            const audioUrl = AudioPlayer._buildAudioUrl(currentFileId, selectedFilename);
            audioSource.src = audioUrl;
            audioElement.load();
            audioElement.disabled = false;
        } else {
            audioElement.disabled = true;
        }
    }
}

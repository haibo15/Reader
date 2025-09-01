// 音频版本管理模块
class AudioVersionManager {
    // 加载并显示音频版本选择器
    static async loadAudioVersions() {
        try {
            if (!currentFileId) {
                return;
            }

            const response = await fetch(`${CONFIG.API_BASE_URL}/audio-versions/${currentFileId}`);
            if (!response.ok) {
                console.error('获取音频版本失败');
                return;
            }

            const data = await response.json();
            AudioVersionManager.displayAudioVersions(data.audio_versions);
        } catch (error) {
            console.error('加载音频版本失败:', error);
        }
    }

    // 显示音频版本选择器
    static displayAudioVersions(audioVersions) {
        // 按章节分组
        const chapterVersions = {};
        audioVersions.forEach(version => {
            if (!chapterVersions[version.chapter_index]) {
                chapterVersions[version.chapter_index] = [];
            }
            chapterVersions[version.chapter_index].push(version);
        });

        // 为每个章节创建版本选择器（在章节音频列表中）
        Object.keys(chapterVersions).forEach(chapterIndex => {
            const versions = chapterVersions[chapterIndex];
            const cell = document.getElementById(`chapterVersions_${chapterIndex}`);
            
            if (cell && versions.length > 0) {
                const selectHTML = AudioVersionManager.createVersionSelector(chapterIndex, versions);
                cell.innerHTML = selectHTML;
            }
        });
    }

    // 创建版本选择器HTML
    static createVersionSelector(chapterIndex, versions) {
        // 按时间戳倒序排列（最新的在前面）
        versions.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));

        const options = versions.map(version => {
            const displayText = `${version.voice} - ${version.display_time}`;
            return `<option value="${version.filename}" data-voice="${version.voice}" data-time="${version.display_time}">
                ${displayText}
            </option>`;
        }).join('');

        return `
            <div class="chapter-version-controls">
                <div class="version-info">
                    <label class="version-label">音频版本:</label>
                    <select class="version-selector" id="versionSelect_${chapterIndex}" onchange="AudioVersionManager.onVersionChange(${chapterIndex})">
                        ${options}
                    </select>
                </div>
            </div>
        `;
    }

    // 版本选择变化事件
    static onVersionChange(chapterIndex) {
        const selector = document.getElementById(`versionSelect_${chapterIndex}`);
        if (selector) {
            const selectedOption = selector.options[selector.selectedIndex];
            const voice = selectedOption.getAttribute('data-voice');
            const time = selectedOption.getAttribute('data-time');
            
            // 可以在这里添加额外的逻辑，比如显示选中版本的详细信息
            console.log(`章节 ${parseInt(chapterIndex) + 1} 选择了版本: ${voice} - ${time}`);
        }
    }

    // 播放选中的音频版本
    static async playSelectedVersion(chapterIndex) {
        try {
            const selector = document.getElementById(`versionSelect_${chapterIndex}`);
            if (!selector || !currentFileId) {
                Utils.showStatus('无法获取音频信息', 'error');
                return;
            }

            const filename = selector.value;
            if (!filename) {
                Utils.showStatus('请选择音频版本', 'warning');
                return;
            }

            // 停止当前播放的音频
            AudioPlayer.stopCurrentAudio();
            
            const audioUrl = `${CONFIG.API_BASE_URL}/download/${currentFileId}/${filename}`;
            
            // 创建音频元素
            const audio = new Audio(audioUrl);
            
            // 播放音频
            await audio.play();
            
            // 保存当前播放的音频
            AudioPlayer.currentPlayingAudio = audio;
            AudioPlayer.currentPlayingChapter = parseInt(chapterIndex);
            
            Utils.showStatus(`正在播放第 ${parseInt(chapterIndex) + 1} 章`, 'info');
            
            // 音频播放结束时清理
            audio.onended = () => {
                AudioPlayer.currentPlayingAudio = null;
                AudioPlayer.currentPlayingChapter = null;
            };
            
        } catch (error) {
            console.error('播放音频失败:', error);
            Utils.showStatus('播放音频失败', 'error');
        }
    }

    // 下载选中的音频版本
    static async downloadSelectedVersion(chapterIndex) {
        try {
            const selector = document.getElementById(`versionSelect_${chapterIndex}`);
            if (!selector || !currentFileId) {
                Utils.showStatus('无法获取音频信息', 'error');
                return;
            }

            const filename = selector.value;
            if (!filename) {
                Utils.showStatus('请选择音频版本', 'warning');
                return;
            }

            await AudioDownloader.downloadChapterAudio(currentFileId, filename);
            
        } catch (error) {
            console.error('下载音频失败:', error);
            Utils.showStatus('下载音频失败', 'error');
        }
    }

    // 获取指定章节当前选中的音频文件名
    static getSelectedAudioFilename(chapterIndex) {
        const selector = document.getElementById(`versionSelect_${chapterIndex}`);
        return selector ? selector.value : null;
    }

    // 获取所有章节当前选中的音频文件信息
    static getAllSelectedVersions() {
        const selectedVersions = [];
        const selectors = document.querySelectorAll('.version-selector');
        
        selectors.forEach(selector => {
            const chapterIndex = parseInt(selector.id.split('_')[1]);
            const filename = selector.value;
            if (filename) {
                selectedVersions.push({
                    chapter_index: chapterIndex,
                    filename: filename
                });
            }
        });
        
        return selectedVersions;
    }
}

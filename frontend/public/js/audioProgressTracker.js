// 音频进度跟踪模块
class AudioProgressTracker {
    // 轮询进度
    static async pollProgress(taskId) {
        const maxAttempts = 300; // 最多轮询5分钟
        let attempts = 0;
        
        console.log('🔍 开始轮询进度，任务ID:', taskId);
        
        while (attempts < maxAttempts) {
            try {
                console.log(`🔍 第 ${attempts + 1} 次轮询进度...`);
                
                const response = await fetch(`${CONFIG.API_BASE_URL}/progress/${taskId}`);
                console.log('🔍 进度响应状态:', response.status);
                
                if (response.ok) {
                    const progressData = await response.json();
                    console.log('🔍 进度数据:', progressData);
                    
                    // 更新进度条
                    AudioProgressUI.updateProgress(progressData.progress, progressData.message);
                    
                    // 检查是否完成
                    if (progressData.status === 'completed') {
                        console.log('🔍 音频生成完成！');
                        AudioProgressUI.updateProgress(100, '音频生成完成！');
                        return;
                    } else if (progressData.status === 'error') {
                        console.error('🔍 音频生成出错:', progressData.message);
                        throw new Error(progressData.message);
                    }
                } else {
                    console.error('🔍 进度请求失败:', response.status, response.statusText);
                }
                
                // 等待1秒后继续轮询
                await new Promise(resolve => setTimeout(resolve, 1000));
                attempts++;
                
            } catch (error) {
                console.error('🔍 进度轮询失败:', error);
                throw error;
            }
        }
        
        console.error('🔍 音频生成超时');
        throw new Error('音频生成超时');
    }
}

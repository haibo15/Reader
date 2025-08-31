#!/usr/bin/env python3
"""
进度跟踪器
处理任务进度跟踪
"""

import time
from typing import Dict, Optional

class ProgressTracker:
    """进度跟踪器"""
    
    def __init__(self):
        self.progress_data = {}  # 存储进度信息
    
    def create_task(self, file_id: str) -> str:
        """创建新任务"""
        task_id = f"{file_id}_{int(time.time())}"
        
        self.progress_data[task_id] = {
            'progress': 0,
            'message': '正在初始化...',
            'status': 'running',
            'audio_files': []
        }
        
        return task_id
    
    def update_progress(self, task_id: str, progress: int, message: str):
        """更新进度"""
        if task_id in self.progress_data:
            self.progress_data[task_id]['progress'] = progress
            self.progress_data[task_id]['message'] = message
    
    def set_error(self, task_id: str, error_message: str):
        """设置错误状态"""
        if task_id in self.progress_data:
            self.progress_data[task_id]['status'] = 'error'
            self.progress_data[task_id]['message'] = error_message
    
    def set_completed(self, task_id: str, audio_files: list):
        """设置完成状态"""
        if task_id in self.progress_data:
            self.progress_data[task_id]['status'] = 'completed'
            self.progress_data[task_id]['progress'] = 100
            self.progress_data[task_id]['message'] = '音频生成完成！'
            self.progress_data[task_id]['audio_files'] = audio_files
    
    def get_progress(self, task_id: str) -> Optional[Dict]:
        """获取进度信息"""
        return self.progress_data.get(task_id)
    
    def add_audio_file(self, task_id: str, audio_file: Dict):
        """添加音频文件到任务"""
        if task_id in self.progress_data:
            self.progress_data[task_id]['audio_files'].append(audio_file)

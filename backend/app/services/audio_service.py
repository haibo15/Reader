#!/usr/bin/env python3
"""
音频服务模块
协调各个音频处理组件
"""

from typing import List, Dict, Optional
from app.services.audio_file_manager import AudioFileManager
from app.services.audio_generator import AudioGenerator
from app.services.progress_tracker import ProgressTracker
from app.services.audio_merger import AudioMerger

class AudioService:
    """音频服务类 - 协调器"""
    
    def __init__(self, app):
        self.app = app
        self.file_manager = AudioFileManager(app)
        self.generator = AudioGenerator(app)
        self.progress_tracker = ProgressTracker()
        self.merger = AudioMerger(app)
    
    def generate_audio_simple(self, file_id: str, chapter_index: int, voice_settings: Dict) -> List[Dict]:
        """生成音频（简单版本，无进度跟踪）"""
        # 获取文件路径
        file_path = self.file_manager.get_file_path(file_id)
        if not file_path:
            raise Exception('文件不存在')
        
        # 加载章节数据
        chapters = self.file_manager.load_chapters(file_id, file_path)
        
        # 获取音频文件夹
        audio_folder = self.file_manager.get_audio_folder_for_file(file_id)
        
        # 生成音频
        return self.generator.generate_audio_simple(
            file_id, chapter_index, voice_settings, chapters, audio_folder
        )
    
    def generate_audio_with_progress(self, file_id: str, chapter_index: int, voice_settings: Dict) -> str:
        """生成音频（带进度跟踪）"""
        # 创建任务
        task_id = self.progress_tracker.create_task(file_id)
        
        try:
            # 获取文件路径
            file_path = self.file_manager.get_file_path(file_id)
            if not file_path:
                self.progress_tracker.set_error(task_id, '文件不存在')
                return task_id
            
            # 加载章节数据
            chapters = self.file_manager.load_chapters(file_id, file_path)
            
            # 获取音频文件夹
            audio_folder = self.file_manager.get_audio_folder_for_file(file_id)
            
            # 定义进度回调
            def progress_callback(progress, message):
                self.progress_tracker.update_progress(task_id, progress, message)
            
            # 生成音频
            audio_files = self.generator.generate_audio_with_progress(
                file_id, chapter_index, voice_settings, chapters, audio_folder, progress_callback
            )
            
            # 设置完成状态
            self.progress_tracker.set_completed(task_id, audio_files)
            
            return task_id
            
        except Exception as e:
            self.progress_tracker.set_error(task_id, str(e))
            return task_id
    
    def get_progress(self, task_id: str) -> Optional[Dict]:
        """获取进度信息"""
        return self.progress_tracker.get_progress(task_id)
    
    def check_audio_status(self, file_id: str) -> Dict:
        """检查指定文件的音频生成状态"""
        return self.file_manager.check_audio_status(file_id)
    
    def get_existing_audio_files(self, file_id: str) -> List[Dict]:
        """获取指定文件已生成的音频文件列表"""
        return self.file_manager.get_existing_audio_files(file_id)
    
    def get_all_audio_versions(self, file_id: str) -> List[Dict]:
        """获取指定文件所有版本的音频文件列表"""
        return self.file_manager.get_all_audio_versions(file_id)
    
    def get_audio_folder_for_file(self, file_id: str) -> str:
        """为指定文件ID获取音频文件夹路径"""
        return self.file_manager.get_audio_folder_for_file(file_id)
    
    def merge_audio_files(self, file_id: str, selected_chapters: List[int] = None) -> Dict:
        """合并指定文档的音频文件
        
        Args:
            file_id: 文档ID
            selected_chapters: 选中的章节索引列表，None表示合并所有章节
        """
        existing_audio_files = self.file_manager.get_existing_audio_files(file_id)
        
        # 如果指定了选中章节，则筛选对应的音频文件
        if selected_chapters is not None:
            filtered_audio_files = []
            for audio_file in existing_audio_files:
                if audio_file['chapter_index'] in selected_chapters:
                    filtered_audio_files.append(audio_file)
            existing_audio_files = filtered_audio_files
        
        return self.merger.merge_audio_files(file_id, existing_audio_files, selected_chapters)
    
    def get_merged_audio_path(self, file_id: str) -> Optional[str]:
        """获取合并音频文件路径"""
        return self.merger.get_merged_audio_path(file_id)

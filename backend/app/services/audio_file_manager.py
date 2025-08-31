#!/usr/bin/env python3
"""
音频文件管理器
处理音频文件的存储、检索和管理
"""

import os
import json
from typing import List, Dict, Optional
from app.services.file_processor import FileProcessor

class AudioFileManager:
    """音频文件管理器"""
    
    def __init__(self, app):
        self.app = app
        self.file_processor = FileProcessor()
    
    def get_audio_folder_for_file(self, file_id: str) -> str:
        """为指定文件ID获取音频文件夹路径"""
        base_audio_folder = self.app.config['AUDIO_FOLDER']
        file_audio_folder = os.path.join(base_audio_folder, file_id)
        
        # 确保文件夹存在
        if not os.path.exists(file_audio_folder):
            os.makedirs(file_audio_folder)
        
        return file_audio_folder
    
    def get_existing_audio_files(self, file_id: str) -> List[Dict]:
        """获取指定文件已生成的音频文件列表"""
        try:
            audio_folder = self.get_audio_folder_for_file(file_id)
            audio_files = []
            
            if os.path.exists(audio_folder):
                for filename in os.listdir(audio_folder):
                    if filename.endswith('.wav') and filename.startswith('chapter_'):
                        try:
                            chapter_index = int(filename.replace('.wav', '').replace('chapter_', '')) - 1
                            audio_files.append({
                                'filename': filename,
                                'chapter_index': chapter_index,
                                'filepath': os.path.join(audio_folder, filename)
                            })
                        except ValueError:
                            continue
            
            audio_files.sort(key=lambda x: x['chapter_index'])
            return audio_files
        
        except Exception as e:
            print(f"获取音频文件列表失败: {str(e)}")
            return []
    
    def get_file_path(self, file_id: str) -> Optional[str]:
        """获取文件路径"""
        upload_folder = self.app.config['UPLOAD_FOLDER']
        
        for filename in os.listdir(upload_folder):
            if filename.startswith(file_id):
                return os.path.join(upload_folder, filename)
        
        return None
    
    def load_chapters(self, file_id: str, file_path: str) -> List[Dict]:
        """加载章节数据"""
        upload_folder = self.app.config['UPLOAD_FOLDER']
        chapters_file = os.path.join(upload_folder, f"{file_id}_chapters.json")
        
        if os.path.exists(chapters_file):
            try:
                with open(chapters_file, 'r', encoding='utf-8') as f:
                    chapters_data = json.load(f)
                    return chapters_data['chapters']
            except Exception as e:
                print(f"读取章节文件失败: {str(e)}")
        
        file_extension = file_path.rsplit('.', 1)[1].lower()
        
        try:
            text_content = self.file_processor.extract_text(file_path, file_extension)
        except Exception as e:
            raise Exception(f'文本提取失败: {str(e)}')
        
        try:
            return self.file_processor.split_chapters(text_content)
        except Exception as e:
            raise Exception(f'章节分割失败: {str(e)}')
    
    def check_audio_status(self, file_id: str) -> Dict:
        """检查指定文件的音频生成状态"""
        try:
            upload_folder = self.app.config['UPLOAD_FOLDER']
            chapters_file = os.path.join(upload_folder, f"{file_id}_chapters.json")
            chapters = []
            
            if os.path.exists(chapters_file):
                try:
                    with open(chapters_file, 'r', encoding='utf-8') as f:
                        chapters_data = json.load(f)
                        chapters = chapters_data['chapters']
                except Exception as e:
                    print(f"读取章节文件失败: {str(e)}")
            
            existing_audio_files = self.get_existing_audio_files(file_id)
            existing_chapter_indices = {file_info['chapter_index'] for file_info in existing_audio_files}
            
            audio_status = []
            for i, chapter in enumerate(chapters):
                status = {
                    'chapter_index': i,
                    'chapter_title': chapter['title'],
                    'has_audio': i in existing_chapter_indices,
                    'audio_file': None
                }
                
                if i in existing_chapter_indices:
                    for audio_file in existing_audio_files:
                        if audio_file['chapter_index'] == i:
                            status['audio_file'] = audio_file['filename']
                            break
                
                audio_status.append(status)
            
            return {
                'file_id': file_id,
                'total_chapters': len(chapters),
                'generated_count': len(existing_audio_files),
                'audio_status': audio_status
            }
        
        except Exception as e:
            raise Exception(str(e))

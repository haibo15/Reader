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
                # 收集每章的所有版本，并挑选最新的一个（按时间戳片段或文件修改时间）
                chapter_to_latest = {}
                for filename in os.listdir(audio_folder):
                    if filename.endswith('.wav') and filename.startswith('chapter_'):
                        try:
                            # 支持两种命名：
                            # 1) 旧格式：chapter_{n}.wav
                            # 2) 新格式：chapter_{n}__{voice}__{YYYYMMDD_HHMMSS}.wav
                            base = filename[:-4]
                            parts = base.split('__')
                            # parts[0] like 'chapter_1'
                            chapter_str = parts[0].replace('chapter_', '')
                            chapter_index = int(chapter_str) - 1

                            # 解析时间戳（如果存在）
                            timestamp_str = parts[2] if len(parts) >= 3 else None
                            # 作为回退，使用文件修改时间
                            file_path = os.path.join(audio_folder, filename)
                            mtime = os.path.getmtime(file_path)

                            # 根据时间戳字符串构造一个可比较权重
                            rank = (timestamp_str or '')
                            # 若没有时间戳，就用修改时间，前缀 'mtime:' 区分
                            if not timestamp_str:
                                rank = f"mtime:{mtime}"

                            existing = chapter_to_latest.get(chapter_index)
                            if existing is None or rank > existing['rank']:
                                chapter_to_latest[chapter_index] = {
                                    'filename': filename,
                                    'chapter_index': chapter_index,
                                    'filepath': file_path,
                                    'rank': rank
                                }
                        except Exception:
                            continue

                # 输出为列表并按章节索引排序
                audio_files = [
                    {
                        'filename': v['filename'],
                        'chapter_index': v['chapter_index'],
                        'filepath': v['filepath']
                    }
                    for _, v in chapter_to_latest.items()
                ]
            
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

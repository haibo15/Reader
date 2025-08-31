#!/usr/bin/env python3
"""
音频合并器
处理音频文件合并
"""

import os
from typing import Dict, Optional

class AudioMerger:
    """音频合并器"""
    
    def __init__(self, app):
        self.app = app
    
    def merge_audio_files(self, file_id: str, existing_audio_files: list) -> Dict:
        """合并指定文档的所有音频文件"""
        try:
            if not existing_audio_files:
                raise Exception('没有找到音频文件')
            
            # 按章节索引排序
            existing_audio_files.sort(key=lambda x: x['chapter_index'])
            
            # 获取音频文件夹
            base_audio_folder = self.app.config['AUDIO_FOLDER']
            audio_folder = os.path.join(base_audio_folder, file_id)
            merged_filename = f"{file_id}_complete.wav"
            merged_filepath = os.path.join(audio_folder, merged_filename)
            
            # 合并音频文件
            with open(merged_filepath, 'wb') as outfile:
                for i, audio_file in enumerate(existing_audio_files):
                    with open(audio_file['filepath'], 'rb') as infile:
                        if i == 0:
                            # 第一个文件，保留完整的WAV头
                            outfile.write(infile.read())
                        else:
                            # 后续文件，跳过WAV头（44字节）
                            infile.seek(44)
                            outfile.write(infile.read())
            
            return {
                'success': True,
                'merged_file': merged_filename,
                'total_chapters': len(existing_audio_files)
            }
            
        except Exception as e:
            raise Exception(str(e))
    
    def get_merged_audio_path(self, file_id: str) -> Optional[str]:
        """获取合并音频文件路径"""
        base_audio_folder = self.app.config['AUDIO_FOLDER']
        audio_folder = os.path.join(base_audio_folder, file_id)
        merged_filename = f"{file_id}_complete.wav"
        merged_filepath = os.path.join(audio_folder, merged_filename)
        
        if os.path.exists(merged_filepath):
            return merged_filepath
        
        return None

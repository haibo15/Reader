#!/usr/bin/env python3
"""
音频合并器
处理音频文件合并
"""

import os
import wave
import struct
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
            
            # 使用wave模块合并音频文件
            return self._merge_with_wave(existing_audio_files, merged_filepath, merged_filename)
            
        except Exception as e:
            raise Exception(str(e))
    
    def _merge_with_wave(self, existing_audio_files: list, merged_filepath: str, merged_filename: str) -> Dict:
        """使用wave模块合并WAV文件（Python标准库，无需额外依赖）"""
        try:
            if not existing_audio_files:
                raise Exception('没有音频文件可合并')
            
            # 读取第一个音频文件获取参数
            with wave.open(existing_audio_files[0]['filepath'], 'rb') as first_wav:
                channels = first_wav.getnchannels()
                sample_width = first_wav.getsampwidth()
                frame_rate = first_wav.getframerate()
                sample_format = first_wav.getcomptype()
            
            # 创建输出文件
            with wave.open(merged_filepath, 'wb') as output_wav:
                output_wav.setnchannels(channels)
                output_wav.setsampwidth(sample_width)
                output_wav.setframerate(frame_rate)
                output_wav.setcomptype(sample_format[0], sample_format[1])
                
                # 依次读取并写入音频数据
                for audio_file in existing_audio_files:
                    with wave.open(audio_file['filepath'], 'rb') as input_wav:
                        # 验证音频参数是否一致
                        if (input_wav.getnchannels() != channels or 
                            input_wav.getsampwidth() != sample_width or 
                            input_wav.getframerate() != frame_rate):
                            print(f"警告: 音频文件 {audio_file['filepath']} 参数不一致，可能影响合并效果")
                        
                        # 读取音频数据并写入输出文件
                        audio_data = input_wav.readframes(input_wav.getnframes())
                        output_wav.writeframes(audio_data)
            
            return {
                'success': True,
                'merged_file': merged_filename,
                'total_chapters': len(existing_audio_files),
                'method': 'wave_module'
            }
            
        except Exception as e:
            raise Exception(f"wave模块合并失败: {str(e)}")
    
    def get_merged_audio_path(self, file_id: str) -> Optional[str]:
        """获取合并音频文件路径"""
        base_audio_folder = self.app.config['AUDIO_FOLDER']
        audio_folder = os.path.join(base_audio_folder, file_id)
        merged_filename = f"{file_id}_complete.wav"
        merged_filepath = os.path.join(audio_folder, merged_filename)
        
        if os.path.exists(merged_filepath):
            return merged_filepath
        
        return None

#!/usr/bin/env python3
"""
音频合并器
处理音频文件合并
"""

import os
import wave
from datetime import datetime
from typing import Dict, Optional

class AudioMerger:
    """音频合并器"""
    
    def __init__(self, app):
        self.app = app
    
    def merge_audio_files(self, file_id: str, existing_audio_files: list, selected_chapters: list = None, selected_audio_versions: list = None) -> Dict:
        """合并指定文档的音频文件
        
        Args:
            file_id: 文档ID
            existing_audio_files: 现有音频文件列表
            selected_chapters: 选中的章节索引列表，用于生成文件名
            selected_audio_versions: 选中的音频版本列表，包含具体的文件名
        """
        try:
            # 如果提供了选中的音频版本，使用它们；否则使用现有的音频文件
            if selected_audio_versions and len(selected_audio_versions) > 0:
                # 使用选中的音频版本
                audio_files_to_merge = []
                base_audio_folder = self.app.config['AUDIO_FOLDER']
                audio_folder = os.path.join(base_audio_folder, file_id)
                
                for version_info in selected_audio_versions:
                    chapter_index = version_info['chapter_index']
                    filename = version_info['filename']
                    filepath = os.path.join(audio_folder, filename)
                    
                    if os.path.exists(filepath):
                        audio_files_to_merge.append({
                            'chapter_index': chapter_index,
                            'filepath': filepath,
                            'filename': filename
                        })
                    else:
                        raise Exception(f'音频文件不存在: {filename}')
                
                # 按章节索引排序
                audio_files_to_merge.sort(key=lambda x: x['chapter_index'])
                existing_audio_files = audio_files_to_merge
            
            if not existing_audio_files:
                raise Exception('没有找到音频文件')
            
            # 按章节索引排序
            existing_audio_files.sort(key=lambda x: x['chapter_index'])
            
            # 获取音频文件夹
            base_audio_folder = self.app.config['AUDIO_FOLDER']
            audio_folder = os.path.join(base_audio_folder, file_id)
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            
            # 生成合并文件名，反映章节范围
            if selected_chapters is not None and len(selected_chapters) > 0:
                # 对选中章节排序
                sorted_chapters = sorted(selected_chapters)
                if len(sorted_chapters) == 1:
                    chapter_range = f"chapter_{sorted_chapters[0] + 1}"
                elif self._is_continuous_range(sorted_chapters):
                    chapter_range = f"chapters_{sorted_chapters[0] + 1}-{sorted_chapters[-1] + 1}"
                else:
                    # 非连续章节，显示前几个
                    if len(sorted_chapters) <= 3:
                        chapter_nums = [str(ch + 1) for ch in sorted_chapters]
                        chapter_range = f"chapters_{'_'.join(chapter_nums)}"
                    else:
                        chapter_range = f"chapters_{sorted_chapters[0] + 1}_{sorted_chapters[1] + 1}_etc_{len(sorted_chapters)}total"
            else:
                chapter_range = "complete"
            
            merged_filename = f"{file_id}_{chapter_range}__{timestamp}.wav"
            merged_filepath = os.path.join(audio_folder, merged_filename)
            
            # 使用wave模块合并音频文件
            return self._merge_with_wave(existing_audio_files, merged_filepath, merged_filename)
            
        except Exception as e:
            raise Exception(str(e))
    
    def _is_continuous_range(self, sorted_chapters: list) -> bool:
        """判断章节列表是否为连续范围"""
        if len(sorted_chapters) <= 1:
            return True
        
        for i in range(1, len(sorted_chapters)):
            if sorted_chapters[i] != sorted_chapters[i-1] + 1:
                return False
        return True
    
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
                comp_type = first_wav.getcomptype()
                comp_name = first_wav.getcompname()

            # 仅支持未压缩 PCM WAV
            if comp_type != 'NONE':
                raise Exception(f"仅支持未压缩 PCM WAV（comptype=NONE），检测到 comptype={comp_type}")
            
            # 创建输出文件
            with wave.open(merged_filepath, 'wb') as output_wav:
                output_wav.setnchannels(channels)
                output_wav.setsampwidth(sample_width)
                output_wav.setframerate(frame_rate)
                # 与首段音频保持一致（未压缩情况下为 NONE/not compressed）
                output_wav.setcomptype(comp_type, comp_name)
                
                # 依次读取并写入音频数据
                for audio_file in existing_audio_files:
                    with wave.open(audio_file['filepath'], 'rb') as input_wav:
                        # 验证音频参数是否一致（严格校验）
                        in_channels = input_wav.getnchannels()
                        in_sampwidth = input_wav.getsampwidth()
                        in_framerate = input_wav.getframerate()
                        in_comptype = input_wav.getcomptype()

                        if (in_channels != channels or 
                            in_sampwidth != sample_width or 
                            in_framerate != frame_rate or 
                            in_comptype != comp_type):
                            raise Exception(
                                (
                                    f"音频参数不一致: {audio_file['filepath']} "
                                    f"(channels={in_channels}, sampwidth={in_sampwidth}, framerate={in_framerate}, comptype={in_comptype}) "
                                    f"vs 预期 (channels={channels}, sampwidth={sample_width}, framerate={frame_rate}, comptype={comp_type}). "
                                    "请先转码为相同格式后再合并。"
                                )
                            )
                        
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
        """获取最新的合并音频文件路径（按时间戳或修改时间选择最新）"""
        base_audio_folder = self.app.config['AUDIO_FOLDER']
        audio_folder = os.path.join(base_audio_folder, file_id)
        if not os.path.exists(audio_folder):
            return None

        candidates = []
        try:
            for filename in os.listdir(audio_folder):
                if filename.endswith('.wav') and filename.startswith(f"{file_id}_"):
                    # 检查是否是合并文件（不是单章节文件）
                    if '_chapter_' in filename and '__' in filename:
                        continue  # 跳过单章节文件
                    
                    # 合并文件格式：file_id_complete__timestamp.wav 或 file_id_chapters_x-y__timestamp.wav
                    if '_complete__' in filename or '_chapters_' in filename or '_chapter_' in filename:
                        filepath = os.path.join(audio_folder, filename)
                        base = filename[:-4]
                        parts = base.split('__')
                        # 最后一个部分应该是时间戳
                        timestamp_str = parts[-1] if len(parts) >= 2 else None
                        rank = timestamp_str or f"mtime:{os.path.getmtime(filepath)}"
                        candidates.append((rank, filepath))
        except Exception:
            return None

        if not candidates:
            return None

        # 选择 rank 最大者（时间戳或修改时间最新）
        candidates.sort(key=lambda x: x[0])
        return candidates[-1][1]

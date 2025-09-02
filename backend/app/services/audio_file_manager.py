#!/usr/bin/env python3
"""
音频文件管理器
处理音频文件的存储、检索和管理
"""

import os
import json
from typing import List, Dict, Optional
from app.services.file_processor import FileProcessor
import wave

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
                
                # 首先处理分段文件，将它们合并
                self._merge_segmented_files(audio_folder)
                
                for filename in os.listdir(audio_folder):
                    if filename.endswith('.wav') and filename.startswith('chapter_'):
                        try:
                            # 跳过分段文件，因为我们已经处理过了
                            if '_part_' in filename:
                                continue
                                
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

    def _merge_segmented_files(self, audio_folder: str):
        """合并分段音频文件"""
        try:
            # 查找所有分段文件
            segmented_groups = {}
            
            for filename in os.listdir(audio_folder):
                if filename.endswith('.wav') and '_part_' in filename:
                    # 解析分段文件名，例如：chapter_57__Serena__20250902_120136.wav_part_1.wav
                    base_name = filename.replace('.wav', '')  # 移除.wav后缀
                    if '_part_' in base_name:
                        # 分割基础名称和部分编号
                        parts = base_name.split('_part_')
                        if len(parts) == 2:
                            base_chapter_name = parts[0]  # chapter_57__Serena__20250902_120136
                            part_num = int(parts[1])      # 1, 2, 3, 4...
                            
                            if base_chapter_name not in segmented_groups:
                                segmented_groups[base_chapter_name] = {}
                            
                            segmented_groups[base_chapter_name][part_num] = filename
            
            # 处理每个分段组
            for base_name, parts in segmented_groups.items():
                if len(parts) > 1:  # 至少需要2个部分才需要合并
                    # 按部分编号排序
                    sorted_parts = sorted(parts.items())
                    
                    # 检查是否所有部分都存在
                    expected_parts = list(range(1, len(parts) + 1))
                    actual_parts = [p[0] for p in sorted_parts]
                    
                    if actual_parts == expected_parts:
                        # 所有部分都存在，可以合并
                        self._merge_chapter_segments(audio_folder, base_name, sorted_parts)
                        
        except Exception as e:
            print(f"处理分段文件时出错: {str(e)}")

    def _merge_chapter_segments(self, audio_folder: str, base_name: str, sorted_parts: list):
        """合并单个章节的分段文件"""
        try:
            # 生成合并后的文件名
            merged_filename = f"{base_name}.wav"
            merged_filepath = os.path.join(audio_folder, merged_filename)
            
            # 如果合并文件已存在，跳过
            if os.path.exists(merged_filepath):
                return
            
            print(f"正在合并分段文件: {base_name}")
            
            # 使用wave模块合并WAV文件
            with wave.open(merged_filepath, 'wb') as output_wav:
                # 读取第一个分段文件获取参数
                first_part_path = os.path.join(audio_folder, sorted_parts[0][1])
                with wave.open(first_part_path, 'rb') as first_wav:
                    channels = first_wav.getnchannels()
                    sample_width = first_wav.getsampwidth()
                    frame_rate = first_wav.getframerate()
                    comp_type = first_wav.getcomptype()
                    comp_name = first_wav.getcompname()
                
                # 设置输出文件参数
                output_wav.setnchannels(channels)
                output_wav.setsampwidth(sample_width)
                output_wav.setframerate(frame_rate)
                output_wav.setcomptype(comp_type, comp_name)
                
                # 依次读取并写入每个分段
                for part_num, part_filename in sorted_parts:
                    part_filepath = os.path.join(audio_folder, part_filename)
                    with wave.open(part_filepath, 'rb') as input_wav:
                        # 验证音频参数是否一致
                        if (input_wav.getnchannels() != channels or 
                            input_wav.getsampwidth() != sample_width or 
                            input_wav.getframerate() != frame_rate or 
                            input_wav.getcomptype() != comp_type):
                            print(f"警告: 分段文件 {part_filename} 的音频参数不一致，跳过合并")
                            return
                        
                        # 读取音频数据并写入输出文件
                        audio_data = input_wav.readframes(input_wav.getnframes())
                        output_wav.writeframes(audio_data)
            
            print(f"成功合并分段文件为: {merged_filename}")
            
            # 可选：删除分段文件（谨慎操作）
            # for part_num, part_filename in sorted_parts:
            #     part_filepath = os.path.join(audio_folder, part_filename)
            #     os.remove(part_filepath)
            #     print(f"已删除分段文件: {part_filename}")
            
        except Exception as e:
            print(f"合并分段文件失败 {base_name}: {str(e)}")
            # 如果合并失败，删除可能创建的不完整文件
            if os.path.exists(merged_filepath):
                try:
                    os.remove(merged_filepath)
                except:
                    pass
    
    def get_all_audio_versions(self, file_id: str) -> List[Dict]:
        """获取指定文件所有版本的音频文件列表"""
        try:
            audio_folder = self.get_audio_folder_for_file(file_id)
            audio_files = []
            
            if os.path.exists(audio_folder):
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

                            # 解析语音角色和时间戳
                            voice = parts[1] if len(parts) >= 2 else 'Unknown'
                            timestamp_str = parts[2] if len(parts) >= 3 else None
                            
                            # 格式化显示时间
                            display_time = '未知时间'
                            if timestamp_str:
                                try:
                                    from datetime import datetime
                                    dt = datetime.strptime(timestamp_str, '%Y%m%d_%H%M%S')
                                    display_time = dt.strftime('%Y-%m-%d %H:%M:%S')
                                except:
                                    display_time = timestamp_str
                            else:
                                # 使用文件修改时间
                                file_path = os.path.join(audio_folder, filename)
                                from datetime import datetime
                                mtime = os.path.getmtime(file_path)
                                dt = datetime.fromtimestamp(mtime)
                                display_time = dt.strftime('%Y-%m-%d %H:%M:%S')

                            audio_files.append({
                                'filename': filename,
                                'chapter_index': chapter_index,
                                'filepath': os.path.join(audio_folder, filename),
                                'voice': voice,
                                'timestamp': timestamp_str,
                                'display_time': display_time
                            })
                        except Exception:
                            continue

                # 按章节索引和时间戳排序
                audio_files.sort(key=lambda x: (x['chapter_index'], x['timestamp'] or ''))
            
            return audio_files
        
        except Exception as e:
            print(f"获取所有音频版本失败: {str(e)}")
            return []
    
    def get_merged_audio_versions(self, file_id: str) -> List[Dict]:
        """获取指定文件所有版本的合并音频文件列表"""
        try:
            audio_folder = self.get_audio_folder_for_file(file_id)
            merged_files = []
            
            if os.path.exists(audio_folder):
                for filename in os.listdir(audio_folder):
                    if filename.endswith('.wav') and filename.startswith(f"{file_id}_"):
                        # 检查是否是合并文件（不是单章节文件）
                        if '_chapter_' in filename and '__' in filename:
                            continue  # 跳过单章节文件
                        
                        # 合并文件格式：file_id_complete__timestamp.wav 或 file_id_chapters_x-y__timestamp.wav
                        if '_complete__' in filename or '_chapters_' in filename or '_chapter_' in filename:
                            try:
                                base = filename[:-4]
                                parts = base.split('__')
                                
                                # 解析章节范围
                                chapter_range = "完整"
                                if '_chapters_' in filename:
                                    range_part = parts[0].split('_chapters_')[1]
                                    chapter_range = f"章节{range_part}"
                                elif '_chapter_' in filename and '_chapters_' not in filename:
                                    range_part = parts[0].split('_chapter_')[1]
                                    chapter_range = f"章节{range_part}"
                                
                                # 解析时间戳
                                timestamp_str = parts[-1] if len(parts) >= 2 else None
                                
                                # 格式化显示时间
                                display_time = '未知时间'
                                if timestamp_str:
                                    try:
                                        from datetime import datetime
                                        dt = datetime.strptime(timestamp_str, '%Y%m%d_%H%M%S')
                                        display_time = dt.strftime('%Y-%m-%d %H:%M:%S')
                                    except:
                                        display_time = timestamp_str
                                else:
                                    # 使用文件修改时间
                                    file_path = os.path.join(audio_folder, filename)
                                    from datetime import datetime
                                    mtime = os.path.getmtime(file_path)
                                    dt = datetime.fromtimestamp(mtime)
                                    display_time = dt.strftime('%Y-%m-%d %H:%M:%S')

                                merged_files.append({
                                    'filename': filename,
                                    'filepath': os.path.join(audio_folder, filename),
                                    'chapter_range': chapter_range,
                                    'timestamp': timestamp_str,
                                    'display_time': display_time
                                })
                            except Exception:
                                continue

                # 按时间戳排序（最新的在前面）
                merged_files.sort(key=lambda x: x['timestamp'] or '', reverse=True)
            
            return merged_files
        
        except Exception as e:
            print(f"获取合并音频版本失败: {str(e)}")
            return []
    
    def delete_audio_file(self, file_id: str, filename: str) -> Dict:
        """删除指定的音频文件"""
        try:
            audio_folder = self.get_audio_folder_for_file(file_id)
            file_path = os.path.join(audio_folder, filename)
            
            if not os.path.exists(file_path):
                return {
                    'success': False,
                    'error': f'文件不存在: {filename}'
                }
            
            # 删除文件
            os.remove(file_path)
            
            return {
                'success': True,
                'message': f'文件删除成功: {filename}',
                'deleted_file': filename
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'删除文件失败: {str(e)}'
            }
    
    def get_file_path(self, file_id: str) -> Optional[str]:
        """获取文件路径"""
        upload_folder = self.app.config['UPLOAD_FOLDER']

        # 优先：新结构 uploads/{file_id}/{file_id}.ext
        new_dir = os.path.join(upload_folder, file_id)
        if os.path.isdir(new_dir):
            try:
                for filename in os.listdir(new_dir):
                    if filename.startswith(file_id) and '.' in filename and not filename.endswith('.meta') and not filename.endswith('_chapters.json'):
                        return os.path.join(new_dir, filename)
            except Exception:
                pass

        # 兼容：旧结构 直接在 uploads 根目录
        for filename in os.listdir(upload_folder):
            if filename.startswith(file_id) and '.' in filename and not filename.endswith('.meta') and not filename.endswith('_chapters.json'):
                return os.path.join(upload_folder, filename)
        
        return None
    
    def load_chapters(self, file_id: str, file_path: str) -> List[Dict]:
        """加载章节数据"""
        upload_folder = self.app.config['UPLOAD_FOLDER']
        # 优先：新结构 uploads/{file_id}/{file_id}_chapters.json
        chapters_file_new = os.path.join(upload_folder, file_id, f"{file_id}_chapters.json")
        chapters_file_old = os.path.join(upload_folder, f"{file_id}_chapters.json")
        chapters_file = chapters_file_new if os.path.exists(chapters_file_new) else chapters_file_old

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
            # 优先新结构
            chapters_file_new = os.path.join(upload_folder, file_id, f"{file_id}_chapters.json")
            chapters_file = chapters_file_new if os.path.exists(chapters_file_new) else os.path.join(upload_folder, f"{file_id}_chapters.json")
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

#!/usr/bin/env python3
"""
音频生成器
处理音频生成逻辑
"""

import os
from typing import List, Dict
from app.services.text_to_speech_simple import SimpleTextToSpeechService

class AudioGenerator:
    """音频生成器"""
    
    def __init__(self, app):
        self.app = app
    
    def get_tts_service(self) -> SimpleTextToSpeechService:
        """获取TTS服务实例"""
        try:
            return SimpleTextToSpeechService()
        except Exception as e:
            raise Exception(f"TTS服务初始化失败: {str(e)}")
    
    def generate_audio_simple(self, file_id: str, chapter_index: int, voice_settings: Dict, 
                            chapters: List[Dict], audio_folder: str) -> List[Dict]:
        """生成音频（简单版本，无进度跟踪）"""
        tts_service = self.get_tts_service()
        
        if chapter_index == -1:
            audio_files = []
            for i, chapter in enumerate(chapters):
                audio_filename = f"chapter_{i+1}.wav"
                audio_filepath = os.path.join(audio_folder, audio_filename)
                
                tts_service.generate_and_save_audio(
                    chapter['content'], 
                    audio_filepath,
                    voice_settings
                )
                
                audio_files.append({
                    'chapter_index': i,
                    'chapter_title': chapter['title'],
                    'audio_file': audio_filename
                })
            
            return audio_files
        else:
            if chapter_index >= len(chapters):
                raise Exception('章节索引超出范围')
            
            chapter = chapters[chapter_index]
            audio_filename = f"chapter_{chapter_index+1}.wav"
            audio_filepath = os.path.join(audio_folder, audio_filename)
            
            tts_service.generate_and_save_audio(
                chapter['content'],
                audio_filepath,
                voice_settings
            )
            
            return [{
                'chapter_index': chapter_index,
                'chapter_title': chapter['title'],
                'audio_file': audio_filename
            }]
    
    def generate_audio_with_progress(self, file_id: str, chapter_index: int, voice_settings: Dict,
                                   chapters: List[Dict], audio_folder: str, 
                                   progress_callback) -> List[Dict]:
        """生成音频（带进度跟踪）"""
        tts_service = self.get_tts_service()
        audio_files = []
        
        if chapter_index == -1:
            total_chapters = len(chapters)
            
            for i, chapter in enumerate(chapters):
                try:
                    chapter_progress = (i / total_chapters) * 100
                    progress_callback(int(chapter_progress), f"正在生成第 {i+1}/{total_chapters} 章节...")
                    
                    audio_filename = f"chapter_{i+1}.wav"
                    audio_filepath = os.path.join(audio_folder, audio_filename)
                    
                    def chapter_progress_callback(sub_progress, sub_message):
                        overall_progress = int((i / total_chapters) * 100 + (sub_progress / total_chapters))
                        progress_callback(overall_progress, f"第 {i+1} 章节: {sub_message}")
                    
                    tts_service.generate_and_save_audio(
                        chapter['content'], 
                        audio_filepath,
                        voice_settings,
                        chapter_progress_callback
                    )
                    
                    audio_files.append({
                        'chapter_index': i,
                        'chapter_title': chapter['title'],
                        'audio_file': audio_filename
                    })
                    
                except Exception as e:
                    raise Exception(f'第 {i+1} 章节音频生成失败: {str(e)}')
        else:
            if chapter_index >= len(chapters):
                raise Exception('章节索引超出范围')
            
            chapter = chapters[chapter_index]
            audio_filename = f"chapter_{chapter_index+1}.wav"
            audio_filepath = os.path.join(audio_folder, audio_filename)
            
            try:
                tts_service.generate_and_save_audio(
                    chapter['content'],
                    audio_filepath,
                    voice_settings,
                    progress_callback
                )
                audio_files = [{
                    'chapter_index': chapter_index,
                    'chapter_title': chapter['title'],
                    'audio_file': audio_filename
                }]
                
            except Exception as e:
                raise Exception(f'音频生成失败: {str(e)}')
        
        return audio_files

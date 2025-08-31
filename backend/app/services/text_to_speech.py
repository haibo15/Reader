#!/usr/bin/env python3
"""
文本转语音服务
基于阿里巴巴通义千问-TTS API
参考：https://help.aliyun.com/zh/model-studio/qwen-tts#4d86103b5246q
"""

import os
import io
import requests
import dashscope
from typing import Dict, Any, List
from pydub import AudioSegment
from dotenv import load_dotenv

class TextToSpeechService:
    """文本转语音服务类"""
    
    def __init__(self):
        """初始化服务"""
        load_dotenv()
        self.api_key = os.getenv('DASHSCOPE_API_KEY')
        if not self.api_key:
            raise ValueError("未找到DASHSCOPE_API_KEY环境变量")
    
    def get_default_settings(self) -> Dict[str, Any]:
        """获取默认语音设置"""
        return {
            'voice': 'Ethan',
            'speed': 1.0,
            'volume': 0,
            'format': 'mp3',
            'sample_rate': 16000
        }
    
    def get_available_voices(self) -> List[str]:
        """获取可用的语音列表"""
        # 根据官方文档支持的音色
        return ['Ethan', 'Chelsie', 'Cherry', 'Serena', 'Dylan', 'Jada', 'Sunny']
    
    def get_voice_settings(self) -> Dict[str, Any]:
        """获取语音设置选项"""
        return {
            'voices': self.get_available_voices(),
            'speed_range': (0.5, 2.0),
            'volume_range': (-20, 20)
        }
    
    def _call_tts_api(self, text: str, settings: Dict[str, Any]) -> AudioSegment:
        """调用TTS API"""
        try:
            # 使用官方文档的调用方式
            response = dashscope.audio.qwen_tts.SpeechSynthesizer.call(
                model="qwen-tts",
                api_key=self.api_key,
                text=text,
                voice=settings['voice']
            )
            
            if response.status_code == 200:
                # 获取音频URL
                audio_url = response.output.audio["url"]
                
                # 下载音频文件
                audio_response = requests.get(audio_url)
                audio_response.raise_for_status()
                
                # 转换为AudioSegment
                audio_segment = AudioSegment.from_wav(io.BytesIO(audio_response.content))
                return audio_segment
            else:
                raise Exception(f"API调用失败: {response.status_code} - {response.message}")
                
        except Exception as e:
            raise Exception(f"API调用异常: {str(e)}")
    
    def generate_audio(self, text: str, settings: Dict[str, Any] = None) -> AudioSegment:
        """生成音频"""
        if settings is None:
            settings = self.get_default_settings()
        
        # 调用API生成音频
        audio_segment = self._call_tts_api(text, settings)
        
        # 应用音量和速度设置
        if settings.get('volume', 0) != 0:
            audio_segment = audio_segment + settings['volume']
        
        if settings.get('speed', 1.0) != 1.0:
            audio_segment = audio_segment.speedup(playback_speed=settings['speed'])
        
        return audio_segment
    
    def save_audio(self, audio_segment: AudioSegment, filepath: str, format: str = 'mp3') -> str:
        """保存音频文件"""
        try:
            audio_segment.export(filepath, format=format)
            return filepath
        except Exception as e:
            raise Exception(f"保存音频文件失败: {str(e)}")
    
    def generate_audio_file(self, text: str, filename: str, voice_settings: Dict[str, Any] = None) -> str:
        """生成音频文件并保存"""
        try:
            # 默认语音设置
            default_settings = self.get_default_settings()
            
            # 合并用户设置
            if voice_settings:
                default_settings.update(voice_settings)
            
            # 分割长文本
            text_chunks = self._split_text(text)
            
            # 生成音频片段
            audio_segments = []
            for i, chunk in enumerate(text_chunks):
                audio_data = self._call_tts_api(chunk, default_settings)
                if audio_data:
                    audio_segments.append(audio_data)
                
                # 避免API调用过于频繁
                if i < len(text_chunks) - 1:
                    import time
                    time.sleep(0.5)
            
            # 合并音频片段
            if audio_segments:
                final_audio = self._merge_audio_segments(audio_segments)
                
                # 保存音频文件
                output_path = os.path.join(os.getenv('AUDIO_FOLDER', './audio'), f"{filename}.mp3")
                final_audio.export(output_path, format="mp3")
                
                return f"{filename}.mp3"
            else:
                raise Exception("没有生成任何音频数据")
                
        except Exception as e:
            raise Exception(f"音频生成失败: {str(e)}")
    
    def _split_text(self, text: str, max_length: int = 500) -> list:
        """分割长文本"""
        if len(text) <= max_length:
            return [text]
        
        # 按句子分割
        sentences = self._split_sentences(text)
        chunks = []
        current_chunk = ""
        
        for sentence in sentences:
            if len(current_chunk) + len(sentence) <= max_length:
                current_chunk += sentence
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = sentence
        
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        return chunks
    
    def _split_sentences(self, text: str) -> list:
        """按句子分割文本"""
        # 中文句子分割
        import re
        sentences = re.split(r'[。！？；]', text)
        return [s.strip() + '。' for s in sentences if s.strip()]
    
    def _merge_audio_segments(self, audio_segments: list) -> AudioSegment:
        """合并音频片段"""
        if not audio_segments:
            return AudioSegment.empty()
        
        if len(audio_segments) == 1:
            return audio_segments[0]
        
        # 合并所有音频片段
        merged_audio = audio_segments[0]
        for segment in audio_segments[1:]:
            merged_audio += segment
        
        return merged_audio

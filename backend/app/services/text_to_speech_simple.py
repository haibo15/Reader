#!/usr/bin/env python3
"""
简化的文本转语音服务（不依赖pydub）
基于阿里巴巴通义千问-TTS API
参考：https://help.aliyun.com/zh/model-studio/qwen-tts#4d86103b5246q
"""

import os
import requests
import dashscope
from typing import Dict, Any, List, Callable, Optional
from dotenv import load_dotenv

class SimpleTextToSpeechService:
    """简化的文本转语音服务类（不依赖pydub）"""
    
    def __init__(self):
        """初始化服务"""
        # 尝试从环境变量加载，如果失败则使用默认值
        try:
            load_dotenv()
            self.api_key = os.getenv('DASHSCOPE_API_KEY')
        except:
            self.api_key = None
        
        if not self.api_key:
            raise Exception("未找到DASHSCOPE_API_KEY环境变量，请在.env文件中配置您的API密钥")
        
        # 设置DashScope API密钥
        dashscope.api_key = self.api_key
    
    def get_default_settings(self) -> Dict[str, Any]:
        """获取默认语音设置"""
        return {
            'voice': 'Ethan',
            'speed': 1.0,
            'volume': 0,
            'format': 'wav',
            'sample_rate': 16000,
            'model': 'qwen-tts-latest'
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
    
    def generate_audio_url(self, text: str, settings: Dict[str, Any] = None) -> str:
        """生成音频URL（不下载文件）"""
        if settings is None:
            settings = self.get_default_settings()
        
        try:
            # 使用官方文档的最新调用方式
            response = dashscope.audio.qwen_tts.SpeechSynthesizer.call(
                model=settings.get('model', 'qwen-tts-latest'),
                api_key=self.api_key,
                text=text,
                voice=settings['voice'],
                format=settings.get('format', 'wav'),
                sample_rate=settings.get('sample_rate', 16000),
                speed=settings.get('speed', 1.0),  # 添加语速参数
                volume=settings.get('volume', 0)    # 添加音量参数
            )
            
            if response.status_code == 200:
                # 获取音频URL
                audio_url = response.output.audio["url"]
                return audio_url
            else:
                raise Exception(f"API调用失败: {response.status_code} - {response.message}")
                
        except Exception as e:
            raise Exception(f"API调用异常: {str(e)}")
    
    def download_audio(self, audio_url: str, filepath: str) -> str:
        """下载音频文件"""
        try:
            audio_response = requests.get(audio_url)
            audio_response.raise_for_status()
            
            # 保存音频文件
            with open(filepath, 'wb') as f:
                f.write(audio_response.content)
            
            return filepath
        except Exception as e:
            raise Exception(f"下载音频文件失败: {str(e)}")
    
    def generate_and_save_audio(self, text: str, filepath: str, settings: Dict[str, Any] = None, 
                               progress_callback: Optional[Callable[[int, str], None]] = None) -> str:
        """生成并保存音频文件（带进度回调）"""
        # 检查文本长度，如果超过限制则分割
        max_text_length = 500  # QWEN-TTS建议的文本长度限制
        
        if len(text) <= max_text_length:
            # 文本长度在限制内，直接生成
            if progress_callback:
                progress_callback(10, "正在生成音频...")
            
            audio_url = self.generate_audio_url(text, settings)
            
            if progress_callback:
                progress_callback(50, "正在下载音频文件...")
            
            result = self.download_audio(audio_url, filepath)
            
            if progress_callback:
                progress_callback(100, "音频生成完成！")
            
            return result
        else:
            # 文本过长，需要分割处理
            return self._generate_long_text_audio(text, filepath, settings, max_text_length, progress_callback)
    
    def _generate_long_text_audio(self, text: str, filepath: str, settings: Dict[str, Any] = None, 
                                 max_length: int = 500, progress_callback: Optional[Callable[[int, str], None]] = None) -> str:
        """处理长文本的音频生成（带进度回调）"""
        try:
            if progress_callback:
                progress_callback(5, "正在分割长文本...")
            
            # 分割文本
            text_chunks = self._split_text(text, max_length)
            
            if len(text_chunks) == 1:
                # 只有一段，直接生成
                if progress_callback:
                    progress_callback(10, "正在生成音频...")
                
                audio_url = self.generate_audio_url(text_chunks[0], settings)
                
                if progress_callback:
                    progress_callback(50, "正在下载音频文件...")
                
                result = self.download_audio(audio_url, filepath)
                
                if progress_callback:
                    progress_callback(100, "音频生成完成！")
                
                return result
            
            # 多段文本，分别生成后合并
            audio_files = []
            total_chunks = len(text_chunks)
            
            for i, chunk in enumerate(text_chunks):
                # 计算当前进度
                chunk_progress = 10 + (i / total_chunks) * 70  # 10%-80%
                
                if progress_callback:
                    progress_callback(int(chunk_progress), f"正在生成第 {i+1}/{total_chunks} 段音频...")
                
                # 为每段生成临时音频文件
                temp_filename = f"{filepath}_part_{i+1}.wav"
                audio_url = self.generate_audio_url(chunk, settings)
                temp_file = self.download_audio(audio_url, temp_filename)
                audio_files.append(temp_file)
            
            if progress_callback:
                progress_callback(85, "正在合并音频文件...")
            
            # 合并音频文件
            merged_file = self._merge_audio_files(audio_files, filepath)
            
            if progress_callback:
                progress_callback(95, "正在清理临时文件...")
            
            # 清理临时文件
            for temp_file in audio_files:
                try:
                    os.remove(temp_file)
                except:
                    pass
            
            if progress_callback:
                progress_callback(100, "音频生成完成！")
            
            return merged_file
            
        except Exception as e:
            raise Exception(f"长文本音频生成失败: {str(e)}")
    
    def _split_text(self, text: str, max_length: int = 500) -> List[str]:
        """分割长文本为适合TTS的片段"""
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
        
        return chunks if chunks else [text]
    
    def _split_sentences(self, text: str) -> List[str]:
        """按句子分割文本"""
        import re
        # 中文句子分割：按句号、感叹号、问号、分号分割
        sentences = re.split(r'[。！？；]', text)
        return [s.strip() + '。' for s in sentences if s.strip()]
    
    def _merge_audio_files(self, audio_files: List[str], output_filepath: str) -> str:
        """合并多个音频文件"""
        try:
            # 使用简单的文件合并方式（适用于WAV格式）
            with open(output_filepath, 'wb') as outfile:
                for audio_file in audio_files:
                    with open(audio_file, 'rb') as infile:
                        # 跳过WAV文件头（除了第一个文件）
                        if audio_file != audio_files[0]:
                            # 跳过44字节的WAV文件头
                            infile.seek(44)
                        outfile.write(infile.read())
            
            return output_filepath
        except Exception as e:
            raise Exception(f"音频文件合并失败: {str(e)}")
    
    def test_connection(self) -> bool:
        """测试API连接"""
        try:
            test_text = "测试连接"
            audio_url = self.generate_audio_url(test_text)
            return True
        except Exception as e:
            return False

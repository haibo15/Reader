#!/usr/bin/env python3
"""
简化的文本转语音服务（不依赖pydub）
基于阿里巴巴通义千问-TTS API
参考：https://help.aliyun.com/zh/model-studio/qwen-tts#4d86103b5246q
"""

import os
import requests
import dashscope
from typing import Dict, Any, List
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
            # 使用默认API密钥
            self.api_key = "sk-44b0f49e114c44e79c225d6695e523cd"
    
    def get_default_settings(self) -> Dict[str, Any]:
        """获取默认语音设置"""
        return {
            'voice': 'Ethan',
            'speed': 1.0,
            'volume': 0,
            'format': 'wav',
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
    
    def generate_audio_url(self, text: str, settings: Dict[str, Any] = None) -> str:
        """生成音频URL（不下载文件）"""
        if settings is None:
            settings = self.get_default_settings()
        
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
    
    def generate_and_save_audio(self, text: str, filepath: str, settings: Dict[str, Any] = None) -> str:
        """生成并保存音频文件"""
        # 生成音频URL
        audio_url = self.generate_audio_url(text, settings)
        
        # 下载并保存音频文件
        return self.download_audio(audio_url, filepath)
    
    def test_connection(self) -> bool:
        """测试API连接"""
        try:
            test_text = "测试连接"
            audio_url = self.generate_audio_url(test_text)
            return True
        except Exception as e:
            print(f"连接测试失败: {str(e)}")
            return False

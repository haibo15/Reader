#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量生成QWEN-TTS所有角色的预览音频文件
"""

import os
import requests
import dashscope
from pathlib import Path
import time

def generate_voice_previews():
    """批量生成所有角色的预览音频"""
    
    # 所有音色列表
    voices = [
        {"name": "Chelsie", "gender": "女", "description": "女声"},
        {"name": "Cherry", "gender": "女", "description": "女声"},
        {"name": "Ethan", "gender": "男", "description": "男声"},
        {"name": "Serena", "gender": "女", "description": "女声"},
        {"name": "Dylan", "gender": "男", "description": "北京话男声"},
        {"name": "Jada", "gender": "女", "description": "吴语女声"},
        {"name": "Sunny", "gender": "女", "description": "四川话女声"}
    ]
    
    # 预览文本（简短的中文文本，适合预览）
    preview_text = "你好，我是语音助手，很高兴为您服务。"
    
    # 创建音频目录
    audio_dir = Path("audio/previews")
    audio_dir.mkdir(parents=True, exist_ok=True)
    
    # 检查API Key
    api_key = os.getenv("DASHSCOPE_API_KEY")
    if not api_key:
        print("❌ 错误：未找到DASHSCOPE_API_KEY环境变量")
        print("请设置您的API Key：")
        print("export DASHSCOPE_API_KEY='your_api_key_here'")
        return
    
    print(f"🎵 开始生成QWEN-TTS角色预览音频...")
    print(f"📁 音频将保存到：{audio_dir.absolute()}")
    print(f"📝 预览文本：{preview_text}")
    print("-" * 50)
    
    success_count = 0
    failed_count = 0
    
    for i, voice in enumerate(voices, 1):
        voice_name = voice["name"]
        voice_desc = voice["description"]
        
        print(f"[{i}/{len(voices)}] 正在生成 {voice_name} ({voice_desc}) 的预览音频...")
        
        try:
            # 调用QWEN-TTS API
            response = dashscope.audio.qwen_tts.SpeechSynthesizer.call(
                model="qwen-tts-latest",  # 使用最新版本支持所有音色
                api_key=api_key,
                text=preview_text,
                voice=voice_name,
            )
            
            if response.status_code == 200:
                audio_url = response.output.audio["url"]
                save_path = audio_dir / f"{voice_name.lower()}_preview.wav"
                
                # 下载音频文件
                audio_response = requests.get(audio_url)
                audio_response.raise_for_status()
                
                with open(save_path, 'wb') as f:
                    f.write(audio_response.content)
                
                # 获取文件大小
                file_size = len(audio_response.content)
                file_size_kb = file_size / 1024
                
                print(f"✅ 成功生成：{save_path.name} ({file_size_kb:.1f}KB)")
                success_count += 1
                
            else:
                print(f"❌ API调用失败：{response.message}")
                failed_count += 1
                
        except Exception as e:
            print(f"❌ 生成 {voice_name} 音频失败：{str(e)}")
            failed_count += 1
        
        # 添加延迟避免API限制
        if i < len(voices):
            print("⏳ 等待2秒...")
            time.sleep(2)
    
    print("-" * 50)
    print(f"🎉 批量生成完成！")
    print(f"✅ 成功：{success_count} 个")
    print(f"❌ 失败：{failed_count} 个")
    
    if success_count > 0:
        print(f"\n📁 生成的音频文件：")
        for file_path in audio_dir.glob("*_preview.wav"):
            print(f"   - {file_path.name}")
        
        print(f"\n💡 使用提示：")
        print(f"   在您的应用中，可以直接播放这些本地音频文件作为角色预览")
        print(f"   文件命名格式：角色名_preview.wav")

def check_existing_files():
    """检查已存在的预览文件"""
    audio_dir = Path("audio/previews")
    if audio_dir.exists():
        existing_files = list(audio_dir.glob("*_preview.wav"))
        if existing_files:
            print("📋 发现已存在的预览文件：")
            for file_path in existing_files:
                print(f"   - {file_path.name}")
            print()
            
            response = input("是否要重新生成所有预览文件？(y/N): ")
            if response.lower() != 'y':
                print("取消操作")
                return False
    return True

if __name__ == "__main__":
    print("🎵 QWEN-TTS 角色预览音频生成器")
    print("=" * 50)
    
    if check_existing_files():
        generate_voice_previews()
    else:
        print("操作已取消")

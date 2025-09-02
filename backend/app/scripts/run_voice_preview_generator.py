#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
运行QWEN-TTS角色预览音频生成器
"""

import os
import sys
from pathlib import Path

# 添加backend目录到Python路径，以便导入dashscope
backend_path = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_path))

# 加载环境变量
from dotenv import load_dotenv
load_dotenv()

# 导入生成器
from generate_voice_previews import generate_voice_previews

if __name__ == "__main__":
    print("🎵 启动QWEN-TTS角色预览音频生成器")
    print("=" * 50)
    
    # 检查API Key
    api_key = os.getenv("DASHSCOPE_API_KEY")
    if not api_key or api_key == "your_dashscope_api_key_here":
        print("❌ 错误：请先设置DASHSCOPE_API_KEY环境变量")
        print("\n请按以下步骤操作：")
        print("1. 复制 backend/env.example 为 backend/.env")
        print("2. 在 backend/.env 中设置您的API Key")
        print("3. 重新运行此脚本")
        sys.exit(1)
    
    # 运行生成器
    generate_voice_previews()

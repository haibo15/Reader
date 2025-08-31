#!/usr/bin/env python3
"""
Flask应用启动文件
"""

from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 导入Flask应用
from app import app

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

#!/usr/bin/env python3
"""
简单的开发启动脚本
使用Flask内置的自动重启功能
"""

import os
import sys

def main():
    """主函数"""
    print("=== 智能文本阅读器 - 开发模式 ===")
    print("Flask将自动监控文件变化并重启")
    print("按 Ctrl+C 停止服务")
    print()
    
    # 设置环境变量
    os.environ['FLASK_ENV'] = 'development'
    os.environ['FLASK_DEBUG'] = '1'
    
    # 添加当前目录到Python路径
    current_dir = os.path.dirname(os.path.abspath(__file__))
    sys.path.insert(0, current_dir)
    
    # 启动Flask应用
    try:
        from app import app
        app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=True)
    except KeyboardInterrupt:
        print("\n✅ 服务已停止")
    except Exception as e:
        print(f"❌ 启动失败: {e}")

if __name__ == '__main__':
    main()

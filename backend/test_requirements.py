#!/usr/bin/env python3
"""
测试依赖版本是否符合要求
"""

import sys
import importlib

def check_package_version(package_name, min_version=None, max_version=None):
    """检查包版本"""
    try:
        module = importlib.import_module(package_name)
        version = getattr(module, '__version__', 'unknown')
        print(f"✅ {package_name}: {version}")
        
        if min_version and version != 'unknown':
            # 简单的版本比较
            if version < min_version:
                print(f"⚠️  {package_name} 版本过低，建议 >= {min_version}")
                return False
        return True
    except ImportError:
        print(f"❌ {package_name}: 未安装")
        return False

def main():
    """主函数"""
    print("=== 依赖版本检查 ===")
    print()
    
    # 检查Python版本
    python_version = sys.version_info
    print(f"Python版本: {python_version.major}.{python_version.minor}.{python_version.micro}")
    
    if python_version.major == 3 and python_version.minor >= 8:
        print("✅ Python版本符合要求")
    else:
        print("❌ Python版本过低，需要3.8+")
        return False
    
    print()
    
    # 检查关键依赖
    packages = [
        ("flask", "2.3.3"),
        ("dashscope", "1.23.1"),  # 官方要求的最低版本
        ("requests", "2.31.0"),
        ("dotenv", "1.0.0"),  # python-dotenv的模块名是dotenv
    ]
    
    all_good = True
    for package, min_version in packages:
        if not check_package_version(package, min_version):
            all_good = False
    
    print()
    
    # 检查可选依赖
    print("可选依赖:")
    optional_packages = [
        "PyPDF2",
        "pdfplumber", 
        "ebooklib",
        "docx",  # python-docx的模块名是docx
        "pydub"
    ]
    
    for package in optional_packages:
        check_package_version(package)
    
    print()
    
    if all_good:
        print("🎉 所有必需依赖版本符合要求！")
        print("可以正常使用智能文本阅读器。")
    else:
        print("⚠️  部分依赖版本不符合要求，请运行：")
        print("pip install -r requirements.txt")
    
    return all_good

if __name__ == "__main__":
    main()

import os
import shutil
from typing import List

def ensure_directories(directories: List[str]) -> None:
    """确保目录存在，如果不存在则创建"""
    for directory in directories:
        if not os.path.exists(directory):
            os.makedirs(directory)

def clean_old_files(directory: str, max_age_hours: int = 24) -> None:
    """清理指定目录中的旧文件"""
    import time
    current_time = time.time()
    max_age_seconds = max_age_hours * 3600
    
    if not os.path.exists(directory):
        return
    
    for filename in os.listdir(directory):
        file_path = os.path.join(directory, filename)
        if os.path.isfile(file_path):
            file_age = current_time - os.path.getmtime(file_path)
            if file_age > max_age_seconds:
                try:
                    os.remove(file_path)
                except Exception as e:
                    pass

def get_file_size_mb(file_path: str) -> float:
    """获取文件大小（MB）"""
    if os.path.exists(file_path):
        size_bytes = os.path.getsize(file_path)
        return size_bytes / (1024 * 1024)
    return 0.0

def is_valid_file_extension(filename: str, allowed_extensions: List[str]) -> bool:
    """检查文件扩展名是否有效"""
    if '.' not in filename:
        return False
    extension = filename.rsplit('.', 1)[1].lower()
    return extension in allowed_extensions

def get_safe_filename(filename: str) -> str:
    """获取安全的文件名（移除特殊字符）"""
    import re
    # 移除或替换不安全的字符
    safe_filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
    return safe_filename

def format_file_size(size_bytes: int) -> str:
    """格式化文件大小显示"""
    if size_bytes == 0:
        return "0 B"
    
    size_names = ["B", "KB", "MB", "GB"]
    i = 0
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024.0
        i += 1
    
    return f"{size_bytes:.1f} {size_names[i]}"

def delete_file_and_related_audio(file_id: str, upload_folder: str, audio_folder: str) -> dict:
    """删除上传的文件及其相关的音频文件"""
    deleted_files = []
    errors = []
    
    # 删除上传的文件（包括元数据文件）
    try:
        for filename in os.listdir(upload_folder):
            if filename.startswith(file_id):
                file_path = os.path.join(upload_folder, filename)
                if os.path.exists(file_path):
                    os.remove(file_path)
                    deleted_files.append(f"上传文件: {filename}")
    except Exception as e:
        errors.append(f"删除上传文件失败: {str(e)}")
    
    # 删除相关的音频文件
    try:
        for filename in os.listdir(audio_folder):
            if filename.startswith(file_id):
                audio_path = os.path.join(audio_folder, filename)
                if os.path.exists(audio_path):
                    os.remove(audio_path)
                    deleted_files.append(f"音频文件: {filename}")
    except Exception as e:
        errors.append(f"删除音频文件失败: {str(e)}")
    
    return {
        'deleted_files': deleted_files,
        'errors': errors,
        'success': len(errors) == 0
    }

#!/usr/bin/env python3
"""
文件上传相关路由
"""

import os
import uuid
import json
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename

from app.services.file_processor import FileProcessor

# 创建蓝图
upload_bp = Blueprint('upload', __name__)

# 允许的文件扩展名
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'epub', 'docx'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# 初始化文件处理器
file_processor = FileProcessor()

@upload_bp.route('/upload', methods=['POST'])
def upload_file():
    """上传文件接口"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': '没有文件被上传'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': '没有选择文件'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': '不支持的文件格式'}), 400
        
        # 获取配置
        from app import app
        upload_folder = app.config['UPLOAD_FOLDER']
        
        # 生成唯一文件名
        file_id = str(uuid.uuid4())
        original_filename = file.filename
        
        # 从原始文件名获取扩展名，避免secure_filename处理后丢失
        if '.' in original_filename:
            file_extension = original_filename.rsplit('.', 1)[1].lower()
        else:
            return jsonify({'error': '文件没有扩展名'}), 400
            
        new_filename = f"{file_id}.{file_extension}"
        
        # 保存文件
        file_path = os.path.join(upload_folder, new_filename)
        file.save(file_path)
        
        # 保存原始文件名到元数据文件
        metadata_file = os.path.join(upload_folder, f"{file_id}.meta")
        try:
            with open(metadata_file, 'w', encoding='utf-8') as f:
                f.write(original_filename)
        except Exception:
            pass  # 元数据保存失败不影响主要功能
        
        # 解析文件内容
        text_content = file_processor.extract_text(file_path, file_extension)
        chapters = file_processor.split_chapters(text_content)
        
        # 保存章节数据到JSON文件
        chapters_file = os.path.join(upload_folder, f"{file_id}_chapters.json")
        try:
            with open(chapters_file, 'w', encoding='utf-8') as f:
                json.dump({
                    'file_id': file_id,
                    'original_filename': original_filename,
                    'file_extension': file_extension,
                    'total_text_length': len(text_content),
                    'chapters': chapters
                }, f, ensure_ascii=False, indent=2)
        except Exception:
            pass  # 章节数据保存失败不影响主要功能
        
        return jsonify({
            'file_id': file_id,
            'filename': original_filename,
            'chapters': chapters,
            'total_chapters': len(chapters),
            'text_extraction_success': True,
            'total_text_length': len(text_content),
            'message': f'文档上传成功！成功提取 {len(text_content)} 字符文本，分为 {len(chapters)} 个章节。'
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

#!/usr/bin/env python3
"""
文档管理相关路由
"""

import os
import json
from flask import Blueprint, request, jsonify

from app.services.file_processor import FileProcessor
from app.utils.file_utils import delete_file_and_related_audio

# 创建蓝图
document_bp = Blueprint('document', __name__)

# 初始化文件处理器
file_processor = FileProcessor()

@document_bp.route('/document-history')
def get_document_history():
    """获取文档历史记录"""
    try:
        documents = []
        from app import app
        upload_folder = app.config['UPLOAD_FOLDER']
        
        if os.path.exists(upload_folder):
            for filename in os.listdir(upload_folder):
                if filename.endswith('.meta'):
                    file_id = filename.replace('.meta', '')
                    
                    # 读取原始文件名
                    meta_file = os.path.join(upload_folder, filename)
                    try:
                        with open(meta_file, 'r', encoding='utf-8') as f:
                            original_filename = f.read().strip()
                    except:
                        original_filename = "未知文件"
                    
                    # 检查是否有章节数据
                    chapters_file = os.path.join(upload_folder, f"{file_id}_chapters.json")
                    chapters_info = None
                    if os.path.exists(chapters_file):
                        try:
                            with open(chapters_file, 'r', encoding='utf-8') as f:
                                chapters_data = json.load(f)
                                chapters_info = {
                                    'total_chapters': len(chapters_data['chapters']),
                                    'total_text_length': chapters_data['total_text_length']
                                }
                        except:
                            pass
                    
                    documents.append({
                        'file_id': file_id,
                        'filename': original_filename,
                        'chapters_info': chapters_info
                    })
        
        return jsonify({'documents': documents})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@document_bp.route('/document-chapters/<file_id>')
def get_document_chapters(file_id):
    """获取文档的章节信息"""
    try:
        from app import app
        chapters_file = os.path.join(app.config['UPLOAD_FOLDER'], f"{file_id}_chapters.json")
        
        if not os.path.exists(chapters_file):
            return jsonify({'error': '章节数据不存在'}), 404
        
        with open(chapters_file, 'r', encoding='utf-8') as f:
            chapters_data = json.load(f)
        
        return jsonify(chapters_data)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@document_bp.route('/load-document/<file_id>')
def load_document(file_id):
    """加载指定的文档"""
    try:
        from app import app
        upload_folder = app.config['UPLOAD_FOLDER']
        audio_folder = app.config['AUDIO_FOLDER']
        
        # 查找对应的文件
        file_path = None
        original_filename = None
        
        for filename in os.listdir(upload_folder):
            if filename.startswith(file_id) and '.' in filename and not filename.endswith('.meta'):
                file_path = os.path.join(upload_folder, filename)
                original_filename = filename
                break
        
        if not file_path:
            return jsonify({'error': '文档不存在'}), 404
        
        # 解析文件内容
        file_extension = file_path.rsplit('.', 1)[1].lower()
        text_content = file_processor.extract_text(file_path, file_extension)
        chapters = file_processor.split_chapters(text_content)
        
        # 查找相关的音频文件
        audio_files = []
        if os.path.exists(audio_folder):
            for audio_file in os.listdir(audio_folder):
                if audio_file.startswith(file_id) and audio_file.endswith('.wav'):
                    # 从文件名中提取章节信息
                    if '_chapter_' in audio_file:
                        try:
                            chapter_part = audio_file.split('_chapter_')[1]
                            chapter_index = int(chapter_part.split('.')[0]) - 1
                            if chapter_index < len(chapters):
                                audio_files.append({
                                    'chapter_index': chapter_index,
                                    'chapter_title': chapters[chapter_index]['title'],
                                    'audio_file': audio_file
                                })
                        except (ValueError, IndexError):
                            pass
        
        # 尝试读取原始文件名
        display_name = original_filename
        metadata_file = os.path.join(upload_folder, f"{file_id}.meta")
        if os.path.exists(metadata_file):
            try:
                with open(metadata_file, 'r', encoding='utf-8') as f:
                    display_name = f.read().strip()
            except Exception:
                pass
        
        return jsonify({
            'file_id': file_id,
            'filename': original_filename,
            'display_name': display_name,
            'chapters': chapters,
            'total_chapters': len(chapters),
            'audio_files': audio_files
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@document_bp.route('/delete-file', methods=['DELETE'])
def delete_file():
    """删除上传的文件及其相关音频文件"""
    try:
        data = request.json
        file_id = data.get('file_id')
        
        if not file_id:
            return jsonify({'error': '缺少文件ID'}), 400
        
        # 删除文件及其相关音频
        from app import app
        result = delete_file_and_related_audio(
            file_id, 
            app.config['UPLOAD_FOLDER'], 
            app.config['AUDIO_FOLDER']
        )
        
        if result['success']:
            return jsonify({
                'message': '文件删除成功',
                'deleted_files': result['deleted_files']
            })
        else:
            return jsonify({
                'error': '删除文件时出现错误',
                'errors': result['errors'],
                'deleted_files': result['deleted_files']
            }), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@document_bp.route('/health')
def health_check():
    """健康检查接口"""
    return jsonify({'status': 'healthy', 'message': '服务运行正常'})

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
        audio_folder = app.config['AUDIO_FOLDER']
        
        if os.path.exists(upload_folder):
            # 先扫描新结构：uploads/{file_id}/
            for file_id in os.listdir(upload_folder):
                folder_path = os.path.join(upload_folder, file_id)
                if not os.path.isdir(folder_path):
                    continue
                meta_file = os.path.join(folder_path, f"{file_id}.meta")
                if not os.path.exists(meta_file):
                    continue
                # 读取原始文件名
                try:
                    with open(meta_file, 'r', encoding='utf-8') as f:
                        original_filename = f.read().strip()
                except:
                    original_filename = "未知文件"
                # 原始文件与时间
                original_file_path = None
                for file in os.listdir(folder_path):
                    if file.startswith(file_id) and '.' in file and not file.endswith('.meta') and not file.endswith('_chapters.json'):
                        original_file_path = os.path.join(folder_path, file)
                        break
                file_size = 0
                upload_time = 0
                if original_file_path and os.path.exists(original_file_path):
                    file_size = os.path.getsize(original_file_path)
                    upload_time = os.path.getmtime(original_file_path)
                # 章节统计
                chapters_file = os.path.join(folder_path, f"{file_id}_chapters.json")
                chapter_count = 0
                if os.path.exists(chapters_file):
                    try:
                        with open(chapters_file, 'r', encoding='utf-8') as f:
                            chapters_data = json.load(f)
                            chapter_count = len(chapters_data['chapters'])
                    except:
                        pass
                # 音频数量（新结构：audio/{file_id}/）
                audio_count = 0
                has_audio = False
                audio_subdir = os.path.join(audio_folder, file_id)
                if os.path.isdir(audio_subdir):
                    for audio_file in os.listdir(audio_subdir):
                        if audio_file.endswith('.wav'):
                            audio_count += 1
                            has_audio = True
                documents.append({
                    'file_id': file_id,
                    'original_name': original_filename,
                    'upload_time': upload_time,
                    'file_size': file_size,
                    'chapter_count': chapter_count,
                    'audio_count': audio_count,
                    'has_audio': has_audio
                })

            # 再扫描旧结构：.meta 在 uploads 根目录
            for filename in os.listdir(upload_folder):
                if filename.endswith('.meta'):
                    file_id = filename.replace('.meta', '')
                    # 若已在新结构中处理，跳过
                    if os.path.isdir(os.path.join(upload_folder, file_id)):
                        continue
                    meta_file = os.path.join(upload_folder, filename)
                    try:
                        with open(meta_file, 'r', encoding='utf-8') as f:
                            original_filename = f.read().strip()
                    except:
                        original_filename = "未知文件"
                    original_file_path = None
                    for file in os.listdir(upload_folder):
                        if file.startswith(file_id) and '.' in file and not file.endswith('.meta') and not file.endswith('_chapters.json'):
                            original_file_path = os.path.join(upload_folder, file)
                            break
                    file_size = 0
                    upload_time = 0
                    if original_file_path and os.path.exists(original_file_path):
                        file_size = os.path.getsize(original_file_path)
                        upload_time = os.path.getmtime(original_file_path)
                    chapters_file = os.path.join(upload_folder, f"{file_id}_chapters.json")
                    chapter_count = 0
                    if os.path.exists(chapters_file):
                        try:
                            with open(chapters_file, 'r', encoding='utf-8') as f:
                                chapters_data = json.load(f)
                                chapter_count = len(chapters_data['chapters'])
                        except:
                            pass
                    audio_count = 0
                    has_audio = False
                    audio_subdir = os.path.join(audio_folder, file_id)
                    if os.path.isdir(audio_subdir):
                        for audio_file in os.listdir(audio_subdir):
                            if audio_file.endswith('.wav'):
                                audio_count += 1
                                has_audio = True
                    else:
                        for audio_file in os.listdir(audio_folder):
                            if audio_file.startswith(file_id) and audio_file.endswith('.wav'):
                                audio_count += 1
                                has_audio = True
                    documents.append({
                        'file_id': file_id,
                        'original_name': original_filename,
                        'upload_time': upload_time,
                        'file_size': file_size,
                        'chapter_count': chapter_count,
                        'audio_count': audio_count,
                        'has_audio': has_audio
                    })
        
        return jsonify({'documents': documents})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@document_bp.route('/document-chapters/<file_id>')
def get_document_chapters(file_id):
    """获取文档的章节信息"""
    try:
        from app import app
        chapters_file_new = os.path.join(app.config['UPLOAD_FOLDER'], file_id, f"{file_id}_chapters.json")
        chapters_file = chapters_file_new if os.path.exists(chapters_file_new) else os.path.join(app.config['UPLOAD_FOLDER'], f"{file_id}_chapters.json")
        
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
        
        # 新结构优先
        new_dir = os.path.join(upload_folder, file_id)
        if os.path.isdir(new_dir):
            for filename in os.listdir(new_dir):
                if filename.startswith(file_id) and '.' in filename and not filename.endswith('.meta') and not filename.endswith('_chapters.json'):
                    file_path = os.path.join(new_dir, filename)
                    original_filename = filename
                    break
        if not file_path:
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
        metadata_file_new = os.path.join(new_dir, f"{file_id}.meta")
        metadata_file = metadata_file_new if os.path.exists(metadata_file_new) else os.path.join(upload_folder, f"{file_id}.meta")
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

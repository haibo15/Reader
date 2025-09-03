#!/usr/bin/env python3
"""
音频管理相关路由
处理音频文件的管理、状态查询等功能
"""

import os
import json
from flask import Blueprint, request, jsonify, send_from_directory
from app.services.audio_service import AudioService

audio_management_bp = Blueprint('audio_management', __name__)

# 全局音频服务实例
audio_service = None

def get_audio_service():
    """获取音频服务实例"""
    global audio_service
    if audio_service is None:
        from app import app
        audio_service = AudioService(app)
    return audio_service

@audio_management_bp.route('/audio-files')
def get_all_audio_files():
    """获取所有音频文件列表"""
    try:
        from app import app
        upload_folder = app.config['UPLOAD_FOLDER']
        audio_folder = app.config['AUDIO_FOLDER']
        
        audio_files = []
        
        if os.path.exists(upload_folder):
            # 扫描所有文档文件夹
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
                
                # 获取文件大小和上传时间
                original_file_path = None
                file_size = 0
                upload_time = 0
                for file in os.listdir(folder_path):
                    if file.startswith(file_id) and '.' in file and not file.endswith('.meta') and not file.endswith('_chapters.json'):
                        original_file_path = os.path.join(folder_path, file)
                        break
                
                if original_file_path and os.path.exists(original_file_path):
                    file_size = os.path.getsize(original_file_path)
                    upload_time = os.path.getmtime(original_file_path)
                
                # 获取章节信息
                chapters_file = os.path.join(folder_path, f"{file_id}_chapters.json")
                chapter_count = 0
                if os.path.exists(chapters_file):
                    try:
                        with open(chapters_file, 'r', encoding='utf-8') as f:
                            chapters_data = json.load(f)
                            chapter_count = len(chapters_data['chapters'])
                    except:
                        pass
                
                # 获取音频文件信息
                audio_count = 0
                total_size = 0
                status = 'pending'
                audio_subdir = os.path.join(audio_folder, file_id)
                
                if os.path.isdir(audio_subdir):
                    for audio_file in os.listdir(audio_subdir):
                        if audio_file.endswith('.wav'):
                            audio_count += 1
                            audio_file_path = os.path.join(audio_subdir, audio_file)
                            if os.path.exists(audio_file_path):
                                total_size += os.path.getsize(audio_file_path)
                    
                    if audio_count > 0:
                        status = 'completed'
                
                # 只返回有音频文件的文档
                if audio_count > 0:
                    audio_files.append({
                        'file_id': file_id,
                        'original_name': original_filename,
                        'status': status,
                        'chapter_count': chapter_count,
                        'audio_count': audio_count,
                        'total_size': total_size,
                        'created_at': upload_time
                    })
        
        # 按创建时间倒序排列
        audio_files.sort(key=lambda x: x['created_at'], reverse=True)
        
        return jsonify(audio_files)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@audio_management_bp.route('/audio-files/<file_id>')
def get_audio_files(file_id):
    """获取指定文件的音频文件列表"""
    try:
        service = get_audio_service()
        audio_files = service.get_existing_audio_files(file_id)
        return jsonify({'audio_files': audio_files})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@audio_management_bp.route('/audio-versions/<file_id>')
def get_all_audio_versions(file_id):
    """获取指定文件的所有音频版本"""
    try:
        service = get_audio_service()
        audio_versions = service.get_all_audio_versions(file_id)
        return jsonify({'audio_versions': audio_versions})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@audio_management_bp.route('/merged-audio-versions/<file_id>')
def get_merged_audio_versions(file_id):
    """获取指定文件的所有合并音频版本"""
    try:
        service = get_audio_service()
        merged_versions = service.get_merged_audio_versions(file_id)
        return jsonify({'merged_versions': merged_versions})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@audio_management_bp.route('/delete-audio/<file_id>/<filename>', methods=['DELETE'])
def delete_audio_file(file_id, filename):
    """删除指定的音频文件"""
    try:
        service = get_audio_service()
        result = service.delete_audio_file(file_id, filename)
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@audio_management_bp.route('/check-audio-status/<file_id>')
def check_audio_status(file_id):
    """检查指定文件的音频生成状态"""
    try:
        service = get_audio_service()
        status = service.check_audio_status(file_id)
        return jsonify(status)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@audio_management_bp.route('/download/<file_id>/<filename>')
def download_audio(file_id, filename):
    """下载音频文件"""
    service = get_audio_service()
    audio_folder = service.get_audio_folder_for_file(file_id)
    return send_from_directory(audio_folder, filename)

@audio_management_bp.route('/merge-audio/<file_id>', methods=['GET', 'POST'])
def merge_audio_files(file_id):
    """合并指定文档的音频文件"""
    try:
        service = get_audio_service()
        
        # 支持POST请求传递选中章节参数
        selected_chapters = None
        selected_audio_versions = None
        if request.method == 'POST':
            data = request.json or {}
            selected_chapters = data.get('selected_chapters')
            selected_audio_versions = data.get('selected_audio_versions')
        
        result = service.merge_audio_files(file_id, selected_chapters, selected_audio_versions)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@audio_management_bp.route('/download-complete/<file_id>')
def download_complete_audio(file_id):
    """下载完整的合并音频文件"""
    try:
        service = get_audio_service()
        
        # 检查是否存在合并文件（不再自动合并）
        merged_path = service.get_merged_audio_path(file_id)
        
        if merged_path:
            audio_folder = service.get_audio_folder_for_file(file_id)
            # 使用实际存在的最新合并文件名返回
            import os
            merged_filename = os.path.basename(merged_path)
            return send_from_directory(audio_folder, merged_filename, as_attachment=True)
        else:
            return jsonify({'error': '未找到合并文件，请先使用“合并选中章节”生成'}), 404
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

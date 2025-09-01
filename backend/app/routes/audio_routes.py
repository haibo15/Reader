#!/usr/bin/env python3
"""
音频生成相关路由
"""

from flask import Blueprint, request, jsonify, send_from_directory
from app.services.audio_service import AudioService

audio_bp = Blueprint('audio', __name__)

# 全局音频服务实例
audio_service = None

def get_audio_service():
    """获取音频服务实例"""
    global audio_service
    if audio_service is None:
        from app import app
        audio_service = AudioService(app)
    return audio_service

@audio_bp.route('/generate-audio', methods=['POST'])
def generate_audio():
    """生成音频接口"""
    try:
        data = request.json
        file_id = data.get('file_id')
        chapter_index = data.get('chapter_index', -1)  # -1表示生成全部
        voice_settings = data.get('voice_settings', {})
        
        service = get_audio_service()
        audio_files = service.generate_audio_simple(file_id, chapter_index, voice_settings)
        
        return jsonify({
            'file_id': file_id,
            'audio_files': audio_files
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@audio_bp.route('/generate-audio-progress', methods=['POST'])
def generate_audio_with_progress():
    """生成音频接口（带进度跟踪）"""
    try:
        data = request.json
        file_id = data.get('file_id')
        chapter_index = data.get('chapter_index', -1)  # -1表示生成全部
        voice_settings = data.get('voice_settings', {})
        
        service = get_audio_service()
        task_id = service.generate_audio_with_progress(file_id, chapter_index, voice_settings)
        
        return jsonify({
            'task_id': task_id,
            'file_id': file_id
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@audio_bp.route('/progress/<task_id>')
def get_progress(task_id):
    """获取进度信息"""
    service = get_audio_service()
    progress = service.get_progress(task_id)
    
    if progress:
        return jsonify(progress)
    else:
        return jsonify({'error': '任务不存在'}), 404

@audio_bp.route('/download/<file_id>/<filename>')
def download_audio(file_id, filename):
    """下载音频文件"""
    service = get_audio_service()
    audio_folder = service.get_audio_folder_for_file(file_id)
    return send_from_directory(audio_folder, filename)

@audio_bp.route('/audio-files/<file_id>')
def get_audio_files(file_id):
    """获取指定文件的音频文件列表"""
    try:
        service = get_audio_service()
        audio_files = service.get_existing_audio_files(file_id)
        return jsonify({'audio_files': audio_files})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@audio_bp.route('/check-audio-status/<file_id>')
def check_audio_status(file_id):
    """检查指定文件的音频生成状态"""
    try:
        service = get_audio_service()
        status = service.check_audio_status(file_id)
        return jsonify(status)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@audio_bp.route('/merge-audio/<file_id>', methods=['GET', 'POST'])
def merge_audio_files(file_id):
    """合并指定文档的音频文件"""
    try:
        service = get_audio_service()
        
        # 支持POST请求传递选中章节参数
        selected_chapters = None
        if request.method == 'POST':
            data = request.json or {}
            selected_chapters = data.get('selected_chapters')
        
        result = service.merge_audio_files(file_id, selected_chapters)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@audio_bp.route('/download-complete/<file_id>')
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

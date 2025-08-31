#!/usr/bin/env python3
"""
音频生成相关路由
处理音频生成、进度跟踪等功能
"""

from flask import Blueprint, request, jsonify
from app.services.audio_service import AudioService

audio_generation_bp = Blueprint('audio_generation', __name__)

# 全局音频服务实例
audio_service = None

def get_audio_service():
    """获取音频服务实例"""
    global audio_service
    if audio_service is None:
        from app import app
        audio_service = AudioService(app)
    return audio_service

@audio_generation_bp.route('/generate-audio', methods=['POST'])
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

@audio_generation_bp.route('/generate-audio-progress', methods=['POST'])
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

@audio_generation_bp.route('/progress/<task_id>')
def get_progress(task_id):
    """获取进度信息"""
    service = get_audio_service()
    progress = service.get_progress(task_id)
    
    if progress:
        return jsonify(progress)
    else:
        return jsonify({'error': '任务不存在'}), 404

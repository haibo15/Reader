#!/usr/bin/env python3
"""
音频管理相关路由
处理音频文件的管理、状态查询等功能
"""

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

@audio_management_bp.route('/audio-files/<file_id>')
def get_audio_files(file_id):
    """获取指定文件的音频文件列表"""
    try:
        service = get_audio_service()
        audio_files = service.get_existing_audio_files(file_id)
        return jsonify({'audio_files': audio_files})
    
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

@audio_management_bp.route('/merge-audio/<file_id>')
def merge_audio_files(file_id):
    """合并指定文档的所有音频文件"""
    try:
        service = get_audio_service()
        result = service.merge_audio_files(file_id)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@audio_management_bp.route('/download-complete/<file_id>')
def download_complete_audio(file_id):
    """下载完整的合并音频文件"""
    try:
        service = get_audio_service()
        
        # 检查是否存在合并文件
        merged_path = service.get_merged_audio_path(file_id)
        
        if not merged_path:
            # 如果不存在，先合并
            service.merge_audio_files(file_id)
            merged_path = service.get_merged_audio_path(file_id)
        
        if merged_path:
            audio_folder = service.get_audio_folder_for_file(file_id)
            # 使用实际存在的最新合并文件名返回
            import os
            merged_filename = os.path.basename(merged_path)
            return send_from_directory(audio_folder, merged_filename, as_attachment=True)
        else:
            return jsonify({'error': '合并音频文件失败'}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

#!/usr/bin/env python3
"""
音频生成相关路由
"""

import os
import json
from flask import Blueprint, request, jsonify, send_file

from app.services.text_to_speech_simple import SimpleTextToSpeechService
from app.services.file_processor import FileProcessor

# 创建蓝图
audio_bp = Blueprint('audio', __name__)

# 初始化服务
file_processor = FileProcessor()
tts_service = None

def get_tts_service():
    """获取TTS服务实例"""
    global tts_service
    if tts_service is None:
        try:
            tts_service = SimpleTextToSpeechService()
        except Exception as e:
            raise
    return tts_service

@audio_bp.route('/generate-audio', methods=['POST'])
def generate_audio():
    """生成音频接口"""
    try:
        data = request.json
        file_id = data.get('file_id')
        chapter_index = data.get('chapter_index', -1)  # -1表示生成全部
        voice_settings = data.get('voice_settings', {})
        

        
        # 获取配置
        from app import app
        upload_folder = app.config['UPLOAD_FOLDER']
        audio_folder = app.config['AUDIO_FOLDER']
        
        # 获取文件路径
        file_path = None
        for filename in os.listdir(upload_folder):
            if filename.startswith(file_id):
                file_path = os.path.join(upload_folder, filename)
                break
        
        if not file_path:
            return jsonify({'error': '文件不存在'}), 404
        
        # 尝试读取保存的章节数据
        chapters_file = os.path.join(upload_folder, f"{file_id}_chapters.json")
        chapters = None
        
        if os.path.exists(chapters_file):
            try:
                with open(chapters_file, 'r', encoding='utf-8') as f:
                    chapters_data = json.load(f)
                    chapters = chapters_data['chapters']
            except Exception as e:
                chapters = None
        
        # 如果没有保存的章节数据，重新解析文件
        if chapters is None:
            file_extension = file_path.rsplit('.', 1)[1].lower()
            
            try:
                text_content = file_processor.extract_text(file_path, file_extension)
            except Exception as e:
                return jsonify({'error': f'文本提取失败: {str(e)}'}), 500
            
            try:
                chapters = file_processor.split_chapters(text_content)
            except Exception as e:
                return jsonify({'error': f'章节分割失败: {str(e)}'}), 500
        
        # 生成音频
        if chapter_index == -1:
            # 生成全部章节
            audio_files = []
            total_chapters = len(chapters)
            
            for i, chapter in enumerate(chapters):
                try:
                    audio_filename = f"{file_id}_chapter_{i+1}.wav"
                    audio_filepath = os.path.join(audio_folder, audio_filename)
                    
                    # 使用简化的TTS服务
                    tts_service = get_tts_service() # 确保服务已初始化
                    tts_service.generate_and_save_audio(
                        chapter['content'], 
                        audio_filepath,
                        voice_settings
                    )
                    
                    audio_files.append({
                        'chapter_index': i,
                        'chapter_title': chapter['title'],
                        'audio_file': audio_filename
                    })
                    
                except Exception as e:
                    return jsonify({'error': f'第 {i+1} 章节音频生成失败: {str(e)}'}), 500
        else:
            # 生成单个章节
            if chapter_index >= len(chapters):
                return jsonify({'error': '章节索引超出范围'}), 400
            
            chapter = chapters[chapter_index]
            audio_filename = f"{file_id}_chapter_{chapter_index+1}.wav"
            audio_filepath = os.path.join(audio_folder, audio_filename)
            
            try:
                # 使用简化的TTS服务
                tts_service = get_tts_service() # 确保服务已初始化
                tts_service.generate_and_save_audio(
                    chapter['content'],
                    audio_filepath,
                    voice_settings
                )
                audio_files = [{
                    'chapter_index': chapter_index,
                    'chapter_title': chapter['title'],
                    'audio_file': audio_filename
                }]
                
            except Exception as e:
                return jsonify({'error': f'音频生成失败: {str(e)}'}), 500
        
        return jsonify({
            'file_id': file_id,
            'audio_files': audio_files
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@audio_bp.route('/download/<filename>')
def download_audio(filename):
    """下载音频文件"""
    try:
        from app import app
        file_path = os.path.join(app.config['AUDIO_FOLDER'], filename)
        if os.path.exists(file_path):
            return send_file(file_path, as_attachment=True)
        else:
            return jsonify({'error': '文件不存在'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@audio_bp.route('/test-voice', methods=['POST'])
def test_voice():
    """测试语音接口"""
    try:
        data = request.json
        voice_name = data.get('voice')
        voice_settings = data.get('voice_settings', {})
        
        if not voice_name:
            return jsonify({'error': '缺少语音名称'}), 400
        
        # 测试文本
        test_text = "您好，这是语音测试。我正在为您演示不同的语音效果，您可以听到我的声音特点。"
        
        # 生成测试音频文件名
        from app import app
        test_filename = f"test_{voice_name}.wav"
        test_filepath = os.path.join(app.config['AUDIO_FOLDER'], test_filename)
        
        # 使用简化的TTS服务生成测试音频
        tts_service = get_tts_service() # 确保服务已初始化
        tts_service.generate_and_save_audio(
            test_text,
            test_filepath,
            voice_settings
        )
        
        return jsonify({
            'success': True,
            'audio_file': test_filename,
            'message': '测试音频生成成功'
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

#!/usr/bin/env python3
"""
路由定义
"""

import os
from flask import request, jsonify, send_file
from werkzeug.utils import secure_filename
import uuid
import json

from app.services.file_processor import FileProcessor
from app.services.text_to_speech_simple import SimpleTextToSpeechService
from app.utils.file_utils import ensure_directories, delete_file_and_related_audio

# 配置
from app import app

# 获取项目根目录（backend的父目录）
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(current_dir))

app.config['UPLOAD_FOLDER'] = os.getenv('UPLOAD_FOLDER', os.path.join(project_root, 'uploads'))
app.config['AUDIO_FOLDER'] = os.getenv('AUDIO_FOLDER', os.path.join(project_root, 'audio'))
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB限制

# 允许的文件扩展名
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'epub', 'docx'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# 确保必要的目录存在
ensure_directories([app.config['UPLOAD_FOLDER'], app.config['AUDIO_FOLDER']])

# 初始化服务
file_processor = FileProcessor()
tts_service = SimpleTextToSpeechService()

@app.route('/api/upload', methods=['POST'])
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
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], new_filename)
        file.save(file_path)
        
        # 保存原始文件名到元数据文件
        metadata_file = os.path.join(app.config['UPLOAD_FOLDER'], f"{file_id}.meta")
        try:
            with open(metadata_file, 'w', encoding='utf-8') as f:
                f.write(original_filename)
        except Exception:
            pass  # 元数据保存失败不影响主要功能
        
        # 解析文件内容
        text_content = file_processor.extract_text(file_path, file_extension)
        chapters = file_processor.split_chapters(text_content)
        
        return jsonify({
            'file_id': file_id,
            'filename': original_filename,
            'chapters': chapters,
            'total_chapters': len(chapters)
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate-audio', methods=['POST'])
def generate_audio():
    """生成音频接口"""
    try:
        data = request.json
        file_id = data.get('file_id')
        chapter_index = data.get('chapter_index', -1)  # -1表示生成全部
        voice_settings = data.get('voice_settings', {})
        
        # 获取文件路径
        file_path = None
        for filename in os.listdir(app.config['UPLOAD_FOLDER']):
            if filename.startswith(file_id):
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                break
        
        if not file_path:
            return jsonify({'error': '文件不存在'}), 404
        
        # 重新解析文件
        file_extension = file_path.rsplit('.', 1)[1].lower()
        text_content = file_processor.extract_text(file_path, file_extension)
        chapters = file_processor.split_chapters(text_content)
        
        # 生成音频
        if chapter_index == -1:
            # 生成全部章节
            audio_files = []
            for i, chapter in enumerate(chapters):
                audio_filename = f"{file_id}_chapter_{i+1}.wav"
                audio_filepath = os.path.join(app.config['AUDIO_FOLDER'], audio_filename)
                
                # 使用简化的TTS服务
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
        else:
            # 生成单个章节
            if chapter_index >= len(chapters):
                return jsonify({'error': '章节索引超出范围'}), 400
            
            chapter = chapters[chapter_index]
            audio_filename = f"{file_id}_chapter_{chapter_index+1}.wav"
            audio_filepath = os.path.join(app.config['AUDIO_FOLDER'], audio_filename)
            
            # 使用简化的TTS服务
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
        
        return jsonify({
            'file_id': file_id,
            'audio_files': audio_files
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/download/<filename>')
def download_audio(filename):
    """下载音频文件"""
    try:
        file_path = os.path.join(app.config['AUDIO_FOLDER'], filename)
        if os.path.exists(file_path):
            return send_file(file_path, as_attachment=True)
        else:
            return jsonify({'error': '文件不存在'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/delete-file', methods=['DELETE'])
def delete_file():
    """删除上传的文件及其相关音频文件"""
    try:
        data = request.json
        file_id = data.get('file_id')
        
        if not file_id:
            return jsonify({'error': '缺少文件ID'}), 400
        
        # 删除文件及其相关音频
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

@app.route('/api/test-voice', methods=['POST'])
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
        test_filename = f"test_{voice_name}.wav"
        test_filepath = os.path.join(app.config['AUDIO_FOLDER'], test_filename)
        
        # 使用简化的TTS服务生成测试音频
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

@app.route('/api/document-history')
def get_document_history():
    """获取文档历史记录"""
    try:
        documents = []
        
        # 扫描上传文件夹中的所有文件
        for filename in os.listdir(app.config['UPLOAD_FOLDER']):
            if os.path.isfile(os.path.join(app.config['UPLOAD_FOLDER'], filename)) and not filename.endswith('.meta'):
                # 从文件名中提取信息
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file_stats = os.stat(file_path)
                file_id = filename.rsplit('.', 1)[0]
                
                # 尝试读取原始文件名
                original_name = filename
                metadata_file = os.path.join(app.config['UPLOAD_FOLDER'], f"{file_id}.meta")
                if os.path.exists(metadata_file):
                    try:
                        with open(metadata_file, 'r', encoding='utf-8') as f:
                            original_name = f.read().strip()
                    except Exception:
                        pass
                
                # 尝试解析文件内容获取章节信息
                try:
                    file_extension = filename.rsplit('.', 1)[1].lower()
                    text_content = file_processor.extract_text(file_path, file_extension)
                    chapters = file_processor.split_chapters(text_content)
                    chapter_count = len(chapters)
                except Exception:
                    chapter_count = 0
                
                # 检查是否有对应的音频文件
                file_id = filename.rsplit('.', 1)[0]
                audio_files = []
                if os.path.exists(app.config['AUDIO_FOLDER']):
                    for audio_file in os.listdir(app.config['AUDIO_FOLDER']):
                        if audio_file.startswith(file_id) and audio_file.endswith('.wav'):
                            audio_files.append(audio_file)
                
                documents.append({
                    'file_id': file_id,
                    'filename': filename,
                    'original_name': original_name,
                    'upload_time': file_stats.st_mtime,
                    'file_size': file_stats.st_size,
                    'chapter_count': chapter_count,
                    'audio_count': len(audio_files),
                    'has_audio': len(audio_files) > 0
                })
        
        # 按上传时间倒序排列
        documents.sort(key=lambda x: x['upload_time'], reverse=True)
        
        return jsonify({
            'success': True,
            'documents': documents
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/load-document/<file_id>')
def load_document(file_id):
    """加载指定的文档"""
    try:
        # 查找对应的文件
        file_path = None
        original_filename = None
        
        for filename in os.listdir(app.config['UPLOAD_FOLDER']):
            if filename.startswith(file_id) and '.' in filename and not filename.endswith('.meta'):
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
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
        if os.path.exists(app.config['AUDIO_FOLDER']):
            for audio_file in os.listdir(app.config['AUDIO_FOLDER']):
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
        metadata_file = os.path.join(app.config['UPLOAD_FOLDER'], f"{file_id}.meta")
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

@app.route('/api/health')
def health_check():
    """健康检查接口"""
    return jsonify({'status': 'healthy', 'message': '服务运行正常'})

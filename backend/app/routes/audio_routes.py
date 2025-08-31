#!/usr/bin/env python3
"""
音频生成相关路由
"""

import os
import json
import time
from flask import Blueprint, request, jsonify, send_from_directory, Response
from app.services.file_processor import FileProcessor
from app.services.text_to_speech_simple import SimpleTextToSpeechService

audio_bp = Blueprint('audio', __name__)

# 全局变量存储进度信息
progress_data = {}

# 初始化文件处理器
file_processor = FileProcessor()

def get_tts_service():
    """获取TTS服务实例"""
    try:
        return SimpleTextToSpeechService()
    except Exception as e:
        raise Exception(f"TTS服务初始化失败: {str(e)}")

def get_audio_folder_for_file(file_id: str) -> str:
    """为指定文件ID获取音频文件夹路径"""
    from app import app
    base_audio_folder = app.config['AUDIO_FOLDER']
    file_audio_folder = os.path.join(base_audio_folder, file_id)
    
    # 确保文件夹存在
    if not os.path.exists(file_audio_folder):
        os.makedirs(file_audio_folder)
    
    return file_audio_folder

def get_existing_audio_files(file_id: str) -> list:
    """获取指定文件已生成的音频文件列表"""
    try:
        audio_folder = get_audio_folder_for_file(file_id)
        audio_files = []
        
        if os.path.exists(audio_folder):
            for filename in os.listdir(audio_folder):
                if filename.endswith('.wav') and filename.startswith('chapter_'):
                    # 从文件名解析章节信息 (chapter_1.wav -> 章节索引0)
                    try:
                        chapter_index = int(filename.replace('.wav', '').replace('chapter_', '')) - 1
                        audio_files.append({
                            'filename': filename,
                            'chapter_index': chapter_index,
                            'filepath': os.path.join(audio_folder, filename)
                        })
                    except ValueError:
                        continue  # 跳过无法解析的文件名
        
        # 按章节索引排序
        audio_files.sort(key=lambda x: x['chapter_index'])
        return audio_files
    
    except Exception as e:
        print(f"获取音频文件列表失败: {str(e)}")
        return []

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
        
        # 获取音频文件夹
        audio_folder = get_audio_folder_for_file(file_id)
        
        # 生成音频
        if chapter_index == -1:
            # 生成全部章节
            audio_files = []
            total_chapters = len(chapters)
            
            for i, chapter in enumerate(chapters):
                try:
                    audio_filename = f"chapter_{i+1}.wav"
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
            audio_filename = f"chapter_{chapter_index+1}.wav"
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

@audio_bp.route('/generate-audio-progress', methods=['POST'])
def generate_audio_with_progress():
    """生成音频接口（带进度跟踪）"""
    try:
        data = request.json
        file_id = data.get('file_id')
        chapter_index = data.get('chapter_index', -1)  # -1表示生成全部
        voice_settings = data.get('voice_settings', {})
        
        # 生成唯一的任务ID
        task_id = f"{file_id}_{int(time.time())}"
        
        # 初始化进度数据
        progress_data[task_id] = {
            'progress': 0,
            'message': '正在初始化...',
            'status': 'running',
            'audio_files': []
        }
        
        # 获取配置
        from app import app
        upload_folder = app.config['UPLOAD_FOLDER']
        
        # 获取文件路径
        file_path = None
        for filename in os.listdir(upload_folder):
            if filename.startswith(file_id):
                file_path = os.path.join(upload_folder, filename)
                break
        
        if not file_path:
            progress_data[task_id]['status'] = 'error'
            progress_data[task_id]['message'] = '文件不存在'
            return jsonify({'error': '文件不存在', 'task_id': task_id}), 404
        
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
                progress_data[task_id]['status'] = 'error'
                progress_data[task_id]['message'] = f'文本提取失败: {str(e)}'
                return jsonify({'error': f'文本提取失败: {str(e)}', 'task_id': task_id}), 500
            
            try:
                chapters = file_processor.split_chapters(text_content)
            except Exception as e:
                progress_data[task_id]['status'] = 'error'
                progress_data[task_id]['message'] = f'章节分割失败: {str(e)}'
                return jsonify({'error': f'章节分割失败: {str(e)}', 'task_id': task_id}), 500
        
        # 获取音频文件夹
        audio_folder = get_audio_folder_for_file(file_id)
        
        # 定义进度回调函数
        def progress_callback(progress, message):
            progress_data[task_id]['progress'] = progress
            progress_data[task_id]['message'] = message
        
        # 生成音频
        if chapter_index == -1:
            # 生成全部章节
            total_chapters = len(chapters)
            
            for i, chapter in enumerate(chapters):
                try:
                    # 更新章节进度
                    chapter_progress = (i / total_chapters) * 100
                    progress_callback(int(chapter_progress), f"正在生成第 {i+1}/{total_chapters} 章节...")
                    
                    audio_filename = f"chapter_{i+1}.wav"
                    audio_filepath = os.path.join(audio_folder, audio_filename)
                    
                    # 使用简化的TTS服务
                    tts_service = get_tts_service()
                    
                    # 为每个章节定义子进度回调
                    def chapter_progress_callback(sub_progress, sub_message):
                        # 计算总体进度：当前章节进度 + 子进度
                        overall_progress = int((i / total_chapters) * 100 + (sub_progress / total_chapters))
                        progress_callback(overall_progress, f"第 {i+1} 章节: {sub_message}")
                    
                    tts_service.generate_and_save_audio(
                        chapter['content'], 
                        audio_filepath,
                        voice_settings,
                        chapter_progress_callback
                    )
                    
                    progress_data[task_id]['audio_files'].append({
                        'chapter_index': i,
                        'chapter_title': chapter['title'],
                        'audio_file': audio_filename
                    })
                    
                except Exception as e:
                    progress_data[task_id]['status'] = 'error'
                    progress_data[task_id]['message'] = f'第 {i+1} 章节音频生成失败: {str(e)}'
                    return jsonify({'error': f'第 {i+1} 章节音频生成失败: {str(e)}', 'task_id': task_id}), 500
        else:
            # 生成单个章节
            if chapter_index >= len(chapters):
                progress_data[task_id]['status'] = 'error'
                progress_data[task_id]['message'] = '章节索引超出范围'
                return jsonify({'error': '章节索引超出范围', 'task_id': task_id}), 400
            
            chapter = chapters[chapter_index]
            audio_filename = f"chapter_{chapter_index+1}.wav"
            audio_filepath = os.path.join(audio_folder, audio_filename)
            
            try:
                # 使用简化的TTS服务
                tts_service = get_tts_service()
                tts_service.generate_and_save_audio(
                    chapter['content'],
                    audio_filepath,
                    voice_settings,
                    progress_callback
                )
                progress_data[task_id]['audio_files'] = [{
                    'chapter_index': chapter_index,
                    'chapter_title': chapter['title'],
                    'audio_file': audio_filename
                }]
                
            except Exception as e:
                progress_data[task_id]['status'] = 'error'
                progress_data[task_id]['message'] = f'音频生成失败: {str(e)}'
                return jsonify({'error': f'音频生成失败: {str(e)}', 'task_id': task_id}), 500
        
        # 完成
        progress_data[task_id]['status'] = 'completed'
        progress_data[task_id]['progress'] = 100
        progress_data[task_id]['message'] = '音频生成完成！'
        
        return jsonify({
            'task_id': task_id,
            'file_id': file_id,
            'audio_files': progress_data[task_id]['audio_files']
        })
    
    except Exception as e:
        if 'task_id' in locals():
            progress_data[task_id]['status'] = 'error'
            progress_data[task_id]['message'] = str(e)
        return jsonify({'error': str(e)}), 500

@audio_bp.route('/progress/<task_id>')
def get_progress(task_id):
    """获取进度信息"""
    if task_id in progress_data:
        return jsonify(progress_data[task_id])
    else:
        return jsonify({'error': '任务不存在'}), 404

@audio_bp.route('/download/<file_id>/<filename>')
def download_audio(file_id, filename):
    """下载音频文件"""
    audio_folder = get_audio_folder_for_file(file_id)
    return send_from_directory(audio_folder, filename)

@audio_bp.route('/audio-files/<file_id>')
def get_audio_files(file_id):
    """获取指定文件的音频文件列表"""
    try:
        audio_files = get_existing_audio_files(file_id)
        return jsonify({'audio_files': audio_files})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@audio_bp.route('/check-audio-status/<file_id>')
def check_audio_status(file_id):
    """检查指定文件的音频生成状态"""
    try:
        # 获取配置
        from app import app
        upload_folder = app.config['UPLOAD_FOLDER']
        
        # 检查章节文件是否存在
        chapters_file = os.path.join(upload_folder, f"{file_id}_chapters.json")
        chapters = []
        
        if os.path.exists(chapters_file):
            try:
                with open(chapters_file, 'r', encoding='utf-8') as f:
                    chapters_data = json.load(f)
                    chapters = chapters_data['chapters']
            except Exception as e:
                print(f"读取章节文件失败: {str(e)}")
        
        # 获取已生成的音频文件
        existing_audio_files = get_existing_audio_files(file_id)
        existing_chapter_indices = {file_info['chapter_index'] for file_info in existing_audio_files}
        
        # 构建状态信息
        audio_status = []
        for i, chapter in enumerate(chapters):
            status = {
                'chapter_index': i,
                'chapter_title': chapter['title'],
                'has_audio': i in existing_chapter_indices,
                'audio_file': None
            }
            
            # 如果已生成音频，添加文件名
            if i in existing_chapter_indices:
                for audio_file in existing_audio_files:
                    if audio_file['chapter_index'] == i:
                        status['audio_file'] = audio_file['filename']
                        break
            
            audio_status.append(status)
        
        return jsonify({
            'file_id': file_id,
            'total_chapters': len(chapters),
            'generated_count': len(existing_audio_files),
            'audio_status': audio_status
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@audio_bp.route('/merge-audio/<file_id>')
def merge_audio_files(file_id):
    """合并指定文档的所有音频文件"""
    try:
        # 获取已生成的音频文件
        existing_audio_files = get_existing_audio_files(file_id)
        
        if not existing_audio_files:
            return jsonify({'error': '没有找到音频文件'}), 404
        
        # 按章节索引排序
        existing_audio_files.sort(key=lambda x: x['chapter_index'])
        
        # 获取音频文件夹
        audio_folder = get_audio_folder_for_file(file_id)
        merged_filename = f"{file_id}_complete.wav"
        merged_filepath = os.path.join(audio_folder, merged_filename)
        
        # 合并音频文件
        with open(merged_filepath, 'wb') as outfile:
            for i, audio_file in enumerate(existing_audio_files):
                with open(audio_file['filepath'], 'rb') as infile:
                    if i == 0:
                        # 第一个文件，保留完整的WAV头
                        outfile.write(infile.read())
                    else:
                        # 后续文件，跳过WAV头（44字节）
                        infile.seek(44)
                        outfile.write(infile.read())
        
        return jsonify({
            'success': True,
            'merged_file': merged_filename,
            'total_chapters': len(existing_audio_files)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@audio_bp.route('/download-complete/<file_id>')
def download_complete_audio(file_id):
    """下载完整的合并音频文件"""
    try:
        # 检查是否存在合并文件
        audio_folder = get_audio_folder_for_file(file_id)
        merged_filename = f"{file_id}_complete.wav"
        merged_filepath = os.path.join(audio_folder, merged_filename)
        
        if not os.path.exists(merged_filepath):
            # 如果不存在，先合并
            merge_response = merge_audio_files(file_id)
            if merge_response.status_code != 200:
                return jsonify({'error': '合并音频文件失败'}), 500
        
        # 返回合并文件
        return send_from_directory(audio_folder, merged_filename, as_attachment=True)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

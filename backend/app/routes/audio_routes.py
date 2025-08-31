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
            print(f"TTS服务初始化失败: {str(e)}")
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
        
        print(f"🔍 开始处理音频生成请求")
        print(f"📁 文件ID: {file_id}")
        print(f"📖 章节索引: {chapter_index}")
        print(f"🎵 语音设置: {voice_settings}")
        
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
            print(f"❌ 文件不存在: {file_id}")
            return jsonify({'error': '文件不存在'}), 404
        
        print(f"📄 找到文件: {file_path}")
        
        # 尝试读取保存的章节数据
        chapters_file = os.path.join(upload_folder, f"{file_id}_chapters.json")
        chapters = None
        
        if os.path.exists(chapters_file):
            try:
                print(f"📖 尝试读取保存的章节数据...")
                with open(chapters_file, 'r', encoding='utf-8') as f:
                    chapters_data = json.load(f)
                    chapters = chapters_data['chapters']
                print(f"✅ 成功读取保存的章节数据，共 {len(chapters)} 个章节")
                
                # 显示章节信息
                for i, chapter in enumerate(chapters):
                    print(f"📖 章节 {i+1}: {chapter['title']} (长度: {len(chapter['content'])} 字符)")
                
            except Exception as e:
                print(f"⚠️ 读取章节数据失败: {str(e)}，将重新解析文件")
                chapters = None
        
        # 如果没有保存的章节数据，重新解析文件
        if chapters is None:
            print(f"🔄 重新解析文件...")
            # 重新解析文件
            file_extension = file_path.rsplit('.', 1)[1].lower()
            print(f"📋 文件扩展名: {file_extension}")
            
            try:
                print(f"🔄 开始提取文本内容...")
                text_content = file_processor.extract_text(file_path, file_extension)
                print(f"✅ 文本提取成功，内容长度: {len(text_content)} 字符")
                
                # 保存提取的文本到调试文件
                debug_text_file = os.path.join(upload_folder, f"{file_id}_debug_text.txt")
                try:
                    with open(debug_text_file, 'w', encoding='utf-8') as f:
                        f.write(text_content)
                    print(f"💾 调试文本已保存到: {debug_text_file}")
                except Exception as e:
                    print(f"⚠️ 保存调试文本失败: {str(e)}")
                
                # 显示文本内容的前200个字符
                preview = text_content[:200] + "..." if len(text_content) > 200 else text_content
                print(f"📝 文本预览: {preview}")
                
            except Exception as e:
                print(f"❌ 文本提取失败: {str(e)}")
                return jsonify({'error': f'文本提取失败: {str(e)}'}), 500
            
            try:
                print(f"🔄 开始分割章节...")
                chapters = file_processor.split_chapters(text_content)
                print(f"✅ 章节分割成功，共 {len(chapters)} 个章节")
                
                for i, chapter in enumerate(chapters):
                    print(f"📖 章节 {i+1}: {chapter['title']} (长度: {len(chapter['content'])} 字符)")
                
            except Exception as e:
                print(f"❌ 章节分割失败: {str(e)}")
                return jsonify({'error': f'章节分割失败: {str(e)}'}), 500
        
        # 生成音频
        if chapter_index == -1:
            # 生成全部章节
            print(f"🎵 开始生成全部章节音频...")
            audio_files = []
            for i, chapter in enumerate(chapters):
                try:
                    print(f"🔄 正在生成第 {i+1}/{len(chapters)} 章节音频...")
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
                    
                    print(f"✅ 第 {i+1} 章节音频生成成功: {audio_filename}")
                    
                except Exception as e:
                    print(f"❌ 第 {i+1} 章节音频生成失败: {str(e)}")
                    return jsonify({'error': f'第 {i+1} 章节音频生成失败: {str(e)}'}), 500
        else:
            # 生成单个章节
            if chapter_index >= len(chapters):
                print(f"❌ 章节索引超出范围: {chapter_index} >= {len(chapters)}")
                return jsonify({'error': '章节索引超出范围'}), 400
            
            chapter = chapters[chapter_index]
            print(f"🎵 开始生成第 {chapter_index+1} 章节音频...")
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
                print(f"✅ 第 {chapter_index+1} 章节音频生成成功: {audio_filename}")
                
            except Exception as e:
                print(f"❌ 第 {chapter_index+1} 章节音频生成失败: {str(e)}")
                return jsonify({'error': f'音频生成失败: {str(e)}'}), 500
        
        print(f"🎉 音频生成完成！共生成 {len(audio_files)} 个音频文件")
        return jsonify({
            'file_id': file_id,
            'audio_files': audio_files
        })
    
    except Exception as e:
        print(f"❌ 音频生成接口异常: {str(e)}")
        import traceback
        traceback.print_exc()
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

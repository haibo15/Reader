import os
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
import uuid
import json

# 导入自定义模块
from app.services.file_processor import FileProcessor
from app.services.text_to_speech import TextToSpeechService
from app.utils.file_utils import ensure_directories

# 加载环境变量
load_dotenv()

app = Flask(__name__)
CORS(app)

# 配置
app.config['UPLOAD_FOLDER'] = os.getenv('UPLOAD_FOLDER', './uploads')
app.config['AUDIO_FOLDER'] = os.getenv('AUDIO_FOLDER', './audio')
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB限制

# 允许的文件扩展名
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'epub', 'docx'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# 确保必要的目录存在
ensure_directories([app.config['UPLOAD_FOLDER'], app.config['AUDIO_FOLDER']])

# 初始化服务
file_processor = FileProcessor()
tts_service = TextToSpeechService()

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
        filename = secure_filename(file.filename)
        file_extension = filename.rsplit('.', 1)[1].lower()
        new_filename = f"{file_id}.{file_extension}"
        
        # 保存文件
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], new_filename)
        file.save(file_path)
        
        # 解析文件内容
        text_content = file_processor.extract_text(file_path, file_extension)
        chapters = file_processor.split_chapters(text_content)
        
        return jsonify({
            'file_id': file_id,
            'filename': filename,
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
                audio_file = tts_service.generate_audio(
                    chapter['content'], 
                    f"{file_id}_chapter_{i+1}",
                    voice_settings
                )
                audio_files.append({
                    'chapter_index': i,
                    'chapter_title': chapter['title'],
                    'audio_file': audio_file
                })
        else:
            # 生成单个章节
            if chapter_index >= len(chapters):
                return jsonify({'error': '章节索引超出范围'}), 400
            
            chapter = chapters[chapter_index]
            audio_file = tts_service.generate_audio(
                chapter['content'],
                f"{file_id}_chapter_{chapter_index+1}",
                voice_settings
            )
            audio_files = [{
                'chapter_index': chapter_index,
                'chapter_title': chapter['title'],
                'audio_file': audio_file
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

@app.route('/api/health')
def health_check():
    """健康检查接口"""
    return jsonify({'status': 'healthy', 'message': '服务运行正常'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

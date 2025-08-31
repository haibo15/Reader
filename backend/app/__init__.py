# app包初始化文件
import os
from flask import Flask
from flask_cors import CORS

# 创建Flask应用实例
app = Flask(__name__)
CORS(app)

# 配置上传文件夹和音频文件夹
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads')
app.config['AUDIO_FOLDER'] = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'audio')

# 确保文件夹存在
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['AUDIO_FOLDER'], exist_ok=True)

# 注册路由蓝图
from app.routes import register_blueprints
register_blueprints(app)

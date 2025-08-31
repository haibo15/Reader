# routes包初始化文件
from .upload_routes import upload_bp
from .audio_routes import audio_bp
from .document_routes import document_bp

# 注册所有蓝图
def register_blueprints(app):
    """注册所有路由蓝图"""
    app.register_blueprint(upload_bp, url_prefix='/api')
    app.register_blueprint(audio_bp, url_prefix='/api')
    app.register_blueprint(document_bp, url_prefix='/api')

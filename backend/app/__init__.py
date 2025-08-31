# app包初始化文件
from flask import Flask
from flask_cors import CORS

# 创建Flask应用实例
app = Flask(__name__)
CORS(app)

# 注册路由蓝图
from app.routes import register_blueprints
register_blueprints(app)

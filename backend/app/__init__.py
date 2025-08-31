# app包初始化文件
from flask import Flask
from flask_cors import CORS

# 创建Flask应用实例
app = Flask(__name__)
CORS(app)

# 导入路由（在app创建之后导入）
from app import routes

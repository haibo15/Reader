# 智能文本阅读器

一个基于阿里巴巴Qwen大模型的智能文本转语音阅读器，支持多种文档格式的语音合成和播放。

## 功能特性

- 📄 **多格式支持**: PDF、TXT、EPUB、DOCX
- 🎵 **智能语音合成**: 基于阿里云Qwen-TTS API
- 🎤 **7种音色**: 支持标准音色和方言音色（北京话、吴语、四川话）
- 📚 **章节管理**: 自动分割章节，支持分章节播放
- 🎧 **音频播放**: 完整的播放控制功能
- 💾 **文件管理**: 上传、处理文档，生成并下载音频文件
- ⚡ **流式输出**: 支持音频流式生成和播放

## 技术栈

### 后端
- Python 3.8+（推荐3.8-3.11）
- Flask
- 阿里云Qwen-TTS API（DashScope SDK >= 1.23.1）

### 前端
- Node.js 14+
- HTML5/CSS3/JavaScript
- Web Audio API

## 项目结构

```
Reader/
├── backend/                 # Python后端
│   ├── app/
│   │   ├── api/            # API路由
│   │   ├── services/       # 业务逻辑
│   │   ├── models/         # 数据模型
│   │   └── utils/          # 工具函数
│   ├── uploads/            # 上传文件存储
│   ├── audio/              # 生成的音频文件
│   ├── .env                # 环境变量配置
│   └── requirements.txt    # Python依赖
├── frontend/               # 前端界面
│   ├── public/
│   │   ├── index.html     # 主页面
│   │   ├── styles.css     # 样式文件
│   │   └── script.js      # JavaScript逻辑
│   └── package.json       # Node.js依赖
├── start.bat              # 启动脚本
├── README.md              # 项目说明
├── INSTALL.md             # 安装指南
└── .gitignore             # Git忽略文件
```

## 安装和运行

### 后端设置
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### 前端设置
```bash
cd frontend
npm install
npm start
```

## 环境变量配置

在 `backend` 目录下创建 `.env` 文件并配置以下变量：
```
DASHSCOPE_API_KEY=your_dashscope_api_key_here
UPLOAD_FOLDER=./uploads
AUDIO_FOLDER=./audio
FLASK_ENV=development
FLASK_DEBUG=True
```

**重要提示：** 
- 请从阿里云百炼平台获取API密钥：https://bailian.console.aliyun.com/
- 确保已开通Qwen-TTS服务
- DashScope Python SDK版本需要不低于1.23.1
- `.env` 文件包含敏感信息，不会被上传到GitHub

## 使用说明

1. 启动后端和前端服务
2. 在浏览器中访问应用
3. 上传支持的文档格式
4. 选择文本转语音选项
5. 等待语音生成完成
6. 下载生成的音频文件或在线播放

## 项目状态

### ✅ 已完成功能
- [x] 项目架构设计
- [x] 后端API开发
- [x] 文件上传功能
- [x] 文本解析模块
- [x] 语音合成集成（基于阿里云Qwen-TTS API）
- [x] 前端界面开发
- [x] 音频播放功能
- [x] 测试和优化
- [x] 支持7种音色（包括方言音色）
- [x] 基于官方文档实现

### 🧪 测试结果
- ✅ API密钥验证成功
- ✅ Qwen-TTS API调用成功
- ✅ 音频文件生成成功（86KB测试文件）
- ✅ 支持所有7种音色

## 支持的音色

根据[阿里云官方文档](https://help.aliyun.com/zh/model-studio/qwen-tts#4d86103b5246q)，支持以下音色：

| 音色 | 类型 | 说明 |
|------|------|------|
| Ethan | 男声 | 标准男声 |
| Chelsie | 女声 | 标准女声 |
| Cherry | 女声 | 标准女声 |
| Serena | 女声 | 标准女声 |
| Dylan | 男声 | 北京话 |
| Jada | 女声 | 吴语 |
| Sunny | 女声 | 四川话 |

## 更新日志

### v1.0.0 (2025年8月31日)
- 初始版本发布
- 支持PDF、TXT、EPUB、DOCX格式
- 集成阿里云Qwen-TTS API（DashScope SDK >= 1.23.1）
- 支持7种音色（包括方言音色）
- 完整的Web界面
- 音频播放和下载功能
- 基于官方文档实现：https://help.aliyun.com/zh/model-studio/qwen-tts#4d86103b5246q

## 注意事项

1. **Python版本兼容性**
   - 当前使用Python 3.13
   - `pydub`库在Python 3.13上有兼容性问题
   - 建议使用Python 3.8-3.11

2. **API密钥安全**
   - `.env`文件已添加到`.gitignore`
   - 不会上传到GitHub
   - 请妥善保管API密钥

3. **音频文件**
   - 生成的音频文件为WAV格式
   - 音频URL有效期为24小时
   - 建议及时下载保存

## 技术参考

- [阿里云百炼平台](https://bailian.console.aliyun.com/)
- [Qwen-TTS官方文档](https://help.aliyun.com/zh/model-studio/qwen-tts#4d86103b5246q)
- [DashScope Python SDK](https://help.aliyun.com/zh/dashscope/developer-reference/api-details)

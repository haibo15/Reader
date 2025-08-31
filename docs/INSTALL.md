# 智能文本阅读器 - 安装指南

## 系统要求

- Python 3.8 或更高版本（推荐Python 3.8-3.11，避免Python 3.13的pydub兼容性问题）
- Node.js 14 或更高版本
- 阿里云百炼平台API密钥
- 已开通Qwen-TTS服务

## 安装步骤

### 1. 克隆或下载项目

确保你已经下载了项目文件到本地目录。

### 2. 配置环境变量

在 `backend` 目录下创建 `.env` 文件：

```bash
# 复制示例文件
copy env.example .env
```

编辑 `.env` 文件，填入你的通义千问-TTS API配置：

```
DASHSCOPE_API_KEY=your_dashscope_api_key_here
UPLOAD_FOLDER=./uploads
AUDIO_FOLDER=./audio
FLASK_ENV=development
FLASK_DEBUG=True
```

**重要提示：** 
- 请从阿里云百炼平台获取你的API密钥：https://bailian.console.aliyun.com/
- 确保已开通Qwen-TTS服务
- DashScope Python SDK版本需要不低于1.23.1
- `.env` 文件包含敏感信息，不会被上传到GitHub

### 3. 安装Python依赖

```bash
cd backend
pip install -r requirements.txt
```

### 4. 安装Node.js依赖

```bash
cd frontend
npm install
```

### 5. 测试API配置

```bash
cd backend
python test_requirements.py
```

这个测试脚本会验证你的依赖版本和API配置是否正确。

### 6. 启动服务

#### 方法一：使用启动脚本（推荐）

双击运行 `start.bat` 文件，它会自动启动后端和前端服务。

#### 方法二：手动启动

**启动后端：**
```bash
cd backend
python app.py
```

**启动前端：**
```bash
cd frontend
npm start
```

### 7. 访问应用

打开浏览器访问：http://localhost:3000

## 使用说明

### 1. 上传文件
- 支持格式：PDF、TXT、EPUB、DOCX
- 最大文件大小：50MB
- 可以拖拽文件到上传区域或点击选择文件

### 2. 查看文件信息
- 上传成功后会自动显示文件名、章节数等信息
- 系统会自动识别和分割章节

### 3. 配置语音设置
- 选择语音类型（支持7种音色）：
  - Ethan（男声）
  - Chelsie（女声）
  - Cherry（女声）
  - Serena（女声）
  - Dylan（北京话-男声）
  - Jada（吴语-女声）
  - Sunny（四川话-女声）
- 调整语速（0.5x - 2.0x）
- 调整音量（-20 到 +20）

### 4. 生成音频
- 可以选择生成全部章节或选中特定章节
- 生成过程可能需要一些时间，请耐心等待
- 支持批量生成多个章节

### 5. 播放和下载
- 生成的音频可以在线播放
- 支持播放列表功能
- 可以单独下载每个章节的音频文件

## 故障排除

### 常见问题

1. **后端启动失败**
   - 检查Python版本是否为3.8+
   - 确认所有依赖已正确安装
   - 检查.env文件配置是否正确

2. **前端启动失败**
   - 检查Node.js版本是否为14+
   - 确认npm依赖已正确安装
   - 检查端口3000是否被占用

3. **文件上传失败**
   - 检查文件格式是否支持
   - 确认文件大小不超过50MB
   - 检查网络连接

4. **音频生成失败**
   - 检查DASHSCOPE_API_KEY是否正确
   - 确认已开通Qwen-TTS服务
   - 确认API配额是否充足
   - 检查网络连接
   - 确认DashScope SDK版本不低于1.23.1

5. **音频播放失败**
   - 检查浏览器是否支持音频播放
   - 确认音频文件已正确生成
   - 检查网络连接

### 日志查看

- 后端日志：查看后端控制台输出
- 前端日志：查看浏览器开发者工具控制台

## API接口说明

### 上传文件
- **POST** `/api/upload`
- 参数：文件（multipart/form-data）
- 返回：文件ID、章节信息

### 生成音频
- **POST** `/api/generate-audio`
- 参数：文件ID、章节索引、语音设置
- 返回：音频文件信息

### 下载音频
- **GET** `/api/download/<filename>`
- 返回：音频文件

### 健康检查
- **GET** `/api/health`
- 返回：服务状态

## 技术架构

- **后端**：Python Flask + 阿里云Qwen-TTS API
- **前端**：HTML + CSS + JavaScript + Express
- **文件处理**：支持多种文档格式解析
- **音频处理**：基于阿里云Qwen-TTS服务
- **API版本**：DashScope SDK >= 1.23.1

## 更新日志

### v1.0.0
- 初始版本发布
- 支持PDF、TXT、EPUB、DOCX格式
- 集成阿里云Qwen-TTS API（DashScope SDK >= 1.23.1）
- 支持7种音色（包括方言音色）
- 完整的Web界面
- 音频播放和下载功能
- 基于官方文档实现：https://help.aliyun.com/zh/model-studio/qwen-tts#4d86103b5246q

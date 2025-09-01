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
- 🔊 **语音试听**: 每个语音角色都支持试听功能，帮助用户选择最适合的语音
- 📚 **文档历史**: 保存上传过的文档历史，支持快速加载，无需重复上传

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

### 基本使用流程
1. 启动后端和前端服务
2. 在浏览器中访问应用
3. 上传支持的文档格式
4. 选择文本转语音选项
5. 等待语音生成完成
6. 下载生成的音频文件或在线播放

### 语音试听功能

#### 功能概述
已成功将QWEN-TTS的7个角色语音预览功能集成到网页应用中。用户可以直接在网页上试听不同角色的语音效果，无需每次都调用API生成音频。

#### 已生成的角色预览音频

✅ **基础音色（4个）：**
- **Chelsie** - 女声 (`chelsie_preview.wav`)
- **Cherry** - 女声 (`cherry_preview.wav`)
- **Ethan** - 男声 (`ethan_preview.wav`)
- **Serena** - 女声 (`serena_preview.wav`)

✅ **方言音色（3个）：**
- **Dylan** - 北京话男声 (`dylan_preview.wav`)
- **Jada** - 吴语女声 (`jada_preview.wav`)
- **Sunny** - 四川话女声 (`sunny_preview.wav`)

#### 使用方法

**方法一：在主应用中试听**
1. **上传文件**：首先上传一个文档文件
2. **选择语音**：在语音设置中选择想要试听的语音
3. **点击试听**：点击语音选择框旁边的"🔊 试听"按钮
4. **试听效果**：系统会立即播放对应的预览音频
5. **选择合适语音**：根据试听效果选择最适合的语音

**方法二：独立测试页面**
访问专门的测试页面：`http://localhost:3000/voice-preview-test.html`
这个页面提供了所有角色的独立试听功能，界面更简洁直观。

#### 技术实现

**文件位置：**
```
frontend/public/audio/previews/
├── chelsie_preview.wav
├── cherry_preview.wav
├── ethan_preview.wav
├── serena_preview.wav
├── dylan_preview.wav
├── jada_preview.wav
└── sunny_preview.wav
```

**核心代码逻辑：**
```javascript
// 使用本地预览音频文件
const voiceName = voiceSettings.voice.toLowerCase();
const audioUrl = `./audio/previews/${voiceName}_preview.wav`;

// 播放预览音频
VoiceSettings.playTestAudio(audioUrl);
```

#### 优势

✅ **快速响应** - 无需等待API调用，立即播放
✅ **节省成本** - 不消耗API调用次数
✅ **稳定可靠** - 不受网络状况影响
✅ **用户体验好** - 响应速度快，无延迟

#### 预览文本
所有预览音频使用的文本：
> "你好，我是语音助手，很高兴为您服务。"

#### 文件大小
- 每个预览音频文件约150-210KB
- 总大小约1.3MB
- 加载速度快，适合网页使用

### 文档历史功能
1. **查看历史**：点击"📚 查看历史文档"按钮
2. **加载文档**：点击文档卡片或"📖 打开"按钮
3. **删除文档**：点击"🗑️ 删除"按钮（需要确认）
4. **刷新列表**：点击"🔄 刷新列表"按钮

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

### v1.1.0 (2025年8月31日)
- 新增语音试听功能
- 新增文档历史记录功能
- 优化用户界面和交互体验
- 改进文件管理和元数据存储

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

4. **语音试听功能**
   - 使用本地预览音频文件，无需调用API
   - 支持所有现代浏览器的音频播放
   - 音频文件已预生成，响应速度快
   - 文件路径：`frontend/public/audio/previews/`
   - 浏览器会自动缓存音频文件，提升加载速度

5. **文档历史功能**
   - 文档文件存储在服务器的uploads文件夹中
   - 原始文件名保存在.meta文件中
   - 删除文档时会同时删除文档文件和相关的音频文件

## WAV 参数检查工具

在合并或处理第三方生成的 WAV（例如 Qwen-TTS 输出）前，建议使用内置检查脚本快速确认文件是否为未压缩 PCM 且参数一致。

- 位置：`backend/app/utils/inspect_wav.py`
- 作用：输出每个 WAV 的 `channels`、`sampwidth`、`framerate`、`nframes`、`comptype`、`compname`、`duration_sec`
- 适用：检查是否满足合并条件（`comptype` 必须为 `NONE`，并且通道/位宽/采样率一致）

### 使用方法（Windows PowerShell）

检查某个目录下所有 WAV：

```powershell
python backend/app/utils/inspect_wav.py "audio\7a59aaff-5bb4-4c43-98af-c3614baf4b5e"
```

检查单个文件：

```powershell
python backend/app/utils/inspect_wav.py "audio\7a59aaff-5bb4-4c43-98af-c3614baf4b5e\chapter_1.wav"
```

判断标准：
- `comptype` 必须为 `NONE`（未压缩 PCM）
- `channels`、`sampwidth`（常见为 2 即 16-bit）、`framerate` 在待合并的所有文件中应完全一致
- 如不一致，可先使用 ffmpeg 转码到统一参数后再合并，例如：

```bash
ffmpeg -y -i "input.wav" -acodec pcm_s16le -ac 1 -ar 24000 "output.wav"
```

## 技术参考

- [阿里云百炼平台](https://bailian.console.aliyun.com/)
- [Qwen-TTS官方文档](https://help.aliyun.com/zh/model-studio/qwen-tts#4d86103b5246q)
- [DashScope Python SDK](https://help.aliyun.com/zh/dashscope/developer-reference/api-details)

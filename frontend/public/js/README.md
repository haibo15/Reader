# 前端模块化结构说明

## 文件结构

```
js/
├── config.js          # 配置文件和全局变量
├── utils.js           # 工具函数
├── fileUpload.js      # 文件上传模块
├── fileDisplay.js     # 文件显示模块
├── voiceSettings.js   # 语音设置模块
├── audioGenerator.js  # 音频生成模块
├── audioPlayer.js     # 音频播放器模块
└── README.md          # 说明文档

script-new.js          # 主脚本文件（初始化和事件绑定）
```

## 模块说明

### 1. config.js
- 包含API基础URL、文件大小限制等配置
- 定义全局变量（currentFileId, currentChapters等）

### 2. utils.js
- 工具函数类 `Utils`
- 包含格式化文件大小、显示状态消息、进度条等通用功能

### 3. fileUpload.js
- 文件上传类 `FileUpload`
- 处理文件选择、拖拽上传、文件验证、上传请求等

### 4. fileDisplay.js
- 文件显示类 `FileDisplay`
- 处理文件信息显示、章节列表显示、状态更新等

### 5. voiceSettings.js
- 语音设置类 `VoiceSettings`
- 处理语音参数获取和界面更新

### 6. audioGenerator.js
- 音频生成类 `AudioGenerator`
- 处理音频生成请求和状态管理

### 7. audioPlayer.js
- 音频播放器类 `AudioPlayer`
- 处理音频播放、播放列表、下载等功能

### 8. script-new.js
- 应用主类 `App`
- 负责初始化和事件监听器绑定
- 提供全局函数供HTML调用

## 优势

1. **模块化**: 每个功能都有独立的模块，便于维护
2. **可读性**: 代码结构清晰，易于理解
3. **可维护性**: 修改某个功能时只需要关注对应模块
4. **可扩展性**: 新增功能时可以轻松添加新模块
5. **代码复用**: 工具函数可以在多个模块中使用

## 使用方式

在HTML中按顺序引入所有脚本文件：

```html
<script src="js/config.js"></script>
<script src="js/utils.js"></script>
<script src="js/fileUpload.js"></script>
<script src="js/fileDisplay.js"></script>
<script src="js/voiceSettings.js"></script>
<script src="js/audioGenerator.js"></script>
<script src="js/audioPlayer.js"></script>
<script src="script-new.js"></script>
```

## 注意事项

1. 脚本文件必须按顺序加载，因为存在依赖关系
2. 所有模块都使用静态方法，便于调用
3. 全局变量在config.js中定义，其他模块可以直接使用
4. HTML中的onclick事件调用script-new.js中定义的全局函数

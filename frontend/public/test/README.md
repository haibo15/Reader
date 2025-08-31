# 测试页面说明

这个目录包含了项目的测试页面，用于验证各种功能。

## 测试页面列表

### 1. test.html - 连接测试
- **用途**: 测试前端与后端API的连接状态
- **访问地址**: `http://localhost:3000/test/test.html`
- **功能**: 点击"测试连接"按钮检查后端服务是否正常运行

### 2. voice-preview-test.html - 语音预览测试
- **用途**: 测试7个语音角色的预览音频播放功能
- **访问地址**: `http://localhost:3000/test/voice-preview-test.html`
- **功能**: 
  - 显示所有可用的语音角色
  - 点击试听按钮播放对应角色的预览音频
  - 实时显示播放状态和错误信息

## 使用方法

1. 启动前端服务器：
   ```bash
   cd frontend
   npm start
   ```

2. 访问测试页面：
   - 连接测试: http://localhost:3000/test/test.html
   - 语音预览测试: http://localhost:3000/test/voice-preview-test.html

## 注意事项

- 测试页面仅用于开发和调试，不应在生产环境中使用
- 语音预览测试需要确保音频文件存在于 `audio/previews/` 目录中
- 连接测试需要确保后端服务器在5000端口运行

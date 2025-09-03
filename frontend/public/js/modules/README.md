# 模块化架构说明

## 📁 文件结构

```
frontend/public/js/modules/
├── fileInfo.js          # 文件信息模块
├── chapters.js          # 章节列表模块
├── voiceSettings.js     # 语音设置模块
├── audioGeneration.js   # 音频生成模块
├── mergedAudio.js       # 合并音频播放模块
├── chaptersAudio.js     # 章节音频列表模块
├── moduleManager.js     # 模块管理器
└── README.md           # 说明文档
```

## 🏗️ 架构设计

### 模块化原则
- **单一职责**：每个模块只负责一个特定功能
- **独立性**：模块之间相互独立，不直接依赖
- **统一接口**：所有模块都实现相同的接口方法
- **动态加载**：模块内容由JavaScript动态生成

### 核心接口
每个模块都必须实现以下方法：

```javascript
class ExampleModule {
    static MODULE_ID = 'exampleModule';  // 模块唯一标识
    
    static init() { }        // 初始化模块
    static render() { }      // 渲染模块HTML
    static bindEvents() { }  // 绑定事件
    static show() { }        // 显示模块
    static hide() { }        // 隐藏模块
    static refresh() { }     // 刷新模块
}
```

## 🔧 使用方法

### 1. 模块注册
模块管理器会自动注册所有模块：

```javascript
// 自动注册（在moduleManager.js中）
ModuleManager.registerModule(FileInfoModule);
ModuleManager.registerModule(ChaptersModule);
// ... 其他模块
```

### 2. 模块显示控制
使用模块管理器控制模块显示：

```javascript
// 显示单个模块
ModuleManager.showModule('fileInfoModule');

// 显示模块组合
ModuleManager.showModuleCombination(['fileInfoModule', 'chaptersModule']);

// 显示预设模式
ModuleManager.showDocumentViewMode();        // 查看模式
ModuleManager.showAudioGenerationMode();     // 生成模式
ModuleManager.showFullMode();                // 完整模式
```

### 3. 模块操作
每个模块都可以独立操作：

```javascript
// 获取模块实例
const fileInfoModule = ModuleManager.getModule('fileInfoModule');

// 调用模块方法
fileInfoModule.refresh();
```

## 📋 模块说明

### FileInfoModule - 文件信息模块
- **功能**：显示文档基本信息（文件名、章节数、文件ID等）
- **特点**：简洁的信息展示，支持文件删除操作

### ChaptersModule - 章节列表模块
- **功能**：显示文档章节列表，支持章节选择和内容查看
- **特点**：表格化展示，支持全选/取消全选

### VoiceSettingsModule - 语音设置模块
- **功能**：语音角色选择、语速音量调节、试听功能
- **特点**：丰富的语音选项，支持设置保存

### AudioGenerationModule - 音频生成模块
- **功能**：音频生成控制、进度显示、操作按钮管理
- **特点**：支持批量生成和选择性生成

### MergedAudioModule - 合并音频播放模块
- **功能**：合并音频播放、版本选择、下载删除
- **特点**：完整的音频播放器功能

### ChaptersAudioModule - 章节音频列表模块
- **功能**：章节音频管理、播放控制、下载删除
- **特点**：详细的章节音频状态和操作

## 🚀 扩展指南

### 添加新模块
1. 创建新的模块文件（如 `newModule.js`）
2. 实现标准接口方法
3. 在 `moduleManager.js` 中注册模块
4. 在HTML中添加模块容器

### 模块间通信
- 使用全局事件系统
- 通过模块管理器进行协调
- 避免直接模块间依赖

### 样式定制
- 每个模块都有独立的CSS类
- 遵循统一的样式规范
- 支持响应式设计

## 🔍 调试和测试

### 控制台命令
```javascript
// 查看所有已注册模块
ModuleManager.getRegisteredModuleIds();

// 检查模块状态
ModuleManager.hasModule('fileInfoModule');

// 刷新所有模块
ModuleManager.refreshAllModules();
```

### 常见问题
1. **模块未显示**：检查模块是否正确注册和初始化
2. **事件未绑定**：确认 `bindEvents()` 方法被正确调用
3. **样式问题**：检查CSS类名和样式文件是否正确加载

## 📚 最佳实践

1. **保持模块独立**：避免模块间的直接依赖
2. **统一错误处理**：使用统一的错误处理机制
3. **性能优化**：延迟加载和按需渲染
4. **代码复用**：提取公共功能到工具类
5. **文档完善**：为每个模块添加详细注释

## 🔄 版本兼容

- 新架构向后兼容现有功能
- 支持渐进式迁移
- 保持API接口稳定

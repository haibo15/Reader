# CSS 文件结构说明

## 重构后的文件组织

本项目采用模块化的CSS架构，将样式按功能模块进行拆分，提高代码的可维护性和可读性。

### 核心文件

- **`base.css`** - 基础样式重置和全局样式
- **`layout.css`** - 布局相关的样式
- **`components.css`** - 通用组件样式
- **`utilities.css`** - 工具类样式

### 功能模块文件

- **`pages.css`** - 页面核心样式（主入口文件）
- **`document-history.css`** - 文档历史记录相关样式
- **`chapters.css`** - 章节相关样式
- **`upload.css`** - 文件上传相关样式
- **`modal.css`** - 模态对话框样式
- **`audio-player.css`** - 音频播放器样式
- **`status.css`** - 状态样式（统一管理）

## 文件大小对比

### 重构前
- `pages.css`: 8.0KB, 480行

### 重构后
- `pages.css`: ~1.2KB, 40行（主入口）
- `document-history.css`: ~2.5KB, 80行
- `chapters.css`: ~2.8KB, 90行
- `upload.css`: ~1.5KB, 50行
- `modal.css`: ~1.8KB, 60行
- `audio-player.css`: ~2.0KB, 65行
- `status.css`: ~0.8KB, 25行

## 使用方式

### 在HTML中引入
```html
<!-- 引入主样式文件 -->
<link rel="stylesheet" href="css/pages.css">
```

### 在JavaScript中动态加载
```javascript
// 按需加载特定模块
const loadCSS = (filename) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `css/${filename}.css`;
    document.head.appendChild(link);
};

// 示例：只加载音频播放器样式
loadCSS('audio-player');
```

## 重构优势

1. **模块化**: 每个文件专注于特定功能，职责清晰
2. **可维护性**: 更容易定位和修改特定功能的样式
3. **可复用性**: 模块可以独立使用，便于在其他项目中复用
4. **性能优化**: 支持按需加载，减少不必要的CSS加载
5. **团队协作**: 不同开发者可以并行修改不同模块

## 命名规范

- 文件名使用kebab-case（短横线分隔）
- 类名使用kebab-case
- 状态类使用语义化命名（如：`status-pending`、`status-completed`）
- 组件类使用功能前缀（如：`modal-`、`player-`、`chapter-`）

## 注意事项

1. `pages.css`作为主入口文件，通过`@import`导入其他模块
2. 避免在不同模块中重复定义相同的样式
3. 状态样式统一在`status.css`中管理
4. 新增功能模块时，创建对应的CSS文件并在`pages.css`中导入

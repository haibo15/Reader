const express = require('express');
const path = require('path');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const BROWSER_FLAG_FILE = path.join(__dirname, '.browser-opened');

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API代理路由（如果需要）
app.use('/api', (req, res, next) => {
    // 这里可以添加API代理逻辑
    next();
});

// 检查是否需要打开浏览器
function shouldOpenBrowser() {
    // 如果命令行参数包含 --open 或环境变量设置为 true，则打开浏览器
    if (process.argv.includes('--open') || process.env.OPEN_BROWSER === 'true') {
        return true;
    }
    
    // 检查是否是第一次启动（文件不存在）
    if (!fs.existsSync(BROWSER_FLAG_FILE)) {
        return true;
    }
    
    return false;
}

// 标记浏览器已打开
function markBrowserOpened() {
    try {
        fs.writeFileSync(BROWSER_FLAG_FILE, new Date().toISOString());
    } catch (error) {
        console.log('无法创建浏览器标记文件:', error.message);
    }
}

// 打开浏览器
function openBrowser() {
    const url = `http://localhost:${PORT}`;
    console.log(`正在打开浏览器: ${url}`);
    
    // 根据操作系统选择打开命令
    const platform = process.platform;
    let command;
    
    if (platform === 'win32') {
        // Windows
        command = `start ${url}`;
    } else if (platform === 'darwin') {
        // macOS
        command = `open ${url}`;
    } else {
        // Linux
        command = `xdg-open ${url}`;
    }
    
    exec(command, (error) => {
        if (error) {
            console.log('无法自动打开浏览器，请手动访问:', url);
        } else {
            console.log('浏览器已打开！');
            // 标记浏览器已打开
            markBrowserOpened();
        }
    });
}

// 启动服务器
app.listen(PORT, () => {
    console.log(`前端服务器运行在 http://localhost:${PORT}`);
    
    if (shouldOpenBrowser()) {
        openBrowser();
    } else {
        console.log('浏览器不会自动打开，请手动访问:', `http://localhost:${PORT}`);
        console.log('如需重新打开浏览器，请运行: npm run dev:open');
    }
});

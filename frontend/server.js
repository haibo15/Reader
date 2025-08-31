const express = require('express');
const path = require('path');
const cors = require('cors');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

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

// 启动服务器
app.listen(PORT, () => {
    console.log(`前端服务器运行在 http://localhost:${PORT}`);
    
    // 自动打开浏览器
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
        }
    });
});

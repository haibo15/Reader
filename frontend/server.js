const express = require('express');
const path = require('path');
const cors = require('cors');

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
});

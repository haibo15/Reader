const fs = require('fs');
const path = require('path');

const BROWSER_FLAG_FILE = path.join(__dirname, '.browser-opened');

try {
    if (fs.existsSync(BROWSER_FLAG_FILE)) {
        fs.unlinkSync(BROWSER_FLAG_FILE);
        console.log('浏览器标记已重置，下次启动将自动打开浏览器');
    } else {
        console.log('浏览器标记文件不存在，下次启动将自动打开浏览器');
    }
} catch (error) {
    console.error('重置浏览器标记失败:', error.message);
}

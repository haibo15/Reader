// 配置文件
const CONFIG = {
    API_BASE_URL: 'http://localhost:5000/api',
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    ALLOWED_FILE_TYPES: ['.pdf', '.txt', '.epub', '.docx'],
    UPLOAD_TIMEOUT: 60000, // 60秒
    STATUS_MESSAGE_TIMEOUT: 5000 // 5秒
};

// 全局变量
let currentFileId = null;
let currentChapters = [];
let audioFiles = [];
let currentPlaylistIndex = 0;

const express = require('express');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const fs = require('fs');
const { security, apiLimiter, checkSession, recordDownload } = require('./middleware/security');

const app = express();
const PORT = process.env.PORT || 3000;

// 创建上传目录
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 安全中间件
app.use(security);

// 中间件
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 会话配置
app.use(session({
    secret: 'your-secret-key',
    resave: true,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24小时
    }
}));

// 会话检查中间件
app.use(checkSession);

// API速率限制
app.use('/api', apiLimiter);

// 下载统计中间件
app.use('/api/download', recordDownload);

// API路由
app.use('/api', require('./routes/api'));
app.use('/api/stats', require('./routes/stats'));

// 处理SPA路由
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 
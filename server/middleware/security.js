const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const db = require('../config/database');

// 创建访问日志
const createAccessLog = async (req, status, action, details = '') => {
    try {
        await db.asyncRun(
            `INSERT INTO access_logs (user_id, ip_address, user_agent, action, status, details)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                req.session?.userId || null,
                req.ip,
                req.headers['user-agent'],
                action,
                status,
                details
            ]
        );
    } catch (error) {
        console.error('记录访问日志失败:', error);
    }
};

// 登录限制
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 5, // 限制5次尝试
    message: { error: '登录尝试次数过多，请15分钟后再试' },
    standardHeaders: true,
    legacyHeaders: false,
});

// API请求限制
const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1分钟
    max: 100, // 限制100次请求
    message: { error: '请求过于频繁，请稍后���试' },
    standardHeaders: true,
    legacyHeaders: false,
});

// 检查用户会话
const checkSession = async (req, res, next) => {
    if (req.session?.userId) {
        try {
            const user = await db.asyncAll(
                'SELECT * FROM users WHERE id = ?',
                [req.session.userId]
            );
            
            if (user[0]) {
                // 更新最后登录时间和登录次数
                await db.asyncRun(
                    'UPDATE users SET last_login = CURRENT_TIMESTAMP, login_count = login_count + 1 WHERE id = ?',
                    [req.session.userId]
                );
                next();
            } else {
                req.session.destroy();
                res.status(401).json({ error: '会话已过期' });
            }
        } catch (error) {
            console.error('会话验证错误:', error);
            res.status(500).json({ error: '服务器错误' });
        }
    } else {
        next();
    }
};

// 记录下载统计
const recordDownload = async (req, res, next) => {
    if (req.path.includes('/download/')) {
        try {
            const versionId = parseInt(req.params.versionId);
            const platform = req.params.platform;
            
            await db.asyncRun(
                'UPDATE versions SET download_count = download_count + 1 WHERE id = ?',
                [versionId]
            );
            
            await db.asyncRun(
                `INSERT INTO download_stats (version_id, platform, user_id, ip_address, user_agent)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    versionId,
                    platform,
                    req.session?.userId || null,
                    req.ip,
                    req.headers['user-agent']
                ]
            );
        } catch (error) {
            console.error('记录下载统计失败:', error);
        }
    }
    next();
};

module.exports = {
    createAccessLog,
    loginLimiter,
    apiLimiter,
    checkSession,
    recordDownload,
    security: [
        helmet(), // 安全头
        helmet.contentSecurityPolicy({
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'"],
                fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
            },
        }),
    ]
}; 
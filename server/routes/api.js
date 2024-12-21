const express = require('express');
const router = express.Router();
const User = require('../models/user');
const multer = require('multer');
const path = require('path');
const db = require('../config/database');  // 添加数据库引用

// 配置文件上传
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, 'cursorpro-' + file.originalname)
    }
});

const upload = multer({ storage: storage });

// 验证管理员中间件
async function isAdmin(req, res, next) {
    const userId = req.session?.userId;
    if (!userId) {
        return res.status(401).json({ error: '未登录' });
    }
    
    const isAdmin = await User.isAdmin(userId);
    if (!isAdmin) {
        return res.status(403).json({ error: '无权限' });
    }
    
    next();
}

// 获取版本列表
router.get('/versions', async (req, res) => {
    try {
        const versions = await db.asyncAll('SELECT * FROM versions ORDER BY created_at DESC');
        res.json(versions);
    } catch (error) {
        res.status(500).json({ error: '获取版本列表失败' });
    }
});

// 上传新版本（仅管理员）
router.post('/versions', isAdmin, upload.fields([
    { name: 'windows', maxCount: 1 },
    { name: 'mac', maxCount: 1 },
    { name: 'linux', maxCount: 1 }
]), async (req, res) => {
    try {
        const { version, description } = req.body;
        const files = req.files;

        await db.asyncRun(
            `INSERT INTO versions (version, description, windows_url, mac_url, linux_url)
             VALUES (?, ?, ?, ?, ?)`,
            [
                version,
                description,
                files.windows?.[0]?.path,
                files.mac?.[0]?.path,
                files.linux?.[0]?.path
            ]
        );

        res.status(201).json({ message: '版本上传成功' });
    } catch (error) {
        res.status(500).json({ error: '版本上传失败' });
    }
});

// 测试路由
router.get('/test', (req, res) => {
    res.json({ message: 'API is working!' });
});

// 用户注册
router.post('/register', async (req, res) => {
    try {
        const { username, password, email } = req.body;
        
        // 检查用户是否已存在
        const existingUser = await User.findByUsername(username);
        if (existingUser) {
            return res.status(400).json({ error: '用户名已存在' });
        }

        // 创建新用户
        const result = await User.create({ username, password, email });
        res.status(201).json({ 
            message: '注册成功',
            userId: result.id 
        });
    } catch (error) {
        console.error('注册错误:', error);
        res.status(500).json({ error: '注册失败' });
    }
});

// ��户登录
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log('Login attempt:', username);  // 添加日志
        
        const user = await User.findByUsername(username);
        if (!user) {
            console.log('User not found');  // 添加日志
            return res.status(401).json({ error: '用户名或密码错误' });
        }

        const isValid = await User.validatePassword(password, user.password);
        console.log('Password valid:', isValid);  // 添加日志

        if (!isValid) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }

        req.session.userId = user.id;
        req.session.isAdmin = user.is_admin === 1;

        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);  // 添加日志
                return res.status(500).json({ error: '登录失败' });
            }
            
            res.json({ 
                message: '登录成功',
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    isAdmin: user.is_admin === 1
                }
            });
        });
    } catch (error) {
        console.error('Login error:', error);  // 添加详细错误日志
        res.status(500).json({ error: '登录失败' });
    }
});

// 在现有路由中添加
router.get('/check-admin', async (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.json({ isAdmin: false, user: null });
        }

        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.json({ isAdmin: false, user: null });
        }

        res.json({ 
            isAdmin: user.is_admin === 1,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                isAdmin: user.is_admin === 1
            }
        });
    } catch (error) {
        console.error('检查管理员状态错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 添加登出路由
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: '登出失败' });
        }
        res.json({ message: '登出成功' });
    });
});

module.exports = router; 
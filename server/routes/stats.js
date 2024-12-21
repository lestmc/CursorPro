const express = require('express');
const router = express.Router();
const db = require('../config/database');
const moment = require('moment');

// 中间件：检查管理员权限
const checkAdmin = async (req, res, next) => {
    if (!req.session?.userId) {
        return res.status(401).json({ error: '未登录' });
    }

    try {
        const user = await db.asyncAll(
            'SELECT is_admin FROM users WHERE id = ?',
            [req.session.userId]
        );

        if (!user[0]?.is_admin) {
            return res.status(403).json({ error: '无权限' });
        }

        next();
    } catch (error) {
        res.status(500).json({ error: '服务器错误' });
    }
};

// 获取下载统计
router.get('/downloads', checkAdmin, async (req, res) => {
    try {
        const stats = await db.asyncAll(`
            SELECT DATE(downloaded_at) as date,
                   COUNT(*) as count
            FROM download_stats
            GROUP BY DATE(downloaded_at)
            ORDER BY date DESC
            LIMIT 30
        `);

        const labels = stats.map(s => moment(s.date).format('YYYY-MM-DD'));
        const values = stats.map(s => s.count);

        res.json({ labels, values });
    } catch (error) {
        res.status(500).json({ error: '获取下载统计失败' });
    }
});

// 获取用户统计
router.get('/users', checkAdmin, async (req, res) => {
    try {
        const stats = await db.asyncAll(`
            SELECT DATE(created_at) as date,
                   COUNT(*) as count
            FROM users
            GROUP BY DATE(created_at)
            ORDER BY date DESC
            LIMIT 30
        `);

        const labels = stats.map(s => moment(s.date).format('YYYY-MM-DD'));
        const values = stats.map(s => s.count);

        res.json({ labels, values });
    } catch (error) {
        res.status(500).json({ error: '获取用户统计失败' });
    }
});

// 获取平台统计
router.get('/platforms', checkAdmin, async (req, res) => {
    try {
        const stats = await db.asyncAll(`
            SELECT platform,
                   COUNT(*) as count
            FROM download_stats
            GROUP BY platform
        `);

        const platforms = {
            windows: 0,
            mac: 0,
            linux: 0
        };

        stats.forEach(s => {
            if (s.platform in platforms) {
                platforms[s.platform] = s.count;
            }
        });

        res.json(platforms);
    } catch (error) {
        res.status(500).json({ error: '获取平台统计失败' });
    }
});

// 获取访问统计
router.get('/access', checkAdmin, async (req, res) => {
    try {
        const stats = await db.asyncAll(`
            SELECT DATE(created_at) as date,
                   COUNT(*) as count
            FROM access_logs
            GROUP BY DATE(created_at)
            ORDER BY date DESC
            LIMIT 30
        `);

        const labels = stats.map(s => moment(s.date).format('YYYY-MM-DD'));
        const values = stats.map(s => s.count);

        res.json({ labels, values });
    } catch (error) {
        res.status(500).json({ error: '获取访问统计失败' });
    }
});

// 获取总体统计
router.get('/summary', checkAdmin, async (req, res) => {
    try {
        const [
            totalUsers,
            totalDownloads,
            totalVersions,
            activeUsers
        ] = await Promise.all([
            db.asyncAll('SELECT COUNT(*) as count FROM users'),
            db.asyncAll('SELECT COUNT(*) as count FROM download_stats'),
            db.asyncAll('SELECT COUNT(*) as count FROM versions'),
            db.asyncAll(`
                SELECT COUNT(DISTINCT user_id) as count
                FROM access_logs
                WHERE created_at >= datetime('now', '-30 day')
            `)
        ]);

        res.json({
            totalUsers: totalUsers[0].count,
            totalDownloads: totalDownloads[0].count,
            totalVersions: totalVersions[0].count,
            activeUsers: activeUsers[0].count
        });
    } catch (error) {
        res.status(500).json({ error: '获取总体统计失败' });
    }
});

module.exports = router; 
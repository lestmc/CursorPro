import { DownloadStats, AccessLog } from './models/Stats';
import { User } from './models/User';
import { Version } from './models/Version';
import { verifyToken, isAdmin } from './middleware/auth';
import dbConnect from './utils/dbConnect';
import moment from 'moment';

export default async function handler(req, res) {
    await dbConnect();

    if (req.method !== 'GET') {
        return res.status(405).json({ error: '方法不允许' });
    }

    // 验证管理员权限
    return verifyToken(req, res, () => 
        isAdmin(req, res, async () => {
            const path = req.query.path;
            
            switch (path) {
                case 'downloads':
                    return await getDownloadStats(req, res);
                case 'users':
                    return await getUserStats(req, res);
                case 'platforms':
                    return await getPlatformStats(req, res);
                case 'access':
                    return await getAccessStats(req, res);
                case 'summary':
                    return await getSummaryStats(req, res);
                default:
                    return res.status(404).json({ error: '未找到请求的统计数据' });
            }
        })
    );
}

async function getDownloadStats(req, res) {
    try {
        const stats = await DownloadStats.aggregate([
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$downloadedAt'
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: -1 } },
            { $limit: 30 }
        ]);

        const labels = stats.map(s => s._id);
        const values = stats.map(s => s.count);

        res.json({ labels, values });
    } catch (error) {
        res.status(500).json({ error: '获取下载统计失败' });
    }
}

async function getUserStats(req, res) {
    try {
        const stats = await User.aggregate([
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$createdAt'
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: -1 } },
            { $limit: 30 }
        ]);

        const labels = stats.map(s => s._id);
        const values = stats.map(s => s.count);

        res.json({ labels, values });
    } catch (error) {
        res.status(500).json({ error: '获取用户统计失败' });
    }
}

async function getPlatformStats(req, res) {
    try {
        const stats = await DownloadStats.aggregate([
            {
                $group: {
                    _id: '$platform',
                    count: { $sum: 1 }
                }
            }
        ]);

        const platforms = {
            windows: 0,
            mac: 0,
            linux: 0
        };

        stats.forEach(s => {
            if (s._id in platforms) {
                platforms[s._id] = s.count;
            }
        });

        res.json(platforms);
    } catch (error) {
        res.status(500).json({ error: '获取平台统计失败' });
    }
}

async function getAccessStats(req, res) {
    try {
        const stats = await AccessLog.aggregate([
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$createdAt'
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: -1 } },
            { $limit: 30 }
        ]);

        const labels = stats.map(s => s._id);
        const values = stats.map(s => s.count);

        res.json({ labels, values });
    } catch (error) {
        res.status(500).json({ error: '获取访问统计失败' });
    }
}

async function getSummaryStats(req, res) {
    try {
        const [
            totalUsers,
            totalDownloads,
            totalVersions,
            activeUsers
        ] = await Promise.all([
            User.countDocuments(),
            DownloadStats.countDocuments(),
            Version.countDocuments(),
            AccessLog.distinct('userId', {
                createdAt: {
                    $gte: moment().subtract(30, 'days').toDate()
                }
            }).then(users => users.length)
        ]);

        res.json({
            totalUsers,
            totalDownloads,
            totalVersions,
            activeUsers
        });
    } catch (error) {
        res.status(500).json({ error: '获取总体统计失败' });
    }
} 
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

export function generateToken(user) {
    return jwt.sign(
        { 
            id: user._id,
            username: user.username,
            isAdmin: user.isAdmin 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
}

export async function verifyToken(req, res, next) {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: '未登录' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: '无效的令牌' });
    }
}

export async function isAdmin(req, res, next) {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ error: '未登录' });
        }

        const user = await User.findById(req.user.id);
        
        if (!user?.isAdmin) {
            return res.status(403).json({ error: '无权限' });
        }

        next();
    } catch (error) {
        return res.status(500).json({ error: '服务器错误' });
    }
}

export function rateLimit(options = {}) {
    const { windowMs = 60 * 1000, max = 100 } = options;
    const requests = new Map();

    return function (req, res, next) {
        const ip = req.ip;
        const now = Date.now();
        const windowStart = now - windowMs;

        // 清理过期的请求记录
        requests.forEach((timestamps, key) => {
            requests.set(key, timestamps.filter(time => time > windowStart));
        });

        // 获取当前IP的请求记录
        const timestamps = requests.get(ip) || [];
        timestamps.push(now);
        requests.set(ip, timestamps);

        // 检查是否超过限制
        if (timestamps.length > max) {
            return res.status(429).json({
                error: '请求过于频繁，请稍后再试'
            });
        }

        next();
    };
} 
import { User } from './models/User';
import { generateToken } from './middleware/auth';
import dbConnect from './utils/dbConnect';

export default async function handler(req, res) {
    await dbConnect();

    if (req.method === 'POST') {
        if (req.url.endsWith('/login')) {
            return handleLogin(req, res);
        } else if (req.url.endsWith('/register')) {
            return handleRegister(req, res);
        }
    }

    res.status(405).json({ error: '方法不允许' });
}

async function handleLogin(req, res) {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }

        const isValid = await user.validatePassword(password);
        if (!isValid) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }

        // 更新登录信息
        user.lastLogin = new Date();
        user.loginCount += 1;
        await user.save();

        // 生成令牌
        const token = generateToken(user);

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                isAdmin: user.isAdmin
            }
        });
    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({ error: '登录失败' });
    }
}

async function handleRegister(req, res) {
    try {
        const { username, password, email } = req.body;

        // 检查用户是否已存在
        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (existingUser) {
            return res.status(400).json({
                error: '用户名或邮箱已存在'
            });
        }

        // 创建新用户
        const user = new User({
            username,
            password,
            email
        });

        await user.save();

        res.status(201).json({
            message: '注册成功'
        });
    } catch (error) {
        console.error('注册错误:', error);
        res.status(500).json({ error: '注册失败' });
    }
} 
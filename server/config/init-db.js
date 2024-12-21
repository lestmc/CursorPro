const db = require('./database');
const bcrypt = require('bcryptjs');

async function initDatabase() {
    try {
        // 创建用户表
        await db.asyncRun(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                email TEXT UNIQUE,
                is_admin BOOLEAN DEFAULT 0,
                last_login DATETIME,
                login_count INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 创建版本表
        await db.asyncRun(`
            CREATE TABLE IF NOT EXISTS versions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                version TEXT NOT NULL,
                description TEXT,
                windows_url TEXT,
                mac_url TEXT,
                linux_url TEXT,
                download_count INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 创建下载统计表
        await db.asyncRun(`
            CREATE TABLE IF NOT EXISTS download_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                version_id INTEGER,
                platform TEXT,
                user_id INTEGER,
                ip_address TEXT,
                user_agent TEXT,
                downloaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (version_id) REFERENCES versions(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);

        // 创建访问日志表
        await db.asyncRun(`
            CREATE TABLE IF NOT EXISTS access_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                ip_address TEXT,
                user_agent TEXT,
                action TEXT,
                status INTEGER,
                details TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);

        // 创建默认管理员账号
        const adminExists = await db.asyncAll(
            'SELECT * FROM users WHERE username = ?',
            ['admin']
        );

        if (adminExists.length === 0) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await db.asyncRun(
                'INSERT INTO users (username, password, email, is_admin) VALUES (?, ?, ?, 1)',
                ['admin', hashedPassword, 'admin@cursorpro.com']
            );
            console.log('默认管理员账号创建成功');
        }

        // 创建新管理员账号
        const newAdminExists = await db.asyncAll(
            'SELECT * FROM users WHERE username = ?',
            ['superadmin']
        );

        if (newAdminExists.length === 0) {
            const hashedPassword = await bcrypt.hash('superadmin123', 10);
            await db.asyncRun(
                'INSERT INTO users (username, password, email, is_admin) VALUES (?, ?, ?, 1)',
                ['superadmin', hashedPassword, 'superadmin@cursorpro.com']
            );
            console.log('新管理员账号创建成功');
        }

        console.log('数据库表创建成功');
    } catch (error) {
        console.error('数据库初始化错误:', error);
    } finally {
        db.close();
    }
}

initDatabase(); 
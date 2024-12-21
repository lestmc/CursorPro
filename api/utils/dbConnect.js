import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';

async function dbConnect() {
    try {
        await sql`SELECT NOW()`;
        await initializeDatabase();
        console.log('Successfully connected to Vercel Postgres');
    } catch (error) {
        console.error('Database connection error:', error);
        throw error;
    }
}

// 初始化数据库表和默认数据
async function initializeDatabase() {
    try {
        // 创建用户表
        await sql`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE,
                is_admin BOOLEAN DEFAULT FALSE,
                last_login TIMESTAMP,
                login_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // 创建版本表
        await sql`
            CREATE TABLE IF NOT EXISTS versions (
                id SERIAL PRIMARY KEY,
                version VARCHAR(255) NOT NULL,
                description TEXT,
                windows_url TEXT,
                mac_url TEXT,
                linux_url TEXT,
                download_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // 创建下载统计表
        await sql`
            CREATE TABLE IF NOT EXISTS download_stats (
                id SERIAL PRIMARY KEY,
                version_id INTEGER REFERENCES versions(id),
                platform VARCHAR(50),
                user_id INTEGER REFERENCES users(id),
                ip_address VARCHAR(255),
                user_agent TEXT,
                downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // 创建访问日志表
        await sql`
            CREATE TABLE IF NOT EXISTS access_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                ip_address VARCHAR(255),
                user_agent TEXT,
                action VARCHAR(255),
                status INTEGER,
                details TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // 检查是否已存在默认管理员账号
        const adminCheck = await sql`
            SELECT * FROM users WHERE username = 'admin'
        `;

        if (adminCheck.rows.length === 0) {
            // 创建默认管理员账号
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await sql`
                INSERT INTO users (username, password, email, is_admin)
                VALUES ('admin', ${hashedPassword}, 'admin@cursorpro.com', true)
            `;
            console.log('Default admin account created');
        }

    } catch (error) {
        console.error('Database initialization error:', error);
        throw error;
    }
}

// 辅助函数：执行查询
async function query(text, params = []) {
    try {
        const result = await sql.query(text, params);
        return result;
    } catch (error) {
        console.error('Query error:', error);
        throw error;
    }
}

export {
    dbConnect,
    query,
    sql
}; 
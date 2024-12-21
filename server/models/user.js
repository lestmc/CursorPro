const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    static async create(userData) {
        const { username, password, email } = userData;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        try {
            const result = await db.asyncRun(
                'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
                [username, hashedPassword, email]
            );
            return result;
        } catch (error) {
            throw error;
        }
    }

    static async findByUsername(username) {
        try {
            const user = await db.asyncAll(
                'SELECT * FROM users WHERE username = ?',
                [username]
            );
            return user[0];
        } catch (error) {
            throw error;
        }
    }

    static async validatePassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }

    static async createAdmin(userData) {
        const { username, password, email } = userData;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        try {
            const result = await db.asyncRun(
                'INSERT INTO users (username, password, email, is_admin) VALUES (?, ?, ?, 1)',
                [username, hashedPassword, email]
            );
            return result;
        } catch (error) {
            throw error;
        }
    }

    static async isAdmin(userId) {
        try {
            const user = await db.asyncAll(
                'SELECT is_admin FROM users WHERE id = ?',
                [userId]
            );
            return user[0]?.is_admin === 1;
        } catch (error) {
            throw error;
        }
    }

    static async findById(id) {
        try {
            const user = await db.asyncAll(
                'SELECT * FROM users WHERE id = ?',
                [id]
            );
            return user[0];
        } catch (error) {
            throw error;
        }
    }
}

module.exports = User; 
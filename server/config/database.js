const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库文件路径
const dbPath = path.join(__dirname, '../../database.sqlite');

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('数据库连接错误:', err.message);
    } else {
        console.log('成功连接到SQLite数据库');
    }
});

// 将数据库操作Promise化
db.asyncAll = function (sql, params = []) {
    return new Promise((resolve, reject) => {
        this.all(sql, params, (error, rows) => {
            if (error) reject(error);
            else resolve(rows);
        });
    });
};

db.asyncRun = function (sql, params = []) {
    return new Promise((resolve, reject) => {
        this.run(sql, params, function (error) {
            if (error) reject(error);
            else resolve({ id: this.lastID, changes: this.changes });
        });
    });
};

module.exports = db; 
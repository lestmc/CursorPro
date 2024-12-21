# CursorPro

CursorPro 是一个软件分发平台，支持多平台软件版本管理和下载。

## 功能特点

- 用户系统（注册、登录、权限管理）
- 软件版本管理
- 多平台支持（Windows/Mac/Linux）
- 响应式设计
- 明暗主题切换

## 技术栈

- 前端：原生 JavaScript + CSS
- 后端：Node.js + Express
- 数据库：SQLite
- 文件上传：Multer
- 会话管理：express-session

## 快速开始

1. 安装依赖：
```bash
npm install
```

2. 初始化数据库：
```bash
npm run init-db
```

3. 启动服务器：

开发模式（带热重载）：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

4. 访问网站：
打开浏览器访问 `http://localhost:3000`

## 默认管理员账号

- 用户名：admin
- 密码：admin123

## 目录结构

```
├── client/          # 前端文件
│   ├── assets/      # 静态资源
│   │   ├── css/     # 样式文件
│   │   └── js/      # JavaScript文件
│   └── index.html   # 主页面
├── server/          # 后端文件
│   ├── config/      # ��置文件
│   ├── models/      # 数据模型
│   ├── routes/      # 路由处理
│   └── server.js    # 服务器入口
└── uploads/         # 上传文件存储
``` 
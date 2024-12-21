// API配置
const API_URL = 'http://localhost:3000/api';

// 创建通用的fetch配置
const fetchConfig = {
    credentials: 'include',
    headers: {
        'Content-Type': 'application/json'
    }
};

// 在文件顶部添加主题管理
const themeManager = {
    init() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
        
        document.getElementById('themeToggle').addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            this.setTheme(newTheme);
        });
    },

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        const icon = document.getElementById('themeIcon');
        icon.className = theme === 'light' ? 'bi bi-moon-fill' : 'bi bi-sun-fill';
    }
};

// 页面路由处理
const routes = {
    home: async () => {
        const content = document.createElement('div');
        content.className = 'fade-in';
        
        try {
            const response = await fetch(`${API_URL}/versions`);
            const versions = await response.json();
            
            content.innerHTML = `
                <h1>欢迎来到 CursorPro</h1>
                <p>专业的代码编辑器</p>
                
                <div class="version-list">
                    ${versions.map(version => `
                        <div class="version-card">
                            <div class="version-title">版本 ${version.version}</div>
                            <p>${version.description}</p>
                            <div class="version-date">${new Date(version.created_at).toLocaleDateString()}</div>
                            <div class="admin-controls">
                                <a href="${version.windows_url}" class="btn btn-outline">Windows</a>
                                <a href="${version.mac_url}" class="btn btn-outline">MacOS</a>
                                <a href="${version.linux_url}" class="btn btn-outline">Linux</a>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } catch (error) {
            console.error('获取版本信息失败:', error);
            content.innerHTML = '<p>加载版本信息失败</p>';
        }

        return content;
    },
    download: async () => {
        const content = document.createElement('div');
        content.className = 'fade-in';
        
        try {
            // 获取最新版本信息
            const response = await fetch(`${API_URL}/versions`);
            const versions = await response.json();
            const latestVersion = versions[0]; // 因为已经按时间排序，第一个就是最新的

            content.innerHTML = `
                <h1>下载 CursorPro</h1>
                <p>当前最新版本: ${latestVersion?.version || '暂无版本'}</p>
                ${latestVersion ? `
                    <div class="version-card latest-version">
                        <div class="version-title">版本 ${latestVersion.version}</div>
                        <p>${latestVersion.description}</p>
                        <div class="version-date">发布时间: ${new Date(latestVersion.created_at).toLocaleDateString()}</div>
                        <div class="download-options">
                            <a href="${latestVersion.windows_url}" class="btn btn-windows" ${latestVersion.windows_url ? '' : 'disabled'}>
                                Windows 版本
                            </a>
                            <a href="${latestVersion.mac_url}" class="btn btn-mac" ${latestVersion.mac_url ? '' : 'disabled'}>
                                MacOS 版本
                            </a>
                            <a href="${latestVersion.linux_url}" class="btn btn-linux" ${latestVersion.linux_url ? '' : 'disabled'}>
                                Linux 版本
                            </a>
                        </div>
                    </div>
                ` : '<p>暂无可用版本</p>'}
            `;
        } catch (error) {
            console.error('获取版本信息失败:', error);
            content.innerHTML = '<p>加载版本信息失败</p>';
        }

        return content;
    },
    about: async () => {
        const content = document.createElement('div');
        content.innerHTML = '<h1>关于我们</h1>';
        return content;
    },
    login: async () => {
        const content = document.createElement('div');
        content.className = 'fade-in';
        content.innerHTML = `
            <div class="form-container">
                <h2 style="text-align: center; margin-bottom: 2rem;">登录</h2>
                <form id="loginForm">
                    <div class="form-group">
                        <label for="username">用户名</label>
                        <input type="text" id="username" name="username" required>
                    </div>
                    <div class="form-group">
                        <label for="password">密码</label>
                        <input type="password" id="password" name="password" required>
                    </div>
                    <button type="submit" class="btn btn-block">登录</button>
                    <p style="text-align: center; margin-top: 1rem;">
                        还没有账号？ <a href="#" data-page="register" style="color: var(--primary-color);">立即注册</a>
                    </p>
                </form>
            </div>
        `;

        content.querySelector('#loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            try {
                const response = await fetch(`${API_URL}/login`, {
                    ...fetchConfig,
                    method: 'POST',
                    body: JSON.stringify({
                        username: formData.get('username'),
                        password: formData.get('password'),
                    })
                });

                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.error || '登录失败');
                }

                authManager.user = data.user;
                authManager.isLoggedIn = true;
                authManager.isAdmin = data.user.isAdmin;
                authManager.updateUI();
                handleRoute('home');
            } catch (error) {
                console.error('登录错误:', error);
                alert(error.message || '登录失败，请检查用户名和密码');
            }
        });

        return content;
    },
    register: async () => {
        const content = document.createElement('div');
        content.className = 'fade-in';
        content.innerHTML = `
            <div class="form-container">
                <h2 style="text-align: center; margin-bottom: 2rem;">注册</h2>
                <form id="registerForm">
                    <div class="form-group">
                        <label for="username">用户名</label>
                        <input type="text" id="username" name="username" required>
                    </div>
                    <div class="form-group">
                        <label for="password">密码</label>
                        <input type="password" id="password" name="password" required>
                    </div>
                    <div class="form-group">
                        <label for="email">邮箱</label>
                        <input type="email" id="email" name="email" required>
                    </div>
                    <button type="submit" class="btn btn-block">注册</button>
                    <p style="text-align: center; margin-top: 1rem;">
                        已有账号？ <a href="#" data-page="login" style="color: var(--primary-color);">立即登录</a>
                    </p>
                </form>
            </div>
        `;

        content.querySelector('#registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            try {
                const response = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username: formData.get('username'),
                        password: formData.get('password'),
                        email: formData.get('email'),
                    }),
                });
                const data = await response.json();
                if (response.ok) {
                    alert('注册成功！');
                    handleRoute('login');
                } else {
                    alert(data.error);
                }
            } catch (error) {
                console.error('注册错误:', error);
                alert('注册失败');
            }
        });

        return content;
    },
    upload: async () => {
        const content = document.createElement('div');
        content.className = 'fade-in upload-page';
        content.innerHTML = `
            <div class="upload-instructions">
                <h3>上传说明</h3>
                <ul>
                    <li>版本号请使用语义化版本号（例如：1.0.0）</li>
                    <li>请提供详细的版本更新说明</li>
                    <li>支持的文件格式：
                        <br>- Windows: .exe, .zip
                        <br>- MacOS: .dmg, .zip
                        <br>- Linux: .deb, .rpm, .AppImage
                    </li>
                </ul>
            </div>
            <div class="form-container">
                <h2 style="text-align: center; margin-bottom: 2rem;">上传新版本</h2>
                <form id="uploadForm">
                    <div class="form-group">
                        <label>版本号</label>
                        <input type="text" name="version" required placeholder="例如: 1.0.0">
                    </div>
                    <div class="form-group">
                        <label>描述</label>
                        <textarea name="description" required placeholder="请输入版本更新说明，支持多行文本"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Windows 版本</label>
                        <input type="file" name="windows" accept=".exe,.zip">
                    </div>
                    <div class="form-group">
                        <label>MacOS 版本</label>
                        <input type="file" name="mac" accept=".dmg,.zip">
                    </div>
                    <div class="form-group">
                        <label>Linux 版本</label>
                        <input type="file" name="linux" accept=".deb,.rpm,.AppImage">
                    </div>
                    <button type="submit" class="btn btn-block">上传新版本</button>
                </form>
            </div>
        `;

        // 添加表单处理
        content.querySelector('#uploadForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            try {
                const response = await fetch(`${API_URL}/versions`, {
                    method: 'POST',
                    body: formData,
                    credentials: 'include'
                });
                
                if (response.ok) {
                    alert('版本上传成功');
                    handleRoute('download');  // 上传成功后跳转到下载页面
                } else {
                    const data = await response.json();
                    throw new Error(data.error || '上传失败');
                }
            } catch (error) {
                console.error('上传错误:', error);
                alert(error.message || '上传失败');
            }
        });

        return content;
    },
};

// 路由处理器
async function handleRoute(page) {
    const app = document.getElementById('app');
    const route = routes[page] || routes.home;
    const content = await route();
    app.innerHTML = '';
    app.appendChild(content);

    // 更新导航链接的激活状态
    document.querySelectorAll('[data-page]').forEach(link => {
        if (link.dataset.page === page) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// 事件监听器
document.addEventListener('DOMContentLoaded', () => {
    themeManager.init();
    authManager.init();
    
    // 更新事件监听器，使用事件委托
    document.addEventListener('click', async (e) => {
        // 检查是否点击了导航链接或菜单项
        const target = e.target.closest('[data-page], [data-action]');
        if (!target) return;

        e.preventDefault();
        e.stopPropagation();

        // 处理登出操作
        if (target.dataset.action === 'logout') {
            await authManager.logout();
            return;
        }

        // 处理页面导航
        if (target.dataset.page) {
            handleRoute(target.dataset.page);
            
            // 如果点击的是菜单项，关闭菜单
            const menu = target.closest('.user-menu');
            if (menu) {
                menu.classList.remove('active');
            }
        }
    });

    // 初始页面加载
    handleRoute('home');

    // 测试API连接
    fetch(`${API_URL}/test`)
        .then(response => response.json())
        .then(data => console.log('API测试:', data))
        .catch(error => console.error('API错误:', error));
}); 

// 检查是否为管理员
async function isAdmin() {
    try {
        const response = await fetch(`${API_URL}/check-admin`, {
            credentials: 'include'
        });
        const data = await response.json();
        return data.isAdmin;
    } catch (error) {
        return false;
    }
}

// 处理版本上传
async function handleVersionUpload(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch(`${API_URL}/versions`, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });
        
        if (response.ok) {
            alert('版本上传成功');
            handleRoute('home');
        } else {
            const data = await response.json();
            alert(data.error || '上传失败');
        }
    } catch (error) {
        console.error('上传错误:', error);
        alert('上传失败');
    }
} 

// 添加登录状态管理
const authManager = {
    isLoggedIn: false,
    isAdmin: false,
    user: null,

    async init() {
        try {
            const response = await fetch(`${API_URL}/check-admin`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('验证失败');
            }

            const data = await response.json();
            if (data.user) {
                this.user = data.user;
                this.isAdmin = data.isAdmin;
                this.isLoggedIn = true;
            } else {
                this.user = null;
                this.isAdmin = false;
                this.isLoggedIn = false;
            }
        } catch (error) {
            console.error('验证错误:', error);
            this.user = null;
            this.isAdmin = false;
            this.isLoggedIn = false;
        }
        this.updateUI();
    },

    updateUI() {
        const loginLink = document.querySelector('a[data-page="login"]');
        const registerLink = document.querySelector('a[data-page="register"]');
        const navRight = document.querySelector('.nav-right');
        
        if (this.isLoggedIn && this.user) {
            // 移除登录和注册链接
            loginLink?.remove();
            registerLink?.remove();

            // 添加用户头像
            const avatarHtml = `
                <div class="user-avatar" id="userAvatar">
                    <div class="avatar-image">${this.user.username[0]}</div>
                    <span>${this.user.username}</span>
                    <div class="user-menu">
                        ${this.isAdmin ? `
                            <a href="#" class="user-menu-item" data-page="upload">
                                <i class="bi bi-cloud-upload"></i>
                                上传新版本
                            </a>
                            <a href="#" class="user-menu-item" data-page="admin">
                                <i class="bi bi-gear"></i>
                                管理面板
                            </a>
                        ` : ''}
                        <a href="#" class="user-menu-item" data-page="profile">
                            <i class="bi bi-person"></i>
                            个人资料
                        </a>
                        <a href="#" class="user-menu-item logout" data-action="logout">
                            <i class="bi bi-box-arrow-right"></i>
                            退出登录
                        </a>
                    </div>
                </div>
            `;
            navRight.insertAdjacentHTML('beforeend', avatarHtml);

            // 添加头像点击事件
            const userAvatar = document.getElementById('userAvatar');
            if (userAvatar) {
                // 头像点击事件
                userAvatar.addEventListener('click', (e) => {
                    e.stopPropagation();
                    userAvatar.querySelector('.user-menu').classList.toggle('active');
                });

                // 菜单项点击事件
                userAvatar.querySelectorAll('.user-menu-item').forEach(item => {
                    item.addEventListener('click', async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // 关闭菜单
                        userAvatar.querySelector('.user-menu').classList.remove('active');

                        // 处理不同的菜单项
                        if (e.currentTarget.dataset.action === 'logout') {
                            await this.logout();
                        } else if (e.currentTarget.dataset.page) {
                            handleRoute(e.currentTarget.dataset.page);
                        }
                    });
                });

                // 点击其他地方关闭菜单
                document.addEventListener('click', () => {
                    const menu = userAvatar.querySelector('.user-menu');
                    if (menu) {
                        menu.classList.remove('active');
                    }
                });
            }
        } else {
            // 恢复登录和注册链接
            if (!loginLink) {
                navRight.insertAdjacentHTML('beforeend', `
                    <a href="#" data-page="login">登录</a>
                    <a href="#" data-page="register">注册</a>
                `);
            }
            // 移除头像
            document.querySelector('.user-avatar')?.remove();
        }
    },

    async logout() {
        try {
            const response = await fetch(`${API_URL}/logout`, {
                method: 'POST',
                credentials: 'include'
            });
            if (response.ok) {
                this.isLoggedIn = false;
                this.isAdmin = false;
                this.user = null;
                this.updateUI();
                handleRoute('home');
            }
        } catch (error) {
            console.error('登出错误:', error);
        }
    }
}; 
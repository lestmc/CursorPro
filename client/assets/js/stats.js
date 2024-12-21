// 统计图表管理
const statsManager = {
    async init() {
        if (!window.Chart) {
            console.error('Chart.js not loaded');
            return;
        }

        try {
            const [
                downloadStats,
                userStats,
                platformStats,
                accessStats
            ] = await Promise.all([
                this.fetchData('/api/stats/downloads'),
                this.fetchData('/api/stats/users'),
                this.fetchData('/api/stats/platforms'),
                this.fetchData('/api/stats/access')
            ]);

            this.renderDownloadChart(downloadStats);
            this.renderUserChart(userStats);
            this.renderPlatformChart(platformStats);
            this.renderAccessChart(accessStats);
        } catch (error) {
            console.error('加载统计数据失败:', error);
        }
    },

    async fetchData(url) {
        const response = await fetch(url, { credentials: 'include' });
        if (!response.ok) throw new Error('获取数据失败');
        return response.json();
    },

    renderDownloadChart(data) {
        const ctx = document.getElementById('downloadChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: '下载次数',
                    data: data.values,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: '下载趋势'
                    }
                }
            }
        });
    },

    renderUserChart(data) {
        const ctx = document.getElementById('userChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: '新用户注册',
                    data: data.values,
                    backgroundColor: 'rgb(54, 162, 235)'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: '用户增长'
                    }
                }
            }
        });
    },

    renderPlatformChart(data) {
        const ctx = document.getElementById('platformChart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Windows', 'MacOS', 'Linux'],
                datasets: [{
                    data: [
                        data.windows || 0,
                        data.mac || 0,
                        data.linux || 0
                    ],
                    backgroundColor: [
                        'rgb(54, 162, 235)',
                        'rgb(255, 99, 132)',
                        'rgb(255, 205, 86)'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: '平台分布'
                    }
                }
            }
        });
    },

    renderAccessChart(data) {
        const ctx = document.getElementById('accessChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: '访问量',
                    data: data.values,
                    backgroundColor: 'rgb(153, 102, 255)'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: '网站访问量'
                    }
                }
            }
        });
    }
};

// 导出统计管理器
export default statsManager; 
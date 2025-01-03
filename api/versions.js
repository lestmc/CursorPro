import { Version } from './models/Version';
import { DownloadStats } from './models/Stats';
import { verifyToken, isAdmin } from './middleware/auth';
import { handleMultipleUploads } from './utils/uploadHandler';
import dbConnect from './utils/dbConnect';

export const config = {
    api: {
        bodyParser: false
    }
};

export default async function handler(req, res) {
    await dbConnect();

    switch (req.method) {
        case 'GET':
            return handleGetVersions(req, res);
        case 'POST':
            return verifyToken(req, res, () => 
                isAdmin(req, res, () => 
                    handleUploadVersion(req, res)
                )
            );
        default:
            res.status(405).json({ error: '方法不允许' });
    }
}

async function handleGetVersions(req, res) {
    try {
        const versions = await Version.find()
            .sort({ createdAt: -1 })
            .limit(req.query.limit ? parseInt(req.query.limit) : 10);

        res.json(versions);
    } catch (error) {
        console.error('获取版本列表失败:', error);
        res.status(500).json({ error: '获取版本列表失败' });
    }
}

async function handleUploadVersion(req, res) {
    try {
        // 使用新的上传处理器
        const urls = await handleMultipleUploads(req, res);
        
        const { version, description } = req.body;

        const newVersion = new Version({
            version,
            description,
            windowsUrl: urls.windowsUrl,
            macUrl: urls.macUrl,
            linuxUrl: urls.linuxUrl
        });

        await newVersion.save();

        res.status(201).json({
            message: '版本上传成功',
            version: newVersion
        });
    } catch (error) {
        console.error('版本上传失败:', error);
        res.status(500).json({ error: error.message || '版本上传失败' });
    }
}

// 处理下载请求
export async function handleDownload(req, res) {
    try {
        const { versionId, platform } = req.params;
        const version = await Version.findById(versionId);

        if (!version) {
            return res.status(404).json({ error: '版本不存在' });
        }

        let downloadUrl;
        switch (platform) {
            case 'windows':
                downloadUrl = version.windowsUrl;
                break;
            case 'mac':
                downloadUrl = version.macUrl;
                break;
            case 'linux':
                downloadUrl = version.linuxUrl;
                break;
            default:
                return res.status(400).json({ error: '不支持的平台' });
        }

        if (!downloadUrl) {
            return res.status(404).json({ error: '文件不存在' });
        }

        // 记录下载统计
        const stats = new DownloadStats({
            versionId: version._id,
            platform,
            userId: req.user?.id,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });
        await stats.save();

        // 更新版本下载计数
        version.downloadCount += 1;
        await version.save();

        // 重定向到下载URL
        res.redirect(downloadUrl);
    } catch (error) {
        console.error('处理下载请求失败:', error);
        res.status(500).json({ error: '下载失败' });
    }
} 
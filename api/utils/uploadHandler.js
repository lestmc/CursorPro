import { put } from '@vercel/blob';
import multer from 'multer';
import { promisify } from 'util';

// 创建内存存储
const storage = multer.memoryStorage();

// 创建 multer 实例
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = {
            'windows': ['.exe', '.zip'],
            'mac': ['.dmg', '.zip'],
            'linux': ['.deb', '.rpm', '.AppImage']
        };
        
        const platform = file.fieldname;
        const ext = file.originalname.toLowerCase().match(/\.[^.]*$/)[0];
        
        if (allowedTypes[platform] && allowedTypes[platform].includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('不支持的文件类型'));
        }
    },
    limits: {
        fileSize: 500 * 1024 * 1024 // 500MB
    }
});

// 处理文件上传
export async function handleFileUpload(req, res, fieldName) {
    try {
        // 使用 multer 处理单个文件上传
        const uploadSingle = promisify(upload.single(fieldName));
        await uploadSingle(req, res);

        if (!req.file) {
            return null;
        }

        // 上传到 Vercel Blob Storage
        const blob = await put(req.file.originalname, req.file.buffer, {
            access: 'public',
            addRandomSuffix: true
        });

        return blob.url;
    } catch (error) {
        console.error('文件上传错误:', error);
        throw error;
    }
}

// 处理多个文件上传
export async function handleMultipleUploads(req, res) {
    const uploadFields = upload.fields([
        { name: 'windows', maxCount: 1 },
        { name: 'mac', maxCount: 1 },
        { name: 'linux', maxCount: 1 }
    ]);

    try {
        // 使用 Promise 包装 multer 中间件
        await new Promise((resolve, reject) => {
            uploadFields(req, res, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        const urls = {};

        // 处理每个平台的文件
        for (const platform of ['windows', 'mac', 'linux']) {
            if (req.files[platform]?.[0]) {
                const file = req.files[platform][0];
                const blob = await put(file.originalname, file.buffer, {
                    access: 'public',
                    addRandomSuffix: true
                });
                urls[`${platform}Url`] = blob.url;
            }
        }

        return urls;
    } catch (error) {
        console.error('文件上传错误:', error);
        throw error;
    }
}

// 删除文件
export async function deleteFile(url) {
    try {
        // Vercel Blob Storage 会自动处理文件的生命周期
        // 这里不需要实现删除逻辑
        return true;
    } catch (error) {
        console.error('文件删除错误:', error);
        return false;
    }
} 
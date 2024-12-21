import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

export const upload = multer({
    storage: multerS3({
        s3: s3Client,
        bucket: process.env.AWS_BUCKET_NAME,
        acl: 'public-read',
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, `${file.fieldname}-${uniqueSuffix}-${file.originalname}`);
        }
    }),
    fileFilter: function (req, file, cb) {
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
            cb(new Error('Invalid file type'));
        }
    },
    limits: {
        fileSize: 500 * 1024 * 1024 // 500MB
    }
});

export async function deleteFile(key) {
    try {
        await s3Client.send(new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key
        }));
        return true;
    } catch (error) {
        console.error('Error deleting file from S3:', error);
        return false;
    }
} 
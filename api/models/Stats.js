const mongoose = require('mongoose');

const downloadStatsSchema = new mongoose.Schema({
    versionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Version'
    },
    platform: {
        type: String,
        enum: ['windows', 'mac', 'linux']
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    ipAddress: String,
    userAgent: String,
    downloadedAt: {
        type: Date,
        default: Date.now
    }
});

const accessLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    ipAddress: String,
    userAgent: String,
    action: String,
    status: Number,
    details: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const DownloadStats = mongoose.models.DownloadStats || mongoose.model('DownloadStats', downloadStatsSchema);
const AccessLog = mongoose.models.AccessLog || mongoose.model('AccessLog', accessLogSchema);

module.exports = {
    DownloadStats,
    AccessLog
}; 
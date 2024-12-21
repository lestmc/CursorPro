const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema({
    version: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    windowsUrl: {
        type: String
    },
    macUrl: {
        type: String
    },
    linuxUrl: {
        type: String
    },
    downloadCount: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.models.Version || mongoose.model('Version', versionSchema); 
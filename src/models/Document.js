const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['resume', 'cover_letter', 'other'], default: 'resume' },
    version: { type: String, default: 'v1' },
    originalName: { type: String },
    mimeType: { type: String },
    size: { type: Number },
    fileData: { type: String },   // Base64-encoded file content
    notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);

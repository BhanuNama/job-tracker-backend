const mongoose = require('mongoose');

const diaryEntrySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // 'yyyy-MM-dd' string key
    text: { type: String, required: true, trim: true },
}, { timestamps: true });

// One entry per user per date
diaryEntrySchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DiaryEntry', diaryEntrySchema);

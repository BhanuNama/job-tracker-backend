const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    company: { type: String, required: true, trim: true },
    role: { type: String, trim: true },
    baseSalary: { type: Number },
    bonus: { type: Number },
    equity: { type: String },  // e.g. "0.1%", "10000 RSUs"
    pto: { type: Number },  // days
    remote: { type: String, enum: ['remote', 'hybrid', 'onsite'], default: 'hybrid' },
    culture: { type: Number, min: 1, max: 5, default: 3 },
    growth: { type: Number, min: 1, max: 5, default: 3 },
    manager: { type: Number, min: 1, max: 5, default: 3 },
    health: { type: String },
    notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Offer', offerSchema);

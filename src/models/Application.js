const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    stage: {
        type: String,
        enum: ['Saved', 'Applied', 'Screening', 'Interviewing', 'Final Round', 'Offer', 'Closed'],
        default: 'Saved',
    },
    status: { type: String, enum: ['active', 'rejected', 'withdrawn', 'accepted'], default: 'active' },
    salary: {
        min: Number,
        max: Number,
        currency: { type: String, default: 'USD' },
    },
    expectedSalary: { type: Number },
    appliedThrough: { type: String, default: 'Company Website' },
    resumeUsed: { type: String, default: '' },
    location: { type: String, trim: true },
    remote: { type: String, enum: ['remote', 'hybrid', 'onsite'], default: 'onsite' },
    jobUrl: { type: String, trim: true },
    jobDescription: { type: String },
    appliedAt: { type: Date },
    lastContact: { type: Date },
    nextFollowUp: { type: Date },
    notes: { type: String },
    rating: { type: Number, min: 1, max: 5 },
    skills: [String],
    lastContact: { type: Date },
    documents: [{
        type: { type: String, enum: ['resume', 'cover_letter', 'other'] },
        name: String,
        filename: String,
        uploadedAt: { type: Date, default: Date.now },
    }],
    interviews: [{
        type: { type: String, enum: ['phone', 'technical', 'behavioral', 'panel', 'final'] },
        date: Date,
        notes: String,
        outcome: { type: String, enum: ['pending', 'passed', 'failed'] },
    }],
    offerDetails: {
        baseSalary: Number,
        bonus: Number,
        equity: String,
        pto: Number,
        remote: String,
        startDate: Date,
        deadline: Date,
        notes: String,
    },
    color: { type: String, default: '#00E5CC' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
}, { timestamps: true });

applicationSchema.index({ userId: 1, stage: 1 });
applicationSchema.index({ userId: 1, lastContact: 1 });

module.exports = mongoose.model('Application', applicationSchema);

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String },
    authProvider: { type: String, default: 'local' },
    avatar: { type: String },
    profile: {
        title: String,
        location: String,
        targetRole: String,
        targetSalary: Number,
        skills: [String],
    },
    preferences: {
        theme: { type: String, default: 'dark' },
        ghostingRadarDays: { type: Number, default: 5 },
        emailNotifications: { type: Boolean, default: true },
    },
    moodLog: [{
        date: { type: Date, default: Date.now },
        score: { type: Number, min: 1, max: 5 },
        note: String,
        applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
    }],
    streaks: {
        daysApplied: { type: Number, default: 0 },
        interviewsBooked: { type: Number, default: 0 },
        offersReceived: { type: Number, default: 0 },
        lastActive: Date,
    },
}, { timestamps: true });

userSchema.pre('save', async function () {
    if (!this.isModified('password') || !this.password) return;
    this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    return user;
};

module.exports = mongoose.model('User', userSchema);

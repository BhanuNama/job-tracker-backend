const router = require('express').Router();
const Application = require('../models/Application');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { differenceInDays } = require('date-fns');

// GET full dashboard analytics
router.get('/', auth, async (req, res) => {
    try {
        const userId = req.user._id;
        const apps = await Application.find({ userId });

        const total = apps.length;
        const byStage = {};
        const stages = ['Saved', 'Applied', 'Screening', 'Interviewing', 'Final Round', 'Offer', 'Closed'];
        stages.forEach(s => { byStage[s] = 0; });
        apps.forEach(a => { byStage[a.stage] = (byStage[a.stage] || 0) + 1; });

        const offers = apps.filter(a => a.stage === 'Offer' || a.stage === 'Closed' && a.status === 'accepted').length;
        const interviews = apps.filter(a => ['Interviewing', 'Final Round', 'Offer'].includes(a.stage)).length;
        const applied = apps.filter(a => a.stage !== 'Saved').length;
        const responseRate = applied > 0 ? Math.round((interviews / applied) * 100) : 0;

        // Funnel conversion rates
        const funnel = stages.map((stage, idx) => ({
            stage,
            count: byStage[stage],
            conversionFromPrev: idx === 0 ? 100 :
                byStage[stages[idx - 1]] > 0
                    ? Math.round((byStage[stage] / byStage[stages[idx - 1]]) * 100)
                    : 0,
        }));

        // Ghosting radar - applications needing follow-up
        const now = new Date();
        const ghosting = apps
            .filter(a => a.lastContact && ['Applied', 'Screening'].includes(a.stage))
            .map(a => ({
                _id: a._id,
                company: a.company,
                role: a.role,
                lastContact: a.lastContact,
                daysSince: differenceInDays(now, new Date(a.lastContact)),
                stage: a.stage,
            }))
            .filter(a => a.daysSince > 5)
            .sort((a, b) => b.daysSince - a.daysSince)
            .slice(0, 10);

        // Weekly velocity - last 8 weeks
        const weeklyVelocity = [];
        for (let i = 7; i >= 0; i--) {
            const weekStart = new Date(now);
            weekStart.setDate(weekStart.getDate() - i * 7);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 7);
            const count = apps.filter(a => {
                if (!a.appliedAt) return false;
                const d = new Date(a.appliedAt);
                return d >= weekStart && d < weekEnd;
            }).length;
            weeklyVelocity.push({
                week: `W${8 - i}`,
                date: weekStart.toISOString().split('T')[0],
                applications: count,
            });
        }

        // Mood trend (last 30 days)
        const user = await User.findById(userId);
        const moodTrend = (user.moodLog || [])
            .filter(m => differenceInDays(now, new Date(m.date)) <= 30)
            .map(m => ({ date: m.date, score: m.score, note: m.note }));

        // Calculate streaks dynamically from actual user applications
        const daysApplied = new Set(apps.filter(a => a.appliedAt).map(a => new Date(a.appliedAt).toISOString().split('T')[0])).size;
        const streaks = {
            daysApplied,
            interviewsBooked: interviews,
            offersReceived: offers
        };

        res.json({
            total,
            applied,
            interviews,
            offers,
            responseRate,
            byStage,
            funnel,
            ghosting,
            weeklyVelocity,
            moodTrend,
            streaks,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST log a mood entry directly to the user profile
router.post('/mood', auth, async (req, res) => {
    try {
        const { score, note } = req.body;
        const user = await User.findByIdAndUpdate(req.user._id, {
            $push: { moodLog: { score, note, date: new Date() } },
        }, { new: true });
        res.json({ success: true, moodLog: user.moodLog });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const DiaryEntry = require('../models/DiaryEntry');
const auth = require('../middleware/auth');

// GET all entries for logged-in user
router.get('/', auth, async (req, res) => {
    try {
        const entries = await DiaryEntry.find({ user: req.user.id }).sort({ date: -1 });
        // Return as { 'yyyy-MM-dd': { text, createdAt, updatedAt } } map
        const map = {};
        entries.forEach(e => {
            map[e.date] = { text: e.text, createdAt: e.createdAt, updatedAt: e.updatedAt };
        });
        res.json(map);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT (upsert) an entry for a specific date
router.put('/:date', auth, async (req, res) => {
    try {
        const { date } = req.params;
        const { text } = req.body;
        if (!text?.trim()) return res.status(400).json({ error: 'Text is required' });

        const entry = await DiaryEntry.findOneAndUpdate(
            { user: req.user.id, date },
            { text: text.trim() },
            { upsert: true, new: true, runValidators: true }
        );
        res.json({ date: entry.date, text: entry.text, createdAt: entry.createdAt, updatedAt: entry.updatedAt });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE an entry for a specific date
router.delete('/:date', auth, async (req, res) => {
    try {
        await DiaryEntry.deleteOne({ user: req.user.id, date: req.params.date });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

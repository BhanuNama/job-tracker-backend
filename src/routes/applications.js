const router = require('express').Router();
const Application = require('../models/Application');
const auth = require('../middleware/auth');

// GET all applications for user
router.get('/', auth, async (req, res) => {
    try {
        const { stage, status, search } = req.query;
        const query = { userId: req.user._id };
        if (stage) query.stage = stage;
        if (status) query.status = status;
        if (search) query.$or = [
            { company: { $regex: search, $options: 'i' } },
            { role: { $regex: search, $options: 'i' } },
        ];
        const apps = await Application.find(query).sort({ updatedAt: -1 });
        res.json(apps);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET single application
router.get('/:id', auth, async (req, res) => {
    try {
        const app = await Application.findOne({ _id: req.params.id, userId: req.user._id });
        if (!app) return res.status(404).json({ error: 'Not found' });
        res.json(app);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE application
router.post('/', auth, async (req, res) => {
    try {
        const app = await Application.create({ ...req.body, userId: req.user._id });
        res.status(201).json(app);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// UPDATE application
router.put('/:id', auth, async (req, res) => {
    try {
        const app = await Application.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { $set: req.body },
            { new: true, runValidators: true }
        );
        if (!app) return res.status(404).json({ error: 'Not found' });
        res.json(app);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE application
router.delete('/:id', auth, async (req, res) => {
    try {
        const app = await Application.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        if (!app) return res.status(404).json({ error: 'Not found' });
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH stage (for Kanban drag-and-drop)
router.patch('/:id/stage', auth, async (req, res) => {
    try {
        const { stage } = req.body;
        const app = await Application.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { $set: { stage, lastContact: stage === 'Applied' ? new Date() : undefined } },
            { new: true }
        );
        if (!app) return res.status(404).json({ error: 'Not found' });
        res.json(app);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ADD interview
router.post('/:id/interviews', auth, async (req, res) => {
    try {
        const app = await Application.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { $push: { interviews: req.body } },
            { new: true }
        );
        res.json(app);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// LOG mood
router.post('/:id/mood', auth, async (req, res) => {
    try {
        const { score, note } = req.body;
        const User = require('../models/User');
        await User.findByIdAndUpdate(req.user._id, {
            $push: { moodLog: { score, note, applicationId: req.params.id } },
        });
        res.json({ message: 'Mood logged' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;

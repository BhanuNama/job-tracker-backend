const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// ── Validation helpers ────────────────────────────────────────────────────────
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

// Register
router.post('/register', async (req, res) => {
    try {
        const name = req.body.name?.trim();
        const email = req.body.email?.trim().toLowerCase();
        const password = req.body.password;

        if (!name || !email || !password)
            return res.status(400).json({ error: 'Name, email and password are required' });
        if (name.length < 2 || name.length > 60)
            return res.status(400).json({ error: 'Name must be 2–60 characters' });
        if (!isEmail(email))
            return res.status(400).json({ error: 'Invalid email address' });
        if (password.length < 8)
            return res.status(400).json({ error: 'Password must be at least 8 characters' });

        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ error: 'Email already in use' });

        const user = await User.create({ name, email, password });
        const token = signToken(user._id);
        res.status(201).json({ token, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const email = req.body.email?.trim().toLowerCase();
        const password = req.body.password;

        if (!email || !password)
            return res.status(400).json({ error: 'Email and password are required' });
        if (!isEmail(email))
            return res.status(400).json({ error: 'Invalid email address' });

        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ error: 'User not registered. Please create an account.' });
        if (!user.password) return res.status(401).json({ error: 'Invalid credentials' });

        const valid = await user.comparePassword(password);
        if (!valid) return res.status(401).json({ error: 'Incorrect password' });

        const token = signToken(user._id);
        res.json({ token, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get current user
router.get('/me', auth, async (req, res) => {
    res.json(req.user);
});

// Update profile — strip password field so it can't be changed here
router.put('/profile', auth, async (req, res) => {
    try {
        const { password, email, __v, _id, ...safeUpdates } = req.body;
        if (Object.keys(safeUpdates).length === 0)
            return res.status(400).json({ error: 'No valid fields to update' });

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: safeUpdates },
            { new: true, runValidators: true }
        );
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Demo login
router.post('/demo', async (req, res) => {
    try {
        let demoUser = await User.findOne({ email: 'demo@jobtrack.pro' });
        if (!demoUser) {
            demoUser = await User.create({
                name: 'Alex Johnson',
                email: 'demo@jobtrack.pro',
                password: 'demo123456',
                profile: {
                    title: 'Senior Software Engineer',
                    location: 'San Francisco, CA',
                    targetRole: 'Engineering Manager',
                    skills: ['React', 'Node.js', 'Python', 'AWS'],
                },
            });
        }
        const token = signToken(demoUser._id);
        res.json({ token, user: demoUser });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;


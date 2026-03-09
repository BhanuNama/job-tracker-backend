const express = require('express');
const router = express.Router();
const Offer = require('../models/Offer');
const auth = require('../middleware/auth');

// GET all offers for user
router.get('/', auth, async (req, res) => {
    try {
        const offers = await Offer.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(offers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create offer
router.post('/', auth, async (req, res) => {
    try {
        const offer = await Offer.create({ user: req.user.id, ...req.body });
        res.status(201).json(offer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT update offer
router.put('/:id', auth, async (req, res) => {
    try {
        const offer = await Offer.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            req.body,
            { new: true, runValidators: true }
        );
        if (!offer) return res.status(404).json({ error: 'Not found' });
        res.json(offer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE offer
router.delete('/:id', auth, async (req, res) => {
    try {
        await Offer.deleteOne({ _id: req.params.id, user: req.user.id });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

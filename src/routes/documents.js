const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const auth = require('../middleware/auth');

// GET all documents for user (without fileData to keep response small)
router.get('/', auth, async (req, res) => {
    try {
        const docs = await Document.find({ user: req.user.id })
            .select('-fileData')
            .sort({ createdAt: -1 });
        res.json(docs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET single document with fileData (for download/preview)
router.get('/:id', auth, async (req, res) => {
    try {
        const doc = await Document.findOne({ _id: req.params.id, user: req.user.id });
        if (!doc) return res.status(404).json({ error: 'Not found' });
        res.json(doc);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST upload a document (Base64 in body)
router.post('/', auth, async (req, res) => {
    try {
        const { name, type, version, originalName, mimeType, size, fileData, notes } = req.body;
        if (!name || !fileData) return res.status(400).json({ error: 'name and fileData required' });

        const doc = await Document.create({
            user: req.user.id,
            name, type, version, originalName, mimeType, size, fileData, notes,
        });
        // Return without fileData
        const { fileData: _, ...safe } = doc.toObject();
        res.status(201).json(safe);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE a document
router.delete('/:id', auth, async (req, res) => {
    try {
        await Document.deleteOne({ _id: req.params.id, user: req.user.id });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'No token provided' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (!user) return res.status(401).json({ error: 'Invalid token' });

        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
};

module.exports = auth;

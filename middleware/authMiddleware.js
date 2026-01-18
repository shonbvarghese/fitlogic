const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // req.user = await User.findById(decoded.id).select('-password');
            // Fix for Mock Model (doesn't support .select chaining)
            const user = await User.findById(decoded.id);
            if (user) {
                // Delete password from object before attaching
                const userObj = user.toObject ? user.toObject() : { ...user };
                delete userObj.password;
                req.user = userObj;
            } else {
                return res.status(401).json({ message: 'User not found' });
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };

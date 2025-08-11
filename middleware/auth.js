import User from '../models/User.js';
import jwt from 'jsonwebtoken';

export const auth = async (req, res, next) => {
    try {
        console.log('Auth middleware - checking token...');
        const token = req.cookies.token;
        
        if (!token) {
            console.log('No token found');
            return res.status(401).json({ error: 'Please authenticate.' });
        }

        console.log('Verifying token...');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token verified, user ID:', decoded.userId);

        const user = await User.findById(decoded.userId);
        if (!user) {
            console.log('User not found:', decoded.userId);
            return res.status(401).json({ error: 'Please authenticate.' });
        }

        // Check if user is blocked
        if (user.blocked && user.blocked.status) {
            return res.status(403).json({ 
                error: 'Account blocked',
                reason: user.blocked.reason || 'No reason provided',
                blockedAt: user.blocked.blockedAt
            });
        }

        req.token = token;
        req.user = user;
        req.userId = user._id;
        console.log('Auth successful for user:', user._id);
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ error: 'Please authenticate.' });
    }
};

export const adminAuth = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        next();
    } catch (error) {
        console.error('Admin auth error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const isAdmin = async (req, res, next) => {
    try {
        // First run the auth middleware to get the user
        await auth(req, res, async () => {
            const user = await User.findById(req.userId);
            if (!user || user.role !== 'admin') {
                return res.status(403).json({ error: 'Admin access required' });
            }
            next();
        });
    } catch (error) {
        console.error('isAdmin middleware error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

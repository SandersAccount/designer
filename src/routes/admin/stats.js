import express from 'express';
import User from '../../../models/User.js';
import { adminAuth } from '../../../middleware/auth.js';

const router = express.Router();

// Get admin stats
router.get('/', [adminAuth], async (req, res) => {
    try {
        // Get total users
        const totalUsers = await User.countDocuments();

        // Get pro users
        const proUsers = await User.countDocuments({
            'subscription.plan': 'pro',
            'subscription.status': 'active'
        });

        // Get total credits
        const creditsResult = await User.aggregate([
            { $group: { _id: null, total: { $sum: '$credits' } } }
        ]);
        const totalCredits = creditsResult[0]?.total || 0;

        // Get pending credits
        const pendingResult = await User.aggregate([
            { $unwind: '$creditRequests' },
            { $match: { 'creditRequests.status': 'pending' } },
            { $group: { _id: null, total: { $sum: '$creditRequests.credits' } } }
        ]);
        const pendingCredits = pendingResult[0]?.total || 0;

        // Get total stickers
        const stickersResult = await User.aggregate([
            { $group: { _id: null, total: { $sum: '$usage.imagesGenerated' } } }
        ]);
        const totalStickers = stickersResult[0]?.total || 0;

        // Get total presets
        const presetsResult = await User.aggregate([
            { $group: { _id: null, total: { $sum: '$usage.savedPresets' } } }
        ]);
        const totalPresets = presetsResult[0]?.total || 0;

        res.json({
            users: {
                total: totalUsers,
                pro: proUsers
            },
            credits: {
                total: totalCredits,
                pending: pendingCredits
            },
            stickers: {
                total: totalStickers
            },
            presets: {
                total: totalPresets
            }
        });
    } catch (error) {
        console.error('Error getting admin stats:', error);
        res.status(500).json({ error: 'Failed to get admin stats' });
    }
});

export default router;


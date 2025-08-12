import express from 'express';
import { auth } from '../../middleware/auth.js';

const router = express.Router();

// Get user profile
router.get('/profile', async (req, res) => {
    try {
        // For now, return a default user profile
        // In production, this would check authentication and get user from database
        const userProfile = {
            id: 'default-user',
            username: 'Guest User',
            email: 'guest@example.com',
            role: 'user', // 'user' or 'admin'
            isAdmin: false,
            subscription: {
                plan: 'free',
                status: 'active'
            },
            preferences: {
                theme: 'light',
                language: 'en'
            },
            stats: {
                projectsCreated: 0,
                templatesUsed: 0,
                imagesGenerated: 0
            }
        };

        res.json(userProfile);
    } catch (error) {
        console.error('[User] Error getting profile:', error);
        res.status(500).json({ error: 'Failed to get user profile' });
    }
});

// Update user profile
router.put('/profile', async (req, res) => {
    try {
        const { profile } = req.body;
        
        // In a real app, you would update the user in the database
        // For now, just return success
        res.json({ 
            message: 'Profile updated successfully',
            profile: profile 
        });
    } catch (error) {
        console.error('[User] Error updating profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Get user statistics
router.get('/stats', async (req, res) => {
    try {
        const stats = {
            projectsCreated: 0,
            templatesUsed: 0,
            imagesGenerated: 0,
            storageUsed: '0 MB',
            accountAge: '0 days'
        };

        res.json(stats);
    } catch (error) {
        console.error('[User] Error getting stats:', error);
        res.status(500).json({ error: 'Failed to get user stats' });
    }
});

export default router;

import express from 'express';
import User from '../../models/User.js';
import { adminAuth } from '../../middleware/auth.js';

const router = express.Router();

// Get all users
router.get('/', [adminAuth], async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .sort('-createdAt');

        res.json(users);
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
});

// Get user details
router.get('/:userId', [adminAuth], async (req, res) => {
    try {
        console.log('Fetching user details for user ID:', req.params.userId);
        const user = await User.findById(req.params.userId).select('-password');
        if (!user) {
            console.log('User not found');
            return res.status(404).json({ error: 'User not found' });
        }
        console.log('User found');
        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update user
router.put('/:userId', [adminAuth], async (req, res) => {
    try {
        const { userId } = req.params;
        const { name, email, password, credits } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Don't allow editing admin user through this endpoint
        if (user.role === 'admin') {
            return res.status(403).json({ error: 'Cannot edit admin user through this endpoint' });
        }

        // Update user fields
        if (name) user.name = name;
        if (email) user.email = email;
        if (password) user.password = password; // Will be hashed by the User model middleware
        if (credits !== undefined) user.credits = credits;

        await user.save();

        res.json({
            message: 'User updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                credits: user.credits,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// Delete user
router.delete('/:userId', [adminAuth], async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Don't allow deleting admin user
        if (user.role === 'admin') {
            return res.status(403).json({ error: 'Cannot delete admin user' });
        }

        await User.findByIdAndDelete(userId);

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Create user
router.post('/create', [adminAuth], async (req, res) => {
    try {
        const { name, email, password, credits, registered, role, subscription, creditHistory, usage } = req.body;

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const user = new User({
            name,
            email,
            password,
            credits,
            registered,
            role,
            subscription,
            creditHistory,
            usage
        });

        await user.save();

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                credits: user.credits,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

export default router;

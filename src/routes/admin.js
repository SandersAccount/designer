import express from 'express';
import User from '../../models/User.js';
import { auth, adminAuth } from '../../middleware/auth.js';
import Variable from '../../models/Variable.js';
import IPNNotification from '../../models/IPNNotification.js';
import usersRoutes from './admin/users.js';
import creditsRoutes from './admin/credits.js';
import statsRoutes from './admin/stats.js';
import productsRoutes from './admin/products.js';

const router = express.Router();

// Root endpoint
router.get('/', [auth, adminAuth], async (req, res) => {
    res.json({
        message: 'Admin API',
        endpoints: {
            '/users': 'Get all users (with pagination)',
            '/users/:userId': 'Get user details',
            '/users/:userId': 'Update user',
            '/stats': 'Get system statistics',
            '/credits/approve/:requestId': 'Approve credit request'
        }
    });
});

// Use the new route files
router.use('/users', [auth, adminAuth], usersRoutes);
router.use('/credits', [auth, adminAuth], creditsRoutes);
router.use('/stats', [auth, adminAuth], statsRoutes);
router.use('/products', [auth, adminAuth], productsRoutes);

// Block/Unblock user
router.post('/users/:userId/block', [auth, adminAuth], async (req, res) => {
    try {
        const { userId } = req.params;
        const { blocked, reason } = req.body;
        const adminId = req.user._id; // Get admin ID from auth middleware

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Don't allow blocking admin users
        if (user.role === 'admin') {
            return res.status(403).json({ error: 'Cannot block admin users' });
        }

        // Update blocked status
        user.blocked = {
            status: blocked,
            reason: blocked ? reason : null,
            blockedAt: blocked ? new Date() : null,
            blockedBy: blocked ? adminId : null
        };

        await user.save();

        res.json({
            message: `User ${blocked ? 'blocked' : 'unblocked'} successfully`,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                credits: user.credits,
                role: user.role,
                blocked: user.blocked
            }
        });
    } catch (error) {
        console.error('Error updating user block status:', error);
        res.status(500).json({ error: 'Failed to update user block status' });
    }
});

// Add this route to check variables
router.get('/check-variables', async (req, res) => {
    try {
        const variables = await Variable.find({});
        res.json(variables);
    } catch (error) {
        console.error('Error checking variables:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add product update route
router.post('/update-product', async (req, res) => {
    try {
        const { email, productId } = req.body;
        
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get product information
        const unlimitedVar = await Variable.findOne({ key: 'unlimitedProduct' });
        const stickerLabVar = await Variable.findOne({ key: 'stickerLabProduct' });
        
        const cleanProductId = productId.replace('wso_', '');
        const unlimitedProductId = unlimitedVar?.value?.productId?.replace('wso_', '') || 'kwc43t';
        const stickerLabProductId = stickerLabVar?.value?.productId?.replace('wso_', '') || 'svyh7b';

        // Update user based on product
        if (cleanProductId === unlimitedProductId) {
            user.credits = 123654; // Unlimited credits
            user.subscription = {
                plan: 'unlimited',
                status: 'active'
            };
            user.creditHistory.push({
                product: 'StickerLab Unlimited (Manual Update)',
                purchasedAt: new Date()
            });
        } else if (cleanProductId === stickerLabProductId) {
            if (user.credits !== 123654) { // Only add if not unlimited
                user.credits = (user.credits || 0) + 250;
            }
            user.creditHistory.push({
                product: 'StickerLab (Manual Update)',
                purchasedAt: new Date()
            });
        } else {
            return res.status(400).json({ error: 'Invalid product ID' });
        }

        await user.save();
        res.json({ message: 'User updated successfully', user });

    } catch (error) {
        console.error('Error updating user product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add route to get IPN notifications
router.get('/notifications', async (req, res) => {
    try {
        const notifications = await IPNNotification.find()
            .sort({ timestamp: -1 }) // Most recent first
            .limit(50); // Only get last 50 notifications
        res.json(notifications);
    } catch (error) {
        console.error('Error getting notifications:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Special endpoint for admin to update their own credits
router.post('/credits/update', [auth, adminAuth], async (req, res) => {
    try {
        const { credits } = req.body;
        if (typeof credits !== 'number') {
            return res.status(400).json({ error: 'Credits must be a number' });
        }
        
        // Only allow admin to update their own credits
        const admin = await User.findById(req.user.id);
        if (!admin || admin.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        // Update admin credits
        admin.credits = credits;
        await admin.save();

        res.json({
            message: 'Admin credits updated successfully',
            credits: admin.credits
        });
    } catch (error) {
        console.error('Error updating admin credits:', error);
        res.status(500).json({ error: 'Failed to update admin credits' });
    }
});

router.post('/register', async (req, res) => {
    const { email, password, name } = req.body; // Include name in the registration data

    // Check if the email was used to purchase StickerLab
    const stickerLabPurchase = await User.findOne({ email: email, 'creditHistory.product': 'StickerLab' });

    // If the email does not correspond to a purchase, return an error
    if (!stickerLabPurchase) {
        return res.status(400).json({ error: 'Please, register with the same email that you used to purchase the StickerLab.' });
    }

    // If the user already exists, allow registration without alerts
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        // If the user exists, we can allow registration without alerts
        existingUser.name = name; // Update the name if needed
        await existingUser.save();
        return res.status(200).json({ message: 'Registration successful!' });
    }

    // Create the new user with the provided name
    const newUser = new User({
        email,
        name, // Allow the user to set their name
        password, // Hash the password as needed
    });
    await newUser.save();
    res.status(201).json({ message: 'Registration successful!' });
});

export default router;



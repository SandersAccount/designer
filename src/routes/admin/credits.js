import express from 'express';
import User from '../../../models/User.js';
import { adminAuth } from '../../../middleware/auth.js';

const router = express.Router();

// Approve credit request
router.post('/approve/:requestId', [adminAuth], async (req, res) => {
    try {
        console.log('Processing credit request approval:', req.params.requestId);

        if (!req.params.requestId) {
            console.log('No request ID provided');
            return res.status(400).json({ error: 'Request ID is required' });
        }

        // Find the user with the credit request
        const user = await User.findOne({
            'creditRequests._id': req.params.requestId
        });

        if (!user) {
            console.log('Credit request not found');
            return res.status(404).json({ error: 'Credit request not found' });
        }

        // Find the specific credit request
        const creditRequest = user.creditRequests.find(
            req => req._id.toString() === req.params.requestId
        );

        if (!creditRequest) {
            console.log('Credit request not found in user');
            return res.status(404).json({ error: 'Credit request not found' });
        }

        // Update user credits and credit request status
        user.credits += creditRequest.credits;
        creditRequest.status = 'approved';

        await user.save();

        res.json({
            message: 'Credit request approved successfully',
            credits: user.credits
        });
    } catch (error) {
        console.error('Error approving credit request:', error);
        res.status(500).json({ error: 'Failed to approve credit request' });
    }
});

export default router;


import express from 'express';
import User from '../../../models/User.js';
import { adminAuth } from '../../../middleware/auth.js';

const router = express.Router();

// Update product
router.post('/update-product', async (req, res) => {
    try {
        const { email, productId } = req.body;

        // Find user
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).send('User not found.');
        }

        // Update product ID
        user.productId = productId;
        await user.save();

        res.status(200).send('Product ID updated successfully.');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating product ID.');
    }
});

export default router;


import express from 'express';
import fetch from 'node-fetch';
import { storage } from '../utils/storage.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Endpoint to proxy image downloads
router.get('/', auth, async (req, res) => {
    try {
        const { imageUrl } = req.query;

        if (!imageUrl) {
            return res.status(400).json({ error: 'Image URL is required' });
        }

        // Ensure URL is from our B2 bucket
        if (!imageUrl.includes('f005.backblazeb2.com')) {
            return res.status(400).json({ error: 'Invalid image URL' });
        }

        try {
            // Use the storage utility to get authorized URL
            await storage.ensureAuthorized();
            const authData = storage.getAuthData();

            if (!authData || !authData.authorizationToken) {
                throw new Error('Failed to get B2 authorization token');
            }

            console.log('[Download] Fetching image with B2 authorization...');

            // Fetch image from B2 with authorization header
            const response = await fetch(imageUrl, {
                headers: {
                    'Authorization': authData.authorizationToken
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('image/')) {
                throw new Error('Invalid content type received');
            }

            // Set appropriate headers for download
            res.set({
                'Content-Type': contentType,
                'Content-Disposition': 'attachment; filename=sticker.png',
                'Cache-Control': 'no-cache'
            });

            // Stream the response
            response.body.pipe(res);
        } catch (error) {
            console.error('Error fetching from B2:', error);
            res.status(500).json({ error: 'Failed to download image from storage' });
        }
    } catch (error) {
        console.error('Error in download route:', error);
        res.status(500).json({ error: 'Failed to download image' });
    }
});

export default router;

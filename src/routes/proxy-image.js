import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Proxy external images to avoid CORS issues
router.get('/', async (req, res) => {
    try {
        const { url } = req.query;
        
        if (!url) {
            return res.status(400).json({ error: 'URL parameter is required' });
        }

        // Validate URL
        let imageUrl;
        try {
            imageUrl = new URL(url);
        } catch (error) {
            return res.status(400).json({ error: 'Invalid URL provided' });
        }

        // Only allow certain domains for security
        const allowedDomains = [
            'f005.backblazeb2.com',
            'backblazeb2.com',
            'b2.backblazeb2.com',
            'replicate.delivery',
            'replicate.com',
            'pbxt.replicate.delivery'
        ];

        const isAllowedDomain = allowedDomains.some(domain => 
            imageUrl.hostname === domain || imageUrl.hostname.endsWith('.' + domain)
        );

        if (!isAllowedDomain) {
            console.log('[ProxyImage] Blocked domain:', imageUrl.hostname);
            return res.status(403).json({ error: 'Domain not allowed' });
        }

        console.log('[ProxyImage] Proxying image:', url);

        // Fetch the image
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Designer-App/1.0'
            },
            timeout: 10000 // 10 second timeout
        });

        if (!response.ok) {
            console.log('[ProxyImage] Failed to fetch image:', response.status, response.statusText);
            return res.status(response.status).json({ error: 'Failed to fetch image' });
        }

        // Get content type
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        
        // Set appropriate headers
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        // Stream the image
        response.body.pipe(res);
        
    } catch (error) {
        console.error('[ProxyImage] Error proxying image:', error);
        res.status(500).json({ error: 'Failed to proxy image' });
    }
});

export default router;

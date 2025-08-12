import express from 'express';
import { auth } from '../../middleware/auth.js';
import Generation from '../../models/Generation.js';

const router = express.Router();

// Get all generations for the current user
router.get('/', auth, async (req, res) => {
    try {
        console.log('Fetching all generations for user:', req.userId);
        const generations = await Generation
            .find({ userId: req.userId })
            .sort({ createdAt: -1 })
            .lean(); // Ensure lean() is used

        console.log('[Generations Route] Found', generations.length, 'total generations');

        // Log the raw data fetched from DB for the first few items
        if (generations.length > 0) {
            console.log('[Generations Route] First generation raw data:', JSON.stringify(generations[0], null, 2));
        }

        const generationsWithUrls = generations.map(gen => {
             console.log(`[Generations Route] Processing gen ${gen._id}, original imageUrl: ${gen.imageUrl}`); // Log URL before normalization
            // Normalize image URL to match GenerationCard expectations
            let normalizedUrl = gen.imageUrl;
            if (normalizedUrl) {
                // Handle local storage URLs
                if (!normalizedUrl.startsWith('http')) {
                    normalizedUrl = `${process.env.PUBLIC_URL || 'http://localhost:3006'}${normalizedUrl}`;
                }

                // Normalize file extensions
                normalizedUrl = normalizedUrl
                    .replace(/-webp$/, '.webp')
                    .replace(/-png$/, '.png')
                    .replace(/-jpg$/, '.jpg')
                    .replace(/-jpeg$/, '.jpeg');
            }

            return {
                _id: gen._id,
                prompt: gen.prompt,
                imageUrl: normalizedUrl,
                status: gen.status,
                createdAt: gen.createdAt
            };
        });

        // Add No-Cache headers
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');

        res.json(generationsWithUrls);
    } catch (error) {
        console.error('[Generations Route] Error fetching all generations:', error); // Add route identifier to error log
        res.status(500).json({ error: 'Failed to fetch generations' });
    }
});

// Get recent generations for the current user
router.get('/recent', auth, async (req, res) => {
    try {
        console.log('Fetching recent generations for user:', req.userId);
        const generations = await Generation
            .find({ userId: req.userId })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean(); // Ensure lean() is used

        console.log('[Generations Route] Found', generations.length, 'recent generations');

        // Log the raw data fetched from DB for the first few items
        if (generations.length > 0) {
            console.log('[Generations Route] First generation raw data:', JSON.stringify(generations[0], null, 2));
        }

        const generationsWithUrls = generations.map(gen => {
             console.log(`[Generations Route] Processing gen ${gen._id}, original imageUrl: ${gen.imageUrl}`); // Log URL before normalization
            // Normalize image URL to match GenerationCard expectations
            let normalizedUrl = gen.imageUrl;
            if (normalizedUrl) {
                // Handle local storage URLs
                if (!normalizedUrl.startsWith('http')) {
                    normalizedUrl = `${process.env.PUBLIC_URL || 'http://localhost:3006'}${normalizedUrl}`;
                }
                
                // Normalize file extensions
                normalizedUrl = normalizedUrl
                    .replace(/-webp$/, '.webp')
                    .replace(/-png$/, '.png')
                    .replace(/-jpg$/, '.jpg')
                    .replace(/-jpeg$/, '.jpeg');
            }
            
            return {
                _id: gen._id,
                prompt: gen.prompt,
                imageUrl: normalizedUrl,
                status: gen.status,
                createdAt: gen.createdAt
            };
        });

        // Add No-Cache headers
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');

        res.json(generationsWithUrls);
    } catch (error) {
        console.error('[Generations Route] Error fetching recent generations:', error); // Add route identifier to error log
        res.status(500).json({ error: 'Failed to fetch recent generations' });
    }
});

// Get a specific generation by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const generation = await Generation.findById(req.params.id);
        
        if (!generation) {
            return res.status(404).json({ message: 'Generation not found' });
        }
        
        // Check if the generation belongs to the current user
        if (generation.userId.toString() !== req.userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to view this generation' });
        }
        
        res.json(generation);
    } catch (error) {
        console.error('Error fetching generation:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;



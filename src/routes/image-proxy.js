import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Image proxy route for serving images with proper headers
router.get('/', async (req, res) => {
    try {
        let { fileName } = req.query;

        if (!fileName) {
            return res.status(400).json({ error: 'fileName parameter is required' });
        }

        // Decode URL-encoded characters (like %20 for spaces)
        fileName = decodeURIComponent(fileName);

        // Handle different types of image paths
        let imagePath;
        
        if (fileName.startsWith('generations/')) {
            // Generated images - look in public/generations
            imagePath = path.join(__dirname, '../../public', fileName);
        } else if (fileName.startsWith('uploads/')) {
            // Uploaded images - look in public/uploads
            imagePath = path.join(__dirname, '../../public', fileName);
        } else if (fileName.startsWith('images/')) {
            // Stock images - look in public/images
            imagePath = path.join(__dirname, '../../public', fileName);
        } else {
            // Default to public directory
            imagePath = path.join(__dirname, '../../public', fileName);
        }

        // Check if file exists
        if (!fs.existsSync(imagePath)) {
            console.log('[ImageProxy] File not found:', imagePath);
            console.log('[ImageProxy] Original fileName:', req.query.fileName);
            console.log('[ImageProxy] Decoded fileName:', fileName);

            // For generated images, try to serve a placeholder
            if (fileName.startsWith('generations/')) {
                const placeholderPath = path.join(__dirname, '../../public/images/placeholder.png');
                if (fs.existsSync(placeholderPath)) {
                    console.log('[ImageProxy] Serving placeholder for missing generated image');
                    imagePath = placeholderPath;
                } else {
                    return res.status(404).json({ error: 'Generated image not found', path: imagePath });
                }
            } else {
                return res.status(404).json({ error: 'Image not found', path: imagePath });
            }
        }

        console.log('[ImageProxy] Serving file:', imagePath);

        // Get file stats
        const stat = fs.statSync(imagePath);
        
        // Set appropriate headers
        const ext = path.extname(fileName).toLowerCase();
        let contentType = 'image/jpeg'; // default
        
        switch (ext) {
            case '.png':
                contentType = 'image/png';
                break;
            case '.gif':
                contentType = 'image/gif';
                break;
            case '.webp':
                contentType = 'image/webp';
                break;
            case '.svg':
                contentType = 'image/svg+xml';
                break;
        }

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', stat.size);
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
        
        // Stream the file
        const readStream = fs.createReadStream(imagePath);
        readStream.pipe(res);
        
    } catch (error) {
        console.error('[ImageProxy] Error serving image:', error);
        res.status(500).json({ error: 'Failed to serve image' });
    }
});

export default router;

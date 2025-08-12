import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get stock images from public/images directory
router.get('/', async (req, res) => {
    try {
        const { folder } = req.query;
        const imagesDir = path.join(__dirname, '../../public/images');
        
        // Check if images directory exists
        if (!fs.existsSync(imagesDir)) {
            console.log('[StockImages] Images directory not found, creating empty response');
            return res.json({ images: [], folders: [] });
        }

        let targetDir = imagesDir;
        if (folder && folder !== 'all') {
            targetDir = path.join(imagesDir, folder);
            if (!fs.existsSync(targetDir)) {
                return res.status(404).json({ error: 'Folder not found' });
            }
        }

        const items = fs.readdirSync(targetDir);
        const images = [];
        const folders = [];

        for (const item of items) {
            const itemPath = path.join(targetDir, item);
            const stat = fs.statSync(itemPath);
            
            if (stat.isDirectory()) {
                folders.push({
                    name: item,
                    path: folder ? `${folder}/${item}` : item
                });
            } else if (item.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/)) {
                const relativePath = folder ? `images/${folder}/${item}` : `images/${item}`;
                images.push({
                    name: item,
                    url: `/${relativePath}`,
                    path: relativePath,
                    thumbnail: `/${relativePath}` // Use same image as thumbnail for now
                });
            }
        }

        res.json({ images, folders });
    } catch (error) {
        console.error('[StockImages] Error loading images:', error);
        res.status(500).json({ error: 'Failed to load images' });
    }
});

export default router;

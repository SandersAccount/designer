import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get stock shapes from public/shapes directory
router.get('/', async (req, res) => {
    try {
        const { folder } = req.query;
        const shapesDir = path.join(__dirname, '../../public/shapes');
        
        // Check if shapes directory exists
        if (!fs.existsSync(shapesDir)) {
            console.log('[StockShapes] Shapes directory not found, creating empty response');
            return res.json({ shapes: [], folders: [] });
        }

        let targetDir = shapesDir;
        if (folder && folder !== 'all') {
            targetDir = path.join(shapesDir, folder);
            if (!fs.existsSync(targetDir)) {
                return res.status(404).json({ error: 'Folder not found' });
            }
        }

        const items = fs.readdirSync(targetDir);
        const shapes = [];
        const folders = [];

        for (const item of items) {
            const itemPath = path.join(targetDir, item);
            const stat = fs.statSync(itemPath);
            
            if (stat.isDirectory()) {
                folders.push({
                    name: item,
                    path: folder ? `${folder}/${item}` : item
                });
            } else if (item.toLowerCase().endsWith('.svg')) {
                const relativePath = folder ? `shapes/${folder}/${item}` : `shapes/${item}`;
                shapes.push({
                    name: item.replace('.svg', ''),
                    url: `/${relativePath}`,
                    path: relativePath
                });
            }
        }

        res.json({ shapes, folders });
    } catch (error) {
        console.error('[StockShapes] Error loading shapes:', error);
        res.status(500).json({ error: 'Failed to load shapes' });
    }
});

export default router;

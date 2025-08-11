import express from 'express';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get models endpoint
router.get('/', async (req, res) => {
    try {
        const configPath = join(__dirname, '..', 'config', 'replicateModels.json');
        const configContent = await readFile(configPath, 'utf8');
        const modelsConfig = JSON.parse(configContent);
        
        // Return all models
        const models = modelsConfig.models.map(model => ({
            name: model.reference || model.name, // Use reference for dropdown value if available
            displayName: model.displayName || model.name,
            description: model.description || 'Generate artistic images'
        }));

        res.json(models);
    } catch (error) {
        console.error('Error loading models:', error);
        res.status(500).json({ error: 'Failed to load models configuration' });
    }
});

export default router;

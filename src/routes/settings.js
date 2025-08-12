import express from 'express';

const router = express.Router();

// Get application settings
router.get('/', async (req, res) => {
    try {
        // Return basic application settings
        const settings = {
            appName: 'Designer',
            version: '1.0.0',
            features: {
                aiGeneration: true,
                templates: true,
                textEffects: true,
                imageEditing: true,
                collections: true,
                projects: true
            },
            limits: {
                maxFileSize: '10MB',
                maxProjects: 100,
                maxTemplates: 50
            },
            ui: {
                theme: 'light',
                language: 'en',
                showTutorials: true
            }
        };

        res.json(settings);
    } catch (error) {
        console.error('[Settings] Error getting settings:', error);
        res.status(500).json({ error: 'Failed to get settings' });
    }
});

// Update application settings
router.put('/', async (req, res) => {
    try {
        const { settings } = req.body;
        
        // In a real app, you would save these to a database
        // For now, just return the updated settings
        res.json({ 
            message: 'Settings updated successfully',
            settings: settings 
        });
    } catch (error) {
        console.error('[Settings] Error updating settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

export default router;

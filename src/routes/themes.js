import express from 'express';
import { auth, adminAuth } from '../../middleware/auth.js';
import Theme from '../../models/Theme.js';

const router = express.Router();

// Get all themes
router.get('/', auth, async (req, res) => {
    try {
        const themes = await Theme.find().sort('order');
        res.json(themes);
    } catch (error) {
        console.error('Error getting themes:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get a specific theme
router.get('/:id', auth, async (req, res) => {
    try {
        const theme = await Theme.findById(req.params.id);
        if (!theme) return res.status(404).json({ error: 'Theme not found' });
        res.json(theme);
    } catch (error) {
        console.error('Error getting theme:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create a new theme
router.post('/', auth, adminAuth, async (req, res) => {
    try {
        const { name, prompt, description, artStyles, elements, font, look } = req.body;

        // Validate required fields
        if (!name || !prompt || !description) {
            return res.status(400).json({ error: 'Name, prompt, and description are required' });
        }

        // Get the highest order value
        const lastTheme = await Theme.findOne().sort('-order');
        const order = lastTheme ? lastTheme.order + 1 : 0;
        
        const theme = new Theme({ name, prompt, description, artStyles, elements, font, look, order });
        await theme.save();
        
        res.status(201).json(theme);
    } catch (error) {
        console.error('Error creating theme:', error);
        res.status(400).json({ error: error.message });
    }
});

// Update a theme
router.put('/:id', auth, adminAuth, async (req, res) => {
    try {
        const { name, prompt, description, artStyles, elements, font, look } = req.body;

        // Validate required fields
        if (!name || !prompt || !description) {
            return res.status(400).json({ error: 'Name, prompt, and description are required' });
        }

        const theme = await Theme.findByIdAndUpdate(
            req.params.id,
            { name, prompt, description, artStyles, elements, font, look },
            { new: true }
        );
        
        if (!theme) return res.status(404).json({ error: 'Theme not found' });
        res.json(theme);
    } catch (error) {
        console.error('Error updating theme:', error);
        res.status(400).json({ error: error.message });
    }
});

// Delete a theme
router.delete('/:id', auth, adminAuth, async (req, res) => {
    try {
        const theme = await Theme.findByIdAndDelete(req.params.id);
        if (!theme) return res.status(404).json({ error: 'Theme not found' });
        
        // Update order of remaining themes
        await Theme.updateMany(
            { order: { $gt: theme.order } },
            { $inc: { order: -1 } }
        );
        
        res.json({ message: 'Theme deleted' });
    } catch (error) {
        console.error('Error deleting theme:', error);
        res.status(500).json({ error: error.message });
    }
});

// Reorder themes
router.post('/reorder', auth, adminAuth, async (req, res) => {
    try {
        const updates = req.body;
        
        // Update each theme's order
        const updatePromises = updates.map(({ id, order }) => 
            Theme.findByIdAndUpdate(id, { order }, { new: true })
        );
        
        await Promise.all(updatePromises);
        
        res.json({ message: 'Themes reordered successfully' });
    } catch (error) {
        console.error('Error reordering themes:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;






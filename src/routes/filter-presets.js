import express from 'express';
import FilterPreset from '../../models/FilterPreset.js';

const router = express.Router();

// Function to seed default built-in presets (DISABLED - User requested removal)
async function seedDefaultPresets() {
    try {
        // Default presets have been removed per user request
        // No longer seeding built-in presets: Watercolor, Faded Photo, Old Horror, Old Grainy, Fade Out, Mist
        console.log('🎨 [Filter Presets] Default preset seeding disabled - user removed all built-in presets');
    } catch (error) {
        console.error('🎨 [Filter Presets] Error in preset seeding function:', error);
    }
}

// Seed default presets on module load (currently disabled)
seedDefaultPresets();

// GET /api/filter-presets - Get all filter presets
router.get('/', async (req, res) => {
    try {
        console.log('🎨 [Filter Presets API] GET /api/filter-presets - Fetching all presets');
        
        const presets = await FilterPreset.find().sort({ createdAt: 1 });
        
        console.log('🎨 [Filter Presets API] Found', presets.length, 'presets');
        
        res.json(presets);
    } catch (error) {
        console.error('🎨 [Filter Presets API] Error fetching presets:', error);
        res.status(500).json({ 
            error: 'Failed to fetch filter presets',
            details: error.message 
        });
    }
});

// POST /api/filter-presets - Create a new filter preset
router.post('/', async (req, res) => {
    try {
        const { key, name, filters } = req.body;
        
        console.log('🎨 [Filter Presets API] POST /api/filter-presets - Creating preset:', { key, name, filters });
        
        // Validate required fields
        if (!key || !name || !filters) {
            return res.status(400).json({ 
                error: 'Missing required fields: key, name, and filters are required' 
            });
        }
        
        // Check if preset with this key already exists
        const existingPreset = await FilterPreset.findOne({ key });
        if (existingPreset) {
            // Update existing preset
            existingPreset.name = name;
            existingPreset.filters = filters;
            existingPreset.updatedAt = new Date();
            
            const updatedPreset = await existingPreset.save();
            console.log('🎨 [Filter Presets API] Updated existing preset:', key);
            
            return res.json({
                message: 'Filter preset updated successfully',
                preset: updatedPreset
            });
        }
        
        // Create new preset
        const newPreset = new FilterPreset({
            key,
            name,
            filters,
            isBuiltIn: false
        });
        
        const savedPreset = await newPreset.save();
        
        console.log('🎨 [Filter Presets API] Created new preset:', savedPreset.key);
        
        res.status(201).json({
            message: 'Filter preset created successfully',
            preset: savedPreset
        });
        
    } catch (error) {
        console.error('🎨 [Filter Presets API] Error creating preset:', error);
        
        if (error.code === 11000) {
            // Duplicate key error
            res.status(409).json({ 
                error: 'A preset with this key already exists' 
            });
        } else {
            res.status(500).json({ 
                error: 'Failed to create filter preset',
                details: error.message 
            });
        }
    }
});

// PUT /api/filter-presets/:key - Update a filter preset
router.put('/:key', async (req, res) => {
    try {
        const { key } = req.params;
        const { name, filters } = req.body;
        
        console.log('🎨 [Filter Presets API] PUT /api/filter-presets/' + key + ' - Updating preset');
        
        const preset = await FilterPreset.findOne({ key });
        if (!preset) {
            return res.status(404).json({ error: 'Filter preset not found' });
        }
        
        // Update fields
        if (name) preset.name = name;
        if (filters) preset.filters = filters;
        preset.updatedAt = new Date();
        
        const updatedPreset = await preset.save();
        
        console.log('🎨 [Filter Presets API] Updated preset:', key);
        
        res.json({
            message: 'Filter preset updated successfully',
            preset: updatedPreset
        });
        
    } catch (error) {
        console.error('🎨 [Filter Presets API] Error updating preset:', error);
        res.status(500).json({ 
            error: 'Failed to update filter preset',
            details: error.message 
        });
    }
});

// DELETE /api/filter-presets/:key - Delete a filter preset
router.delete('/:key', async (req, res) => {
    try {
        const { key } = req.params;
        
        console.log('🎨 [Filter Presets API] DELETE /api/filter-presets/' + key + ' - Deleting preset');
        
        const deletedPreset = await FilterPreset.findOneAndDelete({ key });
        
        if (!deletedPreset) {
            return res.status(404).json({ error: 'Filter preset not found' });
        }
        
        console.log('🎨 [Filter Presets API] Deleted preset:', key);
        
        res.json({
            message: 'Filter preset deleted successfully',
            preset: deletedPreset
        });
        
    } catch (error) {
        console.error('🎨 [Filter Presets API] Error deleting preset:', error);
        res.status(500).json({ 
            error: 'Failed to delete filter preset',
            details: error.message 
        });
    }
});

// GET /api/filter-presets/:key - Get a specific filter preset
router.get('/:key', async (req, res) => {
    try {
        const { key } = req.params;
        
        console.log('🎨 [Filter Presets API] GET /api/filter-presets/' + key + ' - Fetching preset');
        
        const preset = await FilterPreset.findOne({ key });
        
        if (!preset) {
            return res.status(404).json({ error: 'Filter preset not found' });
        }
        
        console.log('🎨 [Filter Presets API] Found preset:', key);
        
        res.json(preset);
        
    } catch (error) {
        console.error('🎨 [Filter Presets API] Error fetching preset:', error);
        res.status(500).json({ 
            error: 'Failed to fetch filter preset',
            details: error.message 
        });
    }
});

export default router;



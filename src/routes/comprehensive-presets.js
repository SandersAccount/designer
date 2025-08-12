import express from 'express';
import ComprehensivePreset from '../../models/ComprehensivePreset.js';

const router = express.Router();

// GET /api/comprehensive-presets - Get all comprehensive presets
router.get('/', async (req, res) => {
    try {
        console.log('🎨 [Comprehensive Presets API] GET /api/comprehensive-presets - Fetching all presets');
        
        const presets = await ComprehensivePreset.find().sort({ createdAt: 1 });
        
        console.log('🎨 [Comprehensive Presets API] Found', presets.length, 'comprehensive presets');
        
        res.json(presets);
    } catch (error) {
        console.error('🎨 [Comprehensive Presets API] Error fetching presets:', error);
        res.status(500).json({ 
            error: 'Failed to fetch comprehensive presets',
            details: error.message 
        });
    }
});

// POST /api/comprehensive-presets - Create a new comprehensive preset
router.post('/', async (req, res) => {
    try {
        const { key, name, preset } = req.body;
        
        console.log('🎨 [Comprehensive Presets API] POST /api/comprehensive-presets - Creating preset:', { 
            key, 
            name, 
            hasCustomImage: !!preset?.customImage,
            presetKeys: Object.keys(preset || {})
        });
        
        // Validate required fields
        if (!key || !name || !preset) {
            return res.status(400).json({ 
                error: 'Missing required fields: key, name, and preset are required' 
            });
        }
        
        // Validate preset structure
        if (typeof preset !== 'object') {
            return res.status(400).json({ 
                error: 'Preset must be an object containing effect settings' 
            });
        }
        
        // Check if preset with this key already exists
        const existingPreset = await ComprehensivePreset.findOne({ key });
        if (existingPreset) {
            // Update existing preset
            existingPreset.name = name;
            existingPreset.preset = preset;
            existingPreset.updatedAt = new Date();
            
            const updatedPreset = await existingPreset.save();
            console.log('🎨 [Comprehensive Presets API] Updated existing preset:', key);
            
            return res.json({
                message: 'Comprehensive preset updated successfully',
                preset: updatedPreset
            });
        }
        
        // Create new preset
        const newPreset = new ComprehensivePreset({
            key,
            name,
            preset,
            isBuiltIn: false
        });
        
        const savedPreset = await newPreset.save();
        
        console.log('🎨 [Comprehensive Presets API] Created new preset:', savedPreset.key);
        
        res.status(201).json({
            message: 'Comprehensive preset created successfully',
            preset: savedPreset
        });
        
    } catch (error) {
        console.error('🎨 [Comprehensive Presets API] Error creating preset:', error);
        
        if (error.code === 11000) {
            // Duplicate key error
            res.status(409).json({ 
                error: 'A comprehensive preset with this key already exists' 
            });
        } else {
            res.status(500).json({ 
                error: 'Failed to create comprehensive preset',
                details: error.message 
            });
        }
    }
});

// PUT /api/comprehensive-presets/:key - Update a comprehensive preset
router.put('/:key', async (req, res) => {
    try {
        const { key } = req.params;
        const { name, preset } = req.body;

        console.log('🎨 [Comprehensive Presets API] PUT /api/comprehensive-presets/' + key + ' - Updating preset');
        console.log('🎨 [Comprehensive Presets API] Request body:', JSON.stringify(req.body, null, 2));
        console.log('🎨 [Comprehensive Presets API] Request params:', req.params);
        
        let existingPreset = await ComprehensivePreset.findOne({ key });

        if (existingPreset) {
            // Update existing preset
            if (name) existingPreset.name = name;
            if (preset) existingPreset.preset = preset;
            existingPreset.updatedAt = new Date();

            const updatedPreset = await existingPreset.save();

            console.log('🎨 [Comprehensive Presets API] Updated existing preset:', key);

            res.json({
                message: 'Comprehensive preset updated successfully',
                preset: updatedPreset
            });
        } else {
            // Create new preset
            const newPreset = new ComprehensivePreset({
                key,
                name,
                preset
            });

            const savedPreset = await newPreset.save();

            console.log('🎨 [Comprehensive Presets API] Created new preset:', key);

            res.status(201).json({
                message: 'Comprehensive preset created successfully',
                preset: savedPreset
            });
        }
        
    } catch (error) {
        console.error('🎨 [Comprehensive Presets API] Error updating preset:', error);
        res.status(500).json({ 
            error: 'Failed to update comprehensive preset',
            details: error.message 
        });
    }
});

// DELETE /api/comprehensive-presets/:key - Delete a comprehensive preset
router.delete('/:key', async (req, res) => {
    try {
        const { key } = req.params;
        
        console.log('🎨 [Comprehensive Presets API] DELETE /api/comprehensive-presets/' + key + ' - Deleting preset');
        
        const deletedPreset = await ComprehensivePreset.findOneAndDelete({ key });
        
        if (!deletedPreset) {
            return res.status(404).json({ error: 'Comprehensive preset not found' });
        }
        
        console.log('🎨 [Comprehensive Presets API] Deleted preset:', key);
        
        res.json({
            message: 'Comprehensive preset deleted successfully',
            preset: deletedPreset
        });
        
    } catch (error) {
        console.error('🎨 [Comprehensive Presets API] Error deleting preset:', error);
        res.status(500).json({ 
            error: 'Failed to delete comprehensive preset',
            details: error.message 
        });
    }
});

// GET /api/comprehensive-presets/:key - Get a specific comprehensive preset
router.get('/:key', async (req, res) => {
    try {
        const { key } = req.params;

        console.log('🎨 [Comprehensive Presets API] GET /api/comprehensive-presets/' + key + ' - Fetching preset');
        console.log('🎨 [Comprehensive Presets API] Request method:', req.method);
        
        const preset = await ComprehensivePreset.findOne({ key });
        
        if (!preset) {
            return res.status(404).json({ error: 'Comprehensive preset not found' });
        }
        
        console.log('🎨 [Comprehensive Presets API] Found preset:', key);
        
        res.json(preset);
        
    } catch (error) {
        console.error('🎨 [Comprehensive Presets API] Error fetching preset:', error);
        res.status(500).json({ 
            error: 'Failed to fetch comprehensive preset',
            details: error.message 
        });
    }
});

export default router;



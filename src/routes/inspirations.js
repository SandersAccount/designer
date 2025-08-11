import express from 'express';
import Inspiration from '../models/Inspiration.js'; // Keep for admin routes
import DesignTemplate from '../models/DesignTemplate.js'; // Import DesignTemplate
import { isAdmin, auth } from '../middleware/auth.js';

const router = express.Router();

// --- Public Gallery Route ---
// Get all DESIGN TEMPLATES for the public gallery view
router.get('/', async (req, res) => {
    try {
        // Get pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50; // Default to 50 templates per page
        const skip = (page - 1) * limit;

        console.log(`Fetching published Design Templates for public gallery (page ${page}, limit ${limit})...`);

        // Fetch only published Design Templates with pagination and optimized sorting
        const templates = await DesignTemplate.find({ published: true }) // Only fetch published templates
                                            .select('name previewImageUrl createdAt adminData originalPalette fontStylesList') // Only select needed fields
                                            .sort({ _id: -1 }) // Sort by _id instead of createdAt (more efficient)
                                            .skip(skip)
                                            .limit(limit)
                                            .lean(); // Use lean for performance
            
        console.log(`Found ${templates.length} design templates.`);

        // Migration: Ensure fontStylesList is available at top-level for existing templates
        const migratedTemplates = templates.map(template => {
            // Check if top-level fontStylesList is missing or empty, but adminData has font styles
            const hasTopLevelFontStyles = template.fontStylesList && Array.isArray(template.fontStylesList) && template.fontStylesList.length > 0;
            const hasAdminDataFontStyles = template.adminData?.fontStylesList && Array.isArray(template.adminData.fontStylesList) && template.adminData.fontStylesList.length > 0;

            if (!hasTopLevelFontStyles && hasAdminDataFontStyles) {
                console.log(`🔄 Migrating fontStylesList for template: ${template.name} (${template.adminData.fontStylesList.length} styles)`);
                template.fontStylesList = template.adminData.fontStylesList;
            }

            return template;
        });

        // Get total count for pagination info
        const totalTemplates = await DesignTemplate.countDocuments({ published: true });
        const totalPages = Math.ceil(totalTemplates / limit);

        res.json({
            templates: migratedTemplates,
            pagination: {
                currentPage: page,
                totalPages,
                totalTemplates,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        console.error('Error fetching design templates for gallery:', error);
        res.status(500).json({ message: 'Server Error fetching templates' });
    }
});

// --- Admin Routes for Original Inspirations ---
// Get all inspirations - admin only route that returns all inspirations including unpublished
router.get('/admin', isAdmin, async (req, res) => {
    try {
        console.log("Fetching all Inspirations for admin...");
        const inspirations = await Inspiration.find()
            .sort({ priority: -1, createdAt: -1 });
        res.json(inspirations);
    } catch (error) {
        console.error('Error fetching admin inspirations:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get a single item by ID - Prioritize DesignTemplate for gallery/generation flow
// NOTE: This might need refinement if IDs could clash or if admin needs specific Inspiration data via ID.
router.get('/:id', async (req, res) => {
    try {
        console.log(`Fetching item with ID: ${req.params.id}`);
        // Prioritize fetching DesignTemplate
        let item = await DesignTemplate.findById(req.params.id).lean();
        if (item) {
            console.log(`Found DesignTemplate with ID: ${req.params.id}`);
            // Add check if template should be public or user-owned if needed later
            return res.json(item);
        }

        // Fallback: Check Inspiration model (maybe for admin direct links?)
        console.log(`DesignTemplate not found, checking Inspiration model for ID: ${req.params.id}`);
        item = await Inspiration.findById(req.params.id).lean(); 
        if (item) {
             console.log(`Found Inspiration with ID: ${req.params.id}`);
             // Add authorization checks if necessary for inspirations too
             return res.json(item);
        }

        // If not found in either collection
        console.log(`Item not found for ID: ${req.params.id}`);
        return res.status(404).json({ message: 'Item not found' });

    } catch (error) {
        console.error('Error fetching item by ID:', error);
         if (error.name === 'CastError') {
             return res.status(400).json({ message: 'Invalid ID format' });
        }
        res.status(500).json({ message: 'Server error fetching item' });
    }
});


// Create a new inspiration (admin only) - Operates on Inspiration model
router.post('/', isAdmin, async (req, res) => {
    try {
        console.log("Admin creating new Inspiration...");
        console.log("=== INSPIRATION CREATION DEBUG ===");
        console.log("Request body:", JSON.stringify(req.body, null, 2));

        const {
            imageUrl, prompt, object, textValues, textCount,
            tags, model, published, priority, notes, colorPalette, originalPalette
        } = req.body;

        console.log("Extracted fields:");
        console.log("- imageUrl:", imageUrl);
        console.log("- prompt:", prompt);
        console.log("- prompt type:", typeof prompt);
        console.log("- prompt length:", prompt ? prompt.length : 'null/undefined');
        console.log("- object:", object);
        console.log("- model:", model);
        console.log("=== END INSPIRATION DEBUG ===");

        const newInspiration = new Inspiration({
            imageUrl,
            prompt,
            object,
            textValues: textValues || [],
            textCount: textCount || textValues?.length || 0,
            model: model || 'flux-stickers', // Default to flux-stickers if not provided
            tags: tags || [],
            published: published || false,
            priority: priority || 0,
            notes: notes || '',
            colorPalette: colorPalette || null,
            originalPalette: originalPalette || ''
        });

        const savedInspiration = await newInspiration.save();
        console.log("Inspiration created:", savedInspiration._id);
        console.log("Saved inspiration prompt:", savedInspiration.prompt);
        res.status(201).json(savedInspiration);
    } catch (error) {
        console.error('Error creating inspiration:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update an inspiration (admin only) - Operates on Inspiration model
router.put('/:id', isAdmin, async (req, res) => {
    try {
        console.log(`Admin updating Inspiration: ${req.params.id}`);
        const { 
            imageUrl, prompt, object, textValues, textCount, 
            tags, model, published, priority, notes, colorPalette, originalPalette 
        } = req.body;
        
        const inspiration = await Inspiration.findById(req.params.id);
        if (!inspiration) {
            return res.status(404).json({ message: 'Inspiration not found' });
        }
        
        // Update fields
        if (imageUrl !== undefined) inspiration.imageUrl = imageUrl;
        if (prompt !== undefined) inspiration.prompt = prompt;
        if (object !== undefined) inspiration.object = object;
        if (textValues !== undefined) {
            inspiration.textValues = textValues;
            inspiration.textCount = textValues.length;
        }
        // Allow explicit setting of textCount even if textValues is empty/null
        if (textCount !== undefined) inspiration.textCount = textCount; 
        if (tags !== undefined) inspiration.tags = tags;
        if (model !== undefined) inspiration.model = model;
        if (published !== undefined) inspiration.published = published;
        if (priority !== undefined) inspiration.priority = priority;
        if (notes !== undefined) inspiration.notes = notes;
        if (colorPalette !== undefined) inspiration.colorPalette = colorPalette;
        if (originalPalette !== undefined) inspiration.originalPalette = originalPalette;
        
        const updatedInspiration = await inspiration.save();
        console.log("Inspiration updated:", updatedInspiration._id);
        res.json(updatedInspiration);
    } catch (error) {
        console.error('Error updating inspiration:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete an inspiration (admin only) - Operates on Inspiration model
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        console.log(`Admin deleting Inspiration: ${req.params.id}`);
        const inspiration = await Inspiration.findById(req.params.id);
        if (!inspiration) {
            return res.status(404).json({ message: 'Inspiration not found' });
        }
        
        await inspiration.deleteOne();
        console.log("Inspiration deleted:", req.params.id);
        res.json({ message: 'Inspiration removed' });
    } catch (error) {
        console.error('Error deleting inspiration:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;

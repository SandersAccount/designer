import express from 'express';
import { auth, adminAuth } from '../../middleware/auth.js';
import PromptTemplate from '../../models/PromptTemplate.js';

const router = express.Router();

/**
 * Get all prompt templates
 * Public templates + user's private templates if authenticated
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.userId || null;
        
        // Query for public templates or user's private templates
        const query = userId 
            ? { $or: [{ isPublic: true }, { userId }] }
            : { isPublic: true };
            
        const templates = await PromptTemplate.find(query).sort({ updatedAt: -1 });
        
        res.json(templates);
    } catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
});

/**
 * Get a single template by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const template = await PromptTemplate.findById(req.params.id);
        
        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }
        
        // Check if user has access to this template
        const userId = req.userId || null;
        if (!template.isPublic && (!userId || template.userId?.toString() !== userId)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        

        res.json(template);
    } catch (error) {
        console.error('Error fetching template:', error);
        res.status(500).json({ error: 'Failed to fetch template' });
    }
});

/**
 * Create a new template
 * Temporarily removed auth restriction for development purposes
 */
router.post('/', async (req, res) => {
    try {
        const { name, category, template, thumbnailUrl, randomOptions, isPublic, originalPalette, recommendedModel } = req.body;

        
        if (!name || !category || !template) {
            return res.status(400).json({ error: 'Name, category, and template are required' });
        }
        
        // Log thumbnail info but truncate the actual data to avoid console flooding
        const thumbnailInfo = thumbnailUrl 
            ? `Present (length: ${thumbnailUrl.length}, starts with: ${thumbnailUrl.substring(0, 30)}...)`
            : 'Not present';
        console.log('Creating template with thumbnailUrl:', thumbnailInfo);
        
        // Check if thumbnail URL is too large
        if (thumbnailUrl && thumbnailUrl.length > 1000000) {
            console.warn('Thumbnail URL is very large:', thumbnailUrl.length, 'bytes');
        }
        
        const newTemplate = new PromptTemplate({
            name,
            category,
            template,
            thumbnailUrl: thumbnailUrl || '',
            randomOptions: randomOptions || {},
            isPublic: isPublic !== undefined ? isPublic : true,
            originalPalette: originalPalette || '',
            recommendedModel: recommendedModel || ''
        });
        
        await newTemplate.save();
        
        console.log('Template saved with ID:', newTemplate._id, 'thumbnailUrl present:', !!newTemplate.thumbnailUrl);
        
        res.status(201).json(newTemplate);
    } catch (error) {
        console.error('Error creating template:', error);
        res.status(500).json({ error: 'Failed to create template' });
    }
});

/**
 * Update an existing template
 * Temporarily removed auth restriction for development purposes
 */
router.put('/:id', async (req, res) => {
    try {
        console.log('Update template request for ID:', req.params.id);
        
        const { name, category, template, thumbnailUrl, randomOptions, isPublic, originalPalette, recommendedModel } = req.body;

        
        // Find the template
        const existingTemplate = await PromptTemplate.findById(req.params.id);
        
        if (!existingTemplate) {
            return res.status(404).json({ error: 'Template not found' });
        }
        
        // For debugging
        console.log('Template found, preparing to update');
        
        // Log thumbnail info but truncate the actual data to avoid console flooding
        const thumbnailInfo = thumbnailUrl 
            ? `Present (length: ${thumbnailUrl.length}, starts with: ${thumbnailUrl.substring(0, 30)}...)`
            : 'Not present';
        console.log('Updating template with thumbnailUrl:', thumbnailInfo);
        
        // Check if thumbnail URL is too large
        if (thumbnailUrl && thumbnailUrl.length > 1000000) {
            console.warn('Thumbnail URL is very large:', thumbnailUrl.length, 'bytes');
        }
        
        // Update fields
        if (name) existingTemplate.name = name;
        if (category) existingTemplate.category = category;
        if (template) existingTemplate.template = template;
        if (thumbnailUrl !== undefined) existingTemplate.thumbnailUrl = thumbnailUrl;
        if (randomOptions) existingTemplate.randomOptions = randomOptions;
        if (isPublic !== undefined) existingTemplate.isPublic = isPublic;
        if (originalPalette !== undefined) existingTemplate.originalPalette = originalPalette;
        if (recommendedModel !== undefined) existingTemplate.recommendedModel = recommendedModel;
        
        await existingTemplate.save();

        console.log('Template updated with ID:', existingTemplate._id, 'thumbnailUrl present:', !!existingTemplate.thumbnailUrl);

        
        res.json(existingTemplate);
    } catch (error) {
        console.error('Error updating template:', error);
        res.status(500).json({ error: 'Failed to update template' });
    }
});

/**
 * Delete a template
 * Temporarily removed auth restriction for development purposes
 */
router.delete('/:id', async (req, res) => {
    try {
        console.log('Delete template request for ID:', req.params.id);
        
        const template = await PromptTemplate.findById(req.params.id);
        
        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }
        
        // For debugging
        console.log('Template found, preparing to delete');
        
        // No auth checks for development
        
        await PromptTemplate.findByIdAndDelete(req.params.id);
        console.log('Template deleted successfully');
        
        res.json({ message: 'Template deleted successfully' });
    } catch (error) {
        console.error('Error deleting template:', error);
        res.status(500).json({ error: 'Failed to delete template' });
    }
});

export default router;



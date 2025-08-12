import express from 'express';
import FontTag from '../../models/FontTag.js';
import { auth } from '../../middleware/auth.js';

const router = express.Router();

// GET /api/font-tags - Get all font tags (public route for testing)
router.get('/', async (req, res) => {
    try {
        console.log('[FontTags] GET /api/font-tags - Fetching all font tags');
        
        const fontTags = await FontTag.getAllFontTags();
        
        console.log('[FontTags] Successfully fetched font tags for', Object.keys(fontTags).length, 'fonts');
        
        res.json({
            success: true,
            data: fontTags,
            count: Object.keys(fontTags).length
        });
    } catch (error) {
        console.error('[FontTags] Error fetching font tags:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch font tags',
            message: error.message
        });
    }
});

// GET /api/font-tags/:fontFamily - Get tags for a specific font
router.get('/:fontFamily', async (req, res) => {
    try {
        const { fontFamily } = req.params;
        console.log('[FontTags] GET /api/font-tags/' + fontFamily + ' - Fetching tags for font');
        
        const tags = await FontTag.getFontTags(fontFamily);
        
        console.log('[FontTags] Found', tags.length, 'tags for font:', fontFamily);
        
        res.json({
            success: true,
            fontFamily: fontFamily,
            tags: tags
        });
    } catch (error) {
        console.error('[FontTags] Error fetching tags for font:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch font tags',
            message: error.message
        });
    }
});

// POST /api/font-tags - Create or update tags for a font
router.post('/', auth, async (req, res) => {
    try {
        const { fontFamily, tags } = req.body;
        const userId = req.userId;
        
        console.log('[FontTags] POST /api/font-tags - Updating tags for font:', fontFamily);
        console.log('[FontTags] New tags:', tags);
        console.log('[FontTags] User ID:', userId);
        
        // Validate input
        if (!fontFamily || !Array.isArray(tags)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid input. fontFamily and tags array are required.'
            });
        }
        
        // Update or create font tags
        const result = await FontTag.updateFontTags(fontFamily, tags, userId);
        
        console.log('[FontTags] Successfully updated tags for font:', fontFamily);
        console.log('[FontTags] Result:', result);
        
        res.json({
            success: true,
            message: 'Font tags updated successfully',
            data: {
                fontFamily: result.fontFamily,
                tags: result.tags,
                updatedAt: result.updatedAt
            }
        });
    } catch (error) {
        console.error('[FontTags] Error updating font tags:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update font tags',
            message: error.message
        });
    }
});

// PUT /api/font-tags/:fontFamily - Update tags for a specific font
router.put('/:fontFamily', auth, async (req, res) => {
    try {
        const { fontFamily } = req.params;
        const { tags } = req.body;
        const userId = req.userId;
        
        console.log('[FontTags] PUT /api/font-tags/' + fontFamily + ' - Updating tags');
        console.log('[FontTags] New tags:', tags);
        
        // Validate input
        if (!Array.isArray(tags)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid input. tags must be an array.'
            });
        }
        
        // Update font tags
        const result = await FontTag.updateFontTags(fontFamily, tags, userId);
        
        console.log('[FontTags] Successfully updated tags for font:', fontFamily);
        
        res.json({
            success: true,
            message: 'Font tags updated successfully',
            data: {
                fontFamily: result.fontFamily,
                tags: result.tags,
                updatedAt: result.updatedAt
            }
        });
    } catch (error) {
        console.error('[FontTags] Error updating font tags:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update font tags',
            message: error.message
        });
    }
});

// DELETE /api/font-tags/:fontFamily - Delete all tags for a font
router.delete('/:fontFamily', auth, async (req, res) => {
    try {
        const { fontFamily } = req.params;
        console.log('[FontTags] DELETE /api/font-tags/' + fontFamily + ' - Deleting tags');
        
        const result = await FontTag.findOneAndDelete({ fontFamily: fontFamily });
        
        if (!result) {
            return res.status(404).json({
                success: false,
                error: 'Font tags not found'
            });
        }
        
        console.log('[FontTags] Successfully deleted tags for font:', fontFamily);
        
        res.json({
            success: true,
            message: 'Font tags deleted successfully',
            deletedFont: fontFamily
        });
    } catch (error) {
        console.error('[FontTags] Error deleting font tags:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete font tags',
            message: error.message
        });
    }
});

// GET /api/font-tags/search/by-tag/:tag - Get all fonts with a specific tag
router.get('/search/by-tag/:tag', async (req, res) => {
    try {
        const { tag } = req.params;
        console.log('[FontTags] GET /api/font-tags/search/by-tag/' + tag + ' - Searching fonts by tag');
        
        const fonts = await FontTag.getFontsByTag(tag);
        
        console.log('[FontTags] Found', fonts.length, 'fonts with tag:', tag);
        
        res.json({
            success: true,
            tag: tag,
            fonts: fonts,
            count: fonts.length
        });
    } catch (error) {
        console.error('[FontTags] Error searching fonts by tag:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to search fonts by tag',
            message: error.message
        });
    }
});

// GET /api/font-tags/statistics - Get tag usage statistics
router.get('/statistics', async (req, res) => {
    try {
        console.log('[FontTags] GET /api/font-tags/statistics - Fetching tag statistics');
        
        const stats = await FontTag.getTagStatistics();
        
        console.log('[FontTags] Successfully fetched tag statistics');
        
        res.json({
            success: true,
            statistics: stats
        });
    } catch (error) {
        console.error('[FontTags] Error fetching tag statistics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch tag statistics',
            message: error.message
        });
    }
});

// POST /api/font-tags/migrate - Migrate localStorage data to database
router.post('/migrate', auth, async (req, res) => {
    try {
        const { localStorageData } = req.body;
        const userId = req.userId;
        
        console.log('[FontTags] POST /api/font-tags/migrate - Migrating localStorage data');
        console.log('[FontTags] Data to migrate:', Object.keys(localStorageData || {}).length, 'fonts');
        
        if (!localStorageData || typeof localStorageData !== 'object') {
            return res.status(400).json({
                success: false,
                error: 'Invalid localStorage data provided'
            });
        }
        
        const results = [];
        const errors = [];
        
        // Migrate each font's tags
        for (const [fontFamily, tags] of Object.entries(localStorageData)) {
            try {
                if (Array.isArray(tags) && tags.length > 0) {
                    const result = await FontTag.updateFontTags(fontFamily, tags, userId);
                    results.push({
                        fontFamily: fontFamily,
                        tags: tags,
                        success: true
                    });
                    console.log('[FontTags] Migrated tags for font:', fontFamily, '- Tags:', tags);
                }
            } catch (error) {
                console.error('[FontTags] Error migrating font:', fontFamily, error);
                errors.push({
                    fontFamily: fontFamily,
                    error: error.message
                });
            }
        }
        
        console.log('[FontTags] Migration completed. Success:', results.length, 'Errors:', errors.length);
        
        res.json({
            success: true,
            message: 'Migration completed',
            migrated: results.length,
            errors: errors.length,
            results: results,
            errorDetails: errors
        });
    } catch (error) {
        console.error('[FontTags] Error during migration:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to migrate font tags',
            message: error.message
        });
    }
});

export default router;






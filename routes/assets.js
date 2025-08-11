import express from 'express';
import AssetManager from '../services/assetManager.js';
import Asset from '../models/Asset.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/assets
 * List all assets with pagination
 */
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        console.log(`[Assets] Listing assets - page: ${page}, limit: ${limit}`);

        // Simple query without sorting to avoid memory issues
        const assets = await Asset.find({ isActive: true })
            .select('assetId name filename category subcategory tags mimeType b2Url createdAt')
            .limit(limit)
            .lean(); // Use lean() for better performance

        const totalAssets = await Asset.countDocuments({ isActive: true });
        const totalPages = Math.ceil(totalAssets / limit);

        console.log(`[Assets] Found ${assets.length} assets (${totalAssets} total)`);

        res.json({
            success: true,
            assets: assets,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalAssets: totalAssets,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        console.error('Error listing assets:', error);
        res.status(500).json({ error: 'Failed to list assets' });
    }
});

/**
 * GET /api/assets/test
 * Simple test endpoint to verify routes are working
 */
router.get('/test', async (req, res) => {
    try {
        // Test database connection
        const assetCount = await Asset.countDocuments();

        // Test if searchAssets method exists
        const hasSearchMethod = typeof Asset.searchAssets === 'function';

        // Test basic search
        let searchTest = null;
        try {
            searchTest = await Asset.searchAssets({ limit: 1 });
        } catch (searchError) {
            searchTest = { error: searchError.message };
        }

        res.json({
            success: true,
            message: 'Assets routes are working!',
            timestamp: new Date().toISOString(),
            database: {
                connected: true,
                assetCount: assetCount
            },
            model: {
                hasSearchMethod,
                searchTest: searchTest ? 'OK' : 'FAILED'
            }
        });
    } catch (error) {
        res.json({
            success: false,
            message: 'Assets routes working but database error!',
            timestamp: new Date().toISOString(),
            database: {
                connected: false,
                error: error.message
            }
        });
    }
});

/**
 * GET /api/assets/debug
 * Debug route to test route ordering
 */
router.get('/debug', (req, res) => {
    res.json({
        success: true,
        message: 'Debug route working - routes are properly ordered!',
        timestamp: new Date().toISOString()
    });
});

// NOTE: Specific routes must come BEFORE the generic /:id route

/**
 * POST /api/assets/process-project
 * Process assets for a project save
 */
router.post('/process-project', async (req, res) => {
    try {
        const { canvasObjects, projectId, templateId } = req.body;
        
        if (!canvasObjects || !projectId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        console.log(`🎯 Processing assets for project ${projectId}, user: ${req.userId || 'anonymous'}`);

        const updatedObjects = await AssetManager.processProjectAssets(
            canvasObjects,
            projectId,
            templateId,
            req.userId || 'test-user' // Pass user ID for B2 authorization
        );

        res.json({
            success: true,
            canvasObjects: updatedObjects,
            message: 'Assets processed successfully'
        });
    } catch (error) {
        console.error('Error processing project assets:', error);
        res.status(500).json({ error: 'Failed to process assets' });
    }
});

/**
 * GET /api/assets/stats
 * Get asset usage statistics (admin only)
 */
router.get('/admin/stats', auth, async (req, res) => {
    try {
        // Add admin check here if needed
        // if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin access required' });

        const stats = await AssetManager.getAssetStats();
        const totalAssets = await Asset.countDocuments();
        const totalUsage = await Asset.aggregate([
            { $group: { _id: null, total: { $sum: '$usageCount' } } }
        ]);

        res.json({
            totalAssets,
            totalUsage: totalUsage[0]?.total || 0,
            categoryStats: stats
        });
    } catch (error) {
        console.error('Error getting asset stats:', error);
        res.status(500).json({ error: 'Failed to get asset statistics' });
    }
});

/**
 * POST /api/assets/cleanup
 * Clean up unused assets (admin only)
 */
router.post('/admin/cleanup', auth, async (req, res) => {
    try {
        // Add admin check here if needed
        // if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin access required' });

        const { daysOld = 30 } = req.body;
        const deletedCount = await AssetManager.cleanupUnusedAssets(daysOld);

        res.json({
            success: true,
            deletedCount,
            message: `Cleaned up ${deletedCount} unused assets`
        });
    } catch (error) {
        console.error('Error cleaning up assets:', error);
        res.status(500).json({ error: 'Failed to cleanup assets' });
    }
});

/**
 * GET /api/assets/search
 * Advanced asset search with filters and tags
 */
router.get('/search', async (req, res) => {
    try {
        console.log('[Assets] ===== SEARCH REQUEST =====');
        console.log('[Assets] Query params:', req.query);

        const {
            q: query = '',
            category,
            subcategory,
            tags,
            page = 1,
            limit = 20,
            sortBy = 'usageCount',
            sortOrder = 'desc'
        } = req.query;

        // Parse tags if provided as comma-separated string
        const tagArray = tags ? tags.split(',').map(tag => tag.trim()) : [];

        const searchOptions = {
            query,
            category,
            subcategory,
            tags: tagArray,
            page: parseInt(page),
            limit: parseInt(limit),
            sortBy,
            sortOrder: sortOrder === 'desc' ? -1 : 1
        };

        console.log('[Assets] Search options:', searchOptions);
        console.log('[Assets] Calling Asset.searchAssets...');

        const result = await Asset.searchAssets(searchOptions);

        console.log('[Assets] Search result:', {
            assetsFound: result.assets?.length || 0,
            totalAssets: result.pagination?.total || 0
        });

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('[Assets] Error searching assets:', error);
        console.error('[Assets] Error stack:', error.stack);
        res.status(500).json({
            error: 'Failed to search assets',
            details: error.message
        });
    }
});

/**
 * GET /api/assets/tags
 * Get popular tags for filtering
 */
router.get('/tags', async (req, res) => {
    try {
        const { limit = 50 } = req.query;
        const tags = await Asset.getPopularTags(parseInt(limit));

        res.json({
            success: true,
            ...tags
        });
    } catch (error) {
        console.error('Error getting tags:', error);
        res.status(500).json({ error: 'Failed to get tags' });
    }
});

/**
 * GET /api/assets/categories
 * Get category statistics
 */
router.get('/categories', async (req, res) => {
    try {
        const stats = await Asset.getCategoryStats();

        // Organize by category
        const organized = {};
        stats.forEach(stat => {
            const category = stat._id.category;
            if (!organized[category]) {
                organized[category] = {
                    total: 0,
                    totalUsage: 0,
                    subcategories: {}
                };
            }

            organized[category].total += stat.count;
            organized[category].totalUsage += stat.totalUsage;

            if (stat._id.subcategory) {
                organized[category].subcategories[stat._id.subcategory] = {
                    count: stat.count,
                    usage: stat.totalUsage
                };
            }
        });

        res.json({
            success: true,
            categories: organized
        });
    } catch (error) {
        console.error('Error getting categories:', error);
        res.status(500).json({ error: 'Failed to get categories' });
    }
});

/**
 * GET /api/assets/admin/list
 * List all assets with usage info (admin only)
 */
router.get('/admin/list', auth, async (req, res) => {
    try {
        // Add admin check here if needed
        // if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin access required' });

        const searchOptions = {
            query: req.query.q || '',
            category: req.query.category,
            subcategory: req.query.subcategory,
            tags: req.query.tags ? req.query.tags.split(',') : [],
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 50,
            sortBy: req.query.sortBy || 'usageCount',
            sortOrder: req.query.sortOrder === 'asc' ? 1 : -1,
            isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : null
        };

        const result = await Asset.searchAssets(searchOptions);

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Error listing assets:', error);
        res.status(500).json({ error: 'Failed to list assets' });
    }
});

/**
 * DELETE /api/assets/admin/:id
 * Delete an asset (admin only)
 */
router.delete('/admin/:id', auth, async (req, res) => {
    try {
        // Add admin check here if needed
        // if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin access required' });

        const { id } = req.params;
        const asset = await Asset.findById(id);
        
        if (!asset) {
            return res.status(404).json({ error: 'Asset not found' });
        }

        // Check if asset is still being used
        if (asset.usageCount > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete asset that is still in use',
                usageCount: asset.usageCount
            });
        }

        await Asset.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Asset deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting asset:', error);
        res.status(500).json({ error: 'Failed to delete asset' });
    }
});

/**
 * PUT /api/assets/admin/:id/deactivate
 * Deactivate an asset instead of deleting (admin only)
 */
router.put('/admin/:id/deactivate', auth, async (req, res) => {
    try {
        // Add admin check here if needed
        // if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin access required' });

        const { id } = req.params;
        const asset = await Asset.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        );

        if (!asset) {
            return res.status(404).json({ error: 'Asset not found' });
        }

        res.json({
            success: true,
            message: 'Asset deactivated successfully',
            asset: {
                id: asset._id,
                assetId: asset.assetId,
                name: asset.name,
                originalPath: asset.originalPath,
                isActive: asset.isActive,
                usageCount: asset.usageCount
            }
        });
    } catch (error) {
        console.error('Error deactivating asset:', error);
        res.status(500).json({ error: 'Failed to deactivate asset' });
    }
});

/**
 * PUT /api/assets/admin/:id/tags
 * Add or remove tags from an asset (admin only)
 */
router.put('/admin/:id/tags', auth, async (req, res) => {
    try {
        // Add admin check here if needed
        // if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin access required' });

        const { id } = req.params;
        const { addTags = [], removeTags = [] } = req.body;

        const asset = await Asset.findById(id);
        if (!asset) {
            return res.status(404).json({ error: 'Asset not found' });
        }

        // Add new tags
        if (addTags.length > 0) {
            await asset.addTags(addTags);
        }

        // Remove tags
        if (removeTags.length > 0) {
            await asset.removeTags(removeTags);
        }

        res.json({
            success: true,
            message: 'Tags updated successfully',
            asset: {
                id: asset._id,
                assetId: asset.assetId,
                name: asset.name,
                tags: asset.tags,
                autoTags: asset.autoTags
            }
        });
    } catch (error) {
        console.error('Error updating tags:', error);
        res.status(500).json({ error: 'Failed to update tags' });
    }
});

/**
 * GET /api/assets/by-id/:assetId
 * Get asset by human-readable asset ID
 */
router.get('/by-id/:assetId', async (req, res) => {
    try {
        const { assetId } = req.params;
        console.log(`[Assets] Serving asset by assetId: ${assetId}`);

        const asset = await Asset.findOne({ assetId, isActive: true });

        if (!asset) {
            console.log(`[Assets] Asset not found: ${assetId}`);
            return res.status(404).json({ error: 'Asset not found' });
        }

        console.log(`[Assets] Asset found: ${asset.name} (${asset.mimeType})`);
        console.log(`[Assets] Has B2 URL: ${!!asset.b2Url}`);

        // If asset has B2 URL, fetch it with proper authorization and serve it
        if (asset.b2Url) {
            console.log(`[Assets] Fetching from B2 with authorization: ${asset.b2Url}`);
            try {
                const { storage } = await import('../utils/storage.js');

                // Ensure B2 is authorized
                await storage.ensureAuthorized();
                const authData = storage.getAuthData();

                if (!authData) {
                    console.error(`[Assets] No B2 authorization available`);
                    // Fallback to stored content if available
                    if (asset.content) {
                        console.log(`[Assets] Falling back to stored content`);
                        res.set('Content-Type', asset.mimeType);
                        res.set('Cache-Control', 'public, max-age=31536000');
                        return res.send(asset.content);
                    }
                    return res.status(500).json({ error: 'Asset not accessible' });
                }

                // Fetch from B2 with authorization
                const fetch = (await import('node-fetch')).default;
                const b2Response = await fetch(asset.b2Url, {
                    headers: {
                        'Authorization': authData.authorizationToken
                    }
                });

                if (!b2Response.ok) {
                    console.error(`[Assets] B2 fetch failed: ${b2Response.status} ${b2Response.statusText}`);
                    // Fallback to stored content if available
                    if (asset.content) {
                        console.log(`[Assets] Falling back to stored content`);
                        res.set('Content-Type', asset.mimeType);
                        res.set('Cache-Control', 'public, max-age=31536000');
                        return res.send(asset.content);
                    }
                    return res.status(404).json({ error: 'Asset not found in storage' });
                }

                // Stream the response from B2
                console.log(`[Assets] Successfully fetched from B2, streaming to client`);
                res.set('Content-Type', asset.mimeType);
                res.set('Cache-Control', 'public, max-age=31536000');

                const buffer = await b2Response.buffer();
                return res.send(buffer);

            } catch (b2Error) {
                console.error(`[Assets] Error fetching from B2:`, b2Error);
                // Fallback to stored content if available
                if (asset.content) {
                    console.log(`[Assets] Falling back to stored content due to B2 error`);
                    res.set('Content-Type', asset.mimeType);
                    res.set('Cache-Control', 'public, max-age=31536000');
                    return res.send(asset.content);
                }
                return res.status(500).json({ error: 'Failed to fetch asset' });
            }
        }

        // Otherwise serve stored content (for SVG assets)
        const content = asset.content;
        if (!content) {
            console.log(`[Assets] Asset content not found: ${assetId}`);
            return res.status(404).json({ error: 'Asset content not found' });
        }

        console.log(`[Assets] Serving content, length: ${content.length}`);
        res.set('Content-Type', asset.mimeType);
        res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
        res.send(content);
    } catch (error) {
        console.error('Error serving asset by ID:', error);
        res.status(500).json({ error: 'Failed to retrieve asset' });
    }
});

/**
 * GET /api/assets/info/:assetId
 * Get asset metadata by asset ID
 */
router.get('/info/:assetId', async (req, res) => {
    try {
        const { assetId } = req.params;
        const asset = await Asset.findOne({ assetId, isActive: true })
            .select('-content'); // Exclude content for metadata view

        if (!asset) {
            return res.status(404).json({ error: 'Asset not found' });
        }

        res.json({
            success: true,
            asset: {
                id: asset._id,
                assetId: asset.assetId,
                name: asset.name,
                filename: asset.filename,
                category: asset.category,
                subcategory: asset.subcategory,
                tags: asset.tags,
                autoTags: asset.autoTags,
                mimeType: asset.mimeType,
                metadata: asset.metadata,
                usageCount: asset.usageCount,
                lastUsed: asset.lastUsed,
                createdAt: asset.createdAt,
                b2Url: asset.b2Url // Include bucket URL for external access
            }
        });
    } catch (error) {
        console.error('Error getting asset info:', error);
        res.status(500).json({ error: 'Failed to get asset info' });
    }
});

/**
 * GET /api/assets/bucket-url/:assetId
 * Get the external bucket URL for an asset (for use with external services like Replicate)
 */
router.get('/bucket-url/:assetId', async (req, res) => {
    try {
        const { assetId } = req.params;
        console.log(`[Assets] Getting bucket URL for assetId: ${assetId}`);

        const asset = await Asset.findOne({ assetId, isActive: true });

        if (!asset) {
            console.log(`[Assets] Asset not found: ${assetId}`);
            return res.status(404).json({ error: 'Asset not found' });
        }

        if (!asset.b2Url) {
            console.log(`[Assets] Asset has no bucket URL: ${assetId}`);
            return res.status(404).json({ error: 'Asset has no external URL available' });
        }

        console.log(`[Assets] Returning bucket URL: ${asset.b2Url}`);
        res.json({
            success: true,
            assetId: asset.assetId,
            bucketUrl: asset.b2Url,
            name: asset.name,
            mimeType: asset.mimeType
        });
    } catch (error) {
        console.error('Error getting bucket URL:', error);
        res.status(500).json({ error: 'Failed to get bucket URL' });
    }
});

/**
 * GET /api/assets/:id
 * Retrieve asset content by ID
 * NOTE: This route MUST be last because it catches all remaining paths
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`[Assets] Serving asset by ID: ${id}`);

        const asset = await AssetManager.getAsset(id);

        if (!asset) {
            console.log(`[Assets] Asset not found: ${id}`);
            return res.status(404).json({ error: 'Asset not found' });
        }

        console.log(`[Assets] Asset found: ${asset.name} (${asset.mimeType})`);

        // If asset has B2 URL, redirect to it
        if (asset.b2Url) {
            console.log(`[Assets] Redirecting to B2: ${asset.b2Url}`);
            return res.redirect(asset.b2Url);
        }

        // Otherwise serve stored content
        const content = asset.content;
        if (!content) {
            console.log(`[Assets] Asset content not found: ${id}`);
            return res.status(404).json({ error: 'Asset content not found' });
        }

        console.log(`[Assets] Serving content, length: ${content.length}`);
        res.set('Content-Type', asset.mimeType || 'image/svg+xml');
        res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
        res.send(content);
    } catch (error) {
        console.error('[Assets] Error serving asset:', error);
        res.status(500).json({ error: 'Failed to retrieve asset' });
    }
});

export default router;

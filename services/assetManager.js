import Asset from '../models/Asset.js';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { storage } from '../utils/storage.js';

class AssetManager {
    constructor() {
        this.cache = new Map(); // In-memory cache for frequently used assets
        this.maxCacheSize = 1000;
    }

    // Helper function to check if an ID is a valid MongoDB ObjectId
    isValidObjectId(id) {
        return id &&
               typeof id === 'string' &&
               id.length === 24 &&
               /^[0-9a-fA-F]{24}$/.test(id);
    }

    // Update asset usage after project/template is saved with real ID
    async updateAssetUsage(canvasObjects, projectId = null, templateId = null) {
        console.log(`🔄 [AssetManager] Updating asset usage with real IDs...`);
        console.log(`🔄 [AssetManager] Project ID: ${projectId}, Template ID: ${templateId}`);

        if (!this.isValidObjectId(projectId) && !this.isValidObjectId(templateId)) {
            console.log(`🔄 [AssetManager] No valid IDs provided, skipping usage update`);
            return;
        }

        let updatedCount = 0;
        for (const obj of canvasObjects) {
            if (obj.type === 'image' && obj.assetId && this.isValidObjectId(obj.assetId)) {
                try {
                    const asset = await Asset.findById(obj.assetId);
                    if (asset) {
                        await asset.addUsage(projectId, templateId);
                        updatedCount++;
                        console.log(`🔄 [AssetManager] Updated usage for asset: ${asset.assetId}`);
                    }
                } catch (error) {
                    console.error(`🔄 [AssetManager] Error updating usage for asset ${obj.assetId}:`, error);
                }
            }
        }

        console.log(`✅ [AssetManager] Updated usage for ${updatedCount} assets`);
    }

    /**
     * Process and save assets from a project/template
     * @param {Array} canvasObjects - Array of canvas objects
     * @param {String} projectId - Project ID
     * @param {String} templateId - Template ID (optional)
     * @param {String} userId - User ID for B2 authorization
     * @returns {Array} Updated canvas objects with asset IDs
     */
    async processProjectAssets(canvasObjects, projectId, templateId = null, userId = null) {
        console.log(`🎯 Processing assets for project: ${projectId}, user: ${userId}`);

        const updatedObjects = [];

        for (const obj of canvasObjects) {
            const updatedObj = { ...obj };

            // Process different object types
            if (obj.type === 'image' && obj.imageUrl) {
                // Detect category from image URL path
                const category = this.detectCategoryFromPath(obj.imageUrl);
                updatedObj.assetId = await this.processAsset(
                    obj.imageUrl,
                    category,
                    projectId,
                    templateId,
                    userId
                );
            }

            updatedObjects.push(updatedObj);
        }

        console.log(`✅ Processed ${updatedObjects.length} objects`);
        return updatedObjects;
    }

    /**
     * Detect asset category from file path
     * @param {String} imagePath - Image file path
     * @returns {String} Detected category
     */
    detectCategoryFromPath(imagePath) {
        const pathLower = imagePath.toLowerCase();

        if (pathLower.includes('/icons/')) return 'icons';
        if (pathLower.includes('/abstract')) return 'abstract';
        if (pathLower.includes('/geometric')) return 'geometric';
        if (pathLower.includes('/hand-drawn')) return 'hand-drawn';
        if (pathLower.includes('/ink')) return 'ink';
        if (pathLower.includes('/masks')) return 'masks';
        if (pathLower.includes('/separators')) return 'separators';
        if (pathLower.includes('/grunge')) return 'grunge';

        return 'other';
    }

    /**
     * Process a single asset with B2 storage and authorization
     * @param {String} assetPath - Original asset path
     * @param {String} category - Asset category
     * @param {String} projectId - Project ID
     * @param {String} templateId - Template ID (optional)
     * @param {String} userId - User ID for authorization
     * @returns {String} Asset ID
     */
    async processAsset(assetPath, category, projectId, templateId = null, userId = null) {
        console.log(`🎯 [AssetManager] ===== PROCESSING ASSET =====`);
        console.log(`🎯 [AssetManager] Asset Path: ${assetPath}`);
        console.log(`🎯 [AssetManager] Category: ${category}`);
        console.log(`🎯 [AssetManager] Project ID: ${projectId}`);
        console.log(`🎯 [AssetManager] Template ID: ${templateId}`);
        console.log(`🎯 [AssetManager] User ID: ${userId}`);

        try {
            // Check cache first
            const cacheKey = assetPath;
            if (this.cache.has(cacheKey)) {
                console.log(`📦 [AssetManager] Found asset in cache: ${cacheKey}`);
                const cachedAsset = this.cache.get(cacheKey);
                await cachedAsset.addUsage(projectId, templateId);
                console.log(`✅ [AssetManager] Returning cached asset ID: ${cachedAsset._id}`);
                return cachedAsset._id;
            }

            // Read asset content from local file
            console.log(`📁 [AssetManager] Reading asset from file system...`);
            const fullPath = path.join(process.cwd(), 'public', assetPath);
            console.log(`📁 [AssetManager] Full path: ${fullPath}`);

            const content = await fs.readFile(fullPath, 'utf8');
            console.log(`📁 [AssetManager] File read successfully, content length: ${content.length}`);

            const mimeType = this.getMimeType(assetPath);
            console.log(`📁 [AssetManager] Detected MIME type: ${mimeType}`);

            // Check if asset already exists in database by content hash
            console.log(`🔍 [AssetManager] Checking if asset exists in database...`);
            const hash = crypto.createHash('sha256').update(content).digest('hex');
            console.log(`🔍 [AssetManager] Content hash: ${hash}`);

            let asset = await Asset.findOne({ hash });
            console.log(`🔍 [AssetManager] Database lookup result: ${asset ? 'FOUND' : 'NOT FOUND'}`);

            if (asset) {
                console.log(`📦 [AssetManager] Asset exists in DB: ${asset.assetId}`);
                // Asset exists, increment usage and add to cache
                asset.usageCount += 1;
                asset.lastUsed = new Date();

                // Add usage tracking only for valid MongoDB ObjectIds
                if (this.isValidObjectId(projectId) || this.isValidObjectId(templateId)) {
                    await asset.addUsage(
                        this.isValidObjectId(projectId) ? projectId : null,
                        this.isValidObjectId(templateId) ? templateId : null
                    );
                    console.log(`📊 [AssetManager] Usage tracking added for existing asset`);
                } else {
                    console.log(`📊 [AssetManager] Skipping usage tracking for temporary IDs: ${projectId}, ${templateId}`);
                }

                await asset.save();
                this.addToCache(cacheKey, asset);
                console.log(`✅ [AssetManager] Returning existing asset ID: ${asset._id}`);
                return asset._id;
            }

            // 🎯 NEW ASSET: Upload to B2 storage with user authorization
            console.log(`🆕 [AssetManager] Creating new asset...`);
            let b2Url = null;
            let b2FileName = null;

            try {
                console.log(`🔐 [AssetManager] Uploading asset to B2 storage: ${assetPath}`);
                console.log(`🔐 [AssetManager] User ID for B2: ${userId || 'system'}`);

                // Convert content to buffer for upload
                const buffer = Buffer.from(content, 'utf8');
                console.log(`🔐 [AssetManager] Buffer created, size: ${buffer.length} bytes`);

                // Upload to B2 with user-specific folder structure
                const uploadResult = await storage.uploadBuffer(
                    buffer,
                    'assets/shapes', // Prefix for asset organization
                    userId || 'system' // User ID for authorization
                );

                b2Url = uploadResult.url;
                b2FileName = uploadResult.fileName;
                console.log(`✅ [AssetManager] Asset uploaded to B2: ${b2Url}`);
                console.log(`✅ [AssetManager] B2 filename: ${b2FileName}`);

            } catch (uploadError) {
                console.warn(`⚠️ [AssetManager] B2 upload failed for ${assetPath}:`, uploadError.message);
                console.warn(`⚠️ [AssetManager] Error details:`, uploadError);
                // Continue without B2 URL - asset will use original path as fallback
            }

            // Create new asset in database
            console.log(`💾 [AssetManager] Creating asset in database...`);
            console.log(`💾 [AssetManager] Asset data:`, {
                originalPath: assetPath,
                contentLength: content.length,
                mimeType,
                category,
                b2Url: b2Url ? 'YES' : 'NO',
                b2FileName: b2FileName || 'NONE'
            });

            asset = await Asset.findOrCreate({
                originalPath: assetPath,
                content,
                mimeType,
                category,
                b2Url, // Store B2 URL if upload succeeded
                b2FileName // Store B2 filename for management
            });

            console.log(`💾 [AssetManager] Asset created in database:`, {
                id: asset._id,
                assetId: asset.assetId,
                name: asset.name,
                category: asset.category,
                tags: asset.tags
            });

            // Add usage tracking only for valid MongoDB ObjectIds
            if (this.isValidObjectId(projectId) || this.isValidObjectId(templateId)) {
                console.log(`📊 [AssetManager] Adding usage tracking for valid IDs...`);
                await asset.addUsage(
                    this.isValidObjectId(projectId) ? projectId : null,
                    this.isValidObjectId(templateId) ? templateId : null
                );
                console.log(`📊 [AssetManager] Usage tracking added`);
            } else {
                console.log(`📊 [AssetManager] Skipping usage tracking for temporary IDs: ${projectId}, ${templateId}`);
            }

            // Add to cache
            this.addToCache(cacheKey, asset);
            console.log(`📦 [AssetManager] Asset added to cache`);

            console.log(`✅ [AssetManager] New asset processed successfully: ${assetPath} -> ${asset.assetId} ${b2Url ? '(B2 stored)' : '(local fallback)'}`);
            console.log(`✅ [AssetManager] Returning asset ID: ${asset._id}`);
            return asset._id;

        } catch (error) {
            console.error(`❌ [AssetManager] Error processing asset ${assetPath}:`, error);
            console.error(`❌ [AssetManager] Error stack:`, error.stack);
            // Return original path as fallback
            console.log(`🔄 [AssetManager] Returning original path as fallback: ${assetPath}`);
            return assetPath;
        }
    }

    /**
     * Retrieve asset content by ID
     * @param {String} assetId - Asset ID
     * @returns {Object} Asset data
     */
    async getAsset(assetId) {
        try {
            // Check cache first
            const cachedAsset = Array.from(this.cache.values()).find(asset => asset._id.toString() === assetId);
            if (cachedAsset) {
                return cachedAsset;
            }

            // Query database
            const asset = await Asset.findById(assetId);
            if (asset) {
                this.addToCache(asset.originalPath, asset);
                return asset;
            }

            return null;
        } catch (error) {
            console.error(`❌ Error retrieving asset ${assetId}:`, error);
            return null;
        }
    }

    /**
     * Get asset content for rendering
     * @param {String} assetIdOrPath - Asset ID or original path
     * @returns {String} Asset content (SVG, base64, etc.) or B2 URL
     */
    async getAssetContent(assetIdOrPath) {
        // If it looks like a MongoDB ObjectId, treat as asset ID
        if (assetIdOrPath.match(/^[0-9a-fA-F]{24}$/)) {
            const asset = await this.getAsset(assetIdOrPath);
            if (asset) {
                // If asset has B2 URL, return that for direct access
                if (asset.b2Url) {
                    return asset.b2Url;
                }
                // Otherwise return stored content
                return asset.content;
            }
        }

        // Fallback: treat as original file path
        try {
            const fullPath = path.join(process.cwd(), 'public', assetIdOrPath);
            return await fs.readFile(fullPath, 'utf8');
        } catch (error) {
            console.error(`❌ Fallback failed for ${assetIdOrPath}:`, error);
            return null;
        }
    }

    /**
     * Get asset URL for client-side rendering
     * @param {String} assetIdOrPath - Asset ID or original path
     * @returns {String} URL for rendering
     */
    async getAssetUrl(assetIdOrPath) {
        // If it looks like a MongoDB ObjectId, treat as asset ID
        if (assetIdOrPath.match(/^[0-9a-fA-F]{24}$/)) {
            const asset = await this.getAsset(assetIdOrPath);
            if (asset) {
                // If asset has B2 URL, return that
                if (asset.b2Url) {
                    return asset.b2Url;
                }
                // Otherwise return API endpoint for content
                return `/api/assets/${assetIdOrPath}`;
            }
        }

        // Return original path for fallback
        return assetIdOrPath;
    }

    /**
     * Clean up unused assets (admin function)
     * @param {Number} daysOld - Remove assets not used in X days
     */
    async cleanupUnusedAssets(daysOld = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const unusedAssets = await Asset.find({
            lastUsed: { $lt: cutoffDate },
            usageCount: { $lte: 1 }
        });

        console.log(`🧹 Found ${unusedAssets.length} unused assets to clean up`);

        for (const asset of unusedAssets) {
            await Asset.findByIdAndDelete(asset._id);
        }

        return unusedAssets.length;
    }

    /**
     * Get asset usage statistics
     */
    async getAssetStats() {
        const stats = await Asset.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    totalUsage: { $sum: '$usageCount' },
                    avgUsage: { $avg: '$usageCount' }
                }
            }
        ]);

        return stats;
    }

    // Helper methods
    getMimeType(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
            '.svg': 'image/svg+xml',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.webp': 'image/webp'
        };
        return mimeTypes[ext] || 'application/octet-stream';
    }

    addToCache(key, asset) {
        // Simple LRU cache implementation
        if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, asset);
    }
}

export default new AssetManager();

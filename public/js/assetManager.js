/**
 * Client-side Asset Manager
 * Handles asset processing and caching for the design editor
 */

class ClientAssetManager {
    constructor() {
        this.cache = new Map();
        this.processingQueue = new Map();
        this.baseUrl = '/api/assets';
    }

    /**
     * Process assets when saving a project
     * @param {Array} canvasObjects - Canvas objects to process
     * @param {String} projectId - Project ID
     * @param {String} templateId - Template ID (optional)
     * @returns {Array} Updated canvas objects with asset IDs
     */
    async processProjectAssets(canvasObjects, projectId, templateId = null) {
        try {
            console.log('🎯 [AssetManager] Processing project assets with B2 storage...');

            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            if (!token) {
                console.warn('⚠️ [AssetManager] No auth token found, assets may not be processed with user authorization');
            }

            const response = await fetch(`${this.baseUrl}/process-project`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    canvasObjects,
                    projectId,
                    templateId
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const result = await response.json();
            console.log('✅ [AssetManager] Assets processed successfully with B2 storage');
            console.log(`📊 [AssetManager] Processed ${result.canvasObjects.length} objects`);

            return result.canvasObjects;
        } catch (error) {
            console.error('❌ [AssetManager] Error processing assets:', error);
            // Return original objects as fallback
            return canvasObjects;
        }
    }

    /**
     * Get asset content for rendering
     * @param {String} assetIdOrPath - Asset ID or original path
     * @returns {String} Asset URL for rendering
     */
    async getAssetUrl(assetIdOrPath) {
        // Check cache first
        if (this.cache.has(assetIdOrPath)) {
            return this.cache.get(assetIdOrPath);
        }

        // If it looks like a MongoDB ObjectId, use asset API
        if (assetIdOrPath.match(/^[0-9a-fA-F]{24}$/)) {
            const assetUrl = `${this.baseUrl}/${assetIdOrPath}`;
            this.cache.set(assetIdOrPath, assetUrl);
            return assetUrl;
        }

        // Otherwise, use original path
        this.cache.set(assetIdOrPath, assetIdOrPath);
        return assetIdOrPath;
    }

    /**
     * Preload asset content
     * @param {String} assetIdOrPath - Asset ID or path
     * @returns {Promise<String>} Asset content
     */
    async preloadAsset(assetIdOrPath) {
        const url = await this.getAssetUrl(assetIdOrPath);
        
        try {
            const response = await fetch(url);
            if (response.ok) {
                const content = await response.text();
                return content;
            }
        } catch (error) {
            console.warn(`⚠️ [AssetManager] Failed to preload asset: ${assetIdOrPath}`);
        }
        
        return null;
    }

    /**
     * Update canvas object image URLs to use asset system
     * @param {Array} canvasObjects - Canvas objects to update
     * @returns {Array} Updated canvas objects
     */
    async updateCanvasObjectUrls(canvasObjects) {
        const updatedObjects = [];
        
        for (const obj of canvasObjects) {
            const updatedObj = { ...obj };
            
            if (obj.type === 'image' && obj.imageUrl) {
                // If object has assetId, use it; otherwise use original imageUrl
                if (obj.assetId) {
                    updatedObj.imageUrl = await this.getAssetUrl(obj.assetId);
                } else {
                    updatedObj.imageUrl = await this.getAssetUrl(obj.imageUrl);
                }
            }
            
            updatedObjects.push(updatedObj);
        }
        
        return updatedObjects;
    }

    /**
     * Handle project save with asset processing
     * @param {Object} projectData - Project data to save
     * @returns {Object} Updated project data
     */
    async handleProjectSave(projectData) {
        try {
            // Process assets before saving
            if (projectData.canvasObjects) {
                projectData.canvasObjects = await this.processProjectAssets(
                    projectData.canvasObjects,
                    projectData._id || 'new-project'
                );
            }
            
            return projectData;
        } catch (error) {
            console.error('❌ [AssetManager] Error in project save:', error);
            return projectData; // Return original data as fallback
        }
    }

    /**
     * Handle project load with asset URL resolution
     * @param {Object} projectData - Loaded project data
     * @returns {Object} Project data with resolved asset URLs
     */
    async handleProjectLoad(projectData) {
        try {
            // Update canvas object URLs for rendering
            if (projectData.canvasObjects) {
                projectData.canvasObjects = await this.updateCanvasObjectUrls(
                    projectData.canvasObjects
                );
            }
            
            return projectData;
        } catch (error) {
            console.error('❌ [AssetManager] Error in project load:', error);
            return projectData; // Return original data as fallback
        }
    }

    /**
     * Clear cache (useful for memory management)
     */
    clearCache() {
        this.cache.clear();
        console.log('🧹 [AssetManager] Cache cleared');
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            entries: Array.from(this.cache.keys())
        };
    }
}

// Create global instance
window.assetManager = new ClientAssetManager();

// Integration with existing save/load functions
if (typeof window !== 'undefined') {
    // Hook into project save if saveProject function exists
    const originalSaveProject = window.saveProject;
    if (originalSaveProject) {
        window.saveProject = async function(...args) {
            try {
                // Process assets before saving
                if (window.canvasObjects) {
                    window.canvasObjects = await window.assetManager.processProjectAssets(
                        window.canvasObjects,
                        window.currentProjectId || 'new-project'
                    );
                }
            } catch (error) {
                console.error('❌ Asset processing failed, continuing with original save:', error);
            }
            
            return originalSaveProject.apply(this, args);
        };
    }

    // Hook into project load if loadProject function exists
    const originalLoadProject = window.loadProject;
    if (originalLoadProject) {
        window.loadProject = async function(projectData, ...args) {
            try {
                // Process asset URLs after loading
                projectData = await window.assetManager.handleProjectLoad(projectData);
            } catch (error) {
                console.error('❌ Asset URL resolution failed, continuing with original load:', error);
            }
            
            return originalLoadProject.call(this, projectData, ...args);
        };
    }
}

console.log('✅ [AssetManager] Client-side asset manager initialized');

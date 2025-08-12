import express from 'express';
import mongoose from 'mongoose';
const router = express.Router();
// Assuming DesignTemplate model uses module.exports, adjust if needed
// If DesignTemplate also uses ES modules, change the import accordingly.
// We might need to check models/DesignTemplate.js if this causes issues.
import DesignTemplate from '../../models/DesignTemplate.js';
import { auth, optionalAuth } from '../../middleware/auth.js'; // Use the correct exported function 'auth'
import { storage } from '../../utils/storage.js';
import AssetManager from '../../services/assetManager.js';

// @desc    Save a new design template
// @route   POST /api/design-templates
// @access  Private (requires login)
router.post('/', auth, async (req, res) => { // Use 'auth' middleware
    try {
        const {
            name,
            inspirationId,
            previewImageUrl,
            artboard,
            canvasObjects,
            adminData,
            editorState,
            originalPalette,
            originalObject,
            fontStylesList,
            decorStylesList,
            cssFilterState,
            duotoneState,
            glitchState,
            halftoneState,
            guidelinesState,
            layoutRectanglesState
        } = req.body;

        // Debug: Log what we received from client
        console.log('🎯 SERVER RECEIVED DATA:', {
            'originalPalette': originalPalette,
            'originalObject': originalObject,
            'adminData.originalPalette': adminData?.originalPalette,
            'adminData.originalObject': adminData?.originalObject,
            'req.body keys': Object.keys(req.body),
            'canvasObjects count': canvasObjects?.length || 0
        });

        // 🎯 PROCESS ASSETS: Extract and save assets from canvas objects
        console.log('[DesignTemplates] ===== ASSET PROCESSING START =====');
        console.log('[DesignTemplates] Canvas objects count:', canvasObjects?.length || 0);
        console.log('[DesignTemplates] User ID:', req.userId);

        let processedCanvasObjects = canvasObjects;
        if (canvasObjects && canvasObjects.length > 0) {
            // Log canvas objects with image URLs
            const imageObjects = canvasObjects.filter(obj => obj.type === 'image' && obj.imageUrl);
            console.log('[DesignTemplates] Found image objects:', imageObjects.length);
            imageObjects.forEach((obj, i) => {
                console.log(`[DesignTemplates] Image ${i}: ${obj.imageUrl}`);
            });

            try {
                console.log('[DesignTemplates] 🎯 Processing assets for template...');
                processedCanvasObjects = await AssetManager.processProjectAssets(
                    canvasObjects,
                    'template-' + Date.now(), // Temporary ID for template
                    null, // Will be updated with actual template ID after save
                    req.userId // Pass user ID for B2 authorization
                );
                console.log('[DesignTemplates] ✅ Assets processed successfully for template');
                console.log('[DesignTemplates] Processed objects count:', processedCanvasObjects?.length || 0);

                // Log processed image objects
                const processedImageObjects = processedCanvasObjects.filter(obj => obj.type === 'image');
                processedImageObjects.forEach((obj, i) => {
                    console.log(`[DesignTemplates] Processed Image ${i}:`, {
                        imageUrl: obj.imageUrl,
                        assetId: obj.assetId,
                        hasAssetId: !!obj.assetId
                    });
                });

            } catch (error) {
                console.error('[DesignTemplates] ❌ Error processing template assets:', error);
                console.error('[DesignTemplates] Error stack:', error.stack);
                // Continue with original canvas objects if asset processing fails
                processedCanvasObjects = canvasObjects;
            }
        } else {
            console.log('[DesignTemplates] No canvas objects to process');
        }
        console.log('[DesignTemplates] ===== ASSET PROCESSING END =====');

        // 🎨 CSS FILTER DEBUG - POST route processing
        console.log('🎨 [API POST] CSS FILTER DEBUG:', {
            'received cssFilterState': cssFilterState,
            'type': typeof cssFilterState,
            'is object': typeof cssFilterState === 'object',
            'keys': cssFilterState ? Object.keys(cssFilterState) : 'no keys',
            'JSON string': JSON.stringify(cssFilterState),
            'fontStylesList': fontStylesList,
            'decorStylesList': decorStylesList
        });

        // Basic validation
        if (!previewImageUrl || !artboard || !canvasObjects) {
            return res.status(400).json({ message: 'Missing required template data (previewImageUrl, artboard, canvasObjects).' });
        }
        // Check specific artboard properties for validity
        if (typeof artboard.x !== 'number' || typeof artboard.y !== 'number' || typeof artboard.width !== 'number' || typeof artboard.height !== 'number') {
             return res.status(400).json({ message: 'Invalid artboard data properties.' });
        }


        const newTemplate = new DesignTemplate({
            name: name || 'Untitled Template', // Default name if not provided
            inspirationId: inspirationId || null,
            previewImageUrl,
            artboard,
            canvasObjects: processedCanvasObjects, // Use processed canvas objects with asset IDs
            adminData,
            editorState: editorState || {}, // Include editor state
            originalPalette: originalPalette || '', // Include original palette for Restyle functionality
            originalObject: originalObject || '', // Include original object for Restyle functionality
            fontStylesList: fontStylesList || [], // Include font styles list
            decorStylesList: decorStylesList || [], // Include decor styles list
            cssFilterState: cssFilterState || {}, // Include CSS filter state
            duotoneState: duotoneState || {}, // Include duotone effect state
            glitchState: glitchState || {}, // Include glitch effect state
            halftoneState: halftoneState || {}, // Include halftone effect state
            guidelinesState: guidelinesState || { guidelines: [], totalCount: 0 }, // Include guidelines state
            layoutRectanglesState: layoutRectanglesState || { rectangles: [], totalCount: 0 }, // Include layout rectangles state
            userId: req.userId // Associate with the logged-in user
        });

        const savedTemplate = await newTemplate.save();

        // 🎯 UPDATE ASSET USAGE: Update assets with the actual template ID
        if (processedCanvasObjects !== canvasObjects && savedTemplate._id) {
            try {
                console.log('[DesignTemplates] 🎯 Updating asset usage with template ID:', savedTemplate._id);
                // Update asset usage with the actual template ID
                await AssetManager.updateAssetUsage(
                    processedCanvasObjects,
                    null, // No project ID for templates
                    savedTemplate._id.toString()
                );
                console.log('[DesignTemplates] ✅ Asset usage updated with template ID');
            } catch (error) {
                console.error('[DesignTemplates] ❌ Error updating asset usage:', error);
                // Template is already saved, so this is not critical
            }
        }

        console.log('Template saved successfully:', savedTemplate._id);
        console.log('🎯 SAVED TEMPLATE DATA:', {
            'savedTemplate.originalPalette': savedTemplate.originalPalette,
            'savedTemplate.originalObject': savedTemplate.originalObject,
            'savedTemplate.adminData.originalPalette': savedTemplate.adminData?.originalPalette,
            'savedTemplate.adminData.originalObject': savedTemplate.adminData?.originalObject,
            'processedAssets': processedCanvasObjects !== canvasObjects
        });

        // 🎨 EFFECTS DEBUG - POST route final result
        console.log('🎨 [API POST] EFFECTS FINAL RESULT:', {
            'saved cssFilterState': savedTemplate.cssFilterState,
            'saved duotoneState': savedTemplate.duotoneState,
            'saved glitchState': savedTemplate.glitchState,
            'saved halftoneState': savedTemplate.halftoneState,
            'cssFilterState type': typeof savedTemplate.cssFilterState,
            'cssFilterState keys': savedTemplate.cssFilterState ? Object.keys(savedTemplate.cssFilterState) : 'no keys',
            'halftoneState enabled': savedTemplate.halftoneState?.enabled,
            'halftoneState hasCustomImage': !!savedTemplate.halftoneState?.customImageData,
            'saved fontStylesList': savedTemplate.fontStylesList,
            'saved decorStylesList': savedTemplate.decorStylesList
        });

        res.status(201).json(savedTemplate);

    } catch (err) {
        console.error('Error saving template:', err);
        res.status(500).json({ message: 'Server error saving template', error: err.message });
    }
});

// @desc    Get all design templates (potentially for the logged-in user)
// @route   GET /api/design-templates
// @access  Private
router.get('/', optionalAuth, async (req, res) => { // Use 'optionalAuth' middleware
    try {
        // Get pagination parameters with smaller default page size
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 50); // Max 50 per page, default 20
        const skip = (page - 1) * limit;

        console.log(`[DesignTemplates] Fetching templates for user ${req.userId} (page ${page}, limit ${limit}, skip ${skip})`);

        // Build match criteria based on authentication status
        let matchCriteria = {};
        if (req.userId) {
            // If user is authenticated, show their templates
            const userObjectId = new mongoose.Types.ObjectId(req.userId);
            matchCriteria = { userId: userObjectId };
        } else {
            // If no user, show published templates or return empty array
            matchCriteria = { published: true };
        }

        // Use aggregation pipeline with allowDiskUse to handle large datasets
        const templates = await DesignTemplate.aggregate([
            // Match templates based on authentication status
            { $match: matchCriteria },

            // Sort by _id (which contains timestamp) instead of createdAt to use default index
            { $sort: { _id: -1 } },

            // Apply pagination
            { $skip: skip },
            { $limit: limit },

            // Project only essential fields for list view (reduce memory usage)
            { $project: {
                name: 1,
                previewImageUrl: 1,
                createdAt: 1,
                published: 1,
                _id: 1,
                // Don't include large fields like canvasObjects, artboard, etc.
            }}
        ], {
            allowDiskUse: true, // Allow using disk for large sort operations
            maxTimeMS: 30000 // 30 second timeout
        });

        // Get total count using a separate optimized query with same criteria
        const totalCount = await DesignTemplate.countDocuments(matchCriteria);

        const totalPages = Math.ceil(totalCount / limit);

        console.log(`[DesignTemplates] Successfully fetched ${templates.length} templates (${totalCount} total, page ${page}/${totalPages})`);

        res.status(200).json({
            templates,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalCount: totalCount,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
                limit: limit
            }
        });
    } catch (err) {
        console.error('Error fetching templates:', err);

        // If it's a memory limit error, try a fallback approach
        if (err.code === 292 || err.codeName === 'QueryExceededMemoryLimitNoDiskUseAllowed') {
            console.log('[DesignTemplates] Memory limit exceeded, trying fallback approach...');

            try {
                // Fallback: Get templates without sorting
                const page = parseInt(req.query.page) || 1;
                const limit = Math.min(parseInt(req.query.limit) || 10, 20); // Even smaller limit
                const skip = (page - 1) * limit;

                // Build match criteria for fallback based on authentication status
                let findCriteria = {};
                if (req.userId) {
                    const userObjectId = new mongoose.Types.ObjectId(req.userId);
                    findCriteria = { userId: userObjectId };
                } else {
                    findCriteria = { published: true };
                }

                const templates = await DesignTemplate.find(findCriteria)
                    .skip(skip)
                    .limit(limit)
                    .select('name previewImageUrl createdAt published _id')
                    .lean();

                // Estimate total count (faster than exact count)
                const totalCount = await DesignTemplate.estimatedDocumentCount();
                const totalPages = Math.ceil(totalCount / limit);

                console.log(`[DesignTemplates] Fallback successful: ${templates.length} templates`);

                res.status(200).json({
                    templates,
                    pagination: {
                        currentPage: page,
                        totalPages: totalPages,
                        totalCount: totalCount,
                        hasNextPage: page < totalPages,
                        hasPrevPage: page > 1,
                        limit: limit
                    },
                    warning: 'Using fallback mode due to large dataset - results may not be sorted by date'
                });
            } catch (fallbackErr) {
                console.error('Fallback also failed:', fallbackErr);
                res.status(500).json({
                    message: 'Database too large to query efficiently',
                    error: 'Please contact administrator for database cleanup',
                    suggestion: 'Try reducing the page size or contact support'
                });
            }
        } else {
            res.status(500).json({ message: 'Server error fetching templates', error: err.message });
        }
    }
});

// @desc    Get a single design template by ID
// @route   GET /api/design-templates/:id
// @access  Private
router.get('/:id', optionalAuth, async (req, res) => { // Use 'optionalAuth' middleware
    try {
        const template = await DesignTemplate.findById(req.params.id).lean();

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        // Check access permissions based on authentication status
        if (req.userId) {
            // If user is authenticated, check if template belongs to them
            if (template.userId && template.userId.toString() !== req.userId.toString()) {
                return res.status(403).json({ message: 'User not authorized to access this template' });
            }
        } else {
            // If no user, only allow access to published templates
            if (!template.published) {
                return res.status(403).json({ message: 'Template not publicly available' });
            }
        }

        res.status(200).json(template);
    } catch (err) {
        console.error('Error fetching template by ID:', err);
        // Handle potential CastError if ID format is invalid
        if (err.name === 'CastError') {
             return res.status(400).json({ message: 'Invalid template ID format' });
        }
        res.status(500).json({ message: 'Server error fetching template', error: err.message });
    }
});

// @desc    Delete a design template by ID
// @route   DELETE /api/design-templates/:id
// @access  Private
router.delete('/:id', auth, async (req, res) => { // Use 'auth' middleware
    try {
        const template = await DesignTemplate.findById(req.params.id);

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        // Ensure the user owns the template before deleting
        if (template.userId && template.userId.toString() !== req.userId.toString()) {
            return res.status(403).json({ message: 'User not authorized to delete this template' });
        }

        await DesignTemplate.deleteOne({ _id: req.params.id }); // Use deleteOne

        console.log('Template deleted successfully:', req.params.id);
        res.status(200).json({ message: 'Template deleted successfully' });

    } catch (err) {
        console.error('Error deleting template:', err);
         if (err.name === 'CastError') {
             return res.status(400).json({ message: 'Invalid template ID format' });
        }
        res.status(500).json({ message: 'Server error deleting template', error: err.message });
    }
});

// @desc    Update a design template by ID
// @route   PUT /api/design-templates/:id
// @access  Private
router.put('/:id', auth, async (req, res) => {
    try {
        const template = await DesignTemplate.findById(req.params.id);

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        // Ensure the user owns the template before updating
        if (template.userId && template.userId.toString() !== req.userId.toString()) {
            return res.status(403).json({ message: 'User not authorized to update this template' });
        }

        // Extract fields that can be updated
        const {
            name,
            previewImageUrl,
            artboard,
            adminData,
            canvasObjects,
            editorState,
            originalPalette,
            originalObject,
            fontStylesList,
            decorStylesList,
            cssFilterState,
            duotoneState,
            glitchState
        } = req.body;

        // Log what we're about to update
        console.log('About to update template with originalPalette:', originalPalette);
        console.log('About to update template with originalObject:', originalObject);
        console.log('About to update template with fontStylesList:', fontStylesList);
        console.log('About to update template with decorStylesList:', decorStylesList);
        console.log('About to update template with cssFilterState:', cssFilterState);
        console.log('About to update template with duotoneState:', duotoneState);
        console.log('About to update template with glitchState:', glitchState);

        console.log('===== TEMPLATE UPDATE DEBUG =====');
        console.log('Template ID:', req.params.id);
        console.log('Request body keys:', Object.keys(req.body));
        console.log('Request body previewImageUrl:', req.body.previewImageUrl);
        console.log('Request body originalPalette:', req.body.originalPalette);
        console.log('Request body originalObject:', req.body.originalObject);
        console.log('Request body fontStylesList:', req.body.fontStylesList);
        console.log('Request body decorStylesList:', req.body.decorStylesList);
        console.log('Request body cssFilterState:', req.body.cssFilterState);
        console.log('Request body duotoneState:', req.body.duotoneState);
        console.log('Request body glitchState:', req.body.glitchState);
        console.log('Extracted previewImageUrl:', previewImageUrl);
        console.log('Extracted originalPalette:', originalPalette);
        console.log('Extracted originalObject:', originalObject);
        console.log('Extracted fontStylesList:', fontStylesList);
        console.log('Extracted decorStylesList:', decorStylesList);
        console.log('Extracted cssFilterState:', cssFilterState);
        console.log('Extracted duotoneState:', duotoneState);
        console.log('Extracted glitchState:', glitchState);

        // 🎨 CSS FILTER DEBUG - Server side processing
        console.log('🎨 [API] CSS FILTER SERVER DEBUG:', {
            'received cssFilterState': cssFilterState,
            'type': typeof cssFilterState,
            'is object': typeof cssFilterState === 'object',
            'keys': cssFilterState ? Object.keys(cssFilterState) : 'no keys',
            'JSON string': JSON.stringify(cssFilterState)
        });

        // 🎨 CRITICAL DEBUG - Check if we're in POST or PUT route
        console.log('🎨 [API] ROUTE DEBUG:', {
            'method': req.method,
            'route': req.route?.path,
            'url': req.url,
            'body keys': Object.keys(req.body),
            'has cssFilterState in body': 'cssFilterState' in req.body
        });
        console.log('Update data being applied:', {
            id: req.params.id,
            name: name,
            previewImageUrl: previewImageUrl,
            originalPalette: originalPalette,
            originalObject: originalObject,
            hasArtboard: !!artboard,
            hasCanvasObjects: !!canvasObjects,
            hasAdminData: !!adminData
        });
        console.log('Old template previewImageUrl:', template.previewImageUrl);
        console.log('Old template originalPalette:', template.originalPalette);

        // If updating preview image, try to delete the old one from storage
        if (previewImageUrl && template.previewImageUrl && template.previewImageUrl !== previewImageUrl) {
            try {
                console.log('Attempting to delete old preview image:', template.previewImageUrl);

                // Extract filename from the old URL
                // URL format: https://f005.backblazeb2.com/file/stickers-replicate-app/675f365a9f4fa90f4b5fcea9/1749669323111-jqas6.png
                const urlParts = template.previewImageUrl.split('/');
                const fileName = urlParts.slice(-2).join('/'); // Get "userId/filename.png"

                console.log('Extracted filename for deletion:', fileName);
                await storage.deleteFile(fileName);
                console.log('Old preview image deleted successfully');
            } catch (deleteError) {
                console.warn('Failed to delete old preview image (continuing with update):', deleteError.message);
                // Don't fail the update if image deletion fails
            }
        }

        // Use direct MongoDB update with $set operator
        const updateFields = {};
        if (name !== undefined) updateFields.name = name;
        if (previewImageUrl !== undefined) updateFields.previewImageUrl = previewImageUrl;
        if (artboard !== undefined) updateFields.artboard = artboard;
        if (adminData !== undefined) updateFields.adminData = adminData;
        if (canvasObjects !== undefined) updateFields.canvasObjects = canvasObjects;
        if (editorState !== undefined) updateFields.editorState = editorState;

        // Always set originalPalette, even if empty
        updateFields.originalPalette = originalPalette || '';

        // Always set originalObject, even if empty
        updateFields.originalObject = originalObject || '';

        // Always set fontStylesList, even if empty
        updateFields.fontStylesList = fontStylesList || [];

        // Always set decorStylesList, even if empty
        updateFields.decorStylesList = decorStylesList || [];

        // Always set cssFilterState, even if empty
        updateFields.cssFilterState = cssFilterState || {};

        // Always set duotoneState, even if empty
        updateFields.duotoneState = duotoneState || {};

        // Always set glitchState, even if empty
        updateFields.glitchState = glitchState || {};

        // 🎨 EFFECTS DEBUG - What's being saved to database
        console.log('🎨 [API] EFFECTS UPDATE FIELDS:', {
            'updateFields.cssFilterState': updateFields.cssFilterState,
            'cssFilterState type': typeof updateFields.cssFilterState,
            'updateFields.duotoneState': updateFields.duotoneState,
            'duotoneState type': typeof updateFields.duotoneState,
            'updateFields.glitchState': updateFields.glitchState,
            'glitchState type': typeof updateFields.glitchState,
            'duotoneState JSON': JSON.stringify(updateFields.duotoneState),
            'glitchState JSON': JSON.stringify(updateFields.glitchState),
            'keys': updateFields.cssFilterState ? Object.keys(updateFields.cssFilterState) : 'no keys',
            'JSON string': JSON.stringify(updateFields.cssFilterState)
        });

        console.log('Updating with fields:', updateFields);

        const updatedTemplate = await DesignTemplate.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { new: true, runValidators: false }
        );

        console.log('After update - updatedTemplate.originalPalette:', updatedTemplate.originalPalette);
        console.log('After update - updatedTemplate.originalObject:', updatedTemplate.originalObject);
        console.log('After update - updatedTemplate.fontStylesList:', updatedTemplate.fontStylesList);
        console.log('After update - updatedTemplate.decorStylesList:', updatedTemplate.decorStylesList);
        console.log('After update - updatedTemplate.cssFilterState:', updatedTemplate.cssFilterState);

        // 🎨 CSS FILTER DEBUG - Final database result
        console.log('🎨 [API] CSS FILTER FINAL RESULT:', {
            'saved cssFilterState': updatedTemplate.cssFilterState,
            'type': typeof updatedTemplate.cssFilterState,
            'keys': updatedTemplate.cssFilterState ? Object.keys(updatedTemplate.cssFilterState) : 'no keys',
            'JSON string': JSON.stringify(updatedTemplate.cssFilterState)
        });

        // 🎨 EFFECTS DEBUG - Final database result for duotone and glitch
        console.log('🎨 [API] EFFECTS FINAL RESULT:', {
            'saved duotoneState': updatedTemplate.duotoneState,
            'saved glitchState': updatedTemplate.glitchState,
            'duotoneState type': typeof updatedTemplate.duotoneState,
            'glitchState type': typeof updatedTemplate.glitchState,
            'duotoneState JSON': JSON.stringify(updatedTemplate.duotoneState),
            'glitchState JSON': JSON.stringify(updatedTemplate.glitchState),
        });

        console.log('===== TEMPLATE UPDATE RESULT =====');
        console.log('Template updated successfully:', req.params.id);
        console.log('Updated template name:', updatedTemplate.name);
        console.log('Updated template previewImageUrl:', updatedTemplate.previewImageUrl);
        console.log('Updated template originalPalette:', updatedTemplate.originalPalette);
        console.log('Updated template originalObject:', updatedTemplate.originalObject);
        console.log('Updated template fontStylesList:', updatedTemplate.fontStylesList);
        console.log('Updated template decorStylesList:', updatedTemplate.decorStylesList);
        console.log('Updated template cssFilterState:', updatedTemplate.cssFilterState);
        console.log('Preview URL changed:', template.previewImageUrl !== updatedTemplate.previewImageUrl);
        console.log('Original palette changed:', template.originalPalette !== updatedTemplate.originalPalette);
        console.log('Original object changed:', template.originalObject !== updatedTemplate.originalObject);
        console.log('Font styles changed:', JSON.stringify(template.fontStylesList) !== JSON.stringify(updatedTemplate.fontStylesList));
        console.log('Decor styles changed:', JSON.stringify(template.decorStylesList) !== JSON.stringify(updatedTemplate.decorStylesList));
        console.log('CSS filters changed:', JSON.stringify(template.cssFilterState) !== JSON.stringify(updatedTemplate.cssFilterState));

        res.status(200).json(updatedTemplate);

    } catch (err) {
        console.error('Error updating template:', err);
        if (err.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid template ID format' });
        }
        res.status(500).json({ message: 'Server error updating template', error: err.message });
    }
});

// @desc    Toggle published status of a design template
// @route   PATCH /api/design-templates/:id/publish
// @access  Private
router.patch('/:id/publish', auth, async (req, res) => {
    try {
        const template = await DesignTemplate.findById(req.params.id);

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        // Ensure the user owns the template before updating
        if (template.userId && template.userId.toString() !== req.userId.toString()) {
            return res.status(403).json({ message: 'User not authorized to update this template' });
        }

        // Toggle the published status
        template.published = !template.published;
        await template.save();

        console.log(`Template ${req.params.id} published status changed to: ${template.published}`);
        res.status(200).json({
            message: `Template ${template.published ? 'published' : 'unpublished'} successfully`,
            published: template.published
        });

    } catch (err) {
        console.error('Error toggling template published status:', err);
        if (err.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid template ID format' });
        }
        res.status(500).json({ message: 'Server error toggling published status', error: err.message });
    }
});

// DELETE /api/design-templates/:id - Delete a template
router.delete('/:id', auth, async (req, res) => {
    try {
        console.log('===== DELETE TEMPLATE REQUEST =====');
        console.log('Template ID to delete:', req.params.id);
        console.log('User ID:', req.userId);

        // Find the template first to check ownership and get image URL
        const template = await DesignTemplate.findById(req.params.id);

        if (!template) {
            console.log('Template not found:', req.params.id);
            return res.status(404).json({ error: 'Template not found' });
        }

        // Check if user owns this template
        if (template.userId.toString() !== req.userId.toString()) {
            console.log('User does not own this template');
            return res.status(403).json({ error: 'Not authorized to delete this template' });
        }

        console.log('Deleting template:', template.name);
        console.log('Template preview image:', template.previewImageUrl);

        // Delete the template from database
        await DesignTemplate.findByIdAndDelete(req.params.id);

        // Optionally delete the preview image from storage
        if (template.previewImageUrl) {
            try {
                // Extract filename from URL for deletion
                const urlParts = template.previewImageUrl.split('/');
                const fileName = urlParts.slice(-2).join('/'); // Get "userId/filename.png"
                console.log('Attempting to delete preview image:', fileName);
                await storage.deleteFile(fileName);
                console.log('Preview image deleted successfully');
            } catch (deleteError) {
                console.warn('Failed to delete preview image (template still deleted):', deleteError.message);
            }
        }

        console.log('Template deleted successfully:', req.params.id);
        res.status(200).json({
            message: 'Template deleted successfully',
            deletedId: req.params.id
        });

    } catch (error) {
        console.error('Error deleting template:', error);
        res.status(500).json({ error: 'Failed to delete template' });
    }
});

export default router; // Use ES module export






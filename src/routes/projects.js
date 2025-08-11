import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { auth } from '../middleware/auth.js';
import { Project, ProjectFolder } from '../models/index.js';
import AssetManager from '../services/assetManager.js';

const router = express.Router();

// Configure multer for preview image uploads
const upload = multer({
    limits: {
        fileSize: 5000000 // 5MB limit
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload an image file'));
        }
        cb(null, true);
    }
});

// Get all projects for current user
router.get('/', auth, async (req, res) => {
    try {
        const { search, sort = 'updatedAt', folderId, status, page = 1, limit = 20 } = req.query;
        let query = { userId: req.userId };

        // Text search
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        // Folder filter
        if (folderId) {
            query.folderId = folderId === 'null' ? null : folderId;
        }

        // Status filter
        if (status) {
            query.status = status;
        }

        const sortOptions = {
            updatedAt: { updatedAt: -1 },
            createdAt: { createdAt: -1 },
            title: { title: 1 },
            lastOpened: { 'stats.lastOpened': -1 }
        };

        const projects = await Project.find(query)
            .populate('folderId', 'title color')
            .sort(sortOptions[sort] || sortOptions.updatedAt)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Project.countDocuments(query);

        res.json({
            projects,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Error fetching projects' });
    }
});

// Get recent projects for dashboard
router.get('/recent', auth, async (req, res) => {
    try {
        const projects = await Project.find({ userId: req.userId })
            .populate('folderId', 'title color')
            .sort({ 'stats.lastOpened': -1 })
            .limit(10);

        res.json(projects);
    } catch (error) {
        console.error('Error fetching recent projects:', error);
        res.status(500).json({ error: 'Error fetching recent projects' });
    }
});

// Get single project by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            userId: req.userId
        }).populate('folderId', 'title color');

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Update last opened timestamp
        project.stats.lastOpened = new Date();
        await project.save();

        res.json(project);
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ error: 'Error fetching project' });
    }
});

// Create new project
router.post('/', auth, async (req, res) => {
    try {
        console.log('[Projects] ===== CREATE PROJECT DEBUG =====');
        console.log('[Projects] User ID:', req.userId);
        console.log('[Projects] Request body keys:', Object.keys(req.body));
        console.log('[Projects] Complete request body:', req.body);
        console.log('[Projects] EditorState:', req.body.editorState);
        console.log('[Projects] Artboard in request:', req.body.artboard);
        console.log('[Projects] CanvasObjects in request:', req.body.canvasObjects?.length || 'undefined');
        console.log('[Projects] PreviewImageUrl:', req.body.previewImageUrl);
        // 🎯 ADD: Debug admin data specifically
        console.log('[Projects] 🎯 AdminData received:', req.body.adminData);
        console.log('[Projects] 🎯 AdminData keys:', req.body.adminData ? Object.keys(req.body.adminData) : 'undefined');
        console.log('[Projects] 🎯 AdminData originalPalette:', req.body.adminData?.originalPalette);
        console.log('[Projects] 🎯 AdminData originalObject:', req.body.adminData?.originalObject);

        const {
            title,
            description,
            editorState,
            adminData,
            previewImageUrl,
            artboard,
            canvasObjects,
            folderId,
            tags,
            status = 'draft',
            fontStylesList,
            decorStylesList,
            cssFilterState,
            duotoneState,
            glitchState,
            halftoneState,
            guidelinesState,
            layoutRectanglesState
        } = req.body;

        // 🎨 ADD: Debug duotone and glitch states (after destructuring)
        console.log('[Projects] 🎨 DuotoneState received:', duotoneState);
        console.log('[Projects] 🎨 DuotoneState type:', typeof duotoneState);
        console.log('[Projects] 🎨 GlitchState received:', glitchState);
        console.log('[Projects] 🎨 GlitchState type:', typeof glitchState);
        console.log('[Projects] 🎨 CssFilterState received:', cssFilterState);

        console.log('[Projects] 🔍 Extracted artboard:', artboard);
        console.log('[Projects] 🔍 Extracted canvasObjects:', canvasObjects?.length || 'undefined');

        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        if (!editorState) {
            return res.status(400).json({ error: 'Editor state is required' });
        }

        if (!previewImageUrl) {
            return res.status(400).json({ error: 'Preview image is required' });
        }

        console.log('[Projects] 🔍 Creating project with data:', {
            userId: req.userId,
            title,
            description,
            artboard,
            canvasObjectsLength: (canvasObjects || []).length,
            previewImageUrl: previewImageUrl ? 'provided' : 'missing'
        });

        // 🎯 PROCESS ASSETS: Extract and save assets from canvas objects
        console.log('[Projects] ===== ASSET PROCESSING START =====');
        console.log('[Projects] Canvas objects count:', canvasObjects?.length || 0);
        console.log('[Projects] User ID:', req.userId);

        let processedCanvasObjects = canvasObjects || [];
        if (canvasObjects && canvasObjects.length > 0) {
            // Log canvas objects with image URLs
            const imageObjects = canvasObjects.filter(obj => obj.type === 'image' && obj.imageUrl);
            console.log('[Projects] Found image objects:', imageObjects.length);
            imageObjects.forEach((obj, i) => {
                console.log(`[Projects] Image ${i}: ${obj.imageUrl}`);
            });

            try {
                console.log('[Projects] 🎯 Processing assets for project...');
                processedCanvasObjects = await AssetManager.processProjectAssets(
                    canvasObjects,
                    'project-' + Date.now(), // Temporary ID for project
                    null, // No template ID for projects
                    req.userId // Pass user ID for B2 authorization
                );
                console.log('[Projects] ✅ Assets processed successfully for project');
                console.log('[Projects] Processed objects count:', processedCanvasObjects?.length || 0);

                // Log processed image objects
                const processedImageObjects = processedCanvasObjects.filter(obj => obj.type === 'image');
                processedImageObjects.forEach((obj, i) => {
                    console.log(`[Projects] Processed Image ${i}:`, {
                        imageUrl: obj.imageUrl,
                        assetId: obj.assetId,
                        hasAssetId: !!obj.assetId
                    });
                });

            } catch (error) {
                console.error('[Projects] ❌ Error processing project assets:', error);
                console.error('[Projects] Error stack:', error.stack);
                // Continue with original canvas objects if asset processing fails
                processedCanvasObjects = canvasObjects;
            }
        } else {
            console.log('[Projects] No canvas objects to process');
        }
        console.log('[Projects] ===== ASSET PROCESSING END =====');

        const project = new Project({
            userId: req.userId,
            title,
            description,
            editorState,
            adminData,
            previewImageUrl,
            artboard,
            canvasObjects: processedCanvasObjects, // Use processed canvas objects with asset IDs
            folderId: folderId || null,
            tags: tags || [],
            status,
            // Include effect states (same pattern as templates)
            fontStylesList: fontStylesList || [],
            decorStylesList: decorStylesList || [],
            cssFilterState: cssFilterState || {},
            duotoneState: duotoneState || {},
            glitchState: glitchState || {},
            halftoneState: halftoneState || {},
            guidelinesState: guidelinesState || { guidelines: [], totalCount: 0 },
            layoutRectanglesState: layoutRectanglesState || { rectangles: [], totalCount: 0 },
            stats: {
                viewCount: 0,
                editCount: 1,
                lastOpened: new Date(),
                lastModified: new Date()
            }
        });

        console.log('[Projects] 🔍 Project created, attempting to save...');
        const savedProject = await project.save();
        console.log('[Projects] ✅ Project saved successfully!');

        // 🎯 UPDATE ASSET USAGE: Update assets with the actual project ID
        if (processedCanvasObjects !== canvasObjects && savedProject._id) {
            try {
                console.log('[Projects] 🎯 Updating asset usage with project ID:', savedProject._id);
                // Update asset usage with the actual project ID
                await AssetManager.updateAssetUsage(
                    processedCanvasObjects,
                    savedProject._id.toString(), // Project ID
                    null // No template ID for projects
                );
                console.log('[Projects] ✅ Asset usage updated with project ID');
            } catch (error) {
                console.error('[Projects] ❌ Error updating asset usage:', error);
                // Project is already saved, so this is not critical
            }
        }
        // 🎯 ADD: Debug saved admin data
        console.log('[Projects] 🎯 Saved adminData:', project.adminData);
        console.log('[Projects] 🎯 Saved adminData keys:', project.adminData ? Object.keys(project.adminData) : 'undefined');
        console.log('[Projects] 🎯 Saved originalPalette:', project.adminData?.originalPalette);
        console.log('[Projects] 🎯 Saved originalObject:', project.adminData?.originalObject);
        // 🎨 ADD: Debug saved duotone, glitch, and halftone states
        console.log('[Projects] 🎨 ===== SAVED EFFECT STATES DEBUG =====');
        console.log('[Projects] 🎨 Saved duotoneState:', project.duotoneState);
        console.log('[Projects] 🎨 Saved duotoneState type:', typeof project.duotoneState);
        console.log('[Projects] 🎨 Saved duotoneState keys:', project.duotoneState ? Object.keys(project.duotoneState) : 'no keys');
        console.log('[Projects] 🎨 Saved glitchState:', project.glitchState);
        console.log('[Projects] 🎨 Saved glitchState type:', typeof project.glitchState);
        console.log('[Projects] 🎨 Saved glitchState keys:', project.glitchState ? Object.keys(project.glitchState) : 'no keys');
        console.log('[Projects] 🎨 Saved halftoneState:', project.halftoneState);
        console.log('[Projects] 🎨 Saved halftoneState type:', typeof project.halftoneState);
        console.log('[Projects] 🎨 Saved halftoneState keys:', project.halftoneState ? Object.keys(project.halftoneState) : 'no keys');
        console.log('[Projects] 🎨 Saved cssFilterState:', project.cssFilterState);

        // Update folder project count if project is in a folder
        if (folderId) {
            await ProjectFolder.findByIdAndUpdate(folderId, {
                $inc: { 'stats.projectCount': 1 },
                $set: { 'stats.lastModified': new Date() }
            });
        }

        res.status(201).json(project);
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ error: 'Error creating project' });
    }
});

// Update project
router.put('/:id', auth, async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            userId: req.userId
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const {
            title,
            description,
            editorState,
            adminData,
            previewImageUrl,
            canvasObjects,
            artboard,
            folderId,
            tags,
            status,
            fontStylesList,
            decorStylesList,
            cssFilterState,
            duotoneState,
            glitchState,
            halftoneState,
            guidelinesState,
            layoutRectanglesState
        } = req.body;

        // 🎯 PROCESS ASSETS: If canvas objects are being updated, process assets
        let processedCanvasObjects = canvasObjects;
        if (canvasObjects && canvasObjects.length > 0) {
            try {
                console.log('[Projects] 🎯 Processing assets for project update...');
                processedCanvasObjects = await AssetManager.processProjectAssets(
                    canvasObjects,
                    req.params.id, // Use actual project ID
                    null, // No template ID for projects
                    req.userId // Pass user ID for B2 authorization
                );
                console.log('[Projects] ✅ Assets processed successfully for project update');
            } catch (error) {
                console.error('[Projects] ❌ Error processing project update assets:', error);
                // Continue with original canvas objects if asset processing fails
                processedCanvasObjects = canvasObjects;
            }
        }

        // Update fields if provided
        if (title !== undefined) project.title = title;
        if (description !== undefined) project.description = description;
        if (editorState !== undefined) project.editorState = editorState;
        if (adminData !== undefined) project.adminData = adminData;
        if (previewImageUrl !== undefined) project.previewImageUrl = previewImageUrl;
        if (processedCanvasObjects !== undefined) project.canvasObjects = processedCanvasObjects;
        if (artboard !== undefined) project.artboard = artboard;
        if (folderId !== undefined) project.folderId = folderId || null;
        if (tags !== undefined) project.tags = tags;
        if (status !== undefined) project.status = status;
        // Update effect states if provided
        if (fontStylesList !== undefined) project.fontStylesList = fontStylesList;
        if (decorStylesList !== undefined) project.decorStylesList = decorStylesList;
        if (cssFilterState !== undefined) project.cssFilterState = cssFilterState;
        if (duotoneState !== undefined) project.duotoneState = duotoneState;
        if (glitchState !== undefined) project.glitchState = glitchState;
        if (halftoneState !== undefined) project.halftoneState = halftoneState;
        if (guidelinesState !== undefined) project.guidelinesState = guidelinesState;
        if (layoutRectanglesState !== undefined) project.layoutRectanglesState = layoutRectanglesState;

        await project.save();

        res.json(project);
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ error: 'Error updating project' });
    }
});

// Delete project
router.delete('/:id', auth, async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            userId: req.userId
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Update folder project count if project was in a folder
        if (project.folderId) {
            await ProjectFolder.findByIdAndUpdate(project.folderId, {
                $inc: { 'stats.projectCount': -1 },
                $set: { 'stats.lastModified': new Date() }
            });
        }

        await Project.findByIdAndDelete(req.params.id);

        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ error: 'Error deleting project' });
    }
});

// Duplicate project
router.post('/:id/duplicate', auth, async (req, res) => {
    try {
        const originalProject = await Project.findOne({
            _id: req.params.id,
            userId: req.userId
        });

        if (!originalProject) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const { title } = req.body;
        const duplicateTitle = title || `${originalProject.title} (Copy)`;

        const duplicateProject = new Project({
            userId: req.userId,
            title: duplicateTitle,
            description: originalProject.description,
            editorState: JSON.parse(JSON.stringify(originalProject.editorState)), // Deep copy
            adminData: originalProject.adminData,
            previewImageUrl: originalProject.previewImageUrl,
            artboard: originalProject.artboard,
            canvasObjects: JSON.parse(JSON.stringify(originalProject.canvasObjects || [])), // Deep copy
            folderId: originalProject.folderId,
            tags: [...originalProject.tags],
            status: 'draft',
            // Include effect states
            fontStylesList: originalProject.fontStylesList || [],
            decorStylesList: originalProject.decorStylesList || [],
            cssFilterState: originalProject.cssFilterState || {},
            duotoneState: originalProject.duotoneState || {},
            glitchState: originalProject.glitchState || {},
            stats: {
                viewCount: 0,
                editCount: 0,
                lastOpened: new Date(),
                lastModified: new Date()
            }
        });

        await duplicateProject.save();

        // Update folder project count if project is in a folder
        if (duplicateProject.folderId) {
            await ProjectFolder.findByIdAndUpdate(duplicateProject.folderId, {
                $inc: { 'stats.projectCount': 1 },
                $set: { 'stats.lastModified': new Date() }
            });
        }

        res.status(201).json(duplicateProject);
    } catch (error) {
        console.error('Error duplicating project:', error);
        res.status(500).json({ error: 'Error duplicating project' });
    }
});

export default router;

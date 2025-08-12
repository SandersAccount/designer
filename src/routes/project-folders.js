import express from 'express';
import { auth } from '../../middleware/auth.js';
import { ProjectFolder, Project } from '../../models/index.js';

const router = express.Router();

// Get all project folders for current user
router.get('/', auth, async (req, res) => {
    try {
        const { parentFolderId } = req.query;
        let query = { userId: req.userId };

        // Filter by parent folder if specified
        if (parentFolderId !== undefined) {
            query.parentFolderId = parentFolderId === 'null' ? null : parentFolderId;
        }

        const folders = await ProjectFolder.find(query)
            .sort({ createdAt: -1 });

        // Update project counts for each folder
        for (const folder of folders) {
            const projectCount = await Project.countDocuments({
                userId: req.userId,
                folderId: folder._id
            });
            
            if (folder.stats.projectCount !== projectCount) {
                folder.stats.projectCount = projectCount;
                await folder.save();
            }
        }

        res.json(folders);
    } catch (error) {
        console.error('Error fetching project folders:', error);
        res.status(500).json({ error: 'Error fetching project folders' });
    }
});

// Get single project folder by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const folder = await ProjectFolder.findOne({
            _id: req.params.id,
            userId: req.userId
        });

        if (!folder) {
            return res.status(404).json({ error: 'Project folder not found' });
        }

        // Update project count
        const projectCount = await Project.countDocuments({
            userId: req.userId,
            folderId: folder._id
        });
        
        if (folder.stats.projectCount !== projectCount) {
            folder.stats.projectCount = projectCount;
            await folder.save();
        }

        res.json(folder);
    } catch (error) {
        console.error('Error fetching project folder:', error);
        res.status(500).json({ error: 'Error fetching project folder' });
    }
});

// Create new project folder
router.post('/', auth, async (req, res) => {
    try {
        const {
            title,
            description,
            color = '#3b82f6',
            icon = 'folder',
            parentFolderId = null
        } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        // Check if parent folder exists and belongs to user
        if (parentFolderId) {
            const parentFolder = await ProjectFolder.findOne({
                _id: parentFolderId,
                userId: req.userId
            });
            
            if (!parentFolder) {
                return res.status(400).json({ error: 'Parent folder not found' });
            }
        }

        const folder = new ProjectFolder({
            userId: req.userId,
            title,
            description,
            color,
            icon,
            parentFolderId,
            stats: {
                projectCount: 0,
                lastModified: new Date()
            }
        });

        await folder.save();

        res.status(201).json(folder);
    } catch (error) {
        console.error('Error creating project folder:', error);
        res.status(500).json({ error: 'Error creating project folder' });
    }
});

// Update project folder
router.put('/:id', auth, async (req, res) => {
    try {
        const folder = await ProjectFolder.findOne({
            _id: req.params.id,
            userId: req.userId
        });

        if (!folder) {
            return res.status(404).json({ error: 'Project folder not found' });
        }

        const {
            title,
            description,
            color,
            icon,
            parentFolderId
        } = req.body;

        // Update fields if provided
        if (title !== undefined) folder.title = title;
        if (description !== undefined) folder.description = description;
        if (color !== undefined) folder.color = color;
        if (icon !== undefined) folder.icon = icon;
        if (parentFolderId !== undefined) {
            // Check if parent folder exists and belongs to user
            if (parentFolderId && parentFolderId !== folder._id.toString()) {
                const parentFolder = await ProjectFolder.findOne({
                    _id: parentFolderId,
                    userId: req.userId
                });
                
                if (!parentFolder) {
                    return res.status(400).json({ error: 'Parent folder not found' });
                }
            }
            folder.parentFolderId = parentFolderId || null;
        }

        await folder.save();

        res.json(folder);
    } catch (error) {
        console.error('Error updating project folder:', error);
        res.status(500).json({ error: 'Error updating project folder' });
    }
});

// Delete project folder
router.delete('/:id', auth, async (req, res) => {
    try {
        const folder = await ProjectFolder.findOne({
            _id: req.params.id,
            userId: req.userId
        });

        if (!folder) {
            return res.status(404).json({ error: 'Project folder not found' });
        }

        // Check if folder has projects
        const projectCount = await Project.countDocuments({
            userId: req.userId,
            folderId: folder._id
        });

        if (projectCount > 0) {
            // Move projects to root folder (null)
            await Project.updateMany(
                { userId: req.userId, folderId: folder._id },
                { $set: { folderId: null } }
            );
        }

        // Check if folder has subfolders
        const subfolderCount = await ProjectFolder.countDocuments({
            userId: req.userId,
            parentFolderId: folder._id
        });

        if (subfolderCount > 0) {
            // Move subfolders to parent folder
            await ProjectFolder.updateMany(
                { userId: req.userId, parentFolderId: folder._id },
                { $set: { parentFolderId: folder.parentFolderId } }
            );
        }

        await ProjectFolder.findByIdAndDelete(req.params.id);

        res.json({ message: 'Project folder deleted successfully' });
    } catch (error) {
        console.error('Error deleting project folder:', error);
        res.status(500).json({ error: 'Error deleting project folder' });
    }
});

// Get projects in a specific folder
router.get('/:id/projects', auth, async (req, res) => {
    try {
        const { page = 1, limit = 20, sort = 'updatedAt' } = req.query;
        
        const folder = await ProjectFolder.findOne({
            _id: req.params.id,
            userId: req.userId
        });

        if (!folder) {
            return res.status(404).json({ error: 'Project folder not found' });
        }

        const sortOptions = {
            updatedAt: { updatedAt: -1 },
            createdAt: { createdAt: -1 },
            title: { title: 1 },
            lastOpened: { 'stats.lastOpened': -1 }
        };

        const projects = await Project.find({
            userId: req.userId,
            folderId: folder._id
        })
            .sort(sortOptions[sort] || sortOptions.updatedAt)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Project.countDocuments({
            userId: req.userId,
            folderId: folder._id
        });

        res.json({
            folder,
            projects,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching folder projects:', error);
        res.status(500).json({ error: 'Error fetching folder projects' });
    }
});

export default router;






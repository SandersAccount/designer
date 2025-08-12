const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const auth = require('../../middleware/auth');
// Import models from central index file
// Need Generation model here now
const { Collection, Image, Tag, Generation } = require('../../models/index.js');

const router = express.Router();

// Configure multer for image uploads
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

// Get all collections for current user with search and filters
router.get('/', auth, async (req, res) => {
    try {
        const { search, sort = 'updatedAt', category, tags, page = 1, limit = 20 } = req.query;
        let query = { userId: req.user._id };

        // Text search
        if (search) {
            query.$text = { $search: search };
        }

        // Category filter
        if (category) {
            query.category = category;
        }

        // Tags filter
        if (tags) {
            const tagIds = tags.split(',');
            query.tags = { $all: tagIds };
        }

        const sortOptions = {
            updatedAt: { updatedAt: -1 },
            name: { title: 1 },
            imageCount: { 'images.length': -1 }
        };

        const collections = await Collection.find(query)
            .populate({
                path: 'images',
                select: 'imageUrl prompt tags isUpscaled status createdAt', // Use Generation model fields
                model: 'Generation' // Explicitly specify the model
            })
            .sort(sortOptions[sort] || sortOptions.updatedAt)
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Collection.countDocuments({ userId: req.user._id });

        res.json({
            collections,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching collections' });
    }
});

// Bulk import images
router.post('/bulk-import', auth, upload.array('images', 10), async (req, res) => {
    try {
        const { collectionId, category, tags } = req.body;
        const collection = await Collection.findOne({
            _id: collectionId,
            _id: { $in: req.user.collections }
        });

        if (!collection) {
            return res.status(404).json({ error: 'Collection not found' });
        }

        const processedImages = await Promise.all(req.files.map(async (file) => {
            // Process image with sharp
            const processedBuffer = await sharp(file.buffer)
                .resize({ width: 800, height: 800, fit: 'inside' })
                .jpeg({ quality: 80 })
                .toBuffer();

            const metadata = await sharp(processedBuffer).metadata();

            // Create image document
            const image = new Image({
                url: `data:image/jpeg;base64,${processedBuffer.toString('base64')}`,
                category: category || 'sticker',
                tags: tags ? tags.split(',') : [],
                metadata: {
                    width: metadata.width,
                    height: metadata.height,
                    format: metadata.format,
                    size: processedBuffer.length
                },
                createdBy: req.user._id
            });

            await image.save();
            return image._id;
        }));

        // Add images to collection
        collection.images.push(...processedImages);
        await collection.save();

        res.status(201).json({
            message: `Successfully imported ${processedImages.length} images`,
            imageIds: processedImages
        });
    } catch (error) {
        res.status(400).json({ error: 'Error importing images' });
    }
});

// Export collection
router.get('/:id/export', auth, async (req, res) => {
    try {
        const collection = await Collection.findOne({
            _id: req.params.id,
            _id: { $in: req.user.collections }
        }).populate({
            path: 'images',
            populate: { path: 'tags', select: 'name color' }
        });

        if (!collection) {
            return res.status(404).json({ error: 'Collection not found' });
        }

        const exportData = {
            title: collection.title,
            createdAt: collection.createdAt,
            images: collection.images.map(image => ({
                url: image.url,
                prompt: image.prompt,
                category: image.category,
                tags: image.tags.map(tag => tag.name),
                metadata: image.metadata
            }))
        };

        res.json(exportData);
    } catch (error) {
        res.status(500).json({ error: 'Error exporting collection' });
    }
});

// Bulk update images
router.patch('/bulk-update', auth, async (req, res) => {
    try {
        const { imageIds, updates } = req.body;
        const allowedUpdates = ['category', 'tags'];
        const updateKeys = Object.keys(updates);
        
        if (!imageIds?.length || !updateKeys.length) {
            return res.status(400).json({ error: 'No images or updates specified' });
        }

        const isValidOperation = updateKeys.every(key => allowedUpdates.includes(key));
        if (!isValidOperation) {
            return res.status(400).json({ error: 'Invalid updates' });
        }

        // Verify user has access to these images
        const userCollections = await Collection.find({
            _id: { $in: req.user.collections }
        });
        const userImageIds = userCollections.flatMap(c => c.images.map(id => id.toString()));
        const authorizedImages = imageIds.filter(id => userImageIds.includes(id));

        if (authorizedImages.length === 0) {
            return res.status(403).json({ error: 'No authorized images to update' });
        }

        // Perform updates
        const updatePromises = authorizedImages.map(async (imageId) => {
            const image = await Image.findById(imageId);
            if (!image) return null;

            updateKeys.forEach(key => {
                if (key === 'tags') {
                    image.tags = updates.tags;
                } else {
                    image[key] = updates[key];
                }
            });

            return image.save();
        });

        await Promise.all(updatePromises);

        res.json({
            message: `Successfully updated ${authorizedImages.length} images`,
            updatedIds: authorizedImages
        });
    } catch (error) {
        res.status(400).json({ error: 'Error updating images' });
    }
});

// Create new collection
router.post('/', auth, async (req, res) => {
    try {
        const collection = new Collection({
            ...req.body,
            owner: req.user._id
        });
        await collection.save();

        // Add collection to user's collections
        req.user.collections.push(collection._id);
        await req.user.save();

        res.status(201).json(collection);
    } catch (error) {
        res.status(400).json({ error: 'Error creating collection' });
    }
});

// Update collection
router.patch('/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['title'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).json({ error: 'Invalid updates' });
    }

    try {
        const collection = await Collection.findOne({
            _id: req.params.id,
            _id: { $in: req.user.collections }
        });

        if (!collection) {
            return res.status(404).json({ error: 'Collection not found' });
        }

        updates.forEach(update => collection[update] = req.body[update]);
        await collection.save();

        res.json(collection);
    } catch (error) {
        res.status(400).json({ error: 'Error updating collection' });
    }
});

// Delete collection
router.delete('/:id', auth, async (req, res) => {
    try {
        console.log(`[DELETE Collection] Attempting to delete collection ${req.params.id} for user ${req.userId}`);

        const collection = await Collection.findOne({
            _id: req.params.id,
            userId: req.userId
        });

        if (!collection) {
            console.log(`[DELETE Collection] Collection not found: ${req.params.id}`);
            return res.status(404).json({ error: 'Collection not found' });
        }

        console.log(`[DELETE Collection] Found collection "${collection.title}" with ${collection.images.length} images`);

        // Note: We don't delete the Generation records themselves, only remove the collection
        // The Generation records may be referenced by other collections or used elsewhere

        // Delete the collection
        await Collection.findByIdAndDelete(req.params.id);

        console.log(`[DELETE Collection] Successfully deleted collection "${collection.title}"`);
        res.json({
            message: 'Collection deleted successfully',
            deletedCollection: {
                id: collection._id,
                title: collection.title
            }
        });
    } catch (error) {
        console.error('[DELETE Collection] Error deleting collection:', error);
        res.status(500).json({ error: 'Error deleting collection' });
    }
});

// Add image to collection
// Removed upload.single('image') middleware as this route expects JSON body
router.post('/:id/images', auth, async (req, res) => {
    console.log('!!! ROUTE HANDLER ENTERED for /api/collections/:id/images !!!'); // Added entry log
    console.log(`[POST /api/collections/:id/images] Received request for collection ID: ${req.params.id}`);
    console.log('[POST /api/collections/:id/images] Request Body:', JSON.stringify(req.body, null, 2));
    // No file expected here anymore
    // console.log('[POST /api/collections/:id/images] Request File:', req.file ? req.file.originalname : 'No file uploaded');

    try {
        const collection = await Collection.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!collection) {
            return res.status(404).json({ error: 'Collection not found' });
        }

        // --- DEBUG: Explicitly check if generationId is somehow present ---
        if (req.body.generationId) {
            console.error('!!! DEBUG: generationId FOUND in req.body unexpectedly:', req.body.generationId);
            // Still proceed with the editor logic for now to see if it works otherwise
        }

        // --- Simplified Logic: Assume NO generationId (Editor Case Only) ---
        const { imageUrl, prompt, tags } = req.body;
        let generationToAddId;
        let responseData;

        if (imageUrl && prompt) {
            // Create a new Generation document
            console.log(`[POST /api/collections/:id/images] Creating new Generation from imageUrl: ${imageUrl}`);
            console.log(`[POST /api/collections/:id/images] Tags to add: ${JSON.stringify(tags)}`);
            const newGeneration = new Generation({
                userId: req.user._id,
                prompt: prompt,
                imageUrl: imageUrl, // Use imageUrl field as per Generation schema
                status: 'completed', // Mark as completed since it's an existing image
                tags: tags || [] // Add tags support
            });

            try {
                console.log('[POST /api/collections/:id/images] Attempting to save new Generation document...');
                await newGeneration.save();
                console.log(`[POST /api/collections/:id/images] New Generation document saved successfully with ID: ${newGeneration._id}`);
                generationToAddId = newGeneration._id;
                responseData = newGeneration; // Respond with the new generation data
            } catch (saveError) {
                console.error('[POST /api/collections/:id/images] Error saving new Generation document:', saveError);
                return res.status(400).json({ error: 'Error saving generation data', details: saveError.message });
            }
        } else {
            // Insufficient data (imageUrl or prompt missing)
            console.error('[POST /api/collections/:id/images] Error: Insufficient data provided (need imageUrl & prompt).');
            return res.status(400).json({ error: 'Insufficient data provided (imageUrl/prompt).' });
        }

        // Add the new generation ID to the collection
        // Ensure generationToAddId was set before proceeding
        if (generationToAddId) {
            if (!collection.images.includes(generationToAddId)) {
                 collection.images.push(generationToAddId);
                 console.log(`[POST /api/collections/:id/images] Added generation ${generationToAddId} to collection ${collection._id}. Attempting to save collection...`);
                 await collection.save();
                 console.log(`[POST /api/collections/:id/images] Collection ${collection._id} saved successfully.`);
            } else {
                 console.log(`[POST /api/collections/:id/images] Generation ${generationToAddId} already in collection ${collection._id}. Skipping add.`);
            }
            // Return the created generation data
            res.status(201).json(responseData);
        } else {
             // Should not happen if the logic above is correct, but as a safeguard:
             console.error('[POST /api/collections/:id/images] Error: generationToAddId was not set.');
             return res.status(500).json({ error: 'Internal server error: Failed to determine generation ID.' });
        }

    } catch (error) {
        console.error('[POST /api/collections/:id/images] General error in route handler:', error);
        res.status(400).json({ error: 'Error adding image to collection', details: error.message });
    }
});

// Remove image from collection
router.delete('/:collectionId/images/:imageId', auth, async (req, res) => {
    try {
        const collection = await Collection.findOne({
            _id: req.params.collectionId,
            _id: { $in: req.user.collections }
        });

        if (!collection) {
            return res.status(404).json({ error: 'Collection not found' });
        }

        collection.images = collection.images.filter(id => id.toString() !== req.params.imageId);
        await collection.save();

        // Delete the image
        await Image.findByIdAndDelete(req.params.imageId);

        res.json({ message: 'Image removed from collection' });
    } catch (error) {
        res.status(500).json({ error: 'Error removing image from collection' });
    }
});

module.exports = router;



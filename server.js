import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import bcrypt from 'bcrypt';
import axios from 'axios';
import dotenv from 'dotenv';
import Replicate from 'replicate';
import { readFile } from 'fs/promises';
import fs from 'fs';
import fetch from 'node-fetch'; // Ensure fetch is imported for the proxy route

// Load environment variables
dotenv.config();

// Import database connection
import './config/database.js';

// Import models
import User from './models/User.js';
import Settings from './models/Settings.js';
import Style from './models/Style.js';
import Theme from './models/Theme.js';
import Collection from './models/Collection.js';
import Generation from './models/Generation.js';
import Variable from './models/Variable.js';
import PromptTemplate from './models/PromptTemplate.js';
import FilterPreset from './models/FilterPreset.js';
import ComprehensivePreset from './models/ComprehensivePreset.js';

// Import routes
import authRoutes from './routes/auth.js';
import subscriptionRoutes from './routes/subscription.js';
import adminRoutes from './routes/admin.js';
import creditsRoutes from './routes/credits.js';
import imagesRoutes from './routes/images.js';
import ipnRouter from './routes/ipn.js';
import variablesRouter from './routes/variables.js';
import generateRouter from './routes/generate.js';
import modelsRouter from './routes/models.js';
import themeRoutes from './routes/themes.js';
import downloadRouter from './routes/download.js';
import stylesRouter from './routes/styles.js';
import inpaintingRouter from './routes/inpainting.js';
import inspirationsRouter from './routes/inspirations.js';
import generateFromInspirationRouter from './routes/generate-from-inspiration.js';
import generationsRouter from './routes/generations.js';
import filterPresetsRouter from './routes/filter-presets.js';
import comprehensivePresetsRouter from './routes/comprehensive-presets.js';
import promptTemplatesRouter from './routes/promptTemplates.js';
import designTemplatesRoutes from './routes/designTemplates.js'; // Import the new design template routes
import textStylesRoutes from './routes/textStyles.js'; // Import text styles routes
import projectsRoutes from './routes/projects.js'; // Import user projects routes
import projectFoldersRoutes from './routes/project-folders.js'; // Import project folders routes
import fontTagsRoutes from './routes/fontTags.js'; // Import font tags routes
import assetsRoutes from './routes/assets.js'; // Import assets management routes
import uploadRouter from './routes/upload.js';
import persistentParametersRoutes from './routes/persistentParameters.js'; // Import persistent parameters routes
import generateTextsRouter from './routes/generateTexts.js'; // Import text generation routes
import imageFiltersRouter from './routes/image-filters.js'; // Import image filters routes

// Import middleware
import { auth, adminAuth } from './middleware/auth.js';

// Import utilities
import { storage } from './utils/storage.js';
import { localStyleStorage } from './utils/localStyleStorage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load models configuration
let modelsConfig;
try {
    modelsConfig = JSON.parse(
        await readFile(new URL('./models.json', import.meta.url))
    );
} catch (error) {
    console.error("Failed to load models.json:", error);
    process.exit(1); // Exit if essential config is missing
}


// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 2048 * 2048 // 20MB limit
    }
});

const app = express();
const port = process.env.PORT || 3006;

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
// Add cache control for JavaScript files to prevent caching issues during development
app.use('/js', (req, res, next) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

app.use(express.static('public'));
app.use('/uploads', express.static('public/uploads'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err.stack || err); // Log stack trace
    res.status(500).json({ error: err.message || 'Internal server error' });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/credits', creditsRoutes);
app.use('/api/images', imagesRoutes);
app.use('/api/ipn', ipnRouter);
app.use('/api/variables', variablesRouter);
app.use('/api/generate', generateRouter);
app.use('/api/models', modelsRouter);
app.use('/api/themes', themeRoutes);
app.use('/api/download', downloadRouter);
app.use('/api/styles', stylesRouter);
app.use('/api/inpainting', inpaintingRouter);
app.use('/api/inspirations', inspirationsRouter);
app.use('/api/generate/from-inspiration', generateFromInspirationRouter);
app.use('/api/generations', generationsRouter);
app.use('/api/filter-presets', filterPresetsRouter); // Add filter presets routes
app.use('/api/comprehensive-presets', comprehensivePresetsRouter); // Add comprehensive presets routes
// app.use('/api/templates', promptTemplatesRouter); // Keep original prompt templates if needed, maybe rename path later
app.use('/api/prompt-templates', promptTemplatesRouter); // Use specific path for prompt templates
app.use('/api/design-templates', designTemplatesRoutes); // Add the design templates route
app.use('/api/text-styles', textStylesRoutes); // Add text styles routes
app.use('/api/projects', projectsRoutes); // Add user projects routes
app.use('/api/project-folders', projectFoldersRoutes); // Add project folders routes
app.use('/api/font-tags', fontTagsRoutes); // Add font tags routes
app.use('/api/assets', assetsRoutes); // Add assets management routes
app.use('/api/upload', uploadRouter);
app.use('/api/persistent-parameters', persistentParametersRoutes); // Add persistent parameters routes
app.use('/api/generate-texts', generateTextsRouter); // Add text generation routes
app.use('/api', imageFiltersRouter); // Add image filters routes

// Image proxy endpoint to bypass CORS for color extraction
app.get('/api/proxy-image', async (req, res) => {
    try {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({ error: 'URL parameter is required' });
        }

        console.log('🖼️ [Proxy] Fetching image:', url);

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');

        // Set appropriate headers
        res.set({
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
        });

        // Pipe the image data
        response.body.pipe(res);

    } catch (error) {
        console.error('🖼️ [Proxy] Error fetching image:', error);
        res.status(500).json({ error: 'Failed to fetch image' });
    }
});

// Stock Images API endpoint with folder support
app.get('/api/stock-images', (req, res) => {
    try {
        const folder = req.query.folder || ''; // Get folder parameter
        console.log(`📸 Fetching stock images from /stock/images${folder ? '/' + folder : ''}...`);

        // Build the path
        const stockImagesPath = path.join(__dirname, 'public', 'stock', 'images', folder);
        console.log('📸 Looking for images in:', stockImagesPath);

        // Check if directory exists
        if (!fs.existsSync(stockImagesPath)) {
            console.log('📸 Stock images directory does not exist:', stockImagesPath);
            return res.json({ folders: [], images: [] });
        }

        // Read directory contents
        const files = fs.readdirSync(stockImagesPath, { withFileTypes: true });
        console.log('📸 Found items in directory:', files.map(f => f.name));

        // Separate folders and files
        const folders = files
            .filter(item => item.isDirectory())
            .map(item => ({
                name: item.name,
                path: folder ? `${folder}/${item.name}` : item.name,
                type: 'folder'
            }));

        // Filter for image files
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
        const imageFiles = files
            .filter(item => item.isFile())
            .filter(item => {
                const ext = path.extname(item.name).toLowerCase();
                return imageExtensions.includes(ext);
            })
            .map(item => ({
                name: item.name,
                url: `/stock/images${folder ? '/' + folder : ''}/${item.name}`,
                type: 'image'
            }));

        const result = {
            currentFolder: folder,
            parentFolder: folder ? (folder.includes('/') ? folder.substring(0, folder.lastIndexOf('/')) : '') : null,
            folders: folders,
            images: imageFiles.map(img => img.url) // Keep backward compatibility
        };

        console.log(`📸 Found ${folders.length} folders and ${imageFiles.length} images`);
        console.log('📸 Returning result:', result);
        res.json(result);

    } catch (error) {
        console.error('📸 Error fetching stock images:', error);
        res.status(500).json({ error: 'Failed to fetch stock images' });
    }
});

// Stock Shapes API endpoint with folder support (unified with images system)
app.get('/api/stock-shapes', (req, res) => {
    try {
        const folder = req.query.folder || ''; // Get folder parameter
        console.log(`🔷 Fetching stock shapes from /stock/shapes${folder ? '/' + folder : ''}...`);

        // Build the path
        const stockShapesPath = path.join(__dirname, 'public', 'stock', 'shapes', folder);
        console.log('🔷 Looking for shapes in:', stockShapesPath);

        // Check if directory exists
        if (!fs.existsSync(stockShapesPath)) {
            console.log('🔷 Stock shapes directory does not exist:', stockShapesPath);
            return res.json({ folders: [], shapes: [] });
        }

        // Read directory contents
        const files = fs.readdirSync(stockShapesPath, { withFileTypes: true });
        console.log('🔷 Found items in directory:', files.map(f => f.name));

        // Separate folders and files
        const folders = files
            .filter(item => item.isDirectory())
            .map(item => ({
                name: item.name,
                path: folder ? `${folder}/${item.name}` : item.name,
                type: 'folder'
            }));

        // Filter for shape files (primarily SVG, but also other vector formats)
        const shapeExtensions = ['.svg', '.eps', '.ai', '.pdf'];
        const shapeFiles = files
            .filter(item => item.isFile())
            .filter(item => {
                const ext = path.extname(item.name).toLowerCase();
                return shapeExtensions.includes(ext);
            })
            .map(item => ({
                name: item.name,
                url: `/stock/shapes${folder ? '/' + folder : ''}/${item.name}`,
                type: 'shape'
            }));

        const result = {
            currentFolder: folder,
            parentFolder: folder ? (folder.includes('/') ? folder.substring(0, folder.lastIndexOf('/')) : '') : null,
            folders: folders,
            shapes: shapeFiles.map(shape => shape.url) // Keep backward compatibility
        };

        console.log(`🔷 Found ${folders.length} folders and ${shapeFiles.length} shapes`);
        console.log('🔷 Returning result:', result);
        res.json(result);

    } catch (error) {
        console.error('🔷 Error fetching stock shapes:', error);
        res.status(500).json({ error: 'Failed to fetch stock shapes' });
    }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Auth routes
app.get('/login', (req, res) => {
    const token = req.cookies.token; // Check correct cookie name if needed
    if (token) {
        try {
            jwt.verify(token, process.env.JWT_SECRET);
            return res.redirect('/');
        } catch (error) {
            // Invalid token, continue to login page
        }
    }
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Create JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Set cookie with token
        res.cookie('token', token, { // Ensure cookie name matches middleware check
            httpOnly: true,
            sameSite: 'lax', // Consider 'strict' if applicable
            secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Send response
        res.json({
            user: {
                _id: user._id,
                email: user.email,
                role: user.role // Ensure role is sent if needed client-side
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token'); // Ensure cookie name matches login
    res.json({ success: true });
});

// Protected routes - require authentication
app.get('/collections', auth, async (req, res) => {
    console.log('Serving collections page for user:', req.userId);
    res.sendFile(path.join(__dirname, 'public', 'collections.html'));
});

app.get('/inspiration', auth, async (req, res) => {
    console.log('Serving inspiration page for user:', req.userId);
    res.sendFile(path.join(__dirname, 'public', 'inspiration.html'));
});

app.get('/generate-from-inspiration', auth, async (req, res) => {
    console.log('Serving generate from inspiration page for user:', req.userId);
    res.sendFile(path.join(__dirname, 'public', 'generate-from-inspiration.html'));
});

// Removed duplicate /generate route handler

app.get('/profile', auth, async (req, res) => {
    console.log('Serving profile page for user:', req.userId);
    res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

app.get('/index.html', auth, async (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', auth, adminAuth, async (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin-variables', auth, adminAuth, async (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-variables.html'));
});

app.get('/admin-text-styles', auth, adminAuth, async (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-text-styles.html'));
});

app.get('/api/admin/users', auth, adminAuth, async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.get('/api/admin/stats', auth, adminAuth, async (req, res) => {
    try {
        // Get user statistics
        const totalUsers = await User.countDocuments();
        const proUsers = await User.countDocuments({ 'subscription.plan': 'pro' });
        const totalGenerations = await Generation.countDocuments();

        // Get recent activity
        const recentUsers = await User.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('-password');

        const recentGenerations = await Generation.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('userId', 'name email');

        res.json({
            users: {
                total: totalUsers,
                pro: proUsers
            },
            generations: {
                total: totalGenerations
            },
            recent: {
                users: recentUsers,
                generations: recentGenerations
            }
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ error: 'Failed to fetch admin stats' });
    }
});

// Toggle user role
app.put('/api/admin/users/:id/role', auth, adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.isAdmin = !user.isAdmin; // Assuming isAdmin field exists
        await user.save();

        res.json({ success: true, user });
    } catch (error) {
        console.error('Error toggling user role:', error);
        res.status(500).json({ error: 'Failed to update user role' });
    }
});

// Update user plan
app.post('/api/admin/users/:userId/plan', auth, adminAuth, async (req, res) => {
    try {
        const { userId } = req.params;
        const { plan } = req.body;

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: { plan } }, // Assuming 'plan' field exists directly on User model
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error updating user plan:', error);
        res.status(500).json({ error: 'Failed to update user plan' });
    }
});

// Public routes
app.get('/auth', (req, res) => {
    // If user is already logged in, redirect to home
    const token = req.cookies.token; // Ensure cookie name matches
    if (token) {
        try {
            jwt.verify(token, process.env.JWT_SECRET);
            return res.redirect('/');
        } catch (error) {
            // Token is invalid, continue to auth page
        }
    }
    res.sendFile(path.join(__dirname, 'public', 'auth.html'));
});

// API routes - Update to be user-specific
// Removed duplicate /api/generations GET route

// Delete a generation (ensure correct path)
app.delete('/api/generations/:id', auth, async (req, res) => {
    try {
        const generation = await Generation.findOne({
            _id: req.params.id,
            userId: req.userId
        });

        if (!generation) {
            return res.status(404).json({ error: 'Generation not found' });
        }

        console.log(`[Delete Generation] Deleting generation ${req.params.id} for user ${req.userId}`);

        // Remove the generation from all collections that contain it
        const collectionsUpdated = await Collection.updateMany(
            {
                userId: req.userId,
                images: req.params.id
            },
            {
                $pull: { images: req.params.id },
                $set: { 'stats.lastModified': new Date() }
            }
        );

        // Update image counts for affected collections
        const affectedCollections = await Collection.find({
            userId: req.userId,
            images: { $exists: true }
        });

        for (const collection of affectedCollections) {
            collection.stats.imageCount = collection.images.length;
            await collection.save();
        }

        console.log(`[Delete Generation] Removed generation from ${collectionsUpdated.modifiedCount} collections`);

        // Delete the generation record
        await Generation.deleteOne({ _id: req.params.id, userId: req.userId });

        console.log(`[Delete Generation] Generation ${req.params.id} deleted successfully`);
        res.json({ message: 'Generation deleted successfully' });
    } catch (error) {
        console.error('Error deleting generation:', error);
        res.status(500).json({ error: 'Failed to delete generation' });
    }
});


// Collections API endpoints - Update to be user-specific
app.post('/api/collections', auth, async (req, res) => {
    try {
        const { title } = req.body;
        if (!title) {
            throw new Error('Title is required');
        }

        const collection = new Collection({
            userId: req.userId,
            title,
            stats: {
                imageCount: 0,
                viewCount: 0,
                lastModified: new Date()
            }
        });
        await collection.save();

        res.json(collection);
    } catch (error) {
        console.error('Error creating collection:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/collections', auth, async (req, res) => {
    try {
        console.log('Fetching collections for user:', req.userId);
        const collections = await Collection.find({ userId: req.userId })
            .sort({ 'stats.lastModified': -1 })
            .populate({
                path: 'images', // Assuming 'images' field holds Generation refs
                select: 'imageUrl prompt tags isUpscaled createdAt',
                options: { sort: { createdAt: -1 }, limit: 4 }
            });

        console.log('Found collections:', collections.length);

        // Get preview images for each collection
        const collectionsWithPreviews = collections.map(collection => {
            const collectionObj = collection.toObject();
            // console.log('Processing collection:', collectionObj._id); // Less verbose logging

            // Format image URLs
            const formattedImages = (collectionObj.images || []).map(image => ({ // Handle case where images might be null/undefined
                ...image,
                imageUrl: image.imageUrl && image.imageUrl.startsWith('http') ?
                    image.imageUrl :
                    `${process.env.PUBLIC_URL || 'http://localhost:3006'}${image.imageUrl || ''}` // Handle potential missing imageUrl
            }));

            return {
                _id: collectionObj._id,
                title: collectionObj.title,
                stats: collectionObj.stats,
                images: formattedImages
            };
        });

        // console.log('Sending collections:', collectionsWithPreviews); // Less verbose logging
        res.json(collectionsWithPreviews);
    } catch (error) {
        console.error('Error fetching collections:', error);
        res.status(500).json({ error: 'Failed to fetch collections' });
    }
});

app.get('/api/collections/:id', auth, async (req, res) => {
    try {
        const collection = await Collection.findOne({
            _id: req.params.id,
            userId: req.userId
        }).populate('images', 'imageUrl prompt tags isUpscaled createdAt'); // Assuming 'images' field holds Generation refs

        if (!collection) {
            return res.status(404).json({ error: 'Collection not found' });
        }

        // Add isUpscaled flag based on URL path
        const enhancedCollection = collection.toObject();
        if (enhancedCollection.images) { // Check if images exist
             enhancedCollection.images = enhancedCollection.images.map(image => ({
                 ...image,
                 isUpscaled: image.imageUrl ? image.imageUrl.includes('/upscaled/') : false // Check if imageUrl exists
             }));
        }


        res.json(enhancedCollection);
    } catch (error) {
        console.error('Error fetching single collection:', error);
        res.status(500).json({ error: 'Failed to fetch collection' });
    }
});

app.get('/collection/:id', auth, async (req, res) => {
    console.log('Serving collection page for user:', req.userId);
    res.sendFile(path.join(__dirname, 'public', 'collection.html'));
});

app.post('/api/collections/:collectionId/images', auth, async (req, res) => {
    console.log(`[POST /api/collections/:id/images - server.js] Handler entered.`); // Add log
    console.log(`[POST /api/collections/:id/images - server.js] Request Body:`, JSON.stringify(req.body, null, 2));
    try {
        const { collectionId } = req.params;
        const { imageUrl, prompt, generationId } = req.body; // Get all potential fields
        let generationToAddId;
        let responseData;

        // Find the collection first
        const collection = await Collection.findOne({
            _id: collectionId,
            userId: req.userId // Ensure user owns the collection
        });

        if (!collection) {
            console.error(`[POST /api/collections/:id/images - server.js] Collection ${collectionId} not found for user ${req.userId}`);
            return res.status(404).json({ error: 'Collection not found' });
        }

        // --- Logic to handle both existing Generations and new Images from Editor ---
        if (generationId) {
            // Case 1: Existing Generation ID provided
            console.log(`[POST /api/collections/:id/images - server.js] Adding existing Generation ID: ${generationId}`);
            const existingGeneration = await Generation.findOne({ _id: generationId, userId: req.userId });
            if (!existingGeneration) {
                 console.error(`[POST /api/collections/:id/images - server.js] Generation ${generationId} not found or user mismatch.`);
                 return res.status(404).json({ error: 'Generation not found or access denied.' });
            }
            generationToAddId = generationId;
            responseData = existingGeneration; // Respond with the existing generation data

        } else if (imageUrl && prompt) {
            // Case 2: No generationId, create a new Generation (from editor)
            console.log(`[POST /api/collections/:id/images - server.js] Creating new Generation from imageUrl: ${imageUrl}`);
            const newGeneration = new Generation({
                userId: req.userId,
                prompt: prompt,
                imageUrl: imageUrl, // Use imageUrl field as per Generation schema
                status: 'completed' // Mark as completed since it's an existing image
            });

            try {
                console.log('[POST /api/collections/:id/images - server.js] Attempting to save new Generation document...');
                await newGeneration.save();
                console.log(`[POST /api/collections/:id/images - server.js] New Generation document saved successfully with ID: ${newGeneration._id}`);
                generationToAddId = newGeneration._id;
                responseData = newGeneration; // Respond with the new generation data
            } catch (saveError) {
                console.error('[POST /api/collections/:id/images - server.js] Error saving new Generation document:', saveError);
                return res.status(400).json({ error: 'Error saving generation data', details: saveError.message });
            }
        } else {
            // Case 3: Insufficient data
            console.error('[POST /api/collections/:id/images - server.js] Error: Insufficient data provided (need generationId or imageUrl+prompt).');
            // Return the specific error the client was seeing before
            return res.status(400).json({ error: 'Generation ID is required' });
        }

        // Add the determined generation ID to the collection if not already present
        if (generationToAddId && !collection.images.some(id => id.equals(generationToAddId))) {
             collection.images.push(generationToAddId);
             console.log(`[POST /api/collections/:id/images - server.js] Added generation ${generationToAddId} to collection ${collection._id}.`);
             // Update collection stats
             collection.stats = {
                 ...collection.stats,
                 imageCount: collection.images.length,
                 lastModified: new Date()
             };
             await collection.save();
             console.log(`[POST /api/collections/:id/images - server.js] Collection ${collection._id} saved successfully.`);
        } else if (generationToAddId) {
             console.log(`[POST /api/collections/:id/images - server.js] Generation ${generationToAddId} already in collection ${collection._id}. Skipping add.`);
        } else {
             // Should not happen if logic above is correct
             console.error('[POST /api/collections/:id/images - server.js] Error: generationToAddId was not determined.');
             return res.status(500).json({ error: 'Internal server error: Failed to determine generation ID.' });
        }

        // Return the added/created generation data
        res.status(201).json(responseData);
    } catch (error) {
        console.error('Error adding image to collection:', error);
        res.status(500).json({ error: error.message || 'Failed to add image to collection' });
    }
});


// Delete collection
app.delete('/api/collections/:id', auth, async (req, res) => {
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

        console.log(`[DELETE Collection] Found collection: ${collection.title}`);

        // Delete the collection
        await Collection.findByIdAndDelete(req.params.id);

        console.log(`[DELETE Collection] Collection ${req.params.id} deleted successfully`);
        res.json({
            message: 'Collection deleted successfully',
            deletedCollection: {
                id: collection._id,
                title: collection.title
            }
        });

    } catch (error) {
        console.error('[DELETE Collection] Error deleting collection:', error);
        res.status(500).json({ error: 'Failed to delete collection', details: error.message });
    }
});

app.delete('/api/collections/:collectionId/images/:imageId', auth, async (req, res) => {
    try {
        const { collectionId, imageId } = req.params;

        const collection = await Collection.findOne({
            _id: collectionId,
            userId: req.userId
        });

        if (!collection) {
            return res.status(404).json({ error: 'Collection not found' });
        }

        // Remove image from collection's images array
        collection.images = collection.images.filter(id => id.toString() !== imageId);

        // Update collection stats
        collection.stats.imageCount = collection.images.length;
        collection.stats.lastModified = new Date();
        await collection.save();

        res.json({ message: 'Image removed from collection' });
    } catch (error) {
        console.error('Error removing image from collection:', error);
        res.status(500).json({ error: 'Failed to remove image from collection' });
    }
});

// User API routes
app.get('/api/auth/user', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        console.log('Fetched user data:', user);
        res.json(user);
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
});

// API route for user profile
app.get('/api/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        res.json(user);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Update profile
app.put('/api/profile', auth, async (req, res) => {
    try {
        const { name, nickname, bio } = req.body;
        const user = await User.findByIdAndUpdate(
            req.userId,
            { $set: { name, nickname, bio } },
            { new: true }
        ).select('-password');

        res.json(user);
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

app.get('/test', (req, res) => {
    res.json({ message: 'Server is running!' });
});

// Serve admin-styles page
app.get('/admin-styles', auth, adminAuth, async (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-styles.html'));
});

// Serve admin-themes page
app.get('/admin-themes', auth, adminAuth, async (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-themes.html'));
});

// Get settings endpoint
app.get('/api/settings', auth, async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings();
            await settings.save();
        }
        res.json(settings);
    } catch (error) {
        console.error('Error getting settings:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update settings
app.put('/api/settings', auth, upload.single('logoFile'), async (req, res) => { // Use upload middleware
    try {
        console.log('Updating settings:', req.body);
        console.log('Uploaded file:', req.file); // Check if file is received

        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings();
        }

        // Update text fields
        if (req.body.appName) settings.appName = req.body.appName;
        if (req.body.mainTitle) settings.mainTitle = req.body.mainTitle;

        // Update useLogoInstead
        settings.useLogoInstead = req.body.useLogoInstead === 'true';
        console.log('Use logo instead:', settings.useLogoInstead);

        // Handle logo upload
        if (req.file && settings.useLogoInstead) {
            console.log('Processing logo upload');
            try {
                const logoUrl = await localStyleStorage.saveImage(
                    req.file.buffer,
                    'logo-' + Date.now() + '-' + req.file.originalname
                );

                // Delete old logo if it exists
                if (settings.logoUrl) {
                    try {
                        await localStyleStorage.deleteImage(settings.logoUrl);
                    } catch (error) {
                        console.error('Error deleting old logo:', error);
                    }
                }

                settings.logoUrl = logoUrl;
                console.log('New logo URL:', logoUrl);
            } catch (error) {
                console.error('Error saving logo:', error);
                return res.status(500).json({ error: 'Failed to save logo' });
            }
        } else if (!settings.useLogoInstead) {
            // If not using logo, clear the logo URL
            // Optionally delete the old logo file if it exists
            if (settings.logoUrl) {
                 try {
                     await localStyleStorage.deleteImage(settings.logoUrl);
                     console.log('Deleted old logo as useLogoInstead is false.');
                 } catch (error) {
                     console.error('Error deleting old logo when switching off:', error);
                 }
            }
            settings.logoUrl = null;
        }

        await settings.save();
        console.log('Settings saved successfully');
        res.json(settings);
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});


// Add generation to collection (This seems redundant with POST /api/collections/:collectionId/images)
// Consider removing if not used elsewhere
app.post('/api/collections/:collectionId/generations', auth, async (req, res) => {
    try {
        const { collectionId } = req.params;
        const { imageUrl, prompt, generationId } = req.body; // Expect generationId

        if (!generationId) {
             return res.status(400).json({ error: 'Generation ID is required' });
        }

        // Find the collection
        const collection = await Collection.findOne({
            _id: collectionId,
            userId: req.userId
        });

        if (!collection) {
            return res.status(404).json({ error: 'Collection not found' });
        }

         // Check if image already exists in collection
        if (collection.images.includes(generationId)) {
             return res.status(400).json({ error: 'Image already in collection' });
        }

        // Add generation ID to collection
        collection.images.push(generationId);
        collection.stats.imageCount = collection.images.length;
        collection.stats.lastModified = new Date();
        await collection.save();

        res.json({ success: true, collection });
    } catch (error) {
        console.error('Error adding generation to collection:', error);
        res.status(500).json({ error: 'Failed to add generation to collection' });
    }
});


// Face to Sticker endpoint
app.post('/api/face-to-sticker', auth, upload.single('image'), async (req, res) => {
    try {
        console.log('Face to sticker request received');
        const { prompt, style } = req.body;
        const imageFile = req.file;

        console.log('Request body:', req.body);
        console.log('Image file:', imageFile);

        // Check if user has enough credits
        const user = await User.findById(req.userId);
        console.log('User before face-to-sticker - ID:', req.userId, 'Credits:', user?.credits);

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        if (user.credits < 1 && user.credits !== 123654) { // Allow if unlimited credits (123654)
            return res.status(403).json({ error: 'Not enough credits' });
        }

        if (!imageFile) {
            return res.status(400).json({ error: 'No image provided' });
        }

        // Combine prompt and style
        const fullPrompt = style ? `${prompt || ''} ${style}`.trim() : (prompt || '');
        console.log('Processing image with prompt:', fullPrompt);

        // Save the uploaded image and get its URL
        let imageUrl;
        try {
            const uploadResult = await storage.uploadBuffer(imageFile.buffer, 'face-upload', req.userId); // Pass userId
            imageUrl = uploadResult.url || uploadResult.publicUrl; // Handle different response formats
            console.log('Image saved successfully:', imageUrl);
        } catch (uploadError) {
            console.error('Error saving image:', uploadError);
            return res.status(500).json({ error: 'Failed to process uploaded image', details: uploadError.message });
        }

        if (!imageUrl) {
            return res.status(500).json({ error: 'Failed to get image URL after upload' });
        }

        console.log('Running face-to-sticker model with image URL:', imageUrl);

        // Run the face-to-sticker model
        if (!modelsConfig || !modelsConfig.models || !modelsConfig.models["face-to-sticker"]) {
             console.error("[Face Sticker] Error: Face to sticker model configuration not found in models.json");
             throw new Error("Face to sticker model configuration missing.");
        }
        const modelConfig = modelsConfig.models["face-to-sticker"];
        const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN }); // Ensure initialized

        const output = await replicate.run(
            modelConfig.run, // Use run property
            {
                input: {
                    ...(modelConfig.defaultInput || {}),
                    image: imageUrl,
                    prompt: fullPrompt
                }
            }
        );

        console.log('Model output:', output);

        if (!output || !Array.isArray(output) || output.length === 0) {
            return res.status(500).json({ error: 'Invalid output from face-to-sticker model' });
        }

        // Save the generated image
        const generatedImageUrl = output[0];
        console.log('Saving generated image:', generatedImageUrl);
        const savedImage = await storage.saveImageFromUrl(generatedImageUrl, 'face-sticker-output', req.userId); // Use different prefix, pass userId

        // Create generation record
        const generation = new Generation({
            userId: req.userId,
            prompt: fullPrompt,
            imageUrl: savedImage.publicUrl,
            originalImage: imageUrl, // Store original uploaded image URL
            status: 'completed',
            type: 'face-to-sticker'
        });

        await generation.save();
        console.log('Generation saved:', generation);

        // Deduct credits if not unlimited
        let updatedCredits = user.credits;
        if (user.credits !== 123654) {
            // Fetch fresh user data to avoid race conditions
            const freshUser = await User.findById(req.userId);
            if (!freshUser) {
                throw new Error('User not found during credit deduction');
            }

            if (freshUser.credits < 1 && freshUser.credits !== 123654) {
                throw new Error('Insufficient credits');
            }

            freshUser.credits -= 1;
            await freshUser.save();
            updatedCredits = freshUser.credits;
            console.log('Credits deducted. New balance:', updatedCredits);

            // Dispatch credit update event through websocket if available
            if (req.app.get('io')) {
                req.app.get('io').to(req.userId).emit('creditsUpdated', { credits: updatedCredits });
            }
        }

        res.json({
            success: true,
            imageUrl: savedImage.publicUrl,
            generationId: generation._id,
            credits: updatedCredits
        });

    } catch (error) {
        console.error('Error in face-to-sticker:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to process image',
            details: error.stack
        });
    }
});

// Upload endpoint for canvas images (Seems duplicate of /api/upload, check usage)
app.post('/api/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        console.log('Uploading canvas image, size:', req.file.size);

        // Save the uploaded file
        const result = await storage.uploadBuffer(req.file.buffer, 'canvas-uploads', req.userId); // Pass userId
        console.log('Upload result:', result);

        // Return a proxy URL instead of direct B2 URL
        const proxyUrl = `/api/b2-proxy/${encodeURIComponent(result.fileName)}`;

        res.json({
            imageUrl: proxyUrl
        });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({
            error: 'Failed to upload image',
            details: error.message
        });
    }
});

// B2 Proxy endpoint to serve B2 content with proper authorization
app.get('/api/b2-proxy/:fileName', async (req, res) => {
    try {
        const fileName = decodeURIComponent(req.params.fileName);
        console.log(`[B2Proxy] Serving file: ${fileName}`);

        // Ensure B2 is authorized
        await storage.ensureAuthorized();
        const authData = storage.getAuthData();

        if (!authData) {
            console.error(`[B2Proxy] No B2 authorization available`);
            return res.status(500).json({ error: 'Storage not accessible' });
        }

        // Construct B2 URL
        const b2Url = `https://f005.backblazeb2.com/file/stickers-replicate-app/${fileName}`;

        // Fetch from B2 with authorization
        const fetch = (await import('node-fetch')).default;
        const b2Response = await fetch(b2Url, {
            headers: {
                'Authorization': authData.authorizationToken
            }
        });

        if (!b2Response.ok) {
            console.error(`[B2Proxy] B2 fetch failed: ${b2Response.status} ${b2Response.statusText}`);
            return res.status(404).json({ error: 'File not found' });
        }

        // Stream the response from B2
        console.log(`[B2Proxy] Successfully fetched from B2, streaming to client`);

        // Set appropriate headers
        res.set('Content-Type', b2Response.headers.get('content-type') || 'image/png');
        res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

        const buffer = await b2Response.buffer();
        res.send(buffer);

    } catch (error) {
        console.error(`[B2Proxy] Error serving file:`, error);
        res.status(500).json({ error: 'Failed to serve file' });
    }
});

// Theme routes
app.get('/api/themes', auth, async (req, res) => {
    try {
        const themes = await Theme.find().sort('order');
        res.json(themes);
    } catch (error) {
        console.error('Error getting themes:', error);
        res.status(500).json({ error: 'Failed to get themes' });
    }
});

app.get('/api/themes/:id', auth, async (req, res) => {
    try {
        const theme = await Theme.findById(req.params.id);
        if (!theme) return res.status(404).json({ error: 'Theme not found' });
        res.json(theme);
    } catch (error) {
        console.error('Error getting theme:', error);
        res.status(500).json({ error: 'Failed to get theme' });
    }
});

app.post('/api/themes', auth, adminAuth, async (req, res) => {
    try {
        const { name, prompt } = req.body;
        const lastTheme = await Theme.findOne().sort('-order');
        const order = lastTheme ? lastTheme.order + 1 : 0;

        const theme = new Theme({ name, prompt, order });
        await theme.save();

        res.json(theme);
    } catch (error) {
        console.error('Error creating theme:', error);
        res.status(500).json({ error: 'Failed to create theme' });
    }
});

app.put('/api/themes/:id', auth, adminAuth, async (req, res) => {
    try {
        const { name, prompt } = req.body;
        const theme = await Theme.findByIdAndUpdate(
            req.params.id,
            { name, prompt },
            { new: true }
        );

        if (!theme) return res.status(404).json({ error: 'Theme not found' });
        res.json(theme);
    } catch (error) {
        console.error('Error updating theme:', error);
        res.status(500).json({ error: 'Failed to update theme' });
    }
});

app.delete('/api/themes/:id', auth, adminAuth, async (req, res) => {
    try {
        const theme = await Theme.findByIdAndDelete(req.params.id);
        if (!theme) return res.status(404).json({ error: 'Theme not found' });

        // Update order of remaining themes
        await Theme.updateMany(
            { order: { $gt: theme.order } },
            { $inc: { order: -1 } }
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting theme:', error);
        res.status(500).json({ error: 'Failed to delete theme' });
    }
});

app.post('/api/themes/reorder', auth, adminAuth, async (req, res) => {
    try {
        const { themeId, direction } = req.body;
        const theme = await Theme.findById(themeId);
        if (!theme) return res.status(404).json({ error: 'Theme not found' });

        const newOrder = direction === 'up' ? theme.order - 1 : theme.order + 1;
        const otherTheme = await Theme.findOne({ order: newOrder });
        if (!otherTheme) return res.status(400).json({ error: 'Cannot move theme' });

        // Swap orders
        theme.order = newOrder;
        otherTheme.order = direction === 'up' ? theme.order + 1 : theme.order - 1;

        await Promise.all([theme.save(), otherTheme.save()]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error reordering themes:', error);
        res.status(500).json({ error: 'Failed to reorder themes' });
    }
});

// Admin credits update endpoint
app.post('/api/admin/credits/update', [auth, adminAuth], async (req, res) => {
    try {
        const { credits } = req.body;
        if (typeof credits !== 'number') {
            return res.status(400).json({ error: 'Credits must be a number' });
        }

        // Only allow admin to update their own credits
        const admin = await User.findById(req.userId); // Use req.userId from auth middleware
        if (!admin || !admin.isAdmin) { // Check isAdmin flag
            return res.status(403).json({ error: 'Not authorized' });
        }

        // Update admin credits
        admin.credits = credits;
        await admin.save();

        res.json({
            message: 'Admin credits updated successfully',
            credits: admin.credits
        });
    } catch (error) {
        console.error('Error updating admin credits:', error);
        res.status(500).json({ error: 'Failed to update admin credits' });
    }
});


// Prompt Templates API Routes
// Temporary bypass auth for testing templates
const tempBypassAuth = (req, res, next) => {
    // Use the actual user ID from the server logs to match existing templates
    req.userId = '675f365a9f4fa90f4b5fcea9'; // Use the actual user ID from the database
    req.user = { _id: '675f365a9f4fa90f4b5fcea9', email: 'test@test.com' };
    next();
};

app.get('/api/templates', tempBypassAuth, async (req, res) => {
    try {
        // Get all templates that are either public or belong to the current user
        const templates = await PromptTemplate.find({
            $or: [
                { isPublic: true },
                { userId: req.userId }
            ]
        }).sort({ updatedAt: -1 });

        res.json(templates);
    } catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
});

app.get('/api/templates/:id', tempBypassAuth, async (req, res) => {
    try {
        console.log('GET /api/templates/:id - Template ID:', req.params.id);
        console.log('GET /api/templates/:id - User ID:', req.userId);

        const template = await PromptTemplate.findById(req.params.id);

        if (!template) {
            console.log('GET /api/templates/:id - Template not found:', req.params.id);
            return res.status(404).json({ error: 'Template not found' });
        }

        console.log('GET /api/templates/:id - Template found, userId:', template.userId, 'isPublic:', template.isPublic);

        // Check if template is accessible by user (public or owned by user)
        if (!template.isPublic && template.userId?.toString() !== req.userId) {
            console.log('GET /api/templates/:id - Access denied - not public and not owned by user');
            return res.status(403).json({ error: 'Not authorized to access this template' });
        }

        console.log('GET /api/templates/:id - Access granted, returning template');
        console.log('GET /api/templates/:id - Template originalPalette:', template.originalPalette);
        res.json(template);
    } catch (error) {
        console.error('Error fetching template:', error);
        res.status(500).json({ error: 'Failed to fetch template' });
    }
});

app.post('/api/templates', tempBypassAuth, async (req, res) => {
    try {
        const { name, category, template, thumbnailUrl, randomOptions, isPublic, originalPalette, recommendedModel } = req.body;
        console.log('DEBUG SERVER POST - recommendedModel received:', recommendedModel);

        const newTemplate = new PromptTemplate({
            name,
            category,
            template,
            thumbnailUrl,
            randomOptions,
            userId: req.userId,
            isPublic: isPublic !== undefined ? isPublic : true,
            originalPalette: originalPalette || '',
            recommendedModel: recommendedModel || ''
        });

        await newTemplate.save();
        res.status(201).json(newTemplate);
    } catch (error) {
        console.error('Error creating template:', error);
        res.status(500).json({ error: 'Failed to create template' });
    }
});

app.put('/api/templates/:id', tempBypassAuth, async (req, res) => {
    try {
        const { name, category, template, thumbnailUrl, randomOptions, isPublic, originalPalette, recommendedModel } = req.body;
        console.log('DEBUG SERVER PUT - recommendedModel received:', recommendedModel);

        console.log('PUT /api/templates/:id - Template ID:', req.params.id);
        console.log('PUT /api/templates/:id - User ID:', req.userId);
        console.log('PUT /api/templates/:id - Request body keys:', Object.keys(req.body));
        if (originalPalette) {
            console.log('PUT /api/templates/:id - originalPalette received:', JSON.stringify(originalPalette));
        } else {
            console.log('PUT /api/templates/:id - originalPalette is empty/null/undefined');
        }

        // Find the template
        const existingTemplate = await PromptTemplate.findById(req.params.id);

        if (!existingTemplate) {
            console.log('PUT /api/templates/:id - Template not found:', req.params.id);
            return res.status(404).json({ error: 'Template not found' });
        }

        console.log('PUT /api/templates/:id - Existing template userId:', existingTemplate.userId);
        console.log('PUT /api/templates/:id - Current user ID:', req.userId);

        // Check if user is authorized to update this template
        // Allow updates if:
        // 1. Template has no userId (legacy templates)
        // 2. Template userId matches current user
        // 3. Template is public and has no specific owner
        const hasUserId = existingTemplate.userId && existingTemplate.userId.toString();
        const currentUserId = req.userId ? req.userId.toString() : null;

        if (hasUserId && hasUserId !== currentUserId) {
            console.log('PUT /api/templates/:id - Authorization failed');
            console.log('PUT /api/templates/:id - Template userId:', hasUserId);
            console.log('PUT /api/templates/:id - Current userId:', currentUserId);
            return res.status(403).json({ error: 'Not authorized to update this template' });
        }

        console.log('PUT /api/templates/:id - Authorization passed, updating template');

        // Update the template
        const updatedTemplate = await PromptTemplate.findByIdAndUpdate(
            req.params.id,
            {
                name,
                category,
                template,
                thumbnailUrl,
                randomOptions,
                isPublic: isPublic !== undefined ? isPublic : existingTemplate.isPublic,
                originalPalette: originalPalette !== undefined ? originalPalette : existingTemplate.originalPalette,
                recommendedModel: recommendedModel !== undefined ? recommendedModel : existingTemplate.recommendedModel,
                updatedAt: Date.now()
            },
            { new: true }
        );

        console.log('PUT /api/templates/:id - Template updated successfully');
        res.json(updatedTemplate);
    } catch (error) {
        console.error('Error updating template:', error);
        res.status(500).json({ error: 'Failed to update template' });
    }
});

app.delete('/api/templates/:id', tempBypassAuth, async (req, res) => {
    try {
        console.log('DELETE /api/templates/:id - Template ID:', req.params.id);
        console.log('DELETE /api/templates/:id - User ID:', req.userId);

        // Find the template
        const template = await PromptTemplate.findById(req.params.id);

        if (!template) {
            console.log('DELETE /api/templates/:id - Template not found:', req.params.id);
            return res.status(404).json({ error: 'Template not found' });
        }

        console.log('DELETE /api/templates/:id - Template userId:', template.userId);

        // Check if user is authorized to delete this template
        // Allow deletion if:
        // 1. Template has no userId (legacy templates)
        // 2. Template userId matches current user
        const hasUserId = template.userId && template.userId.toString();
        const currentUserId = req.userId ? req.userId.toString() : null;

        if (hasUserId && hasUserId !== currentUserId) {
            console.log('DELETE /api/templates/:id - Authorization failed');
            return res.status(403).json({ error: 'Not authorized to delete this template' });
        }

        console.log('DELETE /api/templates/:id - Authorization passed, deleting template');

        // Delete the template
        await PromptTemplate.findByIdAndDelete(req.params.id);

        console.log('DELETE /api/templates/:id - Template deleted successfully');
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting template:', error);
        res.status(500).json({ error: 'Failed to delete template' });
    }
});

// For clients that don't support DELETE method
app.post('/api/templates/:id/delete', auth, async (req, res) => {
    try {
        console.log('POST /api/templates/:id/delete - Template ID:', req.params.id);
        console.log('POST /api/templates/:id/delete - User ID:', req.userId);

        // Find the template
        const template = await PromptTemplate.findById(req.params.id);

        if (!template) {
            console.log('POST /api/templates/:id/delete - Template not found:', req.params.id);
            return res.status(404).json({ error: 'Template not found' });
        }

        console.log('POST /api/templates/:id/delete - Template userId:', template.userId);

        // Check if user is authorized to delete this template
        // Allow deletion if:
        // 1. Template has no userId (legacy templates)
        // 2. Template userId matches current user
        const hasUserId = template.userId && template.userId.toString();
        const currentUserId = req.userId ? req.userId.toString() : null;

        if (hasUserId && hasUserId !== currentUserId) {
            console.log('POST /api/templates/:id/delete - Authorization failed');
            return res.status(403).json({ error: 'Not authorized to delete this template' });
        }

        console.log('POST /api/templates/:id/delete - Authorization passed, deleting template');

        // Delete the template
        await PromptTemplate.findByIdAndDelete(req.params.id);

        console.log('POST /api/templates/:id/delete - Template deleted successfully');
        res.status(200).json({ message: 'Template deleted successfully' });
    } catch (error) {
        console.error('Error deleting template:', error);
        res.status(500).json({ error: 'Failed to delete template' });
    }
});

// Serve prompt-templates page
app.get('/prompt-templates', auth, async (req, res) => {
    console.log('Serving prompt-templates page for user:', req.userId);
    res.sendFile(path.join(__dirname, 'public', 'prompt-templates.html'));
});


// --- Image Proxy Route ---
app.get('/api/image-proxy', async (req, res) => {
    const { fileName } = req.query;
    console.log(`[Proxy] Received request for fileName: ${fileName}`);

    if (!fileName) {
        console.error('[Proxy] Error: Missing fileName query parameter');
        return res.status(400).json({ error: 'Missing fileName query parameter' });
    }

    try {
        console.log('[Proxy] Ensuring B2 authorization...');
        const authData = await storage.ensureAuthorized();

        if (!authData) {
             console.error('[Proxy] Error: ensureAuthorized returned null or undefined.');
             throw new Error('B2 authorization failed: No auth data returned.');
        }
        if (!authData.downloadUrl) {
             console.error('[Proxy] Error: authData is missing downloadUrl.', authData);
             throw new Error('B2 authorization failed: Missing downloadUrl.');
        }
         if (!authData.authorizationToken) {
             console.error('[Proxy] Error: authData is missing authorizationToken.', authData);
             throw new Error('B2 authorization failed: Missing authorizationToken.');
        }
        console.log('[Proxy] B2 authorization successful.');

        const bucketName = process.env.B2_BUCKET_NAME || 'stickers-replicate-app';
        const decodedFileName = decodeURIComponent(fileName);
        const downloadUrl = `${authData.downloadUrl}/file/${bucketName}/${encodeURIComponent(decodedFileName)}`;

        console.log(`[Proxy] Proxying image request for decoded filename: ${decodedFileName}`);
        console.log(`[Proxy] Fetching from B2 URL: ${downloadUrl}`);

        const b2Response = await fetch(downloadUrl, {
            headers: {
                'Authorization': authData.authorizationToken
            }
        });

        console.log(`[Proxy] B2 response status: ${b2Response.status}`);

        if (!b2Response.ok) {
            const errorText = await b2Response.text();
            console.error(`[Proxy] B2 download failed (${b2Response.status}): ${errorText}`);
            return res.status(b2Response.status).json({
                error: `Failed to fetch image from B2: ${b2Response.statusText}`,
                b2Error: errorText
            });
        }

        res.setHeader('Content-Type', b2Response.headers.get('Content-Type') || 'application/octet-stream');
        res.setHeader('Content-Length', b2Response.headers.get('Content-Length') || 0);

        console.log('[Proxy] Piping B2 response to client.');
        b2Response.body.pipe(res);

    } catch (error) {
        console.error('[Proxy] Error in image proxy catch block:', error);
        res.status(500).json({ error: 'Failed to proxy image', details: error.message });
    }
});
// --- End Image Proxy Route ---


// Catch-all route to handle client-side routing
app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }

    // Check authentication for protected routes
    const token = req.cookies.token;
    if (!token && (req.path === '/' || req.path.startsWith('/collection/') || req.path === '/collections')) {
        return res.redirect('/login');
    }

    // Serve index.html for all other routes
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

export { app };

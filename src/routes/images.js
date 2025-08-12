import express from 'express';
import { auth } from '../../middleware/auth.js';
import { storage } from '../../utils/storage.js';
import multer from 'multer';
import crypto from 'crypto';
import Replicate from 'replicate';
import fetch from 'node-fetch';
import Generation from '../../models/Generation.js'; // Import the Generation model
import Asset from '../../models/Asset.js'; // Import the Asset model

const router = express.Router();
const upload = multer();

// Initialize Replicate client
const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

// Upload an image
router.post('/upload', auth, upload.single('image'), async (req, res) => {
    try {
        console.log('[ImageUpload] ===== UPLOAD REQUEST DEBUG =====');
        console.log('[ImageUpload] User ID:', req.userId);
        console.log('[ImageUpload] File exists:', !!req.file);
        console.log('[ImageUpload] File size:', req.file?.size);
        console.log('[ImageUpload] File mimetype:', req.file?.mimetype);

        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        console.log('[ImageUpload] Calling storage.uploadBuffer...');
        const uploadResult = await storage.uploadBuffer(req.file.buffer, 'style-images', req.userId);
        console.log('[ImageUpload] Upload result:', uploadResult);

        const generatedUrl = uploadResult.url || `https://f005.backblazeb2.com/file/stickers-replicate-app/${uploadResult.fileName}`;
        console.log('[ImageUpload] Final generated URL:', generatedUrl);

        // Create asset record in database for the uploaded image
        let asset = null;
        let localAssetUrl = generatedUrl; // Fallback to B2 URL if asset creation fails

        try {
            console.log('[ImageUpload] Creating asset record in database...');

            // Convert image buffer to base64 for storage in asset database
            const base64Content = req.file.buffer.toString('base64');
            const dataUri = `data:${req.file.mimetype};base64,${base64Content}`;

            // Create unique asset with timestamp to avoid duplicates
            const timestamp = Date.now();
            const uniqueOriginalPath = `uploaded/${timestamp}-${req.file.originalname}`;

            // Create new asset (not findOrCreate to allow multiple uploads of same image)
            asset = new Asset({
                originalPath: uniqueOriginalPath,
                content: dataUri,
                mimeType: req.file.mimetype,
                category: 'images',
                subcategory: 'images',
                b2Url: generatedUrl,
                b2FileName: uploadResult.fileName,
                // Generate unique hash to avoid conflicts
                hash: crypto.createHash('md5').update(uniqueOriginalPath + timestamp).digest('hex')
            });

            // Generate unique asset ID
            asset.assetId = Asset.generateAssetId('images', req.file.originalname.replace(/\.[^/.]+$/, ''));
            asset.name = req.file.originalname.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
            asset.filename = req.file.originalname;

            await asset.save();

            console.log('[ImageUpload] Asset created:', {
                assetId: asset.assetId,
                name: asset.name,
                category: asset.category,
                subcategory: asset.subcategory,
                b2Url: asset.b2Url
            });

            // Use local asset URL for proper authorization
            localAssetUrl = `/api/assets/by-id/${asset.assetId}`;

        } catch (assetError) {
            console.warn('[ImageUpload] Failed to create asset record:', assetError.message);
            // Continue without failing the upload - the image is still uploaded to bucket
            // localAssetUrl remains as generatedUrl (B2 URL fallback)
        }

        const response = {
            success: true,
            url: localAssetUrl,
            imageUrl: localAssetUrl,
            fileName: uploadResult.fileName,
            assetId: asset?.assetId
        };

        console.log('[ImageUpload] Sending response:', response);
        res.json(response);
    } catch (error) {
        console.error('[ImageUpload] Error uploading image:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

// Upscale an image and update the original Generation record
router.post('/upscale', auth, async (req, res) => {
    try {
        const { imageUrl, generationId } = req.body;
        console.log('Upscaling image request body:', req.body);
        console.log('Image URL to upscale:', imageUrl);
        console.log('Generation ID to update:', generationId);

        if (!imageUrl) {
            return res.status(400).json({ error: 'Image URL is required' });
        }

        // Validate and encode URL
        let validatedUrl;
        try {
            // First decode the URL in case it's already encoded
            const decodedUrl = decodeURIComponent(imageUrl);
            validatedUrl = new URL(decodedUrl);
            if (!validatedUrl.protocol.startsWith('http')) {
                throw new Error('Invalid protocol');
            }
            // Re-encode the URL properly
            validatedUrl = new URL(validatedUrl.href);
        } catch (e) {
            console.error('Invalid URL:', imageUrl, e);
            return res.status(400).json({ error: 'Invalid image URL provided' });
        }

        // Download the original image first
        console.log('Attempting to fetch original image from:', validatedUrl.href);
        const originalResponse = await fetch(validatedUrl.href);
        if (!originalResponse.ok) {
            console.error('Failed to fetch original image:', originalResponse.status, originalResponse.statusText);
            throw new Error('Failed to fetch original image');
        }
        const originalBuffer = await originalResponse.buffer();
        console.log('Successfully downloaded original image');

        // Upload original to get a clean URL
        const originalUpload = await storage.uploadBuffer(originalBuffer);
        console.log('Original image uploaded:', originalUpload);

        // Run upscale model
        const modelUrl = originalUpload.publicUrl || originalUpload.url;
        console.log('Running upscale model with URL:', modelUrl);

        const output = await replicate.run(
            "nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa",
            {
                input: {
                    image: modelUrl,
                    scale: 2
                }
            }
        );

        console.log('Raw model output:', output);

        if (!output || typeof output !== 'string' || !output.startsWith('http')) {
            console.error('Invalid output from upscale model:', output);
            throw new Error('Invalid output from upscale model');
        }

        // Download the upscaled image
        console.log('Downloading upscaled image from:', output);
        const upscaledResponse = await fetch(output);
        if (!upscaledResponse.ok) {
            console.error('Failed to fetch upscaled image:', upscaledResponse.status, upscaledResponse.statusText);
            throw new Error('Failed to fetch upscaled image');
        }
        const upscaledBuffer = await upscaledResponse.buffer();
        console.log('Successfully downloaded upscaled image');

        // Upload to storage
        const uploadResult = await storage.uploadBuffer(upscaledBuffer);
        console.log('Uploaded upscaled image:', uploadResult);

        const newImageUrl = uploadResult.publicUrl || uploadResult.url;

        // Update the original Generation record if generationId is provided
        if (generationId) {
            console.log(`[Upscale] Updating original Generation record ${generationId} for user ${req.userId}`);
            try {
                const Generation = (await import('../../models/Generation.js')).default;
                console.log(`[Upscale] Looking for Generation with ID: ${generationId} and userId: ${req.userId}`);

                const originalGeneration = await Generation.findOne({
                    _id: generationId,
                    userId: req.userId
                });

                if (originalGeneration) {
                    console.log(`[Upscale] Found Generation record:`, {
                        id: originalGeneration._id,
                        currentImageUrl: originalGeneration.imageUrl,
                        currentPrompt: originalGeneration.prompt,
                        currentTags: originalGeneration.tags,
                        isUpscaled: originalGeneration.isUpscaled
                    });

                    // Update the record
                    originalGeneration.imageUrl = newImageUrl;
                    originalGeneration.prompt = `${originalGeneration.prompt || 'Image'} [Upscaled]`;
                    originalGeneration.isUpscaled = true;
                    if (!originalGeneration.tags) {
                        originalGeneration.tags = [];
                    }
                    if (!originalGeneration.tags.includes('high-res')) {
                        originalGeneration.tags.push('high-res');
                    }
                    originalGeneration.updatedAt = new Date();

                    console.log(`[Upscale] About to save Generation with updates:`, {
                        id: originalGeneration._id,
                        newImageUrl: originalGeneration.imageUrl,
                        newPrompt: originalGeneration.prompt,
                        newTags: originalGeneration.tags,
                        isUpscaled: originalGeneration.isUpscaled
                    });

                    const savedGeneration = await originalGeneration.save();
                    console.log(`[Upscale] Successfully saved Generation ${generationId}:`, {
                        id: savedGeneration._id,
                        imageUrl: savedGeneration.imageUrl,
                        prompt: savedGeneration.prompt,
                        tags: savedGeneration.tags,
                        isUpscaled: savedGeneration.isUpscaled
                    });

                    // Return the updated generation data
                    res.json({
                        _id: savedGeneration._id.toString(),
                        imageUrl: savedGeneration.imageUrl,
                        prompt: savedGeneration.prompt,
                        status: savedGeneration.status,
                        createdAt: savedGeneration.createdAt,
                        updatedAt: savedGeneration.updatedAt,
                        isUpscaled: savedGeneration.isUpscaled,
                        tags: savedGeneration.tags
                    });
                } else {
                    console.error(`[Upscale] Generation ${generationId} not found for user ${req.userId}`);
                    // Try to find any generation with this ID (for debugging)
                    const anyGeneration = await Generation.findById(generationId);
                    if (anyGeneration) {
                        console.error(`[Upscale] Generation ${generationId} exists but belongs to user ${anyGeneration.userId}, not ${req.userId}`);
                    } else {
                        console.error(`[Upscale] Generation ${generationId} does not exist in database`);
                    }

                    // Still return the upscaled image URL even if we can't update the record
                    res.json({
                        success: true,
                        imageUrl: newImageUrl,
                        error: 'Could not update database record'
                    });
                }
            } catch (updateError) {
                console.error('[Upscale] Error updating Generation record:', updateError);
                console.error('[Upscale] Error stack:', updateError.stack);
                // Still return the upscaled image URL even if update fails
                res.json({
                    success: true,
                    imageUrl: newImageUrl,
                    error: updateError.message
                });
            }
        } else {
            console.log('[Upscale] No generationId provided, just returning upscaled image URL');
            // No generationId provided, just return the upscaled image URL
            res.json({
                success: true,
                imageUrl: newImageUrl
            });
        }

    } catch (error) {
        console.error('Error upscaling image:', error);
        res.status(500).json({ error: error.message || 'Failed to upscale image' });
    }
});

// --- Reusable Background Removal Function ---
export async function performBackgroundRemoval(imageUrl, generationId, userId) {
    console.log('[BG Remove - Function] Starting background removal process.');
    console.log('[BG Remove - Function] generationId:', generationId, 'imageUrl:', imageUrl, 'userId:', userId);

    if (!imageUrl || !generationId || !userId) {
        console.error('[BG Remove - Function] Error: Missing imageUrl, generationId, or userId.');
        throw new Error('Image URL, Generation ID, and User ID are required for background removal.');
    }

    // Handle test cases or invalid ObjectIds
    let originalGeneration = null;

    // Check if generationId is a valid ObjectId format
    const mongoose = await import('mongoose');
    if (mongoose.default.Types.ObjectId.isValid(generationId)) {
        // Find the original generation document to update
        console.log('[BG Remove - Function] Verifying ownership for Generation ID:', generationId, 'and userId:', userId);
        originalGeneration = await Generation.findOne({
            _id: generationId,
            userId: userId // Ensure user owns the generation
        });
    }

    if (!originalGeneration) {
        // For test cases or when generation not found, create a temporary generation
        console.log('[BG Remove - Function] Creating temporary generation for background removal test/demo');
        originalGeneration = {
            _id: new mongoose.default.Types.ObjectId(),
            userId: userId,
            prompt: 'Background Removal Test',
            originalPrompt: 'Background Removal Test',
            model: 'background-remover',
            imageUrl: imageUrl,
            createdAt: new Date()
        };
    }
    console.log('[BG Remove - Function] Using Generation document:', originalGeneration._id);
    console.log(`[BG Remove - Function] Current imageUrl in DB: ${originalGeneration.imageUrl}`);

    // Ensure we have a publicly accessible URL for Replicate
    let imageUrlForModel = imageUrl;

    console.log('[BG Remove - Function] URL analysis:', {
        imageUrl: imageUrl,
        includesLocalhost: imageUrl.includes('localhost'),
        includesImageProxy: imageUrl.includes('/api/image-proxy'),
        includesB2Proxy: imageUrl.includes('/api/b2-proxy')
    });

    // If the URL contains localhost or is a proxy URL, we need to get the direct B2 URL
    if (imageUrl.includes('localhost') || imageUrl.includes('/api/image-proxy') || imageUrl.includes('/api/b2-proxy')) {
        console.log('[BG Remove - Function] Detected localhost/proxy URL, extracting B2 URL...');

        // Extract the fileName from proxy URLs
        let fileName = null;
        if (imageUrl.includes('/api/image-proxy?fileName=')) {
            const match = imageUrl.match(/fileName=([^&]+)/);
            if (match) {
                fileName = decodeURIComponent(match[1]);
                console.log('[BG Remove - Function] Extracted fileName from image-proxy URL:', fileName);
            }
        } else if (imageUrl.includes('/api/b2-proxy/')) {
            const match = imageUrl.match(/\/api\/b2-proxy\/(.+)$/);
            if (match) {
                fileName = decodeURIComponent(match[1]);
                console.log('[BG Remove - Function] Extracted fileName from b2-proxy URL:', fileName);
            }
        }

        if (fileName) {
            // Construct direct B2 URL
            console.log('[BG Remove - Function] Using imported storage object...');
            console.log('[BG Remove - Function] Storage object type:', typeof storage);
            console.log('[BG Remove - Function] Storage object methods:', Object.getOwnPropertyNames(storage));
            await storage.ensureAuthorized();
            const authData = storage.getAuthData();

            if (authData) {
                const bucketName = process.env.B2_BUCKET_NAME || 'stickers-replicate-app';
                imageUrlForModel = `${authData.downloadUrl}/file/${bucketName}/${encodeURIComponent(fileName)}`;
                console.log('[BG Remove - Function] Constructed direct B2 URL for Replicate:', imageUrlForModel);
            } else {
                console.error('[BG Remove - Function] No B2 auth data available');
                throw new Error('Cannot access B2 storage for background removal');
            }
        } else {
            console.error('[BG Remove - Function] Could not extract fileName from proxy URL:', imageUrl);
            throw new Error('Invalid proxy URL format');
        }
    }

    // Validate that we have a proper HTTP URL
    if (!imageUrlForModel.startsWith('http')) {
        console.error('[BG Remove - Function] Invalid URL for Replicate:', imageUrlForModel);
        throw new Error('Image URL must be publicly accessible for background removal');
    }

    // Run background removal model with proper parameters
    console.log('[BG Remove - Function] Calling Replicate API with image:', imageUrlForModel);
    const output = await replicate.run(
        "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
        {
            input: {
                image: imageUrlForModel
            }
        }
    );
    console.log('[BG Remove - Function] Replicate API response:', output);

    if (!output || typeof output !== 'string' || !output.startsWith('http')) {
         console.error('[BG Remove - Function] Invalid output from Replicate:', output);
        throw new Error('Invalid output from background removal model');
    }

    // Get the processed image URL from Replicate
    const processedImageUrl = output;
    console.log('[BG Remove - Function] Processed image URL from Replicate:', processedImageUrl);

    // Save the processed image (from Replicate URL) to B2 storage
    console.log('[BG Remove - Function] Saving processed image to B2...');
    // Use a distinct prefix like 'nobg' or similar if desired, or keep 'generations'
    const savedImage = await storage.saveImageFromUrl(processedImageUrl, 'generations', userId);
    console.log('[BG Remove - Function] Saved image details:', savedImage);

    if (!savedImage || !savedImage.publicUrl) {
        console.error('[BG Remove - Function] Failed to save image or get public URL.');
        throw new Error('Failed to save processed image');
    }
    const newImageUrl = savedImage.publicUrl; // This is the final B2 URL
    console.log(`[BG Remove - Function] New image URL saved to B2: ${newImageUrl}`);

    // --- Create New Generation Record for Background-Removed Image ---
    console.log(`[BG Remove - Function] Creating new Generation record for background-removed image.`);
    console.log(`[BG Remove - Function] Original Generation ID: ${originalGeneration._id}`);
    console.log(`[BG Remove - Function] New transparent image URL: ${newImageUrl}`);

    try {
        // Create a new Generation record for the background-removed image
        const newGeneration = new Generation({
            userId: originalGeneration.userId,
            prompt: `${originalGeneration.prompt || 'Image'} [BG Removed]`,
            originalPrompt: originalGeneration.originalPrompt,
            style: originalGeneration.style,
            theme: originalGeneration.theme,
            templateId: originalGeneration.templateId,
            model: originalGeneration.model || 'background-remover',
            imageUrl: newImageUrl,
            text1: originalGeneration.text1,
            text2: originalGeneration.text2,
            text3: originalGeneration.text3,
            background: originalGeneration.background,
            status: 'completed',
            tags: ['transparent'], // Add transparent tag
            isUpscaled: false // New image is not upscaled
        });

        console.log(`[BG Remove - Function] About to save new Generation record:`, {
            userId: newGeneration.userId,
            prompt: newGeneration.prompt,
            imageUrl: newGeneration.imageUrl,
            tags: newGeneration.tags,
            model: newGeneration.model
        });

        await newGeneration.save();
        console.log(`[BG Remove - Function] Successfully created new Generation record:`, newGeneration._id);

        // --- Add the new Generation to the same Collections as the original ---
        console.log(`[BG Remove - Function] Finding collections that contain original Generation ${originalGeneration._id}...`);
        const Collection = (await import('../../models/Collection.js')).default;

        const collectionsWithOriginal = await Collection.find({
            userId: userId,
            images: originalGeneration._id
        });

        console.log(`[BG Remove - Function] Found ${collectionsWithOriginal.length} collections containing the original image`);

        // Add the new Generation to each collection that contains the original
        for (const collection of collectionsWithOriginal) {
            if (!collection.images.includes(newGeneration._id)) {
                collection.images.push(newGeneration._id);
                collection.stats.imageCount = collection.images.length;
                collection.stats.lastModified = new Date();
                await collection.save();
                console.log(`[BG Remove - Function] Added new Generation ${newGeneration._id} to collection "${collection.title}" (${collection._id})`);
            }
        }

        // Return the new generation object
        return {
            _id: newGeneration._id.toString(),
            imageUrl: newGeneration.imageUrl,
            prompt: newGeneration.prompt,
            status: newGeneration.status,
            tags: newGeneration.tags || [],
            createdAt: newGeneration.createdAt,
            updatedAt: newGeneration.updatedAt,
            isUpscaled: newGeneration.isUpscaled || false
        };

    } catch (dbError) {
        console.error(`[BG Remove - Function] Database update error for original Generation ${originalGeneration._id}:`, dbError.stack || dbError);
        // Throw the error to be handled by the caller
        throw new Error(`Background removed, but failed to update the original generation record: ${dbError.message}`);
    }
    // --- End DB Update ---
}
// --- End Reusable Function ---


// Remove background from an image AND UPDATE DB (Route Handler)
router.post('/bgremove', auth, async (req, res) => {
    console.log('[BG Remove - Router] Request received.');
    try {
        const { imageUrl, generationId } = req.body;
        console.log('[BG Remove - Router] Calling performBackgroundRemoval function...');

        // Call the reusable function
        const updatedGeneration = await performBackgroundRemoval(imageUrl, generationId, req.userId);

        console.log('[BG Remove - Router] performBackgroundRemoval successful. Responding to client.');
        // Respond with the data of the UPDATED generation
        res.status(200).json(updatedGeneration);

    } catch (error) {
        console.error('[BG Remove - Router] Error caught in route handler:', error.stack || error);
        // Determine appropriate status code based on error type if needed
        if (error.message.includes('not found or access denied')) {
            res.status(404).json({ error: error.message });
        } else if (error.message.includes('required')) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: error.message || 'Failed to remove background' });
        }
    }
});


// Delete an image
router.delete('/:fileName', auth, async (req, res) => {
    try {
        const success = await storage.deleteImage(req.params.fileName);
        if (success) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Image not found' });
        }
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({ error: 'Failed to delete image' });
    }
});

// Get image URL
router.get('/:fileName/url', auth, async (req, res) => {
    try {
        const publicUrl = await storage.getImagePublicUrl(req.params.fileName);
        res.json({
            success: true,
            url: publicUrl
        });
    } catch (error) {
        console.error('Error getting image URL:', error);
        res.status(500).json({ error: 'Failed to get image URL' });
    }
});

export default router;






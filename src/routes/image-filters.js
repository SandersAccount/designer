import express from 'express';
import sharp from 'sharp';
import fetch from 'node-fetch';
import { storage } from '../../utils/storage.js';
import { auth } from '../../middleware/auth.js';

const router = express.Router();

// Apply CSS filters to an image
router.post('/apply-image-filters', auth, async (req, res) => {
    console.log('[ImageFilters] 🎨 Apply filters request received');
    console.log('[ImageFilters] 🎨 Request body:', JSON.stringify(req.body, null, 2));
    
    try {
        const { imageUrl, filters } = req.body;
        
        if (!imageUrl || !filters) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing imageUrl or filters' 
            });
        }

        console.log('[ImageFilters] 🎨 Processing filters for:', imageUrl);
        console.log('[ImageFilters] 🎨 Filters:', filters);

        // Handle different image sources (base64 data URLs vs HTTP URLs)
        let imageBuffer;
        if (imageUrl.startsWith('data:image/')) {
            // Handle base64 data URL
            console.log('[ImageFilters] 🎨 Processing base64 image');
            imageBuffer = await processBase64Image(imageUrl);
        } else {
            // Handle HTTP URL with B2 authorization
            console.log('[ImageFilters] 🎨 Processing HTTP image with B2 auth');
            imageBuffer = await downloadImageWithAuth(imageUrl);
        }
        
        // Apply filters using Sharp
        const filteredBuffer = await applyFiltersWithSharp(imageBuffer, filters);
        
        // Upload the filtered image back to B2
        const uploadResult = await storage.uploadBuffer(
            filteredBuffer, 
            'filtered-images', 
            req.userId
        );

        console.log('[ImageFilters] 🎨 Filtered image uploaded:', uploadResult.url);

        res.json({
            success: true,
            filteredImageUrl: uploadResult.url,
            originalImageUrl: imageUrl,
            appliedFilters: filters
        });

    } catch (error) {
        console.error('[ImageFilters] ❌ Error applying filters:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to apply image filters: ' + error.message 
        });
    }
});

// Function to process base64 data URL
async function processBase64Image(dataUrl) {
    console.log('[ImageFilters] 📥 Processing base64 image...');

    try {
        // Extract the base64 data from the data URL
        const base64Data = dataUrl.split(',')[1];
        if (!base64Data) {
            throw new Error('Invalid base64 data URL format');
        }

        // Convert base64 to buffer
        const buffer = Buffer.from(base64Data, 'base64');
        console.log('[ImageFilters] 📥 Base64 image processed, size:', buffer.length);

        return buffer;
    } catch (error) {
        console.error('[ImageFilters] ❌ Base64 processing error:', error);
        throw error;
    }
}

// Function to download image with B2 authorization
async function downloadImageWithAuth(imageUrl) {
    console.log('[ImageFilters] 📥 Downloading image with auth:', imageUrl);
    
    try {
        // Ensure B2 authorization
        await storage.ensureAuthorized();
        const authData = storage.getAuthData();

        if (!authData || !authData.authorizationToken) {
            throw new Error('Failed to get B2 authorization token');
        }

        // Download image with authorization header
        const response = await fetch(imageUrl, {
            headers: {
                'Authorization': authData.authorizationToken
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
        }

        const buffer = await response.buffer();
        console.log('[ImageFilters] 📥 Image downloaded, size:', buffer.length);
        
        return buffer;
    } catch (error) {
        console.error('[ImageFilters] ❌ Download error:', error);
        throw error;
    }
}

// Function to apply filters using Sharp
async function applyFiltersWithSharp(imageBuffer, filters) {
    console.log('[ImageFilters] 🔧 Applying filters with Sharp...');
    
    try {
        let sharpImage = sharp(imageBuffer);

        // Apply blur filter
        if (filters.blur && filters.blur > 0) {
            console.log('[ImageFilters] 🔧 Applying blur:', filters.blur);
            sharpImage = sharpImage.blur(filters.blur);
        }

        // Apply brightness, contrast, saturation using modulate
        const modulate = {};
        let needsModulate = false;

        if (filters.brightness && filters.brightness !== 1) {
            modulate.brightness = filters.brightness;
            needsModulate = true;
            console.log('[ImageFilters] 🔧 Applying brightness:', filters.brightness);
        }

        if (filters.saturate && filters.saturate !== 1) {
            modulate.saturation = filters.saturate;
            needsModulate = true;
            console.log('[ImageFilters] 🔧 Applying saturation:', filters.saturate);
        }

        if (needsModulate) {
            sharpImage = sharpImage.modulate(modulate);
        }

        // Apply grayscale
        if (filters.grayscale && filters.grayscale > 0) {
            console.log('[ImageFilters] 🔧 Applying grayscale:', filters.grayscale);
            if (filters.grayscale >= 1) {
                sharpImage = sharpImage.grayscale();
            } else {
                // Partial grayscale - blend with original
                const grayscaleBuffer = await sharp(imageBuffer).grayscale().toBuffer();
                sharpImage = sharpImage.composite([{
                    input: grayscaleBuffer,
                    blend: 'overlay',
                    opacity: Math.round(filters.grayscale * 100)
                }]);
            }
        }

        // Apply sepia (using tint)
        if (filters.sepia && filters.sepia > 0) {
            console.log('[ImageFilters] 🔧 Applying sepia:', filters.sepia);
            // Sepia effect using tint
            sharpImage = sharpImage.tint({ r: 255, g: 240, b: 196 });
        }

        // Apply contrast (using linear adjustment)
        if (filters.contrast && filters.contrast !== 1) {
            console.log('[ImageFilters] 🔧 Applying contrast:', filters.contrast);
            sharpImage = sharpImage.linear(filters.contrast, -(128 * filters.contrast) + 128);
        }

        // Apply hue rotation (using recomb matrix)
        if (filters.hueRotate && filters.hueRotate > 0) {
            console.log('[ImageFilters] 🔧 Applying hue rotation:', filters.hueRotate);
            // Simplified hue rotation using color matrix
            const angle = filters.hueRotate * Math.PI / 180;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            
            sharpImage = sharpImage.recomb([
                [cos + (1 - cos) / 3, (1 - cos) / 3 - sin / Math.sqrt(3), (1 - cos) / 3 + sin / Math.sqrt(3)],
                [(1 - cos) / 3 + sin / Math.sqrt(3), cos + (1 - cos) / 3, (1 - cos) / 3 - sin / Math.sqrt(3)],
                [(1 - cos) / 3 - sin / Math.sqrt(3), (1 - cos) / 3 + sin / Math.sqrt(3), cos + (1 - cos) / 3]
            ]);
        }

        // Apply invert
        if (filters.invert && filters.invert > 0) {
            console.log('[ImageFilters] 🔧 Applying invert:', filters.invert);
            if (filters.invert >= 1) {
                sharpImage = sharpImage.negate();
            } else {
                // Partial invert - blend with inverted version
                const invertedBuffer = await sharp(imageBuffer).negate().toBuffer();
                sharpImage = sharpImage.composite([{
                    input: invertedBuffer,
                    blend: 'overlay',
                    opacity: Math.round(filters.invert * 100)
                }]);
            }
        }

        // Convert to buffer
        const filteredBuffer = await sharpImage.png().toBuffer();
        console.log('[ImageFilters] 🔧 Filters applied, output size:', filteredBuffer.length);
        
        return filteredBuffer;
    } catch (error) {
        console.error('[ImageFilters] ❌ Sharp processing error:', error);
        throw error;
    }
}

export default router;






import express from 'express';
import Replicate from 'replicate';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Import JSON file using fs.readFileSync for compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const inpaintingModels = JSON.parse(
    await fs.readFile(path.join(__dirname, '../../config/inpaintingModels.json'), 'utf8')
);
import { storage } from '../../utils/storage.js';
import sharp from 'sharp';

const router = express.Router();
const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

// Helper function to save base64 as file and return URL
async function saveBase64AsFile(base64Data, filename) {
    // Only process if it's base64 data
    if (!base64Data.startsWith('data:')) {
        return {
            base64: '',
            filepath: '',
            filename: '',
            buffer: null
        };
    }
    
    // Remove data URL prefix if present
    const base64Image = base64Data.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
    const imageBuffer = Buffer.from(base64Image, 'base64');
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });
    
    // Generate unique filename if not provided
    const finalFilename = filename || `temp-${Date.now()}.png`;
    const filepath = path.join(uploadsDir, finalFilename);
    
    // Save file
    await fs.writeFile(filepath, imageBuffer);
    
    return {
        filepath,
        filename: finalFilename,
        buffer: imageBuffer,
        base64: base64Image
    };
}

// Helper function to download image and save locally
async function downloadImage(url) {
    const filename = `inpaint-result-${Date.now()}.png`;
    const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
    const filepath = path.join(uploadsDir, filename);

    // Create uploads directory if it doesn't exist
    await fs.mkdir(uploadsDir, { recursive: true });

    try {
        // Download using node-fetch
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
        }
        
        // Get array buffer and convert to Buffer
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Save the file
        await fs.writeFile(filepath, buffer);
        
        return filepath;
    } catch (error) {
        console.error('Error downloading image:', error);
        throw error;
    }
}

// Helper function to get image dimensions from base64 or URL
async function getImageDimensions(imageData) {
    let imageBuffer;
    
    if (imageData.startsWith('data:')) {
        // Handle base64 data
        const base64Image = imageData.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
        imageBuffer = Buffer.from(base64Image, 'base64');
    } else {
        // Handle URL
        const response = await fetch(imageData);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
    }
    
    // Get image metadata using sharp
    const metadata = await sharp(imageBuffer).metadata();
    return {
        width: metadata.width,
        height: metadata.height
    };
}

// Function to validate image dimensions and adjust if needed
function validateAndAdjustDimensions(dimensions, modelId) {
    const MAX_DIMENSION = 2048; // Maximum dimension supported by most models
    const MIN_DIMENSION = 64;   // Minimum dimension required for quality results
    
    // Clone the dimensions to avoid modifying the original
    const adjustedDimensions = { ...dimensions };
    
    // Check if dimensions are within acceptable range
    if (dimensions.width > MAX_DIMENSION || dimensions.height > MAX_DIMENSION) {
        console.log(`Image dimensions exceed maximum (${dimensions.width}x${dimensions.height}), adjusting...`);
        
        // Calculate scale factor to fit within MAX_DIMENSION
        const scaleFactor = MAX_DIMENSION / Math.max(dimensions.width, dimensions.height);
        
        // Adjust dimensions while maintaining aspect ratio
        adjustedDimensions.width = Math.floor(dimensions.width * scaleFactor);
        adjustedDimensions.height = Math.floor(dimensions.height * scaleFactor);
        
        // Ensure dimensions are multiples of 8 for better compatibility
        adjustedDimensions.width = Math.floor(adjustedDimensions.width / 8) * 8;
        adjustedDimensions.height = Math.floor(adjustedDimensions.height / 8) * 8;
        
        console.log(`Adjusted dimensions to: ${adjustedDimensions.width}x${adjustedDimensions.height}`);
    }
    
    // Ensure minimum dimensions
    if (dimensions.width < MIN_DIMENSION || dimensions.height < MIN_DIMENSION) {
        console.log(`Image dimensions below minimum (${dimensions.width}x${dimensions.height}), adjusting...`);
        
        // Calculate scale factor to meet MIN_DIMENSION
        const scaleFactor = MIN_DIMENSION / Math.min(dimensions.width, dimensions.height);
        
        // Adjust dimensions while maintaining aspect ratio
        adjustedDimensions.width = Math.ceil(dimensions.width * scaleFactor);
        adjustedDimensions.height = Math.ceil(dimensions.height * scaleFactor);
        
        // Ensure dimensions are multiples of 8
        adjustedDimensions.width = Math.ceil(adjustedDimensions.width / 8) * 8;
        adjustedDimensions.height = Math.ceil(adjustedDimensions.height / 8) * 8;
        
        console.log(`Adjusted dimensions to: ${adjustedDimensions.width}x${adjustedDimensions.height}`);
    }
    
    // Model-specific adjustments
    if (modelId === 'yuni') {
        // Yuni model works best with dimensions that are multiples of 8
        adjustedDimensions.width = Math.ceil(adjustedDimensions.width / 8) * 8;
        adjustedDimensions.height = Math.ceil(adjustedDimensions.height / 8) * 8;
    }
    
    return adjustedDimensions;
}

// Utility function to sanitize file names
function sanitizeFileName(fileName) {
    return fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
}

// Add a new endpoint to get available models with their input parameters
router.get('/models', (req, res) => {
    const modelList = inpaintingModels.models.map(m => ({
        id: m.id,
        name: m.name,
        description: m.description,
        inputs: m.inputs
    }));
    res.json(modelList);
});

router.post('/', async (req, res) => {
    try {
        const { image, mask, prompt, modelId = 'auto', modelParams = {}, allowFallback = true } = req.body;

        if (!image || !mask || !prompt) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Log the incoming request details
        console.log('Received inpainting request:', {
            image: image.substring(0, 30) + '...', // Log a snippet of the image data
            mask: mask.substring(0, 30) + '...',
            prompt,
            modelId,
            allowFallback
        });

        // Get original image dimensions
        const dimensions = await getImageDimensions(image);
        
        // Validate and adjust dimensions if necessary
        const adjustedDimensions = validateAndAdjustDimensions(dimensions, modelId);
        
        // If model is set to 'auto', choose based on size
        let finalModelId = modelId;
        if (modelId === 'auto') {
            const maxDimension = Math.max(adjustedDimensions.width, adjustedDimensions.height);
            finalModelId = maxDimension <= 512 ? 'yuni' : 'flux-fill-pro';
            console.log(`Auto-selected model ${finalModelId} based on image size ${adjustedDimensions.width}x${adjustedDimensions.height}`);
        } else {
            console.log(`User explicitly selected model: ${modelId}`);
        }
        
        // Find the selected model
        const selectedModel = inpaintingModels.models.find(m => m.id === finalModelId);
        if (!selectedModel) {
            return res.status(400).json({ error: 'Invalid model ID' });
        }

        console.log('Processing image and mask...');

        // Save both image and mask to B2
        const timestamp = Date.now();
        
        // Convert base64 to buffers
        const imageBuffer = Buffer.from(image.replace(/^data:image\/(png|jpeg|jpg);base64,/, ''), 'base64');
        const maskBuffer = Buffer.from(mask.replace(/^data:image\/(png|jpeg|jpg);base64,/, ''), 'base64');
        
        // Process mask specifically for Flux Fill Pro if needed
        let processedMaskBuffer = maskBuffer;
        
        // Check if we're using Flux Fill Pro, which requires special mask processing
        if (finalModelId === 'flux-fill-pro') {
            console.log('Processing mask specifically for Flux Fill Pro model...');
            try {
                // Use sharp to ensure the mask is properly formatted with black background and white strokes
                processedMaskBuffer = await sharp(maskBuffer)
                    // Ensure the mask is grayscale
                    .grayscale()
                    // Threshold to make it binary (black and white only)
                    .threshold(128)
                    // Ensure white strokes on black background
                    .negate(false)
                    .toBuffer();
                
                console.log('Mask processed successfully for Flux Fill Pro');
            } catch (err) {
                console.error('Error processing mask for Flux Fill Pro:', err);
                // Fall back to original mask if processing fails
                processedMaskBuffer = maskBuffer;
            }
        }
        
        // Use proper prefix and userId structure
        const userId = req.user ? req.user.id : 'default';
        const inpaintingPrefix = 'inpainting';
        
        console.log('Uploading files to B2...');
        const imageUpload = await storage.uploadBuffer(imageBuffer, inpaintingPrefix, userId);
        const maskUpload = await storage.uploadBuffer(
            finalModelId === 'flux-fill-pro' ? processedMaskBuffer : maskBuffer, 
            inpaintingPrefix, 
            userId
        );
        
        // Get public URLs
        const imageUrl = imageUpload.url;
        const maskUrl = maskUpload.url;
        
        console.log('Files uploaded successfully', { imageUrl, maskUrl });

        // Start with required inputs
        const input = {
            image: imageUrl,
            mask: maskUrl,
            prompt: prompt
        };

        // Add model-specific size parameters
        if (selectedModel.id === 'yuni') {
            // Yuni model uses width/height and needs to be multiples of 8
            input.width = adjustedDimensions.width;
            input.height = adjustedDimensions.height;
        } else {
            // Flux Fill Pro uses target_size/size - preserve original dimensions
            // Use the largest dimension but ensure it's at least 512px for quality
            const maxDimension = Math.max(adjustedDimensions.width, adjustedDimensions.height);
            input.target_size = Math.max(maxDimension, 512);
            
            // Set size to match target_size for consistency
            input.size = input.target_size;
            
            // Add width and height parameters to ensure correct aspect ratio
            input.width = adjustedDimensions.width;
            input.height = adjustedDimensions.height;
            
            // Set high_resolution_output to true to get full resolution output
            input.high_resolution_output = true;
            
            // Add additional parameters for better quality
            input.num_inference_steps = modelParams.num_inference_steps || 30;
            input.guidance_scale = modelParams.guidance_scale || 7.5;
        }

        // Add model-specific default parameters
        for (const [key, value] of Object.entries(selectedModel.inputs)) {
            if (key !== 'image' && key !== 'mask' && key !== 'prompt') {
                if (modelParams[key] !== undefined) {
                    // Use provided parameter value
                    input[key] = modelParams[key];
                } else if (value.default !== undefined) {
                    // Use default value from model config
                    input[key] = value.default;
                }
            }
        }

        // Call Replicate API using the selected model
        console.log('Calling Replicate with model:', selectedModel.model, 'and input:', input);
        
        // Log detailed dimension information for debugging
        console.log('Image dimensions:', {
            original: dimensions,
            adjusted: adjustedDimensions,
            target_size: input.target_size,
            size: input.size,
            width: input.width,
            height: input.height,
            high_resolution_output: input.high_resolution_output,
            aspect_ratio: {
                original: dimensions.width / dimensions.height,
                adjusted: adjustedDimensions.width / adjustedDimensions.height
            }
        });
        
        const modelIdentifier = selectedModel.version 
            ? `${selectedModel.model}:${selectedModel.version}`
            : selectedModel.model;
            
        console.log('Using model identifier:', modelIdentifier);
        
        try {
            const output = await replicate.run(
                modelIdentifier,
                { input }
            );

            console.log('Replicate response received:', output);
            console.log('Replicate response type:', typeof output);
            console.log('Replicate response structure:', Array.isArray(output) ? 'Array' : (output === null ? 'null' : typeof output));
            
            if (Array.isArray(output)) {
                console.log('Replicate response array length:', output.length);
                output.forEach((item, index) => {
                    console.log(`Replicate response item ${index}:`, item);
                });
            } else if (output && typeof output === 'object') {
                console.log('Replicate response object keys:', Object.keys(output));
            }

            if (!output) {
                throw new Error('No output received from Replicate');
            }

            console.log('Raw Replicate output:', output);
            
            // Handle different output formats from Replicate
            let outputUrl;
            if (Array.isArray(output) && output.length > 0) {
                // Most models return an array with the first item being the URL
                outputUrl = output[0];
            } else if (typeof output === 'string') {
                // Some models might return a direct URL string
                outputUrl = output;
            } else if (output && typeof output === 'object') {
                // Some models might return an object with a specific property containing the URL
                // Check common properties that might contain the URL
                outputUrl = output.image || output.output || output.result || output.url;
            }
            
            if (!outputUrl) {
                console.error('Unexpected Replicate output format:', output);
                throw new Error('No output URL found in Replicate response');
            }
            
            // Ensure the URL is absolute
            const absoluteUrl = outputUrl.startsWith('http') 
                ? outputUrl 
                : `https://${outputUrl.replace(/^\/\//, '')}`;
            
            console.log('Processing output URL:', { original: outputUrl, absolute: absoluteUrl });
            
            // Download and save the result image to B2
            try {
                const resultResponse = await fetch(absoluteUrl);
                if (!resultResponse.ok) {
                    throw new Error(`Failed to fetch result: ${resultResponse.status} ${resultResponse.statusText}`);
                }
                
                const resultBuffer = Buffer.from(await resultResponse.arrayBuffer());
                const resultUpload = await storage.uploadBuffer(resultBuffer, inpaintingPrefix, userId);
                
                // Send back the public URL of the result
                res.json({ 
                    url: resultUpload.url,
                    model: selectedModel.id
                });
            } catch (fetchError) {
                console.error('Error fetching or processing result image:', fetchError);
                throw new Error(`Failed to process result image: ${fetchError.message}`);
            }
        } catch (error) {
            console.error('Detailed Replicate error:', {
                message: error.message,
                cause: error.cause,
                stack: error.stack,
                response: error.response ? {
                    status: error.response.status,
                    data: error.response.data
                } : null
            });
            
            // Check for resolution-related errors
            const errorMessage = error.message.toLowerCase();
            if (errorMessage.includes('resolution') || 
                errorMessage.includes('dimension') || 
                errorMessage.includes('size') || 
                errorMessage.includes('width') || 
                errorMessage.includes('height')) {
                
                console.error('Resolution-related error detected:', {
                    originalDimensions: dimensions,
                    adjustedDimensions: adjustedDimensions,
                    requestedParameters: {
                        target_size: input.target_size,
                        size: input.size,
                        width: input.width,
                        height: input.height,
                        high_resolution_output: input.high_resolution_output
                    }
                });
                
                return res.status(500).json({
                    error: 'Inpainting failed due to resolution issues',
                    details: `The image resolution parameters caused an error: ${error.message}`,
                    modelUsed: modelIdentifier,
                    suggestion: 'Try using a different model or reducing the image size.'
                });
            }
            
            // Enhanced error handling for Flux Fill Pro
            if (selectedModel.id === 'flux-fill-pro') {
                console.error('Flux Fill Pro specific error details:', {
                    modelId: selectedModel.id,
                    modelIdentifier,
                    inputImageUrl: input.image,
                    inputMaskUrl: input.mask,
                    errorType: error.name,
                    errorMessage: error.message
                });
                
                // Define specific error patterns that might warrant a fallback
                const fallbackErrorPatterns = [
                    'url', 'URL',
                    'timeout', 'timed out',
                    'connection', 'network',
                    'unavailable', 'unreachable'
                ];
                
                // Check if it's an error that might benefit from fallback
                const shouldAttemptFallback = fallbackErrorPatterns.some(pattern => 
                    error.message.toLowerCase().includes(pattern.toLowerCase())
                );
                
                if (shouldAttemptFallback) {
                    // Only fallback if auto-selection was used and fallback is allowed
                    // This prevents fallback when the user explicitly selects Flux Fill Pro
                    if (allowFallback && selectedModel.id === 'flux-fill-pro' && req.body.modelId === 'auto') {
                        console.log('Attempting fallback to Yuni model after Flux Fill Pro failure (auto-selected model)');
                        console.log('Error that triggered fallback:', error.message);
                        
                        // Create a new request with Yuni model and fallback disabled to prevent infinite loops
                        const fallbackReq = {
                            ...req,
                            body: {
                                ...req.body,
                                modelId: 'yuni',
                                allowFallback: false
                            }
                        };
                        
                        // Call this route handler again with the modified request
                        return router.handle(fallbackReq, res);
                    }
                    
                    return res.status(500).json({ 
                        error: 'Inpainting failed with Flux Fill Pro model',
                        details: `Error: ${error.message}`,
                        modelUsed: modelIdentifier,
                        suggestion: 'You may try using the Yuni model instead which might work better with your image.'
                    });
                }
            }
            
            res.status(500).json({ 
                error: 'Inpainting failed',
                details: error.message,
                modelUsed: modelIdentifier
            });
        }
    } catch (error) {
        console.error('Inpainting error:', error);
        res.status(500).json({ 
            error: 'Inpainting failed',
            details: error.message
        });
    }
});

export default router;



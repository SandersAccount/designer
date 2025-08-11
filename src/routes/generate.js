import express from 'express';
import { auth } from '../middleware/auth.js';
import Replicate from 'replicate';
import fetch from 'node-fetch';
import { storage } from '../utils/storage.js';
import Style from '../models/Style.js';
import Theme from '../models/Theme.js';
import Generation from '../models/Generation.js';
import User from '../models/User.js';
import PromptTemplate from '../models/PromptTemplate.js';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { processTemplate } from '../public/js/promptTemplates.js';

const router = express.Router();

// Initialize Replicate client
const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

// Load models configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function loadModelConfig() {
    try {
        const configPath = join(__dirname, '..', 'config', 'replicateModels.json');
        console.log('Loading model config from:', configPath);
        const configContent = await readFile(configPath, 'utf8');
        console.log('Raw config content:', configContent);
        const parsed = JSON.parse(configContent);
        console.log('Parsed config:', JSON.stringify(parsed, null, 2));
        return parsed;
    } catch (error) {
        console.error('Error loading model config:', error);
        throw error;
    }
}

const modelsConfig = await loadModelConfig();
console.log('Loaded models config:', JSON.stringify(modelsConfig, null, 2));

// Create a map of model configurations for faster lookup
const modelConfigMap = {};
modelsConfig.models.forEach(model => {
    const modelKey = model.name.toLowerCase();
    console.log('Adding model to map:', modelKey, JSON.stringify(model, null, 2));
    modelConfigMap[modelKey] = model;

    // Also add by reference field if it exists (for dropdown matching)
    if (model.reference) {
        const referenceKey = model.reference.toLowerCase();
        console.log('Adding model reference to map:', referenceKey);
        modelConfigMap[referenceKey] = model;
    }
});
console.log('Final model config map:', JSON.stringify(modelConfigMap, null, 2));

// Generate image endpoint
router.post('/', auth, async (req, res) => {
    try {
        const {
            prompt,
            model,
            text1,
            text2,
            text3,
            style,
            theme,
            background,
            randomOptions,
            templateId,
            templatePrompt: requestTemplatePrompt,
            includeText,
            imagePalette
        } = req.body;
        console.log('Received generate request:', { prompt, model, text1, text2, text3, style, theme, background, randomOptions, templateId, templatePrompt: requestTemplatePrompt, includeText, imagePalette });
        
        const userId = req.user._id;

        // Check user credits
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.credits < 1) {
            return res.status(403).json({ error: 'Insufficient credits' });
        }

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        // Get model configuration using the map
        const modelKey = model.toLowerCase();
        console.log('Looking up model:', modelKey);
        console.log('Available models in map:', Object.keys(modelConfigMap));
        const modelConfig = modelConfigMap[modelKey];

        if (!modelConfig) {
            console.error('Model not found:', modelKey);
            console.error('Available models:', Object.keys(modelConfigMap));
            return res.status(400).json({ error: 'Invalid model selected' });
        }

        // Clean and validate text
        const cleanText1 = text1 ? text1.trim() : '';
        const cleanText2 = text2 ? text2.trim() : '';
        const cleanText3 = text3 ? text3.trim() : '';
        console.log('Text input:', cleanText1, cleanText2, cleanText3);

        // Clean and validate prompt
        const cleanPrompt = prompt ? prompt.trim() : '';
        console.log('Prompt input:', cleanPrompt);

        // Handle image palette - determine the palette description to use
        let imagePaletteDescription = 'default color scheme'; // Default fallback

        if (imagePalette) {
            console.log('🎨 Processing image palette:', {
                id: imagePalette.id,
                name: imagePalette.name,
                description: imagePalette.description,
                fullObject: imagePalette
            });
            console.log('🎨 Checking original palette conditions:', {
                isOriginal: imagePalette.id === 'original',
                hasDescription: !!imagePalette.description,
                descriptionValue: imagePalette.description,
                isNotPlaceholder: imagePalette.description !== '[ORIGINAL_PALETTE]',
                isNotFallback: imagePalette.description !== 'No color description provided'
            });

            if (imagePalette.id === 'original') {
                // For "Original Palette", use the description sent from the front-end
                // The front-end ColorPaletteSelector already has the correct original palette description
                if (imagePalette.description && imagePalette.description !== '[ORIGINAL_PALETTE]' && imagePalette.description !== 'No color description provided') {
                    imagePaletteDescription = imagePalette.description;
                    console.log('🎨 Using original palette description from front-end:', imagePaletteDescription);
                } else {
                    // Fallback: try to get the original palette from the template
                    console.log('🎨 Front-end did not provide valid original palette, fetching from template...');
                    if (templateId) {
                        try {
                            const template = await PromptTemplate.findById(templateId);
                            if (template && template.originalPalette && template.originalPalette.trim() !== '') {
                                imagePaletteDescription = template.originalPalette;
                                console.log('🎨 Using template original palette as fallback:', imagePaletteDescription);
                            } else {
                                console.log('🎨 No original palette found in template, using default');
                                imagePaletteDescription = 'default color scheme';
                            }
                        } catch (error) {
                            console.error('🎨 Error fetching template for original palette:', error);
                            imagePaletteDescription = 'default color scheme';
                        }
                    } else {
                        console.log('🎨 No templateId provided for original palette, using default');
                        imagePaletteDescription = 'default color scheme';
                    }
                }
            } else {
                // For all other palettes, use the description directly
                imagePaletteDescription = imagePalette.description || 'default color scheme';
                console.log('🎨 Using palette description:', imagePaletteDescription);
            }
        } else {
            console.log('🎨 No image palette provided, using default:', imagePaletteDescription);
        }

        // Get style and theme details
        let stylePrompt = '';
        let themePrompt = '';
        let templatePrompt = '';
        let themeElements = '';
        let themeArtStyle = '';

        try {
            // Process template if provided
            if (templateId) {
                console.log('Processing template with ID:', templateId);

                // Set up variables for template processing
                const templateVariables = {
                    object: cleanPrompt || 'T-shirt',
                    text1: cleanText1,
                    text2: cleanText2,
                    text3: cleanText3,
                    bg: background || 'light',
                    'image-palette': imagePaletteDescription
                };

                console.log('🎨 Template variables being passed to processTemplate:', templateVariables);
                console.log('🎨 Specifically, image-palette value:', templateVariables['image-palette']);

                // Use the template prompt from the request if available
                console.log('Template prompt received:', requestTemplatePrompt);

                const templateText = requestTemplatePrompt || "A [object] with [text1], [text2], and [text3] on a [bg] background";
                console.log('🎨 Template text to process:', templateText);

                templatePrompt = processTemplate(templateText, templateVariables, {
                    useRandomFallbacks: true,
                    randomOptions: randomOptions,
                    includeText: !req.body.noText
                });

                console.log('🎨 Processed template prompt:', templatePrompt);
            }

            // Get theme details first (if selected) so we can use theme variables in style
            let themeDoc = null;
            if (theme) {
                themeDoc = await Theme.findById(theme);
                console.log('Retrieved theme from database:', JSON.stringify(themeDoc, null, 2));
                console.log('Raw theme document:', themeDoc);

                if (themeDoc) {
                    // Get all art styles from theme
                    const artStyle = themeDoc.artStyles
                        .split(',')
                        .map(s => s.trim())
                        .filter(s => s)
                        .join(',');

                    // Get all elements from theme
                    themeElements = themeDoc.elements.split(',')
                        .map(e => e.trim())
                        .filter(e => e)
                        .join(', ');

                    console.log('Theme variables prepared:', {
                        artStyle,
                        themeElements,
                        font: themeDoc.font,
                        look: themeDoc.look
                    });
                }
            }

            // Get style details if selected
            if (style) {
                const styleDoc = await Style.findById(style);
                console.log('Found style:', styleDoc);
                
                if (styleDoc) {
                    // Get variables from style
                    const elements = styleDoc.elements?.split(',').map(e => e.trim()).filter(Boolean) || [];
                    const artStyles = styleDoc.artStyles?.split(',').map(e => e.trim()).filter(Boolean) || [];
                    const fontstyle = styleDoc.fontstyle?.trim() || '';
                    const feel = styleDoc.feel?.trim() || '';

                    // Use all art styles instead of random
                    const artStyle = artStyles.join(', ');
                    
                    // Get all elements
                    const randomElements = elements.length > 0 
                        ? elements.join(', ')
                        : '';

                    console.log('Style variables:', {
                        elements: randomElements,
                        artStyle,
                        fontstyle,
                        feel
                    });

                    // Process the prompt template with variables
                    const variables = {
                        object: cleanPrompt || 'T-shirt',
                        text1: cleanText1,
                        text2: cleanText2,
                        text3: cleanText3,
                        art: artStyle || 'digital art',
                        elements: randomElements || '',
                        fontstyle: fontstyle || '',
                        feel: feel || '',
                        bg: background || 'light',
                        'image-palette': imagePaletteDescription
                    };

                    console.log('🎨 Style variables being passed to processTemplate:', variables);
                    console.log('🎨 Style template text:', styleDoc.prompt);

                    // Process the style template
                    stylePrompt = processTemplate(styleDoc.prompt, variables, {
                        useRandomFallbacks: true,
                        randomOptions: randomOptions,
                        includeText: !req.body.noText
                    });

                    console.log('🎨 Processed style prompt:', stylePrompt);
                }
            }

            // Process theme prompt if theme is selected
            if (themeDoc) {
                const themeVariables = {
                    object: cleanPrompt || 'T-shirt',
                    text1: cleanText1,
                    text2: cleanText2,
                    text3: cleanText3,
                    'art-theme': themeDoc.artStyles,
                    'elements-theme': themeElements,
                    font: themeDoc.font,
                    look: themeDoc.look,
                    'image-palette': imagePaletteDescription
                };
                
                themePrompt = processTemplate(themeDoc.prompt, themeVariables);
                console.log('Processed theme prompt:', themePrompt);
            }

            // Combine prompts based on what's available
            let fullPrompt = '';
            
            if (templatePrompt) {
                // If we have a template and style/theme, combine them
                if (stylePrompt || themePrompt) {
                    fullPrompt = `${templatePrompt}. ${stylePrompt ? stylePrompt + '. ' : ''}${themePrompt ? themePrompt : ''}`;
                } else {
                    // Otherwise just use the template
                    fullPrompt = templatePrompt;
                }
            } else if (stylePrompt && themePrompt) {
                // If we have both style and theme, combine them
                fullPrompt = `${stylePrompt}. ${themePrompt}`;
            } else if (stylePrompt) {
                // If we only have style
                fullPrompt = stylePrompt;
            } else if (themePrompt) {
                // If we only have theme
                fullPrompt = themePrompt;
            } else {
                // If we have neither
                fullPrompt = cleanPrompt;
            }

            console.log('Full prompt before noText processing:', fullPrompt);
            
            // If noText is enabled, remove text in parentheses
            if (req.body.noText) {
                fullPrompt = fullPrompt.replace(/\([^)]*\)/g, '');
                // Clean up any double spaces or periods that might result
                fullPrompt = fullPrompt.replace(/\s+/g, ' ').replace(/\.\s*\./g, '.').trim();
                console.log('Full prompt after removing text in parentheses:', fullPrompt);
            }

            console.log('Final prompt:', fullPrompt);

            // Debug: Log palette information if provided
            if (req.body.imagePalette) {
                console.log('Image palette data received:', {
                    id: req.body.imagePalette.id,
                    name: req.body.imagePalette.name,
                    description: req.body.imagePalette.description,
                    colors: req.body.imagePalette.colors
                });
            }

            // Prepare model input
            const modelInput = {
                ...modelConfig.defaultInput,
                prompt: fullPrompt
            };

            // Generate image with Replicate
            const output = await replicate.run(modelConfig.run, {
                input: modelInput
            });

            if (!output || !output[0]) {
                throw new Error('No image data received from Replicate');
            }

            // Get the image from Replicate URL and convert to buffer
            let replicateUrl;

            console.log('Model output:', JSON.stringify(output));

            // Handle different output formats from different models
            if (Array.isArray(output)) {
                // Most models return an array of URLs
                replicateUrl = output[0];
            } else if (typeof output === 'object' && output.images) {
                // Some models like flux.1-dev return an object with images array
                replicateUrl = output.images[0];
            } else if (typeof output === 'object' && output.image) {
                // Some models return an object with a single image URL
                replicateUrl = output.image;
            } else if (typeof output === 'object' && output.output) {
                // Some models return an object with output property
                if (Array.isArray(output.output)) {
                    replicateUrl = output.output[0];
                } else if (typeof output.output === 'string') {
                    replicateUrl = output.output;
                }
            } else if (typeof output === 'string') {
                // Some models return a direct URL string
                replicateUrl = output;
            } else {
                console.error('Unexpected output format:', output);
                throw new Error('Unsupported output format from model');
            }

            // Ensure we have an absolute URL
            if (!replicateUrl || typeof replicateUrl !== 'string' || !replicateUrl.startsWith('http')) {
                console.error('Invalid URL received:', replicateUrl);
                throw new Error('Invalid URL received from model');
            }

            const response = await fetch(replicateUrl);
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Upload to B2 with user ID prefix
            const uploadResult = await storage.uploadBuffer(buffer, `user-${userId}/`);
            
            if (!uploadResult || !uploadResult.url) {
                console.error('Upload result:', uploadResult);
                throw new Error('Failed to upload image to storage');
            }

            // Create new generation record
            const generation = new Generation({
                userId,
                prompt: fullPrompt,
                originalPrompt: cleanPrompt,
                style: style || null,
                theme: theme || null,
                templateId: templateId || null,
                model,
                imageUrl: uploadResult.url,
                text1: cleanText1,
                text2: cleanText2,
                text3: cleanText3,
                background
            });

            await generation.save();

            // Deduct credit
            user.credits -= 1;
            await user.save();

            // Return success with image URL and credits
            res.json({
                imageUrl: uploadResult.url,
                credits: user.credits,
                prompt: fullPrompt,
                generationId: generation._id
            });

        } catch (error) {
            console.error('Error generating image:', error);
            res.status(500).json({ error: error.message });
        }
    } catch (error) {
        console.error('Error in generate endpoint:', error);
        res.status(500).json({ error: error.message });
    }
});

// AI Generator endpoint for design editor
router.post('/image', auth, async (req, res) => {
    try {
        const { object, templateId, imagePalette } = req.body;
        console.log('AI Generator request:', { object, templateId, imagePalette });

        const userId = req.user._id;

        // Check user credits
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.credits < 1) {
            return res.status(403).json({ error: 'Insufficient credits' });
        }

        if (!object) {
            return res.status(400).json({ error: 'Object is required' });
        }

        // Default to a simple model if no template is provided
        let modelKey = 'flux-schnell'; // Default model
        let fullPrompt = object;
        let imagePaletteDescription = 'default color scheme';

        // Process palette if provided (using same logic as main generate endpoint)
        if (imagePalette) {
            console.log('🎨 Processing AI generator palette:', {
                id: imagePalette.id,
                name: imagePalette.name,
                description: imagePalette.description,
                fullObject: imagePalette
            });

            if (imagePalette.id === 'original') {
                // For "Original Palette", use the description sent from the front-end
                if (imagePalette.description && imagePalette.description !== '[ORIGINAL_PALETTE]' && imagePalette.description !== 'No color description provided') {
                    imagePaletteDescription = imagePalette.description;
                    console.log('🎨 Using original palette description from front-end:', imagePaletteDescription);
                } else {
                    console.log('🎨 Front-end did not provide valid original palette, will check template later');
                }
            } else {
                // For all other palettes, use the description directly
                imagePaletteDescription = imagePalette.description || 'default color scheme';
                console.log('🎨 Using palette description:', imagePaletteDescription);
            }
        }

        // Process template if provided
        if (templateId) {
            try {
                const template = await PromptTemplate.findById(templateId);
                if (template) {
                    console.log('Found template:', template.name);

                    // Use template's recommended model if available
                    if (template.recommendedModel) {
                        modelKey = template.recommendedModel.toLowerCase();
                        console.log('Using template recommended model:', modelKey);
                    }

                    // Check if we need to get original palette from template
                    if (imagePalette && imagePalette.id === 'original' && imagePaletteDescription === 'default color scheme') {
                        if (template.originalPalette && template.originalPalette.trim() !== '') {
                            imagePaletteDescription = template.originalPalette;
                            console.log('🎨 Using template original palette as fallback:', imagePaletteDescription);
                        }
                    }

                    // Process template with object and palette
                    const templateVariables = {
                        object: object,
                        'image-palette': imagePaletteDescription
                    };

                    console.log('🎨 Template variables being passed to processTemplate:', templateVariables);
                    console.log('🎨 Specifically, image-palette value:', templateVariables['image-palette']);

                    fullPrompt = processTemplate(template.template, templateVariables, {
                        useRandomFallbacks: true,
                        includeText: false // No text for AI generator
                    });

                    console.log('🎨 Processed template prompt:', fullPrompt);
                } else {
                    console.log('Template not found, using simple prompt');
                }
            } catch (error) {
                console.error('Error processing template:', error);
                // Continue with simple prompt if template fails
            }
        }

        // Add palette to prompt if not already included
        if (imagePaletteDescription !== 'default color scheme' && !fullPrompt.includes(imagePaletteDescription)) {
            fullPrompt += `, ${imagePaletteDescription}`;
        }

        console.log('Final AI generator prompt:', fullPrompt);
        console.log('Using model:', modelKey);

        // Get model configuration
        const modelConfig = modelConfigMap[modelKey];
        if (!modelConfig) {
            console.error('Model not found:', modelKey);
            // Fallback to flux-schnell
            modelKey = 'flux-schnell';
            const fallbackConfig = modelConfigMap[modelKey];
            if (!fallbackConfig) {
                return res.status(400).json({ error: 'No valid model available' });
            }
            console.log('Using fallback model:', modelKey);
        }

        // Prepare model input
        const modelInput = {
            ...modelConfig.defaultInput,
            prompt: fullPrompt
        };

        // Generate image with Replicate
        console.log('Generating image with model:', modelConfig.run);
        const output = await replicate.run(modelConfig.run, {
            input: modelInput
        });

        if (!output || !output[0]) {
            throw new Error('No image data received from Replicate');
        }

        // Get the image from Replicate URL and convert to buffer
        const replicateUrl = output[0];
        const response = await fetch(replicateUrl);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to B2 with user ID prefix
        const uploadResult = await storage.uploadBuffer(buffer, `user-${userId}/ai-generator/`);

        if (!uploadResult || !uploadResult.url) {
            console.error('Upload result:', uploadResult);
            throw new Error('Failed to upload image to storage');
        }

        // Create new generation record
        const generation = new Generation({
            userId,
            prompt: fullPrompt,
            originalPrompt: object,
            templateId: templateId || null,
            model: modelKey,
            imageUrl: uploadResult.url,
            isFromAIGenerator: true // Mark as AI generator creation
        });

        await generation.save();

        // Deduct credit
        user.credits -= 1;
        await user.save();

        // Return success with image URL
        res.json({
            imageUrl: uploadResult.url,
            credits: user.credits,
            prompt: fullPrompt,
            generationId: generation._id
        });

    } catch (error) {
        console.error('Error in AI generator endpoint:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;

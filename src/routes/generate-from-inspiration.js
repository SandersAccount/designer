import express from 'express';
import Inspiration from '../models/Inspiration.js';
import Generation from '../models/Generation.js';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import Replicate from 'replicate';
import { v4 as uuidv4 } from 'uuid';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { storage } from '../utils/storage.js';
import fetch from 'node-fetch'; // Import node-fetch
// Removed import for performBackgroundRemoval

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Define color palettes directly in the server code to avoid import issues
const colorPalettes = [
    {
        id: 'original',
    name: 'Original Palette',
    colors: ['#cccccc'],
    description: 'Use original palette from inspiration',
    textColors: {
      lightest: '#cccccc'
    }
  },

  {
    id: 'default',
    name: 'Grey Scale',
    colors: ['#d3d3d3', '#666666', '#333333', '#161616', '#070707'],
    description: 'dark gray including black and light gray and medium gray',
    textColors: {
      lightest: '#d3d3d3',
      light: '#666666',
      medium: '#333333',
      dark: '#161616',
      darkest: '#070707'
    }
  },

  {
    id: 'french-sweets',
    name: 'French Sweets',
    colors: ['#FFF9F5', '#F2D1EC', '#D4F2EE', '#6A9E8E', '#2C5145'],
    description: 'soft white including pale yellow dark pink dark blue muted green and light green',
    textColors: {
      lightest: '#FFF9F5',
      light: '#F2D1EC',
      medium: '#D4F2EE',
      dark: '#6A9E8E',
      darkest: '#2C5145'
    }
  },

  {
    id: 'red-autumn',
    name: 'Red Autumn',
    colors: ['#FFF6F6', '#F0E4BB', '#DE9999', '#A43939', '#3D0303'],
    description: 'soft white including pale orange dark yellow muted red light red and deep red',
    textColors: {
      lightest: '#FFF6F6',
      light: '#F0E4BB',
      medium: '#DE9999',
      dark: '#A43939',
      darkest: '#3D0303'
    }
  },

  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    colors: ['#FCEEE1', '#CEF9FF', '#67ADC3', '#366C84', '#040720'],
    description: 'dark cream including dark blue medium blue light blue and very light blue',
    textColors: {
      lightest: '#FCEEE1',
      light: '#CEF9FF',
      medium: '#67ADC3',
      dark: '#366C84',
      darkest: '#040720'
    }
  },

  {
    id: 'candy-shop',
    name: 'Candy Shop',
    colors: ['#FFF9F4', '#FFB9C1', '#9CDDD5', '#FF7C52', '#5F0717'],
    description: 'dark cream including pale orange dark pink muted teal bright orange and light red',
    textColors: {
      lightest: '#FFF9F4',
      light: '#FFB9C1',
      medium: '#9CDDD5',
      dark: '#FF7C52',
      darkest: '#5F0717'
    }
  },

  {
    id: 'deep-wood',
    name: 'Deep Wood',
    colors: ['#FFF7EF', '#EDCEAA', '#5D7748', '#134B19', '#0A2402'],
    description: 'dark cream including pale brown muted green light green deep green and very light green',
    textColors: {
      lightest: '#FFF7EF',
      light: '#EDCEAA',
      medium: '#5D7748',
      dark: '#134B19',
      darkest: '#0A2402'
    }
  },

  {
    id: 'lilac-wine',
    name: 'Lilac Wine',
    colors: ['#FFF9F4', '#FFCFE6', '#FF96BC', '#BA518B', '#6D093E'],
    description: 'dark cream including pale pink dark pink muted purple deep purple and very light purple',
    textColors: {
      lightest: '#FFF9F4',
      light: '#FFCFE6',
      medium: '#FF96BC',
      dark: '#BA518B',
      darkest: '#6D093E'
    }
  },

  {
    id: 'first-love',
    name: 'First Love',
    colors: ['#FFDFE1', '#FF727A', '#DD2835', '#B00D1E', '#7B0D0D'],
    description: 'dark pink including bright red medium red light red deep red and very light red',
    textColors: {
      lightest: '#FFDFE1',
      light: '#FF727A',
      medium: '#DD2835',
      dark: '#B00D1E',
      darkest: '#7B0D0D'
    }
  },

  {
    id: 'earth-brown',
    name: 'Earth Brown',
    colors: ['#FFF3EC', '#FFDC98', '#C59653', '#754C1D', '#40200A'],
    description: 'dark cream including dark orange medium brown light brown deep brown and very light brown',
    textColors: {
      lightest: '#FFF3EC',
      light: '#FFDC98',
      medium: '#C59653',
      dark: '#754C1D',
      darkest: '#40200A'
    }
  },

  {
    id: 'grayscale',
    name: 'Grayscale',
    colors: ['#FCFCFC', '#CACACA', '#979797', '#656565', '#323232'],
    description: 'white including dark gray medium gray light gray and black',
    textColors: {
      lightest: '#FCFCFC',
      light: '#CACACA',
      medium: '#979797',
      dark: '#656565',
      darkest: '#323232'
    }
  },

  {
    id: 'retro-toy',
    name: 'Retro Toy',
    colors: ['#FFEDDF', '#FECBA0', '#E4C477', '#4E9B8F', '#2E4552'],
    description: 'dark orange including medium orange muted yellow muted teal light teal and very light gray',
    textColors: {
      lightest: '#FFEDDF',
      light: '#FECBA0',
      medium: '#E4C477',
      dark: '#4E9B8F',
      darkest: '#2E4552'
    }
  },

  {
    id: 'red-stone',
    name: 'Red Stone',
    colors: ['#FAFAFA', '#AFA7A6', '#B71109', '#6B0600', '#0B090A'],
    description: 'white including muted gray medium gray bright red light red and very light gray',
    textColors: {
      lightest: '#FAFAFA',
      light: '#AFA7A6',
      medium: '#B71109',
      dark: '#6B0600',
      darkest: '#0B090A'
    }
  },

  {
    id: 'cold-forest',
    name: 'Cold Forest',
    colors: ['#FCFFF5', '#93EDDD', '#44CDAC', '#0F4D57', '#082226'],
    description: 'off-white including dark teal medium teal light teal deep teal and very light teal',
    textColors: {
      lightest: '#FCFFF5',
      light: '#93EDDD',
      medium: '#44CDAC',
      dark: '#0F4D57',
      darkest: '#082226'
    }
  },

  {
    id: 'purple-clouds',
    name: 'Purple Clouds',
    colors: ['#C9EEF7', '#B5E2D7', '#77B2B7', '#635284', '#26203C'],
    description: 'dark blue including pale blue muted blue medium blue muted purple and light purple',
    textColors: {
      lightest: '#C9EEF7',
      light: '#B5E2D7',
      medium: '#77B2B7',
      dark: '#635284',
      darkest: '#26203C'
    }
  },

  {
    id: 'mango-dreams',
    name: 'Mango Dreams',
    colors: ['#FFFAD3', '#FCE94E', '#FFC700', '#E56000', '#551400'],
    description: 'dark yellow including bright yellow medium yellow bright orange deep orange and light brown',
    textColors: {
      lightest: '#FFFAD3',
      light: '#FCE94E',
      medium: '#FFC700',
      dark: '#E56000',
      darkest: '#551400'
    }
  },

  {
    id: 'retro-summer',
    name: 'Retro Summer',
    colors: ['#FFF6DF', '#FFDE8A', '#FF8569', '#770B2B', '#430928'],
    description: 'dark cream including dark yellow orange medium red light red and deep red',
    textColors: {
      lightest: '#FFF6DF',
      light: '#FFDE8A',
      medium: '#FF8569',
      dark: '#770B2B',
      darkest: '#430928'
    }
  },

  {
    id: 'purple-mint',
    name: 'Purple Mint',
    colors: ['#EFFFFB', '#98FFE0', '#4F7DE9', '#5612BF', '#15064B'],
    description: 'dark teal including bright teal medium teal dark blue purple and light purple',
    textColors: {
      lightest: '#EFFFFB',
      light: '#98FFE0',
      medium: '#4F7DE9',
      dark: '#5612BF',
      darkest: '#15064B'
    }
  },

  {
    id: 'purple-sand',
    name: 'Purple Sand',
    colors: ['#FFFDFA', '#FFF0CA', '#D9B073', '#8E009A', '#570049'],
    description: 'dark cream including pale orange tan muted purple light purple and deep purple',
    textColors: {
      lightest: '#FFFDFA',
      light: '#FFF0CA',
      medium: '#D9B073',
      dark: '#8E009A',
      darkest: '#570049'
    }
  },

  {
    id: 'gold-rush',
    name: 'Gold Rush',
    colors: ['#FFF9F4', '#FAD36F', '#D3A052', '#4B4B4B', '#1D1D1D'],
    description: 'dark cream including dark orange medium orange muted brown gray and light gray',
    textColors: {
      lightest: '#FFF9F4',
      light: '#FAD36F',
      medium: '#D3A052',
      dark: '#4B4B4B',
      darkest: '#1D1D1D'
    }
  },

  {
    id: 'sea-gold',
    name: 'Sea Gold',
    colors: ['#FDFDFD', '#E4E4E4', '#D0AD68', '#5E5E67', '#000534'],
    description: 'white including dark gray dark brown muted gray light blue and very light blue',
    textColors: {
      lightest: '#FDFDFD',
      light: '#E4E4E4',
      medium: '#D0AD68',
      dark: '#5E5E67',
      darkest: '#000534'
    }
  },

  {
    id: 'natural-organic',
    name: 'Natural Organic',
    colors: ['#FFFAF5', '#FBE9D8', '#B7B7A6', '#6C705E', '#353924'],
    description: 'off-white including pale orange dark brown muted green medium green and light green',
    textColors: {
      lightest: '#FFFAF5',
      light: '#FBE9D8',
      medium: '#B7B7A6',
      dark: '#6C705E',
      darkest: '#353924'
    }
  },

  {
    id: 'ocean-sun',
    name: 'Ocean Sun',
    colors: ['#FFFAF2', '#FFDD88', '#FFAE4F', '#246DDB', '#020B24'],
    description: 'off-white including dark yellow bright orange medium blue light blue and very light blue',
    textColors: {
      lightest: '#FFFAF2',
      light: '#FFDD88',
      medium: '#FFAE4F',
      dark: '#246DDB',
      darkest: '#020B24'
    }
  },

  {
    id: 'lovely-lilac',
    name: 'Lovely Lilac',
    colors: ['#FFF6F6', '#F8E3DC', '#A9759F', '#744B91', '#3E1958'],
    description: 'dark pink including pale orange medium pink muted purple light purple and deep purple',
    textColors: {
      lightest: '#FFF6F6',
      light: '#F8E3DC',
      medium: '#A9759F',
      dark: '#744B91',
      darkest: '#3E1958'
    }
  },

  {
    id: 'olive-tree',
    name: 'Olive Tree',
    colors: ['#FEFEF8', '#F8F1D8', '#F5E4A7', '#A2A45F', '#111010'],
    description: 'off-white including pale yellow dark yellow muted green light teal and black',
    textColors: {
      lightest: '#FEFEF8',
      light: '#F8F1D8',
      medium: '#F5E4A7',
      dark: '#A2A45F',
      darkest: '#111010'
    }
  },

  {
    id: 'coral-reef',
    name: 'Coral Reef',
    colors: ['#FFF4F4', '#FFDADA', '#FFA6B0', '#429DFF', '#160084'],
    description: 'dark pink including pale pink medium pink bright blue medium blue and light blue',
    textColors: {
      lightest: '#FFF4F4',
      light: '#FFDADA',
      medium: '#FFA6B0',
      dark: '#429DFF',
      darkest: '#160084'
    }
  },

  {
    id: 'forest-ranger',
    name: 'Forest Ranger',
    colors: ['#FFF1E0', '#EDD79D', '#72AF3B', '#3B751A', '#112E00'],
    description: 'dark cream including dark yellow medium yellow muted green light green and deep green',
    textColors: {
      lightest: '#FFF1E0',
      light: '#EDD79D',
      medium: '#72AF3B',
      dark: '#3B751A',
      darkest: '#112E00'
    }
  },

  {
    id: 'retro-purple',
    name: 'Retro Purple',
    colors: ['#FFF8F5', '#FFDAEC', '#A1CAE1', '#906A97', '#3A5F74'],
    description: 'dark cream including dark pink dark blue muted purple light teal and light gray',
    textColors: {
      lightest: '#FFF8F5',
      light: '#FFDAEC',
      medium: '#A1CAE1',
      dark: '#906A97',
      darkest: '#3A5F74'
    }
  },

  {
    id: 'retro-sunset',
    name: 'Retro Sunset',
    colors: ['#FFF9F4', '#FFE767', '#FAB553', '#C53552', '#374474'],
    description: 'dark cream including dark yellow medium orange muted red light blue and deep blue',
    textColors: {
      lightest: '#FFF9F4',
      light: '#FFE767',
      medium: '#FAB553',
      dark: '#C53552',
      darkest: '#374474'
    }
  },

  {
    id: 'soft-mint',
    name: 'Soft Mint',
    colors: ['#FEFCF2', '#E1F2E1', '#ABC7B1', '#53755B', '#244239'],
    description: 'off-white including dark mint medium mint muted green light green and deep green',
    textColors: {
      lightest: '#FEFCF2',
      light: '#E1F2E1',
      medium: '#ABC7B1',
      dark: '#53755B',
      darkest: '#244239'
    }
  },

  {
    id: 'red-plastic',
    name: 'Red Plastic',
    colors: ['#F4EDDE', '#D0D2CF', '#E55056', '#98AAB1', '#68091A'],
    description: 'dark beige including red muted gray medium red muted blue and light red',
    textColors: {
      lightest: '#F4EDDE',
      light: '#D0D2CF',
      medium: '#E55056',
      dark: '#98AAB1',
      darkest: '#68091A'
    }
  }
];

// Server-side implementation of getPaletteById
function getPaletteById(id) {
    if (!id) {
        console.log(`No palette ID provided`);
        return null;
    }
    
    console.log(`Looking for palette with ID: "${id}" in ${colorPalettes.length} available palettes`);
    console.log(`Available palette IDs: ${colorPalettes.map(p => p.id).join(', ')}`);
    
    const palette = colorPalettes.find(palette => palette.id === id);
    
    if (palette) {
        console.log(`Found palette: "${palette.name}" with description: "${palette.description}"`);
    } else {
        console.log(`WARNING: No palette found with ID: "${id}"`);
    }
    
    return palette || null;
}

// Load models configuration from the config file
async function loadModelConfig() {
    try {
        const configPath = join(__dirname, '..', 'config', 'replicateModels.json');
        console.log('Loading model config from:', configPath);
        const configContent = await readFile(configPath, 'utf8');
        return JSON.parse(configContent);
    } catch (error) {
        console.error('Error loading model config:', error);
        throw error;
    }
}

// Initialize Replicate with API token
const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

// Generate image from inspiration
router.post('/', auth, async (req, res) => {
    try {
        const { inspirationId, object, textValues, colorPaletteId } = req.body;
        
        console.log('Generate from inspiration request received:', {
            inspirationId,
            object,
            textValues: Array.isArray(textValues) ? `[${textValues.length} items]` : 'not an array',
            colorPaletteId
        });
        
        // Validate inputs
        if (!inspirationId) {
            return res.status(400).json({ message: 'Inspiration ID is required' });
        }
        
        if (!object) {
            return res.status(400).json({ message: 'Object is required' });
        }
        
        // Get user
        const user = await User.findById(req.userId);
        if (!user) {
            console.error(`User not found with ID: ${req.userId}`);
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Check if user has enough credits
        if (!user.isAdmin && user.credits < 1) {
            return res.status(403).json({ message: 'Not enough credits' });
        }
        
        // Get inspiration
        const inspiration = await Inspiration.findById(inspirationId);
        if (!inspiration) {
            return res.status(404).json({ message: 'Inspiration not found' });
        }
        
        // Ensure inspiration has required properties
        if (!inspiration.prompt) {
            return res.status(400).json({ message: 'Inspiration has no prompt' });
        }
        
        console.log('Found inspiration:', {
            id: inspiration._id,
            prompt: inspiration.prompt,
            object: inspiration.object,
            textValues: inspiration.textValues,
            textCount: inspiration.textCount,
            model: inspiration.model
        });
        
        // Start with the original prompt
        let prompt = inspiration.prompt;
        console.log('Original prompt:', prompt);
        
        // Replace object placeholders or the original object
        if (object) {
            console.log(`Processing object replacement: "${inspiration.object}" with "${object}"`);
            
            // Check if the prompt has a specific object placeholder
            if (prompt.includes('[input-object]')) {
                console.log('Found [input-object] placeholder, replacing with user input');
                const beforeReplace = prompt;
                prompt = prompt.split('[input-object]').join(object);
                console.log('Object placeholder replacement:', {
                    before: beforeReplace,
                    after: prompt,
                    objectInput: object,
                    replaced: beforeReplace !== prompt,
                    containsPlaceholderAfter: prompt.includes('[input-object]')
                });
                
                // Double-check if object replacement worked
                if (prompt.includes('[input-object]')) {
                    console.log('WARNING: [input-object] placeholder still exists after replacement!');
                }
            } else {
                // Fallback to replacing the original object
                // Escape special regex characters in the original object
                const escapedObject = inspiration.object.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const objectRegex = new RegExp(`\\b${escapedObject}\\b`, 'g');
                const beforeReplace = prompt;
                prompt = prompt.replace(objectRegex, object);
                console.log('Object direct replacement:', {
                    before: beforeReplace,
                    after: prompt,
                    pattern: escapedObject,
                    replaced: beforeReplace !== prompt
                });
            }
        }
        
        // Replace text values in prompt
        if (Array.isArray(textValues) && textValues.length > 0) {
            console.log('Text values provided:', textValues);
            
            // Ensure inspiration.textValues is an array
            const inspirationTextValues = Array.isArray(inspiration.textValues) 
                ? inspiration.textValues 
                : [];
            console.log('Inspiration text values:', inspirationTextValues);
            
            // First check for specific text placeholders
            const textPlaceholderPattern = /\[input-text-(\d+)\]/g;
            let match;
            let placeholdersFound = false;
            
            // Create a copy of the prompt we can modify as we find and replace placeholders
            let placeholderPrompt = prompt;
            
            // Look for all text placeholders and replace them
            const allMatches = [...prompt.matchAll(textPlaceholderPattern)];
            console.log('Text placeholder matches found:', allMatches.length, allMatches);
            
            // If we have matches, process each one
            if (allMatches.length > 0) {
                placeholdersFound = true;
                
                // Process each match and replace in the prompt
                allMatches.forEach(match => {
                    const placeholder = match[0]; // Complete placeholder like [input-text-1]
                    const indexStr = match[1]; // Just the number part
                    const index = parseInt(indexStr) - 1; // Convert to 0-based
                    
                    console.log(`Processing match: ${placeholder}, index: ${index}`);
                    
                    if (textValues[index]) {
                        console.log(`Replacing ${placeholder} with "${textValues[index]}"`);
                        const beforeReplace = placeholderPrompt;
                        placeholderPrompt = placeholderPrompt.split(placeholder).join(textValues[index]);
                        console.log('Replacement result:', {
                            before: beforeReplace,
                            after: placeholderPrompt,
                            replaced: beforeReplace !== placeholderPrompt
                        });
                    } else {
                        console.log(`No text value available for index ${index}`);
                    }
                });
            }
            
            // If we found and replaced placeholders, use that version
            if (placeholdersFound) {
                console.log('Using placeholder-replaced prompt');
                prompt = placeholderPrompt;
            } else {
                console.log('No placeholders found, falling back to direct text replacement');
                // Otherwise, fall back to replacing original text values
                for (let i = 0; i < inspirationTextValues.length && i < textValues.length; i++) {
                    if (inspirationTextValues[i] && textValues[i]) {
                        console.log(`Replacing text value "${inspirationTextValues[i]}" with "${textValues[i]}"`);
                        // Escape special regex characters in the original text
                        const escapedText = inspirationTextValues[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        const textRegex = new RegExp(`\\b${escapedText}\\b`, 'g');
                        const beforeReplace = prompt;
                        prompt = prompt.replace(textRegex, textValues[i]);
                        console.log('Text direct replacement:', {
                            before: beforeReplace,
                            after: prompt,
                            pattern: escapedText,
                            replaced: beforeReplace !== prompt
                        });
                    }
                }
            }
        }
        
        // Replace color palette if provided
        let paletteForReplacement = null;
        
        if (colorPaletteId) {
            console.log(`Replacing color palette with ID: '${colorPaletteId}'`);
            
            // Get the new color palette
            const newPalette = getPaletteById(colorPaletteId);
            
            if (newPalette) {
                console.log(`Selected palette: ${newPalette.name} (${newPalette.description})`);
                
                // Special handling for the Original Palette option
                if (colorPaletteId === 'original') {
                    // Use the originalPalette field instead of colorPalette.description
                    if (inspiration.originalPalette && inspiration.originalPalette.trim() !== '') {
                        paletteForReplacement = inspiration.originalPalette;
                        console.log(`Using actual original palette text: "${paletteForReplacement}" instead of placeholder`);
                    } else if (inspiration.colorPalette && inspiration.colorPalette.description) {
                        // Fallback to colorPalette.description if originalPalette is not available
                        paletteForReplacement = inspiration.colorPalette.description;
                        console.log(`No originalPalette found, using colorPalette.description as fallback: "${paletteForReplacement}"`);
                    } else {
                        // Second fallback if no color information is available
                        paletteForReplacement = "Default color scheme";
                        console.log(`No palette information found in inspiration, using fallback: "${paletteForReplacement}"`);
                    }
                } else {
                    // For all other palettes, use the description directly
                    paletteForReplacement = newPalette.description;
                    
                    // Check if there's a special [ORIGINAL_PALETTE] marker in the description
                    if (paletteForReplacement.includes('[ORIGINAL_PALETTE]')) {
                        // First try to use originalPalette field
                        if (inspiration.originalPalette && inspiration.originalPalette.trim() !== '') {
                            paletteForReplacement = paletteForReplacement.replace(
                                '[ORIGINAL_PALETTE]', 
                                inspiration.originalPalette
                            );
                            console.log(`Replaced [ORIGINAL_PALETTE] marker with originalPalette: "${inspiration.originalPalette}"`);
                        } 
                        // Fallback to colorPalette.description if originalPalette is not available
                        else if (inspiration.colorPalette?.description) {
                            paletteForReplacement = paletteForReplacement.replace(
                                '[ORIGINAL_PALETTE]', 
                                inspiration.colorPalette.description
                            );
                            console.log(`Replaced [ORIGINAL_PALETTE] marker with colorPalette.description: "${inspiration.colorPalette.description}"`);
                        }
                        else {
                            // Replace with a default if no palette information is available
                            paletteForReplacement = paletteForReplacement.replace(
                                '[ORIGINAL_PALETTE]', 
                                'Default color scheme'
                            );
                            console.log(`No palette information available, using default for [ORIGINAL_PALETTE] marker`);
                        }
                    }
                }
            } else {
                console.log(`Warning: Selected palette with ID '${colorPaletteId}' not found!`);
            }
        } else {
            console.log('No color palette ID provided');
            
            // If no palette ID is provided, use the original palette from the inspiration
            if (inspiration.colorPalette && inspiration.colorPalette.description) {
                paletteForReplacement = inspiration.colorPalette.description;
                console.log(`Using original palette: ${paletteForReplacement}`);
            }
        }
        
        // Perform palette replacement
        if (paletteForReplacement) {
            let paletteReplaced = false;
            
            // First, check for [palette] placeholder
            if (prompt.includes('[palette]')) {
                console.log(`Replacing [palette] with "${paletteForReplacement}"`);
                const beforeReplace = prompt;
                // Simple string replacement is more reliable than regex in this case
                prompt = prompt.split('[palette]').join(paletteForReplacement);
                console.log('Palette placeholder replacement:', {
                    before: beforeReplace,
                    after: prompt,
                    paletteValue: paletteForReplacement,
                    replaced: beforeReplace !== prompt,
                    containsPlaceholderAfter: prompt.includes('[palette]')
                });
                
                // Double-check if palette replacement worked
                if (prompt.includes('[palette]')) {
                    console.log('WARNING: [palette] placeholder still exists after replacement!');
                } else {
                    paletteReplaced = true;
                }
            } 
            
            // Also check for [ORIGINAL_PALETTE] marker directly in the prompt
            if (prompt.includes('[ORIGINAL_PALETTE]')) {
                console.log(`Found [ORIGINAL_PALETTE] marker in prompt, replacing with "${paletteForReplacement}"`);
                const beforeReplace = prompt;
                prompt = prompt.split('[ORIGINAL_PALETTE]').join(paletteForReplacement);
                console.log('ORIGINAL_PALETTE marker replacement:', {
                    before: beforeReplace,
                    after: prompt,
                    paletteValue: paletteForReplacement,
                    replaced: beforeReplace !== prompt,
                    containsPlaceholderAfter: prompt.includes('[ORIGINAL_PALETTE]')
                });
                
                if (prompt.includes('[ORIGINAL_PALETTE]')) {
                    console.log('WARNING: [ORIGINAL_PALETTE] marker still exists after replacement!');
                } else {
                    paletteReplaced = true;
                }
            }
            
            // If no explicit placeholders were found, look for common palette patterns
            if (!paletteReplaced) {
                // Look for common palette patterns in the prompt
                const palettePatterns = [
                    {
                        pattern: /color palette is strictly limited to ([^.]+)/i,
                        replacement: `color palette is strictly limited to ${paletteForReplacement}`
                    },
                    {
                        pattern: /color palette: ([^.]+)/i,
                        replacement: `color palette: ${paletteForReplacement}`
                    },
                    {
                        pattern: /palette: ([^.]+)/i,
                        replacement: `palette: ${paletteForReplacement}`
                    },
                    {
                        pattern: /colors: ([^.]+)/i,
                        replacement: `colors: ${paletteForReplacement}`
                    }
                ];

                let foundPattern = false;

                for (const patternObj of palettePatterns) {
                    if (patternObj.pattern.test(prompt)) {
                        const beforeReplace = prompt;
                        const match = prompt.match(patternObj.pattern);
                        if (match) {
                            console.log(`Replacing palette pattern "${match[1]}" with "${paletteForReplacement}"`);
                            prompt = prompt.replace(patternObj.pattern, patternObj.replacement);
                            foundPattern = true;

                            console.log('Palette pattern replacement:', {
                                before: beforeReplace,
                                after: prompt,
                                replaced: beforeReplace !== prompt
                            });
                            break;
                        }
                    }
                }
                
                // If no pattern was found, add the palette to the end of the prompt
                if (!foundPattern) {
                    console.log(`No palette pattern found, adding palette to end of prompt`);
                    const beforeReplace = prompt;
                    prompt += ` Color palette: ${paletteForReplacement}.`;
                    console.log('Palette addition:', {
                        before: beforeReplace,
                        after: prompt
                    });
                }
            }
        }
        
        console.log('Final prompt before sending to Replicate:', prompt);
        
        // Load models configuration
        const modelsConfig = await loadModelConfig();
        
        try {
            // Get model details
            const model = inspiration.model || 'sticker-maker';
            console.log(`Using model: ${model}`);
            
            // Find the model configuration
            const modelInfo = modelsConfig.models.find(m => m.name === model);
            
            if (!modelInfo) {
                console.error(`Model "${model}" not found in configuration`);
                return res.status(400).json({ 
                    message: 'Model not found in configuration', 
                    details: `The model "${model}" does not exist in the models configuration.` 
                });
            }
            
            // Set up model configuration
            const modelConfig = {
                path: modelInfo.run,
                parameters: { ...modelInfo.defaultInput }
            };
            
            // Ensure the prompt is properly set in the parameters
            // Make sure we use the prompt AFTER all replacements
            console.log('Final prompt after all replacements:', prompt);
            console.log('Checking if final prompt still contains placeholders:',
                prompt.includes('[input-object]'),
                prompt.includes('[input-text-'),
                prompt.includes('[palette]')
            );
            
            // Set the final processed prompt in the parameters
            modelConfig.parameters.prompt = prompt;
            
            console.log('Model config with final prompt:', JSON.stringify(modelConfig, null, 2));
            
            // Call Replicate API
            try {
                console.log(`Calling replicate.run with model path: ${modelConfig.path}`);
                const output = await replicate.run(modelConfig.path, {
                    input: modelConfig.parameters
                });
                
                console.log('Raw output from initial Replicate generation:', output);

                // --- 1. Extract Initial Image URL ---
                let initialImageUrl;
                if (Array.isArray(output)) {
                    initialImageUrl = output[0];
                } else if (typeof output === 'string') {
                    initialImageUrl = output;
                } else if (output && output.output) {
                    initialImageUrl = Array.isArray(output.output) ? output.output[0] : output.output;
                } else {
                    throw new Error('Invalid output format from initial Replicate generation');
                }

                if (!initialImageUrl) {
                    throw new Error('No image URL returned from initial Replicate generation');
                }
                console.log('Initial Image URL from Replicate:', initialImageUrl);

                // --- 2. Save Initial Image to B2 Storage First ---
                console.log(`[Save Initial Step] Saving initial image from URL: ${initialImageUrl}`);
                const savedInitialImage = await storage.saveImageFromUrl(initialImageUrl, 'generations-initial', req.userId);
                console.log('[Save Initial Step] Saved initial image details:', savedInitialImage);

                if (!savedInitialImage || !savedInitialImage.publicUrl) {
                    console.error('[Save Initial Step] Failed to save initial image or get public URL.');
                    throw new Error('Failed to save the initial generated image');
                }
                const savedInitialImageUrl = savedInitialImage.publicUrl; // This is the B2 URL
                console.log(`[Save Initial Step] Initial image URL saved to B2 storage: ${savedInitialImageUrl}`);

                // --- 3. Save the Generation record with the initial image URL ---
                const generation = new Generation({
                    userId: req.userId,
                    prompt,
                    model,
                    imageUrl: savedInitialImageUrl, // Save with the initial B2 URL
                    inspirationId
                });
                console.log('[Save Generation] Attempting to save generation record...');
                await generation.save();
                const generationId = generation._id;
                console.log('[Save Generation] Successfully saved generation record to database:', generationId);

                // --- 4. Deduct credit ---
                if (!user.isAdmin) {
                    // Fetch fresh user data before deducting to avoid potential race conditions if multiple requests happen
                    const currentUser = await User.findById(req.userId);
                    if (currentUser.credits < 1 && currentUser.credits !== 123654) { // Check credits again
                         console.warn(`[Credit Check] User ${req.userId} has insufficient credits (${currentUser.credits}) before deduction.`);
                         // Note: The generation was already created. Consider how to handle this scenario.
                         // Maybe delete the generation? Or just return an error?
                         // For now, log a warning and proceed, but this might need adjustment.
                    } else if (currentUser.credits !== 123654) {
                        currentUser.credits -= 1;
                        await currentUser.save();
                        console.log(`[Credit Deduction] Deducted 1 credit from user ${currentUser.email}, remaining: ${currentUser.credits}`);
                    } else {
                         console.log(`[Credit Deduction] User ${currentUser.email} has unlimited credits. No deduction needed.`);
                    }
                }

                // --- 5. Return success response with the INITIAL image URL and Generation ID ---
                res.json({
                    imageUrl: savedInitialImageUrl, // Return the initial B2 URL
                    generationId: generationId
                });
                
            } catch (replicateError) {
                console.error('Error from Replicate API:', replicateError);
                
                // Format and return error
                res.status(500).json({
                    message: 'Error from Replicate API',
                    details: replicateError.message
                });
            }
            
        } catch (error) {
            console.error('Error generating image from inspiration:', error);
            
            // Format and return error
            res.status(500).json({
                message: 'Error generating image',
                details: error.message
            });
        }
        
    } catch (error) {
        console.error('Error in generate-from-inspiration:', error);
        
        // Format and return error
        res.status(500).json({
            message: 'Server error',
            details: error.message
        });
    }
});

// Simple test route
router.get('/test', (req, res) => {
  res.json({ message: 'Test route working' });
});

export default router;

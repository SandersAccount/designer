/**
 * Color palettes for the prompt generator
 * Each palette has:
 * - id: unique identifier
 * - name: display name
 * - colors: array of hex color codes for visual display
 * - description: text description for use in prompts
 */
export const colorPalettes = [
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

/**
 * Get the appropriate text color for a palette based on color intensity
 * @param {string} paletteId - The palette ID
 * @param {string} intensity - 'lightest', 'light', 'medium', 'dark', 'darkest', or 'no-change'
 * @returns {string} The hex color code for text, or null for 'no-change'
 */
export function getTextColorForPalette(paletteId, intensity = 'medium') {
    if (intensity === 'no-change') {
        return null; // Indicates no color change should be applied
    }

    const palette = colorPalettes.find(p => p.id === paletteId);
    if (!palette || !palette.textColors) {
        // Fallback to default colors (5-option system)
        const fallbacks = {
            lightest: '#d3d3d3',
            light: '#666666',
            medium: '#333333',
            dark: '#161616',
            darkest: '#070707'
        };
        return fallbacks[intensity] || '#333333';
    }

    return palette.textColors[intensity] || '#333333';
}

/**
 * Get palette by ID
 * @param {string} id - The palette ID
 * @returns {object|null} The palette object or null if not found
 */
export function getPaletteById(id) {
    return colorPalettes.find(p => p.id === id) || null;
}

/**
 * Extract color palette description from a prompt
 * @param {string} prompt - The prompt to extract color description from
 * @returns {object} Object containing the extracted color description and modified prompt
 */
export function extractColorDescription(prompt) {
    // Handle invalid input
    if (!prompt || typeof prompt !== 'string') {
        console.warn('Invalid prompt provided to extractColorDescription:', prompt);
        return {
            colorDescription: null,
            modifiedPrompt: prompt || ''
        };
    }
    
    // Check for [palette] placeholder first
    if (prompt.includes('[palette]')) {
        return {
            colorDescription: '[palette]',
            modifiedPrompt: prompt
        };
    }
    
    const patterns = [
        /color palette is strictly limited to ([^.]+)/i,
        /colors? (include|are|is) ([^.]+)/i,
        /palette of ([^.]+)/i,
        /in (shades of [^.]+)/i,
        /using (only [^.]+) colors/i
    ];
    
    try {
        for (const pattern of patterns) {
            const match = prompt.match(pattern);
            if (match) {
                // The color description is in the captured group
                const colorDesc = match[1] || match[2];
                
                if (!colorDesc) continue;
                
                // Replace the matched color description with a placeholder
                const modifiedPrompt = prompt.replace(
                    match[0], 
                    match[0].replace(colorDesc, '[COLOR_PALETTE]')
                );
                
                return {
                    colorDescription: colorDesc.trim(),
                    modifiedPrompt
                };
            }
        }
    } catch (error) {
        console.error('Error in extractColorDescription:', error);
    }
    
    // If no pattern matches, return the original prompt
    return {
        colorDescription: null,
        modifiedPrompt: prompt
    };
}



/**
 * Find the closest matching palette to a color description
 * @param {string} description - The color description to match
 * @returns {object} The closest matching palette
 */
export function findClosestPalette(description) {
    // Handle cases where description is undefined, null, or not a string
    if (!description || typeof description !== 'string') {
        console.warn('Invalid description provided to findClosestPalette:', description);
        return colorPalettes[0]; // Default palette
    }
    
    try {
        // Simple matching algorithm - check which palette description contains the most words
        // from the input description
        const words = description.toLowerCase().split(/[,\s]+/).filter(w => w.length > 3);
        
        let bestMatch = colorPalettes[0];
        let highestScore = 0;
        
        for (const palette of colorPalettes) {
            // Ensure palette description is a string
            if (!palette.description || typeof palette.description !== 'string') {
                console.warn('Invalid palette description:', palette);
                continue;
            }
            
            const paletteWords = palette.description.toLowerCase().split(/[,\s]+/);
            let score = 0;
            
            for (const word of words) {
                if (paletteWords.some(pw => pw.includes(word) || word.includes(pw))) {
                    score++;
                }
            }
            
            if (score > highestScore) {
                highestScore = score;
                bestMatch = palette;
            }
        }
        
        return bestMatch;
    } catch (error) {
        console.error('Error in findClosestPalette:', error);
        return colorPalettes[0]; // Default palette
    }
}

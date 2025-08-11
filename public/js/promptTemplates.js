/**
 * Prompt Templates Manager
 * 
 * This module handles the processing of text prompt templates with dynamic variable replacement.
 * It provides functions to:
 * 1. Process templates with variable substitution
 * 2. Generate random default values for missing variables
 * 3. Manage fallback mechanisms for undefined text variables
 * 4. Randomly select one option from a comma-separated list of options
 */

// Default random text options for different contexts
const DEFAULT_TEXT_OPTIONS = {
    descriptive: [
        "elegant", "vibrant", "bold", "minimalist", "creative", 
        "playful", "professional", "modern", "retro", "classic",
        "stylish", "trendy", "unique", "premium", "exclusive",
        "artistic", "innovative", "sleek", "dynamic", "authentic"
    ],
    action: [
        "explore", "discover", "create", "imagine", "build",
        "design", "develop", "innovate", "transform", "inspire",
        "achieve", "experience", "embrace", "celebrate", "elevate",
        "enhance", "express", "showcase", "present", "highlight"
    ],
    nouns: [
        "adventure", "journey", "experience", "moment", "creation",
        "design", "concept", "idea", "vision", "masterpiece",
        "style", "quality", "excellence", "craftsmanship", "artistry",
        "statement", "expression", "identity", "personality", "character"
    ],
    text1_options: [
        "Cool Design", "Awesome Style", "Creative Look", "Premium Quality",
        "Unique Style", "Exclusive Design", "Custom Made", "Limited Edition",
        "Original Creation", "Handcrafted", "Special Edition", "Designer Choice"
    ],
    text2_options: [
        "Express Yourself", "Stand Out", "Make a Statement", "Be Unique",
        "Show Your Style", "Create Your Look", "Wear With Pride", "Designed For You",
        "Perfect Fit", "Exceptional Quality", "One Of A Kind", "Carefully Crafted"
    ],
    text3_options: [
        "Premium", "Quality", "Authentic", "Genuine", "Exclusive",
        "Handmade", "Artisanal", "Bespoke", "Custom", "Signature",
        "Limited", "Special", "Select", "Choice", "Refined"
    ]
};

/**
 * Process a prompt template by replacing variables with their values
 * 
 * @param {string} template - The prompt template with variables in [brackets]
 * @param {Object} variables - Object containing variable values
 * @param {Object} options - Configuration options
 * @param {boolean} options.useRandomFallbacks - Whether to use random values for missing variables
 * @param {string} options.emptyFallback - String to use when no value is available
 * @param {boolean} options.randomizeOptions - Whether to randomly select one option from comma-separated values
 * @param {Object} options.randomOptions - Object containing arrays of options for each variable
 * @param {boolean} options.includeText - Whether to include text variables or use empty values
 * @returns {string} The processed template with variables replaced
 */
function processTemplate(template, variables = {}, options = {}) {
    const {
        useRandomFallbacks = true,
        emptyFallback = '',
        randomizeOptions = false, // DISABLED: Changed from true to false to prevent comma-splitting issues
        randomOptions = {},
        includeText = true
    } = options;
    
    if (!template) return '';
    
    // Create a working copy of the template
    let processedTemplate = template;
    
    // Extract all variable placeholders from the template
    const variablePlaceholders = template.match(/\[([^\]]+)\]/g) || [];
    
    // Process each variable placeholder
    variablePlaceholders.forEach(placeholder => {
        // Extract the variable name without brackets
        const variableName = placeholder.slice(1, -1);
        
        // Skip text variables if includeText is false
        if (!includeText && (variableName === 'text1' || variableName === 'text2' || variableName === 'text3')) {
            processedTemplate = processedTemplate.split(placeholder).join('');
            return;
        }
        
        // Get the value from the variables object
        let value = variables[variableName];
        
        // Handle undefined or empty values
        if (value === undefined || value === null || value === '') {
            // Check if we have random options for this variable
            if (randomOptions && randomOptions[variableName] && randomOptions[variableName].length > 0) {
                // Use a single random option
                const options = randomOptions[variableName];
                value = options[Math.floor(Math.random() * options.length)];
            }
            // If no random options or empty random options, use fallback
            else if (useRandomFallbacks) {
                value = getRandomFallbackForVariable(variableName);
            } else {
                value = emptyFallback;
            }
        }
        // COMMENTED OUT: Random selection from comma-separated values
        // This was causing issues where user prompts like "Cow, wearing sunglasses, popsicle in hoof cheeky grin"
        // were being treated as options to randomly select from instead of a complete prompt
        //
        // If the value contains commas and randomizeOptions is true, pick one option randomly
        // Exception: Don't split image-palette descriptions as they should remain complete
        // else if (randomizeOptions && typeof value === 'string' && value.includes(',') && variableName !== 'image-palette') {
        //     const options = value.split(',').map(opt => opt.trim()).filter(opt => opt);
        //     if (options.length > 0) {
        //         value = options[Math.floor(Math.random() * options.length)];
        //     }
        // }
        
        // Replace all occurrences of the placeholder with the value
        processedTemplate = processedTemplate.split(placeholder).join(value);
    });
    
    // Clean up whitespace
    return processedTemplate.replace(/\s+/g, ' ').trim();
}

/**
 * Generate a random fallback value for a specific variable type
 * 
 * @param {string} variableName - The name of the variable
 * @returns {string} A random appropriate value
 */
function getRandomFallbackForVariable(variableName) {
    // Map variable names to appropriate fallback categories
    const categoryMap = {
        // Text variables
        'text': combineRandomValues(['descriptive', 'nouns']),
        'text1': getRandomFromCategory('text1_options'),
        'text2': getRandomFromCategory('text2_options'),
        'text3': getRandomFromCategory('text3_options'),
        
        // Style variables
        'art': getRandomFromCategory('descriptive'),
        'elements': getRandomFromCategory('nouns'),
        'fontstyle': getRandomFromCategory('descriptive'),
        'feel': getRandomFromCategory('descriptive'),
        
        // Theme variables
        'art-theme': getRandomFromCategory('descriptive'),
        'elements-theme': getRandomFromCategory('nouns'),
        'font': 'modern',
        'look': getRandomFromCategory('descriptive'),
        
        // Basic variables
        'object': combineRandomValues(['descriptive', 'nouns']),
        'bg': 'light',
        'image-palette': '' // Will be provided by the calling code
    };
    
    // Return the mapped value or an empty string if no mapping exists
    return categoryMap[variableName] || '';
}

/**
 * Get a random value from a specific category of default text options
 * 
 * @param {string} category - The category of text options
 * @returns {string} A random value from the category
 */
function getRandomFromCategory(category) {
    const options = DEFAULT_TEXT_OPTIONS[category] || [];
    if (options.length === 0) return '';
    
    const randomIndex = Math.floor(Math.random() * options.length);
    return options[randomIndex];
}

/**
 * Combine random values from multiple categories
 * 
 * @param {Array<string>} categories - Array of category names
 * @returns {string} Combined random values
 */
function combineRandomValues(categories) {
    return categories.map(category => getRandomFromCategory(category)).join(' ');
}

/**
 * Validate a template to ensure it has all required variables
 * 
 * @param {string} template - The template to validate
 * @param {Array<string>} requiredVariables - List of variables that must be present
 * @returns {boolean} True if valid, false otherwise
 */
function validateTemplate(template, requiredVariables = []) {
    if (!template) return false;
    
    // Extract all variable placeholders from the template
    const variablePlaceholders = template.match(/\[([^\]]+)\]/g) || [];
    const presentVariables = variablePlaceholders.map(p => p.slice(1, -1));
    
    // Check if all required variables are present
    return requiredVariables.every(variable => presentVariables.includes(variable));
}

// Export the functions
export {
    processTemplate,
    getRandomFallbackForVariable,
    getRandomFromCategory,
    combineRandomValues,
    validateTemplate
};

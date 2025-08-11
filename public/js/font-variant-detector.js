/**
 * Simple Font Variant Detection System
 *
 * Trust the font map completely - all listed fonts exist in /public/fonts/
 */

class FontVariantDetector {
    constructor() {
        this.initialized = false;
        this.fontCache = new Map();
        this.loadingPromises = new Map(); // Track loading promises to prevent duplicates

        // Use the same fontMap as the main editor - will be set during initialization
        this.fontMap = null;
    }

    // Initialize with the main fontMap from design-editor.js
    initialize(fontMap) {
        if (this.initialized) return;

        // Use the provided fontMap or try to get it from window
        this.fontMap = fontMap || window.fontMap;

        if (!this.fontMap) {
            console.warn('🔤 FontVariantDetector: No fontMap provided and window.fontMap not available');
            return;
        }

        this.setupUIControls();
        this.initialized = true;

        console.log('🔤 FontVariantDetector: Initialized with', Object.keys(this.fontMap).length, 'fonts');
    }

    // Check if font variant is available (simple: not null)
    isVariantAvailable(fontFamily, variant) {
        if (!this.fontMap) return false;
        const fontData = this.fontMap[fontFamily];
        return fontData && fontData[variant] !== null && fontData[variant] !== undefined;
    }

    // Load font variant - prevent duplicate loading
    async loadFontVariant(fontFamily, bold = false, italic = false) {
        if (!this.fontMap) {
            console.warn('🔤 FontVariantDetector not initialized with fontMap');
            return null;
        }

        let variant = 'regular';
        if (bold && italic) variant = 'boldItalic';
        else if (bold) variant = 'bold';
        else if (italic) variant = 'italic';

        const fontData = this.fontMap[fontFamily];
        if (!fontData || !fontData[variant] || fontData[variant] === null) {
            return null; // Font variant not available
        }

        const cacheKey = `${fontFamily}-${variant}`;

        // Check cache first
        if (this.fontCache.has(cacheKey)) {
            return this.fontCache.get(cacheKey);
        }

        // Check if already loading to prevent duplicates
        if (this.loadingPromises.has(cacheKey)) {
            return this.loadingPromises.get(cacheKey);
        }

        // Create loading promise
        const loadingPromise = this._loadFontFile(fontFamily, variant, fontData[variant], cacheKey);
        this.loadingPromises.set(cacheKey, loadingPromise);

        try {
            const result = await loadingPromise;
            this.loadingPromises.delete(cacheKey); // Clean up loading promise
            return result;
        } catch (error) {
            this.loadingPromises.delete(cacheKey); // Clean up on error
            console.error(`🔤 Failed to load font: ${fontFamily} ${variant}`, error);
            return null;
        }
    }

    // Internal method to actually load the font file
    async _loadFontFile(fontFamily, variant, fontPath, cacheKey) {
        const uniqueFontFamily = variant === 'regular' ? fontFamily : `${fontFamily}-${variant}`;

        // Check if font is already loaded by the main preloader
        const existingFonts = Array.from(document.fonts).map(f => f.family);
        if (existingFonts.includes(uniqueFontFamily)) {
            console.log(`🔤 Font already loaded by preloader: ${uniqueFontFamily}`);
            const result = { fontFace: null, uniqueFontFamily, originalFamily: fontFamily, variant };
            this.fontCache.set(cacheKey, result);
            return result;
        }

        // Load the font file if not already loaded
        const fontFace = new FontFace(uniqueFontFamily, `url("${fontPath}")`);
        await fontFace.load();
        document.fonts.add(fontFace);

        const result = { fontFace, uniqueFontFamily, originalFamily: fontFamily, variant };
        this.fontCache.set(cacheKey, result);

        console.log(`🔤 Loaded font: ${uniqueFontFamily}`);
        return result;
    }

    // Get loaded font family name
    getLoadedFontFamily(fontFamily, bold = false, italic = false) {
        let variant = 'regular';
        if (bold && italic) variant = 'boldItalic';
        else if (bold) variant = 'bold';
        else if (italic) variant = 'italic';

        // For regular variant, always return the original font family name
        if (variant === 'regular') {
            return fontFamily;
        }

        // For other variants, check if they exist and return the unique name
        const uniqueFontFamily = `${fontFamily}-${variant}`;

        // Check if the font is loaded in the browser
        const loadedFonts = Array.from(document.fonts).map(f => f.family);
        if (loadedFonts.includes(uniqueFontFamily)) {
            console.log(`🔤 Found loaded font variant: ${uniqueFontFamily}`);
            return uniqueFontFamily;
        }

        // Check our cache
        const cacheKey = `${fontFamily}-${variant}`;
        const cached = this.fontCache.get(cacheKey);
        if (cached && cached.uniqueFontFamily) {
            console.log(`🔤 Found cached font variant: ${cached.uniqueFontFamily}`);
            return cached.uniqueFontFamily;
        }

        console.log(`🔤 Font variant not found, returning original: ${fontFamily}`);
        return fontFamily;
    }



    // Setup UI controls - simple
    setupUIControls() {
        const fontFamilySelect = document.getElementById('iFontFamily');
        if (fontFamilySelect) {
            fontFamilySelect.addEventListener('change', (e) => {
                this.updateVariantControls(e.target.value);
            });
        }
    }

    // Update UI controls based on font family
    updateVariantControls(fontFamily) {
        const boldCheckbox = document.getElementById('iBold');
        const italicCheckbox = document.getElementById('iItalic');

        if (!boldCheckbox || !italicCheckbox) return;

        // Simple logic: enable if variant exists, disable if null
        const boldAvailable = this.isVariantAvailable(fontFamily, 'bold') || this.isVariantAvailable(fontFamily, 'boldItalic');
        const italicAvailable = this.isVariantAvailable(fontFamily, 'italic') || this.isVariantAvailable(fontFamily, 'boldItalic');

        // Update bold checkbox
        boldCheckbox.disabled = !boldAvailable;
        boldCheckbox.style.opacity = boldAvailable ? '1' : '0.5';

        // Update italic checkbox
        italicCheckbox.disabled = !italicAvailable;
        italicCheckbox.style.opacity = italicAvailable ? '1' : '0.5';

        // Clear checked state if variant not available and object is selected
        if (!boldAvailable && typeof selectedObjectIndex !== 'undefined' && selectedObjectIndex !== -1) {
            boldCheckbox.checked = false;
        }
        if (!italicAvailable && typeof selectedObjectIndex !== 'undefined' && selectedObjectIndex !== -1) {
            italicCheckbox.checked = false;
        }
    }


}

// Create global instance
window.fontVariantDetector = new FontVariantDetector();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FontVariantDetector;
}

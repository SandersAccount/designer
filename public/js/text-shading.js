/**
 * Text Handling Functions
 * Responsible for rendering text on the canvas with specified styles
 */

class TextHandler {
constructor() {
        this.defaultConfig = {
            text: 'RY',
            font: 'Arial',
            size: 120,
            color: '#FF0000',
            x: 0,
            y: 0,
            currentShadowType: 'shadow' // Default shadow type: 'shadow', 'lineShadow', 'blockShadow', 'detailed3D', 'retroShadow'
        };

        // Current text configuration 
        this.config = { ...this.defaultConfig };
        
        // Make sure the DOM is ready before initializing
        console.log('TextHandler initialized');
        
        // Current active shadow settings for each type
        this.shadowSettings = {
            shadow: {
                color: '#727272',
                opacity: 100,
                distance: 100,
                angle: -58,
                blur: 5,
                outlineWidth: 0
            },
            lineShadow: {
                color: '#000000',
                opacity: 100,
                offset: 100,
                angle: -58,
                blur: 5,
                outlineWidth: 0
            },
            blockShadow: {
                color: '#000000',
                opacity: 100,
                offset: 40,
                angle: -58,
                blur: 5,
                outlineWidth: 18
            },
            detailed3D: {
                primaryColor: '#000000',
                primaryOpacity: 100,
                secondaryColor: '#00FF66',
                secondaryOpacity: 100,
                secondaryWidth: 4,      // New parameter for Additional Outline width
                secondaryOffset: 10,    // New parameter for Additional Outline offset
                offset: 36,
                angle: -63,
                blur: 5,
                outlineWidth: 16
            },
            retroShadow: {
                color: '#000000',
                distance: 5,
                angle: 45
            }
        };
    }

    /**
     * Updates the text configuration
     * @param {Object} newConfig - New text configuration options
     */
    updateConfig(newConfig) {
        this.config = {
            ...this.config,
            ...newConfig
        };
    }

    /**
     * Updates shadow settings for a specific shadow type
     * @param {string} type - The shadow type to update
     * @param {Object} settings - New shadow settings
     */
    updateShadowSettings(type, settings) {
        this.shadowSettings[type] = {
            ...this.shadowSettings[type],
            ...settings
        };
    }

    /**
     * Sets the current active shadow type
     * @param {string} type - The shadow type to make active
     */
    setActiveShadowType(type) {
        if (this.shadowSettings[type]) {
            this.config.currentShadowType = type;
        }
    }

    /**
     * Applies a preset for the current shadow type
     * @param {string} presetId - The preset identifier
     */
    applyPreset(presetId) {
        // Get the preset from the shadingEffects class
        const preset = shadingEffects.presets[presetId];
        if (!preset) return;
        
        // Determine which shadow type this preset belongs to
        let shadowType;
        if (presetId.startsWith('shadow-')) {
            shadowType = 'shadow';
            this.updateShadowSettings(shadowType, preset);
        } else if (presetId.startsWith('line-')) {
            // For line shadow presets, we'll use our retro shadow now
            shadowType = 'retroShadow';
            this.updateShadowSettings(shadowType, {
                color: preset.color,
                // Convert offset to distance for retro shadow
                distance: preset.offset / 10, // Scale down as retro shadow uses smaller values
                angle: preset.angle
            });
        } else if (presetId.startsWith('retro-')) {
            // Direct presets for retro shadow
            shadowType = 'retroShadow';
            this.updateShadowSettings(shadowType, preset);
        } else if (presetId.startsWith('block-')) {
            shadowType = 'blockShadow';
            this.updateShadowSettings(shadowType, preset);
        } else if (presetId.startsWith('3d-')) {
            shadowType = 'detailed3D';
            this.updateShadowSettings(shadowType, {
                primaryColor: preset.primaryColor,
                primaryOpacity: preset.primaryOpacity,
                secondaryColor: preset.secondaryColor,
                secondaryOpacity: preset.secondaryOpacity,
                secondaryWidth: preset.secondaryWidth || 4,
                secondaryOffset: preset.secondaryOffset || 10,
                offset: preset.offset,
                angle: preset.angle,
                blur: preset.blur,
                outlineWidth: preset.outlineWidth
            });
        }
        
        // Activate the corresponding shadow type
        if (shadowType) {
            this.setActiveShadowType(shadowType);
        }
    }

    /**
     * Gets the full font string for canvas rendering
     * @returns {string} - The CSS font value
     */
    getFont() {
        return `${this.config.size}px ${this.config.font}`;
    }

    /**
     * Renders text with the current configuration and shadow settings
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} canvasWidth - Width of the canvas
     * @param {number} canvasHeight - Height of the canvas
     */
    render(ctx, canvasWidth, canvasHeight) {
        const text = this.config.text;
        
        // Configure text style
        ctx.font = this.getFont();
        ctx.fillStyle = this.config.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Calculate text position (center of canvas by default)
        const x = this.config.x || canvasWidth / 2;
        const y = this.config.y || canvasHeight / 2;
        
        // Render text with the selected shadow type
        switch (this.config.currentShadowType) {
            case 'shadow':
                this.renderWithDropShadow(ctx, text, x, y);
                break;
            case 'lineShadow':
                this.renderWithLineShadow(ctx, text, x, y);
                break;
            case 'blockShadow':
                this.renderWithBlockShadow(ctx, text, x, y);
                break;
            case 'detailed3D':
                this.renderWithDetailed3DShadow(ctx, text, x, y);
                break;
            case 'retroShadow':
                this.renderWithRetroShadow(ctx, text, x, y);
                break;
            default:
                // No shadow, just render the text
                ctx.fillText(text, x, y);
        }
    }

    /**
     * Renders text with drop shadow
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {string} text - Text to render
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    renderWithDropShadow(ctx, text, x, y) {
        const settings = this.shadowSettings.shadow;
        
        // Apply drop shadow
        shadingEffects.applyDropShadow(ctx, settings);
        
        // Draw the text
        ctx.fillText(text, x, y);
        
        // Restore the context (removes shadow)
        ctx.restore();
    }
    
    /**
     * Renders text with line shadow
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {string} text - Text to render
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    renderWithLineShadow(ctx, text, x, y) {
        const settings = this.shadowSettings.lineShadow;
        
        // First apply the line shadow (invisible border with shadow)
        shadingEffects.applyLineShadow(ctx, text, x, y, settings);
        
        // Then draw the actual text
        ctx.fillText(text, x, y);
    }

    /**
     * Renders text with detailed 3D shadow
     * @param {CanvasRenderingContext2D} ctx - The canvas context
     * @param {string} text - Text to render
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    renderWithDetailed3DShadow(ctx, text, x, y) {
        const settings = this.shadowSettings.detailed3D;
        
        // Apply the 3D shadow effect but skip drawing the secondary outline
        // We'll draw it after the main text so it appears on top
        const secondaryOutlineInfo = shadingEffects.applyDetailed3DShadow(ctx, text, x, y, settings, false);
        
        // Draw the actual text on top
        ctx.fillText(text, x, y);
        
        // Now draw the secondary outline (Additional Outline) on top of everything
        // Using the custom width and color from settings
        ctx.save();
        ctx.lineWidth = settings.secondaryWidth; // Use the customizable width 
        ctx.strokeStyle = shadingEffects.hexToRgba(
            settings.secondaryColor, 
            settings.secondaryOpacity / 100
        );
        
        // Calculate the offset position based on the secondary offset setting
        const oppositeAngle = settings.angle + 180;
        const offsetPos = shadingEffects.calculateOffset(settings.secondaryOffset, oppositeAngle);
        
        // Draw the secondary outline at the calculated position
        ctx.strokeText(text, x + offsetPos.x, y + offsetPos.y);
        ctx.restore();
    }

    /**
     * Renders text with block shadow (extrusion)
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {string} text - Text to render
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    renderWithBlockShadow(ctx, text, x, y) {
        const settings = this.shadowSettings.blockShadow;
        
        // Apply the block shadow with extrusion effect
        shadingEffects.applyBlockShadow(ctx, text, x, y, settings);
        
        // Draw the actual text on top of the shadow
        ctx.fillText(text, x, y);
    }

    /**
     * Renders text with retro shadow effect
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {string} text - Text to render
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    renderWithRetroShadow(ctx, text, x, y) {
        const settings = this.shadowSettings.retroShadow;
        
        // Use the applyRetroShadow function from retro-shadow.js
        window.applyRetroShadow(
            ctx, 
            text, 
            x, 
            y, 
            this.config.size, 
            this.config.font, 
            this.config.color, 
            settings.color, 
            settings.distance, 
            settings.angle
        );
    }
}

// Create a global instance of TextHandler
const textHandler = new TextHandler();

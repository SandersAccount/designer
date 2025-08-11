/**
 * Text Shading Module
 * Handles various text shading effects for integration with TextMode
 */

class ShadingModule {
    constructor() {
        this.defaultSettings = {
            // Regular drop shadow settings
            shadow: {
                color: '#727272',
                opacity: 100,
                distance: 100,
                angle: -58,
                blur: 5,
                outlineWidth: 0
            },
            // Line shadow settings
            lineShadow: {
                color: '#000000',
                opacity: 100,
                layerDistance: 5,
                angle: 45
            },
            // Block shadow settings
            blockShadow: {
                color: '#000000',
                opacity: 100,
                offset: 40,
                angle: -58,
                blur: 5,
                outlineWidth: 18
            },
            // Detailed 3D shadow settings
            detailed3D: {
                primaryColor: '#000000',
                primaryOpacity: 100,
                secondaryColor: '#00FF66',
                secondaryOpacity: 100,
                secondaryWidth: 4,
                secondaryOffset: 10,
                offset: 36,
                angle: -63,
                blur: 5,
                outlineWidth: 16
            }
        };
        
        // Current active settings
        this.settings = JSON.parse(JSON.stringify(this.defaultSettings));
        
        // Current active shading type
        this.activeShadingType = null;
    }
    
    /**
     * Sets the active shading type
     * @param {string} type - The shading type to activate ('shadow', 'lineShadow', 'blockShadow', 'detailed3D', or null for no shading)
     */
    setActiveShadingType(type) {
        this.activeShadingType = type;
    }
    
    /**
     * Updates settings for a specific shading type
     * @param {string} type - The shading type to update
     * @param {Object} newSettings - New settings to apply
     */
    updateSettings(type, newSettings) {
        if (this.settings[type]) {
            Object.assign(this.settings[type], newSettings);
            return true;
        }
        return false;
    }
    
    /**
     * Calculates the X and Y offsets from distance and angle
     * @param {number} distance - The distance of the shadow from the text
     * @param {number} angle - The angle of the shadow in degrees
     * @returns {Object} - The X and Y offsets
     */
    calculateOffset(distance, angle) {
        // Convert angle to radians and calculate offsets
        const radians = (angle * Math.PI) / 180;
        return {
            x: Math.cos(radians) * distance,
            y: Math.sin(radians) * distance
        };
    }
    
    /**
     * Applies shading effect to the given text
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} text - Text object to apply shading to
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    applyShading(ctx, text, x, y) {
        if (!this.activeShadingType || !this.settings[this.activeShadingType]) {
            return;
        }
        
        // Apply the appropriate shading effect based on the active type
        switch(this.activeShadingType) {
            case 'shadow':
                this.applyDropShadow(ctx, text, x, y);
                break;
            case 'lineShadow':
                this.applyLineShadow(ctx, text, x, y);
                break;
            case 'blockShadow':
                this.applyBlockShadow(ctx, text, x, y);
                break;
            case 'detailed3D':
                this.applyDetailed3DShadow(ctx, text, x, y);
                break;
        }
    }
    
    /**
     * Converts hex color to rgba
     * @param {string} hex - Hex color code
     * @param {number} opacity - Opacity value between 0 and 1
     * @returns {string} - RGBA color string
     */
    hexToRgba(hex, opacity) {
        hex = hex.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    /**
     * Applies a drop shadow effect to text
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} text - Text object to apply shadow to
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    applyDropShadow(ctx, text, x, y) {
        const settings = this.settings.shadow;
        
        // Calculate the shadow offset based on angle and distance
        const offset = this.calculateOffset(settings.distance, settings.angle);
        
        // Save current context state
        ctx.save();
        
        // Apply shadow properties
        ctx.shadowColor = this.hexToRgba(settings.color, settings.opacity / 100);
        ctx.shadowBlur = settings.blur;
        ctx.shadowOffsetX = offset.x;
        ctx.shadowOffsetY = offset.y;
        
        // Draw the text with shadow
        ctx.font = text.font;
        ctx.textAlign = text.textAlign || 'center';
        ctx.textBaseline = 'middle';
        
        // Draw text fill
        ctx.fillStyle = text.color;
        ctx.fillText(text.text, x, y);
        
        // Restore context (removes shadow)
        ctx.restore();
        
        // Apply outline if specified
        if (settings.outlineWidth > 0) {
            ctx.save();
            ctx.lineWidth = settings.outlineWidth;
            ctx.strokeStyle = this.hexToRgba(settings.color, settings.opacity / 100);
            ctx.strokeText(text.text, x, y);
            ctx.restore();
        }
    }

    /**
     * Applies a line shadow effect to text
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} text - Text object to apply shadow to
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    applyLineShadow(ctx, text, x, y) {
        const settings = this.settings.lineShadow;
        
        // Save the current context state
        ctx.save();
        
        // Setup text rendering properties
        ctx.font = text.font;
        ctx.textAlign = text.textAlign || 'center';
        ctx.textBaseline = 'middle';
        
        // Calculate the offset based on angle
        const angleRad = settings.angle * Math.PI / 180;
        const xOffset = Math.cos(angleRad) * settings.layerDistance;
        const yOffset = Math.sin(angleRad) * settings.layerDistance;
        
        // Draw the shadow outline effect using the "composite cut-out" technique
        
        // 1. First, draw the shadow text at the farthest position (layer 2)
        ctx.fillStyle = this.hexToRgba(settings.color, settings.opacity / 100);
        ctx.fillText(text.text, x + (xOffset * 2), y + (yOffset * 2));
        
        // 2. Now use destination-out composite operation to create the cutout
        ctx.globalCompositeOperation = 'destination-out';
        
        // 3. Create the cutout by drawing the text at the middle position (layer 1)
        ctx.fillText(text.text, x + xOffset, y + yOffset);
        
        // 4. Reset the composite operation to normal
        ctx.globalCompositeOperation = 'source-over';
        
        // 5. Draw the main text on top
        ctx.fillStyle = text.color;
        ctx.fillText(text.text, x, y);
        
        // 6. Apply stroke if needed
        if (text.strokeWidth && text.strokeWidth > 0) {
            ctx.lineWidth = text.strokeWidth;
            ctx.strokeStyle = text.strokeColor;
            ctx.strokeText(text.text, x, y);
        }
        
        // Restore the original context state
        ctx.restore();
    }

    /**
     * Applies a block shadow (extrusion) effect to text
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} text - Text object to apply shadow to
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    applyBlockShadow(ctx, text, x, y) {
        const settings = this.settings.blockShadow;
        
        // Convert color to rgba
        const shadowColor = this.hexToRgba(settings.color, settings.opacity / 100);
        
        // Calculate the total offset for the shadow
        const totalOffset = this.calculateOffset(settings.offset, settings.angle);
        
        // Create a smoother extrusion effect with more steps
        const steps = Math.max(50, Math.floor(settings.offset));
        const stepSize = settings.offset / steps;
        
        // Save current context state
        ctx.save();
        
        // Draw the extrusion shadow first (from back to front)
        for (let i = steps; i >= 1; i--) {
            const progress = i / steps;
            const currentOffset = {
                x: totalOffset.x * progress,
                y: totalOffset.y * progress
            };
            
            ctx.fillStyle = shadowColor;
            
            // Apply outline to each shadow step if specified
            if (settings.outlineWidth > 0) {
                ctx.lineWidth = settings.outlineWidth;
                ctx.strokeStyle = shadowColor;
                ctx.strokeText(text.text, x + currentOffset.x, y + currentOffset.y);
            }
            
            // Fill the text for this shadow step
            ctx.fillText(text.text, x + currentOffset.x, y + currentOffset.y);
        }
        
        // Add blur effect to the entire shadow if specified
        if (settings.blur > 0) {
            // A separate shadow effect to give the entire extrusion a blurred edge
            ctx.save();
            ctx.shadowColor = shadowColor;
            ctx.shadowBlur = settings.blur;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            // Draw a final shadow layer at the maximum offset
            ctx.fillStyle = shadowColor;
            ctx.fillText(text.text, x + totalOffset.x, y + totalOffset.y);
            
            // Restore to previous context (without blur)
            ctx.restore();
        }
        
        // Draw the main text on top
        ctx.fillStyle = text.color;
        ctx.fillText(text.text, x, y);
        
        // Restore the original context state
        ctx.restore();
    }

    /**
     * Applies a detailed 3D shadow with multiple layers
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} text - Text object to apply shadow to
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    applyDetailed3DShadow(ctx, text, x, y) {
        const settings = this.settings.detailed3D;
        
        // Convert colors to rgba
        const primaryColor = this.hexToRgba(settings.primaryColor, settings.primaryOpacity / 100);
        const secondaryColor = this.hexToRgba(settings.secondaryColor, settings.secondaryOpacity / 100);
        
        // Save current context state
        ctx.save();
        
        // Calculate the total offset for the primary shadow (main extrusion)
        const totalOffset = this.calculateOffset(settings.offset, settings.angle);
        
        // Calculate the opposite angle for the secondary outline
        const oppositeAngle = settings.angle + 180;
        
        // Get the values for the secondary outline from the settings
        const secondaryOutlineWidth = settings.secondaryWidth || 4;
        const secondaryOffset = settings.secondaryOffset || 10;
        
        // Calculate the offset for the secondary outline
        const secondaryOffsetPos = this.calculateOffset(secondaryOffset, oppositeAngle);
        
        // Create a smoother extrusion effect with more steps
        const steps = Math.max(50, Math.floor(settings.offset));
        
        // First, draw the primary extrusion shadow (similar to Block Shadow)
        // Draw from back to front for proper layering
        for (let i = steps; i >= 1; i--) {
            const progress = i / steps;
            const currentOffset = {
                x: totalOffset.x * progress,
                y: totalOffset.y * progress
            };
            
            // Set fill style for this shadow step
            ctx.fillStyle = primaryColor;
            
            // Fill the text for this shadow step
            ctx.fillText(text.text, x + currentOffset.x, y + currentOffset.y);
            
            // Apply outline to each shadow step, if specified
            if (settings.outlineWidth > 0) {
                ctx.lineWidth = settings.outlineWidth;
                ctx.strokeStyle = primaryColor;
                ctx.strokeText(text.text, x + currentOffset.x, y + currentOffset.y);
            }
        }
        
        // Add blur effect to the primary shadow if specified
        if (settings.blur > 0) {
            ctx.save();
            ctx.shadowColor = primaryColor;
            ctx.shadowBlur = settings.blur;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            // Draw a final shadow layer at the maximum offset
            ctx.fillStyle = primaryColor;
            ctx.fillText(text.text, x + totalOffset.x, y + totalOffset.y);
            
            if (settings.outlineWidth > 0) {
                ctx.lineWidth = settings.outlineWidth;
                ctx.strokeStyle = primaryColor;
                ctx.strokeText(text.text, x + totalOffset.x, y + totalOffset.y);
            }
            
            ctx.restore();
        }
        
        // Apply the outline to the main text (at the original position)
        if (settings.outlineWidth > 0) {
            ctx.lineWidth = settings.outlineWidth;
            ctx.strokeStyle = primaryColor;
            ctx.strokeText(text.text, x, y);
        }
        
        // Draw the main text
        ctx.fillStyle = text.color;
        ctx.fillText(text.text, x, y);
        
        // Draw the secondary outline (colored border) on top of everything
        ctx.lineWidth = secondaryOutlineWidth;
        ctx.strokeStyle = secondaryColor;
        ctx.strokeText(text.text, x + secondaryOffsetPos.x, y + secondaryOffsetPos.y);
        
        // Restore the original context state
        ctx.restore();
    }
}

// Create a global instance
const shadingModule = new ShadingModule();

export default shadingModule;

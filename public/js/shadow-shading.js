/**
 * Shadow Effects Implementation
 * Contains functions for rendering different types of text shadows
 */

/**
 * ShadingEffects Class
 * Handles the rendering of various shadow effects for text
 */
class ShadingEffects {
    constructor() {
        // Shadow presets
        this.presets = {
            // Regular shadow presets
            'shadow-1': {
                color: '#727272',
                opacity: 100,
                distance: 100,
                angle: -58,
                blur: 5,
                outlineWidth: 0
            },
            'shadow-2': {
                color: '#727272',
                opacity: 80,
                distance: 50,
                angle: -45,
                blur: 10,
                outlineWidth: 0
            },
            'shadow-3': {
                color: '#000000',
                opacity: 70,
                distance: 70,
                angle: -30,
                blur: 15,
                outlineWidth: 0
            },
            'shadow-4': {
                color: '#555555',
                opacity: 90,
                distance: 40,
                angle: -60,
                blur: 3,
                outlineWidth: 0
            },
            
            // Line shadow presets - now used for retro shadow
            'line-1': {
                color: '#000000',
                opacity: 100,
                offset: 50,
                angle: 45,
                blur: 0, 
                outlineWidth: 0
            },
            'line-2': {
                color: '#0000FF',
                opacity: 100,
                offset: 80,
                angle: 30,
                blur: 0,
                outlineWidth: 0
            },
            'line-3': {
                color: '#FF0000',
                opacity: 100,
                offset: 60,
                angle: 60,
                blur: 0,
                outlineWidth: 0
            },
            'line-4': {
                color: '#00AA00',
                opacity: 100,
                offset: 70,
                angle: 90,
                blur: 0,
                outlineWidth: 0
            },
            
            // Dedicated retro shadow presets
            'retro-1': {
                color: '#000000',
                distance: 5,
                angle: 45
            },
            'retro-2': {
                color: '#0000FF',
                distance: 8,
                angle: 30
            },
            'retro-3': {
                color: '#FF0000',
                distance: 6,
                angle: 60
            },
            'retro-4': {
                color: '#00AA00',
                distance: 7,
                angle: 90
            },
            
            // Block shadow presets
            'block-1': {
                color: '#000000',
                opacity: 100,
                offset: 30,
                angle: -45,
                blur: 3,
                outlineWidth: 12
            },
            'block-2': {
                color: '#000000',
                opacity: 100,
                offset: 35,
                angle: -40,
                blur: 4,
                outlineWidth: 15
            },
            'block-3': {
                color: '#000000',
                opacity: 100,
                offset: 40,
                angle: -58,
                blur: 5,
                outlineWidth: 18
            },
            'block-4': {
                color: '#000000',
                opacity: 100,
                offset: 50,
                angle: -30,
                blur: 6,
                outlineWidth: 22
            },
            
            // 3D shadow presets
            '3d-1': {
                primaryColor: '#000000',
                primaryOpacity: 100,
                secondaryColor: '#00FF00',
                secondaryOpacity: 100,
                secondaryWidth: 4,
                secondaryOffset: 10,
                offset: 25,
                angle: -45,
                blur: 3,
                outlineWidth: 10
            },
            '3d-2': {
                primaryColor: '#000000',
                primaryOpacity: 100,
                secondaryColor: '#3498db',
                secondaryOpacity: 100,
                secondaryWidth: 5,
                secondaryOffset: 12,
                offset: 30,
                angle: -50,
                blur: 4,
                outlineWidth: 12
            },
            '3d-3': {
                primaryColor: '#000000',
                primaryOpacity: 100,
                secondaryColor: '#e74c3c',
                secondaryOpacity: 100,
                secondaryWidth: 3,
                secondaryOffset: 8,
                offset: 32,
                angle: -55,
                blur: 4,
                outlineWidth: 14
            },
            '3d-4': {
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
     * Applies a basic drop shadow to text
     * @param {CanvasRenderingContext2D} ctx - The canvas context
     * @param {Object} options - Shadow options
     */
    applyDropShadow(ctx, options) {
        const offset = this.calculateOffset(options.distance, options.angle);
        
        // Save the current context state
        ctx.save();
        
        // Set shadow properties
        ctx.shadowColor = this.hexToRgba(options.color, options.opacity / 100);
        ctx.shadowBlur = options.blur;
        ctx.shadowOffsetX = offset.x;
        ctx.shadowOffsetY = offset.y;
        
        // The actual text drawing is handled by the calling function
        
        // Return context for chaining
        return ctx;
    }

    /**
     * Applies a line shadow (invisible border with shadow)
     * @param {CanvasRenderingContext2D} ctx - The canvas context
     * @param {string} text - The text to render
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Object} options - Shadow options
     */
    applyLineShadow(ctx, text, x, y, options) {
        const offset = this.calculateOffset(options.offset, options.angle);
        
        // Save the current context state
        ctx.save();
        
        // Create the shadow for the invisible border
        ctx.shadowColor = this.hexToRgba(options.color, options.opacity / 100);
        ctx.shadowBlur = options.blur;
        ctx.shadowOffsetX = offset.x;
        ctx.shadowOffsetY = offset.y;
        
        // Set the text color to transparent to create the "invisible border" effect
        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        ctx.fillText(text, x, y);
        
        // Restore context to remove shadow settings
        ctx.restore();
    }

    /**
     * Applies a block shadow (extrusion effect)
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {string} text - Text to render
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Object} options - Shadow options
     */
    applyBlockShadow(ctx, text, x, y, options) {
        // Convert color to rgba
        const shadowColor = this.hexToRgba(options.color, options.opacity / 100);
        
        // Save the current context state
        ctx.save();
        
        // First, determine if we need to apply an outline to the text
        const hasOutline = options.outlineWidth > 0;
        
        // Calculate the total offset for the shadow
        const totalOffset = this.calculateOffset(options.offset, options.angle);
        
        // Create a much smoother extrusion effect with more steps
        // Use at least 50 steps for smooth appearance regardless of offset size
        const steps = Math.max(50, Math.floor(options.offset));
        const stepSize = options.offset / steps;
        
        // Draw the extrusion shadow first (from back to front)
        for (let i = steps; i >= 1; i--) {
            const progress = i / steps;
            const currentOffset = {
                x: totalOffset.x * progress,
                y: totalOffset.y * progress
            };
            
            ctx.fillStyle = shadowColor;
            
            // If text has outline, apply it to each shadow step
            if (hasOutline) {
                ctx.lineWidth = options.outlineWidth;
                ctx.strokeStyle = shadowColor;
                ctx.strokeText(text, x + currentOffset.x, y + currentOffset.y);
            }
            
            // Fill the text for this shadow step
            ctx.fillText(text, x + currentOffset.x, y + currentOffset.y);
        }
        
        // Add blur effect to the entire shadow if specified
        if (options.blur > 0) {
            // A separate shadow effect to give the entire extrusion a blurred edge
            ctx.save();
            ctx.shadowColor = shadowColor;
            ctx.shadowBlur = options.blur;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            // Draw a final shadow layer at the maximum offset
            ctx.fillStyle = shadowColor;
            ctx.fillText(text, x + totalOffset.x, y + totalOffset.y);
            
            // Restore to previous context (without blur)
            ctx.restore();
        }
        
        // Restore the original context state
        ctx.restore();
    }

    /**
     * Applies a detailed 3D shadow with multiple layers
     * @param {CanvasRenderingContext2D} ctx - The canvas context
     * @param {string} text - The text to render
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Object} options - Shadow options
     */
    applyDetailed3DShadow(ctx, text, x, y, options) {
        // Convert colors to rgba
        const primaryColor = this.hexToRgba(options.primaryColor, options.primaryOpacity / 100);
        const secondaryColor = this.hexToRgba(options.secondaryColor, options.secondaryOpacity / 100);
        
        // Save the current context state
        ctx.save();

        // --- Draw Secondary Outline FIRST ---
        const secondaryOutlineWidth = options.secondaryWidth || 4;
        
        // Draw the secondary outline at original position (before any other layers)
        ctx.lineWidth = secondaryOutlineWidth;
        ctx.strokeStyle = secondaryColor;
        ctx.strokeText(text, x, y);
        // --- End Secondary Outline ---


        // Calculate the total offset for the primary shadow (main extrusion)
        const totalOffset = this.calculateOffset(options.offset, options.angle);
        
        // Create a much smoother extrusion effect with more steps (for primary shadow)
        const steps = Math.max(50, Math.floor(options.offset));
        
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
            ctx.fillText(text, x + currentOffset.x, y + currentOffset.y);
            
            // Apply outline to EACH shadow step, exactly like Block Shadow
            // This makes the outline surround each layer of the extrusion
            if (options.outlineWidth > 0) {
                ctx.lineWidth = options.outlineWidth;
                ctx.strokeStyle = primaryColor;
                ctx.strokeText(text, x + currentOffset.x, y + currentOffset.y);
            }
        }
        
        // Add blur effect to the primary shadow if specified
        if (options.blur > 0) {
            ctx.save();
            ctx.shadowColor = primaryColor;
            ctx.shadowBlur = options.blur;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            // Draw a final shadow layer at the maximum offset
            ctx.fillStyle = primaryColor;
            ctx.fillText(text, x + totalOffset.x, y + totalOffset.y);
            
            if (options.outlineWidth > 0) {
                ctx.lineWidth = options.outlineWidth;
                ctx.strokeStyle = primaryColor;
                ctx.strokeText(text, x + totalOffset.x, y + totalOffset.y);
            }
            
            ctx.restore();
        }
        
        // Apply the outline to the main text (at the original position)
        // This ensures the text itself has an outline with the primary color
        if (options.outlineWidth > 0) {
            ctx.lineWidth = options.outlineWidth;
            ctx.strokeStyle = primaryColor;
            ctx.strokeText(text, x, y);
        }
        
        // Restore the original context state
        ctx.restore();

        // No need to return secondary outline info anymore
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
}

// Create a global instance of ShadingEffects
const shadingEffects = new ShadingEffects();

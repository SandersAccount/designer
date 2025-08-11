/**
 * TextRenderer Module
 * Handles all text rendering operations for the AdvancedTextMode
 */

class TextRenderer {
    constructor(textMode) {
        this.textMode = textMode;
        this.canvas = textMode.canvas;
        this.ctx = textMode.ctx;
    }

    // Main rendering method
    redrawAll() {
        console.log('🎨 REDRAWING CANVAS');

        // Clear canvas with proper high-DPI scaling preservation
        this.ctx.save();

        // Get the current scale factor (preserve high-DPI scaling)
        const transform = this.ctx.getTransform();
        const scaleFactor = transform.a; // Get the current scale factor

        // Reset transform to clear properly, but maintain the scale
        this.ctx.setTransform(scaleFactor, 0, 0, scaleFactor, 0, 0);

        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width / scaleFactor, this.canvas.height / scaleFactor);

        this.ctx.restore();
        
        // Draw background image if it exists
        this.drawBackgroundImage();
        
        // Draw all text elements in layer order (bottom to top)
        // We need to reverse the layers array since it's stored top to bottom
        console.log(`🎨 Drawing ${this.textMode.texts.length} text elements`);
        for (let i = 0; i < this.textMode.texts.length; i++) {
            const text = this.textMode.texts[i];
            console.log(`🎨 Text ${i}: "${text.text}" at position (${text.x}, ${text.y})`);
            if (text.layer && text.layer.visible) {
                this.drawText(text, this.textMode.selectedText === text);
                console.log(`🎨 Drew text "${text.text}"`);
            } else {
                console.log(`🎨 Skipped invisible text "${text.text}"`);
            }
        }
        
        // Draw selection outline for selected text
        if (this.textMode.selectedText) {
            console.log(`🎨 Drawing selection outline for "${this.textMode.selectedText.text}" at (${this.textMode.selectedText.x}, ${this.textMode.selectedText.y})`);
            this.drawSelectionOutline(this.textMode.selectedText);
        }
    }
    
    // Draw a text object
    drawText(text) {
        if (!text || !text.text) {
            console.error('%c📝 TEXT RENDER: Cannot draw text - missing text object or content', 'background-color: #500; color: #fee;');
            return;
        }
        
        console.log('%c📝 TEXT RENDER: Drawing text', 'background-color: #335; color: #afa;', text.text);
        
        const ctx = this.ctx;
        const textX = text.x || 0;
        const textY = text.y || 0;
        
        // Save context state
        ctx.save();
        
        // Apply font
        ctx.font = text.font || '24px Arial';
        console.log('%c📝 TEXT RENDER: Applied font', 'background-color: #335; color: #afa;', ctx.font);
        
        // Measure text dimensions
        const textMetrics = ctx.measureText(text.text);
        const textWidth = textMetrics.width;
        const fontSize = parseInt(text.font);
        const textHeight = fontSize * 1.2; // Approximate height
        
        console.log('%c📝 TEXT RENDER: Text metrics', 'background-color: #335; color: #afa;', {
            width: textWidth,
            height: textHeight,
            metrics: textMetrics
        });
        
        // Translate to text position
        ctx.translate(textX, textY);
        
        // Apply transformations
        if (text.scale && text.scale !== 1) {
            ctx.scale(text.scale, text.scale);
            console.log('%c📝 TEXT RENDER: Applied scale', 'background-color: #335; color: #afa;', text.scale);
        }
        
        if (text.rotation && text.rotation !== 0) {
            ctx.rotate(text.rotation * Math.PI / 180);
            console.log('%c📝 TEXT RENDER: Applied rotation', 'background-color: #335; color: #afa;', `${text.rotation}°`);
        }
        
        // Set text alignment
        ctx.textAlign = text.textAlign || 'left';
        ctx.textBaseline = text.textBaseline || 'top';
        console.log('%c📝 TEXT RENDER: Set alignment', 'background-color: #335; color: #afa;', {
            align: ctx.textAlign,
            baseline: ctx.textBaseline
        });
        
        // Calculate text bounds for gradient
        const bounds = {
            x: 0,
            y: 0,
            width: textWidth,
            height: textHeight
        };
        
        // Set the fill style based on fillType
        if (text.fillType === 'gradient' && text.gradientStops && text.gradientStops.length > 0) {
            console.log('%c📝 TEXT RENDER: Using gradient fill', 'background-color: #335; color: #afa;');
            this.applyGradientFill(ctx, text, bounds);
        } else {
            // Default to solid color
            console.log('%c📝 TEXT RENDER: Using solid fill', 'background-color: #335; color: #afa;', text.color);
            ctx.fillStyle = text.color || '#000000';
        }
        
        // Apply shadow if specified
        if (text.shadow) {
            ctx.shadowColor = text.shadowColor || 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = text.shadowBlur || 5;
            ctx.shadowOffsetX = text.shadowOffsetX || 2;
            ctx.shadowOffsetY = text.shadowOffsetY || 2;
            console.log('%c📝 TEXT RENDER: Applied shadow', 'background-color: #335; color: #afa;', {
                color: ctx.shadowColor,
                blur: ctx.shadowBlur,
                offsetX: ctx.shadowOffsetX,
                offsetY: ctx.shadowOffsetY
            });
        }
        
        // Draw text
        ctx.fillText(text.text, 0, 0);
        console.log('%c📝 TEXT RENDER: Filled text', 'background-color: #335; color: #afa;');
        
        // Add stroke if specified
        if (text.stroke) {
            ctx.strokeStyle = text.strokeColor || '#000000';
            ctx.lineWidth = text.strokeWidth || 1;
            ctx.strokeText(text.text, 0, 0);
            console.log('%c📝 TEXT RENDER: Added stroke', 'background-color: #335; color: #afa;', {
                color: ctx.strokeStyle,
                width: ctx.lineWidth
            });
        }
        
        // Restore context
        ctx.restore();
        console.log('%c📝 TEXT RENDER: Finished drawing text', 'background-color: #335; color: #afa;', text.text);
    }
    
    // Apply gradient fill to context
    applyGradientFill(ctx, text, bounds) {
        // Detailed debug info
        console.log('%c🎨 GRADIENT FILL: Starting application', 'background-color: #335; color: #aff; font-weight: bold;');
        console.log('%c Text object:', 'font-weight: bold;', {
            fillType: text.fillType,
            gradientType: text.gradientType,
            gradientStops: JSON.stringify(text.gradientStops)
        });
        console.log('%c Bounds:', 'font-weight: bold;', bounds);
        
        // Check if we have the necessary data
        if (!text || !text.gradientStops || text.gradientStops.length < 2) {
            console.error('%c🎨 GRADIENT FILL: Missing gradient data!', 'background-color: #500; color: #fee;', {
                text: text ? text.text : 'No text object',
                gradientStops: text ? JSON.stringify(text.gradientStops) : 'No gradient stops'
            });
            
            // Fallback to solid fill
            ctx.fillStyle = text.color || '#ff0000';
            return false;
        }
        
        // Sort stops by offset to ensure proper gradient rendering
        const sortedStops = [...text.gradientStops].sort((a, b) => a.offset - b.offset);
        
        console.log('%c🎨 GRADIENT FILL: Sorted stops', 'background-color: #335; color: #aff;', 
            JSON.stringify(sortedStops));
        
        // Create the appropriate gradient
        let gradient;
        
        try {
            // NEW HIGH-RESOLUTION APPROACH: Use text metrics for accurate gradient sizing
            // This matches the working canvas-test.html implementation
            if (text.gradientType === 'radial') {
                // Create radial gradient centered on text position
                const textMetrics = ctx.measureText(text.text);
                const textWidth = textMetrics.width;
                const radius = textWidth / 2;

                console.log('%c🎨 GRADIENT FILL: Creating radial gradient (NEW APPROACH)', 'background-color: #335; color: #aff;', {
                    centerX: text.x,
                    centerY: text.y,
                    radius: radius,
                    textWidth: textWidth
                });

                gradient = ctx.createRadialGradient(text.x, text.y, 0, text.x, text.y, radius);
            } else {
                // Create linear gradient across the text width
                const textMetrics = ctx.measureText(text.text);
                const textWidth = textMetrics.width;

                console.log('%c🎨 GRADIENT FILL: Creating linear gradient (NEW APPROACH)', 'background-color: #335; color: #aff;', {
                    startX: text.x - textWidth/2,
                    startY: text.y,
                    endX: text.x + textWidth/2,
                    endY: text.y,
                    textWidth: textWidth
                });

                gradient = ctx.createLinearGradient(
                    text.x - textWidth/2, text.y,
                    text.x + textWidth/2, text.y
                );
            }
            
            // Add color stops
            let stopCount = 0;
            let validStops = true;
            sortedStops.forEach(stop => {
                if (typeof stop.offset !== 'number' || isNaN(stop.offset)) {
                    console.error('%c🎨 GRADIENT FILL: Invalid offset', 'background-color: #500; color: #fee;', stop);
                    validStops = false;
                    return;
                }
                
                if (!stop.color) {
                    console.error('%c🎨 GRADIENT FILL: Missing color', 'background-color: #500; color: #fee;', stop);
                    validStops = false;
                    return;
                }
                
                try {
                    gradient.addColorStop(stop.offset, stop.color);
                    stopCount++;
                    console.log('%c🎨 GRADIENT FILL: Added stop', 'background-color: #335; color: #aff;', {
                        offset: stop.offset,
                        color: stop.color
                    });
                } catch (e) {
                    console.error('%c🎨 GRADIENT FILL: Error adding color stop', 'background-color: #500; color: #fee;', {
                        error: e.message,
                        stop
                    });
                    validStops = false;
                }
            });
            
            // If we couldn't add any valid stops, fall back to solid color
            if (stopCount < 2 || !validStops) {
                console.error('%c🎨 GRADIENT FILL: Insufficient valid stops', 'background-color: #500; color: #fee;', {
                    stopCount,
                    validStops
                });
                ctx.fillStyle = text.color || '#ff0000';
                return false;
            }
            
            // Apply the gradient
            ctx.fillStyle = gradient;
            console.log('%c🎨 GRADIENT FILL: Successfully applied gradient with NEW HIGH-RESOLUTION APPROACH', 'background-color: #335; color: #aff;');
            return true;
            
        } catch (e) {
            console.error('%c🎨 GRADIENT FILL: Failed to create gradient', 'background-color: #500; color: #fee;', {
                error: e.message,
                stack: e.stack
            });
            
            // Fallback to solid fill
            ctx.fillStyle = text.color || '#ff0000';
            return false;
        }
    }
    
    // Apply pattern fill
    applyPatternFill(text) {
        // Default to solid color if pattern is not available
        this.ctx.fillStyle = text.color || '#000000';
        
        if (text.patternImage) {
            const img = new Image();
            img.src = text.patternImage;
            
            if (img.complete) {
                const pattern = this.ctx.createPattern(img, 'repeat');
                this.ctx.fillStyle = pattern;
            }
        }
        
        if (text.stroke) {
            this.ctx.strokeStyle = text.strokeColor || '#000000';
            this.ctx.lineWidth = text.strokeWidth || 1;
        }
    }
    
    // Draw text background
    drawTextBackground(text, textWidth, lineHeight) {
        // Set background properties
        this.ctx.fillStyle = text.backgroundColor || 'rgba(0,0,0,0.3)';
        
        // Calculate padding
        const padding = text.backgroundPadding || 10;
        
        // Draw rounded rectangle background
        this.roundRect(
            -padding, 
            -lineHeight + padding/2, 
            textWidth + padding * 2, 
            lineHeight + padding,
            text.backgroundRadius || 5
        );
        
        this.ctx.fill();
    }
    
    // Draw 3D text effect
    drawTextThreeD(text) {
        const depth = text.threeDDepth || 5;
        const color = text.threeDColor || '#000000';
        const originalFillStyle = this.ctx.fillStyle;
        
        // Save the fill style for the main text
        const mainFillStyle = this.ctx.fillStyle;
        
        // Set the fill style for the 3D effect
        this.ctx.fillStyle = color;
        
        // Draw the 3D effect by creating multiple offset copies
        for (let i = 1; i <= depth; i++) {
            this.ctx.save();
            this.ctx.translate(i, i);
            this.ctx.fillText(text.text, 0, 0);
            this.ctx.restore();
        }
        
        // Restore the original fill style for the main text
        this.ctx.fillStyle = mainFillStyle;
    }
    
    // Apply text distortion effects
    applyTextDistortion(text, textWidth, lineHeight) {
        const distortionType = text.distortionType;
        const intensity = text.distortionIntensity || 10;
        
        switch (distortionType) {
            case 'wave':
                this.applyWaveDistortion(text, intensity);
                break;
            case 'perspective':
                this.applyPerspectiveDistortion(text, intensity);
                break;
            case 'bulge':
                this.applyBulgeDistortion(text, intensity);
                break;
            default:
                // Default rendering if distortion type is not recognized
                this.drawTextContent(text);
                break;
        }
    }
    
    // Apply wave distortion
    applyWaveDistortion(text, intensity) {
        const chars = text.text.split('');
        const frequency = text.distortionFrequency || 1;
        
        let xPos = 0;
        chars.forEach((char) => {
            const charWidth = this.ctx.measureText(char).width;
            
            // Calculate y offset based on sine wave
            const yOffset = Math.sin(xPos * frequency * 0.1) * intensity;
            
            this.ctx.save();
            this.ctx.translate(xPos, yOffset);
            
            // Draw the character
            this.drawSingleChar(text, char);
            
            this.ctx.restore();
            
            // Move to the next character position
            xPos += charWidth;
        });
    }
    
    // Apply perspective distortion
    applyPerspectiveDistortion(text, intensity) {
        const chars = text.text.split('');
        const textWidth = this.ctx.measureText(text.text).width;
        
        let xPos = 0;
        chars.forEach((char, index) => {
            const charWidth = this.ctx.measureText(char).width;
            
            // Calculate scale based on position
            const position = xPos / textWidth; // 0 to 1
            const scale = 1 - (position - 0.5) * (intensity / 50);
            
            this.ctx.save();
            this.ctx.translate(xPos, 0);
            this.ctx.scale(scale, scale);
            
            // Draw the character
            this.drawSingleChar(text, char);
            
            this.ctx.restore();
            
            // Move to the next character position
            xPos += charWidth;
        });
    }
    
    // Apply bulge distortion
    applyBulgeDistortion(text, intensity) {
        const chars = text.text.split('');
        const textWidth = this.ctx.measureText(text.text).width;
        
        let xPos = 0;
        chars.forEach((char, index) => {
            const charWidth = this.ctx.measureText(char).width;
            
            // Calculate position relative to center (range -1 to 1)
            const position = (xPos + charWidth/2) / textWidth * 2 - 1;
            
            // Calculate scale with max at center
            const scale = 1 + (1 - position * position) * (intensity / 100);
            
            this.ctx.save();
            this.ctx.translate(xPos, 0);
            this.ctx.scale(scale, scale);
            
            // Draw the character
            this.drawSingleChar(text, char);
            
            this.ctx.restore();
            
            // Move to the next character position
            xPos += charWidth;
        });
    }
    
    // Draw a single character (helper for distortion effects)
    drawSingleChar(text, char) {
        if (text.stroke) {
            this.ctx.strokeText(char, 0, 0);
        }
        this.ctx.fillText(char, 0, 0);
    }
    
    // Draw basic text content
    drawTextContent(text) {
        // Draw the text
        if (text.stroke) {
            this.ctx.strokeText(text.text, 0, 0);
        }
        
        this.ctx.fillText(text.text, 0, 0);
    }
    
    // Helper function to draw rounded rectangles
    roundRect(x, y, width, height, radius) {
        if (typeof radius === 'undefined') {
            radius = 5;
        }
        
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }
    
    // Draw background image with proper scaling and positioning
    drawBackgroundImage() {
        if (this.textMode.backgroundImage) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.5; // Semi-transparent background
            this.ctx.drawImage(
                this.textMode.backgroundImage,
                this.textMode.imageX,
                this.textMode.imageY,
                this.textMode.backgroundImage.width * this.textMode.imageScale,
                this.textMode.backgroundImage.height * this.textMode.imageScale
            );
            this.ctx.restore();
        }
    }
    
    // Draw selection outline around selected text
    drawSelectionOutline(text) {
        if (!text || !this.textMode.showSelectionMarkers) return;
        
        const textWidth = this.getTextWidth(text);
        const lineHeight = this.getTextLineHeight(text);
        
        // Save context state
        this.ctx.save();
        
        // Translate to text position
        this.ctx.translate(text.x, text.y);
        
        // Rotate if needed
        if (text.angle) {
            this.ctx.rotate(text.angle * Math.PI / 180);
        }
        
        // Apply skew if needed
        if (text.skewX || text.skewY) {
            this.ctx.transform(1, text.skewY ? text.skewY / 100 : 0, text.skewX ? text.skewX / 100 : 0, 1, 0, 0);
        }
        
        // Calculate text position adjustments based on text alignment
        let xOffset = 0;
        if (text.textAlign === 'center') {
            xOffset = -textWidth / 2;
        } else if (text.textAlign === 'right') {
            xOffset = -textWidth;
        }
        
        // Draw selection box
        this.ctx.strokeStyle = '#1e90ff';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 2]);
        this.ctx.strokeRect(
            xOffset - 5,
            -lineHeight / 2 - 5,
            textWidth + 10,
            lineHeight + 10
        );
        
        // Draw selection handles (8 handles)
        this.drawSelectionHandles(text, textWidth, lineHeight, xOffset);
        
        // Restore context
        this.ctx.restore();
    }
    
    // Draw the selection handles for transforming text
    drawSelectionHandles(text, textWidth, lineHeight, xOffset = 0) {
        if (!text || !this.textMode.showSelectionMarkers) return;
        
        // Calculate positions if not provided
        if (!textWidth) textWidth = this.getTextWidth(text);
        if (!lineHeight) lineHeight = this.getTextLineHeight(text);
        
        // If text is center aligned, offset the handles
        if (text.textAlign === 'center' && xOffset === 0) {
            xOffset = -textWidth / 2;
        } else if (text.textAlign === 'right' && xOffset === 0) {
            xOffset = -textWidth;
        }
        
        // Define handle positions (relative to text center)
        const handles = [
            { x: xOffset - 5, y: -lineHeight / 2 - 5, cursor: 'nwse-resize', action: 'tl' }, // Top-left
            { x: xOffset + textWidth / 2, y: -lineHeight / 2 - 5, cursor: 'ns-resize', action: 'tm' }, // Top-middle
            { x: xOffset + textWidth + 5, y: -lineHeight / 2 - 5, cursor: 'nesw-resize', action: 'tr' }, // Top-right
            { x: xOffset + textWidth + 5, y: 0, cursor: 'ew-resize', action: 'mr' }, // Middle-right
            { x: xOffset + textWidth + 5, y: lineHeight / 2 + 5, cursor: 'nwse-resize', action: 'br' }, // Bottom-right
            { x: xOffset + textWidth / 2, y: lineHeight / 2 + 5, cursor: 'ns-resize', action: 'bm' }, // Bottom-middle
            { x: xOffset - 5, y: lineHeight / 2 + 5, cursor: 'nesw-resize', action: 'bl' }, // Bottom-left
            { x: xOffset - 5, y: 0, cursor: 'ew-resize', action: 'ml' }, // Middle-left
            { x: xOffset + textWidth + 20, y: 0, cursor: 'move', action: 'rotate' } // Rotation handle
        ];
        
        // Draw handles
        this.ctx.fillStyle = '#ffffff';
        this.ctx.strokeStyle = '#1e90ff';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([]);
        
        handles.forEach(handle => {
            // Draw handle circle or square
            if (handle.action === 'rotate') {
                // Draw rotation handle with a line connecting to the text
                this.ctx.beginPath();
                this.ctx.moveTo(xOffset + textWidth + 5, 0);
                this.ctx.lineTo(handle.x, handle.y);
                this.ctx.stroke();
                
                this.ctx.beginPath();
                this.ctx.arc(handle.x, handle.y, 4, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
            } else {
                // Draw transform handle
                this.ctx.fillRect(handle.x - 3, handle.y - 3, 6, 6);
                this.ctx.strokeRect(handle.x - 3, handle.y - 3, 6, 6);
            }
        });
        
        // Store handle info in the text mode for interaction
        this.textMode.transformHandles = handles;
    }
    
    // Special rendering for export (without selection outlines)
    renderForExport(targetCtx) {
        // Save the original context
        const originalCtx = this.ctx;
        const originalSelectedText = this.textMode.selectedText;
        
        // Use the target context
        this.ctx = targetCtx;
        this.textMode.selectedText = null; // Temporarily clear selection
        
        // Draw everything - clear with high-DPI preservation
        this.ctx.save();
        const transform = this.ctx.getTransform();
        const scaleFactor = transform.a;
        this.ctx.setTransform(scaleFactor, 0, 0, scaleFactor, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width / scaleFactor, this.canvas.height / scaleFactor);
        this.ctx.restore();
        this.drawBackgroundImage();
        
        // Draw all text elements in layer order
        for (let i = 0; i < this.textMode.texts.length; i++) {
            const text = this.textMode.texts[i];
            if (text.layer && text.layer.visible) {
                this.drawText(text);
            }
        }
        
        // Restore the original context and selection
        this.ctx = originalCtx;
        this.textMode.selectedText = originalSelectedText;
    }
    
    // Get the width of text with all current styles applied
    getTextWidth(text) {
        // Save the current context state
        this.ctx.save();
        
        // Apply text styles
        this.ctx.font = text.font;
        
        // Measure text
        const metrics = this.ctx.measureText(text.text);
        const width = metrics.width;
        
        // Restore context state
        this.ctx.restore();
        
        return width;
    }
    
    // Get line height based on font size
    getTextLineHeight(text) {
        // Extract the font size from the font string
        const fontSize = parseInt(text.font);
        // Use a standard line height multiplier (adjust as needed)
        return fontSize * 1.2;
    }
    
    // Set font properties
    setFontProperties(text) {
        this.ctx.font = text.font;
    }
    
    // Apply transformation
    applyTransformation(text) {
        // Move to text position and rotate
        this.ctx.translate(text.x, text.y);
        this.ctx.rotate((text.angle || 0) * Math.PI / 180);
        
        // Apply skew if present
        if (text.skewX || text.skewY) {
            this.ctx.transform(1, text.skewY ? text.skewY / 100 : 0, text.skewX ? text.skewX / 100 : 0, 1, 0, 0);
        }
    }
    
    // Set text alignment
    setTextAlignment(text) {
        this.ctx.textAlign = text.textAlign || 'left';
        this.ctx.textBaseline = 'middle';
    }
    
    // Apply shadow
    applyShadow(text) {
        this.ctx.shadowColor = text.shadowColor || 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = text.shadowBlur || 5;
        this.ctx.shadowOffsetX = text.shadowOffsetX || 2;
        this.ctx.shadowOffsetY = text.shadowOffsetY || 2;
    }
    
    // Draw selection box
    drawSelectionBox(text, textWidth, textHeight) {
        this.ctx.strokeStyle = '#1e90ff';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 2]);
        this.ctx.strokeRect(
            -5,
            -textHeight / 2 - 5,
            textWidth + 10,
            textHeight + 10
        );
    }
}

export default TextRenderer;

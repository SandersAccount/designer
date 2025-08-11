/**
 * TextEffects Module
 * Handles text effects and transformations for the AdvancedTextMode
 */

class TextEffects {
    constructor(textMode) {
        this.textMode = textMode;
        this.canvas = textMode.canvas;
        this.ctx = textMode.ctx;
    }
    
    // Apply skew transformation to text
    applySkew(text, skewX, skewY) {
        if (!text) return;
        
        // Update text properties
        text.skewX = skewX;
        text.skewY = skewY;
        
        // Redraw the canvas
        this.textMode.renderer.redrawAll();
    }
    
    // Apply bend/curve to text
    applyBend(text, bendValue) {
        if (!text) return;
        
        // Update text property
        text.bend = bendValue;
        
        // Redraw the canvas
        this.textMode.renderer.redrawAll();
    }
    
    // Apply distortion effect to text
    applyDistortion(text, type, intensity, frequency = 1) {
        if (!text) return;
        
        // Update text properties
        text.distort = {
            type: type,
            intensity: intensity,
            frequency: frequency
        };
        
        // Redraw the canvas
        this.textMode.renderer.redrawAll();
    }
    
    // Apply gradient fill to text
    applyGradientFill(text, gradientType, stops) {
        if (!text) return;
        
        // Update text properties
        text.fillType = 'gradient';
        text.gradientType = gradientType;
        text.gradientStops = stops || [
            { offset: 0, color: text.color },
            { offset: 1, color: '#ffffff' }
        ];
        
        // Clear gradient cache for this text
        const cacheKey = JSON.stringify({
            type: text.gradientType,
            stops: text.gradientStops
        });
        this.textMode.gradientCache.delete(cacheKey);
        
        // Redraw the canvas
        this.textMode.renderer.redrawAll();
    }
    
    // Apply pattern fill to text
    applyPatternFill(text, patternUrl) {
        if (!text) return;
        
        // Create a pattern from an image
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        
        img.onload = () => {
            const pattern = this.ctx.createPattern(img, 'repeat');
            
            // Update text properties
            text.fillType = 'pattern';
            text.pattern = pattern;
            
            // Redraw the canvas
            this.textMode.renderer.redrawAll();
        };
        
        img.src = patternUrl;
    }
    
    // Apply shadow effect to text
    applyShadow(text, enabled, color, blur, offsetX, offsetY) {
        if (!text) return;
        
        // Update text properties
        text.shadow = {
            enabled: enabled,
            color: color || 'rgba(0,0,0,0.5)',
            blur: blur || 5,
            offsetX: offsetX || 3,
            offsetY: offsetY || 3
        };
        
        // Redraw the canvas
        this.textMode.renderer.redrawAll();
    }
    
    // Apply outline effect to text
    applyOutline(text, enabled, color, width) {
        if (!text) return;
        
        // Update text properties
        text.outline = {
            enabled: enabled,
            color: color || '#000000',
            width: width || 2
        };
        
        // Redraw the canvas
        this.textMode.renderer.redrawAll();
    }
    
    // Apply 3D effect to text
    apply3DEffect(text, enabled, depth, color) {
        if (!text) return;
        
        // Update text properties
        text.threeD = {
            enabled: enabled,
            depth: depth || 5,
            color: color || '#000000'
        };
        
        // Redraw the canvas
        this.textMode.renderer.redrawAll();
    }
    
    // Apply text background
    applyBackground(text, enabled, color, padding, rounded, radius) {
        if (!text) return;
        
        // Update text properties
        text.background = {
            enabled: enabled,
            color: color || 'rgba(0,0,0,0.3)',
            padding: padding || 10,
            rounded: rounded !== undefined ? rounded : true,
            radius: radius || 5
        };
        
        // Redraw the canvas
        this.textMode.renderer.redrawAll();
    }
    
    // Apply letter spacing to text
    applyLetterSpacing(text, spacing) {
        if (!text) return;
        
        // Update text property
        text.letterSpacing = spacing;
        
        // Redraw the canvas
        this.textMode.renderer.redrawAll();
    }
    
    // Apply text stroke
    applyStroke(text, width, color) {
        if (!text) return;
        
        // Update text properties
        text.strokeWidth = width;
        text.strokeColor = color || '#000000';
        
        // Redraw the canvas
        this.textMode.renderer.redrawAll();
    }
    
    // Change text alignment
    applyTextAlign(text, align) {
        if (!text) return;
        
        // Update text property
        text.textAlign = align;
        
        // Redraw the canvas
        this.textMode.renderer.redrawAll();
    }
    
    // Apply font style (bold, italic)
    applyFontStyle(text, isBold, isItalic) {
        if (!text) return;
        
        // Update text properties
        text.isBold = isBold;
        text.isItalic = isItalic;
        
        // Redraw the canvas
        this.textMode.renderer.redrawAll();
    }
    
    // Apply layer blend mode
    applyBlendMode(text, blendMode) {
        if (!text || !text.layer) return;
        
        // Update layer property
        text.layer.blendMode = blendMode;
        
        // Redraw the canvas
        this.textMode.renderer.redrawAll();
    }
    
    // Apply layer opacity
    applyOpacity(text, opacity) {
        if (!text || !text.layer) return;
        
        // Update layer property
        text.layer.opacity = opacity;
        
        // Redraw the canvas
        this.textMode.renderer.redrawAll();
    }
    
    // Apply text transformation
    applyTransformation(text, x, y, angle) {
        if (!text) return;
        
        // Update text properties
        if (x !== undefined) text.x = x;
        if (y !== undefined) text.y = y;
        if (angle !== undefined) text.angle = angle;
        
        // Redraw the canvas
        this.textMode.renderer.redrawAll();
    }
    
    // Apply a preset combination of effects
    applyEffectPreset(text, presetName) {
        if (!text) return;
        
        const presets = {
            'neon': () => {
                this.applyShadow(text, true, '#00ffff', 15, 0, 0);
                this.applyStroke(text, 3, '#ff00ff');
                text.color = '#ffffff';
            },
            'retro': () => {
                this.apply3DEffect(text, true, 8, '#880000');
                this.applyStroke(text, 2, '#ffcc00');
                text.color = '#ff4400';
            },
            'chrome': () => {
                this.applyGradientFill(text, 'linear', [
                    { offset: 0, color: '#ffffff' },
                    { offset: 0.5, color: '#aaaaaa' },
                    { offset: 1, color: '#dddddd' }
                ]);
                this.applyShadow(text, true, 'rgba(0,0,0,0.5)', 5, 2, 2);
                this.applyStroke(text, 1, '#666666');
            },
            'comic': () => {
                this.applyStroke(text, 4, '#000000');
                this.applyShadow(text, true, 'rgba(0,0,0,0.3)', 2, 3, 3);
                text.color = '#ffff00';
            },
            'graffiti': () => {
                this.applyGradientFill(text, 'linear', [
                    { offset: 0, color: '#ff0000' },
                    { offset: 0.5, color: '#ffff00' },
                    { offset: 1, color: '#ff00ff' }
                ]);
                this.applyStroke(text, 5, '#000000');
                this.applyShadow(text, true, 'rgba(0,0,0,0.7)', 10, 5, 5);
                this.applyDistortion(text, 'wave', 10, 1);
            }
        };
        
        // Apply the preset if it exists
        if (presets[presetName]) {
            presets[presetName]();
            this.textMode.renderer.redrawAll();
        }
    }
}

export default TextEffects;

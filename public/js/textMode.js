class TextMode {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.texts = [];
        this.images = []; // Array to hold image objects
        this.selectedText = null;
        this.selectedImage = null; // Track selected image
        this.isDragging = false;
        this.lastX = 0;
        this.lastY = 0;
        this.textStartX = 0; // Re-used for image start X
        this.textStartY = 0; // Re-used for image start Y
        this.isColorPicking = false;
        this.colorPickCallback = null;
        this.onTextSelected = null;
        this.originalImageData = null; // No longer used for background image, but kept for potential other uses

        // Text effect types
        this.TEXT_EFFECT = {
            NONE: 'none',
            CURVING: 'curving',
            CIRCULAR: 'circular',
            SKEW: 'skew',
            PERSPECTIVE: 'perspective'
        };
    }

    setupHighDPICanvas() {
        // Get the display size (CSS size) - this should be set by the container
        const displayWidth = this.canvas.clientWidth || 2048;
        const displayHeight = this.canvas.clientHeight || 2048;

        // Get device pixel ratio for high-DPI displays
        const devicePixelRatio = window.devicePixelRatio || 1;

        // Quality multiplier for even higher quality (like our test)
        const qualityMultiplier = 2; // 2x quality for crisp text
        const totalScale = devicePixelRatio * qualityMultiplier;

        console.log(`🔧 [HIGH-DPI] Display size: ${displayWidth}x${displayHeight}`);
        console.log(`🔧 [HIGH-DPI] Device pixel ratio: ${devicePixelRatio}`);
        console.log(`🔧 [HIGH-DPI] Quality multiplier: ${qualityMultiplier}x`);
        console.log(`🔧 [HIGH-DPI] Total scale factor: ${totalScale}`);

        // Store the scale factor on the canvas for later use
        this.canvas.scaleFactor = totalScale;

        // Reset any existing transformations
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Set the actual canvas size in memory (scaled up for higher quality)
        this.canvas.width = displayWidth * totalScale;
        this.canvas.height = displayHeight * totalScale;
        console.log(`🔧 [HIGH-DPI] Canvas memory size: ${this.canvas.width}x${this.canvas.height}`);

        // Set the display size (CSS size) - keep the original display size
        this.canvas.style.width = displayWidth + 'px';
        this.canvas.style.height = displayHeight + 'px';
        console.log(`🔧 [HIGH-DPI] Canvas CSS size: ${this.canvas.style.width} x ${this.canvas.style.height}`);

        // Scale the context to match the device pixel ratio and quality
        this.ctx.scale(totalScale, totalScale);
        console.log(`🔧 [HIGH-DPI] Applied scale transform: ${totalScale}`);

        // Enable high-quality rendering
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        this.ctx.textRenderingOptimization = 'optimizeQuality';

        console.log(`🔧 [HIGH-DPI] High-DPI canvas setup complete`);
    }

    initialize() {
        // Set up high-DPI canvas rendering
        this.setupHighDPICanvas();

        // Image loading is handled in text-editor.html using the proxy.

        // Add event listeners
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this));
        this.canvas.addEventListener('click', this.handleClick.bind(this));
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' || e.key === 'Backspace') { // Added Backspace
                if (this.selectedText) {
                    this.deleteSelectedText();
                    if (window.showToast) {
                        window.showToast('Text deleted');
                    }
                } else if (this.selectedImage) {
                    this.deleteSelectedImage(); // Call delete for image
                    if (window.showToast) {
                        window.showToast('Image deleted');
                    }
                }
            }
        });
        // Initial draw with background color
        this.redrawAll();
    }

    addText(text, x, y, font, color) {
        const newText = {
            id: Date.now(),
            text: text || 'Your Text Here',
            x: x !== undefined ? x : this.canvas.width / 2,
            y: y !== undefined ? y : this.canvas.height / 2,
            font: font || '24px Arial',
            color: color || '#000000',
            angle: 0,
            strokeWidth: 0,
            strokeColor: '#000000',
            letterSpacing: 0,
            bend: 0,
            skewX: 0,
            skewY: 0,
            originalTransform: null,
            isItalic: false,
            isBold: false,
            textAlign: 'center',

            // Text effect type
            effectType: this.TEXT_EFFECT.NONE,

            // Curving text properties
            curve: 0,
            offsetY: 0,
            bottom: 200,
            textHeight: 64,
            isTri: false,
            shiftAmount: 0,

            // Circular text properties
            diameter: 250,
            kerning: 0,
            flipped: false
        };

        this.texts.push(newText);
        this.selectText(newText); // Select the new text

        const textInput = document.getElementById('textInput');
        if (textInput) {
            textInput.value = newText.text;
        }

        // Also update the curving text input
        const iText = document.getElementById('iText');
        if (iText) {
            iText.value = newText.text;
        }

        // No redraw here, selectText calls it

        return newText;
    }

    selectText(text) {
        this.selectedText = text;
        this.selectedImage = null; // Deselect image
        const textInput = document.getElementById('textInput');
        if (textInput && text) {
            textInput.value = text.text;
        }

        // Also update the curving text input
        const iText = document.getElementById('iText');
        if (iText && text) {
            iText.value = text.text;
        }

        this.updateUIControls();
        if (this.onTextSelected && typeof this.onTextSelected === 'function') {
            this.onTextSelected(text);
        }
        this.redrawAll();
    }

    handleMouseDown(e) {
        if (this.isColorPicking) {
            return;
        }

        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        // Check for clicked text first (top layer)
        let clickedText = null;
        for (let i = this.texts.length - 1; i >= 0; i--) {
            const text = this.texts[i];
            if (this.isPointInText(x, y, text)) {
                clickedText = text;
                break;
            }
        }

        // Check for clicked image if no text was clicked
        let clickedImage = null;
        if (!clickedText) {
            for (let i = this.images.length - 1; i >= 0; i--) {
                const image = this.images[i];
                // TODO: Add rotation check to isPointInImage if needed
                if (this.isPointInImage(x, y, image)) {
                    clickedImage = image;
                    break;
                }
            }
        }

        if (clickedText) {
            this.selectText(clickedText); // This also deselects image
            this.isDragging = true;
            this.lastX = x;
            this.lastY = y;
            this.textStartX = clickedText.x;
            this.textStartY = clickedText.y;

            if (window.showToast) {
                window.showToast('Text selected');
            }
        } else if (clickedImage) {
            this.selectImage(clickedImage); // This also deselects text
            this.isDragging = true;
            this.lastX = x;
            this.lastY = y;
            this.textStartX = clickedImage.x; // Use same vars for image drag start
            this.textStartY = clickedImage.y;

            if (window.showToast) {
                window.showToast('Image selected');
            }
        } else {
            this.deselect(); // Clicked on empty space
        }
        this.redrawAll(); // Redraw needed to show selection change
    }


    handleMouseMove(e) {
        if (!this.isDragging) return;

        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        const deltaX = x - this.lastX;
        const deltaY = y - this.lastY;

        if (this.selectedText) {
            this.selectedText.x += deltaX;
            this.selectedText.y += deltaY;
        } else if (this.selectedImage) {
            this.selectedImage.x += deltaX;
            this.selectedImage.y += deltaY;
        }

        this.lastX = x;
        this.lastY = y;

        this.redrawAll();
    }

    handleMouseUp(e) {
        this.isDragging = false;
    }

    isPointInText(x, y, text) {
        // Basic bounding box check (doesn't account for rotation)
        // TODO: Implement rotation check if needed
        this.ctx.font = text.font;
        const metrics = this.ctx.measureText(text.text);
        const textWidth = metrics.width;
        const fontSize = parseInt(text.font); // Get font size for height approximation
        const textHeight = fontSize * 1.2; // Approximate height

        // Calculate bounds relative to text center (text.x, text.y)
        const left = text.x - textWidth / 2;
        const right = text.x + textWidth / 2;
        const top = text.y - textHeight / 2;
        const bottom = text.y + textHeight / 2;

        return x >= left && x <= right && y >= top && y <= bottom;
    }

    deleteSelectedText() {
        if (!this.selectedText) return false;

        const index = this.texts.findIndex(t => t.id === this.selectedText.id);
        if (index !== -1) {
            this.texts.splice(index, 1);
            this.selectedText = null;
            this.redrawAll();
            return true;
        }
        return false;
    }

    handleDoubleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        for (let i = this.texts.length - 1; i >= 0; i--) {
            const text = this.texts[i];
            if (this.isPointInText(x, y, text)) {
                this.selectText(text);

                const newContent = prompt('Edit text:', text.text);
                if (newContent !== null) { // Check if user cancelled prompt
                    this.updateSelectedText({
                        text: newContent
                    });

                    if (window.showToast) {
                        window.showToast('Text updated');
                    }
                }
                return; // Stop after handling one text
            }
        }
        // Could add double-click handling for images here if needed
    }

    calculateTextWidth(text) {
        this.ctx.font = text.font;
        const metrics = this.ctx.measureText(text.text);
        return metrics.width;
    }

    calculateTextHeight(text) {
        const fontSize = parseInt(text.font);
        return fontSize * 1.2; // Approximate height based on font size
    }

    redrawAll() {
        // Clear canvas with proper high-DPI scaling preservation
        this.ctx.save();

        // Get the current scale factor (preserve high-DPI scaling)
        const transform = this.ctx.getTransform();
        const scaleFactor = transform.a; // Get the current scale factor

        // Reset transform to clear properly, but maintain the scale
        this.ctx.setTransform(scaleFactor, 0, 0, scaleFactor, 0, 0);

        // Clear the canvas
        this.ctx.fillStyle = '#2a2a2a';
        this.ctx.fillRect(0, 0, this.canvas.width / scaleFactor, this.canvas.height / scaleFactor);

        this.ctx.restore();

        // Draw image objects from the array
        this.images.forEach(image => {
            this.ctx.save();
            this.ctx.translate(image.x, image.y);
            if (image.angle) {
                this.ctx.rotate(image.angle * Math.PI / 180);
            }
            // Draw image centered on its x, y coordinates
            this.ctx.drawImage(
                image.img,
                -image.width / 2,
                -image.height / 2,
                image.width,
                image.height
            );
            this.ctx.restore();
        });

        // Then draw all texts on top
        this.texts.forEach(text => {
            this.ctx.save();
            this.ctx.translate(text.x, text.y);
            if (text.skewX || text.skewY) {
                this.ctx.transform(1, text.skewY, text.skewX, 1, 0, 0);
            }
            if (text.angle) {
                this.ctx.rotate(text.angle * Math.PI / 180);
            }
            this.drawTextWithOuterStroke(text, 0, 0, text.text);
            this.ctx.restore();
        });

        // Draw selection indicators (last, so they are on top)
        if (this.selectedText) {
            this.ctx.save();
            this.ctx.strokeStyle = '#00AAFF';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            const textWidth = this.calculateTextWidth(this.selectedText);
            const textHeight = this.calculateTextHeight(this.selectedText);
            this.ctx.translate(this.selectedText.x, this.selectedText.y);
            if (this.selectedText.angle) {
                this.ctx.rotate(this.selectedText.angle * Math.PI / 180);
            }
            this.ctx.strokeRect(-textWidth / 2 - 5, -textHeight / 2 - 5, textWidth + 10, textHeight + 10); // Slightly larger box
            // Add resize/rotate handles if needed
            this.ctx.restore();
        } else if (this.selectedImage) {
            this.ctx.save();
            this.ctx.strokeStyle = '#00AAFF';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.translate(this.selectedImage.x, this.selectedImage.y);
            if (this.selectedImage.angle) {
                this.ctx.rotate(this.selectedImage.angle * Math.PI / 180);
            }
            this.ctx.strokeRect(
                -this.selectedImage.width / 2 - 5,
                -this.selectedImage.height / 2 - 5,
                this.selectedImage.width + 10,
                this.selectedImage.height + 10
            );
            // Add resize/rotate handles if needed
            this.ctx.restore();
        }
    }


    drawTextWithOuterStroke(text, offsetX, offsetY, content) {
        this.ctx.font = text.font;
        this.ctx.textAlign = text.textAlign;
        this.ctx.textBaseline = 'middle';

        if (text.effectType === this.TEXT_EFFECT.CURVING && text.curve > 0) {
            this.renderCurvingText(text, content);
        }
        else if (text.effectType === this.TEXT_EFFECT.CIRCULAR) {
            this.renderCircularText(text, content);
        }
        else if (text.effectType === this.TEXT_EFFECT.PERSPECTIVE) {
            this.renderPerspectiveText(text, content);
        }
        else {
            // Standard rendering
            if (text.strokeWidth && text.strokeWidth > 0) {
                this.ctx.lineWidth = text.strokeWidth;
                this.ctx.strokeStyle = text.strokeColor;
                this.ctx.strokeText(content, offsetX, offsetY);
            }
            this.ctx.fillStyle = text.color;
            this.ctx.fillText(content, offsetX, offsetY);
        }
    }

    renderPerspectiveText(text, content) {
        // ... (implementation remains the same) ...
         const fontSize = parseInt(text.font);
        const perspectiveValue = text.perspective || 0;
        const resolutionMultiplier = 4;
        const os = document.createElement('canvas');
        const octx = os.getContext('2d');
        this.ctx.font = text.font;
        const metrics = this.ctx.measureText(content);
        const textWidth = metrics.width;
        const textHeight = fontSize * 1.2;
        os.width = textWidth * 3 * resolutionMultiplier;
        os.height = textHeight * 3 * resolutionMultiplier;
        const fontParts = text.font.split(' ');
        fontParts[0] = (fontSize * resolutionMultiplier) + 'px';
        const highResFontStyle = fontParts.join(' ');
        octx.font = highResFontStyle;
        octx.textAlign = 'center';
        octx.textBaseline = 'middle';
        if (text.strokeWidth && text.strokeWidth > 0) {
            octx.lineWidth = text.strokeWidth * resolutionMultiplier;
            octx.strokeStyle = text.strokeColor;
            octx.strokeText(content, os.width/2, os.height/2);
        }
        octx.fillStyle = text.color;
        octx.fillText(content, os.width/2, os.height/2);
        this.ctx.save();
        const leftScale = perspectiveValue < 0 ? 1 + Math.abs(perspectiveValue/10) : 1 - Math.abs(perspectiveValue/20);
        const rightScale = perspectiveValue > 0 ? 1 + Math.abs(perspectiveValue/10) : 1 - Math.abs(perspectiveValue/20);
        this.ctx.beginPath();
        this.ctx.moveTo(-textWidth/2, -textHeight/2);
        this.ctx.lineTo(textWidth/2, -textHeight/2);
        this.ctx.lineTo(textWidth/2 * rightScale, textHeight/2);
        this.ctx.lineTo(-textWidth/2 * leftScale, textHeight/2);
        this.ctx.closePath();
        const sourceX = os.width/2 - textWidth/2;
        const sourceY = os.height/2 - textHeight/2;
        const tlX = -textWidth/2;
        const tlY = -textHeight/2;
        const trX = textWidth/2;
        const trY = -textHeight/2;
        const brX = textWidth/2 * rightScale;
        const brY = textHeight/2;
        const blX = -textWidth/2 * leftScale;
        const blY = textHeight/2;
        const transformMatrix = this.getPerspectiveTransform(
            [sourceX, sourceY, sourceX + textWidth, sourceY, sourceX + textWidth, sourceY + textHeight, sourceX, sourceY + textHeight],
            [tlX, tlY, trX, trY, brX, brY, blX, blY]
        );
        this.ctx.transform(
            transformMatrix[0], transformMatrix[3],
            transformMatrix[1], transformMatrix[4],
            transformMatrix[2], transformMatrix[5]
        );
        this.ctx.drawImage(os, 0, 0);
        this.ctx.restore();
    }

    getPerspectiveTransform(source, destination) {
        // ... (implementation remains the same) ...
        const dx1 = destination[0], dy1 = destination[1], dx2 = destination[2], dy2 = destination[3];
        const dx3 = destination[4], dy3 = destination[5], dx4 = destination[6], dy4 = destination[7];
        const sx1 = source[0], sy1 = source[1], sx2 = source[2], sy2 = source[3];
        const sx3 = source[4], sy3 = source[5], sx4 = source[6], sy4 = source[7];
        const scaleX = (dx2 - dx1) / (sx2 - sx1);
        const skewX = (dx4 - dx1) / (sy4 - sy1);
        const translateX = dx1;
        const skewY = (dy2 - dy1) / (sx2 - sx1);
        const scaleY = (dy4 - dy1) / (sy4 - sy1);
        const translateY = dy1;
        return [scaleX, skewY, translateX, skewX, scaleY, translateY];
    }

    renderCurvingText(text, content) {
        // ... (implementation remains the same) ...
        const w = this.canvas.width, h = this.canvas.height;
        const curve = text.curve, offsetYVal = text.offsetY, textHeightVal = text.textHeight;
        const bottom = text.bottom, isTri = text.isTri, shiftAmount = text.shiftAmount || 0;
        let dltY, angleSteps = 180 / w, i = w, y;
        const resolutionMultiplier = 4;
        const os = document.createElement('canvas'), octx = os.getContext('2d');
        os.width = w * resolutionMultiplier; os.height = h * resolutionMultiplier;
        octx.textBaseline = 'top'; octx.textAlign = 'center';
        const fontSize = parseInt(text.font);
        const fontParts = text.font.split(' ');
        fontParts[0] = (fontSize * resolutionMultiplier) + 'px';
        const highResFontStyle = fontParts.join(' ');
        octx.font = highResFontStyle;
        const centerX = w * resolutionMultiplier * 0.5;
        if (text.strokeWidth && text.strokeWidth > 0) {
            octx.lineWidth = text.strokeWidth * resolutionMultiplier;
            octx.strokeStyle = text.strokeColor;
            octx.strokeText(content, centerX, 0);
        }
        octx.fillStyle = text.color;
        octx.fillText(content, centerX, 0);
        i = w; dltY = curve / textHeightVal; y = 0;
        while (i--) {
            if (isTri) {
                y += dltY;
                if (i === (w * 0.5 + shiftAmount) | 0) dltY = -dltY;
            } else {
                y = bottom - curve * Math.sin(i * angleSteps * Math.PI / 180);
            }
            const sourceX = i * resolutionMultiplier;
            const sourceWidth = resolutionMultiplier;
            const sourceHeight = textHeightVal * resolutionMultiplier;
            this.ctx.drawImage(os, sourceX, 0, sourceWidth, sourceHeight,
                i - w / 2, h * 0.5 - offsetYVal / textHeightVal * y - h / 2, 1, y);
        }
    }

    renderCircularText(text, content) {
        console.log(`🔄 CIRCULAR: Starting high-quality circular text rendering`);
        console.log(`🔄 CIRCULAR: Parameters: diameter=${text.diameter}, kerning=${text.kerning}, flipped=${text.flipped}`);

        // 🔧 HIGH-DPI FIX: Get the current scale factor for proper gradient sizing
        const transform = this.ctx.getTransform();
        const scaleFactor = transform.a; // Current scale factor from high-DPI setup
        console.log(`🔄 CIRCULAR SCALE: Current scale factor: ${scaleFactor}`);

        const diameter = text.diameter;
        const kerning = text.kerning;
        const flipped = text.flipped;
        const fontSize = parseInt(text.font);
        const radius = diameter / 2;
        const contentArr = content.split('');
        const letterAngles = [];
        let totalAngle = 0;

        // Calculate letter angles using the current context for accurate measurements
        this.ctx.font = text.font;
        contentArr.forEach((letter, i) => {
            const letterWidth = this.ctx.measureText(letter).width + kerning;
            const letterAngle = (letterWidth / radius) * (180 / Math.PI);
            letterAngles.push(letterAngle);
            totalAngle += letterAngle;
            console.log(`🔄 CIRCULAR: Letter "${letter}": width=${letterWidth.toFixed(2)}, angle=${letterAngle.toFixed(2)}°`);
        });

        console.log(`🔄 CIRCULAR: Total angle: ${totalAngle.toFixed(2)}°`);

        // Start angle to center the text
        let currentAngleRad = -(totalAngle * Math.PI / 180) / 2;

        // Set rendering properties for high quality
        this.ctx.save();
        this.ctx.font = text.font;

        // 🔍 NEW GRADIENT SYSTEM: Prepare gradient data for circular text
        console.log(`🔄 CIRCULAR GRADIENT: Checking for gradient on circular text`);
        const shouldUseGradient = text.gradient && text.gradient.type !== 'solid';
        console.log(`🔄 CIRCULAR GRADIENT: Should use gradient:`, shouldUseGradient);
        console.log(`🔄 CIRCULAR GRADIENT: text.gradient:`, text.gradient);

        // Prepare gradient data but don't apply it yet (will apply per letter)
        let gradientData = null;
        if (shouldUseGradient) {
            console.log(`🔄 CIRCULAR GRADIENT: Preparing gradient data for per-letter application`);
            gradientData = {
                type: text.gradient.type,
                gradient: text.gradient.gradient,
                diameter: diameter,
                radius: radius
            };
        }

        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.textRenderingOptimization = 'optimizeQuality';
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';

        console.log(`🔄 CIRCULAR: Starting angle: ${(currentAngleRad * 180 / Math.PI).toFixed(2)}°`);

        // Render each letter directly (no offscreen canvas)
        for (let i = 0; i < contentArr.length; i++) {
            const letter = contentArr[i];
            const letterAngleDeg = letterAngles[i];
            const letterAngleRad = letterAngleDeg * Math.PI / 180;
            const halfAngleRad = letterAngleRad / 2;

            currentAngleRad += halfAngleRad;

            // Calculate position
            const x = radius * Math.cos(currentAngleRad);
            const y = radius * Math.sin(currentAngleRad);

            console.log(`🔄 CIRCULAR ${i}: Letter "${letter}" at position (${x.toFixed(2)}, ${y.toFixed(2)}), angle: ${(currentAngleRad * 180 / Math.PI).toFixed(2)}°`);

            // Save context and apply transforms
            this.ctx.save();
            this.ctx.translate(x, y);
            this.ctx.rotate(currentAngleRad + Math.PI / 2);

            // 🔍 CIRCULAR GRADIENT FIX: Apply gradient/color AFTER save() but BEFORE fillText()
            if (gradientData) {
                console.log(`🔄 CIRCULAR GRADIENT ${i}: Applying gradient to letter "${letter}"`);

                if (gradientData.type === 'linear') {
                    const angle = gradientData.gradient.angle || 0;
                    const angleRad = (angle * Math.PI) / 180;

                    // Create gradient for this letter's coordinate system
                    const gradientLength = gradientData.diameter;
                    const startX = -gradientLength / 2 * Math.cos(angleRad);
                    const startY = -gradientLength / 2 * Math.sin(angleRad);
                    const endX = gradientLength / 2 * Math.cos(angleRad);
                    const endY = gradientLength / 2 * Math.sin(angleRad);

                    const gradient = this.ctx.createLinearGradient(startX, startY, endX, endY);

                    // Add color stops
                    gradientData.gradient.colors.forEach(colorStop => {
                        const position = colorStop.position / 100;
                        gradient.addColorStop(position, colorStop.color);
                    });

                    this.ctx.fillStyle = gradient;
                    console.log(`🔄 CIRCULAR GRADIENT ${i}: Applied linear gradient to letter "${letter}"`);

                } else if (gradientData.type === 'radial') {
                    const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, gradientData.radius);

                    // Add color stops
                    gradientData.gradient.colors.forEach(colorStop => {
                        const position = colorStop.position / 100;
                        gradient.addColorStop(position, colorStop.color);
                    });

                    this.ctx.fillStyle = gradient;
                    console.log(`🔄 CIRCULAR GRADIENT ${i}: Applied radial gradient to letter "${letter}"`);
                }
            } else {
                // Use solid color
                this.ctx.fillStyle = text.color;
                console.log(`🔄 CIRCULAR GRADIENT ${i}: Using solid color for letter "${letter}":`, text.color);
            }

            // Apply stroke if needed
            if (text.strokeWidth && text.strokeWidth > 0) {
                this.ctx.lineWidth = text.strokeWidth;
                this.ctx.strokeStyle = text.strokeColor;
                this.ctx.strokeText(letter, 0, 0);
            }

            // Draw the letter (fillStyle is now properly set for this letter)
            this.ctx.fillText(letter, 0, 0);

            this.ctx.restore();

            currentAngleRad += halfAngleRad;
            console.log(`🔄 CIRCULAR COMPLETE ${i}: Finished rendering "${letter}"`);
        }

        this.ctx.restore();
        console.log(`🔄 CIRCULAR COMPLETE: Finished rendering all letters for circular text`, {
            totalLettersRendered: contentArr.length,
            text: content
        });

        // Debug: Check if pixels were drawn
        const checkArea = {
            x: Math.max(0, -radius - 50),
            y: Math.max(0, -radius - 50),
            width: Math.min(this.canvas.width, (radius + 50) * 2),
            height: Math.min(this.canvas.height, (radius + 50) * 2)
        };

        try {
            const imageData = this.ctx.getImageData(checkArea.x, checkArea.y, checkArea.width, checkArea.height);
            const hasVisiblePixels = Array.from(imageData.data).some((value, index) => index % 4 === 3 && value > 0);
            const sampleAlphaValues = Array.from(imageData.data).filter((value, index) => index % 4 === 3).slice(0, 10);

            console.log(`🔄 CIRCULAR DEBUG: Canvas state after rendering`, {
                canvasWidth: this.canvas.width,
                canvasHeight: this.canvas.height,
                checkArea,
                hasVisiblePixels,
                sampleAlphaValues
            });
        } catch (e) {
            console.log(`🔄 CIRCULAR DEBUG: Could not check pixels:`, e.message);
        }
    }

    updateUIControls() {
        // ... (implementation remains the same) ...
        if (!this.selectedText) return;
        const fontSizeInput = document.getElementById('fontSizeInput');
        if (fontSizeInput) {
            const fontSize = parseInt(this.selectedText.font);
            fontSizeInput.value = fontSize;
            if (fontSizeInput.nextElementSibling) fontSizeInput.nextElementSibling.textContent = fontSize;
        }
        const textRotationInput = document.getElementById('textRotationInput');
        if (textRotationInput) {
            textRotationInput.value = this.selectedText.angle || 0;
            if (textRotationInput.nextElementSibling) textRotationInput.nextElementSibling.textContent = (this.selectedText.angle || 0) + '°';
        }
        const letterSpacingInput = document.getElementById('letterSpacingInput');
        if (letterSpacingInput) {
            letterSpacingInput.value = this.selectedText.letterSpacing || 0;
            if (letterSpacingInput.nextElementSibling) letterSpacingInput.nextElementSibling.textContent = this.selectedText.letterSpacing || 0;
        }
        const strokeWidthInput = document.getElementById('strokeWidthInput');
        if (strokeWidthInput) {
            strokeWidthInput.value = this.selectedText.strokeWidth || 0;
            if (strokeWidthInput.nextElementSibling) strokeWidthInput.nextElementSibling.textContent = this.selectedText.strokeWidth || 0;
        }
        const iCurve = document.getElementById('iCurve');
        if (iCurve) {
            iCurve.value = this.selectedText.curve || 0;
            const vCurve = document.getElementById('vCurve');
            if (vCurve) vCurve.textContent = this.selectedText.curve || 0;
        }
        const iOffset = document.getElementById('iOffset');
        if (iOffset) {
            iOffset.value = this.selectedText.offsetY || 0;
            const vOffset = document.getElementById('vOffset');
            if (vOffset) vOffset.textContent = this.selectedText.offsetY || 0;
        }
        const iHeight = document.getElementById('iHeight');
        if (iHeight) {
            iHeight.value = this.selectedText.textHeight || 64;
            const vHeight = document.getElementById('vHeight');
            if (vHeight) vHeight.textContent = this.selectedText.textHeight || 64;
        }
        const iBottom = document.getElementById('iBottom');
        if (iBottom) {
            iBottom.value = this.selectedText.bottom || 200;
            const vBottom = document.getElementById('vBottom');
            if (vBottom) vBottom.textContent = this.selectedText.bottom || 200;
        }
        const iTriangle = document.getElementById('iTriangle');
        if (iTriangle) iTriangle.checked = this.selectedText.isTri || false;
        const iShiftAmount = document.getElementById('iShiftAmount');
        if (iShiftAmount) {
            iShiftAmount.value = this.selectedText.shiftAmount || 0;
            const vShiftAmount = document.getElementById('vShiftAmount');
            if (vShiftAmount) vShiftAmount.textContent = this.selectedText.shiftAmount || 0;
        }
        const iDiameter = document.getElementById('iDiameter');
        if (iDiameter) {
            iDiameter.value = this.selectedText.diameter || 250;
            const vDiameter = document.getElementById('vDiameter');
            if (vDiameter) vDiameter.textContent = this.selectedText.diameter || 250;
        }
        const iKerning = document.getElementById('iKerning');
        if (iKerning) {
            iKerning.value = this.selectedText.kerning || 0;
            const vKerning = document.getElementById('vKerning');
            if (vKerning) vKerning.textContent = this.selectedText.kerning || 0;
        }
        const iFlip = document.getElementById('iFlip');
        if (iFlip) iFlip.checked = this.selectedText.flipped || false;
        const iCircularText = document.getElementById('iCircularText');
        if (iCircularText) iCircularText.value = this.selectedText.text || '';
        const warpBendInput = document.getElementById('warpBendInput');
        if (warpBendInput) {
            warpBendInput.value = this.selectedText.bend || 0;
            if (warpBendInput.nextElementSibling) warpBendInput.nextElementSibling.textContent = (this.selectedText.bend || 0) + '%';
        }
        const textColorInput = document.getElementById('textColorInput');
        if (textColorInput) textColorInput.value = this.selectedText.color || '#000000';
        const strokeColorInput = document.getElementById('strokeColorInput');
        if (strokeColorInput) strokeColorInput.value = this.selectedText.strokeColor || '#000000';
        const curvingTextToggle = document.getElementById('curvingTextToggle');
        const circularTextToggle = document.getElementById('circularTextToggle');
        const curvingTextControls = document.getElementById('curvingTextControls');
        const circularTextControls = document.getElementById('circularTextControls');
        if (curvingTextToggle && circularTextToggle) {
            if (this.selectedText.effectType === this.TEXT_EFFECT.CURVING) {
                curvingTextToggle.checked = true; circularTextToggle.checked = false;
                if (curvingTextControls) curvingTextControls.style.display = 'block';
                if (circularTextControls) circularTextControls.style.display = 'none';
            } else if (this.selectedText.effectType === this.TEXT_EFFECT.CIRCULAR) {
                curvingTextToggle.checked = false; circularTextToggle.checked = true;
                if (curvingTextControls) curvingTextControls.style.display = 'none';
                if (circularTextControls) circularTextControls.style.display = 'block';
            } else {
                curvingTextToggle.checked = false; circularTextToggle.checked = false;
                if (curvingTextControls) curvingTextControls.style.display = 'none';
                if (circularTextControls) circularTextControls.style.display = 'none';
            }
        }
    }

    startColorPicking(callback) {
        // ... (implementation remains the same) ...
        this.isColorPicking = true;
        this.colorPickCallback = callback;
        this.canvas.style.cursor = 'crosshair';
    }

    handleClick(e) {
        // ... (implementation remains the same) ...
         const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        if (this.isColorPicking) {
            const pixel = this.ctx.getImageData(x, y, 1, 1).data;
            const color = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
            if (this.colorPickCallback) this.colorPickCallback(color);
            this.isColorPicking = false;
            this.colorPickCallback = null;
            this.canvas.style.cursor = 'default';
            return true;
        }
        return false;
    }

    updateSelectedText(props) {
        // ... (implementation remains the same) ...
         if (!this.selectedText) return;
        Object.assign(this.selectedText, props);
        if (props.text) {
            const iText = document.getElementById('iText');
            if (iText) iText.value = props.text;
        }
        this.redrawAll();
    }

    renderForExport(exportCtx) {
        // Always draw default background color first
        exportCtx.fillStyle = '#2a2a2a';
        exportCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw image objects
        this.images.forEach(image => {
            exportCtx.save();
            exportCtx.translate(image.x, image.y);
            if (image.angle) {
                exportCtx.rotate(image.angle * Math.PI / 180);
            }
            exportCtx.drawImage(
                image.img,
                -image.width / 2,
                -image.height / 2,
                image.width,
                image.height
            );
            exportCtx.restore();
        });

        // Draw text objects
        this.texts.forEach(text => {
            exportCtx.save();
            exportCtx.translate(text.x, text.y);
            if (text.skewX || text.skewY) {
                exportCtx.transform(1, text.skewY, text.skewX, 1, 0, 0);
            }
            if (text.angle) {
                exportCtx.rotate(text.angle * Math.PI / 180);
            }
            // Apply effects or standard rendering for export
            if (text.effectType === this.TEXT_EFFECT.CURVING && text.curve > 0) {
                this.renderCurvingTextForExport(exportCtx, text);
            }
            else if (text.effectType === this.TEXT_EFFECT.CIRCULAR) {
                this.renderCircularTextForExport(exportCtx, text);
            }
            else if (text.effectType === this.TEXT_EFFECT.PERSPECTIVE) {
                this.renderPerspectiveTextForExport(exportCtx, text);
            }
            else {
                exportCtx.font = text.font;
                exportCtx.textAlign = text.textAlign;
                exportCtx.textBaseline = 'middle';
                if (text.strokeWidth && text.strokeWidth > 0) {
                    exportCtx.lineWidth = text.strokeWidth;
                    exportCtx.strokeStyle = text.strokeColor;
                    exportCtx.strokeText(text.text, 0, 0);
                }
                exportCtx.fillStyle = text.color;
                exportCtx.fillText(text.text, 0, 0);
            }
            exportCtx.restore();
        });

        // Overlay paint layer if it exists
        if (window.paintMode && typeof window.paintMode.renderPaintLayerTo === 'function') {
            window.paintMode.renderPaintLayerTo(exportCtx);
        }
    }

    renderCurvingTextForExport(exportCtx, text) {
        // ... (implementation remains the same) ...
        const w = this.canvas.width, h = this.canvas.height;
        const curve = text.curve, offsetYVal = text.offsetY, textHeightVal = text.textHeight;
        const bottom = text.bottom, isTri = text.isTri, shiftAmount = text.shiftAmount || 0;
        let dltY, angleSteps = 180 / w, i = w, y;
        const resolutionMultiplier = 4;
        const os = document.createElement('canvas'), octx = os.getContext('2d');
        os.width = w * resolutionMultiplier; os.height = h * resolutionMultiplier;
        octx.textBaseline = 'top'; octx.textAlign = 'center';
        const fontSize = parseInt(text.font);
        const fontParts = text.font.split(' ');
        fontParts[0] = (fontSize * resolutionMultiplier) + 'px';
        const highResFontStyle = fontParts.join(' ');
        octx.font = highResFontStyle;
        const centerX = w * resolutionMultiplier * 0.5;
        if (text.strokeWidth && text.strokeWidth > 0) {
            octx.lineWidth = text.strokeWidth * resolutionMultiplier;
            octx.strokeStyle = text.strokeColor;
            octx.strokeText(text.text, centerX, 0);
        }
        octx.fillStyle = text.color;
        octx.fillText(text.text, centerX, 0);
        i = w; dltY = curve / textHeightVal; y = 0;
        while (i--) {
            if (isTri) {
                y += dltY;
                if (i === (w * 0.5 + shiftAmount) | 0) dltY = -dltY;
            } else {
                y = bottom - curve * Math.sin(i * angleSteps * Math.PI / 180);
            }
            const sourceX = i * resolutionMultiplier;
            const sourceWidth = resolutionMultiplier;
            const sourceHeight = textHeightVal * resolutionMultiplier;
            exportCtx.drawImage(os, sourceX, 0, sourceWidth, sourceHeight,
                i - w / 2, h * 0.5 - offsetYVal / textHeightVal * y - h / 2, 1, y);
        }
    }

    renderCircularTextForExport(exportCtx, text) {
        // ... (implementation remains the same) ...
        const diameter = text.diameter, kerning = text.kerning, flipped = text.flipped;
        const fontSize = parseInt(text.font);
        const radius = diameter / 2;
        const contentArr = text.text.split('');
        const letterAngles = [];
        let totalAngle = 0;
        contentArr.forEach((letter, i) => {
            exportCtx.font = text.font;
            const letterWidth = exportCtx.measureText(letter).width + kerning;
            const letterAngle = (letterWidth / radius) * (180 / Math.PI);
            letterAngles.push(letterAngle);
            totalAngle += letterAngle;
        });
        let startAngle = (-totalAngle / 2) * Math.PI / 180;
        for (let i = 0; i < contentArr.length; i++) {
            const letter = contentArr[i];
            const halfAngle = letterAngles[i] / 2 * Math.PI / 180;
            startAngle += halfAngle;
            let angle = flipped ? startAngle + Math.PI : startAngle;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            exportCtx.save();
            exportCtx.translate(x, y);
            let rotation = angle + Math.PI / 2;
            exportCtx.rotate(rotation);
            if (text.strokeWidth && text.strokeWidth > 0) {
                exportCtx.lineWidth = text.strokeWidth;
                exportCtx.strokeStyle = text.strokeColor;
                exportCtx.strokeText(letter, 0, 0);
            }
            exportCtx.fillStyle = text.color;
            exportCtx.fillText(letter, 0, 0);
            exportCtx.restore();
            startAngle += halfAngle;
        }
    }

    updateOriginalImageData(newImageData) {
        this.originalImageData = newImageData;
    }

    applyItalicTransform() {
        // ... (implementation remains the same) ...
         if (!this.selectedText) return;
        this.selectedText.skewX = 0.2;
        this.redrawAll();
    }

    removeItalicTransform() {
        // ... (implementation remains the same) ...
         if (!this.selectedText) return;
        this.selectedText.skewX = 0;
        this.redrawAll();
    }

    applyBoldEffect() {
        // ... (implementation remains the same) ...
         if (!this.selectedText) return;
        const fontParts = this.selectedText.font.split(' ');
        const fontSize = fontParts[0];
        const fontFamily = fontParts[fontParts.length - 1];
        this.selectedText.font = `bold ${fontSize} ${fontFamily}`;
        this.selectedText.isBold = true;
        this.redrawAll();
    }

    removeBoldEffect() {
        // ... (implementation remains the same) ...
         if (!this.selectedText) return;
        const fontParts = this.selectedText.font.split(' ');
        const fontSize = fontParts[0].includes('px') ? fontParts[0] : fontParts[1];
        const fontFamily = fontParts[fontParts.length - 1];
        this.selectedText.font = `${fontSize} ${fontFamily}`;
        this.selectedText.isBold = false;
        this.redrawAll();
    }

    updateFontSize(size) {
        // ... (implementation remains the same) ...
         if (!this.selectedText) return;
        const fontParts = this.selectedText.font.split(' ');
        const isBold = this.selectedText.isBold;
        const fontFamily = fontParts[fontParts.length - 1];
        this.selectedText.font = `${isBold ? 'bold ' : ''}${size}px ${fontFamily}`;
        this.redrawAll();
    }

    deselect() {
        this.selectedText = null;
        this.selectedImage = null;
        this.redrawAll();
    }

    // --- ADDED: addImageObject method ---
    addImageObject(imgElement, x, y, width, height) {
        const newImage = {
            id: Date.now(),
            img: imgElement, // Use the passed Image element
            x: x !== undefined ? x : this.canvas.width / 2,
            y: y !== undefined ? y : this.canvas.height / 2,
            width: width || imgElement.width, // Use provided or actual width
            height: height || imgElement.height, // Use provided or actual height
            angle: 0,
            scaleX: 1,
            scaleY: 1
        };

        this.images.push(newImage); // Add to the images array
        this.selectImage(newImage); // Select the new image

        return newImage;
    }
    // --- END ADDED ---

    // This method seems unused now based on text-editor.html changes, but keep it for now.
    addImage(url, x, y, width, height) {
        const img = new Image();
        img.src = url;

        const newImage = {
            id: Date.now(),
            img: img,
            x: x !== undefined ? x : this.canvas.width / 2,
            y: y !== undefined ? y : this.canvas.height / 2,
            width: width || 200,
            height: height || 200,
            angle: 0,
            scaleX: 1,
            scaleY: 1
        };

        this.images.push(newImage);
        this.selectImage(newImage); // Select the new image

        return newImage;
    }

    selectImage(image) {
        this.selectedImage = image;
        this.selectedText = null; // Deselect text when image is selected
        this.redrawAll();
    }

    isPointInImage(x, y, image) {
        // Basic bounding box check (doesn't account for rotation yet)
        // TODO: Implement rotation check if needed
        const halfWidth = image.width / 2;
        const halfHeight = image.height / 2;

        return (
            x >= image.x - halfWidth &&
            x <= image.x + halfWidth &&
            y >= image.y - halfHeight &&
            y <= image.y + halfHeight
        );
    }

    // --- ADDED: deleteSelectedImage method ---
    deleteSelectedImage() {
        if (!this.selectedImage) return false;

        const index = this.images.findIndex(img => img.id === this.selectedImage.id);
        if (index !== -1) {
            this.images.splice(index, 1);
            this.selectedImage = null;
            this.redrawAll();
            return true;
        }
        return false;
    }
    // --- END ADDED ---
}

export default TextMode;

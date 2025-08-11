class TextMode {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.texts = [];
        this.selectedText = null;
        this.isDragging = false;
        this.lastX = 0;
        this.lastY = 0;
        this.textStartX = 0;
        this.textStartY = 0;
        this.isColorPicking = false;
        this.colorPickCallback = null;
        this.onTextSelected = null;
        this.originalImageData = null;
        
        // Text effect types
        this.TEXT_EFFECT = {
            NONE: 'none',
            CURVING: 'curving',
            CIRCULAR: 'circular',
            SKEW: 'skew',
            PERSPECTIVE: 'perspective'
        };
    }

    initialize() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this));
        this.canvas.addEventListener('click', this.handleClick.bind(this));
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' && this.selectedText) {
                this.deleteSelectedText();
                if (window.showToast) {
                    window.showToast('Text deleted');
                }
            }
        });
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
        this.selectedText = newText;

        const textInput = document.getElementById('textInput');
        if (textInput) {
            textInput.value = newText.text;
        }

        // Also update the curving text input
        const iText = document.getElementById('iText');
        if (iText) {
            iText.value = newText.text;
        }

        this.redrawAll();

        return newText;
    }

    selectText(text) {
        this.selectedText = text;
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
        
        let clickedText = null;
        
        for (let i = this.texts.length - 1; i >= 0; i--) {
            const text = this.texts[i];
            
            this.ctx.font = text.font;
            const metrics = this.ctx.measureText(text.text);
            const fontSize = parseInt(text.font);
            const height = fontSize * 1.2;
            
            const hitArea = {
                x: text.x - metrics.width / 2 - 10,
                y: text.y - height / 2 - 10,
                width: metrics.width + 20,
                height: height + 20
            };
            
            if (
                x >= hitArea.x && 
                x <= hitArea.x + hitArea.width && 
                y >= hitArea.y && 
                y <= hitArea.y + hitArea.height
            ) {
                clickedText = text;
                break;
            }
        }
        
        if (clickedText) {
            this.selectText(clickedText);
            this.isDragging = true;
            this.lastX = x;
            this.lastY = y;
            this.textStartX = clickedText.x;
            this.textStartY = clickedText.y;
            
            if (window.showToast) {
                window.showToast('Text selected');
            }
        } else {
            this.selectedText = null;
            this.redrawAll();
        }
    }

    handleMouseMove(e) {
        if (!this.isDragging || !this.selectedText) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        const deltaX = x - this.lastX;
        const deltaY = y - this.lastY;
        
        this.selectedText.x += deltaX;
        this.selectedText.y += deltaY;
        
        this.lastX = x;
        this.lastY = y;

        this.redrawAll();
    }

    handleMouseUp(e) {
        this.isDragging = false;
    }
    
    isPointInText(x, y, text) {
        this.ctx.font = text.font;
        const metrics = this.ctx.measureText(text.text);
        const fontSize = parseInt(text.font);
        const height = fontSize * 1.2;
        
        const hitArea = {
            x: text.x - metrics.width / 2 - 10,
            y: text.y - height / 2 - 10,
            width: metrics.width + 20,
            height: height + 20
        };
        
        return (
            x >= hitArea.x && 
            x <= hitArea.x + hitArea.width && 
            y >= hitArea.y && 
            y <= hitArea.y + hitArea.height
        );
    }
    
    deleteSelectedText() {
        if (!this.selectedText) return;
        
        const index = this.texts.indexOf(this.selectedText);
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
                if (newContent !== null) {
                    this.updateSelectedText({
                        text: newContent
                    });
                    
                    if (window.showToast) {
                        window.showToast('Text updated');
                    }
                }
                break;
            }
        }
    }

    // Calculate text width based on current font and context
    calculateTextWidth(text) {
        this.ctx.font = text.font;
        const metrics = this.ctx.measureText(text.text);
        return metrics.width;
    }
    
    // Calculate text height based on font size
    calculateTextHeight(text) {
        const fontSize = parseInt(text.font);
        return fontSize * 1.2; // Approximate height based on font size
    }

    redrawAll() {
        const imageData = this.originalImageData ? 
            this.originalImageData : 
            this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        if (!this.originalImageData) {
            this.originalImageData = imageData;
        }
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.putImageData(imageData, 0, 0);
        
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

        if (this.selectedText) {
            this.ctx.save();

            this.ctx.strokeStyle = '#00AAFF';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);

            const textWidth = this.calculateTextWidth(this.selectedText);
            const textHeight = this.calculateTextHeight(this.selectedText);

            this.ctx.beginPath();

            this.ctx.translate(this.selectedText.x, this.selectedText.y);
            if (this.selectedText.angle) {
                this.ctx.rotate(this.selectedText.angle * Math.PI / 180);
            }

            this.ctx.rect(-textWidth / 2 - 10, -textHeight / 2 - 10, textWidth + 20, textHeight + 20);
            this.ctx.stroke();

            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.strokeStyle = '#00AAFF';
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([]);

            const handleSize = 8;
            const halfWidth = textWidth / 2;
            const halfHeight = textHeight / 2;

            this.ctx.fillRect(-halfWidth - 10 - handleSize / 2, -halfHeight - 10 - handleSize / 2, handleSize, handleSize);
            this.ctx.strokeRect(-halfWidth - 10 - handleSize / 2, -halfHeight - 10 - handleSize / 2, handleSize, handleSize);

            this.ctx.fillRect(halfWidth + 10 - handleSize / 2, -halfHeight - 10 - handleSize / 2, handleSize, handleSize);
            this.ctx.strokeRect(halfWidth + 10 - handleSize / 2, -halfHeight - 10 - handleSize / 2, handleSize, handleSize);

            this.ctx.fillRect(-halfWidth - 10 - handleSize / 2, halfHeight + 10 - handleSize / 2, handleSize, handleSize);
            this.ctx.strokeRect(-halfWidth - 10 - handleSize / 2, halfHeight + 10 - handleSize / 2, handleSize, handleSize);

            this.ctx.fillRect(halfWidth + 10 - handleSize / 2, halfHeight + 10 - handleSize / 2, handleSize, handleSize);
            this.ctx.strokeRect(halfWidth + 10 - handleSize / 2, halfHeight + 10 - handleSize / 2, handleSize, handleSize);

            this.ctx.restore();
        }
    }

    drawTextWithOuterStroke(text, offsetX, offsetY, content) {
        this.ctx.font = text.font;
        this.ctx.textAlign = text.textAlign;
        this.ctx.textBaseline = 'middle';
        
        if (text.effectType === this.TEXT_EFFECT.CURVING && text.curve > 0) {
            // Apply curving text effect
            this.renderCurvingText(text, content);
        } 
        else if (text.effectType === this.TEXT_EFFECT.CIRCULAR) {
            // Apply circular text effect
            this.renderCircularText(text, content);
        }
        else if (text.effectType === this.TEXT_EFFECT.PERSPECTIVE) {
            // Apply perspective text effect
            this.renderPerspectiveText(text, content);
        }
        else {
            // Use standard text rendering if no effect is applied
            // Apply stroke first if needed
            if (text.strokeWidth && text.strokeWidth > 0) {
                this.ctx.lineWidth = text.strokeWidth;
                this.ctx.strokeStyle = text.strokeColor;
                this.ctx.strokeText(content, offsetX, offsetY);
            }
            
            // Then fill text
            this.ctx.fillStyle = text.color;
            this.ctx.fillText(content, offsetX, offsetY);
        }
    }
    
    // Render text with perspective effect
    renderPerspectiveText(text, content) {
        const fontSize = parseInt(text.font);
        const perspectiveValue = text.perspective || 0;
        
        // Resolution multiplier for higher quality
        const resolutionMultiplier = 4; // Increased for better quality
        
        // Create offscreen canvas for the text with higher resolution
        const os = document.createElement('canvas');
        const octx = os.getContext('2d');
        
        // Set canvas size to accommodate the text
        this.ctx.font = text.font;
        const metrics = this.ctx.measureText(content);
        const textWidth = metrics.width;
        const textHeight = fontSize * 1.2;
        
        // Make the offscreen canvas larger to avoid clipping, with higher resolution
        os.width = textWidth * 3 * resolutionMultiplier;
        os.height = textHeight * 3 * resolutionMultiplier;
        
        // Scale up the font for higher resolution
        const fontParts = text.font.split(' ');
        fontParts[0] = (fontSize * resolutionMultiplier) + 'px';
        const highResFontStyle = fontParts.join(' ');
        
        // Position text in the center of the offscreen canvas
        octx.font = highResFontStyle;
        octx.textAlign = 'center';
        octx.textBaseline = 'middle';
        
        // Apply stroke first if needed
        if (text.strokeWidth && text.strokeWidth > 0) {
            octx.lineWidth = text.strokeWidth * resolutionMultiplier;
            octx.strokeStyle = text.strokeColor;
            octx.strokeText(content, os.width/2, os.height/2);
        }
        
        // Fill text
        octx.fillStyle = text.color;
        octx.fillText(content, os.width/2, os.height/2);
        
        // Draw with perspective transformation
        this.ctx.save();
        
        // Calculate perspective transformation values
        const leftScale = perspectiveValue < 0 ? 1 + Math.abs(perspectiveValue/10) : 1 - Math.abs(perspectiveValue/20);
        const rightScale = perspectiveValue > 0 ? 1 + Math.abs(perspectiveValue/10) : 1 - Math.abs(perspectiveValue/20);
        
        // Draw the text with perspective
        this.ctx.beginPath();
        
        // Set up the perspective clipping path
        this.ctx.moveTo(-textWidth/2, -textHeight/2);
        this.ctx.lineTo(textWidth/2, -textHeight/2);
        this.ctx.lineTo(textWidth/2 * rightScale, textHeight/2);
        this.ctx.lineTo(-textWidth/2 * leftScale, textHeight/2);
        this.ctx.closePath();
        
        // Create the perspective effect by drawing the image with the appropriate transformations
        const sourceX = os.width/2 - textWidth/2;
        const sourceY = os.height/2 - textHeight/2;
        
        // Use a transform matrix for the perspective effect
        const tlX = -textWidth/2;
        const tlY = -textHeight/2;
        const trX = textWidth/2;
        const trY = -textHeight/2;
        const brX = textWidth/2 * rightScale;
        const brY = textHeight/2;
        const blX = -textWidth/2 * leftScale;
        const blY = textHeight/2;
        
        // Calculate transform matrix (simplified perspective transformation)
        const transformMatrix = this.getPerspectiveTransform(
            [sourceX, sourceY, sourceX + textWidth, sourceY, sourceX + textWidth, sourceY + textHeight, sourceX, sourceY + textHeight],
            [tlX, tlY, trX, trY, brX, brY, blX, blY]
        );
        
        // Apply the transform and draw the image
        this.ctx.transform(
            transformMatrix[0], transformMatrix[3],
            transformMatrix[1], transformMatrix[4],
            transformMatrix[2], transformMatrix[5]
        );
        
        this.ctx.drawImage(os, 0, 0);
        
        this.ctx.restore();
    }
    
    // Helper method to calculate perspective transform matrix
    getPerspectiveTransform(source, destination) {
        // This is a simplified version for our specific case
        // We're just creating a basic transform that simulates a simple perspective effect
        
        // For a true perspective transform, we'd solve a system of equations
        // But for our text effect, we can use a simplified approach
        
        const dx1 = destination[0];
        const dy1 = destination[1];
        const dx2 = destination[2];
        const dy2 = destination[3];
        const dx3 = destination[4];
        const dy3 = destination[5];
        const dx4 = destination[6];
        const dy4 = destination[7];
        
        const sx1 = source[0];
        const sy1 = source[1];
        const sx2 = source[2];
        const sy2 = source[3];
        const sx3 = source[4];
        const sy3 = source[5];
        const sx4 = source[6];
        const sy4 = source[7];
        
        // Simple transformation matrix
        // This isn't a true perspective transform, but works for our text effect
        const scaleX = (dx2 - dx1) / (sx2 - sx1);
        const skewX = (dx4 - dx1) / (sy4 - sy1);
        const translateX = dx1;
        
        const skewY = (dy2 - dy1) / (sx2 - sx1);
        const scaleY = (dy4 - dy1) / (sy4 - sy1);
        const translateY = dy1;
        
        return [scaleX, skewY, translateX, skewX, scaleY, translateY];
    }
    
    // Render text with curving effect
    renderCurvingText(text, content) {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const curve = text.curve;
        const offsetYVal = text.offsetY;
        const textHeightVal = text.textHeight;
        const bottom = text.bottom;
        const isTri = text.isTri;
        const shiftAmount = text.shiftAmount || 0;
        let dltY, angleSteps = 180 / w;
        let i = w, y;

        // Resolution multiplier for higher quality
        const resolutionMultiplier = 4; // Increased for better quality

        // Create offscreen canvas for the text with higher resolution
        const os = document.createElement('canvas');
        const octx = os.getContext('2d');
        os.width = w * resolutionMultiplier;
        os.height = h * resolutionMultiplier;
        octx.textBaseline = 'top';
        octx.textAlign = 'center';
        
        // Scale up the font for higher resolution
        const fontSize = parseInt(text.font);
        const fontParts = text.font.split(' ');
        fontParts[0] = (fontSize * resolutionMultiplier) + 'px';
        const highResFontStyle = fontParts.join(' ');
        octx.font = highResFontStyle;
        
        // Center position adjusted for higher resolution
        const centerX = w * resolutionMultiplier * 0.5;
        
        // Apply stroke to the offscreen canvas first if needed
        if (text.strokeWidth && text.strokeWidth > 0) {
            octx.lineWidth = text.strokeWidth * resolutionMultiplier;
            octx.strokeStyle = text.strokeColor;
            octx.strokeText(content, centerX, 0);
        }
        
        // Then fill text
        octx.fillStyle = text.color;
        octx.fillText(content, centerX, 0);

        // Apply curve transformation
        i = w;
        dltY = curve / textHeightVal;
        y = 0;
        while (i--) {
            if (isTri) {
                y += dltY;
                if (i === (w * 0.5 + shiftAmount) | 0) dltY = -dltY;
            } else {
                y = bottom - curve * Math.sin(i * angleSteps * Math.PI / 180);
            }
            // Source coordinates multiplied by resolution factor
            const sourceX = i * resolutionMultiplier;
            const sourceWidth = resolutionMultiplier; // Width of slice
            const sourceHeight = textHeightVal * resolutionMultiplier;
            
            this.ctx.drawImage(os, sourceX, 0, sourceWidth, sourceHeight,
                i - w / 2, h * 0.5 - offsetYVal / textHeightVal * y - h / 2, 1, y);
        }
    }
    
    // Render text in a circular path
    renderCircularText(text, content) {
        const diameter = text.diameter;
        const kerning = text.kerning;
        const flipped = text.flipped;
        const fontSize = parseInt(text.font);
        
        // Create parameters for circular text
        const radius = diameter / 2;
        const textHeight = fontSize * 1.2;
        const contentArr = content.split('');
        const letterAngles = [];
        
        // Resolution multiplier for higher quality
        const resolutionMultiplier = 4; // Increased for better quality
        
        // Scale up the font size for better quality
        const fontParts = text.font.split(' ');
        fontParts[0] = (fontSize * resolutionMultiplier) + 'px';
        const highResFontStyle = fontParts.join(' ');
        
        // Create an offscreen canvas for each letter with higher resolution
        const letterCanvases = [];
        
        // Pre-render each letter to offscreen canvases
        for (let i = 0; i < contentArr.length; i++) {
            const letter = contentArr[i];
            
            // Create offscreen canvas for the letter
            const letterCanvas = document.createElement('canvas');
            const letterCtx = letterCanvas.getContext('2d');
            const size = fontSize * resolutionMultiplier * 1.5; // Give some padding
            letterCanvas.width = size;
            letterCanvas.height = size;
            
            // Center the letter
            letterCtx.font = highResFontStyle;
            letterCtx.textAlign = 'center';
            letterCtx.textBaseline = 'middle';
            
            // Apply stroke first if needed
            if (text.strokeWidth && text.strokeWidth > 0) {
                letterCtx.lineWidth = text.strokeWidth * resolutionMultiplier;
                letterCtx.strokeStyle = text.strokeColor;
                letterCtx.strokeText(letter, size/2, size/2);
            }
            
            // Then fill text
            letterCtx.fillStyle = text.color;
            letterCtx.fillText(letter, size/2, size/2);
            
            letterCanvases.push(letterCanvas);
        }
        
        // Calculate the angle for each letter
        let totalAngle = 0;
        contentArr.forEach((letter, i) => {
            this.ctx.font = text.font;
            const letterWidth = this.ctx.measureText(letter).width + kerning;
            const letterAngle = (letterWidth / radius) * (180 / Math.PI);
            letterAngles.push(letterAngle);
            totalAngle += letterAngle;
        });
        
        // Starting angle - same whether flipped or not
        let startAngle = (-totalAngle / 2) * Math.PI / 180;
        
        this.ctx.save();
        
        // Draw each letter
        for (let i = 0; i < contentArr.length; i++) {
            const halfAngle = letterAngles[i] / 2 * Math.PI / 180;
            
            // Update the angle
            startAngle += halfAngle;
            
            // Position for this letter - rotate 180° when flipped
            let angle = flipped ? startAngle + Math.PI : startAngle;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            
            this.ctx.save();
            this.ctx.translate(x, y);
            
            // Rotate the letter - add 180° rotation when flipped
            let rotation = angle + Math.PI / 2;
            this.ctx.rotate(rotation);
            
            // Draw the high-resolution pre-rendered letter
            const letterCanvas = letterCanvases[i];
            const letterSize = fontSize * 1.2; // Approximate render size
            this.ctx.drawImage(
                letterCanvas, 
                -letterSize/2, 
                -letterSize/2, 
                letterSize, 
                letterSize
            );
            
            this.ctx.restore();
            
            // Update for next letter
            startAngle += halfAngle;
        }
        
        this.ctx.restore();
    }

    updateUIControls() {
        if (!this.selectedText) return;

        const fontSizeInput = document.getElementById('fontSizeInput');
        if (fontSizeInput) {
            const fontSize = parseInt(this.selectedText.font);
            fontSizeInput.value = fontSize;
            if (fontSizeInput.nextElementSibling) {
                fontSizeInput.nextElementSibling.textContent = fontSize;
            }
        }
        
        // Update rotation slider
        const textRotationInput = document.getElementById('textRotationInput');
        if (textRotationInput) {
            textRotationInput.value = this.selectedText.angle || 0;
            if (textRotationInput.nextElementSibling) {
                textRotationInput.nextElementSibling.textContent = (this.selectedText.angle || 0) + '°';
            }
        }
        
        const letterSpacingInput = document.getElementById('letterSpacingInput');
        if (letterSpacingInput) {
            letterSpacingInput.value = this.selectedText.letterSpacing || 0;
            if (letterSpacingInput.nextElementSibling) {
                letterSpacingInput.nextElementSibling.textContent = this.selectedText.letterSpacing || 0;
            }
        }
        
        const strokeWidthInput = document.getElementById('strokeWidthInput');
        if (strokeWidthInput) {
            strokeWidthInput.value = this.selectedText.strokeWidth || 0;
            if (strokeWidthInput.nextElementSibling) {
                strokeWidthInput.nextElementSibling.textContent = this.selectedText.strokeWidth || 0;
            }
        }
        
        // Update curving text controls
        
        // Update curve slider
        const iCurve = document.getElementById('iCurve');
        if (iCurve) {
            iCurve.value = this.selectedText.curve || 0;
            const vCurve = document.getElementById('vCurve');
            if (vCurve) {
                vCurve.textContent = this.selectedText.curve || 0;
            }
        }

        // Update offsetY slider
        const iOffset = document.getElementById('iOffset');
        if (iOffset) {
            iOffset.value = this.selectedText.offsetY || 0;
            const vOffset = document.getElementById('vOffset');
            if (vOffset) {
                vOffset.textContent = this.selectedText.offsetY || 0;
            }
        }

        // Update text height slider
        const iHeight = document.getElementById('iHeight');
        if (iHeight) {
            iHeight.value = this.selectedText.textHeight || 64;
            const vHeight = document.getElementById('vHeight');
            if (vHeight) {
                vHeight.textContent = this.selectedText.textHeight || 64;
            }
        }

        // Update bottom slider
        const iBottom = document.getElementById('iBottom');
        if (iBottom) {
            iBottom.value = this.selectedText.bottom || 200;
            const vBottom = document.getElementById('vBottom');
            if (vBottom) {
                vBottom.textContent = this.selectedText.bottom || 200;
            }
        }

        // Update triangle checkbox
        const iTriangle = document.getElementById('iTriangle');
        if (iTriangle) {
            iTriangle.checked = this.selectedText.isTri || false;
        }
        
        // Update shift amount slider
        const iShiftAmount = document.getElementById('iShiftAmount');
        if (iShiftAmount) {
            iShiftAmount.value = this.selectedText.shiftAmount || 0;
            const vShiftAmount = document.getElementById('vShiftAmount');
            if (vShiftAmount) {
                vShiftAmount.textContent = this.selectedText.shiftAmount || 0;
            }
        }
        
        // Update circular text controls
        
        // Update diameter slider
        const iDiameter = document.getElementById('iDiameter');
        if (iDiameter) {
            iDiameter.value = this.selectedText.diameter || 250;
            const vDiameter = document.getElementById('vDiameter');
            if (vDiameter) {
                vDiameter.textContent = this.selectedText.diameter || 250;
            }
        }
        
        // Update kerning slider
        const iKerning = document.getElementById('iKerning');
        if (iKerning) {
            iKerning.value = this.selectedText.kerning || 0;
            const vKerning = document.getElementById('vKerning');
            if (vKerning) {
                vKerning.textContent = this.selectedText.kerning || 0;
            }
        }
        
        // Update flip checkbox
        const iFlip = document.getElementById('iFlip');
        if (iFlip) {
            iFlip.checked = this.selectedText.flipped || false;
        }
        
        // Update circular text input
        const iCircularText = document.getElementById('iCircularText');
        if (iCircularText) {
            iCircularText.value = this.selectedText.text || '';
        }
        
        // Update general controls
        
        // Update bend slider
        const warpBendInput = document.getElementById('warpBendInput');
        if (warpBendInput) {
            warpBendInput.value = this.selectedText.bend || 0;
            if (warpBendInput.nextElementSibling) {
                warpBendInput.nextElementSibling.textContent = (this.selectedText.bend || 0) + '%';
            }
        }
        
        // Update textColor input
        const textColorInput = document.getElementById('textColorInput');
        if (textColorInput) {
            textColorInput.value = this.selectedText.color || '#000000';
        }
        
        // Update strokeColor input
        const strokeColorInput = document.getElementById('strokeColorInput');
        if (strokeColorInput) {
            strokeColorInput.value = this.selectedText.strokeColor || '#000000';
        }
        
        // Update effect toggles based on the selected text's effect type
        const curvingTextToggle = document.getElementById('curvingTextToggle');
        const circularTextToggle = document.getElementById('circularTextToggle');
        const curvingTextControls = document.getElementById('curvingTextControls');
        const circularTextControls = document.getElementById('circularTextControls');
        
        if (curvingTextToggle && circularTextToggle) {
            if (this.selectedText.effectType === this.TEXT_EFFECT.CURVING) {
                curvingTextToggle.checked = true;
                circularTextToggle.checked = false;
                if (curvingTextControls) curvingTextControls.style.display = 'block';
                if (circularTextControls) circularTextControls.style.display = 'none';
            } 
            else if (this.selectedText.effectType === this.TEXT_EFFECT.CIRCULAR) {
                curvingTextToggle.checked = false;
                circularTextToggle.checked = true;
                if (curvingTextControls) curvingTextControls.style.display = 'none';
                if (circularTextControls) circularTextControls.style.display = 'block';
            }
            else {
                curvingTextToggle.checked = false;
                circularTextToggle.checked = false;
                if (curvingTextControls) curvingTextControls.style.display = 'none';
                if (circularTextControls) circularTextControls.style.display = 'none';
            }
        }
    }

    startColorPicking(callback) {
        this.isColorPicking = true;
        this.colorPickCallback = callback;
        
        this.canvas.style.cursor = 'crosshair';
    }
    
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        if (this.isColorPicking) {
            const pixel = this.ctx.getImageData(x, y, 1, 1).data;
            const color = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
            
            if (this.colorPickCallback) {
                this.colorPickCallback(color);
            }
            
            this.isColorPicking = false;
            this.colorPickCallback = null;
            this.canvas.style.cursor = 'default';
            
            return true;
        }
        
        return false;
    }

    // Update selected text with new properties
    updateSelectedText(props) {
        if (!this.selectedText) return;
        
        Object.assign(this.selectedText, props);
        
        // If we're updating the text, also update the curving text input
        if (props.text) {
            const iText = document.getElementById('iText');
            if (iText) {
                iText.value = props.text;
            }
        }
        
        this.redrawAll();
    }

    // For export or download, render without selection outlines
    renderForExport(exportCtx) {
        // Start with original background image
        if (this.originalImageData) {
            exportCtx.putImageData(this.originalImageData, 0, 0);
        } else {
            // If no background, fill with default color
            exportCtx.fillStyle = '#2a2a2a';
            exportCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // Draw all texts without selection indicators
        this.texts.forEach(text => {
            exportCtx.save();
            
            exportCtx.translate(text.x, text.y);
            
            if (text.skewX || text.skewY) {
                exportCtx.transform(1, text.skewY, text.skewX, 1, 0, 0);
            }
            
            if (text.angle) {
                exportCtx.rotate(text.angle * Math.PI / 180);
            }
            
            // Apply different text effects based on the effect type
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
                // Standard text rendering
                exportCtx.font = text.font;
                exportCtx.textAlign = text.textAlign;
                exportCtx.textBaseline = 'middle';
                
                // Apply stroke first if needed
                if (text.strokeWidth && text.strokeWidth > 0) {
                    exportCtx.lineWidth = text.strokeWidth;
                    exportCtx.strokeStyle = text.strokeColor;
                    exportCtx.strokeText(text.text, 0, 0);
                }
                
                // Then fill text
                exportCtx.fillStyle = text.color;
                exportCtx.fillText(text.text, 0, 0);
            }
            
            exportCtx.restore();
        });
        
        // If paint layer exists, overlay it
        if (window.paintMode && typeof window.paintMode.renderPaintLayerTo === 'function') {
            window.paintMode.renderPaintLayerTo(exportCtx);
        }
    }
    
    // Render curving text for export
    renderCurvingTextForExport(exportCtx, text) {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const curve = text.curve;
        const offsetYVal = text.offsetY;
        const textHeightVal = text.textHeight;
        const bottom = text.bottom;
        const isTri = text.isTri;
        const shiftAmount = text.shiftAmount || 0;
        let dltY, angleSteps = 180 / w;
        let i = w, y;

        // Resolution multiplier for higher quality
        const resolutionMultiplier = 4; // Increased for better quality

        // Create offscreen canvas for the text with higher resolution
        const os = document.createElement('canvas');
        const octx = os.getContext('2d');
        os.width = w * resolutionMultiplier;
        os.height = h * resolutionMultiplier;
        octx.textBaseline = 'top';
        octx.textAlign = 'center';
        
        // Scale up the font for higher resolution
        const fontSize = parseInt(text.font);
        const fontParts = text.font.split(' ');
        fontParts[0] = (fontSize * resolutionMultiplier) + 'px';
        const highResFontStyle = fontParts.join(' ');
        octx.font = highResFontStyle;
        
        // Center position adjusted for higher resolution
        const centerX = w * resolutionMultiplier * 0.5;
        
        // Apply stroke to the offscreen canvas first if needed
        if (text.strokeWidth && text.strokeWidth > 0) {
            octx.lineWidth = text.strokeWidth * resolutionMultiplier; // Scale up stroke width
            octx.strokeStyle = text.strokeColor;
            octx.strokeText(text.text, centerX, 0);
        }
        
        // Then fill text
        octx.fillStyle = text.color;
        octx.fillText(text.text, centerX, 0);

        i = w;
        dltY = curve / textHeightVal;
        y = 0;
        while (i--) {
            if (isTri) {
                y += dltY;
                if (i === (w * 0.5 + shiftAmount) | 0) dltY = -dltY;
            } else {
                y = bottom - curve * Math.sin(i * angleSteps * Math.PI / 180);
            }
            
            // Source coordinates multiplied by resolution factor
            const sourceX = i * resolutionMultiplier;
            const sourceWidth = resolutionMultiplier; // Width of slice
            const sourceHeight = textHeightVal * resolutionMultiplier;
            
            // Draw image with improved resolution
            exportCtx.drawImage(os, sourceX, 0, sourceWidth, sourceHeight,
                i - w / 2, h * 0.5 - offsetYVal / textHeightVal * y - h / 2, 1, y);
        }
    }
    
    // Render circular text for export
    renderCircularTextForExport(exportCtx, text) {
        const diameter = text.diameter;
        const kerning = text.kerning;
        const flipped = text.flipped;
        const fontSize = parseInt(text.font);
        
        // Create parameters for circular text
        const radius = diameter / 2;
        const textHeight = fontSize * 1.2;
        const contentArr = text.text.split('');
        const letterAngles = [];
        
        // Calculate the angle for each letter
        let totalAngle = 0;
        contentArr.forEach((letter, i) => {
            exportCtx.font = text.font;
            const letterWidth = exportCtx.measureText(letter).width + kerning;
            const letterAngle = (letterWidth / radius) * (180 / Math.PI);
            letterAngles.push(letterAngle);
            totalAngle += letterAngle;
        });
        
        // Starting angle - same whether flipped or not
        let startAngle = (-totalAngle / 2) * Math.PI / 180;
        
        // Draw each letter
        for (let i = 0; i < contentArr.length; i++) {
            const letter = contentArr[i];
            const halfAngle = letterAngles[i] / 2 * Math.PI / 180;
            
            // Update the angle
            startAngle += halfAngle;
            
            // Position for this letter - rotate 180° when flipped
            let angle = flipped ? startAngle + Math.PI : startAngle;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            
            exportCtx.save();
            exportCtx.translate(x, y);
            
            // Rotate the letter - add 180° rotation when flipped
            let rotation = angle + Math.PI / 2;
            
            exportCtx.rotate(rotation);
            
            // Draw the letter
            if (text.strokeWidth && text.strokeWidth > 0) {
                exportCtx.lineWidth = text.strokeWidth;
                exportCtx.strokeStyle = text.strokeColor;
                exportCtx.strokeText(letter, 0, 0);
            }
            
            exportCtx.fillStyle = text.color;
            exportCtx.fillText(letter, 0, 0);
            
            exportCtx.restore();
            
            // Update for next letter
            startAngle += halfAngle;
        }
    }

    // Update originalImageData when background changes
    updateOriginalImageData(newImageData) {
        this.originalImageData = newImageData;
    }

    // Apply italic transform to selected text
    applyItalicTransform() {
        if (!this.selectedText) return;
        this.selectedText.skewX = 0.2;
        this.redrawAll();
    }
    
    // Remove italic transform from selected text
    removeItalicTransform() {
        if (!this.selectedText) return;
        this.selectedText.skewX = 0;
        this.redrawAll();
    }
    
    // Apply bold effect to selected text
    applyBoldEffect() {
        if (!this.selectedText) return;
        
        // Parse current font
        const fontParts = this.selectedText.font.split(' ');
        const fontSize = fontParts[0];
        const fontFamily = fontParts[fontParts.length - 1];
        
        // Add 'bold' to the font string
        this.selectedText.font = `bold ${fontSize} ${fontFamily}`;
        this.selectedText.isBold = true;
        
        this.redrawAll();
    }
    
    // Remove bold effect from selected text
    removeBoldEffect() {
        if (!this.selectedText) return;
        
        // Parse current font
        const fontParts = this.selectedText.font.split(' ');
        const fontSize = fontParts[0].includes('px') ? fontParts[0] : fontParts[1];
        const fontFamily = fontParts[fontParts.length - 1];
        
        // Remove 'bold' from the font string
        this.selectedText.font = `${fontSize} ${fontFamily}`;
        this.selectedText.isBold = false;
        
        this.redrawAll();
    }
    
    // Update font size for selected text
    updateFontSize(size) {
        if (!this.selectedText) return;
        
        // Parse current font
        const fontParts = this.selectedText.font.split(' ');
        const isBold = this.selectedText.isBold;
        const fontFamily = fontParts[fontParts.length - 1];
        
        // Create new font string with updated size
        this.selectedText.font = `${isBold ? 'bold ' : ''}${size}px ${fontFamily}`;
        
        this.redrawAll();
    }

    deselect() {
        this.selectedText = null;
        this.redrawAll();
    }
}

export default TextMode;

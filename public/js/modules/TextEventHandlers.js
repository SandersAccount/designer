/**
 * TextEventHandlers Module
 * Handles mouse and keyboard events for the AdvancedTextMode
 */

class TextEventHandlers {
    constructor(textMode) {
        this.textMode = textMode;
        this.canvas = textMode.canvas;
        this.ctx = textMode.ctx;
        
        // Bind event handlers to maintain 'this' context
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);
        
        // Debug binding
        console.log('Event handler methods bound to this:', 
                    this.onMouseDown.name, 
                    this.onMouseMove.name, 
                    this.onMouseUp.name);
    }
    
    // Set up all event listeners
    addEventListeners() {
        console.log('Adding text mode event listeners');
        
        try {
            this.canvas.addEventListener('mousedown', this.onMouseDown);
            window.addEventListener('mousemove', this.onMouseMove);
            window.addEventListener('mouseup', this.onMouseUp);
            window.addEventListener('keydown', this.onKeyDown);
            window.addEventListener('resize', this.onWindowResize);
            
            // Log success
            console.log('Text mode event listeners added successfully');
        } catch (error) {
            console.error('Error adding event listeners:', error);
        }
    }
    
    // Alias for backward compatibility
    setupEventListeners() {
        console.log('setupEventListeners called (alias for addEventListeners)');
        this.addEventListeners();
    }
    
    // Remove all event listeners
    removeEventListeners() {
        console.log('Removing text mode event listeners');
        this.canvas.removeEventListener('mousedown', this.onMouseDown);
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('mouseup', this.onMouseUp);
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('resize', this.onWindowResize);
        
        // Log success
        console.log('Text mode event listeners removed successfully');
    }
    
    // Get cursor position relative to canvas
    getCursorPosition(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        return { x, y };
    }
    
    // Handle mouse down event
    onMouseDown(event) {
        const { x, y } = this.getCursorPosition(event);
        console.log('🔍 Mouse down at position:', x.toFixed(2), y.toFixed(2));
        console.log('🔍 Canvas dimensions:', this.canvas.width, this.canvas.height);
        
        // If color picking is active, handle it
        if (this.textMode.isColorPicking) {
            console.log('🔍 Color picking mode is active, delegating to color picker');
            this.handleColorPicking(x, y);
            return;
        }
        
        // Check if we're clicking on a text
        console.log('🔍 Checking for text under cursor...');
        const clickedText = this.findTextUnderCursor(x, y);
        
        if (clickedText) {
            console.log('🔍 Text found under cursor:', clickedText.id, clickedText.text);
            console.log('🔍 Text properties:', 
                        'position:', clickedText.x, clickedText.y,
                        'angle:', clickedText.angle,
                        'skew:', clickedText.skewX, clickedText.skewY);
            
            // If we clicked on a text, select it and prepare for dragging
            this.textMode.selectedText = clickedText;
            this.textMode.isDragging = true;
            this.textMode.lastX = x;
            this.textMode.lastY = y;
            this.textMode.textStartX = clickedText.x;
            this.textMode.textStartY = clickedText.y;
            
            console.log('🔷 DRAGGING INITIALIZED - Set isDragging to:', this.textMode.isDragging);
            console.log('🔷 Starting position saved:', this.textMode.textStartX, this.textMode.textStartY);
            console.log('🔷 Initial mouse position:', this.textMode.lastX, this.textMode.lastY);
            
            // Check if we clicked on any of the transform handles
            console.log('🔍 Checking for transform handles...');
            const handleAction = this.getTransformHandleAction(clickedText, x, y);
            
            if (handleAction) {
                this.textMode.transformAction = handleAction;
                console.log('🔍 Transform handle found:', handleAction);
            } else {
                console.log('🔍 No transform handle clicked, will perform regular dragging');
                this.textMode.transformAction = null;
            }
            
            // Trigger the onTextSelected callback if available
            if (typeof this.textMode.onTextSelected === 'function') {
                console.log('🔍 Calling onTextSelected callback...');
                this.textMode.onTextSelected(clickedText);
            } else {
                console.warn('⚠️ onTextSelected is not a function or is not defined');
            }
            
            // Update UI controls to reflect the selected text properties
            if (this.textMode.uiControls) {
                console.log('🔍 Updating UI controls...');
                this.textMode.uiControls.updateUIControls();
            } else {
                console.error('❌ uiControls not initialized in onMouseDown');
            }
            
            // Redraw canvas
            console.log('🔍 Redrawing canvas with selected text...');
            this.textMode.renderer.redrawAll();
        } else {
            // If we clicked on empty space, deselect any selected text
            console.log('🔍 No text found under cursor, clicking on empty space');
            
            if (this.textMode.selectedText) {
                console.log('🔍 Deselecting current text:', this.textMode.selectedText.id);
                this.textMode.selectedText = null;
                
                // Trigger the onTextDeselected callback if available
                if (typeof this.textMode.onTextDeselected === 'function') {
                    console.log('🔍 Calling onTextDeselected callback');
                    this.textMode.onTextDeselected();
                }
                
                // Redraw canvas
                if (this.textMode.renderer) {
                    console.log('🔍 Redrawing canvas after text deselection');
                    this.textMode.renderer.redrawAll();
                } else {
                    console.error('❌ Renderer not initialized in onMouseDown');
                }
            } else {
                console.log('🔍 No text was previously selected');
            }
        }
    }
    
    // Find a text object under the cursor
    findTextUnderCursor(x, y) {
        console.log('🔍 Finding text under cursor at', x, y);
        
        if (!this.textMode.texts || this.textMode.texts.length === 0) {
            console.log('🔍 No text objects in the array');
            return null;
        }
        
        console.log('🔍 Number of text objects to check:', this.textMode.texts.length);
        
        // Check texts in reverse order (top to bottom in visual stack)
        for (let i = this.textMode.texts.length - 1; i >= 0; i--) {
            const text = this.textMode.texts[i];
            console.log(`🔍 Checking text ${i}:`, text.text, 'at position:', text.x, text.y);
            
            // Skip invisible layers
            if (text.layer && !text.layer.visible) {
                console.log('🔍 Skipping invisible text layer');
                continue;
            }
            
            // Check if point is inside text bounding box
            const isInside = this.isPointInText(x, y, text);
            console.log(`🔍 Is cursor inside text "${text.text}"?`, isInside);
            
            if (isInside) {
                console.log('🔍 Found text under cursor:', text.text, 'with ID:', text.id);
                return text;
            }
        }
        
        console.log('🔍 No text found under cursor');
        return null;
    }
    
    // Check if a point is inside a text object
    isPointInText(x, y, text) {
        // Use a simplified hit detection for basic text
        // This creates a rectangular hit area around the text
        const padding = 10; // Padding around text to make it easier to select
        
        // Get text metrics
        this.ctx.font = text.font;
        const metrics = this.ctx.measureText(text.text);
        const fontSize = parseInt(text.font);
        const height = fontSize * 1.2;
        const width = metrics.width;
        
        console.log('📏 Text metrics:', 
                    'width:', width, 
                    'height:', height, 
                    'font:', text.font, 
                    'fontSize:', fontSize);
        
        // Calculate text boundaries based on text alignment
        let textLeft, textRight, textTop, textBottom;
        
        if (text.textAlign === 'center') {
            textLeft = text.x - width / 2 - padding;
            textRight = text.x + width / 2 + padding;
            console.log('📏 Using center text alignment');
        } else if (text.textAlign === 'right') {
            textLeft = text.x - width - padding;
            textRight = text.x + padding;
            console.log('📏 Using right text alignment');
        } else { // left alignment
            textLeft = text.x - padding;
            textRight = text.x + width + padding;
            console.log('📏 Using left text alignment');
        }
        
        textTop = text.y - height / 2 - padding;
        textBottom = text.y + height / 2 + padding;
        
        // Debug
        console.log('📏 Text bounds:', 
                    'left:', textLeft.toFixed(2), 
                    'top:', textTop.toFixed(2), 
                    'right:', textRight.toFixed(2), 
                    'bottom:', textBottom.toFixed(2));
        console.log('📏 Cursor position:', x.toFixed(2), y.toFixed(2));
        
        // Simple rectangular hit detection for non-transformed text
        const isInRect = x >= textLeft && x <= textRight && 
                         y >= textTop && y <= textBottom;
        
        console.log('📏 Is point in rectangle?', isInRect);
        
        // For non-transformed text, use simple rectangular hit detection
        if (text.angle === 0 && !text.skewX && !text.skewY) {
            console.log('📏 Using simple rectangle hit detection (no transforms)');
            return isInRect;
        }
        
        // For rotated or skewed text, use the more complex polygon check
        console.log('📏 Text has transforms:', 
                   'angle:', text.angle, 
                   'skewX:', text.skewX, 
                   'skewY:', text.skewY);
        console.log('📏 Using polygon hit detection for transformed text');
        
        const transformedBBox = this.getTransformedBoundingBox(
            text.x, text.y, width, height, 
            text.angle, text.skewX || 0, text.skewY || 0
        );
        
        const isInPolygon = this.isPointInPolygon(x, y, transformedBBox);
        console.log('📏 Is point in transformed polygon?', isInPolygon);
        
        return isInPolygon;
    }
    
    // Check if a point is inside a polygon
    isPointInPolygon(x, y, polygon) {
        // Ray casting algorithm
        let inside = false;
        
        // Debug
        console.log('Checking if point', x, y, 'is in polygon:', polygon);
        
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x, yi = polygon[i].y;
            const xj = polygon[j].x, yj = polygon[j].y;
            
            const intersect = ((yi > y) !== (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            
            if (intersect) inside = !inside;
        }
        
        console.log('Point in polygon result:', inside);
        return inside;
    }
    
    // Get the transformed bounding box of a text
    getTransformedBoundingBox(x, y, width, height, angle, skewX, skewY) {
        console.log('📐 Computing transformed bounding box:');
        console.log('📐 Center position:', x.toFixed(2), y.toFixed(2));
        console.log('📐 Original dimensions:', width.toFixed(2), height.toFixed(2));
        console.log('📐 Transformations:', 'angle:', angle, 'skewX:', skewX, 'skewY:', skewY);
        
        // Convert angle to radians
        const angleRad = angle * Math.PI / 180;
        
        // Convert skew values to radians (skew is expressed as a percentage)
        const skewXRad = Math.atan(skewX / 100);
        const skewYRad = Math.atan(skewY / 100);
        
        console.log('📐 Angle in radians:', angleRad.toFixed(4));
        console.log('📐 SkewX in radians:', skewXRad.toFixed(4));
        console.log('📐 SkewY in radians:', skewYRad.toFixed(4));
        
        // Calculate half dimensions
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        
        // Define the four corners of the box before transformation
        const points = [
            { x: -halfWidth, y: -halfHeight }, // Top-left
            { x: halfWidth, y: -halfHeight },  // Top-right
            { x: halfWidth, y: halfHeight },   // Bottom-right
            { x: -halfWidth, y: halfHeight }   // Bottom-left
        ];
        
        console.log('📐 Original rectangle corner points:', 
                    JSON.stringify(points.map(p => ({
                        x: p.x.toFixed(2),
                        y: p.y.toFixed(2)
                    }))));
        
        // Apply skew and rotation transformations
        for (const point of points) {
            // Store original values for logging
            const originalX = point.x;
            const originalY = point.y;
            
            // Apply skew
            const skewedX = point.x + point.y * Math.tan(skewXRad);
            const skewedY = point.y + point.x * Math.tan(skewYRad);
            
            // Apply rotation
            const rotatedX = skewedX * Math.cos(angleRad) - skewedY * Math.sin(angleRad);
            const rotatedY = skewedX * Math.sin(angleRad) + skewedY * Math.cos(angleRad);
            
            // Apply translation
            point.x = rotatedX + x;
            point.y = rotatedY + y;
            
            console.log('📐 Point transformation:',
                        'original:', originalX.toFixed(2), originalY.toFixed(2),
                        'skewed:', skewedX.toFixed(2), skewedY.toFixed(2),
                        'rotated:', rotatedX.toFixed(2), rotatedY.toFixed(2),
                        'final:', point.x.toFixed(2), point.y.toFixed(2));
        }
        
        console.log('📐 Final transformed bounding box points:',
                   JSON.stringify(points.map(p => ({
                       x: p.x.toFixed(2),
                       y: p.y.toFixed(2)
                   }))));
        
        return points;
    }
    
    // Get action based on which transform handle was clicked
    getTransformHandleAction(text, x, y) {
        // Save current context state
        this.ctx.save();
        
        // Apply text transformations to correctly position the handles
        this.ctx.translate(text.x, text.y);
        this.ctx.rotate(text.angle * Math.PI / 180);
        if (text.skewX || text.skewY) {
            this.ctx.transform(1, text.skewY / 100, text.skewX / 100, 1, 0, 0);
        }
        
        // Get text metrics
        this.ctx.font = text.font;
        const metrics = this.ctx.measureText(text.text);
        const fontSize = parseInt(text.font);
        const lineHeight = fontSize * 1.2;
        const textWidth = metrics.width;
        
        // Restore context state
        this.ctx.restore();
        
        // Transform cursor position to text's local coordinate space
        const angle = -text.angle * Math.PI / 180;
        const localX = (x - text.x) * Math.cos(angle) - (y - text.y) * Math.sin(angle);
        const localY = (x - text.x) * Math.sin(angle) + (y - text.y) * Math.cos(angle);
        
        // Define handle positions based on text alignment
        let xOffset = 0;
        if (text.textAlign === 'center') {
            xOffset = -textWidth / 2;
        } else if (text.textAlign === 'right') {
            xOffset = -textWidth;
        }
        
        // Define handle positions (must match those in TextRenderer.drawSelectionHandles)
        const handles = [
            { x: xOffset - 5, y: -lineHeight / 2 - 5, action: 'tl' }, // Top-left
            { x: xOffset + textWidth / 2, y: -lineHeight / 2 - 5, action: 'tm' }, // Top-middle
            { x: xOffset + textWidth + 5, y: -lineHeight / 2 - 5, action: 'tr' }, // Top-right
            { x: xOffset + textWidth + 5, y: 0, action: 'mr' }, // Middle-right
            { x: xOffset + textWidth + 5, y: lineHeight / 2 + 5, action: 'br' }, // Bottom-right
            { x: xOffset + textWidth / 2, y: lineHeight / 2 + 5, action: 'bm' }, // Bottom-middle
            { x: xOffset - 5, y: lineHeight / 2 + 5, action: 'bl' }, // Bottom-left
            { x: xOffset - 5, y: 0, action: 'ml' }, // Middle-left
            { x: xOffset + textWidth + 20, y: 0, action: 'rotate' } // Rotation handle
        ];
        
        // Check if cursor is over any handle (with some hit tolerance)
        const handleSize = 8; // Increase hit area for easier clicking
        for (const handle of handles) {
            if (
                localX >= handle.x - handleSize &&
                localX <= handle.x + handleSize &&
                localY >= handle.y - handleSize &&
                localY <= handle.y + handleSize
            ) {
                console.log('Transform handle found:', handle.action);
                return handle.action;
            }
        }
        
        return null;
    }
    
    // Handle mouse move event
    onMouseMove(event) {
        const { x, y } = this.getCursorPosition(event);
        
        // Update cursor based on what's under it
        const textUnderCursor = this.findTextUnderCursor(x, y);
        
        if (textUnderCursor) {
            // If over a text, check if it's over any transform handle
            if (this.textMode.selectedText === textUnderCursor) {
                const handleAction = this.getTransformHandleAction(textUnderCursor, x, y);
                if (handleAction) {
                    // Set cursor based on handle type
                    switch (handleAction) {
                        case 'tl':
                        case 'br':
                            this.canvas.style.cursor = 'nwse-resize';
                            break;
                        case 'tr':
                        case 'bl':
                            this.canvas.style.cursor = 'nesw-resize';
                            break;
                        case 'tm':
                        case 'bm':
                            this.canvas.style.cursor = 'ns-resize';
                            break;
                        case 'ml':
                        case 'mr':
                            this.canvas.style.cursor = 'ew-resize';
                            break;
                        case 'rotate':
                            this.canvas.style.cursor = 'grab';
                            break;
                        default:
                            this.canvas.style.cursor = 'move';
                    }
                } else {
                    this.canvas.style.cursor = 'move';
                }
            } else {
                this.canvas.style.cursor = 'pointer';
            }
        } else {
            this.canvas.style.cursor = 'default';
        }
        
        // Handle text transformation if dragging
        if (this.textMode.selectedText && this.textMode.isDragging) {
            console.log('🔶 DRAGGING IN PROGRESS - Position:', x.toFixed(2), y.toFixed(2));
            
            const text = this.textMode.selectedText;
            console.log('🔶 Selected text:', text.id, text.text);
            console.log('🔶 Current text position:', text.x.toFixed(2), text.y.toFixed(2));
            console.log('🔶 Last mouse position:', this.textMode.lastX.toFixed(2), this.textMode.lastY.toFixed(2));
            
            const deltaX = x - this.textMode.lastX;
            const deltaY = y - this.textMode.lastY;
            
            console.log('🔶 Movement delta calculated:', deltaX.toFixed(2), deltaY.toFixed(2));
            
            // Handle different transformation actions
            if (this.textMode.transformAction) {
                console.log('🔶 Applying transformation action:', this.textMode.transformAction);
                
                switch (this.textMode.transformAction) {
                    case 'rotate':
                        // Calculate the angle between the center of the text and the cursor
                        const angle = Math.atan2(y - text.y, x - text.x) * 180 / Math.PI + 90;
                        const oldAngle = text.angle;
                        text.angle = angle;
                        console.log('🔶 Rotating: old angle:', oldAngle, 'new angle:', angle.toFixed(2));
                        break;
                    
                    // Corner resizing (adjusts font size)
                    case 'tl': // Top-left
                    case 'tr': // Top-right
                    case 'bl': // Bottom-left
                    case 'br': // Bottom-right
                        const fontSize = parseInt(text.font);
                        const newSize = Math.max(8, fontSize - deltaY * 0.5);
                        const oldFont = text.font;
                        text.font = `${newSize}px ${text.font.split('px ')[1]}`;
                        console.log('🔶 Resizing font: old:', oldFont, 'new:', text.font);
                        break;
                    
                    // Vertical resizing (adjusts font size)
                    case 'tm': // Top-middle
                    case 'bm': // Bottom-middle
                        const currentSize = parseInt(text.font);
                        const newVerticalSize = Math.max(8, currentSize - deltaY * 0.5);
                        const oldVFont = text.font;
                        text.font = `${newVerticalSize}px ${text.font.split('px ')[1]}`;
                        console.log('🔶 Vertical resize: old font:', oldVFont, 'new font:', text.font);
                        break;
                    
                    // Horizontal skewing
                    case 'ml': // Middle-left
                    case 'mr': // Middle-right
                        const oldSkewX = text.skewX || 0;
                        const skewAmount = deltaX * 0.5;
                        text.skewX = oldSkewX + skewAmount;
                        console.log('🔶 Skewing X: old:', oldSkewX, 'delta:', skewAmount.toFixed(2), 'new:', text.skewX.toFixed(2));
                        break;
                    
                    default:
                        console.log('🔶 Unhandled transform action:', this.textMode.transformAction);
                        break;
                }
            } else {
                // Regular dragging - move the text
                console.log('🔶 Performing regular text dragging');
                console.log('🔶 Before move - position:', text.x.toFixed(2), text.y.toFixed(2));
                
                // Store old position for logging
                const oldX = text.x;
                const oldY = text.y;
                
                // Update position
                text.x += deltaX;
                text.y += deltaY;
                
                console.log('🔶 After move - position:', text.x.toFixed(2), text.y.toFixed(2));
                console.log('🔶 Position change - X:', (text.x - oldX).toFixed(2), 'Y:', (text.y - oldY).toFixed(2));
            }
            
            // Update last cursor position
            const oldLastX = this.textMode.lastX;
            const oldLastY = this.textMode.lastY;
            this.textMode.lastX = x;
            this.textMode.lastY = y;
            
            console.log('🔶 Updated lastX/Y:', 
                        'from:', oldLastX.toFixed(2), oldLastY.toFixed(2),
                        'to:', this.textMode.lastX.toFixed(2), this.textMode.lastY.toFixed(2));
            
            // Redraw the canvas
            console.log('🔶 Redrawing canvas with updated text properties');
            this.textMode.renderer.redrawAll();
        }
    }
    
    // Handle mouse up event
    onMouseUp() {
        console.log('🔷 Mouse up - Ending drag operation');
        console.log('🔷 isDragging state before:', this.textMode.isDragging);
        
        // Reset dragging state
        this.textMode.isDragging = false;
        this.textMode.transformAction = null;
        
        console.log('🔷 isDragging state after:', this.textMode.isDragging);
        
        // Save state to history if needed
        if (this.textMode.selectedText) {
            this.textMode.saveToHistory();
            console.log('🔷 Saved text state to history');
            
            // Update UI controls
            this.textMode.uiControls.updateUIControls();
        }
    }
    
    // Handle key down event
    onKeyDown(event) {
        // If no text is selected, return
        if (!this.textMode.selectedText) return;
        
        const text = this.textMode.selectedText;
        let handled = false;
        
        switch (event.key) {
            case 'Delete':
            case 'Backspace':
                // Delete selected text
                this.textMode.deleteSelectedText();
                handled = true;
                break;
            
            case 'ArrowUp':
                // Move text up
                text.y -= event.shiftKey ? 10 : 1;
                handled = true;
                break;
            
            case 'ArrowDown':
                // Move text down
                text.y += event.shiftKey ? 10 : 1;
                handled = true;
                break;
            
            case 'ArrowLeft':
                // Move text left
                text.x -= event.shiftKey ? 10 : 1;
                handled = true;
                break;
            
            case 'ArrowRight':
                // Move text right
                text.x += event.shiftKey ? 10 : 1;
                handled = true;
                break;
            
            case 'z':
                // Undo
                if (event.ctrlKey || event.metaKey) {
                    this.textMode.undo();
                    handled = true;
                }
                break;
            
            case 'y':
                // Redo
                if (event.ctrlKey || event.metaKey) {
                    this.textMode.redo();
                    handled = true;
                }
                break;
            
            case 'c':
                // Copy
                if (event.ctrlKey || event.metaKey) {
                    this.textMode.copySelectedText();
                    handled = true;
                }
                break;
            
            case 'v':
                // Paste
                if (event.ctrlKey || event.metaKey) {
                    this.textMode.pasteText();
                    handled = true;
                }
                break;
        }
        
        // If we handled the event, prevent default behavior and redraw
        if (handled) {
            event.preventDefault();
            this.textMode.renderer.redrawAll();
            
            // Update UI controls
            this.textMode.uiControls.updateUIControls();
        }
    }
    
    // Handle color picking mode
    handleColorPicking(x, y) {
        // Get the pixel data at the cursor position
        const pixel = this.ctx.getImageData(x, y, 1, 1).data;
        const color = `rgba(${pixel[0]}, ${pixel[1]}, ${pixel[2]}, ${pixel[3] / 255})`;
        
        // Call the color pick callback with the selected color
        if (this.textMode.colorPickCallback) {
            this.textMode.colorPickCallback(color);
        }
        
        // Exit color picking mode
        this.textMode.isColorPicking = false;
        
        // Reset cursor style
        this.canvas.style.cursor = 'default';
    }
    
    // Handle window resize event
    onWindowResize() {
        // Update canvas dimensions if needed
        // This should be handled by the parent application
        
        // Redraw the canvas
        this.textMode.renderer.redrawAll();
    }
    
    /**
     * Test utility method to simulate a text drag operation
     * This method can be called from the console to test the drag functionality
     * @param {number} startX - Starting X position for mouse
     * @param {number} startY - Starting Y position for mouse
     * @param {number} endX - Ending X position for mouse
     * @param {number} endY - Ending Y position for mouse
     * @param {number} steps - Number of intermediate steps to simulate (default: 10)
     */
    testDragText(startX, startY, endX, endY, steps = 10) {
        console.log('🧪 TEST: Starting text drag simulation');
        console.log('🧪 TEST: From', startX, startY, 'to', endX, endY, 'in', steps, 'steps');
        
        // Simulate mouse down
        console.log('🧪 TEST: Simulating mouse down at', startX, startY);
        
        // Create mock event
        const mockDownEvent = {
            clientX: startX + this.canvas.getBoundingClientRect().left,
            clientY: startY + this.canvas.getBoundingClientRect().top
        };
        
        // Call onMouseDown with mock event
        this.onMouseDown(mockDownEvent);
        
        // Check if a text was selected
        if (!this.textMode.selectedText) {
            console.error('🧪 TEST: No text was selected at the starting position. Aborting test.');
            return;
        }
        
        console.log('🧪 TEST: Text selected:', this.textMode.selectedText.text);
        console.log('🧪 TEST: Initial text position:', 
                    this.textMode.selectedText.x, 
                    this.textMode.selectedText.y);
        
        // Calculate step sizes
        const stepX = (endX - startX) / steps;
        const stepY = (endY - startY) / steps;
        
        // Simulate mouse move events
        for (let i = 1; i <= steps; i++) {
            const currentX = startX + stepX * i;
            const currentY = startY + stepY * i;
            
            console.log('🧪 TEST: Simulating mouse move step', i, 'to', currentX, currentY);
            
            // Create mock move event
            const mockMoveEvent = {
                clientX: currentX + this.canvas.getBoundingClientRect().left,
                clientY: currentY + this.canvas.getBoundingClientRect().top
            };
            
            // Call onMouseMove with mock event
            this.onMouseMove(mockMoveEvent);
            
            // Log current text position
            if (this.textMode.selectedText) {
                console.log('🧪 TEST: Current text position:', 
                           this.textMode.selectedText.x,
                           this.textMode.selectedText.y);
            }
        }
        
        // Simulate mouse up
        console.log('🧪 TEST: Simulating mouse up at', endX, endY);
        
        // Create mock up event
        const mockUpEvent = {
            clientX: endX + this.canvas.getBoundingClientRect().left,
            clientY: endY + this.canvas.getBoundingClientRect().top
        };
        
        // Call onMouseUp with mock event
        this.onMouseUp(mockUpEvent);
        
        // Log final text position
        if (this.textMode.selectedText) {
            console.log('🧪 TEST: Final text position:', 
                       this.textMode.selectedText.x,
                       this.textMode.selectedText.y);
        }
        
        console.log('🧪 TEST: Text drag simulation completed');
    }
}

export default TextEventHandlers;

/**
 * PaintMode class for handling painting functionality
 */
class PaintMode {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.isPainting = false;
        this.lastX = 0;
        this.lastY = 0;
        this.brushSize = 5;
        this.brushColor = '#000000';
        this.isActive = false;
        this.isPickingColor = false;
        this.savedPaintData = null;
        
        // Create a separate canvas element for painting that will overlay the main canvas
        this.createPaintLayer();
    }
    
    createPaintLayer() {
        // Remove any existing paint layers (not just one)
        const existingLayers = document.querySelectorAll('#paint-layer');
        existingLayers.forEach(layer => {
            layer.remove();
        });
        
        // Create a new canvas element for the paint layer
        this.paintLayer = document.createElement('canvas');
        this.paintLayer.id = 'paint-layer';
        this.paintLayer.width = this.canvas.width;
        this.paintLayer.height = this.canvas.height;
        this.paintLayer.style.position = 'absolute';
        this.paintLayer.style.top = '0';
        this.paintLayer.style.left = '0';
        this.paintLayer.style.pointerEvents = 'none'; // Allow clicks to pass through to the canvas below
        this.paintLayer.style.zIndex = '10'; // Place above the main canvas
        
        // Insert the paint layer directly inside the canvas container, right after the main canvas
        const canvasContainer = this.canvas.parentNode;
        if (canvasContainer && canvasContainer.classList.contains('canvas-container')) {
            canvasContainer.appendChild(this.paintLayer);
        } else {
            // Fallback: insert after the main canvas
            this.canvas.parentNode.insertBefore(this.paintLayer, this.canvas.nextSibling);
        }
        
        // Get the context for the paint layer
        this.paintCtx = this.paintLayer.getContext('2d');
        
        // Restore saved paint data if exists
        if (this.savedPaintData) {
            this.paintCtx.putImageData(this.savedPaintData, 0, 0);
        }
        
        // Make sure the paint layer is visible but with pointer events disabled when not active
        this.paintLayer.style.display = 'block';
        
        // Ensure the paint layer matches the canvas size and position
        this.updatePaintLayerPosition();
    }
    
    initialize() {
        // Always create a fresh paint layer when initializing
        this.createPaintLayer();
        
        // Make the paint layer capture all mouse events
        this.paintLayer.style.pointerEvents = 'auto';
        
        // Add event listeners to the paint layer instead of the main canvas
        this.paintLayer.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.paintLayer.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.paintLayer.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.paintLayer.addEventListener('mouseout', this.handleMouseUp.bind(this));
        
        this.isActive = true;
        
        // Show the close paint mode button
        const closePaintModeBtn = document.getElementById('closePaintMode');
        if (closePaintModeBtn) {
            closePaintModeBtn.style.display = 'block';
        }
        
        // Disable text selection on the canvas
        this.canvas.style.userSelect = 'none';
        
        // Disable all text-related UI elements
        document.querySelectorAll('#textModeControls button, #textModeControls select, #textModeControls input').forEach(el => {
            el.disabled = true;
        });
        
        // Update UI to reflect paint mode
        this.updateUIForPaintMode(true);
        
        // Add window resize listener to keep paint layer positioned correctly
        window.addEventListener('resize', this.updatePaintLayerPosition.bind(this));
    }
    
    deactivate() {
        // Merge the paint layer with the background
        this.mergePaintLayer();
        
        // Remove event listeners from the paint layer if it still exists
        if (this.paintLayer) {
            this.paintLayer.removeEventListener('mousedown', this.handleMouseDown.bind(this));
            this.paintLayer.removeEventListener('mousemove', this.handleMouseMove.bind(this));
            this.paintLayer.removeEventListener('mouseup', this.handleMouseUp.bind(this));
            this.paintLayer.removeEventListener('mouseout', this.handleMouseUp.bind(this));
        }
        
        // Remove window resize listener
        window.removeEventListener('resize', this.updatePaintLayerPosition.bind(this));
        
        this.isActive = false;
        
        // Hide the close paint mode button
        const closePaintModeBtn = document.getElementById('closePaintMode');
        if (closePaintModeBtn) {
            closePaintModeBtn.style.display = 'none';
        }
        
        // Re-enable text selection on the canvas
        this.canvas.style.userSelect = 'auto';
        
        // Re-enable all text-related UI elements
        document.querySelectorAll('#textModeControls button, #textModeControls select, #textModeControls input').forEach(el => {
            el.disabled = false;
        });
        
        // Update UI to reflect text mode
        this.updateUIForPaintMode(false);
    }
    
    // Alias for initialize for compatibility
    activate() {
        this.initialize();
    }
    
    handleMouseDown(e) {
        if (!this.isActive) return;
        
        const rect = this.paintLayer.getBoundingClientRect();
        // Calculate the correct mouse position considering canvas scaling
        const scaleX = this.paintLayer.width / rect.width;
        const scaleY = this.paintLayer.height / rect.height;
        this.lastX = (e.clientX - rect.left) * scaleX;
        this.lastY = (e.clientY - rect.top) * scaleY;
        this.isPainting = true;
    }
    
    handleMouseMove(e) {
        if (!this.isPainting || !this.isActive) return;
        
        const rect = this.paintLayer.getBoundingClientRect();
        // Calculate the correct mouse position considering canvas scaling
        const scaleX = this.paintLayer.width / rect.width;
        const scaleY = this.paintLayer.height / rect.height;
        const currentX = (e.clientX - rect.left) * scaleX;
        const currentY = (e.clientY - rect.top) * scaleY;
        
        // Draw on the paint layer
        this.paintCtx.lineJoin = 'round';
        this.paintCtx.lineCap = 'round';
        this.paintCtx.lineWidth = this.brushSize;
        this.paintCtx.strokeStyle = this.brushColor;
        
        this.paintCtx.beginPath();
        this.paintCtx.moveTo(this.lastX, this.lastY);
        this.paintCtx.lineTo(currentX, currentY);
        this.paintCtx.stroke();
        
        this.lastX = currentX;
        this.lastY = currentY;
    }
    
    handleMouseUp() {
        this.isPainting = false;
    }
    
    setBrushSize(size) {
        this.brushSize = size;
    }
    
    setBrushColor(color) {
        this.brushColor = color;
    }
    
    clearPaintLayer() {
        if (this.paintCtx) {
            this.paintCtx.clearRect(0, 0, this.paintLayer.width, this.paintLayer.height);
            this.savedPaintData = null;
        }
    }
    
    // Get the paint layer as an image for merging with the background
    getPaintLayerImage() {
        return this.paintLayer;
    }
    
    // Merge paint layer with the background
    mergePaintLayer() {
        // Draw the paint layer onto the main canvas
        this.ctx.drawImage(this.paintLayer, 0, 0);
        
        // Clear the paint layer
        this.clearPaintLayer();
        
        // Remove the paint layer from the DOM
        if (this.paintLayer && this.paintLayer.parentNode) {
            this.paintLayer.parentNode.removeChild(this.paintLayer);
            this.paintLayer = null;
        }
        
        // Return the merged image data
        return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // Toggle color pick mode
    toggleColorPickMode() {
        this.isPickingColor = !this.isPickingColor;
        return this.isPickingColor;
    }
    
    // Update UI elements based on whether paint mode is active
    updateUIForPaintMode(isPaintMode) {
        // Get UI elements
        const toolsPanel = document.querySelector('.tools-panel');
        const textModeControls = document.getElementById('textModeControls');
        const paintModeControls = document.getElementById('paintModeControls');
        
        if (toolsPanel) {
            toolsPanel.style.display = isPaintMode ? 'block' : 'none';
        }
        
        if (textModeControls) {
            textModeControls.style.display = isPaintMode ? 'none' : 'block';
        }
        
        if (paintModeControls) {
            paintModeControls.style.display = isPaintMode ? 'block' : 'none';
        }
    }
    
    // Resize paint layer when canvas size changes
    resizePaintLayer(width, height) {
        if (this.paintLayer) {
            // Save current paint data
            const tempData = this.paintCtx.getImageData(0, 0, this.paintLayer.width, this.paintLayer.height);
            
            // Resize the paint layer
            this.paintLayer.width = width;
            this.paintLayer.height = height;
            
            // Restore paint data
            this.paintCtx.putImageData(tempData, 0, 0);
            
            // Update position
            this.updatePaintLayerPosition();
        }
    }
    
    // Update paint layer position to match canvas
    updatePaintLayerPosition() {
        if (this.paintLayer && this.canvas) {
            // Make sure the paint layer has the same dimensions as the canvas
            if (this.paintLayer.width !== this.canvas.width || this.paintLayer.height !== this.canvas.height) {
                this.resizePaintLayer(this.canvas.width, this.canvas.height);
            }
            
            // Position the paint layer directly over the canvas
            const canvasRect = this.canvas.getBoundingClientRect();
            const canvasContainer = this.canvas.parentNode;
            
            // Set the paint layer to match the canvas size exactly
            this.paintLayer.style.position = 'absolute';
            this.paintLayer.style.top = '0';
            this.paintLayer.style.left = '0';
            this.paintLayer.style.width = this.canvas.width + 'px';
            this.paintLayer.style.height = this.canvas.height + 'px';
            
            // Ensure the paint layer is in the same container as the canvas
            if (this.paintLayer.parentNode !== canvasContainer) {
                canvasContainer.appendChild(this.paintLayer);
            }
            
            // Remove any existing duplicate paint layers
            const paintLayers = document.querySelectorAll('#paint-layer');
            if (paintLayers.length > 1) {
                // Keep only the current paint layer, remove all others
                for (let i = 0; i < paintLayers.length; i++) {
                    if (paintLayers[i] !== this.paintLayer) {
                        paintLayers[i].remove();
                    }
                }
            }
        }
    }
}

export default PaintMode;

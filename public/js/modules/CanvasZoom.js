/**
 * CanvasZoom.js
 * Handles zooming and panning functionality for the canvas
 */
class CanvasZoom {
    constructor(textMode, canvasWrapper, initialZoom = 0.25) {
        this.textMode = textMode;
        this.canvas = textMode.canvas;
        this.canvasWrapper = canvasWrapper || document.getElementById('canvasWrapper');
        this.zoomLevel = initialZoom; // 25% initial zoom
        this.zoomStep = 0.05; // 5% increments for zoom
        this.minZoom = 0.1; // 10% minimum zoom
        this.maxZoom = 2.0; // 200% maximum zoom
        
        // Mode tracking
        this.isHandMode = true; // Start with hand mode flag true so setArrowMode() won't return early
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.canvasOffsetX = 0;
        this.canvasOffsetY = 0;
        
        // Store bound methods of textMode to preserve context
        this.textModeHandlers = {
            mousedown: this.textMode.handleMouseDown.bind(this.textMode),
            mousemove: this.textMode.handleMouseMove.bind(this.textMode),
            mouseup: this.textMode.handleMouseUp.bind(this.textMode)
        };
        
        // Initialize the canvas wrapper's transform
        this.updateZoom();
        
        // Add event listeners for mouse wheel zoom
        this.setupWheelZoom();
        
        // Set default mode to arrow mode
        this.setArrowMode();
    }
    
    /**
     * Updates the canvas display based on the current zoom level
     */
    updateZoom() {
        // Apply transform to the canvas wrapper with both zoom and pan
        this.canvasWrapper.style.transform = `translate(${this.canvasOffsetX}px, ${this.canvasOffsetY}px) scale(${this.zoomLevel})`;
        
        // Update the displayed zoom percentage if the element exists
        const zoomDisplay = document.getElementById('zoomLevel');
        if (zoomDisplay) {
            zoomDisplay.textContent = `${Math.round(this.zoomLevel * 100)}%`;
        }
        
        // Update mouse event handling scale factor for proper coordinate translation
        this.textMode.zoomFactor = this.zoomLevel;
    }
    
    /**
     * Increase zoom level
     */
    zoomIn() {
        if (this.zoomLevel < this.maxZoom) {
            this.zoomLevel = Math.min(this.maxZoom, this.zoomLevel + this.zoomStep);
            this.updateZoom();
        }
    }
    
    /**
     * Decrease zoom level
     */
    zoomOut() {
        if (this.zoomLevel > this.minZoom) {
            this.zoomLevel = Math.max(this.minZoom, this.zoomLevel - this.zoomStep);
            this.updateZoom();
        }
    }
    
    /**
     * Reset zoom to 100%
     */
    resetZoom() {
        this.zoomLevel = 1.0;
        this.canvasOffsetX = 0;
        this.canvasOffsetY = 0;
        this.updateZoom();
    }
    
    /**
     * Set zoom to a specific level
     * @param {number} level - Zoom level between minZoom and maxZoom
     */
    setZoom(level) {
        this.zoomLevel = Math.max(this.minZoom, Math.min(this.maxZoom, level));
        this.updateZoom();
    }
    
    /**
     * Fit the canvas to the available view space
     */
    fitToView() {
        const containerWidth = this.canvasWrapper.parentElement.clientWidth;
        const containerHeight = this.canvasWrapper.parentElement.clientHeight;
        
        // Calculate scale to fit
        const scaleX = containerWidth / this.canvas.width;
        const scaleY = containerHeight / this.canvas.height;
        
        // Use the smaller scale to ensure the entire canvas fits
        const fitScale = Math.min(scaleX, scaleY) * 0.9; // 90% of the fit to leave some margin
        
        // Ensure we stay within min/max zoom constraints
        this.zoomLevel = Math.max(this.minZoom, Math.min(this.maxZoom, fitScale));
        
        // Reset pan offset when fitting to view
        this.canvasOffsetX = 0;
        this.canvasOffsetY = 0;
        
        this.updateZoom();
    }
    
    /**
     * Recalculate zoom level when canvas size changes
     * This ensures the canvas is properly displayed after resizing
     */
    recalculateZoom() {
        // Get the container dimensions
        const container = this.canvasWrapper.parentElement;
        if (!container) return;
        
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Calculate new zoom level to fit the canvas in the container with some padding
        const widthRatio = (containerWidth - 40) / this.canvas.width;
        const heightRatio = (containerHeight - 40) / this.canvas.height;
        const newZoom = Math.min(widthRatio, heightRatio);
        
        console.log(`Recalculated zoom after canvas resize: ${newZoom.toFixed(2)}`);
        
        // Set the new zoom level
        this.setZoom(newZoom);
        
        // Update textMode's zoomFactor to match
        if (this.textMode) {
            this.textMode.zoomFactor = this.zoomLevel;
        }
    }
    
    /**
     * Setup mouse wheel zoom functionality
     */
    setupWheelZoom() {
        this.canvas.addEventListener('wheel', (e) => {
            // Prevent default behavior (page scrolling)
            e.preventDefault();
            
            // Determine zoom direction
            if (e.deltaY < 0) {
                // Zoom in
                this.zoomIn();
            } else {
                // Zoom out
                this.zoomOut();
            }
        });
    }
    
    /**
     * Initialize zoom controls
     */
    initZoomControls() {
        // Get control elements
        const zoomInBtn = document.getElementById('zoomInBtn');
        const zoomOutBtn = document.getElementById('zoomOutBtn');
        const resetZoomBtn = document.getElementById('resetZoomBtn');
        const handModeBtn = document.getElementById('handModeBtn');
        const arrowModeBtn = document.getElementById('arrowModeBtn');
        
        // Add event listeners
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => this.zoomIn());
        }
        
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => this.zoomOut());
        }
        
        if (resetZoomBtn) {
            resetZoomBtn.addEventListener('click', () => this.resetZoom());
        }
        
        // Add mode switching event listeners
        if (handModeBtn) {
            handModeBtn.addEventListener('click', () => this.setHandMode());
        }
        
        if (arrowModeBtn) {
            arrowModeBtn.addEventListener('click', () => this.setArrowMode());
        }
        
        // Set initial active state
        if (arrowModeBtn) {
            arrowModeBtn.classList.add('active');
        }
    }
    
    /**
     * Switch to Hand Mode (canvas panning)
     */
    setHandMode() {
        if (this.isHandMode) return; // Already in hand mode
        
        // Update UI
        const handModeBtn = document.getElementById('handModeBtn');
        const arrowModeBtn = document.getElementById('arrowModeBtn');
        
        if (handModeBtn) handModeBtn.classList.add('active');
        if (arrowModeBtn) arrowModeBtn.classList.remove('active');
        
        // Update canvas wrapper class and style
        this.canvasWrapper.classList.add('hand-mode');
        this.canvasWrapper.classList.remove('arrow-mode');
        
        // Enable canvas dragging by removing pointer-events restriction
        this.canvasWrapper.style.pointerEvents = 'all';
        
        // Add pan event listeners
        this.setupPanEventListeners();
        
        // Update mode state
        this.isHandMode = true;
        
        // Disable text mode event handling
        this.disableTextModeEvents();
        
        console.log('Switched to Hand Mode');
    }
    
    /**
     * Switch to Arrow Mode (object selection)
     */
    setArrowMode() {
        if (!this.isHandMode) return; // Already in arrow mode
        
        // Update UI
        const handModeBtn = document.getElementById('handModeBtn');
        const arrowModeBtn = document.getElementById('arrowModeBtn');
        
        if (handModeBtn) handModeBtn.classList.remove('active');
        if (arrowModeBtn) arrowModeBtn.classList.add('active');
        
        // Update canvas wrapper class and style
        this.canvasWrapper.classList.remove('hand-mode');
        this.canvasWrapper.classList.add('arrow-mode');
        
        // Prevent canvas wrapper from receiving mouse events
        // This allows events to go straight to the canvas for object selection
        this.canvasWrapper.style.pointerEvents = 'none';
        // But make sure the canvas itself still gets events
        this.canvas.style.pointerEvents = 'all';
        
        // Remove pan event listeners
        this.removePanEventListeners();
        
        // Update mode state
        this.isHandMode = false;
        
        // Re-enable text mode event handling
        this.enableTextModeEvents();
        
        console.log('Switched to Arrow Mode');
    }
    
    /**
     * Setup event listeners for canvas panning in Hand Mode
     */
    setupPanEventListeners() {
        // Store bound methods for later removal
        this.handleMouseDownBound = this.handleMouseDown.bind(this);
        this.handleMouseMoveBound = this.handleMouseMove.bind(this);
        this.handleMouseUpBound = this.handleMouseUp.bind(this);
        
        // Add event listeners
        this.canvas.addEventListener('mousedown', this.handleMouseDownBound);
        document.addEventListener('mousemove', this.handleMouseMoveBound);
        document.addEventListener('mouseup', this.handleMouseUpBound);
        
        // Prevent text selection during panning
        this.canvas.style.userSelect = 'none';
    }
    
    /**
     * Remove event listeners for canvas panning
     */
    removePanEventListeners() {
        // Remove event listeners
        if (this.handleMouseDownBound) {
            this.canvas.removeEventListener('mousedown', this.handleMouseDownBound);
        }
        
        if (this.handleMouseMoveBound) {
            document.removeEventListener('mousemove', this.handleMouseMoveBound);
        }
        
        if (this.handleMouseUpBound) {
            document.removeEventListener('mouseup', this.handleMouseUpBound);
        }
        
        // Reset text selection
        this.canvas.style.userSelect = '';
    }
    
    /**
     * Handle mouse down event for panning
     */
    handleMouseDown(e) {
        e.preventDefault();
        
        this.isDragging = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
    }
    
    /**
     * Handle mouse move event for panning
     */
    handleMouseMove(e) {
        if (!this.isDragging) return;
        
        e.preventDefault();
        
        // Calculate the distance moved
        const deltaX = e.clientX - this.lastMouseX;
        const deltaY = e.clientY - this.lastMouseY;
        
        // Update last mouse position
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        
        // Update canvas offset
        this.canvasOffsetX += deltaX;
        this.canvasOffsetY += deltaY;
        
        // Apply the transform
        this.updateZoom();
    }
    
    /**
     * Handle mouse up event for panning
     */
    handleMouseUp(e) {
        this.isDragging = false;
    }
    
    /**
     * Disable TextMode event handling
     */
    disableTextModeEvents() {
        if (!this.textMode || !this.textModeHandlers) return;
        
        // Remove event listeners from canvas
        this.canvas.removeEventListener('mousedown', this.textModeHandlers.mousedown);
        this.canvas.removeEventListener('mousemove', this.textModeHandlers.mousemove);
        this.canvas.removeEventListener('mouseup', this.textModeHandlers.mouseup);
    }
    
    /**
     * Re-enable TextMode event handling
     */
    enableTextModeEvents() {
        if (!this.textMode || !this.textModeHandlers) return;
        
        // Re-add event listeners to canvas
        this.canvas.addEventListener('mousedown', this.textModeHandlers.mousedown);
        this.canvas.addEventListener('mousemove', this.textModeHandlers.mousemove);
        this.canvas.addEventListener('mouseup', this.textModeHandlers.mouseup);
    }
}

export default CanvasZoom;

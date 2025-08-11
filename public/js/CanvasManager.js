/**
 * CanvasManager class for the text editor
 * Handles zoom, pan, and different interaction modes
 */
class CanvasManager {
    constructor(canvas, container) {
        this.canvas = canvas;
        this.container = container;
        this.ctx = canvas.getContext('2d');
        
        // Canvas properties
        this.zoomLevel = 0.25; // Start at 25% zoom
        this.panOffsetX = 0;
        this.panOffsetY = 0;
        this.isPanning = false;
        this.lastPanX = 0;
        this.lastPanY = 0;
        
        // Interaction modes
        this.MODE = {
            ARROW: 'arrow',
            HAND: 'hand',
            TEXT: 'text'
        };
        this.currentMode = this.MODE.TEXT; // Default mode is TEXT
        
        // Initialize event listeners
        this.initEventListeners();
    }
    
    /**
     * Initialize event listeners for canvas interactions
     */
    initEventListeners() {
        // Mouse wheel for zooming
        this.container.addEventListener('wheel', this.handleWheel.bind(this));
        
        // Mouse events for panning
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    }
    
    /**
     * Handle mouse wheel events for zooming
     * @param {WheelEvent} e - The wheel event
     */
    handleWheel(e) {
        e.preventDefault();
        
        // Adjust zoom level based on wheel direction
        const delta = e.deltaY < 0 ? 0.05 : -0.05;
        const newZoom = Math.max(0.1, Math.min(2, this.zoomLevel + delta));
        
        // Get the mouse position relative to the canvas
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Calculate the point in the original canvas that was under the mouse
        const oldX = (mouseX / this.zoomLevel) - this.panOffsetX;
        const oldY = (mouseY / this.zoomLevel) - this.panOffsetY;
        
        // Calculate the point in the new zoomed canvas that should be under the mouse
        const newX = (mouseX / newZoom) - this.panOffsetX;
        const newY = (mouseY / newZoom) - this.panOffsetY;
        
        // Adjust pan offset to keep the point under the mouse
        this.panOffsetX += (newX - oldX);
        this.panOffsetY += (newY - oldY);
        
        // Set the new zoom level
        this.zoomLevel = newZoom;
        
        // Trigger zoom change callback if defined
        if (this.onZoomChange) {
            this.onZoomChange(this.zoomLevel);
        }
        
        // Apply the transform
        this.applyTransform();
    }
    
    /**
     * Handle mouse down events for panning
     * @param {MouseEvent} e - The mouse event
     */
    handleMouseDown(e) {
        if (this.currentMode === this.MODE.HAND) {
            this.isPanning = true;
            this.lastPanX = e.clientX;
            this.lastPanY = e.clientY;
            this.canvas.style.cursor = 'grabbing';
        }
    }
    
    /**
     * Handle mouse move events for panning
     * @param {MouseEvent} e - The mouse event
     */
    handleMouseMove(e) {
        if (this.isPanning && this.currentMode === this.MODE.HAND) {
            const deltaX = e.clientX - this.lastPanX;
            const deltaY = e.clientY - this.lastPanY;
            
            this.panOffsetX += deltaX / this.zoomLevel;
            this.panOffsetY += deltaY / this.zoomLevel;
            
            this.lastPanX = e.clientX;
            this.lastPanY = e.clientY;
            
            // Apply the transform
            this.applyTransform();
        }
    }
    
    /**
     * Handle mouse up events for panning
     */
    handleMouseUp() {
        if (this.currentMode === this.MODE.HAND) {
            this.isPanning = false;
            this.canvas.style.cursor = 'grab';
        }
    }
    
    /**
     * Handle mouse leave events for panning
     */
    handleMouseLeave() {
        if (this.currentMode === this.MODE.HAND) {
            this.isPanning = false;
            this.canvas.style.cursor = 'grab';
        }
    }
    
    /**
     * Apply the current transform to the canvas
     */
    applyTransform() {
        // Clear the canvas
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        // Apply zoom and pan transform
        this.ctx.setTransform(
            this.zoomLevel, 0,
            0, this.zoomLevel,
            this.panOffsetX * this.zoomLevel,
            this.panOffsetY * this.zoomLevel
        );
        
        // Trigger redraw callback if defined
        if (this.onRedrawNeeded) {
            this.onRedrawNeeded();
        }
    }
    
    /**
     * Set the current interaction mode
     * @param {string} mode - The mode to set
     */
    setMode(mode) {
        if (Object.values(this.MODE).includes(mode)) {
            this.currentMode = mode;
            
            // Update cursor based on mode
            switch (mode) {
                case this.MODE.HAND:
                    this.canvas.style.cursor = 'grab';
                    break;
                case this.MODE.TEXT:
                    this.canvas.style.cursor = 'text';
                    break;
                case this.MODE.ARROW:
                default:
                    this.canvas.style.cursor = 'default';
                    break;
            }
            
            // Trigger mode change callback if defined
            if (this.onModeChange) {
                this.onModeChange(mode);
            }
        }
    }
    
    /**
     * Get the transformed mouse coordinates
     * @param {number} clientX - The client X coordinate
     * @param {number} clientY - The client Y coordinate
     * @returns {Object} - The transformed coordinates
     */
    getTransformedCoordinates(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (clientX - rect.left) / this.zoomLevel - this.panOffsetX;
        const y = (clientY - rect.top) / this.zoomLevel - this.panOffsetY;
        
        return { x, y };
    }
    
    /**
     * Reset the canvas transform
     */
    resetTransform() {
        this.zoomLevel = 0.25;
        this.panOffsetX = 0;
        this.panOffsetY = 0;
        this.applyTransform();
    }
    
    /**
     * Set zoom level directly
     * @param {number} zoom - The zoom level
     */
    setZoom(zoom) {
        this.zoomLevel = Math.max(0.1, Math.min(2, zoom));
        this.applyTransform();
        
        // Trigger zoom change callback if defined
        if (this.onZoomChange) {
            this.onZoomChange(this.zoomLevel);
        }
    }
    
    /**
     * Center the canvas view
     */
    centerView() {
        this.panOffsetX = this.container.clientWidth / 2 / this.zoomLevel - this.canvas.width / 2;
        this.panOffsetY = this.container.clientHeight / 2 / this.zoomLevel - this.canvas.height / 2;
        this.applyTransform();
    }
}

export default CanvasManager;

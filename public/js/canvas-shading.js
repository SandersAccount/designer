/**
 * Canvas Management
 * Responsible for canvas initialization, resizing, and rendering
 */

class CanvasManager {
    constructor() {
        // Get canvas element and context
        this.canvas = document.getElementById('textCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Initialize canvas
        this.setupCanvas();
        
        // Set up resize listener
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    /**
     * Sets up the canvas with appropriate dimensions and DPI scaling
     */
    setupCanvas() {
        // Get the display size of the canvas
        const displayWidth = this.canvas.clientWidth;
        const displayHeight = this.canvas.clientHeight;
        
        // Get the device pixel ratio
        const dpr = window.devicePixelRatio || 1;
        
        // Set the canvas dimensions accounting for device pixel ratio for sharp rendering
        this.canvas.width = displayWidth * dpr;
        this.canvas.height = displayHeight * dpr;
        
        // Scale the context to account for the device pixel ratio
        this.ctx.scale(dpr, dpr);
        
        // Set canvas display size
        this.canvas.style.width = `${displayWidth}px`;
        this.canvas.style.height = `${displayHeight}px`;
        
        // Store current dimensions
        this.displayWidth = displayWidth;
        this.displayHeight = displayHeight;
    }

    /**
     * Handles canvas resizing
     */
    handleResize() {
        // Reset canvas dimensions and scaling
        this.setupCanvas();
        
        // Re-render the text
        this.render();
    }

    /**
     * Clears the canvas with high-DPI scaling preservation
     */
    clear() {
        this.ctx.save();

        // Get the current scale factor (preserve high-DPI scaling)
        const transform = this.ctx.getTransform();
        const scaleFactor = transform.a; // Get the current scale factor

        // Reset transform to clear properly, but maintain the scale
        this.ctx.setTransform(scaleFactor, 0, 0, scaleFactor, 0, 0);

        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width / scaleFactor, this.canvas.height / scaleFactor);

        this.ctx.restore();
    }

    /**
     * Renders text with shadow effects
     */
    render() {
        // Clear canvas before redrawing
        this.clear();
        
        // Render text with current configuration
        textHandler.render(this.ctx, this.displayWidth, this.displayHeight);
    }
}

// Create a global instance of CanvasManager once the DOM is loaded
let canvasManager;
document.addEventListener('DOMContentLoaded', () => {
    console.log('Canvas initialization');
    canvasManager = new CanvasManager();
    
    // Initial render after a delay to ensure all components are loaded
    setTimeout(() => {
        if (canvasManager) {
            console.log('Initial canvas render');
            canvasManager.render();
        }
    }, 500);
});

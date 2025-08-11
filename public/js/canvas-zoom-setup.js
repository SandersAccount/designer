/**
 * Canvas Zoom Setup
 * This script adds zoom controls and modifies the canvas to support zooming
 */

// Execute when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Canvas zoom setup script running...');
    
    // Get the canvas element
    const canvas = document.getElementById('editor-canvas');
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }
    
    // Set the canvas size to 2048x2048
    canvas.width = 2048;
    canvas.height = 2048;
    console.log('Canvas size set to 2048x2048');
    
    // Add CSS styles for zoom functionality
    const style = document.createElement('style');
    style.textContent = `
        .canvas-wrapper {
            position: relative;
            overflow: hidden;
            transform-origin: 0 0;
            transition: transform 0.1s ease-out;
        }
        
        .zoom-controls {
            display: flex;
            align-items: center;
            background: #ffffff;
            border-radius: 25px;
            padding: 8px 15px;
            margin-bottom: 15px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }
        
        .zoom-button {
            background: none;
            border: none;
            color: #555;
            font-size: 18px;
            cursor: pointer;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: color 0.2s;
        }
        
        .zoom-button:hover {
            color: #000;
        }
        
        .zoom-level {
            margin: 0 15px;
            font-size: 14px;
            font-weight: 600;
            width: 50px;
            text-align: center;
        }
        
        .zoom-separator {
            height: 20px;
            width: 1px;
            background: #ddd;
            margin: 0 5px;
        }
    `;
    document.head.appendChild(style);
    
    // Create the wrapper element
    const canvasWrapper = document.createElement('div');
    canvasWrapper.id = 'canvasWrapper';
    canvasWrapper.className = 'canvas-wrapper';
    
    // Create zoom controls
    const zoomControls = document.createElement('div');
    zoomControls.className = 'zoom-controls';
    zoomControls.innerHTML = `
        <button class="zoom-button" id="zoomOutBtn" title="Zoom Out">
            <i class="fas fa-minus"></i>
        </button>
        <div class="zoom-separator"></div>
        <span class="zoom-level" id="zoomLevelDisplay">25%</span>
        <div class="zoom-separator"></div>
        <button class="zoom-button" id="zoomInBtn" title="Zoom In">
            <i class="fas fa-plus"></i>
        </button>
        <div class="zoom-separator"></div>
        <button class="zoom-button" id="resetZoomBtn" title="Reset Zoom">
            <i class="fas fa-undo"></i>
        </button>
        <div class="zoom-separator"></div>
        <button class="zoom-button" id="fitCanvasBtn" title="Fit to View">
            <i class="fas fa-expand"></i>
        </button>
    `;
    
    // Get the canvas container
    const canvasContainer = document.querySelector('.canvas-container');
    if (!canvasContainer) {
        console.error('Canvas container not found');
        return;
    }
    
    // Get canvas parent and backup canvas
    const canvasParent = canvas.parentNode;
    canvasParent.removeChild(canvas);
    
    // Insert zoom controls at the beginning of container
    canvasContainer.insertBefore(zoomControls, canvasContainer.firstChild);
    
    // Add the wrapper and canvas
    canvasWrapper.appendChild(canvas);
    
    // Insert wrapper before canvas menu if it exists
    const canvasMenu = canvasContainer.querySelector('.canvas-menu');
    if (canvasMenu) {
        canvasContainer.insertBefore(canvasWrapper, canvasMenu);
    } else {
        canvasContainer.appendChild(canvasWrapper);
    }
    
    console.log('Zoom controls and canvas wrapper added');
    
    // CanvasZoom class to handle zoom functionality
    class CanvasZoom {
        constructor(textMode, canvasWrapper, initialZoom = 0.25) {
            this.textMode = textMode;
            this.canvas = textMode.canvas;
            this.canvasWrapper = canvasWrapper;
            this.zoomLevel = initialZoom; // 25% initial zoom
            this.zoomStep = 0.05; // 5% increments for zoom
            this.minZoom = 0.1; // 10% minimum zoom
            this.maxZoom = 2.0; // 200% maximum zoom
            
            // Initialize the canvas wrapper's transform
            this.updateZoom();
            
            // Add event listeners for mouse wheel zoom
            this.setupWheelZoom();
            this.initZoomControls();
        }
        
        /**
         * Updates the canvas display based on the current zoom level
         */
        updateZoom() {
            // Apply transform to the canvas wrapper
            this.canvasWrapper.style.transform = `scale(${this.zoomLevel})`;
            
            // Update the displayed zoom percentage if the element exists
            const zoomDisplay = document.getElementById('zoomLevelDisplay');
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
            this.updateZoom();
        }
        
        /**
         * Setup mouse wheel zoom functionality
         */
        setupWheelZoom() {
            this.canvas.addEventListener('wheel', (e) => {
                // Prevent default behavior (page scrolling)
                e.preventDefault();
                
                // Check if Ctrl key is pressed for zoom (Windows/Linux) or Command key (Mac)
                if (e.ctrlKey || e.metaKey) {
                    if (e.deltaY < 0) {
                        // Zoom in
                        this.zoomIn();
                    } else {
                        // Zoom out
                        this.zoomOut();
                    }
                }
            }, { passive: false });
        }
        
        /**
         * Initialize zoom controls
         */
        initZoomControls() {
            const zoomInBtn = document.getElementById('zoomInBtn');
            const zoomOutBtn = document.getElementById('zoomOutBtn');
            const resetZoomBtn = document.getElementById('resetZoomBtn');
            const fitCanvasBtn = document.getElementById('fitCanvasBtn');
            
            if (zoomInBtn) {
                zoomInBtn.addEventListener('click', () => this.zoomIn());
            }
            
            if (zoomOutBtn) {
                zoomOutBtn.addEventListener('click', () => this.zoomOut());
            }
            
            if (resetZoomBtn) {
                resetZoomBtn.addEventListener('click', () => this.resetZoom());
            }
            
            if (fitCanvasBtn) {
                fitCanvasBtn.addEventListener('click', () => this.fitToView());
            }
        }
    }
    
    // Initialize CanvasZoom after a delay to ensure textMode is initialized
    setTimeout(() => {
        if (window.textMode) {
            console.log('Initializing canvas zoom with TextMode...');
            window.canvasZoom = new CanvasZoom(window.textMode, canvasWrapper, 0.25);
            console.log('Canvas zoom initialized successfully');
        } else {
            console.error('TextMode not available for zoom initialization');
        }
    }, 500);
});

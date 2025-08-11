/**
 * Initialize zoom functionality for the canvas editor
 */
import CanvasZoom from './modules/CanvasZoom.js';

// Initialize canvas zoom when the window loads
window.initCanvasZoom = function(textMode) {
    const canvasWrapper = document.getElementById('canvasWrapper');
    
    if (!canvasWrapper) {
        console.error('Canvas wrapper element not found');
        return null;
    }
    
    if (!textMode) {
        console.error('TextMode instance not provided');
        return null;
    }
    
    console.log('Initializing canvas zoom functionality...');
    
    // Initialize with a zoom level that fits the canvas to the viewport
    // For a 2048x2048 canvas, we need a smaller initial zoom
    const canvas = document.getElementById('editor-canvas');
    const container = document.querySelector('.canvas-container');
    
    if (!canvas || !container) {
        console.error('Canvas or container elements not found');
        return null;
    }
    
    // Calculate initial zoom based on canvas and container dimensions
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // Calculate zoom to fit the canvas in the container with some padding
    const widthRatio = (containerWidth - 40) / canvasWidth;
    const heightRatio = (containerHeight - 40) / canvasHeight;
    const initialZoom = Math.min(widthRatio, heightRatio);
    
    console.log(`Calculated initial zoom: ${initialZoom.toFixed(2)}`);
    
    // Initialize with the calculated zoom level
    const canvasZoom = new CanvasZoom(textMode, canvasWrapper, initialZoom);
    
    // Initialize zoom controls
    canvasZoom.initZoomControls();
    
    // Set initial zoom
    canvasZoom.setZoom(initialZoom);
    
    // Update textMode's zoomFactor to match
    textMode.zoomFactor = initialZoom;
    
    console.log('Canvas zoom initialized successfully');
    
    return canvasZoom;
};

// Function to modify the canvas size
window.setCanvasSize = function(width, height) {
    const canvas = document.getElementById('editor-canvas');
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }
    
    console.log(`Setting canvas size to ${width}x${height}`);
    
    // Update canvas dimensions
    canvas.width = width;
    canvas.height = height;
    
    // Recalculate zoom if canvasZoom exists
    if (window.canvasZoom && typeof window.canvasZoom.recalculateZoom === 'function') {
        window.canvasZoom.recalculateZoom();
    }
    
    // Notify user of the change
    if (window.showToast) {
        window.showToast(`Canvas resized to ${width}x${height}`);
    }
};

// Initialize zoom when the script loads
console.log('Zoom module loaded. Waiting for TextMode...');

// Try to initialize right away if textMode exists
setTimeout(() => {
    if (window.textMode) {
        console.log('TextMode found. Initializing zoom...');
        window.canvasZoom = window.initCanvasZoom(window.textMode);
    } else {
        console.log('TextMode not yet available. Will try again...');
        
        // Try again after a short delay
        setTimeout(() => {
            if (window.textMode) {
                console.log('TextMode found on second attempt. Initializing zoom...');
                window.canvasZoom = window.initCanvasZoom(window.textMode);
            } else {
                console.error('TextMode not available for zoom initialization');
                
                // Try one more time with a longer delay
                setTimeout(() => {
                    if (window.textMode) {
                        console.log('TextMode found on third attempt. Initializing zoom...');
                        window.canvasZoom = window.initCanvasZoom(window.textMode);
                    } else {
                        console.error('TextMode not available after multiple attempts. Please refresh the page.');
                    }
                }, 2000);
            }
        }, 1000);
    }
}, 100);

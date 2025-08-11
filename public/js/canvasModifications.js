document.addEventListener(" DOMContentLoaded\, function() {
 // Get the canvas element
 const canvas = document.getElementById(\editor-canvas\);
 if (!canvas) return;
 
 // Set the canvas size to 2048x2048
 canvas.width = 2048;
 canvas.height = 2048;
 
 // Create the wrapper element
 const canvasWrapper = document.createElement(\div\);
 canvasWrapper.id = \canvasWrapper\;
 canvasWrapper.className = \canvas-wrapper\;
 
 // Create zoom controls
 const zoomControls = document.createElement(\div\);
 zoomControls.className = \zoom-controls\;
 zoomControls.innerHTML = 
 <button class=\zoom-button\ id=\zoomOutBtn\ title=\Zoom Out\>
 <i class=\fas fa-minus\></i>
 </button>
 <div class=\zoom-separator\></div>
 <span class=\zoom-level\ id=\zoomLevelDisplay\>25%</span>
 <div class=\zoom-separator\></div>
 <button class=\zoom-button\ id=\zoomInBtn\ title=\Zoom In\>
 <i class=\fas fa-plus\></i>
 </button>
 <div class=\zoom-separator\></div>
 <button class=\zoom-button\ id=\resetZoomBtn\ title=\Reset Zoom\>
 <i class=\fas fa-undo\></i>
 </button>
 <div class=\zoom-separator\></div>
 <button class=\zoom-button\ id=\fitCanvasBtn\ title=\Fit to View\>
 <i class=\fas fa-expand\></i>
 </button>
 ;
 
 // Get the canvas container
 const canvasContainer = document.querySelector(\.canvas-container\);
 if (!canvasContainer) return;
 
 // Backup the canvas
 const canvasParent = canvas.parentNode;
 canvasParent.removeChild(canvas);
 
 // Append the zoom controls
 canvasContainer.insertBefore(zoomControls, canvasContainer.firstChild);
 
 // Append the wrapper and canvas
 canvasWrapper.appendChild(canvas);
 if (canvasContainer.querySelector(\.canvas-menu\)) {
 canvasContainer.insertBefore(canvasWrapper, canvasContainer.querySelector(\.canvas-menu\));
 } else {
 canvasContainer.appendChild(canvasWrapper);
 }
 
 // Initialize CanvasZoom after a delay to ensure textMode is initialized
 setTimeout(() => {
 if (window.textMode && window.initCanvasZoom) {
 window.canvasZoom = window.initCanvasZoom(window.textMode);
 }
 }, 500);
});
document.addEventListener(" DOMContentLoaded\, function() {
 // Get the canvas element
 const canvas = document.getElementById(\editor-canvas\);
 if (!canvas) return;
 
 // Set the canvas size to 2048x2048
 canvas.width = 2048;
 canvas.height = 2048;
 
 // Create the wrapper element
 const canvasWrapper = document.createElement(\div\);
 canvasWrapper.id = \canvasWrapper\;
 canvasWrapper.className = \canvas-wrapper\;
 
 // Create zoom controls
 const zoomControls = document.createElement(\div\);
 zoomControls.className = \zoom-controls\;
 zoomControls.innerHTML = 
 <button class=\zoom-button\ id=\zoomOutBtn\ title=\Zoom Out\>
 <i class=\fas fa-minus\></i>
 </button>
 <div class=\zoom-separator\></div>
 <span class=\zoom-level\ id=\zoomLevelDisplay\>25%</span>
 <div class=\zoom-separator\></div>
 <button class=\zoom-button\ id=\zoomInBtn\ title=\Zoom In\>
 <i class=\fas fa-plus\></i>
 </button>
 <div class=\zoom-separator\></div>
 <button class=\zoom-button\ id=\resetZoomBtn\ title=\Reset Zoom\>
 <i class=\fas fa-undo\></i>
 </button>
 <div class=\zoom-separator\></div>
 <button class=\zoom-button\ id=\fitCanvasBtn\ title=\Fit to View\>
 <i class=\fas fa-expand\></i>
 </button>
 ;
 
 // Get the canvas container
 const canvasContainer = document.querySelector(\.canvas-container\);
 if (!canvasContainer) return;
 
 // Backup the canvas
 const canvasParent = canvas.parentNode;
 canvasParent.removeChild(canvas);
 
 // Append the zoom controls
 canvasContainer.insertBefore(zoomControls, canvasContainer.firstChild);
 
 // Append the wrapper and canvas
 canvasWrapper.appendChild(canvas);
 if (canvasContainer.querySelector(\.canvas-menu\)) {
 canvasContainer.insertBefore(canvasWrapper, canvasContainer.querySelector(\.canvas-menu\));
 } else {
 canvasContainer.appendChild(canvasWrapper);
 }
 
 // Initialize CanvasZoom after a delay to ensure textMode is initialized
 setTimeout(() => {
 if (window.textMode && window.initCanvasZoom) {
 window.canvasZoom = window.initCanvasZoom(window.textMode);
 }
 }, 500);
});

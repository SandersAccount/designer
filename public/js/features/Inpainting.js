export class Inpainting {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.isDrawing = false;
        this.brushSize = 20;
        
        // Create drawing layer with black background
        this.drawingLayer = document.createElement('canvas');
        this.drawingLayer.width = canvas.width;
        this.drawingLayer.height = canvas.height;
        this.drawingCtx = this.drawingLayer.getContext('2d');
        this.drawingCtx.fillStyle = 'black';
        this.drawingCtx.fillRect(0, 0, this.drawingLayer.width, this.drawingLayer.height);
        
        this.setupEvents();
        this.loadModels();
    }

    async loadModels() {
        try {
            // Get the model selector element
            const modelSelector = document.getElementById('modelSelector');
            if (!modelSelector) return;

            // Fetch available models from the server
            const response = await fetch('/api/inpainting/models');
            if (!response.ok) {
                throw new Error('Failed to load models');
            }

            const models = await response.json();

            // Clear existing options
            modelSelector.innerHTML = '';

            // Add options for each model
            models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.id;
                option.textContent = model.name;
                option.title = model.description;
                modelSelector.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading models:', error);
            showToast('Failed to load inpainting models', 'error');
        }
    }

    setBrushSize(size) {
        this.brushSize = size;
    }

    setupEvents() {
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));
    }

    startDrawing(e) {
        this.isDrawing = true;
        const pos = this.getMousePos(e);
        
        // Setup drawing layer (white strokes for mask)
        this.drawingCtx.beginPath();
        this.drawingCtx.moveTo(pos.x, pos.y);
        this.drawingCtx.strokeStyle = 'white';
        this.drawingCtx.lineWidth = this.brushSize;
        this.drawingCtx.lineCap = 'round';
        this.drawingCtx.globalAlpha = 1.0;
        
        // Setup visual overlay (blue strokes for user feedback)
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
        this.ctx.strokeStyle = 'rgba(0, 0, 255, 0.5)';
        this.ctx.lineWidth = this.brushSize;
        this.ctx.lineCap = 'round';
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    draw(e) {
        if (!this.isDrawing) return;
        const pos = this.getMousePos(e);
        
        // Draw white on the drawing layer (for mask)
        this.drawingCtx.lineTo(pos.x, pos.y);
        this.drawingCtx.stroke();
        
        // Draw blue overlay for visual feedback
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
    }

    stopDrawing() {
        this.isDrawing = false;
        this.drawingCtx.closePath();
        this.ctx.closePath();
    }

    clear() {
        // Clear drawing layer to black
        this.drawingCtx.fillStyle = 'black';
        this.drawingCtx.fillRect(0, 0, this.drawingLayer.width, this.drawingLayer.height);
        
        // Clear blue overlay
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.canvas.baseImage) {
            this.ctx.drawImage(this.canvas.baseImage, 0, 0, this.canvas.width, this.canvas.height);
        }
    }

    createMask() {
        // Create a mask canvas at the same size as the original image
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = this.canvas.width;
        maskCanvas.height = this.canvas.height;
        const maskCtx = maskCanvas.getContext('2d');
        
        // Draw the drawing layer onto the mask canvas
        maskCtx.drawImage(this.drawingLayer, 0, 0);

        return maskCanvas.toDataURL('image/png');
    }

    async applyInpainting(prompt, modelId = 'flux') {
        try {
            // Get the original image URL from the URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const originalImageUrl = urlParams.get('image');

            // Use original URL if available, otherwise use canvas data
            const imageDataUrl = originalImageUrl || this.canvas.toDataURL();

            // Get the original image and mask at full resolution
            const maskDataUrl = this.createMask();

            console.log('Image size:', Math.round(imageDataUrl.length / 1024), 'KB');
            console.log('Mask size:', Math.round(maskDataUrl.length / 1024), 'KB');
            console.log('Using model:', modelId);

            const response = await fetch('/api/inpainting', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: imageDataUrl,
                    mask: maskDataUrl,
                    prompt: prompt,
                    modelId: modelId
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || 'Inpainting failed');
            }

            const result = await response.json();
            // Ensure the response is valid
            if (!result || !result.output) {
                throw new Error('Invalid response from server');
            }

            let newImageUrl = result.output;
            
            // Convert relative URL to absolute URL if needed
            if (newImageUrl && newImageUrl.startsWith('/')) {
                newImageUrl = window.location.origin + newImageUrl;
            }

            console.log('New image URL:', newImageUrl);
            
            // Verify URL accessibility
            if (!newImageUrl) {
                throw new Error('New image URL is undefined');
            }
            console.log('Attempting to fetch image from URL:', newImageUrl);
            try {
                const urlResponse = await fetch(newImageUrl, { method: 'HEAD' });
                if (!urlResponse.ok) {
                    throw new Error(`Image URL not accessible: ${newImageUrl}`);
                }
                console.log('Image URL is accessible:', newImageUrl);
            } catch (urlError) {
                console.error('Error accessing image URL:', urlError);
                throw new Error('Failed to access image URL for inpainting');
            }

            // Load the new image
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            await new Promise((resolve, reject) => {
                img.onload = () => {
                    // Clear both canvases
                    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    this.clear();
                    
                    // Draw the new image
                    this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
                    
                    // Dispatch event with new image URL
                    const event = new CustomEvent('imageUpdated', {
                        detail: { imageUrl: newImageUrl }
                    });
                    this.canvas.dispatchEvent(event);
                    
                    resolve();
                };
                img.onerror = reject;
                img.src = newImageUrl;
            });
            
            return newImageUrl;
        } catch (error) {
            console.error('Inpainting error:', error);
            throw error;
        }
    }
}

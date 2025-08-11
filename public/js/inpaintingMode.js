// Inpainting Mode functionality
class InpaintingMode {
    constructor(canvas, ctx, editor) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.editor = editor; // Store reference to parent editor
        this.isDrawing = false;
        this.maskCanvas = document.createElement('canvas');
        this.maskCtx = this.maskCanvas.getContext('2d');
        this.brushSize = 20;
        this.lastX = 0;
        this.lastY = 0;
    }

    initialize() {
        this.setupMaskCanvas();
        this.setupEventListeners();
        
        // Update brush size from editor if available
        if (this.editor && this.editor.brushSize) {
            this.setBrushSize(this.editor.brushSize);
        } else {
            // Fallback to slider if editor brush size not available
            const brushSizeSlider = document.getElementById('brushSizeSlider');
            if (brushSizeSlider) {
                this.setBrushSize(parseInt(brushSizeSlider.value));
            }
        }
    }

    setupMaskCanvas() {
        this.maskCanvas.width = this.canvas.width;
        this.maskCanvas.height = this.canvas.height;
        this.maskCtx.fillStyle = 'black';
        this.maskCtx.fillRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));
        
        // Listen for brush size changes from slider
        const brushSizeSlider = document.getElementById('brushSizeSlider');
        if (brushSizeSlider) {
            brushSizeSlider.addEventListener('input', (e) => {
                this.setBrushSize(parseInt(e.target.value));
                // Update the display value
                const brushSizeValue = document.getElementById('brushSizeValue');
                if (brushSizeValue) {
                    brushSizeValue.textContent = this.brushSize;
                }
            });
        }
    }

    startDrawing(e) {
        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        this.lastX = e.clientX - rect.left;
        this.lastY = e.clientY - rect.top;
        this.draw(e);
    }

    draw(e) {
        if (!this.isDrawing) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Sync with editor brush size if available
        if (this.editor && this.editor.brushSize) {
            this.brushSize = this.editor.brushSize;
        }

        // Setup drawing style for both canvases
        [this.ctx, this.maskCtx].forEach(context => {
            context.lineWidth = this.brushSize;
            context.lineCap = 'round';
            context.lineJoin = 'round';
            context.beginPath();
            context.moveTo(this.lastX, this.lastY);
            context.lineTo(x, y);
        });

        // Draw preview on main canvas
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.stroke();

        // Draw on mask canvas
        this.maskCtx.strokeStyle = 'white';
        this.maskCtx.stroke();

        this.lastX = x;
        this.lastY = y;
    }

    stopDrawing() {
        this.isDrawing = false;
    }

    setBrushSize(size) {
        this.brushSize = parseInt(size);
        // Update editor brush size if available
        if (this.editor) {
            this.editor.brushSize = this.brushSize;
        }
        console.log(`Brush size set to: ${this.brushSize}`);
    }

    getMask() {
        return this.maskCanvas;
    }
    
    clearMask() {
        // Clear the mask canvas by filling it with black
        this.maskCtx.fillStyle = 'black';
        this.maskCtx.fillRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);
        
        // Also clear any preview on the main canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    updateFromEditor() {
        if (this.editor && this.editor.brushSize) {
            this.setBrushSize(this.editor.brushSize);
        }
    }
}

export default InpaintingMode;

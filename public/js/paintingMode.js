// Painting Mode functionality
class PaintingMode {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.isDrawing = false;
        this.brushSize = 5;
        this.brushColor = '#000000';
        this.active = false;
        
        // Create cursor preview layer
        this.cursorLayer = document.createElement('canvas');
        this.cursorLayer.style.position = 'absolute';
        this.cursorLayer.style.pointerEvents = 'none';
        this.cursorLayer.style.top = '0';
        this.cursorLayer.style.left = '0';
        this.cursorLayer.width = canvas.width;
        this.cursorLayer.height = canvas.height;
        this.cursorCtx = this.cursorLayer.getContext('2d');
        
        // Add cursor layer to canvas container
        const canvasContainer = canvas.parentElement;
        this.cursorLayer.style.display = 'none';
        canvasContainer.appendChild(this.cursorLayer);
        
        // Bind event handlers
        this.boundStartDrawing = this.startDrawing.bind(this);
        this.boundDraw = this.draw.bind(this);
        this.boundStopDrawing = this.stopDrawing.bind(this);
        this.boundUpdateCursor = this.updateCursor.bind(this);
    }

    activate() {
        this.active = true;
        this.cursorLayer.style.display = 'block';
        this.setupEventListeners();
    }

    deactivate() {
        this.active = false;
        this.cursorLayer.style.display = 'none';
        this.removeEventListeners();
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', this.boundStartDrawing);
        this.canvas.addEventListener('mousemove', this.boundDraw);
        this.canvas.addEventListener('mousemove', this.boundUpdateCursor);
        this.canvas.addEventListener('mouseup', this.boundStopDrawing);
        this.canvas.addEventListener('mouseout', this.boundStopDrawing);
    }

    removeEventListeners() {
        this.canvas.removeEventListener('mousedown', this.boundStartDrawing);
        this.canvas.removeEventListener('mousemove', this.boundDraw);
        this.canvas.removeEventListener('mousemove', this.boundUpdateCursor);
        this.canvas.removeEventListener('mouseup', this.boundStopDrawing);
        this.canvas.removeEventListener('mouseout', this.boundStopDrawing);
    }

    updateCursor(e) {
        if (!this.active) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Clear previous cursor
        this.cursorCtx.clearRect(0, 0, this.cursorLayer.width, this.cursorLayer.height);

        // Draw new cursor
        this.cursorCtx.beginPath();
        this.cursorCtx.arc(x, y, this.brushSize/2, 0, Math.PI * 2);
        this.cursorCtx.strokeStyle = '#ffffff';
        this.cursorCtx.lineWidth = 1;
        this.cursorCtx.stroke();
    }

    startDrawing(e) {
        if (!this.active) return;
        
        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
    }

    draw(e) {
        if (!this.active || !this.isDrawing) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.ctx.lineWidth = this.brushSize;
        this.ctx.lineCap = 'round';
        this.ctx.strokeStyle = this.brushColor;
        
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
    }

    stopDrawing() {
        if (!this.active) return;
        this.isDrawing = false;
        this.ctx.beginPath();
    }

    setBrushSize(size) {
        this.brushSize = size;
    }

    setBrushColor(color) {
        this.brushColor = color;
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

export default PaintingMode;

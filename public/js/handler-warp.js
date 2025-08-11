// Handler Warp Implementation
class HandlerWarp {
    constructor(canvas, textObject) {
        this.canvas = canvas;
        this.textObject = textObject;
        this.controlPoints = textObject.controlPoints || [];
        this.initialControlPoints = textObject.initialControlPoints || [];
        this.numCols = textObject.handlerWarpNumCols || 5;
        this.numRows = textObject.handlerWarpNumRows || 3;
        this.pointRadius = 6;
        this.isDragging = false;
        this.selectedPoint = null;
        
        if (this.controlPoints.length === 0) {
            this.initializeControlPoints();
        }
        
        this.setupEventListeners();
    }

    initializeControlPoints() {
        const bounds = this.textObject.getBoundingRect();
        const padding = 20;
        
        // Calculate grid cell size
        const cellWidth = (bounds.width + padding * 2) / (this.numCols - 1);
        const cellHeight = (bounds.height + padding * 2) / (this.numRows - 1);
        
        // Create control points grid
        for (let row = 0; row < this.numRows; row++) {
            for (let col = 0; col < this.numCols; col++) {
                const x = bounds.left - padding + col * cellWidth;
                const y = bounds.top - padding + row * cellHeight;
                
                this.controlPoints.push({ x, y });
                this.initialControlPoints.push({ x, y });
            }
        }
        
        // Store the points in the text object for persistence
        this.textObject.controlPoints = this.controlPoints;
        this.textObject.initialControlPoints = this.initialControlPoints;
    }

    setupEventListeners() {
        this.canvas.on('mouse:down', this.onMouseDown.bind(this));
        this.canvas.on('mouse:move', this.onMouseMove.bind(this));
        this.canvas.on('mouse:up', this.onMouseUp.bind(this));
    }

    onMouseDown(e) {
        if (!e.target || e.target !== this.textObject) return;
        
        const pointer = this.canvas.getPointer(e.e);
        
        // Check if we clicked on a control point
        this.selectedPoint = this.controlPoints.find(point => {
            const dx = point.x - pointer.x;
            const dy = point.y - pointer.y;
            return Math.sqrt(dx * dx + dy * dy) < this.pointRadius;
        });
        
        if (this.selectedPoint) {
            this.isDragging = true;
            this.canvas.selection = false;
        }
    }

    onMouseMove(e) {
        if (!this.isDragging || !this.selectedPoint) return;
        
        const pointer = this.canvas.getPointer(e.e);
        
        // Update the selected point position
        this.selectedPoint.x = pointer.x;
        this.selectedPoint.y = pointer.y;
        
        // Apply the warp effect
        this.applyWarpEffect();
        
        this.canvas.requestRenderAll();
    }

    onMouseUp() {
        this.isDragging = false;
        this.selectedPoint = null;
        this.canvas.selection = true;
    }

    applyWarpEffect() {
        // Implementation of the warp effect using the control points
        // This is where you would apply the transformation to the text
        // For now, we'll just draw the control points for visualization
        
        // Store the updated points in the text object
        this.textObject.controlPoints = this.controlPoints;
    }

    render() {
        // Draw control points
        const ctx = this.canvas.getContext();
        
        ctx.save();
        
        // Draw lines between control points
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 0.5;
        
        for (let row = 0; row < this.numRows; row++) {
            for (let col = 0; col < this.numCols - 1; col++) {
                const i = row * this.numCols + col;
                const point1 = this.controlPoints[i];
                const point2 = this.controlPoints[i + 1];
                
                ctx.beginPath();
                ctx.moveTo(point1.x, point1.y);
                ctx.lineTo(point2.x, point2.y);
                ctx.stroke();
            }
        }
        
        for (let col = 0; col < this.numCols; col++) {
            for (let row = 0; row < this.numRows - 1; row++) {
                const i = row * this.numCols + col;
                const point1 = this.controlPoints[i];
                const point2 = this.controlPoints[i + this.numCols];
                
                ctx.beginPath();
                ctx.moveTo(point1.x, point1.y);
                ctx.lineTo(point2.x, point2.y);
                ctx.stroke();
            }
        }
        
        // Draw control points
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#00f';
        ctx.lineWidth = 2;
        
        this.controlPoints.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, this.pointRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });
        
        ctx.restore();
    }
}

// Add the handler to the window object
window.HandlerWarp = HandlerWarp;

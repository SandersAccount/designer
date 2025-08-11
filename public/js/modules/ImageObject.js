/**
 * ImageObject.js - Implements a draggable, scalable image object for the text editor
 */
export default class ImageObject {
    constructor(img, canvas) {
        this.image = img;
        this.canvas = canvas;
        this.x = canvas.width / 2 - img.naturalWidth / 2;
        this.y = canvas.height / 2 - img.naturalHeight / 2;
        this.width = img.naturalWidth;
        this.height = img.naturalHeight;
        this.scale = 1;
        this.angle = 0;
        this.isDragging = false;
        this.isResizing = false;
        this.resizeHandle = { size: 10 }; // Size of resize handle
        this.selected = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragStartWidth = 0;
        this.dragStartHeight = 0;
    }

    isPointInImage(x, y) {
        // Check if point is within the image bounds
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        // Transform the point based on image rotation
        const dx = x - centerX;
        const dy = y - centerY;
        const angleRad = -this.angle * Math.PI / 180;
        
        const rotatedX = dx * Math.cos(angleRad) - dy * Math.sin(angleRad) + centerX;
        const rotatedY = dx * Math.sin(angleRad) + dy * Math.cos(angleRad) + centerY;
        
        return (
            rotatedX >= this.x && 
            rotatedX <= this.x + this.width && 
            rotatedY >= this.y && 
            rotatedY <= this.y + this.height
        );
    }

    isPointInResizeHandle(x, y) {
        // Check if point is within the resize handle (bottom right corner)
        const handleX = this.x + this.width - this.resizeHandle.size / 2;
        const handleY = this.y + this.height - this.resizeHandle.size / 2;
        
        // Transform for rotation
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        const dx = handleX - centerX;
        const dy = handleY - centerY;
        const angleRad = this.angle * Math.PI / 180;
        
        const rotatedHandleX = dx * Math.cos(angleRad) - dy * Math.sin(angleRad) + centerX;
        const rotatedHandleY = dx * Math.sin(angleRad) + dy * Math.cos(angleRad) + centerY;
        
        return (
            Math.abs(x - rotatedHandleX) < this.resizeHandle.size && 
            Math.abs(y - rotatedHandleY) < this.resizeHandle.size
        );
    }

    startDrag(x, y) {
        this.isDragging = true;
        this.dragStartX = x - this.x;
        this.dragStartY = y - this.y;
    }

    startResize(x, y) {
        this.isResizing = true;
        this.dragStartX = x;
        this.dragStartY = y;
        this.dragStartWidth = this.width;
        this.dragStartHeight = this.height;
    }

    stopDrag() {
        this.isDragging = false;
        this.isResizing = false;
    }

    drag(x, y) {
        if (this.isDragging) {
            this.x = x - this.dragStartX;
            this.y = y - this.dragStartY;
            return true;
        }
        return false;
    }

    resize(x, y) {
        if (this.isResizing) {
            // Calculate new size based on drag distance
            const dx = x - this.dragStartX;
            const dy = y - this.dragStartY;
            
            // Calculate distance
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Get the angle of the drag
            const dragAngle = Math.atan2(dy, dx) * 180 / Math.PI;
            
            // Get the angle of the drag relative to the image rotation
            const relativeAngle = dragAngle - this.angle;
            const relativeAngleRad = relativeAngle * Math.PI / 180;
            
            // Calculate new dimensions while maintaining aspect ratio
            const aspect = this.dragStartWidth / this.dragStartHeight;
            
            // Calculate new size based on drag projection in the direction of the corner
            const dragComponent = distance * Math.cos(relativeAngleRad) * Math.cos(relativeAngleRad) + 
                                  distance * Math.sin(relativeAngleRad) * Math.sin(relativeAngleRad);
            
            // Scale factor based on drag distance
            const scaleFactor = 1 + dragComponent / (Math.sqrt(this.dragStartWidth * this.dragStartWidth + this.dragStartHeight * this.dragStartHeight));
            
            // Apply scaling, maintaining aspect ratio
            this.width = this.dragStartWidth * scaleFactor;
            this.height = this.dragStartHeight * scaleFactor;
            
            return true;
        }
        return false;
    }

    rotate(angle) {
        this.angle += angle;
        if (this.angle > 360) this.angle -= 360;
        if (this.angle < 0) this.angle += 360;
    }

    draw(ctx, isSelected = false) {
        ctx.save();
        
        // Move to the center of the image
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        ctx.translate(centerX, centerY);
        
        // Apply rotation
        if (this.angle) {
            ctx.rotate(this.angle * Math.PI / 180);
        }
        
        // Draw the image
        ctx.drawImage(
            this.image, 
            -this.width / 2, 
            -this.height / 2, 
            this.width, 
            this.height
        );
        
        // If selected, draw outline and handles
        if (isSelected) {
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#1E90FF';
            ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
            
            // Draw resize handle
            ctx.fillStyle = '#1E90FF';
            const handleSize = this.resizeHandle.size;
            
            // Bottom right handle
            ctx.fillRect(
                this.width / 2 - handleSize / 2, 
                this.height / 2 - handleSize / 2, 
                handleSize, 
                handleSize
            );
            
            // Rotation indicator
            ctx.beginPath();
            ctx.moveTo(0, -this.height / 2 - 10);
            ctx.lineTo(0, -this.height / 2 - 30);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(0, -this.height / 2 - 30, 5, 0, 2 * Math.PI);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

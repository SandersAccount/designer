/**
 * ImageObject class for the text editor
 * Handles movable, resizable images within the canvas
 */
class ImageObject {
    constructor(src, x, y, width, height) {
        this.id = Date.now();
        this.src = src;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.angle = 0;
        this.scale = 1;
        this.isLoaded = false;
        this.image = new Image();
        this.image.crossOrigin = 'Anonymous';

        // Load the image
        this.image.onload = () => {
            this.isLoaded = true;
            // If width and height are not specified, use the image's natural dimensions
            if (!this.width || !this.height) {
                this.width = this.image.naturalWidth;
                this.height = this.image.naturalHeight;
            }
        };
        this.image.onerror = (err) => {
            console.error('Failed to load image:', err);
        };
        this.image.src = src;
    }

    /**
     * Draw the image on the canvas
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
     */
    draw(ctx) {
        if (!this.isLoaded) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle * Math.PI / 180);
        ctx.scale(this.scale, this.scale);
        
        // Draw the image centered on its position
        ctx.drawImage(
            this.image, 
            -this.width / 2, 
            -this.height / 2, 
            this.width, 
            this.height
        );
        
        ctx.restore();
    }

    /**
     * Check if a point is within the image
     * @param {number} x - The x coordinate
     * @param {number} y - The y coordinate
     * @returns {boolean} - True if the point is within the image
     */
    containsPoint(x, y) {
        // Convert angle to radians
        const angleRad = this.angle * Math.PI / 180;
        
        // Translate point to origin
        const dx = x - this.x;
        const dy = y - this.y;
        
        // Rotate point around origin
        const rotatedX = dx * Math.cos(-angleRad) - dy * Math.sin(-angleRad);
        const rotatedY = dx * Math.sin(-angleRad) + dy * Math.cos(-angleRad);
        
        // Apply scale
        const scaledX = rotatedX / this.scale;
        const scaledY = rotatedY / this.scale;
        
        // Check if point is within image boundaries
        return (
            scaledX >= -this.width / 2 &&
            scaledX <= this.width / 2 &&
            scaledY >= -this.height / 2 &&
            scaledY <= this.height / 2
        );
    }

    /**
     * Set the position of the image
     * @param {number} x - The x coordinate
     * @param {number} y - The y coordinate
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * Set the size of the image
     * @param {number} width - The width
     * @param {number} height - The height
     */
    setSize(width, height) {
        this.width = width;
        this.height = height;
    }

    /**
     * Set the angle of the image
     * @param {number} angle - The angle in degrees
     */
    setAngle(angle) {
        this.angle = angle;
    }

    /**
     * Set the scale of the image
     * @param {number} scale - The scale factor
     */
    setScale(scale) {
        this.scale = scale;
    }

    /**
     * Get the bounding box of the image
     * @returns {Object} - The bounding box
     */
    getBoundingBox() {
        const halfWidth = (this.width * this.scale) / 2;
        const halfHeight = (this.height * this.scale) / 2;
        
        return {
            x: this.x - halfWidth,
            y: this.y - halfHeight,
            width: this.width * this.scale,
            height: this.height * this.scale
        };
    }
}

export default ImageObject;

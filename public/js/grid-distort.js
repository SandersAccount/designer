/**
 * Grid Distort Effect for Text
 * This module implements a grid distortion effect for text using OpenType.js
 */

// Grid Distort state
let gridDistortState = {
    gridCols: 3,
    gridRows: 2,
    gridPadding: 80,
    intensity: 1.0,
    controlPoints: [],
    showGrid: false
};

// DOM elements for grid points
let gridPointElements = [];

/**
 * Initialize the grid distort effect
 * @param {Object} textObj - The text object to apply the effect to
 */
function initializeGridDistort(textObj) {
    // Clear any existing grid points
    clearGridPoints();
    
    // Initialize control points based on current settings
    initializeGridPoints(textObj);
    
    // Create visual grid points if grid is visible
    if (gridDistortState.showGrid) {
        createGridPointElements(textObj);
    }
}

/**
 * Initialize grid control points
 * @param {Object} textObj - The text object to apply the effect to
 */
function initializeGridPoints(textObj) {
    // Get text dimensions
    const textWidth = textObj.width;
    const textHeight = textObj.height;
    
    // Calculate grid bounds with padding
    const padding = gridDistortState.gridPadding;
    const gridLeft = textObj.left - textWidth/2 - padding;
    const gridTop = textObj.top - textHeight/2 - padding;
    const gridWidth = textWidth + padding * 2;
    const gridHeight = textHeight + padding * 2;
    
    // Initialize control points array
    gridDistortState.controlPoints = [];
    
    // Create grid points
    for (let row = 0; row <= gridDistortState.gridRows; row++) {
        const rowPoints = [];
        for (let col = 0; col <= gridDistortState.gridCols; col++) {
            // Calculate evenly spaced points
            const x = gridLeft + (col / gridDistortState.gridCols) * gridWidth;
            const y = gridTop + (row / gridDistortState.gridRows) * gridHeight;
            rowPoints.push({ x, y });
        }
        gridDistortState.controlPoints.push(rowPoints);
    }
}

/**
 * Create visual elements for grid points
 * @param {Object} textObj - The text object to apply the effect to
 */
function createGridPointElements(textObj) {
    // Clear any existing grid points
    clearGridPoints();
    
    // Create container for grid points if it doesn't exist
    let gridContainer = document.getElementById('grid-distort-points');
    if (!gridContainer) {
        gridContainer = document.createElement('div');
        gridContainer.id = 'grid-distort-points';
        gridContainer.style.position = 'absolute';
        gridContainer.style.top = '0';
        gridContainer.style.left = '0';
        gridContainer.style.pointerEvents = 'none';
        document.body.appendChild(gridContainer);
    }
    
    // Create visual elements for each control point
    for (let row = 0; row < gridDistortState.controlPoints.length; row++) {
        for (let col = 0; col < gridDistortState.controlPoints[row].length; col++) {
            const point = gridDistortState.controlPoints[row][col];
            
            // Create point element
            const pointElement = document.createElement('div');
            pointElement.className = 'grid-point';
            pointElement.dataset.row = row;
            pointElement.dataset.col = col;
            pointElement.style.position = 'absolute';
            pointElement.style.width = '8px';
            pointElement.style.height = '8px';
            pointElement.style.backgroundColor = '#3b82f6';
            pointElement.style.borderRadius = '50%';
            pointElement.style.transform = 'translate(-50%, -50%)';
            pointElement.style.left = point.x + 'px';
            pointElement.style.top = point.y + 'px';
            pointElement.style.cursor = 'move';
            pointElement.style.zIndex = '1000';
            
            // Add to container
            gridContainer.appendChild(pointElement);
            gridPointElements.push(pointElement);
        }
    }
}

/**
 * Clear all grid point elements
 */
function clearGridPoints() {
    // Remove all grid point elements
    gridPointElements.forEach(element => {
        if (element.parentNode) {
            element.parentNode.removeChild(element);
        }
    });
    gridPointElements = [];
    
    // Remove container if it exists
    const gridContainer = document.getElementById('grid-distort-points');
    if (gridContainer) {
        gridContainer.parentNode.removeChild(gridContainer);
    }
}

/**
 * Toggle grid visibility
 * @param {Object} textObj - The text object to apply the effect to
 */
function toggleGridVisibility(textObj) {
    gridDistortState.showGrid = !gridDistortState.showGrid;
    
    if (gridDistortState.showGrid) {
        createGridPointElements(textObj);
    } else {
        clearGridPoints();
    }
}

/**
 * Get warped position based on grid control points
 * @param {number} x - Original x coordinate
 * @param {number} y - Original y coordinate
 * @param {Array} controlPoints - Grid control points
 * @param {number} cols - Number of grid columns
 * @param {number} rows - Number of grid rows
 * @param {number} gridLeft - Left position of grid
 * @param {number} gridTop - Top position of grid
 * @param {number} gridWidth - Width of grid
 * @param {number} gridHeight - Height of grid
 * @param {number} intensity - Distortion intensity (0-1)
 * @returns {Object} Warped position {x, y}
 */
function getWarpedPosition(x, y, controlPoints, cols, rows, gridLeft, gridTop, gridWidth, gridHeight, intensity) {
    // Normalize coordinates to 0-1 range within the grid
    const nx = (x - gridLeft) / gridWidth;
    const ny = (y - gridTop) / gridHeight;
    
    // Clamp to valid range
    const u = Math.max(0, Math.min(1, nx));
    const v = Math.max(0, Math.min(1, ny));
    
    // Find grid cell
    const cellX = Math.min(u * cols, cols - 0.001);
    const cellY = Math.min(v * rows, rows - 0.001);
    
    // Get indices of the four corners
    const ix = Math.floor(cellX);
    const iy = Math.floor(cellY);
    
    // Fractional position within the cell
    const fx = cellX - ix;
    const fy = cellY - iy;
    
    // Get the four control points around this position
    const p00 = controlPoints[iy][ix];
    const p10 = controlPoints[iy][ix + 1];
    const p01 = controlPoints[iy + 1][ix];
    const p11 = controlPoints[iy + 1][ix + 1];
    
    // Smooth interpolation factors (using cubic hermite)
    const fx2 = fx * fx * (3 - 2 * fx);
    const fy2 = fy * fy * (3 - 2 * fy);
    
    // Bilinear interpolation
    const topX = p00.x * (1 - fx2) + p10.x * fx2;
    const botX = p01.x * (1 - fx2) + p11.x * fx2;
    const topY = p00.y * (1 - fx2) + p10.y * fx2;
    const botY = p01.y * (1 - fx2) + p11.y * fx2;
    
    // Final interpolated position
    const warpedX = topX * (1 - fy2) + botX * fy2;
    const warpedY = topY * (1 - fy2) + botY * fy2;
    
    // Apply intensity factor
    const origX = x;
    const origY = y;
    
    return {
        x: origX + (warpedX - origX) * intensity,
        y: origY + (warpedY - origY) * intensity
    };
}

/**
 * Draw grid distorted text using OpenType.js
 * @param {Object} textObj - The text object to apply the effect to
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} font - OpenType.js font object
 */
function drawGridDistortedText(textObj, ctx, font) {
    if (!font) {
        console.warn('Font not loaded for grid distort effect');
        return;
    }
    
    // Get text properties
    const text = textObj.text;
    const fontSize = textObj.fontSize;
    
    // Create a path for the text
    const path = font.getPath(text, 0, 0, fontSize);
    
    // Get path bounds
    const bounds = path.getBoundingBox();
    const textWidth = bounds.x2 - bounds.x1;
    const textHeight = bounds.y2 - bounds.y1;
    
    // Calculate grid bounds with padding
    const padding = gridDistortState.gridPadding;
    const gridLeft = textObj.left - textWidth/2 - padding;
    const gridTop = textObj.top - textHeight/2 - padding;
    const gridWidth = textWidth + padding * 2;
    const gridHeight = textHeight + padding * 2;
    
    // Set text properties
    ctx.fillStyle = textObj.fill;
    
    // Create a warped path based on the original path
    const warpedPath = new opentype.Path();
    
    // Center coordinates for the text
    const centerX = textObj.left;
    const centerY = textObj.top;
    
    // Process each command in the original path
    for (let i = 0; i < path.commands.length; i++) {
        const cmd = path.commands[i];
        
        switch (cmd.type) {
            case 'M': // Move to
                {
                    const x = cmd.x + centerX;
                    const y = cmd.y + centerY;
                    const warped = getWarpedPosition(
                        x, y,
                        gridDistortState.controlPoints, gridDistortState.gridCols, gridDistortState.gridRows,
                        gridLeft, gridTop, gridWidth, gridHeight,
                        gridDistortState.intensity
                    );
                    warpedPath.moveTo(warped.x, warped.y);
                }
                break;
            case 'L': // Line to
                {
                    const x = cmd.x + centerX;
                    const y = cmd.y + centerY;
                    const warped = getWarpedPosition(
                        x, y,
                        gridDistortState.controlPoints, gridDistortState.gridCols, gridDistortState.gridRows,
                        gridLeft, gridTop, gridWidth, gridHeight,
                        gridDistortState.intensity
                    );
                    warpedPath.lineTo(warped.x, warped.y);
                }
                break;
            case 'C': // Cubic curve
                {
                    const x1 = cmd.x1 + centerX;
                    const y1 = cmd.y1 + centerY;
                    const x2 = cmd.x2 + centerX;
                    const y2 = cmd.y2 + centerY;
                    const x = cmd.x + centerX;
                    const y = cmd.y + centerY;
                    
                    const warped1 = getWarpedPosition(
                        x1, y1,
                        gridDistortState.controlPoints, gridDistortState.gridCols, gridDistortState.gridRows,
                        gridLeft, gridTop, gridWidth, gridHeight,
                        gridDistortState.intensity
                    );
                    
                    const warped2 = getWarpedPosition(
                        x2, y2,
                        gridDistortState.controlPoints, gridDistortState.gridCols, gridDistortState.gridRows,
                        gridLeft, gridTop, gridWidth, gridHeight,
                        gridDistortState.intensity
                    );
                    
                    const warped = getWarpedPosition(
                        x, y,
                        gridDistortState.controlPoints, gridDistortState.gridCols, gridDistortState.gridRows,
                        gridLeft, gridTop, gridWidth, gridHeight,
                        gridDistortState.intensity
                    );
                    
                    warpedPath.curveTo(warped1.x, warped1.y, warped2.x, warped2.y, warped.x, warped.y);
                }
                break;
            case 'Q': // Quadratic curve
                {
                    const x1 = cmd.x1 + centerX;
                    const y1 = cmd.y1 + centerY;
                    const x = cmd.x + centerX;
                    const y = cmd.y + centerY;
                    
                    const warped1 = getWarpedPosition(
                        x1, y1,
                        gridDistortState.controlPoints, gridDistortState.gridCols, gridDistortState.gridRows,
                        gridLeft, gridTop, gridWidth, gridHeight,
                        gridDistortState.intensity
                    );
                    
                    const warped = getWarpedPosition(
                        x, y,
                        gridDistortState.controlPoints, gridDistortState.gridCols, gridDistortState.gridRows,
                        gridLeft, gridTop, gridWidth, gridHeight,
                        gridDistortState.intensity
                    );
                    
                    warpedPath.quadraticCurveTo(warped1.x, warped1.y, warped.x, warped.y);
                }
                break;
            case 'Z': // Close path
                warpedPath.closePath();
                break;
        }
    }
    
    // Draw the warped path
    warpedPath.fill = textObj.fill;
    warpedPath.draw(ctx);
}

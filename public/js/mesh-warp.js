/**
 * Mesh Warp Implementation for Text Distortion
 * This file implements the mesh warp functionality for text distortion in the design editor.
 */

// Mesh warp grid configuration and state
let meshGrid = {
    columns: 5,
    rows: 3,
    points: [],
    originalPoints: [],
    showGrid: true,
    isDragging: false,
    selectedPointIndex: -1,
    initialized: false
};

// Constants for mesh warp rendering
const CONTROL_POINT_RADIUS = 8;
const CONTROL_POINT_COLOR = '#3b82f6';
const CONTROL_POINT_STROKE = '#ffffff';
const GRID_LINE_COLOR = 'rgba(59, 130, 246, 0.5)';
const GRID_LINE_WIDTH = 1;

/**
 * Initialize the mesh warp grid based on text object dimensions
 * @param {Object} textObj - The text object to apply mesh warp to
 * @param {Object} metrics - The metrics of the text object
 */
function initializeMeshGrid(textObj, metrics) {
    const width = metrics.width;
    const height = metrics.height;

    // Calculate padding around the text
    const paddingX = width * 0.1;
    const paddingY = height * 0.2;

    // Calculate total width and height with padding
    const totalWidth = width + paddingX * 2;
    const totalHeight = height + paddingY * 2;

    // Use mesh settings from text object or defaults
    const columns = textObj.meshWarp?.columns || meshGrid.columns;
    const rows = textObj.meshWarp?.rows || meshGrid.rows;

    // Calculate cell size
    const cellWidth = totalWidth / (columns - 1);
    const cellHeight = totalHeight / (rows - 1);

    // Calculate top-left corner
    const startX = -totalWidth / 2;
    const startY = -totalHeight / 2;

    // Initialize mesh warp object if it doesn't exist
    if (!textObj.meshWarp) {
        textObj.meshWarp = {
            columns: columns,
            rows: rows,
            controlPoints: [],
            initialControlPoints: [],
            showGrid: true,
            initialized: false
        };
    }

    // Create grid points and store them in the text object
    textObj.meshWarp.controlPoints = [];
    textObj.meshWarp.initialControlPoints = [];

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            const x = startX + col * cellWidth;
            const y = startY + row * cellHeight;

            textObj.meshWarp.controlPoints.push({ x, y });
            textObj.meshWarp.initialControlPoints.push({ x, y });
        }
    }

    textObj.meshWarp.initialized = true;

    // Update global mesh grid for compatibility
    meshGrid.columns = columns;
    meshGrid.rows = rows;
    meshGrid.points = [...textObj.meshWarp.controlPoints];
    meshGrid.originalPoints = [...textObj.meshWarp.initialControlPoints];
    meshGrid.initialized = true;
}

/**
 * Reset the mesh grid to its original state
 */
function resetMeshGrid() {
    if (meshGrid.initialized) {
        meshGrid.points = JSON.parse(JSON.stringify(meshGrid.originalPoints));

        // Also reset the text object's mesh data if available
        if (selectedObjectIndex !== -1 && canvasObjects[selectedObjectIndex].type === 'text') {
            const textObj = canvasObjects[selectedObjectIndex];
            if (textObj.meshWarp && textObj.meshWarp.initialControlPoints) {
                textObj.meshWarp.controlPoints = JSON.parse(JSON.stringify(textObj.meshWarp.initialControlPoints));
            }
        }

        update(); // Redraw canvas
    }
}

/**
 * Find the closest control point to the given coordinates
 * @param {number} x - The x coordinate
 * @param {number} y - The y coordinate
 * @returns {number} - The index of the closest point or -1 if none found
 */
function findClosestControlPoint(x, y) {
    if (!meshGrid.initialized || !meshGrid.points.length) return -1;

    const threshold = CONTROL_POINT_RADIUS * 1.5 / scale; // Adjust for zoom level
    let closestIndex = -1;
    let closestDistance = threshold;

    for (let i = 0; i < meshGrid.points.length; i++) {
        const point = meshGrid.points[i];
        const dx = point.x - x;
        const dy = point.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = i;
        }
    }

    return closestIndex;
}

/**
 * Draw the mesh grid on the canvas
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {Object} textObj - The text object
 */
function drawMeshGrid(ctx, textObj) {
    if (!meshGrid.initialized || !meshGrid.showGrid) return;

    ctx.save();

    // Draw grid lines
    ctx.strokeStyle = GRID_LINE_COLOR;
    ctx.lineWidth = GRID_LINE_WIDTH / scale; // Adjust for zoom level

    // Draw horizontal lines
    for (let row = 0; row < meshGrid.rows; row++) {
        ctx.beginPath();
        for (let col = 0; col < meshGrid.columns; col++) {
            const pointIndex = row * meshGrid.columns + col;
            const point = meshGrid.points[pointIndex];

            if (col === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        }
        ctx.stroke();
    }

    // Draw vertical lines
    for (let col = 0; col < meshGrid.columns; col++) {
        ctx.beginPath();
        for (let row = 0; row < meshGrid.rows; row++) {
            const pointIndex = row * meshGrid.columns + col;
            const point = meshGrid.points[pointIndex];

            if (row === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        }
        ctx.stroke();
    }

    // Draw control points
    for (let i = 0; i < meshGrid.points.length; i++) {
        const point = meshGrid.points[i];

        ctx.beginPath();
        ctx.arc(point.x, point.y, CONTROL_POINT_RADIUS / scale, 0, Math.PI * 2);
        ctx.fillStyle = CONTROL_POINT_COLOR;
        ctx.fill();
        ctx.strokeStyle = CONTROL_POINT_STROKE;
        ctx.lineWidth = 2 / scale;
        ctx.stroke();
    }

    ctx.restore();
}

/**
 * Apply mesh warp distortion to the text
 * @param {Object} textObj - The text object to distort
 * @param {CanvasRenderingContext2D} targetCtx - The canvas context
 */
function drawMeshWarpedObject(textObj, targetCtx) {
    // First render the text to the offscreen canvas
    renderStyledObjectToOffscreen(textObj, octx, os.width, os.height);

    // If mesh grid is not initialized, initialize it
    if (!textObj.meshWarp || !textObj.meshWarp.initialized) {
        const metrics = targetCtx.measureText((textObj.text || '').toUpperCase());
        const ascent = metrics.actualBoundingBoxAscent || textObj.fontSize * 0.8;
        const textHeight = ascent + (metrics.actualBoundingBoxDescent || textObj.fontSize * 0.2);

        initializeMeshGrid(textObj, {
            width: metrics.width,
            height: textHeight
        });
    } else {
        // Restore mesh grid from text object data
        meshGrid.columns = textObj.meshWarp.columns;
        meshGrid.rows = textObj.meshWarp.rows;
        meshGrid.points = [...textObj.meshWarp.controlPoints];
        meshGrid.originalPoints = [...textObj.meshWarp.initialControlPoints];
        meshGrid.showGrid = textObj.meshWarp.showGrid;
        meshGrid.initialized = true;
    }

    // Draw the mesh grid if needed
    if (meshGrid.showGrid && textObj.meshWarp?.showGrid !== false) {
        drawMeshGrid(targetCtx, textObj);
    }

    // Apply the mesh warp distortion
    applyMeshWarpDistortion(textObj, targetCtx);
}

/**
 * Apply mesh warp distortion to the text
 * @param {Object} textObj - The text object to distort
 * @param {CanvasRenderingContext2D} targetCtx - The canvas context
 */
function applyMeshWarpDistortion(textObj, targetCtx) {
    // Create a temporary canvas for the warped text
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = os.width;
    tempCanvas.height = os.height;
    const tempCtx = tempCanvas.getContext('2d');

    // Get the text metrics
    const metrics = targetCtx.measureText((textObj.text || '').toUpperCase());
    const ascent = metrics.actualBoundingBoxAscent || textObj.fontSize * 0.8;
    const textHeight = ascent + (metrics.actualBoundingBoxDescent || textObj.fontSize * 0.2);

    // Calculate source and destination rectangles
    const sw = metrics.width + letterSourcePadding * 2;
    const sh = textHeight + letterSourcePadding * 2;
    const sx = os.width / 2 - sw / 2;
    const sy = os.height / 2 - sh / 2;

    // Draw the warped text using the mesh grid
    for (let row = 0; row < meshGrid.rows - 1; row++) {
        for (let col = 0; col < meshGrid.columns - 1; col++) {
            // Get the four corners of the current grid cell
            const topLeft = meshGrid.points[row * meshGrid.columns + col];
            const topRight = meshGrid.points[row * meshGrid.columns + col + 1];
            const bottomLeft = meshGrid.points[(row + 1) * meshGrid.columns + col];
            const bottomRight = meshGrid.points[(row + 1) * meshGrid.columns + col + 1];

            // Get the four corners of the original grid cell
            const origTopLeft = meshGrid.originalPoints[row * meshGrid.columns + col];
            const origTopRight = meshGrid.originalPoints[row * meshGrid.columns + col + 1];
            const origBottomLeft = meshGrid.originalPoints[(row + 1) * meshGrid.columns + col];
            const origBottomRight = meshGrid.originalPoints[(row + 1) * meshGrid.columns + col + 1];

            // Calculate the width and height of the original cell
            const cellWidth = origTopRight.x - origTopLeft.x;
            const cellHeight = origBottomLeft.y - origTopLeft.y;

            // Calculate the source coordinates within the offscreen canvas
            const cellSrcX = sx + (origTopLeft.x - meshGrid.originalPoints[0].x);
            const cellSrcY = sy + (origTopLeft.y - meshGrid.originalPoints[0].y);

            // Draw the warped cell
            targetCtx.save();
            targetCtx.beginPath();
            targetCtx.moveTo(topLeft.x, topLeft.y);
            targetCtx.lineTo(topRight.x, topRight.y);
            targetCtx.lineTo(bottomRight.x, bottomRight.y);
            targetCtx.lineTo(bottomLeft.x, bottomLeft.y);
            targetCtx.closePath();
            targetCtx.clip();

            // Use a transformation matrix to map the source rectangle to the destination quadrilateral
            const sourcePoints = [
                0, 0,
                cellWidth, 0,
                cellWidth, cellHeight,
                0, cellHeight
            ];

            const destPoints = [
                topLeft.x - origTopLeft.x, topLeft.y - origTopLeft.y,
                topRight.x - origTopLeft.x, topRight.y - origTopLeft.y,
                bottomRight.x - origTopLeft.x, bottomRight.y - origTopLeft.y,
                bottomLeft.x - origTopLeft.x, bottomLeft.y - origTopLeft.y
            ];

            const matrix = PerspT(sourcePoints, destPoints);

            // Apply the transformation and draw the cell
            targetCtx.transform(
                matrix[0], matrix[3],
                matrix[1], matrix[4],
                matrix[2], matrix[5]
            );

            targetCtx.drawImage(
                os,
                cellSrcX, cellSrcY, cellWidth, cellHeight,
                0, 0, cellWidth, cellHeight
            );

            targetCtx.restore();
        }
    }
}

/**
 * Handle mouse down event for mesh warp
 * @param {MouseEvent} e - The mouse event
 */
function handleMeshWarpMouseDown(e) {
    if (!meshGrid.initialized || !meshGrid.showGrid) return false;

    const coords = getCanvasCoordinates(e);
    const worldCoords = canvasToWorld(coords.x, coords.y);

    // Adjust coordinates for the selected object's position and rotation
    const obj = canvasObjects[selectedObjectIndex];
    if (!obj || obj.effectMode !== 'meshWarp') return false;

    const dx = worldCoords.x - obj.x;
    const dy = worldCoords.y - obj.y;
    const angleRad = -obj.rotation * Math.PI / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;

    // Find the closest control point
    const pointIndex = findClosestControlPoint(localX, localY);

    if (pointIndex !== -1) {
        meshGrid.isDragging = true;
        meshGrid.selectedPointIndex = pointIndex;
        return true; // Indicate that we've handled the event
    }

    return false; // Not handled
}

/**
 * Handle mouse move event for mesh warp
 * @param {MouseEvent} e - The mouse event
 */
function handleMeshWarpMouseMove(e) {
    if (!meshGrid.isDragging || meshGrid.selectedPointIndex === -1) return false;

    const coords = getCanvasCoordinates(e);
    const worldCoords = canvasToWorld(coords.x, coords.y);

    // Adjust coordinates for the selected object's position and rotation
    const obj = canvasObjects[selectedObjectIndex];
    if (!obj || obj.effectMode !== 'meshWarp') return false;

    const dx = worldCoords.x - obj.x;
    const dy = worldCoords.y - obj.y;
    const angleRad = -obj.rotation * Math.PI / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;

    // Update the selected control point position
    meshGrid.points[meshGrid.selectedPointIndex].x = localX;
    meshGrid.points[meshGrid.selectedPointIndex].y = localY;

    // Save changes back to the text object
    if (obj.meshWarp && obj.meshWarp.controlPoints) {
        obj.meshWarp.controlPoints[meshGrid.selectedPointIndex].x = localX;
        obj.meshWarp.controlPoints[meshGrid.selectedPointIndex].y = localY;
    }

    // Update UI controls to reflect the new position
    updateMeshWarpControls();

    // Redraw canvas
    update();

    return true; // Indicate that we've handled the event
}

/**
 * Handle mouse up event for mesh warp
 * @param {MouseEvent} e - The mouse event
 */
function handleMeshWarpMouseUp(e) {
    if (!meshGrid.isDragging) return false;

    meshGrid.isDragging = false;
    meshGrid.selectedPointIndex = -1;

    return true; // Indicate that we've handled the event
}

/**
 * Update the mesh warp controls in the UI
 */
function updateMeshWarpControls() {
    // Update the grid columns and rows values
    document.getElementById('vMeshCols').textContent = meshGrid.columns;
    document.getElementById('vMeshRows').textContent = meshGrid.rows;

    // Update the show grid checkbox
    document.getElementById('iShowMeshGrid').checked = meshGrid.showGrid;
}

/**
 * Update the mesh grid based on UI controls
 */
function updateMeshGridFromUI() {
    const oldColumns = meshGrid.columns;
    const oldRows = meshGrid.rows;

    // Get new values from UI
    meshGrid.columns = parseInt(document.getElementById('iMeshCols').value);
    meshGrid.rows = parseInt(document.getElementById('iMeshRows').value);
    meshGrid.showGrid = document.getElementById('iShowMeshGrid').checked;

    // If columns or rows changed, reinitialize the grid
    if (oldColumns !== meshGrid.columns || oldRows !== meshGrid.rows) {
        meshGrid.initialized = false;

        // If a text object is selected, reinitialize the grid
        if (selectedObjectIndex !== -1 && canvasObjects[selectedObjectIndex].type === 'text') {
            const textObj = canvasObjects[selectedObjectIndex];
            const metrics = ctx.measureText((textObj.text || '').toUpperCase());
            const ascent = metrics.actualBoundingBoxAscent || textObj.fontSize * 0.8;
            const textHeight = ascent + (metrics.actualBoundingBoxDescent || textObj.fontSize * 0.2);

            initializeMeshGrid(textObj, {
                width: metrics.width,
                height: textHeight
            });
        }
    }

    // Redraw canvas
    update();
}

// Perspective transformation utility (simplified version)
// Based on https://github.com/jlouthan/perspective-transform
function PerspT(srcPts, dstPts) {
    const A = [];
    const B = [];

    for (let i = 0; i < 4; i++) {
        const x = srcPts[i*2];
        const y = srcPts[i*2+1];
        const X = dstPts[i*2];
        const Y = dstPts[i*2+1];

        A.push([x, y, 1, 0, 0, 0, -X*x, -X*y]);
        A.push([0, 0, 0, x, y, 1, -Y*x, -Y*y]);
        B.push(X);
        B.push(Y);
    }

    const h = solve(A, B);
    return [h[0], h[3], h[6], h[1], h[4], h[7], h[2], h[5], 1];
}

// Simple matrix solver for the perspective transformation
function solve(A, b) {
    const n = A.length;
    const m = A[0].length;
    const h = new Array(m).fill(0);

    // Simple Gaussian elimination
    for (let i = 0; i < n; i++) {
        let maxRow = i;
        let maxVal = Math.abs(A[i][i]);

        for (let j = i + 1; j < n; j++) {
            const val = Math.abs(A[j][i]);
            if (val > maxVal) {
                maxVal = val;
                maxRow = j;
            }
        }

        if (maxRow !== i) {
            [A[i], A[maxRow]] = [A[maxRow], A[i]];
            [b[i], b[maxRow]] = [b[maxRow], b[i]];
        }

        for (let j = i + 1; j < n; j++) {
            const factor = A[j][i] / A[i][i];
            b[j] -= factor * b[i];

            for (let k = i; k < m; k++) {
                A[j][k] -= factor * A[i][k];
            }
        }
    }

    // Back substitution
    for (let i = n - 1; i >= 0; i--) {
        let sum = 0;
        for (let j = i + 1; j < m; j++) {
            sum += A[i][j] * h[j];
        }
        h[i] = (b[i] - sum) / A[i][i];
    }

    return h;
}

// Add event listeners for mesh warp UI controls
document.addEventListener('DOMContentLoaded', function() {
    const iMeshCols = document.getElementById('iMeshCols');
    const iMeshRows = document.getElementById('iMeshRows');
    const iShowMeshGrid = document.getElementById('iShowMeshGrid');
    const resetMeshGridBtn = document.getElementById('resetMeshGrid');

    if (iMeshCols) {
        iMeshCols.addEventListener('input', function(e) {
            meshGrid.columns = parseInt(e.target.value);
            document.getElementById('vMeshCols').textContent = meshGrid.columns;
            meshGrid.initialized = false;
            update();
        });
    }

    if (iMeshRows) {
        iMeshRows.addEventListener('input', function(e) {
            meshGrid.rows = parseInt(e.target.value);
            document.getElementById('vMeshRows').textContent = meshGrid.rows;
            meshGrid.initialized = false;
            update();
        });
    }

    if (iShowMeshGrid) {
        iShowMeshGrid.addEventListener('change', function(e) {
            meshGrid.showGrid = e.target.checked;
            update();
        });
    }

    if (resetMeshGridBtn) {
        resetMeshGridBtn.addEventListener('click', function() {
            resetMeshGrid();
        });
    }

    // Wait for the main script to load and define the handlers
    setTimeout(() => {
        try {
            // Check if the functions exist before trying to extend them
            if (typeof handleMouseDown === 'function') {
                // Store original functions
                const originalMouseDown = handleMouseDown;

                // Override the mouse down handler
                window.handleMouseDown = function(e) {
                    if (selectedObjectIndex !== -1 &&
                        canvasObjects[selectedObjectIndex].type === 'text' &&
                        canvasObjects[selectedObjectIndex].effectMode === 'meshWarp') {
                        if (handleMeshWarpMouseDown(e)) {
                            return; // Event handled by mesh warp
                        }
                    }
                    originalMouseDown(e); // Call the original handler
                };
            }

            if (typeof handleMouseMove === 'function') {
                const originalMouseMove = handleMouseMove;
                window.handleMouseMove = function(e) {
                    if (meshGrid.isDragging) {
                        if (handleMeshWarpMouseMove(e)) {
                            return; // Event handled by mesh warp
                        }
                    }
                    originalMouseMove(e); // Call the original handler
                };
            }

            if (typeof handleMouseUp === 'function') {
                const originalMouseUp = handleMouseUp;
                window.handleMouseUp = function(e) {
                    if (meshGrid.isDragging) {
                        if (handleMeshWarpMouseUp(e)) {
                            meshGrid.isDragging = false;
                            meshGrid.selectedPointIndex = -1;
                            return; // Event handled by mesh warp
                        }
                    }
                    originalMouseUp(e); // Call the original handler
                };
            }

            // Add mesh warp to the effect modes if drawTextObject exists
            if (typeof drawTextObject === 'function') {
                const originalDrawTextObject = drawTextObject;
                window.drawTextObject = function(obj, targetCtx) {
                    if (!obj || obj.type !== 'text' || !obj.text) return;

                    targetCtx.save();
                    targetCtx.translate(obj.x, obj.y);
                    targetCtx.rotate(obj.rotation * Math.PI / 180);

                    if (obj.effectMode === 'skew') {
                        const skewXRad = obj.skewX / 100;
                        const skewYRad = obj.skewY / 100;
                        targetCtx.transform(1, skewYRad, skewXRad, 1, 0, 0);
                    }

                    targetCtx.textBaseline = "middle";

                    switch (obj.effectMode) {
                        case 'normal': case 'skew': drawNormalOrSkewObject(obj, targetCtx); break;
                        case 'warp': drawWarpedObject(obj, targetCtx); break;
                        case 'circle': drawCircularObject(obj, targetCtx); break;
                        case 'curve': drawCurvedObject(obj, targetCtx); break;
                        case 'mesh': case 'meshWarp':
                            // Use the MeshWarpHandler if available, otherwise fallback to old implementation
                            if (typeof activeMeshWarpHandler !== 'undefined' && activeMeshWarpHandler && activeMeshWarpHandler.selectedTextObject === obj) {
                                console.log('[MeshDraw] Using MeshWarpHandler.drawWarpedText for:', obj.text);
                                activeMeshWarpHandler.drawWarpedText(targetCtx);
                            } else {
                                console.log('[MeshDraw] Using fallback drawMeshWarpedObject for:', obj.text, 'activeMeshWarpHandler:', !!activeMeshWarpHandler);
                                drawMeshWarpedObject(obj, targetCtx);
                            }
                            break;
                        default:
                            setTextContextOn(targetCtx, obj);
                            targetCtx.fillStyle = obj.color;
                            targetCtx.fillText(obj.text.toUpperCase() + ' (Unknown Effect)', 0, 0);
                    }

                    targetCtx.restore();
                };
            }

            console.log("Mesh warp handlers initialized successfully");
        } catch (err) {
            console.error("Error initializing mesh warp handlers:", err);
        }
    }, 1000); // Wait 1 second for the main script to load
});

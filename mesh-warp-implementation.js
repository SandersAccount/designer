/**
 * Mesh Warp Implementation Plan
 *
 * This file contains the implementation plan for adding mesh warp distortion functionality
 * to the design editor. It includes:
 *
 * 1. HTML changes - Adding the "Mesh Warp" option to the effect dropdown and creating the mesh warp parameter control section
 * 2. CSS changes - Adding styles for the mesh warp grid and control points
 * 3. JavaScript changes - Implementing the mesh warp functionality
 */

// ===== 1. HTML CHANGES =====

// 1.1. Add "Mesh Warp" option to the effect dropdown
// <select id="effectMode" disabled>
//     <option value="normal">Normal</option>
//     <option value="skew">Skew</option>
//     <option value="warp">Warp</option>
//     <option value="curve">Curved</option>
//     <option value="circle">Circular</option>
//     <option value="meshWarp">Mesh Warp</option>
// </select>

// 1.2. Add mesh warp parameter control section
// <div class="parameter-control mesh-warp-param">
//     <h4>Mesh Warp Settings</h4>
//     <div class="control-group">
//         <label>Grid Cols:</label>
//         <div class="slider-container">
//             <input id="iMeshCols" type="range" min="2" max="8" value="5" step="1" disabled>
//             <span class="slider-value" id="vMeshCols">5</span>
//         </div>
//     </div>
//     <div class="control-group">
//         <label>Grid Rows:</label>
//         <div class="slider-container">
//             <input id="iMeshRows" type="range" min="2" max="6" value="3" step="1" disabled>
//             <span class="slider-value" id="vMeshRows">3</span>
//         </div>
//     </div>
//     <div class="control-group">
//         <label>Show Grid:</label>
//         <input id="iShowMeshGrid" type="checkbox" checked disabled>
//     </div>
//     <div class="control-group">
//         <label>Reset Grid:</label>
//         <button id="resetMeshGrid" class="action-btn" disabled style="padding: 5px 10px; background-color: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">Reset</button>
//     </div>
//     <p style="font-size: 0.85em; color: #64748b; margin-top: 5px;">Drag the control points on the canvas to warp the text.</p>
// </div>

// ===== 2. CSS CHANGES =====

// 2.1. Add CSS class to display mesh warp parameter control section when mesh warp is selected
// .meshWarp .mesh-warp-param { display: flex; }

// ===== 3. JAVASCRIPT CHANGES =====

// 3.1. Add mesh warp properties to the text object factory
function createTextObject(options = {}) {
    const defaults = {
        // ... existing properties ...

        // Mesh Warp properties
        meshCols: 5,
        meshRows: 3,
        showMeshGrid: true,
        meshControlPoints: [], // Will be initialized when mesh warp is selected
        meshInitialControlPoints: [] // Original positions of control points
    };
    return { ...defaults, ...options };
}

// 3.2. Add mesh warp UI control references
const iMeshCols = document.getElementById("iMeshCols");
const iMeshRows = document.getElementById("iMeshRows");
const iShowMeshGrid = document.getElementById("iShowMeshGrid");
const resetMeshGridBtn = document.getElementById("resetMeshGrid");
const vMeshCols = document.getElementById("vMeshCols");
const vMeshRows = document.getElementById("vMeshRows");

// 3.3. Add mesh warp helper functions
// Calculate distance between two points
function dist(p1, p2) {
    if (!p1 || !p2) return 0;
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

// Bilinear interpolation helper
function interpolate(p00, p10, p01, p11, u, v) {
    if (!p00 || !p10 || !p01 || !p11) {
        console.warn("Interpolation called with missing points.");
        return p00 || { x: 0, y: 0 };
    }
    u = Math.max(0, Math.min(1, u));
    v = Math.max(0, Math.min(1, v));

    const val_x = p00.x * (1 - u) * (1 - v) + p10.x * u * (1 - v) + p01.x * (1 - u) * v + p11.x * u * v;
    const val_y = p00.y * (1 - u) * (1 - v) + p10.y * u * (1 - v) + p01.y * (1 - u) * v + p11.y * u * v;
    return { x: val_x, y: val_y };
}

// Map a point from the original grid space to the warped grid space
function getWarpedData(obj, originalX, originalY) {
    const controlPoints = obj.meshControlPoints;
    const initialControlPoints = obj.meshInitialControlPoints;
    const initialGridRect = obj.meshInitialGridRect;
    const NUM_COLS = obj.meshCols;
    const NUM_ROWS = obj.meshRows;

    if (!initialGridRect || !initialGridRect.width || !initialGridRect.height ||
        controlPoints.length !== initialControlPoints.length || initialControlPoints.length === 0) {
        return {
            pos: { x: originalX, y: originalY },
            p00: null, p10: null, p01: null, p11: null,
            orig_p00: null, orig_p10: null, orig_p01: null, orig_p11: null
        };
    }

    // Normalize coordinates (u,v) within the initial grid bounds (0 to 1)
    let u = (originalX - initialGridRect.x) / initialGridRect.width;
    let v = (originalY - initialGridRect.y) / initialGridRect.height;

    // Clamp u, v to [0, 1] range
    u = Math.max(0, Math.min(1, u));
    v = Math.max(0, Math.min(1, v));

    // Determine grid cell indices
    const col = u * (NUM_COLS - 1);
    const row = v * (NUM_ROWS - 1);
    const c0 = Math.floor(col);
    const r0 = Math.floor(row);
    const c1 = Math.min(c0 + 1, NUM_COLS - 1);
    const r1 = Math.min(r0 + 1, NUM_ROWS - 1);

    // Get the indices of the 4 corner control points of the cell
    const p00_idx = r0 * NUM_COLS + c0;
    const p10_idx = r0 * NUM_COLS + c1;
    const p01_idx = r1 * NUM_COLS + c0;
    const p11_idx = r1 * NUM_COLS + c1;

    // Check if indices are valid
    if (p00_idx < 0 || p00_idx >= controlPoints.length ||
        p10_idx < 0 || p10_idx >= controlPoints.length ||
        p01_idx < 0 || p01_idx >= controlPoints.length ||
        p11_idx < 0 || p11_idx >= controlPoints.length ||
        p00_idx >= initialControlPoints.length ||
        p10_idx >= initialControlPoints.length ||
        p01_idx >= initialControlPoints.length ||
        p11_idx >= initialControlPoints.length) {
        console.error("Calculated invalid control point index:", {p00_idx, p10_idx, p01_idx, p11_idx});
        return {
            pos: { x: originalX, y: originalY },
            p00: null, p10: null, p01: null, p11: null,
            orig_p00: null, orig_p10: null, orig_p01: null, orig_p11: null
        };
    }

    // Get the current positions of these control points
    const p00 = controlPoints[p00_idx];
    const p10 = controlPoints[p10_idx];
    const p01 = controlPoints[p01_idx];
    const p11 = controlPoints[p11_idx];

    // Get the original positions of these control points
    const orig_p00 = initialControlPoints[p00_idx];
    const orig_p10 = initialControlPoints[p10_idx];
    const orig_p01 = initialControlPoints[p01_idx];
    const orig_p11 = initialControlPoints[p11_idx];

    // Calculate local interpolation factors
    const u_local = (c1 === c0) ? 0 : (col - c0);
    const v_local = (r1 === r0) ? 0 : (row - r0);

    // Perform bilinear interpolation for the position
    const interpolatedPos = interpolate(p00, p10, p01, p11, u_local, v_local);

    return {
        pos: interpolatedPos,
        p00, p10, p01, p11,
        orig_p00, orig_p10, orig_p01, orig_p11
    };
}

// Setup initial mesh grid for the text object
function setupMeshGrid(obj) {
    if (!obj || obj.type !== 'text' || !obj.text) return;

    const NUM_COLS = obj.meshCols;
    const NUM_ROWS = obj.meshRows;
    const TEXT_PADDING = 50; // Padding around text for initial grid

    // Calculate text metrics
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    setTextContextOn(tempCtx, obj);
    const metrics = tempCtx.measureText(obj.text);
    const textWidth = metrics.width;
    const textHeight = obj.fontSize; // Approximation

    // Calculate the bounding box for the initial grid
    const gridLeft = -textWidth / 2 - TEXT_PADDING;
    const gridTop = -textHeight / 2 - TEXT_PADDING;
    const gridWidth = textWidth + 2 * TEXT_PADDING;
    const gridHeight = textHeight + 2 * TEXT_PADDING;

    // Store the initial grid bounds for mapping later
    obj.meshInitialGridRect = { x: gridLeft, y: gridTop, width: gridWidth, height: gridHeight };

    obj.meshControlPoints = [];
    obj.meshInitialControlPoints = [];

    for (let r = 0; r < NUM_ROWS; r++) {
        for (let c = 0; c < NUM_COLS; c++) {
            const x = gridLeft + (c / (NUM_COLS - 1)) * gridWidth;
            const y = gridTop + (r / (NUM_ROWS - 1)) * gridHeight;
            const point = { x, y };
            obj.meshControlPoints.push({ ...point });
            obj.meshInitialControlPoints.push({ ...point });
        }
    }
}

// Reset mesh grid to initial state
function resetMeshGrid(obj) {
    if (!obj || !obj.meshInitialControlPoints || !obj.meshControlPoints) return;

    obj.meshControlPoints = obj.meshInitialControlPoints.map(point => ({ ...point }));
    update(); // Redraw canvas
}

// 3.4. Add mesh warp drawing function
function drawMeshWarpedObject(obj, targetCtx) {
    if (!obj || obj.type !== 'text' || !obj.text) return;

    // Ensure mesh grid is initialized
    if (!obj.meshControlPoints || obj.meshControlPoints.length === 0) {
        setupMeshGrid(obj);
    }

    // Render text to offscreen canvas
    renderStyledObjectToOffscreen(obj, octx, os.width, os.height);

    const currentText = obj.text;
    const originalTextWidth = octx.measureText(currentText).width;
    const originalStartX = -originalTextWidth / 2;
    const originalBaselineY = 0; // Center is at 0,0

    let currentX = originalStartX;

    // Draw each character with its warped position
    for (let i = 0; i < currentText.length; i++) {
        const char = currentText[i];
        const charMetrics = octx.measureText(char);
        const charWidth = charMetrics.width;

        // Calculate the original center position of this character
        const originalCharCenterX = currentX + charWidth / 2;
        const originalCharCenterY = originalBaselineY;

        // Get warped position and the corner points data
        const warpData = getWarpedData(obj, originalCharCenterX, originalCharCenterY);

        // Skip if we couldn't get valid warp data
        if (!warpData || !warpData.p00 || !warpData.orig_p00) {
            currentX += charWidth;
            continue;
        }

        const warpedPos = warpData.pos;

        // Calculate scaling
        const orig_top_w = dist(warpData.orig_p00, warpData.orig_p10);
        const orig_bottom_w = dist(warpData.orig_p01, warpData.orig_p11);
        const orig_avg_w = (orig_top_w + orig_bottom_w) / 2;

        const orig_left_h = dist(warpData.orig_p00, warpData.orig_p01);
        const orig_right_h = dist(warpData.orig_p10, warpData.orig_p11);
        const orig_avg_h = (orig_left_h + orig_right_h) / 2;

        const current_top_w = dist(warpData.p00, warpData.p10);
        const current_bottom_w = dist(warpData.p01, warpData.p11);
        const current_avg_w = (current_top_w + current_bottom_w) / 2;

        const current_left_h = dist(warpData.p00, warpData.p01);
        const current_right_h = dist(warpData.p10, warpData.p11);
        const current_avg_h = (current_left_h + current_right_h) / 2;

        let scaleX = (orig_avg_w > 0.1) ? (current_avg_w / orig_avg_w) : 1;
        let scaleY = (orig_avg_h > 0.1) ? (current_avg_h / orig_avg_h) : 1;
        scaleX = Math.max(0.05, isNaN(scaleX) ? 1 : scaleX);
        scaleY = Math.max(0.05, isNaN(scaleY) ? 1 : scaleY);

        // Create letter object with original text for gradient calculation
        const letterObj = { ...obj, text: char, originalText: obj.text };
        // Render single character with transform
        const letterInfo = renderSingleStyledLetter(letterObj, char, letterCtx, letterCanvas.width, letterCanvas.height, i, currentText.length);

        targetCtx.save();
        targetCtx.translate(warpedPos.x, warpedPos.y);
        targetCtx.scale(scaleX, scaleY);

        try {
            const sourceW = letterInfo.width + letterSourcePadding * 2;
            const sourceH = letterInfo.height + letterSourcePadding * 2;
            const sourceX = letterInfo.centerX - sourceW / 2;
            const sourceY = letterInfo.centerY - sourceH / 2;
            const destX = -sourceW / 2;
            const destY = -sourceH / 2;

            if (sourceX >= 0 && sourceY >= 0 && sourceW > 0 && sourceH > 0 &&
                sourceX + sourceW <= letterCanvas.width && sourceY + sourceH <= letterCanvas.height) {
                targetCtx.drawImage(letterCanvas, sourceX, sourceY, sourceW, sourceH, destX, destY, sourceW, sourceH);
            }
        } catch(e) {
            console.error("DrawImage error in mesh warp:", e);
        }

        targetCtx.restore();
        currentX += charWidth;
    }

    // Draw mesh grid if enabled
    if (obj.showMeshGrid && obj.isSelected) {
        const POINT_RADIUS = 8;
        const LINE_COLOR = 'rgba(150, 150, 150, 0.7)';
        const POINT_COLOR = 'black';
        const NUM_COLS = obj.meshCols;
        const NUM_ROWS = obj.meshRows;

        targetCtx.save();

        // Draw grid lines
        targetCtx.strokeStyle = LINE_COLOR;
        targetCtx.lineWidth = 1;
        targetCtx.beginPath();

        // Horizontal lines
        for (let r = 0; r < NUM_ROWS; r++) {
            for (let c = 0; c < NUM_COLS - 1; c++) {
                const p1 = obj.meshControlPoints[r * NUM_COLS + c];
                const p2 = obj.meshControlPoints[r * NUM_COLS + c + 1];
                if (p1 && p2) {
                    targetCtx.moveTo(p1.x, p1.y);
                    targetCtx.lineTo(p2.x, p2.y);
                }
            }
        }

        // Vertical lines
        for (let c = 0; c < NUM_COLS; c++) {
            for (let r = 0; r < NUM_ROWS - 1; r++) {
                const p1 = obj.meshControlPoints[r * NUM_COLS + c];
                const p2 = obj.meshControlPoints[(r + 1) * NUM_COLS + c];
                if (p1 && p2) {
                    targetCtx.moveTo(p1.x, p1.y);
                    targetCtx.lineTo(p2.x, p2.y);
                }
            }
        }

        targetCtx.stroke();

        // Draw control points
        targetCtx.fillStyle = POINT_COLOR;
        obj.meshControlPoints.forEach(point => {
            if (!point) return;
            targetCtx.beginPath();
            targetCtx.arc(point.x, point.y, POINT_RADIUS, 0, Math.PI * 2);
            targetCtx.fill();
        });

        targetCtx.restore();
    }
}

// 3.5. Add mesh warp to drawTextObject function
function drawTextObject(obj, targetCtx) {
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
        case 'meshWarp': drawMeshWarpedObject(obj, targetCtx); break; // Add mesh warp case
        default:
            setTextContextOn(targetCtx, obj);
            targetCtx.fillStyle = obj.color;
            targetCtx.fillText(obj.text.toUpperCase() + ' (Unknown Effect)', 0, 0);
    }
    targetCtx.restore();
}

// 3.6. Add mesh warp interaction handling
// Variables for mesh warp interaction
let isDraggingMeshPoint = false;
let draggingMeshPointIndex = -1;
let draggingMeshPointObj = null;
let meshPointOffsetX = 0;
let meshPointOffsetY = 0;

// Find mesh point at mouse position
function findMeshPointAt(obj, worldX, worldY) {
    if (!obj || !obj.meshControlPoints || obj.effectMode !== 'meshWarp') return -1;

    const HIT_TOLERANCE = 10;

    // Convert world coordinates to object local coordinates
    const localX = worldX - obj.x;
    const localY = worldY - obj.y;

    // Apply inverse rotation
    const angleRad = -obj.rotation * Math.PI / 180;
    const rotatedX = localX * Math.cos(angleRad) - localY * Math.sin(angleRad);
    const rotatedY = localX * Math.sin(angleRad) + localY * Math.cos(angleRad);

    for (let i = 0; i < obj.meshControlPoints.length; i++) {
        if (!obj.meshControlPoints[i]) continue;

        const point = obj.meshControlPoints[i];
        const dx = rotatedX - point.x;
        const dy = rotatedY - point.y;

        if (dx * dx + dy * dy < HIT_TOLERANCE * HIT_TOLERANCE) {
            return i;
        }
    }

    return -1;
}

// Modify handleMouseDown to handle mesh point dragging
function handleMouseDown(e) {
    const coords = getCanvasCoordinates(e);
    const world = canvasToWorld(coords.x, coords.y);

    // Check if we're clicking on a mesh point of the selected object
    if (selectedObjectIndex !== -1 && canvasObjects[selectedObjectIndex].effectMode === 'meshWarp') {
        const obj = canvasObjects[selectedObjectIndex];
        const pointIndex = findMeshPointAt(obj, world.x, world.y);

        if (pointIndex !== -1) {
            isDraggingMeshPoint = true;
            draggingMeshPointIndex = pointIndex;
            draggingMeshPointObj = obj;

            // Calculate offset for smooth dragging
            const point = obj.meshControlPoints[pointIndex];
            const localX = world.x - obj.x;
            const localY = world.y - obj.y;

            // Apply inverse rotation
            const angleRad = -obj.rotation * Math.PI / 180;
            const rotatedX = localX * Math.cos(angleRad) - localY * Math.sin(angleRad);
            const rotatedY = localX * Math.sin(angleRad) + localY * Math.cos(angleRad);

            meshPointOffsetX = rotatedX - point.x;
            meshPointOffsetY = rotatedY - point.y;

            e.preventDefault();
            return;
        }
    }

    // Original mouse down handling...
}

// Modify handleMouseMove to handle mesh point dragging
function handleMouseMove(e) {
    const coords = getCanvasCoordinates(e);
    const world = canvasToWorld(coords.x, coords.y);

    if (isDraggingMeshPoint && draggingMeshPointObj && draggingMeshPointIndex !== -1) {
        // Convert world coordinates to object local coordinates
        const localX = world.x - draggingMeshPointObj.x;
        const localY = world.y - draggingMeshPointObj.y;

        // Apply inverse rotation
        const angleRad = -draggingMeshPointObj.rotation * Math.PI / 180;
        const rotatedX = localX * Math.cos(angleRad) - localY * Math.sin(angleRad);
        const rotatedY = localX * Math.sin(angleRad) + localY * Math.cos(angleRad);

        // Update the position of the dragged point
        draggingMeshPointObj.meshControlPoints[draggingMeshPointIndex].x = rotatedX - meshPointOffsetX;
        draggingMeshPointObj.meshControlPoints[draggingMeshPointIndex].y = rotatedY - meshPointOffsetY;

        update(); // Redraw canvas
        return;
    }

    // Original mouse move handling...
}

// Modify handleMouseUp to handle mesh point dragging
function handleMouseUp(e) {
    if (isDraggingMeshPoint) {
        isDraggingMeshPoint = false;
        draggingMeshPointIndex = -1;
        draggingMeshPointObj = null;
        return;
    }

    // Original mouse up handling...
}

// 3.7. Add mesh warp UI event handlers
// Update UI from selected object
function updateUIFromSelectedObject() {
    // ... existing code ...

    // Mesh Warp settings
    if (obj && obj.effectMode === 'meshWarp') {
        iMeshCols.value = obj.meshCols;
        iMeshRows.value = obj.meshRows;
        iShowMeshGrid.checked = obj.showMeshGrid;
        vMeshCols.textContent = obj.meshCols;
        vMeshRows.textContent = obj.meshRows;
    }

    // ... existing code ...
}

// Update selected object from UI
function updateSelectedObjectFromUI(property, value) {
    // ... existing code ...

    // Mesh Warp properties
    if (property === 'meshCols') {
        obj.meshCols = parseInt(value);
        setupMeshGrid(obj); // Regenerate grid with new column count
    } else if (property === 'meshRows') {
        obj.meshRows = parseInt(value);
        setupMeshGrid(obj); // Regenerate grid with new row count
    } else if (property === 'showMeshGrid') {
        obj.showMeshGrid = value;
    }

    // ... existing code ...
}

// Add event listeners for mesh warp controls
iMeshCols.addEventListener('input', function() {
    if (selectedObjectIndex === -1) return;
    vMeshCols.textContent = this.value;
    updateSelectedObjectFromUI('meshCols', this.value);
    update();
});

iMeshRows.addEventListener('input', function() {
    if (selectedObjectIndex === -1) return;
    vMeshRows.textContent = this.value;
    updateSelectedObjectFromUI('meshRows', this.value);
    update();
});

iShowMeshGrid.addEventListener('change', function() {
    if (selectedObjectIndex === -1) return;
    updateSelectedObjectFromUI('showMeshGrid', this.checked);
    update();
});

resetMeshGridBtn.addEventListener('click', function() {
    if (selectedObjectIndex === -1) return;
    resetMeshGrid(canvasObjects[selectedObjectIndex]);
});

// 3.8. Update body class for mesh warp
function updateBodyClass(textObj) {
    // ... existing code ...

    // Add meshWarp class
    if (textObj.effectMode === 'meshWarp') {
        document.body.classList.add('meshWarp');
    } else {
        document.body.classList.remove('meshWarp');
    }

    // ... existing code ...
}

// 3.9. Add CSS rule for mesh warp parameter control visibility
// .meshWarp .mesh-warp-param { display: flex; }

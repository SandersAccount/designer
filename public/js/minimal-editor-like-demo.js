// Minimal Editor-like Demo Script for Grid Warp Effect
// This scaffold mimics the editor's text object model, canvas, selection, and effect pipeline.
// ---
// NOTE: This does NOT implement the grid warp effect itself, but provides clear placeholders for integration.
// ---

// --- Canvas Setup ---
const canvas = document.getElementById('demo');
const ctx = canvas.getContext('2d');

// --- Offscreen Canvas Setup (Mimicking Editor) ---
const os = document.createElement("canvas");
os.width = canvas.width * 2; // Use larger offscreen for better quality/padding
os.height = canvas.height * 2;
const octx = os.getContext("2d");

// --- Text Object Model ---
let texts = []; // Array of all text objects
let selectedText = null; // Currently selected text object

// --- UI Elements ---
const addTextBtn = document.getElementById('addTextBtn');
const textContentInput = document.getElementById('textContentInput');
const fontSizeInput = document.getElementById('fontSizeInput');
const fontSizeValue = document.getElementById('fontSizeValue');
const fontFamilyInput = document.getElementById('fontFamilyInput');
const fontColorInput = document.getElementById('fontColorInput');
const effectDropdown = document.getElementById('effectDropdown');
const gridWarpControls = document.getElementById('gridWarpControls');
const noTextMsg = document.getElementById('noTextMsg');
const paddingSlider = document.getElementById('paddingSlider');
const paddingValue = document.getElementById('paddingValue');
const intensitySlider = document.getElementById('intensitySlider');
const intensityValue = document.getElementById('intensityValue');

// --- Grid Warp Integration ---
// State for grid warp (shared for selectedText only)
let gridWarp = {
    controlPoints: [],
    originalControlPoints: [],
    gridBounds: null,
    meshCols: 3,
    meshRows: 2,
    padding: +paddingSlider.value,
    intensity: +intensitySlider.value / 100
};

// --- Font Loading ---
let loadedFont = null;
// Use a local Roboto font that exists in the project
opentype.load('fonts/Roboto-Regular.ttf', (err, font) => {
    if (!err) loadedFont = font;
    else console.error('Font load error:', err);
});

// --- Convert text to SVG path using opentype.js ---
function getTextPathData(textObj) {
    if (!loadedFont || !textObj.text) return '';
    const path = loadedFont.getPath(textObj.text, 0, textObj.fontSize, textObj.fontSize);
    return path.commands.map(cmd => {
        switch(cmd.type) {
            case 'M': return `M ${cmd.x} ${cmd.y}`;
            case 'L': return `L ${cmd.x} ${cmd.y}`;
            case 'C': return `C ${cmd.x1} ${cmd.y1} ${cmd.x2} ${cmd.y2} ${cmd.x} ${cmd.y}`;
            case 'Q': return `Q ${cmd.x1} ${cmd.y1} ${cmd.x} ${cmd.y}`;
            case 'Z': return 'Z';
            default: return '';
        }
    }).filter(Boolean).join(' ');
}

// --- Parse SVG Path Data ---
function parseCanvasPath(pathData) {
    const commands = pathData.match(/[a-zA-Z][^a-zA-Z]*/g) || [];
    const segments = [];
    for (const cmd of commands) {
        const type = cmd[0];
        let args = cmd.slice(1).trim().split(/[",\s]+/).filter(s => s !== '').map(parseFloat);
        segments.push({ type, args });
    }
    return segments;
}

// --- Create Grid for Warping ---
function createGrid(pathData) {
    const segs = parseCanvasPath(pathData);
    const xs = [], ys = [];
    segs.forEach(s => { for(let i=0;i<s.args.length;i+=2){ xs.push(s.args[i]); ys.push(s.args[i+1]); } });
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    gridWarp.gridBounds = { x: minX - gridWarp.padding, y: minY - gridWarp.padding, width: (maxX-minX)+2*gridWarp.padding, height: (maxY-minY)+2*gridWarp.padding };
    gridWarp.controlPoints = [];
    const cols = gridWarp.meshCols, rows = gridWarp.meshRows;
    const sx = gridWarp.gridBounds.width/(cols-1), sy = gridWarp.gridBounds.height/(rows-1);
    for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) gridWarp.controlPoints.push([gridWarp.gridBounds.x + c*sx, gridWarp.gridBounds.y + r*sy]);
    gridWarp.originalControlPoints = JSON.parse(JSON.stringify(gridWarp.controlPoints));
}

// --- Warp Path Data ---
function repositionPoint(x, y) {
    const { gridBounds, controlPoints, meshCols, meshRows, intensity } = gridWarp;
    if (!isFinite(x) || !isFinite(y) || !gridBounds || !controlPoints.length) return [x, y];
    const cols = meshCols, rows = meshRows;
    const nx = (x - gridBounds.x) / gridBounds.width;
    const ny = (y - gridBounds.y) / gridBounds.height;
    const u = Math.max(0, Math.min(1, nx));
    const v = Math.max(0, Math.min(1, ny));
    const eps = 1e-9;
    const cellX = Math.min(u * (cols - 1), cols - 1 - eps);
    const cellY = Math.min(v * (rows - 1), rows - 1 - eps);
    const ix = Math.floor(cellX), iy = Math.floor(cellY);
    const i00 = iy * cols + ix, i10 = i00 + 1, i01 = i00 + cols, i11 = i01 + 1;
    if (i00 < 0 || i11 >= controlPoints.length) return [x, y];
    const p00 = controlPoints[i00], p10 = controlPoints[i10];
    const p01 = controlPoints[i01], p11 = controlPoints[i11];
    const fx = cellX - ix, fy = cellY - iy;
    const fx2 = fx * fx * (3 - 2 * fx);
    const fy2 = fy * fy * (3 - 2 * fy);
    const topX = p00[0] * (1 - fx2) + p10[0] * fx2;
    const botX = p01[0] * (1 - fx2) + p11[0] * fx2;
    const topY = p00[1] * (1 - fx2) + p10[1] * fx2;
    const botY = p01[1] * (1 - fx2) + p11[1] * fx2;
    const warpedX = topX * (1 - fy2) + botX * fy2;
    const warpedY = topY * (1 - fy2) + botY * fy2;
    return [ x + (warpedX - x) * intensity, y + (warpedY - y) * intensity ];
}

function warpPathData(pathData) {
    const segs = parseCanvasPath(pathData);
    let lastWarpedX = 0, lastWarpedY = 0;
    const warpedSegments = [];
    for (const seg of segs) {
        const type = seg.type; let args = [...seg.args], warpedArgs = [];
        switch(type.toUpperCase()) {
            case 'M': case 'L': case 'T':
                for(let i=0;i<args.length;i+=2){
                    const x = args[i], y = args[i+1];
                    const wp = repositionPoint(x, y);
                    warpedArgs.push(wp[0], wp[1]);
                    lastWarpedX = wp[0]; lastWarpedY = wp[1];
                }
                break;
            case 'H':
                for(let i=0;i<args.length;i++){
                    const ox = args[i];
                    const wp = repositionPoint(ox, lastWarpedY);
                    warpedArgs.push(wp[0]);
                    lastWarpedX = wp[0];
                }
                break;
            case 'V':
                for(let i=0;i<args.length;i++){
                    const oy = args[i];
                    const wp = repositionPoint(lastWarpedX, oy);
                    warpedArgs.push(wp[1]);
                    lastWarpedY = wp[1];
                }
                break;
            case 'C':
                for(let i=0;i<args.length;i+=6){
                    const x1=args[i],y1=args[i+1],x2=args[i+2],y2=args[i+3],x=args[i+4],y=args[i+5];
                    const w1=repositionPoint(x1,y1), w2=repositionPoint(x2,y2), w=repositionPoint(x,y);
                    warpedArgs.push(w1[0],w1[1],w2[0],w2[1],w[0],w[1]);
                    lastWarpedX=w[0]; lastWarpedY=w[1];
                }
                break;
            case 'Q':
                for(let i=0;i<args.length;i+=4){
                    const x1=args[i],y1=args[i+1],x=args[i+2],y=args[i+3];
                    const w1=repositionPoint(x1,y1), w=repositionPoint(x,y);
                    warpedArgs.push(w1[0],w1[1],w[0],w[1]);
                    lastWarpedX=w[0]; lastWarpedY=w[1];
                }
                break;
            default:
                warpedArgs = args;
                if(args.length>=2 && isFinite(args[args.length-2]) && isFinite(args[args.length-1])){
                    lastWarpedX = args[args.length-2];
                    lastWarpedY = args[args.length-1];
                }
                break;
        }
        warpedSegments.push({type, args: warpedArgs});
    }
    return warpedSegments.map(seg => {
        const fmt = n => Math.abs(n)<1e-6 ? 0 : +n.toFixed(6);
        const args = seg.args.map(fmt);
        return seg.type.toUpperCase() === 'Z' ? seg.type : `${seg.type}${args.length ? ' ' + args.join(' ') : ''}`;
    }).join(' ');
}

// --- Unified Center Offset Calculation ---
function getCenterOffset(t, warpedPathData) {
    // Returns the offset needed to center overlays and hit tests
    const segs = parseCanvasPath(warpedPathData);
    const xs = [], ys = [];
    segs.forEach(s => { for(let i=0;i<s.args.length;i+=2){ xs.push(s.args[i]); ys.push(s.args[i+1]); } });
    if (xs.length && ys.length) {
        const minX = Math.min(...xs), maxX = Math.max(...xs);
        const minY = Math.min(...ys), maxY = Math.max(...ys);
        return {
            x: t.x - (minX + maxX) / 2 + canvas.width / 2,
            y: t.y - (minY + maxY) / 2 + canvas.height / 2
        };
    }
    return {x: t.x, y: t.y};
}

// --- Render Styled Text to Offscreen Canvas (Simplified) ---
function renderStyledObjectToOffscreen(obj, targetCtx, targetCanvas) {
    targetCtx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
    targetCtx.save();
    // Center drawing on the offscreen canvas
    const centerX = targetCanvas.width / 2;
    const centerY = targetCanvas.height / 2;

    // Apply basic styles
    targetCtx.font = `${obj.fontSize}px "${obj.fontFamily}"`; // Basic font setting
    targetCtx.fillStyle = obj.color;
    targetCtx.textAlign = "center";
    targetCtx.textBaseline = "middle";

    // Draw the text
    targetCtx.fillText(obj.text, centerX, centerY);

    // Get metrics (simplified)
    const metrics = targetCtx.measureText(obj.text);
    const ascent = metrics.actualBoundingBoxAscent || obj.fontSize * 0.8;
    const descent = metrics.actualBoundingBoxDescent || obj.fontSize * 0.2;
    const textHeight = ascent + descent;
    const textWidth = metrics.width;

    targetCtx.restore();

    // Return info needed for drawing from offscreen
    return {
        width: textWidth,
        height: textHeight,
        sourceX: centerX - textWidth / 2, // Top-left corner of text on offscreen
        sourceY: centerY - textHeight / 2,
        sourceWidth: textWidth,
        sourceHeight: textHeight,
        offscreenCenterX: centerX,
        offscreenCenterY: centerY
    };
}

// --- Draw Warped Text (Using Offscreen Canvas and Clipping) ---
function drawWarpedText(t) {
    if (!loadedFont) return drawNormalText(t); // Fallback
    if (!t.gridWarp || t.gridWarp.text !== t.text || t.gridWarp.fontSize !== t.fontSize || t.gridWarp.fontFamily !== t.fontFamily) {
        const pathData = getTextPathData(t);
        createGrid(pathData);
        t.gridWarp = {
            text: t.text,
            fontSize: t.fontSize,
            fontFamily: t.fontFamily,
            pathData,
            grid: JSON.parse(JSON.stringify(gridWarp.controlPoints)),
            padding: gridWarp.padding,
            intensity: gridWarp.intensity
        };
    }
    gridWarp.padding = +paddingSlider.value;
    gridWarp.intensity = +intensitySlider.value / 100;
    paddingValue.textContent = gridWarp.padding;
    intensityValue.textContent = intensitySlider.value + '%';
    if (t.gridWarp.padding !== gridWarp.padding) {
        createGrid(t.gridWarp.pathData);
        t.gridWarp.grid = JSON.parse(JSON.stringify(gridWarp.controlPoints));
        t.gridWarp.padding = gridWarp.padding;
    }
    gridWarp.controlPoints = t.gridWarp.grid; // Use the text's saved grid

    // 1. Calculate the warped path
    const warpedPathData = warpPathData(t.gridWarp.pathData);
    const centerOffset = getCenterOffset(t, warpedPathData); // Offset to center the warped shape
    const warpedPath = new Path2D(warpedPathData);

    // 2. Draw the warped path directly with fill color
    ctx.save();
    ctx.translate(centerOffset.x, centerOffset.y); // Move origin to center of warped shape
    ctx.fillStyle = t.color; // Use the text's color
    ctx.fill(warpedPath);    // Fill the calculated warped path
    ctx.restore();           // Restore context

    // 6. Draw grid lines/controls if selected (unchanged)
    if (t === selectedText) {
        // We already calculated centerOffset and warpedPathData above
        drawGridLines(centerOffset);
        drawControlShape(centerOffset);
    }
}

function drawGridLines(centerOffset) {
    if (!gridWarp.controlPoints.length) return;
    ctx.save();
    ctx.translate(centerOffset?.x || 0, centerOffset?.y || 0);
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 1;
    const cols = gridWarp.meshCols, rows = gridWarp.meshRows;
    for (let r = 0; r < rows; r++) {
        ctx.beginPath();
        for (let c = 0; c < cols; c++) {
            const idx = r * cols + c;
            const pt = gridWarp.controlPoints[idx];
            if (c === 0) ctx.moveTo(pt[0], pt[1]);
            else ctx.lineTo(pt[0], pt[1]);
        }
        ctx.stroke();
    }
    for (let c = 0; c < cols; c++) {
        ctx.beginPath();
        for (let r = 0; r < rows; r++) {
            const idx = r * cols + c;
            const pt = gridWarp.controlPoints[idx];
            if (r === 0) ctx.moveTo(pt[0], pt[1]);
            else ctx.lineTo(pt[0], pt[1]);
        }
        ctx.stroke();
    }
    ctx.restore();
}

function drawControlShape(centerOffset) {
    if (!gridWarp.controlPoints.length) return;
    ctx.save();
    ctx.translate(centerOffset?.x || 0, centerOffset?.y || 0);
    // Only draw control points (NO rectangle at all)
    gridWarp.controlPoints.forEach(pt => {
        ctx.beginPath();
        ctx.arc(pt[0], pt[1], 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.stroke();
    });
    ctx.restore();
}

// --- Robust Drag Logic for Text & Control Points (with pointer cursor) ---
let dragTarget = null, dragOffset = {x:0, y:0};
let draggingControlPoint = null, dragControlPointOffset = {x:0, y:0};

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);
    draggingControlPoint = null;
    dragTarget = null;
    // Only compute offset if gridWarp is active
    let centerOffset = {x:0, y:0};
    let warpedPathData = null;
    // ** Check effectMode here **
    if (selectedText && selectedText.effectMode === 'gridWarp' && selectedText.gridWarp && selectedText.gridWarp.pathData) {
        warpedPathData = warpPathData(selectedText.gridWarp.pathData);
        centerOffset = getCenterOffset(selectedText, warpedPathData);
    }
    // 1. Try control point hit first
    // ** Check effectMode here **
    if (selectedText && selectedText.effectMode === 'gridWarp' && gridWarp.controlPoints.length) {
        for (let i = 0; i < gridWarp.controlPoints.length; i++) {
            const pt = gridWarp.controlPoints[i];
            const px = pt[0] + centerOffset.x;
            const py = pt[1] + centerOffset.y;
            const dist = Math.hypot(mx - px, my - py);
            if (dist <= 10) {
                draggingControlPoint = i;
                dragControlPointOffset.x = mx - px;
                dragControlPointOffset.y = my - py;
                return;
            }
        }
    }
    // 2. Try text hit
    let found = false;
    for (let i = texts.length - 1; i >= 0; i--) {
        const t = texts[i];
        let bounds;
        // ** Check effectMode here **
        if (t.effectMode === 'gridWarp' && t.gridWarp && t.gridWarp.pathData) {
            const warped = warpPathData(t.gridWarp.pathData);
            const offset = getCenterOffset(t, warped);
            const segs = parseCanvasPath(warped);
            const xs = [], ys = [];
            segs.forEach(s => { for(let i=0;i<s.args.length;i+=2){ xs.push(s.args[i]); ys.push(s.args[i+1]); } });
            if (xs.length && ys.length) {
                const minX = Math.min(...xs), maxX = Math.max(...xs);
                const minY = Math.min(...ys), maxY = Math.max(...ys);
                bounds = { x: offset.x + minX, y: offset.y + minY, width: maxX - minX, height: maxY - minY };
            }
        } else {
            // Calculate bounds for normal text (simplified)
            const approxWidth = t.fontSize * t.text.length * 0.6; // Rough estimate
            const approxHeight = t.fontSize;
            bounds = { x: t.x - approxWidth / 2, y: t.y - approxHeight / 2, width: approxWidth, height: approxHeight };
        }
        if (bounds && mx >= bounds.x && mx <= bounds.x + bounds.width && my >= bounds.y && my <= bounds.y + bounds.height) {
            dragTarget = t;
            dragOffset.x = mx - t.x;
            dragOffset.y = my - t.y;
            selectText(t);
            found = true;
            break;
        }
    }
    if (!found) {
        selectText(null);
    }
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);
    let hoveringControl = false;
    let centerOffset = {x:0, y:0};
    // ** Check effectMode here **
    if (selectedText && selectedText.effectMode === 'gridWarp' && selectedText.gridWarp && selectedText.gridWarp.pathData) {
        const warpedPathData = warpPathData(selectedText.gridWarp.pathData);
        centerOffset = getCenterOffset(selectedText, warpedPathData);
        // Pointer cursor if hovering control point
        for (let i = 0; i < gridWarp.controlPoints.length; i++) {
            const pt = gridWarp.controlPoints[i];
            const px = pt[0] + centerOffset.x;
            const py = pt[1] + centerOffset.y;
            const dist = Math.hypot(mx - px, my - py);
            if (dist <= 10) {
                canvas.style.cursor = 'pointer';
                hoveringControl = true;
                break;
            }
        }
    }
    if (!hoveringControl) {
        canvas.style.cursor = '';
    }
    // ** Check effectMode here **
    if (draggingControlPoint !== null && selectedText && selectedText.effectMode === 'gridWarp') {
        const newX = mx - centerOffset.x - dragControlPointOffset.x;
        const newY = my - centerOffset.y - dragControlPointOffset.y;
        gridWarp.controlPoints[draggingControlPoint][0] = newX;
        gridWarp.controlPoints[draggingControlPoint][1] = newY;
        selectedText.gridWarp.grid[draggingControlPoint][0] = newX;
        selectedText.gridWarp.grid[draggingControlPoint][1] = newY;
        redrawAll();
    } else if (dragTarget) {
        dragTarget.x = mx - dragOffset.x;
        dragTarget.y = my - dragOffset.y;
        redrawAll();
    }
});

canvas.addEventListener('mouseup', () => { draggingControlPoint = null; dragTarget = null; });
canvas.addEventListener('mouseleave', () => { draggingControlPoint = null; dragTarget = null; });

// --- Add Text ---
addTextBtn.addEventListener('click', () => {
    // Center the text in the canvas
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const newText = {
        text: 'Sample Text',
        x: centerX,
        y: centerY,
        fontSize: 100,
        fontFamily: 'Roboto', // Default font
        color: '#333333',
        effectMode: 'normal', // Use effectMode like editor
        // Add other potential properties if needed for consistency, even if unused here
        bold: false,
        italic: false,
        // ... other style/effect defaults
        gridWarp: null // Specific state for this effect
    };
    texts.push(newText);
    selectText(newText);
    redrawAll();
});

// --- Select Text ---
function selectText(t) {
    selectedText = t;
    updateUIControls();
    redrawAll();
    if (selectedText) {
        textContentInput.disabled = false;
        textContentInput.value = selectedText.text;
        textContentInput.focus();
    } else {
        textContentInput.disabled = true;
        textContentInput.value = '';
    }
}

// --- Update UI Controls ---
function updateUIControls() {
    if (selectedText) {
        textContentInput.value = selectedText.text;
        textContentInput.disabled = false;
        fontSizeInput.value = selectedText.fontSize;
        fontSizeValue.textContent = selectedText.fontSize;
        fontFamilyInput.value = selectedText.fontFamily;
        fontColorInput.value = selectedText.color;
        effectDropdown.value = selectedText.effectMode || 'normal'; // Use effectMode
        // Enable/disable basic controls
        fontSizeInput.disabled = false;
        fontFamilyInput.disabled = false;
        fontColorInput.disabled = false;
        effectDropdown.disabled = false;

        gridWarpControls.classList.toggle('hidden', selectedText.effectMode !== 'gridWarp'); // Use effectMode
        noTextMsg.style.display = 'none';
    } else {
        textContentInput.value = '';
        textContentInput.disabled = true;
        fontSizeInput.disabled = true;
        fontFamilyInput.disabled = true;
        fontColorInput.disabled = true;
        effectDropdown.disabled = true; // Disable effect dropdown too
        gridWarpControls.classList.add('hidden');
        noTextMsg.style.display = '';
    }
}

// --- Property Updates ---
textContentInput.addEventListener('input', () => {
    if (selectedText) {
        selectedText.text = textContentInput.value;
        redrawAll();
    }
});
fontSizeInput.addEventListener('input', () => {
    if (selectedText) {
        selectedText.fontSize = +fontSizeInput.value;
        fontSizeValue.textContent = selectedText.fontSize;
        // Update grid warp if active (check effectMode)
        if (selectedText.effectMode === 'gridWarp' && selectedText.gridWarp) {
            // Recalculate path and grid if font size changes
            const pathData = getTextPathData(selectedText);
            createGrid(pathData); // Recalculates grid bounds and points
            selectedText.gridWarp.pathData = pathData;
            selectedText.gridWarp.grid = JSON.parse(JSON.stringify(gridWarp.controlPoints));
        }
        redrawAll();
    }
});
fontFamilyInput.addEventListener('change', () => {
    if (selectedText) {
        selectedText.fontFamily = fontFamilyInput.value;
        // Update grid warp if active (check effectMode)
        if (selectedText.effectMode === 'gridWarp' && selectedText.gridWarp) {
            // Recalculate path and grid if font family changes
            const pathData = getTextPathData(selectedText);
            createGrid(pathData); // Recalculates grid bounds and points
            selectedText.gridWarp.pathData = pathData;
            selectedText.gridWarp.grid = JSON.parse(JSON.stringify(gridWarp.controlPoints));
        }
        redrawAll();
    }
});
fontColorInput.addEventListener('input', () => {
    if (selectedText) {
        selectedText.color = fontColorInput.value;
        redrawAll();
    }
});

effectDropdown.addEventListener('change', () => {
    if (selectedText) {
        selectedText.effectMode = effectDropdown.value; // Update effectMode
        // If switching *to* gridWarp, ensure grid state is initialized
        if (selectedText.effectMode === 'gridWarp' && !selectedText.gridWarp) {
             const pathData = getTextPathData(selectedText);
             createGrid(pathData);
             selectedText.gridWarp = {
                 text: selectedText.text,
                 fontSize: selectedText.fontSize,
                 fontFamily: selectedText.fontFamily,
                 pathData,
                 grid: JSON.parse(JSON.stringify(gridWarp.controlPoints)),
                 padding: gridWarp.padding,
                 intensity: gridWarp.intensity
             };
        }
        updateUIControls();
        redrawAll();
    }
});

// --- Update grid warp controls on slider change ---
paddingSlider.addEventListener('input', () => {
    gridWarp.padding = +paddingSlider.value;
    paddingValue.textContent = gridWarp.padding;
    if (selectedText && selectedText.effectMode === 'gridWarp' && selectedText.gridWarp) {
        // Update padding in the selected text's state as well
        selectedText.gridWarp.padding = gridWarp.padding;
        // Recalculate grid based on new padding
        createGrid(selectedText.gridWarp.pathData); // This updates global gridWarp.controlPoints
        selectedText.gridWarp.grid = JSON.parse(JSON.stringify(gridWarp.controlPoints)); // Save the new grid to the object
        redrawAll();
    }
});
intensitySlider.addEventListener('input', () => {
    gridWarp.intensity = +intensitySlider.value / 100;
    intensityValue.textContent = intensitySlider.value + '%';
    if (selectedText && selectedText.effectMode === 'gridWarp' && selectedText.gridWarp) {
        // Update intensity in the selected text's state
        selectedText.gridWarp.intensity = gridWarp.intensity;
        redrawAll(); // Intensity is applied during drawing, just need redraw
    }
});

// --- Reset/Save/Apply Distortion ---
document.getElementById('resetControlPoints').addEventListener('click', () => {
    if (selectedText && selectedText.effectMode === 'gridWarp' && selectedText.gridWarp) {
        // Recalculate the original grid based on current text/font/padding
        createGrid(selectedText.gridWarp.pathData); // This updates global gridWarp.controlPoints
        // Save the reset grid back to the object
        selectedText.gridWarp.grid = JSON.parse(JSON.stringify(gridWarp.controlPoints));
        redrawAll();
    }
});
// Save is implicit now as grid points are saved on drag/reset/padding change
document.getElementById('saveDistortionBtn').addEventListener('click', () => {
    if (selectedText && selectedText.effectMode === 'gridWarp' && selectedText.gridWarp) {
        alert('Distortion is saved automatically as you edit.');
    }
});
// Apply doesn't make sense in this simplified model where state is tied to the object
document.getElementById('applyDistortionBtn').addEventListener('click', () => {
    if (selectedText && selectedText.effectMode === 'gridWarp' && selectedText.gridWarp) {
        alert('Apply distortion is not applicable here.');
        redrawAll();
    }
});

// --- Render Pipeline ---
function redrawAll() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear main canvas
    // Optional: Clear offscreen canvas if needed, but renderStyledObjectToOffscreen does it
    // octx.clearRect(0, 0, os.width, os.height);

    for (const t of texts) {
        if (t.effectMode === 'gridWarp') { // Check effectMode
            drawWarpedText(t);
        } else {
            drawNormalText(t);
        }
        // Selection highlight / Grid drawing
        if (t === selectedText) {
            // drawSelection(t); // Original selection box might be confusing with grid
            // Always show grid/mesh for selected text if it's gridWarp
            if (t.effectMode === 'gridWarp' && t.gridWarp) { // Check effectMode
                // Need to recalculate warped path and offset for drawing controls accurately
                const warpedPathData = warpPathData(t.gridWarp.pathData);
                const centerOffset = getCenterOffset(t, warpedPathData);
                drawGridLines(centerOffset); // Draw grid lines based on current state
                drawControlShape(centerOffset);
            }
        }
    }
}

// --- Draw Normal Text (Using Offscreen Canvas) ---
function drawNormalText(t) {
    // 1. Render styled text to the offscreen canvas
    const renderMetrics = renderStyledObjectToOffscreen(t, octx, os);

    // 2. Draw the relevant part of the offscreen canvas to the main canvas
    ctx.save();
    ctx.translate(t.x, t.y); // Position based on object's center

    // Calculate destination rect centered around the object's x, y
    const destWidth = renderMetrics.sourceWidth;
    const destHeight = renderMetrics.sourceHeight;
    const destX = -destWidth / 2;
    const destY = -destHeight / 2;

    try {
        // Draw the portion containing the text from offscreen to main canvas
        ctx.drawImage(os,
            renderMetrics.sourceX, renderMetrics.sourceY, // Source rect top-left on offscreen
            renderMetrics.sourceWidth, renderMetrics.sourceHeight, // Source rect dimensions
            destX, destY,           // Destination rect top-left on main canvas
            destWidth, destHeight); // Destination rect dimensions
    } catch (e) {
        console.error("Error drawing offscreen canvas in drawNormalText:", e);
        // Fallback: Draw simple text if offscreen fails
        ctx.font = `${t.fontSize}px ${t.fontFamily}`;
        ctx.fillStyle = t.color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(t.text, 0, 0); // Draw at translated origin (t.x, t.y)
    }
    ctx.restore();
} // <-- Added missing closing brace for drawNormalText function
// Removed extra closing brace here (comment remains, but the actual extra brace was likely never there or removed previously)

// --- Draw Selection (Simplified - maybe just outline bounds) ---
function drawSelection(t) { // Un-indented function definition
    // For grid warp, the grid lines serve as selection indicator
    if (t.effectMode === 'gridWarp') return;

    // For normal text, draw a simple bounding box
    // Note: This doesn't account for rotation in this simplified demo
    ctx.save();
    ctx.translate(t.x, t.y); // Go to object center
    // Calculate approximate bounds based on font size (less accurate than measureText)
    const approxWidth = t.fontSize * t.text.length * 0.6; // Very rough estimate
    const approxHeight = t.fontSize;
    ctx.strokeStyle = '#8b5cf6'; // Violet
    ctx.lineWidth = 1; // Thin line
    ctx.strokeRect(-approxWidth / 2, -approxHeight / 2, approxWidth, approxHeight);
    ctx.restore();
}
// --- Init ---
paddingValue.textContent = paddingSlider.value;
intensityValue.textContent = intensitySlider.value + '%';
redrawAll();

// --- NOTE ON CANVAS TYPE ---
// This demo uses a standard HTML5 <canvas> (pixel-based raster).
// The main editor also uses a pixel-based canvas, NOT SVG.
// To render vector effects (like grid warp), you must convert text to path (using opentype.js),
// then draw the path to the canvas using Path2D or manual drawing. You cannot directly place SVG elements on the canvas.
// This scaffold is ready for such integration.

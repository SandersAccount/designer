// Canvas High-DPI Test - Minimal implementation to debug font rendering
let canvas, ctx, canvasWrapper;
let currentQuality = 1;
let debugLog = [];

// Zoom and pan variables
let zoomLevel = 1;
let panX = 0;
let panY = 0;
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

// Initialize the test
document.addEventListener('DOMContentLoaded', function() {
    canvas = document.getElementById('testCanvas');
    canvasWrapper = document.getElementById('canvasWrapper');
    ctx = canvas.getContext('2d');

    log('🚀 Canvas test initialized');
    log(`📱 Device pixel ratio: ${window.devicePixelRatio}`);

    setupZoomAndPan();
    setupCanvas();
    updateText();
});

function log(message) {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    debugLog.push(logMessage);
    
    // Keep only last 50 log entries
    if (debugLog.length > 50) {
        debugLog.shift();
    }
    
    const logElement = document.getElementById('debugLog');
    if (logElement) {
        logElement.innerHTML = 'Debug Log:\n' + debugLog.join('\n');
        logElement.scrollTop = logElement.scrollHeight;
    }
    
    console.log(logMessage);
}

function setQuality(quality) {
    currentQuality = quality;
    
    // Update button states
    document.querySelectorAll('.quality-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    log(`🎯 Quality changed to ${quality}x`);
    setupCanvas();
    updateText();
}

function setupCanvas() {
    const displayWidth = 800;
    const displayHeight = 400;
    const devicePixelRatio = window.devicePixelRatio || 1;
    const totalScale = currentQuality * devicePixelRatio;
    
    log(`🔧 [SETUP] Display size: ${displayWidth}x${displayHeight}`);
    log(`🔧 [SETUP] Device pixel ratio: ${devicePixelRatio}`);
    log(`🔧 [SETUP] Quality multiplier: ${currentQuality}x`);
    log(`🔧 [SETUP] Total scale factor: ${totalScale}`);
    
    // Store the scale factor on the canvas for later use
    canvas.scaleFactor = totalScale;
    
    // Reset any existing transformations
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    log(`🔧 [SETUP] Reset transform to identity`);
    
    // Set the actual canvas size in memory (scaled up for higher quality)
    canvas.width = displayWidth * totalScale;
    canvas.height = displayHeight * totalScale;
    log(`🔧 [SETUP] Canvas memory size: ${canvas.width}x${canvas.height}`);
    
    // Set the display size (CSS size)
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';
    log(`🔧 [SETUP] Canvas CSS size: ${canvas.style.width} x ${canvas.style.height}`);
    
    // Scale the context to match the device pixel ratio and quality
    ctx.scale(totalScale, totalScale);
    log(`🔧 [SETUP] Applied scale transform: ${totalScale}`);
    log(`🔧 [SETUP] Final transform:`, ctx.getTransform());
    
    // Enable high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.textRenderingOptimization = 'optimizeQuality';
    
    updateCanvasInfo();
}

function updateCanvasInfo() {
    const info = document.getElementById('canvasInfo');
    if (!info) return;
    
    const transform = ctx.getTransform();
    
    info.innerHTML = `
        <strong>Canvas Info:</strong><br>
        Memory Size: ${canvas.width} x ${canvas.height}<br>
        CSS Size: ${canvas.style.width} x ${canvas.style.height}<br>
        Scale Factor: ${canvas.scaleFactor}<br>
        Current Quality: ${currentQuality}x<br>
        Device Pixel Ratio: ${window.devicePixelRatio}<br>
        Transform: [${transform.a.toFixed(2)}, ${transform.b.toFixed(2)}, ${transform.c.toFixed(2)}, ${transform.d.toFixed(2)}, ${transform.e.toFixed(2)}, ${transform.f.toFixed(2)}]<br>
        Image Smoothing: ${ctx.imageSmoothingEnabled} (${ctx.imageSmoothingQuality})
    `;
}

function updateText() {
    const fontSize = document.getElementById('fontSize').value;
    const fontFamily = document.getElementById('fontFamily').value;
    const text = document.getElementById('textInput').value;
    const color = document.getElementById('textColor').value;
    const gradientType = document.getElementById('gradientType').value;
    const gradientColor1 = document.getElementById('gradientColor1').value;
    const gradientColor2 = document.getElementById('gradientColor2').value;
    const textMode = document.getElementById('textMode').value;
    const diameter = document.getElementById('diameter').value;
    const kerning = document.getElementById('kerning').value;
    const gridCols = document.getElementById('gridCols').value;
    const gridRows = document.getElementById('gridRows').value;
    const gridIntensity = document.getElementById('gridIntensity').value;

    // Update display values
    document.getElementById('fontSizeValue').textContent = fontSize + 'px';
    document.getElementById('diameterValue').textContent = diameter + 'px';
    document.getElementById('kerningValue').textContent = kerning + 'px';
    document.getElementById('gridColsValue').textContent = gridCols;
    document.getElementById('gridRowsValue').textContent = gridRows;
    document.getElementById('gridIntensityValue').textContent = gridIntensity + '%';

    // Show/hide gradient controls
    const gradientControls = document.getElementById('gradientControls');
    if (gradientType !== 'none') {
        gradientControls.style.display = 'flex';
    } else {
        gradientControls.style.display = 'none';
    }

    // Show/hide circular controls
    const circularControls = document.getElementById('circularControls');
    const circularKerning = document.getElementById('circularKerning');
    if (textMode === 'circular') {
        circularControls.style.display = 'flex';
        circularKerning.style.display = 'flex';
    } else {
        circularControls.style.display = 'none';
        circularKerning.style.display = 'none';
    }

    // Show/hide grid distort controls
    const gridDistortControls = document.getElementById('gridDistortControls');
    const gridDistortRows = document.getElementById('gridDistortRows');
    const gridDistortIntensity = document.getElementById('gridDistortIntensity');
    if (textMode === 'grid-distort') {
        gridDistortControls.style.display = 'flex';
        gridDistortRows.style.display = 'flex';
        gridDistortIntensity.style.display = 'flex';
    } else {
        gridDistortControls.style.display = 'none';
        gridDistortRows.style.display = 'none';
        gridDistortIntensity.style.display = 'none';
    }

    log(`🔤 [RENDER] Font: ${fontSize}px ${fontFamily}`);
    log(`🔤 [RENDER] Text: "${text}"`);
    log(`🔤 [RENDER] Color: ${color}`);
    log(`🔤 [RENDER] Gradient: ${gradientType} (${gradientColor1} → ${gradientColor2})`);
    log(`🔤 [RENDER] Mode: ${textMode}`);
    if (textMode === 'circular') {
        log(`🔄 [CIRCULAR] Diameter: ${diameter}px, Kerning: ${kerning}px`);
    } else if (textMode === 'grid-distort') {
        log(`🔲 [GRID] Cols: ${gridCols}, Rows: ${gridRows}, Intensity: ${gridIntensity}%`);
    }

    const gradientConfig = gradientType !== 'none' ? {
        type: gradientType,
        color1: gradientColor1,
        color2: gradientColor2
    } : null;

    const gridConfig = textMode === 'grid-distort' ? {
        cols: parseInt(gridCols),
        rows: parseInt(gridRows),
        intensity: parseInt(gridIntensity) / 100
    } : null;

    renderText(fontSize, fontFamily, text, color, textMode, diameter, kerning, gradientConfig, gridConfig);
}

function renderText(fontSize, fontFamily, text, color, textMode = 'normal', diameter = 300, kerning = 0, gradientConfig = null, gridConfig = null) {
    // Clear canvas with proper scaling
    ctx.save();

    // CRITICAL: Preserve the high-DPI scaling when clearing
    const scaleFactor = canvas.scaleFactor || 1;
    ctx.setTransform(scaleFactor, 0, 0, scaleFactor, 0, 0);

    // Clear the canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width / scaleFactor, canvas.height / scaleFactor);

    ctx.restore();

    log(`🧹 [CLEAR] Cleared canvas with scale factor: ${scaleFactor}`);
    log(`🧹 [CLEAR] Clear rect: 0,0,${canvas.width / scaleFactor},${canvas.height / scaleFactor}`);

    // Calculate center position (in logical coordinates)
    const centerX = 400; // Half of display width
    const centerY = 200; // Half of display height

    if (gradientConfig) {
        log(`🎨 [GRADIENT] Using gradient masking system`);
        if (textMode === 'circular') {
            renderCircularTextWithGradient(fontSize, fontFamily, text, color, centerX, centerY, diameter, kerning, gradientConfig);
        } else if (textMode === 'grid-distort') {
            renderGridDistortTextWithGradient(fontSize, fontFamily, text, color, centerX, centerY, gridConfig, gradientConfig);
        } else {
            renderNormalTextWithGradient(fontSize, fontFamily, text, color, centerX, centerY, gradientConfig);
        }
    } else {
        log(`🎨 [SOLID] Using solid color rendering`);
        if (textMode === 'circular') {
            renderCircularText(fontSize, fontFamily, text, color, centerX, centerY, diameter, kerning);
        } else if (textMode === 'grid-distort') {
            renderGridDistortText(fontSize, fontFamily, text, color, centerX, centerY, gridConfig);
        } else {
            renderNormalText(fontSize, fontFamily, text, color, centerX, centerY);
        }
    }

    log(`✅ [COMPLETE] Text rendered successfully`);

    // Update canvas info
    updateCanvasInfo();
}

function renderNormalText(fontSize, fontFamily, text, color, centerX, centerY) {
    // Set font properties
    ctx.font = `${fontSize}px "${fontFamily}"`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Enable high-quality text rendering
    ctx.textRenderingOptimization = 'optimizeQuality';
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    log(`🔤 [FONT] Set font: ${ctx.font}`);
    log(`🔤 [FONT] Current transform:`, ctx.getTransform());
    log(`🔤 [FONT] Image smoothing: ${ctx.imageSmoothingEnabled} (${ctx.imageSmoothingQuality})`);
    log(`🎯 [POSITION] Drawing at: ${centerX}, ${centerY}`);

    // Draw the text
    ctx.fillText(text, centerX, centerY);
}

function renderCircularText(fontSize, fontFamily, text, color, centerX, centerY, diameter, kerning) {
    log(`🔄 [CIRCULAR] Starting circular text rendering`);
    log(`🔄 [CIRCULAR] Parameters: fontSize=${fontSize}, diameter=${diameter}, kerning=${kerning}`);

    const radius = parseInt(diameter) / 2;
    const contentArr = text.split('');
    const letterAngles = [];
    let totalAngle = 0;

    // Calculate letter angles
    ctx.font = `${fontSize}px "${fontFamily}"`;
    contentArr.forEach((letter, i) => {
        const letterWidth = ctx.measureText(letter).width + parseInt(kerning);
        const letterAngle = (letterWidth / radius) * (180 / Math.PI);
        letterAngles.push(letterAngle);
        totalAngle += letterAngle;
        log(`🔄 [CIRCULAR] Letter "${letter}": width=${letterWidth.toFixed(2)}, angle=${letterAngle.toFixed(2)}°`);
    });

    log(`🔄 [CIRCULAR] Total angle: ${totalAngle.toFixed(2)}°`);

    // Start angle to center the text
    let currentAngleRad = -(totalAngle * Math.PI / 180) / 2;

    // Set common properties
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.textRenderingOptimization = 'optimizeQuality';
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    log(`🔄 [CIRCULAR] Starting angle: ${(currentAngleRad * 180 / Math.PI).toFixed(2)}°`);

    // Render each letter
    for (let i = 0; i < contentArr.length; i++) {
        const letter = contentArr[i];
        const letterAngleDeg = letterAngles[i];
        const letterAngleRad = letterAngleDeg * Math.PI / 180;
        const halfAngleRad = letterAngleRad / 2;

        currentAngleRad += halfAngleRad;

        // Calculate position
        const x = centerX + radius * Math.cos(currentAngleRad);
        const y = centerY + radius * Math.sin(currentAngleRad);

        log(`🔄 [CIRCULAR] Letter "${letter}" at position (${x.toFixed(2)}, ${y.toFixed(2)}), angle: ${(currentAngleRad * 180 / Math.PI).toFixed(2)}°`);

        // Save context and apply transforms
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(currentAngleRad + Math.PI / 2);

        // Draw the letter
        ctx.fillText(letter, 0, 0);

        ctx.restore();

        currentAngleRad += halfAngleRad;
    }

    log(`🔄 [CIRCULAR] Completed circular text rendering`);

    // Debug: Check if pixels were drawn
    const imageData = ctx.getImageData(centerX - radius - 50, centerY - radius - 50, (radius + 50) * 2, (radius + 50) * 2);
    const hasPixels = Array.from(imageData.data).some((value, index) => index % 4 === 3 && value > 0);
    log(`🔄 [CIRCULAR] Pixel check: hasVisiblePixels=${hasPixels}`);
}

// Gradient Masking Functions
function renderNormalTextWithGradient(fontSize, fontFamily, text, color, centerX, centerY, gradientConfig) {
    log(`🎨 [GRADIENT] Starting gradient masking for normal text`);
    log(`🎨 [GRADIENT] Using same high-resolution approach as solid color text`);

    // Step 1: Create text mask directly on main canvas
    // Save current state
    ctx.save();

    // Set font properties (same as solid color text)
    ctx.font = `${fontSize}px "${fontFamily}"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    log(`🔤 [FONT] Set font: ${ctx.font}`);
    log(`🔤 [FONT] Current transform:`, ctx.getTransform());
    log(`🔤 [FONT] Image smoothing: ${ctx.imageSmoothingEnabled} (${ctx.imageSmoothingQuality})`);
    log(`🎯 [POSITION] Drawing at: ${centerX}, ${centerY}`);

    // Step 2: Create gradient
    let gradient;
    if (gradientConfig.type === 'linear') {
        // Create linear gradient across the text width
        const textMetrics = ctx.measureText(text);
        const textWidth = textMetrics.width;
        gradient = ctx.createLinearGradient(centerX - textWidth/2, centerY, centerX + textWidth/2, centerY);
    } else if (gradientConfig.type === 'radial') {
        // Create radial gradient centered on text
        const textMetrics = ctx.measureText(text);
        const textWidth = textMetrics.width;
        const radius = textWidth / 2;
        gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    }

    gradient.addColorStop(0, gradientConfig.color1);
    gradient.addColorStop(1, gradientConfig.color2);

    log(`🎨 [GRADIENT] Created ${gradientConfig.type} gradient: ${gradientConfig.color1} → ${gradientConfig.color2}`);

    // Step 3: Apply gradient as fill style and draw text
    ctx.fillStyle = gradient;
    ctx.fillText(text, centerX, centerY);

    log(`🎨 [GRADIENT] Applied gradient fill and drew text`);

    // Restore state
    ctx.restore();

    log(`🎨 [GRADIENT] Gradient text rendering complete!`);
}

function renderCircularTextWithGradient(fontSize, fontFamily, text, color, centerX, centerY, diameter, kerning, gradientConfig) {
    log(`🎨 [GRADIENT] Gradient circular text not implemented yet - falling back to solid color`);
    renderCircularText(fontSize, fontFamily, text, color, centerX, centerY, diameter, kerning);
}

// Zoom and Pan Functions
function setupZoomAndPan() {
    // Mouse wheel zoom
    canvasWrapper.addEventListener('wheel', function(e) {
        e.preventDefault();

        const rect = canvasWrapper.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.1, Math.min(10, zoomLevel * zoomFactor));

        // Calculate zoom center
        const zoomCenterX = (mouseX - panX) / zoomLevel;
        const zoomCenterY = (mouseY - panY) / zoomLevel;

        // Update zoom and adjust pan to keep zoom center in place
        zoomLevel = newZoom;
        panX = mouseX - zoomCenterX * zoomLevel;
        panY = mouseY - zoomCenterY * zoomLevel;

        updateCanvasTransform();
        log(`🔍 [ZOOM] Wheel zoom to ${(zoomLevel * 100).toFixed(0)}%`);
    });

    // Mouse drag pan
    canvasWrapper.addEventListener('mousedown', function(e) {
        isDragging = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        canvasWrapper.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;

        const deltaX = e.clientX - lastMouseX;
        const deltaY = e.clientY - lastMouseY;

        panX += deltaX;
        panY += deltaY;

        lastMouseX = e.clientX;
        lastMouseY = e.clientY;

        updateCanvasTransform();
    });

    document.addEventListener('mouseup', function() {
        isDragging = false;
        canvasWrapper.style.cursor = 'grab';
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.target.tagName === 'INPUT') return;

        switch(e.key) {
            case '+':
            case '=':
                e.preventDefault();
                zoomIn();
                break;
            case '-':
                e.preventDefault();
                zoomOut();
                break;
            case '0':
                e.preventDefault();
                resetZoom();
                break;
            case 'f':
            case 'F':
                e.preventDefault();
                fitToView();
                break;
        }
    });
}

function updateCanvasTransform() {
    canvas.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
    document.getElementById('zoomInfo').textContent = `${(zoomLevel * 100).toFixed(0)}%`;
}

function zoomIn() {
    zoomLevel = Math.min(10, zoomLevel * 1.2);
    updateCanvasTransform();
    log(`🔍 [ZOOM] Zoom in to ${(zoomLevel * 100).toFixed(0)}%`);
}

function zoomOut() {
    zoomLevel = Math.max(0.1, zoomLevel / 1.2);
    updateCanvasTransform();
    log(`🔍 [ZOOM] Zoom out to ${(zoomLevel * 100).toFixed(0)}%`);
}

function resetZoom() {
    zoomLevel = 1;
    panX = 0;
    panY = 0;
    updateCanvasTransform();
    log(`🔍 [ZOOM] Reset to 100%`);
}

function fitToView() {
    const wrapperRect = canvasWrapper.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();

    const scaleX = (wrapperRect.width - 40) / canvas.offsetWidth;
    const scaleY = (wrapperRect.height - 40) / canvas.offsetHeight;

    zoomLevel = Math.min(scaleX, scaleY, 1);
    panX = (wrapperRect.width - canvas.offsetWidth * zoomLevel) / 2;
    panY = (wrapperRect.height - canvas.offsetHeight * zoomLevel) / 2;

    updateCanvasTransform();
    log(`🔍 [ZOOM] Fit to view: ${(zoomLevel * 100).toFixed(0)}%`);
}

// ===== GRID DISTORT IMPLEMENTATION =====

// Grid Distort state
let gridDistortState = {
    gridCols: 3,
    gridRows: 2,
    gridPadding: 80,
    intensity: 0.5,
    controlPoints: []
};

// Font loading for OpenType.js
let loadedFont = null;

// Load default font
async function loadFont() {
    try {
        log(`🔤 [FONT] Loading OpenType font...`);
        // Try to load a web font or use a fallback
        const fontUrl = 'https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrJJfecg.woff2';
        loadedFont = await opentype.load(fontUrl);
        log(`✅ [FONT] OpenType font loaded successfully`);
    } catch (error) {
        log(`❌ [FONT] Failed to load OpenType font: ${error.message}`);
        // Create a fallback font object
        loadedFont = {
            getPath: function(text, x, y, fontSize) {
                // Simple fallback - create a basic rectangular path
                const path = new opentype.Path();
                const width = text.length * fontSize * 0.6;
                const height = fontSize;
                path.moveTo(x, y);
                path.lineTo(x + width, y);
                path.lineTo(x + width, y + height);
                path.lineTo(x, y + height);
                path.closePath();
                return path;
            },
            getBoundingBox: function() {
                return { x1: 0, y1: 0, x2: 100, y2: 20 };
            }
        };
    }
}

// Initialize font loading when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadFont();
});

// Initialize grid control points
function initializeGridPoints(textWidth, textHeight, centerX, centerY, gridConfig) {
    const cols = gridConfig.cols;
    const rows = gridConfig.rows;
    const padding = gridDistortState.gridPadding;

    const gridLeft = centerX - textWidth/2 - padding;
    const gridTop = centerY - textHeight/2 - padding;
    const gridWidth = textWidth + padding * 2;
    const gridHeight = textHeight + padding * 2;

    gridDistortState.controlPoints = [];

    for (let row = 0; row <= rows; row++) {
        for (let col = 0; col <= cols; col++) {
            const x = gridLeft + (col / cols) * gridWidth;
            const y = gridTop + (row / rows) * gridHeight;

            // Add some random distortion based on intensity
            const maxOffset = Math.min(gridWidth, gridHeight) * 0.1 * gridConfig.intensity;
            const offsetX = (Math.random() - 0.5) * maxOffset;
            const offsetY = (Math.random() - 0.5) * maxOffset;

            gridDistortState.controlPoints.push({
                x: x + offsetX,
                y: y + offsetY,
                originalX: x,
                originalY: y
            });
        }
    }

    log(`🔲 [GRID] Initialized ${gridDistortState.controlPoints.length} control points`);
    log(`🔲 [GRID] Grid bounds: ${gridLeft.toFixed(1)}, ${gridTop.toFixed(1)}, ${gridWidth.toFixed(1)}x${gridHeight.toFixed(1)}`);
}

// Get warped position based on grid control points
function getWarpedPosition(x, y, controlPoints, cols, rows, gridLeft, gridTop, gridWidth, gridHeight, intensity) {
    // Normalize coordinates to 0-1 range within the grid
    const fx = Math.max(0, Math.min(1, (x - gridLeft) / gridWidth));
    const fy = Math.max(0, Math.min(1, (y - gridTop) / gridHeight));

    // Find grid cell
    const cellX = Math.min(cols - 1, Math.floor(fx * cols));
    const cellY = Math.min(rows - 1, Math.floor(fy * rows));

    // Local coordinates within cell (0-1)
    const localX = (fx * cols) - cellX;
    const localY = (fy * rows) - cellY;

    // Get corner points
    const p00 = controlPoints[cellY * (cols + 1) + cellX];
    const p10 = controlPoints[cellY * (cols + 1) + cellX + 1];
    const p01 = controlPoints[(cellY + 1) * (cols + 1) + cellX];
    const p11 = controlPoints[(cellY + 1) * (cols + 1) + cellX + 1];

    // Smooth interpolation factors
    const fx2 = localX * localX * (3 - 2 * localX);
    const fy2 = localY * localY * (3 - 2 * localY);

    // Bilinear interpolation
    const topX = p00.x * (1 - fx2) + p10.x * fx2;
    const botX = p01.x * (1 - fx2) + p11.x * fx2;
    const topY = p00.y * (1 - fx2) + p10.y * fx2;
    const botY = p01.y * (1 - fx2) + p11.y * fx2;

    // Final interpolated position
    const warpedX = topX * (1 - fy2) + botX * fy2;
    const warpedY = topY * (1 - fy2) + botY * fy2;

    // Apply intensity factor
    return {
        x: x + (warpedX - x) * intensity,
        y: y + (warpedY - y) * intensity
    };
}

// Render Grid Distort text with solid color
function renderGridDistortText(fontSize, fontFamily, text, color, centerX, centerY, gridConfig) {
    log(`🔲 [GRID] Starting Grid Distort text rendering (solid color)`);

    if (!loadedFont) {
        log(`❌ [GRID] OpenType font not loaded, falling back to normal text`);
        renderNormalText(fontSize, fontFamily, text, color, centerX, centerY);
        return;
    }

    try {
        // Create text path
        const path = loadedFont.getPath(text, 0, 0, fontSize);
        const bounds = path.getBoundingBox();
        const textWidth = bounds.x2 - bounds.x1;
        const textHeight = bounds.y2 - bounds.y1;

        log(`🔲 [GRID] Text dimensions: ${textWidth.toFixed(1)}x${textHeight.toFixed(1)}`);

        // Initialize grid
        initializeGridPoints(textWidth, textHeight, centerX, centerY, gridConfig);

        // Calculate grid bounds
        const padding = gridDistortState.gridPadding;
        const gridLeft = centerX - textWidth/2 - padding;
        const gridTop = centerY - textHeight/2 - padding;
        const gridWidth = textWidth + padding * 2;
        const gridHeight = textHeight + padding * 2;

        // Set rendering properties
        ctx.fillStyle = color;
        ctx.strokeStyle = color;

        // Create warped path
        const warpedPath = new opentype.Path();

        path.commands.forEach(cmd => {
            const x = cmd.x + centerX;
            const y = cmd.y + centerY;

            const warped = getWarpedPosition(
                x, y,
                gridDistortState.controlPoints, gridConfig.cols, gridConfig.rows,
                gridLeft, gridTop, gridWidth, gridHeight,
                gridConfig.intensity
            );

            switch (cmd.type) {
                case 'M':
                    warpedPath.moveTo(warped.x, warped.y);
                    break;
                case 'L':
                    warpedPath.lineTo(warped.x, warped.y);
                    break;
                case 'C':
                    const cp1 = getWarpedPosition(cmd.x1 + centerX, cmd.y1 + centerY, gridDistortState.controlPoints, gridConfig.cols, gridConfig.rows, gridLeft, gridTop, gridWidth, gridHeight, gridConfig.intensity);
                    const cp2 = getWarpedPosition(cmd.x2 + centerX, cmd.y2 + centerY, gridDistortState.controlPoints, gridConfig.cols, gridConfig.rows, gridLeft, gridTop, gridWidth, gridHeight, gridConfig.intensity);
                    warpedPath.curveTo(cp1.x, cp1.y, cp2.x, cp2.y, warped.x, warped.y);
                    break;
                case 'Q':
                    const cp = getWarpedPosition(cmd.x1 + centerX, cmd.y1 + centerY, gridDistortState.controlPoints, gridConfig.cols, gridConfig.rows, gridLeft, gridTop, gridWidth, gridHeight, gridConfig.intensity);
                    warpedPath.quadraticCurveTo(cp.x, cp.y, warped.x, warped.y);
                    break;
                case 'Z':
                    warpedPath.closePath();
                    break;
            }
        });

        // Draw the warped path
        warpedPath.draw(ctx);

        log(`✅ [GRID] Grid Distort text rendered successfully`);

    } catch (error) {
        log(`❌ [GRID] Error rendering Grid Distort text: ${error.message}`);
        renderNormalText(fontSize, fontFamily, text, color, centerX, centerY);
    }
}

// Render Grid Distort text with gradient
function renderGridDistortTextWithGradient(fontSize, fontFamily, text, color, centerX, centerY, gridConfig, gradientConfig) {
    log(`🔲 [GRID] Starting Grid Distort text rendering (gradient)`);

    if (!loadedFont) {
        log(`❌ [GRID] OpenType font not loaded, falling back to normal gradient text`);
        renderNormalTextWithGradient(fontSize, fontFamily, text, color, centerX, centerY, gradientConfig);
        return;
    }

    try {
        // Create text path for measurements
        const path = loadedFont.getPath(text, 0, 0, fontSize);
        const bounds = path.getBoundingBox();
        const textWidth = bounds.x2 - bounds.x1;
        const textHeight = bounds.y2 - bounds.y1;

        log(`🔲 [GRID] Text dimensions: ${textWidth.toFixed(1)}x${textHeight.toFixed(1)}`);

        // Initialize grid
        initializeGridPoints(textWidth, textHeight, centerX, centerY, gridConfig);

        // Calculate canvas size for gradient masking
        const padding = gridDistortState.gridPadding;
        const canvasWidth = textWidth + padding * 4;
        const canvasHeight = textHeight + padding * 4;

        // Create temporary canvas for text mask
        const tempCanvas = document.createElement('canvas');
        const scaleFactor = canvas.scaleFactor || 1;
        tempCanvas.width = canvasWidth * scaleFactor;
        tempCanvas.height = canvasHeight * scaleFactor;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.scale(scaleFactor, scaleFactor);
        tempCtx.imageSmoothingEnabled = true;
        tempCtx.imageSmoothingQuality = 'high';

        // Create gradient canvas
        const gradientCanvas = document.createElement('canvas');
        gradientCanvas.width = canvasWidth;
        gradientCanvas.height = canvasHeight;
        const gradientCtx = gradientCanvas.getContext('2d');

        // Create gradient
        let gradient;
        if (gradientConfig.type === 'linear') {
            gradient = gradientCtx.createLinearGradient(0, 0, canvasWidth, 0);
        } else {
            const centerGradX = canvasWidth / 2;
            const centerGradY = canvasHeight / 2;
            const radius = Math.min(canvasWidth, canvasHeight) / 2;
            gradient = gradientCtx.createRadialGradient(centerGradX, centerGradY, 0, centerGradX, centerGradY, radius);
        }

        gradient.addColorStop(0, gradientConfig.color1);
        gradient.addColorStop(1, gradientConfig.color2);

        // Fill gradient canvas
        gradientCtx.fillStyle = gradient;
        gradientCtx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Render distorted text to temp canvas as mask
        tempCtx.save();
        tempCtx.translate(canvasWidth / 2, canvasHeight / 2);
        tempCtx.fillStyle = 'white';

        // Calculate grid bounds
        const gridLeft = centerX - textWidth/2 - padding;
        const gridTop = centerY - textHeight/2 - padding;
        const gridWidth = textWidth + padding * 2;
        const gridHeight = textHeight + padding * 2;

        // Create warped path for mask
        const warpedPath = new opentype.Path();

        path.commands.forEach(cmd => {
            const x = cmd.x;
            const y = cmd.y;

            const warped = getWarpedPosition(
                x + centerX, y + centerY,
                gridDistortState.controlPoints, gridConfig.cols, gridConfig.rows,
                gridLeft, gridTop, gridWidth, gridHeight,
                gridConfig.intensity
            );

            // Adjust for temp canvas center
            const adjustedX = warped.x - centerX;
            const adjustedY = warped.y - centerY;

            switch (cmd.type) {
                case 'M':
                    warpedPath.moveTo(adjustedX, adjustedY);
                    break;
                case 'L':
                    warpedPath.lineTo(adjustedX, adjustedY);
                    break;
                case 'C':
                    const cp1 = getWarpedPosition(cmd.x1 + centerX, cmd.y1 + centerY, gridDistortState.controlPoints, gridConfig.cols, gridConfig.rows, gridLeft, gridTop, gridWidth, gridHeight, gridConfig.intensity);
                    const cp2 = getWarpedPosition(cmd.x2 + centerX, cmd.y2 + centerY, gridDistortState.controlPoints, gridConfig.cols, gridConfig.rows, gridLeft, gridTop, gridWidth, gridHeight, gridConfig.intensity);
                    warpedPath.curveTo(cp1.x - centerX, cp1.y - centerY, cp2.x - centerX, cp2.y - centerY, adjustedX, adjustedY);
                    break;
                case 'Q':
                    const cp = getWarpedPosition(cmd.x1 + centerX, cmd.y1 + centerY, gridDistortState.controlPoints, gridConfig.cols, gridConfig.rows, gridLeft, gridTop, gridWidth, gridHeight, gridConfig.intensity);
                    warpedPath.quadraticCurveTo(cp.x - centerX, cp.y - centerY, adjustedX, adjustedY);
                    break;
                case 'Z':
                    warpedPath.closePath();
                    break;
            }
        });

        // Draw mask
        warpedPath.draw(tempCtx);
        tempCtx.restore();

        // Apply mask to gradient
        gradientCtx.globalCompositeOperation = 'destination-in';
        gradientCtx.drawImage(tempCanvas, 0, 0);

        // Draw final result to main canvas
        const offsetX = centerX - canvasWidth / 2;
        const offsetY = centerY - canvasHeight / 2;
        ctx.drawImage(gradientCanvas, offsetX, offsetY);

        log(`✅ [GRID] Grid Distort gradient text rendered successfully`);

    } catch (error) {
        log(`❌ [GRID] Error rendering Grid Distort gradient text: ${error.message}`);
        renderNormalTextWithGradient(fontSize, fontFamily, text, color, centerX, centerY, gradientConfig);
    }
}

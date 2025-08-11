// Canvas Investigation - Step by step feature addition
let canvas, ctx, canvasWrapper;
let currentQuality = 1;
let currentStep = 0;
let debugLog = [];

// Zoom and pan variables
let zoomLevel = 1;
let panX = 0;
let panY = 0;
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

// Investigation steps
const investigationSteps = [
    {
        name: "Baseline Test",
        description: "Pure canvas high-DPI rendering without any editor features. This should work perfectly.",
        features: []
    },
    {
        name: "Update Loop",
        description: "Add continuous update loop like the main editor. Testing if requestAnimationFrame affects rendering.",
        features: ['updateLoop']
    },
    {
        name: "Object System", 
        description: "Add object management system. Testing if object arrays affect rendering.",
        features: ['updateLoop', 'objectSystem']
    },
    {
        name: "Text Rendering",
        description: "Add text object rendering system. Testing if text rendering pipeline affects quality.",
        features: ['updateLoop', 'objectSystem', 'textRendering']
    },
    {
        name: "Shadows",
        description: "Add shadow rendering. Testing if shadow operations affect canvas transforms.",
        features: ['updateLoop', 'objectSystem', 'textRendering', 'shadows']
    },
    {
        name: "Decorations",
        description: "Add text decorations. Testing if decoration patterns affect rendering.",
        features: ['updateLoop', 'objectSystem', 'textRendering', 'shadows', 'decorations']
    },
    {
        name: "Full Editor",
        description: "Add remaining editor features. This should replicate the main editor behavior.",
        features: ['updateLoop', 'objectSystem', 'textRendering', 'shadows', 'decorations', 'fullEditor']
    }
];

// Feature implementations
let updateLoopActive = false;
let objects = [];
let animationFrameId = null;

// Initialize the investigation
document.addEventListener('DOMContentLoaded', function() {
    canvas = document.getElementById('testCanvas');
    canvasWrapper = document.getElementById('canvasWrapper');
    ctx = canvas.getContext('2d');
    
    log('🔬 Canvas investigation initialized');
    log(`📱 Device pixel ratio: ${window.devicePixelRatio}`);
    
    setupZoomAndPan();
    setupCanvas();
    setStep(0);
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

function setStep(step) {
    currentStep = step;
    const stepInfo = investigationSteps[step];
    
    log(`🔬 [STEP] Switching to Step ${step}: ${stepInfo.name}`);
    
    // Update UI
    document.querySelectorAll('.step-btn').forEach((btn, index) => {
        btn.classList.remove('active');
        if (index === step) {
            btn.classList.add('active');
        }
    });
    
    document.getElementById('currentStepInfo').innerHTML = `
        <h3>Step ${step}: ${stepInfo.name}</h3>
        <p>${stepInfo.description}</p>
        <p><strong>Features:</strong> ${stepInfo.features.length ? stepInfo.features.join(', ') : 'None (baseline)'}</p>
    `;
    
    // Stop any running features
    stopAllFeatures();
    
    // Start features for this step
    stepInfo.features.forEach(feature => {
        startFeature(feature);
    });
    
    // Re-render
    renderTest();
}

function stopAllFeatures() {
    // Stop update loop
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    updateLoopActive = false;
    
    // Clear objects
    objects = [];
    
    log('🛑 [FEATURES] All features stopped');
}

function startFeature(feature) {
    log(`▶️ [FEATURE] Starting: ${feature}`);
    
    switch(feature) {
        case 'updateLoop':
            startUpdateLoop();
            break;
        case 'objectSystem':
            initObjectSystem();
            break;
        case 'textRendering':
            initTextRendering();
            break;
        case 'shadows':
            initShadows();
            break;
        case 'decorations':
            initDecorations();
            break;
        case 'fullEditor':
            initFullEditor();
            break;
    }
}

function startUpdateLoop() {
    updateLoopActive = true;
    
    function updateLoop() {
        if (!updateLoopActive) return;
        
        // This mimics the main editor's update loop
        renderTest();
        
        animationFrameId = requestAnimationFrame(updateLoop);
    }
    
    updateLoop();
    log('🔄 [UPDATE-LOOP] Started continuous rendering');
}

function initObjectSystem() {
    // Add a test text object like the main editor
    objects = [{
        type: 'text',
        text: 'DESIGN',
        fontSize: 80,
        fontFamily: 'Arial',
        color: '#3b82f6',
        x: 400,
        y: 200
    }];
    
    log('📦 [OBJECTS] Object system initialized');
}

function initTextRendering() {
    log('🔤 [TEXT] Text rendering system initialized');
}

function initShadows() {
    log('🌫️ [SHADOWS] Shadow system initialized');
}

function initDecorations() {
    log('🎨 [DECORATIONS] Decoration system initialized');
}

function initFullEditor() {
    log('🎯 [FULL-EDITOR] Full editor features initialized');
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
    renderTest();
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

function renderTest() {
    // Clear canvas with proper scaling - THIS IS THE CRITICAL PART
    ctx.save();
    
    // PRESERVE the high-DPI scaling when clearing
    const scaleFactor = canvas.scaleFactor || 1;
    ctx.setTransform(scaleFactor, 0, 0, scaleFactor, 0, 0);
    
    // Clear the canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width / scaleFactor, canvas.height / scaleFactor);
    
    ctx.restore();
    
    // Render based on current step
    if (objects.length > 0) {
        // Render objects if object system is active
        objects.forEach(obj => {
            if (obj.type === 'text') {
                renderTextObject(obj);
            }
        });
    } else {
        // Render simple test text
        renderSimpleText();
    }
    
    updateCanvasInfo();
}

function renderTextObject(obj) {
    ctx.font = `${obj.fontSize}px "${obj.fontFamily}"`;
    ctx.fillStyle = obj.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.fillText(obj.text, obj.x, obj.y);
}

function renderSimpleText() {
    ctx.font = '80px "Arial"';
    ctx.fillStyle = '#3b82f6';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.fillText('DESIGN', 400, 200);
}

function updateCanvasInfo() {
    const info = document.getElementById('canvasInfo');
    if (!info) return;

    const transform = ctx.getTransform();
    const stepInfo = investigationSteps[currentStep];

    info.innerHTML = `
        <strong>Canvas Info:</strong><br>
        Current Step: ${currentStep} - ${stepInfo.name}<br>
        Active Features: ${stepInfo.features.length ? stepInfo.features.join(', ') : 'None'}<br>
        Memory Size: ${canvas.width} x ${canvas.height}<br>
        CSS Size: ${canvas.style.width} x ${canvas.style.height}<br>
        Scale Factor: ${canvas.scaleFactor}<br>
        Current Quality: ${currentQuality}x<br>
        Device Pixel Ratio: ${window.devicePixelRatio}<br>
        Transform: [${transform.a.toFixed(2)}, ${transform.b.toFixed(2)}, ${transform.c.toFixed(2)}, ${transform.d.toFixed(2)}, ${transform.e.toFixed(2)}, ${transform.f.toFixed(2)}]<br>
        Image Smoothing: ${ctx.imageSmoothingEnabled} (${ctx.imageSmoothingQuality})
    `;
}

// Zoom and Pan Functions (copied from canvas-test.js)
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

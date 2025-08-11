// performance-optimizer.js

// ⏱️ Utility to profile performance of blocks
export function performanceProfiler(label, fn) {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  console.log(`⏱️ ${label} took ${(end - start).toFixed(2)}ms`);
  return result;
}

// 💤 Lazy load fonts only when needed
const loadedFonts = new Set();

export function loadFontIfNeeded(fontName, fontUrl) {
  if (loadedFonts.has(fontName)) return;

  const font = new FontFace(fontName, `url(${fontUrl})`);
  font.load()
    .then((loadedFont) => {
      document.fonts.add(loadedFont);
      loadedFonts.add(fontName);
      console.log(`✅ Lazy loaded font: ${fontName}`);
    })
    .catch((err) => {
      console.error(`❌ Failed to load font: ${fontName}`, err);
    });
}

// 🚫 Guarded initialization wrappers
export function createOnceInitializer() {
  const initializedFlags = new Map();

  return function once(key, initFn) {
    if (initializedFlags.get(key)) return;
    initializedFlags.set(key, true);
    initFn();
  };
}

// 🧠 Optional UI marker for debugging interactions
export function markInteraction(label) {
  console.time(label);
  requestAnimationFrame(() => {
    console.timeEnd(label);
  });
}

// 🧪 Dropdown control optimization
let fontDropdownBuilt = false;

export function populateFontDropdownOnce(buildFn) {
  if (fontDropdownBuilt) return;
  fontDropdownBuilt = true;
  performanceProfiler("Font Dropdown Build", buildFn);
}

// 🧼 Debounced save function to reduce DB load on drag
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// 💾 Debounced object state saver - prevents save flooding during drag
const objectStateSaveQueue = new Map();
export function debouncedSaveObjectState(objectId, newParams, saveFn) {
  // Clear any existing timer for this object
  if (objectStateSaveQueue.has(objectId)) {
    clearTimeout(objectStateSaveQueue.get(objectId));
  }

  // Set new timer to save after 300ms idle
  const timer = setTimeout(() => {
    console.log(`💾 [DEBOUNCED] Saving object state for ID: ${objectId}`);
    saveFn(objectId, newParams);
    objectStateSaveQueue.delete(objectId);
  }, 300);

  objectStateSaveQueue.set(objectId, timer);
}

// 💾 Force save all pending object states (call on drop/blur)
export function flushPendingObjectSaves() {
  objectStateSaveQueue.forEach((timer, objectId) => {
    clearTimeout(timer);
    console.log(`💾 [FLUSH] Force saving object state for ID: ${objectId}`);
  });
  objectStateSaveQueue.clear();
}

// 🧮 Enhanced bounding box cache with text+style combo keys
const boundingBoxCache = new Map();

export function getCachedBoundingBox(key, computeFn) {
  if (boundingBoxCache.has(key)) {
    return boundingBoxCache.get(key);
  }
  const result = computeFn();
  boundingBoxCache.set(key, result);
  return result;
}

// 📦 Smart bounding box cache for text objects
export function getCachedTextBounds(textObj, computeFn) {
  // Create cache key from text content and styling properties that affect dimensions
  const cacheKey = `${textObj.text}_${textObj.fontSize}_${textObj.fontFamily}_${textObj.textBoxWidth}_${textObj.textAlign}_${textObj.scale || 1}`;

  if (boundingBoxCache.has(cacheKey)) {
    const cached = boundingBoxCache.get(cacheKey);
    console.log(`📦 [CACHE HIT] Using cached bounds for: ${textObj.text?.substring(0, 20)}...`);

    // Update position but keep cached dimensions
    return {
      ...cached,
      x: textObj.x - cached.width / 2,
      y: textObj.y - cached.height / 2,
      cx: textObj.x,
      cy: textObj.y
    };
  }

  // Cache miss - compute new bounds
  console.log(`📦 [CACHE MISS] Computing new bounds for: ${textObj.text?.substring(0, 20)}...`);
  const result = computeFn();
  boundingBoxCache.set(cacheKey, result);
  return result;
}

// 📦 Clear bounding box cache when text properties change
export function clearTextBoundsCache(textObj) {
  const cacheKey = `${textObj.text}_${textObj.fontSize}_${textObj.fontFamily}_${textObj.textBoxWidth}_${textObj.textAlign}_${textObj.scale || 1}`;
  boundingBoxCache.delete(cacheKey);
  console.log(`📦 [CACHE CLEAR] Cleared bounds cache for: ${textObj.text?.substring(0, 20)}...`);
}

// 🎯 Enhanced event listener binder with specific dataset flags
export function bindOnce(el, type, handler, flagName = 'listenerAttached') {
  const datasetKey = `${flagName}`;
  if (el.dataset[datasetKey] === "true") {
    console.log(`🎯 [SKIP] Event listener already bound for ${el.id || el.className}`);
    return;
  }
  el.addEventListener(type, handler);
  el.dataset[datasetKey] = "true";
  console.log(`🎯 [BIND] Event listener bound for ${el.id || el.className}`);
}

// 🎭 Specific image effect button binder
export function bindImageEffectButtons() {
  const buttons = [
    { id: 'changeImageEffectBtn', handler: window.applyRandomImageEffect, flag: 'effectBound' },
    { id: 'changeImageColorsBtn', handler: window.changeImageColors, flag: 'colorsBound' },
    { id: 'resetImageEffectBtn', handler: window.resetImageEffects, flag: 'resetBound' }
  ];

  buttons.forEach(({ id, handler, flag }) => {
    const button = document.getElementById(id);
    if (button && !button.dataset[flag]) {
      button.addEventListener('click', handler);
      button.dataset[flag] = 'true';
      console.log(`🎭 [BIND] ${id} event handler bound`);
    }
  });
}

// 🎯 Enhanced observer setup with global flag
let observersSetup = false;
export function setupObserversOnce(setupFn) {
  if (observersSetup) {
    console.log('🎯 [SKIP] Observers already setup globally');
    return;
  }
  observersSetup = true;
  console.log('🎯 [SETUP] Setting up observers for first time');
  setupFn();
}

// 🎯 Reset observer flag (for testing/debugging)
export function resetObserverFlag() {
  observersSetup = false;
  console.log('🎯 [RESET] Observer setup flag reset');
}

// 💾 Persistent parameter manager with debouncing
class PersistentParameterManager {
  constructor() {
    this.pendingSaves = new Map();
    this.loadedObjects = new Set();
  }

  // Load parameters only once per object
  loadParametersOnce(objectId, loadFn) {
    if (this.loadedObjects.has(objectId)) {
      console.log(`💾 [SKIP] Parameters already loaded for object: ${objectId}`);
      return;
    }

    console.log(`💾 [LOAD] Loading persistent parameters for object: ${objectId}`);
    this.loadedObjects.add(objectId);
    loadFn(objectId);
  }

  // Save parameters with debouncing
  saveParametersDebounced(objectId, params, saveFn) {
    // Clear existing timer
    if (this.pendingSaves.has(objectId)) {
      clearTimeout(this.pendingSaves.get(objectId));
    }

    // Set new timer
    const timer = setTimeout(() => {
      console.log(`💾 [SAVE] Saving persistent parameters for object: ${objectId}`);
      saveFn(objectId, params);
      this.pendingSaves.delete(objectId);
    }, 300);

    this.pendingSaves.set(objectId, timer);
  }

  // Force save all pending (call on drop/blur)
  flushAll() {
    this.pendingSaves.forEach((timer, objectId) => {
      clearTimeout(timer);
      console.log(`💾 [FLUSH] Force saving parameters for object: ${objectId}`);
    });
    this.pendingSaves.clear();
  }

  // Mark object as needing reload (when text/properties change)
  markForReload(objectId) {
    this.loadedObjects.delete(objectId);
    console.log(`💾 [MARK] Object ${objectId} marked for parameter reload`);
  }
}

export const persistentParams = new PersistentParameterManager();

// 🚀 Performance monitoring utilities
export function logPerformanceIssue(issue, details) {
  console.warn(`🚨 [PERFORMANCE] ${issue}:`, details);
}

export function trackRedundantCall(functionName, threshold = 5) {
  if (!window.performanceTracker) {
    window.performanceTracker = new Map();
  }

  const count = (window.performanceTracker.get(functionName) || 0) + 1;
  window.performanceTracker.set(functionName, count);

  if (count > threshold) {
    logPerformanceIssue(`Redundant calls to ${functionName}`, `Called ${count} times`);
  }
}

// 🎭 GHOST/PREVIEW LAYER SYSTEM FOR DRAG OPERATIONS
// Addresses the core performance issue: full high-quality rendering on every mouse movement

let ghostCanvas = null;
let ghostCtx = null;
let staticBackgroundCanvas = null;
let staticBackgroundCtx = null;
let isDragPreviewMode = false;
let draggedObjectSnapshot = null;
let originalObjectVisibility = null;
let lastGhostPosition = { x: 0, y: 0 };

export function initializeDragPreview(mainCanvas) {
    if (!ghostCanvas) {
        // Create ghost canvas for lightweight drag preview
        ghostCanvas = document.createElement('canvas');
        ghostCanvas.width = mainCanvas.width;
        ghostCanvas.height = mainCanvas.height;
        ghostCanvas.style.position = 'absolute';
        ghostCanvas.style.top = mainCanvas.offsetTop + 'px';
        ghostCanvas.style.left = mainCanvas.offsetLeft + 'px';
        ghostCanvas.style.pointerEvents = 'none';
        ghostCanvas.style.zIndex = '1000';
        ghostCanvas.style.opacity = '0.8'; // Slightly transparent for preview effect
        ghostCtx = ghostCanvas.getContext('2d');

        // Create static background canvas
        staticBackgroundCanvas = document.createElement('canvas');
        staticBackgroundCanvas.width = mainCanvas.width;
        staticBackgroundCanvas.height = mainCanvas.height;
        staticBackgroundCtx = staticBackgroundCanvas.getContext('2d');

        // Insert ghost canvas after main canvas
        mainCanvas.parentNode.insertBefore(ghostCanvas, mainCanvas.nextSibling);

        console.log('🎭 [GHOST] Drag preview system initialized');
    }
}

export function startDragPreview(draggedObject, mainCanvas, drawFunction) {
    if (!ghostCanvas) {
        initializeDragPreview(mainCanvas);
    }

    isDragPreviewMode = true;

    // 1. Capture high-quality snapshot of the dragged object
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = mainCanvas.width;
    tempCanvas.height = mainCanvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    // Draw only the dragged object to temp canvas
    drawFunction(draggedObject, tempCtx);
    draggedObjectSnapshot = tempCanvas;

    // 2. Hide the original object temporarily
    originalObjectVisibility = draggedObject.isVisible;
    draggedObject.isVisible = false;

    // 3. Render static background (all other objects) once
    staticBackgroundCtx.clearRect(0, 0, staticBackgroundCanvas.width, staticBackgroundCanvas.height);
    // This should be called by the main app to draw all non-dragged objects

    // 4. Show ghost canvas
    ghostCanvas.style.display = 'block';

    console.log('🎭 [GHOST] Started drag preview mode for object:', draggedObject.id);
}

export function updateDragPreview(newX, newY, scale = 1, panX = 0, panY = 0) {
    if (!isDragPreviewMode || !ghostCanvas || !draggedObjectSnapshot) return;

    // Clear previous ghost position
    ghostCtx.clearRect(0, 0, ghostCanvas.width, ghostCanvas.height);

    // Draw static background
    ghostCtx.drawImage(staticBackgroundCanvas, 0, 0);

    // Calculate screen coordinates
    const screenX = (newX + panX) * scale;
    const screenY = (newY + panY) * scale;

    // Draw dragged object snapshot at new position
    ghostCtx.save();
    ghostCtx.scale(scale, scale);
    ghostCtx.translate(panX, panY);
    ghostCtx.drawImage(draggedObjectSnapshot, 0, 0);
    ghostCtx.restore();

    lastGhostPosition = { x: newX, y: newY };

    // No console logging here to avoid spam during drag
}

export function endDragPreview(draggedObject, finalX, finalY) {
    if (!isDragPreviewMode) return;

    isDragPreviewMode = false;

    // 1. Hide ghost canvas
    if (ghostCanvas) {
        ghostCanvas.style.display = 'none';
    }

    // 2. Restore original object visibility
    if (draggedObject && originalObjectVisibility !== null) {
        draggedObject.isVisible = originalObjectVisibility;
        originalObjectVisibility = null;
    }

    // 3. Update final position
    if (draggedObject) {
        draggedObject.x = finalX;
        draggedObject.y = finalY;
    }

    // 4. Clean up
    draggedObjectSnapshot = null;

    console.log('🎭 [GHOST] Ended drag preview mode, final position:', { x: finalX, y: finalY });
}

export function renderStaticBackground(drawAllObjectsFunction, excludeObjectId) {
    if (!staticBackgroundCanvas) return;

    staticBackgroundCtx.clearRect(0, 0, staticBackgroundCanvas.width, staticBackgroundCanvas.height);
    drawAllObjectsFunction(staticBackgroundCtx, excludeObjectId);

    console.log('🎭 [GHOST] Rendered static background excluding object:', excludeObjectId);
}

export function isDragPreviewActive() {
    return isDragPreviewMode;
}

// 📏 OBJECT PROPERTY CACHING SYSTEM
// Addresses repetitive font lookups and text metric calculations

const objectPropertyCache = new Map();

export function cacheObjectProperties(obj) {
    if (!obj || !obj.id) return;

    const cacheKey = obj.id;
    const cached = {
        // Font properties
        fontVariant: null,
        fontFamily: obj.fontFamily,
        fontSize: obj.fontSize,
        fontWeight: obj.fontWeight || 'normal',
        fontStyle: obj.fontStyle || 'normal',

        // Text metrics
        textWidth: null,
        textHeight: null,
        textMetrics: null,

        // Calculation flags
        fontResolved: false,
        metricsCalculated: false,

        // Cache timestamp
        cachedAt: Date.now(),

        // Content hash for invalidation
        contentHash: generateContentHash(obj)
    };

    objectPropertyCache.set(cacheKey, cached);
    console.log('📏 [CACHE] Cached properties for object:', obj.id);
}

export function getCachedFontVariant(obj) {
    const cached = objectPropertyCache.get(obj.id);
    if (!cached || !cached.fontResolved || cached.contentHash !== generateContentHash(obj)) {
        return null; // Cache miss or invalidated
    }

    return cached.fontVariant;
}

export function setCachedFontVariant(obj, fontVariant) {
    let cached = objectPropertyCache.get(obj.id);
    if (!cached) {
        cacheObjectProperties(obj);
        cached = objectPropertyCache.get(obj.id);
    }

    cached.fontVariant = fontVariant;
    cached.fontResolved = true;
    cached.contentHash = generateContentHash(obj);

    console.log('📏 [CACHE] Set font variant for object:', obj.id, 'variant:', fontVariant);
}

export function getCachedTextMetrics(obj) {
    const cached = objectPropertyCache.get(obj.id);
    if (!cached || !cached.metricsCalculated || cached.contentHash !== generateContentHash(obj)) {
        return null; // Cache miss or invalidated
    }

    return {
        width: cached.textWidth,
        height: cached.textHeight,
        metrics: cached.textMetrics
    };
}

export function setCachedTextMetrics(obj, width, height, metrics) {
    let cached = objectPropertyCache.get(obj.id);
    if (!cached) {
        cacheObjectProperties(obj);
        cached = objectPropertyCache.get(obj.id);
    }

    cached.textWidth = width;
    cached.textHeight = height;
    cached.textMetrics = metrics;
    cached.metricsCalculated = true;
    cached.contentHash = generateContentHash(obj);

    console.log('📏 [CACHE] Set text metrics for object:', obj.id, 'size:', { width, height });
}

export function invalidateObjectCache(obj) {
    if (obj && obj.id && objectPropertyCache.has(obj.id)) {
        objectPropertyCache.delete(obj.id);
        console.log('📏 [CACHE] Invalidated cache for object:', obj.id);
    }
}

export function clearAllObjectCaches() {
    const count = objectPropertyCache.size;
    objectPropertyCache.clear();
    console.log('📏 [CACHE] Cleared all object property caches, count:', count);
}

function generateContentHash(obj) {
    // Generate a hash based on properties that affect rendering
    const hashSource = `${obj.text || ''}_${obj.fontFamily || ''}_${obj.fontSize || ''}_${obj.fontWeight || ''}_${obj.fontStyle || ''}_${obj.textBoxWidth || ''}_${obj.scale || 1}`;
    return hashSource;
}

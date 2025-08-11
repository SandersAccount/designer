// performance-optimizer.js
// 🚀 Comprehensive Performance Optimization Utilities

console.log('🚀 Performance Optimizer Module Loading...');

// ⏱️ Performance Profiler - Measure execution time of functions
export function performanceProfiler(label, fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    const duration = (end - start).toFixed(2);
    
    // Color-code based on duration
    const color = duration > 100 ? '🔴' : duration > 50 ? '🟡' : '🟢';
    console.log(`⏱️ ${color} ${label} took ${duration}ms`);
    
    return result;
}

// 🚫 Initialization Guard System - Prevent redundant initializations
const initializationFlags = new Map();

export function createOnceInitializer() {
    return function once(key, initFn) {
        if (initializationFlags.get(key)) {
            console.log(`🚫 Skipping already initialized: ${key}`);
            return;
        }
        
        console.log(`🚀 Initializing: ${key}`);
        initializationFlags.set(key, true);
        
        return performanceProfiler(`Init: ${key}`, initFn);
    };
}

// 💤 Lazy Font Loading System
const loadedFonts = new Set();
const fontLoadPromises = new Map();

export function loadFontIfNeeded(fontName, fontUrl) {
    // Return immediately if already loaded
    if (loadedFonts.has(fontName)) {
        return Promise.resolve();
    }
    
    // Return existing promise if already loading
    if (fontLoadPromises.has(fontName)) {
        return fontLoadPromises.get(fontName);
    }
    
    console.log(`💤 Lazy loading font: ${fontName}`);
    
    const fontPromise = new Promise((resolve, reject) => {
        const font = new FontFace(fontName, `url(${fontUrl})`);
        font.load()
            .then((loadedFont) => {
                document.fonts.add(loadedFont);
                loadedFonts.add(fontName);
                console.log(`✅ Font loaded: ${fontName}`);
                resolve(loadedFont);
            })
            .catch((err) => {
                console.error(`❌ Failed to load font: ${fontName}`, err);
                reject(err);
            })
            .finally(() => {
                fontLoadPromises.delete(fontName);
            });
    });
    
    fontLoadPromises.set(fontName, fontPromise);
    return fontPromise;
}

// 🧠 Smart Font Dropdown - Only build once
let fontDropdownBuilt = false;
let fontDropdownCache = null;

export function buildFontDropdownOnce(buildFn) {
    if (fontDropdownBuilt && fontDropdownCache) {
        console.log('🧠 Using cached font dropdown');
        return fontDropdownCache;
    }
    
    console.log('🧠 Building font dropdown for first time');
    fontDropdownBuilt = true;
    fontDropdownCache = performanceProfiler('Font Dropdown Build', buildFn);
    return fontDropdownCache;
}

// 🎯 Interaction Performance Monitoring
export function markInteraction(label) {
    const startTime = performance.now();
    console.time(`🎯 ${label}`);
    
    return function endInteraction() {
        console.timeEnd(`🎯 ${label}`);
        const duration = performance.now() - startTime;
        
        if (duration > 100) {
            console.warn(`⚠️ Slow interaction detected: ${label} took ${duration.toFixed(2)}ms`);
        }
    };
}

// 🔄 Throttle/Debounce Utilities
export function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

export function debounce(func, delay) {
    let timeoutId;
    return function() {
        const args = arguments;
        const context = this;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(context, args), delay);
    };
}

// 📊 Performance Metrics Collector
class PerformanceMetrics {
    constructor() {
        this.metrics = {
            renderTimes: [],
            fontLoads: 0,
            interactions: 0,
            slowOperations: []
        };
    }
    
    recordRenderTime(time) {
        this.metrics.renderTimes.push(time);
        if (this.metrics.renderTimes.length > 100) {
            this.metrics.renderTimes.shift(); // Keep only last 100
        }
    }
    
    recordFontLoad() {
        this.metrics.fontLoads++;
    }
    
    recordInteraction() {
        this.metrics.interactions++;
    }
    
    recordSlowOperation(operation, time) {
        this.metrics.slowOperations.push({ operation, time, timestamp: Date.now() });
        if (this.metrics.slowOperations.length > 50) {
            this.metrics.slowOperations.shift();
        }
    }
    
    getAverageRenderTime() {
        if (this.metrics.renderTimes.length === 0) return 0;
        const sum = this.metrics.renderTimes.reduce((a, b) => a + b, 0);
        return sum / this.metrics.renderTimes.length;
    }
    
    getSummary() {
        return {
            avgRenderTime: this.getAverageRenderTime().toFixed(2),
            totalFontLoads: this.metrics.fontLoads,
            totalInteractions: this.metrics.interactions,
            recentSlowOps: this.metrics.slowOperations.slice(-10)
        };
    }
}

export const performanceMetrics = new PerformanceMetrics();

// 🎛️ Performance Control Panel Integration
export function updatePerformanceDisplay() {
    const summary = performanceMetrics.getSummary();
    console.log('📊 Performance Summary:', summary);
    
    // Update performance panel if it exists
    const perfPanel = document.getElementById('performance-panel');
    if (perfPanel) {
        const existingStats = perfPanel.querySelector('.perf-stats');
        if (existingStats) {
            existingStats.innerHTML = `
                <div style="font-size: 10px; margin-top: 10px; border-top: 1px solid #444; padding-top: 5px;">
                    <div>Avg Render: ${summary.avgRenderTime}ms</div>
                    <div>Font Loads: ${summary.totalFontLoads}</div>
                    <div>Interactions: ${summary.totalInteractions}</div>
                </div>
            `;
        }
    }
}

// Initialize global performance monitoring
window.performanceOptimizer = {
    performanceProfiler,
    createOnceInitializer,
    loadFontIfNeeded,
    buildFontDropdownOnce,
    markInteraction,
    throttle,
    debounce,
    performanceMetrics,
    updatePerformanceDisplay
};

console.log('✅ Performance Optimizer Module Loaded');

// Advanced Text Mode Implementation - Building on the modular TextMode architecture
import TextRenderer from './modules/TextRenderer.js';
import TextEffects from './modules/TextEffects.js';
import TextEventHandlers from './modules/TextEventHandlers.js';
import TextUIControls from './modules/TextUIControls.js';

class AdvancedTextMode {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.texts = [];
        this.layers = []; // New layer management
        this.selectedText = null;
        this.isDragging = false;
        this.lastX = 0;
        this.lastY = 0;
        this.textStartX = 0;
        this.textStartY = 0;
        this.isColorPicking = false;
        this.colorPickCallback = null;
        this.onTextSelected = null;
        this.onTextDeselected = null;
        this.originalImageData = null;
        this.backgroundImage = null;
        this.imageScale = 1;
        this.imageX = 0;
        this.imageY = 0;
        this.transformHandles = []; // Store handle positions for interaction
        
        // Advanced properties
        this.gradientCache = new Map(); // Cache for gradient objects
        this.fontLibrary = []; // Store available fonts
        this.history = []; // For undo/redo functionality
        this.historyIndex = -1;
        this.maxHistorySteps = 20;
        
        // Initialize without redundant object creation
        // The actual instances will be created in the initialize method
        this.renderer = null;
        this.effects = null;
        this.eventHandlers = null;
        this.uiControls = null;
        
        // Initialize components
        this.initialize();
        
        console.log('AdvancedTextMode constructed');
    }
    
    initialize() {
        console.log('Initializing AdvancedTextMode');
        
        // Create UI controls handler (if not already created)
        if (!this.uiControls) {
            this.uiControls = new TextUIControls(this);
            console.log('UI Controls initialized');
        }
        
        // Create event handlers (if not already created)
        if (!this.eventHandlers) {
            this.eventHandlers = new TextEventHandlers(this);
            console.log('Event Handlers initialized');
        }
        
        // Create renderer (if not already created)
        if (!this.renderer) {
            this.renderer = new TextRenderer(this);
            console.log('Renderer initialized');
        }
        
        // Create effects handler (if not already created)
        if (!this.effects) {
            this.effects = new TextEffects(this);
            console.log('Effects initialized');
        }
        
        // Add event listeners
        if (this.eventHandlers) {
            this.eventHandlers.addEventListeners();
            console.log('Event listeners added');
        }
        
        // Initialize texts array if not exists
        if (!this.texts) {
            this.texts = [];
        }
        
        // Ensure tools panel is visible in text mode
        const toolsPanel = document.querySelector('.tools-panel');
        if (toolsPanel) {
            toolsPanel.style.display = 'block';
            console.log('Tools panel shown in initialize');
        }
        
        // Make sure the text controls are visible when initialized
        if (this.uiControls) {
            console.log('Updating UI controls');
            this.uiControls.updateTextControlsVisibility();
            console.log('Text controls visibility updated');
        }
        
        // Force a redraw
        this.renderer.redrawAll();
        
        console.log('AdvancedTextMode fully initialized');
        return this;
    }
    
    // Load image from localStorage if available
    loadImageFromLocalStorage() {
        const imageUrl = localStorage.getItem('editorImageUrl');
        if (imageUrl) {
            this.loadImage(imageUrl);
            // Clear localStorage after loading to avoid reloading on refresh
            localStorage.removeItem('editorImageUrl');
        }
    }
    
    // Load an image from URL
    loadImage(url) {
        const img = new Image();
        img.crossOrigin = 'Anonymous'; // Handle CORS issues
        img.onload = () => {
            this.backgroundImage = img;
            
            // Calculate initial scale to fit the image within the canvas
            const scaleX = this.canvas.width / img.width;
            const scaleY = this.canvas.height / img.height;
            this.imageScale = Math.min(scaleX, scaleY) * 0.8; // 80% of the canvas size
            
            // Center the image
            this.imageX = (this.canvas.width - img.width * this.imageScale) / 2;
            this.imageY = (this.canvas.height - img.height * this.imageScale) / 2;
            
            // Trigger a redraw
            this.renderer.redrawAll();
        };
        
        img.onerror = (error) => {
            console.error('Error loading image:', error);
        };
        
        img.src = url;
    }
    
    // Load font library from Google Fonts API
    loadFontLibrary() {
        // Categories of fonts to load
        const fontCategories = [
            { name: 'Display', fonts: ['Anton', 'Bebas Neue', 'Bungee', 'Fredoka One', 'Pacifico'] },
            { name: 'Serif', fonts: ['Merriweather', 'Playfair Display', 'Roboto Slab', 'Lora', 'PT Serif'] },
            { name: 'Sans Serif', fonts: ['Roboto', 'Open Sans', 'Montserrat', 'Poppins', 'Nunito'] },
            { name: 'Handwriting', fonts: ['Dancing Script', 'Caveat', 'Satisfy', 'Indie Flower', 'Sacramento'] },
            { name: 'Monospace', fonts: ['Roboto Mono', 'Source Code Pro', 'Space Mono', 'Fira Mono', 'Ubuntu Mono'] }
        ];
        
        // Structure font library
        this.fontLibrary = fontCategories;
        
        // Load fonts using Google Fonts API
        let googleFontsAPI = 'https://fonts.googleapis.com/css2?family=';
        const fontFamilies = fontCategories.flatMap(category => category.fonts);
        
        // Format font names for URL
        const formattedFonts = fontFamilies.map(font => font.replace(/ /g, '+')).join('&family=');
        googleFontsAPI += formattedFonts + '&display=swap';
        
        // Add link to document
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = googleFontsAPI;
        document.head.appendChild(link);
    }
    
    // Creates a new text element with extended properties
    addText(text = 'Your Text Here', x = this.canvas.width / 2, y = this.canvas.height / 2, font = '24px Arial', color = '#ffffff') {
        console.log('📝 ADDING NEW TEXT ELEMENT');
        console.log('📝 Text content:', text);
        console.log('📝 Position:', x, y);
        console.log('📝 Canvas size:', this.canvas.width, this.canvas.height);
        
        const newText = {
            id: Date.now(),
            text: text,
            x: x,
            y: y,
            font: font,
            color: color,
            angle: 0,
            isBold: false,
            isItalic: false,
            
            // Basic text styling
            letterSpacing: 0,
            bend: 0,
            strokeWidth: 0,
            strokeColor: '#000000',
            skewX: 0,
            skewY: 0,
            textAlign: 'center',
            
            // Advanced text styling
            fillType: 'solid', // solid, gradient, pattern
            gradient: null, // gradient configuration
            gradientType: 'linear', // linear, radial
            gradientStops: [
                { offset: 0, color: color },
                { offset: 1, color: '#ffffff' }
            ],
            
            // Shadow effects
            shadow: {
                enabled: false,
                color: 'rgba(0,0,0,0.5)',
                blur: 5,
                offsetX: 3,
                offsetY: 3
            },
            
            // Outline effects
            outline: {
                enabled: false,
                color: '#000000',
                width: 2
            },
            
            // 3D effects
            threeD: {
                enabled: false,
                depth: 5,
                color: '#000000'
            },
            
            // Text distort effects
            distort: {
                type: 'none', // none, wave, perspective, bulge
                intensity: 0,
                frequency: 1
            },
            
            // Text background
            background: {
                enabled: false,
                color: 'rgba(0,0,0,0.3)',
                padding: 10,
                rounded: true,
                radius: 5
            },
            
            // Layer properties
            layer: {
                name: 'Text',
                visible: true,
                locked: false,
                opacity: 1,
                blendMode: 'normal'
            }
        };
        
        console.log('📝 Created new text object:', newText);
        
        // Add to text array
        this.texts.push(newText);
        console.log('📝 Added text to array, array length is now:', this.texts.length);
        
        // Add to layers (at the top)
        this.layers.push({
            id: newText.id,
            type: 'text',
            name: newText.layer.name,
            visible: true,
            locked: false
        });
        console.log('📝 Added text to layers');
        
        // Set as selected
        this.selectedText = newText;
        console.log('📝 Set new text as selected:', this.selectedText.id);
        
        // Update UI
        if (this.uiControls) {
            console.log('📝 Updating UI controls');
            this.uiControls.updateTextInput(newText.text);
            this.uiControls.updateUIControls();
            this.uiControls.updateTextControlsVisibility();
        } else {
            console.error('UI Controls not initialized!');
        }
        
        // Make sure renderer is initialized
        if (this.renderer) {
            console.log('📝 Redrawing canvas with new text');
            this.renderer.redrawAll();
        } else {
            console.error('Renderer not initialized!');
        }
        
        // Save to history
        this.saveToHistory();
        
        // Trigger callbacks
        if (this.onTextSelected) {
            console.log('📝 Calling onTextSelected callback');
            this.onTextSelected(newText);
        }
        
        console.log('📝 Text addition completed successfully');
        return newText;
    }
    
    // Update text property with history tracking
    updateTextProperty(property, value) {
        if (!this.selectedText) return;
        
        // Store old value for history
        const oldValue = this.getNestedProperty(this.selectedText, property);
        
        // Update the property (handles nested properties like 'shadow.blur')
        this.setNestedProperty(this.selectedText, property, value);
        
        // Redraw canvas
        this.renderer.redrawAll();
        
        // Save state to history if value actually changed
        if (oldValue !== value) {
            this.saveToHistory();
        }
    }
    
    // Helper method to get nested property using dot notation
    getNestedProperty(obj, path) {
        const parts = path.split('.');
        let current = obj;
        
        for (let i = 0; i < parts.length; i++) {
            if (current === null || current === undefined) {
                return undefined;
            }
            current = current[parts[i]];
        }
        
        return current;
    }
    
    // Helper method to set nested property using dot notation
    setNestedProperty(obj, path, value) {
        const parts = path.split('.');
        let current = obj;
        
        for (let i = 0; i < parts.length - 1; i++) {
            if (current[parts[i]] === undefined) {
                current[parts[i]] = {};
            }
            current = current[parts[i]];
        }
        
        current[parts[parts.length - 1]] = value;
    }
    
    // History management
    saveToHistory() {
        // First remove any forward history if we're in the middle
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        
        // Add current state to history
        const state = {
            texts: JSON.parse(JSON.stringify(this.texts)),
            selectedTextId: this.selectedText ? this.selectedText.id : null
        };
        
        this.history.push(state);
        
        // If history is too long, remove oldest entries
        if (this.history.length > this.maxHistorySteps) {
            this.history.shift();
        } else {
            this.historyIndex = this.history.length - 1;
        }
    }
    
    // Undo the last action
    undo() {
        if (this.historyIndex <= 0) return;
        
        this.historyIndex--;
        this.restoreHistoryState(this.history[this.historyIndex]);
    }
    
    // Redo a previously undone action
    redo() {
        if (this.historyIndex >= this.history.length - 1) return;
        
        this.historyIndex++;
        this.restoreHistoryState(this.history[this.historyIndex]);
    }
    
    // Restore a specific history state
    restoreHistoryState(state) {
        this.texts = JSON.parse(JSON.stringify(state.texts));
        
        // Restore selection
        if (state.selectedTextId) {
            this.selectedText = this.texts.find(t => t.id === state.selectedTextId) || null;
        } else {
            this.selectedText = null;
        }
        
        // Update UI and redraw
        this.uiControls.updateUIControls();
        this.renderer.redrawAll();
    }
    
    // Layer management
    moveLayer(id, direction) {
        const index = this.layers.findIndex(layer => layer.id === id);
        if (index === -1) return;
        
        let newIndex;
        if (direction === 'up' && index < this.layers.length - 1) {
            newIndex = index + 1;
        } else if (direction === 'down' && index > 0) {
            newIndex = index - 1;
        } else {
            return;
        }
        
        // Swap layers
        [this.layers[index], this.layers[newIndex]] = [this.layers[newIndex], this.layers[index]];
        
        // Also reorder the texts array to match the layer order
        const textIndex = this.texts.findIndex(text => text.id === id);
        const otherTextId = this.layers[index].id;
        const otherTextIndex = this.texts.findIndex(text => text.id === otherTextId);
        
        [this.texts[textIndex], this.texts[otherTextIndex]] = [this.texts[otherTextIndex], this.texts[textIndex]];
        
        // Redraw and save history
        this.renderer.redrawAll();
        this.saveToHistory();
    }
    
    toggleLayerVisibility(id) {
        const layer = this.layers.find(layer => layer.id === id);
        if (!layer) return;
        
        layer.visible = !layer.visible;
        
        // Also update visibility in the text object
        const text = this.texts.find(t => t.id === id);
        if (text) {
            text.layer.visible = layer.visible;
        }
        
        // Redraw and save history
        this.renderer.redrawAll();
        this.saveToHistory();
    }
    
    renameLayer(id, name) {
        const layer = this.layers.find(layer => layer.id === id);
        if (!layer) return;
        
        layer.name = name;
        
        // Also update name in the text object
        const text = this.texts.find(t => t.id === id);
        if (text) {
            text.layer.name = name;
        }
        
        // Save history
        this.saveToHistory();
    }
    
    // Override redrawAll to use the renderer
    redrawAll() {
        console.log('🔄 AdvancedTextMode.redrawAll called');
        if (this.renderer) {
            this.renderer.redrawAll();
        } else {
            console.error('❌ Renderer not initialized in redrawAll');
            // Call parent class redrawAll as fallback
            super.redrawAll();
        }
    }
    
    // Create a gradient fill
    createGradient(text) {
        if (!text || text.fillType !== 'gradient') return text.color;
        
        // Use cached gradient if available
        const cacheKey = JSON.stringify({
            type: text.gradientType,
            stops: text.gradientStops
        });
        
        if (this.gradientCache.has(cacheKey)) {
            return this.gradientCache.get(cacheKey);
        }
        
        // Create a new gradient
        let gradient;
        const fontSize = parseInt(text.font);
        
        if (text.gradientType === 'linear') {
            gradient = this.ctx.createLinearGradient(-fontSize, 0, fontSize, 0);
        } else {
            gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, fontSize);
        }
        
        // Add color stops
        text.gradientStops.forEach(stop => {
            gradient.addColorStop(stop.offset, stop.color);
        });
        
        // Cache the gradient
        this.gradientCache.set(cacheKey, gradient);
        
        return gradient;
    }
    
    // Export the current canvas as an image
    exportImage(format = 'png') {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Draw the original canvas without selection outlines
        this.renderer.renderForExport(tempCtx);
        
        // Return data URL
        return tempCanvas.toDataURL('image/png');
    }
    
    // Activate text mode
    activate() {
        console.log('Activating text mode');
        
        // Add event listeners
        if (this.eventHandlers) {
            console.log('Adding event listeners on activation');
            this.eventHandlers.addEventListeners();
        } else {
            console.error('Event handlers not initialized in activate()');
        }
        
        // Redraw canvas
        if (this.renderer) {
            console.log('Redrawing canvas on activation');
            this.renderer.redrawAll();
        } else {
            console.error('Renderer not initialized in activate()');
        }
        
        console.log('Text mode activated');
    }
    
    // Deactivate text mode
    deactivate() {
        console.log('Deactivating text mode');
        
        // Deselect any selected text
        if (this.selectedText) {
            console.log('Deselecting text on deactivation');
            this.selectedText = null;
            
            // Trigger the onTextDeselected callback if available
            if (typeof this.onTextDeselected === 'function') {
                console.log('Calling onTextDeselected callback on deactivation');
                this.onTextDeselected();
            }
        }
        
        // Hide text controls
        if (this.uiControls) {
            console.log('Updating text controls visibility on deactivation');
            this.uiControls.updateTextControlsVisibility();
        } else {
            console.error('UI Controls not initialized in deactivate()');
        }
        
        // Remove event listeners temporarily
        if (this.eventHandlers) {
            console.log('Removing event listeners on deactivation');
            this.eventHandlers.removeEventListeners();
        } else {
            console.error('Event handlers not initialized in deactivate()');
        }
        
        console.log('Text mode deactivated');
    }
    
    // Clean up resources
    dispose() {
        this.eventHandlers.removeEventListeners();
        this.gradientCache.clear();
        this.texts = [];
        this.layers = [];
        this.history = [];
        this.historyIndex = -1;
        this.selectedText = null;
    }
    
    /**
     * Test utility method to simulate a text drag operation
     * @param {number} startX - Starting X position for mouse
     * @param {number} startY - Starting Y position for mouse  
     * @param {number} endX - Ending X position for mouse
     * @param {number} endY - Ending Y position for mouse
     * @param {number} steps - Number of intermediate steps
     */
    testDragText(startX, startY, endX, endY, steps = 10) {
        console.log('🧪 AdvancedTextMode: Calling test drag text function');
        if (this.eventHandlers) {
            return this.eventHandlers.testDragText(startX, startY, endX, endY, steps);
        } else {
            console.error('🧪 Cannot test: eventHandlers not initialized');
            return null;
        }
    }
}

export default AdvancedTextMode;

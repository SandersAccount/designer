/**
 * TextModeCompat.js
 * Compatibility layer for the modular TextMode implementation
 * This file ensures backward compatibility with code that expects the original TextMode class
 * while using the new modular implementation internally.
 */

import AdvancedTextMode from './AdvancedTextMode.js';

class TextModeCompat {
    constructor(canvas, ctx) {
        console.log('TextModeCompat: Creating new AdvancedTextMode instance');
        this.textMode = new AdvancedTextMode(canvas, ctx);
        
        // Bind all methods to maintain proper 'this' context
        this.initialize = this.initialize.bind(this);
        this.addText = this.addText.bind(this);
        this.selectText = this.selectText.bind(this);
        this.deselectText = this.deselectText.bind(this);
        this.updateTextProperty = this.updateTextProperty.bind(this);
        this.removeSelectedText = this.removeSelectedText.bind(this);
        this.drawTextSelectionHandles = this.drawTextSelectionHandles.bind(this);
        this.setTextSelectionCallbacks = this.setTextSelectionCallbacks.bind(this);
        
        console.log('TextModeCompat: Initialization complete');
    }
    
    // Getters and setters to forward properties to the internal textMode instance
    get texts() {
        return this.textMode.texts;
    }
    
    set texts(value) {
        this.textMode.texts = value;
    }
    
    get selectedText() {
        return this.textMode.selectedText;
    }
    
    set selectedText(value) {
        this.textMode.selectedText = value;
    }
    
    get canvas() {
        return this.textMode.canvas;
    }
    
    get ctx() {
        return this.textMode.ctx;
    }
    
    get onTextSelected() {
        return this.textMode.onTextSelected;
    }
    
    set onTextSelected(callback) {
        this.textMode.onTextSelected = callback;
    }
    
    get onTextDeselected() {
        return this.textMode.onTextDeselected;
    }
    
    set onTextDeselected(callback) {
        this.textMode.onTextDeselected = callback;
    }
    
    // Compatibility method for the old 'font' property
    // Old code expects font as a combined string "24px Arial"
    // New code uses separate fontSize and fontFamily properties
    updateTextProperty(property, value) {
        console.log(`TextModeCompat: Updating property "${property}" to "${value}"`);
        
        if (property === 'font' && typeof value === 'string') {
            // Parse font string (e.g., "24px Arial") into fontSize and fontFamily
            const parts = value.split(' ');
            const fontSize = parseInt(parts[0]);
            const fontFamily = parts.slice(1).join(' ');
            
            console.log(`TextModeCompat: Parsed font "${value}" to fontSize ${fontSize} and fontFamily "${fontFamily}"`);
            
            // Update the individual properties in the new implementation
            this.textMode.updateTextProperty('fontSize', fontSize);
            this.textMode.updateTextProperty('fontFamily', fontFamily);
        } else {
            // For all other properties, pass through directly
            this.textMode.updateTextProperty(property, value);
        }
    }
    
    // Forward all other methods to the textMode instance
    initialize() {
        console.log('TextModeCompat: Initializing');
        return this.textMode.initialize();
    }
    
    addText(text, options = {}) {
        console.log('TextModeCompat: Adding text', text, options);
        return this.textMode.addText(text, options);
    }
    
    selectText(text) {
        console.log('TextModeCompat: Selecting text', text);
        return this.textMode.selectText(text);
    }
    
    deselectText() {
        console.log('TextModeCompat: Deselecting text');
        return this.textMode.deselectText();
    }
    
    removeSelectedText() {
        console.log('TextModeCompat: Removing selected text');
        return this.textMode.removeSelectedText();
    }
    
    drawTextSelectionHandles() {
        console.log('TextModeCompat: Drawing text selection handles');
        return this.textMode.renderer.drawTextSelectionHandles();
    }
    
    setTextSelectionCallbacks(onSelect, onDeselect) {
        console.log('TextModeCompat: Setting text selection callbacks');
        this.textMode.onTextSelected = onSelect;
        this.textMode.onTextDeselected = onDeselect;
    }
}

export default TextModeCompat;

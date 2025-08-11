/**
 * Main application file for the text and paint editor
 */
import TextMode from './textMode.js';
import PaintMode from './paintMode.js';
import { showToast } from './components/Toast.js';

// Make showToast available globally
window.showToast = showToast;

class EditorApp {
    constructor() {
        // Get canvas and context
        this.canvas = document.getElementById('editor-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Initialize modes
        this.textMode = new TextMode(this.canvas, this.ctx);
        this.paintMode = new PaintMode(this.canvas, this.ctx);
        
        // Set current mode
        this.currentMode = 'text';
        document.body.setAttribute('data-mode', this.currentMode);
        
        // Initialize UI elements
        this.initUI();
        
        // Initialize the text mode
        this.textMode.initialize();
        
        // Set text selection callbacks
        this.textMode.setTextSelectionCallbacks(
            // Text selected callback
            (text) => this.onTextSelected(text),
            // Text deselected callback
            () => this.onTextDeselected()
        );
        
        // Make modes available globally for debugging
        window.textMode = this.textMode;
        window.paintMode = this.paintMode;
    }
    
    initUI() {
        // Get UI elements
        this.textModeBtn = document.getElementById('add-text-btn');
        this.paintModeBtn = document.getElementById('paint-btn');
        this.closePaintModeBtn = document.getElementById('closePaintMode');
        this.addTextBtn = document.getElementById('addTextBtn');
        this.uploadImageBtn = document.getElementById('upload-image-btn');
        this.downloadBtn = document.getElementById('download-btn');
        this.deleteImageBtn = document.getElementById('delete-image-btn');
        
        this.textControls = document.getElementById('textModeControls');
        this.paintControls = document.getElementById('paintModeControls');
        this.toolsPanel = document.querySelector('.tools-panel');
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Mode switching
        if (this.textModeBtn) {
            this.textModeBtn.addEventListener('click', () => {
                if (this.currentMode === 'paint') {
                    this.switchToTextMode();
                } else {
                    // Already in text mode, just add a new text
                    this.textMode.addText();
                }
            });
        }
        
        if (this.paintModeBtn) {
            this.paintModeBtn.addEventListener('click', () => {
                if (this.currentMode === 'text') {
                    this.switchToPaintMode();
                }
            });
        }
        
        if (this.closePaintModeBtn) {
            this.closePaintModeBtn.addEventListener('click', () => {
                if (this.currentMode === 'paint') {
                    this.switchToTextMode();
                }
            });
        }
        
        // Image upload
        if (this.uploadImageBtn) {
            this.uploadImageBtn.addEventListener('click', () => this.handleImageUpload());
        }
        
        // Image download
        if (this.downloadBtn) {
            this.downloadBtn.addEventListener('click', () => this.handleImageDownload());
        }
        
        // Image deletion
        if (this.deleteImageBtn) {
            this.deleteImageBtn.addEventListener('click', () => {
                this.textMode.backgroundImage = null;
                this.textMode.redrawAll();
                showToast('Image deleted');
            });
        }
        
        // Text input
        const textInput = document.getElementById('textInput');
        if (textInput) {
            textInput.addEventListener('input', () => {
                if (this.textMode.selectedText) {
                    this.textMode.updateTextProperty('text', textInput.value);
                }
            });
        }
        
        // Text controls
        this.setupTextControls();
        
        // Paint controls
        this.setupPaintControls();
    }
    
    setupTextControls() {
        // Font size
        const fontSizeInput = document.getElementById('fontSizeInput');
        if (fontSizeInput) {
            fontSizeInput.addEventListener('input', () => {
                if (this.textMode.selectedText) {
                    const fontSize = fontSizeInput.value;
                    const fontFamily = this.textMode.selectedText.font.split(' ').slice(1).join(' ');
                    this.textMode.updateTextProperty('font', `${fontSize}px ${fontFamily}`);
                    
                    // Update the displayed value
                    const fontSizeValue = fontSizeInput.nextElementSibling;
                    if (fontSizeValue) {
                        fontSizeValue.textContent = fontSize;
                    }
                }
            });
        }
        
        // Text color
        const textColorInput = document.getElementById('textColorInput');
        if (textColorInput) {
            textColorInput.addEventListener('input', () => {
                if (this.textMode.selectedText) {
                    this.textMode.updateTextProperty('color', textColorInput.value);
                }
            });
        }
        
        // Bold
        const boldBtn = document.getElementById('boldBtn');
        if (boldBtn) {
            boldBtn.addEventListener('click', () => {
                if (!this.textMode.selectedText) {
                    showToast('Please select text first', 'warning');
                    return;
                }
                
                const isBold = !this.textMode.selectedText.isBold;
                this.textMode.updateTextProperty('isBold', isBold);
                
                // Update button state
                boldBtn.classList.toggle('active', isBold);
            });
        }
        
        // Italic
        const italicBtn = document.getElementById('italicBtn');
        if (italicBtn) {
            italicBtn.addEventListener('click', () => {
                if (!this.textMode.selectedText) {
                    showToast('Please select text first', 'warning');
                    return;
                }
                
                const isItalic = !this.textMode.selectedText.isItalic;
                this.textMode.updateTextProperty('isItalic', isItalic);
                
                // Update button state
                italicBtn.classList.toggle('active', isItalic);
            });
        }
        
        // Text bend/warp
        const warpBendInput = document.getElementById('warpBendInput');
        if (warpBendInput) {
            warpBendInput.addEventListener('input', () => {
                if (this.textMode.selectedText) {
                    const bendValue = parseInt(warpBendInput.value);
                    this.textMode.updateTextProperty('bend', bendValue);
                    
                    // Update the displayed value
                    const bendValueDisplay = warpBendInput.nextElementSibling;
                    if (bendValueDisplay) {
                        bendValueDisplay.textContent = `${bendValue}%`;
                    }
                }
            });
        }
        
        // Letter spacing
        const letterSpacingInput = document.getElementById('letterSpacingInput');
        if (letterSpacingInput) {
            letterSpacingInput.addEventListener('input', () => {
                if (this.textMode.selectedText) {
                    const spacingValue = parseInt(letterSpacingInput.value);
                    this.textMode.updateTextProperty('letterSpacing', spacingValue);
                    
                    // Update the displayed value
                    const spacingValueDisplay = letterSpacingInput.nextElementSibling;
                    if (spacingValueDisplay) {
                        spacingValueDisplay.textContent = spacingValue;
                    }
                }
            });
        }
        
        // Skew X (Horizontal)
        const skewXInput = document.getElementById('skewXInput');
        if (skewXInput) {
            skewXInput.addEventListener('input', () => {
                if (this.textMode.selectedText) {
                    const skewXValue = parseInt(skewXInput.value);
                    this.textMode.updateTextProperty('skewX', skewXValue);
                    
                    // Update the displayed value
                    const skewXValueDisplay = skewXInput.nextElementSibling;
                    if (skewXValueDisplay) {
                        skewXValueDisplay.textContent = `${skewXValue}°`;
                    }
                }
            });
        }
        
        // Skew Y (Vertical)
        const skewYInput = document.getElementById('skewYInput');
        if (skewYInput) {
            skewYInput.addEventListener('input', () => {
                if (this.textMode.selectedText) {
                    const skewYValue = parseInt(skewYInput.value);
                    this.textMode.updateTextProperty('skewY', skewYValue);
                    
                    // Update the displayed value
                    const skewYValueDisplay = skewYInput.nextElementSibling;
                    if (skewYValueDisplay) {
                        skewYValueDisplay.textContent = `${skewYValue}°`;
                    }
                }
            });
        }
        
        // Stroke width
        const strokeWidthInput = document.getElementById('strokeWidthInput');
        if (strokeWidthInput) {
            strokeWidthInput.addEventListener('input', () => {
                if (this.textMode.selectedText) {
                    const strokeWidth = parseInt(strokeWidthInput.value);
                    this.textMode.updateTextProperty('strokeWidth', strokeWidth);
                    
                    // Update the displayed value
                    const strokeWidthValue = strokeWidthInput.nextElementSibling;
                    if (strokeWidthValue) {
                        strokeWidthValue.textContent = strokeWidth;
                    }
                }
            });
        }
        
        // Stroke color
        const strokeColorInput = document.getElementById('strokeColorInput');
        if (strokeColorInput) {
            strokeColorInput.addEventListener('input', () => {
                if (this.textMode.selectedText) {
                    this.textMode.updateTextProperty('strokeColor', strokeColorInput.value);
                }
            });
        }
        
        // Font selection
        this.setupFontSelection();
    }
    
    setupFontSelection() {
        const selectedFont = document.getElementById('selectedFont');
        const fontDropdown = document.getElementById('fontDropdown');
        
        if (selectedFont && fontDropdown) {
            selectedFont.addEventListener('click', () => {
                fontDropdown.style.display = fontDropdown.style.display === 'none' ? 'block' : 'none';
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!selectedFont.contains(e.target) && !fontDropdown.contains(e.target)) {
                    fontDropdown.style.display = 'none';
                }
            });
        }
        
        // Generate font list
        const fontList = document.getElementById('fontList');
        if (fontList) {
            const fonts = [
                'Arial',
                'Arial Black',
                'Comic Sans MS',
                'Courier New',
                'Georgia',
                'Impact',
                'Times New Roman',
                'Trebuchet MS',
                'Verdana'
            ];
            
            fonts.forEach(font => {
                const fontOption = document.createElement('div');
                fontOption.className = 'font-option';
                fontOption.style.fontFamily = font;
                fontOption.textContent = font;
                
                fontOption.addEventListener('click', () => {
                    if (this.textMode.selectedText) {
                        const fontSize = parseInt(this.textMode.selectedText.font);
                        this.textMode.updateTextProperty('font', `${fontSize}px ${font}`);
                        
                        // Update selected font display
                        selectedFont.textContent = font;
                        selectedFont.style.fontFamily = font;
                        
                        // Close dropdown
                        fontDropdown.style.display = 'none';
                    }
                });
                
                fontList.appendChild(fontOption);
            });
        }
        
        // Font search
        const fontSearchInput = document.getElementById('fontSearchInput');
        if (fontSearchInput && fontList) {
            fontSearchInput.addEventListener('input', () => {
                const searchTerm = fontSearchInput.value.toLowerCase();
                const fontOptions = fontList.querySelectorAll('.font-option');
                
                fontOptions.forEach(option => {
                    const fontName = option.textContent.toLowerCase();
                    if (fontName.includes(searchTerm)) {
                        option.style.display = 'block';
                    } else {
                        option.style.display = 'none';
                    }
                });
            });
        }
    }
    
    setupPaintControls() {
        // Brush size
        const brushSizeInput = document.getElementById('brushSizeInput');
        if (brushSizeInput) {
            brushSizeInput.addEventListener('input', () => {
                if (this.paintMode) {
                    const brushSize = parseInt(brushSizeInput.value);
                    this.paintMode.setBrushSize(brushSize);
                    
                    // Update the displayed value
                    const brushSizeValue = brushSizeInput.nextElementSibling;
                    if (brushSizeValue) {
                        brushSizeValue.textContent = brushSize;
                    }
                }
            });
        }
        
        // Brush color
        const brushColorInput = document.getElementById('brushColorInput');
        if (brushColorInput) {
            brushColorInput.addEventListener('input', () => {
                if (this.paintMode) {
                    this.paintMode.setBrushColor(brushColorInput.value);
                }
            });
        }
        
        // Clear paint layer
        const clearPaintBtn = document.getElementById('clearPaintBtn');
        if (clearPaintBtn) {
            clearPaintBtn.addEventListener('click', () => {
                if (this.paintMode) {
                    this.paintMode.clearPaintLayer();
                    showToast('Paint layer cleared');
                }
            });
        }
        
        // Color picker
        const colorPickerBtn = document.getElementById('colorPickerBtn');
        if (colorPickerBtn) {
            colorPickerBtn.addEventListener('click', () => {
                if (this.paintMode) {
                    const isPickingColor = this.paintMode.toggleColorPickMode();
                    
                    if (isPickingColor) {
                        showToast('Color picker activated. Click on the canvas to pick a color.');
                        colorPickerBtn.classList.add('active');
                    } else {
                        showToast('Color picker deactivated');
                        colorPickerBtn.classList.remove('active');
                    }
                }
            });
        }
    }
    
    switchToTextMode() {
        // Deactivate paint mode
        this.paintMode.deactivate();
        
        // Activate text mode
        this.textMode.initialize();
        
        // Update current mode
        this.currentMode = 'text';
        document.body.setAttribute('data-mode', this.currentMode);
        
        // Update UI
        if (this.textControls) {
            this.textControls.style.display = this.textMode.selectedText ? 'block' : 'none';
        }
        
        if (this.paintControls) {
            this.paintControls.style.display = 'none';
        }
        
        if (this.toolsPanel) {
            this.toolsPanel.style.display = this.textMode.selectedText ? 'block' : 'none';
        }
        
        // Hide the close paint mode button
        if (this.closePaintModeBtn) {
            this.closePaintModeBtn.style.display = 'none';
        }
        
        // Update sidebar active state
        const sidebarItems = document.querySelectorAll('.sidebar-item');
        sidebarItems.forEach(item => item.classList.remove('active'));
        if (this.textModeBtn) {
            this.textModeBtn.classList.add('active');
        }
        
        // Show toast
        showToast('Text mode activated');
    }
    
    switchToPaintMode() {
        // Deactivate text mode
        this.textMode.deactivate();
        
        // Activate paint mode
        this.paintMode.initialize();
        
        // Update current mode
        this.currentMode = 'paint';
        document.body.setAttribute('data-mode', this.currentMode);
        
        // Update UI
        if (this.textControls) {
            this.textControls.style.display = 'none';
        }
        
        if (this.paintControls) {
            this.paintControls.style.display = 'block';
        }
        
        if (this.toolsPanel) {
            this.toolsPanel.style.display = 'block';
        }
        
        // Show the close paint mode button
        if (this.closePaintModeBtn) {
            this.closePaintModeBtn.style.display = 'block';
        }
        
        // Update sidebar active state
        const sidebarItems = document.querySelectorAll('.sidebar-item');
        sidebarItems.forEach(item => item.classList.remove('active'));
        if (this.paintModeBtn) {
            this.paintModeBtn.classList.add('active');
        }
        
        // Show toast
        showToast('Paint mode activated');
    }
    
    onTextSelected(text) {
        // Show text controls when text is selected
        if (this.textControls && this.toolsPanel) {
            this.textControls.style.display = 'block';
            this.toolsPanel.style.display = 'block';
            
            // Update UI controls with the selected text properties
            this.updateUIControls(text);
        }
    }
    
    updateUIControls(text) {
        if (!text) return;
        
        // Update text input
        const textInput = document.getElementById('textInput');
        if (textInput) {
            textInput.value = text.text;
        }
        
        // Update font size
        const fontSizeInput = document.getElementById('fontSizeInput');
        if (fontSizeInput) {
            const fontSize = parseInt(text.font);
            fontSizeInput.value = fontSize;
            
            // Update the displayed value
            const fontSizeValue = fontSizeInput.nextElementSibling;
            if (fontSizeValue) {
                fontSizeValue.textContent = fontSize;
            }
        }
        
        // Update text color
        const textColorInput = document.getElementById('textColorInput');
        if (textColorInput) {
            textColorInput.value = text.color;
        }
        
        // Update bold button
        const boldBtn = document.getElementById('boldBtn');
        if (boldBtn) {
            boldBtn.classList.toggle('active', text.isBold);
        }
        
        // Update italic button
        const italicBtn = document.getElementById('italicBtn');
        if (italicBtn) {
            italicBtn.classList.toggle('active', text.isItalic);
        }
        
        // Update bend/warp input
        const warpBendInput = document.getElementById('warpBendInput');
        if (warpBendInput) {
            warpBendInput.value = text.bend;
            
            // Update the displayed value
            const bendValueDisplay = warpBendInput.nextElementSibling;
            if (bendValueDisplay) {
                bendValueDisplay.textContent = `${text.bend}%`;
            }
        }
        
        // Update letter spacing input
        const letterSpacingInput = document.getElementById('letterSpacingInput');
        if (letterSpacingInput) {
            letterSpacingInput.value = text.letterSpacing;
            
            // Update the displayed value
            const spacingValueDisplay = letterSpacingInput.nextElementSibling;
            if (spacingValueDisplay) {
                spacingValueDisplay.textContent = text.letterSpacing;
            }
        }
        
        // Update skew X input
        const skewXInput = document.getElementById('skewXInput');
        if (skewXInput) {
            skewXInput.value = text.skewX;
            
            // Update the displayed value
            const skewXValueDisplay = skewXInput.nextElementSibling;
            if (skewXValueDisplay) {
                skewXValueDisplay.textContent = `${text.skewX}°`;
            }
        }
        
        // Update skew Y input
        const skewYInput = document.getElementById('skewYInput');
        if (skewYInput) {
            skewYInput.value = text.skewY;
            
            // Update the displayed value
            const skewYValueDisplay = skewYInput.nextElementSibling;
            if (skewYValueDisplay) {
                skewYValueDisplay.textContent = `${text.skewY}°`;
            }
        }
        
        // Update stroke width input
        const strokeWidthInput = document.getElementById('strokeWidthInput');
        if (strokeWidthInput) {
            strokeWidthInput.value = text.strokeWidth;
            
            // Update the displayed value
            const strokeWidthValue = strokeWidthInput.nextElementSibling;
            if (strokeWidthValue) {
                strokeWidthValue.textContent = text.strokeWidth;
            }
        }
        
        // Update stroke color input
        const strokeColorInput = document.getElementById('strokeColorInput');
        if (strokeColorInput) {
            strokeColorInput.value = text.strokeColor;
        }
        
        // Update font selection
        const selectedFont = document.getElementById('selectedFont');
        if (selectedFont) {
            const fontFamily = text.font.split(' ').slice(1).join(' ');
            selectedFont.textContent = fontFamily;
            selectedFont.style.fontFamily = fontFamily;
        }
    }
    
    onTextDeselected() {
        // Hide text controls when no text is selected
        if (this.textControls && this.toolsPanel && this.currentMode === 'text') {
            this.textControls.style.display = 'none';
            this.toolsPanel.style.display = 'none';
        }
    }
    
    handleImageUpload() {
        // Create a file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
        
        // Trigger click on the file input
        fileInput.click();
        
        // Handle file selection
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    // Load the image into the text mode
                    this.textMode.loadImage(event.target.result);
                };
                reader.readAsDataURL(file);
            }
            
            // Remove the file input element
            document.body.removeChild(fileInput);
        });
    }
    
    handleImageDownload() {
        try {
            // Create a temporary canvas to capture the current state without selection outlines
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = this.canvas.width;
            tempCanvas.height = this.canvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            
            // Render the canvas for export
            this.textMode.renderForExport(tempCtx);
            
            // Create a download link
            const link = document.createElement('a');
            link.download = 'canvas-design.png';
            link.href = tempCanvas.toDataURL('image/png');
            link.click();
            
            showToast('Image downloaded successfully');
        } catch (error) {
            console.error('Error downloading image:', error);
            showToast('Error downloading image', 'error');
        }
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new EditorApp();
});

export default EditorApp;

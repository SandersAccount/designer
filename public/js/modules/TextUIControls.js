/**
 * TextUIControls Module
 * Handles UI control updates and interactions for the AdvancedTextMode
 */

class TextUIControls {
    constructor(textMode) {
        this.textMode = textMode;
        
        // Set up event listeners for all text effect controls
        this.setupEventListeners();
        console.log('TextUIControls initialized');
        
        // Ensure tools panel is visible
        this.updateTextControlsVisibility();
    }
    
    // Update all UI controls based on selected text
    updateUIControls() {
        const text = this.textMode.selectedText;
        if (!text) return;
        
        // Update text input
        this.updateTextInput(text.text);
        
        // Update font controls
        this.updateFontControls(text);
        
        // Update color controls
        this.updateColorControls(text);
        
        // Update transform controls
        this.updateTransformControls(text);
        
        // Update effect controls
        this.updateEffectControls(text);
        
        // Update layer controls
        this.updateLayerControls(text);
        
        // Update text controls visibility
        this.updateTextControlsVisibility();
    }
    
    // Update text input field
    updateTextInput(textContent) {
        const textInput = document.getElementById('textInput');
        if (textInput) {
            textInput.value = textContent;
        }
    }
    
    // Update font controls
    updateFontControls(text) {
        // Update font family dropdown
        const fontFamilySelect = document.getElementById('fontFamily');
        if (fontFamilySelect) {
            const fontFamily = text.font.split('px ')[1];
            for (let i = 0; i < fontFamilySelect.options.length; i++) {
                if (fontFamilySelect.options[i].value === fontFamily) {
                    fontFamilySelect.selectedIndex = i;
                    break;
                }
            }
        }
        
        // Update font size input
        const fontSizeInput = document.getElementById('fontSize');
        if (fontSizeInput) {
            const fontSize = parseInt(text.font);
            fontSizeInput.value = fontSize;
        }
        
        // Update bold button
        const boldBtn = document.getElementById('bold');
        if (boldBtn) {
            boldBtn.classList.toggle('active', text.isBold);
        }
        
        // Update italic button
        const italicBtn = document.getElementById('italic');
        if (italicBtn) {
            italicBtn.classList.toggle('active', text.isItalic);
        }
        
        // Update letter spacing input
        const letterSpacingInput = document.getElementById('letterSpacing');
        if (letterSpacingInput) {
            letterSpacingInput.value = text.letterSpacing;
        }
        
        // Update text alignment buttons
        const alignmentBtns = {
            left: document.getElementById('alignLeft'),
            center: document.getElementById('alignCenter'),
            right: document.getElementById('alignRight')
        };
        
        for (const [align, btn] of Object.entries(alignmentBtns)) {
            if (btn) {
                btn.classList.toggle('active', text.textAlign === align);
            }
        }
    }
    
    // Update color controls
    updateColorControls(text) {
        console.log('%c COLOR CONTROLS: Updating for text', 'background-color: #334; color: #afa;', text.text);
        
        const fillTypeSelect = document.getElementById('fillType');
        if (fillTypeSelect) {
            fillTypeSelect.value = text.fillType || 'solid';
            console.log('%c COLOR CONTROLS: Fill type set to:', 'background-color: #334; color: #afa;', fillTypeSelect.value);
        }
        
        // Update color picker based on fill type
        const colorPicker = document.getElementById('textColorPicker');
        const colorInput = document.getElementById('textColorInput');
        if (colorPicker) {
            // For solid fill, use the text color
            if (text.fillType === 'solid' || !text.fillType) {
                colorPicker.value = text.color || '#000000';
                if (colorInput) {
                    colorInput.value = colorPicker.value;
                }
            } 
            // For gradient, show the first stop color
            else if (text.fillType === 'gradient' && text.gradientStops && text.gradientStops.length > 0) {
                colorPicker.value = text.gradientStops[0].color;
                if (colorInput) {
                    colorInput.value = colorPicker.value;
                }
            }
            console.log('%c COLOR CONTROLS: Color picker set to:', 'background-color: #334; color: #afa;', colorPicker.value);
        }
        
        // Update gradient type control
        const gradientTypeSelect = document.getElementById('gradientType');
        if (gradientTypeSelect) {
            gradientTypeSelect.value = text.gradientType || 'linear';
            console.log('%c COLOR CONTROLS: Gradient type set to:', 'background-color: #334; color: #afa;', gradientTypeSelect.value);
        }
        
        // Update gradient stops UI
        this.updateGradientStopsUI(text);
        
        // Display appropriate controls based on fill type
        this.updateFillTypeControls(text.fillType || 'solid');
        
        console.log('%c COLOR CONTROLS: Updated', 'background-color: #334; color: #afa;');
    }
    
    // Update gradient stops UI
    updateGradientStopsUI(text) {
        console.log('%c GRADIENT UI: Updating for text', 'background-color: #334; color: #afa;', text && text.text);
        
        if (!text) {
            console.log('%c GRADIENT UI: Text is null', 'background-color: #334; color: #afa;');
        }
        
        const gradientStopsContainer = document.getElementById('gradientStopsContainer');
        if (!gradientStopsContainer) {
            console.error('%c GRADIENT UI: Container not found!', 'background-color: #334; color: #f99;');
            return;
        }
        
        // Clear existing stops
        gradientStopsContainer.innerHTML = '';
        console.log('%c GRADIENT UI: Cleared container', 'background-color: #334; color: #afa;');
        
        // If no text selected or no gradient stops, show message
        if (!text || !text.gradientStops || text.gradientStops.length === 0) {
            console.warn('%c GRADIENT UI: No gradient stops found, creating defaults', 'background-color: #334; color: #fa5;');
            
            // Create default gradient stops if none exist
            if (text && text.fillType === 'gradient') {
                text.gradientStops = [
                    { offset: 0, color: text.color || '#ff0000' },
                    { offset: 1, color: '#0000ff' }
                ];
                
                console.log('%c GRADIENT UI: Created default stops', 'background-color: #334; color: #afa;', JSON.stringify(text.gradientStops));
            } else {
                // Just return if not in gradient mode
                console.log('%c GRADIENT UI: Not in gradient mode, exiting', 'background-color: #334; color: #afa;');
                return;
            }
        }
        
        // Create UI for each stop
        console.log('%c GRADIENT UI: Creating UI for stops', 'background-color: #334; color: #afa;', JSON.stringify(text.gradientStops));
        
        text.gradientStops.forEach((stop, index) => {
            console.log('%c GRADIENT UI: Creating UI for stop', 'background-color: #334; color: #afa;', index, stop);
            
            const stopEl = document.createElement('div');
            stopEl.className = 'gradient-stop';
            stopEl.setAttribute('data-index', index);
            
            // Add label
            const label = document.createElement('div');
            label.className = 'gradient-stop-label';
            label.textContent = `Stop ${index + 1}`;
            stopEl.appendChild(label);
            
            // Create color display and text input instead of native color picker
            const colorWrapper = document.createElement('div');
            colorWrapper.className = 'gradient-stop-color';
            colorWrapper.style.display = 'flex';
            colorWrapper.style.alignItems = 'center';
            colorWrapper.style.gap = '5px';
            
            // Create a color input element
            const colorInput = document.createElement('input');
            colorInput.type = 'color';
            colorInput.value = stop.color || '#ff0000';
            colorInput.className = 'gradient-color-input';
            colorInput.style.width = '30px';
            colorInput.style.height = '30px';
            colorInput.style.padding = '0';
            colorInput.style.border = '1px solid #aaa';
            colorInput.style.borderRadius = '3px';
            colorInput.style.cursor = 'pointer';
            colorInput.style.backgroundColor = 'transparent';
            
            // Color text input (hex) - as a companion to the color picker
            const colorTextInput = document.createElement('input');
            colorTextInput.type = 'text';
            colorTextInput.value = stop.color || '#ff0000';
            colorTextInput.className = 'gradient-color-hex';
            colorTextInput.style.width = '80px';
            colorTextInput.style.padding = '4px';
            colorTextInput.style.border = '1px solid #555';
            colorTextInput.style.borderRadius = '4px';
            colorTextInput.style.backgroundColor = '#333';
            colorTextInput.style.color = 'white';
            
            // Add event listener for color input changes
            colorInput.addEventListener('input', e => {
                const color = e.target.value;
                colorTextInput.value = color;
                
                // Update the text object
                text.gradientStops[index].color = color;
                this.textMode.renderer.redrawAll();
            });
            
            // Add event listener for text input changes
            colorTextInput.addEventListener('input', e => {
                // Update color using the validation helper
                const { isValid, color } = this.validateHexColor(colorTextInput, null, colorInput);
                
                if (isValid) {
                    // Update the text object
                    text.gradientStops[index].color = color;
                    this.textMode.renderer.redrawAll();
                }
            });
            
            // Add elements to wrapper
            colorWrapper.appendChild(colorInput);
            colorWrapper.appendChild(colorTextInput);
            
            // Create position slider
            const offsetInput = document.createElement('input');
            offsetInput.type = 'range';
            offsetInput.min = '0';
            offsetInput.max = '100';
            offsetInput.value = Math.round(stop.offset * 100);
            offsetInput.className = 'gradient-offset-input';
            
            console.log('%c GRADIENT UI: Set offset input', 'background-color: #334; color: #afa;', {
                index,
                value: offsetInput.value,
                original: stop.offset
            });
            
            // Create position label
            const offsetLabel = document.createElement('span');
            offsetLabel.className = 'gradient-offset-label';
            offsetLabel.textContent = `${offsetInput.value}%`;
            
            offsetInput.addEventListener('change', e => {
                console.log('%c GRADIENT UI: Offset change event', 'background-color: #334; color: #afa;', {
                    index,
                    value: e.target.value,
                    previous: text.gradientStops[index].offset
                });
                
                text.gradientStops[index].offset = parseFloat(e.target.value) / 100;
                offsetLabel.textContent = `${e.target.value}%`;
                
                // Sort stops by offset
                text.gradientStops.sort((a, b) => a.offset - b.offset);
                this.updateGradientStopsUI(text); // Refresh UI after sort
                this.textMode.renderer.redrawAll();
            });
            
            offsetInput.addEventListener('input', e => {
                console.log('%c GRADIENT UI: Offset input event', 'background-color: #334; color: #afa;', {
                    index,
                    value: e.target.value,
                    previous: text.gradientStops[index].offset
                });
                
                text.gradientStops[index].offset = parseFloat(e.target.value) / 100;
                offsetLabel.textContent = `${e.target.value}%`;
                this.textMode.renderer.redrawAll();
            });
            
            // Add wrapper for position slider
            const offsetWrapper = document.createElement('div');
            offsetWrapper.className = 'gradient-offset-wrapper';
            offsetWrapper.appendChild(offsetInput);
            offsetWrapper.appendChild(offsetLabel);
            
            // Delete stop button (don't allow deleting first or last stop)
            if (text.gradientStops.length > 2 && index > 0 && index < text.gradientStops.length - 1) {
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'gradient-stop-delete-btn';
                deleteBtn.title = 'Delete gradient stop';
                
                deleteBtn.addEventListener('click', () => {
                    console.log('%c GRADIENT UI: Deleting stop', 'background-color: #334; color: #afa;', index);
                    text.gradientStops.splice(index, 1);
                    this.updateGradientStopsUI(text);
                    this.textMode.renderer.redrawAll();
                });
                
                stopEl.appendChild(deleteBtn);
            }
            
            // Add everything to the stop element
            stopEl.appendChild(colorWrapper);
            stopEl.appendChild(offsetWrapper);
            
            // Add the stop to the container
            gradientStopsContainer.appendChild(stopEl);
        });
        
        // Add a gradient preview
        const previewEl = document.createElement('div');
        previewEl.className = 'gradient-preview';
        previewEl.style.height = '30px';
        previewEl.style.marginTop = '10px';
        previewEl.style.borderRadius = '4px';
        
        // Create the CSS gradient
        let gradient = '';
        if (text.gradientType === 'linear') {
            gradient = 'linear-gradient(to right';
        } else {
            gradient = 'radial-gradient(circle';
        }
        
        // Add all the stops
        text.gradientStops.forEach(stop => {
            gradient += `, ${stop.color} ${Math.round(stop.offset * 100)}%`;
        });
        
        gradient += ')';
        previewEl.style.background = gradient;
        
        console.log('%c GRADIENT UI: Created preview with CSS gradient', 'background-color: #334; color: #afa;', gradient);
        
        gradientStopsContainer.appendChild(previewEl);
        
        // Add a dump button to show current gradient state in console
        const dumpButton = document.createElement('button');
        dumpButton.textContent = 'Debug Gradient';
        dumpButton.className = 'gradient-debug-btn';
        dumpButton.style.marginTop = '5px';
        dumpButton.addEventListener('click', () => {
            console.log('%c GRADIENT DEBUG DUMP:', 'background-color: #334; color: #afa; font-size: 14px;');
            console.log('%c Text object:', 'font-weight: bold;', text);
            console.log('%c Fill Type:', 'font-weight: bold;', text.fillType);
            console.log('%c Gradient Type:', 'font-weight: bold;', text.gradientType);
            console.log('%c Gradient Stops:', 'font-weight: bold;', JSON.stringify(text.gradientStops, null, 2));
            
            // Check for issues in the gradient stops
            if (!text.gradientStops || text.gradientStops.length < 2) {
                console.log('%c ISSUE: Not enough gradient stops', 'color: red;');
            }
            
            let hasColorIssue = false;
            text.gradientStops.forEach((stop, i) => {
                if (!stop.color) {
                    console.log(`%c ISSUE: Stop ${i} missing color`, 'color: red;');
                    hasColorIssue = true;
                }
                if (typeof stop.offset !== 'number' || stop.offset < 0 || stop.offset > 1) {
                    console.log(`%c ISSUE: Stop ${i} has invalid offset: ${stop.offset}`, 'color: red;');
                }
            });
            
            if (!hasColorIssue) {
                console.log('%c All gradient stops have valid colors', 'color: green;');
            }
        });
        
        gradientStopsContainer.appendChild(dumpButton);
        
        console.log('%c GRADIENT UI: Final UI update complete', 'background-color: #334; color: #afa;');
    }
    
    // Update transform controls
    updateTransformControls(text) {
        // Update rotation input
        const rotationInput = document.getElementById('rotation');
        if (rotationInput) {
            rotationInput.value = text.angle;
        }
        
        // Update skew inputs
        const skewXInput = document.getElementById('skewX');
        if (skewXInput) {
            skewXInput.value = text.skewX || 0;
        }
        
        const skewYInput = document.getElementById('skewY');
        if (skewYInput) {
            skewYInput.value = text.skewY || 0;
        }
        
        // Update bend input
        const bendInput = document.getElementById('warpBend');
        if (bendInput) {
            bendInput.value = text.bend || 0;
        }
    }
    
    // Update effect controls
    updateEffectControls(text) {
        // Update shadow controls
        if (text.shadow) {
            const shadowEnabledCheck = document.getElementById('shadowEnabled');
            if (shadowEnabledCheck) {
                shadowEnabledCheck.checked = text.shadow.enabled;
            }
            
            const shadowBlurInput = document.getElementById('shadowBlur');
            if (shadowBlurInput) {
                shadowBlurInput.value = text.shadow.blur;
            }
            
            const shadowOffsetXInput = document.getElementById('shadowOffsetX');
            if (shadowOffsetXInput) {
                shadowOffsetXInput.value = text.shadow.offsetX;
            }
            
            const shadowOffsetYInput = document.getElementById('shadowOffsetY');
            if (shadowOffsetYInput) {
                shadowOffsetYInput.value = text.shadow.offsetY;
            }
            
            const shadowColorPicker = document.getElementById('shadowColor');
            if (shadowColorPicker) {
                shadowColorPicker.value = text.shadow.color;
            }
        }
        
        // Update outline controls
        if (text.outline) {
            const outlineEnabledCheck = document.getElementById('outlineEnabled');
            if (outlineEnabledCheck) {
                outlineEnabledCheck.checked = text.outline.enabled;
            }
            
            const outlineWidthInput = document.getElementById('outlineWidth');
            if (outlineWidthInput) {
                outlineWidthInput.value = text.outline.width;
            }
            
            const outlineColorPicker = document.getElementById('outlineColor');
            if (outlineColorPicker) {
                outlineColorPicker.value = text.outline.color;
            }
        }
        
        // Update 3D effect controls
        if (text.threeD) {
            const threeDEnabledCheck = document.getElementById('threeDEnabled');
            if (threeDEnabledCheck) {
                threeDEnabledCheck.checked = text.threeD.enabled;
            }
            
            const threeDDepthInput = document.getElementById('threeDDepth');
            if (threeDDepthInput) {
                threeDDepthInput.value = text.threeD.depth;
            }
            
            const threeDColorPicker = document.getElementById('threeDColor');
            if (threeDColorPicker) {
                threeDColorPicker.value = text.threeD.color;
            }
        }
        
        // Update distortion controls
        if (text.distort) {
            const distortionTypeSelect = document.getElementById('distortionType');
            if (distortionTypeSelect) {
                distortionTypeSelect.value = text.distort.type;
            }
            
            const distortionIntensityInput = document.getElementById('distortionIntensity');
            if (distortionIntensityInput) {
                distortionIntensityInput.value = text.distort.intensity;
            }
            
            const distortionFrequencyInput = document.getElementById('distortionFrequency');
            if (distortionFrequencyInput) {
                distortionFrequencyInput.value = text.distort.frequency;
            }
        }
    }
    
    // Update layer controls
    updateLayerControls(text) {
        if (!text.layer) return;
        
        // Update layer name
        const layerNameInput = document.getElementById('layerName');
        if (layerNameInput) {
            layerNameInput.value = text.layer.name;
        }
        
        // Update layer visibility
        const layerVisibilityCheck = document.getElementById('layerVisibility');
        if (layerVisibilityCheck) {
            layerVisibilityCheck.checked = text.layer.visible;
        }
        
        // Update layer opacity
        const layerOpacityInput = document.getElementById('layerOpacity');
        if (layerOpacityInput) {
            layerOpacityInput.value = text.layer.opacity * 100;
        }
        
        // Update layer blend mode
        const blendModeSelect = document.getElementById('blendMode');
        if (blendModeSelect) {
            blendModeSelect.value = text.layer.blendMode;
        }
    }
    
    // Update text controls visibility based on selection state
    updateTextControlsVisibility() {
        const toolsPanel = document.querySelector('.tools-panel');
        const textControls = document.getElementById('textModeControls');
        
        console.log('Updating text controls visibility. Selected text:', this.textMode.selectedText);
        
        // First ensure tools panel is visible
        if (toolsPanel) {
            toolsPanel.style.display = 'block';
            console.log('Tools panel displayed');
        } else {
            console.error('tools-panel element not found');
        }
        
        // Then update text controls visibility
        if (textControls) {
            textControls.style.display = this.textMode.selectedText ? 'block' : 'none';
            console.log('Text controls visibility set to:', textControls.style.display);
            
            // If text is selected, ensure all effect control groups are properly initialized
            if (this.textMode.selectedText) {
                this.initializeEffectControls();
            }
        } else {
            console.error('textModeControls element not found');
        }
    }
    
    // Initialize all effect controls based on the selected text
    initializeEffectControls() {
        const text = this.textMode.selectedText;
        if (!text) return;
        
        console.log('Initializing effect controls for:', text);
        
        // Fill Type controls
        const fillTypeSelect = document.getElementById('fillType');
        if (fillTypeSelect) {
            // Set default to solid if not specified
            const fillType = text.fillType || 'solid';
            fillTypeSelect.value = fillType;
            
            // Show/hide related controls based on selection
            this.updateFillTypeControls(fillType);
        }
        
        // Shadow controls
        const shadowEnabledCheck = document.getElementById('shadowEnabled');
        if (shadowEnabledCheck) {
            shadowEnabledCheck.checked = text.shadow || false;
            this.updateShadowControls(text.shadow || false);
        }
        
        // 3D Effect controls
        const threeDEnabledCheck = document.getElementById('threeDEnabled');
        if (threeDEnabledCheck) {
            threeDEnabledCheck.checked = text.threeD || false;
            this.updateThreeDControls(text.threeD || false);
        }
        
        // Distortion controls
        const distortionTypeSelect = document.getElementById('distortionType');
        if (distortionTypeSelect) {
            const distortionType = text.distortionType || 'none';
            distortionTypeSelect.value = distortionType;
            this.updateDistortionControls(distortionType);
        }
        
        // Background controls
        const backgroundEnabledCheck = document.getElementById('backgroundEnabled');
        if (backgroundEnabledCheck) {
            backgroundEnabledCheck.checked = text.background || false;
            this.updateBackgroundControls(text.background || false);
        }
        
        // Layer controls
        const layerNameInput = document.getElementById('layerName');
        if (layerNameInput) {
            layerNameInput.value = text.name || 'Text';
            console.log('Layer name set to:', layerNameInput.value);
        }
        
        const layerOpacityInput = document.getElementById('layerOpacity');
        if (layerOpacityInput) {
            layerOpacityInput.value = (text.opacity || 1) * 100;
            const layerOpacityValue = document.getElementById('layerOpacityValue');
            if (layerOpacityValue) {
                layerOpacityValue.textContent = `${Math.round((text.opacity || 1) * 100)}%`;
            }
            console.log('Layer opacity set to:', layerOpacityInput.value);
        }
        
        const blendModeSelect = document.getElementById('blendMode');
        if (blendModeSelect) {
            blendModeSelect.value = text.blendMode || 'normal';
            console.log('Blend mode set to:', blendModeSelect.value);
        }
        
        console.log('Effect controls initialized');
    }
    
    // Update related controls based on Fill Type selection
    updateFillTypeControls(fillType) {
        const gradientControls = document.getElementById('gradientControls');
        const patternControls = document.getElementById('patternControls');
        
        if (gradientControls) {
            gradientControls.style.display = fillType === 'gradient' ? 'block' : 'none';
        }
        
        if (patternControls) {
            patternControls.style.display = fillType === 'pattern' ? 'block' : 'none';
        }
    }
    
    // Update Shadow controls based on checkbox state
    updateShadowControls(enabled) {
        const shadowControls = document.getElementById('shadowControls');
        if (shadowControls) {
            shadowControls.style.display = enabled ? 'block' : 'none';
        }
    }
    
    // Update 3D controls based on checkbox state
    updateThreeDControls(enabled) {
        const threeDControls = document.getElementById('threeDControls');
        if (threeDControls) {
            threeDControls.style.display = enabled ? 'block' : 'none';
        }
    }
    
    // Update Distortion controls based on selection
    updateDistortionControls(distortionType) {
        const distortionControls = document.getElementById('distortionControls');
        const distortionFrequencyGroup = document.getElementById('distortionFrequencyGroup');
        
        if (distortionControls) {
            distortionControls.style.display = distortionType !== 'none' ? 'block' : 'none';
        }
        
        if (distortionFrequencyGroup) {
            distortionFrequencyGroup.style.display = distortionType === 'wave' ? 'block' : 'none';
        }
    }
    
    // Update Background controls based on checkbox state
    updateBackgroundControls(enabled) {
        const backgroundControls = document.getElementById('backgroundControls');
        if (backgroundControls) {
            backgroundControls.style.display = enabled ? 'block' : 'none';
        }
    }
    
    // Handle changes to text input
    handleTextInputChange(text) {
        if (!this.textMode.selectedText) return;
        
        this.textMode.updateTextProperty('text', text);
    }
    
    // Handle changes to font family
    handleFontFamilyChange(fontFamily) {
        if (!this.textMode.selectedText) return;
        
        const currentFont = this.textMode.selectedText.font;
        const fontSize = parseInt(currentFont);
        const newFont = `${fontSize}px ${fontFamily}`;
        
        this.textMode.updateTextProperty('font', newFont);
    }
    
    // Handle changes to font size
    handleFontSizeChange(fontSize) {
        if (!this.textMode.selectedText) return;
        
        const currentFont = this.textMode.selectedText.font;
        const fontFamily = currentFont.split('px ')[1];
        const newFont = `${fontSize}px ${fontFamily}`;
        
        this.textMode.updateTextProperty('font', newFont);
    }
    
    // Handle changes to text alignment
    handleTextAlignChange(alignment) {
        if (!this.textMode.selectedText) return;
        
        this.textMode.updateTextProperty('textAlign', alignment);
    }
    
    // Handle fill type change
    handleFillTypeChange() {
        const fillTypeSelect = document.getElementById('fillType');
        const gradientControls = document.getElementById('gradientControls');
        const solidColorControls = document.getElementById('solidColorControls');
        
        console.log('%c FILL TYPE: Change detected', 'background-color: #334; color: #afa;', {
            value: fillTypeSelect.value,
            selectedText: this.textMode.selectedText ? this.textMode.selectedText.text : 'none'
        });
        
        // Ensure we have something selected
        if (!this.textMode.selectedText) {
            console.warn('%c FILL TYPE: No text selected to modify', 'background-color: #334; color: #f99;');
            return;
        }
        
        if (fillTypeSelect.value === 'gradient') {
            console.log('%c FILL TYPE: Switching to gradient mode', 'background-color: #334; color: #afa;');
            
            gradientControls.style.display = 'block';
            solidColorControls.style.display = 'none';
            
            // If switching from solid to gradient, set up initial gradient stops
            if (this.textMode.selectedText.fillType !== 'gradient') {
                console.log('%c FILL TYPE: First time setting gradient for text', 'background-color: #334; color: #afa;', this.textMode.selectedText.text);
                
                // Create initial gradient stops based on current color
                const currentColor = this.textMode.selectedText.color || '#ff0000';
                this.textMode.selectedText.gradientStops = [
                    { offset: 0, color: currentColor },
                    { offset: 1, color: '#0000ff' } // Default to blue for second stop
                ];
                
                // Set gradient type from dropdown
                const gradientTypeSelect = document.getElementById('gradientType');
                this.textMode.selectedText.gradientType = gradientTypeSelect ? gradientTypeSelect.value : 'linear';
                
                console.log('%c FILL TYPE: Created initial gradient stops', 'background-color: #334; color: #afa;', {
                    stops: JSON.stringify(this.textMode.selectedText.gradientStops),
                    gradientType: this.textMode.selectedText.gradientType
                });
            } else {
                console.log('%c FILL TYPE: Text already in gradient mode', 'background-color: #334; color: #afa;', {
                    text: this.textMode.selectedText.text,
                    gradientStops: JSON.stringify(this.textMode.selectedText.gradientStops)
                });
            }
            
            this.textMode.selectedText.fillType = 'gradient';
            
            // Update gradient UI
            console.log('%c FILL TYPE: Updating gradient UI', 'background-color: #334; color: #afa;');
            this.updateGradientStopsUI(this.textMode.selectedText);
            this.textMode.renderer.redrawAll();
        } else {
            console.log('%c FILL TYPE: Switching to solid color mode', 'background-color: #334; color: #afa;');
            
            gradientControls.style.display = 'none';
            solidColorControls.style.display = 'block';
            
            this.textMode.selectedText.fillType = 'solid';
            
            console.log('%c FILL TYPE: Set text to solid mode', 'background-color: #334; color: #afa;', {
                text: this.textMode.selectedText.text,
                color: this.textMode.selectedText.color
            });
            
            this.textMode.renderer.redrawAll();
        }
    }
    
    // Create the font browser UI
    createFontBrowserUI(container) {
        if (!container || !this.textMode.fontLibrary) return;
        
        // Clear container
        container.innerHTML = '';
        
        // Create UI for each font category
        this.textMode.fontLibrary.forEach(category => {
            const categoryEl = document.createElement('div');
            categoryEl.className = 'font-category';
            
            const categoryTitle = document.createElement('h3');
            categoryTitle.textContent = category.name;
            categoryEl.appendChild(categoryTitle);
            
            // Create UI for each font in the category
            category.fonts.forEach(font => {
                const fontEl = document.createElement('div');
                fontEl.className = 'font-option';
                
                const fontPreview = document.createElement('div');
                fontPreview.className = 'preview-text';
                fontPreview.style.fontFamily = font;
                fontPreview.textContent = 'Aa';
                
                const fontName = document.createElement('div');
                fontName.className = 'font-name';
                fontName.textContent = font;
                
                fontEl.appendChild(fontPreview);
                fontEl.appendChild(fontName);
                
                // Add click event to select the font
                fontEl.addEventListener('click', () => {
                    this.handleFontFamilyChange(font);
                });
                
                categoryEl.appendChild(fontEl);
            });
            
            container.appendChild(categoryEl);
        });
    }
    
    // Create the layer panel UI
    createLayerPanelUI(container) {
        if (!container) return;
        
        // Clear container
        container.innerHTML = '';
        
        // Create UI for each layer
        for (let i = this.textMode.layers.length - 1; i >= 0; i--) {
            const layer = this.textMode.layers[i];
            const layerEl = document.createElement('div');
            layerEl.className = 'layer-item';
            
            if (this.textMode.selectedText && this.textMode.selectedText.id === layer.id) {
                layerEl.classList.add('selected');
            }
            
            // Visibility toggle
            const visibilityBtn = document.createElement('button');
            visibilityBtn.className = 'layer-visibility-btn';
            visibilityBtn.innerHTML = layer.visible ? 
                '<i class="fas fa-eye"></i>' : 
                '<i class="fas fa-eye-slash"></i>';
            
            visibilityBtn.addEventListener('click', () => {
                this.textMode.toggleLayerVisibility(layer.id);
                this.createLayerPanelUI(container);
            });
            
            // Layer name
            const nameEl = document.createElement('div');
            nameEl.className = 'layer-name';
            nameEl.textContent = layer.name;
            
            // Select layer on click
            nameEl.addEventListener('click', () => {
                const text = this.textMode.texts.find(t => t.id === layer.id);
                if (text) {
                    this.textMode.selectedText = text;
                    this.textMode.renderer.redrawAll();
                    this.updateUIControls();
                    this.createLayerPanelUI(container);
                }
            });
            
            // Move layer up button
            const moveUpBtn = document.createElement('button');
            moveUpBtn.className = 'layer-move-btn';
            moveUpBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
            moveUpBtn.disabled = i === this.textMode.layers.length - 1;
            
            moveUpBtn.addEventListener('click', () => {
                this.textMode.moveLayer(layer.id, 'up');
                this.createLayerPanelUI(container);
            });
            
            // Move layer down button
            const moveDownBtn = document.createElement('button');
            moveDownBtn.className = 'layer-move-btn';
            moveDownBtn.innerHTML = '<i class="fas fa-arrow-down"></i>';
            moveDownBtn.disabled = i === 0;
            
            moveDownBtn.addEventListener('click', () => {
                this.textMode.moveLayer(layer.id, 'down');
                this.createLayerPanelUI(container);
            });
            
            // Delete layer button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'layer-delete-btn';
            deleteBtn.title = 'Delete layer';
            
            deleteBtn.addEventListener('click', () => {
                const text = this.textMode.texts.find(t => t.id === layer.id);
                if (text) {
                    if (this.textMode.selectedText === text) {
                        this.textMode.selectedText = null;
                    }
                    
                    const index = this.textMode.texts.indexOf(text);
                    if (index !== -1) {
                        this.textMode.texts.splice(index, 1);
                    }
                    
                    const layerIndex = this.textMode.layers.findIndex(l => l.id === layer.id);
                    if (layerIndex !== -1) {
                        this.textMode.layers.splice(layerIndex, 1);
                    }
                    
                    this.textMode.renderer.redrawAll();
                    this.updateTextControlsVisibility();
                    this.createLayerPanelUI(container);
                    this.textMode.saveToHistory();
                }
            });
            
            layerEl.appendChild(visibilityBtn);
            layerEl.appendChild(nameEl);
            layerEl.appendChild(moveUpBtn);
            layerEl.appendChild(moveDownBtn);
            layerEl.appendChild(deleteBtn);
            
            container.appendChild(layerEl);
        }
    }
    
    // Create controls for effect presets
    createEffectPresetsUI(container) {
        if (!container) return;
        
        // Clear container
        container.innerHTML = '';
        
        // Define presets
        const presets = [
            { name: 'Neon', id: 'neon' },
            { name: 'Retro', id: 'retro' },
            { name: 'Chrome', id: 'chrome' },
            { name: 'Comic', id: 'comic' },
            { name: 'Graffiti', id: 'graffiti' }
        ];
        
        // Create UI for each preset
        presets.forEach(preset => {
            const presetEl = document.createElement('div');
            presetEl.className = 'effect-preset';
            presetEl.textContent = preset.name;
            
            presetEl.addEventListener('click', () => {
                if (this.textMode.selectedText) {
                    this.textMode.effects.applyEffectPreset(
                        this.textMode.selectedText,
                        preset.id
                    );
                    this.updateUIControls();
                }
            });
            
            container.appendChild(presetEl);
        });
    }
    
    // Set up event listeners for all text effect controls
    setupEventListeners() {
        console.log('Setting up text event listeners');
        
        // Setup all UI control listeners
        this.setupUIControls();
        
        // Setup text input event listener
        const textInput = document.getElementById('textInput');
        if (textInput) {
            textInput.addEventListener('input', (e) => {
                const text = e.target.value;
                console.log(`Text input changed: ${text}`);
                
                if (this.textMode.selectedText) {
                    this.handleTextInputChange(text);
                }
            });
        }
        
        // Setup text add button
        const addTextBtn = document.getElementById('addText');
        if (addTextBtn) {
            addTextBtn.addEventListener('click', () => {
                console.log('Add text button clicked');
                this.textMode.createNewText();
            });
        }
        
        // Setup text delete button
        const deleteTextBtn = document.getElementById('deleteText');
        if (deleteTextBtn) {
            deleteTextBtn.addEventListener('click', () => {
                console.log('Delete text button clicked');
                this.textMode.deleteSelectedText();
            });
        }
        
        console.log('Text event listeners set up');
    }
    
    // Setup all control listeners
    setupUIControls() {
        console.log('Setting up text UI controls');
        
        this.setupFontControls();
        this.setupAlignmentControls();
        this.setupFillControls();
        this.setupStrokeControls();
        this.setupGradientControls(); 
        this.setupTransformControls();
        this.setupEffectControls();
        
        console.log('All text UI controls set up');
    }
    
    // Setup font controls
    setupFontControls() {
        console.log('Setting up font control listeners');
        
        // Font family select
        const fontFamilySelect = document.getElementById('fontFamily');
        if (fontFamilySelect) {
            fontFamilySelect.addEventListener('change', (e) => {
                const fontFamily = e.target.value;
                if (this.textMode.selectedText) {
                    this.handleFontFamilyChange(fontFamily);
                }
            });
        }
        
        // Font size select
        const fontSizeSelect = document.getElementById('fontSize');
        if (fontSizeSelect) {
            fontSizeSelect.addEventListener('change', (e) => {
                const fontSize = e.target.value;
                if (this.textMode.selectedText) {
                    this.handleFontSizeChange(fontSize);
                }
            });
        }
        
        console.log('Font control listeners set up');
    }
    
    // Setup alignment controls
    setupAlignmentControls() {
        console.log('Setting up alignment control listeners');
        
        // Text align buttons
        const alignButtons = document.querySelectorAll('.align-btn');
        if (alignButtons) {
            alignButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const alignment = e.target.getAttribute('data-align');
                    if (this.textMode.selectedText && alignment) {
                        this.handleTextAlignChange(alignment);
                    }
                });
            });
        }
        
        console.log('Alignment control listeners set up');
    }
    
    // Setup fill controls
    setupFillControls() {
        // Fill type selector
        const fillTypeSelect = document.getElementById('fillType');
        if (fillTypeSelect) {
            fillTypeSelect.addEventListener('change', (e) => {
                const fillType = e.target.value;
                console.log(`Fill type changed to: ${fillType}`);
                
                if (this.textMode.selectedText) {
                    this.handleFillTypeChange();
                }
            });
        }
        
        // Text color picker
        const colorPicker = document.getElementById('textColorPicker');
        const colorInput = document.getElementById('textColorInput');
        
        if (colorPicker) {
            colorPicker.addEventListener('input', (e) => {
                const color = e.target.value;
                console.log(`Text color changed: ${color}`);
                
                // Update the text input value when color picker changes
                if (colorInput) {
                    colorInput.value = color;
                }
                
                if (this.textMode.selectedText) {
                    if (this.textMode.selectedText.fillType === 'solid') {
                        this.textMode.updateTextProperty('color', color);
                    } else if (this.textMode.selectedText.fillType === 'gradient' && 
                              this.textMode.selectedText.gradientStops && 
                              this.textMode.selectedText.gradientStops.length > 0) {
                        // Update the first gradient stop color
                        this.textMode.selectedText.gradientStops[0].color = color;
                        this.updateGradientStopsUI(this.textMode.selectedText);
                    }
                    
                    this.textMode.renderer.redrawAll();
                }
            });
        }
        
        // Text color input (hex value)
        if (colorInput) {
            // Initial color sync
            if (colorPicker && colorPicker.value) {
                colorInput.value = colorPicker.value;
            }
            
            colorInput.addEventListener('input', (e) => {
                const { isValid, color } = this.validateHexColor(colorInput, null, colorPicker);
                
                if (isValid) {
                    // Update the text properties
                    if (this.textMode.selectedText) {
                        if (this.textMode.selectedText.fillType === 'solid') {
                            this.textMode.updateTextProperty('color', color);
                        } else if (this.textMode.selectedText.fillType === 'gradient' && 
                                  this.textMode.selectedText.gradientStops && 
                                  this.textMode.selectedText.gradientStops.length > 0) {
                            // Update the first gradient stop color
                            this.textMode.selectedText.gradientStops[0].color = color;
                            this.updateGradientStopsUI(this.textMode.selectedText);
                        }
                        
                        this.textMode.renderer.redrawAll();
                    }
                }
            });
        }
        
        // Gradient type selector
        const gradientTypeSelect = document.getElementById('gradientType');
        if (gradientTypeSelect) {
            gradientTypeSelect.addEventListener('change', (e) => {
                const gradientType = e.target.value;
                console.log(`Gradient type changed to: ${gradientType}`);
                
                if (this.textMode.selectedText) {
                    this.textMode.selectedText.gradientType = gradientType;
                    console.log(`Gradient type updated for text: ${gradientType}`);
                    
                    console.log('Updating gradient UI');
                    this.updateGradientStopsUI(this.textMode.selectedText);
                    this.textMode.renderer.redrawAll();
                }
            });
        }
        
        // Add Gradient Stop button
        const addGradientStopBtn = document.getElementById('addGradientStop');
        if (addGradientStopBtn) {
            addGradientStopBtn.addEventListener('click', () => {
                console.log('%c GRADIENT STOP: Add button clicked', 'background-color: #334; color: #faf;');
                
                if (this.textMode.selectedText) {
                    if (this.textMode.selectedText.fillType === 'gradient') {
                        if (!this.textMode.selectedText.gradientStops || !Array.isArray(this.textMode.selectedText.gradientStops)) {
                            // Create default gradient stops if none exist
                            this.textMode.selectedText.gradientStops = [
                                { offset: 0, color: this.textMode.selectedText.color || '#ff0000' },
                                { offset: 1, color: '#0000ff' }
                            ];
                            console.log('%c GRADIENT STOP: Created default stops', 'background-color: #334; color: #faf;', 
                                JSON.stringify(this.textMode.selectedText.gradientStops));
                        } else {
                            // Calculate a good place for a new stop (middle of largest gap)
                            let maxGap = 0;
                            let newPosition = 0.5;
                            
                            // Sort stops by offset
                            const sortedStops = [...this.textMode.selectedText.gradientStops].sort((a, b) => a.offset - b.offset);
                            
                            // Find largest gap
                            for (let i = 0; i < sortedStops.length - 1; i++) {
                                const gap = sortedStops[i + 1].offset - sortedStops[i].offset;
                                if (gap > maxGap) {
                                    maxGap = gap;
                                    newPosition = sortedStops[i].offset + gap / 2;
                                }
                            }
                            
                            console.log('%c GRADIENT STOP: Calculated new position', 'background-color: #334; color: #faf;', {
                                maxGap,
                                newPosition,
                                existingStops: sortedStops.map(s => s.offset)
                            });
                            
                            // Interpolate color
                            let newColor = '#ff00ff'; // Default to magenta
                            
                            // Try to find the stops on either side and interpolate
                            let leftStop = null;
                            let rightStop = null;
                            
                            for (const stop of sortedStops) {
                                if (stop.offset <= newPosition) {
                                    leftStop = stop;
                                } else if (rightStop === null) {
                                    rightStop = stop;
                                    break;
                                }
                            }
                            
                            if (leftStop && rightStop) {
                                // Simple linear interpolation of hex colors
                                try {
                                    const ratio = (newPosition - leftStop.offset) / (rightStop.offset - leftStop.offset);
                                    
                                    // Convert hex to RGB
                                    const leftRGB = this.hexToRgb(leftStop.color);
                                    const rightRGB = this.hexToRgb(rightStop.color);
                                    
                                    if (leftRGB && rightRGB) {
                                        // Interpolate
                                        const r = Math.round(leftRGB.r + ratio * (rightRGB.r - leftRGB.r));
                                        const g = Math.round(leftRGB.g + ratio * (rightRGB.g - leftRGB.g));
                                        const b = Math.round(leftRGB.b + ratio * (rightRGB.b - leftRGB.b));
                                        
                                        // Convert back to hex
                                        newColor = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
                                        
                                        console.log('%c GRADIENT STOP: Interpolated color', 'background-color: #334; color: #faf;', {
                                            leftColor: leftStop.color,
                                            rightColor: rightStop.color,
                                            ratio,
                                            newColor
                                        });
                                    }
                                } catch (e) {
                                    console.error('%c GRADIENT STOP: Color interpolation error', 'background-color: #334; color: #f99;', e);
                                }
                            }
                            
                            // Add the new stop
                            this.textMode.selectedText.gradientStops.push({
                                offset: newPosition,
                                color: newColor
                            });
                            
                            console.log('%c GRADIENT STOP: Added new stop', 'background-color: #334; color: #faf;', {
                                position: newPosition,
                                color: newColor,
                                totalStops: this.textMode.selectedText.gradientStops.length
                            });
                        }
                        
                        // Update UI and redraw
                        this.updateGradientStopsUI(this.textMode.selectedText);
                        this.textMode.renderer.redrawAll();
                    } else {
                        console.log('%c GRADIENT STOP: Text not in gradient mode', 'background-color: #334; color: #faf;');
                    }
                } else {
                    console.log('%c GRADIENT STOP: No text selected', 'background-color: #334; color: #faf;');
                }
            });
        }
    }
    
    // Setup stroke controls
    setupStrokeControls() {
        console.log('Setting up stroke control listeners');
        
        // Stroke color picker
        const strokeColorPicker = document.getElementById('strokeColor');
        if (strokeColorPicker) {
            strokeColorPicker.addEventListener('input', (e) => {
                const color = e.target.value;
                console.log(`Stroke color changed: ${color}`);
                
                if (this.textMode.selectedText) {
                    this.textMode.updateTextProperty('strokeColor', color);
                    this.textMode.renderer.redrawAll();
                }
            });
        }
        
        // Stroke width input
        const strokeWidthInput = document.getElementById('strokeWidth');
        if (strokeWidthInput) {
            strokeWidthInput.addEventListener('input', (e) => {
                const width = parseInt(e.target.value);
                console.log(`Stroke width changed: ${width}`);
                
                if (this.textMode.selectedText) {
                    this.textMode.updateTextProperty('strokeWidth', width);
                    this.textMode.renderer.redrawAll();
                }
            });
        }
        
        console.log('Stroke control listeners set up');
    }
    
    // Setup gradient controls
    setupGradientControls() {
        console.log('Setting up gradient controls');
        
        // Add gradient stop button
        const addStopBtn = document.getElementById('addGradientStop');
        if (addStopBtn) {
            addStopBtn.addEventListener('click', () => {
                console.log('Add gradient stop button clicked');
                if (this.textMode.selectedText && this.textMode.selectedText.gradientStops) {
                    // Calculate new stop position - middle of the existing stops
                    const stops = this.textMode.selectedText.gradientStops;
                    
                    if (stops.length < 2) {
                        console.warn('Not enough gradient stops to add a middle point');
                        return;
                    }
                    
                    // Sort stops by offset
                    stops.sort((a, b) => a.offset - b.offset);
                    
                    // Find the two stops that are farthest apart
                    let maxGap = 0;
                    let insertIndex = 1;
                    
                    for (let i = 0; i < stops.length - 1; i++) {
                        const gap = stops[i + 1].offset - stops[i].offset;
                        if (gap > maxGap) {
                            maxGap = gap;
                            insertIndex = i + 1;
                        }
                    }
                    
                    // Create new stop in the middle
                    const newOffset = (stops[insertIndex - 1].offset + stops[insertIndex].offset) / 2;
                    
                    // Interpolate color between the two adjacent stops
                    const color1 = stops[insertIndex - 1].color;
                    const color2 = stops[insertIndex].color;
                    
                    // Simple color interpolation
                    const newColor = this.interpolateColor(color1, color2, 0.5);
                    
                    // Add the new stop
                    const newStop = {
                        offset: newOffset,
                        color: newColor
                    };
                    
                    console.log(`Creating new gradient stop: offset=${newOffset}, color=${newColor}`);
                    
                    // Insert at the correct position
                    stops.splice(insertIndex, 0, newStop);
                    
                    // Update UI
                    this.updateGradientStopsUI(this.textMode.selectedText);
                    
                    // Redraw
                    this.textMode.renderer.redrawAll();
                }
            });
        }
        
        // Gradient type selector
        const gradientTypeSelect = document.getElementById('gradientType');
        if (gradientTypeSelect) {
            gradientTypeSelect.addEventListener('change', (e) => {
                const gradientType = e.target.value;
                console.log(`Gradient type changed to: ${gradientType}`);
                
                if (this.textMode.selectedText) {
                    this.textMode.selectedText.gradientType = gradientType;
                    this.textMode.renderer.redrawAll();
                }
            });
        }
    }
    
    // Setup transform controls
    setupTransformControls() {
        console.log('Setting up transform control listeners');
        
        // Rotation input
        const rotationInput = document.getElementById('rotation');
        if (rotationInput) {
            rotationInput.addEventListener('input', (e) => {
                if (this.textMode.selectedText) {
                    this.textMode.selectedText.angle = parseInt(e.target.value);
                    
                    const rotationValue = document.getElementById('rotationValue');
                    if (rotationValue) {
                        rotationValue.textContent = `${e.target.value}°`;
                    }
                    
                    this.textMode.renderer.redrawAll();
                }
            });
        }
        
        // Skew X input
        const skewXInput = document.getElementById('skewX');
        if (skewXInput) {
            skewXInput.addEventListener('input', (e) => {
                if (this.textMode.selectedText) {
                    this.textMode.selectedText.skewX = parseInt(e.target.value);
                    
                    const skewXValue = document.getElementById('skewXValue');
                    if (skewXValue) {
                        skewXValue.textContent = `${e.target.value}%`;
                    }
                    
                    this.textMode.renderer.redrawAll();
                }
            });
        }
        
        // Skew Y input
        const skewYInput = document.getElementById('skewY');
        if (skewYInput) {
            skewYInput.addEventListener('input', (e) => {
                if (this.textMode.selectedText) {
                    this.textMode.selectedText.skewY = parseInt(e.target.value);
                    
                    const skewYValue = document.getElementById('skewYValue');
                    if (skewYValue) {
                        skewYValue.textContent = `${e.target.value}%`;
                    }
                    
                    this.textMode.renderer.redrawAll();
                }
            });
        }
        
        console.log('Transform control listeners set up');
    }
    
    // Setup effect controls
    setupEffectControls() {
        console.log('Setting up effect control listeners');
        
        // Shadow controls
        const shadowEnabledCheck = document.getElementById('shadowEnabled');
        if (shadowEnabledCheck) {
            shadowEnabledCheck.addEventListener('change', (e) => {
                const enabled = e.target.checked;
                
                if (this.textMode.selectedText) {
                    this.textMode.selectedText.shadow = enabled;
                    this.updateShadowControls(enabled);
                    this.textMode.renderer.redrawAll();
                    console.log('Shadow enabled:', enabled);
                }
            });
            
            // Shadow color picker
            const shadowColorPicker = document.getElementById('shadowColor');
            if (shadowColorPicker) {
                shadowColorPicker.addEventListener('input', (e) => {
                    if (this.textMode.selectedText) {
                        this.textMode.selectedText.shadowColor = e.target.value;
                        this.textMode.renderer.redrawAll();
                    }
                });
            }
            
            // Shadow blur input
            const shadowBlurInput = document.getElementById('shadowBlur');
            if (shadowBlurInput) {
                shadowBlurInput.addEventListener('input', (e) => {
                    if (this.textMode.selectedText) {
                        this.textMode.selectedText.shadowBlur = parseInt(e.target.value);
                        
                        const shadowBlurValue = document.getElementById('shadowBlurValue');
                        if (shadowBlurValue) {
                            shadowBlurValue.textContent = e.target.value;
                        }
                        
                        this.textMode.renderer.redrawAll();
                    }
                });
            }
        }
        
        // 3D Effect controls
        const threeDEnabledCheck = document.getElementById('threeDEnabled');
        if (threeDEnabledCheck) {
            threeDEnabledCheck.addEventListener('change', (e) => {
                const enabled = e.target.checked;
                
                if (this.textMode.selectedText) {
                    this.textMode.selectedText.threeD = enabled;
                    this.updateThreeDControls(enabled);
                    this.textMode.renderer.redrawAll();
                    console.log('3D effect enabled:', enabled);
                }
            });
            
            // 3D depth input
            const threeDDepthInput = document.getElementById('threeDDepth');
            if (threeDDepthInput) {
                threeDDepthInput.addEventListener('input', (e) => {
                    if (this.textMode.selectedText) {
                        this.textMode.selectedText.threeDDepth = parseInt(e.target.value);
                        
                        const threeDDepthValue = document.getElementById('threeDDepthValue');
                        if (threeDDepthValue) {
                            threeDDepthValue.textContent = e.target.value;
                        }
                        
                        this.textMode.renderer.redrawAll();
                    }
                });
            }
        }
        
        // Background controls
        const backgroundEnabledCheck = document.getElementById('backgroundEnabled');
        if (backgroundEnabledCheck) {
            backgroundEnabledCheck.addEventListener('change', (e) => {
                const enabled = e.target.checked;
                
                if (this.textMode.selectedText) {
                    this.textMode.selectedText.background = enabled;
                    this.updateBackgroundControls(enabled);
                    this.textMode.renderer.redrawAll();
                    console.log('Background enabled:', enabled);
                }
            });
            
            // Background color picker
            const backgroundColorPicker = document.getElementById('backgroundColor');
            if (backgroundColorPicker) {
                backgroundColorPicker.addEventListener('input', (e) => {
                    if (this.textMode.selectedText) {
                        this.textMode.selectedText.backgroundColor = e.target.value;
                        this.textMode.renderer.redrawAll();
                    }
                });
            }
        }
        
        console.log('Effect control listeners set up');
    }
    
    // Interpolate between two colors
    interpolateColor(color1, color2, factor) {
        // Convert hex to rgb
        const hex2rgb = hex => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? [
                parseInt(result[1], 16),
                parseInt(result[2], 16),
                parseInt(result[3], 16)
            ] : [0, 0, 0];
        };
        
        // Convert rgb to hex
        const rgb2hex = rgb => {
            return "#" + rgb.map(val => {
                const hex = Math.round(val).toString(16);
                return hex.length === 1 ? "0" + hex : hex;
            }).join("");
        };
        
        // Get rgb values of both colors
        const rgb1 = hex2rgb(color1);
        const rgb2 = hex2rgb(color2);
        
        // Interpolate between them
        const result = rgb1.map((val, i) => val + factor * (rgb2[i] - val));
        
        // Convert back to hex
        return rgb2hex(result);
    }
    
    // Helper method to convert hex color to RGB
    hexToRgb(hex) {
        // Check if valid hex color
        if (!hex || typeof hex !== 'string') {
            console.error('%c COLOR CONVERSION: Invalid hex value', 'background-color: #334; color: #f99;', hex);
            return null;
        }

        // Remove # if present
        hex = hex.replace(/^#/, '');
        
        let r, g, b;
        if (hex.length === 3) {
            // Convert 3-char hex to 6-char
            r = parseInt(hex.charAt(0) + hex.charAt(0), 16);
            g = parseInt(hex.charAt(1) + hex.charAt(1), 16);
            b = parseInt(hex.charAt(2) + hex.charAt(2), 16);
        } else if (hex.length === 6) {
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
        } else {
            console.error('%c COLOR CONVERSION: Invalid hex color', 'background-color: #334; color: #f99;', hex);
            return null;
        }

        return { r, g, b };
    }
    
    // Helper function to validate and format hex color values
    validateHexColor(colorInput, colorValue, colorPicker = null) {
        let color = colorValue || colorInput.value;
        let isValid = false;
        
        // Add # if it's missing
        if (color.charAt(0) !== '#' && color.length > 0) {
            color = '#' + color;
            colorInput.value = color;
        }
        
        // Validate hex color format
        if (/^#([0-9A-F]{3}){1,2}$/i.test(color)) {
            isValid = true;
            
            // Update the color picker if provided
            if (colorPicker) {
                colorPicker.value = color;
            }
        }
        
        return { isValid, color };
    }
}

export default TextUIControls;

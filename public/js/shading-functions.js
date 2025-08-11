// Helper functions for shading controls
function hideAllShadingControls() {
    const dropShadowControls = document.getElementById('dropShadowControls');
    const lineShadowControls = document.getElementById('lineShadowControls');
    const blockShadowControls = document.getElementById('blockShadowControls');
    const detailed3DControls = document.getElementById('detailed3DControls');
    
    if (dropShadowControls) dropShadowControls.style.display = 'none';
    if (lineShadowControls) lineShadowControls.style.display = 'none';
    if (blockShadowControls) blockShadowControls.style.display = 'none';
    if (detailed3DControls) detailed3DControls.style.display = 'none';
}

function uncheckAllShadingToggles() {
    const dropShadowToggle = document.getElementById('dropShadowToggle');
    const lineShadowToggle = document.getElementById('lineShadowToggle');
    const blockShadowToggle = document.getElementById('blockShadowToggle');
    const detailed3DToggle = document.getElementById('detailed3DToggle');
    
    if (dropShadowToggle) dropShadowToggle.checked = false;
    if (lineShadowToggle) lineShadowToggle.checked = false;
    if (blockShadowToggle) blockShadowToggle.checked = false;
    if (detailed3DToggle) detailed3DToggle.checked = false;
}

function updateShadingUI(text) {
    if (!text) return;
    
    // Get all UI elements
    const dropShadowToggle = document.getElementById('dropShadowToggle');
    const lineShadowToggle = document.getElementById('lineShadowToggle');
    const blockShadowToggle = document.getElementById('blockShadowToggle');
    const detailed3DToggle = document.getElementById('detailed3DToggle');
    
    const dropShadowControls = document.getElementById('dropShadowControls');
    const lineShadowControls = document.getElementById('lineShadowControls');
    const blockShadowControls = document.getElementById('blockShadowControls');
    const detailed3DControls = document.getElementById('detailed3DControls');
    
    // Uncheck all toggles first
    uncheckAllShadingToggles();
    hideAllShadingControls();
    
    // Check the appropriate toggle based on the selected text's shading effect
    if (text.shadingEffect === textMode.SHADING_EFFECT.DROP_SHADOW && dropShadowToggle && dropShadowControls) {
        dropShadowToggle.checked = true;
        dropShadowControls.style.display = 'block';
        
        // Update sliders with current values
        if (text.dropShadow) {
            // Get all input elements
            const shadowColorInput = document.getElementById('shadowColorInput');
            const shadowOpacityInput = document.getElementById('shadowOpacityInput');
            const shadowDistanceInput = document.getElementById('shadowDistanceInput');
            const shadowAngleInput = document.getElementById('shadowAngleInput');
            const shadowBlurInput = document.getElementById('shadowBlurInput');
            const shadowOutlineWidthInput = document.getElementById('shadowOutlineWidthInput');
            
            // Update inputs if they exist
            if (shadowColorInput) shadowColorInput.value = text.dropShadow.color || '#000000';
            if (shadowOpacityInput) {
                shadowOpacityInput.value = text.dropShadow.opacity || 75;
                if (shadowOpacityInput.nextElementSibling) {
                    shadowOpacityInput.nextElementSibling.textContent = (text.dropShadow.opacity || 75) + '%';
                }
            }
            if (shadowDistanceInput) {
                shadowDistanceInput.value = text.dropShadow.distance || 5;
                if (shadowDistanceInput.nextElementSibling) {
                    shadowDistanceInput.nextElementSibling.textContent = text.dropShadow.distance || 5;
                }
            }
            if (shadowAngleInput) {
                shadowAngleInput.value = text.dropShadow.angle || 45;
                if (shadowAngleInput.nextElementSibling) {
                    shadowAngleInput.nextElementSibling.textContent = (text.dropShadow.angle || 45) + '°';
                }
            }
            if (shadowBlurInput) {
                shadowBlurInput.value = text.dropShadow.blur || 5;
                if (shadowBlurInput.nextElementSibling) {
                    shadowBlurInput.nextElementSibling.textContent = text.dropShadow.blur || 5;
                }
            }
            if (shadowOutlineWidthInput) {
                shadowOutlineWidthInput.value = text.dropShadow.outlineWidth || 0;
                if (shadowOutlineWidthInput.nextElementSibling) {
                    shadowOutlineWidthInput.nextElementSibling.textContent = text.dropShadow.outlineWidth || 0;
                }
            }
        }
    } else if (text.shadingEffect === textMode.SHADING_EFFECT.LINE_SHADOW && lineShadowToggle && lineShadowControls) {
        lineShadowToggle.checked = true;
        lineShadowControls.style.display = 'block';
        
        // Update sliders with current values
        if (text.lineShadow) {
            const lineShadowColorInput = document.getElementById('lineShadowColorInput');
            const lineShadowOpacityInput = document.getElementById('lineShadowOpacityInput');
            const layerDistanceInput = document.getElementById('layerDistanceInput');
            const lineShadowAngleInput = document.getElementById('lineShadowAngleInput');
            
            if (lineShadowColorInput) lineShadowColorInput.value = text.lineShadow.color || '#000000';
            if (lineShadowOpacityInput) {
                lineShadowOpacityInput.value = text.lineShadow.opacity || 75;
                if (lineShadowOpacityInput.nextElementSibling) {
                    lineShadowOpacityInput.nextElementSibling.textContent = (text.lineShadow.opacity || 75) + '%';
                }
            }
            if (layerDistanceInput) {
                layerDistanceInput.value = text.lineShadow.layerDistance || 2;
                if (layerDistanceInput.nextElementSibling) {
                    layerDistanceInput.nextElementSibling.textContent = (text.lineShadow.layerDistance || 2) + 'px';
                }
            }
            if (lineShadowAngleInput) {
                lineShadowAngleInput.value = text.lineShadow.angle || 45;
                if (lineShadowAngleInput.nextElementSibling) {
                    lineShadowAngleInput.nextElementSibling.textContent = (text.lineShadow.angle || 45) + '°';
                }
            }
        }
    } else if (text.shadingEffect === textMode.SHADING_EFFECT.BLOCK_SHADOW && blockShadowToggle && blockShadowControls) {
        blockShadowToggle.checked = true;
        blockShadowControls.style.display = 'block';
        
        // Update sliders with current values
        if (text.blockShadow) {
            const blockShadowColorInput = document.getElementById('blockShadowColorInput');
            const blockShadowOpacityInput = document.getElementById('blockShadowOpacityInput');
            const blockShadowOffsetInput = document.getElementById('blockShadowOffsetInput');
            const blockShadowAngleInput = document.getElementById('blockShadowAngleInput');
            const blockShadowBlurInput = document.getElementById('blockShadowBlurInput');
            const blockShadowOutlineWidthInput = document.getElementById('blockShadowOutlineWidthInput');
            
            if (blockShadowColorInput) blockShadowColorInput.value = text.blockShadow.color || '#000000';
            if (blockShadowOpacityInput) {
                blockShadowOpacityInput.value = text.blockShadow.opacity || 75;
                if (blockShadowOpacityInput.nextElementSibling) {
                    blockShadowOpacityInput.nextElementSibling.textContent = (text.blockShadow.opacity || 75) + '%';
                }
            }
            if (blockShadowOffsetInput) {
                blockShadowOffsetInput.value = text.blockShadow.offset || 10;
                if (blockShadowOffsetInput.nextElementSibling) {
                    blockShadowOffsetInput.nextElementSibling.textContent = text.blockShadow.offset || 10;
                }
            }
            if (blockShadowAngleInput) {
                blockShadowAngleInput.value = text.blockShadow.angle || 45;
                if (blockShadowAngleInput.nextElementSibling) {
                    blockShadowAngleInput.nextElementSibling.textContent = (text.blockShadow.angle || 45) + '°';
                }
            }
            if (blockShadowBlurInput) {
                blockShadowBlurInput.value = text.blockShadow.blur || 0;
                if (blockShadowBlurInput.nextElementSibling) {
                    blockShadowBlurInput.nextElementSibling.textContent = text.blockShadow.blur || 0;
                }
            }
            if (blockShadowOutlineWidthInput) {
                blockShadowOutlineWidthInput.value = text.blockShadow.outlineWidth || 0;
                if (blockShadowOutlineWidthInput.nextElementSibling) {
                    blockShadowOutlineWidthInput.nextElementSibling.textContent = text.blockShadow.outlineWidth || 0;
                }
            }
        }
    } else if (text.shadingEffect === textMode.SHADING_EFFECT.DETAILED_3D && detailed3DToggle && detailed3DControls) {
        detailed3DToggle.checked = true;
        detailed3DControls.style.display = 'block';
        
        // Update sliders with current values
        if (text.detailed3D) {
            const detailed3DPrimaryColorInput = document.getElementById('detailed3DPrimaryColorInput');
            const detailed3DPrimaryOpacityInput = document.getElementById('detailed3DPrimaryOpacityInput');
            const detailed3DSecondaryColorInput = document.getElementById('detailed3DSecondaryColorInput');
            const detailed3DSecondaryOpacityInput = document.getElementById('detailed3DSecondaryOpacityInput');
            const detailed3DSecondaryWidthInput = document.getElementById('detailed3DSecondaryWidthInput');
            const detailed3DSecondaryOffsetInput = document.getElementById('detailed3DSecondaryOffsetInput');
            const detailed3DOffsetInput = document.getElementById('detailed3DOffsetInput');
            const detailed3DAngleInput = document.getElementById('detailed3DAngleInput');
            const detailed3DBlurInput = document.getElementById('detailed3DBlurInput');
            const detailed3DOutlineWidthInput = document.getElementById('detailed3DOutlineWidthInput');
            
            if (detailed3DPrimaryColorInput) detailed3DPrimaryColorInput.value = text.detailed3D.primaryColor || '#000000';
            if (detailed3DPrimaryOpacityInput) {
                detailed3DPrimaryOpacityInput.value = text.detailed3D.primaryOpacity || 100;
                if (detailed3DPrimaryOpacityInput.nextElementSibling) {
                    detailed3DPrimaryOpacityInput.nextElementSibling.textContent = (text.detailed3D.primaryOpacity || 100) + '%';
                }
            }
            if (detailed3DSecondaryColorInput) detailed3DSecondaryColorInput.value = text.detailed3D.secondaryColor || '#666666';
            if (detailed3DSecondaryOpacityInput) {
                detailed3DSecondaryOpacityInput.value = text.detailed3D.secondaryOpacity || 80;
                if (detailed3DSecondaryOpacityInput.nextElementSibling) {
                    detailed3DSecondaryOpacityInput.nextElementSibling.textContent = (text.detailed3D.secondaryOpacity || 80) + '%';
                }
            }
            if (detailed3DSecondaryWidthInput) {
                detailed3DSecondaryWidthInput.value = text.detailed3D.secondaryWidth || 2;
                if (detailed3DSecondaryWidthInput.nextElementSibling) {
                    detailed3DSecondaryWidthInput.nextElementSibling.textContent = text.detailed3D.secondaryWidth || 2;
                }
            }
            if (detailed3DSecondaryOffsetInput) {
                detailed3DSecondaryOffsetInput.value = text.detailed3D.secondaryOffset || 1;
                if (detailed3DSecondaryOffsetInput.nextElementSibling) {
                    detailed3DSecondaryOffsetInput.nextElementSibling.textContent = text.detailed3D.secondaryOffset || 1;
                }
            }
            if (detailed3DOffsetInput) {
                detailed3DOffsetInput.value = text.detailed3D.offset || 10;
                if (detailed3DOffsetInput.nextElementSibling) {
                    detailed3DOffsetInput.nextElementSibling.textContent = text.detailed3D.offset || 10;
                }
            }
            if (detailed3DAngleInput) {
                detailed3DAngleInput.value = text.detailed3D.angle || 135;
                if (detailed3DAngleInput.nextElementSibling) {
                    detailed3DAngleInput.nextElementSibling.textContent = (text.detailed3D.angle || 135) + '°';
                }
            }
            if (detailed3DBlurInput) {
                detailed3DBlurInput.value = text.detailed3D.blur || 0;
                if (detailed3DBlurInput.nextElementSibling) {
                    detailed3DBlurInput.nextElementSibling.textContent = text.detailed3D.blur || 0;
                }
            }
            if (detailed3DOutlineWidthInput) {
                detailed3DOutlineWidthInput.value = text.detailed3D.outlineWidth || 0;
                if (detailed3DOutlineWidthInput.nextElementSibling) {
                    detailed3DOutlineWidthInput.nextElementSibling.textContent = text.detailed3D.outlineWidth || 0;
                }
            }
        }
    }
}

// Wait for textMode to be initialized
window.addEventListener('load', function() {
    // Use setTimeout to ensure textMode is initialized
    setTimeout(function() {
        if (typeof textMode !== 'undefined') {
            console.log('Setting up shading effects after textMode initialization');
            
            // Get all UI elements
            const dropShadowToggle = document.getElementById('dropShadowToggle');
            const lineShadowToggle = document.getElementById('lineShadowToggle');
            const blockShadowToggle = document.getElementById('blockShadowToggle');
            const detailed3DToggle = document.getElementById('detailed3DToggle');
            
            // Add event listeners for shadow toggles
            if (dropShadowToggle) {
                dropShadowToggle.addEventListener('change', function() {
                    if (this.checked && textMode.selectedText) {
                        hideAllShadingControls();
                        document.getElementById('dropShadowControls').style.display = 'block';
                        
                        textMode.updateSelectedText({
                            shadingEffect: textMode.SHADING_EFFECT.DROP_SHADOW,
                            dropShadow: {
                                color: document.getElementById('shadowColorInput').value,
                                opacity: parseInt(document.getElementById('shadowOpacityInput').value),
                                distance: parseInt(document.getElementById('shadowDistanceInput').value),
                                angle: parseInt(document.getElementById('shadowAngleInput').value),
                                blur: parseInt(document.getElementById('shadowBlurInput').value),
                                outlineWidth: parseInt(document.getElementById('shadowOutlineWidthInput').value)
                            }
                        });
                    } else if (!this.checked && textMode.selectedText && textMode.selectedText.shadingEffect === textMode.SHADING_EFFECT.DROP_SHADOW) {
                        hideAllShadingControls();
                        textMode.updateSelectedText({
                            shadingEffect: textMode.SHADING_EFFECT.NONE
                        });
                    }
                });
            }
            
            if (lineShadowToggle) {
                lineShadowToggle.addEventListener('change', function() {
                    if (this.checked && textMode.selectedText) {
                        hideAllShadingControls();
                        document.getElementById('lineShadowControls').style.display = 'block';
                        
                        textMode.updateSelectedText({
                            shadingEffect: textMode.SHADING_EFFECT.LINE_SHADOW,
                            lineShadow: {
                                color: document.getElementById('lineShadowColorInput').value,
                                opacity: parseInt(document.getElementById('lineShadowOpacityInput').value),
                                layerDistance: parseInt(document.getElementById('layerDistanceInput').value),
                                angle: parseInt(document.getElementById('lineShadowAngleInput').value)
                            }
                        });
                    } else if (!this.checked && textMode.selectedText && textMode.selectedText.shadingEffect === textMode.SHADING_EFFECT.LINE_SHADOW) {
                        hideAllShadingControls();
                        textMode.updateSelectedText({
                            shadingEffect: textMode.SHADING_EFFECT.NONE
                        });
                    }
                });
            }
            
            if (blockShadowToggle) {
                blockShadowToggle.addEventListener('change', function() {
                    if (this.checked && textMode.selectedText) {
                        hideAllShadingControls();
                        document.getElementById('blockShadowControls').style.display = 'block';
                        
                        textMode.updateSelectedText({
                            shadingEffect: textMode.SHADING_EFFECT.BLOCK_SHADOW,
                            blockShadow: {
                                color: document.getElementById('blockShadowColorInput').value,
                                opacity: parseInt(document.getElementById('blockShadowOpacityInput').value),
                                offset: parseInt(document.getElementById('blockShadowOffsetInput').value),
                                angle: parseInt(document.getElementById('blockShadowAngleInput').value),
                                blur: parseInt(document.getElementById('blockShadowBlurInput').value),
                                outlineWidth: parseInt(document.getElementById('blockShadowOutlineWidthInput').value)
                            }
                        });
                    } else if (!this.checked && textMode.selectedText && textMode.selectedText.shadingEffect === textMode.SHADING_EFFECT.BLOCK_SHADOW) {
                        hideAllShadingControls();
                        textMode.updateSelectedText({
                            shadingEffect: textMode.SHADING_EFFECT.NONE
                        });
                    }
                });
            }
            
            if (detailed3DToggle) {
                detailed3DToggle.addEventListener('change', function() {
                    if (this.checked && textMode.selectedText) {
                        hideAllShadingControls();
                        document.getElementById('detailed3DControls').style.display = 'block';
                        
                        textMode.updateSelectedText({
                            shadingEffect: textMode.SHADING_EFFECT.DETAILED_3D,
                            detailed3D: {
                                primaryColor: document.getElementById('detailed3DPrimaryColorInput').value,
                                primaryOpacity: parseInt(document.getElementById('detailed3DPrimaryOpacityInput').value),
                                secondaryColor: document.getElementById('detailed3DSecondaryColorInput').value,
                                secondaryOpacity: parseInt(document.getElementById('detailed3DSecondaryOpacityInput').value),
                                secondaryWidth: parseInt(document.getElementById('detailed3DSecondaryWidthInput').value),
                                secondaryOffset: parseInt(document.getElementById('detailed3DSecondaryOffsetInput').value),
                                offset: parseInt(document.getElementById('detailed3DOffsetInput').value),
                                angle: parseInt(document.getElementById('detailed3DAngleInput').value),
                                blur: parseInt(document.getElementById('detailed3DBlurInput').value),
                                outlineWidth: parseInt(document.getElementById('detailed3DOutlineWidthInput').value)
                            }
                        });
                    } else if (!this.checked && textMode.selectedText && textMode.selectedText.shadingEffect === textMode.SHADING_EFFECT.DETAILED_3D) {
                        hideAllShadingControls();
                        textMode.updateSelectedText({
                            shadingEffect: textMode.SHADING_EFFECT.NONE
                        });
                    }
                });
            }
            
            // Add shading update to the text selection callback
            const originalOnTextSelected = textMode.onTextSelected;
            textMode.onTextSelected = function(text) {
                if (originalOnTextSelected) {
                    originalOnTextSelected(text);
                }
                updateShadingUI(text);
            };
            
            console.log('Shading effect initialization complete');
        } else {
            console.error('textMode is not defined after timeout');
        }
    }, 1000); // 1-second delay to ensure textMode is initialized
});
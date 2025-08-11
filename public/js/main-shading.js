/**
 * Main Application Logic
 * Handles UI interactions and connects components
 */

class TextShadingApp {
    constructor() {
        console.log('Initializing TextShadingApp');
        // Initialize UI elements
        this.initUI();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initial render
        this.updateTextSettings();
        this.renderCanvas();
    }

    /**
     * Initialize UI elements and store references
     */
    initUI() {
        console.log('Initializing UI elements');
        // Text input controls
        this.textInput = document.getElementById('textInput');
        this.fontFamily = document.getElementById('fontFamily');
        this.fontSize = document.getElementById('fontSize');
        this.fontSizeValue = document.getElementById('fontSizeValue');
        this.textColor = document.getElementById('textColor');
        
        // Tab navigation
        this.tabButtons = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.tab-content');
        
        // Shadow preset buttons
        this.presetButtons = document.querySelectorAll('.preset');

        console.log('Setting up shadow controls');
        // Shadow control elements for each type
        this.shadowControls = {
            shadow: {
                color: document.getElementById('shadowColor'),
                opacity: document.getElementById('shadowOpacity'),
                opacityValue: document.getElementById('shadowOpacityValue'),
                distance: document.getElementById('shadowDistance'),
                distanceValue: document.getElementById('shadowDistanceValue'),
                angle: document.getElementById('shadowAngle'),
                angleValue: document.getElementById('shadowAngleValue'),
                blur: document.getElementById('shadowBlur'),
                blurValue: document.getElementById('shadowBlurValue'),
                outlineWidth: document.getElementById('shadowOutlineWidth'),
                outlineWidthValue: document.getElementById('shadowOutlineWidthValue')
            },
            lineShadow: {
                color: document.getElementById('lineShadowColor'),
                opacity: document.getElementById('lineShadowOpacity'),
                opacityValue: document.getElementById('lineShadowOpacityValue'),
                layerDistance: document.getElementById('layerDistance'),
                layerDistanceValue: document.getElementById('layerDistanceValue'),
                shadowAngle: document.getElementById('lineShadowAngle'), // Fix: Changed 'shadowAngle' to 'lineShadowAngle'
                shadowAngleValue: document.getElementById('lineShadowAngleValue') // Fix: Changed 'shadowAngleValue' to 'lineShadowAngleValue'
            },
            blockShadow: {
                color: document.getElementById('blockShadowColor'),
                opacity: document.getElementById('blockShadowOpacity'),
                opacityValue: document.getElementById('blockShadowOpacityValue'),
                offset: document.getElementById('blockShadowOffset'),
                offsetValue: document.getElementById('blockShadowOffsetValue'),
                angle: document.getElementById('blockShadowAngle'),
                angleValue: document.getElementById('blockShadowAngleValue'),
                blur: document.getElementById('blockShadowBlur'),
                blurValue: document.getElementById('blockShadowBlurValue'),
                outlineWidth: document.getElementById('blockShadowOutlineWidth'),
                outlineWidthValue: document.getElementById('blockShadowOutlineWidthValue')
            },
            detailed3D: {
                primaryColor: document.getElementById('detailed3DPrimaryColor'),
                primaryOpacity: document.getElementById('detailed3DPrimaryOpacity'),
                primaryOpacityValue: document.getElementById('detailed3DPrimaryOpacityValue'),
                secondaryColor: document.getElementById('detailed3DSecondaryColor'),
                secondaryOpacity: document.getElementById('detailed3DSecondaryOpacity'),
                secondaryOpacityValue: document.getElementById('detailed3DSecondaryOpacityValue'),
                secondaryWidth: document.getElementById('detailed3DSecondaryWidth'),
                secondaryWidthValue: document.getElementById('detailed3DSecondaryWidthValue'),
                secondaryOffset: document.getElementById('detailed3DSecondaryOffset'),
                secondaryOffsetValue: document.getElementById('detailed3DSecondaryOffsetValue'),
                offset: document.getElementById('detailed3DOffset'),
                offsetValue: document.getElementById('detailed3DOffsetValue'),
                angle: document.getElementById('detailed3DAngle'),
                angleValue: document.getElementById('detailed3DAngleValue'),
                blur: document.getElementById('detailed3DBlur'),
                blurValue: document.getElementById('detailed3DBlurValue'),
                outlineWidth: document.getElementById('detailed3DOutlineWidth'),
                outlineWidthValue: document.getElementById('detailed3DOutlineWidthValue')
            }
        };
    }

    /**
     * Set up event listeners for all UI controls
     */
    setupEventListeners() {
        // Text input controls
        this.textInput.addEventListener('input', () => {
            this.updateTextSettings();
            this.renderCanvas();
        });
        
        this.fontFamily.addEventListener('change', () => {
            this.updateTextSettings();
            this.renderCanvas();
        });
        
        this.fontSize.addEventListener('input', () => {
            this.fontSizeValue.textContent = `${this.fontSize.value}px`;
            this.updateTextSettings();
            this.renderCanvas();
        });
        
        this.textColor.addEventListener('input', () => {
            this.updateTextSettings();
            this.renderCanvas();
        });
        
        // Tab navigation
        this.tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                this.activateTab(tabId);
            });
        });
        
        // Shadow preset buttons
        this.presetButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Update active preset button
                const parentTab = button.closest('.tab-content');
                parentTab.querySelectorAll('.preset').forEach(btn => {
                    btn.classList.remove('active');
                });
                button.classList.add('active');
                
                // Apply preset
                const presetId = button.getAttribute('data-preset');
                textHandler.applyPreset(presetId);
                
                // Update UI to match the preset
                this.updateControlsFromSettings();
                
                // Render with new settings
                this.renderCanvas();
            });
        });
        
        // Set up event listeners for all shadow controls
        this.setupShadowControlListeners();
    }

    /**
     * Sets up event listeners for all shadow control elements
     */
    setupShadowControlListeners() {
        // Regular shadow controls
        this.setupShadowTypeListeners('shadow', {
            color: 'color',
            opacity: 'opacity',
            distance: 'distance',
            angle: 'angle',
            blur: 'blur',
            outlineWidth: 'outlineWidth'
        });
        
        // Line shadow controls (now using retro shadow)
        const lineShadowControls = this.shadowControls.lineShadow;
        
        lineShadowControls.color.addEventListener('input', () => {
            textHandler.updateShadowSettings('retroShadow', { 
                color: lineShadowControls.color.value 
            });
            this.renderCanvas();
        });
        
        lineShadowControls.opacity.addEventListener('input', () => {
            lineShadowControls.opacityValue.textContent = `${lineShadowControls.opacity.value}%`;
            // Note: Retro shadow doesn't currently use opacity as it's implemented in the fill color
            this.renderCanvas();
        });
        
        lineShadowControls.layerDistance.addEventListener('input', () => {
            const distance = parseInt(lineShadowControls.layerDistance.value);
            lineShadowControls.layerDistanceValue.textContent = `${distance}px`;
            textHandler.updateShadowSettings('retroShadow', { distance: distance });
            this.renderCanvas();
        });
        
        lineShadowControls.shadowAngle.addEventListener('input', () => {
            const angle = parseInt(lineShadowControls.shadowAngle.value);
            lineShadowControls.shadowAngleValue.textContent = `${angle}°`;
            textHandler.updateShadowSettings('retroShadow', { angle: angle });
            this.renderCanvas();
            console.log(`Shadow angle changed to: ${angle}°`);
        });
        
        // Block shadow controls
        this.setupShadowTypeListeners('blockShadow', {
            color: 'color',
            opacity: 'opacity',
            offset: 'offset',
            angle: 'angle',
            blur: 'blur',
            outlineWidth: 'outlineWidth'
        });
        
        // Detailed 3D shadow controls
        const detailed3DControls = this.shadowControls.detailed3D;
        
        detailed3DControls.primaryColor.addEventListener('input', () => {
            this.updateShadowSetting('detailed3D', { primaryColor: detailed3DControls.primaryColor.value });
        });
        
        detailed3DControls.primaryOpacity.addEventListener('input', () => {
            detailed3DControls.primaryOpacityValue.textContent = `${detailed3DControls.primaryOpacity.value}%`;
            this.updateShadowSetting('detailed3D', { primaryOpacity: parseInt(detailed3DControls.primaryOpacity.value) });
        });
        
        detailed3DControls.secondaryColor.addEventListener('input', () => {
            this.updateShadowSetting('detailed3D', { secondaryColor: detailed3DControls.secondaryColor.value });
        });
        
        detailed3DControls.secondaryOpacity.addEventListener('input', () => {
            detailed3DControls.secondaryOpacityValue.textContent = `${detailed3DControls.secondaryOpacity.value}%`;
            this.updateShadowSetting('detailed3D', { secondaryOpacity: parseInt(detailed3DControls.secondaryOpacity.value) });
        });
        
        detailed3DControls.secondaryWidth.addEventListener('input', () => {
            detailed3DControls.secondaryWidthValue.textContent = detailed3DControls.secondaryWidth.value;
            this.updateShadowSetting('detailed3D', { secondaryWidth: parseInt(detailed3DControls.secondaryWidth.value) });
        });
        
        detailed3DControls.secondaryOffset.addEventListener('input', () => {
            detailed3DControls.secondaryOffsetValue.textContent = detailed3DControls.secondaryOffset.value;
            this.updateShadowSetting('detailed3D', { secondaryOffset: parseInt(detailed3DControls.secondaryOffset.value) });
        });
        
        detailed3DControls.offset.addEventListener('input', () => {
            detailed3DControls.offsetValue.textContent = detailed3DControls.offset.value;
            this.updateShadowSetting('detailed3D', { offset: parseInt(detailed3DControls.offset.value) });
        });
        
        detailed3DControls.angle.addEventListener('input', () => {
            detailed3DControls.angleValue.textContent = `${detailed3DControls.angle.value}°`;
            this.updateShadowSetting('detailed3D', { angle: parseInt(detailed3DControls.angle.value) });
        });
        
        detailed3DControls.blur.addEventListener('input', () => {
            detailed3DControls.blurValue.textContent = detailed3DControls.blur.value;
            this.updateShadowSetting('detailed3D', { blur: parseInt(detailed3DControls.blur.value) });
        });
        
        detailed3DControls.outlineWidth.addEventListener('input', () => {
            detailed3DControls.outlineWidthValue.textContent = detailed3DControls.outlineWidth.value;
            this.updateShadowSetting('detailed3D', { outlineWidth: parseInt(detailed3DControls.outlineWidth.value) });
        });
    }

    /**
     * Sets up event listeners for a specific shadow type's controls
     * @param {string} shadowType - The type of shadow
     * @param {Object} mappings - Mappings between UI control IDs and setting property names
     */
    setupShadowTypeListeners(shadowType, mappings) {
        const controls = this.shadowControls[shadowType];
        
        // Color picker
        controls.color.addEventListener('input', () => {
            const settings = {};
            settings[mappings.color] = controls.color.value;
            this.updateShadowSetting(shadowType, settings);
        });
        
        // Opacity slider
        controls.opacity.addEventListener('input', () => {
            controls.opacityValue.textContent = `${controls.opacity.value}%`;
            const settings = {};
            settings[mappings.opacity] = parseInt(controls.opacity.value);
            this.updateShadowSetting(shadowType, settings);
        });
        
        // Distance/Offset slider
        const distanceControl = mappings.distance ? controls.distance : controls.offset;
        const distanceValueEl = mappings.distance ? controls.distanceValue : controls.offsetValue;
        
        distanceControl.addEventListener('input', () => {
            distanceValueEl.textContent = distanceControl.value;
            const settings = {};
            settings[mappings.distance || mappings.offset] = parseInt(distanceControl.value);
            this.updateShadowSetting(shadowType, settings);
        });
        
        // Angle slider
        controls.angle.addEventListener('input', () => {
            controls.angleValue.textContent = `${controls.angle.value}°`;
            const settings = {};
            settings[mappings.angle] = parseInt(controls.angle.value);
            this.updateShadowSetting(shadowType, settings);
        });
        
        // Blur slider
        controls.blur.addEventListener('input', () => {
            controls.blurValue.textContent = controls.blur.value;
            const settings = {};
            settings[mappings.blur] = parseInt(controls.blur.value);
            this.updateShadowSetting(shadowType, settings);
        });
        
        // Outline width slider
        controls.outlineWidth.addEventListener('input', () => {
            controls.outlineWidthValue.textContent = controls.outlineWidth.value;
            const settings = {};
            settings[mappings.outlineWidth] = parseInt(controls.outlineWidth.value);
            this.updateShadowSetting(shadowType, settings);
        });
    }

    /**
     * Activates a tab by ID
     * @param {string} tabId - The ID of the tab to activate
     */
    activateTab(tabId) {
        console.log(`Activating tab: ${tabId}`);
        
        // Log all tab buttons for debugging
        console.log("Tab buttons:", Array.from(this.tabButtons).map(btn => 
            `${btn.getAttribute('data-tab')}${btn.classList.contains('active') ? ' (active)' : ''}`
        ));
        
        // Log all tab contents for debugging
        console.log("Tab contents:", Array.from(this.tabContents).map(content => 
            `${content.id}${content.classList.contains('active') ? ' (active)' : ''}`
        ));
        
        // Remove active class from all tabs
        this.tabButtons.forEach(button => {
            button.classList.remove('active');
        });
        this.tabContents.forEach(content => {
            content.classList.remove('active');
        });
        
        // Add active class to selected tab
        const selectedButton = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
        const selectedContent = document.getElementById(tabId);
        
        if (selectedButton && selectedContent) {
            selectedButton.classList.add('active');
            selectedContent.classList.add('active');
            
            // Set the active shadow type based on the tab
            if (tabId === 'shadow') {
                textHandler.setActiveShadowType('shadow');
            } else if (tabId === 'lineShadow') {
                textHandler.setActiveShadowType('retroShadow');
            } else if (tabId === 'blockShadow') {
                textHandler.setActiveShadowType('blockShadow');
            } else if (tabId === 'detailed3D') {
                textHandler.setActiveShadowType('detailed3D');
            }
            
            // Update UI to match the selected tab's settings
            this.updateControlsFromSettings();
            
            // Render with new settings
            this.renderCanvas();
        }
    }

    /**
     * Updates text settings from UI controls
     */
    updateTextSettings() {
        textHandler.updateConfig({
            text: this.textInput.value,
            font: this.fontFamily.value,
            size: parseInt(this.fontSize.value),
            color: this.textColor.value
        });
    }

    /**
     * Updates shadow settings for a specific type
     * @param {string} type - The shadow type to update
     * @param {Object} settings - The new settings to apply
     */
    updateShadowSetting(type, settings) {
        textHandler.updateShadowSettings(type, settings);
        this.renderCanvas();
    }

    /**
     * Updates UI controls to match current shadow settings
     */
    updateControlsFromSettings() {
        const activeType = textHandler.config.currentShadowType;
        
        console.log(`Updating controls for active shadow type: ${activeType}`);
        
        // Get settings for the active shadow type
        let settings, controls;
        
        if (activeType === 'shadow') {
            settings = textHandler.shadowSettings.shadow;
            controls = this.shadowControls.shadow;
            
            controls.color.value = settings.color;
            controls.opacity.value = settings.opacity;
            controls.opacityValue.textContent = `${settings.opacity}%`;
            controls.distance.value = settings.distance;
            controls.distanceValue.textContent = settings.distance;
            controls.angle.value = settings.angle;
            controls.angleValue.textContent = `${settings.angle}°`;
            controls.blur.value = settings.blur;
            controls.blurValue.textContent = settings.blur;
            controls.outlineWidth.value = settings.outlineWidth;
            controls.outlineWidthValue.textContent = settings.outlineWidth;
        } else if (activeType === 'lineShadow' || activeType === 'retroShadow') {
            // For retro shadow, we're using the Line Shadow tab
            if (activeType === 'retroShadow') {
                settings = textHandler.shadowSettings.retroShadow;
            } else {
                settings = textHandler.shadowSettings.lineShadow;
            }
            controls = this.shadowControls.lineShadow;
            
            controls.color.value = settings.color;
            // For retroShadow, we only need these specific controls
            if (activeType === 'retroShadow') {
                controls.layerDistance.value = settings.distance;
                controls.layerDistanceValue.textContent = `${settings.distance}px`;
                controls.shadowAngle.value = settings.angle;
                controls.shadowAngleValue.textContent = `${settings.angle}°`;
                // Keep opacity at 100% as retro shadow doesn't use it
                controls.opacity.value = 100;
                controls.opacityValue.textContent = '100%';
                
                console.log(`Updated retro shadow controls - angle: ${settings.angle}, distance: ${settings.distance}`);
            } else {
                // Regular line shadow controls
                controls.color.value = settings.color;
                controls.opacity.value = settings.opacity;
                controls.opacityValue.textContent = `${settings.opacity}%`;
                controls.layerDistance.value = settings.distance || 5;
                controls.layerDistanceValue.textContent = `${settings.distance || 5}px`;
                controls.shadowAngle.value = settings.angle || 45;
                controls.shadowAngleValue.textContent = `${settings.angle || 45}°`;
            }
        } else if (activeType === 'blockShadow') {
            settings = textHandler.shadowSettings.blockShadow;
            controls = this.shadowControls.blockShadow;
            
            controls.color.value = settings.color;
            controls.opacity.value = settings.opacity;
            controls.opacityValue.textContent = `${settings.opacity}%`;
            // Important: For blockShadow, we use 'offset' not 'distance'
            controls.offset.value = settings.offset;
            controls.offsetValue.textContent = settings.offset;
            controls.angle.value = settings.angle;
            controls.angleValue.textContent = `${settings.angle}°`;
            controls.blur.value = settings.blur;
            controls.blurValue.textContent = settings.blur;
            controls.outlineWidth.value = settings.outlineWidth;
            controls.outlineWidthValue.textContent = settings.outlineWidth;
        } else if (activeType === 'detailed3D') {
            settings = textHandler.shadowSettings.detailed3D;
            controls = this.shadowControls.detailed3D;
            
            controls.primaryColor.value = settings.primaryColor;
            controls.primaryOpacity.value = settings.primaryOpacity;
            controls.primaryOpacityValue.textContent = `${settings.primaryOpacity}%`;
            controls.secondaryColor.value = settings.secondaryColor;
            controls.secondaryOpacity.value = settings.secondaryOpacity;
            controls.secondaryOpacityValue.textContent = `${settings.secondaryOpacity}%`;
            controls.secondaryWidth.value = settings.secondaryWidth;
            controls.secondaryWidthValue.textContent = settings.secondaryWidth;
            controls.secondaryOffset.value = settings.secondaryOffset;
            controls.secondaryOffsetValue.textContent = settings.secondaryOffset;
            controls.offset.value = settings.offset;
            controls.offsetValue.textContent = settings.offset;
            controls.angle.value = settings.angle;
            controls.angleValue.textContent = `${settings.angle}°`;
            controls.blur.value = settings.blur;
            controls.blurValue.textContent = settings.blur;
            controls.outlineWidth.value = settings.outlineWidth;
            controls.outlineWidthValue.textContent = settings.outlineWidth;
        }
    }

    /**
     * Renders the canvas with current settings
     */
    renderCanvas() {
        if (canvasManager) {
            canvasManager.render();
        }
    }
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');
    
    // Initialize the app
    window.app = new TextShadingApp();
    
    // Add direct tab selection capability for debugging
    window.activateTab = function(tabName) {
        if (window.app) {
            window.app.activateTab(tabName);
            console.log(`Tab ${tabName} manually activated`);
        }
    };
    
    // Force the initial tab to be active properly
    setTimeout(() => {
        document.querySelectorAll('.tab-content').forEach(content => {
            if (content.id === 'shadow') {
                content.classList.add('active');
                content.style.display = 'block';
            } else {
                content.classList.remove('active');
                content.style.display = 'none';
            }
        });
        console.log('Initial tabs forced');
    }, 300);
});

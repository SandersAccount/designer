/**
 * Advanced Color Picker with Gradient Support
 * Supports solid colors, linear gradients, and radial gradients
 */
class GradientColorPicker {
    constructor(element, options = {}) {
        this.element = element;
        this.options = {
            defaultColor: '#3b82f6',
            defaultType: 'solid',
            onChange: () => {},
            ...options
        };

        // Generate unique ID suffix for this instance
        this.instanceId = Math.random().toString(36).substr(2, 9);

        this.currentType = this.options.defaultType;
        this.currentColor = this.options.defaultColor;
        this.currentGradient = {
            type: 'linear',
            angle: 90,
            colors: [
                { color: '#3b82f6', position: 0 },
                { color: '#8b5cf6', position: 100 }
            ]
        };

        this.isOpen = false;
        this.init();
    }

    init() {
        this.createPickerHTML();
        this.attachEventListeners();
        this.updatePreview();
    }

    createPickerHTML() {
        // Preserve any existing content (like hidden inputs)
        const existingContent = this.element.innerHTML;

        this.element.innerHTML = existingContent + `
            <div class="gradient-picker-container">
                <div class="gradient-picker-preview" id="gradientPreview_${this.instanceId}">
                    <div class="gradient-preview-inner"></div>
                </div>
                <div class="gradient-picker-dropdown" id="gradientDropdown_${this.instanceId}" style="display: none;">
                    <div class="gradient-picker-header">
                        <div class="gradient-type-tabs">
                            <button class="gradient-tab active" data-type="solid">Solid Color</button>
                            <button class="gradient-tab" data-type="linear">Linear Gradient</button>
                            <button class="gradient-tab" data-type="radial">Radial Gradient</button>
                        </div>
                        <div class="gradient-picker-actions">
                            <button class="gradient-apply-btn" id="applyGradient_${this.instanceId}">Apply</button>
                            <button class="gradient-cancel-btn" id="cancelGradient_${this.instanceId}">Cancel</button>
                        </div>
                    </div>

                    <div class="gradient-picker-content">
                        <!-- Solid Color Panel -->
                        <div class="gradient-panel solid-panel active">
                            <div class="color-picker-container">
                                <input type="color" class="gradient-solid-color-input" value="${this.currentColor}">
                                <div class="color-input-wrapper">
                                    <label>Color:</label>
                                    <input type="text" class="gradient-solid-color-text" value="${this.currentColor}" placeholder="#000000">
                                </div>
                            </div>
                        </div>

                        <!-- Linear Gradient Panel -->
                        <div class="gradient-panel linear-panel">
                            <div class="gradient-controls">
                                <div class="angle-control">
                                    <label>Angle: <span id="angleValue_${this.instanceId}">${this.currentGradient.angle}°</span></label>
                                    <input type="range" id="angleSlider_${this.instanceId}" min="0" max="360" value="${this.currentGradient.angle}">
                                </div>
                                <div class="gradient-colors">
                                    <div class="gradient-color-stops" id="gradientColorStops_${this.instanceId}">
                                        <!-- Color stops will be generated here -->
                                    </div>
                                    <button class="add-color-stop" id="addColorStop_${this.instanceId}">+ Add Color</button>
                                </div>
                            </div>
                        </div>

                        <!-- Radial Gradient Panel -->
                        <div class="gradient-panel radial-panel">
                            <div class="gradient-controls">
                                <div class="radial-info">
                                    <p>Radial gradients create circular color transitions</p>
                                </div>
                                <div class="gradient-colors">
                                    <div class="gradient-color-stops" id="radialColorStops_${this.instanceId}">
                                        <!-- Color stops will be generated here -->
                                    </div>
                                    <button class="add-color-stop" id="addRadialColorStop_${this.instanceId}">+ Add Color</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.addPickerStyles();
        this.generateColorStops();
    }

    addPickerStyles() {
        if (document.getElementById('gradient-picker-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'gradient-picker-styles';
        styles.textContent = `
            .gradient-picker-container {
                position: relative;
                display: inline-block;
            }

            .gradient-picker-preview {
                width: 40px;
                height: 24px;
                border: 2px solid #d1d5db;
                border-radius: 4px;
                cursor: pointer;
                overflow: hidden;
                background: #fff;
            }

            .gradient-preview-inner {
                width: 100%;
                height: 100%;
                background: ${this.currentColor};
            }

            .gradient-picker-dropdown {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 1000;
                background: white;
                border: 1px solid #d1d5db;
                border-radius: 8px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.15);
                width: 280px;
                max-width: 90vw;
                max-height: 80vh;
                overflow-y: auto;
            }

            .gradient-picker-dropdown.position-left {
                left: 0;
                transform: none;
            }

            .gradient-picker-dropdown.position-right {
                left: auto;
                right: 0;
                transform: none;
            }

            .gradient-picker-header {
                padding: 12px;
                border-bottom: 1px solid #e5e7eb;
            }

            .gradient-type-tabs {
                display: flex;
                gap: 4px;
                margin-bottom: 12px;
            }

            .gradient-picker-actions {
                display: flex;
                gap: 8px;
                justify-content: flex-end;
            }

            .gradient-tab {
                flex: 1;
                padding: 8px 12px;
                border: 1px solid #d1d5db;
                background: #f9fafb;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s;
            }

            .gradient-tab.active {
                background: #3b82f6;
                color: white;
                border-color: #3b82f6;
            }

            .gradient-picker-content {
                padding: 16px;
            }

            .gradient-panel {
                display: none;
            }

            .gradient-panel.active {
                display: block;
            }

            .color-picker-container {
                display: flex;
                flex-direction: row;
                align-items: center;
                gap: 12px;
                max-width: 100%;
            }

            .color-input-wrapper {
                display: flex;
                align-items: center;
                gap: 8px;
                max-width: 100%;
                flex: 1;
            }

            .color-input-wrapper label {
                font-size: 12px;
                font-weight: 500;
            }

            .gradient-solid-color-input {
                width: 40px;
                height: 32px;
                border: 1px solid #d1d5db;
                border-radius: 4px;
                cursor: pointer;
                flex-shrink: 0;
            }

            .color-input-wrapper input[type="text"] {
                flex: 1;
                padding: 6px 8px;
                border: 1px solid #d1d5db;
                border-radius: 4px;
                font-size: 12px;
                max-width: 90px;
                min-width: 70px;
            }

            .angle-control {
                margin-bottom: 16px;
            }

            .angle-control label {
                display: block;
                font-size: 12px;
                font-weight: 500;
                margin-bottom: 6px;
            }

            .angle-control input[type="range"] {
                width: 100%;
            }

            .gradient-color-stops {
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin-bottom: 12px;
            }

            .color-stop {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px;
                background: #f9fafb;
                border-radius: 4px;
            }

            .color-stop input[type="color"] {
                width: 32px;
                height: 24px;
                border: none;
                border-radius: 2px;
                cursor: pointer;
            }

            .color-stop input[type="range"] {
                flex: 1;
            }

            .color-stop-remove {
                background: #ef4444;
                color: white;
                border: none;
                border-radius: 2px;
                width: 20px;
                height: 20px;
                cursor: pointer;
                font-size: 12px;
            }

            .add-color-stop {
                padding: 8px 12px;
                background: #f3f4f6;
                border: 1px dashed #9ca3af;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                color: #6b7280;
            }

            .add-color-stop:hover {
                background: #e5e7eb;
            }

            .gradient-apply-btn, .gradient-cancel-btn {
                padding: 6px 16px;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
                border: 1px solid #d1d5db;
            }

            .gradient-apply-btn {
                background: #3b82f6;
                color: white;
                border-color: #3b82f6;
            }

            .gradient-cancel-btn {
                background: #f9fafb;
                color: #374151;
            }

            .radial-info {
                margin-bottom: 16px;
                padding: 8px;
                background: #f0f9ff;
                border-radius: 4px;
                font-size: 12px;
                color: #0369a1;
            }
        `;

        document.head.appendChild(styles);
    }

    generateColorStops() {
        this.generateStopsForPanel(`gradientColorStops_${this.instanceId}`);
        this.generateStopsForPanel(`radialColorStops_${this.instanceId}`);
    }

    generateStopsForPanel(containerId) {
        // Look for container within this picker element first, then globally
        let container = this.element.querySelector(`#${containerId}`);
        if (!container) {
            container = document.getElementById(containerId);
        }

        if (!container) {
            console.warn(`Container ${containerId} not found for gradient color stops`);
            return;
        }

        console.log(`🎨 Generating color stops for ${containerId}:`, this.currentGradient.colors);

        container.innerHTML = '';

        this.currentGradient.colors.forEach((colorStop, index) => {
            const stopElement = document.createElement('div');
            stopElement.className = 'color-stop';
            stopElement.innerHTML = `
                <input type="color" value="${colorStop.color}" data-index="${index}">
                <input type="range" min="0" max="100" value="${colorStop.position}" data-index="${index}">
                <span>${colorStop.position}%</span>
                ${this.currentGradient.colors.length > 2 ? `<button class="color-stop-remove" data-index="${index}">×</button>` : ''}
            `;
            container.appendChild(stopElement);
        });

        console.log(`🎨 Generated ${this.currentGradient.colors.length} color stops in ${containerId}`);
    }

    attachEventListeners() {
        // Preview click to toggle dropdown
        const preview = this.element.querySelector(`#gradientPreview_${this.instanceId}`);
        preview.addEventListener('click', () => this.toggleDropdown());

        // Tab switching
        this.element.querySelectorAll('.gradient-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.type));
        });

        // Solid color input
        const solidColorInput = this.element.querySelector('.gradient-solid-color-input');
        const solidColorText = this.element.querySelector('.gradient-solid-color-text');

        solidColorInput.addEventListener('input', (e) => {
            this.currentColor = e.target.value;
            solidColorText.value = e.target.value;
            this.updatePreview();
        });

        solidColorText.addEventListener('input', (e) => {
            if (this.isValidColor(e.target.value)) {
                this.currentColor = e.target.value;
                solidColorInput.value = e.target.value;
                this.updatePreview();
            }
        });

        // Angle slider
        const angleSlider = this.element.querySelector(`#angleSlider_${this.instanceId}`);
        const angleValue = this.element.querySelector(`#angleValue_${this.instanceId}`);

        angleSlider.addEventListener('input', (e) => {
            this.currentGradient.angle = parseInt(e.target.value);
            angleValue.textContent = `${this.currentGradient.angle}°`;
            this.updatePreview();
        });

        // Apply and cancel buttons
        this.element.querySelector(`#applyGradient_${this.instanceId}`).addEventListener('click', () => this.applyColor());
        this.element.querySelector(`#cancelGradient_${this.instanceId}`).addEventListener('click', () => this.closeDropdown());

        // Add color stop buttons
        this.element.querySelector(`#addColorStop_${this.instanceId}`).addEventListener('click', () => this.addColorStop(`gradientColorStops_${this.instanceId}`));
        this.element.querySelector(`#addRadialColorStop_${this.instanceId}`).addEventListener('click', () => this.addColorStop(`radialColorStops_${this.instanceId}`));

        // Color stop events (delegated)
        this.element.addEventListener('input', (e) => {
            if (e.target.type === 'color' && e.target.hasAttribute('data-index')) {
                const index = parseInt(e.target.dataset.index);
                this.currentGradient.colors[index].color = e.target.value;
                this.updatePreview();
            } else if (e.target.type === 'range' && e.target.hasAttribute('data-index')) {
                const index = parseInt(e.target.dataset.index);
                this.currentGradient.colors[index].position = parseInt(e.target.value);
                e.target.nextElementSibling.textContent = `${e.target.value}%`;
                this.updatePreview();
            }
        });

        this.element.addEventListener('click', (e) => {
            if (e.target.classList.contains('color-stop-remove')) {
                const index = parseInt(e.target.dataset.index);
                this.removeColorStop(index);
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.element.contains(e.target) && this.isOpen) {
                this.closeDropdown();
            }
        });
    }

    switchTab(type) {
        this.currentType = type;

        // Update tab appearance
        this.element.querySelectorAll('.gradient-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.type === type);
        });

        // Update panel visibility
        this.element.querySelectorAll('.gradient-panel').forEach(panel => {
            panel.classList.toggle('active', panel.classList.contains(`${type}-panel`));
        });

        // Generate color stops when switching to gradient tabs
        if (type === 'linear' || type === 'radial') {
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                this.generateColorStops();
            }, 10);
        }

        this.updatePreview();
    }

    addColorStop(containerId) {
        const newColor = '#' + Math.floor(Math.random()*16777215).toString(16);
        const newPosition = 50;

        this.currentGradient.colors.push({ color: newColor, position: newPosition });
        this.currentGradient.colors.sort((a, b) => a.position - b.position);

        this.generateStopsForPanel(containerId);
        this.updatePreview();
    }

    removeColorStop(index) {
        if (this.currentGradient.colors.length > 2) {
            this.currentGradient.colors.splice(index, 1);
            this.generateColorStops();
            this.updatePreview();
        }
    }

    updatePreview() {
        const previewInner = this.element.querySelector('.gradient-preview-inner');
        let background;

        if (this.currentType === 'solid') {
            background = this.currentColor;
        } else if (this.currentType === 'linear') {
            const colorStops = this.currentGradient.colors
                .map(stop => `${stop.color} ${stop.position}%`)
                .join(', ');
            background = `linear-gradient(${this.currentGradient.angle}deg, ${colorStops})`;
        } else if (this.currentType === 'radial') {
            const colorStops = this.currentGradient.colors
                .map(stop => `${stop.color} ${stop.position}%`)
                .join(', ');
            background = `radial-gradient(circle, ${colorStops})`;
        }

        previewInner.style.background = background;
    }

    toggleDropdown() {
        if (this.isOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }

    openDropdown() {
        const dropdown = this.element.querySelector(`#gradientDropdown_${this.instanceId}`);
        dropdown.style.display = 'block';
        this.isOpen = true;

        // Generate color stops when opening dropdown
        setTimeout(() => {
            this.generateColorStops();
        }, 50);
    }

    closeDropdown() {
        this.element.querySelector(`#gradientDropdown_${this.instanceId}`).style.display = 'none';
        this.isOpen = false;
    }

    applyColor() {
        let result;

        if (this.currentType === 'solid') {
            result = {
                type: 'solid',
                value: this.currentColor
            };
        } else if (this.currentType === 'linear') {
            const colorStops = this.currentGradient.colors
                .map(stop => `${stop.color} ${stop.position}%`)
                .join(', ');
            result = {
                type: 'linear',
                value: `linear-gradient(${this.currentGradient.angle}deg, ${colorStops})`,
                gradient: { ...this.currentGradient }
            };
        } else if (this.currentType === 'radial') {
            const colorStops = this.currentGradient.colors
                .map(stop => `${stop.color} ${stop.position}%`)
                .join(', ');
            result = {
                type: 'radial',
                value: `radial-gradient(circle, ${colorStops})`,
                gradient: { ...this.currentGradient, type: 'radial' }
            };
        }

        this.options.onChange(result);
        this.closeDropdown();
    }

    isValidColor(color) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
    }

    setValue(value, type = 'solid') {
        this.currentType = type;
        if (type === 'solid') {
            this.currentColor = value;
            const solidColorInput = this.element.querySelector('.gradient-solid-color-input');
            const solidColorText = this.element.querySelector('.gradient-solid-color-text');
            if (solidColorInput) solidColorInput.value = value;
            if (solidColorText) solidColorText.value = value;
        }
        this.switchTab(type);
        this.updatePreview();
    }

    getValue() {
        if (this.currentType === 'solid') {
            return {
                type: 'solid',
                value: this.currentColor
            };
        } else if (this.currentType === 'linear') {
            const colorStops = this.currentGradient.colors
                .map(stop => `${stop.color} ${stop.position}%`)
                .join(', ');
            return {
                type: 'linear',
                value: `linear-gradient(${this.currentGradient.angle}deg, ${colorStops})`,
                gradient: { ...this.currentGradient }
            };
        } else if (this.currentType === 'radial') {
            const colorStops = this.currentGradient.colors
                .map(stop => `${stop.color} ${stop.position}%`)
                .join(', ');
            return {
                type: 'radial',
                value: `radial-gradient(circle, ${colorStops})`,
                gradient: { ...this.currentGradient, type: 'radial' }
            };
        }
    }
}

// Export for use in other files
window.GradientColorPicker = GradientColorPicker;

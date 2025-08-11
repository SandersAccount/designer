/**
 * ColorPaletteSelector Component
 * A web component for selecting color palettes
 */
import { colorPalettes, getPaletteById } from '../data/colorPalettes.js';

export class ColorPaletteSelector extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._selectedPaletteId = 'original';
        this._isOpen = false;
        this._onChangeCallback = null;
        this._originalPaletteDescription = '';
    }

    connectedCallback() {
        this.render();
        this.addEventListeners();
    }

    /**
     * Set the selected palette by ID
     * @param {string} id - The palette ID to select
     */
    set selectedPaletteId(id) {
        const palette = getPaletteById(id);
        if (palette) {
            this._selectedPaletteId = id;
            this.updateSelectedDisplay();
            
            // Trigger change event
            if (this._onChangeCallback) {
                this._onChangeCallback(palette);
            }
            
            this.dispatchEvent(new CustomEvent('paletteChange', {
                detail: { palette }
            }));
        }
    }
    
    /**
     * Get the currently selected palette ID
     * @returns {string} The selected palette ID
     */
    get selectedPaletteId() {
        return this._selectedPaletteId;
    }
    
    /**
     * Get the currently selected palette object
     * @returns {object} The selected palette object
     */
    get selectedPalette() {
        const palette = getPaletteById(this._selectedPaletteId);
        // If it's the original palette, make sure it has the current description
        if (palette && palette.id === 'original') {
            console.log('🎨 ColorPaletteSelector - Getting original palette:', {
                originalPaletteDescription: this._originalPaletteDescription,
                fallback: this._originalPaletteDescription || 'No color description provided'
            });
            return {
                ...palette,
                description: this._originalPaletteDescription || 'No color description provided'
            };
        }
        return palette;
    }
    
    /**
     * Set a callback function to be called when the palette changes
     * @param {Function} callback - The callback function
     */
    set onChange(callback) {
        this._onChangeCallback = callback;
    }

    /**
     * Set the original palette description
     * @param {string} description - The color description for the original palette
     */
    setOriginalPaletteDescription(description) {
        console.log('🎨 ColorPaletteSelector - Setting original palette description:', description);
        this._originalPaletteDescription = description || '';
        // Update the original palette in the data
        this.updateOriginalPalette();
        // If currently selected is original, update display and trigger change event
        if (this._selectedPaletteId === 'original') {
            this.updateSelectedDisplay();

            // Trigger change event to update selectedImagePalette
            const palette = this.selectedPalette;
            console.log('🎨 ColorPaletteSelector - Triggering paletteChange event with updated palette:', palette);

            if (this._onChangeCallback) {
                this._onChangeCallback(palette);
            }

            this.dispatchEvent(new CustomEvent('paletteChange', {
                detail: { palette }
            }));
        }
        console.log('🎨 ColorPaletteSelector - Original palette description set to:', this._originalPaletteDescription);
    }

    /**
     * Get the original palette description
     * @returns {string} The original palette description
     */
    getOriginalPaletteDescription() {
        return this._originalPaletteDescription;
    }

    /**
     * Update the original palette with the current description
     */
    updateOriginalPalette() {
        const originalPalette = colorPalettes.find(p => p.id === 'original');
        if (originalPalette) {
            originalPalette.description = this._originalPaletteDescription || 'No color description provided';
        }
    }

    /**
     * Render the component
     */
    render() {
        // Update original palette before rendering
        this.updateOriginalPalette();
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    font-family: Arial, sans-serif;
                    /* CSS Variables for theming */
                    --palette-bg: #1a1a1a;
                    --palette-bg-hover: #222;
                    --palette-border: #333;
                    --palette-text: #fff;
                    --palette-text-secondary: #999;
                    --palette-dropdown-bg: #222;
                    --palette-option-hover: #333;
                    --palette-option-selected: #2a2a2a;
                    --palette-shadow: rgba(0, 0, 0, 0.3);
                }

                .palette-selector {
                    position: relative;
                    width: 100%;
                }

                .selected-palette {
                    display: flex;
                    align-items: center;
                    padding: 8px 12px;
                    background: var(--palette-bg);
                    border: 1px solid var(--palette-border);
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .selected-palette:hover {
                    background: var(--palette-bg-hover);
                }

                .palette-colors {
                    display: flex;
                    margin-right: 12px;
                }

                .color-swatch {
                    width: 20px;
                    height: 20px;
                    border-radius: 2px;
                    margin-right: 4px;
                }

                .palette-name {
                    flex-grow: 1;
                    color: var(--palette-text);
                }

                .dropdown-icon {
                    color: var(--palette-text-secondary);
                }

                .palette-dropdown {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    max-height: 300px;
                    overflow-y: auto;
                    background: var(--palette-dropdown-bg);
                    border: 1px solid var(--palette-border);
                    border-radius: 4px;
                    margin-top: 4px;
                    z-index: 1000;
                    display: none;
                    box-shadow: 0 4px 12px var(--palette-shadow);
                }

                .palette-dropdown.open {
                    display: block;
                }

                .palette-option {
                    display: flex;
                    align-items: center;
                    padding: 8px 12px;
                    cursor: pointer;
                    transition: background 0.2s ease;
                }

                .palette-option:hover {
                    background: var(--palette-option-hover);
                }

                .palette-option.selected {
                    background: var(--palette-option-selected);
                }

                .palette-description {
                    font-size: 12px;
                    color: var(--palette-text-secondary);
                    margin-top: 4px;
                }
                
                .original-palette-swatch {
                    background: repeating-linear-gradient(
                        45deg,
                        #999,
                        #999 5px,
                        #ccc 5px,
                        #ccc 10px
                    ) !important;
                    position: relative;
                }
                
                .original-palette-swatch::after {
                    content: "★";
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: #333;
                    font-size: 10px;
                }
            </style>
            
            <div class="palette-selector">
                <div class="selected-palette" id="selected-palette">
                    <div class="palette-colors" id="selected-colors"></div>
                    <div class="palette-name" id="selected-name"></div>
                    <div class="dropdown-icon">▼</div>
                </div>
                
                <div class="palette-dropdown" id="palette-dropdown">
                    ${colorPalettes.map(palette => `
                        <div class="palette-option" data-id="${palette.id}">
                            <div class="palette-colors">
                                ${palette.colors.map(color => `
                                    <div class="color-swatch ${palette.id === 'original' ? 'original-palette-swatch' : ''}" style="background-color: ${color}"></div>
                                `).join('')}
                            </div>
                            <div>
                                <div class="palette-name">${palette.name}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        this.updateSelectedDisplay();
    }
    
    /**
     * Update the display of the selected palette
     */
    updateSelectedDisplay() {
        const palette = getPaletteById(this._selectedPaletteId);
        if (!palette) return;
        
        const selectedColors = this.shadowRoot.getElementById('selected-colors');
        const selectedName = this.shadowRoot.getElementById('selected-name');
        
        selectedColors.innerHTML = palette.colors.map(color => `
            <div class="color-swatch ${palette.id === 'original' ? 'original-palette-swatch' : ''}" style="background-color: ${color}"></div>
        `).join('');
        
        selectedName.textContent = palette.name;
        
        // Update selected state in dropdown
        const options = this.shadowRoot.querySelectorAll('.palette-option');
        options.forEach(option => {
            if (option.dataset.id === this._selectedPaletteId) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });
    }
    
    /**
     * Add event listeners to the component
     */
    addEventListeners() {
        const selectedPalette = this.shadowRoot.getElementById('selected-palette');
        const dropdown = this.shadowRoot.getElementById('palette-dropdown');
        const options = this.shadowRoot.querySelectorAll('.palette-option');
        
        // Toggle dropdown
        selectedPalette.addEventListener('click', () => {
            this._isOpen = !this._isOpen;
            if (this._isOpen) {
                dropdown.classList.add('open');
            } else {
                dropdown.classList.remove('open');
            }
        });
        
        // Select palette
        options.forEach(option => {
            option.addEventListener('click', () => {
                this.selectedPaletteId = option.dataset.id;
                this._isOpen = false;
                dropdown.classList.remove('open');
            });
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (event) => {
            if (!this.contains(event.target) && this._isOpen) {
                this._isOpen = false;
                dropdown.classList.remove('open');
            }
        });
    }
}

// Register the component
customElements.define('color-palette-selector', ColorPaletteSelector);

/**
 * Create a color palette selector
 * @param {string} containerId - The ID of the container element
 * @param {string} initialPaletteId - The initial palette ID to select
 * @param {Function} onChange - Callback function when palette changes
 * @returns {ColorPaletteSelector} The created selector component
 */
export function createColorPaletteSelector(containerId, initialPaletteId = 'original', onChange = null) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container element with ID '${containerId}' not found`);
        return null;
    }
    
    const selector = document.createElement('color-palette-selector');
    container.appendChild(selector);
    
    if (initialPaletteId) {
        selector.selectedPaletteId = initialPaletteId;
    }
    
    if (onChange) {
        selector.onChange = onChange;
    }
    
    return selector;
}

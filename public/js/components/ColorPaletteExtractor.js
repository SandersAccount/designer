/**
 * Color Palette Extractor Component
 * 
 * A utility component that extracts and highlights color palette descriptions in prompt templates.
 * It works with the PromptTemplateEditor to provide color palette extraction functionality.
 */
import { extractColorDescription, findClosestPalette } from '../data/colorPalettes.js';

class ColorPaletteExtractor extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    margin: 10px 0;
                    font-family: 'Roboto', sans-serif;
                }
                .container {
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    padding: 10px;
                    background-color: #f9f9f9;
                }
                .title {
                    font-weight: bold;
                    margin-bottom: 8px;
                }
                .color-description {
                    background-color: #e6f7ff;
                    border: 1px dashed #1890ff;
                    padding: 8px;
                    margin-bottom: 8px;
                    border-radius: 4px;
                    font-family: monospace;
                }
                .color-description.none {
                    background-color: #f0f0f0;
                    border: 1px dashed #d9d9d9;
                    color: #999;
                }
                .matched-palette {
                    margin-top: 8px;
                    font-weight: bold;
                }
                .matched-palette.none {
                    color: #999;
                }
                .color-swatches {
                    display: flex;
                    margin-top: 8px;
                }
                .color-swatch {
                    width: 24px;
                    height: 24px;
                    border-radius: 4px;
                    margin-right: 4px;
                    border: 1px solid #ddd;
                }
                .help-text {
                    font-size: 0.8em;
                    color: #666;
                    margin-top: 8px;
                }
            </style>
            <div class="container">
                <div class="title">Color Palette Extraction</div>
                <div class="color-description none">No color description found</div>
                <div class="matched-palette none">No matching palette found</div>
                <div class="color-swatches"></div>
                <div class="help-text">
                    Color descriptions are automatically extracted from your prompt template.
                    Include color descriptions in your prompt to enable palette switching.
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // This component doesn't have its own UI interactions
        // It's meant to be used by other components
    }

    /**
     * Analyze a prompt template to extract color descriptions
     * @param {string} promptText - The prompt template text to analyze
     * @returns {Object} An object containing the extracted color info
     */
    analyzePrompt(promptText) {
        if (!promptText) {
            this.showNoColorFound();
            return null;
        }

        const result = extractColorDescription(promptText);
        if (!result || !result.colorDescription) {
            this.showNoColorFound();
            return null;
        }

        const matchedPalette = findClosestPalette(result.colorDescription);
        this.updateUI(result.colorDescription, matchedPalette);
        
        return {
            colorDescription: result.colorDescription,
            matchedPalette
        };
    }

    /**
     * Update the UI to show the extracted color information
     * @param {string} colorDescription - The extracted color description
     * @param {Object|null} matchedPalette - The matched color palette, if any
     */
    updateUI(colorDescription, matchedPalette) {
        const colorDescriptionEl = this.shadowRoot.querySelector('.color-description');
        const matchedPaletteEl = this.shadowRoot.querySelector('.matched-palette');
        const colorSwatchesEl = this.shadowRoot.querySelector('.color-swatches');

        // Update color description
        if (colorDescription) {
            colorDescriptionEl.textContent = colorDescription;
            colorDescriptionEl.classList.remove('none');
        } else {
            colorDescriptionEl.textContent = 'No color description found';
            colorDescriptionEl.classList.add('none');
        }

        // Update matched palette
        if (matchedPalette) {
            matchedPaletteEl.textContent = `Matched palette: ${matchedPalette.name}`;
            matchedPaletteEl.classList.remove('none');
            
            // Create color swatches
            colorSwatchesEl.innerHTML = '';
            matchedPalette.colors.forEach(color => {
                const swatch = document.createElement('div');
                swatch.className = 'color-swatch';
                swatch.style.backgroundColor = color;
                colorSwatchesEl.appendChild(swatch);
            });
        } else {
            matchedPaletteEl.textContent = 'No matching palette found';
            matchedPaletteEl.classList.add('none');
            colorSwatchesEl.innerHTML = '';
        }
    }

    showNoColorFound() {
        const colorDescriptionEl = this.shadowRoot.querySelector('.color-description');
        const matchedPaletteEl = this.shadowRoot.querySelector('.matched-palette');
        const colorSwatchesEl = this.shadowRoot.querySelector('.color-swatches');

        colorDescriptionEl.textContent = 'No color description found';
        colorDescriptionEl.classList.add('none');
        matchedPaletteEl.textContent = 'No matching palette found';
        matchedPaletteEl.classList.add('none');
        colorSwatchesEl.innerHTML = '';
    }
}

customElements.define('color-palette-extractor', ColorPaletteExtractor);

export { ColorPaletteExtractor };

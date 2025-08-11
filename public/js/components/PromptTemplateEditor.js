/**
 * Prompt Template Editor Component
 * 
 * A web component for editing and previewing prompt templates with dynamic variable replacement.
 */
import { processTemplate, validateTemplate } from '../promptTemplates.js';

class PromptTemplateEditor extends HTMLElement {
    constructor() {
        super();
        
        // Initialize variables
        this.variables = [
            'object', 'text1', 'text2', 'text3', 'art', 'elements', 'fontstyle', 'feel', 'image-palette'
        ];
        
        // Required variables for validation
        this.requiredVariables = ['object', 'text1', 'text2', 'text3'];
        
        // Create shadow DOM
        this.attachShadow({ mode: 'open' });
        
        // Initialize properties
        this.templateInput = null;
        this.validationMessage = null;
        this.randomOptionsToggle = null;
        this.randomOptionsContent = null;
        this.colorPaletteExtractor = null;
        this.previewContent = null;
        this.randomOptionInputs = [];
        this.optionCountInputs = [];
    }

    connectedCallback() {
        this.render();
        
        // Get elements from shadow DOM
        this.templateInput = this.shadowRoot.querySelector('.template-input');
        this.validationMessage = this.shadowRoot.querySelector('.validation-message');
        this.randomOptionsToggle = this.shadowRoot.querySelector('.random-options-toggle');
        this.randomOptionsContent = this.shadowRoot.querySelector('.random-options-content');
        this.previewContent = this.shadowRoot.querySelector('.preview-content');
        
        // Get random option inputs
        this.randomOptionInputs = Array.from(this.shadowRoot.querySelectorAll('.random-option-input'));
        this.optionCountInputs = Array.from(this.shadowRoot.querySelectorAll('.option-count-input'));
        
        // Add event listener for template input changes
        this.templateInput.addEventListener('input', () => {
            this.handleInput();
        });
        
        // Add event listeners for random option inputs
        this.randomOptionInputs.forEach(input => {
            input.addEventListener('input', () => {
                this.processPreview();
            });
        });
        
        // Add event listeners for option count inputs
        this.optionCountInputs.forEach(input => {
            input.addEventListener('input', () => {
                this.processPreview();
            });
        });
        
        // Add event listener for random options toggle
        this.randomOptionsToggle.addEventListener('click', () => {
            this.toggleRandomOptions();
        });
        
        // Add event listeners for variable tags
        const variableTags = this.shadowRoot.querySelectorAll('.variable-tag');
        variableTags.forEach(tag => {
            tag.addEventListener('click', () => {
                const variable = tag.getAttribute('data-variable');
                this.insertVariable(variable);
            });
        });
        
        // Initialize with any existing template
        if (this.getAttribute('template')) {
            this.templateInput.value = this.getAttribute('template');
            this.handleInput();
        }
        
        // Process the preview initially
        this.processPreview();
    }

    /**
     * Get the current template value
     */
    get value() {
        return this.shadowRoot.querySelector('.template-input').value;
    }

    /**
     * Set the template value
     */
    set value(val) {
        this.shadowRoot.querySelector('.template-input').value = val;
        this.processPreview();
        this.analyzeColorPalette();
    }

    /**
     * Set the variables for template preview
     */
    set templateVariables(newVariables) {
        this.variables = newVariables;
        this.processPreview();
    }

    /**
     * Render the component
     */
    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    font-family: 'Inter', sans-serif;
                    color: #939393;
                }
                
                .template-editor {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                
                textarea {
                    width: 100%;
                    height: 200px;
                    padding: 10px;
                    font-family: monospace;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    background-color: #222;
                    color: #fff;
                    resize: vertical;
                }
                
                .editor-controls {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                }
                
                button {
                    padding: 8px 12px;
                    background-color: #3498db;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                
                button:hover {
                    background-color: #2980b9;
                }
                
                .variable-tag {
                    display: inline-block;
                    padding: 2px 6px;
                    background-color: #3498db;
                    color: white;
                    border-radius: 4px;
                    margin: 2px;
                    cursor: pointer;
                }
                
                .random-options {
                    margin-top: 20px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    padding: 15px;
                    background-color: #222;
                    color: #fff;
                }
                
                .random-options h3 {
                    margin-top: 0;
                    margin-bottom: 15px;
                    color: #fff;
                }
                
                .option-group {
                    margin-bottom: 15px;
                }
                
                .option-group label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: 500;
                    color: #fff;
                }
                
                .option-group input {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    background-color: #333;
                    color: #fff;
                }
                
                .preview-container {
                    margin-top: 20px;
                    background-color: #1e1e1e;
                    border-radius: 4px;
                    padding: 10px;
                    border: 1px solid #333;
                }
                
                .preview-header {
                    margin-bottom: 10px;
                    border-bottom: 1px solid #333;
                    padding-bottom: 5px;
                }
                
                .preview-header h3 {
                    margin: 0;
                    font-size: 16px;
                    color: #ddd;
                }
                
                .preview-content {
                    padding: 10px;
                    background-color: #2a2a2a;
                    border-radius: 4px;
                    color: #ddd;
                    min-height: 100px;
                    white-space: pre-wrap;
                    line-height: 1.5;
                }
                
                .preview-content .variable {
                    background-color: #2c5282;
                    color: #fff;
                    padding: 2px 4px;
                    border-radius: 3px;
                    font-weight: bold;
                }
                
                .color-palette-section {
                    margin-top: 20px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    padding: 15px;
                    background-color: #222;
                }
                
                .color-palette-section h3 {
                    margin-top: 0;
                    margin-bottom: 15px;
                    color: #fff;
                }
                
                .color-description {
                    margin-bottom: 10px;
                    padding: 8px;
                    background-color: #333;
                    border-radius: 4px;
                    color: #fff;
                }
                
                .help-text {
                    margin-top: 5px;
                    font-size: 0.9em;
                    color: #bbb;
                }
                
                .tab-bar {
                    display: flex;
                    border-bottom: 1px solid #ddd;
                    margin-bottom: 15px;
                }
                
                .tab {
                    padding: 8px 16px;
                    cursor: pointer;
                    border-bottom: 2px solid transparent;
                }
                
                .tab.active {
                    border-bottom-color: #3498db;
                    color: #3498db;
                }
                
                .tab-content {
                    display: none;
                }
                
                .tab-content.active {
                    display: block;
                }
                
                .matched-palette {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    margin-top: 10px;
                }
                
                .color-swatch {
                    width: 30px;
                    height: 30px;
                    border-radius: 4px;
                    border: 1px solid #ddd;
                }
                
                .tag {
                    display: inline-block;
                    padding: 2px 6px;
                    background-color: #3498db;
                    color: white;
                    border-radius: 4px;
                    margin: 2px;
                    font-size: 0.8em;
                }
            </style>
            <div class="template-editor">
                <div class="editor-controls">
                    <h3>Prompt Template Editor</h3>
                    <div class="variable-tags">
                        ${this.variables.map(v => `
                            <span class="variable-tag" data-variable="${v}">
                                {${v}}
                            </span>
                        `).join('')}
                    </div>
                </div>
                <textarea class="template-input" placeholder="Enter your prompt template here..."></textarea>
                <div class="validation-message"></div>
                

                
                <div class="random-options">
                    <h3>Random Options</h3>
                    <button class="random-options-toggle">
                        <i class="fas fa-random"></i> Toggle Random Options
                    </button>
                    <div class="random-options-content">
                        <div class="option-group">
                            <label class="random-option-label">Art Style Options:</label>
                            <textarea class="random-option-input" data-variable="art" placeholder="Enter comma-separated options for art style..."></textarea>
                            <div class="option-count-group">
                                <span class="option-count-label">Number to use:</span>
                                <input type="number" class="option-count-input" data-variable="art" value="1" min="1" max="10">
                            </div>
                        </div>
                        <div class="option-group">
                            <label class="random-option-label">Elements Options:</label>
                            <textarea class="random-option-input" data-variable="elements" placeholder="Enter comma-separated options for elements..."></textarea>
                            <div class="option-count-group">
                                <span class="option-count-label">Number to use:</span>
                                <input type="number" class="option-count-input" data-variable="elements" value="1" min="1" max="10">
                            </div>
                        </div>
                        <div class="option-group">
                            <label class="random-option-label">Font Style Options:</label>
                            <textarea class="random-option-input" data-variable="fontstyle" placeholder="Enter comma-separated options for font style..."></textarea>
                            <div class="option-count-group">
                                <span class="option-count-label">Number to use:</span>
                                <input type="number" class="option-count-input" data-variable="fontstyle" value="1" min="1" max="10">
                            </div>
                        </div>
                        <div class="option-group">
                            <label class="random-option-label">Feel Options:</label>
                            <textarea class="random-option-input" data-variable="feel" placeholder="Enter comma-separated options for feel..."></textarea>
                            <div class="option-count-group">
                                <span class="option-count-label">Number to use:</span>
                                <input type="number" class="option-count-input" data-variable="feel" value="1" min="1" max="10">
                            </div>
                        </div>
                        <div class="option-group">
                            <label class="random-option-label">Text1 Options:</label>
                            <textarea class="random-option-input" data-variable="text1" placeholder="Enter comma-separated options for text1..."></textarea>
                            <div class="option-count-group">
                                <span class="option-count-label">Number to use:</span>
                                <input type="number" class="option-count-input" data-variable="text1" value="1" min="1" max="10">
                            </div>
                        </div>
                        <div class="option-group">
                            <label class="random-option-label">Text2 Options:</label>
                            <textarea class="random-option-input" data-variable="text2" placeholder="Enter comma-separated options for text2..."></textarea>
                            <div class="option-count-group">
                                <span class="option-count-label">Number to use:</span>
                                <input type="number" class="option-count-input" data-variable="text2" value="1" min="1" max="10">
                            </div>
                        </div>
                        <div class="option-group">
                            <label class="random-option-label">Text3 Options:</label>
                            <textarea class="random-option-input" data-variable="text3" placeholder="Enter comma-separated options for text3..."></textarea>
                            <div class="option-count-group">
                                <span class="option-count-label">Number to use:</span>
                                <input type="number" class="option-count-input" data-variable="text3" value="1" min="1" max="10">
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="preview-container">
                    <div class="preview-header">
                        <h3>Preview</h3>
                    </div>
                    <div class="preview-content">
                        Preview will appear here...
                    </div>
                </div>
            </div>
        `;
    }

    handleInput() {
        this.updateRandomOptionVisibility();
        this.validateTemplate();
        this.processPreview();
        this.analyzeColorPalette();
        
        // Dispatch change event
        this.dispatchEvent(new CustomEvent('template-changed', {
            detail: {
                template: this.getTemplateText()
            }
        }));
    }

    insertVariable(variable) {
        const start = this.templateInput.selectionStart;
        const end = this.templateInput.selectionEnd;
        const text = this.templateInput.value;
        const before = text.substring(0, start);
        const after = text.substring(end);
        
        this.templateInput.value = `${before}[${variable}]${after}`;
        this.templateInput.focus();
        this.templateInput.selectionStart = start + variable.length + 2;
        this.templateInput.selectionEnd = start + variable.length + 2;
        
        this.processPreview();
        this.analyzeColorPalette();
    }

    processPreview() {
        let content = this.templateInput.value;
        const previewContent = this.shadowRoot.querySelector('.preview-content');
        
        if (!previewContent) return;
        
        // Replace variables with sample values or random options if available
        const variableRegex = /{([^{}]+)}/g;
        let processedText = content;
        
        // Replace variables with styled spans
        processedText = processedText.replace(variableRegex, (match, variable) => {
            return `<span class="variable">${match}</span>`;
        });
        
        previewContent.innerHTML = processedText || 'Preview will appear here...';
        
        // Analyze color palette
        this.analyzeColorPalette();
    }

    updateRandomOptionVisibility() {
        // Extract all variables from the template
        const content = this.templateInput.value;
        const variableMatches = content.match(/\[([^\]]+)\]/g) || [];
        const usedVariables = variableMatches.map(match => match.slice(1, -1));
        
        // Show/hide random option groups based on used variables
        const randomOptionGroups = this.shadowRoot.querySelectorAll('.option-group');
        randomOptionGroups.forEach(group => {
            const label = group.querySelector('.random-option-label');
            const input = group.querySelector('.random-option-input');
            
            if (label && input) {
                const variable = input.dataset.variable;
                
                // Always show text1, text2, text3 as they are required
                if (['text1', 'text2', 'text3'].includes(variable)) {
                    group.style.display = 'flex';
                } else {
                    // For other variables, only show if they're used in the template
                    group.style.display = usedVariables.includes(variable) ? 'flex' : 'none';
                }
            }
        });
        
        // If there are no visible groups (other than text1, text2, text3), show a message
        const visibleCustomGroups = Array.from(randomOptionGroups).filter(group => {
            const input = group.querySelector('.random-option-input');
            return input && !['text1', 'text2', 'text3'].includes(input.dataset.variable) && group.style.display !== 'none';
        });
        
        const noCustomVariablesMessage = this.shadowRoot.querySelector('.no-custom-variables-message');
        if (noCustomVariablesMessage) {
            noCustomVariablesMessage.style.display = visibleCustomGroups.length === 0 ? 'block' : 'none';
        }
    }

    toggleRandomOptions() {
        if (this.randomOptionsContent) {
            const currentDisplay = this.randomOptionsContent.style.display;
            // If display is empty string or 'none', show the content, otherwise hide it
            const isVisible = currentDisplay !== 'none' && currentDisplay !== '';
            this.randomOptionsContent.style.display = isVisible ? 'none' : 'block';
            
            // Update the toggle button text/icon if needed
            if (this.randomOptionsToggle) {
                const icon = this.randomOptionsToggle.querySelector('i');
                if (icon) {
                    // Keep the icon but update the text
                    const text = this.randomOptionsToggle.textContent.replace(icon.textContent, '').trim();
                    this.randomOptionsToggle.innerHTML = `<i class="fas fa-random"></i> ${isVisible ? 'Random Options' : 'Hide Random Options'}`;
                } else {
                    this.randomOptionsToggle.textContent = isVisible ? 'Random Options' : 'Hide Random Options';
                }
            }
        }
    }

    analyzeColorPalette() {
        if (this.colorPaletteExtractor) {
            const templateText = this.templateInput.value;
            this.colorPaletteExtractor.analyzePrompt(templateText);
        }
    }

    validateTemplate() {
        const content = this.templateInput.value;
        const requiredVars = ['object', 'text1', 'text2', 'text3'];
        const missingVars = requiredVars.filter(v => !content.includes(`[${v}]`));
        
        if (missingVars.length > 0) {
            this.validationMessage.textContent = `Missing required variables: ${missingVars.join(', ')}`;
            this.validationMessage.className = 'validation-message error';
            return false;
        } else {
            this.validationMessage.textContent = 'Template is valid';
            this.validationMessage.className = 'validation-message success';
            return true;
        }
    }

    dispatchChangeEvent() {
        this.dispatchEvent(new CustomEvent('change', {
            bubbles: true,
            composed: true,
            detail: {
                value: this.value,
                randomOptions: this.getRandomOptions()
            }
        }));
    }

    getTemplateText() {
        return this.templateInput ? this.templateInput.value : '';
    }

    getTemplateData() {
        const template = this.templateInput.value;
        
        // Get random options
        const randomOptions = {};
        this.randomOptionInputs.forEach(input => {
            const variable = input.dataset.variable;
            const value = input.value.trim();
            if (value) {
                randomOptions[variable] = value.split(',').map(item => item.trim()).filter(item => item);
            }
        });
        
        // Get option counts
        const optionCounts = {};
        this.optionCountInputs.forEach(input => {
            const variable = input.dataset.variable;
            const count = parseInt(input.value);
            if (!isNaN(count) && count > 0) {
                optionCounts[variable] = count;
            }
        });
        
        return {
            template,
            randomOptions,
            optionCounts
        };
    }

    getRandomOptions() {
        const options = {};
        this.randomOptionInputs.forEach(input => {
            const variable = input.dataset.variable;
            const value = input.value.trim();
            if (value) {
                options[variable] = value.split(',').map(opt => opt.trim()).filter(opt => opt);
            }
        });
        return options;
    }

    setRandomOptions(options) {
        if (!options) return;
        
        this.randomOptionInputs.forEach(input => {
            const variable = input.dataset.variable;
            if (options[variable]) {
                input.value = Array.isArray(options[variable]) 
                    ? options[variable].join(', ') 
                    : options[variable];
            }
        });
    }

    loadRandomOptions(options) {
        // This method is essentially the same as setRandomOptions
        // but kept separate for clarity and potential future differences
        if (!options) return;
        
        this.randomOptionInputs.forEach(input => {
            const variable = input.dataset.variable;
            if (options[variable]) {
                input.value = Array.isArray(options[variable]) 
                    ? options[variable].join(', ') 
                    : options[variable];
            }
        });
        
        // Update the UI to show the random options section if it contains data
        if (Object.keys(options).length > 0 && this.randomOptionsContent) {
            this.randomOptionsContent.style.display = 'block';
        }
    }

    loadTemplate(template) {
        if (!template) return;
        
        this.templateId = template.id;
        this.templateName = template.name;
        
        // Set template text
        this.templateInput.value = template.prompt || '';
        
        // Set random options if available
        if (template.randomOptions) {
            this.randomOptionsToggle.click(); // Show random options
            
            // Set each random option
            Object.entries(template.randomOptions).forEach(([variable, options]) => {
                const input = this.shadowRoot.querySelector(`.random-option-input[data-variable="${variable}"]`);
                if (input && Array.isArray(options)) {
                    input.value = options.join(', ');
                }
            });
        }
        
        // Set option counts if available
        if (template.optionCounts) {
            Object.entries(template.optionCounts).forEach(([variable, count]) => {
                const input = this.shadowRoot.querySelector(`.option-count-input[data-variable="${variable}"]`);
                if (input && !isNaN(count)) {
                    input.value = count;
                }
            });
        }
        
        // Update preview
        this.processPreview();
        this.analyzeColorPalette();
        
        // Load random options if available
        if (template.randomOptions) {
            this.loadRandomOptions(template.randomOptions);
        }
    }
}

customElements.define('prompt-template-editor', PromptTemplateEditor);

export { PromptTemplateEditor };

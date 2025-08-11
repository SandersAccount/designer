class TextList extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.texts = [];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    get value() {
        return this.texts
            .filter(text => text.trim())  // Remove empty texts
            .map(text => `"${text.trim()}"`)  // Add quotes around each text
            .join(' and the text ');
    }

    get text1() {
        return this.texts[0] || '';
    }

    get text2() {
        return this.texts[1] || '';
    }

    get text3() {
        return this.texts[2] || '';
    }

    get textArray() {
        return this.texts.filter(text => text.trim());
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    margin: 1rem 0;
                }
                .text-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .text-item {
                    display: flex;
                    gap: 0.5rem;
                    align-items: center;
                    position: relative;
                }
                .text-item::before {
                    content: '';
                    display: none;
                }
                input {
                    flex: 1;
                    padding: 0.75rem;
                    border: 1px solid #d1d5db;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    background: #ffffff;
                    color: #374151;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                input:focus {
                    outline: none;
                    border-color: #6366f1;
                    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
                }
                input::placeholder {
                    color: #9ca3af;
                }
                button {
                    padding: 0.5rem 1rem;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.8rem;
                    font-weight: 500;
                    transition: all 0.2s;
                }
                .remove-btn {
                    background: #ef4444;
                    color: white;
                }
                .remove-btn:hover {
                    background: #dc2626;
                }
                .add-btn {
                    background: #ffffff;
                    border: 1px solid #d1d5db;
                    color: #6b7280;
                    margin-top: 0.75rem;
                    padding: 0.75rem 1rem;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    width: 100%;
                }
                .add-btn:hover {
                    background: #f9fafb;
                    border-color: #9ca3af;
                    color: #374151;
                }
                .preview {
                    margin-top: 1rem;
                    padding: 1rem;
                    background: #f3f4f6;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    font-style: italic;
                    color: #6b7280;
                    font-size: 0.9rem;
                }
                .text-item:nth-child(1) input {
                    border-left: 4px solid #4287f5;
                }
                .text-item:nth-child(2) input {
                    border-left: 4px solid #42f5ad;
                }
                .text-item:nth-child(3) input {
                    border-left: 4px solid #f542a7;
                }
            </style>
            <div class="text-list">
                <div class="text-item">
                    <input type="text" placeholder="Enter text 1...">
                    <button class="remove-btn">Remove</button>
                </div>
            </div>
            <button class="add-btn">
                <i class="fas fa-plus"></i>
                Add Another Text
            </button>
            <div class="preview">
                Preview: <span class="preview-text"></span>
            </div>
        `;
    }

    setupEventListeners() {
        // Add text button
        this.shadowRoot.querySelector('.add-btn').addEventListener('click', () => {
            const textList = this.shadowRoot.querySelector('.text-list');
            const currentItems = textList.querySelectorAll('.text-item');
            
            // Limit to 3 text inputs
            if (currentItems.length >= 3) {
                return;
            }
            
            const newItem = document.createElement('div');
            newItem.className = 'text-item';
            
            // Set the appropriate label based on the current count
            const textNumber = currentItems.length + 1;
            newItem.innerHTML = `
                <input type="text" placeholder="Enter text ${textNumber}...">
                <button class="remove-btn">Remove</button>
            `;
            textList.appendChild(newItem);
            this.updateEventListeners();
            this.updateLabels();
        });

        this.updateEventListeners();
        this.updateLabels();
    }

    updateEventListeners() {
        // Remove buttons
        this.shadowRoot.querySelectorAll('.remove-btn').forEach(btn => {
            btn.onclick = (e) => {
                const items = this.shadowRoot.querySelectorAll('.text-item');
                if (items.length > 1) {
                    e.target.closest('.text-item').remove();
                    this.updateTexts();
                    this.updateLabels(); // Update labels after removing an item
                }
            };
        });

        // Text inputs
        this.shadowRoot.querySelectorAll('input').forEach(input => {
            input.oninput = () => this.updateTexts();
        });
    }

    updateLabels() {
        // Update the labels for each text input
        const inputs = this.shadowRoot.querySelectorAll('.text-item input');
        inputs.forEach((input, index) => {
            input.placeholder = `Enter text ${index + 1}...`;
        });
    }

    updateTexts() {
        this.texts = Array.from(this.shadowRoot.querySelectorAll('input'))
            .map(input => input.value.trim());
        
        // Update preview
        const preview = this.shadowRoot.querySelector('.preview-text');
        preview.textContent = this.value;

        // Dispatch change event
        this.dispatchEvent(new CustomEvent('change', {
            detail: { value: this.value },
            bubbles: true,
            composed: true
        }));
    }
}

customElements.define('text-list', TextList);

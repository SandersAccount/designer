import { Toast, showToast } from './components/Toast.js';
import TextMode from './textMode.js';
import { CanvasZoom } from './canvasZoom.js';

export function initializeTextEditor() {
    const canvas = document.getElementById('editor-canvas');
    const textMode = new TextMode(canvas);
    
    // Set canvas size
    canvas.width = 2048;
    canvas.height = 2048;

    // Initialize zoom
    const canvasWrapper = document.querySelector('.canvas-wrapper');
    const canvasZoom = new CanvasZoom(canvas, canvasWrapper);

    // Text input handlers
    const textInput = document.getElementById('textInput');
    const addTextBtn = document.getElementById('addTextBtn');
    const fontSelect = document.getElementById('fontSelect');
    
    // Initialize font menu
    generateFontMenu();

    // Add text button handler
    if (addTextBtn) {
        addTextBtn.addEventListener('click', () => {
            const x = canvas.width / 2;
            const y = canvas.height / 2;
            const text = textInput.value.trim() || 'Sample Text';
            textMode.addText(text, x, y);
            showToast('Text added');
        });
    }

    // Font selection handler
    if (fontSelect) {
        fontSelect.addEventListener('change', () => {
            if (textMode.selectedText) {
                textMode.updateSelectedText({
                    fontFamily: fontSelect.value
                });
                showToast('Font updated');
            }
        });
    }

    // Double click to add text
    canvas.addEventListener('dblclick', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (textMode.selectedText) {
            const newText = prompt('Edit text:', textMode.selectedText.text);
            if (newText) {
                textMode.updateSelectedText({ text: newText });
                showToast('Text updated');
            }
            return;
        }
        
        const newText = prompt('Enter text:');
        if (newText) {
            textMode.addText(newText, x, y);
            showToast('Text added');
        }
    });

    return { textMode, canvasZoom };
}

function generateFontMenu() {
    const fonts = [
        "Angeline Regular",
        "Arial",
        "Arial Black",
        "Comic Sans MS",
        "Courier New",
        "Georgia",
        "Impact",
        "Times New Roman",
        "Trebuchet MS",
        "Verdana"
    ];

    const fontSelect = document.getElementById('fontSelect');
    if (!fontSelect) return;

    fonts.forEach(font => {
        const option = document.createElement('option');
        option.value = font;
        option.textContent = font;
        option.style.fontFamily = font;
        fontSelect.appendChild(option);
    });
}

class StickerEditor {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.textObjects = [];
        this.selectedText = null;
        this.isDragging = false;
        this.isDrawing = false;
        this.isPicking = false;
        this.currentColor = '#ffffff';
        this.brushSize = 10;
        this.lastX = 0;
        this.lastY = 0;
        this.scale = 1;
        this.baseImage = null;
        this.currentImage = null;
        this.loadedFonts = new Set();
        this.isPaintMode = false;
        this.isInpaintingMode = false;
        this.showSelectionOutline = true;
        
        // Font filename mapping
        this.fontFiles = {
            
          "Angeline Regular": "angeline.ttf",
          "Hartone Regular": "Hartone Softed.ttf",
          "Airstrike": "airstrike.ttf",
          "Lemon Milk": "lemonmilk.ttf",
          "Super Bubble": "Super Bubble.ttf",
          "Grobold": "GROBOLD.ttf",
          "Godzilla": "Godzilla.ttf",
          "Insaniburger": "Insanibc.ttf",
          "Forky": "1. Forky.ttf",
          "Commando": "commando.ttf",
          "Borgsquad": "borgsquad.ttf",
          "Snickers": "SNICN___.TTF",
          "Roboto Black": "Roboto-Black.ttf",
          "Super Cartoon": "Super Cartoon.ttf",
          "Heavitas": "Heavitas.ttf",
          "Starborn": "Starborn.ttf"

        };
        
        // Get available fonts from CSS
        const fontList = getComputedStyle(document.documentElement)
            .getPropertyValue('--available-fonts')
            .split(',')
            .map(font => font.trim().replace(/['"]/g, ''));
        
        this.defaultFont = fontList[0]; // Use first font as default
        this.availableFonts = fontList;
        
        // Initialize canvas size
        this.resizeCanvas();
        
        // Initialize UI
        this.initializeEventListeners();
        this.setupImageUpload();
        this.setupSliders();
        this.setupColorPickers();
        this.setupFontMenuEvents();
        this.setupCanvasMenu();
        this.generateFontMenu(); // Generate font menu after setting up events
        this.setupBrushTools();
        this.setupInpaintingMode();
        
        // Load inpainting models
        this.loadInpaintingModels();
        
        // Create cursor preview layer
        this.cursorLayer = document.createElement('canvas');
        this.cursorLayer.style.position = 'fixed';
        this.cursorLayer.style.pointerEvents = 'none';
        this.cursorCtx = this.cursorLayer.getContext('2d');
        
        // Add cursor layer to canvas container
        const canvasContainer = canvas.parentElement;
        canvasContainer.style.position = 'relative';
        canvasContainer.appendChild(this.cursorLayer);
        
        // Add mousemove listener for cursor preview
        this.canvas.addEventListener('mousemove', this.updateBrushPreview.bind(this));
        this.canvas.addEventListener('mouseenter', () => {
            this.cursorLayer.style.display = 'block';
        });
        this.canvas.addEventListener('mouseleave', () => {
            this.cursorLayer.style.display = 'none';
        });
        
        // Try to load fonts in the background
        this.loadFonts().then(() => {
            // Add default text with specific properties after fonts are loaded
        
            
            // Update UI with default text
         
            
        
        });

        // Get initial image URL from query params
        const urlParams = new URLSearchParams(window.location.search);
        const imageUrl = urlParams.get('image');
        if (imageUrl) {
            this.loadImageFromUrl(imageUrl);
        }
        
        // Listen for inpainting image updates
        canvas.addEventListener('imageUpdated', (event) => {
            // Get the new image URL from the event
            const newImageUrl = event.detail.imageUrl;
            
            // Update the URL without refreshing the page
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('image', newImageUrl);
            window.history.pushState({ path: newUrl.href }, '', newUrl.href);
            
            // Update the canvas and sticker data
            this.loadImageFromUrl(newImageUrl);
            
            if (window.currentSticker) {
                window.currentSticker.imageData = newImageUrl;
            }
        });
        
        // Create paint layer
        this.paintLayer = document.createElement('canvas');
        this.paintLayer.width = canvas.width;
        this.paintLayer.height = canvas.height;
        this.paintCtx = this.paintLayer.getContext('2d');
        
        // Initialize mode manager
        this.modeManager = new EditorModeManager(this);
    }

    async loadImageFromUrl(imageUrl) {
        try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            await new Promise((resolve, reject) => {
                img.onload = () => {
                    // Store original dimensions
                    img.originalWidth = img.width;
                    img.originalHeight = img.height;
                    
                    // Create a deep copy for the base image
                    const baseImg = new Image();
                    baseImg.src = img.src;
                    baseImg.crossOrigin = 'anonymous';
                    baseImg.originalWidth = img.originalWidth;
                    baseImg.originalHeight = img.originalHeight;
                    
                    // Store both as current and base image
                    this.currentImage = img;
                    this.baseImage = baseImg;
                    
                    // Resize canvas to match image
                    this.canvas.width = img.width;
                    this.canvas.height = img.height;
                    this.paintLayer.width = img.width;
                    this.paintLayer.height = img.height;
                    this.redraw();
                    resolve();
                };
                img.onerror = reject;
                img.src = imageUrl;
            });
        } catch (error) {
            console.error('Error loading image:', error);
        }
    }

    setupSliders() {
        // Font size inpu   
    }

    setupColorPickers() {
        // Text color picker
        const textColorPicker = document.getElementById('textColorPicker')
    }
    setupFontMenuEvents() {
        const fontMenu = document.getElementById('fontMenu');
        const fontMenuHeader = document.getElementById('fontMenuHeader');
        // Close font menu when clicking outside
        document.addEventListener('click', (e) => {
            if (fontMenu) {
                fontMenu.classList.remove('show');
            }
        });
    }

    setupCanvasMenu() {
        // Get menu buttons
        const upscaleBtn = document.getElementById('upscaleBtn');
        const addToCollectionBtn = document.getElementById('addToCollectionBtn');
        const downloadBtn = document.getElementById('downloadBtn');
        const bgRemoveBtn = document.getElementById('bgRemoveBtn');
        const deleteBtn = document.getElementById('deleteBtn');

        // Upscale functionality
        upscaleBtn?.addEventListener('click', async () => {
            try {
                upscaleBtn.disabled = true;
                const loadingHtml = `
                    <img src="/images/ph--arrow-square-up-right-light.svg" alt="Upscale" />
                    Upscaling...
                `;
                upscaleBtn.innerHTML = loadingHtml;

                // Convert canvas to data URL without selection outline
                const imageData = await this.captureCanvas();
                
                // Upload the image first
                const formData = new FormData();
                formData.append('image', await (await fetch(imageData)).blob());
                
                const uploadResponse = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });
                
                if (!uploadResponse.ok) {
                    throw new Error('Failed to upload image');
                }
                
                const responseData = await uploadResponse.json();
                console.log('Upload response:', responseData);
                const { imageUrl } = responseData;
                console.log('Image URL:', imageUrl);

                // Now upscale the uploaded image
                const response = await fetch('/api/images/upscale', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ imageUrl })
                });

                if (!response.ok) {
                    throw new Error('Failed to upscale image');
                }

                const data = await response.json();
                
                // Load the upscaled image back to canvas
                await this.loadImageFromUrl(data.imageUrl);
                
                // Reset button
                upscaleBtn.disabled = false;
                upscaleBtn.innerHTML = `
                    <img src="/images/ph--arrow-square-up-right-light.svg" alt="Upscale" />
                    Upscale Image
                `;
            } catch (error) {
                console.error('Error upscaling image:', error);
                this.showToastMessage(error.message, 'error');
                upscaleBtn.disabled = false;
                upscaleBtn.innerHTML = `
                    <img src="/images/ph--arrow-square-up-right-light.svg" alt="Upscale" />
                    Upscale Image
                `;
            }
        });

        // Add to collection functionality
        addToCollectionBtn?.addEventListener('click', async () => {
            try {
                console.log('Adding to collection...');
                // Convert canvas to data URL without selection outline
                const imageData = await this.captureCanvas();
                console.log('Image data URL length:', imageData.length);
                
                // Upload the image first
                const formData = new FormData();
                const blob = await (await fetch(imageData)).blob();
                console.log('Blob created:', blob);
                formData.append('image', blob);
                
                console.log('Uploading image...');
                const uploadResponse = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });
                
                console.log('Upload response status:', uploadResponse.status);
                
                if (!uploadResponse.ok) {
                    throw new Error('Failed to upload image');
                }
                
                const responseData = await uploadResponse.json();
                console.log('Upload response:', responseData);
                
                if (!responseData || !responseData.imageUrl) {
                    throw new Error('Invalid response from server');
                }
                
                const imageUrl = responseData.imageUrl;
                console.log('Image URL:', imageUrl);

                // Show collection modal
                const collectionModal = document.querySelector('collection-modal');
                console.log('Collection modal:', collectionModal);
                
                if (collectionModal) {
                    console.log('Setting image data on collection modal');
                    collectionModal.setImageData(imageUrl);
                    console.log('Showing collection modal');
                    collectionModal.show();
                } else {
                    throw new Error('Collection modal not found');
                }
            } catch (error) {
                console.error('Error adding to collection:', error);
                this.showToastMessage(error.message, 'error');
            }
        });

        // Download functionality
        downloadBtn?.addEventListener('click', async () => {
            try {
                const link = document.createElement('a');
                link.download = `sticker-${Date.now()}.png`;
                // Get canvas data URL without selection outline
                link.href = await this.captureCanvas();
                link.click();
            } catch (error) {
                console.error('Error downloading image:', error);
                this.showToastMessage(error.message, 'error');
            }
        });

        // Background removal functionality
        bgRemoveBtn?.addEventListener('click', async () => {
            try {
                bgRemoveBtn.disabled = true;
                const loadingHtml = `
                    <img src="/images/ph--images-square-light.svg" alt="BG Remove" />
                    Removing BG...
                `;
                bgRemoveBtn.innerHTML = loadingHtml;

                // Convert canvas to data URL without selection outline
                const imageData = await this.captureCanvas();
                
                // Upload the image first
                const formData = new FormData();
                formData.append('image', await (await fetch(imageData)).blob());
                
                const uploadResponse = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });
                
                if (!uploadResponse.ok) {
                    throw new Error('Failed to upload image');
                }
                
                const responseData = await uploadResponse.json();
                console.log('Upload response:', responseData);
                const { imageUrl } = responseData;
                console.log('Image URL:', imageUrl);

                // Now remove background
                const response = await fetch('/api/images/bgremove', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ imageUrl })
                });

                if (!response.ok) {
                    throw new Error('Failed to remove background');
                }

                const data = await response.json();
                
                // Load the processed image back to canvas
                await this.loadImageFromUrl(data.imageUrl);
                
                // Reset button
                bgRemoveBtn.disabled = false;
                bgRemoveBtn.innerHTML = `
                    <img src="/images/ph--images-square-light.svg" alt="BG Remove" />
                    BG Remove
                `;
            } catch (error) {
                console.error('Error removing background:', error);
                this.showToastMessage(error.message, 'error');
                bgRemoveBtn.disabled = false;
                bgRemoveBtn.innerHTML = `
                    <img src="/images/ph--images-square-light.svg" alt="BG Remove" />
                    BG Remove
                `;
            }
        });

        // Delete functionality
        deleteBtn?.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear the canvas?')) {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.paintCtx.clearRect(0, 0, this.paintLayer.width, this.paintLayer.height);
                this.baseImage = null;
                this.textObjects = [];
                this.selectedText = null;
                this.render();
            }
        });
    }

    setupBrushTools() {

        // Canvas drawing events
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));
    }

    setupInpaintingMode() {
        const applyInpaintingBtn = document.getElementById('applyInpaintingBtn');
        if (!applyInpaintingBtn) return;

        // Setup brush size slider
        const brushSizeSlider = document.getElementById('brushSizeSlider');
        const brushSizeValue = document.getElementById('brushSizeValue');
        
        if (brushSizeSlider && brushSizeValue) {
            // Initialize with current value
            this.brushSize = parseInt(brushSizeSlider.value);
            brushSizeValue.textContent = this.brushSize;
            
            // Add event listener to update brush size when slider changes
            brushSizeSlider.addEventListener('input', (e) => {
                const newSize = parseInt(e.target.value);
                this.brushSize = newSize;
                brushSizeValue.textContent = newSize;
                console.log('Brush size updated to:', newSize);
            });
        }

        // Handle apply inpainting
        applyInpaintingBtn.addEventListener('click', async () => {
            const modelSelect = document.getElementById('inpaintingModelSelect');
            const inpaintingPrompt = document.getElementById('inpaintingPrompt');
            
            if (!modelSelect || !modelSelect.value) {
                this.showToastMessage('Please select an inpainting model', 'error');
                return;
            }

            if (!inpaintingPrompt || !inpaintingPrompt.value.trim()) {
                this.showToastMessage('Please enter a prompt for inpainting', 'error');
                return;
            }

            try {
                const modelConfig = JSON.parse(modelSelect.selectedOptions[0].dataset.model);
                const mask = this.getMaskData(); // Use getMaskData instead of direct canvas data
                const imageData = this.getImageData();

                // Create preview elements
                const previewContainer = document.createElement('div');
                previewContainer.style.position = 'fixed';
                previewContainer.style.top = '10px';
                previewContainer.style.right = '10px';
                previewContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                previewContainer.style.padding = '10px';
                previewContainer.style.borderRadius = '5px';
                previewContainer.style.zIndex = '1000';

                const imagePreview = document.createElement('div');
                imagePreview.innerHTML = `<p style="color: white; margin: 5px;">Original Image:</p>
                    <img src="${imageData}" style="max-width: 200px; margin: 5px;" />`;
                
                const maskPreview = document.createElement('div');
                maskPreview.innerHTML = `<p style="color: white; margin: 5px;">Mask:</p>
                    <img src="${mask}" style="max-width: 200px; margin: 5px;" />`;

                previewContainer.appendChild(imagePreview);
                previewContainer.appendChild(maskPreview);
                document.body.appendChild(previewContainer);

                // Log the request data
                console.log('Sending inpainting request:', {
                    modelId: modelConfig.id,
                    prompt: inpaintingPrompt.value.trim()
                });

                // Send the inpainting request to the backend
                const response = await fetch('/api/inpainting', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        image: imageData,
                        mask: mask,
                        modelId: modelConfig.id,
                        prompt: inpaintingPrompt.value.trim()
                    })
                });

                if (!response.ok) {
                    const errorResponse = await response.json().catch(() => ({ error: response.statusText }));
                    const errorMessage = errorResponse.details || errorResponse.error || response.statusText;
                    
                    console.error('Inpainting API error:', errorResponse);
                    
                    // Display more user-friendly error message
                    let userMessage = `Inpainting failed: ${errorMessage}`;
                    
                    // Add suggestion if available
                    if (errorResponse.suggestion) {
                        userMessage += `\n\nSuggestion: ${errorResponse.suggestion}`;
                    }
                    
                    // If it's a Flux Fill Pro specific error, add more context
                    if (errorResponse.modelUsed && errorResponse.modelUsed.includes('flux-fill-pro')) {
                        userMessage += '\n\nTrying a different model might resolve this issue.';
                    }
                    
                    throw new Error(userMessage);
                }

                const result = await response.json();
                
                if (!result.url) {
                    throw new Error('No result URL received from the server');
                }

                // Check if a different model was used than requested
                if (result.model && modelConfig.id !== result.model) {
                    this.showToastMessage(`Note: Used ${result.model} model instead of ${modelConfig.id} due to compatibility issues.`, 'info');
                    console.log(`Fallback model used: ${result.model} instead of ${modelConfig.id}`);
                }
                
                // Load the result image from B2
                await this.loadImageFromUrl(result.url);
                
                // Remove preview after success
                previewContainer.remove();

                // Reset inpainting mode
                this.isInpaintingMode = false;
                const inpaintingModeBtn = document.getElementById('inpaintingModeBtn');
                if (inpaintingModeBtn) {
                    inpaintingModeBtn.classList.remove('active');
                }
                
                // Clear the paint layer
                this.paintCtx.clearRect(0, 0, this.paintLayer.width, this.paintLayer.height);
                
                this.showToastMessage('Inpainting completed successfully!');
            } catch (error) {
                console.error('Error applying inpainting:', error);
                this.showToastMessage(`Error: ${error.message}`, 'error');
            }
        });
    }

    getMaskData() {
        // Create a temporary canvas for the mask
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d');

        // Fill with black background
        tempCtx.fillStyle = '#000000';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // Draw the paint layer in white
        tempCtx.globalCompositeOperation = 'source-over';
        tempCtx.fillStyle = '#ffffff';
        tempCtx.drawImage(this.paintLayer, 0, 0);

        return tempCanvas.toDataURL('image/png');
    }

    getImageData() {
        // Create a temporary canvas to draw just the image
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Draw only the base image
        if (this.baseImage) {
            tempCtx.drawImage(this.baseImage, 0, 0, tempCanvas.width, tempCanvas.height);
        }
        
        return tempCanvas.toDataURL('image/png');
    }

    clearMask() {
        this.paintCtx.clearRect(0, 0, this.paintLayer.width, this.paintLayer.height);
        this.redraw();
    }

    updateSelectedFont(fontName) {
        const fontMenuHeader = document.getElementById('fontMenuHeader');
        if (fontMenuHeader) {
            fontMenuHeader.setAttribute('data-selected-font', fontName);
            const selectedFontSpan = fontMenuHeader.querySelector('.selected-font');
            if (selectedFontSpan) {
                selectedFontSpan.textContent = fontName;
                selectedFontSpan.style.fontFamily = `'${fontName}', var(--fallback-display)`;
            }
        }
    }

    generateFontMenu() {
        const fontMenu = document.getElementById('fontMenu');
        const fontMenuHeader = document.getElementById('fontMenuHeader');
        
        if (!fontMenu || !fontMenuHeader) return;
        
        // Clear existing content
        fontMenu.innerHTML = '';
        
        // Set default font in header
        this.updateSelectedFont(this.defaultFont);
        
        // Generate font options
        this.availableFonts.forEach(fontName => {
            const option = document.createElement('div');
            option.className = 'font-option';
            option.setAttribute('data-font', fontName);
            
            // Create preview text element
            const preview = document.createElement('span');
            preview.className = 'preview-text';
            preview.textContent = 'Sample Text';
            preview.style.fontFamily = `'${fontName}', var(--fallback-display)`;
            
            // Create font name element
            const name = document.createElement('span');
            name.className = 'font-name';
            name.textContent = fontName;
            
            option.appendChild(preview);
            option.appendChild(name);
            fontMenu.appendChild(option);
        });
    }

    async loadFonts() {
        try {
            // Load all available fonts
            const fontPromises = this.availableFonts.map(async fontName => {
                try {
                    const filename = this.fontFiles[fontName];
                    if (!filename) {
                        console.warn(`No filename mapping for font: ${fontName}`);
                        return;
                    }
                    
                    // Create and load the font
                    const font = new FontFace(fontName, `url('/fonts/${filename}')`);
                    await font.load();
                    document.fonts.add(font);
                    this.loadedFonts.add(fontName);
                    console.log(`Loaded font: ${fontName}`);
                    
                    // Update the font menu after each font is loaded
                    if (document.getElementById('fontMenu')) {
                        this.generateFontMenu();
                    }
                } catch (fontError) {
                    console.warn(`Failed to load font ${fontName}:`, fontError);
                }
            });

            // Wait for all fonts to load
            await Promise.all(fontPromises);
            
            // Additional check specifically for Heavitas
            if (!document.fonts.check('12px Heavitas')) {
                console.warn('Heavitas font not loaded, retrying...');
                const heavitasFont = new FontFace('Heavitas', `url('/fonts/Heavitas.ttf')`);
                await heavitasFont.load();
                document.fonts.add(heavitasFont);
            }
        } catch (error) {
            console.error('Error in loadFonts:', error);
        }
    }

    initializeEventListeners() {
        // Add text button
        const addTextBtn = document.getElementById('addTextBtn');
        if (addTextBtn) {
            addTextBtn.addEventListener('click', () => this.addText());
        }

        // Text input change listener
        const textInput = document.getElementById('textInput');
        if (textInput) {
            textInput.addEventListener('input', () => {
                if (this.selectedText) {
                    this.selectedText.text = textInput.value;
                    this.redraw();
                }
            });
        }

        // Delete text button
        const deleteTextBtn = document.getElementById('deleteTextBtn');
        if (deleteTextBtn) {
            deleteTextBtn.addEventListener('click', () => {
                if (this.selectedText) {
                    const index = this.textObjects.indexOf(this.selectedText);
                    if (index > -1) {
                        this.textObjects.splice(index, 1);
                        this.selectedText = null;
                        this.redraw();
                    }
                }
            });
        }

        // Export button
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', async () => {
                try {
                    // Draw without selection box
                    this.redraw(true);
                    
                    // Get the canvas data URL
                    const dataUrl = this.canvas.toDataURL('image/png');
                    
                    // Create download link
                    const a = document.createElement('a');
                    a.href = dataUrl;
                    a.download = `sticker-${Date.now()}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                } catch (error) {
                    console.error('Error exporting image:', error);
                    this.showToastMessage(error.message, 'error');
                } finally {
                    // Redraw with selection box if needed
                    this.redraw();
                }
            });
        }

        // Canvas event listeners
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());

        // Window resize
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    setupImageUpload() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        this.baseImage = img;
                        this.resizeCanvas(); // This will now use the original dimensions
                        this.redraw();
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });

        const dropZone = document.getElementById('editor-canvas');
        if (dropZone) {
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.add('drag-over');
            });

            dropZone.addEventListener('dragleave', (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.remove('drag-over');
            });

            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.remove('drag-over');
                
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const img = new Image();
                        img.onload = () => {
                            this.baseImage = img;
                            this.resizeCanvas();
                            this.redraw();
                        };
                        img.src = event.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    }

    resizeCanvas() {
        if (this.baseImage) {
            // Use original dimensions from the base image
            this.canvas.width = this.baseImage.originalWidth;
            this.canvas.height = this.baseImage.originalHeight;
            this.paintLayer.width = this.canvas.width;
            this.paintLayer.height = this.canvas.height;
            this.cursorLayer.width = this.canvas.width;
            this.cursorLayer.height = this.canvas.height;
            this.cursorLayer.style.width = '100%';
            this.cursorLayer.style.height = '100%';
            if (this.currentImage) {
                this.paintCtx.drawImage(this.currentImage, 0, 0, this.canvas.width, this.canvas.height);
            }
            this.redraw();
        }
    }

    addText() {
        const text = document.getElementById('textInput').value || 'Sample Text';
        const textObj = {
            text: text,
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            font: this.defaultFont,
            fontSize: 48,
            color: '#ffffff',
            strokeWidth: 0,
            strokeColor: '#000000',
            warpBend: 0,
            letterSpacing: 10,
            isBold: false,
            isItalic: false,
            fontStyle: ''
        };

        this.textObjects.push(textObj);
        this.selectedText = textObj;
        this.updateUIControls();
        this.redraw();
    }

    updateUIControls() {
        if (!this.selectedText) return;

        // Update text input
        const textInput = document.getElementById('textInput');
        if (textInput) {
            textInput.value = this.selectedText.text;
        }

        // Update font size slider and value
        const fontSizeInput = document.getElementById('fontSizeInput');
        const fontSizeValue = fontSizeInput?.nextElementSibling;
        if (fontSizeInput) {
            fontSizeInput.value = this.selectedText.fontSize;
            if (fontSizeValue) {
                fontSizeValue.textContent = this.selectedText.fontSize;
            }
        }

        // Update stroke width slider and value
        const strokeWidthInput = document.getElementById('strokeWidthInput');
        const strokeWidthValue = strokeWidthInput?.nextElementSibling;
        if (strokeWidthInput) {
            strokeWidthInput.value = this.selectedText.strokeWidth;
            if (strokeWidthValue) {
                strokeWidthValue.textContent = this.selectedText.strokeWidth;
            }
        }

        // Update warp slider and value
        const warpBendInput = document.getElementById('warpBendInput');
        const warpBendValue = warpBendInput?.nextElementSibling;
        if (warpBendInput) {
            warpBendInput.value = this.selectedText.warpBend || 0;
            if (warpBendValue) {
                warpBendValue.textContent = (this.selectedText.warpBend || 0) + '%';
            }
        }

        // Update letter spacing slider and value
        const letterSpacingInput = document.getElementById('letterSpacingInput');
        const letterSpacingValue = letterSpacingInput?.nextElementSibling;
        if (letterSpacingInput) {
            letterSpacingInput.value = this.selectedText.letterSpacing || 10;
            if (letterSpacingValue) {
                letterSpacingValue.textContent = (this.selectedText.letterSpacing || 10) + '%';
            }
        }

        // Update color pickers
        const textColorPicker = document.getElementById('textColorPicker');
        if (textColorPicker) {
            textColorPicker.value = this.selectedText.color;
        }

        const strokeColorPicker = document.getElementById('strokeColorPicker');
        if (strokeColorPicker) {
            strokeColorPicker.value = this.selectedText.strokeColor;
        }

        // Update selected font
        this.updateSelectedFont(this.selectedText.font);
    }

    handleMouseDown(e) {
        const { x, y } = this.getMousePosition(e);
        
        // Deselect previous selection
        this.selectedText = null;
        
        // Check if clicked on any text object
        for (const textObj of this.textObjects) {
            // Set up text context for accurate measurements
            this.ctx.font = `${textObj.fontSize}px "${textObj.font}"`;
            const metrics = this.ctx.measureText(textObj.text);
            const height = textObj.fontSize;
            const width = metrics.width;
            
            // Add some padding to make it easier to click
            const padding = 20;
            
            // Check if click is within text bounds
            if (x >= textObj.x - width/2 - padding && 
                x <= textObj.x + width/2 + padding &&
                y >= textObj.y - height/2 - padding && 
                y <= textObj.y + height/2 + padding) {
                
                this.selectedText = textObj;
                this.isDragging = true;
                this.lastX = x - textObj.x;
                this.lastY = y - textObj.y;
                this.updateUIControls();
                break;
            }
        }
        
        this.redraw();
    }

    handleMouseMove(e) {
        if (this.isDragging && this.selectedText) {
            const { x, y } = this.getMousePosition(e);
            
            // Ensure text stays within canvas bounds
            const metrics = this.ctx.measureText(this.selectedText.text);
            const width = metrics.width;
            const height = this.selectedText.fontSize;
            const padding = 20;
            
            // Calculate bounds
            const minX = width/2 + padding;
            const maxX = this.canvas.width - width/2 - padding;
            const minY = height/2 + padding;
            const maxY = this.canvas.height - height/2 - padding;
            
            // Update position with bounds checking
            this.selectedText.x = Math.min(Math.max(x - this.lastX, minX), maxX);
            this.selectedText.y = Math.min(Math.max(y - this.lastY, minY), maxY);
            
            this.redraw();
        }
    }

    handleMouseUp() {
        this.isDragging = false;
    }

    getMousePosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        // Use clientX/Y for display coordinates (relative to viewport)
        const displayX = e.clientX - rect.left;
        const displayY = e.clientY - rect.top;
        
        // Calculate canvas coordinates
        const x = displayX * scaleX;
        const y = displayY * scaleY;
        
        return { x, y, displayX, displayY, scaleX, scaleY, clientX: e.clientX, clientY: e.clientY };
    }

    getCanvasPoint(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        // Use clientX/Y for display coordinates (relative to viewport)
        const displayX = e.clientX - rect.left;
        const displayY = e.clientY - rect.top;
        
        // Calculate canvas coordinates
        const x = displayX * scaleX;
        const y = displayY * scaleY;
        
        return { x, y, displayX, displayY, scaleX, scaleY, clientX: e.clientX, clientY: e.clientY };
    }

    async captureCanvas() {
        console.log('Capturing canvas...');
        // Hide selection outline
        const previousState = this.showSelectionOutline;
        this.showSelectionOutline = false;
        this.redraw();

        // Capture canvas state
        const imageData = this.canvas.toDataURL('image/png');
        console.log('Canvas captured, data URL length:', imageData.length);

        // Restore selection outline
        this.showSelectionOutline = previousState;
        this.redraw();

        return imageData;
    }

    redraw(forExport = false) {
        // Clear the canvas with high-DPI scaling preservation
        this.ctx.save();

        // Get the current scale factor (preserve high-DPI scaling)
        const transform = this.ctx.getTransform();
        const scaleFactor = transform.a; // Get the current scale factor

        // Reset transform to clear properly, but maintain the scale
        this.ctx.setTransform(scaleFactor, 0, 0, scaleFactor, 0, 0);

        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width / scaleFactor, this.canvas.height / scaleFactor);

        this.ctx.restore();
        
        // Draw the base image if it exists
        if (this.baseImage) {
            this.ctx.drawImage(this.baseImage, 0, 0, this.canvas.width, this.canvas.height);
        }
        
        // Draw paint layer
        if (this.paintLayer) {
            this.ctx.drawImage(this.paintLayer, 0, 0);
        }
        
        // Draw all text objects
        this.textObjects.forEach(textObj => {
            this.drawText(textObj, forExport);
        });
    }

    drawText(textObj, forExport = false) {
        // Set font
        this.ctx.font = `${textObj.fontSize}px "${textObj.font}"`;
        
        // Set up text styles
        if (textObj.strokeWidth > 0) {
            this.ctx.strokeStyle = textObj.strokeColor;
            this.ctx.lineWidth = textObj.strokeWidth;
        }
        this.ctx.fillStyle = textObj.color;

        // Draw the text (either warped or normal)
        if (textObj.warpBend && textObj.warpBend !== 0) {
            this.drawWarpedText(textObj.text, textObj.x, textObj.y, textObj.warpBend);
        } else {
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            if (textObj.strokeWidth > 0) {
                this.ctx.strokeText(textObj.text, textObj.x, textObj.y);
            }
            this.ctx.fillText(textObj.text, textObj.x, textObj.y);
        }

        // Draw selection box if selected and not exporting
        if (textObj === this.selectedText && !forExport) {
            const metrics = this.ctx.measureText(textObj.text);
            const height = textObj.fontSize;
            const width = metrics.width;
            
            this.ctx.strokeStyle = '#0066ff';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(
                textObj.x - width/2 - 5,
                textObj.y - height/2 - 5,
                width + 10,
                height + 10
            );

            // Update UI controls
            this.updateUIControls(textObj);
        }
    }

    drawWarpedText(text, x, y, bend) {
        // Draw straight text if no bend
        if (Math.abs(bend) < 0.1) {
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            if (this.ctx.lineWidth > 0) {
                this.ctx.strokeText(text, x, y);
            }
            this.ctx.fillText(text, x, y);
            return;
        }

        // Text settings
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Calculate basic parameters
        const textWidth = this.ctx.measureText(text).width;
        
        // Get letter spacing from the text object or use default
        const letterSpacing = (this.textObjects.find(t => t.text === text)?.letterSpacing || 2) / 100;
        
        // Calculate positions for each character
        const chars = text.split('');
        const charWidths = chars.map(char => this.ctx.measureText(char).width);
        const totalWidth = charWidths.reduce((sum, width) => sum + width, 0);
        
        // Add letter spacing to total width
        const spacedWidth = totalWidth * (1 + letterSpacing);
        
        // Calculate curve parameters
        const bendScale = bend / 100;
        const maxBendAngle = Math.PI / 3; // 60 degrees max
        const totalAngle = maxBendAngle * Math.abs(bendScale);
        
        // Calculate radius and center point
        const radius = spacedWidth / (2 * Math.sin(totalAngle/2));
        const centerY = bendScale > 0 ? 
            y + radius : 
            y - radius;
        
        // Calculate start angle based on direction
        const startAngle = bendScale > 0 ? 
            -Math.PI/2 - totalAngle/2 : 
            Math.PI/2 + totalAngle/2;
        
        // Draw each character
        let currentLength = 0;
        
        for (let i = 0; i < chars.length; i++) {
            const char = chars[i];
            const charWidth = charWidths[i];
            
            // Calculate spacing for this character
            const charSpacing = charWidth * (1 + letterSpacing);
            currentLength += charSpacing / 2;
            
            // Calculate position on the curve
            const progress = currentLength / spacedWidth;
            const angle = startAngle + (bendScale > 0 ? totalAngle * progress : -totalAngle * progress);
            
            // Calculate character position relative to the center point
            const charX = x + radius * Math.cos(angle);
            const charY = centerY + radius * Math.sin(angle);
            
            // Calculate rotation angle for the character
            const rotationAngle = angle + (bendScale > 0 ? Math.PI/2 : -Math.PI/2);
            
            // Save context state
            this.ctx.save();
            
            // Move to character position and rotate
            this.ctx.translate(charX, charY);
            this.ctx.rotate(rotationAngle);
            
            // Draw the character
            if (this.ctx.lineWidth > 0) {
                this.ctx.strokeText(char, 0, 0);
            }
            this.ctx.fillText(char, 0, 0);
            
            // Restore context state
            this.ctx.restore();
            
            // Move to next character position
            currentLength += charSpacing / 2;
        }
    }

    drawSelectionBox(textObj) {
        const metrics = this.ctx.measureText(textObj.text);
        const height = textObj.fontSize;
        const width = metrics.width;
        
        this.ctx.save();
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(
            textObj.x - width/2 - 10,
            textObj.y - height/2 - 10,
            width + 20,
            height + 20
        );
        this.ctx.restore();
    }

    getFontStyle(textObj) {
        let style = '';
        if (textObj.isBold) style += 'bold ';
        if (textObj.isItalic) style += 'italic ';
        return style.trim();
    }

    updateBrushPreview(e) {
        if ((!this.isPaintMode && !this.isInpaintingMode) || this.isPicking) {
            this.cursorLayer.style.display = 'none';
            return;
        }

        const point = this.getCanvasPoint(e);
        const rect = this.canvas.getBoundingClientRect();
        
        // Show cursor layer and update position
        this.cursorLayer.style.display = 'block';
        this.cursorLayer.style.left = rect.left + 'px';
        this.cursorLayer.style.top = rect.top + 'px';
        this.cursorLayer.width = rect.width;
        this.cursorLayer.height = rect.height;

        // Clear previous cursor
        this.cursorCtx.clearRect(0, 0, this.cursorLayer.width, this.cursorLayer.height);

        // Draw new cursor at exact mouse position
        this.cursorCtx.beginPath();
        this.cursorCtx.arc(point.displayX, point.displayY, this.brushSize / (2 * point.scaleX), 0, Math.PI * 2);
        this.cursorCtx.strokeStyle = '#ffffff';
        this.cursorCtx.lineWidth = 2;
        this.cursorCtx.stroke();
        this.cursorCtx.strokeStyle = '#000000';
        this.cursorCtx.lineWidth = 1;
        this.cursorCtx.stroke();
    }

    startDrawing(e) {
        if (this.isInpaintingMode || this.isPaintMode) {
            this.isDrawing = true;
            const pos = this.getCanvasPoint(e);
            this.lastX = pos.x;
            this.lastY = pos.y;
            
            // Set white color for inpainting mask
            if (this.isInpaintingMode) {
                this.paintCtx.strokeStyle = '#ffffff';
                this.paintCtx.fillStyle = '#ffffff';
            }
            
            this.draw(e);
        }
    }

    draw(e) {
        if (!this.isDrawing) return;
        
        const point = this.getCanvasPoint(e);
        const ctx = this.isInpaintingMode ? this.paintCtx : this.ctx;
        
        if (this.isInpaintingMode) {
            // Always use white for inpainting mask
            ctx.strokeStyle = '#ffffff';
            ctx.fillStyle = '#ffffff';
        } else {
            ctx.strokeStyle = this.currentColor;
            ctx.fillStyle = this.currentColor;
        }
        
        ctx.lineWidth = this.brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(this.lastX, this.lastY);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
        
        this.lastX = point.x;
        this.lastY = point.y;

        // Redraw the main canvas to show changes
        this.redraw();
    }

    stopDrawing() {
        this.isDrawing = false;
    }

    resizeCanvas() {
        if (this.baseImage) {
            // Use original dimensions from the base image
            this.canvas.width = this.baseImage.originalWidth;
            this.canvas.height = this.baseImage.originalHeight;
            this.paintLayer.width = this.canvas.width;
            this.paintLayer.height = this.canvas.height;
            this.cursorLayer.width = this.canvas.width;
            this.cursorLayer.height = this.canvas.height;
            this.cursorLayer.style.width = '100%';
            this.cursorLayer.style.height = '100%';
            if (this.currentImage) {
                this.paintCtx.drawImage(this.currentImage, 0, 0, this.canvas.width, this.canvas.height);
            }
            this.redraw();
        }
    }

    showToastMessage(message, type = 'success') {
        const toast = document.createElement('toast-notification');
        document.body.appendChild(toast);
        toast.show(message, type);
    }

    async loadInpaintingModels() {
        try {
            const response = await fetch('/api/inpainting/models');
            if (!response.ok) {
                throw new Error('Failed to load inpainting models');
            }
            
            const models = await response.json();
            const modelSelect = document.getElementById('inpaintingModelSelect');
            
            // Clear existing options except the default one
            while (modelSelect.options.length > 1) {
                modelSelect.remove(1);
            }
            
            // Add models to select
            models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.id;
                option.textContent = model.name;
                option.dataset.model = JSON.stringify(model);
                modelSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading inpainting models:', error);
            this.showToastMessage('Failed to load inpainting models', 'error');
        }
    }
}

class EditorModeManager {
    constructor(editor) {
        this.editor = editor;
        this.currentMode = null;
        this.modes = {
            TEXT: 'text',
            PAINT: 'paint',
            INPAINTING: 'inpainting'
        };
        this.initializeModeButtons();
    }

    initializeModeButtons() {
        const textModeBtn = document.getElementById('textModeBtn');
        const paintModeBtn = document.getElementById('paintModeBtn');
        const inpaintingModeBtn = document.getElementById('inpaintingModeBtn');

        if (textModeBtn) {
            textModeBtn.addEventListener('click', () => this.setMode(this.modes.TEXT));
        }
        if (paintModeBtn) {
            paintModeBtn.addEventListener('click', () => this.setMode(this.modes.PAINT));
        }
        if (inpaintingModeBtn) {
            inpaintingModeBtn.addEventListener('click', () => this.setMode(this.modes.INPAINTING));
        }
    }

    setMode(mode) {
        console.log('Setting mode:', mode);
        
        // Remove active class from all mode buttons
        document.querySelectorAll('.mode-button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Hide all tool sections
        document.querySelectorAll('.mode-section').forEach(section => {
            section.style.display = 'none';
        });
        
        // Reset all modes in editor
        this.editor.isPaintMode = false;
        this.editor.isInpaintingMode = false;
        this.editor.showSelectionOutline = true;
        
        // If clicking the same mode, toggle it off
        if (this.currentMode === mode) {
            this.currentMode = null;
            return;
        }

        // Set new mode
        this.currentMode = mode;
        
        // Activate the selected mode's button and tools
        switch(mode) {
            case this.modes.TEXT:
                document.getElementById('textModeBtn').classList.add('active');
                document.getElementById('textTools').style.display = 'block';
                this.editor.showSelectionOutline = true;
                break;
            case this.modes.PAINT:
                document.getElementById('paintModeBtn').classList.add('active');
                document.getElementById('paintTools').style.display = 'block';
                this.editor.isPaintMode = true;
                this.editor.showSelectionOutline = false;
                break;
            case this.modes.INPAINTING:
                document.getElementById('inpaintingModeBtn').classList.add('active');
                document.getElementById('inpaintingTools').style.display = 'block';
                this.editor.isInpaintingMode = true;
                this.editor.showSelectionOutline = false;
                break;
        }
        
        // Redraw canvas to update UI state
        this.editor.redraw();
    }
}

// Initialize the editor when the page loads
window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('editor-canvas');
    if (canvas) {
        window.stickerEditor = new StickerEditor(canvas);
    }
});

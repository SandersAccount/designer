// Elements Accordion Functionality
// NOTE: This class is now deprecated in favor of the new dynamic shapes-loader.js
// It's kept for backward compatibility but will not be used when shapes-loader.js is active
class ElementsAccordion {
    constructor() {
        // Check if the new dynamic shapes loader is available
        if (window.shapesLoader || document.querySelector('.dynamic-shapes-container')) {
            console.log('[ElementsAccordion] Dynamic shapes loader detected, disabling legacy accordion');
            this.isDisabled = true;
            return;
        }

        this.shapeCategories = {
            'abstract': {
                path: '/stock/shapes/abstract-shapes',
                files: []
            },
            'geometric': {
                path: '/stock/shapes/geometric-shapes',
                files: []
            },
            'hand-drawn': {
                path: '/stock/shapes/hand-drawn-dividers',
                files: []
            },
            'ink': {
                path: '/stock/shapes/ink-brush-strokes',
                files: []
            },
            'masks': {
                path: '/stock/shapes/masks',
                files: []
            },
            'extra': {
                path: '/stock/shapes/extra',
                files: []
            },
            'data': {
                path: '/stock/shapes/data',
                files: []
            },
            'icons': {
                path: '/stock/shapes/icons',
                files: []
            },
            'separators': {
                path: '/stock/shapes/separators',
                files: []
            },
            'grunge': {
                path: '/stock/shapes/grunge',
                files: []
            }
        };

        this.init();
    }

    init() {
        if (this.isDisabled) {
            console.log('[ElementsAccordion] Skipping initialization - dynamic shapes loader is active');
            return;
        }

        this.setupAccordionHandlers();
        // Don't load shape files immediately - use lazy loading instead
    }

    setupAccordionHandlers() {
        const accordionHeaders = document.querySelectorAll('.accordion-header');

        accordionHeaders.forEach(header => {
            header.addEventListener('click', (e) => {
                const category = header.dataset.category;
                const content = document.getElementById(`${category}-content`);
                const isActive = header.classList.contains('active');

                // Close all other accordions
                accordionHeaders.forEach(h => {
                    h.classList.remove('active');
                    const c = document.getElementById(`${h.dataset.category}-content`);
                    if (c) c.classList.remove('active');
                });

                // Toggle current accordion
                if (!isActive) {
                    header.classList.add('active');
                    content.classList.add('active');

                    // Load shapes for this category lazily
                    this.loadShapesForCategoryLazy(category);
                }
            });
        });
    }

    async loadShapesForCategoryLazy(category) {
        console.log(`[ElementsAccordion] Loading shapes for category: ${category}`);
        const config = this.shapeCategories[category];
        if (!config) {
            console.warn(`[ElementsAccordion] No config found for category: ${category}`);
            return;
        }

        // Check if already loaded
        if (config.files && config.files.length > 0) {
            console.log(`[ElementsAccordion] Category ${category} already loaded with ${config.files.length} files`);
            this.loadShapesForCategory(category);
            return;
        }

        // Show loading indicator
        const grid = document.getElementById(`${category}-grid`);
        if (!grid) {
            console.error(`[ElementsAccordion] Grid element not found: ${category}-grid`);
            return;
        }

        grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 20px; color: #64748b;">Loading shapes...</div>';

        try {
            // Initialize shapes API
            const shapesAPI = new window.ShapesAPI();
            console.log(`[ElementsAccordion] ShapesAPI initialized for ${category}`);

            // Discover all available files
            const files = await shapesAPI.getShapeFiles(category);
            console.log(`[ElementsAccordion] Discovered ${files.length} files for ${category}:`, files);

            config.files = files;

            // Load the shapes into the grid
            this.loadShapesForCategory(category);

        } catch (error) {
            console.error(`[ElementsAccordion] Error loading files for ${category}:`, error);
            config.files = [];
            grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 20px; color: #ef4444;">Error loading shapes</div>';
        }
    }

    loadShapesForCategory(category) {
        console.log(`[ElementsAccordion] Loading shapes into grid for category: ${category}`);
        const grid = document.getElementById(`${category}-grid`);

        if (!grid) {
            console.error(`[ElementsAccordion] Grid element not found: ${category}-grid`);
            return;
        }

        // Check if already loaded (has shape items, not just loading/error messages)
        if (grid.children.length > 0 && grid.querySelector('.element-item')) {
            console.log(`[ElementsAccordion] Category ${category} already has shapes loaded`);
            return;
        }

        const config = this.shapeCategories[category];
        if (!config || !config.files.length) {
            console.warn(`[ElementsAccordion] No files available for category ${category}:`, config);
            grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 20px; color: #64748b;">No shapes available</div>';
            return;
        }

        console.log(`[ElementsAccordion] Creating ${config.files.length} shape items for ${category}`);

        // Clear any loading/error messages
        grid.innerHTML = '';

        // Create shape thumbnails
        config.files.forEach((filename, index) => {
            const shapeItem = this.createShapeItem(category, filename, config.path);
            grid.appendChild(shapeItem);
        });

        console.log(`[ElementsAccordion] Finished loading ${config.files.length} shapes for ${category}`);
    }

    createShapeItem(category, filename, basePath) {
        const item = document.createElement('div');
        item.className = 'element-item';
        item.dataset.category = category;
        item.dataset.filename = filename;

        const img = document.createElement('img');
        const fullPath = `${basePath}/${filename}`;
        img.src = fullPath;
        img.alt = `${category} shape ${filename}`;
        img.loading = 'lazy';

        // Set consistent thumbnail size
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        img.style.objectPosition = 'center';

        // Handle successful image load
        img.onload = () => {
            // Verify the image has reasonable dimensions
            if (img.naturalWidth === 0 || img.naturalHeight === 0) {
                console.warn(`[ElementsAccordion] Invalid image dimensions for: ${fullPath}`);
                item.style.display = 'none';
                return;
            }

            // Check for extremely large images that might cause performance issues
            if (img.naturalWidth > 2000 || img.naturalHeight > 2000) {
                console.warn(`[ElementsAccordion] Very large image (${img.naturalWidth}x${img.naturalHeight}): ${fullPath}`);
                // Still show it but log the warning
            }
        };

        // Handle image load errors (corrupted files, network issues, etc.)
        img.onerror = (error) => {
            console.error(`[ElementsAccordion] Failed to load image: ${fullPath}`, error);
            item.style.display = 'none';
        };

        // Add click handler to add shape to canvas
        item.addEventListener('click', (e) => {
            console.log(`[ElementsAccordion] Shape clicked: ${filename} from ${category}`);
            console.log(`[ElementsAccordion] Click event:`, e);
            console.log(`[ElementsAccordion] Target element:`, e.target);
            e.preventDefault();
            e.stopPropagation();
            this.addShapeToCanvas(category, filename, basePath);
        });

        item.appendChild(img);
        return item;
    }

    addShapeToCanvas(category, filename, basePath) {
        const shapePath = `${basePath}/${filename}`;
        console.log(`[ElementsAccordion] addShapeToCanvas called: ${shapePath}`);

        // Check if we have access to the current canvas system
        if (window.canvasObjects && Array.isArray(window.canvasObjects)) {
            console.log(`[ElementsAccordion] Canvas system available, loading SVG: ${shapePath}`);
            this.loadSVGToCanvas(shapePath);
        } else {
            console.warn('Canvas system not available - canvasObjects not found');
            // Try to wait a bit and retry (in case the canvas system is still initializing)
            setTimeout(() => {
                if (window.canvasObjects && Array.isArray(window.canvasObjects)) {
                    console.log(`[ElementsAccordion] Canvas system available after retry, loading SVG: ${shapePath}`);
                    this.loadSVGToCanvas(shapePath);
                } else {
                    console.error('Canvas system still not available after retry');
                }
            }, 100);
        }
    }

    async loadSVGToCanvas(svgPath) {
        try {
            console.log(`[ElementsAccordion] Starting loadSVGToCanvas for: ${svgPath}`);

            // Create an image object using the existing canvas system
            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = () => {
                console.log(`[ElementsAccordion] Image loaded successfully:`, {
                    src: svgPath,
                    naturalWidth: img.naturalWidth,
                    naturalHeight: img.naturalHeight,
                    width: img.width,
                    height: img.height
                });

                // Calculate size and position
                let x, y, width, height;

                // Check if a layout rectangle is selected
                if (window.selectedLayoutRectIndex !== undefined &&
                    window.selectedLayoutRectIndex !== -1 &&
                    window.layoutRectangles &&
                    window.layoutRectangles[window.selectedLayoutRectIndex]) {

                    const layoutRect = window.layoutRectangles[window.selectedLayoutRectIndex];
                    console.log(`[ElementsAccordion] Placing shape in selected layout rectangle:`, layoutRect);

                    // IMPROVED: Calculate scale to fit within layout rectangle while maintaining aspect ratio
                    // For shapes, img.width/height are already the actual visible dimensions
                    const scaleX = layoutRect.width / img.width;
                    const scaleY = layoutRect.height / img.height;
                    const maxScale = Math.min(scaleX, scaleY);
                    console.log(`[ElementsAccordion] IMPROVED FITTING: Using actual shape dimensions (no bounding box issues)`);

                    // Use 95% of the maximum scale to fit almost exactly with minimal padding
                    // This will scale both up and down to fit the rectangle
                    const scale = maxScale * 1.45;

                    width = img.width * scale;
                    height = img.height * scale;

                    // Center the shape within the layout rectangle
                    x = layoutRect.x + layoutRect.width / 2;
                    y = layoutRect.y + layoutRect.height / 2;

                } else {
                    // Default placement logic
                    const maxSize = 200;
                    const aspectRatio = img.width / img.height;
                    width = maxSize;
                    height = maxSize;

                    if (aspectRatio > 1) {
                        height = maxSize / aspectRatio;
                    } else {
                        width = maxSize * aspectRatio;
                    }

                    x = (window.w || 2048) / 2 - width / 2;
                    y = (window.h || 2048) / 2 - height / 2;
                }

                console.log(`[ElementsAccordion] Calculated dimensions:`, {
                    x, y, width, height, aspectRatio, maxSize
                });

                // Use the existing createImageObject function from design-editor.js
                if (typeof window.createImageObject === 'function') {
                    console.log(`[ElementsAccordion] Using window.createImageObject function`);

                    const imageObject = window.createImageObject(img, {
                        x: x,
                        y: y,
                        scale: Math.min(width / img.naturalWidth, height / img.naturalHeight),
                        isSelected: true,
                        imageUrl: svgPath // Store the SVG path for color detection
                    });

                    console.log(`[ElementsAccordion] Created image object:`, imageObject);

                    // Add to canvas objects array
                    if (window.canvasObjects && window.canvasObjects.push) {
                        console.log(`[ElementsAccordion] Adding to canvasObjects. Current length: ${window.canvasObjects.length}`);

                        window.canvasObjects.push(imageObject);
                        window.selectedObjectIndex = window.canvasObjects.length - 1;

                        console.log(`[ElementsAccordion] Added to canvas. New length: ${window.canvasObjects.length}, selectedIndex: ${window.selectedObjectIndex}`);

                        // Update UI and render
                        if (typeof window.updateUIFromSelectedObject === 'function') {
                            console.log(`[ElementsAccordion] Calling updateUIFromSelectedObject`);
                            window.updateUIFromSelectedObject();
                        }
                        if (typeof window.update === 'function') {
                            console.log(`[ElementsAccordion] Calling update to render canvas`);
                            window.update();
                        }

                        console.log(`[ElementsAccordion] Shape successfully added to canvas!`);
                    } else {
                        console.error(`[ElementsAccordion] canvasObjects not available or not pushable:`, window.canvasObjects);
                    }
                } else {
                    console.warn(`[ElementsAccordion] window.createImageObject not available, using fallback`);
                    // Fallback: try to add as a simple image
                    this.addImageDirectly(img, x, y, width, height);
                }

                // Close the sidebar after adding
                this.closeSidebar();
            };

            img.onerror = (error) => {
                console.error(`[ElementsAccordion] Error loading SVG as image: ${svgPath}`, error);
                console.error(`[ElementsAccordion] Image error event:`, error);
            };

            console.log(`[ElementsAccordion] Setting img.src to: ${svgPath}`);
            // Load the SVG as an image
            img.src = svgPath;

        } catch (error) {
            console.error(`[ElementsAccordion] Error in loadSVGToCanvas:`, error);
        }
    }

    addImageDirectly(img, x, y, width, height) {
        // Fallback method to add image directly to canvas
        if (window.canvasObjects && Array.isArray(window.canvasObjects)) {
            const scale = Math.min(width / img.naturalWidth, height / img.naturalHeight);

            const imageObject = {
                type: 'image',
                id: Date.now(),
                image: img,
                x: x || (window.w || 2048) / 2,
                y: y || (window.h || 2048) / 2,
                scale: scale || 1,
                rotation: 0,
                isSelected: true,
                originalWidth: img.naturalWidth,
                originalHeight: img.naturalHeight,
                imageUrl: img.src // This will be the SVG path for color detection
            };

            window.canvasObjects.push(imageObject);
            window.selectedObjectIndex = window.canvasObjects.length - 1;

            if (typeof window.updateUIFromSelectedObject === 'function') {
                window.updateUIFromSelectedObject();
            }
            if (typeof window.update === 'function') {
                window.update();
            }
        }
    }

    closeSidebar() {
        const sidebar = document.getElementById('elements-sidebar');
        if (sidebar) {
            sidebar.classList.remove('active');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.elementsAccordion = new ElementsAccordion();
});

// Expose function to re-initialize elements accordion
window.reinitializeElementsAccordion = () => {
    console.log('[ElementsAccordion] Re-initializing elements accordion...');
    if (window.elementsAccordion) {
        // Re-setup event handlers for existing elements
        const elementItems = document.querySelectorAll('.element-item');
        console.log(`[ElementsAccordion] Found ${elementItems.length} existing element items to re-initialize`);

        elementItems.forEach(item => {
            const category = item.getAttribute('data-category');
            const filename = item.getAttribute('data-filename');

            if (category && filename) {
                // Remove any existing listeners to prevent duplicates
                const newItem = item.cloneNode(true);
                item.parentNode.replaceChild(newItem, item);

                // Add fresh click handler
                newItem.addEventListener('click', (e) => {
                    console.log(`[ElementsAccordion] Re-initialized shape clicked: ${filename} from ${category}`);
                    e.preventDefault();
                    e.stopPropagation();

                    const config = window.elementsAccordion.shapeCategories[category];
                    if (config) {
                        window.elementsAccordion.addShapeToCanvas(category, filename, config.path);
                    }
                });
            }
        });
    }
};

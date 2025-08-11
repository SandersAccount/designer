// Dynamic Shapes Loader for Left Sidebar with Folder Support
// Unified with images system for consistent asset management
class ShapesLoader {
    constructor() {
        this.shapeGrid = null;
        this.folderNavigation = null;
        this.loadedShapes = [];
        this.currentFolder = '';
        this.folderData = null;
        this.isLoading = false;
    }

    async init() {
        console.log('🔷 Initializing Shapes Loader with folder support...');

        // Find the shape grid container
        this.shapeGrid = document.querySelector('#elements-sidebar .elements-accordion');
        if (!this.shapeGrid) {
            console.error('Shape grid container not found');
            return;
        }

        // Create folder navigation container
        this.createFolderNavigation();

        // Load shapes when the Elements sidebar is opened
        this.setupSidebarListener();

        console.log('🔷 Shapes Loader initialized with folder support');
    }

    createFolderNavigation() {
        // Create folder navigation container if it doesn't exist
        let folderNav = document.querySelector('#elements-sidebar .folder-navigation');
        if (!folderNav) {
            folderNav = document.createElement('div');
            folderNav.className = 'folder-navigation';
            folderNav.innerHTML = `
                <div class="folder-breadcrumb">
                    <span class="breadcrumb-item current-folder">Shapes</span>
                </div>
                <div class="folder-actions">
                    <button class="back-button" style="display: none;">
                        <i class="fas fa-arrow-left"></i> Back
                    </button>
                </div>
            `;
            
            // Insert before the accordion
            this.shapeGrid.parentNode.insertBefore(folderNav, this.shapeGrid);
        }
        
        this.folderNavigation = folderNav;
        this.setupFolderNavigation();
    }

    setupFolderNavigation() {
        const backButton = this.folderNavigation.querySelector('.back-button');
        if (backButton) {
            backButton.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent sidebar from closing
                event.preventDefault();
                if (this.folderData && this.folderData.parentFolder !== null) {
                    this.loadShapes(this.folderData.parentFolder);
                } else {
                    this.loadShapes('');
                }
            });
        }
    }

    setupSidebarListener() {
        // Listen for when the Elements sidebar is opened
        const elementsMenuItem = document.querySelector('[data-sidebar="elements-sidebar"]');
        if (elementsMenuItem) {
            elementsMenuItem.addEventListener('click', () => {
                // Small delay to ensure sidebar is open
                setTimeout(() => {
                    if (!this.folderData && !this.isLoading) {
                        this.loadShapes();
                    }
                }, 100);
            });
        }
    }

    async loadShapes(folder = '') {
        if (this.isLoading) return;

        this.isLoading = true;
        this.currentFolder = folder;
        console.log(`🔷 Loading shapes from /stock/shapes${folder ? '/' + folder : ''}...`);

        try {
            // Show loading state
            this.showLoadingState();

            // Fetch the list of shapes and folders from the server
            const url = `/api/stock-shapes${folder ? `?folder=${encodeURIComponent(folder)}` : ''}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Failed to fetch shapes: ${response.status}`);
            }

            const data = await response.json();
            console.log('🔷 Received data:', data);

            this.folderData = data;

            // Update folder navigation
            this.updateFolderNavigation(data);

            // Check if we have any content
            if (data.folders.length === 0 && data.shapes.length === 0) {
                this.showEmptyState();
                return;
            }

            // Clear loading state and render content
            this.clearGrid();
            this.renderFoldersAndShapes(data);
            this.loadedShapes = data.shapes;

        } catch (error) {
            console.error('🔷 Error loading shapes:', error);
            this.showErrorState(error.message);
        } finally {
            this.isLoading = false;
        }
    }

    showLoadingState() {
        this.shapeGrid.innerHTML = `
            <div class="loading-state" style="text-align: center; padding: 40px; color: #64748b;">
                <div class="loading-spinner" style="margin-bottom: 16px;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 24px;"></i>
                </div>
                <div>Loading shapes...</div>
            </div>
        `;
    }

    showEmptyState() {
        this.shapeGrid.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 40px; color: #64748b;">
                <div style="margin-bottom: 16px;">
                    <i class="fas fa-shapes" style="font-size: 48px; opacity: 0.3;"></i>
                </div>
                <div style="font-size: 16px; margin-bottom: 8px;">No shapes found</div>
                <div style="font-size: 14px;">Upload shapes to this folder to get started</div>
            </div>
        `;
    }

    showErrorState(message) {
        this.shapeGrid.innerHTML = `
            <div class="error-state" style="text-align: center; padding: 40px; color: #ef4444;">
                <div style="margin-bottom: 16px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; opacity: 0.7;"></i>
                </div>
                <div style="font-size: 16px; margin-bottom: 8px;">Error loading shapes</div>
                <div style="font-size: 14px;">${message}</div>
                <button onclick="window.shapesLoader.loadShapes('${this.currentFolder}')" 
                        style="margin-top: 16px; padding: 8px 16px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Retry
                </button>
            </div>
        `;
    }

    clearGrid() {
        this.shapeGrid.innerHTML = '';
    }

    updateFolderNavigation(data) {
        const breadcrumb = this.folderNavigation.querySelector('.breadcrumb-item');
        const backButton = this.folderNavigation.querySelector('.back-button');

        if (data.currentFolder) {
            breadcrumb.textContent = `Shapes / ${data.currentFolder.replace(/\//g, ' / ')}`;
            backButton.style.display = 'inline-flex';
        } else {
            breadcrumb.textContent = 'Shapes';
            backButton.style.display = 'none';
        }
    }

    renderFoldersAndShapes(data) {
        // Create a container for the dynamic content
        const container = document.createElement('div');
        container.className = 'dynamic-shapes-container';

        // Render folders first
        if (data.folders.length > 0) {
            const foldersSection = document.createElement('div');
            foldersSection.className = 'folders-section';
            foldersSection.innerHTML = '<h4 style="margin: 16px 0 8px 0; color: #374151; font-size: 14px;">Folders</h4>';
            
            const foldersGrid = document.createElement('div');
            foldersGrid.className = 'folders-grid';
            foldersGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px; margin-bottom: 24px;';

            data.folders.forEach(folder => {
                const folderItem = this.createFolderItem(folder);
                foldersGrid.appendChild(folderItem);
            });

            foldersSection.appendChild(foldersGrid);
            container.appendChild(foldersSection);
        }

        // Render shapes
        if (data.shapes.length > 0) {
            const shapesSection = document.createElement('div');
            shapesSection.className = 'shapes-section';
            if (data.folders.length > 0) {
                shapesSection.innerHTML = '<h4 style="margin: 16px 0 8px 0; color: #374151; font-size: 14px;">Shapes</h4>';
            }
            
            const shapesGrid = document.createElement('div');
            shapesGrid.className = 'shapes-grid';
            shapesGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 12px;';

            data.shapes.forEach(shapePath => {
                const shapeItem = this.createShapeItem(shapePath);
                shapesGrid.appendChild(shapeItem);
            });

            shapesSection.appendChild(shapesGrid);
            container.appendChild(shapesSection);
        }

        this.shapeGrid.appendChild(container);
    }

    createFolderItem(folder) {
        const folderItem = document.createElement('div');
        folderItem.className = 'folder-item';
        folderItem.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 16px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
        `;

        folderItem.innerHTML = `
            <div style="font-size: 32px; color: #64748b; margin-bottom: 8px;">
                <i class="fas fa-folder"></i>
            </div>
            <div style="font-size: 12px; color: #374151; text-align: center; word-break: break-word;">
                ${folder.name}
            </div>
        `;

        // Add hover effects
        folderItem.addEventListener('mouseenter', () => {
            folderItem.style.background = '#e2e8f0';
            folderItem.style.transform = 'translateY(-2px)';
        });

        folderItem.addEventListener('mouseleave', () => {
            folderItem.style.background = '#f8fafc';
            folderItem.style.transform = 'translateY(0)';
        });

        // Add click handler to navigate into folder
        folderItem.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent sidebar from closing
            event.preventDefault();
            this.loadShapes(folder.path);
        });

        return folderItem;
    }

    createShapeItem(shapePath) {
        const shapeItem = document.createElement('div');
        shapeItem.className = 'shape-item';
        shapeItem.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 12px;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
            aspect-ratio: 1;
        `;

        // Create shape preview
        const shapePreview = document.createElement('div');
        shapePreview.style.cssText = `
            width: 100%;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 8px;
        `;

        const img = document.createElement('img');
        img.src = shapePath;
        img.alt = this.getShapeName(shapePath);
        img.style.cssText = `
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        `;

        img.addEventListener('error', () => {
            console.error('🔷 Failed to load shape:', shapePath);
            img.style.display = 'none';
            shapePreview.innerHTML = '<i class="fas fa-shapes" style="font-size: 24px; color: #94a3b8;"></i>';
        });

        shapePreview.appendChild(img);

        // Add shape name
        const shapeName = document.createElement('div');
        shapeName.textContent = this.getShapeName(shapePath);
        shapeName.style.cssText = `
            font-size: 10px;
            color: #64748b;
            text-align: center;
            word-break: break-word;
            line-height: 1.2;
        `;

        // Add hover effects
        shapeItem.addEventListener('mouseenter', () => {
            shapeItem.style.transform = 'scale(1.05)';
            shapeItem.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        });

        shapeItem.addEventListener('mouseleave', () => {
            shapeItem.style.transform = 'scale(1)';
            shapeItem.style.boxShadow = 'none';
        });

        // Add click handler to add shape to canvas
        shapeItem.addEventListener('click', () => {
            this.addShapeToCanvas(shapePath);
        });

        shapeItem.appendChild(shapePreview);
        shapeItem.appendChild(shapeName);
        return shapeItem;
    }

    getShapeName(shapePath) {
        return shapePath.split('/').pop().split('.')[0];
    }

    addShapeToCanvas(shapePath) {
        console.log('🔷 Adding shape to canvas:', shapePath);

        // Use the same logic as elements-accordion.js
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            console.log('🔷 Shape loaded successfully:', shapePath);

            // Calculate position and size
            let x, y, width, height;

            // Check if a layout rectangle is selected
            console.log('🔷 LAYOUT CHECK: selectedLayoutRectIndex =', window.selectedLayoutRectIndex);
            console.log('🔷 LAYOUT CHECK: layoutRectangles =', window.layoutRectangles);
            console.log('🔷 LAYOUT CHECK: layoutRectangles length =', window.layoutRectangles ? window.layoutRectangles.length : 'undefined');

            if (window.selectedLayoutRectIndex !== undefined &&
                window.selectedLayoutRectIndex !== -1 &&
                window.layoutRectangles &&
                window.layoutRectangles[window.selectedLayoutRectIndex]) {

                const layoutRect = window.layoutRectangles[window.selectedLayoutRectIndex];
                console.log('🔷 LAYOUT RECT FOUND: Placing shape in selected layout rectangle:', layoutRect);
                console.log('🔷 LAYOUT RECT: dimensions =', layoutRect.width, 'x', layoutRect.height);
                console.log('🔷 LAYOUT RECT: position =', layoutRect.x, ',', layoutRect.y);

                // IMPROVED: For shapes, use actual image dimensions (which are already the visible content)
                // Shapes don't have invisible padding like text bounding boxes do
                const scaleX = layoutRect.width / img.naturalWidth;
                const scaleY = layoutRect.height / img.naturalHeight;
                const maxScale = Math.min(scaleX, scaleY);
                console.log('🔷 SCALE CALC: scaleX =', scaleX, 'scaleY =', scaleY, 'maxScale =', maxScale);
                console.log('🔷 SHAPE FITTING: Using actual image dimensions (no bounding box issues)');

                // Use 95% of the maximum scale to fit within the rectangle with padding
                // This ensures the object actually fits inside the rectangle
                const scale = maxScale * 1;
                console.log('🔷 FINAL SCALE: scale =', scale);
                console.log('🔷 SCALE VERIFICATION: Will object fit?');
                console.log('🔷   - Target width:', img.naturalWidth * scale, 'vs rectangle width:', layoutRect.width);
                console.log('🔷   - Target height:', img.naturalHeight * scale, 'vs rectangle height:', layoutRect.height);

                width = img.naturalWidth * scale;
                height = img.naturalHeight * scale;
                console.log('🔷 TARGET SIZE: width =', width, 'height =', height);

                // Center the shape within the layout rectangle
                x = layoutRect.x + layoutRect.width / 2;
                y = layoutRect.y + layoutRect.height / 2;
                console.log('🔷 TARGET POS: x =', x, 'y =', y);

            } else {
                // Default placement logic (center on canvas)
                const canvasWidth = window.w || 2048;
                const canvasHeight = window.h || 2048;
                x = canvasWidth / 2;
                y = canvasHeight / 2;

                // Calculate appropriate size (max 200px while maintaining aspect ratio)
                const maxSize = 200;
                const aspectRatio = img.naturalWidth / img.naturalHeight;

                if (aspectRatio > 1) {
                    width = Math.min(maxSize, img.naturalWidth);
                    height = width / aspectRatio;
                } else {
                    height = Math.min(maxSize, img.naturalHeight);
                    width = height * aspectRatio;
                }
            }

            console.log('🔷 FINAL DIMENSIONS:', { width, height, x, y });
            console.log('🔷 IMAGE NATURAL SIZE:', img.naturalWidth, 'x', img.naturalHeight);

            // Use the existing createImageObject function if available
            if (typeof window.createImageObject === 'function') {
                console.log('🔷 USING createImageObject to add shape');
                const finalScale = Math.min(width / img.naturalWidth, height / img.naturalHeight);
                console.log('🔷 CALCULATED FINAL SCALE:', finalScale);

                const imageObject = window.createImageObject(img, {
                    x: x,
                    y: y,
                    scale: finalScale,
                    isSelected: true,
                    imageUrl: shapePath // Store the shape path for asset management
                });

                console.log('🔷 CREATED IMAGE OBJECT:', imageObject);

                if (window.canvasObjects && Array.isArray(window.canvasObjects)) {
                    window.canvasObjects.push(imageObject);
                    window.selectedObjectIndex = window.canvasObjects.length - 1;

                    if (typeof window.updateUIFromSelectedObject === 'function') {
                        window.updateUIFromSelectedObject();
                    }

                    if (typeof window.update === 'function') {
                        console.log('🔷 Calling update to render canvas');
                        window.update();
                    }

                    console.log('🔷 Shape successfully added to canvas!');
                } else {
                    console.error('🔷 canvasObjects not available:', window.canvasObjects);
                }
            } else {
                console.warn('🔷 createImageObject not available, using fallback');
                this.addShapeDirectly(img, x, y, width, height, shapePath);
            }

            // Close the sidebar after adding
            this.closeSidebar();
        };

        img.onerror = (error) => {
            console.error('🔷 Error loading shape:', shapePath, error);
        };

        img.src = shapePath;
    }

    addShapeDirectly(img, x, y, width, height, shapePath) {
        // Fallback method to add shape directly to canvas
        if (window.canvasObjects && Array.isArray(window.canvasObjects)) {
            const scale = Math.min(width / img.naturalWidth, height / img.naturalHeight);

            const shapeObject = {
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
                imageUrl: shapePath // Store the shape path for asset management
            };

            window.canvasObjects.push(shapeObject);
            window.selectedObjectIndex = window.canvasObjects.length - 1;

            if (typeof window.updateUIFromSelectedObject === 'function') {
                window.updateUIFromSelectedObject();
            }

            if (typeof window.update === 'function') {
                window.update();
            }

            console.log('🔷 Shape added directly to canvas:', shapeObject);
        } else {
            console.error('🔷 Cannot add shape - canvasObjects not available');
        }
    }

    closeSidebar() {
        // Close the elements sidebar
        const sidebar = document.getElementById('elements-sidebar');
        const menuItem = document.querySelector('[data-sidebar="elements-sidebar"]');

        if (sidebar) {
            sidebar.classList.remove('active');
        }
        if (menuItem) {
            menuItem.classList.remove('active');
        }

        console.log('🔷 Elements sidebar closed');
    }
}

// Initialize the shapes loader when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.shapesLoader = new ShapesLoader();
    window.shapesLoader.init();
});

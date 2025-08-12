// Dynamic Images Loader for Left Sidebar with Folder Support
class ImagesLoader {
    constructor() {
        this.imageGrid = null;
        this.folderNavigation = null;
        this.loadedImages = [];
        this.currentFolder = '';
        this.folderData = null;
        this.isLoading = false;
        this.isAutomationRunning = false; // 🚨 CRITICAL: Prevent multiple simultaneous automations
    }

    async init() {
        console.log('🖼️ Initializing Images Loader with folder support...');

        // Find the image grid container
        this.imageGrid = document.querySelector('#images-sidebar .image-grid');
        if (!this.imageGrid) {
            console.error('Image grid container not found');
            return;
        }

        // Create folder navigation container
        this.createFolderNavigation();

        // Load images when the Images sidebar is opened
        this.setupSidebarListener();

        console.log('🖼️ Images Loader initialized with folder support');
    }

    createFolderNavigation() {
        // Create folder navigation container above the image grid
        const sidebar = document.querySelector('#images-sidebar');
        if (!sidebar) return;

        // Check if navigation already exists
        if (this.folderNavigation) return;

        this.folderNavigation = document.createElement('div');
        this.folderNavigation.className = 'folder-navigation';
        this.folderNavigation.style.cssText = `
            padding: 10px;
            border-bottom: 1px solid #e2e8f0;
            background: #f8fafc;
            font-size: 0.9em;
        `;

        // Insert before the image grid
        const imageGridContainer = this.imageGrid.parentElement;
        imageGridContainer.insertBefore(this.folderNavigation, this.imageGrid);
    }

    setupSidebarListener() {
        // Listen for when the Images sidebar is opened
        const imagesMenuItem = document.querySelector('[data-sidebar="images-sidebar"]');
        if (imagesMenuItem) {
            imagesMenuItem.addEventListener('click', () => {
                // Small delay to ensure sidebar is open
                setTimeout(() => {
                    if (!this.folderData && !this.isLoading) {
                        this.loadImages();
                    }
                }, 100);
            });
        }
    }

    async loadImages(folder = '') {
        if (this.isLoading) return;

        this.isLoading = true;
        this.currentFolder = folder;
        console.log(`🖼️ Loading images from /stock/images${folder ? '/' + folder : ''}...`);

        try {
            // Show loading state
            this.showLoadingState();

            // Fetch the list of images and folders from the server
            const url = `/api/stock-images${folder ? `?folder=${encodeURIComponent(folder)}` : ''}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Failed to fetch images: ${response.status}`);
            }

            const data = await response.json();
            console.log('🖼️ Received data:', data);

            this.folderData = data;

            // Update folder navigation
            this.updateFolderNavigation(data);

            // Check if we have any content
            if (data.folders.length === 0 && data.images.length === 0) {
                this.showEmptyState();
                return;
            }

            // Clear loading state and render content
            this.clearGrid();
            this.renderFoldersAndImages(data);
            this.loadedImages = data.images;

        } catch (error) {
            console.error('🖼️ Error loading images:', error);
            this.showErrorState(error.message);
        } finally {
            this.isLoading = false;
        }
    }

    showLoadingState() {
        this.imageGrid.innerHTML = `
            <div class="loading-state" style="
                grid-column: 1 / -1;
                text-align: center;
                padding: 20px;
                color: #64748b;
                font-size: 0.9em;
            ">
                <div style="margin-bottom: 10px;">📸</div>
                Loading images...
            </div>
        `;
    }

    showEmptyState() {
        this.imageGrid.innerHTML = `
            <div class="empty-state" style="
                grid-column: 1 / -1;
                text-align: center;
                padding: 20px;
                color: #64748b;
                font-size: 0.9em;
            ">
                <div style="margin-bottom: 10px;">📁</div>
                No images found in /stock/images
            </div>
        `;
    }

    showErrorState(message) {
        this.imageGrid.innerHTML = `
            <div class="error-state" style="
                grid-column: 1 / -1;
                text-align: center;
                padding: 20px;
                color: #dc2626;
                font-size: 0.9em;
            ">
                <div style="margin-bottom: 10px;">⚠️</div>
                Error loading images: ${message}
            </div>
        `;
    }

    updateFolderNavigation(data) {
        if (!this.folderNavigation) return;

        let navigationHTML = '';

        // Add breadcrumb navigation
        if (data.currentFolder) {
            const folders = data.currentFolder.split('/');
            let breadcrumb = '<span class="breadcrumb">';

            // Home link
            breadcrumb += '<a href="#" data-folder="" class="folder-nav-link">📁 Images</a>';

            // Folder links
            let currentPath = '';
            folders.forEach((folder, index) => {
                currentPath += (currentPath ? '/' : '') + folder;
                breadcrumb += ` / <a href="#" data-folder="${currentPath}" class="folder-nav-link">${folder}</a>`;
            });

            breadcrumb += '</span>';
            navigationHTML = breadcrumb;
        } else {
            navigationHTML = '<span class="breadcrumb">📁 Images</span>';
        }

        // Add back button if not in root
        if (data.parentFolder !== null) {
            navigationHTML += `<button data-folder="${data.parentFolder}" class="folder-back-button" style="
                float: right;
                background: #3b82f6;
                color: white;
                border: none;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 0.8em;
                cursor: pointer;
            ">← Back</button>`;
        }

        this.folderNavigation.innerHTML = navigationHTML;

        // Add event listeners for navigation links
        this.setupNavigationListeners();
    }

    setupNavigationListeners() {
        // Add event listeners for breadcrumb navigation links
        const navLinks = this.folderNavigation.querySelectorAll('.folder-nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation(); // Prevent sidebar from closing
                const folder = link.getAttribute('data-folder');
                this.loadImages(folder);
            });
        });

        // Add event listener for back button
        const backButton = this.folderNavigation.querySelector('.folder-back-button');
        if (backButton) {
            backButton.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation(); // Prevent sidebar from closing
                const folder = backButton.getAttribute('data-folder');
                this.loadImages(folder);
            });
        }
    }

    clearGrid() {
        this.imageGrid.innerHTML = '';
    }

    renderFoldersAndImages(data) {
        // Render folders first
        data.folders.forEach(folder => {
            const folderItem = this.createFolderItem(folder);
            this.imageGrid.appendChild(folderItem);
        });

        // Then render images
        data.images.forEach(imageData => {
            // Handle both string paths and object format
            const imagePath = typeof imageData === 'string' ? imageData : imageData.url || imageData.path;
            const imageItem = this.createImageItem(imagePath, imageData);
            this.imageGrid.appendChild(imageItem);
        });

        console.log(`🖼️ Rendered ${data.folders.length} folders and ${data.images.length} images`);
    }

    renderImages(images) {
        images.forEach(imagePath => {
            const imageItem = this.createImageItem(imagePath);
            this.imageGrid.appendChild(imageItem);
        });

        console.log(`🖼️ Rendered ${images.length} images`);
    }

    createFolderItem(folder) {
        const folderItem = document.createElement('div');
        folderItem.className = 'folder-item';
        folderItem.style.cssText = `
            cursor: pointer;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            background: #f8fafc;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 80px;
        `;

        // Create folder icon and name
        const folderIcon = document.createElement('div');
        folderIcon.style.cssText = `
            font-size: 2em;
            margin-bottom: 5px;
            color: #3b82f6;
        `;
        folderIcon.textContent = '📁';

        const folderName = document.createElement('div');
        folderName.style.cssText = `
            font-size: 0.8em;
            color: #374151;
            font-weight: 500;
        `;
        folderName.textContent = folder.name;

        // Add hover effects
        folderItem.addEventListener('mouseenter', () => {
            folderItem.style.transform = 'scale(1.05)';
            folderItem.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            folderItem.style.borderColor = '#3b82f6';
        });

        folderItem.addEventListener('mouseleave', () => {
            folderItem.style.transform = 'scale(1)';
            folderItem.style.boxShadow = 'none';
            folderItem.style.borderColor = '#e2e8f0';
        });

        // Add click handler to navigate to folder
        folderItem.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent sidebar from closing
            event.preventDefault();
            this.loadImages(folder.path);
        });

        folderItem.appendChild(folderIcon);
        folderItem.appendChild(folderName);
        return folderItem;
    }

    createImageItem(imagePath, imageData = null) {
        console.log('🖼️ Creating image item for:', imagePath, imageData);

        const imageItem = document.createElement('div');
        imageItem.className = 'image-item';
        imageItem.style.cursor = 'pointer';
        imageItem.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';

        // Create image element
        const img = document.createElement('img');
        img.src = imagePath;
        img.alt = this.getImageName(imagePath, imageData);
        img.style.width = '100%';
        img.style.height = '80px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '4px';
        img.style.border = '1px solid #e2e8f0';

        // Add loading and error handling
        img.addEventListener('load', () => {
            console.log('🖼️ Image loaded:', imagePath);
        });

        img.addEventListener('error', () => {
            console.error('🖼️ Failed to load image:', imagePath);
            img.src = '/images/placeholder.png'; // Fallback to placeholder
            img.alt = 'Failed to load';
        });

        // Add hover effects
        imageItem.addEventListener('mouseenter', () => {
            imageItem.style.transform = 'scale(1.05)';
            imageItem.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        });

        imageItem.addEventListener('mouseleave', () => {
            imageItem.style.transform = 'scale(1)';
            imageItem.style.boxShadow = 'none';
        });

        // Add click handler to add image to canvas
        imageItem.addEventListener('click', () => {
            this.addImageToCanvas(imagePath);
        });

        imageItem.appendChild(img);
        return imageItem;
    }

    getImageName(imagePath, imageData = null) {
        // Handle both string paths and object format
        if (imageData && imageData.name) {
            return imageData.name.split('.')[0];
        }

        // Fallback to path parsing if imagePath is a string
        if (typeof imagePath === 'string') {
            return imagePath.split('/').pop().split('.')[0];
        }

        // If imagePath is an object, try to extract name
        if (imagePath && typeof imagePath === 'object') {
            if (imagePath.name) return imagePath.name.split('.')[0];
            if (imagePath.url) return imagePath.url.split('/').pop().split('.')[0];
            if (imagePath.path) return imagePath.path.split('/').pop().split('.')[0];
        }

        // Final fallback
        return 'Unknown Image';
    }

    addImageToCanvas(imagePath) {
        console.log('🖼️ Adding image to canvas:', imagePath);

        try {
            // Create a new image object
            const img = new Image();
            img.crossOrigin = 'anonymous'; // Handle CORS if needed

            img.onload = () => {
                // Use the existing handleAddImage function if available
                if (typeof window.addImageToCanvas === 'function') {
                    window.addImageToCanvas(img, imagePath);
                } else {
                    // Fallback: call the design editor's image creation function
                    this.createImageObject(img, imagePath);
                }

                // Show success feedback
                if (window.showToast) {
                    window.showToast('Image added to canvas', 'success');
                }
            };

            img.onerror = () => {
                console.error('🖼️ Failed to load image for canvas:', imagePath);
                if (window.showToast) {
                    window.showToast('Failed to load image', 'error');
                }
            };

            img.src = imagePath;

        } catch (error) {
            console.error('🖼️ Error adding image to canvas:', error);
            if (window.showToast) {
                window.showToast('Error adding image to canvas', 'error');
            }
        }
    }

    createImageObject(img, imagePath) {
        // This function integrates with the existing design editor
        if (typeof window.createImageObject === 'function' &&
            Array.isArray(window.canvasObjects) &&
            typeof window.selectedObjectIndex !== 'undefined' &&
            typeof window.update === 'function') {

            // Get canvas center position
            const canvas = document.getElementById('demo');
            if (!canvas) return;

            const viewCenterX = canvas.clientWidth / 2;
            const viewCenterY = canvas.clientHeight / 2;

            // Convert to world coordinates if canvasToWorld function exists
            let worldCenter = { x: viewCenterX, y: viewCenterY };
            if (typeof window.canvasToWorld === 'function') {
                worldCenter = window.canvasToWorld(viewCenterX, viewCenterY);
            }

            // Create the image object
            const newObj = window.createImageObject(img, {
                x: worldCenter.x + (Math.random() * 40 - 20) / (window.scale || 1),
                y: worldCenter.y + (Math.random() * 40 - 20) / (window.scale || 1),
                imageUrl: imagePath
            });

            // Ensure the object was created successfully
            if (!newObj) {
                console.error('🖼️ Failed to create image object');
                return;
            }

            // Deselect current object safely
            if (window.selectedObjectIndex !== -1 &&
                window.selectedObjectIndex < window.canvasObjects.length &&
                window.canvasObjects[window.selectedObjectIndex]) {
                window.canvasObjects[window.selectedObjectIndex].isSelected = false;
            }

            // Add to canvas and select
            window.canvasObjects.push(newObj);
            window.selectedObjectIndex = window.canvasObjects.length - 1;
            newObj.isSelected = true;

            // Update UI and canvas
            if (typeof window.updateUIFromSelectedObject === 'function') {
                window.updateUIFromSelectedObject();
            }
            window.update();

            // 🚀 AUTOMATION: Check if a layout is selected and run automated workflow
            this.checkForLayoutAutomation(newObj);

            // Save state for undo/redo
            if (typeof window.saveState === 'function') {
                window.saveState('Add Stock Image');
            }

            console.log('🖼️ Stock image added to canvas successfully');
        } else {
            console.error('🖼️ Design editor functions not available');
        }
    }

    // 🚀 AUTOMATION: Check if layout is selected and run automated workflow
    checkForLayoutAutomation(newImageObj) {
        try {
            // Check if a layout rectangle is selected
            const isLayoutSelected = window.selectedLayoutRectIndex !== undefined &&
                                   window.selectedLayoutRectIndex !== -1 &&
                                   window.layoutRectangles &&
                                   window.layoutRectangles[window.selectedLayoutRectIndex];

            if (!isLayoutSelected) {
                console.log('🚀 AUTOMATION: No layout selected, using normal workflow');
                return;
            }

            console.log('🚀 AUTOMATION: Layout detected! Starting automated workflow...');

            // Show user feedback
            if (window.showToast) {
                window.showToast('🚀 Auto-fitting image to selected layout...', 'info');
            }

            // Run the automated workflow with a small delay to ensure UI is updated
            setTimeout(() => {
                this.runAutomatedWorkflow(newImageObj);
            }, 100);

        } catch (error) {
            console.error('🚀 AUTOMATION: Error in automation check:', error);
        }
    }

    // 🚀 AUTOMATION: Run the step-by-step workflow with spacebar pauses
    async runAutomatedWorkflow(imageObj) {
        // 🚨 CRITICAL: Prevent multiple simultaneous automations
        if (this.isAutomationRunning) {
            console.log('🚀 AUTOMATION: ⚠️ Automation already running, skipping duplicate call');
            return;
        }

        this.isAutomationRunning = true;
        console.log('🚀 AUTOMATION: 🔒 Starting automation workflow (locked)');

        try {
            console.log('🚀 AUTOMATION: Step 1 - Image already added to canvas ✅');

            // Step 2: Draw fitting rectangles
            console.log('🚀 AUTOMATION: Step 2 - Drawing fitting rectangles...');
            if (window.showToast) {
                window.showToast('🚀 Step 2: Drawing fitting rectangles...', 'info');
            }
            if (typeof window.drawFittingRectangleAroundShape === 'function') {
                window.drawFittingRectangleAroundShape();
                await this.delay(200); // Wait for rectangles to be created
            } else {
                throw new Error('drawFittingRectangleAroundShape function not available');
            }

            // Step 3: Move rectangles to layout
            console.log('🚀 AUTOMATION: Step 3 - Moving rectangles to layout...');
            if (window.showToast) {
                window.showToast('🚀 Step 3: Moving rectangles to layout...', 'info');
            }
            if (typeof window.fitGreenRectangleInLayout === 'function') {
                window.fitGreenRectangleInLayout();
                await this.delay(200); // Wait for movement to complete
            } else {
                throw new Error('fitGreenRectangleInLayout function not available');
            }

            // Step 4: Copy and delete the shape (simulating cut operation)
            console.log('🚀 AUTOMATION: Step 4 - Copying and deleting shape...');
            if (window.showToast) {
                window.showToast('🚀 Step 4: Copying shape...', 'info');
            }
            if (typeof window.copySelectedElement === 'function') {
                window.copySelectedElement();
                await this.delay(100);

                // Now delete the original shape
                if (typeof window.handleDeleteObject === 'function') {
                    console.log('🚀 AUTOMATION: Deleting original shape...');
                    window.handleDeleteObject();
                    await this.delay(100);
                } else {
                    console.log('🚀 AUTOMATION: handleDeleteObject not available, shape will remain');
                }
            } else {
                throw new Error('copySelectedElement function not available');
            }

            // Step 5: Semi-automated - Manual red rectangle selection
            console.log('🚀 AUTOMATION: Step 5 - Semi-automated pasting...');
            console.log('🚀 AUTOMATION: ⏸️ SEMI-AUTOMATED PAUSE');
            console.log('🚀 AUTOMATION: 👆 Please manually click on the RED rectangle');
            console.log('🚀 AUTOMATION: ⌨️ Then press SPACEBAR to continue with pasting');

            if (window.showToast) {
                window.showToast('🚀 Step 5: MANUAL STEP - Please select the RED rectangle and press SPACEBAR', 'warning');
            }

            await this.waitForSpacebar('Manual red rectangle selection');

            // Paste the shape
            if (typeof window.pasteElement === 'function') {
                console.log('🚀 AUTOMATION: About to paste - DETAILED selection state:');
                console.log('🚀 AUTOMATION: selectedObjectIndex:', window.selectedObjectIndex);
                console.log('🚀 AUTOMATION: selectedLayoutRectIndex:', window.selectedLayoutRectIndex);
                console.log('🚀 AUTOMATION: canvasObjects length:', window.canvasObjects?.length);
                console.log('🚀 AUTOMATION: Selected object:', window.canvasObjects[window.selectedObjectIndex]);
                console.log('🚀 AUTOMATION: Selected object type:', window.canvasObjects[window.selectedObjectIndex]?.type);
                console.log('🚀 AUTOMATION: Selected object isShapeBoundingBox:', window.canvasObjects[window.selectedObjectIndex]?.isShapeBoundingBox);
                console.log('🚀 AUTOMATION: Selected object isTextBoundingBox:', window.canvasObjects[window.selectedObjectIndex]?.isTextBoundingBox);
                console.log('🚀 AUTOMATION: layoutRectangles:', window.layoutRectangles);
                console.log('🚀 AUTOMATION: layoutRectangles length:', window.layoutRectangles?.length);

                // Check if red rectangle selection is properly detected
                const selectedObject = window.canvasObjects[window.selectedObjectIndex];
                const isRedRectSelected = selectedObject &&
                                        selectedObject.type === 'rectangle' &&
                                        (selectedObject.isTextBoundingBox === true || selectedObject.isShapeBoundingBox === true);
                console.log('🚀 AUTOMATION: isRedRectSelected calculation:', isRedRectSelected);

                if (!isRedRectSelected) {
                    console.log('🚀 AUTOMATION: ⚠️ Warning: Red rectangle may not be selected properly');
                    if (window.showToast) {
                        window.showToast('🚀 AUTOMATION: ⚠️ Warning: Red rectangle may not be selected', 'warning');
                    }
                }

                window.pasteElement();
                await this.delay(200);
                if (window.showToast) {
                    window.showToast('🚀 Step 5: Shape pasted successfully!', 'success');
                }
            } else {
                throw new Error('pasteElement function not available');
            }

            // Step 6: Clean rectangles
            console.log('🚀 AUTOMATION: Step 6 - Cleaning rectangles...');
            if (window.showToast) {
                window.showToast('🚀 Step 6: Cleaning rectangles...', 'info');
            }
            if (typeof window.cleanAllRectangles === 'function') {
                window.cleanAllRectangles();
                await this.delay(100);
                if (window.showToast) {
                    window.showToast('🚀 ✅ AUTOMATION COMPLETE! Shape successfully added to layout.', 'success');
                }
            } else {
                throw new Error('cleanAllRectangles function not available');
            }

            console.log('🚀 AUTOMATION: ✅ Automated workflow completed successfully!');
            if (window.showToast) {
                window.showToast('🎉 Image automatically fitted to layout!', 'success');
            }

        } catch (error) {
            console.error('🚀 AUTOMATION: ❌ Workflow failed:', error);
            if (window.showToast) {
                window.showToast('❌ Automation failed: ' + error.message, 'error');
            }
        } finally {
            // 🚨 CRITICAL: Always unlock automation when workflow ends
            this.isAutomationRunning = false;
            console.log('🚀 AUTOMATION: 🔓 Automation workflow unlocked');
        }
    }

    // 🚀 AUTOMATION: Helper function to add delays
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 🚀 AUTOMATION: Wait for spacebar press
    waitForSpacebar(stepName) {
        return new Promise((resolve) => {
            console.log(`🚀 AUTOMATION: Waiting for SPACEBAR to continue from ${stepName}...`);

            const handleKeyPress = (event) => {
                if (event.code === 'Space' || event.key === ' ') {
                    event.preventDefault();
                    document.removeEventListener('keydown', handleKeyPress);
                    console.log(`🚀 AUTOMATION: SPACEBAR pressed, continuing from ${stepName}`);
                    resolve();
                }
            };

            document.addEventListener('keydown', handleKeyPress);
        });
    }

    // 🚀 AUTOMATION: Find the red rectangle (shape bounding box)
    findRedRectangle() {
        if (!window.canvasObjects || !Array.isArray(window.canvasObjects)) {
            console.log('🚀 AUTOMATION: ❌ canvasObjects not available');
            return null;
        }

        console.log('🚀 AUTOMATION: Searching for red rectangle in', window.canvasObjects.length, 'objects');

        // Look for the most recently created red rectangle (shape bounding box)
        for (let i = window.canvasObjects.length - 1; i >= 0; i--) {
            const obj = window.canvasObjects[i];
            console.log(`🚀 AUTOMATION: Checking object ${i}:`, {
                id: obj?.id,
                type: obj?.type,
                isShapeBoundingBox: obj?.isShapeBoundingBox,
                isFittingRectangle: obj?.isFittingRectangle
            });

            if (obj && obj.type === 'rectangle' && obj.isShapeBoundingBox) {
                console.log('🚀 AUTOMATION: ✅ Found red rectangle:', obj.id, 'at index:', i);
                return obj;
            }
        }

        console.log('🚀 AUTOMATION: ❌ No red rectangle found');
        console.log('🚀 AUTOMATION: Available rectangles:',
            window.canvasObjects.filter(obj => obj?.type === 'rectangle').map(obj => ({
                id: obj.id,
                isShapeBoundingBox: obj.isShapeBoundingBox,
                isFittingRectangle: obj.isFittingRectangle
            }))
        );
        return null;
    }

    // 🚀 AUTOMATION: Select the red rectangle by simulating a real mouse click
    async selectRedRectangle(redRect) {
        if (!window.canvasObjects || !Array.isArray(window.canvasObjects)) {
            console.log('🚀 AUTOMATION: ❌ canvasObjects not available');
            return false;
        }

        // Find the index of the red rectangle
        const redRectIndex = window.canvasObjects.findIndex(obj => obj.id === redRect.id);
        if (redRectIndex === -1) {
            console.log('🚀 AUTOMATION: ❌ Red rectangle not found in canvas objects');
            return false;
        }

        console.log('🚀 AUTOMATION: Found red rectangle at index:', redRectIndex);
        console.log('🚀 AUTOMATION: Red rectangle object:', redRect);

        // 🔧 CRITICAL: Simulate a real mouse click on the red rectangle
        // This will trigger the full selection pipeline including layout deselection
        try {
            let canvas = document.getElementById('canvas');
            if (!canvas) {
                console.log('🚀 AUTOMATION: ❌ Canvas element not found, trying alternative selectors...');

                // Try alternative canvas selectors
                const canvasAlt1 = document.querySelector('canvas');
                const canvasAlt2 = document.querySelector('#design-canvas');
                const canvasAlt3 = document.querySelector('.canvas-container canvas');

                canvas = canvasAlt1 || canvasAlt2 || canvasAlt3;
                if (!canvas) {
                    console.log('🚀 AUTOMATION: ❌ No canvas element found with any selector');
                    return false;
                }
                console.log('🚀 AUTOMATION: ✅ Found canvas using alternative selector');
            }

            // Calculate the screen position of the red rectangle center
            const rect = canvas.getBoundingClientRect();
            const scale = window.scale || 1;
            const panX = window.panX || 0;
            const panY = window.panY || 0;

            console.log('🚀 AUTOMATION: Canvas rect:', rect);
            console.log('🚀 AUTOMATION: Red rectangle world coords:', {x: redRect.x, y: redRect.y, width: redRect.width, height: redRect.height});
            console.log('🚀 AUTOMATION: Transform values:', {scale, panX, panY});

            // Convert world coordinates to screen coordinates
            const screenX = (redRect.x + panX) * scale;
            const screenY = (redRect.y + panY) * scale;

            console.log('🚀 AUTOMATION: Screen coordinates:', {screenX, screenY});

            // Calculate the click position on the canvas
            const clickX = rect.left + screenX;
            const clickY = rect.top + screenY;

            console.log('🚀 AUTOMATION: Final click position:', {clickX, clickY});

            console.log('🚀 AUTOMATION: Simulating click at screen position:', {
                worldPos: { x: redRect.x, y: redRect.y },
                screenPos: { x: screenX, y: screenY },
                clickPos: { x: clickX, y: clickY },
                scale: scale,
                pan: { x: panX, y: panY }
            });

            // Create and dispatch a synthetic mouse event
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: clickX,
                clientY: clickY,
                button: 0, // Left mouse button
                bubbles: true,
                cancelable: true,
                view: window
            });

            console.log('🚀 AUTOMATION: Dispatching mouse event:', {
                type: 'mousedown',
                clientX: clickX,
                clientY: clickY,
                button: 0,
                target: canvas.tagName,
                canvasId: canvas.id
            });

            const result = canvas.dispatchEvent(mouseEvent);
            console.log('🚀 AUTOMATION: ✅ Synthetic mouse click dispatched, result:', result);

            // Give the event time to process
            await new Promise(resolve => setTimeout(resolve, 100));

            return true;

        } catch (error) {
            console.log('🚀 AUTOMATION: ❌ Failed to simulate click:', error.message);

            // Fallback to programmatic selection if click simulation fails
            console.log('🚀 AUTOMATION: Falling back to programmatic selection...');
            window.selectedObjectIndex = redRectIndex;
            redRect.isSelected = true;

            // Clear layout selection manually as fallback
            if (typeof window.selectedLayoutRectIndex !== 'undefined') {
                window.selectedLayoutRectIndex = -1;
            }

            return true;
        }

        // Force update of selection state
        if (typeof window.syncGlobalReferences === 'function') {
            window.syncGlobalReferences();
        }

        // 🔧 CRITICAL: Force layout deselection by calling internal function if available
        if (typeof window.updateLayoutSelectionUI === 'function') {
            console.log('🚀 AUTOMATION: Calling updateLayoutSelectionUI to ensure layout is deselected');
            window.updateLayoutSelectionUI();
        }

        // Update UI
        if (typeof window.updateUIFromSelectedObject === 'function') {
            window.updateUIFromSelectedObject();
        }
        if (typeof window.update === 'function') {
            window.update();
        }

        console.log('🚀 AUTOMATION: ✅ Red rectangle selected successfully:', redRectIndex);
        return true;
    }
}

// Initialize the images loader when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const imagesLoader = new ImagesLoader();
    imagesLoader.init();

    // Make it globally available for debugging
    window.imagesLoader = imagesLoader;
});

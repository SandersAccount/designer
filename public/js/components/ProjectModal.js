import { showToast } from './Toast.js';

// Define the ProjectModal component
class ProjectModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.projectData = null;
        this.render();
    }

    render() {
        const style = `
            .modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: none;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            }

            .modal.show {
                display: flex;
            }

            .modal-content {
                background: #1a1a1a;
                border-radius: 12px;
                padding: 0;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                border: 1px solid rgba(255,255,255,0.1);
            }

            .modal-header {
                padding: 1.5rem;
                border-bottom: 1px solid rgba(255,255,255,0.1);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .modal-header h2 {
                margin: 0;
                color: #fff;
                font-size: 1.25rem;
                font-weight: 600;
            }

            .close-modal {
                background: none;
                border: none;
                color: #999;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .close-modal:hover {
                color: #fff;
            }

            .folders-list {
                padding: 1.5rem;
                max-height: 400px;
                overflow-y: auto;
            }

            .folder-item {
                background: #2a2a2a;
                border-radius: 8px;
                padding: 1rem;
                margin: 0.5rem 0;
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
                color: #fff;
                transition: all 0.2s;
                border: 2px solid transparent;
            }

            .folder-item:hover {
                background: #333;
                border-color: rgba(59, 130, 246, 0.3);
            }

            .folder-item.selected {
                border-color: #3b82f6;
                background: rgba(59, 130, 246, 0.1);
            }

            .folder-item.create-new {
                border: 2px dashed #4a5568;
                background: transparent;
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 8px;
                color: #4CAF50;
            }

            .folder-item.create-new:hover {
                border-color: #4CAF50;
                background: rgba(76, 175, 80, 0.1);
            }

            .folder-info {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }

            .folder-icon {
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .folder-name {
                font-size: 1rem;
                font-weight: 500;
                color: #fff;
            }

            .folder-count {
                color: #888;
                font-size: 0.9rem;
            }

            .modal-footer {
                padding: 1.5rem;
                border-top: 1px solid rgba(255,255,255,0.1);
                display: flex;
                gap: 1rem;
                justify-content: flex-end;
            }

            .btn {
                padding: 0.75rem 1.5rem;
                border: none;
                border-radius: 8px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
            }

            .btn-primary {
                background: #3b82f6;
                color: white;
            }

            .btn-primary:hover {
                background: #2563eb;
            }

            .btn-primary:disabled {
                background: #374151;
                cursor: not-allowed;
            }

            .btn-secondary {
                background: #374151;
                color: white;
            }

            .btn-secondary:hover {
                background: #4b5563;
            }

            .divider {
                text-align: center;
                margin: 20px 0;
                color: #666;
            }

            .project-form {
                padding: 1.5rem;
            }

            .form-group {
                margin-bottom: 1rem;
            }

            .form-label {
                display: block;
                margin-bottom: 0.5rem;
                color: #fff;
                font-weight: 500;
            }

            .form-input {
                width: 100%;
                padding: 0.75rem;
                border: 1px solid rgba(255,255,255,0.2);
                border-radius: 6px;
                background: #2a2a2a;
                color: #fff;
                font-size: 1rem;
                box-sizing: border-box;
            }

            .form-input:focus {
                outline: none;
                border-color: #3b82f6;
            }

            .form-textarea {
                resize: vertical;
                min-height: 80px;
            }
        `;

        this.shadowRoot.innerHTML = `
            <style>${style}</style>
            <div class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Save Project</h2>
                        <button class="close-modal">&times;</button>
                    </div>
                    <div class="project-form">
                        <div class="form-group">
                            <label class="form-label" for="projectTitle">Project Title</label>
                            <input type="text" id="projectTitle" class="form-input" placeholder="Enter project title..." required>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="projectDescription">Description (Optional)</label>
                            <textarea id="projectDescription" class="form-input form-textarea" placeholder="Enter project description..."></textarea>
                        </div>
                    </div>
                    <div class="folders-list">
                        <!-- Folders will be loaded here -->
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="cancelBtn">Cancel</button>
                        <button class="btn btn-primary" id="saveBtn">Save Project</button>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Close modal events
        this.shadowRoot.querySelector('.close-modal').addEventListener('click', () => this.hide());
        this.shadowRoot.querySelector('#cancelBtn').addEventListener('click', () => this.hide());
        
        // Save project event
        this.shadowRoot.querySelector('#saveBtn').addEventListener('click', () => this.saveProject());
        
        // Close on overlay click
        this.shadowRoot.querySelector('.modal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.hide();
        });

        // Enter key to save
        this.shadowRoot.querySelector('#projectTitle').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.saveProject();
        });
    }

    async show(projectData = null) {
        console.log('[ProjectModal] show() called with projectData:', projectData);

        // If projectData is provided, use it
        if (projectData) {
            this.projectData = projectData;
            console.log('[ProjectModal] Project data set from parameter:', this.projectData);
        }

        // If we still don't have project data, try to get it from the current editor state
        if (!this.projectData) {
            console.log('[ProjectModal] No project data provided, attempting to get current editor state...');
            this.projectData = this.getCurrentEditorState();
            console.log('[ProjectModal] Generated project data from editor state:', this.projectData);
        }

        await this.loadFolders();
        this.shadowRoot.querySelector('.modal').classList.add('show');

        // Focus on title input
        setTimeout(() => {
            this.shadowRoot.querySelector('#projectTitle').focus();
        }, 100);
    }

    getCurrentEditorState() {
        // This method is no longer used since we get data from the event
        // But keeping it for compatibility
        return null;
    }

    cleanObjectForSerialization(obj) {
        // Create a clean copy without circular references (same as template saving)
        const cleanObj = {};

        // Copy basic properties
        const basicProps = ['id', 'type', 'text', 'x', 'y', 'fontSize', 'fontFamily', 'color', 'bold', 'italic',
                           'rotation', 'scale', 'opacity', 'letterSpacing', 'effectMode', 'skewX', 'skewY'];

        basicProps.forEach(prop => {
            if (obj.hasOwnProperty(prop)) {
                cleanObj[prop] = obj[prop];
            }
        });

        // Copy image-specific properties
        if (obj.type === 'image') {
            if (obj.imageUrl) cleanObj.imageUrl = obj.imageUrl;
            if (obj.src) cleanObj.src = obj.src;
            if (obj.width !== undefined) cleanObj.width = obj.width;
            if (obj.height !== undefined) cleanObj.height = obj.height;
        }

        // Copy text-specific properties
        if (obj.type === 'text') {
            if (obj.width !== undefined) cleanObj.width = obj.width;
            if (obj.height !== undefined) cleanObj.height = obj.height;
            if (obj.textAlign) cleanObj.textAlign = obj.textAlign;
            if (obj.gradient) cleanObj.gradient = obj.gradient;

            // Copy all effect properties
            const effectProps = ['warpCurve', 'warpOffset', 'warpHeight', 'warpBottom', 'warpTriangle', 'warpShiftCenter',
                                'circleDiameter', 'circleKerning', 'circleFlip', 'shadowMode', 'shadowColor', 'shadowOffsetX',
                                'shadowOffsetY', 'shadowBlur', 'blockShadowColor', 'blockShadowOpacity', 'blockShadowOffset',
                                'blockShadowAngle', 'blockShadowBlur', 'lineShadowColor', 'lineShadowDist', 'lineShadowAngle',
                                'lineShadowThickness', 'd3dPrimaryColor', 'd3dPrimaryOpacity', 'd3dOffset', 'd3dAngle', 'd3dBlur',
                                'd3dSecondaryColor', 'd3dSecondaryOpacity', 'd3dSecondaryWidth', 'd3dSecondaryOffsetX', 'd3dSecondaryOffsetY',
                                'strokeMode', 'strokeWidth', 'strokeColor', 'decorationMode', 'hLineWeight', 'hLineDist', 'hLineColor',
                                'hLineCoverage', 'ccDist', 'ccColor', 'ccFillDir', 'ccCoverage', 'oLineWeight', 'oLineDist', 'oLineColor',
                                'oCoverage', 'flcDist', 'flcColor', 'flcWeight', 'flcSpacing', 'flcDir', 'flcCoverage', 'gridPadding'];

            effectProps.forEach(prop => {
                if (obj[prop] !== undefined) {
                    cleanObj[prop] = obj[prop];
                }
            });

            // Handle mesh warp data
            if (obj.meshWarp) {
                cleanObj.meshWarp = obj.meshWarp;
            }

            // Handle other effect properties
            if (obj.curveAmount !== undefined) cleanObj.curveAmount = obj.curveAmount;
            if (obj.curveKerning !== undefined) cleanObj.curveKerning = obj.curveKerning;
            if (obj.curveFlip !== undefined) cleanObj.curveFlip = obj.curveFlip;
            if (obj.diameter !== undefined) cleanObj.diameter = obj.diameter;
            if (obj.kerning !== undefined) cleanObj.kerning = obj.kerning;
            if (obj.flip !== undefined) cleanObj.flip = obj.flip;
        }

        // Remove any circular references or handlers
        delete cleanObj._meshWarpHandler;
        delete cleanObj.isSelected;
        delete cleanObj.image; // Remove actual Image object

        return cleanObj;
    }

    generateCanvasThumbnail(editorState) {
        try {
            console.log('[ProjectModal] generateCanvasThumbnail input:', editorState);

            const canvasObjects = editorState.canvasObjects || [];

            if (canvasObjects.length === 0) {
                console.log('[ProjectModal] No objects to render, creating placeholder');
                return this.createPlaceholderImage();
            }

            // Calculate bounding box of all objects
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

            canvasObjects.forEach(obj => {
                const objX = obj.x || 0;
                const objY = obj.y || 0;
                const objWidth = obj.width || 100;
                const objHeight = obj.height || 50;

                minX = Math.min(minX, objX);
                minY = Math.min(minY, objY);
                maxX = Math.max(maxX, objX + objWidth);
                maxY = Math.max(maxY, objY + objHeight);
            });

            // Add some padding
            const padding = 50;
            minX -= padding;
            minY -= padding;
            maxX += padding;
            maxY += padding;

            const contentWidth = maxX - minX;
            const contentHeight = maxY - minY;

            console.log('[ProjectModal] Content bounds:', { minX, minY, maxX, maxY, contentWidth, contentHeight });

            // Create thumbnail canvas
            const thumbnailCanvas = document.createElement('canvas');
            const thumbnailWidth = 400;
            const thumbnailHeight = Math.round((contentHeight / contentWidth) * thumbnailWidth);

            thumbnailCanvas.width = thumbnailWidth;
            thumbnailCanvas.height = thumbnailHeight;
            const ctx = thumbnailCanvas.getContext('2d');

            // Fill with background color
            ctx.fillStyle = editorState.canvasBackgroundColor || '#ffffff';
            ctx.fillRect(0, 0, thumbnailWidth, thumbnailHeight);

            // Calculate scale factor
            const scale = thumbnailWidth / contentWidth;

            // Render canvas objects
            canvasObjects.forEach(obj => {
                ctx.save();

                // Convert object position to thumbnail coordinates
                const relativeX = (obj.x - minX) * scale;
                const relativeY = (obj.y - minY) * scale;
                const scaledWidth = (obj.width || 100) * scale;
                const scaledHeight = (obj.height || 50) * scale;

                if (obj.type === 'text') {
                    // Render text
                    ctx.fillStyle = obj.color || '#000000';
                    ctx.font = `${Math.max(12, (obj.fontSize || 24) * scale)}px ${obj.fontFamily || 'Arial'}`;
                    ctx.textAlign = obj.textAlign || 'left';
                    ctx.textBaseline = 'top';
                    ctx.fillText(obj.text || 'Text', relativeX, relativeY);
                } else if (obj.type === 'image' && obj.src) {
                    // Render image placeholder
                    ctx.fillStyle = '#e5e7eb';
                    ctx.fillRect(relativeX, relativeY, scaledWidth, scaledHeight);
                    ctx.strokeStyle = '#9ca3af';
                    ctx.strokeRect(relativeX, relativeY, scaledWidth, scaledHeight);

                    // Add image icon
                    ctx.fillStyle = '#6b7280';
                    ctx.font = `${Math.max(16, scaledWidth/4)}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('🖼️', relativeX + scaledWidth/2, relativeY + scaledHeight/2);
                } else if (obj.type === 'shape') {
                    // Render shape
                    ctx.fillStyle = obj.fill || '#3b82f6';
                    if (obj.shape === 'circle') {
                        ctx.beginPath();
                        ctx.arc(relativeX + scaledWidth/2, relativeY + scaledHeight/2, Math.min(scaledWidth, scaledHeight)/2, 0, 2 * Math.PI);
                        ctx.fill();
                    } else {
                        // Rectangle or other shapes
                        ctx.fillRect(relativeX, relativeY, scaledWidth, scaledHeight);
                    }
                }

                ctx.restore();
            });

            return thumbnailCanvas.toDataURL('image/png');
        } catch (error) {
            console.error('[ProjectModal] Error generating canvas thumbnail:', error);
            return this.createPlaceholderImage();
        }
    }

    generateArtboardThumbnail(editorState) {
        try {
            console.log('[ProjectModal] generateArtboardThumbnail input:', editorState);

            // Ensure artboard exists with fallback values
            const artboard = editorState.artboard || {
                x: 0,
                y: 0,
                width: 800,
                height: 600
            };

            console.log('[ProjectModal] Using artboard:', artboard);

            const canvasObjects = editorState.canvasObjects || [];

            // Create thumbnail canvas with artboard dimensions
            const thumbnailCanvas = document.createElement('canvas');
            const thumbnailWidth = 400;
            const thumbnailHeight = Math.round((artboard.height / artboard.width) * thumbnailWidth);

            thumbnailCanvas.width = thumbnailWidth;
            thumbnailCanvas.height = thumbnailHeight;
            const ctx = thumbnailCanvas.getContext('2d');

            // Fill with background color
            ctx.fillStyle = editorState.canvasBackgroundColor || '#ffffff';
            ctx.fillRect(0, 0, thumbnailWidth, thumbnailHeight);

            // Calculate scale factor
            const scaleX = thumbnailWidth / artboard.width;
            const scaleY = thumbnailHeight / artboard.height;
            const scale = Math.min(scaleX, scaleY);

            // Render canvas objects that are within the artboard
            canvasObjects.forEach(obj => {
                // Check if object intersects with artboard
                const objX = obj.x || 0;
                const objY = obj.y || 0;
                const objWidth = obj.width || 100;
                const objHeight = obj.height || 50;

                // Skip objects that are completely outside the artboard
                if (objX + objWidth < artboard.x || objX > artboard.x + artboard.width ||
                    objY + objHeight < artboard.y || objY > artboard.y + artboard.height) {
                    return;
                }

                ctx.save();

                // Convert object position to artboard-relative coordinates
                const relativeX = (objX - artboard.x) * scale;
                const relativeY = (objY - artboard.y) * scale;
                const scaledWidth = objWidth * scale;
                const scaledHeight = objHeight * scale;

                if (obj.type === 'text') {
                    // Render text
                    ctx.fillStyle = obj.color || '#000000';
                    ctx.font = `${Math.max(12, (obj.fontSize || 24) * scale)}px ${obj.fontFamily || 'Arial'}`;
                    ctx.textAlign = obj.textAlign || 'left';
                    ctx.textBaseline = 'top';
                    ctx.fillText(obj.text || 'Text', relativeX, relativeY);
                } else if (obj.type === 'image' && obj.src) {
                    // Render image placeholder
                    ctx.fillStyle = '#e5e7eb';
                    ctx.fillRect(relativeX, relativeY, scaledWidth, scaledHeight);
                    ctx.strokeStyle = '#9ca3af';
                    ctx.strokeRect(relativeX, relativeY, scaledWidth, scaledHeight);

                    // Add image icon
                    ctx.fillStyle = '#6b7280';
                    ctx.font = `${Math.max(16, scaledWidth/4)}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('🖼️', relativeX + scaledWidth/2, relativeY + scaledHeight/2);
                } else if (obj.type === 'shape') {
                    // Render shape
                    ctx.fillStyle = obj.fill || '#3b82f6';
                    if (obj.shape === 'circle') {
                        ctx.beginPath();
                        ctx.arc(relativeX + scaledWidth/2, relativeY + scaledHeight/2, Math.min(scaledWidth, scaledHeight)/2, 0, 2 * Math.PI);
                        ctx.fill();
                    } else {
                        // Rectangle or other shapes
                        ctx.fillRect(relativeX, relativeY, scaledWidth, scaledHeight);
                    }
                }

                ctx.restore();
            });

            return thumbnailCanvas.toDataURL('image/png');
        } catch (error) {
            console.error('[ProjectModal] Error generating artboard thumbnail:', error);
            return this.createPlaceholderImage();
        }
    }

    createPlaceholderImage() {
        try {
            // Create a small placeholder canvas
            const placeholderCanvas = document.createElement('canvas');
            placeholderCanvas.width = 400;
            placeholderCanvas.height = 300;
            const ctx = placeholderCanvas.getContext('2d');

            // Fill with a gradient background
            const gradient = ctx.createLinearGradient(0, 0, 400, 300);
            gradient.addColorStop(0, '#4f46e5');
            gradient.addColorStop(1, '#7c3aed');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 400, 300);

            // Add text
            ctx.fillStyle = '#ffffff';
            ctx.font = '24px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Project Preview', 200, 140);
            ctx.font = '16px Inter, sans-serif';
            ctx.fillText('No canvas content', 200, 170);

            return placeholderCanvas.toDataURL('image/png');
        } catch (error) {
            console.error('[ProjectModal] Error creating placeholder image:', error);
            // Return a minimal data URL as last resort
            return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
        }
    }

    hide() {
        this.shadowRoot.querySelector('.modal').classList.remove('show');
        this.clearForm();
    }

    clearForm() {
        this.shadowRoot.querySelector('#projectTitle').value = '';
        this.shadowRoot.querySelector('#projectDescription').value = '';
        this.selectedFolderId = null;
        this.updateSelectedFolder();
    }

    async loadFolders() {
        const foldersList = this.shadowRoot.querySelector('.folders-list');
        foldersList.innerHTML = '<div style="text-align: center; color: #666;">Loading folders...</div>';

        try {
            const response = await fetch('/api/project-folders', { credentials: 'include' });
            if (!response.ok) throw new Error('Failed to load folders');
            
            const folders = await response.json();
            this.displayFolders(folders);
        } catch (error) {
            console.error('Error loading folders:', error);
            foldersList.innerHTML = '<div style="text-align: center; color: #f87171;">Error loading folders</div>';
        }
    }

    displayFolders(folders) {
        const foldersList = this.shadowRoot.querySelector('.folders-list');
        
        foldersList.innerHTML = `
            <div class="folder-item create-new" data-folder-id="new">
                <i class="fas fa-plus"></i>
                <span>Create New Folder</span>
            </div>
            <div class="folder-item" data-folder-id="null">
                <div class="folder-info">
                    <div class="folder-icon" style="color: #3b82f6;">
                        <i class="fas fa-home"></i>
                    </div>
                    <span class="folder-name">Root Folder</span>
                </div>
                <span class="folder-count">Default</span>
            </div>
            ${folders.map(folder => `
                <div class="folder-item" data-folder-id="${folder._id}">
                    <div class="folder-info">
                        <div class="folder-icon" style="color: ${folder.color};">
                            <i class="fas fa-${folder.icon}"></i>
                        </div>
                        <span class="folder-name">${folder.title}</span>
                    </div>
                    <span class="folder-count">${folder.stats.projectCount} projects</span>
                </div>
            `).join('')}
        `;

        // Add click events to folder items
        foldersList.querySelectorAll('.folder-item').forEach(item => {
            item.addEventListener('click', () => {
                const folderId = item.getAttribute('data-folder-id');
                if (folderId === 'new') {
                    this.showNewFolderDialog();
                } else {
                    this.selectedFolderId = folderId === 'null' ? null : folderId;
                    this.updateSelectedFolder();
                }
            });
        });
    }

    updateSelectedFolder() {
        this.shadowRoot.querySelectorAll('.folder-item').forEach(item => {
            const folderId = item.getAttribute('data-folder-id');
            if (folderId === (this.selectedFolderId || 'null')) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }

    async showNewFolderDialog() {
        const folderName = prompt('Enter folder name:');
        if (!folderName) return;

        try {
            const response = await fetch('/api/project-folders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ title: folderName })
            });

            if (!response.ok) throw new Error('Failed to create folder');
            
            const newFolder = await response.json();
            showToast('Folder created successfully', 'success');
            
            // Reload folders and select the new one
            await this.loadFolders();
            this.selectedFolderId = newFolder._id;
            this.updateSelectedFolder();
            
        } catch (error) {
            console.error('Error creating folder:', error);
            showToast('Failed to create folder', 'error');
        }
    }

    async saveProject() {
        console.log('[ProjectModal] saveProject called');
        console.log('[ProjectModal] Current projectData:', this.projectData);

        const title = this.shadowRoot.querySelector('#projectTitle').value.trim();
        const description = this.shadowRoot.querySelector('#projectDescription').value.trim();

        console.log('[ProjectModal] Title:', title);
        console.log('[ProjectModal] Description:', description);

        if (!title) {
            showToast('Please enter a project title', 'error');
            return;
        }

        if (!this.projectData) {
            console.error('[ProjectModal] No project data available!');
            showToast('No project data to save', 'error');
            return;
        }

        try {
            const saveBtn = this.shadowRoot.querySelector('#saveBtn');
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';

            // Debug artboard data before sending
            console.log('[ProjectModal] 🔍 Raw artboard from projectData:', this.projectData.artboard);
            console.log('[ProjectModal] 🔍 Artboard properties:', {
                x: this.projectData.artboard?.x,
                y: this.projectData.artboard?.y,
                width: this.projectData.artboard?.width,
                height: this.projectData.artboard?.height
            });

            // Validate and fix artboard data (same as left-menu.js)
            const validatedArtboard = {
                x: typeof this.projectData.artboard?.x === 'number' ? this.projectData.artboard.x : 0,
                y: typeof this.projectData.artboard?.y === 'number' ? this.projectData.artboard.y : 0,
                width: typeof this.projectData.artboard?.width === 'number' ? this.projectData.artboard.width : 600,
                height: typeof this.projectData.artboard?.height === 'number' ? this.projectData.artboard.height : 600
            };

            console.log('[ProjectModal] 🔍 Validated artboard:', validatedArtboard);

            // Double-check each property is a valid number
            if (typeof validatedArtboard.x !== 'number' || isNaN(validatedArtboard.x)) {
                console.error('[ProjectModal] ❌ Invalid artboard.x:', validatedArtboard.x);
                validatedArtboard.x = 0;
            }
            if (typeof validatedArtboard.y !== 'number' || isNaN(validatedArtboard.y)) {
                console.error('[ProjectModal] ❌ Invalid artboard.y:', validatedArtboard.y);
                validatedArtboard.y = 0;
            }
            if (typeof validatedArtboard.width !== 'number' || isNaN(validatedArtboard.width)) {
                console.error('[ProjectModal] ❌ Invalid artboard.width:', validatedArtboard.width);
                validatedArtboard.width = 600;
            }
            if (typeof validatedArtboard.height !== 'number' || isNaN(validatedArtboard.height)) {
                console.error('[ProjectModal] ❌ Invalid artboard.height:', validatedArtboard.height);
                validatedArtboard.height = 600;
            }

            console.log('[ProjectModal] 🔍 Final validated artboard:', validatedArtboard);

            const projectPayload = {
                title,
                description,
                editorState: this.projectData.editorState,
                adminData: this.projectData.adminData,
                previewImageUrl: this.projectData.previewImageUrl,
                artboard: validatedArtboard, // Use validated artboard
                canvasObjects: this.projectData.canvasObjects, // Add canvasObjects at root level
                folderId: this.selectedFolderId,
                status: 'draft',
                // Include effect states from project data
                fontStylesList: this.projectData.fontStylesList || [],
                decorStylesList: this.projectData.decorStylesList || [],
                cssFilterState: this.projectData.cssFilterState || {},
                duotoneState: this.projectData.duotoneState || {},
                glitchState: this.projectData.glitchState || {},
                halftoneState: this.projectData.halftoneState || {}
            };

            console.log('[ProjectModal] ===== SAVE PAYLOAD DEBUG =====');
            console.log('[ProjectModal] Complete payload:', projectPayload);
            console.log('[ProjectModal] EditorState:', projectPayload.editorState);
            console.log('[ProjectModal] Artboard:', projectPayload.artboard);
            console.log('[ProjectModal] CanvasObjects length:', projectPayload.canvasObjects?.length);
            console.log('[ProjectModal] PreviewImageUrl:', projectPayload.previewImageUrl);
            console.log('[ProjectModal] 🎨 DuotoneState:', projectPayload.duotoneState);
            console.log('[ProjectModal] 🎨 GlitchState:', projectPayload.glitchState);
            console.log('[ProjectModal] 🎨 CssFilterState:', projectPayload.cssFilterState);

            console.log('[ProjectModal] Sending project payload:', projectPayload);

            // Debug the JSON serialization
            const jsonString = JSON.stringify(projectPayload);
            console.log('[ProjectModal] 🔍 JSON string length:', jsonString.length);
            console.log('[ProjectModal] 🔍 JSON artboard section:', jsonString.substring(jsonString.indexOf('"artboard"'), jsonString.indexOf('"artboard"') + 200));

            // Parse it back to see if there's any data loss
            const parsedBack = JSON.parse(jsonString);
            console.log('[ProjectModal] 🔍 Parsed back artboard:', parsedBack.artboard);

            // Final validation of parsed data
            if (!parsedBack.artboard || typeof parsedBack.artboard.x !== 'number') {
                console.error('[ProjectModal] ❌ CRITICAL: Artboard data corrupted during JSON serialization!');
                console.error('[ProjectModal] ❌ Original:', validatedArtboard);
                console.error('[ProjectModal] ❌ Parsed:', parsedBack.artboard);
                alert('Error: Artboard data corruption detected. Please try again.');
                return;
            }

            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: jsonString
            });

            console.log('[ProjectModal] Response status:', response.status);
            console.log('[ProjectModal] Response ok:', response.ok);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[ProjectModal] Server error response:', errorText);
                throw new Error(`Failed to save project: ${response.status} - ${errorText}`);
            }
            
            const savedProject = await response.json();
            showToast('Project saved successfully', 'success');
            
            this.hide();
            
            // Dispatch event to notify parent components
            this.dispatchEvent(new CustomEvent('projectSaved', {
                bubbles: true,
                composed: true,
                detail: { project: savedProject }
            }));

        } catch (error) {
            console.error('Error saving project:', error);
            showToast('Failed to save project', 'error');
        } finally {
            const saveBtn = this.shadowRoot.querySelector('#saveBtn');
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Project';
        }
    }

    setProjectData(data) {
        console.log('[ProjectModal] setProjectData called with:', data);
        this.projectData = data;
        console.log('[ProjectModal] projectData set to:', this.projectData);
    }
}

// Register the custom element
customElements.define('project-modal', ProjectModal);

export { ProjectModal };

// Setup function for global project modal events
export function setupProjectModal() {
    console.log('[ProjectModal] Setting up project modal...');

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('[ProjectModal] DOM loaded, setting up event listeners');
            setupEventListeners();
        });
    } else {
        console.log('[ProjectModal] DOM already loaded, setting up event listeners');
        setupEventListeners();
    }

    function setupEventListeners() {
        // Listen for saveProject events
        window.addEventListener('saveProject', (e) => {
            console.log('[ProjectModal] Received saveProject event:', e.detail);

            // Check if we have predefined project data (from update function) BEFORE showing modal
            if (window.predefinedProjectData) {
                console.log('[ProjectModal] ===== PREDEFINED DATA DETECTED =====');
                console.log('[ProjectModal] Predefined data:', window.predefinedProjectData);
                console.log('[ProjectModal] Skipping modal and auto-saving directly...');

                const modal = document.querySelector('project-modal');
                if (!modal) {
                    console.error('[ProjectModal] Modal not found in DOM');
                    return;
                }

                // Set the project data without showing the modal
                modal.projectData = e.detail;

                // Pre-fill the form data (even though modal won't show)
                modal.shadowRoot.querySelector('#projectTitle').value = window.predefinedProjectData.title || '';

                // Pre-select the folder
                if (window.predefinedProjectData.folderId !== undefined) {
                    modal.selectedFolderId = window.predefinedProjectData.folderId;
                    modal.updateSelectedFolder();
                }

                // Auto-save immediately without showing the modal
                modal.saveProject();

                // Clear the predefined data after use
                delete window.predefinedProjectData;
                console.log('[ProjectModal] Cleared predefined data after use');

                return; // Don't show the modal
            }

            const modal = document.querySelector('project-modal');
            if (!modal) {
                console.error('[ProjectModal] Modal not found in DOM');
                console.log('[ProjectModal] Available elements:', document.querySelectorAll('*'));
                return;
            }

            // Pass the COMPLETE project data (not just 3 fields!)
            console.log('[ProjectModal] Setting COMPLETE project data:', e.detail);
            modal.show(e.detail);
        });

        console.log('[ProjectModal] Event listeners set up successfully');
    }
}

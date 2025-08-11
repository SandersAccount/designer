// Mesh Warp implementation for regular HTML Canvas (non-Fabric.js)
class MeshWarpHandler {
    constructor(canvasElement, selectedTextObject) {
        this.canvasElement = canvasElement;
        this.ctx = canvasElement.getContext('2d');
        this.selectedTextObject = selectedTextObject;
        this.controlPoints = [];
        this.initialControlPoints = [];
        this.relativeControlPoints = []; // Store relative positions for preserving distortion
        this.hasCustomDistortion = false; // Track if user has customized the distortion
        this.NUM_COLS = 5;
        this.NUM_ROWS = 4; // Changed from 3 to 4 to avoid middle row at Y=0
        this.POINT_RADIUS = 8;
        this.isDragging = false;
        this.draggingPointIndex = -1;
        this.initialGridRect = { x: 0, y: 0, width: 0, height: 0 }; // Store original grid bounds
        this.showGrid = true; // Initialize grid visibility to true
        this.lastTextContent = selectedTextObject ? selectedTextObject.text : '';
        this.lastFontSize = selectedTextObject ? selectedTextObject.fontSize : 0;

        // Store original text dimensions for proper scaling calculations
        this.originalTextDimensions = null;

        // Initialize with current values from UI if available
        const colsInput = document.getElementById('iMeshCols');
        const rowsInput = document.getElementById('iMeshRows');
        if (colsInput && colsInput.value) {
            this.NUM_COLS = parseInt(colsInput.value);
        }
        if (rowsInput && rowsInput.value) {
            this.NUM_ROWS = parseInt(rowsInput.value);
        }

        // If the text object already has mesh warp data with custom distortion, restore it FIRST
        const restored = this.restoreFromTextObject();

        // Only initialize mesh grid if we didn't restore from saved data
        if (!restored) {
            this.initMeshGrid();
        }

        this.setupEventListeners();
    }

    // Helper method to calculate current text dimensions
    calculateTextDimensions() {
        if (!this.selectedTextObject) return { width: 100, height: 50 };

        // Create temporary canvas to measure text
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        // Set the same font properties as the text object
        const fontWeight = this.selectedTextObject.bold ? 'bold' : 'normal';
        const fontStyle = this.selectedTextObject.italic ? 'italic' : 'normal';
        tempCtx.font = `${fontStyle} ${fontWeight} ${this.selectedTextObject.fontSize}px ${this.selectedTextObject.fontFamily || 'Arial'}`;

        // Measure the text using actual bounds (not just font size)
        const bounds = calculateObjectBounds(this.selectedTextObject);
        const textWidth = bounds.width;
        const textHeight = bounds.height;

        console.log('[MeshWarp] 🔧 Calculated text dimensions:', { width: textWidth, height: textHeight });
        return { width: textWidth, height: textHeight };
    }

    // Helper method to scale control points to new text dimensions
    scaleControlPointsToNewDimensions(newDimensions) {
        if (!this.controlPoints.length) {
            console.log('[MeshWarp] 🔧 No control points to scale');
            return;
        }

        // If original dimensions are missing, calculate them from current font size and last stored values
        if (!this.originalTextDimensions) {
            console.log('[MeshWarp] 🔧 Original dimensions missing, calculating from last font size');
            // Use the last font size to estimate original dimensions
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            const fontWeight = this.selectedTextObject.bold ? 'bold' : 'normal';
            const fontStyle = this.selectedTextObject.italic ? 'italic' : 'normal';
            tempCtx.font = `${fontStyle} ${fontWeight} ${this.lastFontSize}px ${this.selectedTextObject.fontFamily || 'Arial'}`;
            const metrics = tempCtx.measureText(this.lastTextContent || this.selectedTextObject.text);

            this.originalTextDimensions = {
                width: metrics.width,
                height: this.lastFontSize
            };
            console.log('[MeshWarp] 🔧 Calculated original dimensions from last font size:', this.originalTextDimensions);
        }

        // Calculate scale factors based on TEXT dimensions (not grid dimensions)
        // The control points should scale by the same ratio as the text itself
        const scaleX = newDimensions.width / this.originalTextDimensions.width;
        const scaleY = newDimensions.height / this.originalTextDimensions.height;

        // Calculate grid dimensions for positioning (but not for scaling)
        const padding = this.selectedTextObject.fontSize * 0.1; // Same proportional padding as initial grid
        const oldWidth = this.originalTextDimensions.width + 2 * padding;
        const oldHeight = this.originalTextDimensions.height + 2 * padding;
        const newWidth = newDimensions.width + 2 * padding;
        const newHeight = newDimensions.height + 2 * padding;

        console.log('[MeshWarp] 🔧 Scaling factors:', {
            scaleX,
            scaleY,
            originalDimensions: this.originalTextDimensions,
            newDimensions,
            oldGridSize: { width: oldWidth, height: oldHeight },
            newGridSize: { width: newWidth, height: newHeight }
        });

        console.log('[MeshWarp] 🔧 Detailed scaling info:');
        console.log('  Original text dimensions:', this.originalTextDimensions);
        console.log('  New text dimensions:', newDimensions);
        console.log('  Expected scaleY (newHeight/originalHeight):', newDimensions.height / this.originalTextDimensions.height);
        console.log('  Calculated scaleY:', scaleY);

        // Calculate new grid rect based on new dimensions
        const newGridRect = {
            x: -newDimensions.width / 2 - padding,
            y: -newDimensions.height / 2 - padding,
            width: newWidth,
            height: newHeight
        };

        // Calculate original grid rect based on original dimensions
        const originalGridRect = {
            x: -this.originalTextDimensions.width / 2 - padding,
            y: -this.originalTextDimensions.height / 2 - padding,
            width: oldWidth,
            height: oldHeight
        };

        // Debug grid rectangles
        console.log('[MeshWarp] 🔧 Original grid rect:', originalGridRect);
        console.log('[MeshWarp] 🔧 New grid rect:', newGridRect);

        // Scale all control points relative to the text object's position
        // Since control points are in world coordinates, we scale relative to text center
        const textCenterX = this.selectedTextObject.x;
        const textCenterY = this.selectedTextObject.y;

        console.log('[MeshWarp] 🔧 Scaling relative to text center:', {x: textCenterX, y: textCenterY});

        // Scale control points relative to text center
        console.log('[MeshWarp] 🔧 Before scaling - first control point Y:', this.controlPoints[0]?.y);
        console.log('[MeshWarp] 🔧 Text center Y:', textCenterY);
        console.log('[MeshWarp] 🔧 ScaleY factor:', scaleY);

        // Debug vertical distances BEFORE scaling
        if (this.controlPoints.length >= this.NUM_COLS * 2) {
            const topRowFirstPoint = this.controlPoints[0]; // Row 0, Col 0
            const secondRowFirstPoint = this.controlPoints[this.NUM_COLS]; // Row 1, Col 0
            const verticalDistanceBefore = Math.abs(secondRowFirstPoint.y - topRowFirstPoint.y);
            console.log('[MeshWarp] 🔧 Vertical distance between rows BEFORE scaling:', verticalDistanceBefore);
            console.log('[MeshWarp] 🔧 Expected vertical distance after scaling:', verticalDistanceBefore * scaleY);
        }

        this.controlPoints = this.controlPoints.map((point, index) => {
            // Calculate relative position from text center
            const relativeX = point.x - textCenterX;
            const relativeY = point.y - textCenterY;

            // Scale the relative position
            const scaledRelativeX = relativeX * scaleX;
            const scaledRelativeY = relativeY * scaleY;

            // Calculate new absolute position (relative to text center)
            const newPoint = {
                x: textCenterX + scaledRelativeX,
                y: textCenterY + scaledRelativeY
            };

            // Debug first point and second row first point
            if (index === 0) {
                console.log('[MeshWarp] 🔧 Point 0 (top row) scaling:');
                console.log('  Original Y:', point.y);
                console.log('  Relative Y:', relativeY);
                console.log('  Scaled relative Y:', scaledRelativeY);
                console.log('  New Y:', newPoint.y);
                console.log('  Y change:', newPoint.y - point.y);
            }
            if (index === this.NUM_COLS) { // First point of second row
                console.log('[MeshWarp] 🔧 Point', index, '(second row) scaling:');
                console.log('  Original Y:', point.y);
                console.log('  Relative Y:', relativeY);
                console.log('  Scaled relative Y:', scaledRelativeY);
                console.log('  New Y:', newPoint.y);
                console.log('  Y change:', newPoint.y - point.y);
            }

            return newPoint;
        });

        console.log('[MeshWarp] 🔧 After scaling - first control point Y:', this.controlPoints[0]?.y);

        // Debug vertical distances between control points
        if (this.controlPoints.length >= this.NUM_COLS * 2) {
            const topRowFirstPoint = this.controlPoints[0]; // Row 0, Col 0
            const secondRowFirstPoint = this.controlPoints[this.NUM_COLS]; // Row 1, Col 0
            const verticalDistance = Math.abs(secondRowFirstPoint.y - topRowFirstPoint.y);
            console.log('[MeshWarp] 🔧 Vertical distance between rows after scaling:', verticalDistance);
            console.log('[MeshWarp] 🔧 Top row Y:', topRowFirstPoint.y, 'Second row Y:', secondRowFirstPoint.y);
        }

        // Also scale initial control points to maintain the reference
        this.initialControlPoints = this.initialControlPoints.map(point => {
            const relativeX = point.x - textCenterX;
            const relativeY = point.y - textCenterY;
            const scaledRelativeX = relativeX * scaleX;
            const scaledRelativeY = relativeY * scaleY;

            return {
                x: textCenterX + scaledRelativeX,
                y: textCenterY + scaledRelativeY
            };
        });

        // Update the grid rect
        this.initialGridRect = newGridRect;

        console.log('[MeshWarp] 🔧 ✅ Control points scaled successfully');
    }

    // --- Helper Functions (Copied from distort.html) ---

    dist(p1, p2) {
        if (!p1 || !p2) return 0;
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    interpolate(p00, p10, p01, p11, u, v) {
        if (!p00 || !p10 || !p01 || !p11) {
            console.warn("Interpolation called with missing points.");
            return p00 || { x: 0, y: 0 };
        }
        u = Math.max(0, Math.min(1, u));
        v = Math.max(0, Math.min(1, v));
        const val_x = p00.x * (1 - u) * (1 - v) + p10.x * u * (1 - v) + p01.x * (1 - u) * v + p11.x * u * v;
        const val_y = p00.y * (1 - u) * (1 - v) + p10.y * u * (1 - v) + p01.y * (1 - u) * v + p11.y * u * v;
        return { x: val_x, y: val_y };
    }

    getWarpedData(originalX, originalY) {
        // Ensure grid data is valid
        if (!this.initialGridRect.width || !this.initialGridRect.height || this.controlPoints.length !== this.initialControlPoints.length || this.initialControlPoints.length === 0) {
             // Return default structure indicating failure or uninitialized state
            return { pos: { x: originalX, y: originalY }, p00: null, p10: null, p01: null, p11: null, orig_p00: null, orig_p10: null, orig_p01: null, orig_p11: null };
        }

        // Normalize coordinates (u,v) within the initial grid bounds (0 to 1)
        let u = (originalX - this.initialGridRect.x) / this.initialGridRect.width;
        let v = (originalY - this.initialGridRect.y) / this.initialGridRect.height;

        // Clamp u, v to [0, 1] range
        u = Math.max(0, Math.min(1, u));
        v = Math.max(0, Math.min(1, v));

        // Determine grid cell indices (c0, r0) for the top-left corner
        const col = u * (this.NUM_COLS - 1);
        const row = v * (this.NUM_ROWS - 1);
        const c0 = Math.floor(col);
        const r0 = Math.floor(row);

        // Determine indices for the other 3 corners (handle boundary cases)
        const c1 = Math.min(c0 + 1, this.NUM_COLS - 1);
        const r1 = Math.min(r0 + 1, this.NUM_ROWS - 1);

        // Get the indices of the 4 corner control points of the cell
        const p00_idx = r0 * this.NUM_COLS + c0;
        const p10_idx = r0 * this.NUM_COLS + c1; // Top-right
        const p01_idx = r1 * this.NUM_COLS + c0; // Bottom-left
        const p11_idx = r1 * this.NUM_COLS + c1; // Bottom-right

        // Check if indices are valid (should always be if calculation is correct)
         if (p00_idx < 0 || p00_idx >= this.controlPoints.length ||
            p10_idx < 0 || p10_idx >= this.controlPoints.length ||
            p01_idx < 0 || p01_idx >= this.controlPoints.length ||
            p11_idx < 0 || p11_idx >= this.controlPoints.length ||
            p00_idx >= this.initialControlPoints.length || // Also check initial points array
            p10_idx >= this.initialControlPoints.length ||
            p01_idx >= this.initialControlPoints.length ||
            p11_idx >= this.initialControlPoints.length
            ) {
            console.error("Calculated invalid control point index:", {p00_idx, p10_idx, p01_idx, p11_idx});
            return { pos: { x: originalX, y: originalY }, p00: null, p10: null, p01: null, p11: null, orig_p00: null, orig_p10: null, orig_p01: null, orig_p11: null };
        }


        // Get the *current* positions of these control points
        const p00 = this.controlPoints[p00_idx];
        const p10 = this.controlPoints[p10_idx];
        const p01 = this.controlPoints[p01_idx];
        const p11 = this.controlPoints[p11_idx];

         // Get the *original* positions of these control points
        const orig_p00 = this.initialControlPoints[p00_idx];
        const orig_p10 = this.initialControlPoints[p10_idx];
        const orig_p01 = this.initialControlPoints[p01_idx];
        const orig_p11 = this.initialControlPoints[p11_idx];

        // Calculate local interpolation factors (u_local, v_local)
        // Handle division by zero if c0 == c1 or r0 == r1 (e.g., if NUM_COLS/ROWS is 1 or points overlap)
        const u_local = (c1 === c0) ? 0 : (col - c0); // Use unclamped col here
        const v_local = (r1 === r0) ? 0 : (row - r0); // Use unclamped row here


        // Perform bilinear interpolation for the position
        const interpolatedPos = this.interpolate(p00, p10, p01, p11, u_local, v_local);

        return { pos: interpolatedPos, p00, p10, p01, p11, orig_p00, orig_p10, orig_p01, orig_p11 };
    }

    // --- End Helper Functions ---

    // Store relative positions of control points for preserving distortion
    storeRelativeControlPoints() {
        if (!this.selectedTextObject || !this.initialGridRect ||
            !this.initialGridRect.width || !this.initialGridRect.height) {
            console.warn('Cannot store relative control points - missing required properties');
            return;
        }

        // Get grid dimensions
        const gridLeft = this.initialGridRect.x;
        const gridTop = this.initialGridRect.y;
        const gridWidth = this.initialGridRect.width;
        const gridHeight = this.initialGridRect.height;

        // Clear previous relative points
        this.relativeControlPoints = [];

        // Convert absolute positions to relative positions (0-1 range)
        for (let i = 0; i < this.controlPoints.length; i++) {
            const point = this.controlPoints[i];
            if (!point) continue;

            // Convert to relative position (0-1 range)
            const relX = (point.x - gridLeft) / gridWidth;
            const relY = (point.y - gridTop) / gridHeight;

            this.relativeControlPoints.push({ x: relX, y: relY });
        }

        // Mark that we have custom distortion
        this.hasCustomDistortion = true;

        // Sync control points to the text object for template saving
        this.syncControlPointsToTextObject();

        console.log('Stored relative mesh control points for preserving distortion', {
            gridDimensions: { width: gridWidth, height: gridHeight, left: gridLeft, top: gridTop },
            pointCount: this.controlPoints.length,
            relativePointsCount: this.relativeControlPoints.length
        });
    }

    // Sync control points from handler to text object for template saving
    syncControlPointsToTextObject() {
        if (!this.selectedTextObject) return;

        // Ensure meshWarp object exists
        if (!this.selectedTextObject.meshWarp) {
            this.selectedTextObject.meshWarp = {
                controlPoints: [],
                initialControlPoints: [],
                relativeControlPoints: [],
                hasCustomDistortion: false,
                showGrid: true,
                gridRect: null,
                initialized: false
            };
        }

        // Copy control points to text object
        this.selectedTextObject.meshWarp.controlPoints = this.controlPoints.map(p => ({ ...p }));
        this.selectedTextObject.meshWarp.initialControlPoints = this.initialControlPoints.map(p => ({ ...p }));
        this.selectedTextObject.meshWarp.relativeControlPoints = this.relativeControlPoints.map(p => ({ ...p }));
        this.selectedTextObject.meshWarp.hasCustomDistortion = this.hasCustomDistortion;
        this.selectedTextObject.meshWarp.showGrid = this.showGrid;
        this.selectedTextObject.meshWarp.gridRect = this.initialGridRect ? { ...this.initialGridRect } : null;
        this.selectedTextObject.meshWarp.initialized = true;

        console.log('Synced mesh warp control points to text object for template saving');
    }

    // Restore mesh warp state from text object data (for loading text styles/templates)
    restoreFromTextObject() {
        if (!this.selectedTextObject || !this.selectedTextObject.meshWarp) {
            return;
        }

        const meshData = this.selectedTextObject.meshWarp;

        // Check if we have saved mesh warp data with custom distortion
        if (meshData.initialized && meshData.hasCustomDistortion &&
            meshData.relativeControlPoints && meshData.relativeControlPoints.length > 0) {

            console.log('[MeshWarp] Restoring mesh warp from text object data:', meshData);

            // Restore basic properties
            this.hasCustomDistortion = meshData.hasCustomDistortion;
            this.showGrid = meshData.showGrid !== undefined ? meshData.showGrid : false;

            // Restore grid dimensions if available
            if (meshData.gridRect) {
                this.initialGridRect = { ...meshData.gridRect };
            }

            // Copy the relative control points
            this.relativeControlPoints = meshData.relativeControlPoints.map(p => ({ ...p }));

            // Copy the saved control points if available
            if (meshData.controlPoints && meshData.controlPoints.length > 0) {
                this.controlPoints = meshData.controlPoints.map(p => ({ ...p }));
            }

            // Copy the initial control points if available
            if (meshData.initialControlPoints && meshData.initialControlPoints.length > 0) {
                this.initialControlPoints = meshData.initialControlPoints.map(p => ({ ...p }));
            }

            console.log('[MeshWarp] Successfully restored mesh warp distortion from text object');
            console.log('[MeshWarp] Control points:', this.controlPoints.length);
            console.log('[MeshWarp] Relative points:', this.relativeControlPoints.length);
            console.log('[MeshWarp] Has custom distortion:', this.hasCustomDistortion);

            // Update UI to reflect the restored state
            const showGridBtn = document.getElementById('meshShowGrid');
            if (showGridBtn) {
                showGridBtn.textContent = this.showGrid ? 'Hide Grid' : 'Show Grid';
            }

            return true; // Indicate successful restoration
        }

        return false; // No restoration needed/possible
    }

    initMeshGrid(forceReinit = false) {
        // Check if we need to scale existing control points due to font size change
        const fontSizeChanged = this.lastFontSize !== this.selectedTextObject.fontSize;
        const textChanged = this.lastTextContent !== this.selectedTextObject.text;

        // Don't reinitialize if we already have restored control points, UNLESS:
        // 1. Font size has changed (need to scale the mesh)
        // 2. Text content has changed (need to recalculate dimensions)
        // 3. Force reinit is requested (manual reset)
        if (this.controlPoints.length > 0 && this.hasCustomDistortion &&
            !fontSizeChanged && !textChanged && !forceReinit) {
            console.log('Mesh grid already initialized with restored control points, skipping reinit');
            return;
        }

        // Check if we need to recreate the mesh due to wrong number of control points
        const expectedControlPoints = this.NUM_ROWS * this.NUM_COLS;
        if (this.controlPoints.length !== expectedControlPoints) {
            console.log('[MeshWarp] 🔧 Control point count mismatch. Expected:', expectedControlPoints, 'Actual:', this.controlPoints.length, '- Recreating mesh');
            this.hasCustomDistortion = false;
            this.controlPoints = [];
            this.initialControlPoints = [];
            this.originalTextDimensions = null;
            // Fall through to create new mesh
        }
        // If we have custom distortion and font size changed, scale the existing points
        else if (this.controlPoints.length > 0 && this.hasCustomDistortion &&
            (fontSizeChanged || textChanged)) {
            console.log('[MeshWarp] 🔧 Font size or text changed, scaling existing mesh to preserve distortion');
            console.log('[MeshWarp] 🔧 Old font size:', this.lastFontSize, 'New font size:', this.selectedTextObject.fontSize);

            // Check if control points are in extreme positions (indicating accumulated scaling errors)
            const maxY = Math.max(...this.controlPoints.map(p => Math.abs(p.y)));
            if (maxY > 10000) {
                console.log('[MeshWarp] 🔧 ⚠️ Control points are in extreme positions (maxY:', maxY, '), resetting mesh to prevent cumulative scaling errors');
                // Reset the mesh by recreating it
                this.hasCustomDistortion = false;
                this.controlPoints = [];
                this.initialControlPoints = [];
                this.originalTextDimensions = null;
                // Fall through to create a new mesh
            } else {
                // Ensure we have original dimensions stored
                if (!this.originalTextDimensions) {
                    console.log('[MeshWarp] 🔧 Storing original dimensions from last known values');
                    const tempCanvas = document.createElement('canvas');
                    const tempCtx = tempCanvas.getContext('2d');
                    const fontWeight = this.selectedTextObject.bold ? 'bold' : 'normal';
                    const fontStyle = this.selectedTextObject.italic ? 'italic' : 'normal';
                    tempCtx.font = `${fontStyle} ${fontWeight} ${this.lastFontSize}px ${this.selectedTextObject.fontFamily || 'Arial'}`;
                    const metrics = tempCtx.measureText(this.lastTextContent || this.selectedTextObject.text);

                    // Calculate actual text bounds for proper height
                    const tempTextObj = {
                        ...this.selectedTextObject,
                        fontSize: this.lastFontSize,
                        text: this.lastTextContent || this.selectedTextObject.text
                    };
                    const oldBounds = calculateObjectBounds(tempTextObj);

                    this.originalTextDimensions = {
                        width: metrics.width,
                        height: oldBounds.height
                    };
                    console.log('[MeshWarp] 🔧 Stored original dimensions:', this.originalTextDimensions);
                }

                // Calculate the new text dimensions
                const newDimensions = this.calculateTextDimensions();

                // Scale existing control points to match new text dimensions
                this.scaleControlPointsToNewDimensions(newDimensions);

                // Update stored values AND original dimensions for next scaling
                this.lastFontSize = this.selectedTextObject.fontSize;
                this.lastTextContent = this.selectedTextObject.text;

                // IMPORTANT: Update originalTextDimensions to current dimensions
                // This ensures next scaling is relative to current size, not original size
                this.originalTextDimensions = {
                    width: newDimensions.width,
                    height: newDimensions.height
                };
                console.log('[MeshWarp] 🔧 Updated original dimensions for next scaling:', this.originalTextDimensions);

                console.log('[MeshWarp] 🔧 ✅ Mesh scaled to preserve distortion with new text dimensions');
                return;
            }
        }

        // Clear existing points
        this.controlPoints = [];
        this.initialControlPoints = [];

        // Calculate bounds based on the selected text object
        if (!this.selectedTextObject) return;

        // Get text dimensions from the object - this already accounts for letter spacing
        // because calculateObjectBounds handles letter spacing correctly
        const bounds = calculateObjectBounds(this.selectedTextObject);
        const padding = this.selectedTextObject.fontSize * 0.1; // Reduced padding to keep mesh closer to text

        // Center the grid around the text center (0,0) in object-relative coordinates
        // This ensures the grid is always centered on the text regardless of text position
        this.initialGridRect = {
            x: -(bounds.width + padding * 2) / 2,
            y: -(bounds.height + padding * 2) / 2,
            width: bounds.width + padding * 2,
            height: bounds.height + padding * 2
        };

        console.log('[MeshWarp] 🔧 Created centered grid rect:', this.initialGridRect);

        // Store original text dimensions if not already stored (for scaling reference)
        if (!this.originalTextDimensions) {
            this.originalTextDimensions = {
                width: bounds.width,
                height: bounds.height
            };
            console.log('[MeshWarp] 🔧 Stored original text dimensions:', this.originalTextDimensions);
        }

        // Check if we need to preserve distortion
        if (this.hasCustomDistortion && this.relativeControlPoints.length > 0) {
            console.log('Preserving mesh distortion after text/size change');

            // Apply the relative control points to the new grid size
            for (let i = 0; i < this.relativeControlPoints.length; i++) {
                const relPoint = this.relativeControlPoints[i];
                if (!relPoint) continue;

                // Convert relative position (0-1) back to absolute position
                const x = this.initialGridRect.x + relPoint.x * this.initialGridRect.width;
                const y = this.initialGridRect.y + relPoint.y * this.initialGridRect.height;

                this.controlPoints.push({ x, y });
                // Also update initial points for reference
                this.initialControlPoints.push({
                    x: this.initialGridRect.x + (i % this.NUM_COLS) / (this.NUM_COLS - 1) * this.initialGridRect.width,
                    y: this.initialGridRect.y + Math.floor(i / this.NUM_COLS) / (this.NUM_ROWS - 1) * this.initialGridRect.height
                });
            }
        } else {
            // Initialize control points grid with default positions
            console.log('[MeshWarp] 🔧 Creating grid with NUM_ROWS:', this.NUM_ROWS, 'NUM_COLS:', this.NUM_COLS);
            console.log('[MeshWarp] 🔧 Grid rect for positioning:', this.initialGridRect);

            for (let r = 0; r < this.NUM_ROWS; r++) {
                for (let c = 0; c < this.NUM_COLS; c++) {
                    // Calculate relative position within the grid
                    const relativeX = this.initialGridRect.x + (c / (this.NUM_COLS - 1)) * this.initialGridRect.width;
                    const relativeY = this.initialGridRect.y + (r / (this.NUM_ROWS - 1)) * this.initialGridRect.height;

                    // Convert to world coordinates by adding text object's position
                    const x = relativeX + this.selectedTextObject.x;
                    const y = relativeY + this.selectedTextObject.y;

                    // Debug the Y calculation for first column
                    if (c === 0) {
                        console.log(`[MeshWarp] 🔧 Row ${r}: r/(NUM_ROWS-1) = ${r}/${this.NUM_ROWS-1} = ${r / (this.NUM_ROWS - 1)}`);
                        console.log(`[MeshWarp] 🔧 Row ${r}: relativeY = ${this.initialGridRect.y} + ${r / (this.NUM_ROWS - 1)} * ${this.initialGridRect.height} = ${relativeY}`);
                        console.log(`[MeshWarp] 🔧 Row ${r}: worldY = ${relativeY} + ${this.selectedTextObject.y} = ${y}`);
                    }

                    this.controlPoints.push({ x, y });
                    this.initialControlPoints.push({ x, y });
                }
            }
        }

        // Sync control points to text object for template saving
        this.syncControlPointsToTextObject();

        // Update the UI - but only if we're not in the middle of handler creation
        if (typeof window.skipMeshUpdate === 'undefined' || !window.skipMeshUpdate) {
            update();
        }
    }

    setupEventListeners() {
        // Use mouse events on the canvas element
        // Remove previous listeners if re-initializing to prevent duplicates
        this.canvasElement.removeEventListener('mousedown', this._boundHandleMouseDown);
        this.canvasElement.removeEventListener('mousemove', this._boundHandleMouseMove);
        this.canvasElement.removeEventListener('mouseup', this._boundHandleMouseUp);

        // Bind methods to ensure 'this' context is correct
        this._boundHandleMouseDown = (e) => this.handleMouseDown(e);
        this._boundHandleMouseMove = (e) => this.handleMouseMove(e);
        this._boundHandleMouseUp = (e) => this.handleMouseUp(e);

        this.canvasElement.addEventListener('mousedown', this._boundHandleMouseDown);
        this.canvasElement.addEventListener('mousemove', this._boundHandleMouseMove);
        this.canvasElement.addEventListener('mouseup', this._boundHandleMouseUp);

        // UI control listeners (ensure they are only added once or managed)
        // A simple approach is to check if they already exist, though this isn't foolproof
        const colsInput = document.getElementById('iMeshCols');
        const rowsInput = document.getElementById('iMeshRows');
        const resetBtn = document.getElementById('resetMeshBtn');

        if (colsInput && !colsInput.dataset.meshListenerAdded) {
            colsInput.addEventListener('input', (e) => {
                this.NUM_COLS = parseInt(e.target.value);
                this.initMeshGrid(true); // Force reinitialize grid with new columns
            });
            colsInput.dataset.meshListenerAdded = 'true';
        }

        if (rowsInput && !rowsInput.dataset.meshListenerAdded) {
            rowsInput.addEventListener('input', (e) => {
                this.NUM_ROWS = parseInt(e.target.value);
                this.initMeshGrid(true); // Force reinitialize grid with new rows
            });
            rowsInput.dataset.meshListenerAdded = 'true';
        }

        if (resetBtn && !resetBtn.dataset.meshListenerAdded) {
            resetBtn.addEventListener('click', () => {
                // Force re-initialize to reset to default grid
                this.initMeshGrid(true);
            });
            resetBtn.dataset.meshListenerAdded = 'true';
        }

        // Add toggle button for grid visibility
        const toggleBtn = document.getElementById('toggleMeshBtn');
        if (toggleBtn && !toggleBtn.dataset.meshListenerAdded) {
            toggleBtn.textContent = this.showGrid ? 'Hide Grid' : 'Show Grid';
            toggleBtn.addEventListener('click', () => {
                this.showGrid = !this.showGrid;
                toggleBtn.textContent = this.showGrid ? 'Hide Grid' : 'Show Grid';
                update(); // Redraw to show/hide grid
            });
            toggleBtn.dataset.meshListenerAdded = 'true';
        }
    }

    // Method to check if a click hit a control point
    // Returns the index of the hit point or -1
    findPointAt(worldX, worldY) {
        for (let i = 0; i < this.controlPoints.length; i++) {
            const point = this.controlPoints[i];
            if (!point) continue;
            const dx = worldX - point.x;
            const dy = worldY - point.y;
            // Use scale from the main script (assuming 'scale' is a global variable)
            const hitRadius = (this.POINT_RADIUS + 2) / (typeof scale !== 'undefined' ? scale : 1);
            if (dx * dx + dy * dy < hitRadius * hitRadius) {
                return i;
            }
        }
        return -1;
    }

    handleMouseDown(e) {
        // Only handle if the selected object is the one this handler is for
        if (!this.selectedTextObject || typeof selectedObjectIndex === 'undefined' || canvasObjects[selectedObjectIndex] !== this.selectedTextObject) {
            this.isDragging = false;
            this.draggingPointIndex = -1;
            return;
        }

        const coords = getCanvasCoordinates(e); // Assumes getCanvasCoordinates is global
        const worldCoords = canvasToWorld(coords.x, coords.y); // Assumes canvasToWorld is global

        this.draggingPointIndex = this.findPointAt(worldCoords.x, worldCoords.y);

        if (this.draggingPointIndex !== -1) {
            this.isDragging = true;
            // Prevent the main handler from starting object drag
            e.stopPropagation(); // Stop event bubbling
            e.preventDefault(); // Prevent default actions like text selection
            console.log("Mesh point drag started:", this.draggingPointIndex);
        } else {
            this.isDragging = false;
        }
    }

    handleMouseMove(e) {
        if (!this.isDragging || this.draggingPointIndex === -1) return;

        // Ensure the selected object hasn't changed
        if (typeof selectedObjectIndex === 'undefined' || canvasObjects[selectedObjectIndex] !== this.selectedTextObject) {
            this.isDragging = false;
            this.draggingPointIndex = -1;
            return;
        }

        const coords = getCanvasCoordinates(e);
        const worldCoords = canvasToWorld(coords.x, coords.y);

        // Update the control point position
        if (this.controlPoints[this.draggingPointIndex]) {
            this.controlPoints[this.draggingPointIndex].x = worldCoords.x;
            this.controlPoints[this.draggingPointIndex].y = worldCoords.y;

            // Mark that we have custom distortion since user is dragging points
            this.hasCustomDistortion = true;

            // Store relative positions during drag for smoother experience
            // This ensures distortion is preserved if text changes during drag
            this.storeRelativeControlPoints();

            update(); // Assumes update is a global function to redraw the main canvas
        } else {
            // Point somehow became invalid, stop dragging
            this.isDragging = false;
            this.draggingPointIndex = -1;
        }
    }

    handleMouseUp(e) {
        if (this.isDragging) {
            console.log("Mesh point drag ended");

            // Store relative positions when user finishes dragging a point
            // This ensures distortion is preserved when text changes
            this.storeRelativeControlPoints();
        }
        this.isDragging = false;
        this.draggingPointIndex = -1;
    }

    // Draw the mesh grid and control points
    drawMeshGrid(ctx) {
        // Only draw if the selected object is the one this handler is for
        if (!this.selectedTextObject || typeof selectedObjectIndex === 'undefined' || canvasObjects[selectedObjectIndex] !== this.selectedTextObject) {
            return;
        }

        // Check if text content or font size has changed
        if (this.lastTextContent !== this.selectedTextObject.text ||
            this.lastFontSize !== this.selectedTextObject.fontSize) {
            console.log('Text or font size changed, reinitializing mesh grid');
            console.log('Old text:', this.lastTextContent, 'New text:', this.selectedTextObject.text);
            console.log('Old font size:', this.lastFontSize, 'New font size:', this.selectedTextObject.fontSize);

            // DON'T update the stored values here - let initMeshGrid handle it
            // This ensures initMeshGrid can detect the change properly

            // Reinitialize the grid to adapt to the new text size
            // This will preserve distortion if hasCustomDistortion is true
            this.initMeshGrid();
        }

        // If grid is hidden, don't draw anything
        if (!this.showGrid) {
            return;
        }

        // Use the scale from the main script
        const currentScale = typeof scale !== 'undefined' ? scale : 1;

        ctx.save();

        // Draw grid lines
        ctx.strokeStyle = 'rgba(100, 100, 255, 0.5)';
        ctx.lineWidth = 1 / currentScale;

        // Draw horizontal lines
        for (let r = 0; r < this.NUM_ROWS; r++) {
            ctx.beginPath();
            for (let c = 0; c < this.NUM_COLS; c++) {
                const index = r * this.NUM_COLS + c;
                if (!this.controlPoints[index]) continue; // Check if point exists
                if (c === 0) {
                    ctx.moveTo(this.controlPoints[index].x, this.controlPoints[index].y);
                } else {
                    ctx.lineTo(this.controlPoints[index].x, this.controlPoints[index].y);
                }
            }
            ctx.stroke();
        }

        // Draw vertical lines
        for (let c = 0; c < this.NUM_COLS; c++) {
            ctx.beginPath();
            for (let r = 0; r < this.NUM_ROWS; r++) {
                const index = r * this.NUM_COLS + c;
                 if (!this.controlPoints[index]) continue; // Check if point exists
                if (r === 0) {
                    ctx.moveTo(this.controlPoints[index].x, this.controlPoints[index].y);
                } else {
                    ctx.lineTo(this.controlPoints[index].x, this.controlPoints[index].y);
                }
            }
            ctx.stroke();
        }

        // Draw control points
        ctx.fillStyle = 'rgba(0, 0, 255, 0.7)';
        for (const point of this.controlPoints) {
             if (!point) continue; // Check if point exists
            ctx.beginPath();
            ctx.arc(point.x, point.y, this.POINT_RADIUS / currentScale, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    // --- New Method to Draw Warped Text ---
    drawWarpedText(targetCtx) {
        const obj = this.selectedTextObject;
        if (!obj || !obj.text || this.controlPoints.length === 0 || this.initialControlPoints.length === 0) {
            console.warn("Cannot draw warped text: Missing object, text, or control points.");
            // Optionally draw normal text as fallback
            // drawNormalOrSkewObject(obj, targetCtx);
            return;
        }

        // Check if we need to apply gradient masking
        // Use gradient masking for: 1) gradients, 2) decorations (even with solid color)
        const needsGradientMasking = (obj.gradient && obj.gradient.type !== 'solid') ||
                                   (obj.decorationMode && obj.decorationMode !== 'noDecoration');

        if (needsGradientMasking) {
            console.log('🔍 MESH WARP: Using gradient masking path for decorations/gradients');
            this.drawWarpedTextWithGradientMask(targetCtx);
            return;
        }

        // Otherwise draw normally (solid color, no decorations)
        console.log('🔍 MESH WARP: Using simple path for solid color, no decorations');
        this.drawWarpedTextInternal(targetCtx);
    }

    // Internal method for drawing warped text (can be called with or without gradient masking)
    drawWarpedTextInternal(targetCtx, maskMode = false) {
        const obj = this.selectedTextObject;

        // Check if text content or font size has changed
        if (this.lastTextContent !== obj.text || this.lastFontSize !== obj.fontSize) {
            console.log('Text or font size changed in drawWarpedText, reinitializing mesh grid');
            console.log('Old text:', this.lastTextContent, 'New text:', obj.text);
            console.log('Old font size:', this.lastFontSize, 'New font size:', obj.fontSize);

            // DON'T update the stored values here - let initMeshGrid handle it
            // This ensures initMeshGrid can detect the change properly

            // Reinitialize the grid to adapt to the new text size
            this.initMeshGrid();
        }

        // Use the main offscreen canvas (os) and letter canvas (letterCanvas) assumed to be global
        if (typeof os === 'undefined' || typeof letterCanvas === 'undefined') {
             console.error("Offscreen canvases (os, letterCanvas) not found globally.");
             return;
        }
        const octx = os.getContext('2d');
        const letterCtx = letterCanvas.getContext('2d');

        // Prepare text properties on a temporary context for measurement
        const tempMeasureCtx = document.createElement('canvas').getContext('2d');
        setTextContextOn(tempMeasureCtx, obj); // Assumes setTextContextOn is global

        // Note: Opacity is handled individually for text and stroke in renderSingleStyledLetter
        // Do not apply global opacity here as it would affect stroke independence

        const text = obj.text.toUpperCase();

        // Check if letter spacing is applied
        const letterSpacing = obj._effectiveLetterSpacing || 0;
        let originalTextWidth;

        if (letterSpacing === 0) {
            // Standard text measurement
            originalTextWidth = tempMeasureCtx.measureText(text).width;
        } else {
            // Calculate width with letter spacing
            const letters = text.split('');
            let totalWidth = 0;

            // Sum the width of each letter
            letters.forEach(letter => {
                totalWidth += tempMeasureCtx.measureText(letter).width;
            });

            // Add letter spacing between characters
            if (letters.length > 1) {
                totalWidth += letterSpacing * (letters.length - 1);
            }

            originalTextWidth = totalWidth;
        }

        // Calculate original baseline position (relative to the object's center before rotation/translation)
        // We need the position where the text *would* be drawn if it were normal text centered at (0,0)
        // This requires knowing the text's height/ascent/descent
        const metrics = tempMeasureCtx.measureText('M'); // Measure a representative character
        const ascent = metrics.actualBoundingBoxAscent || obj.fontSize * 0.8;
        const descent = metrics.actualBoundingBoxDescent || obj.fontSize * 0.2;
        const textHeight = ascent + descent;

        // Original drawing position if centered at (0,0) in the object's local space
        const originalStartX = -originalTextWidth / 2;
        const originalBaselineY = 0; // Middle baseline is usually at y=0 when centered

        let currentOriginalX = originalStartX; // Tracks original X position along baseline

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const charMetrics = tempMeasureCtx.measureText(char);
            const charWidth = charMetrics.width;

            // Calculate the *original* center position of this character in the object's local space
            const originalCharCenterX = currentOriginalX + charWidth / 2;
            const originalCharCenterY = originalBaselineY; // Assuming middle baseline

            // Get warped position and cell data using the mesh handler's state
            // We need to map the local character center (originalCharCenterX, originalCharCenterY)
            // to the world coordinates based on the object's position and rotation,
            // then find the warped position relative to the object's *current* center.
            // This is complex because the grid is defined in world space based on initial bounds.

            // --- Simpler Approach: Warp relative to the initial grid ---
            // Calculate the character center relative to the *initial* grid bounds
            // This assumes the text hasn't moved significantly relative to its initial placement
            // when the grid was created. This might be inaccurate if the object was moved *before* warping.

            // Get the object's initial center when the grid was made (approximate)
            const initialObjectCenterX = this.initialGridRect.x + this.initialGridRect.width / 2;
            const initialObjectCenterY = this.initialGridRect.y + this.initialGridRect.height / 2;

            // Map the character's local position to the initial world position
            const initialWorldCharCenterX = initialObjectCenterX + originalCharCenterX;
            const initialWorldCharCenterY = initialObjectCenterY + originalCharCenterY;


            const warpData = this.getWarpedData(initialWorldCharCenterX, initialWorldCharCenterY);

            if (!warpData || !warpData.p00 || !warpData.orig_p00) {
                console.warn(`Skipping character '${char}' due to missing warp data.`);
                // Advance position with letter spacing
                currentOriginalX += charWidth + (i < text.length - 1 ? letterSpacing : 0);
                continue;
            }

            const warpedPos = warpData.pos; // This is in world coordinates

            // --- Calculate Scaling (based on cell distortion) ---
            const orig_top_w = this.dist(warpData.orig_p00, warpData.orig_p10);
            const orig_bottom_w = this.dist(warpData.orig_p01, warpData.orig_p11);
            const orig_avg_w = (orig_top_w + orig_bottom_w) / 2;
            const orig_left_h = this.dist(warpData.orig_p00, warpData.orig_p01);
            const orig_right_h = this.dist(warpData.orig_p10, warpData.orig_p11);
            const orig_avg_h = (orig_left_h + orig_right_h) / 2;

            const current_top_w = this.dist(warpData.p00, warpData.p10);
            const current_bottom_w = this.dist(warpData.p01, warpData.p11);
            const current_avg_w = (current_top_w + current_bottom_w) / 2;
            const current_left_h = this.dist(warpData.p00, warpData.p01);
            const current_right_h = this.dist(warpData.p10, warpData.p11);
            const current_avg_h = (current_left_h + current_right_h) / 2;

            let scaleX = (orig_avg_w > 0.1) ? (current_avg_w / orig_avg_w) : 1;
            let scaleY = (orig_avg_h > 0.1) ? (current_avg_h / orig_avg_h) : 1;
            scaleX = Math.max(0.05, isNaN(scaleX) ? 1 : scaleX);
            scaleY = Math.max(0.05, isNaN(scaleY) ? 1 : scaleY);

            // --- NEW APPROACH: Apply transformations first, then draw letter with shadows ---
            // This follows the same pattern as circular/curved text effects
            targetCtx.save();

            // Translate to the warped position (which is in world space)
            // We need to draw relative to the object's transformed origin in the main canvas context
            // The targetCtx is already translated and rotated to the object's center.
            // So, we need the warped position relative to the object's center.
            const relativeWarpedX = warpedPos.x - obj.x;
            const relativeWarpedY = warpedPos.y - obj.y;

            // We also need to account for the object's rotation when translating
            // Inverse rotation:
            const angleRad = -obj.rotation * Math.PI / 180;
            const cos = Math.cos(angleRad);
            const sin = Math.sin(angleRad);
            const finalDrawX = relativeWarpedX * cos - relativeWarpedY * sin;
            const finalDrawY = relativeWarpedX * sin + relativeWarpedY * cos;

            targetCtx.translate(finalDrawX, finalDrawY);

            // Apply scaling
            // TODO: Apply rotation/skew based on cell deformation for better results
            targetCtx.scale(scaleX, scaleY);

            // Set up text context with proper styling (like circular/curved text does)
            setTextContextOn(targetCtx, obj, i, text.length);

            // CRITICAL FIX: Apply shadow effects BEFORE drawing the main text (skip in mask mode)
            // This matches the pattern used in renderStyledObjectToOffscreen and other effects
            if (!maskMode) {
                console.log('🔍 MESH WARP SHADOW: Applying shadow effects for character:', char, 'shadowMode:', obj.shadowMode);
                const letterObj = { ...obj, text: char };
                if (obj.shadowMode === "blockShadow") {
                    console.log('🔍 MESH WARP SHADOW: Calling applyBlockShadow for character:', char);
                    applyBlockShadow(targetCtx, letterObj, 0, 0);
                } else if (obj.shadowMode === "perspectiveShadow") {
                    console.log('🔍 MESH WARP SHADOW: Calling applyPerspectiveShadow for character:', char);
                    applyPerspectiveShadow(targetCtx, letterObj, 0, 0);
                } else if (obj.shadowMode === "lineShadow") {
                    console.log('🔍 MESH WARP SHADOW: Calling applyLineShadow for character:', char);
                    applyLineShadow(targetCtx, letterObj, 0, 0);
                } else if (obj.shadowMode === "detailed3D") {
                    console.log('🔍 MESH WARP SHADOW: Calling applyDetailed3D_ExtrusionOnly for character:', char);
                    applyDetailed3D_ExtrusionOnly(targetCtx, letterObj, 0, 0);
                } else if (obj.shadowMode === "shadow") {
                    // Standard shadow using canvas properties
                    targetCtx.shadowColor = obj.shadowColor || '#000000';
                    targetCtx.shadowOffsetX = obj.shadowOffsetX || 5;
                    targetCtx.shadowOffsetY = obj.shadowOffsetY || 5;
                    targetCtx.shadowBlur = obj.shadowBlur || 10;
                    console.log('🔍 MESH WARP SHADOW: Applied standard shadow for character:', char);
                } else {
                    // Clear any existing shadow
                    targetCtx.shadowColor = 'transparent';
                    targetCtx.shadowOffsetX = 0;
                    targetCtx.shadowOffsetY = 0;
                    targetCtx.shadowBlur = 0;
                }
            } else {
                console.log('🔍 MESH WARP MASK: Skipping shadow effects for mask mode, character:', char);
                // Clear any existing shadow for mask mode
                targetCtx.shadowColor = 'transparent';
                targetCtx.shadowOffsetX = 0;
                targetCtx.shadowOffsetY = 0;
                targetCtx.shadowBlur = 0;
            }

            // Apply stroke if needed (check both strokeMode and strokeWidth)
            if (obj.strokeMode === 'stroke' && obj.strokeWidth && obj.strokeWidth > 0) {
                targetCtx.lineWidth = obj.strokeWidth;
                targetCtx.strokeStyle = obj.strokeColor;
                targetCtx.strokeText(char, 0, 0);
            }

            // Draw the letter directly with the final color/gradient (like circular/curved text does)
            targetCtx.fillText(char, 0, 0);

            targetCtx.restore();

            // Advance the original X position tracker with letter spacing
            currentOriginalX += charWidth + (i < text.length - 1 ? letterSpacing : 0);
        }

        // Note: Decorations are now handled by the gradient masking path
        // This path is only for simple solid color text without decorations

        // Add front outlines for mesh warp text without gradients
        console.log('🔍 RENDER ORDER: Step 8 - Drawing front outlines on top for Mesh Warp text (no gradient)');
        if (obj.shadowMode === 'perspectiveShadow' && obj.perspectiveShadowOutlineWidth > 0) {
            console.log('🔍 RENDER ORDER: Drawing perspective shadow front outline on top for Mesh Warp text (no gradient)');
            const outlineColor = obj.perspectiveShadowOutlineColor;
            const outlineOpacity = obj.perspectiveShadowOutlineOpacity / 100;
            const outlineWidth = obj.perspectiveShadowOutlineWidth;
            const outlineOffsetX = obj.perspectiveShadowOutlineOffsetX || 0;
            const outlineOffsetY = obj.perspectiveShadowOutlineOffsetY || 0;
            this.drawMeshWarpFrontOutline(targetCtx, outlineColor, outlineOpacity, outlineWidth, outlineOffsetX, outlineOffsetY);
        }
        if (obj.shadowMode === 'detailed3D' && obj.d3dSecondaryWidth > 0) {
            console.log('🔍 RENDER ORDER: Drawing detailed 3D front outline on top for Mesh Warp text (no gradient)');
            const outlineColor = obj.d3dSecondaryColor;
            const outlineOpacity = obj.d3dSecondaryOpacity / 100;
            const outlineWidth = obj.d3dSecondaryWidth;
            const outlineOffsetX = obj.d3dSecondaryOffsetX || 0;
            const outlineOffsetY = obj.d3dSecondaryOffsetY || 0;
            this.drawMeshWarpFrontOutline(targetCtx, outlineColor, outlineOpacity, outlineWidth, outlineOffsetX, outlineOffsetY);
        }
    }

    // Gradient masking function for mesh warp
    drawWarpedTextWithGradientMask(targetCtx) {
        const obj = this.selectedTextObject;
        console.log('🎨 GRADIENT MASK: Drawing mesh warp text with gradient mask');

        // Save original gradient
        const originalGradient = obj.gradient;

        // CRITICAL FIX: For solid color text with decorations, create a fake gradient object
        let workingGradient = originalGradient;
        if (!originalGradient || originalGradient.type === 'solid' || !originalGradient.gradient) {
            console.log('🎨 GRADIENT MASK: Creating fake gradient for solid color text with decorations');
            workingGradient = {
                type: 'linear',
                gradient: {
                    angle: 0,
                    colors: [
                        { position: 0, color: obj.color || '#000000' },
                        { position: 100, color: obj.color || '#000000' }
                    ]
                }
            };
        }

        // Create a temporary canvas for the complete rendering
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 2000;
        tempCanvas.height = 2000;
        const tempCtx = tempCanvas.getContext('2d');

        // Step 1: Draw effects and text with solid color to temp canvas
        tempCtx.save();
        tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
        obj.gradient = { type: 'solid' };

        // Use the existing mesh warp logic but with solid color
        const originalSelectedObject = this.selectedTextObject;
        this.selectedTextObject = obj;
        this.drawWarpedTextInternal(tempCtx);
        this.selectedTextObject = originalSelectedObject;

        tempCtx.restore();

        // Step 2: Create text mask (only main text, no effects)
        const textCanvas = document.createElement('canvas');
        textCanvas.width = 2000;
        textCanvas.height = 2000;
        const textCtx = textCanvas.getContext('2d');

        // Draw mesh warped text in white on transparent background (for masking)
        textCtx.save();
        textCtx.translate(textCanvas.width / 2, textCanvas.height / 2);
        textCtx.fillStyle = 'white';

        // Create a temporary object without gradient and effects for shape rendering
        const tempObj = {
            ...obj,
            gradient: { type: 'solid' },
            shadowMode: 'none',
            strokeWidth: 0
        };
        const originalSelectedObject2 = this.selectedTextObject;
        this.selectedTextObject = tempObj;
        this.drawWarpedTextInternal(textCtx);
        this.selectedTextObject = originalSelectedObject2;

        textCtx.restore();

        // Step 3: Cut out text areas from the effects canvas using destination-out
        tempCtx.globalCompositeOperation = 'destination-out';
        tempCtx.drawImage(textCanvas, 0, 0);

        // Step 4: Create gradient canvas
        const gradientCanvas = document.createElement('canvas');
        gradientCanvas.width = 2000;
        gradientCanvas.height = 2000;
        const gradientCtx = gradientCanvas.getContext('2d');

        // Create the gradient
        const gradientType = workingGradient.type;
        let gradient;

        if (gradientType === 'radial') {
            const centerX = gradientCanvas.width / 2;
            const centerY = gradientCanvas.height / 2;
            const radius = Math.max(gradientCanvas.width, gradientCanvas.height) / 3;
            gradient = gradientCtx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        } else {
            // Linear gradient
            const angle = (workingGradient.gradient.angle || 0) * Math.PI / 180;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const centerX = gradientCanvas.width / 2;
            const centerY = gradientCanvas.height / 2;
            const length = Math.max(gradientCanvas.width, gradientCanvas.height);

            const x1 = centerX - (length / 2) * cos;
            const y1 = centerY - (length / 2) * sin;
            const x2 = centerX + (length / 2) * cos;
            const y2 = centerY + (length / 2) * sin;

            gradient = gradientCtx.createLinearGradient(x1, y1, x2, y2);
        }

        // Add color stops
        if (workingGradient.gradient.colors) {
            workingGradient.gradient.colors.forEach(colorStop => {
                gradient.addColorStop(colorStop.position / 100, colorStop.color);
            });
        }

        // Fill with gradient
        gradientCtx.fillStyle = gradient;
        gradientCtx.fillRect(0, 0, gradientCanvas.width, gradientCanvas.height);

        // Step 4.5: Apply decorations to gradient canvas BEFORE masking
        console.log('🔍 RENDER ORDER: Step 4.5 - Applying decorations to gradient canvas before masking');
        if (obj.decorationMode && obj.decorationMode !== 'noDecoration' && window.decorationModule) {
            // Create decoration canvas
            const decorationCanvas = document.createElement('canvas');
            decorationCanvas.width = 2000;
            decorationCanvas.height = 2000;
            const decorationCtx = decorationCanvas.getContext('2d');

            // Set decoration type and apply
            window.decorationModule.setActiveDecorationType(obj.decorationMode);
            decorationCtx.save();
            decorationCtx.translate(decorationCanvas.width / 2, decorationCanvas.height / 2);

            // Calculate expanded bounds for mesh warp decoration
            const tempMeasureCtx = document.createElement('canvas').getContext('2d');
            tempMeasureCtx.font = `${obj.fontSize || 100}px ${obj.fontFamily || 'Arial'}`;

            // Include letter spacing in the measurement
            const letterSpacing = obj.letterSpacing || 0;
            let baseWidth;
            if (letterSpacing === 0) {
                baseWidth = tempMeasureCtx.measureText(obj.text || 'TEXT').width;
            } else {
                // Calculate width with letter spacing
                const letters = (obj.text || 'TEXT').split('');
                let totalWidth = 0;
                letters.forEach(letter => {
                    totalWidth += tempMeasureCtx.measureText(letter).width;
                });
                if (letters.length > 1) {
                    totalWidth += letterSpacing * (letters.length - 1);
                }
                baseWidth = totalWidth;
            }

            const baseHeight = (obj.fontSize || 100) * 1.2;

            // Use very expanded bounds for mesh warp to cover all possible distortions
            const expandedWidth = baseWidth * 2.5;
            const expandedHeight = baseHeight * 2.5;

            // Create decoration-compatible text object with expanded bounds and letter spacing
            const decorationTextObj = {
                text: obj.text || 'TEXT',
                font: `${obj.fontSize || 100}px ${obj.fontFamily || 'Arial'}`,
                letterSpacing: letterSpacing,
                customBounds: {
                    width: expandedWidth,
                    height: expandedHeight,
                    isMeshWarp: true,
                    letterSpacing: letterSpacing
                }
            };

            // Apply decoration pattern with expanded bounds
            window.decorationModule.applyDecoration(decorationCtx, decorationTextObj, 0, 0);
            decorationCtx.restore();

            console.log('🎨 DECORATION: Applied decoration pattern for mesh warp gradient text');

            // Apply decorations to gradient canvas using source-over
            gradientCtx.globalCompositeOperation = 'source-over';
            gradientCtx.drawImage(decorationCanvas, 0, 0);
        }

        // Apply text as mask to gradient (with decorations)
        gradientCtx.globalCompositeOperation = 'destination-in';
        gradientCtx.drawImage(textCanvas, 0, 0);

        // Step 5: Draw effects (with text cut out) to target canvas
        targetCtx.drawImage(tempCanvas, -tempCanvas.width / 2, -tempCanvas.height / 2);

        // Step 6: Draw gradient text (with decorations) on top
        targetCtx.drawImage(gradientCanvas, -gradientCanvas.width / 2, -gradientCanvas.height / 2);

        // Step 6.5: Decorations already applied to gradient canvas in Step 4.5
        console.log('🔍 RENDER ORDER: Step 6.5 - Decorations already applied to gradient canvas in Step 4.5');

        // Step 7: Draw front outlines on top of everything (for shadow effects)
        console.log('🔍 RENDER ORDER: Step 7 - Drawing front outlines on top for Mesh Warp');

        // Store original outline widths
        const originalOutlineWidth = obj.perspectiveShadowOutlineWidth;
        const originalD3dWidth = obj.d3dSecondaryWidth;

        if (obj.shadowMode === 'perspectiveShadow' && originalOutlineWidth > 0) {
            console.log('🔍 RENDER ORDER: Drawing perspective shadow front outline on top for Mesh Warp');
            const outlineColor = obj.perspectiveShadowOutlineColor;
            const outlineOpacity = obj.perspectiveShadowOutlineOpacity / 100;
            const outlineWidth = originalOutlineWidth;
            const outlineOffsetX = obj.perspectiveShadowOutlineOffsetX || 0;
            const outlineOffsetY = obj.perspectiveShadowOutlineOffsetY || 0;
            this.drawMeshWarpFrontOutline(targetCtx, outlineColor, outlineOpacity, outlineWidth, outlineOffsetX, outlineOffsetY);
        }
        if (obj.shadowMode === 'detailed3D' && originalD3dWidth > 0) {
            console.log('🔍 RENDER ORDER: Drawing detailed 3D front outline on top for Mesh Warp');
            const outlineColor = obj.d3dSecondaryColor;
            const outlineOpacity = obj.d3dSecondaryOpacity / 100;
            const outlineWidth = originalD3dWidth;
            const outlineOffsetX = obj.d3dSecondaryOffsetX || 0;
            const outlineOffsetY = obj.d3dSecondaryOffsetY || 0;
            this.drawMeshWarpFrontOutline(targetCtx, outlineColor, outlineOpacity, outlineWidth, outlineOffsetX, outlineOffsetY);
        }

        // Restore original gradient
        obj.gradient = originalGradient;

        console.log('🎨 GRADIENT MASK: Mesh warp text with gradient mask complete');
    }

    // Render mesh warp shape for masking (simplified version of main logic)
    renderMeshWarpShape(targetCtx) {
        const obj = this.selectedTextObject;
        if (!obj || !obj.text) return;

        // Use the main offscreen canvas (os) and letter canvas (letterCanvas) assumed to be global
        if (typeof os === 'undefined' || typeof letterCanvas === 'undefined') {
             console.error("Offscreen canvases (os, letterCanvas) not found globally.");
             return;
        }
        const octx = os.getContext('2d');
        const letterCtx = letterCanvas.getContext('2d');

        // Prepare text properties on a temporary context for measurement
        const tempMeasureCtx = document.createElement('canvas').getContext('2d');
        setTextContextOn(tempMeasureCtx, obj);

        const text = obj.text.toUpperCase();
        const letterSpacing = obj._effectiveLetterSpacing || 0;
        let originalTextWidth;

        if (letterSpacing === 0) {
            originalTextWidth = tempMeasureCtx.measureText(text).width;
        } else {
            const letters = text.split('');
            let totalWidth = 0;
            letters.forEach(letter => {
                totalWidth += tempMeasureCtx.measureText(letter).width;
            });
            if (letters.length > 1) {
                totalWidth += letterSpacing * (letters.length - 1);
            }
            originalTextWidth = totalWidth;
        }

        const originalStartX = -originalTextWidth / 2;
        const originalBaselineY = 0;
        let currentOriginalX = originalStartX;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const charMetrics = tempMeasureCtx.measureText(char);
            const charWidth = charMetrics.width;

            const originalCharCenterX = currentOriginalX + charWidth / 2;
            const originalCharCenterY = originalBaselineY;

            const initialObjectCenterX = this.initialGridRect.x + this.initialGridRect.width / 2;
            const initialObjectCenterY = this.initialGridRect.y + this.initialGridRect.height / 2;

            const initialWorldCharCenterX = initialObjectCenterX + originalCharCenterX;
            const initialWorldCharCenterY = initialObjectCenterY + originalCharCenterY;

            const warpData = this.getWarpedData(initialWorldCharCenterX, initialWorldCharCenterY);

            if (!warpData || !warpData.p00 || !warpData.orig_p00) {
                currentOriginalX += charWidth + (i < text.length - 1 ? letterSpacing : 0);
                continue;
            }

            const warpedPos = warpData.pos;

            // Calculate scaling
            const orig_top_w = this.dist(warpData.orig_p00, warpData.orig_p10);
            const orig_bottom_w = this.dist(warpData.orig_p01, warpData.orig_p11);
            const orig_avg_w = (orig_top_w + orig_bottom_w) / 2;
            const orig_left_h = this.dist(warpData.orig_p00, warpData.orig_p01);
            const orig_right_h = this.dist(warpData.orig_p10, warpData.orig_p11);
            const orig_avg_h = (orig_left_h + orig_right_h) / 2;

            const current_top_w = this.dist(warpData.p00, warpData.p10);
            const current_bottom_w = this.dist(warpData.p01, warpData.p11);
            const current_avg_w = (current_top_w + current_bottom_w) / 2;
            const current_left_h = this.dist(warpData.p00, warpData.p01);
            const current_right_h = this.dist(warpData.p10, warpData.p11);
            const current_avg_h = (current_left_h + current_right_h) / 2;

            let scaleX = (orig_avg_w > 0.1) ? (current_avg_w / orig_avg_w) : 1;
            let scaleY = (orig_avg_h > 0.1) ? (current_avg_h / orig_avg_h) : 1;
            scaleX = Math.max(0.05, isNaN(scaleX) ? 1 : scaleX);
            scaleY = Math.max(0.05, isNaN(scaleY) ? 1 : scaleY);

            // Render character for shape
            const letterObj = { ...obj, text: char, originalText: obj.text };
            // Use logical dimensions (divided by scale factor) like other effects do
            const offscreenScaleFactor = letterCanvas.scaleFactor || 1;
            const letterInfo = renderSingleStyledLetter(letterObj, char, letterCtx, letterCanvas.width / offscreenScaleFactor, letterCanvas.height / offscreenScaleFactor, i, text.length);

            targetCtx.save();

            const relativeWarpedX = warpedPos.x - obj.x;
            const relativeWarpedY = warpedPos.y - obj.y;

            const angleRad = -obj.rotation * Math.PI / 180;
            const cos = Math.cos(angleRad);
            const sin = Math.sin(angleRad);
            const finalDrawX = relativeWarpedX * cos - relativeWarpedY * sin;
            const finalDrawY = relativeWarpedX * sin + relativeWarpedY * cos;

            targetCtx.translate(finalDrawX, finalDrawY);
            targetCtx.scale(scaleX, scaleY);

            try {
                const sourceW = letterInfo.width + letterSourcePadding * 2;
                const sourceH = letterInfo.height + letterSourcePadding * 2;
                const sourceX = letterInfo.centerX - sourceW / 2;
                const sourceY = letterInfo.centerY - sourceH / 2;
                const destX = -sourceW / 2;
                const destY = -sourceH / 2;

                if (sourceX >= 0 && sourceY >= 0 && sourceW > 0 && sourceH > 0 &&
                    sourceX + sourceW <= letterCanvas.width && sourceY + sourceH <= letterCanvas.height) {
                    targetCtx.drawImage(letterCanvas, sourceX, sourceY, sourceW, sourceH, destX, destY, sourceW, sourceH);
                }
            } catch (e) {
                console.error("Error drawing warped letter for mask:", e);
            }

            targetCtx.restore();
            currentOriginalX += charWidth + (i < text.length - 1 ? letterSpacing : 0);
        }
    }

    // Function to draw front outline for Mesh Warp effects
    drawMeshWarpFrontOutline(targetCtx, outlineColor, outlineOpacity, outlineWidth, offsetX, offsetY) {
        console.log('🎨 GRADIENT MASK: Drawing Mesh Warp front outline');

        const obj = this.selectedTextObject;
        if (!obj || !obj.text || this.controlPoints.length === 0 || this.initialControlPoints.length === 0) {
            console.warn("Cannot draw mesh warp front outline: Missing object, text, or control points.");
            return;
        }

        targetCtx.save();

        // Apply offset
        targetCtx.translate(offsetX, offsetY);

        // Set outline properties
        targetCtx.strokeStyle = outlineColor;
        targetCtx.globalAlpha = outlineOpacity;
        targetCtx.lineWidth = outlineWidth;
        targetCtx.fillStyle = 'transparent';

        // Use a simplified version of the mesh warp rendering for outline only
        const octx = os.getContext('2d');
        const letterCtx = letterCanvas.getContext('2d');

        // Prepare text properties on a temporary context for measurement
        const tempMeasureCtx = document.createElement('canvas').getContext('2d');
        setTextContextOn(tempMeasureCtx, obj);

        const text = obj.text.toUpperCase();
        const letterSpacing = obj._effectiveLetterSpacing || 0;
        let originalTextWidth;

        if (letterSpacing === 0) {
            // Standard text measurement
            originalTextWidth = tempMeasureCtx.measureText(text).width;
        } else {
            // Calculate width with letter spacing (handles both positive and negative)
            const letters = text.split('');
            let totalWidth = 0;

            // Sum the width of each letter
            letters.forEach(letter => {
                totalWidth += tempMeasureCtx.measureText(letter).width;
            });

            // Add letter spacing between characters
            if (letters.length > 1) {
                totalWidth += letterSpacing * (letters.length - 1);
            }

            originalTextWidth = totalWidth;
        }

        let currentOriginalX = -originalTextWidth / 2;

        // Draw each character with mesh warp transformation (outline only)
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const charWidth = tempMeasureCtx.measureText(char).width;
            const originalCharCenterX = currentOriginalX + charWidth / 2;
            const originalCharCenterY = 0;

            // Get warped position using the same logic as the main mesh warp rendering
            const initialObjectCenterX = this.initialGridRect.x + this.initialGridRect.width / 2;
            const initialObjectCenterY = this.initialGridRect.y + this.initialGridRect.height / 2;

            const initialWorldCharCenterX = initialObjectCenterX + originalCharCenterX;
            const initialWorldCharCenterY = initialObjectCenterY + originalCharCenterY;

            const warpData = this.getWarpedData(initialWorldCharCenterX, initialWorldCharCenterY);
            if (!warpData || !warpData.p00 || !warpData.orig_p00) {
                currentOriginalX += charWidth + (i < text.length - 1 ? letterSpacing : 0);
                continue;
            }

            const warpedPos = warpData.pos;

            // Calculate scale factors (same as main mesh warp rendering for proper distortion)
            const orig_top_w = this.dist(warpData.orig_p00, warpData.orig_p10);
            const orig_bottom_w = this.dist(warpData.orig_p01, warpData.orig_p11);
            const orig_avg_w = (orig_top_w + orig_bottom_w) / 2;
            const orig_left_h = this.dist(warpData.orig_p00, warpData.orig_p01);
            const orig_right_h = this.dist(warpData.orig_p10, warpData.orig_p11);
            const orig_avg_h = (orig_left_h + orig_right_h) / 2;

            const current_top_w = this.dist(warpData.p00, warpData.p10);
            const current_bottom_w = this.dist(warpData.p01, warpData.p11);
            const current_avg_w = (current_top_w + current_bottom_w) / 2;
            const current_left_h = this.dist(warpData.p00, warpData.p01);
            const current_right_h = this.dist(warpData.p10, warpData.p11);
            const current_avg_h = (current_left_h + current_right_h) / 2;

            let scaleX = (orig_avg_w > 0.1) ? (current_avg_w / orig_avg_w) : 1;
            let scaleY = (orig_avg_h > 0.1) ? (current_avg_h / orig_avg_h) : 1;
            scaleX = Math.max(0.05, isNaN(scaleX) ? 1 : scaleX);
            scaleY = Math.max(0.05, isNaN(scaleY) ? 1 : scaleY);

            targetCtx.save();

            const relativeWarpedX = warpedPos.x - obj.x;
            const relativeWarpedY = warpedPos.y - obj.y;

            const angleRad = -obj.rotation * Math.PI / 180;
            const cos = Math.cos(angleRad);
            const sin = Math.sin(angleRad);
            const finalDrawX = relativeWarpedX * cos - relativeWarpedY * sin;
            const finalDrawY = relativeWarpedX * sin + relativeWarpedY * cos;

            targetCtx.translate(finalDrawX, finalDrawY);
            targetCtx.scale(scaleX, scaleY);

            // Set text properties for stroke
            setTextContextOn(targetCtx, obj);
            targetCtx.strokeStyle = outlineColor;
            targetCtx.globalAlpha = outlineOpacity;
            targetCtx.lineWidth = outlineWidth;

            // Draw only the stroke (outline)
            targetCtx.strokeText(char, 0, 0);

            targetCtx.restore();
            currentOriginalX += charWidth + (i < text.length - 1 ? letterSpacing : 0);
        }

        targetCtx.restore();
        console.log('🎨 GRADIENT MASK: Drew Mesh Warp front outline');
    }
}

// Global instance of the mesh warp handler
let activeMeshWarpHandler = null;

// Initialize mesh warp when effect mode is set to 'mesh'
document.getElementById('effectMode').addEventListener('change', function(e) {
    if (e.target.value === 'mesh') {
        // Check if we have a selected text object in the global canvasObjects array
        if (typeof selectedObjectIndex !== 'undefined' && selectedObjectIndex !== -1 &&
            typeof canvasObjects !== 'undefined' && canvasObjects[selectedObjectIndex] &&
            canvasObjects[selectedObjectIndex].type === 'text') {
            try {
                // Check if the object already has a mesh handler
                if (canvasObjects[selectedObjectIndex]._meshWarpHandler) {
                    console.log('Using existing mesh warp handler for object:', canvasObjects[selectedObjectIndex].id);
                    activeMeshWarpHandler = canvasObjects[selectedObjectIndex]._meshWarpHandler;
                    activeMeshWarpHandler.selectedTextObject = canvasObjects[selectedObjectIndex];
                } else {
                    // Create a new mesh warp handler for the selected text object
                    // Pass the canvas element and the selected object directly
                    activeMeshWarpHandler = new MeshWarpHandler(
                        document.getElementById('demo'),
                        canvasObjects[selectedObjectIndex]
                    );

                    // Store the handler on the object for future use
                    canvasObjects[selectedObjectIndex]._meshWarpHandler = activeMeshWarpHandler;
                    console.log('Created and stored new mesh warp handler for object:', canvasObjects[selectedObjectIndex].id);
                }

                // Set the object's effectMode to 'mesh' to ensure consistency
                canvasObjects[selectedObjectIndex].effectMode = 'mesh';

                // Enable mesh controls in UI
                const colsInput = document.getElementById('iMeshCols');
                const rowsInput = document.getElementById('iMeshRows');
                const resetBtn = document.getElementById('resetMeshBtn');
                const toggleBtn = document.getElementById('toggleMeshBtn');

                if (colsInput) colsInput.disabled = false;
                if (rowsInput) rowsInput.disabled = false;
                if (resetBtn) resetBtn.disabled = false;
                if (toggleBtn) {
                    toggleBtn.disabled = false;
                    toggleBtn.textContent = activeMeshWarpHandler.showGrid ? 'Hide Grid' : 'Show Grid';
                }

                // Force a redraw to show the grid immediately
                if (typeof update === 'function') {
                    update();
                }
            } catch (error) {
                console.error('Error initializing mesh warp handler:', error);
            }
        } else {
            console.warn('No text object selected for mesh warp effect');
        }
    } else {
        // Clean up when switching to a different effect
        if (activeMeshWarpHandler) {
            // Disable mesh controls in UI
            const colsInput = document.getElementById('iMeshCols');
            const rowsInput = document.getElementById('iMeshRows');
            const resetBtn = document.getElementById('resetMeshBtn');
            const toggleBtn = document.getElementById('toggleMeshBtn');

            if (colsInput) colsInput.disabled = true;
            if (rowsInput) rowsInput.disabled = true;
            if (resetBtn) resetBtn.disabled = true;
            if (toggleBtn) toggleBtn.disabled = true;

            // Clear the active handler but preserve individual object handlers
            // This allows objects to retain their mesh distortion when not selected
            console.log('Clearing active mesh handler but preserving object handlers');
            activeMeshWarpHandler = null;
        }
    }
});

// Instead of overriding the update function, provide a function to draw the mesh grid
function drawMeshGrid(context) {
    if (activeMeshWarpHandler && selectedObjectIndex !== -1 &&
        canvasObjects[selectedObjectIndex].type === 'text' &&
        canvasObjects[selectedObjectIndex].effectMode === 'mesh') {
        activeMeshWarpHandler.drawMeshGrid(context);
    }
}

// Export the drawMeshGrid function to be called from the main update function
window.drawMeshWarpGrid = drawMeshGrid;

// Export the MeshWarpHandler class globally for text style loading
window.MeshWarpHandler = MeshWarpHandler;

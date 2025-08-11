// Helper function to clean objects for serialization (same as template saving)
function cleanObjectForSerialization(obj) {
    // Create a clean copy without circular references
    const cleanObj = {};

    // Copy basic properties
    const basicProps = ['id', 'type', 'text', 'x', 'y', 'fontSize', 'fontFamily', 'color', 'bold', 'italic',
                       'rotation', 'scale', 'opacity', 'letterSpacing', 'effectMode', 'skewX', 'skewY',
                       'layerOrder', 'zIndex', 'templateId', 'generationId', 'isFromGeneration', 'newColorIntensity'];

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

        // 🎭 PRESERVE MASKING PROPERTIES FOR IMAGES
        if (obj.isMasked !== undefined) {
            cleanObj.isMasked = obj.isMasked;
            console.log(`[SaveProject] 🎭 Preserved isMasked=${obj.isMasked} for object ${obj.id}`);
        }
        if (obj.maskShapeId !== undefined) {
            cleanObj.maskShapeId = obj.maskShapeId;
            console.log(`[SaveProject] 🎭 Preserved maskShapeId=${obj.maskShapeId} for object ${obj.id}`);
        }
        if (obj.isMaskShape !== undefined) {
            cleanObj.isMaskShape = obj.isMaskShape;
            console.log(`[SaveProject] 🎭 Preserved isMaskShape=${obj.isMaskShape} for object ${obj.id}`);
        }
        if (obj.isVisible !== undefined) {
            cleanObj.isVisible = obj.isVisible;
            console.log(`[SaveProject] 🎭 Preserved isVisible=${obj.isVisible} for object ${obj.id}`);
        }

        // Additional image properties
        if (obj.originalWidth !== undefined) cleanObj.originalWidth = obj.originalWidth;
        if (obj.originalHeight !== undefined) cleanObj.originalHeight = obj.originalHeight;
        if (obj.templateId !== undefined) cleanObj.templateId = obj.templateId;
        if (obj.generationId !== undefined) cleanObj.generationId = obj.generationId;
        if (obj.isFromGeneration !== undefined) cleanObj.isFromGeneration = obj.isFromGeneration;
    }

    // Copy shape-specific properties
    if (obj.type === 'shape' || obj.objectType || obj.type === 'image') {
        console.log(`[SaveProject] 🎨 SHAPE DEBUG - Object ${obj.id}:`, obj.type, obj.imageUrl || obj.text);
        console.log(`[SaveProject] 🎨 SHAPE PROPERTIES:`, {
            fill: obj.fill,
            stroke: obj.stroke,
            strokeWidth: obj.strokeWidth,
            svgColor: obj.svgColor,
            svgGradient: obj.svgGradient,
            gradientFill: obj.gradientFill
        });

        // Shape/SVG color properties
        if (obj.fill !== undefined) cleanObj.fill = obj.fill;
        if (obj.stroke !== undefined) cleanObj.stroke = obj.stroke;
        if (obj.strokeWidth !== undefined) cleanObj.strokeWidth = obj.strokeWidth;
        if (obj.gradientFill !== undefined) cleanObj.gradientFill = obj.gradientFill;
        if (obj.svgColor !== undefined) cleanObj.svgColor = obj.svgColor;
        if (obj.svgGradient !== undefined) cleanObj.svgGradient = obj.svgGradient;

        // Shape type and dimensions
        if (obj.objectType) cleanObj.objectType = obj.objectType;
        if (obj.width !== undefined) cleanObj.width = obj.width;
        if (obj.height !== undefined) cleanObj.height = obj.height;
        if (obj.radius !== undefined) cleanObj.radius = obj.radius;
        if (obj.rx !== undefined) cleanObj.rx = obj.rx;
        if (obj.ry !== undefined) cleanObj.ry = obj.ry;

        // Shape positioning
        if (obj.originX !== undefined) cleanObj.originX = obj.originX;
        if (obj.originY !== undefined) cleanObj.originY = obj.originY;
        if (obj.left !== undefined) cleanObj.left = obj.left;
        if (obj.top !== undefined) cleanObj.top = obj.top;
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
                            'strokeMode', 'strokeWidth', 'strokeColor', 'strokeOpacity', 'decorationMode', 'hLineWeight', 'hLineDist', 'hLineColor',
                            'hLineCoverage', 'hLineOpacity', 'ccDist', 'ccColor', 'ccFillDir', 'ccCoverage', 'ccOpacity', 'oLineWeight', 'oLineDist', 'oLineColor',
                            'oCoverage', 'oOpacity', 'flcDist', 'flcColor', 'flcWeight', 'flcSpacing', 'flcDir', 'flcCoverage', 'flcOpacity', 'gridPadding'];

        effectProps.forEach(prop => {
            if (obj[prop] !== undefined) {
                cleanObj[prop] = obj[prop];
            }
        });

        // 🔧 GRID DISTORT SAVE - Save Grid Distort data separately from Mesh Warp
        if (obj.effectMode === 'grid-distort') {
            console.log(`[LeftMenuGridDistortSave] 🔧 Saving Grid Distort data for text "${obj.text}"`);

            // Save Grid Distort specific properties
            if (obj.gridDistortCols !== undefined) cleanObj.gridDistortCols = obj.gridDistortCols;
            if (obj.gridDistortRows !== undefined) cleanObj.gridDistortRows = obj.gridDistortRows;
            if (obj.gridDistortPadding !== undefined) cleanObj.gridDistortPadding = obj.gridDistortPadding;
            if (obj.gridDistortIntensity !== undefined) cleanObj.gridDistortIntensity = obj.gridDistortIntensity;
            if (obj.gridDistortVerticalOnly !== undefined) cleanObj.gridDistortVerticalOnly = obj.gridDistortVerticalOnly;

            // Save the complete Grid Distort object with control points
            if (obj.gridDistort) {
                cleanObj.gridDistortData = {
                    gridCols: obj.gridDistort.gridCols || 3,
                    gridRows: obj.gridDistort.gridRows || 2,
                    gridPadding: obj.gridDistort.gridPadding || 120,
                    intensity: obj.gridDistort.intensity || 1,
                    showGrid: obj.gridDistort.showGrid || false,
                    lastText: obj.gridDistort.lastText || obj.text,
                    lastFontSize: obj.gridDistort.lastFontSize || obj.fontSize,
                    verticalOnly: obj.gridDistort.verticalOnly || false,

                    // Critical: Save the control points that define the distortion
                    controlPoints: obj.gridDistort.controlPoints ?
                        obj.gridDistort.controlPoints.map(row =>
                            row.map(point => ({ x: point.x, y: point.y }))
                        ) : [],

                    // Critical: Save the relative control points for preserving distortion
                    relativeControlPoints: obj.gridDistort.relativeControlPoints ?
                        obj.gridDistort.relativeControlPoints.map(row =>
                            row.map(point => ({ x: point.x, y: point.y }))
                        ) : [],

                    // Save grid bounds for proper restoration
                    gridBounds: obj.gridDistort.gridBounds ? {
                        width: obj.gridDistort.gridBounds.width,
                        height: obj.gridDistort.gridBounds.height,
                        padding: obj.gridDistort.gridBounds.padding
                    } : null
                };

                console.log(`[LeftMenuGridDistortSave] 🔧 ✅ Successfully created gridDistortData:`, {
                    controlPointsCount: cleanObj.gridDistortData.controlPoints.length,
                    relativeControlPointsCount: cleanObj.gridDistortData.relativeControlPoints.length,
                    hasGridBounds: !!cleanObj.gridDistortData.gridBounds,
                    gridCols: cleanObj.gridDistortData.gridCols,
                    gridRows: cleanObj.gridDistortData.gridRows
                });
            } else {
                console.log(`[LeftMenuGridDistortSave] 🔧 ❌ No gridDistort object found for text "${obj.text}"`);
            }

            // Do NOT save meshWarp data for Grid Distort objects
            console.log(`[LeftMenuGridDistortSave] 🔧 Skipping meshWarp data for Grid Distort object`);

        } else if (obj.effectMode === 'mesh') {
            // Handle Mesh Warp properties ONLY for mesh effect mode
            console.log(`[LeftMenuMeshWarpSave] 🔧 Saving Mesh Warp data for text "${obj.text}"`);

            if (obj.meshWarp) {
                cleanObj.meshWarp = {
                    controlPoints: obj.meshWarp.controlPoints ? obj.meshWarp.controlPoints.map(p => ({ ...p })) : [],
                    initialControlPoints: obj.meshWarp.initialControlPoints ? obj.meshWarp.initialControlPoints.map(p => ({ ...p })) : [],
                    relativeControlPoints: obj.meshWarp.relativeControlPoints ? obj.meshWarp.relativeControlPoints.map(p => ({ ...p })) : [],
                    hasCustomDistortion: obj.meshWarp.hasCustomDistortion || false,
                    showGrid: obj.meshWarp.showGrid !== undefined ? obj.meshWarp.showGrid : true,
                    gridRect: obj.meshWarp.gridRect ? { ...obj.meshWarp.gridRect } : null,
                    initialized: obj.meshWarp.initialized || false
                };
                console.log(`[LeftMenuMeshWarpSave] 🔧 Saved Mesh Warp data:`, {
                    effectMode: obj.effectMode,
                    controlPointsCount: cleanObj.meshWarp.controlPoints.length,
                    hasCustomDistortion: cleanObj.meshWarp.hasCustomDistortion
                });
            } else {
                console.log(`[LeftMenuMeshWarpSave] 🔧 No meshWarp object found for text "${obj.text}"`);
            }

            // Do NOT save gridDistortData for Mesh Warp objects
            console.log(`[LeftMenuMeshWarpSave] 🔧 Skipping gridDistortData for Mesh Warp object`);

        } else {
            // For other effect modes (none, curve, skew, etc.), don't save either effect data
            console.log(`[LeftMenuCleanObject] Text "${obj.text}" has effectMode "${obj.effectMode}" - not saving Grid Distort or Mesh Warp data`);
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
    delete cleanObj.maskShape; // Remove runtime mask shape reference (but keep maskShapeId)

    return cleanObj;
}

// Left Menu and Sidebar Functionality
document.addEventListener('DOMContentLoaded', () => {
    // Get all menu items and sidebars
    const menuItems = document.querySelectorAll('.left-menu-item');
    const sidebars = document.querySelectorAll('.left-sidebar');
    const closeButtons = document.querySelectorAll('.left-sidebar-close');

    // Function to close all sidebars
    const closeAllSidebars = () => {
        console.log('🎨 closeAllSidebars called, isOpeningForRestyle:', window.isOpeningForRestyle, 'isOpeningForReplace:', window.isOpeningForReplace, 'isGenerationInProgress:', window.isGenerationInProgress);

        // If we're opening for restyle or replace, completely skip closing sidebars
        if (window.isOpeningForRestyle || window.isOpeningForReplace) {
            console.log('🎨 closeAllSidebars - SKIPPING because opening for restyle or replace');
            return;
        }

        // If generation is in progress, block sidebar closing to prevent losing target image
        if (window.isGenerationInProgress) {
            console.log('🎯 closeAllSidebars - BLOCKED because generation is in progress');
            if (window.showToast) {
                window.showToast('Please wait for generation to complete', 'info');
            }
            return;
        }

        console.log('🎨 closeAllSidebars - Call stack:', new Error().stack);

        // Check if AI Generator sidebar is being closed and reset it to normal mode
        const aiGeneratorSidebar = document.getElementById('ai-generator-sidebar');
        console.log('🎨 closeAllSidebars - AI Generator state:', {
            exists: !!aiGeneratorSidebar,
            hasActive: aiGeneratorSidebar?.classList.contains('active'),
            isOpeningForRestyle: window.isOpeningForRestyle
        });

        if (aiGeneratorSidebar && aiGeneratorSidebar.classList.contains('active')) {
            console.log('🎨 closeAllSidebars - Resetting AI Generator to normal mode');
            // Reset AI Generator to normal mode when closing
            if (window.resetAIGeneratorToNormalMode) {
                window.resetAIGeneratorToNormalMode();
            }
        }

        console.log('🎨 closeAllSidebars - Removing active classes from all sidebars and menu items');
        sidebars.forEach(sidebar => {
            sidebar.classList.remove('active');
        });
        menuItems.forEach(item => {
            item.classList.remove('active');
        });
        console.log('🎨 closeAllSidebars completed');
    };

    // Make closeAllSidebars globally accessible
    window.closeAllSidebars = closeAllSidebars;

    // Add click event to menu items
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const sidebarId = item.getAttribute('data-sidebar');
            const sidebar = document.getElementById(sidebarId);

            // If the sidebar is already active, close it
            if (sidebar.classList.contains('active')) {
                closeAllSidebars();
            } else {
                // Close all sidebars first
                closeAllSidebars();

                // Open the clicked sidebar
                sidebar.classList.add('active');
                item.classList.add('active');
            }
        });
    });

    // Add click event to close buttons
    closeButtons.forEach(button => {
        button.addEventListener('click', closeAllSidebars);
    });

    // Close sidebars when clicking outside
    document.addEventListener('click', (event) => {
        // Check if the click is outside the menu and sidebars
        const isOutsideMenu = !event.target.closest('.left-menu');
        const isOutsideSidebar = !event.target.closest('.left-sidebar');

        // 🔧 FIX: Don't close sidebars when clicking on UI controls to prevent object deselection
        const isUIControl = event.target.closest('.controls-panel') ||
                           event.target.closest('.text-controls') ||
                           event.target.closest('.image-controls') ||
                           event.target.closest('.shape-controls') ||
                           event.target.closest('.right-panel') ||
                           event.target.closest('.property-controls') ||
                           event.target.closest('input') ||
                           event.target.closest('select') ||
                           event.target.closest('button') ||
                           event.target.closest('.slider') ||
                           event.target.closest('.color-picker') ||
                           event.target.closest('.dropdown');

        if (isOutsideMenu && isOutsideSidebar && !isUIControl) {
            closeAllSidebars();
        }
    });

    // Handle menu item actions
    const menuActionItems = document.querySelectorAll('.menu-items .menu-item');
    console.log('[LeftMenu] 🔍 Found menu action items:', menuActionItems.length);

    menuActionItems.forEach((item, index) => {
        console.log(`[LeftMenu] 🔍 Menu item ${index}: "${item.textContent.trim()}"`);

        item.addEventListener('click', (event) => {
            console.log('[LeftMenu] 🚨 CLICK DETECTED ON MENU ITEM!');
            const action = item.textContent.trim();
            console.log(`[LeftMenu] 🎯 MENU ITEM CLICKED: "${action}"`);
            console.log(`[LeftMenu] 🎯 EVENT DETAILS:`, event);
            console.log(`[LeftMenu] 🎯 ITEM ELEMENT:`, item);

            // Prevent event bubbling to avoid sidebar closing
            event.stopPropagation();

            // Check for dynamic save button text (starts with Save and contains project name)
            if (action.startsWith('Save ') && action.includes('"')) {
                console.log('[LeftMenu] 💾 CALLING handleSaveProject() for existing project');
                // Prevent sidebar from closing during save
                event.preventDefault();
                // Trigger save project functionality
                handleSaveProject();
                return;
            }

            switch (action) {
                case 'New Project':
                    console.log('[LeftMenu] ➡️ Redirecting to new project');
                    // Redirect to design editor for new project
                    window.location.href = '/design-editor.html';
                    break;
                case 'My Projects':
                    console.log('[LeftMenu] ➡️ Redirecting to my projects');
                    // Redirect to my projects page
                    window.location.href = '/my-projects.html';
                    break;
                case 'Save Project':
                case '💾 Save Project':
                    console.log('[LeftMenu] 💾 CALLING handleSaveProject()');
                    // Prevent sidebar from closing during save
                    event.preventDefault();
                    // Trigger save project functionality
                    handleSaveProject();
                    break;
                case '📋 Save As New Project':
                    console.log('[LeftMenu] 📋 CALLING handleSaveProject() for Save As');
                    // Prevent sidebar from closing during save
                    event.preventDefault();
                    // Clear any existing project info to force "Save As"
                    window.currentProjectId = null;
                    window.currentProjectTitle = null;
                    window.currentProjectFolderId = null;
                    // Trigger save project functionality
                    handleSaveProject();
                    break;
                case 'Duplicate Project':
                    console.log('[LeftMenu] 📋 Calling handleDuplicateProject()');
                    // Trigger duplicate project functionality
                    handleDuplicateProject();
                    break;
                default:
                    console.log(`[LeftMenu] ❓ Unknown action: "${action}"`);
            }
        });
    });

    // Load text styles when text sidebar is opened
    const textSidebar = document.getElementById('text-sidebar');
    if (textSidebar) {
        const textMenuItem = document.querySelector('[data-sidebar="text-sidebar"]');
        if (textMenuItem) {
            textMenuItem.addEventListener('click', loadTextStyles);
        }
    }

    // Load text styles function
    async function loadTextStyles() {
        const textStylesGrid = document.getElementById('text-styles-grid');
        if (!textStylesGrid) return;

        // Show loading message
        textStylesGrid.innerHTML = '<div class="loading-message">Loading text styles...</div>';

        try {
            const response = await fetch('/api/text-styles/library', { credentials: 'include' });
            if (!response.ok) {
                throw new Error(`Failed to load text styles: ${response.statusText}`);
            }
            const textStyles = await response.json();

            textStylesGrid.innerHTML = '';

            if (textStyles.length === 0) {
                textStylesGrid.innerHTML = '<div class="no-styles-message">No text styles in library yet.</div>';
                return;
            }

            textStyles.forEach(textStyle => {
                const styleElement = document.createElement('div');
                styleElement.className = 'text-style-item';
                styleElement.innerHTML = `
                    <img src="${textStyle.previewImageUrl}" alt="${textStyle.name}" class="text-style-thumbnail" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                    <div class="text-style-fallback" style="display:none;">No Preview</div>
                    <div class="text-style-name">${textStyle.name}</div>
                `;

                styleElement.addEventListener('click', () => loadTextStyleToCanvas(textStyle));
                textStylesGrid.appendChild(styleElement);
            });

        } catch (error) {
            console.error('Error loading text styles:', error);
            textStylesGrid.innerHTML = '<div class="error-message">Error loading text styles. Please try again.</div>';
        }
    }

    // Load text style to canvas function
    async function loadTextStyleToCanvas(textStyle) {
        try {
            console.log('[LoadTextStyle] Loading text style:', textStyle.name);
            console.log('[LoadTextStyle] Text style data:', textStyle);

            if (!textStyle.canvasObjects || textStyle.canvasObjects.length === 0) {
                console.warn('[LoadTextStyle] No canvas objects in text style');
                if (window.showToast) {
                    window.showToast('No objects found in text style', 'warning');
                }
                return;
            }

            // IMPROVED: Check if a layout rectangle is selected for positioning
            const isLayoutRectSelected = window.selectedLayoutRectIndex !== -1 &&
                                        window.layoutRectangles &&
                                        window.layoutRectangles[window.selectedLayoutRectIndex];

            let targetCenter, offset, shouldScaleToFit = false;

            if (isLayoutRectSelected) {
                // Place in selected layout rectangle
                const layoutRect = window.layoutRectangles[window.selectedLayoutRectIndex];
                targetCenter = {
                    x: layoutRect.x + layoutRect.width / 2,
                    y: layoutRect.y + layoutRect.height / 2
                };
                shouldScaleToFit = true;
                console.log('[LoadTextStyle] IMPROVED: Placing in layout rectangle:', layoutRect);
            } else {
                // Get artboard center for positioning (instead of canvas center)
                if (window.artboard && window.artboard.x !== undefined && window.artboard.y !== undefined) {
                    // Use artboard center if artboard is defined
                    targetCenter = {
                        x: window.artboard.x + window.artboard.width / 2,
                        y: window.artboard.y + window.artboard.height / 2
                    };
                    console.log('[LoadTextStyle] Using artboard center:', targetCenter);
                } else {
                    // Fallback to canvas center if no artboard
                    targetCenter = {
                        x: window.canvas ? window.canvas.width / 2 : 1024,
                        y: window.canvas ? window.canvas.height / 2 : 1024
                    };
                    console.log('[LoadTextStyle] Using canvas center (no artboard):', targetCenter);
                }
            }

            // Calculate offset to center the text style on target location
            const styleCenter = {
                x: textStyle.artboard.width / 2,
                y: textStyle.artboard.height / 2
            };

            offset = {
                x: targetCenter.x - styleCenter.x,
                y: targetCenter.y - styleCenter.y
            };

            console.log('[LoadTextStyle] Style center:', styleCenter);
            console.log('[LoadTextStyle] Target center:', targetCenter);
            console.log('[LoadTextStyle] Offset:', offset);

            // Process each object from the text style
            const objectPromises = textStyle.canvasObjects.map(async (obj) => {
                console.log('[LoadTextStyle] Processing object:', obj.type, obj.text || obj.imageUrl);

                const newObj = JSON.parse(JSON.stringify(obj)); // Deep copy

                // Position relative to canvas center
                newObj.x = obj.x + offset.x;
                newObj.y = obj.y + offset.y;

                // Assign new ID - access the global nextId variable properly
                if (typeof window.nextId !== 'undefined') {
                    newObj.id = window.nextId++;
                } else {
                    newObj.id = Date.now() + Math.random();
                }

                // Ensure object is not selected initially
                newObj.isSelected = false;

                // Handle different object types
                if (newObj.type === 'text') {
                    console.log('[LoadTextStyle] Adding text object:', newObj.text);

                    // Ensure all required properties exist with proper defaults
                    const textDefaults = {
                        id: newObj.id,
                        type: 'text',
                        text: newObj.text || "TEXT",
                        x: newObj.x || 0,
                        y: newObj.y || 0,
                        color: newObj.color || "#3b82f6",
                        gradient: newObj.gradient || null,
                        fontFamily: newObj.fontFamily || "Poppins",
                        fontSize: newObj.fontSize || 150,
                        bold: newObj.bold !== undefined ? newObj.bold : true,
                        italic: newObj.italic !== undefined ? newObj.italic : false,
                        rotation: newObj.rotation || 0,
                        letterSpacing: newObj.letterSpacing || 0,
                        opacity: newObj.opacity !== undefined ? newObj.opacity : 100,
                        isSelected: false,
                        effectMode: newObj.effectMode || 'normal',
                        decorationMode: newObj.decorationMode || 'noDecoration',
                        strokeMode: newObj.strokeMode || 'noStroke',
                        strokeOpacity: newObj.strokeOpacity !== undefined ? newObj.strokeOpacity : 100,
                        shadowMode: newObj.shadowMode || 'noShadow',
                        skewX: newObj.skewX || 0,
                        skewY: newObj.skewY || 0,
                        scale: newObj.scale || 1.0,
                        // Copy all other properties from newObj
                        ...newObj
                    };

                    // Ensure numeric properties are numbers
                    const numericProps = ['x', 'y', 'fontSize', 'rotation', 'scale', 'opacity', 'letterSpacing', 'skewX', 'skewY'];
                    numericProps.forEach(prop => {
                        if (textDefaults[prop] !== undefined) {
                            const value = parseFloat(textDefaults[prop]);
                            textDefaults[prop] = isNaN(value) ? 0 : value;
                        }
                    });

                    console.log('[LoadTextStyle] Text object with defaults:', textDefaults);

                    // IMPROVED: Scale text to fit layout rectangle if one is selected
                    if (shouldScaleToFit && isLayoutRectSelected) {
                        const layoutRect = window.layoutRectangles[window.selectedLayoutRectIndex];

                        // Get actual visible text dimensions instead of bounding box
                        const actualBounds = window.getActualVisibleBounds ?
                            window.getActualVisibleBounds(textDefaults) :
                            { width: textDefaults.fontSize * textDefaults.text.length * 0.6, height: textDefaults.fontSize };

                        const textWidth = actualBounds.width;
                        const textHeight = actualBounds.height;

                        console.log('[LoadTextStyle] IMPROVED FITTING: Using actual visible bounds for text style');
                        console.log('[LoadTextStyle] Actual visible dimensions:', textWidth, 'x', textHeight);

                        // Calculate scale to fit within layout rectangle while maintaining aspect ratio
                        const scaleX = layoutRect.width / textWidth;
                        const scaleY = layoutRect.height / textHeight;
                        const maxScale = Math.min(scaleX, scaleY);

                        // Use 95% of the maximum scale to fit within the rectangle with padding
                        const scale = maxScale * 1;

                        // Apply the scale to the text object
                        textDefaults.scale = scale;

                        console.log('[LoadTextStyle] Scaled text style to fit layout rectangle:', scale);
                        console.log('[LoadTextStyle] Layout rect dimensions:', layoutRect.width, 'x', layoutRect.height);
                        console.log('[LoadTextStyle] Target scale:', scale);
                    }

                    // Special handling for mesh warp restoration
                    if (textDefaults.effectMode === 'mesh' && textDefaults.meshWarp && textDefaults.meshWarp.initialized) {
                        console.log('[LoadTextStyle] Restoring mesh warp distortion:', textDefaults.meshWarp);

                        // Ensure mesh warp data is properly structured
                        if (!textDefaults.meshWarp.controlPoints) {
                            textDefaults.meshWarp.controlPoints = [];
                        }
                        if (!textDefaults.meshWarp.initialControlPoints) {
                            textDefaults.meshWarp.initialControlPoints = [];
                        }
                        if (!textDefaults.meshWarp.relativeControlPoints) {
                            textDefaults.meshWarp.relativeControlPoints = [];
                        }

                        // Mark that this mesh warp has custom distortion to preserve it
                        textDefaults.meshWarp.hasCustomDistortion = true;
                        textDefaults.meshWarp.showGrid = false; // Hide grid by default when loading

                        console.log('[LoadTextStyle] Mesh warp data prepared for restoration');
                    }

                    // Text objects can be added directly
                    if (window.canvasObjects && Array.isArray(window.canvasObjects)) {
                        window.canvasObjects.push(textDefaults);
                        console.log('[LoadTextStyle] Text object added to canvas');

                        // If this text has mesh warp with custom distortion, create handler immediately
                        if (textDefaults.effectMode === 'mesh' && textDefaults.meshWarp &&
                            textDefaults.meshWarp.hasCustomDistortion && textDefaults.meshWarp.relativeControlPoints.length > 0) {

                            console.log('[LoadTextStyle] Creating mesh warp handler immediately for text with custom distortion');

                            // Create mesh warp handler immediately
                            if (typeof window.MeshWarpHandler !== 'undefined') {
                                try {
                                    // Prevent the mesh handler constructor from calling update()
                                    window.skipMeshUpdate = true;

                                    const meshHandler = new window.MeshWarpHandler(
                                        document.getElementById('demo'),
                                        textDefaults
                                    );
                                    textDefaults._meshWarpHandler = meshHandler;

                                    // Set as active mesh warp handler
                                    window.activeMeshWarpHandler = meshHandler;

                                    // Re-enable updates
                                    window.skipMeshUpdate = false;

                                    console.log('[LoadTextStyle] Mesh warp handler created and assigned to text object');
                                    console.log('[LoadTextStyle] Handler control points:', meshHandler.controlPoints.length);
                                    console.log('[LoadTextStyle] Handler has custom distortion:', meshHandler.hasCustomDistortion);

                                    // Select the text object to activate the mesh warp handler
                                    const objectIndex = window.canvasObjects.length - 1;
                                    if (typeof window.selectObject === 'function') {
                                        window.selectObject(objectIndex);
                                        console.log('[LoadTextStyle] Selected text object to activate mesh warp handler');
                                    } else if (typeof window.selectedObjectIndex !== 'undefined') {
                                        window.selectedObjectIndex = objectIndex;
                                        console.log('[LoadTextStyle] Set selectedObjectIndex to activate mesh warp handler');
                                    }
                                } catch (handlerError) {
                                    console.error('[LoadTextStyle] Error creating mesh warp handler:', handlerError);
                                    // Make sure to re-enable updates even if there's an error
                                    window.skipMeshUpdate = false;
                                }
                            } else {
                                console.warn('[LoadTextStyle] MeshWarpHandler class not available');
                            }
                        }
                    }
                } else if (newObj.type === 'image') {
                    console.log('[LoadTextStyle] Loading image object:', newObj.imageUrl);
                    // For images, we need to reload the image object
                    return new Promise((resolve) => {
                        const img = new Image();
                        img.onload = () => {
                            newObj.image = img;
                            newObj.originalWidth = img.width;
                            newObj.originalHeight = img.height;

                            // IMPROVED: Scale image to fit layout rectangle if one is selected
                            if (shouldScaleToFit && isLayoutRectSelected) {
                                const layoutRect = window.layoutRectangles[window.selectedLayoutRectIndex];

                                // For images, use actual image dimensions (no bounding box issues)
                                const originalWidth = img.width;
                                const originalHeight = img.height;

                                console.log('[LoadTextStyle] IMPROVED FITTING: Using actual image dimensions (no bounding box issues)');

                                // Calculate scale to fit within layout rectangle while maintaining aspect ratio
                                const scaleX = layoutRect.width / originalWidth;
                                const scaleY = layoutRect.height / originalHeight;
                                const maxScale = Math.min(scaleX, scaleY);

                                // Use 95% of the maximum scale to fit within the rectangle with padding
                                const scale = maxScale * 1;

                                // Apply the scale to the image object
                                newObj.scale = scale;

                                console.log('[LoadTextStyle] Scaled image in text style to fit layout rectangle:', scale);
                                console.log('[LoadTextStyle] Layout rect dimensions:', layoutRect.width, 'x', layoutRect.height);
                                console.log('[LoadTextStyle] Original image dimensions:', originalWidth, 'x', originalHeight);
                            }

                            if (window.canvasObjects && Array.isArray(window.canvasObjects)) {
                                window.canvasObjects.push(newObj);
                                console.log('[LoadTextStyle] Image object added to canvas');
                            }
                            resolve();
                        };
                        img.onerror = () => {
                            console.error('[LoadTextStyle] Failed to load image:', newObj.imageUrl);
                            resolve(); // Continue even if image fails
                        };
                        img.src = newObj.imageUrl;
                    });
                }
            });

            // Wait for all objects to be processed (especially images)
            await Promise.all(objectPromises.filter(p => p instanceof Promise));

            console.log('[LoadTextStyle] All objects processed, updating canvas');
            console.log('[LoadTextStyle] Canvas objects count:', window.canvasObjects ? window.canvasObjects.length : 'undefined');

            // Sync global references
            if (typeof window.syncGlobalReferences === 'function') {
                window.syncGlobalReferences();
            }

            // Auto-activate mesh warp handlers for immediate visual feedback (same as templates)
            setTimeout(() => {
                let meshTextFound = false;
                window.canvasObjects.forEach((obj, index) => {
                    if (obj.type === 'text' && obj.effectMode === 'mesh' && obj._meshWarpHandler && !meshTextFound) {
                        console.log('[LoadTextStyle] Auto-activating mesh warp for immediate display:', obj.text);

                        // Temporarily select the object to activate mesh warp
                        const previousSelection = window.selectedObjectIndex;
                        window.selectedObjectIndex = index;
                        obj.isSelected = true;

                        // Activate the mesh warp handler
                        window.activeMeshWarpHandler = obj._meshWarpHandler;
                        window.activeMeshWarpHandler.selectedTextObject = obj;

                        // Force a redraw to show the distortion
                        if (typeof window.update === 'function') {
                            window.update();
                        }

                        // After a brief moment, keep the object selected for editing (unlike templates)
                        setTimeout(() => {
                            // Keep the mesh object selected for immediate editing
                            console.log('[LoadTextStyle] Keeping mesh text selected for editing');

                            // Show the mesh grid for editing
                            if (obj._meshWarpHandler) {
                                obj._meshWarpHandler.showGrid = true;
                                console.log('[LoadTextStyle] Enabled mesh grid for editing');
                            }

                            // Update UI to reflect the selected object
                            if (typeof window.updateUIFromSelectedObject === 'function') {
                                window.updateUIFromSelectedObject();
                            }

                            // Force another update to show the grid
                            if (typeof window.update === 'function') {
                                window.update();
                            }
                        }, 100); // Brief delay to ensure mesh warp is activated

                        meshTextFound = true; // Only auto-activate the first mesh text found
                    }
                });

                if (!meshTextFound) {
                    console.log('[LoadTextStyle] No mesh warp text objects found for auto-activation');
                }
            }, 200); // Small delay to ensure everything is fully loaded

            // Update canvas if update function exists
            if (window.update) {
                console.log('[LoadTextStyle] Calling update function');
                window.update();
            } else {
                console.warn('[LoadTextStyle] Update function not found');
            }

            // Show success message
            if (window.showToast) {
                window.showToast(`Text style "${textStyle.name}" added to canvas`, 'success');
            } else {
                console.log(`Text style "${textStyle.name}" added to canvas`);
            }

            // Close the sidebar after adding
            closeAllSidebars();

        } catch (error) {
            console.error('[LoadTextStyle] Error loading text style to canvas:', error);
            if (window.showToast) {
                window.showToast(`Error loading text style: ${error.message}`, 'error');
            } else {
                alert(`Error loading text style: ${error.message}`);
            }
        }
    }

    // Handle element item clicks - REMOVED
    // Element clicks are now handled by elements-accordion.js
    // This prevents conflicts with the proper shape loading functionality

    // Image item clicks are now handled by the dynamic images-loader.js
    // This ensures compatibility with dynamically loaded stock images

    // Initialize AI Generator when sidebar is opened
    const aiGeneratorSidebar = document.getElementById('ai-generator-sidebar');
    if (aiGeneratorSidebar) {
        const aiGeneratorMenuItem = document.querySelector('[data-sidebar="ai-generator-sidebar"]');
        if (aiGeneratorMenuItem) {
            aiGeneratorMenuItem.addEventListener('click', initializeAIGeneratorSidebar);
        }
    }

    // Initialize AI Generator Sidebar
    function initializeAIGeneratorSidebar() {
        console.log('[AIGenerator] Initializing AI Generator sidebar');

        // Load templates if not already loaded
        if (!document.querySelector('.ai-template-item')) {
            loadAITemplates();
        }

        // Initialize event listeners if not already done
        if (!window.aiGeneratorInitialized) {
            setupAIGeneratorEventListeners();
            window.aiGeneratorInitialized = true;
        }
    }

    // Make initializeAIGeneratorSidebar globally accessible
    window.initializeAIGeneratorSidebar = initializeAIGeneratorSidebar;

    // Load AI templates
    async function loadAITemplates() {
        const aiTemplateGrid = document.getElementById('aiTemplateGrid');
        if (!aiTemplateGrid) return;

        try {
            const response = await fetch('/api/templates');
            if (!response.ok) {
                throw new Error('Failed to load templates');
            }
            const templates = await response.json();

            if (templates.length === 0) {
                aiTemplateGrid.innerHTML = '<div class="empty-message">No templates available</div>';
                return;
            }

            aiTemplateGrid.innerHTML = templates.map(template => {
                const hasThumbnail = template.thumbnailUrl && template.thumbnailUrl.trim() !== '';
                return `
                    <div class="template-item ai-template-item" data-template-id="${template._id}" onclick="selectAITemplate(this)">
                        ${hasThumbnail ?
                            `<img src="${template.thumbnailUrl}" alt="${template.name}" class="template-preview">` :
                            `<div class="template-preview" style="background: #f3f4f6; display: flex; align-items: center; justify-content: center; color: #6b7280; font-size: 0.7rem;">No Preview</div>`
                        }
                        <p class="template-name">${template.name}</p>
                    </div>
                `;
            }).join('');

            // Initialize custom scrollbar
            initializeAICustomScrollbar();

        } catch (error) {
            console.error('Error loading AI templates:', error);
            if (aiTemplateGrid) {
                aiTemplateGrid.innerHTML = '<div class="error-message">Error loading templates</div>';
            }
        }
    }

    // Initialize custom scrollbar for AI templates
    function initializeAICustomScrollbar() {
        const aiTemplateGrid = document.getElementById('aiTemplateGrid');
        const aiCustomScrollbar = document.getElementById('aiCustomScrollbar');
        const aiCustomScrollbarThumb = document.getElementById('aiCustomScrollbarThumb');

        if (!aiTemplateGrid || !aiCustomScrollbar || !aiCustomScrollbarThumb) {
            return;
        }

        function updateScrollbar() {
            const scrollHeight = aiTemplateGrid.scrollHeight;
            const clientHeight = aiTemplateGrid.clientHeight;
            const scrollTop = aiTemplateGrid.scrollTop;

            if (scrollHeight <= clientHeight) {
                aiCustomScrollbar.classList.add('hidden');
                return;
            }

            aiCustomScrollbar.classList.remove('hidden');
            const thumbHeight = Math.max(20, (clientHeight / scrollHeight) * clientHeight);
            const thumbTop = (scrollTop / (scrollHeight - clientHeight)) * (clientHeight - thumbHeight);

            aiCustomScrollbarThumb.style.height = thumbHeight + 'px';
            aiCustomScrollbarThumb.style.top = thumbTop + 'px';
        }

        aiTemplateGrid.addEventListener('scroll', updateScrollbar);
        updateScrollbar();
    }

    // Setup AI Generator event listeners
    function setupAIGeneratorEventListeners() {
        const aiGenerateBtn = document.getElementById('aiGenerateBtn');
        const aiObjectInput = document.getElementById('aiObjectInput');
        const aiColorPaletteSelector = document.getElementById('aiColorPaletteSelector');

        let selectedTemplate = null;
        let selectedPalette = null;

        // Handle palette selection
        if (aiColorPaletteSelector) {
            aiColorPaletteSelector.addEventListener('paletteChange', (event) => {
                selectedPalette = event.detail.palette;
                console.log('[AIGenerator] 🎨 Palette selected:', {
                    id: selectedPalette?.id,
                    name: selectedPalette?.name,
                    description: selectedPalette?.description,
                    fullObject: selectedPalette
                });
            });
        }

        // Handle generate button click
        if (aiGenerateBtn) {
            aiGenerateBtn.addEventListener('click', async () => {
                const objectText = aiObjectInput?.value?.trim();

                if (!objectText) {
                    if (window.showToast) {
                        window.showToast('Please enter an object to generate', 'warning');
                    } else {
                        alert('Please enter an object to generate');
                    }
                    return;
                }

                try {
                    // Set generation in progress flag to block sidebar closing
                    window.isGenerationInProgress = true;
                    console.log('🎯 Generation started - blocking sidebar closing');

                    // Show loading state
                    const aiLoadingContainer = document.getElementById('aiLoadingContainer');
                    if (aiLoadingContainer) {
                        aiLoadingContainer.style.display = 'block';
                    }
                    aiGenerateBtn.disabled = true;
                    aiGenerateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';

                    // Get selected template
                    const selectedTemplateElement = document.querySelector('.ai-template-item.selected');
                    selectedTemplate = selectedTemplateElement ? selectedTemplateElement.dataset.templateId : null;

                    // If in Restyle mode, handle text replacement and admin fields BEFORE generation
                    if (window.isRestyleMode) {
                        console.log('🎨 Restyle mode: Processing text replacement and admin fields BEFORE generation');

                        // Check if "Replace All Texts" is enabled
                        const replaceAllTextsCheckbox = document.getElementById('replaceAllTextsCheckboxform');
                        const shouldReplaceTexts = replaceAllTextsCheckbox?.checked || false;

                        if (shouldReplaceTexts) {
                            console.log('🎨 Restyle mode: Replacing all texts before image generation');

                            // Get selected tone from AI Generator sidebar
                            const aiTextToneSelect = document.getElementById('aiTextToneSelect');
                            const selectedTone = aiTextToneSelect?.value || 'Generic';

                            // Get object context from Admin tab (original object for restyle)
                            const adminOriginalObject = document.getElementById('adminOriginalObject');
                            const objectContext = adminOriginalObject?.value?.trim() || 'general design';

                            console.log('🎨 Restyle text replacement parameters:', {
                                tone: selectedTone,
                                objectContext: objectContext,
                                objectSource: 'Admin tab (adminOriginalObject)',
                                replaceAllTexts: shouldReplaceTexts
                            });

                            // Replace all texts using the existing function from design-editor.html
                            if (window.replaceAllCanvasTexts) {
                                await window.replaceAllCanvasTexts(selectedTone, objectContext);
                                console.log('🎨 Text replacement completed successfully');
                            } else {
                                console.error('🎨 replaceAllCanvasTexts function not available');
                            }
                        }

                        // Update admin fields AFTER text replacement
                        await updateAdminFieldsBeforeRestyle(selectedTemplate, selectedPalette, objectText);
                    }

                    // If in Replace mode, handle text replacement and admin fields BEFORE generation
                    if (window.isReplaceMode) {
                        console.log('🔄 Replace mode: Processing text replacement and admin fields BEFORE generation');

                        // Check if "Replace All Texts" is enabled
                        const replaceAllTextsCheckbox = document.getElementById('replaceAllTextsCheckboxform');
                        const shouldReplaceTexts = replaceAllTextsCheckbox?.checked || false;

                        if (shouldReplaceTexts) {
                            console.log('🔄 Replace mode: Replacing all texts before image generation');

                            // Get selected tone from object tone dropdown (same tone for both image and text)
                            const aiToneSelect = document.getElementById('aiToneSelect');
                            const selectedTone = aiToneSelect?.value || 'Generic';

                            // Get object context from sidebar input (user's new object input)
                            const aiObjectInput = document.getElementById('aiObjectInput');
                            const objectContext = aiObjectInput?.value?.trim() || 'general design';

                            console.log('🔄 Replace text replacement parameters:', {
                                tone: selectedTone,
                                objectContext: objectContext,
                                objectSource: 'Sidebar input (aiObjectInput)',
                                toneSource: 'Object tone dropdown (aiToneSelect)',
                                replaceAllTexts: shouldReplaceTexts
                            });

                            // Replace all texts using the existing function from design-editor.html
                            if (window.replaceAllCanvasTexts) {
                                await window.replaceAllCanvasTexts(selectedTone, objectContext);
                                console.log('🔄 Text replacement completed successfully');
                            } else {
                                console.error('🔄 replaceAllCanvasTexts function not available');
                            }
                        }

                        // Update admin fields AFTER text replacement
                        await updateAdminFieldsBeforeReplace(selectedTemplate, selectedPalette, objectText);
                    }

                    // Check if "Include Texts and Shapes" checkbox is checked and apply palette colors BEFORE generation
                    const includeTextsCheckbox = document.getElementById('includeTextsCheckbox');
                    if (includeTextsCheckbox && includeTextsCheckbox.checked && selectedPalette) {
                        console.log('🎨 Include Texts and Shapes checked: Applying palette colors to texts and shapes BEFORE generation');
                        await applyPaletteColorsToTexts(selectedPalette.id);
                    }

                    // Generate image
                    const generationResult = await generateAIImage(objectText, selectedTemplate, selectedPalette);

                    if (generationResult) {
                        // Store the original generation result (before background removal) for admin field updates
                        const originalGenerationResult = { ...generationResult };

                        // Update loading message for background removal
                        aiGenerateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Removing Background...';

                        if (window.showToast) {
                            window.showToast('Image generated! Removing background...', 'info');
                        }

                        // Automatically remove background before adding to canvas
                        const finalImageUrl = await removeBackgroundFromGeneration(generationResult.imageUrl, generationResult.generationId);

                        // Check if we're in Restyle mode
                        if (window.isRestyleMode) {
                            // Replace the currently selected image instead of adding new one
                            await replaceSelectedImageWithGenerated(finalImageUrl);

                            // Update admin image URL with the final image (after background removal)
                            const adminImageUrl = document.getElementById('adminImageUrl');
                            if (adminImageUrl) {
                                adminImageUrl.value = finalImageUrl;
                                console.log('🎨 Updated adminImageUrl with final image:', finalImageUrl);
                            }

                            // Admin fields were already updated BEFORE generation
                            console.log('🎨 Restyle completed - admin fields were updated before generation');

                            if (window.showToast) {
                                window.showToast('Image restyled successfully!', 'success');
                            }
                        } else if (window.isReplaceMode) {
                            // Replace mode: Replace the currently selected image with completely new content
                            await replaceSelectedImageWithGenerated(finalImageUrl);

                            // Update admin image URL with the final image (after background removal)
                            const adminImageUrl = document.getElementById('adminImageUrl');
                            if (adminImageUrl) {
                                adminImageUrl.value = finalImageUrl;
                                console.log('🔄 Updated adminImageUrl with final image:', finalImageUrl);
                            }

                            // Admin fields were already updated BEFORE generation
                            console.log('🔄 Replace completed - admin fields were updated before generation');

                            if (window.showToast) {
                                window.showToast('Image replaced successfully!', 'success');
                            }
                        } else {
                            // Normal mode: Add image to canvas with background removed
                            await addGeneratedImageToCanvas(finalImageUrl);

                            if (window.showToast) {
                                window.showToast('Image generated and added to canvas!', 'success');
                            }
                        }

                        // Close the sidebar after successful generation
                        closeAllSidebars();
                    }

                } catch (error) {
                    console.error('Error generating image:', error);
                    if (window.showToast) {
                        window.showToast('Failed to generate image. Please try again.', 'error');
                    } else {
                        alert('Failed to generate image. Please try again.');
                    }
                } finally {
                    // Clear generation in progress flag to allow sidebar closing
                    window.isGenerationInProgress = false;
                    console.log('🎯 Generation completed - allowing sidebar closing');

                    // Clear target image reference after generation
                    window.targetImageIndexForReplacement = undefined;
                    console.log('🎯 Cleared target image reference');

                    // Hide loading state
                    const aiLoadingContainer = document.getElementById('aiLoadingContainer');
                    if (aiLoadingContainer) {
                        aiLoadingContainer.style.display = 'none';
                    }
                    aiGenerateBtn.disabled = false;
                    aiGenerateBtn.innerHTML = '<i class="fas fa-magic"></i> Generate Image';
                }
            });
        }
    }

    // Save Project functionality - EXACT COPY of Save Template logic
    async function handleSaveProject() {
        console.log('[SaveProject] 🚀 EXACT TEMPLATE COPY - Starting save process...');
        console.log('[SaveProject] 🔍 DEBUG - Current window.artboard:', window.artboard);
        console.log('[SaveProject] 🔍 DEBUG - typeof window.artboard:', typeof window.artboard);
        console.log('[SaveProject] 🔍 DEBUG - window.artboard === null:', window.artboard === null);
        console.log('[SaveProject] 🔍 DEBUG - window.artboard === undefined:', window.artboard === undefined);
        console.log('[SaveProject] 🔍 DEBUG - !window.artboard:', !window.artboard);
        console.log('[SaveProject] 🔍 DEBUG - window.canvasBackgroundColor:', window.canvasBackgroundColor);
        console.log('[SaveProject] 🔍 DEBUG - window.scale:', window.scale);
        console.log('[SaveProject] 🔍 DEBUG - window.offsetX:', window.offsetX);
        console.log('[SaveProject] 🔍 DEBUG - window.offsetY:', window.offsetY);
        console.log('[SaveProject] 🔍 DEBUG - window.canvasObjects length:', window.canvasObjects?.length);

        // DEBUG: Log all current canvas objects
        console.log('[SaveProject] 🔍 DEBUG - Current canvas objects:');
        window.canvasObjects.forEach((obj, index) => {
            console.log(`[SaveProject] 🔍 DEBUG - Object ${index}:`, {
                type: obj.type,
                id: obj.id,
                text: obj.text || obj.imageUrl,
                svgColor: obj.svgColor,
                x: obj.x,
                y: obj.y,
                width: obj.width,
                height: obj.height,
                scale: obj.scale,
                originalWidth: obj.originalWidth,
                originalHeight: obj.originalHeight,
                imageUrl: obj.imageUrl
            });
        });

        // Check if artboard exists (same as template)
        if (!window.artboard) {
            console.log('[SaveProject] ❌ No artboard found - showing error message');
            const msg = 'Cannot save project without an Artboard defined.';
            if (window.showToast) window.showToast(msg, 'warning');
            else alert(msg);
            return;
        }

        console.log('[SaveProject] ✅ Artboard found, proceeding with save...');
        console.log('[SaveProject] 🔍 Artboard details:', window.artboard);
        console.log('[SaveProject] 🔍 Artboard.x:', window.artboard.x);
        console.log('[SaveProject] 🔍 Artboard.y:', window.artboard.y);
        console.log('[SaveProject] 🔍 Artboard.width:', window.artboard.width);
        console.log('[SaveProject] 🔍 Artboard.height:', window.artboard.height);

        // 1. Get Admin Data (same as template)
        const adminData = {
            imageUrl: document.getElementById('adminImageUrl')?.value || '',
            model: document.getElementById('adminModel')?.value || '',
            prompt: document.getElementById('adminPrompt')?.value || '',
            palette: document.getElementById('adminPalette')?.value || '',
            // 🎯 ADD: Capture original palette and object for regeneration
            originalPalette: document.getElementById('adminOriginalPalette')?.value || '',
            originalObject: document.getElementById('adminOriginalObject')?.value || '',
            fontStylesList: window.fontStylesList || [], // Added for Font Styles functionality
            decorStylesList: window.decorStylesList || [], // Added for Decor Styles functionality
            cssFilterState: window.cssFilterState || {} // Added for CSS Filters functionality
            // Note: duotoneState and glitchState will be added later after capture
        };

        // 🔍 DEBUG: Log font/decor styles being saved
        console.log('[SaveProject] 🎨 ===== FONT/DECOR STYLES SAVE DEBUG =====');
        console.log('[SaveProject] 🎨 window.fontStylesList:', window.fontStylesList);
        console.log('[SaveProject] 🎨 window.fontStylesList type:', typeof window.fontStylesList);
        console.log('[SaveProject] 🎨 window.fontStylesList isArray:', Array.isArray(window.fontStylesList));
        console.log('[SaveProject] 🎨 window.fontStylesList length:', window.fontStylesList?.length);
        console.log('[SaveProject] 🎨 window.fontStylesList content:', JSON.stringify(window.fontStylesList, null, 2));
        console.log('[SaveProject] 🎨 window.decorStylesList:', window.decorStylesList);
        console.log('[SaveProject] 🎨 window.decorStylesList type:', typeof window.decorStylesList);
        console.log('[SaveProject] 🎨 window.decorStylesList isArray:', Array.isArray(window.decorStylesList));
        console.log('[SaveProject] 🎨 window.decorStylesList length:', window.decorStylesList?.length);
        console.log('[SaveProject] 🎨 window.decorStylesList content:', JSON.stringify(window.decorStylesList, null, 2));
        console.log('[SaveProject] 🎨 adminData.fontStylesList:', adminData.fontStylesList);
        console.log('[SaveProject] 🎨 adminData.decorStylesList:', adminData.decorStylesList);

        // 🔍 DEBUG: Log CSS filter state being saved
        console.log('[SaveProject] 🎨 ===== CSS FILTER STATE SAVE DEBUG =====');
        console.log('[SaveProject] 🎨 window.cssFilterState:', window.cssFilterState);
        console.log('[SaveProject] 🎨 window.cssFilterState type:', typeof window.cssFilterState);
        console.log('[SaveProject] 🎨 window.cssFilterState keys:', window.cssFilterState ? Object.keys(window.cssFilterState) : 'no keys');
        console.log('[SaveProject] 🎨 window.cssFilterState content:', JSON.stringify(window.cssFilterState, null, 2));
        console.log('[SaveProject] 🎨 adminData.cssFilterState:', adminData.cssFilterState);



        console.log('[SaveProject] 🎯 Captured admin data with original fields:', {
            originalPalette: adminData.originalPalette,
            originalObject: adminData.originalObject
        });

        // 2. Generate Preview Image (ARTBOARD ONLY - as it should be)
        let previewDataUrl;
        try {
            console.log('[SaveProject] Generating preview image...');
            console.log('[SaveProject] Artboard bounds:', window.artboard);
            if (window.showToast) window.showToast('Generating preview...', 'info');

            // Wait for all images to be fully loaded before capturing preview
            console.log('[SaveProject] Checking image loading status...');
            const imageObjects = window.canvasObjects ? window.canvasObjects.filter(obj => obj.type === 'image') : [];
            console.log('[SaveProject] Found', imageObjects.length, 'image objects');

            // Check if any images are still loading
            const unloadedImages = imageObjects.filter(obj => {
                // Skip data URLs - they're already loaded
                if (obj.imageUrl && obj.imageUrl.startsWith('data:')) {
                    console.log('[SaveProject] Skipping data URL image (already loaded):', obj.id);
                    return false;
                }

                if (!obj.image) {
                    console.log('[SaveProject] Image object missing image element:', obj.id, obj.imageUrl);
                    return true;
                }
                if (!obj.image.complete) {
                    console.log('[SaveProject] Image not complete:', obj.id, obj.imageUrl);
                    return true;
                }
                if (obj.image.naturalWidth === 0) {
                    console.log('[SaveProject] Image has no natural width:', obj.id, obj.imageUrl);
                    return true;
                }
                console.log('[SaveProject] Image is loaded:', obj.id, obj.imageUrl);
                return false;
            });

            if (unloadedImages.length > 0) {
                console.log('[SaveProject] Waiting for', unloadedImages.length, 'images to load...');
                if (window.showToast) window.showToast(`Waiting for ${unloadedImages.length} images to load...`, 'info');

                // Wait for all images to load (with timeout)
                const imageLoadPromises = unloadedImages.map(obj => {
                    return new Promise((resolve) => {
                        if (obj.image) {
                            const img = obj.image;
                            if (img.complete && img.naturalWidth > 0) {
                                resolve();
                            } else {
                                const onLoad = () => {
                                    console.log('[SaveProject] Image loaded:', obj.id);
                                    img.removeEventListener('load', onLoad);
                                    img.removeEventListener('error', onError);
                                    resolve();
                                };
                                const onError = () => {
                                    console.log('[SaveProject] Image failed to load:', obj.id, obj.imageUrl);
                                    img.removeEventListener('load', onLoad);
                                    img.removeEventListener('error', onError);
                                    resolve(); // Continue even if image fails
                                };
                                img.addEventListener('load', onLoad);
                                img.addEventListener('error', onError);

                                // Timeout after 5 seconds
                                setTimeout(() => {
                                    console.log('[SaveProject] Image load timeout:', obj.id);
                                    img.removeEventListener('load', onLoad);
                                    img.removeEventListener('error', onError);
                                    resolve();
                                }, 5000);
                            }
                        } else {
                            resolve();
                        }
                    });
                });

                await Promise.all(imageLoadPromises);
                console.log('[SaveProject] All images loaded or timed out');
            } else {
                console.log('[SaveProject] All images already loaded');
            }

            // Force a canvas redraw to ensure all loaded images and effects are rendered
            console.log('[SaveProject] Forcing canvas redraw with effects...');

            // 🎯 EFFECTS NO LONGER NEEDED: Individual object drawing handles effects automatically
            console.log('[SaveProject] 🎨 Skipping effect application - individual object drawing handles effects...');

            // 🎯 NO CANVAS UPDATE NEEDED: Individual object drawing doesn't rely on main canvas
            console.log('[SaveProject] 🎨 Skipping canvas update - using direct object drawing...');

            // Create export canvas for preview - ONLY artboard size
            const exportCanvas = document.createElement('canvas');
            exportCanvas.width = window.artboard.width;
            exportCanvas.height = window.artboard.height;
            const exportCtx = exportCanvas.getContext('2d');

            console.log('[SaveProject] Export canvas size:', exportCanvas.width, 'x', exportCanvas.height);

            // 🎯 CRITICAL FIX: Use same approach as template save - draw objects individually
            console.log('[SaveProject] 🎭 Using template save approach - drawing objects individually...');

            // Fill with background color first
            exportCtx.fillStyle = window.canvasBackgroundColor || '#ffffff';
            exportCtx.fillRect(0, 0, window.artboard.width, window.artboard.height);

            exportCtx.save();
            // Translate context so drawing happens relative to artboard's top-left
            exportCtx.translate(-window.artboard.x, -window.artboard.y);

            // Draw objects individually (same as template save) - with async support for unified pipeline
            for (const obj of window.canvasObjects) {
                // Check if object is within artboard bounds
                const bounds = window.calculateObjectBounds ? window.calculateObjectBounds(obj) : {
                    x: obj.x || 0,
                    y: obj.y || 0,
                    width: obj.width || 100,
                    height: obj.height || 50
                };

                if (bounds.x + bounds.width > window.artboard.x && bounds.x < window.artboard.x + window.artboard.width &&
                    bounds.y + bounds.height > window.artboard.y && bounds.y < window.artboard.y + window.artboard.height) {

                    // Skip drawing mask shapes that are being used as masks (they should be invisible)
                    if (obj.type === 'image' && obj.isMaskShape && obj.isVisible === false) {
                        console.log('[SaveProject] 🎭 Skipping drawing of mask shape:', obj.id);
                        continue; // Skip this object
                    }

                    // Draw objects using the same functions as template save
                    if (obj.type === 'text' && window.drawTextObject) {
                        console.log('[SaveProject] 🎨 Drawing text object:', obj.text);
                        window.drawTextObject(obj, exportCtx);
                    } else if (obj.type === 'image' && window.drawImageObject) {
                        console.log('[SaveProject] 🎨 Drawing image object with UNIFIED effects pipeline');
                        await window.drawImageObject(obj, exportCtx);
                    }
                }
            }

            exportCtx.restore();
            console.log('[SaveProject] 🎭 Individual object drawing completed');

            // Convert to data URL
            previewDataUrl = exportCanvas.toDataURL('image/png');
            console.log('[SaveProject] Preview image generated, length:', previewDataUrl.length);
            console.log('[SaveProject] Preview data URL preview:', previewDataUrl.substring(0, 100) + '...');

            // Debug: Create a temporary image to verify the preview content
            const debugImg = new Image();
            debugImg.onload = () => {
                console.log('[SaveProject] 🔍 Preview debug - Image loaded successfully');
                console.log('[SaveProject] 🔍 Preview debug - Image dimensions:', debugImg.width, 'x', debugImg.height);

                // Create a small canvas to check if the image has content
                const debugCanvas = document.createElement('canvas');
                debugCanvas.width = 50;
                debugCanvas.height = 50;
                const debugCtx = debugCanvas.getContext('2d');
                debugCtx.drawImage(debugImg, 0, 0, 50, 50);
                const imageData = debugCtx.getImageData(0, 0, 50, 50);
                const pixels = imageData.data;

                // Check if image has non-white pixels (indicating content)
                let hasContent = false;
                let colorSample = [];
                for (let i = 0; i < pixels.length; i += 4) {
                    const r = pixels[i];
                    const g = pixels[i + 1];
                    const b = pixels[i + 2];
                    const a = pixels[i + 3];

                    // Sample first few pixels for debugging
                    if (colorSample.length < 5) {
                        colorSample.push(`rgba(${r},${g},${b},${a})`);
                    }

                    // Check for non-white, non-transparent pixels
                    if (a > 0 && (r !== 255 || g !== 255 || b !== 255)) {
                        hasContent = true;
                    }
                }
                console.log('[SaveProject] 🔍 Preview debug - Has non-white content:', hasContent);
                console.log('[SaveProject] 🔍 Preview debug - Color sample:', colorSample);

                if (!hasContent) {
                    console.warn('[SaveProject] ⚠️ Preview appears to be all white! This may indicate a rendering issue.');
                }
            };
            debugImg.onerror = () => {
                console.error('[SaveProject] 🔍 Preview debug - Failed to load preview image');
            };
            debugImg.src = previewDataUrl;
        } catch (error) {
            console.error('[SaveProject] Error generating preview:', error);
            const msg = `Error generating preview: ${error.message}`;
            if (window.showToast) window.showToast(msg, 'error');
            else alert(msg);
            return;
        }

        // 3. Upload Preview Image (same as template)
        let previewImageUrl;
        try {
            console.log('[SaveProject] Uploading preview image...');
            console.log('[SaveProject] Preview data URL length:', previewDataUrl.length);
            if (window.showToast) window.showToast('Uploading preview...', 'info');

            const blob = await (await fetch(previewDataUrl)).blob();
            console.log('[SaveProject] Blob created, size:', blob.size, 'type:', blob.type);
            const formData = new FormData();
            formData.append('image', blob, 'project_preview.png');
            console.log('[SaveProject] FormData created, sending request to /api/images/upload');

            const response = await fetch('/api/images/upload', {
                method: 'POST',
                body: formData
            });

            console.log('[SaveProject] Upload response status:', response.status);
            console.log('[SaveProject] Upload response headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[SaveProject] Upload failed with status:', response.status);
                console.error('[SaveProject] Upload failed with response:', errorText);
                console.error('[SaveProject] Upload failed with headers:', Object.fromEntries(response.headers.entries()));
                throw new Error(`Preview upload failed: ${response.statusText} - ${errorText}`);
            }

            const uploadResult = await response.json();
            console.log('[SaveProject] 🔍 Upload response structure:', uploadResult);
            console.log('[SaveProject] 🔍 Available fields:', Object.keys(uploadResult));

            // Try different possible field names for the URL
            previewImageUrl = uploadResult.url || uploadResult.imageUrl || uploadResult.path || uploadResult.src;
            console.log('[SaveProject] Preview uploaded successfully:', previewImageUrl);

        } catch (e) {
            console.error('[SaveProject] Error uploading preview image:', e);
            const msg = `Error uploading preview image: ${e.message}`;
            if (window.showToast) window.showToast(msg, 'error');
            else alert(msg);
            return;
        }

        // 4. Prepare Canvas Objects Data (EXACT same as template)
        console.log('[SaveProject] ===== SAVING LAYER ORDER DEBUG =====');
        console.log('[SaveProject] Current canvasObjects array length:', window.canvasObjects.length);

        // 🎭 CRITICAL FIX: Remove duplicate objects before saving (SAME AS TEMPLATE)
        console.log('[SaveProject] 🎭 DUPLICATE CHECK - Checking for duplicate objects...');
        const uniqueObjects = [];
        const seenIds = new Set();

        window.canvasObjects.forEach((obj, index) => {
            console.log(`[SaveProject] Object ${index}: type=${obj.type}, text="${obj.text || obj.imageUrl || 'N/A'}", id=${obj.id}, isMasked=${obj.isMasked || false}, isMaskShape=${obj.isMaskShape || false}`);

            // Check for duplicates by ID and type
            const objectKey = `${obj.id}-${obj.type}-${obj.imageUrl}`;
            if (!seenIds.has(objectKey)) {
                seenIds.add(objectKey);
                uniqueObjects.push(obj);
                console.log(`[SaveProject] 🎭 ✅ Object ${index} added (unique)`);
            } else {
                console.warn(`[SaveProject] 🎭 ⚠️ Object ${index} is duplicate, skipping:`, {
                    id: obj.id,
                    type: obj.type,
                    imageUrl: obj.imageUrl?.substring(0, 50) + '...'
                });
            }
        });

        console.log(`[SaveProject] 🎭 DUPLICATE CHECK COMPLETE: ${window.canvasObjects.length} -> ${uniqueObjects.length} objects`);

        // Use unique objects for serialization
        const objectsToSerialize = uniqueObjects;

        const serializableObjects = objectsToSerialize.map((obj, index) => {
            const cleanObj = window.cleanObjectForSerialization(obj);
            cleanObj.layerOrder = index;
            cleanObj.zIndex = index;

            // 🎭 Enhanced mask debugging for Save Project
            if (obj.isMasked || obj.isMaskShape) {
                console.log(`[SaveProject] 🎭 MASK OBJECT ${index}:`, {
                    type: obj.type,
                    id: obj.id,
                    isMasked: obj.isMasked,
                    maskShapeId: obj.maskShapeId,
                    isMaskShape: obj.isMaskShape,
                    isVisible: obj.isVisible,
                    imageUrl: obj.imageUrl?.substring(0, 50) + '...'
                });
                console.log(`[SaveProject] 🎭 CLEANED MASK OBJECT ${index}:`, {
                    type: cleanObj.type,
                    id: cleanObj.id,
                    isMasked: cleanObj.isMasked,
                    maskShapeId: cleanObj.maskShapeId,
                    isMaskShape: cleanObj.isMaskShape,
                    isVisible: cleanObj.isVisible,
                    imageUrl: cleanObj.imageUrl?.substring(0, 50) + '...'
                });
            }

            console.log(`[SaveProject] Saving object ${index}: type=${obj.type}, text="${obj.text || obj.imageUrl || 'N/A'}", layerOrder=${index}, zIndex=${index}, isMasked=${obj.isMasked || false}`);
            return cleanObj;
        });

        console.log('[SaveProject] ===== SERIALIZABLE OBJECTS =====');
        serializableObjects.forEach((obj, index) => {
            console.log(`[SaveProject] Serialized ${index}: type=${obj.type}, text="${obj.text || obj.imageUrl || 'N/A'}", layerOrder=${obj.layerOrder}, zIndex=${obj.zIndex}, isMasked=${obj.isMasked || false}`);
        });

        // 🎭 FINAL VERIFICATION: Check masking properties in final data (SAME AS TEMPLATE)
        const finalMaskedImages = serializableObjects.filter(obj => obj.isMasked);
        const finalMaskShapes = serializableObjects.filter(obj => obj.isMaskShape);
        console.log('[SaveProject] 🎭 FINAL VERIFICATION - Masked images in final data:', finalMaskedImages.length);
        console.log('[SaveProject] 🎭 FINAL VERIFICATION - Mask shapes in final data:', finalMaskShapes.length);
        finalMaskedImages.forEach((img, index) => {
            console.log(`[SaveProject] 🎭 FINAL MASKED IMAGE ${index + 1}:`, {
                id: img.id,
                isMasked: img.isMasked,
                maskShapeId: img.maskShapeId,
                imageUrl: img.imageUrl?.substring(0, 50) + '...'
            });
        });
        finalMaskShapes.forEach((shape, index) => {
            console.log(`[SaveProject] 🎭 FINAL MASK SHAPE ${index + 1}:`, {
                id: shape.id,
                isMaskShape: shape.isMaskShape,
                isVisible: shape.isVisible,
                imageUrl: shape.imageUrl?.substring(0, 50) + '...'
            });
        });

        // 5. Prepare Editor State (EXACT same as template)
        const editorState = {
            canvasBackgroundColor: window.canvasBackgroundColor || '#ffffff',
            zoom: {
                scale: window.scale || 1.0,
                offsetX: window.offsetX || 0,
                offsetY: window.offsetY || 0
            },
            selectedObjectIndex: window.selectedObjectIndex || -1,
            nextId: window.nextId || 0,
            editorSettings: {
                lastUpdateTimestamp: Date.now()
            }
        };

        console.log('[SaveProject] ===== EDITOR STATE DEBUG =====');
        console.log('[SaveProject] window.canvasBackgroundColor:', window.canvasBackgroundColor);
        console.log('[SaveProject] window.scale:', window.scale);
        console.log('[SaveProject] window.offsetX:', window.offsetX);
        console.log('[SaveProject] window.offsetY:', window.offsetY);
        console.log('[SaveProject] Final editorState:', editorState);

        // 6. Validate and prepare artboard data
        const validatedArtboard = {
            x: typeof window.artboard.x === 'number' ? window.artboard.x : 0,
            y: typeof window.artboard.y === 'number' ? window.artboard.y : 0,
            width: typeof window.artboard.width === 'number' ? window.artboard.width : 600,
            height: typeof window.artboard.height === 'number' ? window.artboard.height : 600
        };

        console.log('[SaveProject] 🔍 Validated artboard:', validatedArtboard);

        // 7. Capture duotone, glitch, and halftone effect states (same as template pattern)
        console.log('[SaveProject] 🎨 ===== CAPTURING DUOTONE, GLITCH, AND HALFTONE STATES =====');

        let duotoneState = {};
        let glitchState = {};
        let halftoneState = {};

        // Capture duotone state using existing function
        if (typeof window.captureDuotoneState === 'function') {
            duotoneState = window.captureDuotoneState();
            console.log('[SaveProject] 🎨 Captured duotone state:', duotoneState);
        } else {
            console.log('[SaveProject] 🎨 ⚠️ captureDuotoneState function not available');
        }

        // Capture glitch state using existing function
        if (typeof window.captureGlitchState === 'function') {
            glitchState = window.captureGlitchState();
            console.log('[SaveProject] 🎨 Captured glitch state:', glitchState);
        } else {
            console.log('[SaveProject] 🎨 ⚠️ captureGlitchState function not available');
        }

        // Capture halftone state using existing function
        if (typeof window.captureHalftoneState === 'function') {
            halftoneState = window.captureHalftoneState();
            console.log('[SaveProject] 🎨 Captured halftone state:', halftoneState);
        } else {
            console.log('[SaveProject] 🎨 ⚠️ captureHalftoneState function not available');
        }

        // Add duotone, glitch, and halftone states to adminData after capture
        adminData.duotoneState = duotoneState;
        adminData.glitchState = glitchState;
        adminData.halftoneState = halftoneState;

        // 🔍 DEBUG: Log duotone, glitch, and halftone states being saved
        console.log('[SaveProject] 🎨 ===== DUOTONE, GLITCH, AND HALFTONE STATES SAVE DEBUG =====');
        console.log('[SaveProject] 🎨 duotoneState:', duotoneState);
        console.log('[SaveProject] 🎨 duotoneState type:', typeof duotoneState);
        console.log('[SaveProject] 🎨 duotoneState keys:', duotoneState ? Object.keys(duotoneState) : 'no keys');
        console.log('[SaveProject] 🎨 duotoneState content:', JSON.stringify(duotoneState, null, 2));
        console.log('[SaveProject] 🎨 glitchState:', glitchState);
        console.log('[SaveProject] 🎨 glitchState type:', typeof glitchState);
        console.log('[SaveProject] 🎨 glitchState keys:', glitchState ? Object.keys(glitchState) : 'no keys');
        console.log('[SaveProject] 🎨 glitchState content:', JSON.stringify(glitchState, null, 2));
        console.log('[SaveProject] 🎨 halftoneState:', halftoneState);
        console.log('[SaveProject] 🎨 halftoneState type:', typeof halftoneState);
        console.log('[SaveProject] 🎨 halftoneState keys:', halftoneState ? Object.keys(halftoneState) : 'no keys');
        console.log('[SaveProject] 🎨 halftoneState content:', JSON.stringify(halftoneState, null, 2));
        console.log('[SaveProject] 🎨 adminData.duotoneState:', adminData.duotoneState);
        console.log('[SaveProject] 🎨 adminData.glitchState:', adminData.glitchState);
        console.log('[SaveProject] 🎨 adminData.halftoneState:', adminData.halftoneState);

        // 8. Capture Guidelines State (same as template)
        const guidelinesState = captureGuidelinesState();

        // 9. Capture Layout Rectangles State (same as template)
        const layoutRectanglesState = captureLayoutRectanglesState();

        // 10. Prepare Project Data (matching server schema and template pattern)
        const projectData = {
            title: 'My Project', // Server expects 'title', not 'name'
            description: '', // Add description field
            previewImageUrl,
            artboard: validatedArtboard, // Validated artboard with required properties
            canvasObjects: serializableObjects,
            adminData,
            editorState,
            tags: [], // Add tags field
            status: 'draft', // Add status field
            // 🎯 ADD: Store font/decor styles at top-level (same as template pattern)
            fontStylesList: window.fontStylesList || [],
            decorStylesList: window.decorStylesList || [],
            // 🎯 ADD: Store CSS filter state (same as template pattern)
            cssFilterState: window.cssFilterState || {},
            // 🎯 ADD: Store duotone, glitch, and halftone effect states (same as template pattern)
            duotoneState: duotoneState,
            glitchState,
            halftoneState: halftoneState,
            // 🎯 ADD: Store guidelines and layout rectangles state (same as template pattern)
            guidelinesState: guidelinesState,
            layoutRectanglesState: layoutRectanglesState
        };

        // 🔍 DEBUG: Log final project data font/decor styles
        console.log('[SaveProject] 🎨 ===== FINAL PROJECT DATA FONT/DECOR STYLES =====');
        console.log('[SaveProject] 🎨 projectData.fontStylesList:', projectData.fontStylesList);
        console.log('[SaveProject] 🎨 projectData.fontStylesList content:', JSON.stringify(projectData.fontStylesList, null, 2));
        console.log('[SaveProject] 🎨 projectData.decorStylesList:', projectData.decorStylesList);
        console.log('[SaveProject] 🎨 projectData.decorStylesList content:', JSON.stringify(projectData.decorStylesList, null, 2));
        console.log('[SaveProject] 🎨 projectData.adminData.fontStylesList:', projectData.adminData.fontStylesList);
        console.log('[SaveProject] 🎨 projectData.adminData.fontStylesList content:', JSON.stringify(projectData.adminData.fontStylesList, null, 2));
        console.log('[SaveProject] 🎨 projectData.adminData.decorStylesList:', projectData.adminData.decorStylesList);
        console.log('[SaveProject] 🎨 projectData.adminData.decorStylesList content:', JSON.stringify(projectData.adminData.decorStylesList, null, 2));

        // 🔍 DEBUG: Log final project data CSS filter state
        console.log('[SaveProject] 🎨 ===== FINAL PROJECT DATA CSS FILTER STATE =====');
        console.log('[SaveProject] 🎨 projectData.cssFilterState:', projectData.cssFilterState);
        console.log('[SaveProject] 🎨 projectData.cssFilterState content:', JSON.stringify(projectData.cssFilterState, null, 2));
        console.log('[SaveProject] 🎨 projectData.adminData.cssFilterState:', projectData.adminData.cssFilterState);
        console.log('[SaveProject] 🎨 projectData.adminData.cssFilterState content:', JSON.stringify(projectData.adminData.cssFilterState, null, 2));

        console.log('[SaveProject] Final project data prepared:', projectData);

        // Dispatch save project event
        const saveProjectEvent = new CustomEvent('saveProject', {
            detail: projectData
        });

        document.dispatchEvent(saveProjectEvent);

        // Fallback: Try to directly access the modal if event doesn't work
        setTimeout(() => {
            const modal = document.querySelector('project-modal');
            if (modal && !modal.projectData) {
                console.log('[SaveProject] Fallback: Opening modal directly with project data');
                modal.show(projectData);
            }
        }, 100);
    }



    // Duplicate Project functionality
    function handleDuplicateProject() {
        try {
            // Check if we have canvas objects to duplicate
            if (!window.canvasObjects || window.canvasObjects.length === 0) {
                alert('No content to duplicate. Please add some text, images, or shapes first.');
                return;
            }

            // Create a copy of current canvas objects
            const duplicatedObjects = JSON.parse(JSON.stringify(window.canvasObjects));

            // Offset duplicated objects slightly
            duplicatedObjects.forEach(obj => {
                if (obj.x !== undefined) obj.x += 20;
                if (obj.y !== undefined) obj.y += 20;
                // Update IDs to avoid conflicts
                if (obj.id !== undefined) obj.id = window.nextId++;
            });

            // Add duplicated objects to canvas
            window.canvasObjects.push(...duplicatedObjects);

            // Update canvas
            if (window.update) {
                window.update();
            }

            alert('Content duplicated successfully!');

        } catch (error) {
            console.error('Error duplicating project:', error);
            alert('Failed to duplicate project. Please try again.');
        }
    }



    // Helper function to generate canvas-wide thumbnail when no artboard exists
    function generateCanvasThumbnail(editorState) {
        try {
            console.log('[generateCanvasThumbnail] Input editorState:', editorState);

            const canvasObjects = editorState.canvasObjects || [];

            if (canvasObjects.length === 0) {
                console.log('[generateCanvasThumbnail] No objects to render, creating placeholder');
                return createPlaceholderImage();
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

            console.log('[generateCanvasThumbnail] Content bounds:', { minX, minY, maxX, maxY, contentWidth, contentHeight });

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
            console.error('[generateCanvasThumbnail] Error generating canvas thumbnail:', error);
            return createPlaceholderImage();
        }
    }

    // Helper function to generate artboard thumbnail
    function generateArtboardThumbnail(editorState) {
        try {
            console.log('[generateArtboardThumbnail] Input editorState:', editorState);

            // Ensure artboard exists with fallback values
            const artboard = editorState.artboard || {
                x: 0,
                y: 0,
                width: 800,
                height: 600
            };

            console.log('[generateArtboardThumbnail] Using artboard:', artboard);

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
                } else if (obj.type === 'image') {
                    // Calculate actual scaled dimensions for image objects
                    const actualWidth = obj.originalWidth ? obj.originalWidth * obj.scale : objWidth;
                    const actualHeight = obj.originalHeight ? obj.originalHeight * obj.scale : objHeight;
                    const actualScaledWidth = actualWidth * scale;
                    const actualScaledHeight = actualHeight * scale;
                    const actualRelativeX = (objX - artboard.x) * scale;
                    const actualRelativeY = (objY - artboard.y) * scale;

                    // Check if image is loaded and draw it
                    if (obj.image && obj.image.complete && obj.image.naturalWidth > 0) {
                        ctx.drawImage(obj.image, actualRelativeX - actualScaledWidth/2, actualRelativeY - actualScaledHeight/2, actualScaledWidth, actualScaledHeight);
                    } else if (obj.imageUrl && obj.imageUrl.includes('.svg') && obj.svgColor) {
                        // SVG shape with color
                        ctx.fillStyle = obj.svgColor;
                        ctx.fillRect(actualRelativeX - actualScaledWidth/2, actualRelativeY - actualScaledHeight/2, actualScaledWidth, actualScaledHeight);
                    } else {
                        // Placeholder for unloaded images
                        ctx.fillStyle = '#e5e7eb';
                        ctx.fillRect(actualRelativeX - actualScaledWidth/2, actualRelativeY - actualScaledHeight/2, actualScaledWidth, actualScaledHeight);
                        ctx.strokeStyle = '#9ca3af';
                        ctx.strokeRect(actualRelativeX - actualScaledWidth/2, actualRelativeY - actualScaledHeight/2, actualScaledWidth, actualScaledHeight);

                        // Add image icon
                        ctx.fillStyle = '#6b7280';
                        ctx.font = `${Math.max(16, actualScaledWidth/4)}px Arial`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText('🖼️', actualRelativeX, actualRelativeY);
                    }
                } else if (obj.type === 'shape') {
                    // Render shape
                    ctx.fillStyle = obj.fill || obj.svgColor || '#3b82f6';
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
            console.error('[SaveProject] Error generating artboard thumbnail:', error);
            return createPlaceholderImage();
        }
    }

    // Helper function to create placeholder image
    function createPlaceholderImage() {
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
            console.error('[SaveProject] Error creating placeholder image:', error);
            // Return a minimal data URL as last resort
            return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
        }
    }

    // --- Project Save Button Management ---
    function updateProjectSaveButtons(hasProject, projectTitle) {
        console.log('[LeftMenu] Updating project save buttons, hasProject:', hasProject, 'title:', projectTitle);

        const saveProjectBtn = document.getElementById('saveProjectBtn');
        const updateProjectBtn = document.getElementById('updateProjectBtn');
        const saveAsProjectBtn = document.getElementById('saveAsProjectBtn');

        if (hasProject) {
            // Hide "Save Project" button
            if (saveProjectBtn) saveProjectBtn.style.display = 'none';

            // Show "Save" and "Save As New" buttons
            if (updateProjectBtn) {
                updateProjectBtn.style.display = 'block';
                updateProjectBtn.textContent = `Save "${projectTitle || 'Project'}"`;
            }
            if (saveAsProjectBtn) {
                saveAsProjectBtn.style.display = 'block';
            }

            console.log('[LeftMenu] Switched to existing project mode');
        } else {
            // Show "Save Project" button
            if (saveProjectBtn) saveProjectBtn.style.display = 'block';

            // Hide "Save" and "Save As New" buttons
            if (updateProjectBtn) updateProjectBtn.style.display = 'none';
            if (saveAsProjectBtn) saveAsProjectBtn.style.display = 'none';

            console.log('[LeftMenu] Switched to new project mode');
        }
    }

    // Listen for project loaded events
    document.addEventListener('projectLoaded', (event) => {
        console.log('[LeftMenu] Received projectLoaded event:', event.detail);
        const { hasProject, projectTitle } = event.detail;
        updateProjectSaveButtons(hasProject, projectTitle);
    });

    // Initialize project save buttons for new project (default state)
    updateProjectSaveButtons(false, null);

    // Expose the original save project function for updates
    window.handleSaveProjectFromLeftMenu = handleSaveProject;

    // Modify handleSaveProject to check for existing project BEFORE any modal logic
    const originalHandleSaveProject = handleSaveProject;
    handleSaveProject = async function() {
        console.log('[LeftMenu] ===== SAVE PROJECT CALLED =====');
        console.log('[LeftMenu] Checking for existing project...');
        console.log('[LeftMenu] window.currentProjectId:', window.currentProjectId);
        console.log('[LeftMenu] window.currentProjectTitle:', window.currentProjectTitle);
        console.log('[LeftMenu] window.currentProjectFolderId:', window.currentProjectFolderId);

        // Check if we have a current project and should update instead
        if (window.currentProjectId && window.handleUpdateProject) {
            console.log('[LeftMenu] ===== EXISTING PROJECT DETECTED =====');
            console.log('[LeftMenu] Going directly to handleUpdateProject - NO MODAL');
            await window.handleUpdateProject();
        } else {
            console.log('[LeftMenu] ===== NEW PROJECT =====');
            console.log('[LeftMenu] No current project, calling original handleSaveProject - WILL SHOW MODAL');
            await originalHandleSaveProject();
        }
    };

    // Make functions available globally if needed
    window.handleSaveProject = handleSaveProject;
    window.handleDuplicateProject = handleDuplicateProject;
    window.cleanObjectForSerialization = cleanObjectForSerialization;
    window.updateProjectSaveButtons = updateProjectSaveButtons;
});

// AI Generator helper functions (outside DOMContentLoaded to be globally accessible)

// Generate AI image
async function generateAIImage(objectText, templateId, palette) {
    console.log('[AIGenerator] 🎨 generateAIImage called with:', {
        objectText,
        templateId,
        palette: {
            id: palette?.id,
            name: palette?.name,
            description: palette?.description,
            fullObject: palette
        }
    });

    const payload = {
        object: objectText,
        templateId: templateId,
        imagePalette: palette  // Use same parameter name as working pages
    };

    console.log('[AIGenerator] 🎨 Sending payload to backend:', payload);

    const response = await fetch('/api/generate/image', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate image');
    }

    const result = await response.json();
    console.log('[AIGenerator] 🎨 Generation result:', result);
    return {
        imageUrl: result.imageUrl,
        generationId: result.generationId,
        prompt: result.prompt // Include the prompt for admin field updates
    };
}

// Remove background from generated image
async function removeBackgroundFromGeneration(imageUrl, generationId) {
    console.log('[AIGenerator] 🎨 Starting background removal for:', { imageUrl, generationId });

    try {
        const response = await fetch('/api/images/bgremove', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                imageUrl: imageUrl,
                generationId: generationId
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || errorData.details || 'Background removal failed');
        }

        const result = await response.json();
        console.log('[AIGenerator] 🎨 Background removal successful:', result);

        // Return the new image URL with background removed
        return result.imageUrl;
    } catch (error) {
        console.error('[AIGenerator] 🎨 Background removal failed:', error);
        // If background removal fails, return the original image URL
        console.log('[AIGenerator] 🎨 Falling back to original image URL');

        if (window.showToast) {
            window.showToast('Background removal failed, using original image', 'warning');
        }

        return imageUrl;
    }
}

// Add generated image to canvas
async function addGeneratedImageToCanvas(imageUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        // Don't use crossOrigin for B2 images - let the server handle authorization

        img.onload = () => {
            try {
                // Create new image object for canvas
                const newImageObj = {
                    id: window.nextId ? window.nextId++ : Date.now(),
                    type: 'image',
                    image: img,
                    imageUrl: imageUrl,
                    x: window.canvas ? window.canvas.width / 2 : 1024,
                    y: window.canvas ? window.canvas.height / 2 : 1024,
                    originalWidth: img.width,
                    originalHeight: img.height,
                    scale: 0.5, // Start at 50% scale
                    rotation: 0,
                    opacity: 100,
                    isSelected: false,
                    isFromGeneration: true, // Mark as AI generated
                    generationId: Date.now() // Unique generation ID
                };

                // Add to canvas objects array
                if (window.canvasObjects && Array.isArray(window.canvasObjects)) {
                    window.canvasObjects.push(newImageObj);
                    console.log('[AIGenerator] Image added to canvas objects');

                    // Select the new image
                    if (typeof window.selectObject === 'function') {
                        window.selectObject(window.canvasObjects.length - 1);
                    } else {
                        window.selectedObjectIndex = window.canvasObjects.length - 1;
                        newImageObj.isSelected = true;
                    }

                    // Update canvas
                    if (typeof window.update === 'function') {
                        window.update();
                    }

                    // Sync global references
                    if (typeof window.syncGlobalReferences === 'function') {
                        window.syncGlobalReferences();
                    }
                }

                resolve();
            } catch (error) {
                reject(error);
            }
        };

        img.onerror = () => {
            reject(new Error('Failed to load generated image'));
        };

        img.src = imageUrl;
    });
}

// Template selection function (globally accessible)
async function selectAITemplate(element) {
    // Remove previous selection
    document.querySelectorAll('.ai-template-item').forEach(item => {
        item.classList.remove('selected');
    });

    // Add selection to clicked item
    element.classList.add('selected');
    const templateId = element.dataset.templateId;
    console.log('[AIGenerator] Template selected:', templateId);

    // Fetch template data and set original palette description (same as working pages)
    try {
        const response = await fetch(`/api/templates/${templateId}`);
        if (response.ok) {
            const template = await response.json();
            console.log('[AIGenerator] Template data loaded:', template);

            // Set the original palette description in the ColorPaletteSelector (same as index.html)
            const paletteSelector = document.getElementById('aiColorPaletteSelector');
            if (paletteSelector && template.originalPalette) {
                paletteSelector.setOriginalPaletteDescription(template.originalPalette);
                console.log('[AIGenerator] Set original palette from template:', template.originalPalette);
            }
        }
    } catch (error) {
        console.error('[AIGenerator] Error loading template data:', error);
    }
}

// --- Update Admin Fields BEFORE Restyle Generation ---
async function updateAdminFieldsBeforeRestyle(selectedTemplate, selectedPalette, objectText) {
    console.log('🎨 Updating admin fields BEFORE restyle generation:', {
        selectedTemplate: selectedTemplate,
        selectedPalette: selectedPalette,
        objectText: objectText
    });

    try {
        // 1. Get original template data (with prompt containing variables)
        let originalTemplatePrompt = null;
        let recommendedModel = null;

        if (selectedTemplate) {
            const response = await fetch(`/api/templates/${selectedTemplate}`);
            if (response.ok) {
                const template = await response.json();

                // Debug: Show all available fields in the template
                console.log('🎨 Full template object keys:', Object.keys(template));
                console.log('🎨 Full template object:', template);

                // Try different possible field names for the prompt
                originalTemplatePrompt = template.prompt ||
                                       template.originalPrompt ||
                                       template.description ||
                                       template.text ||
                                       template.promptTemplate ||
                                       template.content ||
                                       template.template;

                recommendedModel = template.recommendedModel || template.model;

                console.log('🎨 Template prompt search results:', {
                    'template.prompt': template.prompt,
                    'template.originalPrompt': template.originalPrompt,
                    'template.description': template.description,
                    'template.text': template.text,
                    'template.promptTemplate': template.promptTemplate,
                    'template.content': template.content,
                    'template.template': template.template,
                    'finalPrompt': originalTemplatePrompt
                });

                console.log('🎨 Retrieved template data:', {
                    templateId: selectedTemplate,
                    prompt: originalTemplatePrompt,
                    recommendedModel: recommendedModel
                });
            } else {
                console.log('🎨 Failed to fetch template, status:', response.status);
            }
        }

        // 2. Update admin prompt with original template prompt (with variables)
        const adminPrompt = document.getElementById('adminPrompt');
        console.log('🎨 Admin prompt element found:', !!adminPrompt);
        console.log('🎨 Original template prompt available:', !!originalTemplatePrompt);
        console.log('🎨 Original template prompt value:', originalTemplatePrompt);

        if (adminPrompt) {
            if (originalTemplatePrompt) {
                // Try multiple ways to update the textarea
                adminPrompt.value = originalTemplatePrompt;
                adminPrompt.textContent = originalTemplatePrompt;
                adminPrompt.innerHTML = originalTemplatePrompt;

                // Force a change event
                adminPrompt.dispatchEvent(new Event('change'));
                adminPrompt.dispatchEvent(new Event('input'));

                console.log('🎨 ✅ Updated adminPrompt with original template prompt:', originalTemplatePrompt);
                console.log('🎨 ✅ AdminPrompt.value after update:', adminPrompt.value);
                console.log('🎨 ✅ AdminPrompt.textContent after update:', adminPrompt.textContent);
            } else {
                console.log('🎨 ❌ No original template prompt available to update adminPrompt');
                // Try to set a test value to see if the element can be updated at all
                adminPrompt.value = 'TEST: Prompt update failed - no template prompt found';
                console.log('🎨 🧪 Set test value, adminPrompt.value now:', adminPrompt.value);
            }
        } else {
            console.log('🎨 ❌ adminPrompt element not found');
        }

        // 3. Update admin model with current selection or template's recommended model
        const adminModel = document.getElementById('adminModel');
        const currentModelSelect = document.getElementById('aiModelSelect');
        if (adminModel) {
            if (currentModelSelect && currentModelSelect.value) {
                adminModel.value = currentModelSelect.value;
                console.log('🎨 Updated adminModel from current selection:', currentModelSelect.value);
            } else if (recommendedModel) {
                adminModel.value = recommendedModel;
                console.log('🎨 Updated adminModel from template recommendation:', recommendedModel);
            } else {
                adminModel.value = 'flux-1.1-pro'; // Default fallback
                console.log('🎨 Updated adminModel with default fallback: flux-1.1-pro');
            }
        }

        // 4. Update admin original palette with selected palette colors
        const adminOriginalPalette = document.getElementById('adminOriginalPalette');
        if (adminOriginalPalette) {
            if (selectedPalette && selectedPalette.fullObject) {
                // Use the actual palette colors/description from fullObject
                const paletteColors = selectedPalette.fullObject.description || selectedPalette.fullObject.colors || selectedPalette.name || selectedPalette.id;
                adminOriginalPalette.value = paletteColors;
                console.log('🎨 Updated adminOriginalPalette with colors:', paletteColors);
            } else if (selectedPalette) {
                // Fallback to palette name if fullObject not available
                const paletteInfo = selectedPalette.description || selectedPalette.name || selectedPalette.id || 'Custom Palette';
                adminOriginalPalette.value = paletteInfo;
                console.log('🎨 Updated adminOriginalPalette with name:', paletteInfo);
            } else {
                adminOriginalPalette.value = 'Original Palette';
                console.log('🎨 Updated adminOriginalPalette to default: Original Palette');
            }
        }

        // 5. Note: adminOriginalObject stays the same (not updated during restyle)
        // 6. Note: adminImageUrl will be updated after generation with the new image

        console.log('🎨 Admin fields updated successfully BEFORE restyle generation');

    } catch (error) {
        console.error('🎨 Error updating admin fields before restyle:', error);
    }
}

// --- Update Admin Fields BEFORE Replace Generation ---
async function updateAdminFieldsBeforeReplace(selectedTemplate, selectedPalette, objectText) {
    console.log('🔄 Updating admin fields BEFORE replace generation:', {
        selectedTemplate: selectedTemplate,
        selectedPalette: selectedPalette,
        objectText: objectText
    });

    try {
        // 1. Get original template data (with prompt containing variables)
        let originalTemplatePrompt = null;
        let recommendedModel = null;

        if (selectedTemplate) {
            const response = await fetch(`/api/templates/${selectedTemplate}`);
            if (response.ok) {
                const template = await response.json();

                // Debug: Show all available fields in the template
                console.log('🔄 Full template object keys:', Object.keys(template));
                console.log('🔄 Full template object:', template);

                // Try different possible field names for the prompt
                originalTemplatePrompt = template.prompt ||
                                       template.originalPrompt ||
                                       template.description ||
                                       template.text ||
                                       template.promptTemplate ||
                                       template.content ||
                                       template.template;

                recommendedModel = template.recommendedModel || template.model;

                console.log('🔄 Template prompt search results:', {
                    'template.prompt': template.prompt,
                    'template.originalPrompt': template.originalPrompt,
                    'template.description': template.description,
                    'template.text': template.text,
                    'template.promptTemplate': template.promptTemplate,
                    'template.content': template.content,
                    'template.template': template.template,
                    'finalPrompt': originalTemplatePrompt
                });

                console.log('🔄 Retrieved template data:', {
                    templateId: selectedTemplate,
                    prompt: originalTemplatePrompt,
                    recommendedModel: recommendedModel
                });
            } else {
                console.log('🔄 Failed to fetch template, status:', response.status);
            }
        }

        // 2. Update admin prompt with original template prompt (with variables)
        const adminPrompt = document.getElementById('adminPrompt');
        console.log('🔄 Admin prompt element found:', !!adminPrompt);
        console.log('🔄 Original template prompt available:', !!originalTemplatePrompt);
        console.log('🔄 Original template prompt value:', originalTemplatePrompt);

        if (adminPrompt) {
            if (originalTemplatePrompt) {
                // Try multiple ways to update the textarea
                adminPrompt.value = originalTemplatePrompt;
                adminPrompt.textContent = originalTemplatePrompt;
                adminPrompt.innerHTML = originalTemplatePrompt;

                // Force a change event
                adminPrompt.dispatchEvent(new Event('change'));
                adminPrompt.dispatchEvent(new Event('input'));

                console.log('🔄 ✅ Updated adminPrompt with original template prompt:', originalTemplatePrompt);
                console.log('🔄 ✅ AdminPrompt.value after update:', adminPrompt.value);
                console.log('🔄 ✅ AdminPrompt.textContent after update:', adminPrompt.textContent);
            } else {
                console.log('🔄 ❌ No original template prompt available to update adminPrompt');
                // Try to set a test value to see if the element can be updated at all
                adminPrompt.value = 'TEST: Prompt update failed - no template prompt found';
                console.log('🔄 🧪 Set test value, adminPrompt.value now:', adminPrompt.value);
            }
        } else {
            console.log('🔄 ❌ adminPrompt element not found');
        }

        // 3. Update admin model with current selection or template's recommended model
        const adminModel = document.getElementById('adminModel');
        const currentModelSelect = document.getElementById('aiModelSelect');
        if (adminModel) {
            if (currentModelSelect && currentModelSelect.value) {
                adminModel.value = currentModelSelect.value;
                console.log('🔄 Updated adminModel from current selection:', currentModelSelect.value);
            } else if (recommendedModel) {
                adminModel.value = recommendedModel;
                console.log('🔄 Updated adminModel from template recommendation:', recommendedModel);
            } else {
                adminModel.value = 'flux-1.1-pro'; // Default fallback
                console.log('🔄 Updated adminModel with default fallback: flux-1.1-pro');
            }
        }

        // 4. Update admin original palette with selected palette colors
        const adminOriginalPalette = document.getElementById('adminOriginalPalette');
        if (adminOriginalPalette) {
            if (selectedPalette && selectedPalette.fullObject) {
                // Use the actual palette colors/description from fullObject
                const paletteColors = selectedPalette.fullObject.description || selectedPalette.fullObject.colors || selectedPalette.name || selectedPalette.id;
                adminOriginalPalette.value = paletteColors;
                console.log('🔄 Updated adminOriginalPalette with colors:', paletteColors);
            } else if (selectedPalette) {
                // Fallback to palette name if fullObject not available
                const paletteInfo = selectedPalette.description || selectedPalette.name || selectedPalette.id || 'Custom Palette';
                adminOriginalPalette.value = paletteInfo;
                console.log('🔄 Updated adminOriginalPalette with name:', paletteInfo);
            } else {
                adminOriginalPalette.value = 'Original Palette';
                console.log('🔄 Updated adminOriginalPalette to default: Original Palette');
            }
        }

        // 5. Update admin original object with NEW object text (KEY DIFFERENCE from Restyle)
        const adminOriginalObject = document.getElementById('adminOriginalObject');
        if (adminOriginalObject) {
            adminOriginalObject.value = objectText;
            console.log('🔄 ✅ Updated adminOriginalObject with NEW object:', objectText);
        } else {
            console.log('🔄 ❌ adminOriginalObject element not found');
        }

        // 6. Note: adminImageUrl will be updated after generation with the new image

        console.log('🔄 Admin fields updated successfully BEFORE replace generation');

    } catch (error) {
        console.error('🔄 Error updating admin fields before replace:', error);
    }
}

// --- Get Original Template Prompt (with variables) ---
async function getOriginalTemplatePrompt(templateId) {
    if (!templateId) {
        console.log('🎨 No template ID provided for getting original prompt');
        return null;
    }

    try {
        const response = await fetch(`/api/templates/${templateId}`);
        if (response.ok) {
            const template = await response.json();
            console.log('🎨 Retrieved original template prompt:', template.prompt);
            return template.prompt; // This should contain [object] and [palette] variables
        } else {
            console.error('🎨 Failed to fetch template data for prompt');
            return null;
        }
    } catch (error) {
        console.error('🎨 Error fetching original template prompt:', error);
        return null;
    }
}

// --- Update Admin Fields After Restyle ---
function updateAdminFieldsAfterRestyle(generationResult, selectedTemplate, selectedPalette, originalTemplatePrompt) {
    console.log('🎨 Updating admin fields after restyle:', {
        generationResult: generationResult,
        selectedTemplate: selectedTemplate,
        selectedPalette: selectedPalette,
        originalTemplatePrompt: originalTemplatePrompt
    });

    try {
        // Update admin prompt with the ORIGINAL template prompt (with variables)
        const adminPrompt = document.getElementById('adminPrompt');
        if (adminPrompt) {
            if (originalTemplatePrompt) {
                adminPrompt.value = originalTemplatePrompt;
                console.log('🎨 Updated adminPrompt with original template prompt (with variables):', originalTemplatePrompt);
            } else if (generationResult.prompt) {
                adminPrompt.value = generationResult.prompt;
                console.log('🎨 Updated adminPrompt with rendered prompt (fallback):', generationResult.prompt);
            } else {
                console.log('🎨 No prompt available to update adminPrompt');
            }
        } else {
            console.log('🎨 adminPrompt element not found');
        }

        // Update admin model - get from current AI Generator selection since it's not in generationResult
        const adminModel = document.getElementById('adminModel');
        const currentModelSelect = document.getElementById('aiModelSelect');
        console.log('🎨 Model update debug:', {
            adminModelExists: !!adminModel,
            currentModelSelectExists: !!currentModelSelect,
            currentModelValue: currentModelSelect?.value,
            generationResultModel: generationResult.model
        });

        if (adminModel) {
            if (currentModelSelect && currentModelSelect.value) {
                adminModel.value = currentModelSelect.value;
                console.log('🎨 Updated adminModel from current selection:', currentModelSelect.value);
            } else if (generationResult.model) {
                adminModel.value = generationResult.model;
                console.log('🎨 Updated adminModel from generationResult:', generationResult.model);
            } else {
                console.log('🎨 No model available to update adminModel');
                // Fallback: try to get from template's recommended model
                const selectedTemplateElement = document.querySelector('.ai-template-item.selected');
                if (selectedTemplateElement) {
                    const templateId = selectedTemplateElement.dataset.templateId;
                    console.log('🎨 Trying to get model from selected template:', templateId);
                    // For now, set a default model if none found
                    adminModel.value = 'flux-1.1-pro';
                    console.log('🎨 Set default model: flux-1.1-pro');
                }
            }
        } else {
            console.log('🎨 adminModel element not found');
        }

        // Update admin original palette with the new palette
        const adminOriginalPalette = document.getElementById('adminOriginalPalette');
        if (adminOriginalPalette) {
            if (selectedPalette) {
                // Format palette info for display
                const paletteInfo = selectedPalette.name || selectedPalette.id || 'Custom Palette';
                adminOriginalPalette.value = paletteInfo;
                console.log('🎨 Updated adminOriginalPalette:', paletteInfo);
            } else {
                // If no palette was selected, use "Original Palette" as default
                adminOriginalPalette.value = 'Original Palette';
                console.log('🎨 Updated adminOriginalPalette to default: Original Palette');
            }
        }

        // Note: adminOriginalObject is NOT updated during restyle since the object stays the same

        // Update admin image URL with the new generated image
        const adminImageUrl = document.getElementById('adminImageUrl');
        if (adminImageUrl && generationResult.imageUrl) {
            adminImageUrl.value = generationResult.imageUrl;
            console.log('🎨 Updated adminImageUrl:', generationResult.imageUrl);
        }

        console.log('🎨 Admin fields updated successfully after restyle');

    } catch (error) {
        console.error('🎨 Error updating admin fields after restyle:', error);
    }
}

// --- Apply Palette Colors to Texts and Shapes BEFORE Generation ---
async function applyPaletteColorsToTexts(paletteId) {
    console.log('🎨 Applying palette colors to texts and shapes with assigned intensities:', paletteId);

    try {
        // Check if we have canvas objects and the required functions
        if (!window.canvasObjects || !Array.isArray(window.canvasObjects)) {
            console.log('🎨 No canvas objects found, skipping color application');
            return;
        }

        if (!window.getTextColorForPalette) {
            console.error('🎨 getTextColorForPalette function not available');
            return;
        }

        let updatedCount = 0;

        // Loop through all canvas objects and update colors for texts and shapes
        window.canvasObjects.forEach((obj, index) => {
            // Process text objects
            if (obj.type === 'text') {
                // Get the color intensity assignment for this text
                let colorIntensity = obj.newColorIntensity;

                // If text doesn't have color intensity assigned, assign a default one
                if (!colorIntensity || colorIntensity === 'N/A') {
                    // Auto-assign color intensity based on text position/index for variety (5 options)
                    const intensityOptions = ['lightest', 'light', 'medium', 'dark', 'darkest'];
                    colorIntensity = intensityOptions[index % intensityOptions.length];
                    obj.newColorIntensity = colorIntensity;
                    console.log(`🎨 Auto-assigned color intensity "${colorIntensity}" to text "${obj.text}"`);
                }

                // Skip texts with 'no-change' setting
                if (colorIntensity === 'no-change') {
                    console.log(`🎨 Text "${obj.text}" has 'no-change' color intensity, preserving original color`);
                    return;
                }

                // Get the appropriate color for this palette and intensity
                const newColor = window.getTextColorForPalette(paletteId, colorIntensity);

                if (newColor) {
                    const oldColor = obj.color;
                    obj.color = newColor;
                    updatedCount++;
                    console.log(`🎨 Updated text "${obj.text}" color using intensity (${colorIntensity}): ${oldColor} → ${newColor}`);
                } else {
                    console.warn(`🎨 Could not get color for palette ${paletteId} with intensity ${colorIntensity}`);
                }
            }
            // Process shape objects (images with SVG or regular shapes)
            else if (obj.type === 'image' || obj.type === 'shape' || obj.objectType) {
                // Get the color intensity assignment for this shape
                let colorIntensity = obj.newColorIntensity;

                // If shape doesn't have color intensity assigned, assign a default one (only for SVG shapes)
                if ((!colorIntensity || colorIntensity === 'N/A') &&
                    obj.type === 'image' && obj.imageUrl && obj.imageUrl.toLowerCase().endsWith('.svg')) {
                    // Auto-assign color intensity for SVG shapes (5 options)
                    const intensityOptions = ['lightest', 'light', 'medium', 'dark', 'darkest'];
                    colorIntensity = intensityOptions[index % intensityOptions.length];
                    obj.newColorIntensity = colorIntensity;
                    console.log(`🎨 Auto-assigned color intensity "${colorIntensity}" to SVG shape "${obj.id || obj.imageUrl}"`);
                }

                // Skip shapes without intensity assignment or with 'no-change'
                if (!colorIntensity || colorIntensity === 'N/A' || colorIntensity === 'no-change') {
                    console.log(`🎨 Shape "${obj.id || obj.imageUrl}" has no color intensity assignment (${colorIntensity}), preserving original color`);
                    return;
                }

                // Get the appropriate color for this palette and intensity
                const newColor = window.getTextColorForPalette(paletteId, colorIntensity);

                if (newColor) {
                    let oldColor = null;
                    let colorProperty = null;

                    // Determine which color property to update based on shape type
                    if (obj.type === 'image' && obj.imageUrl && obj.imageUrl.toLowerCase().endsWith('.svg')) {
                        // SVG shape - use svgColor
                        oldColor = obj.svgColor;
                        obj.svgColor = newColor;
                        colorProperty = 'svgColor';
                    } else if (obj.type === 'shape' || obj.objectType) {
                        // Regular shape - use fill
                        oldColor = obj.fill;
                        obj.fill = newColor;
                        colorProperty = 'fill';
                    } else if (obj.type === 'image') {
                        // Other image types that might have color properties
                        if (obj.svgColor !== undefined) {
                            oldColor = obj.svgColor;
                            obj.svgColor = newColor;
                            colorProperty = 'svgColor';
                        } else if (obj.fill !== undefined) {
                            oldColor = obj.fill;
                            obj.fill = newColor;
                            colorProperty = 'fill';
                        }
                    }

                    if (colorProperty) {
                        updatedCount++;
                        console.log(`🎨 Updated ${obj.type} "${obj.id || obj.imageUrl}" ${colorProperty} using intensity (${colorIntensity}): ${oldColor} → ${newColor}`);
                    }
                } else {
                    console.warn(`🎨 Could not get color for palette ${paletteId} with intensity ${colorIntensity}`);
                }
            }
        });

        console.log(`🎨 Applied palette colors to ${updatedCount} texts and shapes with assigned intensities`);

        // For SVG shapes, trigger recoloring to ensure visual changes are applied
        let svgShapesRecolored = 0;
        for (const obj of window.canvasObjects) {
            if (obj.type === 'image' && obj.imageUrl && obj.imageUrl.toLowerCase().endsWith('.svg') &&
                obj.newColorIntensity && obj.newColorIntensity !== 'N/A' && obj.newColorIntensity !== 'no-change') {

                try {
                    if (window.recolorSVG && typeof window.recolorSVG === 'function') {
                        await window.recolorSVG(obj, obj.svgColor);
                        svgShapesRecolored++;
                        console.log(`🎨 Recolored SVG shape "${obj.id}" to ensure visual update with color: ${obj.svgColor}`);
                    }
                } catch (error) {
                    console.error(`🎨 Error recoloring SVG shape "${obj.id}":`, error);
                }
            }
        }

        if (svgShapesRecolored > 0) {
            console.log(`🎨 Recolored ${svgShapesRecolored} SVG shapes to ensure visual updates`);
        }

        // Trigger canvas redraw to show the updated colors
        if (window.redrawCanvas && typeof window.redrawCanvas === 'function') {
            window.redrawCanvas();
            console.log('🎨 Canvas redrawn to show updated colors');
        } else if (window.update && typeof window.update === 'function') {
            window.update();
            console.log('🎨 Canvas updated to show updated colors');
        }

    } catch (error) {
        console.error('🎨 Error applying palette colors to texts and shapes:', error);
    }
}

// Make functions globally available
window.generateAIImage = generateAIImage;
window.removeBackgroundFromGeneration = removeBackgroundFromGeneration;
window.addGeneratedImageToCanvas = addGeneratedImageToCanvas;
window.selectAITemplate = selectAITemplate;
window.updateAdminFieldsAfterRestyle = updateAdminFieldsAfterRestyle;
window.applyPaletteColorsToTexts = applyPaletteColorsToTexts;

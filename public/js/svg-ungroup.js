/**
 * SVG Ungrouping Module
 * Provides functionality to ungroup SVG files into individual shapes
 * that can be manipulated independently in the design editor
 */

class SVGUngrouperModule {
    constructor() {
        this.isProcessing = false;
        this.init();
    }

    init() {
        console.log('🔗 SVGUngrouperModule.init() called');

        // Initialize the ungroup button event listener
        const ungroupBtn = document.getElementById('ungroupSvgBtn');
        if (ungroupBtn) {
            console.log('🔗 Found ungroup button, adding event listener');
            ungroupBtn.addEventListener('click', () => this.ungroupSelectedSVG());
        } else {
            console.warn('🔗 Ungroup button not found in DOM');
        }

        // Listen for object selection changes to show/hide the ungroup button
        this.setupSelectionListener();

        // Initial button visibility update
        setTimeout(() => this.updateUngroupButtonVisibility(), 100);
    }

    setupSelectionListener() {
        // Store reference to this instance
        const self = this;

        // Override the updateUIFromSelectedObject function to include our button logic
        const originalUpdateUI = window.updateUIFromSelectedObject;
        if (originalUpdateUI) {
            window.updateUIFromSelectedObject = function(...args) {
                originalUpdateUI.apply(this, args);
                self.updateUngroupButtonVisibility();
            };
        }

        // Also listen for canvas updates
        const originalUpdate = window.update;
        if (originalUpdate) {
            window.update = function(...args) {
                originalUpdate.apply(this, args);
                // Small delay to ensure UI is updated after canvas render
                setTimeout(() => self.updateUngroupButtonVisibility(), 10);
            };
        }
    }

    updateUngroupButtonVisibility() {
        const ungroupBtn = document.getElementById('ungroupSvgBtn');
        if (!ungroupBtn) {
            return;
        }

        const selectedObject = this.getSelectedObject();
        const shouldShow = selectedObject && this.isSVGObject(selectedObject);

        ungroupBtn.style.display = shouldShow ? 'inline-block' : 'none';
        ungroupBtn.disabled = !shouldShow || this.isProcessing;

        if (shouldShow) {
            console.log('🔗 SVG object selected, ungroup button visible');
        }
    }

    getSelectedObject() {
        if (window.selectedObjectIndex === -1 || !window.canvasObjects) return null;
        return window.canvasObjects[window.selectedObjectIndex];
    }

    isSVGObject(obj) {
        if (!obj || obj.type !== 'image' || !obj.imageUrl) {
            return false;
        }
        const isSvg = obj.imageUrl.toLowerCase().endsWith('.svg');
        return isSvg;
    }

    async ungroupSelectedSVG() {
        if (this.isProcessing) return;

        const selectedObject = this.getSelectedObject();
        if (!selectedObject || !this.isSVGObject(selectedObject)) {
            console.warn('No SVG object selected for ungrouping');
            return;
        }

        this.isProcessing = true;
        this.updateUngroupButtonVisibility();

        try {
            console.log('🔗 Starting SVG ungrouping for:', selectedObject.imageUrl);
            
            // Fetch the SVG content
            const svgContent = await this.fetchSVGContent(selectedObject.imageUrl);
            if (!svgContent) {
                throw new Error('Failed to fetch SVG content');
            }

            // Parse the SVG and extract shapes
            console.log('🔗 Starting SVG shape parsing...');
            const shapes = await this.parseSVGShapes(svgContent, selectedObject);
            if (shapes.length === 0) {
                throw new Error('No shapes found in SVG');
            }

            console.log(`🔗 Found ${shapes.length} shapes to ungroup`);

            // Create individual canvas objects for each shape
            console.log('🔗 Creating canvas objects for shapes...');
            const newObjects = await this.createShapeObjects(shapes, selectedObject);
            console.log(`🔗 Created ${newObjects.length} canvas objects`);

            // Replace the original SVG with the individual shapes
            console.log('🔗 Replacing original SVG with individual shapes...');
            this.replaceWithShapes(selectedObject, newObjects);
            console.log('🔗 Replacement completed');

            // Show success message
            if (window.showToast) {
                window.showToast(`SVG ungrouped into ${newObjects.length} shapes`, 'success');
            }

            console.log('🔗 SVG ungrouping completed successfully');

        } catch (error) {
            console.error('🔗 Error ungrouping SVG:', error);
            if (window.showToast) {
                window.showToast('Failed to ungroup SVG: ' + error.message, 'error');
            }
        } finally {
            this.isProcessing = false;
            this.updateUngroupButtonVisibility();
        }
    }

    async fetchSVGContent(svgUrl) {
        try {
            const response = await fetch(svgUrl);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.text();
        } catch (error) {
            console.error('🔗 Error fetching SVG:', error);
            throw error;
        }
    }

    async parseSVGShapes(svgContent, originalObject) {
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
        const svgElement = svgDoc.querySelector('svg');

        if (!svgElement) {
            throw new Error('Invalid SVG content');
        }

        // Get SVG dimensions and viewBox
        const viewBox = svgElement.getAttribute('viewBox');
        let svgWidth, svgHeight, viewBoxX = 0, viewBoxY = 0;

        if (viewBox) {
            const [vbX, vbY, vbW, vbH] = viewBox.split(/\s+/).map(Number);
            viewBoxX = vbX || 0;
            viewBoxY = vbY || 0;
            svgWidth = vbW || originalObject.originalWidth;
            svgHeight = vbH || originalObject.originalHeight;
        } else {
            svgWidth = this.parseDimension(svgElement.getAttribute('width')) || originalObject.originalWidth;
            svgHeight = this.parseDimension(svgElement.getAttribute('height')) || originalObject.originalHeight;
        }

        console.log('🔗 SVG dimensions:', svgWidth, 'x', svgHeight);
        console.log('🔗 ViewBox offset:', viewBoxX, viewBoxY);

        // First, look for logical groups (g elements with meaningful structure)
        const groups = svgElement.querySelectorAll('g[id], g[data-name], g[class]');
        console.log(`🔗 Found ${groups.length} logical groups to process`);

        const shapes = [];

        if (groups.length > 0) {
            // Process logical groups (like fire, text, etc.)
            for (let i = 0; i < groups.length && i < 10; i++) {
                const group = groups[i];
                const groupId = group.getAttribute('id') || group.getAttribute('data-name') || group.getAttribute('class') || `Group ${i + 1}`;
                console.log(`🔗 Processing logical group: ${groupId}`);

                try {
                    const shape = await this.processGroupElement(group, svgWidth, svgHeight, originalObject, i, viewBoxX, viewBoxY, groupId);
                    if (shape) {
                        shapes.push(shape);
                        console.log(`🔗 Successfully processed group: ${groupId}`);
                    }
                } catch (error) {
                    console.error(`🔗 Error processing group ${groupId}:`, error);
                }
            }
        } else {
            // Fallback: look for top-level elements or any groups
            const topLevelGroups = svgElement.querySelectorAll('svg > g');
            const topLevelElements = svgElement.querySelectorAll('svg > path, svg > circle, svg > rect, svg > ellipse, svg > polygon, svg > polyline, svg > line, svg > image, svg > text');

            console.log(`🔗 Found ${topLevelGroups.length} top-level groups and ${topLevelElements.length} top-level elements`);

            // Process top-level groups first
            for (let i = 0; i < topLevelGroups.length && i < 10; i++) {
                const group = topLevelGroups[i];
                const groupId = `Group ${i + 1}`;
                console.log(`🔗 Processing top-level group: ${groupId}`);

                try {
                    const shape = await this.processGroupElement(group, svgWidth, svgHeight, originalObject, i, viewBoxX, viewBoxY, groupId);
                    if (shape) {
                        shapes.push(shape);
                        console.log(`🔗 Successfully processed group: ${groupId}`);
                    }
                } catch (error) {
                    console.error(`🔗 Error processing group ${groupId}:`, error);
                }
            }

            // Then process individual top-level elements (including embedded images)
            for (let i = 0; i < topLevelElements.length && i < 5; i++) {
                const element = topLevelElements[i];
                console.log(`🔗 Processing top-level element: ${element.tagName}`);

                try {
                    const shape = await this.processShapeElement(element, svgWidth, svgHeight, originalObject, shapes.length, viewBoxX, viewBoxY);
                    if (shape) {
                        shapes.push(shape);
                        console.log(`🔗 Successfully processed element ${i + 1}`);
                    }
                } catch (error) {
                    console.error(`🔗 Error processing element ${i + 1}:`, error);
                }
            }

            // Also check for embedded images in the SVG
            const embeddedImages = svgElement.querySelectorAll('image');
            console.log(`🔗 Found ${embeddedImages.length} embedded images`);

            for (let i = 0; i < embeddedImages.length && i < 5; i++) {
                const imageElement = embeddedImages[i];
                console.log(`🔗 Processing embedded image ${i + 1}`);

                try {
                    const shape = await this.processImageElement(imageElement, svgWidth, svgHeight, originalObject, shapes.length, viewBoxX, viewBoxY);
                    if (shape) {
                        shapes.push(shape);
                        console.log(`🔗 Successfully processed embedded image ${i + 1}`);
                    }
                } catch (error) {
                    console.error(`🔗 Error processing embedded image ${i + 1}:`, error);
                }
            }
        }

        if (shapes.length === 0) {
            console.warn('🔗 No logical groups or ungroupable elements found');
            if (window.showToast) {
                window.showToast('No logical groups found in this SVG. Try using a design tool to create grouped elements first.', 'warning');
            }
        }

        console.log(`🔗 Successfully processed ${shapes.length} logical groups/elements`);
        return shapes;
    }

    parseDimension(value) {
        if (!value) return null;
        const num = parseFloat(value.toString().replace(/[^\d.-]/g, ''));
        return isNaN(num) ? null : num;
    }

    async processGroupElement(groupElement, svgWidth, svgHeight, originalObject, index, viewBoxX = 0, viewBoxY = 0, groupId = '') {
        try {
            console.log(`🔗 Processing group element: ${groupId}`);

            // Create a new SVG containing only this group
            const newSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            newSvg.setAttribute('width', svgWidth);
            newSvg.setAttribute('height', svgHeight);
            newSvg.setAttribute('viewBox', `${viewBoxX} ${viewBoxY} ${svgWidth} ${svgHeight}`);
            newSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

            // Clone the group and add it to the new SVG
            const clonedGroup = groupElement.cloneNode(true);
            newSvg.appendChild(clonedGroup);

            // Get the SVG as a string
            const svgString = new XMLSerializer().serializeToString(newSvg);
            const dataUrl = `data:image/svg+xml;base64,${btoa(svgString)}`;

            // Create image from the group
            const img = await this.createImageFromDataUrl(dataUrl);

            // Calculate position based on group's bounding box
            const bbox = this.getGroupBoundingBox(groupElement);

            // Get the actual displayed size of the original object
            const originalWidth = originalObject.originalWidth || originalObject.width || svgWidth;
            const originalHeight = originalObject.originalHeight || originalObject.height || svgHeight;
            const displayWidth = originalWidth * (originalObject.scale || 1);
            const displayHeight = originalHeight * (originalObject.scale || 1);

            console.log(`🔗 Original object dimensions: ${originalWidth}x${originalHeight}, scale: ${originalObject.scale}, display: ${displayWidth}x${displayHeight}`);
            console.log(`🔗 SVG dimensions: ${svgWidth}x${svgHeight}`);
            console.log(`🔗 Group bbox:`, bbox);

            // Calculate scale factors
            const scaleX = displayWidth / svgWidth;
            const scaleY = displayHeight / svgHeight;

            console.log(`🔗 Scale factors: ${scaleX}, ${scaleY}`);

            // Calculate position relative to the original object's position
            const relativeX = (bbox.x - viewBoxX) / svgWidth;
            const relativeY = (bbox.y - viewBoxY) / svgHeight;

            // Calculate absolute position
            const x = originalObject.x + (relativeX - 0.5) * displayWidth;
            const y = originalObject.y + (relativeY - 0.5) * displayHeight;
            const width = bbox.width * scaleX;
            const height = bbox.height * scaleY;

            console.log(`🔗 Calculated position: x=${x}, y=${y}, width=${width}, height=${height}`);

            return {
                image: img,
                x: x,
                y: y,
                width: width,
                height: height,
                rotation: originalObject.rotation || 0,
                name: groupId || `Group ${index + 1}`
            };
        } catch (error) {
            console.error(`🔗 Error processing group element:`, error);
            return null;
        }
    }

    getGroupBoundingBox(groupElement) {
        console.log('🔗 Getting bounding box for group:', groupElement.getAttribute('id') || 'unnamed');

        // For SVG elements that are not attached to DOM, getBBox won't work
        // We need to parse the elements manually

        // First try to get from attributes if it's a simple shape
        if (groupElement.tagName === 'rect') {
            const x = parseFloat(groupElement.getAttribute('x') || 0);
            const y = parseFloat(groupElement.getAttribute('y') || 0);
            const width = parseFloat(groupElement.getAttribute('width') || 100);
            const height = parseFloat(groupElement.getAttribute('height') || 100);
            return { x, y, width, height };
        }

        if (groupElement.tagName === 'circle') {
            const cx = parseFloat(groupElement.getAttribute('cx') || 0);
            const cy = parseFloat(groupElement.getAttribute('cy') || 0);
            const r = parseFloat(groupElement.getAttribute('r') || 50);
            return { x: cx - r, y: cy - r, width: r * 2, height: r * 2 };
        }

        // For groups, analyze child elements
        const children = groupElement.querySelectorAll('path, circle, rect, ellipse, polygon, polyline, line, text, image');
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        let hasValidBounds = false;

        console.log(`🔗 Analyzing ${children.length} children in group`);

        for (const child of children) {
            let childBounds = null;

            try {
                // Try different methods to get bounds
                if (child.tagName === 'rect') {
                    const x = parseFloat(child.getAttribute('x') || 0);
                    const y = parseFloat(child.getAttribute('y') || 0);
                    const width = parseFloat(child.getAttribute('width') || 0);
                    const height = parseFloat(child.getAttribute('height') || 0);
                    childBounds = { x, y, width, height };
                } else if (child.tagName === 'circle') {
                    const cx = parseFloat(child.getAttribute('cx') || 0);
                    const cy = parseFloat(child.getAttribute('cy') || 0);
                    const r = parseFloat(child.getAttribute('r') || 0);
                    childBounds = { x: cx - r, y: cy - r, width: r * 2, height: r * 2 };
                } else if (child.tagName === 'text') {
                    const x = parseFloat(child.getAttribute('x') || 0);
                    const y = parseFloat(child.getAttribute('y') || 0);
                    // Estimate text bounds (rough approximation)
                    const fontSize = parseFloat(child.getAttribute('font-size') || 16);
                    const textLength = (child.textContent || '').length;
                    childBounds = { x: x - (textLength * fontSize * 0.3), y: y - fontSize, width: textLength * fontSize * 0.6, height: fontSize * 1.2 };
                } else if (child.tagName === 'path') {
                    // For paths, try to extract bounds from the path data
                    const pathData = child.getAttribute('d');
                    if (pathData) {
                        const bounds = this.getPathBounds(pathData);
                        if (bounds) childBounds = bounds;
                    }
                }

                if (childBounds && childBounds.width > 0 && childBounds.height > 0) {
                    minX = Math.min(minX, childBounds.x);
                    minY = Math.min(minY, childBounds.y);
                    maxX = Math.max(maxX, childBounds.x + childBounds.width);
                    maxY = Math.max(maxY, childBounds.y + childBounds.height);
                    hasValidBounds = true;
                    console.log(`🔗 Child ${child.tagName} bounds:`, childBounds);
                }
            } catch (e) {
                console.warn(`🔗 Could not get bounds for ${child.tagName}:`, e);
            }
        }

        if (!hasValidBounds) {
            console.warn('🔗 No valid bounds found, using default');
            return { x: 50, y: 50, width: 100, height: 100 };
        }

        const result = {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };

        console.log('🔗 Final group bounds:', result);
        return result;
    }

    getPathBounds(pathData) {
        // Simple path bounds extraction - look for coordinate numbers
        const coords = pathData.match(/[-+]?[0-9]*\.?[0-9]+/g);
        if (!coords || coords.length < 4) return null;

        const numbers = coords.map(Number);
        let minX = Math.min(...numbers.filter((_, i) => i % 2 === 0));
        let maxX = Math.max(...numbers.filter((_, i) => i % 2 === 0));
        let minY = Math.min(...numbers.filter((_, i) => i % 2 === 1));
        let maxY = Math.max(...numbers.filter((_, i) => i % 2 === 1));

        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }

    async processImageElement(imageElement, svgWidth, svgHeight, originalObject, index, viewBoxX = 0, viewBoxY = 0) {
        try {
            console.log(`🔗 Processing embedded image element`);

            // Get image attributes
            const x = parseFloat(imageElement.getAttribute('x') || 0);
            const y = parseFloat(imageElement.getAttribute('y') || 0);
            const width = parseFloat(imageElement.getAttribute('width') || 100);
            const height = parseFloat(imageElement.getAttribute('height') || 100);
            const href = imageElement.getAttribute('href') || imageElement.getAttribute('xlink:href');

            if (!href) {
                console.warn('🔗 Image element has no href');
                return null;
            }

            // Create image from the href (could be data URL or external URL)
            const img = await this.createImageFromDataUrl(href);

            // Calculate position in canvas coordinates
            const scaleX = originalObject.width / svgWidth;
            const scaleY = originalObject.height / svgHeight;

            const canvasX = originalObject.x + (x - viewBoxX) * scaleX;
            const canvasY = originalObject.y + (y - viewBoxY) * scaleY;
            const canvasWidth = width * scaleX;
            const canvasHeight = height * scaleY;

            return {
                image: img,
                x: canvasX,
                y: canvasY,
                width: canvasWidth,
                height: canvasHeight,
                rotation: originalObject.rotation || 0,
                name: `Embedded Image ${index + 1}`
            };
        } catch (error) {
            console.error(`🔗 Error processing image element:`, error);
            return null;
        }
    }

    async processShapeElement(element, svgWidth, svgHeight, originalObject, index, viewBoxX = 0, viewBoxY = 0) {
        try {
            console.log(`🔗 Processing element: ${element.tagName}, index: ${index}`);

            // Get element styles including inherited ones
            const computedStyle = this.getElementStyles(element);
            console.log(`🔗 Computed styles:`, computedStyle);

            // Create a new SVG with just this element, preserving styles
            const individualSvg = this.createIndividualSVG(element, svgWidth, svgHeight, computedStyle, viewBoxX, viewBoxY, originalObject);
            console.log(`🔗 Created individual SVG for element ${index}`);

            // Convert to data URL
            const dataUrl = 'data:image/svg+xml;base64,' + btoa(individualSvg);
            console.log(`🔗 Created data URL for element ${index}`);

            // Create image element
            console.log(`🔗 Creating image from data URL for element ${index}`);
            const img = await this.createImageFromDataUrl(dataUrl);
            console.log(`🔗 Successfully created image for element ${index}`);

            // Calculate position relative to original object, accounting for viewBox
            const bounds = this.getElementBounds(element);
            const adjustedX = bounds.x - viewBoxX;
            const adjustedY = bounds.y - viewBoxY;
            const relativeX = adjustedX / svgWidth;
            const relativeY = adjustedY / svgHeight;

            console.log(`🔗 Element ${index} bounds:`, { bounds, adjustedX, adjustedY, relativeX, relativeY });

            return {
                element,
                img,
                dataUrl,
                bounds,
                relativeX,
                relativeY,
                index,
                fill: computedStyle.fill || element.getAttribute('fill') || '#000000',
                stroke: computedStyle.stroke || element.getAttribute('stroke') || 'none',
                styles: computedStyle
            };
        } catch (error) {
            console.error(`🔗 Failed to process shape element ${index}:`, error);
            return null;
        }
    }

    getElementStyles(element) {
        const styles = {};

        // Get direct attributes with more comprehensive style properties
        const styleProperties = [
            'fill', 'stroke', 'stroke-width', 'stroke-opacity', 'fill-opacity',
            'opacity', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin',
            'fill-rule', 'clip-rule', 'color', 'stop-color', 'stop-opacity'
        ];

        styleProperties.forEach(prop => {
            const value = element.getAttribute(prop);
            if (value && value !== 'none' && value !== 'inherit') {
                styles[prop] = value;
            }
        });

        // Check for style attribute
        const styleAttr = element.getAttribute('style');
        if (styleAttr) {
            const styleRules = styleAttr.split(';');
            styleRules.forEach(rule => {
                const [property, value] = rule.split(':').map(s => s.trim());
                if (property && value) {
                    styles[property.replace(/-([a-z])/g, (g) => g[1].toUpperCase())] = value;
                }
            });
        }

        // Check parent group styles
        let parent = element.parentElement;
        while (parent && parent.tagName !== 'svg') {
            if (parent.tagName === 'g') {
                const parentFill = parent.getAttribute('fill');
                const parentStroke = parent.getAttribute('stroke');
                if (parentFill && !styles.fill) styles.fill = parentFill;
                if (parentStroke && !styles.stroke) styles.stroke = parentStroke;
            }
            parent = parent.parentElement;
        }

        return styles;
    }

    createIndividualSVG(element, svgWidth, svgHeight, styles = {}, viewBoxX = 0, viewBoxY = 0, originalObject = null) {
        // Clone the element to avoid modifying the original
        const clonedElement = element.cloneNode(true);

        // Get the bounding box of this specific element
        const bbox = this.getGroupBoundingBox(element);
        console.log(`🔗 Element bbox for SVG creation:`, bbox);

        // Apply computed styles to the cloned element and all its children
        this.applyStylesToElement(clonedElement, styles);

        // If we have originalObject info, scale the SVG to match display size
        let finalWidth, finalHeight, finalViewBoxX, finalViewBoxY, finalViewBoxWidth, finalViewBoxHeight;

        if (originalObject && originalObject.scale) {
            // Calculate display scale factor
            const displayScale = originalObject.scale;
            console.log(`🔗 Using display scale: ${displayScale}`);

            // Scale the element dimensions to match display size
            const padding = 2;
            finalViewBoxWidth = bbox.width;
            finalViewBoxHeight = bbox.height;
            finalViewBoxX = bbox.x;
            finalViewBoxY = bbox.y;

            // The actual SVG size should be scaled to display size
            finalWidth = Math.max(bbox.width * displayScale + padding * 2, 10);
            finalHeight = Math.max(bbox.height * displayScale + padding * 2, 10);

            console.log(`🔗 Scaled SVG dimensions: ${finalWidth}x${finalHeight}, viewBox: ${finalViewBoxX} ${finalViewBoxY} ${finalViewBoxWidth} ${finalViewBoxHeight}`);
        } else {
            // Fallback to original method
            const padding = 2;
            finalWidth = Math.max(bbox.width + padding * 2, 10);
            finalHeight = Math.max(bbox.height + padding * 2, 10);
            finalViewBoxX = bbox.x - padding;
            finalViewBoxY = bbox.y - padding;
            finalViewBoxWidth = finalWidth;
            finalViewBoxHeight = finalHeight;

            console.log(`🔗 Fallback SVG dimensions: ${finalWidth}x${finalHeight}, viewBox: ${finalViewBoxX} ${finalViewBoxY} ${finalViewBoxWidth} ${finalViewBoxHeight}`);
        }

        // Create a new SVG wrapper with proper scaling
        const svgWrapper = `<svg width="${finalWidth}" height="${finalHeight}" viewBox="${finalViewBoxX} ${finalViewBoxY} ${finalViewBoxWidth} ${finalViewBoxHeight}" xmlns="http://www.w3.org/2000/svg">
            ${clonedElement.outerHTML}
        </svg>`;

        return svgWrapper;
    }

    applyStylesToElement(element, styles) {
        // Apply styles to the element itself
        Object.keys(styles).forEach(property => {
            if (styles[property] && !element.getAttribute(property)) {
                element.setAttribute(property, styles[property]);
            }
        });

        // Recursively apply styles to child elements
        const children = element.children;
        for (let i = 0; i < children.length; i++) {
            this.applyStylesToElement(children[i], styles);
        }
    }

    createImageFromDataUrl(dataUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            // Add timeout to prevent hanging - reduced timeout for faster failure
            const timeout = setTimeout(() => {
                reject(new Error('Image loading timeout (5s)'));
            }, 5000); // 5 second timeout

            img.onload = () => {
                clearTimeout(timeout);

                // Ensure naturalWidth and naturalHeight are available
                // Sometimes these properties need a moment to be set
                if (!img.naturalWidth || !img.naturalHeight) {
                    // Try to get dimensions from the image itself
                    img.naturalWidth = img.width || img.clientWidth || 100;
                    img.naturalHeight = img.height || img.clientHeight || 100;
                }

                console.log(`🔗 Image loaded: ${img.naturalWidth}x${img.naturalHeight}`);
                resolve(img);
            };
            img.onerror = (error) => {
                clearTimeout(timeout);
                console.error('🔗 Image load error:', error);
                reject(new Error('Failed to load shape image'));
            };

            // Set src after setting up event handlers
            try {
                img.src = dataUrl;
            } catch (error) {
                clearTimeout(timeout);
                reject(new Error('Invalid data URL: ' + error.message));
            }
        });
    }

    getElementBounds(element) {
        // Try to get bounding box if available
        if (element.getBBox) {
            try {
                const bbox = element.getBBox();
                return { x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height };
            } catch (e) {
                // getBBox might fail for some elements
            }
        }

        // Fallback: parse common attributes
        const tagName = element.tagName.toLowerCase();
        switch (tagName) {
            case 'rect':
                return {
                    x: parseFloat(element.getAttribute('x') || 0),
                    y: parseFloat(element.getAttribute('y') || 0),
                    width: parseFloat(element.getAttribute('width') || 0),
                    height: parseFloat(element.getAttribute('height') || 0)
                };
            case 'circle':
                const cx = parseFloat(element.getAttribute('cx') || 0);
                const cy = parseFloat(element.getAttribute('cy') || 0);
                const r = parseFloat(element.getAttribute('r') || 0);
                return { x: cx - r, y: cy - r, width: r * 2, height: r * 2 };
            case 'ellipse':
                const ecx = parseFloat(element.getAttribute('cx') || 0);
                const ecy = parseFloat(element.getAttribute('cy') || 0);
                const rx = parseFloat(element.getAttribute('rx') || 0);
                const ry = parseFloat(element.getAttribute('ry') || 0);
                return { x: ecx - rx, y: ecy - ry, width: rx * 2, height: ry * 2 };
            default:
                // For paths and other complex shapes, return center position
                return { x: 0, y: 0, width: 0, height: 0 };
        }
    }

    async createShapeObjects(shapes, originalObject) {
        console.log(`🔗 createShapeObjects called with ${shapes.length} shapes`);
        console.log('🔗 Shapes array:', shapes);

        const newObjects = [];

        for (let i = 0; i < shapes.length; i++) {
            const shape = shapes[i];
            console.log(`🔗 Processing shape ${i}:`, shape);

            // Validate that we have a proper image (check both 'image' and 'img' properties)
            const imageElement = shape.image || shape.img;
            if (!imageElement) {
                console.warn(`🔗 Shape ${i} has no image element, skipping`);
                continue;
            }

            // For the old structure, we need to calculate coordinates from bounds and relative position
            let x, y, width, height;

            if (shape.x !== undefined && shape.y !== undefined) {
                // New structure with direct coordinates
                x = shape.x;
                y = shape.y;
                width = shape.width;
                height = shape.height;
            } else if (shape.bounds && shape.relativeX !== undefined && shape.relativeY !== undefined) {
                // Old structure - need to calculate from bounds and relative position
                console.log(`🔗 Using old structure for shape ${i}, calculating coordinates from bounds`);
                const originalObject = arguments[1]; // Get originalObject from function arguments

                // Use the CURRENT displayed size of the original object (what user sees)
                const currentWidth = originalObject.width || 200;
                const currentHeight = originalObject.height || 200;
                const currentScale = originalObject.scale || 1;
                const displayWidth = currentWidth * currentScale;
                const displayHeight = currentHeight * currentScale;

                console.log(`🔗 Original object current size: ${currentWidth}x${currentHeight}, scale: ${currentScale}, display: ${displayWidth}x${displayHeight}`);

                // Calculate absolute position based on current size
                x = originalObject.x + (shape.relativeX - 0.5) * displayWidth;
                y = originalObject.y + (shape.relativeY - 0.5) * displayHeight;

                // Scale the element size proportionally to the current object size
                const scaleFactorX = displayWidth / (originalObject.originalWidth || originalObject.naturalWidth || currentWidth);
                const scaleFactorY = displayHeight / (originalObject.originalHeight || originalObject.naturalHeight || currentHeight);

                width = shape.bounds.width * scaleFactorX;
                height = shape.bounds.height * scaleFactorY;

                console.log(`🔗 Scale factors: ${scaleFactorX}, ${scaleFactorY}`);
                console.log(`🔗 Calculated coordinates for shape ${i}: x=${x}, y=${y}, width=${width}, height=${height}`);
            } else {
                console.error(`🔗 Shape ${i} has no valid coordinate information`);
                continue;
            }

            // Validate coordinates
            if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height)) {
                console.error(`🔗 Shape ${i} has invalid coordinates:`, { x, y, width, height });
                console.warn(`🔗 Skipping shape ${i} due to invalid coordinates`);
                continue;
            }

            // Ensure the image has naturalWidth and naturalHeight
            if (!imageElement.naturalWidth || !imageElement.naturalHeight) {
                console.warn(`🔗 Shape ${i} image missing natural dimensions, setting defaults`);
                imageElement.naturalWidth = imageElement.width || width || 100;
                imageElement.naturalHeight = imageElement.height || height || 100;
            }

            console.log(`🔗 Creating object for shape ${i}: ${shape.name || shape.element || 'Unnamed'} at (${x}, ${y})`);

            try {
                // Use the positioning from our structure
                const newObject = window.createImageObject(imageElement, {
                    x: x,
                    y: y,
                    width: width,
                    height: height,
                    scale: 1.0, // We've already calculated the size
                    rotation: shape.rotation || 0,
                    imageUrl: null, // We'll use the data URL from the image
                    isSelected: false,
                // Preserve some properties from original
                opacity: originalObject.opacity,
                shadowMode: originalObject.shadowMode,
                shadowColor: originalObject.shadowColor,
                shadowOffsetX: originalObject.shadowOffsetX,
                shadowOffsetY: originalObject.shadowOffsetY,
                shadowBlur: originalObject.shadowBlur,
                shadowOpacity: originalObject.shadowOpacity,
                // Mark as ungrouped shape
                isUngroupedShape: true,
                originalSvgId: originalObject.id,
                shapeIndex: i,
                shapeName: shape.name || `Shape ${i + 1}`
                });

                newObjects.push(newObject);
                console.log(`🔗 Successfully created object for shape ${i}`);
            } catch (error) {
                console.error(`🔗 Error creating object for shape ${i}:`, error);
                console.warn(`🔗 Skipping shape ${i} due to creation error`);
            }
        }

        console.log(`🔗 Created ${newObjects.length} objects from ${shapes.length} shapes`);
        return newObjects;
    }

    replaceWithShapes(originalObject, newObjects) {
        if (!window.canvasObjects || !Array.isArray(window.canvasObjects)) {
            console.error('🔗 canvasObjects not available');
            return;
        }

        // Validate new objects
        if (!newObjects || newObjects.length === 0) {
            console.error('🔗 No new objects to replace with');
            return;
        }

        // Find the index of the original object
        const originalIndex = window.canvasObjects.findIndex(obj => obj.id === originalObject.id);
        if (originalIndex === -1) {
            console.error('🔗 Original object not found in canvas objects');
            return;
        }

        console.log(`🔗 Replacing object at index ${originalIndex} with ${newObjects.length} new objects`);

        // Clear selection state from all objects first
        window.canvasObjects.forEach(obj => obj.isSelected = false);

        // Remove the original SVG object
        window.canvasObjects.splice(originalIndex, 1);

        // Add all new shape objects at the same position
        window.canvasObjects.splice(originalIndex, 0, ...newObjects);

        // Ensure the new objects have proper properties
        newObjects.forEach((obj, index) => {
            if (!obj.type) obj.type = 'image';
            if (!obj.id) obj.id = Date.now() + index;
            obj.isSelected = false; // Clear selection initially
        });

        // Select the first new object safely
        if (newObjects.length > 0 && originalIndex < window.canvasObjects.length) {
            window.selectedObjectIndex = originalIndex;
            const selectedObj = window.canvasObjects[originalIndex];
            if (selectedObj) {
                selectedObj.isSelected = true;
                console.log(`🔗 Selected new object at index ${originalIndex}:`, selectedObj.type, selectedObj.id);
            }
        } else {
            // If something went wrong, clear selection
            window.selectedObjectIndex = -1;
            console.warn('🔗 Could not select new object, clearing selection');
        }

        // Update canvas first (safer)
        if (window.update) {
            window.update();
        }

        // Then update UI with error handling
        try {
            if (window.updateUIFromSelectedObject) {
                window.updateUIFromSelectedObject();
            }
        } catch (error) {
            console.error('🔗 Error updating UI after ungrouping:', error);
            // Try to recover by clearing selection
            window.selectedObjectIndex = -1;
            window.canvasObjects.forEach(obj => obj.isSelected = false);
            if (window.updateUIFromSelectedObject) {
                try {
                    window.updateUIFromSelectedObject();
                } catch (e) {
                    console.error('🔗 Failed to recover UI state:', e);
                }
            }
        }

        // Save state for undo/redo
        if (window.saveState) {
            window.saveState('Ungroup SVG');
        }
    }
}

// Initialize the SVG ungrouper when the page loads
function initializeSVGUngrouper() {
    console.log('🔗 Initializing SVG Ungrouper Module');
    try {
        window.svgUngrouper = new SVGUngrouperModule();
        console.log('🔗 SVG Ungrouper Module initialized successfully');

        // Test button visibility immediately
        setTimeout(() => {
            if (window.svgUngrouper) {
                window.svgUngrouper.updateUngroupButtonVisibility();
            }
        }, 1000);
    } catch (error) {
        console.error('🔗 Error initializing SVG Ungrouper Module:', error);
    }
}

document.addEventListener('DOMContentLoaded', initializeSVGUngrouper);

// Also initialize if the script is loaded after DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSVGUngrouper);
} else {
    initializeSVGUngrouper();
}

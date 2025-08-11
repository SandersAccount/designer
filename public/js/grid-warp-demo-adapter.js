// grid-warp-demo-adapter.js
// Extracted and adapted from demo-warp-grid.html for integration in the design editor.
// This module provides grid warp overlay logic, control point handling, and SVG path warping.

(function(window) {
    // --- State ---
    let controlPoints = [];
    let originalControlPoints = [];
    let svgPaths = [];
    let originalSvgPaths = [];
    let isDragging = false;
    let currentPoint = null;
    let gridBounds = null;
    let gridPadding = 60;

    // DOM elements (to be set by the editor)
    let svgCanvas, svgGroup, controlPath, controlPointsGroup, gridGroup;

    // --- API ---
    const GridWarpDemo = {
        init({
            svgCanvasEl, svgGroupEl, controlPathEl, controlPointsGroupEl, gridGroupEl, padding
        }) {
            svgCanvas = svgCanvasEl;
            svgGroup = svgGroupEl;
            controlPath = controlPathEl;
            controlPointsGroup = controlPointsGroupEl;
            gridGroup = gridGroupEl;
            gridPadding = padding || 60;
            setupEventListeners();
        },
        setPaths(paths, originals) {
            svgPaths = paths;
            originalSvgPaths = originals;
        },
        createGrid(customBounds) {
            controlPointsGroup.innerHTML = '';
            gridGroup.innerHTML = '';
            controlPoints = [];
            originalControlPoints = [];
            // Centered grid logic
            const canvasCenterX = 400;
            const canvasCenterY = 400;
            let defaultWidth = 300;
            let defaultHeight = 300;
            let defaultX = canvasCenterX - defaultWidth / 2;
            let defaultY = canvasCenterY - defaultHeight / 2;
            let calculatedBounds = { x: defaultX, y: defaultY, width: defaultWidth, height: defaultHeight };
            let offsetX = 0, offsetY = 0;
            if (svgGroup.hasChildNodes() && svgPaths.length > 0) {
                try {
                    const bbox = svgGroup.getBBox();
                    if (bbox && isFinite(bbox.x) && isFinite(bbox.y) && isFinite(bbox.width) && isFinite(bbox.height)) {
                        const contentCenterX = bbox.x + bbox.width / 2;
                        const contentCenterY = bbox.y + bbox.height / 2;
                        offsetX = canvasCenterX - contentCenterX;
                        offsetY = canvasCenterY - contentCenterY;
                        const minDim = 10;
                        let effectiveWidth = Math.max(minDim, bbox.width);
                        let effectiveHeight = Math.max(minDim, bbox.height);
                        calculatedBounds = {
                            x: (bbox.x + offsetX) - gridPadding,
                            y: (bbox.y + offsetY) - gridPadding,
                            width: effectiveWidth + 2 * gridPadding,
                            height: effectiveHeight + 2 * gridPadding
                        };
                    }
                } catch (e) { /* fallback to default */ }
            }
            if (customBounds) calculatedBounds = customBounds;
            gridBounds = calculatedBounds;
            // Grid creation
            const cols = 3, rows = 2;
            const stepX = gridBounds.width / (cols - 1);
            const stepY = gridBounds.height / (rows - 1);
            for (let col = 0; col < cols; col++) {
                const x = gridBounds.x + col * stepX;
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', x);
                line.setAttribute('y1', gridBounds.y);
                line.setAttribute('x2', x);
                line.setAttribute('y2', gridBounds.y + gridBounds.height);
                line.setAttribute('class', 'control-line');
                gridGroup.appendChild(line);
            }
            for (let row = 0; row < rows; row++) {
                const y = gridBounds.y + row * stepY;
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', gridBounds.x);
                line.setAttribute('y1', y);
                line.setAttribute('x2', gridBounds.x + gridBounds.width);
                line.setAttribute('y2', y);
                line.setAttribute('class', 'control-line');
                gridGroup.appendChild(line);
            }
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const x = gridBounds.x + col * stepX;
                    const y = gridBounds.y + row * stepY;
                    const point = [x, y];
                    controlPoints.push(point);
                    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    circle.setAttribute('cx', x);
                    circle.setAttribute('cy', y);
                    circle.setAttribute('r', 8);
                    circle.setAttribute('class', 'control-point');
                    circle.setAttribute('data-index', controlPoints.length - 1);
                    controlPointsGroup.appendChild(circle);
                }
            }
            if (controlPoints.length > 0) {
                originalControlPoints = JSON.parse(JSON.stringify(controlPoints));
            } else {
                originalControlPoints = [];
            }
            drawControlShape();
        },
        drawControlShape,
        warpSvgPaths,
        resetControlPoints,
        getControlPoints: () => controlPoints,
        setControlPoints: (pts) => { controlPoints = pts; drawControlShape(); warpSvgPaths(); },
        getGridBounds: () => gridBounds,
        setPadding: (pad) => { gridPadding = pad; },
    };

    function drawControlShape(element = controlPath, V = controlPoints) {
        if (!V || V.length === 0) { element.setAttribute('d', ''); return; }
        const path = [`M${V[0][0]} ${V[0][1]}`];
        const cols = 3; const rows = 2;
        if (cols < 2 || rows < 2) {
            if (V.length === 1) path.push(`L${V[0][0]} ${V[0][1]}`);
            element.setAttribute('d', path.join(' '));
            return;
        }
        for (let col = 1; col < cols; col++) if (V[col]) path.push(`L${V[col][0]} ${V[col][1]}`);
        for (let row = 1; row < rows; row++) {
            const index = row * cols + (cols - 1);
            if (index < V.length && V[index]) path.push(`L${V[index][0]} ${V[index][1]}`);
        }
        for (let col = cols - 2; col >= 0; col--) {
            const index = (rows - 1) * cols + col;
            if (index >= 0 && index < V.length && V[index]) path.push(`L${V[index][0]} ${V[index][1]}`);
        }
        for (let row = rows - 2; row >= 0; row--) {
            const index = row * cols;
            if (index >= 0 && index < V.length && V[index]) path.push(`L${V[index][0]} ${V[index][1]}`);
        }
        element.setAttribute('d', path.join(' '));
    }

    function warpSvgPaths() {
        if (!svgPaths.length || !controlPoints.length || !gridBounds) return;
        for (let i = 0; i < svgPaths.length; i++) {
            if (originalSvgPaths[i] && svgPaths[i]) {
                svgPaths[i].setAttribute('d', originalSvgPaths[i]);
            }
        }
        for (let i = 0; i < svgPaths.length; i++) {
            const pathElement = svgPaths[i];
            const originalPath = originalSvgPaths[i];
            if (!originalPath || !pathElement) continue;
            const pathData = parseSvgPath(originalPath);
            const warpedData = warpPathData(pathData);
            pathElement.setAttribute('d', warpedData);
        }
    }

    function parseSvgPath(pathData) {
        const commands = pathData.match(/[a-zA-Z][^a-zA-Z]*/g) || [];
        const segments = [];
        let currentX = 0; let currentY = 0;
        for (const cmd of commands) {
            const type = cmd[0];
            let args = cmd.slice(1).trim().split(/[,\s]+/).filter(s => s !== '').map(parseFloat);
            if (args.every(n => !isNaN(n))) {
                segments.push({ type, args });
                switch(type) {
                    case 'm': if(args.length >= 2) { currentX += args[args.length-2]; currentY += args[args.length-1]; } break;
                    case 'M': if(args.length >= 2) { currentX = args[args.length-2]; currentY = args[args.length-1]; } break;
                    case 'L': case 'C': case 'S': case 'Q': case 'T': if(args.length >= 2) { currentX = args[args.length-2]; currentY = args[args.length-1]; } break;
                    case 'H': currentX = args[args.length-1]; break;
                    case 'V': currentY = args[args.length-1]; break;
                    case 'Z': case 'z': break;
                    case 'l': case 'c': case 's': case 'q': case 't': if(args.length >= 2) { currentX += args[args.length-2]; currentY += args[args.length-1]; } break;
                    case 'h': currentX += args[args.length-1]; break;
                    case 'v': currentY += args[args.length-1]; break;
                    case 'a': if(args.length >= 7) { currentX += args[args.length-2]; currentY += args[args.length-1]; } break;
                    case 'A': if(args.length >= 7) { currentX = args[args.length-2]; currentY = args[args.length-1]; } break;
                }
            } else {
                if (/^[Zz]$/.test(type) && args.length === 0) {
                    segments.push({ type, args });
                }
            }
        }
        return segments;
    }

    function warpPathData(pathData) {
        const warpedSegments = [];
        let lastWarpedX = 0, lastWarpedY = 0, startPointX = 0, startPointY = 0;
        for (const segment of pathData) {
            const type = segment.type;
            let args = [...segment.args];
            let warpedArgs = [];
            if (type.toUpperCase() === 'M' && args.length >= 2) {
                const mx = args[0], my = args[1];
                const warpedM = repositionPoint(mx, my);
                startPointX = warpedM[0]; startPointY = warpedM[1];
            } else if (type.toUpperCase() === 'M') {
                startPointX = lastWarpedX; startPointY = lastWarpedY;
            }
            switch (type.toUpperCase()) {
                case 'M': case 'L': case 'T':
                    for (let i = 0; i < args.length; i += 2) {
                        const x = args[i], y = args[i+1];
                        const warped = repositionPoint(x, y);
                        warpedArgs.push(warped[0], warped[1]);
                        lastWarpedX = warped[0]; lastWarpedY = warped[1];
                    }
                    break;
                case 'H':
                    for (let i = 0; i < args.length; i++) {
                        const warped = repositionPoint(args[i], lastWarpedY);
                        warpedArgs.push(warped[0]);
                        lastWarpedX = warped[0];
                    }
                    break;
                case 'V':
                    for (let i = 0; i < args.length; i++) {
                        const warped = repositionPoint(lastWarpedX, args[i]);
                        warpedArgs.push(warped[1]);
                        lastWarpedY = warped[1];
                    }
                    break;
                case 'C':
                    for (let i = 0; i < args.length; i += 6) {
                        const warped1 = repositionPoint(args[i], args[i+1]);
                        const warped2 = repositionPoint(args[i+2], args[i+3]);
                        const warped = repositionPoint(args[i+4], args[i+5]);
                        warpedArgs.push(warped1[0], warped1[1], warped2[0], warped2[1], warped[0], warped[1]);
                        lastWarpedX = warped[0]; lastWarpedY = warped[1];
                    }
                    break;
                case 'S':
                    for (let i = 0; i < args.length; i += 4) {
                        const warped2 = repositionPoint(args[i], args[i+1]);
                        const warped = repositionPoint(args[i+2], args[i+3]);
                        warpedArgs.push(warped2[0], warped2[1], warped[0], warped[1]);
                        lastWarpedX = warped[0]; lastWarpedY = warped[1];
                    }
                    break;
                case 'Q':
                    for (let i = 0; i < args.length; i += 4) {
                        const warped1 = repositionPoint(args[i], args[i+1]);
                        const warped = repositionPoint(args[i+2], args[i+3]);
                        warpedArgs.push(warped1[0], warped1[1], warped[0], warped[1]);
                        lastWarpedX = warped[0]; lastWarpedY = warped[1];
                    }
                    break;
                case 'A':
                    for (let i = 0; i < args.length; i += 7) {
                        const warped = repositionPoint(args[i+5], args[i+6]);
                        warpedArgs.push(args[i], args[i+1], args[i+2], args[i+3], args[i+4], warped[0], warped[1]);
                        lastWarpedX = warped[0]; lastWarpedY = warped[1];
                    }
                    break;
                case 'Z':
                    warpedArgs = [];
                    lastWarpedX = startPointX; lastWarpedY = startPointY;
                    break;
                default:
                    warpedArgs = args;
                    if (args.length >= 2) {
                        lastWarpedX = args[args.length-2];
                        lastWarpedY = args[args.length-1];
                    }
                    break;
            }
            warpedSegments.push({ type, args: warpedArgs });
        }
        return warpedSegments.map(segment => {
            function formatNum(n) { return (Math.abs(n) < 1e-6 ? 0 : +n.toFixed(6)); }
            const formattedArgs = segment.args.map(formatNum);
            const commandType = segment.type;
            if (commandType.toUpperCase() === 'Z') return commandType;
            return `${commandType}${formattedArgs.length > 0 ? ' ' : ''}${formattedArgs.join(' ')}`;
        }).join(' ');
    }

    function repositionPoint(x, y) {
        if (typeof x !== 'number' || !isFinite(x) || typeof y !== 'number' || !isFinite(y)) return [x, y];
        if (!gridBounds || controlPoints.length === 0 || !isFinite(gridBounds.width) || gridBounds.width <= 0 || !isFinite(gridBounds.height) || gridBounds.height <= 0) return [x, y];
        const cols = 3; const rows = 2;
        const nx = (x - gridBounds.x) / gridBounds.width;
        const ny = (y - gridBounds.y) / gridBounds.height;
        const u = Math.max(0, Math.min(1, nx));
        const v = Math.max(0, Math.min(1, ny));
        const epsilon = 1e-9;
        const cellX = Math.min(u * (cols - 1), cols - 1 - epsilon);
        const cellY = Math.min(v * (rows - 1), rows - 1 - epsilon);
        const ix = Math.floor(cellX);
        const iy = Math.floor(cellY);
        const fx = cellX - ix;
        const fy = cellY - iy;
        const i00 = iy * cols + ix;
        const i10 = i00 + 1;
        const i01 = i00 + cols;
        const i11 = i01 + 1;
        if (i00 < 0 || i00 >= controlPoints.length || i10 < 0 || i10 >= controlPoints.length || i01 < 0 || i01 >= controlPoints.length || i11 < 0 || i11 >= controlPoints.length) return [x, y];
        const p00 = controlPoints[i00];
        const p10 = controlPoints[i10];
        const p01 = controlPoints[i01];
        const p11 = controlPoints[i11];
        if (!p00 || !p10 || !p01 || !p11) return [x, y];
        if (!Array.isArray(p00) || p00.length < 2 || !Array.isArray(p10) || p10.length < 2 || !Array.isArray(p01) || p01.length < 2 || !Array.isArray(p11) || p11.length < 2) return [x, y];
        const ix0 = p00[0] * (1 - fx) + p10[0] * fx;
        const ix1 = p01[0] * (1 - fx) + p11[0] * fx;
        const warpedX = ix0 * (1 - fy) + ix1 * fy;
        const iy0 = p00[1] * (1 - fx) + p10[1] * fx;
        const iy1 = p01[1] * (1 - fx) + p11[1] * fx;
        const warpedY = iy0 * (1 - fy) + iy1 * fy;
        if (!isFinite(warpedX) || !isFinite(warpedY)) return [x, y];
        return [warpedX, warpedY];
    }

    function resetControlPoints() {
        if (!originalControlPoints || originalControlPoints.length === 0 || controlPoints.length === 0) return;
        controlPoints = JSON.parse(JSON.stringify(originalControlPoints));
        const circles = controlPointsGroup.querySelectorAll('circle');
        circles.forEach((circle, index) => {
            if (controlPoints[index]) {
                circle.setAttribute('cx', controlPoints[index][0]);
                circle.setAttribute('cy', controlPoints[index][1]);
            }
        });
        drawControlShape();
        warpSvgPaths();
    }

    function setupEventListeners() {
        if (!controlPointsGroup) return;
        controlPointsGroup.addEventListener('mousedown', function(e) {
            if (e.target.classList.contains('control-point')) {
                isDragging = true;
                currentPoint = parseInt(e.target.getAttribute('data-index'));
                svgCanvas.style.cursor = 'grabbing';
                e.preventDefault();
            }
        });
        document.addEventListener('mousemove', function(e) {
            if (isDragging && currentPoint !== null && currentPoint >= 0 && currentPoint < controlPoints.length) {
                const svgRect = svgCanvas.getBoundingClientRect();
                const scaleX = 800 / svgRect.width;
                const scaleY = 800 / svgRect.height;
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                const x = (clientX - svgRect.left) * scaleX;
                const y = (clientY - svgRect.top) * scaleY;
                controlPoints[currentPoint] = [x, y];
                const circle = controlPointsGroup.querySelector(`circle[data-index="${currentPoint}"]`);
                if (circle) {
                    circle.setAttribute('cx', x);
                    circle.setAttribute('cy', y);
                }
                drawControlShape();
                warpSvgPaths();
            }
        });
        document.addEventListener('mouseup', function(e) {
            if (isDragging) {
                isDragging = false;
                currentPoint = null;
                svgCanvas.style.cursor = 'default';
            }
        });
        document.addEventListener('mouseleave', function(e) {
            if (isDragging) {
                isDragging = false;
                currentPoint = null;
                svgCanvas.style.cursor = 'default';
            }
        });
        controlPointsGroup.addEventListener('touchstart', function(e) {
            if (e.target.classList.contains('control-point')) {
                isDragging = true;
                currentPoint = parseInt(e.target.getAttribute('data-index'));
                svgCanvas.style.cursor = 'grabbing';
                e.preventDefault();
            }
        }, { passive: false });
        document.addEventListener('touchmove', function(e) {
            if (isDragging && currentPoint !== null && currentPoint >= 0 && currentPoint < controlPoints.length) {
                e.preventDefault();
                const simulatedEvent = { touches: e.touches, clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
                document.dispatchEvent(new MouseEvent('mousemove', simulatedEvent));
            }
        }, { passive: false });
        document.addEventListener('touchend', function(e) {
            if (isDragging) {
                isDragging = false;
                currentPoint = null;
                svgCanvas.style.cursor = 'default';
            }
        });
        document.addEventListener('touchcancel', function(e) {
            if (isDragging) {
                isDragging = false;
                currentPoint = null;
                svgCanvas.style.cursor = 'default';
            }
        });
    }

    window.GridWarpDemo = GridWarpDemo;
})(window);

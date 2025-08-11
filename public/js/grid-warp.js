// Modularized Grid Warp Effect for Design Editor
// Exports: GridWarp object with init, update, reset, and destroy methods

const GridWarp = (() => {
    // Internal state
    let controlPoints = [], originalControlPoints = [], gridBounds = null, gridPadding = 60;
    let svgPaths = [], originalSvgPaths = [], svgGroup = null, controlPointsGroup = null, gridGroup = null, controlPath = null, svgCanvas = null;
    let isDragging = false, currentPoint = null;
    let cols = 3, rows = 2;

    function createGrid(boundsOverride) {
        if (!controlPointsGroup || !gridGroup) return;
        controlPointsGroup.innerHTML = '';
        gridGroup.innerHTML = '';
        controlPoints = [];
        originalControlPoints = [];
        // Use boundsOverride if provided, else fall back to default
        let calculatedBounds;
        if (boundsOverride && boundsOverride.width && boundsOverride.height) {
            calculatedBounds = {
                x: boundsOverride.x,
                y: boundsOverride.y,
                width: boundsOverride.width,
                height: boundsOverride.height
            };
        } else {
            const canvasCenterX = 400, canvasCenterY = 400;
            let defaultWidth = 300, defaultHeight = 300;
            let defaultX = canvasCenterX - defaultWidth / 2, defaultY = canvasCenterY - defaultHeight / 2;
            calculatedBounds = { x: defaultX, y: defaultY, width: defaultWidth, height: defaultHeight };
        }
        gridBounds = calculatedBounds;
        const stepX = gridBounds.width / (cols - 1), stepY = gridBounds.height / (rows - 1);
        for (let col = 0; col < cols; col++) {
            const x = gridBounds.x + col * stepX;
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x); line.setAttribute('y1', gridBounds.y);
            line.setAttribute('x2', x); line.setAttribute('y2', gridBounds.y + gridBounds.height);
            line.setAttribute('stroke', 'red');
            line.setAttribute('stroke-width', '2');
            line.setAttribute('class', 'control-line');
            gridGroup.appendChild(line);
        }
        for (let row = 0; row < rows; row++) {
            const y = gridBounds.y + row * stepY;
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', gridBounds.x); line.setAttribute('y1', y);
            line.setAttribute('x2', gridBounds.x + gridBounds.width); line.setAttribute('y2', y);
            line.setAttribute('stroke', 'red');
            line.setAttribute('stroke-width', '2');
            line.setAttribute('class', 'control-line');
            gridGroup.appendChild(line);
        }
        // Optionally add a transparent rect for debug (not black!)
        // (REMOVED as per user request)
        // if (gridBounds) {
        //     const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        //     rect.setAttribute('x', gridBounds.x);
        //     rect.setAttribute('y', gridBounds.y);
        //     rect.setAttribute('width', gridBounds.width);
        //     rect.setAttribute('height', gridBounds.height);
        //     rect.setAttribute('fill', 'none');
        //     rect.setAttribute('stroke', 'none');
        //     rect.setAttribute('pointer-events', 'none');
        //     gridGroup.appendChild(rect);
        // }
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = gridBounds.x + col * stepX;
                const y = gridBounds.y + row * stepY;
                const point = [x, y];
                controlPoints.push(point);
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', x); circle.setAttribute('cy', y); circle.setAttribute('r', 8);
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
    }

    function drawControlShape(element = controlPath, V = controlPoints) {
        if (!element || !V || V.length === 0) return;
        const path = [`M${V[0][0]} ${V[0][1]}`];
        if (cols < 2 || rows < 2) {
            if (V.length === 1) path.push(`L${V[0][0]} ${V[0][1]}`);
            element.setAttribute('d', path.join(' '));
            element.setAttribute('fill', 'none');
            element.setAttribute('stroke', 'red');
            element.setAttribute('stroke-width', '2');
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
        element.setAttribute('fill', 'none');
        element.setAttribute('stroke', 'red');
        element.setAttribute('stroke-width', '2');
    }

    function warpSvgPaths() {
        if (!svgPaths.length || !controlPoints.length || !gridBounds) return;
        for (let i = 0; i < svgPaths.length; i++) {
            if(originalSvgPaths[i] && svgPaths[i]) {
                svgPaths[i].setAttribute('d', originalSvgPaths[i]);
            }
        }
        for (let i = 0; i < svgPaths.length; i++) {
            const pathElement = svgPaths[i];
            const originalPath = originalSvgPaths[i];
            if(!originalPath || !pathElement) continue;
            const pathData = parseSvgPath(originalPath);
            const warpedData = warpPathData(pathData);
            pathElement.setAttribute('d', warpedData);
        }
    }

    function parseSvgPath(pathData) {
        const commands = pathData.match(/[a-zA-Z][^a-zA-Z]*/g) || [];
        const segments = [];
        let currentX = 0, currentY = 0;
        for (const cmd of commands) {
            const type = cmd[0];
            let args = cmd.slice(1).trim().split(/\s|,/).filter(s => s !== '').map(parseFloat);
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
        if (!gridBounds || controlPoints.length === 0 || !isFinite(gridBounds.width) || gridBounds.width <= 0 || !isFinite(gridBounds.height) || gridBounds.height <= 0) return [x, y];
        const nx = (x - gridBounds.x) / gridBounds.width;
        const ny = (y - gridBounds.y) / gridBounds.height;
        const u = Math.max(0, Math.min(1, nx));
        const v = Math.max(0, Math.min(1, ny));
        const epsilon = 1e-9;
        const cellX = Math.min(u * (cols - 1), cols - 1 - epsilon);
        const cellY = Math.min(v * (rows - 1), rows - 1 - epsilon);
        const ix = Math.floor(cellX), iy = Math.floor(cellY);
        const fx = cellX - ix, fy = cellY - iy;
        const i00 = iy * cols + ix, i10 = i00 + 1, i01 = i00 + cols, i11 = i01 + 1;
        if ([i00,i10,i01,i11].some(idx => idx < 0 || idx >= controlPoints.length)) return [x, y];
        const p00 = controlPoints[i00], p10 = controlPoints[i10], p01 = controlPoints[i01], p11 = controlPoints[i11];
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
        if (!controlPointsGroup || !svgCanvas) return;
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
                const x = (e.clientX - svgRect.left) * scaleX;
                const y = (e.clientY - svgRect.top) * scaleY;
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
    }

    // --- Public API ---
    return {
        init({svgCanvasEl, svgGroupEl, controlPointsGroupEl, gridGroupEl, controlPathEl, svgPathsArr, originalSvgPathsArr, padding, bounds}) {
            svgCanvas = svgCanvasEl;
            svgGroup = svgGroupEl;
            controlPointsGroup = controlPointsGroupEl;
            gridGroup = gridGroupEl;
            controlPath = controlPathEl;
            svgPaths = svgPathsArr;
            originalSvgPaths = originalSvgPathsArr;
            gridPadding = padding;
            createGrid(bounds);
            setupEventListeners();
        },
        update({bounds} = {}) {
            createGrid(bounds);
        },
        reset: resetControlPoints,
        destroy() {
            // Remove event listeners and cleanup
            if (controlPointsGroup) controlPointsGroup.innerHTML = '';
            if (gridGroup) gridGroup.innerHTML = '';
            if (controlPath) controlPath.setAttribute('d', '');
            svgCanvas = svgGroup = controlPointsGroup = gridGroup = controlPath = null;
            svgPaths = originalSvgPaths = [];
            controlPoints = originalControlPoints = [];
            gridBounds = null;
            isDragging = false;
            currentPoint = null;
        }
    };
})();

export default GridWarp;

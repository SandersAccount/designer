// Decoration Effects Module
const decorationModule = {
    // Active decoration type
    activeDecorationType: null,

    // Default settings for each decoration type
    settings: {
        horizontalLines: {
            weight: 3,
            distance: 7,
            color: '#0000FF',
            coverage: 100 // Percentage to expand decoration bounds (100% = normal text bounds)
        },
        colorCut: {
            distance: 21,
            color: '#0000FF',
            fillDirection: 'top', // 'top' or 'bottom'
            coverage: 100 // Percentage to expand decoration bounds
        },
        obliqueLines: {
            weight: 4,
            distance: 3,
            color: '#0000FF',
            coverage: 100 // Percentage to expand decoration bounds
        },
        fadingColorCut: {
            weight: 5,
            distance: 45,
            color: '#0000FF',
            fillDirection: 'top', // 'top' or 'bottom'
            coverage: 100 // Percentage to expand decoration bounds
        },
        fadingLinesCut: {
            weight: 5,
            distance: 45,
            color: '#0000FF',
            fillDirection: 'top', // 'top' or 'bottom'
            coverage: 100 // Percentage to expand decoration bounds
        },
        diagonalLines: {
            weight: 4,
            distance: 3,
            color: '#0000FF',
            coverage: 100 // Percentage to expand decoration bounds
        }
    },

    // Set the active decoration type
    setActiveDecorationType(type) {
        this.activeDecorationType = type;
    },

    // Update settings for a decoration type
    updateSettings(type, newSettings) {
        if (this.settings[type]) {
            Object.assign(this.settings[type], newSettings);
        }
    },

    // Helper function to convert hex color to rgba
    hexToRgba(hex, alpha = 1) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    },

    // Get current UI values for decoration settings
    getCurrentUISettings(decorationType, textObj = null) {
        const settings = {};

        switch (decorationType) {
            case 'horizontalLines':
                // If textObj is provided, use its properties instead of UI elements
                if (textObj) {
                    settings.weight = textObj.hLineWeight || 3;
                    settings.distance = textObj.hLineDist || 7;
                    settings.color = textObj.hLineColor || '#0000FF';
                    settings.opacity = textObj.hLineOpacity || 100;
                    settings.coverage = textObj.hLineCoverage || 100;
                } else {
                    const hWeight = document.getElementById('hWeight');
                    const hDistance = document.getElementById('hDistance');
                    const hColor = document.getElementById('hColor');
                    const hOpacity = document.getElementById('hOpacity');
                    const hCoverage = document.getElementById('hCoverage');
                    if (hWeight && hDistance && hColor && hOpacity) {
                        settings.weight = parseInt(hWeight.value);
                        settings.distance = parseInt(hDistance.value);
                        settings.color = hColor.value;
                        settings.opacity = parseInt(hOpacity.value);
                        if (hCoverage) settings.coverage = parseInt(hCoverage.value);
                    }
                }
                break;

            case 'colorCut':
                // If textObj is provided, use its properties instead of UI elements
                if (textObj) {
                    settings.distance = textObj.ccDist || 21;
                    settings.color = textObj.ccColor || '#0000FF';
                    settings.opacity = textObj.ccOpacity || 100;
                    settings.fillDirection = textObj.ccFillDir || 'top';
                    settings.coverage = textObj.ccCoverage || 100;
                } else {
                    const ccDistance = document.getElementById('ccDistance');
                    const ccColor = document.getElementById('ccColor');
                    const ccOpacity = document.getElementById('ccOpacity');
                    const ccFillTop = document.getElementById('ccFillTop');
                    const ccCoverage = document.getElementById('ccCoverage');
                    if (ccDistance && ccColor && ccOpacity && ccFillTop) {
                        settings.distance = parseInt(ccDistance.value);
                        settings.color = ccColor.value;
                        settings.opacity = parseInt(ccOpacity.value);
                        settings.fillDirection = ccFillTop.checked ? 'top' : 'bottom';
                        if (ccCoverage) settings.coverage = parseInt(ccCoverage.value);
                    }
                }
                break;

            case 'obliqueLines':
            case 'diagonalLines':
                // If textObj is provided, use its properties instead of UI elements
                if (textObj) {
                    settings.weight = textObj.oLineWeight || 4;
                    settings.distance = textObj.oLineDist || 3;
                    settings.color = textObj.oLineColor || '#0000FF';
                    settings.opacity = textObj.oOpacity || 100;
                    settings.coverage = textObj.oCoverage || 100;
                } else {
                    const oWeight = document.getElementById('oWeight');
                    const oDistance = document.getElementById('oDistance');
                    const oColor = document.getElementById('oColor');
                    const oOpacity = document.getElementById('oOpacity');
                    const oCoverage = document.getElementById('oCoverage');
                    if (oWeight && oDistance && oColor && oOpacity) {
                        settings.weight = parseInt(oWeight.value);
                        settings.distance = parseInt(oDistance.value);
                        settings.color = oColor.value;
                        settings.opacity = parseInt(oOpacity.value);
                        if (oCoverage) settings.coverage = parseInt(oCoverage.value);
                    }
                }
                break;

            case 'fadingColorCut':
            case 'fadingLinesCut':
                console.log(`🔍 SETTINGS [fadingLinesCut]: Getting settings for ${decorationType}`);
                console.log(`🔍 SETTINGS [fadingLinesCut]: TextObj provided:`, !!textObj);
                // If textObj is provided, use its properties instead of UI elements
                if (textObj) {
                    console.log(`🔍 SETTINGS [fadingLinesCut]: TextObj properties:`, {
                        flcDist: textObj.flcDist,
                        flcColor: textObj.flcColor,
                        flcOpacity: textObj.flcOpacity,
                        flcDir: textObj.flcDir,
                        flcWeight: textObj.flcWeight,
                        flcSpacing: textObj.flcSpacing,
                        flcCoverage: textObj.flcCoverage
                    });
                    settings.distance = textObj.flcDist || 45;
                    settings.color = textObj.flcColor || '#0000FF';
                    settings.opacity = textObj.flcOpacity || 100;
                    settings.fillDirection = textObj.flcDir || 'top';
                    settings.weight = textObj.flcWeight || 5;
                    settings.spacing = textObj.flcSpacing || 10;
                    settings.coverage = textObj.flcCoverage || 100;
                    console.log('🎨 Fading Lines Text Object Settings:', settings);
                } else {
                    console.log(`🔍 SETTINGS [fadingLinesCut]: Getting settings from UI elements`);
                    const flcDistance = document.getElementById('flcDistance');
                    const flcColor = document.getElementById('flcColor');
                    const flcOpacity = document.getElementById('flcOpacity');
                    const flcFillTop = document.getElementById('flcFillTop');
                    const flcMaxWeight = document.getElementById('flcMaxWeight');
                    const flcSpacing = document.getElementById('flcSpacing');
                    const flcCoverage = document.getElementById('flcCoverage');

                    console.log(`🔍 SETTINGS [fadingLinesCut]: UI elements found:`, {
                        flcDistance: !!flcDistance,
                        flcColor: !!flcColor,
                        flcOpacity: !!flcOpacity,
                        flcFillTop: !!flcFillTop,
                        flcMaxWeight: !!flcMaxWeight,
                        flcSpacing: !!flcSpacing,
                        flcCoverage: !!flcCoverage
                    });

                    if (flcDistance && flcColor && flcOpacity && flcFillTop && flcMaxWeight && flcSpacing) {
                        console.log(`🔍 SETTINGS [fadingLinesCut]: UI element values:`, {
                            distance: flcDistance.value,
                            color: flcColor.value,
                            opacity: flcOpacity.value,
                            fillTop: flcFillTop.checked,
                            weight: flcMaxWeight.value,
                            spacing: flcSpacing.value,
                            coverage: flcCoverage ? flcCoverage.value : 'N/A'
                        });
                        settings.distance = parseInt(flcDistance.value);
                        settings.color = flcColor.value;
                        settings.opacity = parseInt(flcOpacity.value);
                        settings.fillDirection = flcFillTop.checked ? 'top' : 'bottom';
                        settings.weight = parseInt(flcMaxWeight.value);
                        settings.spacing = parseInt(flcSpacing.value);
                        if (flcCoverage) settings.coverage = parseInt(flcCoverage.value);
                        console.log('🎨 Fading Lines UI Settings:', settings);
                    } else {
                        console.log(`🔍 SETTINGS [fadingLinesCut]: ❌ MISSING UI ELEMENTS - cannot get settings`);
                    }
                }
                break;
        }

        console.log(`🔍 SETTINGS [${decorationType}]: Returning settings:`, settings);
        return settings;
    },

    // Apply decoration PATTERN ONLY to the text area
    // The calling function will handle clipping this pattern to the text shape
    applyDecoration(ctx, text, offsetX, offsetY, textObj = null) {
        const decorationCallId = Math.random().toString(36).substring(2, 8);
        console.log(`🎨 DECORATION [${decorationCallId}]: === STARTING DECORATION APPLICATION ===`);
        console.log(`🎨 DECORATION [${decorationCallId}]: Type: ${this.activeDecorationType}`);
        console.log(`🎨 DECORATION [${decorationCallId}]: Text object:`, text);
        console.log(`🎨 DECORATION [${decorationCallId}]: Offset: (${offsetX}, ${offsetY})`);
        console.log(`🎨 DECORATION [${decorationCallId}]: TextObj provided:`, !!textObj);
        console.log(`🎨 DECORATION [${decorationCallId}]: TextObj full object:`, textObj);
        if (textObj) {
            console.log(`🎨 DECORATION [${decorationCallId}]: TextObj decorationMode:`, textObj.decorationMode);
            console.log(`🎨 DECORATION [${decorationCallId}]: TextObj has Grid Distort:`, !!textObj.gridDistort);
            console.log(`🎨 DECORATION [${decorationCallId}]: TextObj fading lines properties:`, {
                flcDist: textObj.flcDist,
                flcColor: textObj.flcColor,
                flcWeight: textObj.flcWeight,
                flcSpacing: textObj.flcSpacing,
                flcDir: textObj.flcDir
            });
        }

        if (!this.activeDecorationType || !this.settings[this.activeDecorationType]) {
            console.log(`🎨 DECORATION [${decorationCallId}]: ❌ NO ACTIVE DECORATION TYPE OR SETTINGS`);
            return; // No active decoration
        }

        // Get current settings (from text object if provided, otherwise from UI)
        console.log(`🎨 DECORATION [${decorationCallId}]: About to call getCurrentUISettings with:`, {
            decorationType: this.activeDecorationType,
            textObjProvided: !!textObj
        });
        const currentSettings = this.getCurrentUISettings(this.activeDecorationType, textObj);
        console.log(`🎨 DECORATION [${decorationCallId}]: Current settings from UI/textObj:`, currentSettings);
        if (Object.keys(currentSettings).length > 0) {
            console.log(`🎨 DECORATION [${decorationCallId}]: Updating settings with:`, currentSettings);
            this.updateSettings(this.activeDecorationType, currentSettings);
            console.log(`🎨 DECORATION [${decorationCallId}]: Updated settings:`, this.settings[this.activeDecorationType]);
        } else {
            console.log(`🎨 DECORATION [${decorationCallId}]: ❌ NO CURRENT SETTINGS FOUND - using existing:`, this.settings[this.activeDecorationType]);
        }

        // Get measurements needed for pattern calculation
        const originalFont = ctx.font; // Store original font
        ctx.font = text.font;

        let textWidth, textHeight;

        // Check if custom bounds are provided for distorted text
        if (text.customBounds) {
            console.log('🎨 DECORATION: Using custom bounds for distorted text:', text.customBounds);
            textWidth = text.customBounds.width;
            textHeight = text.customBounds.height;

            // For circular text, use the diameter as both width and height
            if (text.customBounds.isCircular) {
                const diameter = text.customBounds.radius * 2;
                textWidth = diameter;
                textHeight = diameter;
                console.log('🎨 DECORATION: Circular text bounds - diameter:', diameter);
            }
            // For curved text, use the expanded bounds
            else if (text.customBounds.isCurved) {
                console.log('🎨 DECORATION: Curved text bounds - width:', textWidth, 'height:', textHeight, 'curve amount:', text.customBounds.curveAmount);
            }
            // For mesh warp text, use the expanded bounds
            else if (text.customBounds.isMeshWarp) {
                console.log('🎨 DECORATION: Mesh warp text bounds - width:', textWidth, 'height:', textHeight);
            }
            // For grid distort text, use the expanded bounds
            else if (text.customBounds.isGridDistort) {
                console.log('🎨 DECORATION: Grid distort text bounds - width:', textWidth, 'height:', textHeight, 'padding:', text.customBounds.gridPadding, 'intensity:', text.customBounds.intensity);
            }
        } else {
            // Use standard text measurements for normal text
            const metrics = ctx.measureText(text.text);
            const fontSizeValue = parseInt(text.font.match(/\d+/)[0]);
            textHeight = fontSizeValue * 1.2; // Approximate text height
            textWidth = metrics.width;

            // CRITICAL FIX: Account for letter spacing if available
            if (textObj && (textObj.letterSpacing || textObj._effectiveLetterSpacing)) {
                const letterSpacing = textObj._effectiveLetterSpacing || textObj.letterSpacing || 0;
                const letterCount = text.text.length;
                const totalLetterSpacing = letterSpacing * (letterCount - 1); // Space between letters
                textWidth += totalLetterSpacing;
                console.log(`🎨 DECORATION [${decorationCallId}]: LETTER SPACING FIX - Original width: ${metrics.width}, Letter spacing: ${letterSpacing}, Letter count: ${letterCount}, Total spacing: ${totalLetterSpacing}, Final width: ${textWidth}`);
            }

            console.log(`🎨 DECORATION [${decorationCallId}]: Using standard text bounds:`, { textWidth, textHeight });
        }

        ctx.font = originalFont; // Restore original font if needed elsewhere

        console.log(`🎨 DECORATION [${decorationCallId}]: Final dimensions: ${textWidth}x${textHeight}`);
        console.log(`🎨 DECORATION [${decorationCallId}]: Calling pattern drawing function for: ${this.activeDecorationType}`);

        // Call the specific pattern drawing function
        switch (this.activeDecorationType) {
            case 'horizontalLines':
                console.log(`🎨 DECORATION [${decorationCallId}]: ➡️ Calling drawHorizontalLinesPattern`);
                this.drawHorizontalLinesPattern(ctx, text, offsetX, offsetY, textWidth, textHeight, decorationCallId);
                break;
            case 'colorCut':
                console.log(`🎨 DECORATION [${decorationCallId}]: ➡️ Calling drawColorCutPattern`);
                this.drawColorCutPattern(ctx, text, offsetX, offsetY, textWidth, textHeight, decorationCallId);
                break;
            case 'obliqueLines':
            case 'diagonalLines':
                console.log(`🎨 DECORATION [${decorationCallId}]: ➡️ Calling drawObliqueLinesPattern`);
                this.drawObliqueLinesPattern(ctx, text, offsetX, offsetY, textWidth, textHeight, decorationCallId);
                break;
            case 'fadingColorCut':
            case 'fadingLinesCut':
                console.log(`🎨 DECORATION [${decorationCallId}]: ➡️ Calling drawFadingColorCutPattern for ${this.activeDecorationType}`);
                this.drawFadingColorCutPattern(ctx, text, offsetX, offsetY, textWidth, textHeight, decorationCallId);
                break;
            default:
                console.log(`🎨 DECORATION [${decorationCallId}]: ❌ UNKNOWN DECORATION TYPE: ${this.activeDecorationType}`);
        }
        console.log(`🎨 DECORATION [${decorationCallId}]: === DECORATION APPLICATION COMPLETE ===`);
        // DO NOT restore context here, let the caller handle it after clipping
    },

    // Draw horizontal lines pattern
    drawHorizontalLinesPattern(ctx, text, offsetX, offsetY, textWidth, textHeight, decorationCallId = 'unknown') {
        console.log(`🎨 HORIZONTAL LINES [${decorationCallId}]: === STARTING HORIZONTAL LINES PATTERN ===`);
        const settings = this.settings.horizontalLines;
        console.log(`🎨 HORIZONTAL LINES [${decorationCallId}]: Settings:`, settings);

        const lineWeight = settings.weight / 100 * textHeight;
        const lineDistance = settings.distance / 100 * textHeight;
        const baseLineColor = settings.color;
        const lineOpacity = (settings.opacity || 100) / 100; // Convert percentage to decimal
        const coverage = (settings.coverage || 100) / 100; // Convert percentage to multiplier

        // Convert hex color to rgba with opacity
        let lineColor;
        if (baseLineColor.startsWith('#')) {
            const hex = baseLineColor.slice(1);
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            lineColor = `rgba(${r}, ${g}, ${b}, ${lineOpacity})`;
        } else {
            lineColor = baseLineColor; // Use as is if not hex
        }

        // Expand text bounds based on coverage setting
        const expandedHeight = textHeight * coverage;
        const expandedWidth = textWidth * Math.max(1.2, coverage * 0.8); // Ensure minimum width expansion
        const heightExpansion = (expandedHeight - textHeight) / 2;

        const textTop = offsetY - expandedHeight / 2;
        const textBottom = offsetY + expandedHeight / 2;

        ctx.fillStyle = lineColor;
        console.log(`🎨 HORIZONTAL LINES [${decorationCallId}]: Coverage ${settings.coverage}%, expanded height: ${expandedHeight.toFixed(1)}px`);
        console.log(`🎨 HORIZONTAL LINES [${decorationCallId}]: Drawing area: top=${textTop}, bottom=${textBottom}, width=${expandedWidth}`);

        // Draw lines across the expanded text area
        let lineCount = 0;
        for (let y = textTop; y < textBottom; y += lineDistance + lineWeight) {
            ctx.fillRect(offsetX - expandedWidth / 2, y, expandedWidth, lineWeight);
            lineCount++;
        }
        console.log(`🎨 HORIZONTAL LINES [${decorationCallId}]: ✅ Drew ${lineCount} lines`);
        console.log(`🎨 HORIZONTAL LINES [${decorationCallId}]: === HORIZONTAL LINES PATTERN COMPLETE ===`);
    },

    // Draw color cut pattern
    drawColorCutPattern(ctx, text, offsetX, offsetY, textWidth, textHeight) {
        const settings = this.settings.colorCut;
        const cutDistance = settings.distance / 100;
        const baseFillColor = settings.color;
        const fillOpacity = (settings.opacity || 100) / 100; // Convert percentage to decimal
        const fillDirection = settings.fillDirection || 'top';
        const coverage = (settings.coverage || 100) / 100; // Convert percentage to multiplier

        // Convert hex color to rgba with opacity
        let fillColor;
        if (baseFillColor.startsWith('#')) {
            const hex = baseFillColor.slice(1);
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            fillColor = `rgba(${r}, ${g}, ${b}, ${fillOpacity})`;
        } else {
            fillColor = baseFillColor; // Use as is if not hex
        }

        // Expand text bounds based on coverage setting
        const expandedHeight = textHeight * coverage;
        const expandedWidth = textWidth * Math.max(1.2, coverage * 0.8); // Ensure minimum width expansion

        const textTop = offsetY - expandedHeight / 2;
        const textBottom = offsetY + expandedHeight / 2;
        const fillHeight = expandedHeight * cutDistance;

        ctx.fillStyle = fillColor;
        console.log(`🎨 COLOR CUT: Coverage ${settings.coverage}%, expanded height: ${expandedHeight.toFixed(1)}px`);

        if (fillDirection === 'top') {
            // Fill pattern from the top down
            ctx.fillRect(offsetX - expandedWidth / 2, textTop, expandedWidth, fillHeight);
        } else {
            // Fill pattern from the bottom up
            ctx.fillRect(offsetX - expandedWidth / 2, textBottom - fillHeight, expandedWidth, fillHeight);
        }
    },

    // Draw oblique lines pattern
    drawObliqueLinesPattern(ctx, text, offsetX, offsetY, textWidth, textHeight) {
        const settings = this.settings.obliqueLines;
        const lineWeight = settings.weight / 100 * textHeight; // Adjust calculation if needed
        const lineDistance = settings.distance / 100 * textHeight; // Adjust calculation if needed
        const baseLineColor = settings.color;
        const lineOpacity = (settings.opacity || 100) / 100; // Convert percentage to decimal
        const coverage = (settings.coverage || 100) / 100; // Convert percentage to multiplier

        // Convert hex color to rgba with opacity
        let lineColor;
        if (baseLineColor.startsWith('#')) {
            const hex = baseLineColor.slice(1);
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            lineColor = `rgba(${r}, ${g}, ${b}, ${lineOpacity})`;
        } else {
            lineColor = baseLineColor; // Use as is if not hex
        }

        // Define bounds for pattern generation based on coverage
        const patternWidth = textWidth * Math.max(1.5, coverage * 0.8);
        const patternHeight = textHeight * coverage;
        const patternOffsetX = offsetX - patternWidth / 2;
        const patternOffsetY = offsetY - patternHeight / 2;

        ctx.save();
        ctx.fillStyle = lineColor;
        console.log(`🎨 OBLIQUE LINES: Coverage ${settings.coverage}%, pattern size: ${patternWidth.toFixed(1)}x${patternHeight.toFixed(1)}px`);

        // Clip drawing to the pattern area to avoid excessive drawing
        ctx.beginPath();
        ctx.rect(patternOffsetX, patternOffsetY, patternWidth, patternHeight);
        ctx.clip();

        // Draw diagonal lines across the pattern area
        const diagonalLength = Math.sqrt(patternWidth * patternWidth + patternHeight * patternHeight);
        ctx.translate(offsetX, offsetY); // Translate to text center for rotation
        ctx.rotate(Math.PI / 4); // 45 degrees

        const step = lineWeight + lineDistance;
        for (let d = -diagonalLength / 2; d < diagonalLength / 2; d += step) {
            ctx.fillRect(d - lineWeight / 2, -diagonalLength / 2, lineWeight, diagonalLength);
        }

        ctx.restore(); // Restore context (removes rotation and clipping)
    },

    // Draw fading color cut pattern
    drawFadingColorCutPattern(ctx, text, offsetX, offsetY, textWidth, textHeight, decorationCallId = 'unknown') {
        console.log(`🎨 FADING LINES [${decorationCallId}]: === STARTING FADING LINES PATTERN ===`);
        console.log(`🎨 FADING LINES [${decorationCallId}]: Active decoration type: ${this.activeDecorationType}`);
        console.log(`🎨 FADING LINES [${decorationCallId}]: Input parameters:`, {
            offsetX, offsetY, textWidth, textHeight
        });

        // Use the correct settings based on active decoration type
        const settingsKey = this.activeDecorationType === 'fadingLinesCut' ? 'fadingLinesCut' : 'fadingColorCut';
        const settings = this.settings[settingsKey];
        console.log(`🎨 FADING LINES [${decorationCallId}]: Using settings key: ${settingsKey}`);
        console.log(`🎨 FADING LINES [${decorationCallId}]: Settings object:`, settings);

        const fillDirection = settings.fillDirection || 'top';
        const cutDistance = settings.distance / 100;
        const baseColor = settings.color;
        const opacity = (settings.opacity || 100) / 100; // Convert percentage to decimal
        const weight = settings.weight;
        const spacingValue = settings.spacing || 10; // Use UI spacing value
        const coverage = (settings.coverage || 100) / 100; // Convert percentage to multiplier

        // Convert hex color to rgba with opacity
        let fillColor;
        if (baseColor.startsWith('#')) {
            const hex = baseColor.slice(1);
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            fillColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        } else {
            // If it's already rgba or other format, use as is (could be enhanced later)
            fillColor = baseColor;
        }

        console.log(`🎨 FADING LINES [${decorationCallId}]: Calculated values:`, {
            fillDirection, cutDistance, baseColor, opacity, fillColor, weight, spacingValue, coverage
        });

        // Expand text bounds based on coverage setting
        const expandedHeight = textHeight * coverage;
        const expandedWidth = textWidth * Math.max(1.2, coverage * 0.8); // Ensure minimum width expansion

        const textTop = offsetY - expandedHeight / 2;
        const textBottom = offsetY + expandedHeight / 2;
        const fillHeight = expandedHeight * cutDistance;

        console.log(`🎨 FADING LINES [${decorationCallId}]: Expanded bounds:`, {
            expandedHeight, expandedWidth, textTop, textBottom, fillHeight
        });

        if (fillHeight <= 0) {
            console.log(`🎨 FADING LINES [${decorationCallId}]: ❌ FILL HEIGHT IS ZERO OR NEGATIVE: ${fillHeight}`);
            return;
        }

        const stripesArea = fillHeight * 0.2;
        const stripeCount = 5;
        const solidBlockHeight = fillHeight - stripesArea;

        const stripeHeights = [];
        const minThickness = Math.max(1, weight / 10);
        const maxThickness = Math.max(minThickness + 1, weight / 3);
        for (let i = 0; i < stripeCount; i++) {
            const progress = stripeCount > 1 ? i / (stripeCount - 1) : 0;
            const thickness = minThickness + progress * (maxThickness - minThickness);
            stripeHeights.push(thickness);
        }
        const totalThickness = stripeHeights.reduce((a, b) => a + b, 0);
        // Use UI spacing value instead of calculated spacing
        const spacing = spacingValue;

        ctx.fillStyle = fillColor;
        console.log(`🎨 FADING LINES [${decorationCallId}]: Set fillStyle to: ${fillColor}`);
        console.log(`🎨 FADING LINES [${decorationCallId}]: Coverage ${settings.coverage}%, expanded height: ${expandedHeight.toFixed(1)}px`);

        let stripesStartY, solidBlockY;
        const patternDrawWidth = expandedWidth;
        const patternDrawX = offsetX - patternDrawWidth / 2;

        console.log(`🎨 FADING LINES [${decorationCallId}]: Pattern drawing area:`, {
            patternDrawWidth, patternDrawX, fillDirection
        });

        if (fillDirection === 'top') {
            console.log(`🎨 FADING LINES [${decorationCallId}]: Drawing TOP direction pattern`);
            // UI: "Top to Bottom" -> Block Top, Lines Bottom
            solidBlockY = textTop;
            stripesStartY = textTop + solidBlockHeight;

            console.log(`🎨 FADING LINES [${decorationCallId}]: Solid block:`, {
                x: patternDrawX, y: solidBlockY, width: patternDrawWidth, height: solidBlockHeight
            });

            if (solidBlockHeight > 0) {
                 ctx.fillRect(patternDrawX, solidBlockY, patternDrawWidth, solidBlockHeight);
                 console.log(`🎨 FADING LINES [${decorationCallId}]: ✅ Drew solid block`);
            }
            let currentStripeY = stripesStartY;
            for (let i = 0; i < stripeCount; i++) {
                const stripeHeight = stripeHeights[i];
                const drawHeight = Math.min(stripeHeight, textTop + fillHeight - currentStripeY);
                if (drawHeight <= 0) break;

                console.log(`🎨 FADING LINES [${decorationCallId}]: Drawing stripe ${i}:`, {
                    x: patternDrawX, y: currentStripeY, width: patternDrawWidth, height: drawHeight
                });
                ctx.fillRect(patternDrawX, currentStripeY, patternDrawWidth, drawHeight);
                currentStripeY += stripeHeight + spacing;
            }
        } else { // fillDirection === 'bottom'
            console.log(`🎨 FADING LINES [${decorationCallId}]: Drawing BOTTOM direction pattern`);
             // UI: "Bottom to Top" -> Lines Top, Block Bottom
            stripesStartY = textBottom - fillHeight;
            solidBlockY = stripesStartY + stripesArea;

            let currentStripeY = stripesStartY;
            for (let i = 0; i < stripeCount; i++) {
                const stripeHeight = stripeHeights[i];
                const drawHeight = Math.min(stripeHeight, stripesStartY + stripesArea - currentStripeY);
                if (drawHeight <= 0) break;

                console.log(`🎨 FADING LINES [${decorationCallId}]: Drawing stripe ${i}:`, {
                    x: patternDrawX, y: currentStripeY, width: patternDrawWidth, height: drawHeight
                });
                ctx.fillRect(patternDrawX, currentStripeY, patternDrawWidth, drawHeight);
                currentStripeY += stripeHeight + spacing;
            }

            console.log(`🎨 FADING LINES [${decorationCallId}]: Solid block:`, {
                x: patternDrawX, y: solidBlockY, width: patternDrawWidth, height: solidBlockHeight
            });

            if (solidBlockHeight > 0) {
                 ctx.fillRect(patternDrawX, solidBlockY, patternDrawWidth, solidBlockHeight);
                 console.log(`🎨 FADING LINES [${decorationCallId}]: ✅ Drew solid block`);
            }
        }
        console.log(`🎨 FADING LINES [${decorationCallId}]: === FADING LINES PATTERN COMPLETE ===`);
    }
};

// Make decorationModule available globally
window.decorationModule = decorationModule;

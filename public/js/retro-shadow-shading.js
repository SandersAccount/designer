// Retro Shadow Text Effect Implementation
function applyRetroShadow(ctx, text, x, y, fontSize, fontFamily, textColor, shadowColor, distance, angle) {
    // Clear canvas for redrawing
    const canvas = ctx.canvas;
    
    // Set font properties
    const fontWeight = 'bold';
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Calculate offset based on angle and distance
    const angleRadians = angle * Math.PI / 180;
    const xOffset = Math.cos(angleRadians) * distance;
    const yOffset = Math.sin(angleRadians) * distance;

    // Strategy: Use a temporary canvas for the shadow layer that we'll cut out
    // Create a temporary canvas for the shadow layer
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    // Draw shadow on temp canvas
    tempCtx.font = ctx.font;
    tempCtx.textAlign = ctx.textAlign;
    tempCtx.textBaseline = ctx.textBaseline;
    tempCtx.fillStyle = shadowColor;
    tempCtx.fillText(text, x + (xOffset * 2), y + (yOffset * 2));

    // Cut out the middle text from the temp canvas
    tempCtx.globalCompositeOperation = 'destination-out';
    tempCtx.fillText(text, x + xOffset, y + yOffset);

    // Draw the temp canvas onto the main canvas
    ctx.drawImage(tempCanvas, 0, 0);

    // Draw main text layer
    ctx.fillStyle = textColor;
    ctx.fillText(text, x, y);
}

// Export function to be called from other scripts
window.applyRetroShadow = applyRetroShadow;

// ...existing code...

export default function applyFadingColorCut(element, options) {
  const color = options.color || '#0000FF';
  const distance = options.distance || 50; // Use the distance (percentage) provided
  const weight = options.weight || 5; // Default weight if not provided
  
  // Direction of the gradient
  const isBottomToTop = options.direction === 'bottom-to-top';
  const gradientDirection = isBottomToTop ? 'to top' : 'to bottom';
  
  // Calculate stripe sizes based on weight
  const minStripeWidth = Math.max(0.5, weight / 20); // Thin stripes
  const maxStripeWidth = Math.max(1.5, weight / 5);  // Thicker stripes
  
  // Reserve 20% of the filled area for stripes
  const stripesArea = 20;
  const stripeCount = 5;
  
  // Create gradient stops based on direction
  let gradientStops;
  
  if (isBottomToTop) {
    // For bottom-to-top direction
    // First the solid block (from bottom to about 80% of the fill)
    // Then the 5 stripes (thin to thick)
    const startPos = 100 - distance; // Where the color starts
    const blockEndPos = startPos + (distance * 0.8); // Where solid block ends
    
    // Start with transparent up to the cut point
    gradientStops = `transparent ${startPos}%, `;
    
    // Add solid block from start to 80%
    gradientStops += `${color} ${startPos}%, ${color} ${blockEndPos}%, `;
    
    // Add 5 stripes from thin to thick
    const stripeArea = distance * 0.2; // 20% of the filled area
    const stripeSpacing = stripeArea / (stripeCount * 2); // Space for stripes and gaps
    
    let currentPos = blockEndPos;
    for (let i = 0; i < stripeCount; i++) {
      const stripeWidth = minStripeWidth + ((maxStripeWidth - minStripeWidth) * i / (stripeCount - 1));
      
      // Add stripe
      gradientStops += `transparent ${currentPos}%, ${color} ${currentPos}%, `;
      currentPos += stripeWidth;
      gradientStops += `${color} ${currentPos}%, transparent ${currentPos}%, `;
      
      // Add gap (if not the last stripe)
      if (i < stripeCount - 1) {
        currentPos += stripeSpacing;
      }
    }
    
    // End with transparent
    gradientStops += `transparent 100%`;
    
  } else {
    // For top-to-bottom direction
    // First 5 stripes (thin to thick)
    // Then the solid block (from about 20% to 100% of the fill)
    const endPos = distance; // Where the color ends
    const blockStartPos = endPos * 0.2; // Where solid block begins (after stripes)
    
    // Start with transparent up to the cut point
    gradientStops = `transparent ${100 - endPos}%, `;
    
    // Add 5 stripes from thin to thick
    const stripeArea = endPos * 0.2; // 20% of the filled area
    const stripeSpacing = stripeArea / (stripeCount * 2); // Space for stripes and gaps
    
    let currentPos = 100 - endPos;
    for (let i = 0; i < stripeCount; i++) {
      const stripeWidth = minStripeWidth + ((maxStripeWidth - minStripeWidth) * i / (stripeCount - 1));
      
      // Add stripe
      gradientStops += `${color} ${currentPos}%, `;
      currentPos += stripeWidth;
      gradientStops += `${color} ${currentPos}%, transparent ${currentPos}%, `;
      
      // Add gap (if not the last stripe)
      if (i < stripeCount - 1) {
        currentPos += stripeSpacing;
        gradientStops += `transparent ${currentPos}%, `;
      }
    }
    
    // Add solid block to complete the fill
    const blockStart = 100 - endPos + (endPos * 0.2);
    gradientStops += `${color} ${blockStart}%, ${color} ${100 - endPos + endPos}%, `;
    
    // End with transparent
    gradientStops += `transparent ${100 - endPos + endPos}%`;
  }
  
  // Make sure the element can contain the effect properly
  element.style.position = 'relative';
  element.style.display = 'inline-block';
  
  // Apply the gradient directly to the text
  element.style.backgroundImage = `linear-gradient(${gradientDirection}, ${gradientStops})`;
  element.style.webkitBackgroundClip = 'text';
  element.style.backgroundClip = 'text';
  element.style.color = 'transparent';
}
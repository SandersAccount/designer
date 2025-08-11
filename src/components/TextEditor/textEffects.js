// ...existing code...

export default function applyFadingColorCut(element, options) {
  const color = options.color || '#0000FF';
  const distance = options.distance || 50; // Use the distance (percentage) provided
  const weight = options.weight || 5; // Default weight if not provided
  
  // Create a simpler implementation with 5 progressively thicker stripes followed by solid block
  const isBottomToTop = options.direction === 'bottom-to-top';
  
  // Base stripe thickness controlled by weight
  const baseThickness = weight / 10;
  
  // Calculate stripe sizes - from thin to thick
  const stripes = [
    baseThickness,                // Thinnest
    baseThickness * 1.5,
    baseThickness * 2.0,
    baseThickness * 2.5,
    baseThickness * 3.0           // Thickest
  ];
  
  // Spacing between stripes
  const stripeGap = Math.max(0.5, (10 - weight) / 5);
  
  // Get the total percentage the stripes will occupy (about 20% of the colored area)
  const totalStripeArea = distance * 0.2;
  
  // Build the gradient manually
  let gradientDirection = isBottomToTop ? 'to top' : 'to bottom';
  let gradientStops = '';
  
  if (isBottomToTop) {
    // Bottom to top: solid block first, then stripes
    // Start with transparent until filled area
    const startPos = 100 - distance;
    gradientStops = `transparent ${startPos}%, `;
    
    // Add solid block (about 80% of the filled area)
    const solidBlockEnd = startPos + (distance * 0.8);
    gradientStops += `${color} ${startPos}%, ${color} ${solidBlockEnd}%, `;
    
    // Add 5 stripes from thin to thick
    let currentPos = solidBlockEnd;
    
    for (let i = 0; i < stripes.length; i++) {
      // Gap before stripe
      gradientStops += `transparent ${currentPos}%, `;
      currentPos += stripeGap;
      
      // Stripe
      gradientStops += `${color} ${currentPos}%, `;
      currentPos += stripes[i];
      gradientStops += `${color} ${currentPos}%, `;
    }
    
    // End with transparent
    gradientStops += `transparent ${currentPos}%`;
    
  } else {
    // Top to bottom: stripes first, then solid block
    // Start with transparent until filled area
    const fillStart = 100 - distance;
    gradientStops = `transparent ${fillStart}%, `;
    
    // Add 5 stripes from thin to thick
    let currentPos = fillStart;
    
    for (let i = 0; i < stripes.length; i++) {
      // Stripe
      gradientStops += `${color} ${currentPos}%, `;
      currentPos += stripes[i];
      gradientStops += `${color} ${currentPos}%, `;
      
      // Gap after stripe (if not the last stripe)
      if (i < stripes.length - 1) {
        gradientStops += `transparent ${currentPos}%, `;
        currentPos += stripeGap;
      }
    }
    
    // Add solid block to fill the rest
    const solidBlockStart = fillStart + totalStripeArea;
    gradientStops += `${color} ${solidBlockStart}%, ${color} ${100}%, `;
    
    // End with transparent
    gradientStops += `transparent ${100}%`;
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
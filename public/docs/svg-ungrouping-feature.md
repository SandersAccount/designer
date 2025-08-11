# SVG Ungrouping Feature

## Overview
The SVG Ungrouping feature allows you to break apart complex SVG files into individual, independently editable shapes within the design editor. This provides the same functionality you'd expect from Adobe Illustrator's ungrouping feature.

## How to Use

### 1. Add an SVG to the Canvas
- Use the left menu to browse and add SVG files to your canvas
- The SVG will initially appear as a single grouped object

### 2. Select the SVG Object
- Click on the SVG object in the canvas to select it
- When an SVG object is selected, the ungroup button (🔗) will appear in the canvas controls at the bottom

### 3. Ungroup the SVG
- Click the ungroup button (🔗) in the canvas controls
- The system will:
  - Parse the SVG file structure
  - Extract individual shapes (paths, circles, rectangles, etc.)
  - Create separate canvas objects for each shape
  - Maintain proper positioning and styling
  - Replace the original grouped SVG with the individual shapes

### 4. Edit Individual Shapes
- Each ungrouped shape becomes an independent object
- You can now:
  - Move shapes individually
  - Apply different colors to each shape
  - Add different effects to each shape
  - Scale and rotate shapes independently

## Supported SVG Elements
The ungrouping feature supports the following SVG elements:
- `<path>` - Complex vector paths
- `<circle>` - Circles
- `<rect>` - Rectangles
- `<ellipse>` - Ellipses
- `<polygon>` - Polygons
- `<polyline>` - Polylines
- `<line>` - Lines
- Elements within `<g>` groups

## Features Preserved During Ungrouping
- **Position**: Each shape maintains its relative position from the original SVG
- **Styling**: Fill colors, stroke colors, and stroke widths are preserved
- **Scale**: The original object's scale is applied to all ungrouped shapes
- **Rotation**: If the original SVG was rotated, the rotation is maintained
- **Effects**: Shadow and other effects from the original object are inherited

## Technical Details

### File Structure
- Main implementation: `/public/js/svg-ungroup.js`
- Button styling: `/public/style-design-editor.css`
- Integration: Added to `/public/design-editor.html`

### How It Works
1. **SVG Parsing**: Uses DOMParser to parse the SVG XML structure
2. **Shape Extraction**: Queries for all drawable SVG elements
3. **Individual SVG Creation**: Creates separate SVG files for each shape
4. **Canvas Integration**: Converts each shape to a canvas image object
5. **Position Calculation**: Maintains relative positioning using viewBox and element bounds

### Error Handling
- Validates SVG content before processing
- Handles malformed SVG files gracefully
- Provides user feedback for success/failure
- Logs detailed debugging information to console

## Troubleshooting

### Button Not Appearing
- Ensure you have selected an SVG object (file ending in .svg)
- Check browser console for any JavaScript errors
- Verify the SVG file is properly loaded

### Positioning Issues
- Complex transformations in the original SVG may affect positioning
- Nested groups with transforms may require manual adjustment
- ViewBox settings are automatically handled

### Performance
- Large SVG files with many elements may take a moment to process
- The button is disabled during processing to prevent multiple operations

## Testing
A test SVG file is available at `/public/stock/images/test-ungroup.svg` which contains:
- A background circle
- A star shape
- A rectangle
- A group of small circles
- A triangle

This file is perfect for testing the ungrouping functionality and seeing how different SVG elements are handled.

# Local Filerobot Image Editor

This directory contains a local version of the Filerobot Image Editor library, created to reduce dependency on external CDNs and to enable local modifications.

## Files

- `filerobot-image-editor.min.js` - The minified JavaScript file for the editor
- `filerobot-image-editor.min.css` - The minified CSS file for the editor

## Benefits of Local Version

1. **Independence from CDN changes**: Prevents issues if the CDN changes or removes the library
2. **Ability to modify the code**: Can make custom enhancements specific to our application
3. **Control over versioning**: Can update at our own pace
4. **Improved reliability**: Not affected by CDN outages or rate limits
5. **Local development**: Can work offline without internet access

## Current Implementation

The current implementation is a basic version that provides the same API as the original Filerobot Image Editor, but with a simplified implementation. The `window.FilerobotImageEditor` class maintains the same interface as the original, ensuring compatibility with existing code.

## Customization

To customize the editor, modify the files in this directory. The JavaScript file is structured to make it easy to extend with additional functionality as needed.

## Original Source

The original Filerobot Image Editor can be found at:
- GitHub: https://github.com/scaleflex/filerobot-image-editor
- CDN: https://cdn.scaleflex.it/plugins/filerobot-image-editor/

Created: March 4, 2025

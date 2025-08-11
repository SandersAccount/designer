// Simple client-side shapes API fallback
// This provides a fallback when server-side API is not available

class ShapesAPI {
    constructor() {
        // Known shape files based on the folder structure (confirmed existing files)
        // We'll use discovery for most categories to find all available files
        this.shapeFiles = {
            'abstract': [
                // Will be populated by discovery to find all files
            ],
            'geometric': [
                // Will be populated by discovery to find all 20 files
            ],
            'hand-drawn': [
                // Will be populated by discovery
            ],
            'ink': [
                // Will be populated by discovery to find all 21 files
            ],
            'grunge': [
                // Will be populated by discovery
            ]
        };
    }

    async getShapeFiles(category) {
        // Always use discovery to find all available files
        console.log(`[ShapesAPI] Discovering all files for ${category}...`);
        return await this.discoverFiles(category, 100); // Increased to 100 to find all files
    }

    // Test if a shape file exists and is valid
    async testShapeFile(category, filename) {
        const basePath = this.getCategoryPath(category);
        const fullPath = `${basePath}/${filename}`;

        try {
            const response = await fetch(fullPath, { method: 'HEAD' });

            if (!response.ok) {
                return false;
            }

            // Check file size - reject files larger than 1MB (likely corrupted or too complex)
            const contentLength = response.headers.get('content-length');
            if (contentLength && parseInt(contentLength) > 1024 * 1024) {
                console.warn(`[ShapesAPI] File too large (${Math.round(parseInt(contentLength) / 1024)}KB): ${fullPath}`);
                return false;
            }

            // Check content type if available (but don't log warnings for HTML responses - they're expected for 404s)
            const contentType = response.headers.get('content-type');
            if (contentType && !contentType.includes('svg') && !contentType.includes('xml')) {
                // Only log if it's not a typical 404 HTML response
                if (!contentType.includes('text/html')) {
                    console.warn(`[ShapesAPI] Invalid content type (${contentType}): ${fullPath}`);
                }
                return false;
            }

            return true;
        } catch (error) {
            console.warn(`[ShapesAPI] Error testing file ${fullPath}:`, error.message);
            return false;
        }
    }

    getCategoryPath(category) {
        const paths = {
            'abstract': '/stock/shapes/abstract-shapes',
            'geometric': '/stock/shapes/geometric-shapes',
            'hand-drawn': '/stock/shapes/hand-drawn-dividers',
            'ink': '/stock/shapes/ink-brush-strokes',
            'masks': '/stock/shapes/masks',
            'extra': '/stock/shapes/extra',
            'data': '/stock/shapes/data',
            'icons': '/stock/shapes/icons',
            'separators': '/stock/shapes/separators',
            'grunge': '/stock/shapes/grunge'
        };
        return paths[category] || '';
    }

    // Discover available files by testing common patterns
    async discoverFiles(category, maxFiles = 100) {
        console.log(`[ShapesAPI] Starting discovery for category: ${category}, testing up to ${maxFiles} files...`);
        const startTime = Date.now();

        // Test numbered files (1.svg, 2.svg, etc.)
        const promises = [];
        for (let i = 1; i <= maxFiles; i++) {
            const filename = `${i}.svg`;
            promises.push(
                this.testShapeFile(category, filename).then(exists => {
                    return exists ? filename : null;
                })
            );
        }

        const results = await Promise.all(promises);
        const discoveredFiles = results.filter(filename => filename !== null);
        const duration = Date.now() - startTime;

        console.log(`[ShapesAPI] Discovery complete for ${category} in ${duration}ms. Found ${discoveredFiles.length} valid files out of ${maxFiles} tested.`);

        if (discoveredFiles.length > 0) {
            console.log(`[ShapesAPI] Valid files for ${category}:`, discoveredFiles.sort((a, b) => {
                const numA = parseInt(a.replace('.svg', ''));
                const numB = parseInt(b.replace('.svg', ''));
                return numA - numB;
            }));
        } else {
            console.warn(`[ShapesAPI] No valid files found for ${category}. Check if the directory exists and contains SVG files.`);
        }

        return discoveredFiles;
    }

    // Debug method to test a specific range of files
    async debugTestFiles(category, startNum = 1, endNum = 25) {
        console.log(`[ShapesAPI] Debug testing files ${startNum}-${endNum} for ${category}:`);
        const results = [];

        for (let i = startNum; i <= endNum; i++) {
            const filename = `${i}.svg`;
            const exists = await this.testShapeFile(category, filename);
            results.push({ filename, exists });
            console.log(`[ShapesAPI] ${filename}: ${exists ? '✓ EXISTS' : '✗ NOT FOUND'}`);
        }

        const existingFiles = results.filter(r => r.exists).map(r => r.filename);
        console.log(`[ShapesAPI] Summary for ${category}: ${existingFiles.length}/${endNum - startNum + 1} files exist`);
        console.log(`[ShapesAPI] Existing files:`, existingFiles);

        return existingFiles;
    }
}

// Make it globally available
window.ShapesAPI = ShapesAPI;

// Add global debug function for easy testing
window.debugShapes = async function(category, startNum = 1, endNum = 25) {
    const api = new ShapesAPI();
    return await api.debugTestFiles(category, startNum, endNum);
};

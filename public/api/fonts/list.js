/**
 * Font List API Endpoint
 * 
 * Returns a list of available font files in the public/fonts directory
 */

const fs = require('fs');
const path = require('path');

// This is a simple Node.js script that can be used with a basic server
// For static hosting, this will be handled by the fallback method in the client

function listFontFiles() {
    const fontsDir = path.join(__dirname, '../../fonts');
    
    try {
        if (!fs.existsSync(fontsDir)) {
            console.log('Fonts directory does not exist:', fontsDir);
            return [];
        }
        
        const files = fs.readdirSync(fontsDir);
        const fontFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.ttf', '.otf', '.woff', '.woff2', '.eot'].includes(ext);
        });
        
        console.log('Found font files:', fontFiles);
        return fontFiles;
    } catch (error) {
        console.error('Error reading fonts directory:', error);
        return [];
    }
}

// For Express.js server
function handleRequest(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    try {
        const fontFiles = listFontFiles();
        res.json(fontFiles);
    } catch (error) {
        res.status(500).json({ error: 'Failed to list font files' });
    }
}

// Export for different server types
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { listFontFiles, handleRequest };
}

// For direct execution
if (require.main === module) {
    const fontFiles = listFontFiles();
    console.log(JSON.stringify(fontFiles, null, 2));
}

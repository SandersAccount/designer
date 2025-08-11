import express from 'express';
import multer from 'multer';
import { auth } from '../middleware/auth.js';
import Style from '../models/Style.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import fetch from 'node-fetch';
import { storage as b2Storage } from '../utils/storage.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for handling file uploads
const multerStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Ensure uploads directory exists
        const uploadsDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
            console.log('Created uploads directory:', uploadsDir);
        }
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Clean the original filename
        const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = `image-${uniqueSuffix}-${cleanFileName}`;
        console.log('Generated filename:', filename);
        cb(null, filename);
    }
});

const upload = multer({ 
    storage: multerStorage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Error handling middleware for multer
function handleMulterError(err, req, res, next) {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: 'File upload error: ' + err.message });
    } else if (err) {
        return res.status(400).json({ message: err.message });
    }
    next();
}

// Function to upload file to Backblaze
async function uploadToBackblaze(filePath, fileName) {
    try {
        const B2_KEY_ID = process.env.B2_APPLICATION_KEY_ID;
        const B2_APP_KEY = process.env.B2_APPLICATION_KEY;
        const B2_BUCKET = process.env.B2_BUCKET_ID;
        
        if (!B2_KEY_ID || !B2_APP_KEY || !B2_BUCKET) {
            throw new Error('Missing Backblaze credentials');
        }

        console.log('Uploading to Backblaze with credentials:', {
            keyId: B2_KEY_ID,
            bucketId: B2_BUCKET
        });

        // Create authorization header
        const credentials = Buffer.from(`${B2_KEY_ID}:${B2_APP_KEY}`).toString('base64');
        
        // Get upload URL
        const authResponse = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
            headers: {
                'Authorization': `Basic ${credentials}`
            }
        });
        
        if (!authResponse.ok) {
            const error = await authResponse.json();
            console.error('Backblaze auth error:', error);
            throw new Error('Failed to authenticate with Backblaze');
        }
        
        const authData = await authResponse.json();
        console.log('Got Backblaze auth token');
        
        // Get upload URL
        const getUploadUrlResponse = await fetch(`${authData.apiUrl}/b2api/v2/b2_get_upload_url`, {
            method: 'POST',
            headers: {
                'Authorization': authData.authorizationToken
            },
            body: JSON.stringify({
                bucketId: B2_BUCKET
            })
        });
        
        if (!getUploadUrlResponse.ok) {
            const error = await getUploadUrlResponse.json();
            console.error('Backblaze upload URL error:', error);
            throw new Error('Failed to get upload URL');
        }
        
        const uploadUrlData = await getUploadUrlResponse.json();
        console.log('Got Backblaze upload URL');
        
        // Upload file
        const fileContent = await fs.promises.readFile(filePath);
        const uploadResponse = await fetch(uploadUrlData.uploadUrl, {
            method: 'POST',
            headers: {
                'Authorization': uploadUrlData.authorizationToken,
                'X-Bz-File-Name': fileName,
                'Content-Type': 'b2/x-auto',
                'X-Bz-Content-Sha1': 'do_not_verify'
            },
            body: fileContent
        });
        
        if (!uploadResponse.ok) {
            const error = await uploadResponse.json();
            console.error('Backblaze upload error:', error);
            throw new Error('Failed to upload file to Backblaze');
        }
        
        const uploadResult = await uploadResponse.json();
        console.log('Successfully uploaded to Backblaze:', uploadResult);
        
        // Return the public URL
        return `https://f005.backblazeb2.com/file/${B2_BUCKET}/${uploadResult.fileName}`;
    } catch (error) {
        console.error('Error uploading to Backblaze:', error);
        throw error;
    }
}

// Get all styles
router.get('/', auth, async (req, res) => {
    try {
        console.log('Fetching styles...');
        const styles = await Style.find().sort('order');
        
        // Debug logging for image URLs
        styles.forEach(style => {
            if (style.imageUrl) {
                console.log('Style image URL:', {
                    id: style._id,
                    name: style.name,
                    imageUrl: style.imageUrl,
                    exists: fs.existsSync(path.join(__dirname, '..', style.imageUrl))
                });
            }
        });
        
        res.json(styles);
    } catch (error) {
        console.error('Error fetching styles:', error);
        res.status(500).json({ error: 'Failed to fetch styles' });
    }
});

// Get style by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const style = await Style.findById(req.params.id);
        if (!style) {
            return res.status(404).json({ error: 'Style not found' });
        }
        res.json(style);
    } catch (error) {
        console.error('Error fetching style:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create a new style
router.post('/', auth, upload.single('image'), handleMulterError, async (req, res) => {
    try {
        console.log('Creating a new style...');

        const {
            name,
            prompt,
            elements,
            artStyles,
            fontstyle,
            feel
        } = req.body;

        let imageUrl = null;
        let fileName = null;

        if (req.file) {
            const { path, filename } = req.file;
            fileName = filename;

            // Upload the image to Backblaze
            const imageBuffer = fs.readFileSync(path);
            const uploadResult = await b2Storage.uploadBuffer(imageBuffer, `user-${req.user._id}`);
            imageUrl = uploadResult.url;

            // Delete the local file
            fs.unlinkSync(path);
        }

        const newStyle = new Style({
            name,
            prompt,
            elements,
            artStyles,
            fontstyle,
            feel,
            imageUrl
        });

        const style = await newStyle.save();
        console.log('Style created successfully:', style);

        res.status(201).json(style);
    } catch (error) {
        console.error('Error creating style:', error);
        res.status(500).json({ message: error.message });
    }
});

// Update a style
router.put('/:id', auth, upload.single('image'), handleMulterError, async (req, res) => {
    try {
        console.log('Updating style:', req.params.id);

        const {
            name,
            prompt,
            elements,
            artStyles,
            fontstyle,
            feel
        } = req.body;

        let imageUrl = null;
        let fileName = null;

        if (req.file) {
            const { path, filename } = req.file;
            fileName = filename;

            // Upload the image to Backblaze
            const imageBuffer = fs.readFileSync(path);
            const uploadResult = await b2Storage.uploadBuffer(imageBuffer, `user-${req.user._id}`);
            imageUrl = uploadResult.url;

            // Delete the local file
            fs.unlinkSync(path);
        }

        // If no new image is uploaded, preserve the existing image URL
        if (!imageUrl) {
            const existingStyle = await Style.findById(req.params.id);
            imageUrl = existingStyle.imageUrl;
        }

        const style = await Style.findByIdAndUpdate(req.params.id, {
            name,
            prompt,
            elements,
            artStyles,
            fontstyle,
            feel,
            imageUrl
        }, { new: true });

        if (!style) {
            return res.status(404).json({ message: 'Style not found' });
        }

        console.log('Style updated successfully:', style);
        res.json(style);
    } catch (error) {
        console.error('Error updating style:', error);
        res.status(500).json({ message: error.message });
    }
});

// Delete a style
router.delete('/:id', auth, async (req, res) => {
    try {
        const style = await Style.findByIdAndDelete(req.params.id);
        if (!style) {
            return res.status(404).json({ error: 'Style not found' });
        }
        res.json({ message: 'Style deleted successfully' });
    } catch (error) {
        console.error('Error deleting style:', error);
        res.status(500).json({ error: 'Failed to delete style' });
    }
});

// Get image from storage (local or Backblaze)
router.get('/image/:filename', auth, async (req, res) => {
    try {
        const fileName = req.params.filename;
        console.log('Fetching image:', fileName);

        // First try local storage
        const localPath = path.join(__dirname, '../uploads', fileName);
        if (fs.existsSync(localPath)) {
            console.log('Serving local image:', localPath);
            return res.sendFile(localPath);
        }

        // If not local, try Backblaze
        console.log('Image not found locally, trying Backblaze...');
        const downloadUrl = `https://f005.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/${fileName}`;
        console.log('Fetching from Backblaze:', downloadUrl);

        const response = await fetch(downloadUrl);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Backblaze fetch error:', {
                status: response.status,
                statusText: response.statusText,
                error: errorText,
                url: downloadUrl
            });
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }

        // Set appropriate headers
        res.set('Content-Type', response.headers.get('content-type'));
        res.set('Content-Length', response.headers.get('content-length'));
        res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

        // Stream the image back to the client
        response.body.pipe(res);
    } catch (error) {
        console.error('Error serving image:', error);
        res.status(500).json({ message: 'Failed to serve image: ' + error.message });
    }
});

export default router;

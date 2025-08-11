import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { storage } from './utils/storage.js';
import imageHandler from './middleware/imageHandler.js';
import './models/index.js'; // Import models to ensure registration before routes

// Import routes
import authRoutes from './routes/auth.js';
import stylesRoutes from './routes/styles.js';
import themesRoutes from './routes/themes.js';
import generateRoutes from './routes/generate.js';
import downloadRoutes from './routes/download.js';
import generationRoutes from './routes/generations.js';
import inpaintingRoutes from './routes/inpainting.js';
import promptTemplatesRoutes from './routes/promptTemplates.js'; // Assuming this is the original templates route
import designTemplatesRoutes from './routes/designTemplates.js'; // Our new design template routes
import textStylesRoutes from './routes/textStyles.js'; // Text styles routes
import collectionsRoutes from './routes/collections.js'; // Import collections routes
import persistentParametersRoutes from './routes/persistentParameters.js'; // Import persistent parameters routes

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));

// Increase payload size limits for all parsers
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true, parameterLimit: 50000}));
app.use(express.raw({limit: '50mb'}));
app.use(express.text({limit: '50mb'}));

app.use(cookieParser());

// Handle image requests
app.use(imageHandler);

// Debug middleware for static file requests
app.use((req, res, next) => {
    if (req.url.startsWith('/uploads/')) {
        console.log('Static file request:', {
            url: req.url,
            method: req.method,
            path: path.join(__dirname, req.url)
        });
    }
    next();
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory:', uploadsDir);
}

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/storage', express.static(path.join(__dirname, 'uploads'))); // Alias for uploads
app.use('/images', express.static(path.join(__dirname, 'uploads'))); // Another alias for uploads

// Log static file directories
console.log('Static file directories:', {
    public: path.join(__dirname, 'public'),
    uploads: path.join(__dirname, 'uploads')
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sticker-generator', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('MongoDB connection error:', err);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/styles', stylesRoutes);
app.use('/api/themes', themesRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/download', downloadRoutes);
app.use('/api/generations', generationRoutes);
app.use('/api/inpainting', inpaintingRoutes);
app.use('/api/prompt-templates', promptTemplatesRoutes); // Use a specific path for prompt templates
app.use('/api/design-templates', designTemplatesRoutes); // Use a new path for design templates
app.use('/api/text-styles', textStylesRoutes); // Use a new path for text styles
app.use('/api/collections', collectionsRoutes); // Use collections routes
app.use('/api/persistent-parameters', persistentParametersRoutes); // Use persistent parameters routes

// Serve static files
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;

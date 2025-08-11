import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import bcrypt from 'bcrypt';
import axios from 'axios';
import dotenv from 'dotenv';
import Replicate from 'replicate';
import { readFile } from 'fs/promises';
import fs from 'fs';
import fetch from 'node-fetch'; // Ensure fetch is imported for the proxy route

// Load environment variables
dotenv.config();

// Import database connection
import './config/database.js';

// Import models
import User from '../models/User.js';
import Settings from '../models/Settings.js';
import Style from '../models/Style.js';
import Theme from '../models/Theme.js';
import Collection from '../models/Collection.js';
import Generation from '../models/Generation.js';
import Variable from '../models/Variable.js';
import PromptTemplate from '../models/PromptTemplate.js';
import FilterPreset from '../models/FilterPreset.js';
import ComprehensivePreset from '../models/ComprehensivePreset.js';

// Import routes
import authRoutes from './routes/auth.js';
import subscriptionRoutes from './routes/subscription.js';
import adminRoutes from './routes/admin.js';
import creditsRoutes from './routes/credits.js';
import imagesRoutes from './routes/images.js';
import ipnRouter from './routes/ipn.js';
import variablesRouter from './routes/variables.js';
import generateRouter from './routes/generate.js';
import modelsRouter from './routes/models.js';
import themeRoutes from './routes/themes.js';
import downloadRouter from './routes/download.js';
import stylesRouter from './routes/styles.js';
import inpaintingRouter from './routes/inpainting.js';
import inspirationsRouter from './routes/inspirations.js';
import collectionsRouter from './routes/collections.js';
import projectsRouter from './routes/projects.js';
import projectFoldersRouter from './routes/project-folders.js';
import uploadRouter from './routes/upload.js';
import generationsRouter from './routes/generations.js';
import promptTemplatesRouter from './routes/promptTemplates.js';
import filterPresetsRouter from './routes/filter-presets.js';
import comprehensivePresetsRouter from './routes/comprehensive-presets.js';
import textStylesRouter from './routes/textStyles.js';
import tagsRouter from './routes/tags.js';
import fontTagsRouter from './routes/fontTags.js';
import designTemplatesRouter from './routes/designTemplates.js';
import generateTextsRouter from './routes/generateTexts.js';
import generateFromInspirationRouter from './routes/generate-from-inspiration.js';
import imageFiltersRouter from './routes/image-filters.js';
import imageRouter from './routes/image.js';
import assetsRouter from './routes/assets.js';
import adminMenuRouter from './routes/adminMenu.js';
import adminPageModelsRouter from './routes/adminPageModels.js';
import adminReplicateModelsRouter from './routes/adminReplicateModels.js';
import apiPageModelsRouter from './routes/apiPageModels.js';
import persistentParametersRouter from './routes/persistentParameters.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3001',
            'https://tshirts-supereditor-01.onrender.com',
            process.env.FRONTEND_URL
        ].filter(Boolean);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/credits', creditsRoutes);
app.use('/api/images', imagesRoutes);
app.use('/api/ipn', ipnRouter);
app.use('/api/variables', variablesRouter);
app.use('/api/generate', generateRouter);
app.use('/api/models', modelsRouter);
app.use('/api/themes', themeRoutes);
app.use('/api/download', downloadRouter);
app.use('/api/styles', stylesRouter);
app.use('/api/inpainting', inpaintingRouter);
app.use('/api/inspirations', inspirationsRouter);
app.use('/api/collections', collectionsRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/project-folders', projectFoldersRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/generations', generationsRouter);
app.use('/api/prompt-templates', promptTemplatesRouter);
app.use('/api/filter-presets', filterPresetsRouter);
app.use('/api/comprehensive-presets', comprehensivePresetsRouter);
app.use('/api/text-styles', textStylesRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/font-tags', fontTagsRouter);
app.use('/api/design-templates', designTemplatesRouter);
app.use('/api/generate-texts', generateTextsRouter);
app.use('/api/generate-from-inspiration', generateFromInspirationRouter);
app.use('/api/image-filters', imageFiltersRouter);
app.use('/api/image', imageRouter);
app.use('/api/assets', assetsRouter);
app.use('/api/admin-menu', adminMenuRouter);
app.use('/api/admin-page-models', adminPageModelsRouter);
app.use('/api/admin-replicate-models', adminReplicateModelsRouter);
app.use('/api/api-page-models', apiPageModelsRouter);
app.use('/api/persistent-parameters', persistentParametersRouter);

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

app.get('/design-editor', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'design-editor.html'));
});

app.get('/my-projects', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'my-projects.html'));
});

app.get('/inspiration', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'inspiration.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'admin.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'register.html'));
});

app.get('/subscription', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'subscription.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

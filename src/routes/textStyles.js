import express from 'express';
const router = express.Router();
import TextStyle from '../../models/TextStyle.js';
import { auth, optionalAuth } from '../../middleware/auth.js';

// @desc    Save a new text style
// @route   POST /api/text-styles
// @access  Private (requires login)
router.post('/', auth, async (req, res) => {
    try {
        const {
            name,
            previewImageUrl,
            artboard,
            canvasObjects
        } = req.body;

        // Basic validation
        if (!previewImageUrl || !artboard || !canvasObjects) {
            return res.status(400).json({ 
                message: 'Missing required text style data (previewImageUrl, artboard, canvasObjects).' 
            });
        }

        // Check specific artboard properties for validity
        if (typeof artboard.x !== 'number' || typeof artboard.y !== 'number' || 
            typeof artboard.width !== 'number' || typeof artboard.height !== 'number') {
            return res.status(400).json({ message: 'Invalid artboard data properties.' });
        }

        const newTextStyle = new TextStyle({
            name: name || 'Untitled Text Style',
            previewImageUrl,
            artboard,
            canvasObjects,
            userId: req.user.id,
            isInLibrary: false // Default to not in library
        });

        const savedTextStyle = await newTextStyle.save();

        console.log('Text style saved successfully:', savedTextStyle._id);
        res.status(201).json(savedTextStyle);
    } catch (err) {
        console.error('Error saving text style:', err);
        res.status(500).json({ message: 'Server error saving text style', error: err.message });
    }
});

// @desc    Get all text styles for the logged-in user
// @route   GET /api/text-styles
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const textStyles = await TextStyle.find({ userId: req.user.id })
                                         .sort({ createdAt: -1 })
                                         .lean();

        res.status(200).json(textStyles);
    } catch (err) {
        console.error('Error fetching text styles:', err);
        res.status(500).json({ message: 'Server error fetching text styles', error: err.message });
    }
});

// @desc    Get text styles that are in the library
// @route   GET /api/text-styles/library
// @access  Private
router.get('/library', optionalAuth, async (req, res) => {
    try {
        let libraryStyles = [];

        if (req.user && req.user.id) {
            // If user is authenticated, get their library styles
            libraryStyles = await TextStyle.find({
                userId: req.user.id,
                isInLibrary: true
            })
            .sort({ createdAt: -1 })
            .lean();
        } else {
            // If no user, return empty array or public styles if any
            libraryStyles = [];
        }

        res.status(200).json(libraryStyles);
    } catch (err) {
        console.error('Error fetching library text styles:', err);
        res.status(500).json({ message: 'Server error fetching library text styles', error: err.message });
    }
});

// @desc    Add text style to library
// @route   PUT /api/text-styles/:id/add-to-library
// @access  Private
router.put('/:id/add-to-library', auth, async (req, res) => {
    try {
        const textStyle = await TextStyle.findOne({ 
            _id: req.params.id, 
            userId: req.user.id 
        });

        if (!textStyle) {
            return res.status(404).json({ message: 'Text style not found' });
        }

        textStyle.isInLibrary = true;
        await textStyle.save();

        res.status(200).json({ message: 'Text style added to library successfully', textStyle });
    } catch (err) {
        console.error('Error adding text style to library:', err);
        res.status(500).json({ message: 'Server error adding to library', error: err.message });
    }
});

// @desc    Remove text style from library
// @route   PUT /api/text-styles/:id/remove-from-library
// @access  Private
router.put('/:id/remove-from-library', auth, async (req, res) => {
    try {
        const textStyle = await TextStyle.findOne({ 
            _id: req.params.id, 
            userId: req.user.id 
        });

        if (!textStyle) {
            return res.status(404).json({ message: 'Text style not found' });
        }

        textStyle.isInLibrary = false;
        await textStyle.save();

        res.status(200).json({ message: 'Text style removed from library successfully', textStyle });
    } catch (err) {
        console.error('Error removing text style from library:', err);
        res.status(500).json({ message: 'Server error removing from library', error: err.message });
    }
});

// @desc    Delete a text style
// @route   DELETE /api/text-styles/:id
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const textStyle = await TextStyle.findOne({ 
            _id: req.params.id, 
            userId: req.user.id 
        });

        if (!textStyle) {
            return res.status(404).json({ message: 'Text style not found' });
        }

        await TextStyle.deleteOne({ _id: req.params.id });

        res.status(200).json({ message: 'Text style deleted successfully' });
    } catch (err) {
        console.error('Error deleting text style:', err);
        res.status(500).json({ message: 'Server error deleting text style', error: err.message });
    }
});

export default router;






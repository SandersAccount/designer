import mongoose from 'mongoose';

const InspirationSchema = new mongoose.Schema({
    imageUrl: {
        type: String,
        required: true
    },
    prompt: {
        type: String,
        required: true
    },
    object: {
        type: String,
        required: true
    },
    textValues: {
        type: [String],
        default: []
    },
    textCount: {
        type: Number,
        default: 0
    },
    colorPalette: {
        type: {
            id: String,
            name: String,
            description: String
        },
        default: null
    },
    originalPalette: {
        type: String,
        default: ''
    },
    model: {
        type: String,
        default: 'flux-stickers' // Default model
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    tags: {
        type: [String],
        default: []
    },
    published: {
        type: Boolean,
        default: false
    },
    priority: {
        type: Number,
        default: 0 // Higher numbers will be shown first
    },
    notes: {
        type: String,
        default: ''
    }
});

// Create the model if it doesn't exist, otherwise use the existing model
const Inspiration = mongoose.models.Inspiration || mongoose.model('Inspiration', InspirationSchema);

export default Inspiration;

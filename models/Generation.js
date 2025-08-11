import mongoose from 'mongoose';

const generationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    prompt: {
        type: String,
        required: true
    },
    originalPrompt: {
        type: String,
        required: false
    },
    style: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Style',
        required: false
    },
    theme: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Theme',
        required: false
    },
    templateId: {
        type: String,
        required: false
    },
    model: {
        type: String,
        required: false
    },
    imageUrl: {
        type: String,
        required: true
    },
    text1: {
        type: String,
        required: false
    },
    text2: {
        type: String,
        required: false
    },
    text3: {
        type: String,
        required: false
    },
    background: {
        type: String,
        required: false,
        default: 'light'
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    isUpscaled: {
        type: Boolean,
        default: false
    },
    tags: [{
        type: String,
        trim: true
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
generationSchema.index({ userId: 1, createdAt: -1 });

const Generation = mongoose.model('Generation', generationSchema);
export default Generation;

import mongoose from 'mongoose';

const textStyleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    previewImageUrl: {
        type: String,
        required: true
    },
    artboard: {
        x: { type: Number, required: true },
        y: { type: Number, required: true },
        width: { type: Number, required: true },
        height: { type: Number, required: true }
    },
    canvasObjects: {
        type: Array,
        required: true,
        default: []
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isInLibrary: {
        type: Boolean,
        default: false // Whether this style is available in the Text Library
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt
});

// Index for faster queries
textStyleSchema.index({ userId: 1, createdAt: -1 });
textStyleSchema.index({ userId: 1, isInLibrary: 1 });

const TextStyle = mongoose.model('TextStyle', textStyleSchema);

export default TextStyle;

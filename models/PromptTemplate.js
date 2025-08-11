import mongoose from 'mongoose';

// Remove the global bufferCommands setting that's causing issues
// mongoose.set('bufferCommands', false);

const promptTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    template: {
        type: String,
        required: true
    },
    thumbnailUrl: {
        type: String,
        default: ''
    },
    randomOptions: {
        type: Object,
        default: {}
    },
    originalPalette: {
        type: String,
        default: ''
    },
    recommendedModel: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    isPublic: {
        type: Boolean,
        default: true
    }
}, {
    // Use a more reasonable timeout value instead of disabling buffer commands
    bufferTimeoutMS: 30000
});

// Update the updatedAt field on save
promptTemplateSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const PromptTemplate = mongoose.model('PromptTemplate', promptTemplateSchema);

export default PromptTemplate;

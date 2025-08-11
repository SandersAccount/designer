import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    // Artboard definition (same as templates)
    artboard: {
        x: {
            type: Number,
            required: true
        },
        y: {
            type: Number,
            required: true
        },
        width: {
            type: Number,
            required: true
        },
        height: {
            type: Number,
            required: true
        }
    },
    // Canvas objects with layer order (same as templates)
    canvasObjects: [{
        type: mongoose.Schema.Types.Mixed // Flexible schema for different object types with layerOrder/zIndex
    }],
    // Store complete editor state for re-editing
    editorState: {
        canvasBackgroundColor: {
            type: String,
            default: '#ffffff'
        },
        zoom: {
            scale: {
                type: Number,
                default: 1.0
            },
            offsetX: {
                type: Number,
                default: 0
            },
            offsetY: {
                type: Number,
                default: 0
            }
        },
        selectedObjectIndex: {
            type: Number,
            default: -1
        },
        nextId: {
            type: Number,
            default: 0
        },
        editorSettings: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    // Admin data for context
    adminData: {
        imageUrl: String,
        model: String,
        prompt: String,
        palette: String,
        backgroundType: String,
        originalPalette: String,  // 🎯 ADD: Store original palette for regeneration
        originalObject: String,   // 🎯 ADD: Store original object for regeneration
        fontStylesList: [{ type: mongoose.Schema.Types.Mixed }],  // 🎯 ADD: Store font styles for projects
        decorStylesList: [{ type: mongoose.Schema.Types.Mixed }],  // 🎯 ADD: Store decor styles for projects
        cssFilterState: { type: mongoose.Schema.Types.Mixed },  // 🎯 ADD: Store CSS filter state for projects
        duotoneState: { type: mongoose.Schema.Types.Mixed },  // 🎯 ADD: Store duotone effect state for projects
        glitchState: { type: mongoose.Schema.Types.Mixed }  // 🎯 ADD: Store glitch effect state for projects
    },
    // 🎯 ADD: Top-level font/decor styles (same pattern as templates)
    fontStylesList: [{ type: mongoose.Schema.Types.Mixed }],
    decorStylesList: [{ type: mongoose.Schema.Types.Mixed }],
    cssFilterState: { type: mongoose.Schema.Types.Mixed },  // 🎯 ADD: Top-level CSS filter state
    duotoneState: { type: mongoose.Schema.Types.Mixed },  // 🎯 ADD: Top-level duotone effect state
    glitchState: { type: mongoose.Schema.Types.Mixed },  // 🎯 ADD: Top-level glitch effect state
    halftoneState: { type: mongoose.Schema.Types.Mixed },  // 🎯 ADD: Top-level halftone effect state
    guidelinesState: { // Guidelines state for project persistence
        type: Object,
        default: { guidelines: [], totalCount: 0 },
        required: false
    },
    layoutRectanglesState: { // Layout rectangles state for project persistence
        type: Object,
        default: { rectangles: [], totalCount: 0 },
        required: false
    },
    // Preview thumbnail for display
    previewImageUrl: {
        type: String,
        required: true
    },
    // Project folder organization
    folderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProjectFolder',
        default: null // null means root folder
    },
    // Tags for organization
    tags: [{
        type: String,
        trim: true
    }],
    // Project status
    status: {
        type: String,
        enum: ['draft', 'completed', 'archived'],
        default: 'draft'
    },
    // Statistics
    stats: {
        viewCount: {
            type: Number,
            default: 0
        },
        editCount: {
            type: Number,
            default: 0
        },
        lastOpened: {
            type: Date,
            default: Date.now
        },
        lastModified: {
            type: Date,
            default: Date.now
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update stats when project is modified
projectSchema.pre('save', function(next) {
    if (this.isModified('editorState')) {
        this.stats.lastModified = new Date();
        this.stats.editCount += 1;
    }
    this.updatedAt = new Date();
    next();
});

// Index for efficient queries
projectSchema.index({ userId: 1, createdAt: -1 });
projectSchema.index({ userId: 1, folderId: 1 });
projectSchema.index({ userId: 1, status: 1 });

const Project = mongoose.model('Project', projectSchema);
export default Project;

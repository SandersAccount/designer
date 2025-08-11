import mongoose from 'mongoose';

const DesignTemplateSchema = new mongoose.Schema({
    name: { // Optional: A user-defined name for the template
        type: String,
        trim: true
    },
    inspirationId: { // Link back to the original inspiration if applicable
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inspiration',
        required: false // A template might not originate from an inspiration
    },
    previewImageUrl: { // URL for the thumbnail/preview image
        type: String,
        required: true
    },
    artboard: { // Dimensions and position of the artboard at save time
        x: { type: Number, required: true },
        y: { type: Number, required: true },
        width: { type: Number, required: true },
        height: { type: Number, required: true }
    },
    canvasObjects: { // Array storing the state of each object on the canvas
        type: Array, // We'll store the serialized objects directly
        required: true
    },
    // Editor state for complete template restoration
    editorState: {
        canvasBackgroundColor: { type: String, default: '#ffffff' },
        zoom: {
            scale: { type: Number, default: 1.0 },
            offsetX: { type: Number, default: 0 },
            offsetY: { type: Number, default: 0 }
        },
        selectedObjectIndex: { type: Number, default: -1 },
        nextId: { type: Number, default: 0 },
        // Store any additional editor settings that affect the design
        editorSettings: {
            type: Object,
            default: {}
        }
    },
    adminData: { // Data copied from the inspiration/admin tab
        imageUrl: { type: String },
        model: { type: String },
        prompt: { type: String },
        palette: { type: String },
        backgroundType: { type: String },
        originalPalette: { type: String }, // Original palette for Restyle functionality
        originalObject: { type: String },  // Original object for Restyle functionality
        fontStylesList: [{ type: Array }],  // Array of saved font style configurations
        decorStylesList: [{ type: Array }]  // Array of saved decoration and shadow style configurations
    },
    originalPalette: { // Default palette for this template when users select "Original Palette"
        type: String,
        default: '',
        required: false
    },
    originalObject: { // Default object/subject for this template
        type: String,
        default: '',
        required: false
    },
    fontStylesList: { // Array of saved font style configurations (top-level for easy access)
        type: Array,
        default: [],
        required: false
    },
    decorStylesList: { // Array of saved decoration and shadow style configurations (top-level for easy access)
        type: Array,
        default: [],
        required: false
    },
    cssFilterState: { // CSS filter slider values for template persistence
        type: Object,
        default: {},
        required: false
    },
    duotoneState: { // Duotone effect settings for template persistence
        type: Object,
        default: {},
        required: false
    },
    glitchState: { // Glitch effect settings for template persistence
        type: Object,
        default: {},
        required: false
    },
    halftoneState: { // Halftone effect settings for template persistence
        type: Object,
        default: {},
        required: false
    },
    guidelinesState: { // Guidelines state for template persistence
        type: Object,
        default: { guidelines: [], totalCount: 0 },
        required: false
    },
    layoutRectanglesState: { // Layout rectangles state for template persistence
        type: Object,
        default: { rectangles: [], totalCount: 0 },
        required: false
    },
    // Future enhancement: Add a way to mark specific text objects as variables
    // variableTexts: [{
    //     objectId: { type: Number }, // Link to the id in canvasObjects
    //     variableName: { type: String } // e.g., "Location", "Greeting"
    // }],
    userId: { // Associate template with a user (important for multi-user systems)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Make required if templates are user-specific
    },
    published: { // Control whether template appears in public inspiration gallery
        type: Boolean,
        default: true // Default to published for backward compatibility
    }
}, { timestamps: true }); // Adds createdAt and updatedAt automatically

// Add indexes for better query performance
DesignTemplateSchema.index({ published: 1, _id: -1 }); // Compound index for published templates sorted by creation
DesignTemplateSchema.index({ userId: 1, createdAt: -1 }); // Index for user's templates
DesignTemplateSchema.index({ createdAt: -1 }); // Index for sorting by creation date

export default mongoose.model('DesignTemplate', DesignTemplateSchema);

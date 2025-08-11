import mongoose from 'mongoose';

const themeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    prompt: {
        type: String,
        required: true
    },
    elements: {
        type: String,
        default: ''  // Comma-separated list of theme-specific elements
    },
    artStyles: {
        type: String,
        default: 'vintage, modern, classic, retro, urban'  // Default theme art styles
    },
    font: {
        type: String,
        default: undefined,  // Allow null/undefined values
        required: false     // Make it optional
    },
    look: {
        type: String,
        default: undefined,  // Allow null/undefined values
        required: false     // Make it optional
    },
    description: {
        type: String,
        required: true
    },
    order: {
        type: Number,
        default: 0
    },
    active: {
        type: Boolean,
        default: true
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

// Initialize orders for existing themes
themeSchema.statics.initializeOrders = async function() {
    const themes = await this.find({ order: { $exists: false } });
    const updatePromises = themes.map((theme, index) => {
        theme.order = index;
        return theme.save();
    });
    await Promise.all(updatePromises);
};

// Create the model if it hasn't been created yet
let Theme;
try {
    Theme = mongoose.model('Theme');
} catch (error) {
    Theme = mongoose.model('Theme', themeSchema);
}

// Initialize orders when the model is first loaded
Theme.initializeOrders().catch(console.error);

export default Theme;

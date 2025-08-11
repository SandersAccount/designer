import mongoose, { Schema } from 'mongoose';

const styleSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    prompt: {
        type: String,
        required: true
    },
    elements: {
        type: String,
        default: undefined,
        required: false
    },
    artStyles: {
        type: String,
        default: undefined,
        required: false
    },
    fontstyle: {
        type: String,
        default: undefined,
        required: false
    },
    feel: {
        type: String,
        default: undefined,
        required: false
    },
    imageUrl: {
        type: String,
        default: undefined,
        required: false
    },
    order: {
        type: Number,
        default: 0
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

// Initialize orders for existing styles
styleSchema.statics.initializeOrders = async function() {
    const styles = await this.find({ order: { $exists: false } });
    const updatePromises = styles.map((style, index) => {
        style.order = index;
        return style.save();
    });
    await Promise.all(updatePromises);
};

// Create the model if it hasn't been created yet
let Style;
try {
    Style = mongoose.model('Style');
} catch (error) {
    Style = mongoose.model('Style', styleSchema);
}

// Initialize orders when the model is first loaded
Style.initializeOrders().catch(console.error);

export default Style;

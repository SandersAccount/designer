import mongoose from 'mongoose';

const filterPresetSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    filters: {
        type: Object,
        required: true
    },
    isBuiltIn: {
        type: Boolean,
        default: false
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

// Update the updatedAt field before saving
filterPresetSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const FilterPreset = mongoose.model('FilterPreset', filterPresetSchema);

export default FilterPreset;

import mongoose from 'mongoose';

const comprehensivePresetSchema = new mongoose.Schema({
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
    preset: {
        // CSS Filters
        cssFilters: {
            type: Object,
            default: {}
        },
        // Duotone Effect
        duotone: {
            enabled: {
                type: Boolean,
                default: false
            },
            color1: {
                type: String,
                default: '#3B82F6'
            },
            color2: {
                type: String,
                default: '#EAB308'
            },
            matrix: {
                type: Array,
                default: null
            }
        },
        // Glitch Effects
        glitch: {
            enabled: {
                type: Boolean,
                default: false
            },
            effects: {
                type: Object,
                default: null
            }
        },
        // Halftone Effects
        halftone: {
            enabled: {
                type: Boolean,
                default: false
            },
            settings: {
                type: Object,
                default: null
            }
        },
        // Custom Image (base64 encoded)
        customImage: {
            type: String,
            default: null
        },
        // Version for future compatibility
        version: {
            type: String,
            default: '1.0'
        }
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
comprehensivePresetSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Index for faster queries
comprehensivePresetSchema.index({ key: 1 });
comprehensivePresetSchema.index({ createdAt: -1 });

const ComprehensivePreset = mongoose.model('ComprehensivePreset', comprehensivePresetSchema);

export default ComprehensivePreset;

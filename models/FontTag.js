import mongoose from 'mongoose';

const fontTagSchema = new mongoose.Schema({
    fontFamily: {
        type: String,
        required: true,
        trim: true,
        index: true // For fast lookups by font family
    },
    tags: [{
        type: String,
        required: true,
        trim: true,
        enum: [
            'Condensed',
            'Condensed Regular', 
            'Sans Serif',
            'Serif',
            'Elegant',
            'Modern',
            'Playful',
            'Bold',
            'Light',
            'Script',
            'Black',
            'Rounded',
            'Extended Regular',
            'Extended'
        ]
    }],
    // Track who created/modified the tags (for audit purposes)
    lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Allow system-level updates
    },
    // Usage statistics
    usageCount: {
        type: Number,
        default: 0
    },
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure one document per font family (unique constraint)
fontTagSchema.index({ fontFamily: 1 }, { unique: true });

// Create text index for searching
fontTagSchema.index({ fontFamily: 'text', tags: 'text' });

// Update the updatedAt field before saving
fontTagSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Static method to get all font tags
fontTagSchema.statics.getAllFontTags = async function() {
    try {
        const fontTags = await this.find({}).sort({ fontFamily: 1 });
        
        // Convert to the format expected by the frontend
        const result = {};
        fontTags.forEach(fontTag => {
            result[fontTag.fontFamily] = fontTag.tags;
        });
        
        return result;
    } catch (error) {
        console.error('Error getting all font tags:', error);
        return {};
    }
};

// Static method to update tags for a specific font
fontTagSchema.statics.updateFontTags = async function(fontFamily, tags, userId = null) {
    try {
        const updateData = {
            tags: tags,
            updatedAt: new Date()
        };
        
        if (userId) {
            updateData.lastModifiedBy = userId;
        }
        
        const result = await this.findOneAndUpdate(
            { fontFamily: fontFamily },
            updateData,
            { 
                upsert: true, // Create if doesn't exist
                new: true,    // Return updated document
                runValidators: true
            }
        );
        
        return result;
    } catch (error) {
        console.error('Error updating font tags:', error);
        throw error;
    }
};

// Static method to get tags for a specific font
fontTagSchema.statics.getFontTags = async function(fontFamily) {
    try {
        const fontTag = await this.findOne({ fontFamily: fontFamily });
        return fontTag ? fontTag.tags : [];
    } catch (error) {
        console.error('Error getting font tags:', error);
        return [];
    }
};

// Static method to search fonts by tag
fontTagSchema.statics.getFontsByTag = async function(tag) {
    try {
        const fontTags = await this.find({ tags: tag }).sort({ fontFamily: 1 });
        return fontTags.map(fontTag => fontTag.fontFamily);
    } catch (error) {
        console.error('Error getting fonts by tag:', error);
        return [];
    }
};

// Static method to get tag statistics
fontTagSchema.statics.getTagStatistics = async function() {
    try {
        const pipeline = [
            { $unwind: '$tags' },
            { 
                $group: { 
                    _id: '$tags', 
                    count: { $sum: 1 },
                    fonts: { $push: '$fontFamily' }
                } 
            },
            { $sort: { count: -1 } }
        ];
        
        const stats = await this.aggregate(pipeline);
        return stats;
    } catch (error) {
        console.error('Error getting tag statistics:', error);
        return [];
    }
};

const FontTag = mongoose.model('FontTag', fontTagSchema);

export default FontTag;

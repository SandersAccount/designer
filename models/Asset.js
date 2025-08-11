import mongoose from 'mongoose';
import crypto from 'crypto';
import path from 'path';

const AssetSchema = new mongoose.Schema({
    // Unique identifier for deduplication
    hash: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    // Human-readable asset identifier
    assetId: {
        type: String,
        unique: true,
        index: true,
        // Auto-generated from filename and category
    },

    // Original file information
    originalPath: {
        type: String,
        required: true,
        index: true // For fallback lookups
    },

    // Asset naming and identification
    name: {
        type: String,
        required: true,
        index: true // For search
    },

    filename: {
        type: String,
        required: true,
        index: true
    },

    // Asset content and metadata
    content: {
        type: String, // Base64 encoded or SVG content
        required: true
    },

    mimeType: {
        type: String,
        required: true
    },

    // B2 Storage information
    b2Url: {
        type: String,
        index: true // For quick lookups
    },

    b2FileName: {
        type: String,
        index: true // For B2 management operations
    },

    category: {
        type: String,
        enum: ['abstract', 'geometric', 'hand-drawn', 'ink', 'icons', 'masks', 'separators', 'grunge', 'images', 'other'],
        default: 'other',
        index: true
    },

    subcategory: {
        type: String,
        index: true // For more specific categorization
    },

    // Tagging system for easy discovery
    tags: [{
        type: String,
        lowercase: true,
        trim: true,
        index: true
    }],

    // Auto-generated tags from analysis
    autoTags: [{
        type: String,
        lowercase: true,
        trim: true
    }],
    
    // Usage tracking
    usageCount: {
        type: Number,
        default: 1
    },
    
    usedInProjects: [{
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project'
        },
        templateId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'DesignTemplate'
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // File metadata
    metadata: {
        size: Number,
        width: Number,
        height: Number,
        format: String
    },
    
    // Admin control
    isActive: {
        type: Boolean,
        default: true
    },
    
    createdAt: {
        type: Date,
        default: Date.now
    },
    
    lastUsed: {
        type: Date,
        default: Date.now
    }
});

// Indexes for fast lookups and search
AssetSchema.index({ hash: 1 });
AssetSchema.index({ assetId: 1 });
AssetSchema.index({ originalPath: 1 });
AssetSchema.index({ name: 'text' }); // Text search on name
AssetSchema.index({ category: 1, isActive: 1 });
AssetSchema.index({ subcategory: 1, isActive: 1 });
AssetSchema.index({ tags: 1 });
AssetSchema.index({ autoTags: 1 });
AssetSchema.index({ usageCount: -1 });
AssetSchema.index({ category: 1, subcategory: 1, tags: 1 }); // Compound index for filtering

// Static method to create or find asset with smart tagging
AssetSchema.statics.findOrCreate = async function(assetData) {
    const { originalPath, content, mimeType, category, subcategory, b2Url, b2FileName } = assetData;

    // Create hash from content for deduplication
    const hash = crypto.createHash('sha256').update(content).digest('hex');

    // Try to find existing asset
    let asset = await this.findOne({ hash });

    if (asset) {
        // Asset exists, increment usage
        asset.usageCount += 1;
        asset.lastUsed = new Date();
        await asset.save();
        return asset;
    }

    // Extract filename and create asset ID
    const filename = path.basename(originalPath);
    const nameWithoutExt = path.basename(originalPath, path.extname(originalPath));
    const assetId = this.generateAssetId(category, nameWithoutExt);

    // Generate tags from filename and path
    const tags = this.generateTags(originalPath, content);
    const autoTags = this.generateAutoTags(content, mimeType);

    // Create new asset
    asset = new this({
        hash,
        assetId,
        originalPath,
        name: nameWithoutExt.replace(/[-_]/g, ' '), // Human readable name
        filename,
        content,
        mimeType,
        category: category || this.detectCategory(originalPath),
        subcategory: subcategory || this.detectSubcategory(originalPath),
        tags,
        autoTags,
        b2Url, // Store B2 URL if provided
        b2FileName, // Store B2 filename if provided
        metadata: {
            size: Buffer.byteLength(content, 'utf8')
        }
    });

    await asset.save();
    return asset;
};

// Generate unique asset ID
AssetSchema.statics.generateAssetId = function(category, name) {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const timestamp = Date.now().toString(36);
    return `${category}-${cleanName}-${timestamp}`;
};

// Generate tags from filename and path
AssetSchema.statics.generateTags = function(originalPath, content) {
    const tags = new Set();

    // Extract from path segments
    const pathParts = originalPath.split('/').filter(part => part && part !== 'stock' && part !== 'shapes');
    pathParts.forEach(part => {
        tags.add(part.toLowerCase().replace(/[-_]/g, ' '));
    });

    // Extract from filename
    const filename = path.basename(originalPath, path.extname(originalPath));
    const filenameParts = filename.split(/[-_\s]+/);
    filenameParts.forEach(part => {
        if (part.length > 2) { // Ignore very short parts
            tags.add(part.toLowerCase());
        }
    });

    return Array.from(tags);
};

// Generate automatic tags from content analysis
AssetSchema.statics.generateAutoTags = function(content, mimeType) {
    const autoTags = [];

    if (mimeType === 'image/svg+xml') {
        autoTags.push('svg', 'vector');

        // Analyze SVG content for shapes
        if (content.includes('<circle')) autoTags.push('circle');
        if (content.includes('<rect')) autoTags.push('rectangle');
        if (content.includes('<path')) autoTags.push('path');
        if (content.includes('<polygon')) autoTags.push('polygon');
        if (content.includes('stroke')) autoTags.push('outline');
        if (content.includes('fill')) autoTags.push('filled');

        // Detect complexity
        const pathCount = (content.match(/<path/g) || []).length;
        if (pathCount > 5) autoTags.push('complex');
        else if (pathCount <= 2) autoTags.push('simple');
    }

    return autoTags;
};

// Detect category from path
AssetSchema.statics.detectCategory = function(originalPath) {
    const pathLower = originalPath.toLowerCase();

    if (pathLower.includes('/abstract')) return 'abstract';
    if (pathLower.includes('/geometric')) return 'geometric';
    if (pathLower.includes('/hand-drawn')) return 'hand-drawn';
    if (pathLower.includes('/ink')) return 'ink';
    if (pathLower.includes('/icons')) return 'icons';
    if (pathLower.includes('/masks')) return 'masks';
    if (pathLower.includes('/separators')) return 'separators';
    if (pathLower.includes('/grunge')) return 'grunge';

    return 'other';
};

// Detect subcategory from filename
AssetSchema.statics.detectSubcategory = function(originalPath) {
    const filename = path.basename(originalPath).toLowerCase();

    // Common subcategories
    if (filename.includes('heart')) return 'hearts';
    if (filename.includes('star')) return 'stars';
    if (filename.includes('arrow')) return 'arrows';
    if (filename.includes('line')) return 'lines';
    if (filename.includes('circle')) return 'circles';
    if (filename.includes('square') || filename.includes('rect')) return 'rectangles';
    if (filename.includes('triangle')) return 'triangles';
    if (filename.includes('flower')) return 'flowers';
    if (filename.includes('leaf')) return 'nature';
    if (filename.includes('brush')) return 'brushes';

    return null;
};

// Method to add project usage
AssetSchema.methods.addUsage = async function(projectId, templateId = null) {
    this.usedInProjects.push({
        projectId,
        templateId,
        addedAt: new Date()
    });
    this.usageCount += 1;
    this.lastUsed = new Date();
    await this.save();
};

// Static method for advanced asset search
AssetSchema.statics.searchAssets = async function(searchOptions = {}) {
    const {
        query = '',
        category = null,
        subcategory = null,
        tags = [],
        page = 1,
        limit = 20,
        sortBy = 'usageCount',
        sortOrder = -1,
        isActive = true
    } = searchOptions;

    // Build MongoDB query
    const mongoQuery = {};

    // Active filter
    if (isActive !== null) {
        mongoQuery.isActive = isActive;
    }

    // Category filter
    if (category) {
        mongoQuery.category = category;
    }

    // Subcategory filter
    if (subcategory) {
        mongoQuery.subcategory = subcategory;
    }

    // Tags filter
    if (tags.length > 0) {
        mongoQuery.$or = [
            { tags: { $in: tags } },
            { autoTags: { $in: tags } }
        ];
    }

    // Text search
    if (query) {
        mongoQuery.$or = mongoQuery.$or || [];
        mongoQuery.$or.push(
            { name: { $regex: query, $options: 'i' } },
            { filename: { $regex: query, $options: 'i' } },
            { tags: { $regex: query, $options: 'i' } },
            { autoTags: { $regex: query, $options: 'i' } },
            { assetId: { $regex: query, $options: 'i' } }
        );
    }

    // Execute query with pagination using aggregation pipeline with allowDiskUse
    const aggregationPipeline = [
        { $match: mongoQuery },
        { $sort: { [sortBy]: sortOrder } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        { $project: { content: 0 } } // Exclude content for list view
    ];

    // Try aggregation first, fallback to simple find if memory limit exceeded
    let assets;
    try {
      assets = await this.aggregate(aggregationPipeline);
    } catch (error) {
      if (error.code === 292) { // QueryExceededMemoryLimitNoDiskUseAllowed
        console.log('[Assets] Aggregation memory limit exceeded, falling back to simple query');
        // Fallback to simple find without sorting for large datasets
        const query = this.find(mongoQuery, { content: 0 });

        // Apply pagination
        const skip = (page - 1) * limit;
        assets = await query.skip(skip).limit(limit);
      } else {
        throw error;
      }
    }

    const total = await this.countDocuments(mongoQuery);

    return {
        assets,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        },
        query: mongoQuery
    };
};

// Static method to get popular tags
AssetSchema.statics.getPopularTags = async function(limit = 50) {
    const tagAggregation = await this.aggregate([
        { $match: { isActive: true } },
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: limit }
    ]);

    const autoTagAggregation = await this.aggregate([
        { $match: { isActive: true } },
        { $unwind: '$autoTags' },
        { $group: { _id: '$autoTags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: limit }
    ]);

    return {
        userTags: tagAggregation.map(t => ({ tag: t._id, count: t.count })),
        autoTags: autoTagAggregation.map(t => ({ tag: t._id, count: t.count }))
    };
};

// Static method to get category statistics
AssetSchema.statics.getCategoryStats = async function() {
    return await this.aggregate([
        { $match: { isActive: true } },
        {
            $group: {
                _id: {
                    category: '$category',
                    subcategory: '$subcategory'
                },
                count: { $sum: 1 },
                totalUsage: { $sum: '$usageCount' }
            }
        },
        { $sort: { '_id.category': 1, '_id.subcategory': 1 } }
    ]);
};

// Method to add custom tags
AssetSchema.methods.addTags = async function(newTags) {
    const tagsToAdd = newTags.filter(tag => !this.tags.includes(tag.toLowerCase()));
    this.tags.push(...tagsToAdd.map(tag => tag.toLowerCase()));
    await this.save();
    return this.tags;
};

// Method to remove tags
AssetSchema.methods.removeTags = async function(tagsToRemove) {
    this.tags = this.tags.filter(tag => !tagsToRemove.includes(tag));
    await this.save();
    return this.tags;
};

const Asset = mongoose.model('Asset', AssetSchema);
export default Asset;

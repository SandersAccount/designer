import mongoose from 'mongoose';

const projectFolderSchema = new mongoose.Schema({
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
    color: {
        type: String,
        default: '#3b82f6' // Default blue color
    },
    icon: {
        type: String,
        default: 'folder' // Font Awesome icon name
    },
    // Folder hierarchy support
    parentFolderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProjectFolder',
        default: null // null means root folder
    },
    // Statistics
    stats: {
        projectCount: {
            type: Number,
            default: 0
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

// Update stats when folder is modified
projectFolderSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    this.stats.lastModified = new Date();
    next();
});

// Index for efficient queries
projectFolderSchema.index({ userId: 1, createdAt: -1 });
projectFolderSchema.index({ userId: 1, parentFolderId: 1 });

const ProjectFolder = mongoose.model('ProjectFolder', projectFolderSchema);
export default ProjectFolder;

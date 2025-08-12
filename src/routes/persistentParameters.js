import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// Define the PersistentParameter schema and model
const persistentParameterSchema = new mongoose.Schema({
    objectId: {
        type: String,
        required: true,
        index: true
    },
    parameterName: {
        type: String,
        required: true,
        enum: ['newColorIntensity', 'newTemplateId']
    },
    value: {
        type: String,
        required: true
    },
    templateId: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Create compound index for efficient queries
persistentParameterSchema.index({ objectId: 1, parameterName: 1 }, { unique: true });

const PersistentParameter = mongoose.model('PersistentParameter', persistentParameterSchema);

// POST /api/persistent-parameters - Save or update a persistent parameter
router.post('/', async (req, res) => {
    try {
        console.log('💾 === PERSISTENT PARAMETER REQUEST ===');
        console.log('💾 Request body:', JSON.stringify(req.body, null, 2));
        console.log('💾 Request headers content-type:', req.headers['content-type']);

        const { objectId, parameterName, value, templateId } = req.body;

        console.log('💾 Extracted values:', {
            objectId: objectId,
            parameterName: parameterName,
            value: value,
            valueType: typeof value,
            templateId: templateId
        });

        // Simple validation - just check if we have the basic fields (objectId can be 0, so check for null/undefined specifically)
        if (objectId === null || objectId === undefined || !parameterName) {
            console.log('💾 Validation failed - missing objectId or parameterName');
            console.log('💾 objectId present:', objectId !== null && objectId !== undefined);
            console.log('💾 parameterName present:', !!parameterName);
            return res.status(400).json({
                error: 'Missing objectId or parameterName',
                received: { objectId, parameterName, value, templateId }
            });
        }

        // Check if parameterName is valid according to schema enum
        const validParameterNames = ['newColorIntensity', 'newTemplateId'];
        if (!validParameterNames.includes(parameterName)) {
            console.log('💾 Invalid parameterName for schema enum:', parameterName);
            console.log('💾 Valid parameter names:', validParameterNames);
            return res.status(400).json({
                error: `Invalid parameter name. Must be one of: ${validParameterNames.join(', ')}`,
                received: parameterName
            });
        }

        // Allow empty values - convert undefined to empty string
        const finalValue = value !== undefined ? value : '';

        // Convert objectId to string to match schema
        const objectIdString = String(objectId);

        console.log(`💾 Saving persistent parameter: ${parameterName} = ${finalValue} for object ${objectIdString}`);

        // Use upsert to create or update the parameter
        const result = await PersistentParameter.findOneAndUpdate(
            { objectId: objectIdString, parameterName },
            {
                value: finalValue,
                templateId,
                updatedAt: new Date()
            },
            {
                upsert: true,
                new: true,
                runValidators: true
            }
        );

        console.log(`💾 Successfully saved persistent parameter:`, result);

        res.json({
            success: true,
            data: result,
            message: `Persistent parameter ${parameterName} saved successfully`
        });

    } catch (error) {
        console.error('💾 Error saving persistent parameter:', error);
        console.error('💾 Error details:', error.message);
        console.error('💾 Error stack:', error.stack);
        res.status(500).json({
            error: 'Failed to save persistent parameter',
            details: error.message
        });
    }
});

// GET /api/persistent-parameters/:objectId - Get all persistent parameters for an object
router.get('/:objectId', async (req, res) => {
    try {
        const { objectId } = req.params;

        console.log(`💾 === GET REQUEST === Retrieving persistent parameters for object: ${objectId}`);

        const parameters = await PersistentParameter.find({ objectId });

        console.log(`💾 === GET RESULT === Found ${parameters.length} persistent parameters for object ${objectId}:`, parameters.map(p => ({ name: p.parameterName, value: p.value })));

        // Convert to a more convenient format
        const result = {};
        parameters.forEach(param => {
            result[param.parameterName] = {
                value: param.value,
                templateId: param.templateId,
                updatedAt: param.updatedAt
            };
        });

        res.json({
            success: true,
            data: result,
            count: parameters.length
        });

    } catch (error) {
        console.error('💾 Error retrieving persistent parameters:', error);
        res.status(500).json({
            error: 'Failed to retrieve persistent parameters',
            details: error.message
        });
    }
});

// GET /api/persistent-parameters - Get all persistent parameters (with optional filters)
router.get('/', async (req, res) => {
    try {
        const { templateId, parameterName, limit = 100 } = req.query;

        const filter = {};
        if (templateId) filter.templateId = templateId;
        if (parameterName) filter.parameterName = parameterName;

        console.log(`💾 Retrieving persistent parameters with filter:`, filter);

        const parameters = await PersistentParameter.find(filter)
            .limit(parseInt(limit))
            .sort({ updatedAt: -1 });

        console.log(`💾 Found ${parameters.length} persistent parameters`);

        res.json({
            success: true,
            data: parameters,
            count: parameters.length
        });

    } catch (error) {
        console.error('💾 Error retrieving persistent parameters:', error);
        res.status(500).json({
            error: 'Failed to retrieve persistent parameters',
            details: error.message
        });
    }
});

// DELETE /api/persistent-parameters/:objectId/:parameterName - Delete a specific persistent parameter
router.delete('/:objectId/:parameterName', async (req, res) => {
    try {
        const { objectId, parameterName } = req.params;

        console.log(`💾 Deleting persistent parameter: ${parameterName} for object ${objectId}`);

        const result = await PersistentParameter.findOneAndDelete({ objectId, parameterName });

        if (!result) {
            return res.status(404).json({
                error: 'Persistent parameter not found'
            });
        }

        console.log(`💾 Successfully deleted persistent parameter:`, result);

        res.json({
            success: true,
            message: `Persistent parameter ${parameterName} deleted successfully`,
            data: result
        });

    } catch (error) {
        console.error('💾 Error deleting persistent parameter:', error);
        res.status(500).json({
            error: 'Failed to delete persistent parameter',
            details: error.message
        });
    }
});

export default router;






import express from 'express';
import designTemplatesRouter from './designTemplates.js';

const router = express.Router();

// This is an alias route for design-templates to maintain compatibility
// Forward all requests to the design-templates router
router.use('/', designTemplatesRouter);

export default router;

import express from 'express';
import Replicate from 'replicate';
import { auth } from '../../middleware/auth.js';

const router = express.Router();

// Initialize Replicate
const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

// @desc    Generate texts for template using AI
// @route   POST /api/generate-texts
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const { prompt, objectInput, textCount } = req.body;

        if (!prompt || !objectInput) {
            return res.status(400).json({ error: 'Missing required fields: prompt and objectInput' });
        }

        console.log('🤖 Text generation request:', {
            objectInput,
            textCount,
            promptLength: prompt.length
        });

        // Prepare the input for OpenAI o4-mini
        const input = {
            prompt: prompt,
            image_input: [],
            system_prompt: "marketing",
            reasoning_effort: "medium",
            max_completion_tokens: 4096
        };

        console.log('🤖 Calling OpenAI o4-mini with input:', input);

        // Call OpenAI o4-mini via Replicate
        let fullResponse = '';
        for await (const event of replicate.stream("openai/o4-mini", { input })) {
            fullResponse += event.toString();
        }

        console.log('🤖 Raw AI response:', fullResponse);

        // Parse the response to extract texts
        const texts = parseTextResponse(fullResponse, textCount || 3);
        
        console.log('🤖 Parsed texts:', texts);

        if (texts.length === 0) {
            throw new Error('Failed to parse any texts from AI response');
        }

        res.json({
            success: true,
            texts: texts,
            rawResponse: fullResponse
        });

    } catch (error) {
        console.error('Error generating texts:', error);
        res.status(500).json({ 
            error: 'Failed to generate texts',
            details: error.message 
        });
    }
});

// Helper function to parse the AI response and extract texts
function parseTextResponse(response, expectedCount = 3) {
    const texts = [];

    try {
        console.log('🔍 Parsing AI response:', response);

        // Split response into lines and filter out empty ones
        const lines = response.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        console.log('📝 Non-empty lines:', lines);

        // Simple approach: take the first N non-empty lines as our texts
        for (let i = 0; i < Math.min(expectedCount, lines.length); i++) {
            let text = lines[i];

            // Remove any leading numbers, bullets, or labels
            text = text.replace(/^\d+\.\s*/, ''); // Remove "1. ", "2. ", etc.
            text = text.replace(/^[-•*]\s*/, ''); // Remove bullet points
            text = text.replace(/^text-?\d+:?\s*/i, ''); // Remove "text-01:", "text1", etc.

            // Remove quotes if they wrap the entire text
            text = text.replace(/^["'](.*)["']$/, '$1');

            // Clean up extra whitespace
            text = text.trim();

            if (text.length > 0) {
                texts.push(text);
                console.log(`✅ Found text ${i + 1}: "${text}"`);
            }
        }

        console.log('📝 Final parsed texts:', texts);

    } catch (error) {
        console.error('Error parsing text response:', error);
    }

    return texts.slice(0, expectedCount); // Ensure we don't return more than expected
}

export default router;






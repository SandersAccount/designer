import path from 'path';
import fs from 'fs';

const imageHandler = async (req, res, next) => {
    if (req.url.startsWith('/uploads/') || req.url.startsWith('/storage/') || req.url.startsWith('/images/')) {
        console.log('Image request:', req.url);

        // Check if it's a Backblaze URL
        if (req.url.includes('backblazeb2.com') || req.url.includes('f005.backblazeb2.com')) {
            try {
                // Get Backblaze credentials from env
                const B2_KEY_ID = process.env.B2_APPLICATION_KEY_ID;
                const B2_APP_KEY = process.env.B2_APPLICATION_KEY;
                const B2_BUCKET = process.env.B2_BUCKET_ID;

                if (!B2_KEY_ID || !B2_APP_KEY || !B2_BUCKET) {
                    console.error('Missing Backblaze credentials');
                    return next();
                }

                // Create authorization header
                const credentials = Buffer.from(`${B2_KEY_ID}:${B2_APP_KEY}`).toString('base64');

                // Get authorization token
                const authResponse = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
                    headers: {
                        'Authorization': `Basic ${credentials}`
                    }
                });

                if (!authResponse.ok) {
                    const error = await authResponse.json();
                    console.error('Backblaze auth error:', error);
                    throw new Error('Failed to authenticate with Backblaze');
                }

                const authData = await authResponse.json();
                console.log('Got Backblaze auth token');

                // Extract file name from URL
                const fileName = req.url.split('/').pop();
                const downloadUrl = `${authData.downloadUrl}/file/${B2_BUCKET}/${fileName}`;
                console.log('Fetching from Backblaze:', downloadUrl);

                // Forward the request to Backblaze
                const response = await fetch(downloadUrl, {
                    headers: {
                        'Authorization': authData.authorizationToken
                    }
                });

                if (!response.ok) {
                    console.error('Backblaze fetch error:', await response.text());
                    throw new Error(`Failed to fetch image: ${response.statusText}`);
                }

                // Set appropriate headers
                res.set('Content-Type', response.headers.get('content-type'));
                res.set('Content-Length', response.headers.get('content-length'));
                res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

                // Stream the image back to the client
                response.body.pipe(res);
            } catch (error) {
                console.error('Error fetching Backblaze image:', error);
                next(error);
            }
        } else {
            // For local files, check multiple directories
            const possiblePaths = [
                path.join(__dirname, '..', req.url), // Direct path
                path.join(__dirname, '..', 'public', req.url), // Under public
                path.join(__dirname, '..', req.url.replace('/storage/', '/uploads/')), // Convert storage to uploads
                path.join(__dirname, '..', 'public', req.url.replace('/storage/', '/uploads/')), // Convert storage to uploads under public
                path.join(__dirname, '..', req.url.replace('/images/', '/uploads/')), // Convert images to uploads
                path.join(__dirname, '..', 'public', req.url.replace('/images/', '/uploads/')) // Convert images to uploads under public
            ];

            // Try each path
            for (const filePath of possiblePaths) {
                if (fs.existsSync(filePath)) {
                    console.log('Found image at:', filePath);
                    return res.sendFile(filePath);
                }
            }

            console.log('Image not found in any location:', {
                url: req.url,
                triedPaths: possiblePaths
            });
            next();
        }
    } else {
        next();
    }
};

export default imageHandler;

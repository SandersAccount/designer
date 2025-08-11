import fetch from 'node-fetch';
import B2Client from 'backblaze-b2';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// REMOVE global b2 initialization

const BUCKET_NAME = process.env.B2_BUCKET_NAME || 'stickers-replicate-app';
// BUCKET_ID is read from process.env later
const B2_DOMAIN = 'f005.backblazeb2.com';

class B2Storage {
    constructor() {
        this.b2 = null; // Initialize b2 client as null
        this.authData = null;
        this.authTimer = null;
        this.TOKEN_REFRESH_INTERVAL = 23 * 60 * 60 * 1000; // Refresh 1 hour before 24-hour expiration
    }

    // Initialize B2 client on demand
    initializeB2Client() {
        if (!this.b2) {
            console.log('[Storage] Initializing B2Client...');
            if (!process.env.B2_APPLICATION_KEY_ID || !process.env.B2_APPLICATION_KEY) {
                 console.error('[Storage] Error: B2 credentials missing in environment variables!');
                 throw new Error('B2 credentials missing in environment variables!');
            }
            this.b2 = new B2Client({
                applicationKeyId: process.env.B2_APPLICATION_KEY_ID,
                applicationKey: process.env.B2_APPLICATION_KEY
            });
            console.log('[Storage] B2Client initialized.');
        }
        return this.b2;
    }

    async refreshAuth() {
        try {
            const b2Client = this.initializeB2Client(); // Ensure client is initialized
            console.log('[Storage] Refreshing B2 authorization...');
            const auth = await b2Client.authorize(); // Use the instance's client

            // Log specific expected properties instead of stringifying the whole object
            console.log('[Storage] Auth response received. Checking properties...');
            console.log(`[Storage] auth exists: ${!!auth}`);
            console.log(`[Storage] auth.data exists: ${!!(auth && auth.data)}`);
            if (auth && auth.data) {
                 console.log(`[Storage] auth.data.downloadUrl: ${auth.data.downloadUrl}`);
                 console.log(`[Storage] auth.data.authorizationToken exists: ${!!auth.data.authorizationToken}`);
                 // Avoid logging the full token itself for security, just check its presence
            }

            // Check if the expected data structure exists
            if (auth && auth.data && auth.data.downloadUrl && auth.data.authorizationToken) {
                this.authData = auth.data; // Store the actual data part
                console.log('[Storage] B2 authorization refreshed successfully and authData assigned.');
                // Schedule next refresh
                this.scheduleTokenRefresh();
            } else {
                console.error('[Storage] Error: B2 authorize response is missing expected data.', auth);
                this.authData = null; // Ensure authData is null if incomplete
                throw new Error('B2 authorization response incomplete.');
            }
        } catch (error) {
            console.error('[Storage] Failed to refresh B2 authorization:', error); // Log the specific error
            // Clear auth data so next request will try to reauthorize
            this.authData = null;
            // Try again in 5 minutes if refresh failed
            setTimeout(() => this.refreshAuth(), 5 * 60 * 1000);
        }
    }

    scheduleTokenRefresh() {
        // Clear any existing timer
        if (this.authTimer) {
            clearTimeout(this.authTimer);
        }
        
        // Schedule next refresh
        this.authTimer = setTimeout(() => this.refreshAuth(), this.TOKEN_REFRESH_INTERVAL);
    }

    async ensureAuthorized() {
        if (!this.authData) {
            await this.refreshAuth();
        }
        return this.authData;
    }

    async getUploadUrl() {
        await this.ensureAuthorized();
        const b2Client = this.initializeB2Client(); // Get initialized client
        const bucketId = process.env.B2_BUCKET_ID; // Get BUCKET_ID from env
        if (!bucketId) {
            console.error('[Storage] Error: B2_BUCKET_ID missing from environment variables!');
            throw new Error('B2_BUCKET_ID missing from environment variables!');
        }
        return b2Client.getUploadUrl({ // Use the initialized client
            bucketId: bucketId
        });
    }

    getPublicUrl(fileName) {
        return `https://${B2_DOMAIN}/file/${BUCKET_NAME}/${fileName}`;
    }

    async uploadBuffer(buffer, prefix = '', userId) {
        try {
            console.log('[B2Upload] ===== UPLOAD BUFFER DEBUG =====');
            console.log('[B2Upload] Buffer size:', buffer.length);
            console.log('[B2Upload] Prefix:', prefix);
            console.log('[B2Upload] User ID:', userId);
            console.log('[B2Upload] Starting file upload to B2...');

            await this.ensureAuthorized();
            console.log('[B2Upload] B2 authorization successful');
            console.log('[B2Upload] Auth data exists:', !!this.authData);
            console.log('[B2Upload] Download URL:', this.authData?.downloadUrl);

            // Clean the prefix and ensure it ends with a forward slash
            prefix = prefix.replace(/^\/+|\/+$/g, '');
            if (prefix && !prefix.endsWith('/')) {
                prefix += '/';
            }

            // Generate a unique filename with timestamp, user ID, and random string
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(7);
            // Use 'anonymous' if userId is undefined
            const userFolder = userId || 'anonymous';
            const fileName = `${prefix}${userFolder}/${timestamp}-${random}.png`;
            console.log('Generated filename:', fileName);
            
            console.log('Getting upload URL...');
            const uploadUrl = await this.getUploadUrl();
            console.log('Got upload URL:', uploadUrl.data.uploadUrl);
            
            console.log('Uploading file to B2...');
            const uploadResponse = await fetch(uploadUrl.data.uploadUrl, {
                method: 'POST',
                headers: {
                    'Authorization': uploadUrl.data.authorizationToken,
                    'Content-Type': 'image/png',
                    'X-Bz-File-Name': fileName,
                    'X-Bz-Content-Sha1': 'do_not_verify'
                },
                body: buffer
            });

            if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
                console.error('B2 upload failed:', errorText);
                throw new Error(`Failed to upload to B2: ${errorText}`);
            }

            const uploadData = await uploadResponse.json();
            console.log('Upload successful, response:', uploadData);
            
            const publicUrl = this.getPublicUrl(uploadData.fileName);
            console.log('Generated public URL:', publicUrl);

            return {
                url: publicUrl,
                fileName: uploadData.fileName
            };
        } catch (error) {
            console.error('Error uploading to B2:', error);
            throw new Error(`Failed to upload file: ${error.message}`);
        }
    }

    async uploadFile(filePath, fileName) {
        try {
            // Ensure authorization is valid
            if (!this.authData) {
                await this.refreshAuth();
            }

            // Read file data
            const fileData = await fs.promises.readFile(filePath);
            const fileSize = fileData.length;
            const b2Client = this.initializeB2Client(); // Get initialized client
            const bucketId = process.env.B2_BUCKET_ID; // Get BUCKET_ID from env
             if (!bucketId) {
                console.error('[Storage] Error: B2_BUCKET_ID missing from environment variables!');
                throw new Error('B2_BUCKET_ID missing from environment variables!');
            }

            // Get upload URL
            const { data: uploadUrlData } = await b2Client.getUploadUrl({ bucketId: bucketId }); // Use client and env var

            // Upload file
            const { data: uploadData } = await b2Client.uploadFile({ // Use client
                uploadUrl: uploadUrlData.uploadUrl,
                uploadAuthToken: uploadUrlData.authorizationToken,
                fileName: fileName,
                data: fileData,
                mime: 'image/png',
                contentLength: fileSize
            });

            console.log('File uploaded successfully:', uploadData);

            // Return the file URL
            return `https://${B2_DOMAIN}/file/${BUCKET_NAME}/${fileName}`;
        } catch (error) {
            console.error('Failed to upload file to B2:', error);
            throw error;
        }
    }

    async deleteFile(fileName) {
        try {
            await this.ensureAuthorized();
            const b2Client = this.initializeB2Client(); // Get initialized client
            const bucketId = process.env.B2_BUCKET_ID; // Get BUCKET_ID from env
             if (!bucketId) {
                console.error('[Storage] Error: B2_BUCKET_ID missing from environment variables!');
                throw new Error('B2_BUCKET_ID missing from environment variables!');
            }

            const response = await b2Client.listFileNames({ // Use client and env var
                bucketId: bucketId,
                startFileName: fileName,
                maxFileCount: 1
            });

            if (response.data.files.length > 0 && response.data.files[0].fileName === fileName) {
                await b2Client.deleteFileVersion({ // Use client
                    fileId: response.data.files[0].fileId,
                    fileName: fileName
                });
            }
        } catch (error) {
            console.error('Error deleting file from B2:', error);
            throw new Error('Failed to delete file');
        }
    }

    async getImagePublicUrl(fileName) {
        return this.getPublicUrl(fileName);
    }

    getAuthData() {
        return this.authData;
    }

    async saveImageFromUrl(url, prefix = 'generations', userId) {
        try {
            console.log('Downloading image from URL:', url);
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
            }
            
            const buffer = await response.arrayBuffer();
            console.log('Downloaded image buffer size:', buffer.byteLength);
            
            // Upload the downloaded image to B2
            const uploadResult = await this.uploadBuffer(Buffer.from(buffer), prefix, userId);
            console.log('Upload successful:', uploadResult);
            
            return {
                publicUrl: uploadResult.url,
                fileName: uploadResult.fileName
            };
        } catch (error) {
            console.error('Error saving image from URL:', error);
            throw new Error(`Failed to save image from URL: ${error.message}`);
        }
    }
}

export const storage = new B2Storage();

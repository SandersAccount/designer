import fetch from 'node-fetch';
import B2Client from 'backblaze-b2';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize B2 with required options
const b2 = new B2Client({
    applicationKeyId: process.env.B2_APPLICATION_KEY_ID,
    applicationKey: process.env.B2_APPLICATION_KEY
});

const BUCKET_NAME = process.env.B2_BUCKET_NAME || 'stickers-replicate-app';
const BUCKET_ID = process.env.B2_BUCKET_ID;
const B2_DOMAIN = 'f005.backblazeb2.com';

class B2Storage {
    constructor() {
        this.authData = null;
        this.authTimer = null;
        this.TOKEN_REFRESH_INTERVAL = 23 * 60 * 60 * 1000; // Refresh 1 hour before 24-hour expiration
    }

    async refreshAuth() {
        try {
            console.log('Refreshing B2 authorization...');
            const auth = await b2.authorize();
            this.authData = auth;
            console.log('B2 authorization refreshed successfully', auth);
            
            // Schedule next refresh
            this.scheduleTokenRefresh();
        } catch (error) {
            console.error('Failed to refresh B2 authorization:', error);
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
        return b2.getUploadUrl({
            bucketId: BUCKET_ID
        });
    }

    getPublicUrl(fileName) {
        return `https://${B2_DOMAIN}/file/${BUCKET_NAME}/${fileName}`;
    }

    async uploadBuffer(buffer, prefix = '', userId) {
        try {
            console.log('Starting file upload to B2...');
            await this.ensureAuthorized();
            console.log('B2 authorization successful');

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

            // Get upload URL
            const { data: uploadUrlData } = await b2.getUploadUrl({ bucketId: BUCKET_ID });

            // Upload file
            const { data: uploadData } = await b2.uploadFile({
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

            const response = await b2.listFileNames({
                bucketId: BUCKET_ID,
                startFileName: fileName,
                maxFileCount: 1
            });

            if (response.data.files.length > 0 && response.data.files[0].fileName === fileName) {
                await b2.deleteFileVersion({
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

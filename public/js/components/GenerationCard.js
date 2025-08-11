import { CollectionSelector } from './CollectionSelector.js';
import { showToast } from './Toast.js';

export class GenerationCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._imageUrl = '';
        this._prompt = '';
        this._isUpscaled = false;
        this._id = '';
        this._isUpscaling = false;
        this._isDownloading = false;
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    static get observedAttributes() {
        return ['image-url', 'prompt', 'generation-id', 'is-upscaled'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        
        switch (name) {
            case 'image-url':
                this.imageUrl = newValue;
                break;
            case 'prompt':
                this._prompt = newValue;
                break;
            case 'generation-id':
                this._id = newValue;
                break;
            case 'is-upscaled':
                this._isUpscaled = newValue === 'true' || newValue === true;
                break;
        }
    }

    set imageUrl(value) {
        if (value !== this._imageUrl) {
            // Make sure we have a valid URL
            try {
                // If it's a relative URL, convert to absolute
                if (!value.startsWith('http')) {
                    const a = document.createElement('a');
                    a.href = value;
                    this._imageUrl = a.href;
                } else {
                    this._imageUrl = value;
                }
                // Validate the URL
                new URL(this._imageUrl);
            } catch (e) {
                console.error('Invalid image URL:', value);
                this._imageUrl = '';
            }
            this.render();
        }
    }

    get imageUrl() {
        return this._imageUrl;
    }

    get prompt() {
        return this._prompt;
    }

    set prompt(value) {
        this._prompt = value;
        this.setAttribute('prompt', value);
    }

    get isUpscaled() {
        return this._isUpscaled;
    }

    set isUpscaled(value) {
        this._isUpscaled = value;
        this.setAttribute('is-upscaled', value);
    }

    get id() {
        return this._id;
    }

    set id(value) {
        this._id = value;
        this.setAttribute('generation-id', value);
    }

    checkAndRemoveDuplicate() {
        if (!this._imageUrl) return;
        
        // Get all generation cards
        const allCards = document.querySelectorAll('generation-card');
        const currentIndex = Array.from(allCards).indexOf(this);
        
        // Check for duplicates before this card
        allCards.forEach((card, index) => {
            if (index !== currentIndex && 
                card.getAttribute('image-url') === this._imageUrl) {
                // If this is a newer card (higher index), remove the old one
                if (currentIndex > index) {
                    card.remove();
                }
            }
        });
    }

    getImageData() {
        return {
            imageUrl: this._imageUrl,
            prompt: this._prompt,
            timestamp: new Date().toISOString()
        };
    }

    render() {
        if (!this._imageUrl) {
            console.error('No image URL provided');
            return;
        }

        const upscaleButton = this._isUpscaled ? '' : `
            <button class="menu-button" data-action="upscale" title="Upscale Image">
                <img src="/images/ph--arrow-square-up-right-light.svg" />
                Upscale Image
            </button>
        `;

        const hdBadge = this._isUpscaled ? `
            <div class="hd-badge">
                <img src="/images/ph--arrow-square-up-right-light.svg" />
                HD
            </div>
        ` : '';

        const isAdmin = window.localStorage.getItem('isAdmin') === 'true';
        console.log('Admin status check:', { isAdmin, rawValue: window.localStorage.getItem('isAdmin') });

        const template = `
            <style>
                :host {
                    display: block;
                    position: relative;
                    width: 100%;
                    height: 100%;
                }

                .image-container {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                    border-radius: 8px;
                }

                img.generation-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .menu-overlay {
                    position: absolute;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    padding: 12px;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                    gap: 2px;
                    opacity: 0;
                    transition: opacity 0.2s;
                    background: linear-gradient(to left, rgba(0,0,0,0.5), transparent);
                }

                .image-container:hover .menu-overlay {
                    opacity: 1;
                }

                .menu-button {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 6px 12px;
                    border: none;
                    border-radius: 4px;
                    background: rgba(255, 255, 255, 0.9);
                    color: #333;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s;
                    min-width: 100px;
                    justify-content: flex-start;
                }

                .menu-button:hover {
                    background: rgba(255, 255, 255, 1);
                    transform: translateY(-1px);
                }

                .menu-button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none;
                }

                .menu-button img {
                    width: 16px;
                    height: 16px;
                }

                .menu-button[data-action="delete"]:hover {
                    background: rgba(255, 100, 100, 0.9);
                    color: white;
                }

                .menu-button[data-action="delete"]:hover img {
                    filter: brightness(0) invert(1);
                }

                .hd-badge {
                    position: absolute;
                    top: 12px;
                    left: 12px;
                    background: rgba(255, 255, 255, 0.9);
                    color: #333;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: bold;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    z-index: 10;
                }

                .hd-badge img {
                    width: 14px;
                    height: 14px;
                }

                .error-message {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background-color: rgba(255, 0, 0, 0.7);
                    color: white;
                    padding: 10px 15px;
                    border-radius: 5px;
                    font-size: 14px;
                    text-align: center;
                }
                
                .admin-action-bar {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: rgba(0, 0, 0, 0.7);
                    padding: 8px;
                    display: flex;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.2s;
                }
                
                .image-container:hover .admin-action-bar {
                    opacity: 1;
                }
                
                .admin-button {
                    background: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    padding: 6px 12px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 14px;
                }
                
                .admin-button:hover {
                    background: #45a049;
                }
                
                .admin-button img {
                    width: 16px;
                    height: 16px;
                    filter: brightness(0) invert(1);
                }
                
                .spin {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    0% {
                        transform: rotate(0deg);
                    }
                    100% {
                        transform: rotate(360deg);
                    }
                }
            </style>
            <div class="image-container">
                <img class="generation-image" src="${this._imageUrl}" alt="${this._prompt || 'Generated image'}" />
                ${hdBadge}
                <div class="menu-overlay">
                    ${upscaleButton}
                    <button class="menu-button" data-action="collection" title="Add to Collection">
                        <img src="/images/ph--folder-simple-plus-light.svg" />
                        Add to Collection
                    </button>
                    ${isAdmin ? `
                        <button class="menu-button" data-action="inspiration" title="Save to Generations">
                            <img src="/images/ph--lightbulb-light.svg" />
                            Save to Generations
                        </button>
                    ` : ''}
                    <button class="menu-button" data-action="download" title="Download Image">
                        <img src="/images/ph--download-simple-light.svg" />
                        Download
                    </button>
                    <button class="menu-button" data-action="bgremove" title="Remove Background">
                        <img src="/images/ph--images-square-light.svg" />
                        BG Remove
                    </button>
                    <button class="menu-button" data-action="text-edit" title="Text Editor">
                        <img src="/images/ph-note-pencil-light-icon.svg" />
                        Edit
                    </button>
                    <button class="menu-button" data-action="edit" title="InPainting Editor">
                        <img src="/images/ph--pencil-line-light%20(1).svg" />
                        InPainting
                    </button>
                    <button class="menu-button" data-action="delete" title="Delete Image">
                        <img src="/images/ph--trash-light.svg" />
                        Delete Image
                    </button>
                </div>
                ${isAdmin ? `
                <div class="admin-action-bar">
                    <button class="admin-button" data-action="inspiration" title="Save to Generations">
                        <img src="/images/ph--lightbulb-light.svg" />
                        Save to Generations
                    </button>
                </div>
                ` : ''}
            </div>
        `;

        this.shadowRoot.innerHTML = template;
        this.setupEventListeners();
    }

    setupEventListeners() {
        const container = this.shadowRoot.querySelector('.image-container');
        if (!container) return;

        // Add error handler for the image
        const img = container.querySelector('.generation-image');
        if (img) {
            img.addEventListener('error', () => {
                img.style.display = 'none';
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.textContent = 'Failed to load image';
                container.appendChild(errorDiv);
            });
        }

        // Add click handlers for all menu buttons
        container.querySelectorAll('.menu-button').forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                const action = button.getAttribute('data-action');
                
                switch (action) {
                    case 'upscale':
                        await this.handleUpscale();
                        break;
                    case 'collection':
                        this.handleAddToCollection();
                        break;
                    case 'download':
                        await this.handleDownload();
                        break;
                    case 'bgremove':
                        await this.handleBgRemove();
                        break;
                    case 'edit':
                        this.handleEdit();
                        break;
                    case 'text-edit':
                        this.handleTextEdit();
                        break;
                    case 'delete':
                        await this.handleDelete();
                        break;
                    case 'inspiration':
                        await this.handleSaveToInspiration();
                        break;
                }
            });
        });

        // Add click handler for admin action bar (the green button at the bottom)
        const adminActionBar = this.shadowRoot.querySelector('.admin-action-bar');
        console.log('Admin action bar found:', !!adminActionBar);
        if (adminActionBar) {
            const adminButton = adminActionBar.querySelector('.admin-button[data-action="inspiration"]');
            console.log('Admin inspiration button found:', !!adminButton);
            if (adminButton) {
                console.log('Adding event listener to admin inspiration button');
                adminButton.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Admin action bar "Save to Inspiration" clicked');
                    await this.handleSaveToInspiration();
                });
            }
        }
    }

    async handleUpscale() {
        if (this._isUpscaling) return;

        const upscaleButton = this.shadowRoot.querySelector('.menu-button[data-action="upscale"]');
        if (!upscaleButton) {
            console.error('Upscale button not found');
            return;
        }

        try {
            this._isUpscaling = true;
            upscaleButton.disabled = true;
            upscaleButton.innerHTML = `
                <img src="/images/ph--arrow-square-up-right-light.svg" />
                Upscaling...
            `;

            // Get user data to check hideCredits status
            const userResponse = await fetch('/api/auth/user', {
                credentials: 'include'
            });
            const userData = await userResponse.json();

            // Get the current image URL and ensure it's absolute and properly encoded
            let currentUrl = this._imageUrl;
            if (!currentUrl.startsWith('http')) {
                // Convert relative URL to absolute
                const a = document.createElement('a');
                a.href = currentUrl;
                currentUrl = a.href;
            }

            // Ensure URL is properly encoded
            try {
                currentUrl = new URL(currentUrl).toString();
            } catch (e) {
                console.error('Invalid URL:', currentUrl);
                throw new Error('Invalid image URL');
            }

            console.log('Sending image URL for upscale:', currentUrl);

            const response = await fetch('/api/images/upscale', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    imageUrl: currentUrl
                }),
                credentials: 'include'
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || data.details || 'Failed to upscale image');
            }

            const data = await response.json();

            if (response.status === 403) {
                if (data.error === 'Not enough credits' && !userData.hideCredits) {
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'error-message';
                    errorDiv.textContent = 'You need credits to upscale images. Please purchase credits to continue.';
                    
                    const buyButton = document.createElement('button');
                    buyButton.textContent = 'Buy Credits';
                    buyButton.className = 'btn-primary';
                    buyButton.onclick = () => window.location.href = '/profile?tab=credits';
                    
                    errorDiv.appendChild(document.createElement('br'));
                    errorDiv.appendChild(buyButton);
                    
                    this.shadowRoot.appendChild(errorDiv);
                    return;
                }
            }

            // Update the component state
            this.setAttribute('image-url', data.imageUrl);
            this.setAttribute('is-upscaled', 'true');
            this._isUpscaled = true;
            this._imageUrl = data.imageUrl;
            
            // Force image reload by adding a timestamp
            const img = this.shadowRoot.querySelector('img');
            if (img) {
                const timestamp = new Date().getTime();
                img.src = `${data.imageUrl}?t=${timestamp}`;
            }

            // Update credits display only if not hidden
            if (!userData.hideCredits) {
                const creditsElement = document.getElementById('topbarCredits');
                if (creditsElement && data.credits !== undefined) {
                    creditsElement.textContent = data.credits === 123654 ? 'Unlimited' : data.credits;
                }
            }

            // Show success toast
            showToast('Image upscaled successfully!', 'success');

            // Hide upscale button since image is now upscaled
            upscaleButton.style.display = 'none';

            // Dispatch event to notify parent components
            this.dispatchEvent(new CustomEvent('imageUpscaled', {
                bubbles: true,
                composed: true,
                detail: {
                    generationId: this._id,
                    newImageUrl: data.imageUrl,
                    isUpscaled: true
                }
            }));

            // Force re-render to update UI
            this.render();

        } catch (error) {
            console.error('Error upscaling image:', error);
            showToast('Failed to upscale image. Please try again.', 'error');
            
            // Show error message in the card
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = error.message;
            this.shadowRoot.appendChild(errorDiv);

        } finally {
            this._isUpscaling = false;
            if (upscaleButton) {
                upscaleButton.disabled = false;
                upscaleButton.innerHTML = `
                    <img src="/images/ph--arrow-square-up-right-light.svg" />
                    Upscale
                `;
            }
        }
    }

    handleAddToCollection() {
        // Get the collection modal
        let collectionModal = document.querySelector('collection-modal');
        if (!collectionModal) {
            collectionModal = document.createElement('collection-modal');
            document.body.appendChild(collectionModal);
        }

        // Set the image data
        collectionModal.setImageData({
            imageUrl: this._imageUrl,
            prompt: this._prompt,
            generationId: this._id
        });

        // Show the modal
        collectionModal.show();
    }

    handleShowPrompt() {
        showToast(this._prompt || 'No prompt available', 'info');
    }

    async handleDownload() {
        // Prevent multiple downloads
        if (this._isDownloading) return;
        this._isDownloading = true;

        const downloadButton = this.shadowRoot.querySelector('.menu-button[data-action="download"]');
        if (downloadButton) {
            downloadButton.disabled = true;
            downloadButton.innerHTML = `
                <img src="/images/ph--circle-notch-light.svg" class="spin" />
                Downloading...
            `;
        }

        try {
            showToast('Preparing download...', 'info');

            const response = await fetch(`/api/download?imageUrl=${encodeURIComponent(this._imageUrl)}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'image/png'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to download image');
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('image/')) {
                throw new Error('Invalid response type');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sticker-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            showToast('Download complete!', 'success');
        } catch (error) {
            console.error('Error downloading image:', error);
            showToast(error.message || 'Failed to download image', 'error');
        } finally {
            this._isDownloading = false;
            if (downloadButton) {
                downloadButton.disabled = false;
                downloadButton.innerHTML = `
                    <img src="/images/ph--download-simple-light.svg" />
                    Download
                `;
            }
        }
    }

    async handleDelete() {
        try {
            const response = await fetch(`/api/images/${this._id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.remove();
            } else {
                console.error('Failed to delete image');
            }
        } catch (error) {
            console.error('Error deleting image:', error);
        }
    }

    handleEdit() {
        // Redirect to sticker editor with the image URL
        const editorUrl = new URL('/sticker-editor.html', window.location.origin);
        editorUrl.searchParams.set('image', this._imageUrl);
        window.location.href = editorUrl.toString();
    }

    handleTextEdit() {
        // Redirect to text editor with the image URL
        const editorUrl = new URL('/design-editor.html', window.location.origin);
        editorUrl.searchParams.set('image', this._imageUrl);
        window.location.href = editorUrl.toString();
    }

    async handleBgRemove() {
        const bgRemoveButton = this.shadowRoot.querySelector('.menu-button[data-action="bgremove"]');
        if (!bgRemoveButton) return;

        try {
            bgRemoveButton.disabled = true;
            const loadingHtml = `
                <img src="/images/ph--images-square-light.svg" />
                Removing BG...
            `;
            bgRemoveButton.innerHTML = loadingHtml;
            
            const response = await fetch('/api/images/bgremove', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    imageUrl: this._imageUrl,
                    generationId: this._id // Send the ID
                })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || data.details || 'Failed to remove background');
            }

            // Update the image with the background removed version
            const newImageUrl = data.imageUrl;
            this._imageUrl = newImageUrl;
            this.setAttribute('image-url', newImageUrl);

            // --- ADDED: Update the actual img src ---
            const imgElement = this.shadowRoot.querySelector('.generation-image');
            if (imgElement) {
                // Add timestamp to prevent caching issues
                imgElement.src = `${newImageUrl}?t=${Date.now()}`;
                console.log('Updated image src to:', imgElement.src);
                showToast('Background removed and image updated!', 'success');
            } else {
                 console.error('Could not find image element to update.');
                 showToast('Background removed, but failed to update display.', 'warning');
            }
            // --- END ADDED ---

            // Reset button state
            bgRemoveButton.disabled = false;
            bgRemoveButton.innerHTML = `
                <img src="/images/ph--images-square-light.svg" />
                BG Remove
            `;

        } catch (error) {
            console.error('Error removing background:', error);
            bgRemoveButton.disabled = false;
            bgRemoveButton.innerHTML = `
                <img src="/images/ph--images-square-light.svg" />
                BG Remove
            `;
            showToast(error.message, 'error');
        }
    }

    async handleSaveToInspiration() {
        // Prevent multiple simultaneous saves
        if (this._savingToInspiration) {
            console.log('Save to inspiration already in progress, skipping...');
            return;
        }

        try {
            this._savingToInspiration = true;
            console.log('Starting save to inspiration...');

            // Extract object and text values from the prompt
            const promptText = this._prompt || '';
            console.log('Prompt text:', promptText.substring(0, 100) + '...');

            // Simple extraction of object (first word)
            const objectMatch = promptText.match(/^([a-zA-Z0-9]+)/);
            const object = objectMatch ? objectMatch[1] : 'Unknown';
            console.log('Extracted object:', object);

            // Simple extraction of text values (anything in quotes)
            const textRegex = /"([^"]*)"/g;
            const textValues = [];
            let match;
            while ((match = textRegex.exec(promptText)) !== null) {
                textValues.push(match[1]);
            }
            console.log('Extracted text values:', textValues);

            // Get the generation ID to fetch model information
            const generationId = this._id;
            let modelInfo = null;

            // Fetch generation details to get model information if we have a generation ID
            if (generationId) {
                try {
                    console.log('Fetching generation details for ID:', generationId);
                    const detailsResponse = await fetch(`/api/generations/${generationId}`);
                    if (detailsResponse.ok) {
                        const details = await detailsResponse.json();
                        modelInfo = details.model || null;
                        console.log('Found model info:', modelInfo);
                    } else {
                        console.warn('Generation details not found, using default model');
                    }
                } catch (error) {
                    console.warn('Could not fetch generation details:', error);
                }
            }

            const inspirationData = {
                imageUrl: this._imageUrl,
                prompt: promptText,
                object: object,
                textValues: textValues,
                textCount: textValues.length,
                model: modelInfo || 'flux-stickers' // Default model
            };

            console.log('Sending inspiration data:', inspirationData);

            const response = await fetch('/api/inspirations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(inspirationData)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to save to inspiration');
            }

            const savedInspiration = await response.json();
            console.log('Inspiration saved successfully:', savedInspiration._id);

            showToast('Image saved to Images Generated!', 'success');

        } catch (error) {
            console.error('Error saving to inspiration:', error);
            showToast(error.message, 'error');
        } finally {
            this._savingToInspiration = false;
        }
    }

    // Define the custom element
}

// Define the custom element
if (!customElements.get('generation-card')) {
    customElements.define('generation-card', GenerationCard);
}

// Listen for collection creation to add pending image
document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('collectionCreated', async (e) => {
        const pendingGenerationId = window.localStorage.getItem('pendingGenerationId');
        if (pendingGenerationId && e.detail.collection) {
            try {
                await fetch(`/api/collections/${e.detail.collection._id}/images`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ generationId: pendingGenerationId })
                });
                window.localStorage.removeItem('pendingGenerationId');
            } catch (error) {
                console.error('Error adding image to new collection:', error);
            }
        }
    });
});

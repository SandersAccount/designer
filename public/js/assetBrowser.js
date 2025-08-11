/**
 * Asset Browser - Advanced search and filtering for assets
 */

class AssetBrowser {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentPage = 1;
        this.currentFilters = {
            query: '',
            category: '',
            subcategory: '',
            tags: []
        };
        this.assets = [];
        this.categories = {};
        this.popularTags = [];
        
        this.init();
    }

    async init() {
        await this.loadCategories();
        await this.loadPopularTags();
        this.render();
        this.attachEventListeners();
    }

    async loadCategories() {
        try {
            const response = await fetch('/api/assets/categories');
            const data = await response.json();
            if (data.success) {
                this.categories = data.categories;
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    async loadPopularTags() {
        try {
            const response = await fetch('/api/assets/tags?limit=30');
            const data = await response.json();
            if (data.success) {
                this.popularTags = data.userTags.concat(data.autoTags);
            }
        } catch (error) {
            console.error('Error loading tags:', error);
        }
    }

    async searchAssets() {
        try {
            const params = new URLSearchParams({
                q: this.currentFilters.query,
                page: this.currentPage,
                limit: 20
            });

            if (this.currentFilters.category) {
                params.append('category', this.currentFilters.category);
            }
            if (this.currentFilters.subcategory) {
                params.append('subcategory', this.currentFilters.subcategory);
            }
            if (this.currentFilters.tags.length > 0) {
                params.append('tags', this.currentFilters.tags.join(','));
            }

            const response = await fetch(`/api/assets/search?${params}`);
            const data = await response.json();

            if (data.success) {
                this.assets = data.assets;
                this.pagination = data.pagination;
                this.renderAssets();
                this.renderPagination();
            } else {
                console.error('Asset search failed:', data);
            }
        } catch (error) {
            console.error('Error searching assets:', error);
        }
    }

    render() {
        this.container.innerHTML = `
            <div class="asset-browser">
                <div class="asset-browser-header">
                    <h3>Asset Library</h3>
                    <div class="search-controls">
                        <input type="text" id="asset-search" placeholder="Search assets..." 
                               value="${this.currentFilters.query}">
                        <button id="search-btn">Search</button>
                    </div>
                </div>
                
                <div class="asset-browser-filters">
                    <div class="filter-group">
                        <label>Category:</label>
                        <select id="category-filter">
                            <option value="">All Categories</option>
                            ${Object.keys(this.categories).map(cat => 
                                `<option value="${cat}" ${this.currentFilters.category === cat ? 'selected' : ''}>
                                    ${cat.charAt(0).toUpperCase() + cat.slice(1)} (${this.categories[cat].total})
                                </option>`
                            ).join('')}
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label>Subcategory:</label>
                        <select id="subcategory-filter">
                            <option value="">All Subcategories</option>
                            ${this.renderSubcategoryOptions()}
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label>Tags:</label>
                        <div class="tag-filter">
                            <input type="text" id="tag-input" placeholder="Add tag...">
                            <div class="selected-tags" id="selected-tags">
                                ${this.currentFilters.tags.map(tag => 
                                    `<span class="tag">${tag} <button onclick="assetBrowser.removeTag('${tag}')">×</button></span>`
                                ).join('')}
                            </div>
                            <div class="popular-tags">
                                <small>Popular tags:</small>
                                ${this.popularTags.slice(0, 10).map(tagObj => 
                                    `<button class="tag-suggestion" onclick="assetBrowser.addTag('${tagObj.tag}')">${tagObj.tag}</button>`
                                ).join('')}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="asset-browser-results">
                    <div id="asset-grid" class="asset-grid">
                        <!-- Assets will be rendered here -->
                    </div>
                    <div id="pagination" class="pagination">
                        <!-- Pagination will be rendered here -->
                    </div>
                </div>
            </div>
        `;

        // Load initial assets
        this.searchAssets();
    }

    renderSubcategoryOptions() {
        if (!this.currentFilters.category || !this.categories[this.currentFilters.category]) {
            return '';
        }

        const subcategories = this.categories[this.currentFilters.category].subcategories;
        return Object.keys(subcategories).map(subcat => 
            `<option value="${subcat}" ${this.currentFilters.subcategory === subcat ? 'selected' : ''}>
                ${subcat.charAt(0).toUpperCase() + subcat.slice(1)} (${subcategories[subcat].count})
            </option>`
        ).join('');
    }

    renderAssets() {
        const grid = document.getElementById('asset-grid');
        if (!this.assets.length) {
            grid.innerHTML = '<div class="no-results">No assets found</div>';
            return;
        }

        grid.innerHTML = this.assets.map(asset => `
            <div class="asset-item" data-asset-id="${asset.assetId}">
                <div class="asset-preview" onclick="assetBrowser.selectAsset('${asset.assetId}')">
                    <img src="/api/assets/by-id/${asset.assetId}" alt="${asset.name}"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                    <div class="asset-fallback" style="display:none;">📄</div>
                </div>
                <div class="asset-info" onclick="assetBrowser.selectAsset('${asset.assetId}')">
                    <div class="asset-name">${asset.name}</div>
                    <div class="asset-meta">
                        <span class="category">${asset.category}</span>
                        ${asset.subcategory ? `<span class="subcategory">${asset.subcategory}</span>` : ''}
                        <span class="usage">Used ${asset.usageCount} times</span>
                    </div>
                    <div class="asset-tags">
                        ${asset.tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('')}
                        ${asset.tags.length > 3 ? `<span class="tag-more">+${asset.tags.length - 3}</span>` : ''}
                    </div>
                </div>
                <div class="asset-actions">
                    <button class="copy-url-btn-small" onclick="event.stopPropagation(); assetBrowser.copyAssetUrl('${asset.assetId}')" title="Copy URL">
                        📋
                    </button>
                    <button class="copy-url-btn-small" onclick="event.stopPropagation(); assetBrowser.copyStyleConfig('${asset.assetId}')" title="Copy for Style Config" style="background: #7c3aed;">
                        🎨
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderPagination() {
        const pagination = document.getElementById('pagination');
        if (!this.pagination || this.pagination.pages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        const { page, pages, total } = this.pagination;
        pagination.innerHTML = `
            <div class="pagination-info">
                Showing ${(page - 1) * 20 + 1}-${Math.min(page * 20, total)} of ${total} assets
            </div>
            <div class="pagination-controls">
                <button ${page <= 1 ? 'disabled' : ''} onclick="assetBrowser.goToPage(${page - 1})">Previous</button>
                <span>Page ${page} of ${pages}</span>
                <button ${page >= pages ? 'disabled' : ''} onclick="assetBrowser.goToPage(${page + 1})">Next</button>
            </div>
        `;
    }

    attachEventListeners() {
        // Search input
        const searchInput = document.getElementById('asset-search');
        searchInput.addEventListener('input', (e) => {
            this.currentFilters.query = e.target.value;
            this.debounceSearch();
        });

        // Category filter
        const categoryFilter = document.getElementById('category-filter');
        categoryFilter.addEventListener('change', (e) => {
            this.currentFilters.category = e.target.value;
            this.currentFilters.subcategory = ''; // Reset subcategory
            this.currentPage = 1;
            this.updateSubcategoryFilter();
            this.searchAssets();
        });

        // Subcategory filter
        const subcategoryFilter = document.getElementById('subcategory-filter');
        subcategoryFilter.addEventListener('change', (e) => {
            this.currentFilters.subcategory = e.target.value;
            this.currentPage = 1;
            this.searchAssets();
        });

        // Tag input
        const tagInput = document.getElementById('tag-input');
        tagInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTag(e.target.value);
                e.target.value = '';
            }
        });
    }

    debounceSearch() {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.currentPage = 1;
            this.searchAssets();
        }, 300);
    }

    updateSubcategoryFilter() {
        const subcategoryFilter = document.getElementById('subcategory-filter');
        subcategoryFilter.innerHTML = `
            <option value="">All Subcategories</option>
            ${this.renderSubcategoryOptions()}
        `;
    }

    addTag(tag) {
        if (tag && !this.currentFilters.tags.includes(tag)) {
            this.currentFilters.tags.push(tag);
            this.updateTagDisplay();
            this.currentPage = 1;
            this.searchAssets();
        }
    }

    removeTag(tag) {
        this.currentFilters.tags = this.currentFilters.tags.filter(t => t !== tag);
        this.updateTagDisplay();
        this.currentPage = 1;
        this.searchAssets();
    }

    updateTagDisplay() {
        const selectedTags = document.getElementById('selected-tags');
        selectedTags.innerHTML = this.currentFilters.tags.map(tag => 
            `<span class="tag">${tag} <button onclick="assetBrowser.removeTag('${tag}')">×</button></span>`
        ).join('');
    }

    goToPage(page) {
        this.currentPage = page;
        this.searchAssets();
    }

    selectAsset(assetId) {
        // Emit custom event for asset selection
        const event = new CustomEvent('assetSelected', {
            detail: { assetId }
        });
        document.dispatchEvent(event);

        console.log('Asset selected:', assetId);
    }

    async copyAssetUrl(assetId) {
        const url = `${window.location.origin}/api/assets/by-id/${assetId}`;
        try {
            await navigator.clipboard.writeText(url);
            this.showCopyFeedback('URL copied to clipboard!');
        } catch (error) {
            console.error('Failed to copy:', error);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = url;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showCopyFeedback('URL copied to clipboard!');
        }
    }

    async copyStyleConfig(assetId) {
        const url = `${window.location.origin}/api/assets/by-id/${assetId}`;
        const config = `"style_image": "${url}",`;
        try {
            await navigator.clipboard.writeText(config);
            this.showCopyFeedback('Style config copied to clipboard!');
        } catch (error) {
            console.error('Failed to copy:', error);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = config;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showCopyFeedback('Style config copied to clipboard!');
        }
    }

    showCopyFeedback(message) {
        // Create a temporary toast notification
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #059669;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 10000;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            document.body.removeChild(toast);
        }, 2000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if container exists
    if (document.getElementById('asset-browser-container')) {
        window.assetBrowser = new AssetBrowser('asset-browser-container');
    }
});

/**
 * Service for managing prompt templates with API integration and localStorage fallback
 */
class PromptTemplateStorage {
    /**
     * Initialize the PromptTemplateStorage service
     */
    constructor() {
        this.apiEndpoint = '/api/promptTemplates';
        this.storageKey = 'promptTemplates';
    }

    /**
     * Get all templates
     * @returns {Promise<Array>} Array of templates
     */
    async getTemplates() {
        try {
            const response = await fetch(this.apiEndpoint, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                console.warn(`API request failed with status ${response.status}, falling back to localStorage`);
                return this._getLocalTemplates();
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching templates:', error);
            console.log('Falling back to localStorage');
            return this._getLocalTemplates();
        }
    }

    /**
     * Get templates from localStorage
     * @returns {Array} Array of templates from localStorage
     * @private
     */
    _getLocalTemplates() {
        const templates = localStorage.getItem(this.storageKey);
        return templates ? JSON.parse(templates) : [];
    }

    /**
     * Save templates to localStorage
     * @param {Array} templates Array of templates
     * @private
     */
    _saveLocalTemplates(templates) {
        localStorage.setItem(this.storageKey, JSON.stringify(templates));
    }

    /**
     * Get a template by ID
     * @param {string} id Template ID
     * @returns {Promise<Object|null>} Template object or null if not found
     */
    async getTemplate(id) {
        try {
            const response = await fetch(`${this.apiEndpoint}/${id}`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                console.warn(`API request failed with status ${response.status}, falling back to localStorage`);
                return this._getLocalTemplate(id);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Error fetching template ${id}:`, error);
            console.log('Falling back to localStorage');
            return this._getLocalTemplate(id);
        }
    }

    /**
     * Get a template from localStorage by ID
     * @param {string} id Template ID
     * @returns {Object|null} Template object or null if not found
     * @private
     */
    _getLocalTemplate(id) {
        const templates = this._getLocalTemplates();
        return templates.find(template => template._id === id || template.id === id) || null;
    }

    /**
     * Save a new template
     * @param {Object} template Template object
     * @returns {Promise<Object|null>} Saved template or null if failed
     */
    async saveTemplate(template) {
        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(template),
                credentials: 'include'
            });
            
            if (!response.ok) {
                console.warn(`API request failed with status ${response.status}, falling back to localStorage`);
                return this._saveLocalTemplate(template);
            }
            
            const savedTemplate = await response.json();
            
            // Also save to localStorage as backup
            this._syncLocalTemplate(savedTemplate);
            
            return savedTemplate;
        } catch (error) {
            console.error('Error saving template:', error);
            console.log('Falling back to localStorage');
            return this._saveLocalTemplate(template);
        }
    }

    /**
     * Save a template to localStorage
     * @param {Object} template Template object
     * @returns {Object} Saved template
     * @private
     */
    _saveLocalTemplate(template) {
        const templates = this._getLocalTemplates();
        
        // Generate a unique ID if not provided
        if (!template._id && !template.id) {
            template.id = 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
        
        // Add timestamps
        template.createdAt = template.createdAt || new Date().toISOString();
        template.updatedAt = new Date().toISOString();
        
        templates.push(template);
        this._saveLocalTemplates(templates);
        
        return template;
    }

    /**
     * Update an existing template
     * @param {string} id Template ID
     * @param {Object} template Template object
     * @returns {Promise<Object|null>} Updated template or null if failed
     */
    async updateTemplate(id, template) {
        try {
            const response = await fetch(`${this.apiEndpoint}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(template),
                credentials: 'include'
            });
            
            if (!response.ok) {
                console.warn(`API request failed with status ${response.status}, falling back to localStorage`);
                return this._updateLocalTemplate(id, template);
            }
            
            const updatedTemplate = await response.json();
            
            // Also update in localStorage as backup
            this._syncLocalTemplate(updatedTemplate);
            
            return updatedTemplate;
        } catch (error) {
            console.error(`Error updating template ${id}:`, error);
            console.log('Falling back to localStorage');
            return this._updateLocalTemplate(id, template);
        }
    }

    /**
     * Update a template in localStorage
     * @param {string} id Template ID
     * @param {Object} template Template object
     * @returns {Object|null} Updated template or null if not found
     * @private
     */
    _updateLocalTemplate(id, template) {
        const templates = this._getLocalTemplates();
        const index = templates.findIndex(t => t._id === id || t.id === id);
        
        if (index === -1) {
            return null;
        }
        
        // Update the template
        template.id = templates[index]._id || templates[index].id;
        template.createdAt = templates[index].createdAt;
        template.updatedAt = new Date().toISOString();
        
        templates[index] = { ...templates[index], ...template };
        this._saveLocalTemplates(templates);
        
        return templates[index];
    }

    /**
     * Sync a template from API to localStorage
     * @param {Object} template Template object from API
     * @private
     */
    _syncLocalTemplate(template) {
        const templates = this._getLocalTemplates();
        const id = template._id || template.id;
        const index = templates.findIndex(t => (t._id === id || t.id === id));
        
        if (index !== -1) {
            templates[index] = template;
        } else {
            templates.push(template);
        }
        
        this._saveLocalTemplates(templates);
    }

    /**
     * Delete a template
     * @param {string} id Template ID
     * @returns {Promise<boolean>} True if deleted successfully
     */
    async deleteTemplate(id) {
        try {
            const response = await fetch(`${this.apiEndpoint}/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            if (!response.ok) {
                console.warn(`API request failed with status ${response.status}, falling back to localStorage`);
                return this._deleteLocalTemplate(id);
            }
            
            // Also delete from localStorage
            this._deleteLocalTemplate(id);
            
            return true;
        } catch (error) {
            console.error(`Error deleting template ${id}:`, error);
            console.log('Falling back to localStorage');
            return this._deleteLocalTemplate(id);
        }
    }

    /**
     * Delete a template from localStorage
     * @param {string} id Template ID
     * @returns {boolean} True if deleted successfully
     * @private
     */
    _deleteLocalTemplate(id) {
        const templates = this._getLocalTemplates();
        const filteredTemplates = templates.filter(t => t._id !== id && t.id !== id);
        
        if (filteredTemplates.length === templates.length) {
            return false; // No template was deleted
        }
        
        this._saveLocalTemplates(filteredTemplates);
        return true;
    }
}

// Export as singleton
export const promptTemplateStorage = new PromptTemplateStorage();

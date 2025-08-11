/**
 * Prompt Template Service
 * 
 * A compatibility layer that provides a consistent API for prompt templates
 * whether they're stored in the database or localStorage.
 * 
 * This follows the same pattern as the TextMode compatibility layer,
 * allowing for a gradual transition from localStorage to database storage.
 */

class PromptTemplateService {
    constructor() {
        this.API_ENDPOINTS = {
            TEMPLATES: '/api/promptTemplates',
            TEMPLATE: (id) => `/api/promptTemplates/${id}`
        };
        
        // Flag to track if we should use localStorage as fallback
        this.useLocalStorageFallback = false;
    }
    
    /**
     * Get all templates
     * @returns {Promise<Array>} Array of templates
     */
    async getAllTemplates() {
        try {
            if (!this.useLocalStorageFallback) {
                // Try to get templates from the database first
                const response = await fetch(this.API_ENDPOINTS.TEMPLATES, {
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to load templates from database');
                }
                
                return await response.json();
            }
        } catch (error) {
            console.warn('Database fetch failed, falling back to localStorage:', error);
            this.useLocalStorageFallback = true;
        }
        
        // Fallback to localStorage
        if (this.useLocalStorageFallback) {
            const templates = JSON.parse(localStorage.getItem('promptTemplates') || '[]');
            
            // Convert localStorage format to match database format
            return templates.map(template => ({
                _id: template.id,
                name: template.name,
                category: template.category,
                template: template.content || template.prompt,
                thumbnailUrl: template.thumbnail || '',
                randomOptions: template.randomOptions || {},
                createdAt: template.createdAt || new Date().toISOString(),
                updatedAt: template.updatedAt || template.createdAt || new Date().toISOString()
            }));
        }
    }
    
    /**
     * Get a template by ID
     * @param {string} id Template ID
     * @returns {Promise<Object>} Template object
     */
    async getTemplateById(id) {
        try {
            if (!this.useLocalStorageFallback) {
                // Try to get the template from the database first
                const response = await fetch(this.API_ENDPOINTS.TEMPLATE(id), {
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to load template from database');
                }
                
                return await response.json();
            }
        } catch (error) {
            console.warn('Database fetch failed, falling back to localStorage:', error);
            this.useLocalStorageFallback = true;
        }
        
        // Fallback to localStorage
        if (this.useLocalStorageFallback) {
            const templates = JSON.parse(localStorage.getItem('promptTemplates') || '[]');
            const template = templates.find(t => t.id === id);
            
            if (!template) {
                throw new Error('Template not found in localStorage');
            }
            
            // Convert localStorage format to match database format
            return {
                _id: template.id,
                name: template.name,
                category: template.category,
                template: template.content || template.prompt,
                thumbnailUrl: template.thumbnail || '',
                randomOptions: template.randomOptions || {},
                createdAt: template.createdAt || new Date().toISOString(),
                updatedAt: template.updatedAt || template.createdAt || new Date().toISOString()
            };
        }
    }
    
    /**
     * Create a new template
     * @param {Object} templateData Template data
     * @returns {Promise<Object>} Created template
     */
    async createTemplate(templateData) {
        try {
            if (!this.useLocalStorageFallback) {
                // Try to create the template in the database first
                const response = await fetch(this.API_ENDPOINTS.TEMPLATES, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: templateData.name,
                        category: templateData.category,
                        template: templateData.template,
                        thumbnailUrl: templateData.thumbnailUrl || '',
                        randomOptions: templateData.randomOptions || {}
                    }),
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to create template in database');
                }
                
                return await response.json();
            }
        } catch (error) {
            console.warn('Database creation failed, falling back to localStorage:', error);
            this.useLocalStorageFallback = true;
        }
        
        // Fallback to localStorage
        if (this.useLocalStorageFallback) {
            const templates = JSON.parse(localStorage.getItem('promptTemplates') || '[]');
            
            // Create a new template with localStorage format
            const newTemplate = {
                id: Date.now().toString(),
                name: templateData.name,
                category: templateData.category,
                content: templateData.template,
                prompt: templateData.template,
                thumbnail: templateData.thumbnailUrl || '',
                randomOptions: templateData.randomOptions || {},
                createdAt: new Date().toISOString()
            };
            
            templates.push(newTemplate);
            localStorage.setItem('promptTemplates', JSON.stringify(templates));
            
            // Return in database format
            return {
                _id: newTemplate.id,
                name: newTemplate.name,
                category: newTemplate.category,
                template: newTemplate.content,
                thumbnailUrl: newTemplate.thumbnail,
                randomOptions: newTemplate.randomOptions,
                createdAt: newTemplate.createdAt,
                updatedAt: newTemplate.createdAt
            };
        }
    }
    
    /**
     * Update an existing template
     * @param {string} id Template ID
     * @param {Object} templateData Template data
     * @returns {Promise<Object>} Updated template
     */
    async updateTemplate(id, templateData) {
        try {
            if (!this.useLocalStorageFallback) {
                // Try to update the template in the database first
                const response = await fetch(this.API_ENDPOINTS.TEMPLATE(id), {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: templateData.name,
                        category: templateData.category,
                        template: templateData.template,
                        thumbnailUrl: templateData.thumbnailUrl || '',
                        randomOptions: templateData.randomOptions || {}
                    }),
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to update template in database');
                }
                
                return await response.json();
            }
        } catch (error) {
            console.warn('Database update failed, falling back to localStorage:', error);
            this.useLocalStorageFallback = true;
        }
        
        // Fallback to localStorage
        if (this.useLocalStorageFallback) {
            const templates = JSON.parse(localStorage.getItem('promptTemplates') || '[]');
            const templateIndex = templates.findIndex(t => t.id === id);
            
            if (templateIndex === -1) {
                throw new Error('Template not found in localStorage');
            }
            
            // Update the template
            templates[templateIndex] = {
                ...templates[templateIndex],
                name: templateData.name,
                category: templateData.category,
                content: templateData.template,
                prompt: templateData.template,
                thumbnail: templateData.thumbnailUrl || '',
                randomOptions: templateData.randomOptions || {},
                updatedAt: new Date().toISOString()
            };
            
            localStorage.setItem('promptTemplates', JSON.stringify(templates));
            
            // Return in database format
            return {
                _id: templates[templateIndex].id,
                name: templates[templateIndex].name,
                category: templates[templateIndex].category,
                template: templates[templateIndex].content,
                thumbnailUrl: templates[templateIndex].thumbnail,
                randomOptions: templates[templateIndex].randomOptions,
                createdAt: templates[templateIndex].createdAt,
                updatedAt: templates[templateIndex].updatedAt
            };
        }
    }
    
    /**
     * Delete a template
     * @param {string} id Template ID
     * @returns {Promise<Object>} Success message
     */
    async deleteTemplate(id) {
        try {
            if (!this.useLocalStorageFallback) {
                // Try to delete the template from the database first
                const response = await fetch(this.API_ENDPOINTS.TEMPLATE(id), {
                    method: 'DELETE',
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to delete template from database');
                }
                
                return await response.json();
            }
        } catch (error) {
            console.warn('Database deletion failed, falling back to localStorage:', error);
            this.useLocalStorageFallback = true;
        }
        
        // Fallback to localStorage
        if (this.useLocalStorageFallback) {
            const templates = JSON.parse(localStorage.getItem('promptTemplates') || '[]');
            const updatedTemplates = templates.filter(t => t.id !== id);
            
            localStorage.setItem('promptTemplates', JSON.stringify(updatedTemplates));
            
            return { message: 'Template deleted successfully' };
        }
    }
}

// Export a singleton instance
export const promptTemplateService = new PromptTemplateService();

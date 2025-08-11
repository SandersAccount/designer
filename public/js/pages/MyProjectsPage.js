import { createTopbar } from '/js/components/Topbar.js';
import { showToast } from '/js/components/Toast.js';
import '/js/components/ProjectModal.js';
import '/js/components/Toast.js';

// Initialize topbar
createTopbar();

// Get DOM elements
const foldersGrid = document.getElementById('foldersGrid');
const projectsGrid = document.getElementById('projectsGrid');
const recentProjectsGrid = document.getElementById('recentProjectsGrid');
const createFolderBtn = document.getElementById('createFolderBtn');

// State
let currentFolderId = null;
let currentView = 'grid';
let currentFolderName = 'My Projects';

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    console.log('My Projects page loaded');
    loadContent();
    setupEventListeners();
});

function setupEventListeners() {
    // Create folder button
    createFolderBtn.addEventListener('click', showCreateFolderDialog);
    
    // View toggle buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const view = e.target.closest('.view-btn').getAttribute('data-view');
            setView(view);
        });
    });

    // Listen for project saved events
    window.addEventListener('projectSaved', () => {
        loadContent();
    });
}

function setView(view) {
    currentView = view;
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-view') === view);
    });

    // Update grid classes based on view
    const grids = [projectsGrid, recentProjectsGrid];
    grids.forEach(grid => {
        if (view === 'list') {
            grid.classList.add('list-view');
            grid.style.gridTemplateColumns = '1fr';
            grid.style.gap = '1rem';
        } else {
            grid.classList.remove('list-view');
            grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(250px, 1fr))';
            grid.style.gap = '1.5rem';
        }
    });

    // Re-render projects to apply the correct view
    loadProjects();
    loadRecentProjects();
}

async function loadContent() {
    try {
        await Promise.all([
            loadFolders(),
            loadProjects(),
            loadRecentProjects()
        ]);
    } catch (error) {
        console.error('Error loading content:', error);
        showToast('Failed to load content', 'error');
    }
}

async function loadFolders() {
    try {
        const response = await fetch('/api/project-folders', { credentials: 'include' });
        if (!response.ok) throw new Error('Failed to load folders');
        
        const folders = await response.json();
        displayFolders(folders);
    } catch (error) {
        console.error('Error loading folders:', error);
        foldersGrid.innerHTML = '<div class="empty-state">Error loading folders</div>';
    }
}

async function loadProjects() {
    try {
        const url = currentFolderId 
            ? `/api/projects?folderId=${currentFolderId}`
            : '/api/projects';
            
        const response = await fetch(url, { credentials: 'include' });
        if (!response.ok) throw new Error('Failed to load projects');
        
        const data = await response.json();
        displayProjects(data.projects);
    } catch (error) {
        console.error('Error loading projects:', error);
        projectsGrid.innerHTML = '<div class="empty-state">Error loading projects</div>';
    }
}

async function loadRecentProjects() {
    try {
        const response = await fetch('/api/projects/recent', { credentials: 'include' });
        if (!response.ok) throw new Error('Failed to load recent projects');
        
        const projects = await response.json();
        displayRecentProjects(projects);
    } catch (error) {
        console.error('Error loading recent projects:', error);
        recentProjectsGrid.innerHTML = '<div class="empty-state">Error loading recent projects</div>';
    }
}

function displayFolders(folders) {
    // Calculate total projects count for "My Projects" folder
    const totalProjects = folders.reduce((sum, folder) => sum + folder.stats.projectCount, 0);

    foldersGrid.innerHTML = `
        <div class="folder-card create-new" onclick="showCreateFolderDialog()">
            <i class="fas fa-plus"></i>
            <span>Create New Folder</span>
        </div>
        <div class="folder-card ${currentFolderId === null ? 'selected' : ''}" onclick="selectFolder(null)">
            <div class="folder-header">
                <div class="folder-icon" style="color: #3b82f6;">
                    <i class="fas fa-folder"></i>
                </div>
                <h3 class="folder-title">My Projects</h3>
            </div>
            <div class="folder-count">${totalProjects} projects</div>
        </div>
        ${folders.map(folder => `
            <div class="folder-card ${currentFolderId === folder._id ? 'selected' : ''}" onclick="selectFolder('${folder._id}', '${folder.title}')">
                <div class="folder-header">
                    <div class="folder-icon" style="color: ${folder.color};">
                        <i class="fas fa-${folder.icon}"></i>
                    </div>
                    <h3 class="folder-title">${folder.title}</h3>
                </div>
                <div class="folder-count">${folder.stats.projectCount} projects</div>
            </div>
        `).join('')}
    `;
}

function displayProjects(projects) {
    if (projects.length === 0) {
        projectsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <h3>No projects yet</h3>
                <p>Create your first project to get started</p>
            </div>
        `;
        return;
    }

    projectsGrid.innerHTML = projects.map(project => createProjectCard(project)).join('');
}

function displayRecentProjects(projects) {
    if (projects.length === 0) {
        recentProjectsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clock"></i>
                <h3>No recent projects</h3>
                <p>Your recently opened projects will appear here</p>
            </div>
        `;
        return;
    }

    recentProjectsGrid.innerHTML = projects.slice(0, 6).map(project => {
        project.isRecent = true; // Mark as recent for list view detection
        return createProjectCard(project);
    }).join('');
}

function createProjectCard(project) {
    const isListView = projectsGrid.classList.contains('list-view') ||
                      (project.isRecent && recentProjectsGrid.classList.contains('list-view'));

    if (isListView) {
        return createListViewCard(project);
    } else {
        return createGridViewCard(project);
    }
}

function createGridViewCard(project) {
    const lastModified = new Date(project.stats.lastModified).toLocaleDateString();
    const canvasBackgroundColor = project.editorState?.canvasBackgroundColor || '#f9fafb';

    return `
        <div class="project-card" data-project-id="${project._id}">
            <div class="project-preview" style="background-color: ${canvasBackgroundColor};">
                <img src="${project.previewImageUrl}" alt="${project.title}"
                     onclick="openImageModal('${project.previewImageUrl}', '${canvasBackgroundColor}')" style="cursor: pointer;"
                     onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\\"fas fa-image\\" style=\\"font-size: 1.5rem; color: #9ca3af;\\"></i>
            </div>
            <div class="project-info">
                <h3 class="project-title">${project.title}</h3>
                <div class="project-meta">
                    <span>Modified ${lastModified}</span>
                    <span>${project.status}</span>
                </div>
                <div class="project-actions">
                    <button class="project-btn edit" onclick="editProject('${project._id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="project-btn duplicate" onclick="duplicateProject('${project._id}')">
                        <i class="fas fa-copy"></i> Duplicate
                    </button>
                    <button class="project-btn delete" onclick="deleteProject('${project._id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `;
}

function createListViewCard(project) {
    const lastModified = new Date(project.stats.lastModified).toLocaleDateString();
    const canvasBackgroundColor = project.editorState?.canvasBackgroundColor || '#f9fafb';

    return `
        <div class="project-card list-item" data-project-id="${project._id}">
            <div class="project-preview" style="background-color: ${canvasBackgroundColor};">
                <img src="${project.previewImageUrl}" alt="${project.title}"
                     onclick="openImageModal('${project.previewImageUrl}', '${canvasBackgroundColor}')" style="cursor: pointer;"
                     onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\\"fas fa-image\\" style=\\"font-size: 1.2rem; color: #9ca3af;\\"></i>
            </div>
            <div class="list-content">
                <div class="list-info">
                    <h3>${project.title}</h3>
                    <p class="project-date">Modified ${lastModified} • ${project.status}</p>
                </div>
                <div class="list-actions">
                    <button class="btn btn-primary" onclick="editProject('${project._id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-secondary" onclick="duplicateProject('${project._id}')">
                        <i class="fas fa-copy"></i> Duplicate
                    </button>
                    <button class="btn btn-secondary" onclick="deleteProject('${project._id}')" style="background: #dc2626;">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `;
}

async function showCreateFolderDialog() {
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;

    try {
        const response = await fetch('/api/project-folders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ title: folderName })
        });

        if (!response.ok) throw new Error('Failed to create folder');
        
        showToast('Folder created successfully', 'success');
        loadFolders();
        
    } catch (error) {
        console.error('Error creating folder:', error);
        showToast('Failed to create folder', 'error');
    }
}

function selectFolder(folderId, folderName = 'My Projects') {
    currentFolderId = folderId;
    currentFolderName = folderName;

    // Update the section title
    const sectionTitle = document.querySelector('.projects-section .section-title');
    if (sectionTitle) {
        sectionTitle.textContent = currentFolderName;
    }

    loadProjects();

    // Update folder selection visual feedback
    document.querySelectorAll('.folder-card').forEach(card => {
        card.classList.remove('selected');
    });

    // Find and select the appropriate folder card
    if (folderId === null) {
        // Select "My Projects" folder
        const myProjectsCard = document.querySelector('.folder-card:not(.create-new)');
        if (myProjectsCard) myProjectsCard.classList.add('selected');
    } else {
        // Select specific folder
        const folderCard = document.querySelector(`[onclick*="selectFolder('${folderId}'"]`);
        if (folderCard) folderCard.classList.add('selected');
    }
}

async function editProject(projectId) {
    try {
        // Redirect to design editor with project data
        window.location.href = `/design-editor.html?projectId=${projectId}`;
    } catch (error) {
        console.error('Error editing project:', error);
        showToast('Failed to open project', 'error');
    }
}

async function duplicateProject(projectId) {
    try {
        const response = await fetch(`/api/projects/${projectId}/duplicate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Failed to duplicate project');
        
        showToast('Project duplicated successfully', 'success');
        loadContent();
        
    } catch (error) {
        console.error('Error duplicating project:', error);
        showToast('Failed to duplicate project', 'error');
    }
}

async function deleteProject(projectId) {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`/api/projects/${projectId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Failed to delete project');
        
        showToast('Project deleted successfully', 'success');
        loadContent();
        
    } catch (error) {
        console.error('Error deleting project:', error);
        showToast('Failed to delete project', 'error');
    }
}

// Image Modal Functions
function openImageModal(imageUrl, backgroundColor = '#f9fafb') {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const modalContent = document.querySelector('.image-modal-content');

    modalImage.src = imageUrl;
    modalContent.style.backgroundColor = backgroundColor;
    modal.classList.add('show');

    // Close modal when clicking outside the image
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeImageModal();
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', handleEscapeKey);
}

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    modal.classList.remove('show');

    // Remove event listeners
    document.removeEventListener('keydown', handleEscapeKey);
}

function handleEscapeKey(e) {
    if (e.key === 'Escape') {
        closeImageModal();
    }
}

// Make functions globally available for onclick handlers
window.showCreateFolderDialog = showCreateFolderDialog;
window.selectFolder = selectFolder;
window.editProject = editProject;
window.duplicateProject = duplicateProject;
window.deleteProject = deleteProject;
window.openImageModal = openImageModal;
window.closeImageModal = closeImageModal;

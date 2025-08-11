export class CanvasZoom {
    constructor(canvas, wrapper) {
        this.canvas = canvas;
        this.wrapper = wrapper;
        this.scale = 1;
        this.minScale = 0.1;
        this.maxScale = 2;
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.translateX = 0;
        this.translateY = 0;

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Zoom buttons
        document.getElementById('zoomInBtn').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoomOutBtn').addEventListener('click', () => this.zoomOut());
        document.getElementById('resetZoomBtn').addEventListener('click', () => this.resetZoom());

        // Mouse wheel zoom
        this.wrapper.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY * -0.001;
            const newScale = Math.min(Math.max(this.scale + delta, this.minScale), this.maxScale);
            this.zoom(newScale);
        });

        // Pan functionality
        this.wrapper.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.startX = e.clientX - this.translateX;
            this.startY = e.clientY - this.translateY;
            this.wrapper.style.cursor = 'grabbing';
        });

        window.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            this.translateX = e.clientX - this.startX;
            this.translateY = e.clientY - this.startY;
            this.updateTransform();
        });

        window.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.wrapper.style.cursor = 'grab';
        });
    }

    zoom(scale) {
        this.scale = scale;
        this.updateTransform();
        document.getElementById('zoomLevel').textContent = `${Math.round(scale * 100)}%`;
    }

    zoomIn() {
        const newScale = Math.min(this.scale * 1.2, this.maxScale);
        this.zoom(newScale);
    }

    zoomOut() {
        const newScale = Math.max(this.scale / 1.2, this.minScale);
        this.zoom(newScale);
    }

    resetZoom() {
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.updateTransform();
        document.getElementById('zoomLevel').textContent = '100%';
    }

    updateTransform() {
        this.wrapper.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
    }
}
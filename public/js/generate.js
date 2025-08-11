// Store selected values
let selectedStyle = '';
let selectedBackground = 'dark'; // Default to dark

// Handle style selection
document.querySelectorAll('.style-option').forEach(option => {
    option.addEventListener('click', function() {
        // Remove active class from all options
        document.querySelectorAll('.style-option').forEach(opt => {
            opt.classList.remove('active');
        });
        
        // Add active class to selected option
        this.classList.add('active');
        
        // Store the selected style ID
        selectedStyle = this.dataset.styleId;
    });
});

// Handle background selection
document.querySelectorAll('input[name="background"]').forEach(radio => {
    radio.addEventListener('change', function() {
        selectedBackground = this.value;
    });
});

// Add these values to the generate request
async function generateImage(prompt) {
    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt,
                style: selectedStyle,
                background: selectedBackground
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to generate image');
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error generating image:', error);
        throw error;
    }
}

// ===== DOM Elements =====
const promptInput = document.getElementById('prompt-input');
const modelSelect = document.getElementById('model-select');
const sizeSelect = document.getElementById('size-select');
const generateBtn = document.getElementById('generate-btn');
const generatedImage = document.getElementById('generated-image');
const placeholder = document.getElementById('placeholder');
const downloadBtn = document.getElementById('download-btn');
const copyUrlBtn = document.getElementById('copy-url-btn');
const imageInfo = document.getElementById('image-info');
const infoModel = document.getElementById('info-model');
const infoSize = document.getElementById('info-size');
const infoTime = document.getElementById('info-time');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// ===== State =====
let currentImageUrl = null;
let isGenerating = false;

// ===== Pollinations API Configuration =====
const POLLINATIONS_BASE_URL = 'https://image.pollinations.ai/prompt';

// Model mapping
const MODELS = {
    'flux': 'flux',
    'turbo': 'turbo'
};

// ===== Functions =====

/**
 * Generate the Pollinations API URL
 */
function buildImageUrl(prompt, model, size) {
    const [width, height] = size.split('x').map(Number);
    
    // Encode the prompt for URL
    const encodedPrompt = encodeURIComponent(prompt);
    
    // Build URL with parameters
    const params = new URLSearchParams({
        model: MODELS[model] || 'flux',
        width: width,
        height: height,
        seed: Math.floor(Math.random() * 1000000), // Random seed for variety
        nologo: 'true'
    });
    
    return `${POLLINATIONS_BASE_URL}/${encodedPrompt}?${params.toString()}`;
}

/**
 * Show toast notification
 */
function showToast(message, duration = 3000) {
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

/**
 * Format current time
 */
function formatTime() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

/**
 * Get model display name
 */
function getModelDisplayName(model) {
    const names = {
        'flux': 'Flux (High Quality)',
        'turbo': 'Turbo (Fast)'
    };
    return names[model] || model;
}

/**
 * Enable/disable action buttons
 */
function setActionButtonsEnabled(enabled) {
    downloadBtn.disabled = !enabled;
    copyUrlBtn.disabled = !enabled;
}

/**
 * Set loading state
 */
function setLoading(loading) {
    isGenerating = loading;
    generateBtn.disabled = loading;
    generateBtn.classList.toggle('loading', loading);
}

/**
 * Generate image
 */
async function generateImage() {
    const prompt = promptInput.value.trim();
    
    if (!prompt) {
        showToast('Please enter a prompt to generate an image');
        promptInput.focus();
        return;
    }
    
    const model = modelSelect.value;
    const size = sizeSelect.value;
    
    setLoading(true);
    setActionButtonsEnabled(false);
    
    // Hide current image and show placeholder
    generatedImage.style.display = 'none';
    placeholder.style.display = 'flex';
    imageInfo.style.display = 'none';
    
    try {
        // Build the image URL
        currentImageUrl = buildImageUrl(prompt, model, size);
        
        // Create a new image to preload
        const img = new Image();
        
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = () => reject(new Error('Failed to generate image'));
            img.src = currentImageUrl;
        });
        
        // Update the displayed image
        generatedImage.src = currentImageUrl;
        generatedImage.style.display = 'block';
        placeholder.style.display = 'none';
        
        // Update image info
        infoModel.textContent = getModelDisplayName(model);
        infoSize.textContent = size.replace('x', ' × ');
        infoTime.textContent = formatTime();
        imageInfo.style.display = 'grid';
        
        // Enable action buttons
        setActionButtonsEnabled(true);
        
        showToast('Image generated successfully! ✨');
        
    } catch (error) {
        console.error('Generation error:', error);
        showToast('Failed to generate image. Please try again.');
        placeholder.innerHTML = `
            <div class="placeholder-icon">
                <svg viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                    <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </div>
            <p>Generation failed. Please try again.</p>
        `;
    } finally {
        setLoading(false);
    }
}

/**
 * Download the generated image
 */
async function downloadImage() {
    if (!currentImageUrl) return;
    
    try {
        showToast('Preparing download...');
        
        // Fetch the image as blob
        const response = await fetch(currentImageUrl);
        const blob = await response.blob();
        
        // Create download link
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `pollinations-ai-${Date.now()}.png`;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        URL.revokeObjectURL(link.href);
        
        showToast('Image downloaded! 📥');
        
    } catch (error) {
        console.error('Download error:', error);
        showToast('Failed to download image. Try right-clicking to save.');
    }
}

/**
 * Copy image URL to clipboard
 */
async function copyImageUrl() {
    if (!currentImageUrl) return;
    
    try {
        await navigator.clipboard.writeText(currentImageUrl);
        showToast('URL copied to clipboard! 📋');
    } catch (error) {
        console.error('Copy error:', error);
        showToast('Failed to copy URL');
    }
}

// ===== Event Listeners =====

generateBtn.addEventListener('click', generateImage);

downloadBtn.addEventListener('click', downloadImage);

copyUrlBtn.addEventListener('click', copyImageUrl);

// Generate on Enter key (with Ctrl/Cmd for textarea)
promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        generateImage();
    }
});

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    // Focus on prompt input
    promptInput.focus();
    
    // Add subtle animation to generate button on hover
    generateBtn.addEventListener('mouseenter', () => {
        if (!isGenerating) {
            generateBtn.style.transform = 'translateY(-2px)';
        }
    });
    
    generateBtn.addEventListener('mouseleave', () => {
        generateBtn.style.transform = 'translateY(0)';
    });
});

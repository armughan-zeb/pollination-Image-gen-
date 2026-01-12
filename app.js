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

// API Key Elements
const apiKeyInput = document.getElementById('api-key-input');
const toggleKeyBtn = document.getElementById('toggle-key-btn');
const eyeOpen = toggleKeyBtn.querySelector('.eye-open');
const eyeClosed = toggleKeyBtn.querySelector('.eye-closed');

// ===== State =====
let currentImageUrl = null;
let isGenerating = false;
let apiKey = localStorage.getItem('pollinations_api_key') || '';

// ===== Configuration =====
const FREE_BASE_URL = 'https://image.pollinations.ai/prompt';
const PAID_BASE_URL = 'https://gen.pollinations.ai/image';

// Models
const FREE_MODELS = {
    'flux': 'Flux (High Quality)',
    'turbo': 'Turbo (Fast)'
};

const PAID_MODELS = {
    'flux': 'Flux (High Quality)',
    'turbo': 'Turbo (Fast)',
    'gptimage': 'GPT Image (Reasoning)',
    'kontext': 'Kontext',
    'seedream': 'Seedream',
    'nanobanana': 'NanoBanana'
};

// ===== Functions =====

/**
 * Initialize API Key state
 */
function initApiKey() {
    if (apiKey) {
        apiKeyInput.value = apiKey;
        updateModelOptions();
    }

    // Toggle Visibility
    toggleKeyBtn.addEventListener('click', () => {
        const type = apiKeyInput.getAttribute('type') === 'password' ? 'text' : 'password';
        apiKeyInput.setAttribute('type', type);

        if (type === 'text') {
            eyeOpen.style.display = 'none';
            eyeClosed.style.display = 'block';
        } else {
            eyeOpen.style.display = 'block';
            eyeClosed.style.display = 'none';
        }
    });

    // Save on Input
    apiKeyInput.addEventListener('input', (e) => {
        apiKey = e.target.value.trim();
        if (apiKey) {
            localStorage.setItem('pollinations_api_key', apiKey);
        } else {
            localStorage.removeItem('pollinations_api_key');
        }
        updateModelOptions();
    });
}

/**
 * Update model dropdown based on API key presence
 */
function updateModelOptions() {
    const currentModel = modelSelect.value;
    const models = apiKey ? PAID_MODELS : FREE_MODELS;

    modelSelect.innerHTML = '';

    Object.entries(models).forEach(([value, label]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        modelSelect.appendChild(option);
    });

    // Restore selection if valid, otherwise default to flux
    if (models[currentModel]) {
        modelSelect.value = currentModel;
    } else {
        modelSelect.value = 'flux';
    }
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
    const [width, height] = size.split('x').map(Number);

    setLoading(true);
    setActionButtonsEnabled(false);

    // Hide current image and show placeholder
    generatedImage.style.display = 'none';
    placeholder.style.display = 'flex';
    imageInfo.style.display = 'none';

    try {
        if (apiKey) {
            // Paid API Generation
            const encodedPrompt = encodeURIComponent(prompt);
            const url = `${PAID_BASE_URL}/${encodedPrompt}?model=${model}&width=${width}&height=${height}&seed=${Math.floor(Math.random() * 1000000)}&nologo=true`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Invalid API Key');
                }
                throw new Error('Generation failed');
            }

            const blob = await response.blob();
            currentImageUrl = URL.createObjectURL(blob);

        } else {
            // Free API Generation
            const encodedPrompt = encodeURIComponent(prompt);
            const params = new URLSearchParams({
                model: model,
                width: width,
                height: height,
                seed: Math.floor(Math.random() * 1000000),
                nologo: 'true'
            });

            currentImageUrl = `${FREE_BASE_URL}/${encodedPrompt}?${params.toString()}`;

            // Preload image
            await new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = resolve;
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = currentImageUrl;
            });
        }

        // Update the displayed image
        generatedImage.src = currentImageUrl;
        generatedImage.style.display = 'block';
        placeholder.style.display = 'none';

        // Update image info
        infoModel.textContent = (apiKey ? PAID_MODELS : FREE_MODELS)[model];
        infoSize.textContent = size.replace('x', ' × ');
        infoTime.textContent = formatTime();
        imageInfo.style.display = 'grid';

        // Enable action buttons
        setActionButtonsEnabled(true);

        showToast('Image generated successfully! ✨');

    } catch (error) {
        console.error('Generation error:', error);
        showToast(error.message || 'Failed to generate image. Please try again.');
        placeholder.innerHTML = `
            <div class="placeholder-icon">
                <svg viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                    <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </div>
            <p>Generation failed. ${error.message || 'Please try again.'}</p>
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

        // For blob URLs (paid API), we already have the blob, but fetching works too
        // For regular URLs (free API), we need to fetch
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

        // Only revoke if we created a new object URL here (not the global one)
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
        // If it's a blob URL, we can't really "copy URL" meaningfully for others
        // But for free API it works. 
        if (currentImageUrl.startsWith('blob:')) {
            showToast('Cannot copy blob URL. Please download image.');
            return;
        }

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
    initApiKey();
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

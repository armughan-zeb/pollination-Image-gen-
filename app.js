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

// API Settings Modal Elements
const apiSettingsBtn = document.getElementById('api-settings-btn');
const modalOverlay = document.getElementById('api-modal-overlay');
const modalClose = document.getElementById('modal-close');
const modalCancel = document.getElementById('modal-cancel');
const modalSave = document.getElementById('modal-save');
const activeProviderDisplay = document.getElementById('active-provider-display');

// API Key Inputs
const openaiApiKeyInput = document.getElementById('openai-api-key');
const stabilityApiKeyInput = document.getElementById('stability-api-key');
const togetherApiKeyInput = document.getElementById('together-api-key');

// Provider Radio Buttons
const providerRadios = document.querySelectorAll('input[name="api-provider"]');

// ===== State =====
let currentImageUrl = null;
let isGenerating = false;

// API Configuration State
let apiConfig = {
    provider: 'pollinations',
    keys: {
        openai: '',
        stability: '',
        together: ''
    }
};

// ===== API Configuration =====
const POLLINATIONS_BASE_URL = 'https://image.pollinations.ai/prompt';
const OPENAI_API_URL = 'https://api.openai.com/v1/images/generations';
const STABILITY_API_URL = 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image';
const TOGETHER_API_URL = 'https://api.together.xyz/v1/images/generations';

// Model mapping for Pollinations
const POLLINATIONS_MODELS = {
    'flux': 'flux',
    'turbo': 'turbo'
};

// Provider display names
const PROVIDER_NAMES = {
    'pollinations': 'Pollinations AI',
    'openai': 'OpenAI DALL-E',
    'stability': 'Stability AI',
    'together': 'Together AI'
};

// ===== Local Storage Functions =====

/**
 * Save API configuration to localStorage
 */
function saveApiConfig() {
    localStorage.setItem('pollinationsImageGenConfig', JSON.stringify(apiConfig));
}

/**
 * Load API configuration from localStorage
 */
function loadApiConfig() {
    const saved = localStorage.getItem('pollinationsImageGenConfig');
    if (saved) {
        try {
            apiConfig = JSON.parse(saved);
            // Update UI with saved values
            updateUIFromConfig();
        } catch (e) {
            console.error('Failed to load API config:', e);
        }
    }
}

/**
 * Update UI elements based on loaded config
 */
function updateUIFromConfig() {
    // Set provider radio
    const providerRadio = document.getElementById(`provider-${apiConfig.provider}`);
    if (providerRadio) {
        providerRadio.checked = true;
    }

    // Set API keys
    if (openaiApiKeyInput) openaiApiKeyInput.value = apiConfig.keys.openai || '';
    if (stabilityApiKeyInput) stabilityApiKeyInput.value = apiConfig.keys.stability || '';
    if (togetherApiKeyInput) togetherApiKeyInput.value = apiConfig.keys.together || '';

    // Update active provider display
    updateActiveProviderDisplay();
}

/**
 * Update the active provider display text
 */
function updateActiveProviderDisplay() {
    if (activeProviderDisplay) {
        activeProviderDisplay.textContent = PROVIDER_NAMES[apiConfig.provider] || 'Pollinations AI';
    }
}

// ===== Modal Functions =====

/**
 * Open the API settings modal
 */
function openModal() {
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Close the API settings modal
 */
function closeModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

/**
 * Save settings from modal
 */
function saveSettings() {
    // Get selected provider
    const selectedProvider = document.querySelector('input[name="api-provider"]:checked');
    if (selectedProvider) {
        apiConfig.provider = selectedProvider.value;
    }

    // Get API keys
    apiConfig.keys.openai = openaiApiKeyInput.value.trim();
    apiConfig.keys.stability = stabilityApiKeyInput.value.trim();
    apiConfig.keys.together = togetherApiKeyInput.value.trim();

    // Validate if a paid provider is selected without API key
    if (apiConfig.provider !== 'pollinations') {
        const key = apiConfig.keys[apiConfig.provider];
        if (!key) {
            showToast(`Please enter an API key for ${PROVIDER_NAMES[apiConfig.provider]}`);
            return;
        }
    }

    // Save to localStorage
    saveApiConfig();

    // Update display
    updateActiveProviderDisplay();

    // Close modal
    closeModal();

    showToast(`Switched to ${PROVIDER_NAMES[apiConfig.provider]} ✨`);
}

// ===== Image Generation Functions =====

/**
 * Generate the Pollinations API URL
 */
function buildPollinationsUrl(prompt, model, size) {
    const [width, height] = size.split('x').map(Number);
    const encodedPrompt = encodeURIComponent(prompt);

    const params = new URLSearchParams({
        model: POLLINATIONS_MODELS[model] || 'flux',
        width: width,
        height: height,
        seed: Math.floor(Math.random() * 1000000),
        nologo: 'true'
    });

    return `${POLLINATIONS_BASE_URL}/${encodedPrompt}?${params.toString()}`;
}

/**
 * Generate image using OpenAI DALL-E API
 */
async function generateWithOpenAI(prompt, size) {
    const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiConfig.keys.openai}`
        },
        body: JSON.stringify({
            model: 'dall-e-3',
            prompt: prompt,
            n: 1,
            size: size === '512x512' ? '1024x1024' : size,
            quality: 'standard'
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'OpenAI API error');
    }

    const data = await response.json();
    return data.data[0].url;
}

/**
 * Generate image using Stability AI API
 */
async function generateWithStability(prompt, size) {
    const [width, height] = size.split('x').map(Number);

    const response = await fetch(STABILITY_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiConfig.keys.stability}`,
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            text_prompts: [{ text: prompt, weight: 1 }],
            cfg_scale: 7,
            width: Math.min(width, 1024),
            height: Math.min(height, 1024),
            samples: 1,
            steps: 30
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Stability AI API error');
    }

    const data = await response.json();
    const base64Image = data.artifacts[0].base64;
    return `data:image/png;base64,${base64Image}`;
}

/**
 * Generate image using Together AI API
 */
async function generateWithTogether(prompt, size) {
    const [width, height] = size.split('x').map(Number);

    const response = await fetch(TOGETHER_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiConfig.keys.together}`
        },
        body: JSON.stringify({
            model: 'black-forest-labs/FLUX.1-schnell-Free',
            prompt: prompt,
            width: width,
            height: height,
            n: 1
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Together AI API error');
    }

    const data = await response.json();
    return data.data[0].url;
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
 * Get provider display name for info
 */
function getProviderDisplayName() {
    return PROVIDER_NAMES[apiConfig.provider] || 'Pollinations AI';
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
 * Generate image based on selected provider
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
    placeholder.innerHTML = `
        <div class="placeholder-icon">
            <svg viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                <path d="M21 15L16 10L5 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </div>
        <p>Generating with ${getProviderDisplayName()}...</p>
    `;
    imageInfo.style.display = 'none';

    try {
        // Generate image based on provider
        switch (apiConfig.provider) {
            case 'openai':
                currentImageUrl = await generateWithOpenAI(prompt, size);
                break;
            case 'stability':
                currentImageUrl = await generateWithStability(prompt, size);
                break;
            case 'together':
                currentImageUrl = await generateWithTogether(prompt, size);
                break;
            case 'pollinations':
            default:
                currentImageUrl = buildPollinationsUrl(prompt, model, size);
                // For Pollinations, we need to preload the image
                await new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = resolve;
                    img.onerror = () => reject(new Error('Failed to generate image'));
                    img.src = currentImageUrl;
                });
                break;
        }

        // Update the displayed image
        generatedImage.src = currentImageUrl;
        generatedImage.style.display = 'block';
        placeholder.style.display = 'none';

        // Update image info
        infoModel.textContent = apiConfig.provider === 'pollinations'
            ? getModelDisplayName(model)
            : getProviderDisplayName();
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

        // Fetch the image as blob
        const response = await fetch(currentImageUrl);
        const blob = await response.blob();

        // Create download link
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `ai-image-${Date.now()}.png`;

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

/**
 * Toggle password visibility
 */
function togglePasswordVisibility(targetId) {
    const input = document.getElementById(targetId);
    if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
    }
}

// ===== Event Listeners =====

// Generate button
generateBtn.addEventListener('click', generateImage);

// Download button
downloadBtn.addEventListener('click', downloadImage);

// Copy URL button
copyUrlBtn.addEventListener('click', copyImageUrl);

// Generate on Enter key (with Ctrl/Cmd for textarea)
promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        generateImage();
    }
});

// API Settings Modal
apiSettingsBtn.addEventListener('click', openModal);
modalClose.addEventListener('click', closeModal);
modalCancel.addEventListener('click', closeModal);
modalSave.addEventListener('click', saveSettings);

// Close modal on overlay click
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        closeModal();
    }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
        closeModal();
    }
});

// Toggle visibility buttons
document.querySelectorAll('.toggle-visibility').forEach(btn => {
    btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        togglePasswordVisibility(targetId);
    });
});

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    // Load saved API configuration
    loadApiConfig();

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

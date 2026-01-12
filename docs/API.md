# Pollinations AI API Documentation

## Base URL
```
https://image.pollinations.ai/prompt/
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| prompt | string | The text description of the image |
| model | string | AI model (flux, turbo) |
| width | number | Image width in pixels |
| height | number | Image height in pixels |
| seed | number | Random seed for reproducibility |
| nologo | boolean | Remove watermark |

## Example Usage

```javascript
const prompt = encodeURIComponent("A beautiful sunset over mountains");
const url = `https://image.pollinations.ai/prompt/${prompt}?model=flux&width=1024&height=768`;
```

## Models

### Flux
- High quality, detailed images
- Better for complex scenes
- Slightly slower generation

### Turbo
- Faster generation
- Good for quick iterations
- Suitable for simple prompts

## Rate Limits
- No authentication required
- Fair usage policy applies
- Consider caching generated images

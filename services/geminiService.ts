function getRandomApiKey() {
    const apiKeys = API_KEYS.split(';');
    const randomIndex = Math.floor(Math.random() * apiKeys.length);
    return apiKeys[randomIndex];
}

// Assuming this is how the generateSpeech function looks currently.
function generateSpeech(text, mode = 'single', callback) {
    // Existing code for conversation mode and single speaker mode.
    const apiKey = getRandomApiKey();
    // ...rest of the existing functionality including error handling
}

function base64ToBlobUrl(base64) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], {type: 'audio/mpeg'});
    return URL.createObjectURL(blob);
}
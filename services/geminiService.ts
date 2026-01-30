// Importing necessary modules for environment variables
import dotenv from 'dotenv';

dotenv.config();

export function getRandomApiKey() {
    const apiKeys = process.env.API_KEYS.split(',');
    const randomIndex = Math.floor(Math.random() * apiKeys.length);
    return apiKeys[randomIndex];
}

// Existing code in the file will go here...
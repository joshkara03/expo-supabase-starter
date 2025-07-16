// config/gemini.ts
import { GoogleGenAI } from "@google/genai";

// Get the API key from environment variables
const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

// Ensure the API key is available
if (!apiKey) {
  console.warn("EXPO_PUBLIC_GEMINI_API_KEY is not defined in environment variables.");
}

// Initialize the GoogleGenAI client
export const genAI = new GoogleGenAI({
  apiKey: apiKey || 'dummy-key'
});

// Export the client for video analysis
export const geminiVideo = genAI;
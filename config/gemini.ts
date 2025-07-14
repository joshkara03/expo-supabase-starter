// config/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

// Get the API key from environment variables
const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

// Ensure the API key is available
if (!apiKey) {
  console.warn("EXPO_PUBLIC_GEMINI_API_KEY is not defined in environment variables.");
}

// Initialize the GoogleGenerativeAI client
export const genAI = new GoogleGenerativeAI(apiKey || 'dummy-key');

// Create model instances for different tasks

// For image analysis (single frames)
export const geminiVision = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

// For video analysis (supports video input)
export const geminiVideo = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Default model for backward compatibility
export const gemini = geminiVision;
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

// Create a model instance for vision tasks
export const gemini = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
import { PluginSettings } from 'src/types';
import { LLMService } from './llm-service';

/**
 * Service for interacting with Google's Gemini API.
 * This class provides methods for summarizing video transcripts using Gemini AI.
 */
export class GeminiService implements LLMService {
    /**
     * Creates an instance of GeminiService.
     * @param settings - The plugin settings.
     */
    constructor(private settings: PluginSettings) {}

    /**
     * Summarizes content using Gemini API
     * @param prompt - Prompt for AI
     * @returns Structured summary response
     */
    async summarize(prompt: string): Promise<string> {
        try {
            // Build the API request URL
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.settings.selectedGeminiModel}:generateContent?key=${this.settings.geminiApiKey}`;
            
            // Check if this is a multimodal request with a video URL
            const isMultimodalRequest = 
                (this.settings.selectedGeminiModel.includes('pro') || 
                 this.settings.selectedGeminiModel.includes('vision')) && 
                prompt.includes('The video is available at:');
            
            let requestBody;
            
            if (isMultimodalRequest) {
                // Extract the video URL from the prompt
                const videoUrlMatch = prompt.match(/The video is available at: (https:\/\/[^\s]+)/);
                const videoUrl = videoUrlMatch ? videoUrlMatch[1] : null;
                
                // Remove the video URL line from the prompt for cleaner instruction
                const cleanPrompt = prompt.replace(/The video is available at: https:\/\/[^\n]+\n?/, '');
                
                if (videoUrl) {
                    // Format as a multimodal message with image content
                    requestBody = {
                        contents: [
                            {
                                role: "user",
                                parts: [
                                    { text: cleanPrompt },
                                    { 
                                        inline_data: {
                                            mime_type: "text/html",
                                            data: this.encodeBase64(`<iframe src="${videoUrl}" width="560" height="315" frameborder="0" allowfullscreen></iframe>`)
                                        }
                                    }
                                ]
                            }
                        ],
                        generationConfig: {
                            temperature: this.settings.temperature,
                            maxOutputTokens: this.settings.maxTokens
                        }
                    };
                } else {
                    // Fallback to text-only if URL couldn't be extracted
                    requestBody = {
                        contents: [
                            {
                                role: "user",
                                parts: [{ text: prompt }]
                            }
                        ],
                        generationConfig: {
                            temperature: this.settings.temperature,
                            maxOutputTokens: this.settings.maxTokens
                        }
                    };
                }
            } else {
                // Standard text-only message format
                requestBody = {
                    contents: [
                        {
                            role: "user",
                            parts: [{ text: prompt }]
                        }
                    ],
                    generationConfig: {
                        temperature: this.settings.temperature,
                        maxOutputTokens: this.settings.maxTokens
                    }
                };
            }
            
            // Make the API request
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestBody)
            });
            
            // Handle the API response
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API returned status ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
            }
            
            // Parse the response
            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            throw new Error(`Gemini API error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    
    /**
     * Encodes a string to base64
     * @param str - The string to encode
     * @returns The base64 encoded string
     */
    private encodeBase64(str: string): string {
        try {
            // For browser environments
            return btoa(str);
        } catch (err) {
            // For Node.js environments (fallback)
            return Buffer.from(str).toString('base64');
        }
    }
}

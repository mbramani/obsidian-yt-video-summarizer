import { PluginSettings } from 'src/types';
import { LLMService } from './llm-service';

/**
 * Service for interacting with Grok AI.
 * This class provides methods for summarizing video transcripts using Grok AI.
 */
export class GrokService implements LLMService {
    /**
     * Creates an instance of GrokService.
     * @param settings - The plugin settings.
     */
    constructor(private settings: PluginSettings) {}

    /**
     * Summarizes content using Grok AI
     * @param prompt - Prompt for AI
     * @returns Structured summary response
     */
    async summarize(prompt: string): Promise<string> {
        try {
            // Build the API request URL - using the correct Grok API endpoint
            const apiUrl = "https://api.x.ai/v1/chat/completions";
            
            // Configure the request headers and body
            const headers = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.settings.grokApiKey}`
            };
            
            // Check if this is a multimodal request with a video URL
            const isMultimodalRequest = 
                this.settings.selectedGrokModel.includes('vision') && 
                prompt.includes('The video is available at:');
            
            let messages;
            
            if (isMultimodalRequest) {
                // Extract the video URL from the prompt
                const videoUrlMatch = prompt.match(/The video is available at: (https:\/\/[^\s]+)/);
                const videoUrl = videoUrlMatch ? videoUrlMatch[1] : null;
                
                // Remove the video URL line from the prompt for cleaner instruction
                const cleanPrompt = prompt.replace(/The video is available at: https:\/\/[^\n]+\n?/, '');
                
                if (videoUrl) {
                    // Format as a multimodal message with image content
                    messages = [
                        {
                            role: "system",
                            content: "You are a helpful assistant that summarizes YouTube videos based on their visual content."
                        },
                        {
                            role: "user",
                            content: [
                                { type: "text", text: cleanPrompt },
                                { 
                                    type: "image_url", 
                                    image_url: {
                                        url: videoUrl,
                                        detail: "high"
                                    }
                                }
                            ]
                        }
                    ];
                } else {
                    // Fallback to text-only if URL couldn't be extracted
                    messages = [
                        {
                            role: "system",
                            content: "You are a helpful assistant that summarizes YouTube videos based on their metadata."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ];
                }
            } else {
                // Standard text-only message format
                messages = [
                    {
                        role: "system",
                        content: "You are a helpful assistant that summarizes YouTube videos based on transcripts."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ];
            }
            
            const requestBody = {
                model: this.settings.selectedGrokModel,
                messages: messages,
                temperature: this.settings.temperature,
                stream: false,
                max_tokens: this.settings.maxTokens
            };
            
            // Make the API request
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(requestBody)
            });
            
            // Handle the API response
            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `API returned status ${response.status}`;
                
                try {
                    // Try to parse the error as JSON if possible
                    const errorData = JSON.parse(errorText);
                    errorMessage += `: ${errorData.error?.message || errorData.error || 'Unknown error'}`;
                } catch {
                    // If not JSON, use the text directly
                    if (errorText) {
                        errorMessage += `: ${errorText}`;
                    }
                }
                
                throw new Error(errorMessage);
            }
            
            // Parse the response
            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            throw new Error(`Grok API error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
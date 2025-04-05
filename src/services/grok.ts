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
            // Build the API request URL
            const apiUrl = "https://api.groq.com/openai/v1/chat/completions";
            
            // Configure the request headers and body
            const headers = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.settings.grokApiKey}`
            };
            
            const requestBody = {
                model: this.settings.selectedGrokModel,
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful assistant that summarizes YouTube videos based on transcripts."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: this.settings.temperature,
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
                const errorData = await response.json();
                throw new Error(`API returned status ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
            }
            
            // Parse the response
            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            throw new Error(`Grok API error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
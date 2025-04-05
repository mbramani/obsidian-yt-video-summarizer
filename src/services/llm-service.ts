/**
 * Abstract interface for LLM services
 * This serves as a base for specific implementations like Gemini and Grok
 */
export interface LLMService {
    /**
     * Summarizes content using the LLM service
     * @param prompt - Prompt for the LLM to process
     * @returns Promise containing the generated text response
     */
    summarize(prompt: string): Promise<string>;
}
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIModelProvider } from 'src/types';

export class GeminiProvider implements AIModelProvider {
    private client: GoogleGenerativeAI;
    private model: string;
    private maxTokens: number;
    private temperature: number;

    constructor(
        apiKey: string,
        model: string,
        maxTokens: number,
        temperature: number
    ) {
        this.client = new GoogleGenerativeAI(apiKey);
        this.model = model;
        this.maxTokens = maxTokens;
        this.temperature = temperature;
    }

    async testConnection(): Promise<boolean> {
        try {
            const model = this.client.getGenerativeModel({ model: this.model });
            await model.generateContent('test');
            return true;
        } catch (error) {
            console.error('Gemini connection test failed:', error);
            return false;
        }
    }

    async summarizeVideo(videoId: string, prompt: string): Promise<string> {
        const model = this.client.getGenerativeModel({
            model: this.model,
            generationConfig: {
                maxOutputTokens: this.maxTokens,
                temperature: this.temperature
            }
        });

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('Error generating summary with Gemini:', error);
            throw error;
        }
    }
}

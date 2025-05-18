import OpenAI from 'openai';
import { AIModelProvider } from 'src/types';

export class OpenAIProvider implements AIModelProvider {
    private client: OpenAI;
    private model: string;
    private maxTokens: number;
    private temperature: number;

    constructor(
        apiKey: string,
        model: string,
        maxTokens: number,
        temperature: number,
        baseUrl?: string
    ) {
        this.client = new OpenAI({
            apiKey: apiKey,
            baseURL: baseUrl,
            dangerouslyAllowBrowser: true // required to run inside the browser-like Obsidian
        });
        this.model = model;
        this.maxTokens = maxTokens;
        this.temperature = temperature;
    }

    async testConnection(): Promise<boolean> {
        try {
            await this.client.models.retrieve(this.model);
            return true;
        } catch (error) {
            console.error('OpenAI connection test failed:', error);
            return false;
        }
    }

    async summarizeVideo(videoId: string, prompt: string): Promise<string> {
        try {
            const completion = await this.client.chat.completions.create({
                model: this.model,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: this.maxTokens,
                temperature: this.temperature
            });

            return completion.choices[0]?.message?.content || '';
        } catch (error) {
            console.error('Error generating summary with OpenAI:', error);
            throw error;
        }
    }
}

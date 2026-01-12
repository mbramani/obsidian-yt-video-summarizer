import Anthropic from '@anthropic-ai/sdk';
import { AIModelProvider } from 'src/types';

export class AnthropicProvider implements AIModelProvider {
    private client: Anthropic;

    constructor(
        apiKey: string,
        private model: string,
        private maxTokens: number,
        private temperature: number,
        baseUrl: string | undefined
    ) {
        this.client = new Anthropic({
            apiKey: apiKey,
            dangerouslyAllowBrowser: true,
            baseURL: baseUrl
        });
        this.model = model;
        this.maxTokens = maxTokens;
        this.temperature = temperature;
    }

    async testConnection(): Promise<boolean> {
        try {
            // Anthropic doesn't have a dedicated test endpoint, so we'll make a minimal request
            await this.client.messages.create({
                model: this.model,
                max_tokens: 1,
                messages: [{ role: 'user', content: 'test' }]
            });
            return true;
        } catch (error) {
            console.error('Anthropic connection test failed:', error);
            return false;
        }
    }

    async summarizeVideo(videoId: string, prompt: string): Promise<string> {
        try {
            const response = await this.client.messages.create({
                model: this.model,
                max_tokens: this.maxTokens,
                temperature: this.temperature,
                messages: [{ role: 'user', content: prompt }]
            });

            if (response.content[0].type === 'text') {
                let text = response.content[0].text;
                if (response.stop_reason === 'max_tokens') {
                    text += '\n\n[Summary truncated due to max token limit. Please increase "Max Tokens" in settings.]';
                }
                return text;
            }
            throw new Error('Unexpected response type from Anthropic API');
        } catch (error) {
            console.error('Error generating summary with Anthropic:', error);
            throw error;
        }
    }
}

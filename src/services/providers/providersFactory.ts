import { AIModelProvider, ModelConfig } from 'src/types';
import { AnthropicProvider } from './anthropic';
import { GeminiProvider } from './gemini';
import { OpenAIProvider } from './openai';

export class ProvidersFactory {
    static createProvider(config: ModelConfig, maxTokens: number, temperature: number): AIModelProvider {
        const { type, apiKey } = config.provider;
        const { name: model } = config;

        switch (type) {
            case 'anthropic':
                return new AnthropicProvider(
                    apiKey,
                    model,
                    maxTokens,
                    temperature,
                    config.provider.url
                );
            case 'openai':
                return new OpenAIProvider(
                    apiKey,
                    model,
                    maxTokens,
                    temperature,
                    config.provider.url
                );
            case 'gemini':
                return new GeminiProvider(
                    apiKey,
                    model,
                    maxTokens,
                    temperature
                );
            default:
                throw new Error(`Unsupported provider type: ${type}`);
        }
    }
} 
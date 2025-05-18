import { PluginSettings } from 'src/types';
import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Service for interacting with Gemini AI.
 * This class provides methods for summarizing video transcripts using Gemini AI.
 * It utilizes the GoogleGenerativeAI library to interact with the Gemini API.
 */
export class GeminiService {
	private model: GenerativeModel;

	/**
	 * Creates an instance of GeminiService.
	 * @param settings - The plugin settings.
	 */
	constructor(private settings: PluginSettings) {
		// Initialize the Gemini AI model
		const genAI = new GoogleGenerativeAI(settings.geminiApiKey);

		// Create the generative model instance
		this.model = genAI.getGenerativeModel({
			model: settings.selectedModel,
			generationConfig: {
				maxOutputTokens: settings.maxTokens,
				temperature: settings.temperature,
			},
		});
	}

	/**
	 * Summarizes video transcript using Gemini AI
	 * @param prompt - Prompt for AI
	 * @returns Structured summary response
	 */
	async summarize(prompt: string): Promise<string> {
		// Build the prompt for Gemini AI
		try {
			// Generate content using Gemini
			const result = await this.model.generateContent(prompt);
			const response = await result.response;
			// Parse the response
			return response.text();
		} catch (error) {
			throw new Error(`Gemini API error: ${error.message}`);
		}
	}
}

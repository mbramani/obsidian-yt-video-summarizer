import { PluginSettings } from 'src/types';

/**
 * Service for handling AI prompts.
 * This class provides methods for building prompts for AI models.
 */
export class PromptService {
	/**
	 * Creates an instance of PromptService.
	 * @param settings - The plugin settings.
	 */
	constructor(private customPrompt: string) {}

	/**
	 * Builds the prompt for AI based on the video transcript
	 * @param transcriptText - Video transcript text
	 * @returns Prompt string for AI
	 * @example
	 * const prompt = promptService.buildPrompt('This is a sample transcript.');
	 * console.log(prompt); // 'Custom prompt\n\nTranscript:\nThis is a sample transcript.'
	 */
	buildPrompt(transcriptText: string): string {
		return `${this.customPrompt}\n\nTranscript:\n${transcriptText}`;
	}
}

import { NamedPrompt, PluginSettings } from 'src/types';

/**
 * Service for handling AI prompts.
 * This class provides methods for building prompts for AI models.
 */
export class PromptService {
	private activePrompt: string;
	private savedPrompts: NamedPrompt[];
	private selectedPromptId: string | null;

	/**
	 * Creates an instance of PromptService.
	 * @param customPrompt - The custom prompt text
	 * @param savedPrompts - Array of saved named prompts
	 * @param selectedPromptId - ID of the currently selected prompt
	 */
	constructor(
		customPrompt: string,
		savedPrompts: NamedPrompt[] = [],
		selectedPromptId: string | null = null
	) {
		this.savedPrompts = savedPrompts;
		this.selectedPromptId = selectedPromptId;
		
		// If a prompt is selected, use it; otherwise use the custom prompt
		this.updateActivePrompt(customPrompt);
	}

	/**
	 * Updates the active prompt based on current settings
	 * @param customPrompt - The custom prompt to use if no prompt is selected
	 */
	private updateActivePrompt(customPrompt: string): void {
		// If a prompt ID is selected and exists in saved prompts, use that prompt
		if (this.selectedPromptId) {
			const selectedPrompt = this.getPromptById(this.selectedPromptId);
			if (selectedPrompt) {
				this.activePrompt = selectedPrompt.promptText;
				return;
			}
		}
		
		// Otherwise use the custom prompt
		this.activePrompt = customPrompt;
	}

	/**
	 * Gets a prompt by its ID
	 * @param id - The ID of the prompt to retrieve
	 * @returns The prompt with the specified ID, or undefined if not found
	 */
	getPromptById(id: string): NamedPrompt | undefined {
		return this.savedPrompts.find(prompt => prompt.id === id);
	}

	/**
	 * Gets all saved prompts
	 * @returns Array of all saved prompts
	 */
	getAllPrompts(): NamedPrompt[] {
		return this.savedPrompts;
	}

	/**
	 * Sets the active prompt by ID
	 * @param id - The ID of the prompt to set as active
	 * @returns True if the prompt was found and set, false otherwise
	 */
	setActivePromptById(id: string): boolean {
		const prompt = this.getPromptById(id);
		if (prompt) {
			this.activePrompt = prompt.promptText;
			this.selectedPromptId = id;
			return true;
		}
		return false;
	}
	
	/**
	 * Updates the service with new prompt configurations
	 * @param customPrompt - New custom prompt text
	 * @param savedPrompts - New array of saved prompts
	 * @param selectedPromptId - New selected prompt ID
	 */
	updatePromptConfiguration(
		customPrompt: string,
		savedPrompts: NamedPrompt[] = [],
		selectedPromptId: string | null = null
	): void {
		this.savedPrompts = savedPrompts;
		this.selectedPromptId = selectedPromptId;
		this.updateActivePrompt(customPrompt);
	}

	/**
	 * Gets the currently active prompt text
	 * @returns The active prompt text
	 */
	getActivePromptText(): string {
		return this.activePrompt;
	}

	/**
	 * Builds the prompt for AI based on the video transcript
	 * @param transcriptText - Video transcript text
	 * @returns Prompt string for AI
	 * @example
	 * const prompt = promptService.buildPrompt('This is a sample transcript.');
	 * console.log(prompt); // 'Custom prompt\n\nTranscript:\nThis is a sample transcript.'
	 */
	buildPrompt(transcriptText: string): string {
		// Make sure we have the most up-to-date active prompt
		return `${this.activePrompt}\n\nTranscript:\n${transcriptText}`;
	}
}

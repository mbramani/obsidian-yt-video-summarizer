import { App, Modal, Notice, PluginSettingTab, Setting, TextAreaComponent } from 'obsidian';
import { DEFAULT_PROMPTS, DEFAULT_SETTINGS, GEMINI_MODELS, GROK_MODELS, LLM_PROVIDERS, VIDEO_ANALYSIS_METHODS } from './constants';

import { GeminiModel, GrokModel, LLMProvider, NamedPrompt, VideoAnalysisMethod } from './types';
import { YouTubeSummarizerPlugin } from './main';

/**
 * Modal for adding or editing a prompt template
 */
class PromptModal extends Modal {
	private name: string;
	private promptText: string;
	private onSubmit: (name: string, promptText: string) => void;
	private editing: boolean;

	constructor(
		app: App,
		name = '',
		promptText = '',
		onSubmit: (name: string, promptText: string) => void,
		editing = false
	) {
		super(app);
		this.name = name;
		this.promptText = promptText;
		this.onSubmit = onSubmit;
		this.editing = editing;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('h2', { text: this.editing ? 'Edit Prompt Template' : 'Add New Prompt Template' });

		new Setting(contentEl)
			.setName('Name')
			.setDesc('Enter a name for this prompt template')
			.addText((text) => 
				text
					.setValue(this.name)
					.onChange((value) => {
						this.name = value;
					})
			);

		contentEl.createEl('h3', { text: 'Prompt Text' });
		
		const promptContainer = contentEl.createDiv();
		promptContainer.style.margin = '0 0 1em 0';
		
		const textArea = new TextAreaComponent(promptContainer);
		textArea.setValue(this.promptText);
		textArea.onChange((value) => {
			this.promptText = value;
		});
		
		textArea.inputEl.style.width = '100%';
		textArea.inputEl.style.height = '200px';

		const buttonContainer = contentEl.createDiv();
		buttonContainer.style.display = 'flex';
		buttonContainer.style.justifyContent = 'flex-end';
		buttonContainer.style.gap = '10px';

		const cancelButton = buttonContainer.createEl('button', { text: 'Cancel' });
		cancelButton.addEventListener('click', () => {
			this.close();
		});

		const submitButton = buttonContainer.createEl('button', { text: this.editing ? 'Save Changes' : 'Add Prompt', cls: 'mod-cta' });
		submitButton.addEventListener('click', () => {
			if (!this.name) {
				new Notice('Please enter a name for the prompt template');
				return;
			}
			if (!this.promptText) {
				new Notice('Please enter prompt text');
				return;
			}
			this.onSubmit(this.name, this.promptText);
			this.close();
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

/**
 * Represents the settings tab for the YouTube Summarizer Plugin.
 * This class extends the PluginSettingTab and provides a user interface
 * for configuring the plugin's settings.
 */
export class SettingsTab extends PluginSettingTab {
	plugin: YouTubeSummarizerPlugin;

	/**
	 * Creates an instance of SettingsTab.
	 * @param app - The Obsidian app instance.
	 * @param plugin - The YouTube Summarizer Plugin instance.
	 */
	constructor(app: App, plugin: YouTubeSummarizerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	/**
	 * Displays the settings tab UI.
	 * This method is responsible for rendering the settings controls
	 * and handling user interactions.
	 */
	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'YouTube Video Summarizer Settings' });

		// LLM Provider Selection
		containerEl.createEl('h3', { text: 'LLM Provider Settings' });

		// Setting for LLM Provider
		new Setting(containerEl)
			.setName('LLM Provider')
			.setDesc('Select which AI service to use for generating summaries')
			.addDropdown((dropdown) => {
				dropdown
					.addOptions(
						Object.fromEntries(
							LLM_PROVIDERS.map((provider) => [
								provider, 
								provider.charAt(0).toUpperCase() + provider.slice(1)
							])
						)
					)
					.setValue(this.plugin.settings.llmProvider)
					.onChange(async (value) => {
						await this.plugin.updateSettings({
							llmProvider: value as LLMProvider,
						});
						// Redraw settings to update visible options
						this.display();
					});
			});

		// Gemini-specific settings (only visible when Gemini is selected)
		if (this.plugin.settings.llmProvider === 'gemini') {
			const geminiSection = containerEl.createDiv();
			geminiSection.createEl('h4', { text: 'Gemini Settings' });

			// Setting for Gemini API Key
			new Setting(geminiSection)
				.setName('Gemini API key')
				.setDesc('Enter your Gemini API key')
				.addText((text) =>
					text
						.setPlaceholder('Enter API key')
						.setValue(this.plugin.settings.geminiApiKey)
						.onChange(async (value) => {
							await this.plugin.updateSettings({
								geminiApiKey: value,
							});
						})
				);

			// Setting for Gemini Model
			new Setting(geminiSection)
				.setName('Gemini model')
				.setDesc('Select Gemini model version')
				.addDropdown((dropdown) =>
					dropdown
						.addOptions(
							Object.fromEntries(
								GEMINI_MODELS.map((model) => [model, model])
							)
						)
						.setValue(this.plugin.settings.selectedGeminiModel)
						.onChange(async (value) => {
							await this.plugin.updateSettings({
								selectedGeminiModel: value as GeminiModel,
							});
						})
				);
		}

		// Grok-specific settings (only visible when Grok is selected)
		if (this.plugin.settings.llmProvider === 'grok') {
			const grokSection = containerEl.createDiv();
			grokSection.createEl('h4', { text: 'Grok Settings' });

			// Setting for Grok API Key
			new Setting(grokSection)
				.setName('Grok API key')
				.setDesc('Enter your Grok API key')
				.addText((text) =>
					text
						.setPlaceholder('Enter API key')
						.setValue(this.plugin.settings.grokApiKey)
						.onChange(async (value) => {
							await this.plugin.updateSettings({
								grokApiKey: value,
							});
						})
				);

			// Setting for Grok Model
			new Setting(grokSection)
				.setName('Grok model')
				.setDesc('Select Grok model version')
				.addDropdown((dropdown) =>
					dropdown
						.addOptions(
							Object.fromEntries(
								GROK_MODELS.map((model) => [model, model])
							)
						)
						.setValue(this.plugin.settings.selectedGrokModel)
						.onChange(async (value) => {
							await this.plugin.updateSettings({
								selectedGrokModel: value as GrokModel,
							});
						})
				);
		}

		// Video Analysis Settings section
		containerEl.createEl('h3', { text: 'Video Analysis Settings' });
		containerEl.createEl('p', { 
			text: 'These settings control how videos without captions/transcripts are handled.' 
		});

		// Video Analysis Method setting
		new Setting(containerEl)
			.setName('Preferred Analysis Method')
			.setDesc('Select how to analyze videos when captions are not available')
			.addDropdown((dropdown) => {
				dropdown
					.addOptions({
						'captions': 'Captions only (traditional)',
						'metadata': 'Metadata analysis (when no captions)',
						'multimodal': 'Multimodal analysis (experimental)'
					})
					.setValue(this.plugin.settings.videoAnalysisMethod)
					.onChange(async (value) => {
						await this.plugin.updateSettings({
							videoAnalysisMethod: value as VideoAnalysisMethod,
						});
						// Redraw to update dependent settings
						this.display();
					});
			});

		// Fallback option
		new Setting(containerEl)
			.setName('Fallback to metadata')
			.setDesc('If the selected analysis method fails, fall back to metadata analysis')
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.fallbackToMetadata)
					.onChange(async (value) => {
						await this.plugin.updateSettings({
							fallbackToMetadata: value,
						});
					});
			});

		// Multimodal option (only visible when multimodal is selected)
		if (this.plugin.settings.videoAnalysisMethod === 'multimodal') {
			new Setting(containerEl)
				.setName('Enable multimodal analysis')
				.setDesc('Send video content directly to AI for analysis (requires Vision-capable models)')
				.addToggle((toggle) => {
					toggle
						.setValue(this.plugin.settings.multimodalEnabled)
						.onChange(async (value) => {
							await this.plugin.updateSettings({
								multimodalEnabled: value,
							});
						});
				});

			// Warning for multimodal
			const warningEl = containerEl.createEl('div', { 
				cls: 'setting-item-description',
				text: 'Note: Multimodal analysis requires Gemini Pro Vision or Grok Vision models, and may incur higher API costs.'
			});
			warningEl.style.color = 'orange';
			warningEl.style.marginLeft = '36px';
		}

		// Generation Settings section
		containerEl.createEl('h3', { text: 'Generation Settings' });

		// Setting for Max Tokens
		new Setting(containerEl)
			.setName('Max tokens')
			.setDesc('Maximum number of tokens to generate')
			.addText((text) =>
				text
					.setPlaceholder('Enter max tokens')
					.setValue(String(this.plugin.settings.maxTokens))
					.onChange(async (value) => {
						await this.plugin.updateSettings({
							maxTokens: Number(value),
						});
					})
			);

		// Setting for Temperature
		new Setting(containerEl)
			.setName('Temperature')
			.setDesc('Temperature parameter for text generation')
			.addText((text) =>
				text
					.setPlaceholder('Enter temperature')
					.setValue(String(this.plugin.settings.temperature))
					.onChange(async (value) => {
						await this.plugin.updateSettings({
							temperature: Number(value),
						});
					})
			);
			
		// Prompt Templates section
		containerEl.createEl('h3', { text: 'Prompt Templates' });
		
		// Instructions
		containerEl.createEl('p', { 
			text: 'Select a prompt template to use for video summarization. You can also add new templates, edit existing ones, or delete templates you no longer need.' 
		});
		
		// Prompt selector
		const savedPrompts = this.plugin.settings.savedPrompts || [];
		const promptOptions: Record<string, string> = {};
		
		// Add custom option
		promptOptions['custom'] = 'Custom Prompt (manually edited below)';
		
		// Add saved prompts
		savedPrompts.forEach(prompt => {
			promptOptions[prompt.id] = prompt.name;
		});
		
		// Prompt selector setting
		new Setting(containerEl)
			.setName('Select Prompt Template')
			.setDesc('Choose a prompt template to use for summarization')
			.addDropdown((dropdown) => {
				dropdown
					.addOptions(promptOptions)
					.setValue(this.plugin.settings.selectedPromptId || 'custom')
					.onChange(async (value) => {
						// If custom is selected, use the custom prompt
						if (value === 'custom') {
							await this.plugin.updateSettings({
								selectedPromptId: null
							});
						} else {
							// Otherwise use the selected prompt
							await this.plugin.updateSettings({
								selectedPromptId: value
							});
							
							// Update the custom prompt text area with the selected prompt's text
							const selectedPrompt = savedPrompts.find(p => p.id === value);
							if (selectedPrompt) {
								await this.plugin.updateSettings({
									customPrompt: selectedPrompt.promptText
								});
								
								// Force a redraw of the settings page to show the updated prompt
								this.display();
							}
						}
					});
			});
		
		// Prompt template management
		const promptManagementDiv = containerEl.createDiv();
		promptManagementDiv.style.marginBottom = '1rem';
		
		// Button container
		const promptButtonContainer = promptManagementDiv.createDiv();
		promptButtonContainer.style.display = 'flex';
		promptButtonContainer.style.gap = '8px';
		promptButtonContainer.style.marginBottom = '1rem';
		
		// Add New Prompt button
		const addButton = promptButtonContainer.createEl('button', { text: 'Add New Prompt' });
		addButton.addEventListener('click', () => {
			new PromptModal(
				this.app,
				'',
				this.plugin.settings.customPrompt, // Use current prompt as starting point
				async (name, promptText) => {
					// Generate a unique ID
					const id = `prompt_${Date.now()}`;
					const newPrompt: NamedPrompt = {
						id,
						name,
						promptText
					};
					
					// Add new prompt to saved prompts
					const updatedPrompts = [...savedPrompts, newPrompt];
					await this.plugin.updateSettings({
						savedPrompts: updatedPrompts,
						selectedPromptId: id // Automatically select the new prompt
					});
					
					new Notice(`Prompt "${name}" added successfully!`);
					this.display(); // Refresh settings view
				}
			).open();
		});
		
		// Edit button (enabled only when a saved prompt is selected)
		const editButton = promptButtonContainer.createEl('button', { text: 'Edit Selected' });
		const isEditingDisabled = this.plugin.settings.selectedPromptId === null || 
			this.plugin.settings.selectedPromptId === 'custom' || 
			!savedPrompts.some(p => p.id === this.plugin.settings.selectedPromptId);
			
		editButton.disabled = isEditingDisabled;
		
		editButton.addEventListener('click', () => {
			const promptId = this.plugin.settings.selectedPromptId;
			if (!promptId || promptId === 'custom') {
				new Notice('Please select a saved prompt to edit');
				return;
			}
			
			const promptToEdit = savedPrompts.find(p => p.id === promptId);
			if (!promptToEdit) {
				new Notice('Selected prompt not found');
				return;
			}
			
			// Show edit modal
			new PromptModal(
				this.app,
				promptToEdit.name,
				promptToEdit.promptText,
				async (name, promptText) => {
					// Update the prompt
					const updatedPrompts = savedPrompts.map(p => {
						if (p.id === promptId) {
							return {
								...p,
								name,
								promptText
							};
						}
						return p;
					});
					
					await this.plugin.updateSettings({
						savedPrompts: updatedPrompts,
						customPrompt: promptText // Also update the custom prompt field
					});
					
					new Notice(`Prompt "${name}" updated successfully!`);
					this.display(); // Refresh settings view
				},
				true // Editing mode
			).open();
		});
		
		// Delete button (enabled only when a saved prompt is selected)
		const deleteButton = promptButtonContainer.createEl('button', { text: 'Delete Selected' });
		deleteButton.disabled = isEditingDisabled;
		
		deleteButton.addEventListener('click', () => {
			const promptId = this.plugin.settings.selectedPromptId;
			if (!promptId || promptId === 'custom') {
				new Notice('Please select a saved prompt to delete');
				return;
			}
			
			const promptToDelete = savedPrompts.find(p => p.id === promptId);
			if (!promptToDelete) {
				new Notice('Selected prompt not found');
				return;
			}
			
			// Ask for confirmation before deleting
			const confirmDelete = confirm(`Are you sure you want to delete the prompt "${promptToDelete.name}"?`);
			if (!confirmDelete) return;
			
			// Remove the prompt
			const updatedPrompts = savedPrompts.filter(p => p.id !== promptId);
			this.plugin.updateSettings({
				savedPrompts: updatedPrompts,
				selectedPromptId: updatedPrompts.length > 0 ? updatedPrompts[0].id : null
			}).then(() => {
				new Notice(`Prompt "${promptToDelete.name}" deleted!`);
				this.display(); // Refresh settings view
			});
		});
		
		// Reset to default prompts button
		const resetPromptsButton = promptButtonContainer.createEl('button', { text: 'Reset to Default Prompts' });
		resetPromptsButton.addEventListener('click', () => {
			const confirmReset = confirm('Are you sure you want to reset to default prompts? This will remove all your custom prompts.');
			if (!confirmReset) return;
			
			this.plugin.updateSettings({
				savedPrompts: DEFAULT_PROMPTS,
				selectedPromptId: DEFAULT_PROMPTS[0].id
			}).then(() => {
				new Notice('Prompt templates reset to defaults!');
				this.display(); // Refresh settings view
			});
		});

		// Custom prompt textarea (disabled when a saved prompt is selected)
		containerEl.createEl('h3', { text: 'Custom Prompt' });

		// Instructions for custom prompt
		const instructionsText = this.plugin.settings.selectedPromptId === null || this.plugin.settings.selectedPromptId === 'custom'
			? 'Edit your custom prompt below:'
			: 'You are using a saved prompt template. Edit the template or switch to "Custom Prompt" to edit here directly.';
			
		containerEl.createEl('p', { text: instructionsText });
		
		// Setting for Summary Prompt
		new Setting(containerEl)
			.setName('Summary prompt')
			.setDesc('Customize the prompt for generating summaries')
			.addTextArea((text) =>
				text
					.setPlaceholder('Enter custom prompt')
					.setValue(this.plugin.settings.customPrompt)
					.onChange(async (value) => {
						await this.plugin.updateSettings({
							customPrompt: value,
						});
					})
					.then(textArea => {
						// Set width to 500px
						textArea.inputEl.style.width = '500px';
						// Set height to accommodate approximately 10 lines
						textArea.inputEl.style.height = '200px';
						
						// Disable text area if a saved prompt is selected
						const isCustom = this.plugin.settings.selectedPromptId === null || 
							this.plugin.settings.selectedPromptId === 'custom';
						textArea.inputEl.disabled = !isCustom;
					})
			);

		// Button to reset settings
		containerEl.createEl('h3', { text: 'Reset Settings' });
		
		new Setting(containerEl)
			.setName('Reset settings')
			.setDesc('Reset all settings to default values')
			.addButton((button) =>
				button
					.setButtonText('Reset All Settings')
					.setCta()
					.onClick(async () => {
						const confirmReset = confirm('Are you sure you want to reset all settings? This will erase your API keys and any custom prompts.');
						if (!confirmReset) return;
						
						await this.plugin.updateSettings({
							...DEFAULT_SETTINGS,
						});
						new Notice('Settings reset to default values');
						this.display();
					})
			);
	}
}

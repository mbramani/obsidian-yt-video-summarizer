import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import { DEFAULT_SETTINGS, GEMINI_MODELS } from './constants';

import { GeminiModel } from './types';
import { YouTubeSummarizerPlugin } from './main';

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

		// Setting for Gemini API Key
		new Setting(containerEl)
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
		new Setting(containerEl)
			.setName('Gemini model')
			.setDesc('Select Gemini model version')
			.addDropdown((dropdown) =>
				dropdown
					.addOptions(
						Object.fromEntries(
							GEMINI_MODELS.map((model) => [model, model])
						)
					)
					.setValue(this.plugin.settings.selectedModel)
					.onChange(async (value) => {
						await this.plugin.updateSettings({
							selectedModel: value as GeminiModel,
						});
					})
			);

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
						// Set width to 50% of container
						textArea.inputEl.style.width = '500px';
						// Set height to accommodate approximately 10 lines
						textArea.inputEl.style.height = '200px';
					})
			);

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

		// Button to reset settings
		new Setting(containerEl)
			.setName('Reset settings')
			.setDesc('Reset all settings to default values')
			.addButton((button) =>
				button
					.setButtonText('Reset')
					.setCta()
					.onClick(async () => {
						await this.plugin.updateSettings({
							...DEFAULT_SETTINGS,
						});
						new Notice('Settings reset to default values');
						this.display();
					})
			);
	}
}

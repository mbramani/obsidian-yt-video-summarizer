import { Notice, Plugin } from 'obsidian';

import { DEFAULT_SETTINGS } from '../constants';
import { PluginSettings } from 'src/types';

/**
 * Service class for managing plugin data.
 * This class is responsible for loading and saving plugin settings.
 * It provides methods for interacting with the Obsidian plugin API.
 */
export class StorageService {
	private settings: PluginSettings;

	/**
	 * Creates an instance of StorageService.
	 * @param plugin - The Obsidian plugin instance.
	 */
	constructor(private plugin: Plugin) {
		this.settings = { ...DEFAULT_SETTINGS };
	}

	/**
	 * Loads the plugin data from the storage.
	 * If no data is found, it uses the default settings.
	 * @returns Promise that resolves when the data is loaded
	 */
	async loadData(): Promise<void> {
		try {
			// Load the plugin data
			const loaded = await this.plugin.loadData();

			// Check if data is available
			if (loaded && loaded.settings) {
				this.settings = {
					...DEFAULT_SETTINGS,
					...loaded.settings,
				};
			} else {
				// Use default settings if no data is found
				this.settings = { ...DEFAULT_SETTINGS };
			}
		} catch (error) {
			console.error('Failed to load data:', error);
			new Notice('Failed to load settings');
			this.settings = { ...DEFAULT_SETTINGS };
		}
	}

	/**
	 * Saves the plugin data to the storage.
	 * @returns Promise that resolves when the data is saved
	 */
	async saveData(): Promise<void> {
		try {
			await this.plugin.saveData({
				settings: this.settings,
			});
		} catch (error) {
			new Notice('Failed to save settings');
		}
	}

	/**
	 * Retrieves the current plugin settings.
	 * If the settings are not loaded, it loads the data first.
	 * @returns Promise containing the plugin settings
	 */
	async getSettings(): Promise<PluginSettings> {
		if (!this.settings) {
			await this.loadData();
		}
		return { ...this.settings };
	}

	/**
	 * Updates the plugin settings with the provided values.
	 * @param settings - The settings to update
	 * @returns Promise that resolves when the settings are updated
	 */
	async updateSettings(settings: Partial<PluginSettings>): Promise<void> {
		// Check if settings are provided
		if (!settings) return;

		this.settings = {
			...this.settings,
			...settings,
		};

		// Save the updated settings
		await this.saveData();
	}
}

import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import { ModelConfig, PluginSettings } from '../types';
import { YouTubeSummarizerPlugin } from '../main';
import { SettingsUIComponents } from './components/SettingsUIComponents';
import { SettingsEventHandlers, UICallbacks } from './handlers/SettingsEventHandlers';
import { SettingsModalsFactory } from './modals/SettingsModalsFactory';

/**
 * Represents the settings tab for the YouTube Summarizer Plugin.
 * This class extends the PluginSettingTab and provides a user interface
 * for configuring the plugin's settings.
 */
export class SettingsTab extends PluginSettingTab {
    private currentTab: string = 'ai-providers';
    private settings: PluginSettings;
    private uiComponents: SettingsUIComponents;
    private eventHandlers: SettingsEventHandlers;
    private modals: SettingsModalsFactory;

    constructor(app: App, private plugin: YouTubeSummarizerPlugin) {
        super(app, plugin);
        this.settings = plugin.settings;
        const selectedModel = this.settings.getSelectedModel();
        this.uiComponents = new SettingsUIComponents(app);

        // Create callbacks for UI updates
        const callbacks: UICallbacks = {
            onModelAdded: (model) => {
                this.reload();
            },
            onModelDeleted: (model) => {
                this.reload();
            },
            onModelUpdated: (model) => {
                this.reload();
            },
            onProviderAdded: (provider) => {
                this.reload();
            },
            onProviderDeleted: () => {
                this.reload();
            },
            onProviderUpdated: (provider, originalName) => {
                // Change the provider name in the accordion in order to keep the accordion open in the reload() function
                const oldAccordion = document.querySelector(`[data-provider-name="${originalName}"]`);
                if (oldAccordion) {
                    oldAccordion.setAttribute('data-provider-name', provider.name);
                }
                this.reload();
            },
            onActiveModelChanged: () => {
                this.uiComponents.updateModelDropdown(
                    this.getAvailableModels(),
                    this.settings.getSelectedModel()?.name || null
                );
            }
        };

        this.modals = new SettingsModalsFactory(app);
        this.eventHandlers = new SettingsEventHandlers(plugin, this.modals, callbacks);
    }

    getAvailableModels(): ModelConfig[] {
        return this.settings.getModels();
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        const tabs = containerEl.createEl('div', { cls: 'yt-summarizer-settings__tab-group' });
        const tabList = tabs.createEl('nav', { cls: 'yt-summarizer-settings__tab-list' });
        const tabContent = tabs.createEl('div', { cls: 'yt-summarizer-settings__tab-content' });

        const aiProvidersContent = tabContent.createDiv({ cls: 'yt-summarizer-settings__content' });
        const summarySettingsContent = tabContent.createDiv({ cls: 'yt-summarizer-settings__content' });

        // Hide inactive tab content
        aiProvidersContent.style.display = this.currentTab === 'ai-providers' ? 'block' : 'none';
        summarySettingsContent.style.display = this.currentTab === 'summary-settings' ? 'block' : 'none';

        // Create tab buttons
        this.createTabButtons(tabList);

        // Display sections
        this.displayAIProvidersSection(aiProvidersContent);
        this.displaySummarySettingsSection(summarySettingsContent);
    }

    private createTabButtons(tabList: HTMLElement): void {
        const tabs = [
            { name: 'AI Providers', id: 'ai-providers' },
            { name: 'Summary Settings', id: 'summary-settings' }
        ];

        tabs.forEach(({ name, id }) => {
            const tab = this.uiComponents.createTabButton(name, id, this.currentTab === id);
            tab.addEventListener('click', () => {
                this.currentTab = id;
                this.display();
            });
            tabList.appendChild(tab);
        });
    }

    private buildModelId(model: ModelConfig): string {
        if (!model.provider || !model.name) {
            return '';
        }
        return `${model.provider.name}:${model.name}`;
    }

    private displayAIProvidersSection(containerEl: HTMLElement): void {
        // Active Model Selection
        const availableModels = this.getAvailableModels();
		const selectedModel = this.settings.getSelectedModel();

        new Setting(containerEl)
            .setName('Active Model')
            .setDesc('Select which model to use for generating summaries')
            .addDropdown(dropdown => {
                const options: Record<string, string> = {};
                availableModels.forEach(model => {
                    const displayText = model.displayName || model.name;
                    const modelId = this.buildModelId(model);
                    options[modelId] = `${model.provider.name} / ${displayText}`;
                });

                dropdown
                    .addOptions(options)
                    .setValue(selectedModel ? this.buildModelId(selectedModel) : '')
                    .onChange(async (value) => {
                        await this.eventHandlers.handleModelSelection(value);
                    });

            });

        // Provider Accordions Container
        const accordionsContainer = containerEl.createDiv({ cls: 'yt-summarizer-settings__provider-accordions' });

        // Create accordions for each provider
        this.settings.getProviders().forEach(provider => {
            this.uiComponents.addProviderAccordion(provider, this.eventHandlers);
        });

        // Add Provider button at the bottom
        const addProviderButton = new Setting(containerEl)
            .setName('Add New Provider')
            .setDesc('Add a custom AI provider')
            .addButton(button =>
                button
                    .setButtonText('Add Provider')
                    .setCta()
                    .onClick(() => {
                        const modal = this.modals.createAddProviderModal(this.eventHandlers);
                        modal.open();
                    })
            );
        addProviderButton.settingEl.addClass('yt-summarizer-settings__add-provider-button');
    }

    private displaySummarySettingsSection(containerEl: HTMLElement): void {
        // Summary Prompt Setting
        new Setting(containerEl)
            .setName('Summary prompt')
            .setDesc('Customize the prompt for generating summaries')
            .addTextArea(text =>
                text
                    .setPlaceholder('Enter custom prompt')
                    .setValue(this.settings.getCustomPrompt())
                    .onChange(async (value) => {
                        await this.settings.updateCustomPrompt(value);
                    })
                    .then(textArea => {
                        textArea.inputEl.addClass('yt-summarizer-settings__summary-prompt');
                    })
            );

        // Max Tokens Setting
        new Setting(containerEl)
            .setName('Maximum number of tokens to generate')
            .setDesc('More tokens allow for longer summaries, but may exceed provider limits')
            .addText(text =>
                text
                    .setPlaceholder('Enter max tokens')
                    .setValue(String(this.settings.getMaxTokens()))
                    .onChange(async (value) => {
                        await this.settings.updateMaxTokens(Number(value));
                    })
            );

        // Temperature Setting
        new Setting(containerEl)
            .setName('Temperature')
            .setDesc('Controls randomness in generation (0.0 to 1.0, or up to 2.0 for OpenAI)')
            .addExtraButton(button => {
                button
                    .setIcon('help-circle')
                    .setTooltip('Higher temperature values produce more creative and varied results, while lower values make output more deterministic and focused. For manually added providers, refer to provider documentation for supported ranges.');
            })
            .addText(text =>
                text
                    .setPlaceholder('Enter temperature')
                    .setValue(String(this.settings.getTemperature()))
                    .onChange(async (value) => {
                        await this.settings.updateTemperature(Number(value));
                    })
            );
    }

    private reload(): void {
        // Find currently opened accordion
        const openedAccordion = document.querySelector('.yt-summarizer-settings__provider-content[style*="block"]');
        let openedProviderName: string | null = null;

        if (openedAccordion) {
            const accordion = openedAccordion.closest('.yt-summarizer-settings__provider-accordion');
            if (accordion) {
                openedProviderName = accordion.getAttribute('data-provider-name');
            }
        }

        // Refresh the display
        this.display();

        // If there was an opened accordion, find and open it in the new display
        if (openedProviderName) {
            const newAccordion = document.querySelector(`[data-provider-name="${openedProviderName}"]`);
            if (newAccordion) {
                newAccordion.addClass('is-expanded');
            }
        }
    }
}
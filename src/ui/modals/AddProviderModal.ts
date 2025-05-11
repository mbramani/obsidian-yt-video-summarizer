import { App, Modal, Setting } from 'obsidian';
import { ProviderConfig, ProviderType } from '../../types';
import { SettingsEventHandlers } from '../handlers/SettingsEventHandlers';

export class AddProviderModal extends Modal {
    private name: string = '';
    private type: string = 'openai';
    private apiKey: string = '';
    private url: string = '';

    constructor(
        app: App,
        private handlers: SettingsEventHandlers
    ) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('yt-summarizer-settings__modal');

        contentEl.createEl('h2', { text: 'Add Provider' });

        // Provider Name
        new Setting(contentEl)
            .setName('Provider Name')
            .setDesc('Enter provider name')
            .addText(text =>
                text
                    .setPlaceholder('Enter name')
                    .setValue(this.name)
                    .onChange(value => this.name = value)
            );

        // Provider Type
        new Setting(contentEl)
            .setName('Provider Type')
            .setDesc('Select provider type')
            .addDropdown(dropdown => {
                dropdown
                    .addOption('openai', 'OpenAI')
                    .addOption('anthropic', 'Anthropic')
                    .setValue(this.type)
                    .onChange(value => this.type = value);
            });

        // API Key
        new Setting(contentEl)
            .setName('API Key')
            .setDesc('Enter API key')
            .addText(text =>
                text
                    .setPlaceholder('Enter API key')
                    .setValue(this.apiKey)
                    .onChange(value => this.apiKey = value)
            );

        // URL (Optional)
        new Setting(contentEl)
            .setName('URL (Optional)')
            .setDesc('Enter custom API URL')
            .addText(text =>
                text
                    .setPlaceholder('Enter URL')
                    .setValue(this.url)
                    .onChange(value => this.url = value)
            );

        // Buttons
        new Setting(contentEl)
            .addButton(btn =>
                btn
                    .setButtonText('Save')
                    .setCta()
                    .onClick(async () => {
                        try {
                            const newProvider: ProviderConfig = {
                                name: this.name,
                                type: this.type as ProviderType,
                                isBuiltIn: false,
                                apiKey: this.apiKey,
                                url: this.url || undefined,
                                models: []
                            };
                            await this.handlers.handleProviderAdd(newProvider);
                            this.close();
                        } catch (error) {
                            console.error('Failed to add provider:', error);
                        }
                    }))
            .addButton(btn =>
                btn
                    .setButtonText('Cancel')
                    .onClick(() => {
                        this.close();
                    }));
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
} 
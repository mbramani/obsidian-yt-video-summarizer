import { App, Modal, Setting } from 'obsidian';
import { ProviderConfig, ProviderType } from '../../types';
import { SettingsEventHandlers } from '../handlers/SettingsEventHandlers';

export class EditProviderModal extends Modal {
    private name: string;
    private originalName: string;
    private type: string;
    private url: string;

    constructor(
        app: App,
        private provider: ProviderConfig,
        private handlers: SettingsEventHandlers
    ) {
        super(app);
        this.name = provider.name;
        this.originalName = provider.name;
        this.type = provider.type;
        this.url = provider.url || '';
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h2', { text: 'Edit Provider' });

        new Setting(contentEl)
            .setName('Name')
            .setDesc('Enter provider name')
            .addText(text =>
                text
                    .setPlaceholder('Enter name')
                    .setValue(this.name)
                    .onChange(value => this.name = value)
            );

        new Setting(contentEl)
            .setName('Type')
            .setDesc('Select provider type')
            .addDropdown(dropdown => {
                dropdown
                    .addOption('openai', 'OpenAI')
                    .addOption('anthropic', 'Anthropic')
                    .addOption('gemini', 'Gemini')
                    .setValue(this.type)
                    .onChange(value => this.type = value);
            });

        new Setting(contentEl)
            .setName('URL (optional)')
            .setDesc('Enter provider URL')
            .addText(text =>
                text
                    .setPlaceholder('Enter URL')
                    .setValue(this.url)
                    .onChange(value => this.url = value)
            );

        new Setting(contentEl)
            .addButton(btn =>
                btn
                    .setButtonText('Save')
                    .setCta()
                    .onClick(async () => {
                        try {
                            const updatedProvider: ProviderConfig = {
                                ...this.provider,
                                name: this.name,
                                type: this.type as ProviderType,
                                url: this.url || undefined
                            };
                            await this.handlers.handleProviderEdit(updatedProvider, this.originalName);
                            this.close();
                        } catch (error) {
                            console.error('Failed to update provider:', error);
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
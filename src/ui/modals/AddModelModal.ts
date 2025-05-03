import { App, Modal, Setting } from 'obsidian';
import { ModelConfig, ProviderConfig } from '../../types';
import { SettingsEventHandlers } from '../handlers/SettingsEventHandlers';

export class AddModelModal extends Modal {
    private name: string = '';
    private displayName: string = '';

    constructor(
        app: App,
        private provider: ProviderConfig,
        private handlers: SettingsEventHandlers
    ) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h2', { text: 'Add Model' });

        // Model Name (required)
        new Setting(contentEl)
            .setName('Model Name')
            .setDesc('Enter model name (required)')
            .addText(text =>
                text
                    .setPlaceholder('Enter model name')
                    .setValue(this.name)
                    .onChange(value => this.name = value)
            );

        // Display Name (optional)
        new Setting(contentEl)
            .setName('Display Name')
            .setDesc('Enter display name (optional)')
            .addText(text =>
                text
                    .setPlaceholder('Enter display name')
                    .setValue(this.displayName)
                    .onChange(value => this.displayName = value)
            );

        // Buttons
        new Setting(contentEl)
            .addButton(btn =>
                btn
                    .setButtonText('Save')
                    .setCta()
                    .onClick(async () => {
                        try {
                            const newModel: ModelConfig = {
                                name: this.name,
                                displayName: this.displayName || undefined,
                                provider: {
                                    name: this.provider.name,
                                    type: this.provider.type,
                                    apiKey: this.provider.apiKey,
                                    url: this.provider.url,
                                }
                            };
                            await this.handlers.handleModelAdd(newModel);
                            this.close();
                        } catch (error) {
                            console.error('Failed to add model:', error);
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
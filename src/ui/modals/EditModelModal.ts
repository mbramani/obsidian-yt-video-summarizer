import { App, Modal, Setting } from 'obsidian';
import { ModelConfig } from '../../types';
import { SettingsEventHandlers } from '../handlers/SettingsEventHandlers';

export class EditModelModal extends Modal {
    private displayName: string;

    constructor(
        app: App,
        private model: ModelConfig,
        private handlers: SettingsEventHandlers
    ) {
        super(app);
        this.displayName = model.displayName || '';
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('yt-summarizer-settings__modal');

        contentEl.createEl('h2', { text: 'Edit Model' });

        // Model Name (read-only)
        new Setting(contentEl)
            .setName('Model Name')
            .setDesc('Model identifier (cannot be changed)')
            .addText(text =>
                text
                    .setValue(this.model.name)
                    .setDisabled(true)
            );

        // Display Name
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
                            const updatedModel: ModelConfig = {
                                ...this.model,
                                displayName: this.displayName || undefined
                            };
                            await this.handlers.handleModelEdit(updatedModel);
                            this.close();
                        } catch (error) {
                            console.error('Failed to update model:', error);
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
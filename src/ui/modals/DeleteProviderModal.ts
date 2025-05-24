import { App, Modal } from 'obsidian';
import { ProviderConfig } from '../../types';
import { SettingsEventHandlers } from '../handlers/SettingsEventHandlers';

export class DeleteProviderModal extends Modal {
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

        contentEl.createEl('h2', { text: 'Delete Provider' });

        const messageEl = contentEl.createEl('p', {
            text: `Are you sure you want to delete the provider "${this.provider.name}"?`
        });
        messageEl.style.marginBottom = '16px';

        if (this.provider.models && this.provider.models.length > 0) {
            const warningEl = contentEl.createEl('p', {
                text: `Warning: This provider has ${this.provider.models.length} associated model(s). Deleting the provider will also delete all its models.`,
                cls: 'mod-warning'
            });
            warningEl.style.marginBottom = '16px';
        }

        const buttonContainer = contentEl.createDiv({ cls: 'yt-summarizer-settings__button-container' });

        buttonContainer.createEl('button', { text: 'Cancel' })
            .addEventListener('click', () => {
                this.close();
            });

        const deleteButton = buttonContainer.createEl('button', {
            text: 'Delete',
            cls: 'mod-warning'
        });

        deleteButton.addEventListener('click', async () => {
            try {
                await this.handlers.handleProviderDelete(this.provider);
                this.close();
            } catch (error) {
                console.error('Failed to delete provider:', error);
            }
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
} 
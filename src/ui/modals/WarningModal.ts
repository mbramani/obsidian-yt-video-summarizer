import { App, Modal, Setting, ButtonComponent } from 'obsidian';

export class WarningModal extends Modal {
    constructor(app: App, private message: string) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h2', { text: 'Warning' });
        contentEl.createEl('p', { text: this.message });

        new Setting(contentEl)
            .addButton((btn: ButtonComponent) => {
                btn.setButtonText('Close')
                    .setCta()
                    .onClick(() => {
                        this.close();
                    });
            });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
} 
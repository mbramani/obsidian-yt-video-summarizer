import { App, Modal, Notice } from 'obsidian';

/**
 * A modal dialog for entering a YouTube URL.
 */
export class YouTubeURLModal extends Modal {
	private onSubmit: (url: string) => void;

	/**
	 * Constructs a new YouTubeURLModal.
	 * @param app - The Obsidian app instance.
	 * @param onSubmit - Callback function to handle the submitted URL.
	 */
	constructor(app: App, onSubmit: (url: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	/**
	 * Called when the modal is opened.
	 * Sets up the modal content.
	 */
	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		// Create modal content
		contentEl.createDiv({ cls: 'yt-summarizer-modal' }, (modalEl) => {
			modalEl.createEl('h2', {
				text: 'Enter YouTube URL',
				cls: 'yt-summarizer-modal__title',
			});

			// Input field for YouTube URL
			const inputEl = modalEl.createEl('input', {
				type: 'text',
				placeholder: 'https://www.youtube.com/watch?v=...',
				cls: 'yt-summarizer__input',
			});

			// Action buttons
			const actions = modalEl.createDiv({
				cls: 'yt-summarizer__actions',
			});

			const submitBtn = actions.createEl('button', {
				text: 'Submit',
				cls: 'yt-summarizer__button yt-summarizer__button--primary',
			});

			const cancelBtn = actions.createEl('button', {
				text: 'Cancel',
				cls: 'yt-summarizer__button yt-summarizer__button--danger',
			});

			// Handle submit button click
			submitBtn.addEventListener('click', () => {
				const url = inputEl.value.trim();
				if (url) {
					this.onSubmit(url);
					this.close();
				} else {
					new Notice('Please enter a valid URL');
				}
			});

			// Handle cancel button click
			cancelBtn.addEventListener('click', () => this.close());
		});
	}

	/**
	 * Called when the modal is closed.
	 * Cleans up the modal content.
	 */
	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

import { App, Setting, setIcon } from 'obsidian';
import { ModelConfig, ProviderConfig } from '../../types';
import { SettingsEventHandlers } from '../handlers/SettingsEventHandlers';

export class SettingsUIComponents {
    constructor(private app: App) { }

    createProviderAccordion(provider: ProviderConfig): HTMLElement {
        const accordion = document.createElement('div');
        accordion.addClass('yt-summarizer-settings__provider-accordion');
        accordion.setAttribute('data-provider-name', provider.name);

        // Header section
        const header = accordion.createDiv({ cls: 'yt-summarizer-settings__provider-header' });

        // Left side of header
        const headerInfo = header.createDiv();
        headerInfo.addClass('yt-summarizer-settings__provider-info');

        const titleEl = headerInfo.createEl('h3', { text: provider.name });

        // Right side of header - controls
        const headerControls = header.createDiv({ cls: 'yt-summarizer-settings__provider-controls' });

        if (!provider.isBuiltIn) {
            // Edit button
            const editButton = headerControls.createEl('button', {
                cls: 'clickable-icon yt-summarizer-settings__provider-edit',
                attr: { 'aria-label': 'Edit provider' }
            });
            setIcon(editButton, 'pencil');

            // Delete button
            const deleteButton = headerControls.createEl('button', {
                cls: 'clickable-icon yt-summarizer-settings__provider-delete',
                attr: { 'aria-label': 'Delete provider' }
            });
            setIcon(deleteButton, 'trash');
        }

        // Collapse/expand icon
        const iconEl = headerControls.createDiv({ cls: 'yt-summarizer-settings__collapse-icon' });
        setIcon(iconEl, 'chevron-down');

        // Content section
        const content = accordion.createDiv({ cls: 'yt-summarizer-settings__provider-content' });

        return accordion;
    }

    createModelItem(model: ModelConfig): HTMLElement {
        const modelItem = document.createElement('div');
        modelItem.addClass('setting-item');
        modelItem.setAttribute('data-model-name', model.name);

        // Info container (left side)
        const info = modelItem.createDiv({ cls: 'setting-item-info' });

        // Status indicator and name in the title
        const title = info.createDiv({ cls: 'setting-item-name' });
        title.createSpan({ text: model.displayName || model.name });

        // Control container (right side)
        const control = modelItem.createDiv({ cls: 'setting-item-control' });

        // Edit button
        const editButton = control.createEl('button', {
            cls: 'clickable-icon',
            attr: { 'aria-label': 'Edit model' }
        });
        setIcon(editButton, 'pencil');

        // Delete button
        const deleteButton = control.createEl('button', {
            cls: 'clickable-icon',
            attr: { 'aria-label': 'Delete model' }
        });
        setIcon(deleteButton, 'trash');

        return modelItem;
    }

    createTabButton(name: string, id: string, isActive: boolean): HTMLElement {
        const tab = document.createElement('div');
        tab.addClass('yt-summarizer-settings__tab');
        tab.textContent = name;

        if (isActive) {
            tab.addClass('is-active');
        }

        return tab;
    }

    createApiKeySetting(container: HTMLElement, provider: ProviderConfig, handlers: SettingsEventHandlers): Setting {
        return new Setting(container)
            .setName('API Key')
            .setDesc(`Enter your ${provider.name} API key`)
            .addText(text => {
                text
                    .setPlaceholder('Enter API key')
                    .setValue(provider.apiKey)
                    .onChange(async (value) => {
                        await handlers.handleApiKeyChange(provider.name, value);
                    });
                text.inputEl.type = 'password';
                return text;
            });
    }

    // New methods for dynamic UI updates
    addModelToAccordion(model: ModelConfig, handlers: SettingsEventHandlers): void {
        const accordion = document.querySelector(`[data-provider-name="${model.provider.name}"]`);
        if (!accordion) return;

        const modelsList = accordion.querySelector('.yt-summarizer-settings__models-list');
        if (!modelsList) return;

        const modelItem = this.createModelItem(model);

        // Add event listeners
        const editButton = modelItem.querySelector('[aria-label="Edit model"]');
        const deleteButton = modelItem.querySelector('[aria-label="Delete model"]');

        editButton?.addEventListener('click', () => {
            handlers.handleModelEditClick(model);
        });

        deleteButton?.addEventListener('click', () => {
            handlers.handleModelDeleteClick(model);
        });

        modelsList.appendChild(modelItem);
    }

    removeModelFromAccordion(model: ModelConfig): void {
        const modelItem = document.querySelector(`[data-model-name="${model.name}"]`);
        modelItem?.remove();
    }

    updateModelInAccordion(model: ModelConfig): void {
        const modelItem = document.querySelector(`[data-model-name="${model.name}"]`);
        if (!modelItem) return;

        const titleSpan = modelItem.querySelector('.setting-item-name span');
        if (titleSpan) {
            titleSpan.textContent = model.displayName || model.name;
        }
    }

    updateModelDropdown(models: ModelConfig[], selectedModel: string | null): void {
        const dropdown = document.querySelector('.setting-item select') as HTMLSelectElement;
        if (!dropdown) return;

        // Save current scroll position
        const scrollPos = dropdown.scrollTop;

        // Clear existing options
        dropdown.innerHTML = '';

        // Add new options
        models.forEach(model => {
            const option = document.createElement('option');
            option.value = model.name;
            option.text = `${model.provider.name} / ${model.displayName || model.name}`;
            dropdown.appendChild(option);
        });

        // Restore selection and scroll position
        if (selectedModel) {
            dropdown.value = selectedModel;
        }
        dropdown.scrollTop = scrollPos;
    }

    addProviderAccordion(provider: ProviderConfig, handlers: SettingsEventHandlers): void {
        const accordionsContainer = document.querySelector('.yt-summarizer-settings__provider-accordions');
        if (!accordionsContainer) return;

        const accordion = this.createProviderAccordion(provider);
        const content = accordion.querySelector('.yt-summarizer-settings__provider-content') as HTMLElement;

        // Add click handler for accordion toggle
        const header = accordion.querySelector('.yt-summarizer-settings__provider-header');
        const editButton = accordion.querySelector('.yt-summarizer-settings__provider-edit');
        const deleteButton = accordion.querySelector('.yt-summarizer-settings__provider-delete');

        // Handle header click for collapse/expand
        header?.addEventListener('click', (e) => {
            // Only toggle if the click wasn't on the edit or delete buttons
            if (!editButton?.contains(e.target as Node) && !deleteButton?.contains(e.target as Node)) {
                handlers.handleAccordionToggle(accordion);
            }
        });

        // Handle edit button click
        editButton?.addEventListener('click', () => {
            handlers.handleProviderEditClick(provider);
        });

        // Handle delete button click
        deleteButton?.addEventListener('click', () => {
            handlers.handleProviderDeleteClick(provider);
        });

        // Add API Key Setting
        const apiKeySetting = this.createApiKeySetting(content, provider, handlers);

        // Add visibility toggle button
        apiKeySetting.addExtraButton(button => {
            button
                .setIcon('eye')
                .setTooltip('Show API key')
                .onClick(() => {
                    const input = apiKeySetting.controlEl.querySelector('input');
                    if (input) {
                        const isPassword = input.type === 'password';
                        input.type = isPassword ? 'text' : 'password';
                        button.setIcon(isPassword ? 'eye-off' : 'eye');
                        button.setTooltip(isPassword ? 'Hide API key' : 'Show API key');
                    }
                });
        });

        // Add Models section
        const modelsSection = content.createDiv();
        const modelsHeader = modelsSection.createEl('h4', {
            text: 'Models',
            cls: 'yt-summarizer-settings__models-header'
        });

        // Models list
        const modelsList = modelsSection.createDiv({ cls: 'yt-summarizer-settings__models-list' });

        // Add models
        provider.models?.forEach(model => {
            const modelItem = this.createModelItem(model);

            // Add event listeners
            const editButton = modelItem.querySelector('[aria-label="Edit model"]');
            const deleteButton = modelItem.querySelector('[aria-label="Delete model"]');

            editButton?.addEventListener('click', () => {
                handlers.handleModelEditClick(model);
            });

            deleteButton?.addEventListener('click', () => {
                handlers.handleModelDeleteClick(model);
            });

            modelsList.appendChild(modelItem);
        });

        // Add Model button
        const addModelButton = new Setting(modelsSection)
            .addButton(button =>
                button
                    .setButtonText('Add Model')
                    .setCta()
                    .onClick(() => {
                        handlers.handleAddModelClick(provider);
                    })
            );
        addModelButton.settingEl.addClass('yt-summarizer-settings__add-button');

        accordionsContainer.appendChild(accordion);
    }
} 
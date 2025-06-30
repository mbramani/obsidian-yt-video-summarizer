import { Notice } from 'obsidian';
import { ModelConfig, ProviderConfig } from '../../types';
import { YouTubeSummarizerPlugin } from '../../main';
import { SettingsModalsFactory } from '../modals/SettingsModalsFactory';

export interface UICallbacks {
    onModelAdded?: (model: ModelConfig) => void;
    onModelDeleted?: (model: ModelConfig) => void;
    onModelUpdated?: (model: ModelConfig) => void;
    onProviderAdded?: (provider: ProviderConfig) => void;
    onProviderDeleted?: (provider: ProviderConfig) => void;
    onProviderUpdated?: (provider: ProviderConfig, originalName: string) => void;
    onActiveModelChanged?: () => void;
}

export class SettingsEventHandlers {
    constructor(
        private plugin: YouTubeSummarizerPlugin,
        private settingsModalsFactory: SettingsModalsFactory,
        private callbacks: UICallbacks = {}
    ) { }

    async handleModelSelection(value: string): Promise<void> {
        try {
            if (!this.plugin.settings.validateModelId(value)) {
                console.error('Couldn\'t save active model:', value, 'Invalid model ID');
                return;
            }
            await this.plugin.settings.updateActiveModel(value);
            await this.plugin.initializeServices();
            this.callbacks.onActiveModelChanged?.();
        } catch (error) {
            console.error('Failed to set active model:', error, 'Selected model:', value);
            new Notice(`Failed to set active model: ${error.message}`);
        }
    }

    handleAccordionToggle(accordion: HTMLElement): void {
        const header = accordion.querySelector('.yt-summarizer-settings__provider-header') as HTMLElement;
        const content = accordion.querySelector('.yt-summarizer-settings__provider-content') as HTMLElement;
        const icon = accordion.querySelector('.yt-summarizer-settings__collapse-icon') as HTMLElement;

        if (!content || !icon) return;

        const isExpanded = accordion.hasClass('is-expanded');
        accordion.toggleClass('is-expanded', !isExpanded);

        // Update all other accordions
        const allAccordions = document.querySelectorAll('.yt-summarizer-settings__provider-accordion');
        allAccordions.forEach(otherAccordion => {
            if (otherAccordion !== accordion) {
            otherAccordion.removeClass('is-expanded')
            }
        });
    }

    async handleProviderAdd(provider: ProviderConfig): Promise<void> {
        try {
            this.plugin.settings.addProvider(provider);
            this.callbacks.onProviderAdded?.(provider);
        } catch (error) {
            new Notice(`Failed to add provider: ${error.message}`);
            throw error;
        }
    }

    async handleProviderEdit(provider: ProviderConfig, originalName: string): Promise<void> {
        try {
            this.plugin.settings.updateProvider(provider, originalName);
            this.callbacks.onProviderUpdated?.(provider, originalName);
            new Notice(`Provider ${provider.name} updated successfully`);
        } catch (error) {
            console.error('Error updating provider:', error);
            new Notice(`Failed to update provider: ${error.message}`);
            throw error;
        }
    }

    // Click on a trash icon to delete a provider
    handleProviderDeleteClick(provider: ProviderConfig): void {
        const selectedModel = this.plugin.settings.getSelectedModel();
        if (selectedModel && selectedModel.provider.name === provider.name) {
            const warningMessage = `Cannot delete provider "${provider.name}" because it contains the currently selected model "${selectedModel.name}". ` +
                `Please select a model from a different provider first.`;
            const modal = this.settingsModalsFactory.createWarningModal(warningMessage);
            modal.open();
            return;
        }

        const modal = this.settingsModalsFactory.createDeleteProviderModal(provider, this);
        modal.open();
    }

    // Click on a "Delete" button at confirmation popup
    async handleProviderDelete(provider: ProviderConfig): Promise<void> {
        try {
            this.plugin.settings.deleteProvider(provider);
            this.callbacks.onProviderDeleted?.(provider);
            new Notice(`Provider ${provider.name} deleted successfully`);
        } catch (error) {
            console.error('Error deleting provider:', error);
            new Notice(`Failed to delete provider: ${error.message}`);
            throw error;
        }
    }

    async handleModelAdd(model: ModelConfig): Promise<void> {
        try {
            this.plugin.settings.addModel(model);
            this.callbacks.onModelAdded?.(model);
        } catch (error) {
            new Notice(`Failed to add model: ${error.message}`);
            throw error;
        }
    }

    async handleModelEdit(model: ModelConfig): Promise<void> {
        try {
            this.plugin.settings.updateModel(
                model.name,
                model.displayName || model.name,
                model.provider.name
            );
            this.callbacks.onModelUpdated?.(model);
        } catch (error) {
            new Notice(`Failed to update model: ${error.message}`);
            throw error;
        }
    }

    async handleModelDelete(model: ModelConfig): Promise<void> {
        try {
            this.plugin.settings.deleteModel(model.provider.name, model.name);
            this.callbacks.onModelDeleted?.(model);
        } catch (error) {
            console.error('Error deleting model:', error);
            new Notice(`Failed to delete model: ${error.message}`);
            throw error;
        }
    }

    handleModelEditClick(model: ModelConfig): void {
        const modal = this.settingsModalsFactory.createEditModelModal(model, this);
        modal.open();
    }

    handleModelDeleteClick(model: ModelConfig): void {
        const modal = this.settingsModalsFactory.createDeleteModelModal(model, this);
        modal.open();
    }

    handleProviderEditClick(provider: ProviderConfig): void {
        const modal = this.settingsModalsFactory.createEditProviderModal(provider, this);
        modal.open();
    }

    handleAddModelClick(provider: ProviderConfig): void {
        const modal = this.settingsModalsFactory.createAddModelModal(provider, this);
        modal.open();
    }

    /**
     * Handles API key change for a provider and saves it immediately.
     * @param providerName - The name of the provider
     * @param apiKey - The new API key value
     */
    async handleApiKeyChange(providerName: string, apiKey: string): Promise<void> {
        try {
            await this.plugin.settings.saveProviderKey(providerName, apiKey);
        } catch (error) {
            console.error('Failed to save API key:', error);
        }
    }
} 
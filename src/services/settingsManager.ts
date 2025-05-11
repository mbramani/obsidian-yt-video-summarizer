import YouTubeSummarizerPlugin from "src/main";
import { Notice } from "obsidian";
import { ModelConfig, PluginSettings, ProviderConfig, StoredModel, StoredProvider, StoredSettings } from "src/types";
import { DEFAULT_PROVIDERS, DEFAULT_SELECTED_MODEL, DEFAULT_PROMPT, DEFAULT_MAX_TOKENS, DEFAULT_TEMPERATURE } from "src/defaults";

/** Manages plugin settings and provides methods to interact with them */
export class SettingsManager implements PluginSettings {
    private plugin: YouTubeSummarizerPlugin;
    private settings: StoredSettings;

    /** Creates a new instance of SettingsManager */
    public constructor(plugin: YouTubeSummarizerPlugin) {
        this.plugin = plugin;
        // loading default settings
        this.settings = {
            providers: [...DEFAULT_PROVIDERS],
            selectedModelId: DEFAULT_SELECTED_MODEL,
            customPrompt: DEFAULT_PROMPT,
            maxTokens: DEFAULT_MAX_TOKENS,
            temperature: DEFAULT_TEMPERATURE
        };
    }

    public async loadSettings(): Promise<void> {
        const loaded = await this.plugin.loadData();

        // Check if settings are in old format (has geminiApiKey)
        if (loaded?.settings && 'geminiApiKey' in loaded.settings) {
            // Convert old format to new format
            const oldSettings = loaded.settings as {
                geminiApiKey: string;
                selectedModel: string;
                customPrompt: string;
                maxTokens: number;
                temperature: number;
            };

            // Create new format settings
            const providers = [...DEFAULT_PROVIDERS];
            // Update Gemini provider with the old API key
            const geminiProvider = providers.find(p => p.name === 'Gemini');
            if (geminiProvider) {
                geminiProvider.apiKey = oldSettings.geminiApiKey;
            }

            this.settings = {
                providers,
                selectedModelId: oldSettings.selectedModel,
                customPrompt: oldSettings.customPrompt,
                maxTokens: oldSettings.maxTokens,
                temperature: oldSettings.temperature
            };

            // Save in new format
            await this.saveData();
        } else {
            // Settings are in new format, merge with defaults
            this.settings = {
                providers: loaded?.settings.providers ?? this.settings.providers,
                selectedModelId: loaded?.settings.selectedModelId ?? this.settings.selectedModelId,
                customPrompt: loaded?.settings.customPrompt ?? this.settings.customPrompt,
                maxTokens: loaded?.settings.maxTokens ?? this.settings.maxTokens,
                temperature: loaded?.settings.temperature ?? this.settings.temperature
            };
        }
    }

    /** Gets the currently selected model */
    getSelectedModel(): ModelConfig | null {
        if (!this.settings.selectedModelId) return null;

        const found = this.findModelAndProvider(this.settings.selectedModelId);
        if (!found) return null;

        return this.convertToModelConfig(found.model, found.provider);
    }

    /** Gets all available providers */
    getProviders(): ProviderConfig[] {
        return this.settings.providers.map(provider => ({
            name: provider.name,
            type: provider.type,
            isBuiltIn: provider.isBuiltIn,
            apiKey: provider.apiKey,
            url: provider.url,
            models: provider.models.map(model => this.convertToModelConfig(model, provider))
        }));
    }

    /** Gets all available models across all providers */
    getModels(): ModelConfig[] {
        return this.settings.providers.flatMap(provider =>
            provider.models.map(model => this.convertToModelConfig(model, provider))
        );
    }

    /** Gets the custom prompt template */
    getCustomPrompt(): string {
        return this.settings.customPrompt;
    }

    /** Gets the maximum number of tokens for API requests */
    getMaxTokens(): number {
        return this.settings.maxTokens;
    }

    /** Gets the temperature setting for API requests */
    getTemperature(): number {
        return this.settings.temperature;
    }

    /** Adds a new provider */
    addProvider(provider: ProviderConfig): void {
        const storedProvider: StoredProvider = {
            ...provider,
            models: []
        };

        if (!this.validateProvider(storedProvider)) {
            throw new Error('Invalid provider configuration');
        }

        this.settings.providers.push(storedProvider);
        this.saveData();
    }

    /** Adds a new model to a provider */
    addModel(model: ModelConfig): void {
        const provider = this.settings.providers.find(p => p.name === model.provider.name);
        if (!provider) {
            throw new Error('Provider not found');
        }

        const storedModel: StoredModel = {
            name: model.name,
            displayName: model.displayName || model.name
        };

        if (!this.validateModel(storedModel, provider)) {
            throw new Error('Invalid model configuration');
        }

        provider.models.push(storedModel);
        this.saveData();
    }

    /** Updates an existing provider */
    updateProvider(provider: ProviderConfig, originalName: string): void {
        const storedProvider = this.settings.providers.find(p => p.name === originalName);
        if (!storedProvider) {
            throw new Error('Provider not found');
        }

        const updatedProvider: StoredProvider = {
            ...provider,
            models: storedProvider.models
        };

        if (!this.validateProvider(updatedProvider, originalName)) {
            throw new Error('Invalid provider configuration');
        }

        const index = this.settings.providers.indexOf(storedProvider);
        this.settings.providers[index] = updatedProvider;
        this.saveData();
    }

    /** Updates an existing model */
    updateModel(modelName: string, modelDisplayName: string, providerName: string): void {
        const provider = this.settings.providers.find(p => p.name === providerName);
        if (!provider) {
            throw new Error('Provider not found');
        }

        const model = provider.models.find(m => m.name === modelName);
        if (!model) {
            throw new Error('Model not found');
        }

        const storedModel: StoredModel = {
            name: modelName,
            displayName: modelDisplayName
        };

        if (!this.validateModel(storedModel, provider)) {
            throw new Error('Invalid model configuration');
        }

        // Update the model
        model.displayName = modelDisplayName;
        this.saveData();
    }

    /** Deletes a provider */
    deleteProvider(provider: ProviderConfig): void {
        const storedProvider = this.settings.providers.find(p => p.name === provider.name);
        if (!storedProvider) {
            throw new Error('Provider not found');
        }

        if (storedProvider.models.length > 0) {
            // remove all models associated with this provider
            storedProvider.models.forEach(model => {
                this.deleteModel(storedProvider.name, model.name);
            });
        }

        const index = this.settings.providers.indexOf(storedProvider);
        this.settings.providers.splice(index, 1);
        this.saveData();
    }

    /** Deletes a model */
    deleteModel(providerName: string, modelName: string): void {
        // Найдем провайдера по имени
        const provider = this.settings.providers.find(p => p.name === providerName);

        if (!provider) {
            throw new Error(`Provider not found: ${providerName}`);
        }

        // Найдем модель по имени (которое раньше было id)
        const index = provider.models.findIndex(m => m.name === modelName);

        if (index === -1) {
            throw new Error(`Model not found: ${modelName}`);
        }

        // Если это была активная модель, сбросим выбор
        if (this.settings.selectedModelId === modelName) {
            this.settings.selectedModelId = null;
        }

        // Удалим модель из списка
        provider.models.splice(index, 1);
        this.saveData();
    }

    /** Updates the custom prompt template */
    updateCustomPrompt(prompt: string): void {
        this.settings.customPrompt = prompt;
        this.saveData();
    }

    /** Updates the maximum number of tokens */
    updateMaxTokens(tokens: number): void {
        this.settings.maxTokens = tokens;
        this.saveData();
    }

    /** Updates the temperature setting */
    updateTemperature(temperature: number): void {
        this.settings.temperature = temperature;
        this.saveData();
    }


    async updateActiveModel(modelId: string): Promise<void> {
        this.settings.selectedModelId = modelId;
        await this.saveData();
    }

    /** Saves the API key for a provider without validation */
    async saveProviderKey(providerName: string, key: string): Promise<void> {
        const provider = this.settings.providers.find(p => p.name === providerName);
        if (!provider) {
            throw new Error('Provider not found');
        }

        provider.apiKey = key;
        await this.saveData();
    }

    private async saveData(): Promise<void> {
        try {
            await this.plugin.saveData({
                settings: this.settings
            });
        } catch (error) {
            new Notice('Failed to save settings');
            console.error('Failed to save settings:', error);
        }
    }

    private validateProvider(provider: StoredProvider, originalName?: string): boolean {
        if (!provider.name || !provider.type) {
            return false;
        }

        // Check that provider name doesn't contain semicolon
        if (provider.name.includes(':')) {
            new Notice('Provider validation failed: name contains semicolon');
            console.error('Provider validation failed: name contains semicolon', provider.name);
            return false;
        }

        // Check name uniqueness, but allow the provider to keep its own name during updates
        const existingProvider = this.settings.providers.find(p => p.name === provider.name);
        if (existingProvider && (!originalName || provider.name !== originalName)) {
            new Notice('Provider validation failed: name not unique');
            return false;
        }

        return true;
    }

    private validateModel(model: StoredModel, provider: StoredProvider): boolean {
        // Check that the model has required fields
        if (!model.name || !model.displayName) {
            new Notice('Model validation failed: missing name or display name');
            console.error('Model validation failed: missing name or display name', model);
            return false;
        }

        // При обновлении модели мы ищем существующую модель с тем же name
        // Если такая модель найдена, это нормально - мы её и обновляем
        // Если не найдена, проверяем что нет другой модели с таким же name
        const existingModel = provider.models.find(m => m.name === model.name);
        if (!existingModel) {
            // Это новая модель - проверяем уникальность name
            const hasModelWithSameName = provider.models.some(m => m.name === model.name);
            if (hasModelWithSameName) {
                new Notice('Model validation failed: name must be unique within provider');
                console.error('Model validation failed: name must be unique within provider', model);
                return false;
            }
        }

        return true;
    }

    private findModelAndProvider(modelId: string): { model: StoredModel, provider: StoredProvider } | null {
        if (!modelId) {
            return null;
        }

        const { providerName: providerName, modelName: modelName } = this.parseModelId(modelId);
        const provider = this.settings.providers.find(p => p.name === providerName);
        if (!provider) return null;
        const model = provider.models.find(m => m.name === modelName);
        if (!model) return null;
        return { model, provider };
    }

    private convertToModelConfig(model: StoredModel, provider: StoredProvider): ModelConfig {
        return {
            name: model.name,
            displayName: model.displayName,
            provider: {
                name: provider.name,
                type: provider.type,
                isBuiltIn: provider.isBuiltIn,
                apiKey: provider.apiKey,
                url: provider.url,
            }
        };
    }

    public parseModelId(modelId: string): { providerName: string, modelName: string } {
        const [provider, ...modelParts] = modelId.split(':');
        const model = modelParts.join(':');
        return { providerName: provider, modelName: model };
    }

    private makeModelId(provider: string, model: string): string {
        return `${provider}:${model}`;
    }

    public validateModelId(modelId: string): boolean {
        const { providerName, modelName } = this.parseModelId(modelId);
        return this.settings.providers.some(p => p.name === providerName) 
            && this.settings.providers.some(p => p.models.some(m => m.name === modelName));
    }
}
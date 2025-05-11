import { App, Modal } from 'obsidian';
import { ModelConfig, ProviderConfig } from '../../types';
import { AddModelModal } from './AddModelModal';
import { AddProviderModal } from './AddProviderModal';
import { EditModelModal } from './EditModelModal';
import { DeleteModelModal } from './DeleteModelModal';
import { EditProviderModal } from './EditProviderModal';
import { DeleteProviderModal } from './DeleteProviderModal';
import { WarningModal } from './WarningModal';
import { SettingsEventHandlers } from '../handlers/SettingsEventHandlers';

export class SettingsModalsFactory {
    constructor(private app: App) { }

    createWarningModal(message: string): Modal {
        return new WarningModal(this.app, message);
    }

    createAddProviderModal(handlers: SettingsEventHandlers): AddProviderModal {
        return new AddProviderModal(this.app, handlers);
    }

    createEditProviderModal(provider: ProviderConfig, handlers: SettingsEventHandlers): EditProviderModal {
        return new EditProviderModal(this.app, provider, handlers);
    }

    createDeleteProviderModal(provider: ProviderConfig, handlers: SettingsEventHandlers): DeleteProviderModal {
        return new DeleteProviderModal(this.app, provider, handlers);
    }

    createAddModelModal(provider: ProviderConfig, handlers: SettingsEventHandlers): AddModelModal {
        return new AddModelModal(this.app, provider, handlers);
    }

    createEditModelModal(model: ModelConfig, handlers: SettingsEventHandlers): EditModelModal {
        return new EditModelModal(this.app, model, handlers);
    }

    createDeleteModelModal(model: ModelConfig, handlers: SettingsEventHandlers): DeleteModelModal {
        return new DeleteModelModal(this.app, model, handlers);
    }
} 
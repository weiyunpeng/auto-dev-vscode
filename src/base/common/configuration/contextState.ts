import { log } from 'console';
import { inject, injectable } from 'inversify';
import { commands, Disposable, type ExtensionContext, l10n, type Memento, type MessageOptions, window } from 'vscode';

import { ConfigurationService } from './configurationService';
import { IExtensionContext } from './context';

@injectable()
export class ContextStateService implements Disposable {
	private _disposables: Disposable[];
	private _globalState: Memento;

	constructor(
		@inject(ConfigurationService)
		private config: ConfigurationService,

		@inject(IExtensionContext)
		private extensionContext: ExtensionContext,
	) {
		this._globalState = this.extensionContext.globalState;
		this._disposables = [config.onDidChange(this.upgradeChatEnabledStatus, this)];

		this.setCodebaseIndexingStatus();
		this.upgradeChatEnabledStatus();
	}

	isChatEnabled() {
		return this.config.get<boolean>('chat.enable', true);
	}

	private upgradeChatEnabledStatus() {
		commands.executeCommand('setContext', 'chat.enabled', this.isChatEnabled());
	}

	setCodebaseIndexingStatus(indexing?: boolean) {
		commands.executeCommand('setContext', 'codebase.indexing', indexing === true);
	}

	async requestAccessUserCodebasePermission(options: MessageOptions = {}): Promise<boolean> {
		const globalState = this._globalState;

		if (globalState.get<boolean>('promissions.codebase.read') === true) {
			return true;
		}

		const value = await window.showInformationMessage(
			l10n.t(
				'The contents of the current codebase will be used to Autodev build the index stored on your computer, this information is only used by us to improve the quality of the code generated by the current codebase and will not be used for any other purpose.',
			),
			options,
			l10n.t('Authorize'),
		);

		if (value) {
			globalState.update('promissions.codebase.read', true);
			return true;
		}

		log('User denied access to codebase');

		return false;
	}

	dispose() {
		Disposable.from(...this._disposables).dispose();
		this._disposables.length = 0;
	}
}

import * as vscode from "vscode";
// for Dependency Injection with InversifyJS
import "reflect-metadata";
import Parser from "web-tree-sitter";

import { registerCommands } from "./commands/commands";
import { VSCodeAction } from "./editor/editor-api/VSCodeAction";
import { DiffManager } from "./editor/diff/DiffManager";
import { AutoDevExtension } from "./AutoDevExtension";
import { removeExtensionContext, setExtensionContext } from './context';
import { channel } from "./channel";
import {
	configRename,
	registerAutoDevProviders,
	registerCodeLensProviders,
	registerQuickFixProvider,
	registerWebViewProvider
} from "./action/ProviderRegister";
import { AutoDevStatusManager } from "./editor/editor-api/AutoDevStatusManager";
import { BuildToolObserver } from "./toolchain-context/buildtool/BuildToolObserver";
import { TreeSitterFileManager } from "./editor/cache/TreeSitterFileManager";
import { AutoDevWebviewViewProvider } from "./editor/webview/AutoDevWebviewViewProvider";
import { EmbeddingsProviderManager } from "./code-search/embedding/EmbeddingsProviderManager";

(globalThis as any).self = globalThis;

export async function activate(context: vscode.ExtensionContext) {
	setExtensionContext(context);

	const sidebar = new AutoDevWebviewViewProvider(context);
	const action = new VSCodeAction();
	const diffManager = new DiffManager();
	const extension = new AutoDevExtension(
		sidebar, action, diffManager, context,
	);

	Parser.init().then(async () => {
		registerCodeLensProviders(extension);
		registerAutoDevProviders(extension);
		registerQuickFixProvider(extension);
		registerCommands(extension);
		configRename(extension);

		// for embedding and file parser
		TreeSitterFileManager.getInstance().init();
		EmbeddingsProviderManager.init(context);

		// for watch toolset
		new BuildToolObserver().startWatch();
	});

	registerWebViewProvider(extension);

	AutoDevStatusManager.instance.initStatusBar();
	// check is Dev model
	if (process.env.NODE_ENV === "development") {
		channel.show();
	}
}

export function deactivate() {
	removeExtensionContext();
}

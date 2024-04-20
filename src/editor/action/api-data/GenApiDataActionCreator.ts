import vscode from "vscode";
import { injectable } from "inversify";

import { ActionCreator } from "../_base/ActionCreator";
import { ActionCreatorContext } from "../_base/ActionCreatorContext";
import { NamedElementBlock } from "../../document/NamedElementBlock";
import { CodeElementType } from "../../codemodel/CodeElementType";
import { StructurerProviderManager } from "../../../code-context/StructurerProviderManager";

@injectable()
export class GenApiDataActionCreator implements ActionCreator {
	isApplicable(creatorContext: ActionCreatorContext): boolean {
		return StructurerProviderManager.getInstance()?.getStructurer(creatorContext.lang) !== undefined;
	}

	static readonly providedCodeActionKinds = [
		vscode.CodeActionKind.RefactorRewrite,
	];

	build(context: ActionCreatorContext): Promise<vscode.CodeAction[]> {
		let apisDocActions: vscode.CodeAction[] = [];
		for (let nameBlock of context.namedElementBlocks) {
			switch (nameBlock.codeElementType) {
				case CodeElementType.Method:
					if (nameBlock.blockRange.contains(context.range)) {
						const title = `Gen API Data for \`${nameBlock.identifierRange.text}\` (AutoDev)`;
						let genApiDataAction = this.createGenApiDataAction(title, nameBlock, context.document);
						apisDocActions.push(genApiDataAction);
					}
					break;
				default:
					break;
			}
		}

		return Promise.resolve(apisDocActions);
	}

	private createGenApiDataAction(title: string, result: NamedElementBlock, document: vscode.TextDocument): vscode.CodeAction {
		const codeAction = new vscode.CodeAction(
			title,
			GenApiDataActionCreator.providedCodeActionKinds[0]
		);
		codeAction.isPreferred = false;
		codeAction.edit = new vscode.WorkspaceEdit();
		codeAction.command = {
			command: "autodev.genApiData",
			title: title,
			arguments: [document, result, codeAction.edit]
		};

		return codeAction;
	}
}
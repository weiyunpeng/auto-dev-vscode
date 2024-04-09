import * as vscode from "vscode";

import { registerCodeLens } from "./codelens";
import { registerCommands } from "./commands";
import { AutoDevWebviewViewProvider } from "./webview/AutoDevWebviewViewProvider";
import { IdeImpl } from "./action/ide-impl";
import { DocumentManager } from "./document/DocumentManager";
import { DiffManager } from "./diff/DiffManager";
import { AutoDevContext } from "./autodev-context";
import { TreeSitterFile } from "./semantic-treesitter/TreeSitterFile";

const channel = vscode.window.createOutputChannel("AUTO-DEV-VSCODE");
export function activate(context: vscode.ExtensionContext) {
  channel.show();

  const sidebar = new AutoDevWebviewViewProvider();
  const action = new IdeImpl();
  const documentManager = new DocumentManager();
  const diffManager = new DiffManager();
  const autoDevContext = new AutoDevContext(sidebar, action, documentManager, diffManager, context);

  registerCodeLens(autoDevContext);
  registerCommands(autoDevContext);

  vscode.window.onDidChangeActiveTextEditor(
    async (editor: vscode.TextEditor | undefined) => {
      if (!editor) {
        return;
      }

      const uri = editor.document.uri;
      //   registerActionProvider(context);
      // doc management
      // use tree sitter to parse ast and method to results and also cache for file by document
      // 1. autotest
      // 2. autodoc
      // 3. chatwithcode
      let language = editor.document.languageId;
      if (language === "java") {
        /** 
         * TODO: use LSP for parse java language
         * const lsp = new JavaSemanticLsp(autoDevContext);
         * const client = lsp?.getLanguageClient();
         * console.log(client);
        */ 
       // todo: init all grammars here?
        TreeSitterFile.tryBuild(editor.document.getText(), "java").then(file => {
          if (file instanceof TreeSitterFile) {
            const results = file.methodRanges();
            console.log(results);
          }
        });
      }
    }
  );

  // Sidebar commands
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "autodev.autodevGUIView",
      sidebar,
      {
        webviewOptions: { retainContextWhenHidden: true },
      }
    )
  );
}

export function deactivate() {}

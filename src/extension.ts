// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { Client } from "fauna";
import * as vscode from "vscode";

import { FQLConfigurationManager } from "./FQLConfigurationManager";
import { LanguageService } from "./LanguageServer";
import { RunQueryHandler } from "./RunQueryHandler";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel("FQL");

  const fqlConfigManager = new FQLConfigurationManager();

  const fqlClient = new Client({
    endpoint: new URL(fqlConfigManager.config().endpoint),
    secret: fqlConfigManager.config().dbSecret,
  });

  const runQueryHandler = new RunQueryHandler(fqlClient, outputChannel);

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand("fql.runQuery", () =>
    runQueryHandler.runQuery(),
  );
  context.subscriptions.push(disposable);

  // Create the language client and start the client.
  const languageService = new LanguageService(context, outputChannel);

  // subscribe the entities that want to know when configuration changes
  fqlConfigManager.subscribeToConfigurationChanges(runQueryHandler);
  fqlConfigManager.subscribeToConfigurationChanges(languageService);

  vscode.workspace.onDidChangeConfiguration((event) =>
    fqlConfigManager.onConfigurationChange(event),
  );

  // Start the client. This will also launch the server
  await languageService.start();
  // used to initialize the lsp service with the starting configuration
  await languageService.configChanged(fqlConfigManager.config());
}

// This method is called when your extension is deactivated
export function deactivate() {}

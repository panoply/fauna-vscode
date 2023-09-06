// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { Client } from "fauna";
import * as vscode from "vscode";

import { FQLConfigurationManager } from "./FQLConfigurationManager";
import { LanguageService } from "./LanguageServer";
import { RunQueryHandler } from "./RunQueryHandler";
import { TogglePlaygroundCommand } from "./TogglePlaygroundCommand";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel("FQL", "fql");

  const oldExtension = vscode.extensions.getExtension("fauna.fauna");
  if (oldExtension !== undefined) {
    const OLD_ERROR =
      "The Fauna extension cannot be used alongside the prior one. Please uninstall or disable the old extension.";
    const showError = () => {
      vscode.window
        .showErrorMessage(OLD_ERROR, "Disable old extension")
        .then((selection) => {
          if (selection === "Disable old extension") {
            vscode.commands.executeCommand(
              "workbench.extensions.search",
              "@id:fauna.fauna",
            );
          }
        });
    };

    showError();

    context.subscriptions.push(
      ...[
        vscode.commands.registerCommand("fauna.togglePlayground", showError),
        vscode.commands.registerCommand("fauna.runQuery", showError),
        vscode.commands.registerCommand("fauna.runQueryAsRole", showError),
        vscode.commands.registerCommand("fauna.runQueryAsDoc", showError),
        vscode.commands.registerCommand("fauna.runQueryWithSecret", showError),
      ],
    );

    return;
  }

  const fqlConfigManager = new FQLConfigurationManager();

  const fqlClient = new Client({
    endpoint: new URL(fqlConfigManager.config().endpoint),
    secret: fqlConfigManager.config().dbSecret,
  });

  // Create the language client and start the client.
  const languageService = new LanguageService(context, outputChannel);

  const runQueryHandler = new RunQueryHandler(
    fqlClient,
    languageService,
    outputChannel,
  );
  const togglePlaygroundCommand = new TogglePlaygroundCommand();

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposables = [
    vscode.commands.registerCommand("fauna.togglePlayground", () =>
      togglePlaygroundCommand.togglePlayground(),
    ),
    ...runQueryHandler.disposables(),
  ];
  context.subscriptions.push(...disposables);

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

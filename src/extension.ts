// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as path from "path";
import {
  Client,
  FaunaError,
  QueryCheckError,
  QueryRuntimeError,
  ServiceError,
  endpoints,
  fql,
} from "fauna";

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";

let client: LanguageClient;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel("FQL");

  const fqlClient = new Client({
    endpoint: endpoints.local,
    secret: "secret",
    // timeout_ms: 60_000
  });

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand("fql.runQuery", async () => {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    const { activeTextEditor } = vscode.window;

    if (!activeTextEditor || activeTextEditor.document.languageId !== "fql") {
      vscode.window.showWarningMessage(
        "You have to select a FQL document to run a FQL query."
      );
      return;
    }

    const text = activeTextEditor.document.getText();

    outputChannel.clear();
    outputChannel.show(true); // don't move the cursor off the text editor
    try {
      var response = await fqlClient.query(fql([text]), {
        format: "decorated",
        typecheck: true,
      });
      if (response.static_type !== undefined) {
        outputChannel.append("static type: " + response.static_type + "\n");
      }
      outputChannel.append(response.summary ?? "");
      outputChannel.append(response.data as any);
    } catch (e) {
      if (e instanceof ServiceError) {
        if (e.message !== undefined) {
          outputChannel.append(e.message);
          outputChannel.append("\n\n");
        }
        if (e.queryInfo?.summary !== undefined) {
          outputChannel.append(e.queryInfo?.summary);
        }
      } else {
        console.log(e);
        outputChannel.append((e as any).toString());
      }
    }
  });

  context.subscriptions.push(disposable);

  // The server is implemented in node
  const serverModule = context.asAbsolutePath(
    path.join("..", "fqlx-lsp", "build", "ts", "index.js")
  );
  // The debug options for the server
  // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
  const debugOptions = { execArgv: ["--nolazy", "--inspect=6009"] };

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  const serverOptions: ServerOptions = {
    run: {
      module: serverModule,
      transport: TransportKind.ipc,
    },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debugOptions,
    },
  };

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    // Register the server for plain text documents
    documentSelector: [
      {
        scheme: "file",
        language: "fql",
      },
    ],
    synchronize: {
      // Notify the server about file changes to '.clientrc files contained in the workspace
      fileEvents: vscode.workspace.createFileSystemWatcher("**/.clientrc"),
    },
  };

  // Create the language client and start the client.
  client = new LanguageClient("fql", "FQL", serverOptions, clientOptions);

  // Start the client. This will also launch the server
  client.start();
}

// This method is called when your extension is deactivated
export function deactivate() {}

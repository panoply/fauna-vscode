import * as path from "path";
import * as vscode from "vscode";
import { LanguageClient, LanguageClientOptions, RevealOutputChannelOn, ServerOptions, TransportKind } from "vscode-languageclient/node";
import { ConfigurationChangeSubscription, FQLConfiguration, FQLConfigurationManager } from "./FQLConfigurationManager";

export class LanguageClientManager implements ConfigurationChangeSubscription {
  client: LanguageClient;
  outputChannel: vscode.OutputChannel;

  constructor(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel) {
    this.outputChannel = outputChannel;

    // The server is implemented in node
    const serverModule = context.asAbsolutePath(
      path.join(
        "..",
        "core",
        "ext",
        "fql",
        "analyzer-lsp",
        "build",
        "node",
        "index.js"
      )
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
      outputChannel: vscode.window.createOutputChannel('FQL Language Server'),
      revealOutputChannelOn: RevealOutputChannelOn.Info
    };

    // Create the language client and start the client.
    this.client = new LanguageClient("fql", "FQL", serverOptions, clientOptions);
  }

  async configChanged(updatedConfiguration: FQLConfiguration) {
    const resp = await this.client.sendRequest('setSecret', { secret: updatedConfiguration.dbSecret }) as any;
    this.outputChannel.clear();
    if (resp.status === "error") {
      FQLConfigurationManager.config_error_dialogue(resp.message);
    }
  }
}
import * as path from "path";
import * as vscode from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  RevealOutputChannelOn,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";
import {
  ConfigurationChangeSubscription,
  FQLConfiguration,
  FQLConfigurationManager,
} from "./FQLConfigurationManager";

export class LanguageService implements ConfigurationChangeSubscription {
  static readonly serverDownloadUrl =
    "https://static-assets.fauna.com/fql-analyzer/index.js";
  client: LanguageClient;
  outputChannel: vscode.OutputChannel;
  context: vscode.ExtensionContext;
  serverLocation: vscode.Uri;

  constructor(
    context: vscode.ExtensionContext,
    outputChannel: vscode.OutputChannel,
  ) {
    this.outputChannel = outputChannel;
    this.context = context;
    this.serverLocation = vscode.Uri.joinPath(
      context.extensionUri,
      "out/fql-analyzer.js",
    );

    // The debug options for the server
    // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
    const debugOptions = { execArgv: ["--nolazy", "--inspect=6009"] };

    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    // The server is implemented in node
    // To use a locally built lsp/fql analyzer uncomment the below and
    // use that as the 'module' value in the debug server options
    // const serverModule = context.asAbsolutePath(
    //   path.join(
    //     "..",
    //     "core",
    //     "ext",
    //     "fql",
    //     "analyzer-lsp",
    //     "build",
    //     "node",
    //     "index.js",
    //   ),
    // );
    const serverOptions: ServerOptions = {
      run: {
        module: this.serverLocation.fsPath,
        transport: TransportKind.ipc,
      },
      debug: {
        // module: serverModule,
        module: this.serverLocation.fsPath,
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
        {
          scheme: "untitled",
          language: "fql",
        },
      ],
      synchronize: {
        // Notify the server about file changes to '.clientrc files contained in the workspace
        fileEvents: vscode.workspace.createFileSystemWatcher("**/.clientrc"),
      },
      outputChannel: vscode.window.createOutputChannel("FQL Language Server"),
      revealOutputChannelOn: RevealOutputChannelOn.Info,
    };

    // Create the language client and start the client.
    this.client = new LanguageClient(
      "fql",
      "FQL",
      serverOptions,
      clientOptions,
    );
  }

  async start() {
    await this.client.start();
  }

  async configChanged(updatedConfiguration: FQLConfiguration) {
    const resp = (await this.client.sendRequest("fauna/setConfig", {
      endpoint: updatedConfiguration.endpoint,
      secret: updatedConfiguration.dbSecret,
    })) as any;
    this.outputChannel.clear();
    if (resp.status === "error") {
      FQLConfigurationManager.config_error_dialogue(resp.message);
    }
  }

  async refresh(version: string) {
    const resp = (await this.client.sendRequest("fauna/refresh", {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      schema_version: version,
    })) as any;
    if (resp.status === "error") {
      vscode.window.showErrorMessage(
        `Failed to refresh environment: ${resp.message}`,
      );
    }
  }
}

import * as vscode from "vscode";

export class FQLConfigurationManager {
  private dbSecret: string;
  private endpoint: string = "http://localhost:8443";
  private outputChannel: vscode.OutputChannel;
  /** Used to send notifications when extension configuration is updated. */
  private subscriptions: ConfigurationChangeSubscription[] = [];

  constructor(outputChannel: vscode.OutputChannel) {
    this.outputChannel = outputChannel;
    const config = vscode.workspace.getConfiguration("fauna");
    const dbSecret = config.get<string>("dbSecret");
    if (dbSecret === undefined) {
        this.outputChannel.appendLine('You must configure a database secret for the Fauna extension');
    }
    this.dbSecret = dbSecret ?? "";
  }

  config(): FQLConfiguration {
    return {
      dbSecret: this.dbSecret,
      endpoint: this.endpoint
    };
  }

  subscribeToConfigurationChanges(subscriber: ConfigurationChangeSubscription): void {
    this.subscriptions.push(subscriber);
  }

  onConfigurationChange = async (event: vscode.ConfigurationChangeEvent) => {
    /// todo: do I want to do anything with scope here?
    if (event.affectsConfiguration('fauna.dbSecret')) {
      const newSecret = vscode.workspace.getConfiguration('fauna').get<string>('dbSecret');
      if (newSecret === undefined) {
        return;
      }
      this.dbSecret = newSecret;
      this.subscriptions.forEach(sub => sub.configChanged(
        this.config()
      ));
    }
  };
}

export interface FQLConfiguration {
  dbSecret: string
  endpoint: string
}

export interface ConfigurationChangeSubscription {
  configChanged(updatedConfiguration: FQLConfiguration): any;
}

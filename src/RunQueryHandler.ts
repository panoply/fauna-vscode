import { Client, ServiceError, fql } from "fauna";
import * as vscode from "vscode";
import {
  ConfigurationChangeSubscription,
  FQLConfiguration,
} from "./FQLConfigurationManager";

export class RunQueryHandler implements ConfigurationChangeSubscription {
  fqlClient: Client;
  outputChannel: vscode.OutputChannel;

  constructor(dbClient: Client, outputChannel: vscode.OutputChannel) {
    this.fqlClient = dbClient;
    this.outputChannel = outputChannel;
  }

  configChanged(updatedConfiguration: FQLConfiguration) {
    this.fqlClient = new Client({
      endpoint: new URL(updatedConfiguration.endpoint),
      secret: updatedConfiguration.dbSecret,
    });
  }

  async runQuery() {
    const { activeTextEditor } = vscode.window;

    if (!activeTextEditor || activeTextEditor.document.languageId !== "fql") {
      vscode.window.showWarningMessage(
        "You have to select a FQL document to run a FQL query.",
      );
      return;
    }

    const text = activeTextEditor.document.getText();

    this.outputChannel.clear();
    this.outputChannel.show(true); // don't move the cursor off the text editor
    try {
      var response = await this.fqlClient.query(fql([text]), {
        format: "decorated",
        typecheck: true,
      });
      if (response.static_type !== undefined) {
        this.outputChannel.appendLine("static type: " + response.static_type);
      }
      this.outputChannel.appendLine(response.summary ?? "");
      this.outputChannel.appendLine(response.data as any);
    } catch (e) {
      if (e instanceof ServiceError) {
        if (e.message !== undefined) {
          this.outputChannel.appendLine(e.message);
        }
        if (e.queryInfo?.summary !== undefined) {
          this.outputChannel.appendLine(e.queryInfo?.summary);
        }
      } else {
        console.log(e);
        this.outputChannel.appendLine((e as any).toString());
      }
    }
  }
}

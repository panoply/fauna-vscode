import * as vscode from "vscode";

export class FQLConfigurationManager {
  /** The driver will blow up if you try to create with an empty secret
   * but will fail with correct error if an invalid one is present
   */
  static readonly EMPTY_SECRET = "0";
  static readonly FAUNA_CONFIG_PATH = "fauna";
  static readonly SECRET_CONFIG_FIELD = "dbSecret";
  static readonly ENDPOINT_CONFIG_FIELD = "endpoint";
  static readonly SECRET_CONFIG_PATH = `${FQLConfigurationManager.FAUNA_CONFIG_PATH}.${FQLConfigurationManager.SECRET_CONFIG_FIELD}`;
  static readonly ENDPOINT_CONFIG_PATH = `${FQLConfigurationManager.FAUNA_CONFIG_PATH}.${FQLConfigurationManager.ENDPOINT_CONFIG_FIELD}`;

  static readonly config_error_dialogue = (message: string) => {
    vscode.window
      .showErrorMessage(message, "Configure Fauna")
      .then((selection) => {
        if (selection === "Configure Fauna") {
          vscode.commands.executeCommand(
            "workbench.action.openSettings",
            FQLConfigurationManager.FAUNA_CONFIG_PATH,
          );
        }
      });
  };

  private dbSecret: string;
  private endpoint: string = "https://db.fauna.com";
  /** Used to send notifications when extension configuration is updated. */
  private subscriptions: ConfigurationChangeSubscription[] = [];

  constructor() {
    const config = vscode.workspace.getConfiguration(
      FQLConfigurationManager.FAUNA_CONFIG_PATH,
    );
    const dbSecret = config.get<string>(
      FQLConfigurationManager.SECRET_CONFIG_FIELD,
    );
    if (dbSecret === undefined || dbSecret === "") {
      // we don't currently display an error here because after this is contructed
      // the config will be used to and the request will fail due to the invalid secret
      // which will then pop up an error dialogue for a user to resolve the issue.
      this.dbSecret = FQLConfigurationManager.EMPTY_SECRET;
    } else {
      this.dbSecret = dbSecret;
    }

    const endpoint = config.get<string>(
      FQLConfigurationManager.ENDPOINT_CONFIG_FIELD,
    );
    if (endpoint !== undefined && endpoint !== "") {
      this.endpoint = endpoint;
    }
  }

  config(): FQLConfiguration {
    return {
      dbSecret: this.dbSecret,
      endpoint: this.endpoint,
    };
  }

  subscribeToConfigurationChanges(
    subscriber: ConfigurationChangeSubscription,
  ): void {
    this.subscriptions.push(subscriber);
  }

  async onConfigurationChange(event: vscode.ConfigurationChangeEvent) {
    let configChanged = false;
    const faunaConfig = vscode.workspace.getConfiguration(
      FQLConfigurationManager.FAUNA_CONFIG_PATH,
    );
    if (
      event.affectsConfiguration(FQLConfigurationManager.SECRET_CONFIG_PATH)
    ) {
      const newSecret = faunaConfig.get<string>(
        FQLConfigurationManager.SECRET_CONFIG_FIELD,
      );
      if (newSecret === undefined || newSecret === "") {
        FQLConfigurationManager.config_error_dialogue(
          "You must configure a database secret for the Fauna extension.",
        );
      } else {
        this.dbSecret = newSecret;
        configChanged = true;
      }
    }
    if (
      event.affectsConfiguration(FQLConfigurationManager.ENDPOINT_CONFIG_PATH)
    ) {
      const newEndpoint = faunaConfig.get<string>(
        FQLConfigurationManager.ENDPOINT_CONFIG_FIELD,
      );
      if (newEndpoint && newEndpoint !== "") {
        this.endpoint = newEndpoint;
        configChanged = true;
      }
    }
    if (configChanged) {
      this.subscriptions.forEach((sub) => sub.configChanged(this.config()));
    }
  }
}

export interface FQLConfiguration {
  dbSecret: string;
  endpoint: string;
}

export interface ConfigurationChangeSubscription {
  configChanged(updatedConfiguration: FQLConfiguration): any;
}

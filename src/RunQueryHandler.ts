import { Client, ServiceError, fql } from "fauna";
import * as vscode from "vscode";
import {
  ConfigurationChangeSubscription,
  FQLConfiguration,
} from "./FQLConfigurationManager";
import { LanguageService } from "./LanguageServer";

export class RunQueryHandler implements ConfigurationChangeSubscription {
  fqlClient: Client;
  languageService: LanguageService;
  outputChannel: vscode.OutputChannel;

  constructor(
    dbClient: Client,
    languageService: LanguageService,
    outputChannel: vscode.OutputChannel,
  ) {
    this.fqlClient = dbClient;
    this.languageService = languageService;
    this.outputChannel = outputChannel;
  }

  configChanged(updatedConfiguration: FQLConfiguration) {
    this.fqlClient = new Client({
      endpoint: new URL(updatedConfiguration.endpoint),
      secret: updatedConfiguration.dbSecret,
    });
  }

  disposables() {
    const registerCommand = vscode.commands.registerCommand;
    return [
      registerCommand("fauna.runQuery", () => this.runQuery()),
      registerCommand("fauna.runQueryAsRole", () => this.runQueryAsRole()),
      registerCommand("fauna.runQueryAsDoc", () => this.runQueryAsDoc()),
      registerCommand("fauna.runQueryWithSecret", () =>
        this.runQueryWithSecret(),
      ),
    ];
  }

  async runQuery() {
    await this.execute();
  }

  async runQueryAsRole() {
    const roles = await this.fqlClient.query<{
      data: { name: string }[];
      after?: string;
    }>(fql`(Role.all() { name }).paginate(1000)`);

    if (roles.data.after !== undefined) {
      vscode.window.showWarningMessage(
        "More than 1000 roles were found, so this list is incomplete.",
      );
    }

    let allRoles: vscode.QuickPickItem[] = [
      {
        label: "Builtin roles",
        kind: vscode.QuickPickItemKind.Separator,
      },
      {
        label: "admin",
        description: "A builtin role with all permissions",
      },
      {
        label: "server",
        description:
          "A builtin role with permission to edit collections and functions, but not roles.",
      },
      {
        label: "User defined roles",
        kind: vscode.QuickPickItemKind.Separator,
      },
      ...roles.data.data.map((role) => ({
        label: role.name,
      })),
    ];

    const quickPick = vscode.window.createQuickPick();
    quickPick.items = allRoles;
    quickPick.onDidChangeSelection((selection) => {
      quickPick.hide();
      const role = selection[0].label;
      this.execute({ role });
    });
    quickPick.onDidHide(() => quickPick.dispose());
    quickPick.show();
  }

  async runQueryAsDoc() {
    const doc = await vscode.window.showInputBox({
      prompt: "Enter a document in the format 'collectionName/documentId'",
      placeHolder: "User/1234",
    });

    this.execute({ doc });
  }

  async runQueryWithSecret() {
    const secret = await vscode.window.showInputBox({
      prompt: "Enter a secret key",
    });

    this.execute({ secret });
  }

  async execute(scope?: { secret?: string; role?: string; doc?: string }) {
    const { activeTextEditor } = vscode.window;

    if (!activeTextEditor || activeTextEditor.document.languageId !== "fql") {
      vscode.window.showWarningMessage(
        "You have to select a FQL document to run a FQL query.",
      );
      return;
    }

    const query = activeTextEditor.document.getText();

    this.outputChannel.clear();
    this.outputChannel.show(true); // don't move the cursor off the text editor
    try {
      var response = await this.fqlClient.query(fql([query]), {
        format: "decorated",
        typecheck: true,
        secret: secretForScope(
          this.fqlClient.clientConfiguration.secret ?? "",
          scope ?? {},
        ),
      });

      if (response.static_type !== undefined) {
        this.outputChannel.appendLine("static type: " + response.static_type);
      }

      this.outputChannel.appendLine(response.summary ?? "");
      this.outputChannel.appendLine(response.data as any);

      if ((response as any).schema_version !== undefined) {
        await this.languageService.refresh((response as any).schema_version);
      }
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

const secretForScope = (
  root: string,
  {
    secret,
    role,
    doc,
  }: {
    secret?: string;
    role?: string;
    doc?: string;
  },
): string => {
  if (role === "admin" || role === "server") {
    return `${root}:${role}`;
  } else if (role !== undefined) {
    return `${root}:@role/${role}`;
  } else if (doc !== undefined) {
    return `${root}:@doc/${doc}`;
  } else if (secret !== undefined) {
    return secret;
  } else {
    return root;
  }
};

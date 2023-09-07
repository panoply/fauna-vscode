import * as path from "path";
import * as vscode from "vscode";

export class TogglePlaygroundCommand {
  playgroundFilePath: string;
  constructor(playgroundFilePath: string) {
    this.playgroundFilePath = playgroundFilePath;
  }

  static async create(
    context: vscode.ExtensionContext,
  ): Promise<TogglePlaygroundCommand> {
    if (context.storageUri === undefined) {
      // the above means we aren't in a project, so need to use the global storage uri
      return await TogglePlaygroundCommand.getCommandForStorageUri(
        context.globalStorageUri,
      );
    } else {
      return await TogglePlaygroundCommand.getCommandForStorageUri(
        context.storageUri,
      );
    }
  }

  static async getCommandForStorageUri(
    uri: vscode.Uri,
  ): Promise<TogglePlaygroundCommand> {
    const exists = await vscode.workspace.fs.stat(uri).then(
      () => true,
      () => false,
    );
    if (!exists) {
      await vscode.workspace.fs.createDirectory(uri);
    }
    return new TogglePlaygroundCommand(
      path.join(uri.fsPath, ".fauna", "FQLPlayground.fql"),
    );
  }

  async togglePlayground() {
    if (this.isShellInView()) {
      await this.closeShell();
    } else {
      // if the file doesn't yet exist need to preface with the untitled to get vscode to open it as a buffer.
      const playgroundURI = (await this.playgroundFileExists())
        ? vscode.Uri.parse(this.playgroundFilePath)
        : vscode.Uri.parse("untitled:" + this.playgroundFilePath);
      const playgroundDocument = await vscode.workspace.openTextDocument(
        playgroundURI,
      );
      await vscode.languages.setTextDocumentLanguage(playgroundDocument, "fql");
      await vscode.window.showTextDocument(
        playgroundDocument,
        vscode.ViewColumn.Beside,
      );
    }
  }

  private async playgroundFileExists(): Promise<boolean> {
    const playgroundURI = vscode.Uri.parse(this.playgroundFilePath);
    return await vscode.workspace.fs.stat(playgroundURI).then(
      () => true,
      () => false,
    );
  }

  private isShellInView(): boolean {
    for (const editor of vscode.window.visibleTextEditors) {
      if (this.documentIsPlayground(editor.document)) {
        return true;
      }
    }
    return false;
  }

  private async closeShell() {
    for (const editor of vscode.window.visibleTextEditors) {
      if (this.documentIsPlayground(editor.document)) {
        await editor.document.save();
        const tabs: vscode.Tab[] = vscode.window.tabGroups.all
          .map((tg) => tg.tabs)
          .flat();
        const index = tabs.findIndex(
          (tab) =>
            tab.input instanceof vscode.TabInputText &&
            tab.input.uri.path === this.playgroundFilePath,
        );
        if (index !== -1) {
          await vscode.window.tabGroups.close(tabs[index]);
        }
        break;
      }
    }
  }

  private documentIsPlayground(document: vscode.TextDocument): boolean {
    return document.uri.path === this.playgroundFilePath;
  }
}

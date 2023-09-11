// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
// import * as vscode from "vscode";
import * as assert from "assert";
import * as vscode from "vscode";
import { Client } from "../../client";
import { FQLConfigurationManager } from "../../FQLConfigurationManager";
import * as testHelper from "./helper";

// import * as myExtension from '../../extension';

suite("Extension Test Suite", () => {
  let fqlClient: Client;
  let secret: string;
  setup(async () => {
    [fqlClient, secret] = await testHelper.clientWithFreshDB("VSCodeTest");
    await fqlClient.query(`Collection.create({ name: "Cats" })`);
    await setConfigSecret(secret);
    if (fqlClient.endpoint) {
      await setConfigEndpoint(fqlClient.endpoint.href);
    }
  });

  teardown(async () => {
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
  });

  test("should test completion items", async () => {
    await testHelper.activateFQLExtension();

    const documentText = "C";
    const doc = await vscode.workspace.openTextDocument({
      language: "fql",
      content: documentText,
    });
    const position = new vscode.Position(0, 1);

    const completionList = (await vscode.commands.executeCommand(
      "vscode.executeCompletionItemProvider",
      doc.uri,
      position,
    )) as vscode.CompletionList;

    assert.ok(completionList.items.length > 0);
    assert.ok(containsCollectionCompletionItem(completionList, "Collection"));
    assert.ok(containsCollectionCompletionItem(completionList, "Cats"));
  });

  test("should run queries", async () => {
    await testHelper.activateFQLExtension();

    const documentText = "2 + 3";
    const doc = await vscode.workspace.openTextDocument({
      language: "fql",
      content: documentText,
    });
    await vscode.window.showTextDocument(doc);
    const position = new vscode.Position(0, 1);

    await vscode.commands.executeCommand(
      "fauna-vscode.runQuery",
      doc.uri,
      position,
    );

    const output = getOutputChannelText();

    assert.ok(output.includes("static type: Number"));
    assert.ok(output.includes("5"));
  });

  test("should open a fql scratch buffer and provide intellisense and query execution", async () => {
    await testHelper.activateFQLExtension();

    await vscode.commands.executeCommand("fauna-vscode.togglePlayground");

    const editor = vscode.window.activeTextEditor;
    if (editor === undefined) {
      assert.fail(
        "Expected fauna-vscode.togglePlayground command to set an active text editor",
      );
    }
    await editor.edit((editBuilder) => {
      const position = new vscode.Position(0, 1);
      editBuilder.insert(position, "C");
    });

    const completionList = (await vscode.commands.executeCommand(
      "vscode.executeCompletionItemProvider",
      editor.document.uri,
      new vscode.Position(0, 1),
    )) as vscode.CompletionList;

    assert.ok(completionList.items.length > 0);
    assert.ok(containsCollectionCompletionItem(completionList, "Collection"));
    assert.ok(containsCollectionCompletionItem(completionList, "Cats"));
  });

  async function setConfigSecret(secret: string): Promise<void> {
    const config = vscode.workspace.getConfiguration(
      FQLConfigurationManager.FAUNA_CONFIG_PATH,
    );
    await config.update(
      FQLConfigurationManager.SECRET_CONFIG_FIELD,
      secret,
      vscode.ConfigurationTarget.Global,
    );
  }

  async function setConfigEndpoint(endpoint: string): Promise<void> {
    const config = vscode.workspace.getConfiguration(
      FQLConfigurationManager.FAUNA_CONFIG_PATH,
    );
    await config.update(
      FQLConfigurationManager.ENDPOINT_CONFIG_FIELD,
      endpoint,
      vscode.ConfigurationTarget.Global,
    );
  }

  function containsCollectionCompletionItem(
    completionItems: vscode.CompletionList,
    collectionName: string,
  ) {
    return completionItems.items.some((item) => {
      return (
        item.kind === vscode.CompletionItemKind.Module &&
        (item.label as vscode.CompletionItemLabel).label === collectionName &&
        item.detail === `${collectionName}Collection`
      );
    });
  }

  function getOutputChannelText(): string {
    if (vscode.window.visibleTextEditors.length === 2) {
      return vscode.window.visibleTextEditors[1].document.getText();
    } else {
      throw new Error("no output channel open");
    }
  }
});

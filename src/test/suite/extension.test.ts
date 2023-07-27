// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
// import * as vscode from "vscode";
import * as assert from "assert";
import { Client, fql } from "fauna";
import * as vscode from "vscode";
import { FQLConfigurationManager } from "../../FQLConfigurationManager";
import * as testHelper from "./helper";

// import * as myExtension from '../../extension';

suite("Extension Test Suite", () => {
  let fqlClient: Client;
  let secret: string;
  setup(async () => {
    [fqlClient, secret] = await testHelper.clientWithFreshDB("VSCodeTest");
    await setConfigSecret(secret);
    if (fqlClient.clientConfiguration.endpoint) {
      await setConfigEndpoint(fqlClient.clientConfiguration.endpoint.href);
    }
  });
  test("should test completion items", async () => {
    await fqlClient.query(fql`Collection.create({ name: "Cats" })`);

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
});

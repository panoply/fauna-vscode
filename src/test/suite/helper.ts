import * as vscode from "vscode";
import { Client } from "../../client";

export async function activateFQLExtension() {
  const ext = vscode.extensions.getExtension("fauna.fauna-vscode");
  try {
    await ext?.activate();
    // allow time for extension to activate
    await sleep(2000);
  } catch (e) {
    console.log("FAILED TO START EXT");
    console.log(e);
    throw e;
  }
}

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getClient(): Client {
  if (process.env.VSCODE_DB_SECRET) {
    return getDB(process.env.VSCODE_DB_SECRET);
  } else {
    return getLocalClient();
  }
}

export function getLocalClient(): Client {
  return new Client({
    endpoint: new URL("http://localhost:8443"),
    secret: "secret",
  });
}

export function getDB(secret: string): Client {
  return new Client({
    endpoint: new URL("https://db.fauna.com"),
    secret: secret,
  });
}

/**
 * Returns the fqlx client to use as well as the secret to use to configure the
 * extension with.
 */
export const clientWithFreshDB = async (
  name: string,
): Promise<[Client, string]> => {
  const parentClient = getClient();
  const secretQ = await parentClient.query<string>(`
    if (Database.byName('${name}').exists()) {
      Key.where(.database == '${name}').forEach(.delete())
      Database.byName('${name}')!.delete()
    }
    Database.create({ name: '${name}' })
    Key.create({ role: "admin", database: '${name}' }).secret
  `);

  return [
    new Client({
      endpoint: parentClient.endpoint,
      secret: secretQ.data,
    }),
    secretQ.data,
  ];
};

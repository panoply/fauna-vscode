import fetch from "cross-fetch";

export type Success<T> = {
  data: T;
  summary: string;
  static_type: string;
  txn_ts: number;
  stats: {
    [key: string]: string;
  };
};

export class FaunaError extends Error {
  message: string;
  summary?: string;
  status: number;

  constructor(message: string, status: number, summary?: string) {
    super(message);
    this.message = message;
    this.status = status;
    this.summary = summary;
  }
}

export class Client {
  endpoint: URL;
  secret: string;
  last_txn_time: number;

  constructor({ endpoint, secret }: { endpoint: URL; secret: string }) {
    this.endpoint = endpoint;
    this.secret = secret;
    this.last_txn_time = 0;
  }

  async query<T>(
    query: string,
    {
      secret,
      typecheck,
      format,
    }: { secret?: string; typecheck?: boolean; format?: string } = {},
  ): Promise<Success<T>> {
    const url = new URL(this.endpoint);
    url.pathname = "/query/1";
    const res = await fetch(url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${secret ?? this.secret}`,
        "x-fauna-source": "vscode-v10",
        "x-last-txn-ts": this.last_txn_time.toString(),
        ...(typecheck !== undefined && { "x-typecheck": typecheck.toString() }),
        ...(format !== undefined && { "x-format": format }),
      },
      body: JSON.stringify({ query }),
    });

    const json = await res.json();

    if (res.status === 200 || res.status === 201) {
      const res = json as Success<T>;
      this.last_txn_time = res.txn_ts;
      return res;
    } else {
      throw new FaunaError(
        json.error?.message ?? "Unknown error",
        res.status,
        json.summary,
      );
    }
  }
}

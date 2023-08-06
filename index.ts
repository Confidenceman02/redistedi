import { RedisClientType, createClient } from "redis";

type Optional<A> =
  | {
      ok: true;
      value: A;
    }
  | { ok: false };

export class RediStedi {
  #connection?: RedisClientType;

  async connect(url: string, password: string): Promise<void> {
    if (this.#connection && this.#connection.isOpen && this.#connection.isReady)
      return;

    const client: RedisClientType = createClient({
      url: url,
      password: password,
      name: "REDISTEDI_CLIENT",
      socket: { connectTimeout: 10000 },
    });

    try {
      await client.connect();
      this.#connection = client;
      return;
    } catch (err: any) {
      throw new RediStediError(err);
    }
  }

  client(): Optional<RedisClientType> {
    if (this.#connection) return { ok: true, value: this.#connection };
    return { ok: false };
  }
}

export class RediStediError extends Error {
  constructor(err: any) {
    super(err);
    this.name = this.constructor.name;
  }
}

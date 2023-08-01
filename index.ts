import { RedisClientType, createClient } from "redis";

export class RediStedi {
  #connection?: RedisClientType;

  constructor() {}

  async connect(url: string, password: string): Promise<void> {
    if (this.#connection && this.#connection.isOpen && this.#connection.isReady)
      return;

    const client: RedisClientType = createClient({
      url: url,
      password: password,
      name: "REDISTEDI",
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
}

class RediStediError extends Error {
  constructor(err: any) {
    super(err);
    this.name = this.constructor.name;
  }
}

import { RedisClientType } from "redis";

type Optional<A> =
  | {
      ok: true;
      value: A;
    }
  | { ok: false };

export class RediStedi {
  #connection?: RedisClientType;

  async connection(conn: RedisClientType): Promise<void> {
    if (this.#connection && this.#connection.isOpen && this.#connection.isReady)
      return;

    if (!conn.isOpen) {
      try {
        await conn.connect();
      } catch (err: any) {
        throw new RediStediError(err);
      }
    }

    this.#connection = conn;
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

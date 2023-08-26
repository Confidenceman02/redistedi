import { RedisClientType } from "redis";
import { Schema } from "@redistedi/schema";

type Optional<A> =
  | {
      ok: true;
      value: A;
    }
  | { ok: false };

type EntityShapes = {
  [k: string]: Schema<any>;
};

abstract class Base<T> {
  constructor() {}

  abstract model<K extends keyof T>(key: K): T[K];
}

export class RediStedi<T extends EntityShapes> extends Base<T> {
  #connection?: RedisClientType;
  schemas: T;

  constructor(schemas: T) {
    super();
    this.schemas = schemas;
  }

  model<K extends keyof T>(name: K): T[K] {
    return this.schemas[name];
  }

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

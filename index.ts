import { RedisClientType } from "redis";
import { Schema, ExtractObjectShape } from "@redistedi/schema";
import { modelBuilder, Model } from "@redistedi/model";

type Optional<A> =
  | {
      ok: true;
      value: A;
    }
  | { ok: false };

type EntityShapes<T> = {
  [k: string]: T extends Schema<infer S> ? Schema<S> : never;
};

abstract class Base<T> {
  constructor() {}

  abstract model<K extends keyof T>(key: K): Model<ExtractObjectShape<T[K]>>;
}

export class RediStedi<T extends EntityShapes<Schema<any>>> extends Base<T> {
  #connection: RedisClientType | undefined = undefined;
  schemas: T;

  constructor(schemas: T) {
    super();
    this.schemas = schemas;
  }

  model<K extends keyof T>(name: K): Model<ExtractObjectShape<T[K]>> {
    return modelBuilder(this.schemas[name], this.#connection);
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

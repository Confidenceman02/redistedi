import { RedisClientType } from "redis";
import { Schema, Infer, ExtractObjectShape } from "@redistedi/schema";
import { Model } from "@redistedi/model";

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

  abstract model<K extends keyof T>(
    key: K,
  ): (arg: Infer<T[K]>) => Model<ExtractObjectShape<T[K]>>;
}

export class RediStedi<T extends EntityShapes<Schema<any>>> extends Base<T> {
  #connection?: RedisClientType;
  schemas: T;

  constructor(schemas: T) {
    super();
    this.schemas = schemas;
  }

  test<K extends keyof T>(name: K): T[K] {
    return this.schemas[name];
  }
  model<K extends keyof T>(
    name: K,
  ): (arg: Infer<T[K]>) => Model<ExtractObjectShape<T[K]>> {
    const currentSchema = this.schemas[name];
    function someFunction(args: Infer<T[K]>): Model<ExtractObjectShape<T[K]>> {
      return new Model(currentSchema);
    }
    return someFunction;
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

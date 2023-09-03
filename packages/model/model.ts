import { Schema, ObjectShape, Infer } from "@redistedi/schema";
import { RedisClientType } from "redis";
import { Exit } from "@effect/io/Exit";
import * as Effect from "@effect/io/Effect";

const schemaKey = Symbol("schemaKey");
const connectionKey = Symbol("connectionKey");
const objectKeys = Symbol("objectKeys");
export const ModelID = Symbol("ModelId");

export type StediModel<T extends ObjectShape> = Infer<Schema<T>> & {
  toObject(): StediObject<T>;
  toJSON(): string;
  [ModelID]: string;
  [schemaKey]: Schema<T>;
  [connectionKey]: RedisClientType | undefined;
  [objectKeys]: [keyof Infer<Schema<T>>];
};

type IRediModel<T extends ObjectShape> = Infer<Schema<T>> & {
  toObject(): ModelObject<T>;
  toJSON(): string;
  save(): Promise<Exit<ModelError, StediModel<T>>>;
  [schemaKey]: Schema<T>;
  [connectionKey]: RedisClientType | undefined;
  [objectKeys]: [keyof Infer<Schema<T>>];
};

export type RediModel<T extends ObjectShape> = {
  new (arg: Infer<Schema<T>>): IRediModel<T>;
};
export type StediModelBuilder<T extends ObjectShape> = {
  new (): StediModel<T>;
};

export type ModelObject<T extends ObjectShape> = Infer<Schema<T>>;
export type StediObject<T extends ObjectShape> = Infer<Schema<T>> & {
  [ModelID]: string;
};

export function stediBuilder<T extends ObjectShape>(
  obj: Infer<Schema<T>>,
  id: string,
  schema: Schema<T>,
  connection: RedisClientType | undefined,
): StediModelBuilder<T> {
  function Stedi(this: StediModel<T>) {
    this[ModelID] = id;
    this[schemaKey] = schema;
    this[connectionKey] = connection;
    this[objectKeys] = Object.keys(obj) as [keyof Infer<Schema<T>>];
    for (let key in obj) {
      const k = key as keyof Infer<Schema<T>>;
      this[k] = obj[key] as any;
    }
  }

  return Stedi as any as StediModelBuilder<T>;
}

export function rediBuilder<T extends ObjectShape>(
  schema: Schema<T>,
  connection: RedisClientType | undefined,
): RediModel<T> {
  function Redi(this: IRediModel<T>, arg: Infer<Schema<T>>) {
    this[schemaKey] = schema;
    this[connectionKey] = connection;
    this[objectKeys] = Object.keys(arg) as [keyof Infer<Schema<T>>];
    for (let key in arg) {
      const k = key as keyof Infer<Schema<T>>;
      this[k] = arg[key] as any;
    }

    this.toObject = function () {
      let obj = this[objectKeys].reduce(
        (acc, key) => {
          acc[key] = this[key];
          return acc;
        },
        {} as Infer<Schema<T>>,
      );
      return obj;
    };

    this.toJSON = function () {
      return JSON.stringify(this.toObject());
    };

    this.save = function () {
      const fakeID = "someID";
      const stediInstance = stediBuilder(
        this.toObject(),
        fakeID,
        this[schemaKey],
        this[connectionKey],
      );

      const eff = Effect.tryPromise<StediModel<T>, ModelError>({
        try: () => new Promise((resolve) => resolve(new stediInstance())),
        catch: (unknown) => new ModelError(unknown),
      });

      return Effect.runPromiseExit(eff);
    };
  }

  return Redi as any as RediModel<T>;
}

export class ModelError extends Error {
  constructor(err: any) {
    super(err);
    this.name = this.constructor.name;
  }
}

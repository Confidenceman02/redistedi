import { Schema, ObjectShape, Infer } from "@redistedi/schema";
import { RedisClientType } from "redis";

const schemaKey = Symbol("schemaKey");
const connectionKey = Symbol("connectionKey");
const objectKeys = Symbol("objectKeys");
const redisModelKey = Symbol("redisModelIdKey");
export const ModelId = Symbol("ModelId");

type IModel<T extends ObjectShape> = Infer<Schema<T>> & {
  toObject(): Infer<Schema<T>>;
  toJSON(): string;
  save(): RedisModel<T>;
  [schemaKey]: Schema<T>;
  [connectionKey]: RedisClientType | undefined;
  [objectKeys]: [keyof Infer<Schema<T>>];
};

export type RedisModel<T extends ObjectShape> = Infer<Schema<T>> & {
  toObject(): { [ModelId]: string } & Infer<Schema<T>>;
  [redisModelKey]: string;
};

export type Model<T extends ObjectShape> = {
  new (arg: Infer<Schema<T>>): IModel<T>;
};

export function modelBuilder<T extends ObjectShape>(
  schema: Schema<T>,
  connection: RedisClientType | undefined,
): Model<T> {
  function Model(this: IModel<T>, arg: Infer<Schema<T>>) {
    this[schemaKey] = schema;
    this[connectionKey] = connection;
    this[objectKeys] = Object.keys(arg) as [keyof Infer<Schema<T>>];
    for (let key in arg) {
      const k = key as keyof Infer<Schema<T>>;
      this[k] = arg[key] as any;
    }

    this.toObject = function () {
      const obj = this[objectKeys].reduce(
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
  }

  return Model as any as Model<T>;
}

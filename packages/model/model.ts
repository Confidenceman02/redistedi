import { Schema, ObjectShape, Infer } from "@redistedi/schema";
import { RedisClientType } from "redis";

const schemaKey = Symbol("schemaKey");
const connectionKey = Symbol("connectionKey");
const objectKeys = Symbol("objectKeys");
export const ModelId = Symbol("ModelId");

type IModel<T extends ObjectShape> = Infer<Schema<T>> & {
  toObject(): ModelObject<T>;
  toJSON(): string;
  save(): void;
  [schemaKey]: Schema<T>;
  [connectionKey]: RedisClientType | undefined;
  [objectKeys]: [keyof Infer<Schema<T>>];
  [ModelId]: string | undefined;
};

export type Model<T extends ObjectShape> = {
  new (arg: Infer<Schema<T>>): IModel<T>;
};

export type ModelObject<T extends ObjectShape> = Infer<Schema<T>> & {
  _modelId: string | undefined;
};

export function modelBuilder<T extends ObjectShape>(
  schema: Schema<T>,
  connection: RedisClientType | undefined
): Model<T> {
  function Model(this: IModel<T>, arg: Infer<Schema<T>>) {
    this[schemaKey] = schema;
    this[connectionKey] = connection;
    this[objectKeys] = Object.keys(arg) as [keyof Infer<Schema<T>>];
    this[ModelId] = undefined;
    for (let key in arg) {
      const k = key as keyof Infer<Schema<T>>;
      this[k] = arg[key] as any;
    }

    this.toObject = function () {
      let obj = this[objectKeys].reduce((acc, key) => {
        acc[key] = this[key];
        return acc;
      }, {} as Infer<Schema<T>>);
      const newObj = Object.assign(obj, {
        _modelId: this[ModelId],
      });
      return newObj;
    };

    this.toJSON = function () {
      return JSON.stringify(
        Object.assign(this.toObject(), {
          _modelId: this[ModelId] ? this[ModelId] : null,
        })
      );
    };
  }

  return Model as any as Model<T>;
}
